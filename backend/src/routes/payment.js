// 支付路由
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createPaymentOrder,
  unifiedOrder,
  handlePaymentNotify,
  queryOrder,
  cancelAutoRenew,
  PAYMENT_NOT_CONFIGURED
} = require('../services/payment');

function sendPaymentResult(res, result) {
  if (result && result.code === PAYMENT_NOT_CONFIGURED) {
    return res.status(503).json(result);
  }
  return res.json(result);
}

/**
 * POST /api/v1/payment/create
 * 创建支付订单
 */
router.post('/create', authenticateToken, (req, res) => {
  const { plan_code, auto_renew } = req.body;
  const userId = req.user.userId;

  if (!plan_code) {
    return res.status(400).json({ success: false, message: '请选择套餐' });
  }

  const result = createPaymentOrder(userId, plan_code, { auto_renew });
  sendPaymentResult(res, result);
});

/**
 * POST /api/v1/payment/unified-order
 * 微信支付统一下单
 */
router.post('/unified-order', authenticateToken, async (req, res) => {
  const { order_no, openid } = req.body;

  if (!order_no) {
    return res.status(400).json({ success: false, message: '订单号不能为空' });
  }

  try {
    const result = await unifiedOrder(order_no, null, openid || req.user.openid, req.user.userId);
    sendPaymentResult(res, result);
  } catch (err) {
    res.status(502).json({
      success: false,
      message: err.message || '微信支付下单失败'
    });
  }
});

/**
 * POST /api/v1/payment/notify
 * 微信支付回调（微信服务器调用）
 */
router.post('/notify', (req, res) => {
  try {
    const notifyData = req.body;
    const result = handlePaymentNotify(notifyData, req.headers, req.rawBody || '');
    if (result.success) {
      res.json({ code: 'SUCCESS', message: '成功' });
      return;
    }
    res.status(400).json({ code: 'FAIL', message: result.message });
  } catch (err) {
    res.status(500).json({
      code: 'FAIL',
      message: err.message
    });
  }
});

/**
 * GET /api/v1/payment/query/:order_no
 * 查询订单状态
 */
router.get('/query/:order_no', authenticateToken, (req, res) => {
  const { order_no } = req.params;
  const result = queryOrder(order_no);
  res.json(result);
});

/**
 * POST /api/v1/payment/auto-renew/cancel
 * 取消自动续费
 */
router.post('/auto-renew/cancel', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const result = cancelAutoRenew(userId);
  res.json(result);
});

module.exports = router;
