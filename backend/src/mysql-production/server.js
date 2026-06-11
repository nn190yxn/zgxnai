const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const API_PREFIXES = Array.from(new Set([API_PREFIX, '/api/v1']));
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET;
const WECHAT_PAY_HOST = 'api.mch.weixin.qq.com';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const wxPayConfig = {
  appid: process.env.WECHAT_APPID || process.env.WX_APPID || '',
  mchid: process.env.WECHAT_PAY_MCH_ID || process.env.WX_MCHID || '',
  apiKey: process.env.WECHAT_PAY_API_KEY || process.env.WX_API_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || process.env.WX_NOTIFY_URL || '',
  keyPath: process.env.WECHAT_PAY_KEY_PATH || process.env.WX_KEY_PATH || '',
  certSerialNo: process.env.WECHAT_PAY_CERT_SERIAL_NO || process.env.WX_CERT_SERIAL_NO || '',
  platformCertPath: process.env.WECHAT_PAY_PLATFORM_CERT_PATH || process.env.WX_PLATFORM_CERT_PATH || ''
};

app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === `${API_PREFIX}/payment/notify`) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

app.get('/health', healthHandler);
for (const prefix of API_PREFIXES) {
  app.get(`${prefix}/health`, healthHandler);
  app.post(`${prefix}/auth/login`, asyncHandler(loginHandler));
  app.post(`${prefix}/auth/refresh`, asyncHandler(refreshHandler));
  app.get(`${prefix}/auth/me`, authenticateToken, asyncHandler(meHandler));
  app.get(`${prefix}/membership/info`, authenticateToken, asyncHandler(membershipInfoHandler));
  app.post(`${prefix}/membership/trial/activate`, authenticateToken, asyncHandler(trialHandler));
  app.post(`${prefix}/membership/promo/redeem`, authenticateToken, asyncHandler(promoHandler));
  app.get(`${prefix}/referral/stats`, authenticateToken, asyncHandler(referralStatsHandler));
  app.get(`${prefix}/referral/code`, authenticateToken, asyncHandler(referralCodeHandler));
  app.post(`${prefix}/payment/create`, authenticateToken, asyncHandler(createPaymentOrderHandler));
  app.post(`${prefix}/payment/unified-order`, authenticateToken, asyncHandler(unifiedOrderHandler));
  app.get(`${prefix}/payment/query/:order_no`, authenticateToken, asyncHandler(queryPaymentHandler));
  app.post(`${prefix}/payment/notify`, asyncHandler(paymentNotifyHandler));
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('[niuniu-backend]', err.message);
  res.status(500).json({ success: false, message: err.message || '服务异常' });
});

app.listen(PORT, HOST, () => {
  console.log(`[niuniu-backend] listening on http://${HOST}:${PORT}`);
});

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function healthHandler(req, res) {
  res.json({ status: 'ok', service: 'niuniu-backend', timestamp: new Date().toISOString() });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET || 'dev-niuniu-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ success: false, message: '未提供访问令牌' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET || 'dev-niuniu-secret');
    next();
  } catch (err) {
    res.status(403).json({ success: false, message: '访问令牌无效或已过期' });
  }
}

async function loginHandler(req, res) {
  const code = req.body && req.body.code;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, message: '缺少微信登录code' });
    return;
  }
  const session = await getWechatSession(code);
  const { user, isNew: isNewUser } = await findOrCreateUser(session.openid, req.body.userInfo || {});

  // 处理邀请码（新用户注册时）
  if (isNewUser && req.body.invite_code) {
    await handleReferralSignup(user.id, req.body.invite_code);
  }

  const payload = { userId: user.id, openid: user.openid, username: user.nickname || '微信用户' };
  res.json({
    success: true,
    data: {
      user,
      token: signToken(payload),
      refresh_token: signToken(Object.assign({}, payload, { tokenType: 'refresh' }))
    }
  });
}

async function refreshHandler(req, res) {
  const refreshToken = req.body && req.body.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: '缺少刷新令牌' });
    return;
  }
  const decoded = jwt.verify(refreshToken, JWT_SECRET || 'dev-niuniu-secret');
  const payload = { userId: decoded.userId, openid: decoded.openid, username: decoded.username || '微信用户' };
  res.json({ success: true, data: { token: signToken(payload) } });
}

async function meHandler(req, res) {
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?', [req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '用户不存在' });
    return;
  }
  res.json({ success: true, data: rows[0] });
}

async function getWechatSession(code) {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WECHAT_APPID and WECHAT_APP_SECRET must be configured');
    }
    return { openid: `dev_${code.replace(/[^a-zA-Z0-9_-]/g, '_')}` };
  }
  const url = 'https://api.weixin.qq.com/sns/jscode2session'
    + `?appid=${encodeURIComponent(appid)}`
    + `&secret=${encodeURIComponent(secret)}`
    + `&js_code=${encodeURIComponent(code)}`
    + '&grant_type=authorization_code';
  return requestJson(url);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.errcode) {
            reject(new Error(data.errmsg || 'wechat request failed'));
            return;
          }
          resolve(data);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function findOrCreateUser(openid, profile) {
  const [existing] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE openid = ?', [openid]);
  if (existing.length) {
    return { user: existing[0], isNew: false };
  }
  const [result] = await pool.execute(
    'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)',
    [openid, profile.nickName || profile.nickname || '微信用户', profile.avatarUrl || profile.avatar_url || '']
  );
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?', [result.insertId]);
  return { user: rows[0], isNew: true };
}

async function handleReferralSignup(inviteeId, inviteCode) {
  try {
    // 根据邀请码查找邀请人
    const [inviters] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [inviteCode.replace(/^NN/, '')]
    );
    if (!inviters.length) return;
    const inviterId = inviters[0].id;

    // 不能邀请自己
    if (inviterId === inviteeId) return;

    // 检查是否已被邀请过
    const [existing] = await pool.execute(
      'SELECT id FROM referrals WHERE invitee_id = ?',
      [inviteeId]
    );
    if (existing.length) return;

    // 记录邀请关系
    await pool.execute(
      'INSERT INTO referrals (inviter_id, invitee_id, reward_days, status) VALUES (?, ?, 7, \'completed\')',
      [inviterId, inviteeId]
    );

    // 给邀请人增加7天会员
    const [memberships] = await pool.execute(
      'SELECT current_end_date FROM user_memberships WHERE user_id = ?',
      [inviterId]
    );

    const now = new Date();
    let endDate;
    if (memberships.length && memberships[0].current_end_date) {
      endDate = new Date(memberships[0].current_end_date);
      if (endDate < now) endDate = now;
    } else {
      endDate = now;
    }
    endDate.setDate(endDate.getDate() + 7);

    await pool.execute(
      `INSERT INTO user_memberships (user_id, current_end_date, membership_type, status, auto_renew)
       VALUES (?, ?, 'referral', 'active', 1)
       ON DUPLICATE KEY UPDATE current_end_date = ?, membership_type = 'referral', status = 'active'`,
      [inviterId, endDate, endDate]
    );
  } catch (err) {
    console.error('[Referral] Handle signup error:', err.message);
  }
}

async function membershipInfoHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  const [plans] = await pool.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order');
  const now = Date.now();
  const endTime = membership.current_end_date ? new Date(membership.current_end_date).getTime() : 0;
  const isActive = membership.status === 'active' && endTime > now;
  res.json({
    success: true,
    data: {
      status: isActive ? 'active' : 'free',
      membership_type: isActive ? membership.membership_type : 'free',
      is_active: isActive,
      days_left: isActive ? Math.ceil((endTime - now) / 86400000) : 0,
      is_trial_used: !!membership.is_trial_used,
      plans
    }
  });
}

async function getMembership(userId) {
  const [rows] = await pool.execute('SELECT * FROM user_memberships WHERE user_id = ?', [userId]);
  return rows[0] || { status: 'free', membership_type: 'free', is_trial_used: 0, auto_renew: 1 };
}

async function trialHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  if (membership.is_trial_used) {
    res.json({ success: true, data: { activated: false, reason: 'trial_already_used' } });
    return;
  }
  const endDate = new Date(Date.now() + 15 * 86400000);
  await pool.execute('INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method) VALUES (?, ?, ?, NOW(), ?, ?)', [req.user.userId, 'trial', 'active', endDate, 'trial']);
  await pool.execute(
    `INSERT INTO user_memberships (user_id, is_trial_used, trial_end_date, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, 1, ?, 'trial', ?, 'trial', 'active', 1)
     ON DUPLICATE KEY UPDATE is_trial_used = 1, trial_end_date = VALUES(trial_end_date), current_plan = 'trial', current_end_date = VALUES(current_end_date), membership_type = 'trial', status = 'active', auto_renew = 1`,
    [req.user.userId, endDate, endDate]
  );
  res.json({ success: true, data: { activated: true, trial_end_date: endDate.toISOString(), days: 15 } });
}

async function promoHandler(req, res) {
  res.json({ success: false, message: '兑换码暂未开放' });
}

async function referralStatsHandler(req, res) {
  res.json({ success: true, data: { total_invites: 0, monthly_reward_days: 0, monthly_max_days: 60, remaining_days: 60 } });
}

async function referralCodeHandler(req, res) {
  res.json({ success: true, data: { invite_code: `NN${String(req.user.userId).padStart(6, '0')}` } });
}

function paymentConfigError() {
  return { success: false, code: 'WECHAT_PAY_NOT_CONFIGURED', message: '微信支付配置中，请使用试用或兑换码功能', missing_config: getMissingPayConfig() };
}

function getMissingPayConfig() {
  return [
    ['WECHAT_APPID', wxPayConfig.appid],
    ['WECHAT_PAY_MCH_ID', wxPayConfig.mchid],
    ['WECHAT_PAY_API_KEY', wxPayConfig.apiKey],
    ['WECHAT_PAY_NOTIFY_URL', wxPayConfig.notifyUrl],
    ['WECHAT_PAY_KEY_PATH', wxPayConfig.keyPath],
    ['WECHAT_PAY_CERT_SERIAL_NO', wxPayConfig.certSerialNo]
  ].filter(([, value]) => !value).map(([key]) => key);
}

function isWechatPayConfigured() {
  return getMissingPayConfig().length === 0 && fs.existsSync(wxPayConfig.keyPath);
}

async function createPaymentOrderHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json(paymentConfigError());
    return;
  }
  const planCode = req.body && req.body.plan_code;
  if (!planCode) {
    res.status(400).json({ success: false, message: '请选择套餐' });
    return;
  }
  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    res.status(400).json({ success: false, message: '套餐不存在' });
    return;
  }
  const plan = plans[0];
  const orderNo = `NN${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const autoRenew = req.body.auto_renew !== false ? 1 : 0;
  await pool.execute(
    'INSERT INTO payment_orders (user_id, plan_code, order_no, amount, status, auto_renew) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.userId, planCode, orderNo, plan.price_yuan, 'pending', autoRenew]
  );
  res.json({ success: true, data: { success: true, order_no: orderNo, amount: plan.price_yuan, plan_name: plan.name, auto_renew: autoRenew === 1 } });
}

async function unifiedOrderHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json(paymentConfigError());
    return;
  }
  const orderNo = req.body && req.body.order_no;
  if (!orderNo) {
    res.status(400).json({ success: false, message: '订单号不能为空' });
    return;
  }
  const [orders] = await pool.execute('SELECT * FROM payment_orders WHERE order_no = ? AND user_id = ?', [orderNo, req.user.userId]);
  if (!orders.length) {
    res.status(404).json({ success: false, message: '订单不存在' });
    return;
  }
  const order = orders[0];
  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ?', [order.plan_code]);
  const wxResult = await requestWechatPay('POST', '/v3/pay/transactions/jsapi', {
    appid: wxPayConfig.appid,
    mchid: wxPayConfig.mchid,
    description: plans[0] ? `小牛育儿${plans[0].name}` : '小牛育儿会员',
    out_trade_no: order.order_no,
    notify_url: wxPayConfig.notifyUrl,
    amount: { total: order.amount, currency: 'CNY' },
    payer: { openid: req.user.openid }
  });
  await pool.execute('UPDATE payment_orders SET wx_prepay_id = ? WHERE order_no = ?', [wxResult.prepay_id, order.order_no]);
  res.json({ success: true, data: Object.assign({ success: true }, buildMiniProgramPayParams(wxResult.prepay_id)) });
}

async function queryPaymentHandler(req, res) {
  const [rows] = await pool.execute('SELECT order_no, status, amount, plan_code, paid_at, auto_renew FROM payment_orders WHERE order_no = ? AND user_id = ?', [req.params.order_no, req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '订单不存在' });
    return;
  }
  res.json({ success: true, data: Object.assign({ success: true }, rows[0]) });
}

async function paymentNotifyHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json({ code: 'FAIL', message: '微信支付未配置' });
    return;
  }
  if (req.body.resource && !verifyWechatNotifySignature(req.headers, req.rawBody || '')) {
    res.status(400).json({ code: 'FAIL', message: '微信支付回调签名无效' });
    return;
  }
  const paymentData = req.body.resource ? decryptWechatResource(req.body.resource) : req.body;
  const orderNo = paymentData.out_trade_no;
  const transactionId = paymentData.transaction_id;
  if (paymentData.trade_state !== 'SUCCESS' && paymentData.result_code !== 'SUCCESS') {
    await pool.execute('UPDATE payment_orders SET status = ? WHERE order_no = ? AND status != ?', ['failed', orderNo, 'paid']);
    res.status(400).json({ code: 'FAIL', message: '支付失败' });
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute('SELECT * FROM payment_orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!orders.length) {
      await connection.rollback();
      res.status(404).json({ code: 'FAIL', message: '订单不存在' });
      return;
    }
    const order = orders[0];
    if (order.status !== 'paid') {
      await connection.execute('UPDATE payment_orders SET status = ?, wx_transaction_id = ?, paid_at = NOW() WHERE order_no = ?', ['paid', transactionId, orderNo]);
      await activateSubscription(connection, order.user_id, order.plan_code, orderNo, order.auto_renew === 1);
    }
    await connection.commit();
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function activateSubscription(connection, userId, planCode, orderNo, autoRenew) {
  const [plans] = await connection.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    throw new Error('套餐不存在');
  }
  const endDate = new Date(Date.now() + plans[0].duration_days * 86400000);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, auto_renew, pay_method, order_no) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
    [userId, planCode, 'active', endDate, autoRenew ? 1 : 0, 'wxpay', orderNo]
  );
  await connection.execute(
    `INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, ?, ?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE current_plan = VALUES(current_plan), current_end_date = VALUES(current_end_date), membership_type = VALUES(membership_type), status = 'active', auto_renew = VALUES(auto_renew)`,
    [userId, planCode, endDate, planCode, autoRenew ? 1 : 0]
  );
}

function requestWechatPay(method, apiPath, body) {
  const payload = body ? JSON.stringify(body) : '';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = [method, apiPath, timestamp, nonceStr, payload].join('\n') + '\n';
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(fs.readFileSync(wxPayConfig.keyPath, 'utf8'), 'base64');
  const authorization = 'WECHATPAY2-SHA256-RSA2048 '
    + `mchid="${wxPayConfig.mchid}",`
    + `nonce_str="${nonceStr}",`
    + `signature="${signature}",`
    + `timestamp="${timestamp}",`
    + `serial_no="${wxPayConfig.certSerialNo}"`;
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: WECHAT_PAY_HOST,
      path: apiPath,
      method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'niuniu-parenting-backend/1.0'
      },
      timeout: 10000
    }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let parsed = {};
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch (err) {
            reject(new Error('微信支付响应解析失败'));
            return;
          }
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
          return;
        }
        reject(new Error(parsed.message || parsed.detail || '微信支付请求失败'));
      });
    });
    request.on('timeout', () => request.destroy(new Error('微信支付请求超时')));
    request.on('error', reject);
    if (payload) {
      request.write(payload);
    }
    request.end();
  });
}

function buildMiniProgramPayParams(prepayId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const packageValue = `prepay_id=${prepayId}`;
  const message = `${wxPayConfig.appid}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;
  const paySign = crypto.createSign('RSA-SHA256').update(message).sign(fs.readFileSync(wxPayConfig.keyPath, 'utf8'), 'base64');
  return { appId: wxPayConfig.appid, timeStamp, nonceStr, package: packageValue, signType: 'RSA', paySign };
}

function decryptWechatResource(resource) {
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', wxPayConfig.apiKey, resource.nonce);
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  return JSON.parse(Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8'));
}

function verifyWechatNotifySignature(headers, rawBody) {
  if (!wxPayConfig.platformCertPath) {
    return true;
  }
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  if (!signature || !timestamp || !nonce || !rawBody) {
    return false;
  }
  const certificate = fs.readFileSync(wxPayConfig.platformCertPath, 'utf8');
  return crypto.createVerify('RSA-SHA256').update(`${timestamp}\n${nonce}\n${rawBody}\n`).verify(certificate, signature, 'base64');
}
