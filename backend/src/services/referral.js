// 裂变服务层
const { db } = require('../config/database');
const { extendMembership } = require('./membership');
const { REFERRAL_MAX_DAYS, REFERRAL_REWARD_DAYS } = require('./membership');

/**
 * 生成邀请码
 */
function generateInviteCode(userId) {
  return `NN${String(userId).padStart(6, '0')}`;
}

function parseInviteCode(inviteCode) {
  if (!inviteCode || typeof inviteCode !== 'string') {
    return 0;
  }
  const match = inviteCode.trim().toUpperCase().match(/^NN(\d+)$/);
  return match ? Number(match[1]) : 0;
}

/**
 * 记录邀请关系
 */
function recordReferral(inviterId, inviteeId) {
  if (inviterId === inviteeId) {
    return { success: false, message: '不能邀请自己' };
  }

  // 检查是否已存在邀请关系
  const existing = db.prepare(`
    SELECT * FROM referrals WHERE invitee_id = ?
  `).get(inviteeId);

  if (existing) {
    return { success: false, message: '该用户已被邀请' };
  }

  // 创建邀请记录
  db.prepare(`
    INSERT INTO referrals (inviter_id, invitee_id, reward_days, status)
    VALUES (?, ?, ?, 'pending')
  `).run(inviterId, inviteeId, REFERRAL_REWARD_DAYS);

  return {
    success: true,
    message: '邀请关系已记录'
  };
}

/**
 * 完成邀请（被邀请人购买后调用）
 */
function completeReferral(inviteeId, orderId) {
  const referral = db.prepare(`
    SELECT * FROM referrals WHERE invitee_id = ? AND status = 'pending'
  `).get(inviteeId);

  if (!referral) {
    return { success: false, message: '没有待完成的邀请' };
  }

  // 检查邀请人本月已获得奖励天数
  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  const monthlyReferrals = db.prepare(`
    SELECT COUNT(*) as count FROM referrals
    WHERE inviter_id = ? AND status = 'completed'
    AND strftime('%Y-%m', created_at) = ?
  `).get(referral.inviter_id, currentMonth);

  const totalRewardDays = monthlyReferrals.count * REFERRAL_REWARD_DAYS;

  if (totalRewardDays >= REFERRAL_MAX_DAYS) {
    // 超过上限，不再奖励
    db.prepare(`
      UPDATE referrals SET status = 'completed', invitee_order_id = ?
      WHERE id = ?
    `).run(orderId, referral.id);

    return {
      success: true,
      message: '邀请已完成（本月奖励已达上限）',
      reward_days: 0
    };
  }

  // 计算实际奖励天数（不超上限）
  const remainingDays = REFERRAL_MAX_DAYS - totalRewardDays;
  const actualRewardDays = Math.min(REFERRAL_REWARD_DAYS, remainingDays);

  // 发放奖励
  const rewardResult = extendMembership(referral.inviter_id, actualRewardDays, 'referral');

  // 更新邀请记录
  db.prepare(`
    UPDATE referrals
    SET status = 'completed', invitee_order_id = ?, reward_days = ?
    WHERE id = ?
  `).run(orderId, actualRewardDays, referral.id);

  return {
    success: true,
    message: '邀请完成，奖励已发放',
    reward_days: actualRewardDays,
    membership: rewardResult
  };
}

function handleReferralSignup(inviteeId, inviteCode) {
  const inviterId = parseInviteCode(inviteCode);
  if (!inviterId || inviterId === inviteeId) {
    return { success: false, message: '邀请码无效' };
  }

  const inviter = db.prepare('SELECT id FROM users WHERE id = ?').get(inviterId);
  if (!inviter) {
    return { success: false, message: '邀请人不存在' };
  }

  const existing = db.prepare('SELECT id FROM referrals WHERE invitee_id = ?').get(inviteeId);
  if (existing) {
    return { success: false, message: '该用户已被邀请' };
  }

  const stats = getReferralStats(inviterId);
  const inviterRewardDays = Math.min(REFERRAL_REWARD_DAYS, stats.remaining_days);
  const transaction = db.transaction(() => {
    db.prepare(`
      INSERT INTO referrals (inviter_id, invitee_id, reward_days, status)
      VALUES (?, ?, ?, 'completed')
    `).run(inviterId, inviteeId, inviterRewardDays);
    if (inviterRewardDays > 0) {
      extendMembership(inviterId, inviterRewardDays, 'referral_reward');
    }
    extendMembership(inviteeId, REFERRAL_REWARD_DAYS, 'invitee_reward');
  });
  transaction();

  return {
    success: true,
    reward_days: inviterRewardDays,
    invitee_reward_days: REFERRAL_REWARD_DAYS
  };
}

/**
 * 获取邀请统计数据
 */
function getReferralStats(userId) {
  const now = new Date();
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

  // 总邀请数
  const totalInvites = db.prepare(`
    SELECT COUNT(*) as count FROM referrals WHERE inviter_id = ?
  `).get(userId);

  // 本月邀请数
  const monthlyInvites = db.prepare(`
    SELECT COUNT(*) as count FROM referrals
    WHERE inviter_id = ? AND strftime('%Y-%m', created_at) = ?
  `).get(userId, currentMonth);

  // 本月已获得奖励天数
  const monthlyRewardResult = db.prepare(`
    SELECT COALESCE(SUM(reward_days), 0) as total_days
    FROM referrals
    WHERE inviter_id = ? AND status = 'completed'
    AND strftime('%Y-%m', created_at) = ?
  `).get(userId, currentMonth);

  const monthlyRewardDays = monthlyRewardResult.total_days || 0;
  const remainingDays = Math.max(0, REFERRAL_MAX_DAYS - monthlyRewardDays);
  const canEarnMore = remainingDays > 0;

  return {
    total_invites: totalInvites.count,
    monthly_invites: monthlyInvites.count,
    monthly_reward_days: monthlyRewardDays,
    monthly_max_days: REFERRAL_MAX_DAYS,
    remaining_days: remainingDays,
    can_earn_more: canEarnMore,
    invite_code: generateInviteCode(userId)
  };
}

/**
 * 获取邀请列表
 */
function getReferralList(userId) {
  const referrals = db.prepare(`
    SELECT r.*, u.nickname as invitee_name
    FROM referrals r
    LEFT JOIN users u ON r.invitee_id = u.id
    WHERE r.inviter_id = ?
    ORDER BY r.created_at DESC
  `).all(userId);

  return {
    success: true,
    list: referrals.map(r => ({
      id: r.id,
      invitee_name: r.invitee_name || '未知用户',
      status: r.status,
      reward_days: r.reward_days,
      created_at: r.created_at
    }))
  };
}

module.exports = {
  generateInviteCode,
  parseInviteCode,
  recordReferral,
  completeReferral,
  handleReferralSignup,
  getReferralStats,
  getReferralList
};
