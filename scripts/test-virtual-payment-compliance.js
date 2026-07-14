const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const membershipJs = read('miniprogram/pages/membership/index.js');
const productionServer = read('backend/src/mysql-production/server.js');
const paymentService = read('backend/src/services/payment.js');
const paymentRoutes = read('backend/src/routes/payment.js');

assert.ok(membershipJs.includes('wx.requestVirtualPayment'), 'membership purchase should use wx.requestVirtualPayment');
assert.ok(membershipJs.includes("url: '/payment/virtual-order'"), 'membership purchase should request virtual payment order');
assert.ok(!membershipJs.includes('wx.requestPayment'), 'membership purchase should avoid ordinary wx.requestPayment');
assert.ok(!membershipJs.includes("url: '/payment/unified-order'"), 'membership purchase should avoid ordinary unified order');
assert.ok(!membershipJs.includes('微信官方支付方式'), 'membership copy should avoid ambiguous ordinary payment wording');

['miniprogram/config/env.js', 'miniprogram/config/payment.js', 'miniprogram/app.js', 'miniprogram/utils/app-config.js'].forEach(function(relativePath) {
  assert.ok(!read(relativePath).includes('enableWechatPay'), relativePath + ' should avoid ordinary WeChat Pay config naming');
  assert.ok(!read(relativePath).includes('ENABLE_WECHAT_PAY'), relativePath + ' should avoid ordinary WeChat Pay export naming');
});

assert.ok(productionServer.includes('function isVirtualMembershipPlan'), 'production backend should identify virtual membership plans');
assert.ok(productionServer.includes("code: 'VIRTUAL_PAYMENT_REQUIRED'"), 'production backend should expose virtual payment required error');
assert.ok(productionServer.includes('res.status(403).json(virtualPaymentRequiredError())'), 'production backend should reject ordinary payment for virtual plans');
assert.ok(productionServer.includes('xpay_goods_deliver_notify'), 'production backend should handle virtual payment delivery notification');
assert.ok(productionServer.includes('function resolveVirtualPayEnv'), 'production backend should resolve virtual payment environment explicitly');
assert.ok(productionServer.includes("process.env.NODE_ENV === 'production' ? 0 : 1"), 'production backend should default virtual payment to live env for iOS review');
assert.ok(!productionServer.includes('process.env.WECHAT_VIRTUAL_PAY_ENV || process.env.XPAY_ENV || 1'), 'production backend should avoid sandbox as implicit virtual payment default');

assert.ok(paymentService.includes('function isVirtualMembershipPlan'), 'local payment service should identify virtual membership plans');
assert.ok(paymentService.includes("code: VIRTUAL_PAYMENT_REQUIRED"), 'local payment service should return virtual payment required error');
assert.ok(paymentRoutes.includes('VIRTUAL_PAYMENT_REQUIRED'), 'payment routes should map virtual payment required error');
assert.ok(paymentRoutes.includes('res.status(403).json(result)'), 'payment routes should return 403 for ordinary payment attempts on virtual goods');

console.log('Virtual payment compliance tests passed.');
