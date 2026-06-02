// 裂变路由
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  generateInviteCode,
  recordReferral,
  completeReferral,
  getReferralStats,
  getReferralList
} = require('../services/referral');

/**
 * GET /api/v1/referral/code
 * 获取邀请码
 */
router.get('/code', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const code = generateInviteCode(userId);
  res.json({ success: true, data: { invite_code: code } });
});

/**
 * POST /api/v1/referral/record
 * 记录邀请关系（新用户注册时调用）
 */
router.post('/record', (req, res) => {
  const { inviter_id, invitee_id } = req.body;

  if (!inviter_id || !invitee_id) {
    return res.status(400).json({ success: false, message: '参数不完整' });
  }

  const result = recordReferral(inviter_id, invitee_id);
  res.json(result);
});

/**
 * POST /api/v1/referral/complete
 * 完成邀请（被邀请人购买后调用）
 */
router.post('/complete', authenticateToken, (req, res) => {
  const { invitee_id, order_id } = req.body;

  if (!invitee_id) {
    return res.status(400).json({ success: false, message: '缺少被邀请人ID' });
  }

  const result = completeReferral(invitee_id, order_id);
  res.json(result);
});

/**
 * GET /api/v1/referral/stats
 * 获取邀请统计
 */
router.get('/stats', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const stats = getReferralStats(userId);
  res.json({ success: true, data: stats });
});

/**
 * GET /api/v1/referral/list
 * 获取邀请列表
 */
router.get('/list', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const result = getReferralList(userId);
  res.json(result);
});

module.exports = router;
