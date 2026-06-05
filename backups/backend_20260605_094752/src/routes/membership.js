// 会员路由
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getMembershipInfo,
  checkAndActivateTrial,
  redeemPromoCode,
  cancelAutoRenew
} = require('../services/membership');

/**
 * GET /api/v1/membership/info
 * 获取当前会员信息
 */
router.get('/info', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const info = getMembershipInfo(userId);
  res.json({ success: true, data: info });
});

/**
 * POST /api/v1/membership/trial/activate
 * 激活试用（首次使用）
 */
router.post('/trial/activate', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const result = checkAndActivateTrial(userId);

  if (result.activated) {
    res.json({
      success: true,
      message: '试用期已激活',
      data: {
        trial_end_date: result.trial_end_date,
        days: result.days
      }
    });
  } else {
    res.json({
      success: true,
      message: '试用期已使用过',
      data: { activated: false }
    });
  }
});

/**
 * POST /api/v1/membership/promo/redeem
 * 兑换码兑换
 */
router.post('/promo/redeem', authenticateToken, (req, res) => {
  const { code } = req.body;
  const userId = req.user.userId;

  if (!code) {
    return res.status(400).json({ success: false, message: '请输入兑换码' });
  }

  const result = redeemPromoCode(userId, code);
  res.json(result);
});

/**
 * POST /api/v1/membership/auto-renew/cancel
 * 取消自动续费
 */
router.post('/auto-renew/cancel', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const result = cancelAutoRenew(userId);
  res.json(result);
});

module.exports = router;
