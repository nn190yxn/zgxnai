const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../backend/src/mysql-production/server.js'), 'utf8');

// Evaluate only the selected production functions, without bootstrapping services.
function loadFunctions(names, dependencies = {}) {
  const functions = names.map((name) => {
    const match = source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
    assert.ok(match, `Missing production function: ${name}`);
    return match[0];
  });
  return vm.runInNewContext(`${functions.join('\n')}\n({ ${names.join(', ')} })`, dependencies);
}

function response() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function rawBodyVerifier() {
  let options;
  const start = source.indexOf('app.use(express.json({');
  const end = source.indexOf('\napp.use(', start + 1);
  assert.ok(start >= 0 && end > start);
  vm.runInNewContext(source.slice(start, end), {
    API_PREFIXES: ['/api/v1', '/custom/v2'],
    express: { json(value) { options = value; } },
    app: { use() {} }
  });
  return options.verify;
}

for (const prefix of ['/api/v1', '/custom/v2']) {
  for (const suffix of ['', '?source=wechat', '/', '/?source=wechat']) {
    test(`rawBody preserves original bytes for ${prefix}/payment/notify${suffix}`, () => {
      const originalUrl = `${prefix}/payment/notify${suffix}`;
      const req = { originalUrl, path: originalUrl.split('?')[0] };
      const body = Buffer.from('{ "description": "test",\n "amount": 1 }\n');
      rawBodyVerifier()(req, {}, body);
      assert.equal(req.rawBody, body.toString('utf8'));
    });
  }
}

test('rawBody follows default case-insensitive callback routing', () => {
  const req = { originalUrl: '/API/V1/Payment/Notify/', path: '/API/V1/Payment/Notify/' };
  rawBodyVerifier()(req, {}, Buffer.from('{}'));
  assert.equal(req.rawBody, '{}');
});

test('rawBody collection stays limited to registered callback paths', () => {
  for (const pathname of ['/api/v1/payment/create', '/api/v1/payment/notify-extra', '/other/payment/notify']) {
    const req = { originalUrl: pathname, path: pathname };
    rawBodyVerifier()(req, {}, Buffer.from('{}'));
    assert.equal(req.rawBody, undefined);
  }
});

test('actual virtual order creation uses distinct IDs with a fixed clock and consistent payload', async () => {
  const inserted = [];
  let randomSequence = 0;
  const api = loadFunctions(['buildVirtualPayOutTradeNo', 'virtualOrderHandler'], {
    Date: { now: () => 1788825600000 },
    crypto: {
      randomBytes(size) {
        assert.equal(size, 8);
        const bytes = Buffer.alloc(size);
        bytes.writeBigUInt64BE(BigInt(++randomSequence));
        return bytes;
      }
    },
    isVirtualPayConfigured: () => true,
    virtualPayConfig: { offerId: 'fixture-offer', env: 1, mode: 'short_series_goods' },
    getVirtualPayProductId: () => 'fixture-month',
    getVirtualPayAppKey: () => 'fixture-key',
    yuanToFen: Number,
    hmacSha256Hex: () => 'fixture-signature',
    pool: {
      async execute(sql, values) {
        if (sql.startsWith('SELECT * FROM plans')) return [[{ price_yuan: 100, name: 'fixture' }]];
        if (sql.startsWith('SELECT session_key')) return [[{ session_key: 'fixture-session' }]];
        assert.ok(sql.startsWith('INSERT INTO payment_orders'));
        inserted.push(values[2]);
        return [{}];
      }
    }
  });
  for (let index = 0; index < 32; index += 1) {
    const res = response();
    await api.virtualOrderHandler({ body: { plan_code: 'month', auto_renew: false }, user: { userId: 1 } }, res);
    const data = res.body.data;
    const payload = JSON.parse(data.signData);
    assert.match(data.order_no, /^VP\d{13}[a-f0-9]{16}$/);
    assert.ok(data.order_no.length <= 32);
    assert.equal(payload.outTradeNo, data.order_no);
    assert.equal(payload.attach, data.order_no);
    assert.equal(inserted[index], data.order_no);
  }
  assert.equal(new Set(inserted).size, 32);
});

function deliveryFixture(failActivation = false) {
  const order = { order_no: 'VP-fixture', status: 'pending', user_id: 1, plan_code: 'month', auto_renew: 0 };
  const calls = [];
  let activations = 0;
  let previousStatus;
  const connection = {
    async beginTransaction() { previousStatus = order.status; calls.push('begin'); },
    async execute(sql, values) {
      if (sql.startsWith('SELECT')) {
        assert.ok(sql.endsWith('FOR UPDATE'));
        calls.push('lock');
        return [[{ ...order }]];
      }
      assert.ok(sql.startsWith('UPDATE payment_orders'));
      calls.push('update');
      order.status = values[0];
      return [{}];
    },
    async commit() { calls.push('commit'); },
    async rollback() { order.status = previousStatus; calls.push('rollback'); },
    release() { calls.push('release'); }
  };
  const api = loadFunctions(['handleVirtualPayGoodsDeliver', 'handleVirtualPayRefundNotify'], {
    getVirtualPayOrderNo: (payload) => payload.OutTradeNo,
    getVirtualPayRefundOrderNo: (payload) => payload.OutTradeNo,
    getVirtualPayTransactionId: () => 'fixture-transaction',
    assertVirtualPayDeliveryMatchesOrder() {},
    async activateSubscription() {
      calls.push('activate');
      if (failActivation) throw new Error('fixture activation failure');
      activations += 1;
    },
    pool: {
      async getConnection() { return connection; },
      async execute(sql, values) {
        assert.ok(sql.startsWith('UPDATE payment_orders SET status'));
        order.status = values[0];
        return [{}];
      }
    }
  });
  return { api, order, calls, activations: () => activations, payload: { OutTradeNo: order.order_no } };
}

test('duplicate delivery retains one activation and existing transaction lifecycle', async () => {
  const fixture = deliveryFixture();
  await fixture.api.handleVirtualPayGoodsDeliver(fixture.payload);
  await fixture.api.handleVirtualPayGoodsDeliver(fixture.payload);
  assert.equal(fixture.order.status, 'paid');
  assert.equal(fixture.activations(), 1);
  assert.deepEqual(fixture.calls, ['begin', 'lock', 'update', 'activate', 'commit', 'release', 'begin', 'lock', 'commit', 'release']);
});

test('delivery retry after refund preserves refunded state and activation count', async () => {
  const fixture = deliveryFixture();
  await fixture.api.handleVirtualPayGoodsDeliver(fixture.payload);
  await fixture.api.handleVirtualPayRefundNotify(fixture.payload);
  await fixture.api.handleVirtualPayGoodsDeliver(fixture.payload);
  assert.equal(fixture.order.status, 'refunded');
  assert.equal(fixture.activations(), 1);
});

test('activation failure rolls back and releases the existing transaction', async () => {
  const fixture = deliveryFixture(true);
  await assert.rejects(fixture.api.handleVirtualPayGoodsDeliver(fixture.payload), /fixture activation failure/);
  assert.equal(fixture.order.status, 'pending');
  assert.deepEqual(fixture.calls, ['begin', 'lock', 'update', 'activate', 'rollback', 'release']);
});

test('ordinary callback forwards captured rawBody and acknowledges an already paid order', async () => {
  const calls = [];
  const rawBody = '{ "resource": {} }\n';
  const headers = { 'wechatpay-signature': 'fixture' };
  const api = loadFunctions(['paymentNotifyHandler'], {
    isWechatPayConfigured: () => true,
    async verifyWechatNotifySignature(actualHeaders, actualBody) {
      assert.equal(actualHeaders, headers);
      assert.equal(actualBody, rawBody);
      return true;
    },
    decryptWechatResource: () => ({ out_trade_no: 'NN-fixture', transaction_id: 'fixture', trade_state: 'SUCCESS' }),
    pool: {
      async getConnection() {
        return {
          async beginTransaction() { calls.push('begin'); },
          async execute(sql) {
            assert.ok(sql.startsWith('SELECT') && sql.endsWith('FOR UPDATE'));
            return [[{ status: 'paid' }]];
          },
          async commit() { calls.push('commit'); },
          release() { calls.push('release'); }
        };
      }
    }
  });
  const res = response();
  await api.paymentNotifyHandler({ body: { resource: {} }, headers, rawBody }, res);
  assert.equal(res.body.code, 'SUCCESS');
  assert.deepEqual(calls, ['begin', 'commit', 'release']);
});
