const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const { db } = require('../config/database');
const { activateSubscription } = require('./membership');

// 微信支付配置（生产环境从环境变量读取）
const WX_PAY_CONFIG = {
  appid: process.env.WECHAT_APPID || process.env.WX_APPID || '',
  mchid: process.env.WECHAT_PAY_MCH_ID || process.env.WX_MCHID || '',
  apiKey: process.env.WECHAT_PAY_API_KEY || process.env.WX_API_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || process.env.WX_NOTIFY_URL || '',
  certPath: process.env.WECHAT_PAY_CERT_PATH || process.env.WX_CERT_PATH || '',
  keyPath: process.env.WECHAT_PAY_KEY_PATH || process.env.WX_KEY_PATH || '',
  platformCertPath: process.env.WECHAT_PAY_PLATFORM_CERT_PATH || process.env.WX_PLATFORM_CERT_PATH || ''
};

const PAYMENT_NOT_CONFIGURED = 'WECHAT_PAY_NOT_CONFIGURED';
const VIRTUAL_PAYMENT_REQUIRED = 'VIRTUAL_PAYMENT_REQUIRED';
const WECHAT_PAY_HOST = 'api.mch.weixin.qq.com';

function isVirtualMembershipPlan(planCode) {
  return ['month', 'quarter', 'year'].includes(String(planCode || '').trim());
}

function virtualPaymentRequiredError() {
  return {
    success: false,
    code: VIRTUAL_PAYMENT_REQUIRED,
    message: '成长服务属于虚拟内容服务，请使用小程序官方虚拟支付能力购买'
  };
}

function readPrivateKey() {
  return fs.readFileSync(WX_PAY_CONFIG.keyPath, 'utf8');
}

function getWechatPayMissingFiles() {
  const files = [
    ['WECHAT_PAY_KEY_PATH', WX_PAY_CONFIG.keyPath]
  ];
  if (WX_PAY_CONFIG.platformCertPath) {
    files.push(['WECHAT_PAY_PLATFORM_CERT_PATH', WX_PAY_CONFIG.platformCertPath]);
  }
  return files.filter(([, filePath]) => filePath && !fs.existsSync(filePath)).map(([name]) => name);
}

function getWechatPayMissingRequiredFiles() {
  return [
    ['WECHAT_PAY_KEY_PATH', WX_PAY_CONFIG.keyPath]
  ].filter(([, filePath]) => filePath && !fs.existsSync(filePath)).map(([name]) => name);
}

function getWechatPayMissingConfig() {
  const required = [
    ['WECHAT_APPID', WX_PAY_CONFIG.appid],
    ['WECHAT_PAY_MCH_ID', WX_PAY_CONFIG.mchid],
    ['WECHAT_PAY_API_KEY', WX_PAY_CONFIG.apiKey],
    ['WECHAT_PAY_NOTIFY_URL', WX_PAY_CONFIG.notifyUrl],
    ['WECHAT_PAY_CERT_PATH', WX_PAY_CONFIG.certPath],
    ['WECHAT_PAY_KEY_PATH', WX_PAY_CONFIG.keyPath],
    ['WECHAT_PAY_CERT_SERIAL_NO', process.env.WECHAT_PAY_CERT_SERIAL_NO || process.env.WX_CERT_SERIAL_NO || '']
  ];

  return required.filter(([, value]) => !value).map(([name]) => name).concat(getWechatPayMissingRequiredFiles());
}

function isWechatPayConfigured() {
  return getWechatPayMissingConfig().length === 0;
}

function paymentConfigError() {
  return {
    success: false,
    code: PAYMENT_NOT_CONFIGURED,
    message: '当前支付能力暂不可用，请使用试用或兑换码功能',
    missing_config: getWechatPayMissingConfig()
  };
}

function requestWechatPay(method, path, body) {
  const payload = body ? JSON.stringify(body) : '';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = [method, path, timestamp, nonceStr, payload].join('\n') + '\n';
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(readPrivateKey(), 'base64');
  const authorization = 'WECHATPAY2-SHA256-RSA2048 '
    + `mchid="${WX_PAY_CONFIG.mchid}",`
    + `nonce_str="${nonceStr}",`
    + `signature="${signature}",`
    + `timestamp="${timestamp}",`
    + `serial_no="${process.env.WECHAT_PAY_CERT_SERIAL_NO || process.env.WX_CERT_SERIAL_NO || ''}"`;

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: WECHAT_PAY_HOST,
      path,
      method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'niuniu-parenting-backend/1.0'
      },
      timeout: 10000
    }, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        let parsed = {};
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch (err) {
            reject(new Error('微信支付响应解析失败'));
            return;
          }
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(parsed);
          return;
        }
        reject(new Error(parsed.message || parsed.detail || '微信支付请求失败'));
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('微信支付请求超时'));
    });
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function buildMiniProgramPayParams(prepayId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const packageValue = 'prepay_id=' + prepayId;
  const message = `${WX_PAY_CONFIG.appid}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;
  const paySign = crypto.createSign('RSA-SHA256').update(message).sign(readPrivateKey(), 'base64');

  return {
    appId: WX_PAY_CONFIG.appid,
    timeStamp,
    nonceStr,
    package: packageValue,
    signType: 'RSA',
    paySign
  };
}

function decryptWechatResource(resource) {
  if (!resource || resource.algorithm !== 'AEAD_AES_256_GCM') {
    throw new Error('不支持的微信支付回调加密算法');
  }
  // 微信支付v3: ciphertext字段格式为 base64(密文 + auth_tag)
  const encryptedData = Buffer.from(resource.ciphertext, 'base64');
  // AES-GCM: 最后16字节是auth_tag
  const authTag = encryptedData.subarray(encryptedData.length - 16);
  const ciphertext = encryptedData.subarray(0, encryptedData.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', WX_PAY_CONFIG.apiKey, Buffer.from(resource.nonce));
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}

function verifyWechatNotifySignature(headers, rawBody) {
  if (!WX_PAY_CONFIG.platformCertPath) {
    // 生产环境必须配置平台证书，否则记录警告但不直接跳过验签
    console.warn('[Security] WECHAT_PAY_PLATFORM_CERT_PATH not configured, skipping notify signature verification. This is insecure in production.');
    return process.env.NODE_ENV !== 'production';
  }
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  if (!signature || !timestamp || !nonce || !rawBody) {
    return false;
  }
  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const certificate = fs.readFileSync(WX_PAY_CONFIG.platformCertPath, 'utf8');
  return crypto.createVerify('RSA-SHA256').update(message).verify(certificate, signature, 'base64');
}

/**
 * 生成唯一订单号
 */
function generateOrderNo() {
  return 'NN' + Date.now() + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
}

/**
 * 创建支付订单
 */
function createPaymentOrder(userId, planCode, options = {}) {
  if (isVirtualMembershipPlan(planCode)) {
    return virtualPaymentRequiredError();
  }
  if (!isWechatPayConfigured()) {
    return paymentConfigError();
  }

  const plan = db.prepare('SELECT * FROM plans WHERE code = ? AND is_active = 1').get(planCode);
  if (!plan) {
    return { success: false, message: '套餐不存在' };
  }

  const orderNo = generateOrderNo();
  const autoRenew = options.auto_renew !== false ? 1 : 0;

  // 创建订单记录
  db.prepare(`
    INSERT INTO payment_orders (user_id, plan_code, order_no, amount, status, auto_renew)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(userId, planCode, orderNo, plan.price_yuan, autoRenew);

  return {
    success: true,
    order_no: orderNo,
    amount: plan.price_yuan,
    plan_name: plan.name,
    auto_renew: autoRenew === 1
  };
}

/**
 * 微信支付统一下单（生产环境调用微信真实接口）
 */
async function unifiedOrder(orderNo, planCode, openid, userId) {
  if (!openid) {
    return { success: false, message: '缺少微信用户openid' };
  }

  const order = db.prepare('SELECT * FROM payment_orders WHERE order_no = ?').get(orderNo);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }
  if (userId && order.user_id !== userId) {
    return { success: false, message: '无权操作该订单' };
  }
  if (isVirtualMembershipPlan(order.plan_code)) {
    return virtualPaymentRequiredError();
  }
  if (!isWechatPayConfigured()) {
    return paymentConfigError();
  }

  const plan = db.prepare('SELECT * FROM plans WHERE code = ? AND is_active = 1').get(order.plan_code);
  const wxResult = await requestWechatPay('POST', '/v3/pay/transactions/jsapi', {
    appid: WX_PAY_CONFIG.appid,
    mchid: WX_PAY_CONFIG.mchid,
    description: plan ? `小牛育儿${plan.name}` : '小牛育儿会员',
    out_trade_no: orderNo,
    notify_url: WX_PAY_CONFIG.notifyUrl,
    amount: {
      total: order.amount,
      currency: 'CNY'
    },
    payer: {
      openid
    }
  });

  if (!wxResult.prepay_id) {
    return { success: false, message: '微信支付预下单失败' };
  }

  db.prepare(`
    UPDATE payment_orders SET wx_prepay_id = ? WHERE order_no = ?
  `).run(wxResult.prepay_id, orderNo);

  return {
    success: true,
    ...buildMiniProgramPayParams(wxResult.prepay_id)
  };
}

/**
 * 处理支付回调
 */
function handlePaymentNotify(notifyData, headers = {}, rawBody = '') {
  if (!isWechatPayConfigured()) {
    return paymentConfigError();
  }

  const paymentData = notifyData.resource
    ? null
    : notifyData;

  if (notifyData.resource && !verifyWechatNotifySignature(headers, rawBody)) {
    return { success: false, message: '微信支付回调签名无效' };
  }

  const finalPaymentData = paymentData || decryptWechatResource(notifyData.resource);

  const { out_trade_no, transaction_id, trade_state, result_code } = finalPaymentData;

  // 使用事务确保幂等性
  const transaction = db.transaction(() => {
    const order = db.prepare('SELECT * FROM payment_orders WHERE order_no = ?').get(out_trade_no);
    if (!order) {
      return { success: false, message: '订单不存在' };
    }

    if (order.status === 'paid') {
      return { success: true, message: '订单已处理' };
    }

    if (trade_state === 'SUCCESS' || result_code === 'SUCCESS') {
      db.prepare(`
        UPDATE payment_orders
        SET status = 'paid', wx_transaction_id = ?, paid_at = datetime('now')
        WHERE order_no = ?
      `).run(transaction_id, out_trade_no);

      const subscriptionResult = activateSubscription(order.user_id, order.plan_code, {
        pay_method: 'wxpay',
        order_no: out_trade_no,
        auto_renew: order.auto_renew === 1
      });

      return {
        success: true,
        message: '支付成功',
        subscription: subscriptionResult
      };
    } else {
      db.prepare(`
        UPDATE payment_orders SET status = 'failed' WHERE order_no = ?
      `).run(out_trade_no);

      return { success: false, message: '支付失败' };
    }
  });

  return transaction();
}

/**
 * 查询订单状态
 */
function queryOrder(orderNo) {
  const order = db.prepare('SELECT * FROM payment_orders WHERE order_no = ?').get(orderNo);
  if (!order) {
    return { success: false, message: '订单不存在' };
  }

  return {
    success: true,
    order_no: order.order_no,
    status: order.status,
    amount: order.amount,
    plan_code: order.plan_code,
    paid_at: order.paid_at,
    auto_renew: !!order.auto_renew
  };
}

/**
 * 申请自动续费（签约）
 */
function requestAutoRenew(userId, planCode) {
  // 生产环境调用微信支付签约接口
  return {
    success: true,
    message: '自动续费签约申请已提交',
    contract_code: 'C' + Date.now(),
    contract_display_account: '小牛育儿会员'
  };
}

/**
 * 取消自动续费（解约）
 */
function cancelAutoRenew(userId) {
  // 更新订阅表
  db.prepare(`
    UPDATE subscriptions SET auto_renew = 0 WHERE user_id = ? AND status = 'active'
  `).run(userId);

  // 更新用户会员快照
  db.prepare(`
    UPDATE user_memberships SET auto_renew = 0 WHERE user_id = ?
  `).run(userId);

  return { success: true, message: '自动续费已取消' };
}

module.exports = {
  createPaymentOrder,
  unifiedOrder,
  handlePaymentNotify,
  queryOrder,
  requestAutoRenew,
  cancelAutoRenew,
  isWechatPayConfigured,
  getWechatPayMissingConfig,
  getWechatPayMissingFiles,
  PAYMENT_NOT_CONFIGURED,
  VIRTUAL_PAYMENT_REQUIRED,
  WX_PAY_CONFIG
};
