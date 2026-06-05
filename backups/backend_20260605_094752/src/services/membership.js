// 会员服务层
const { db } = require('../config/database');
const crypto = require('crypto');

const TRIAL_DAYS = 15;
const REFERRAL_MAX_DAYS = 60;
const REFERRAL_REWARD_DAYS = 7;

/**
 * 获取用户会员状态
 */
function getMembership(userId) {
  const membership = db.prepare(`
    SELECT * FROM user_memberships WHERE user_id = ?
  `).get(userId);

  if (!membership) {
    return { status: 'free', membership_type: 'free', auto_renew: 1 };
  }

  return membership;
}

/**
 * 检查用户是否有效会员
 */
function isActiveMember(userId) {
  const membership = getMembership(userId);

  if (membership.status === 'active') {
    if (membership.current_end_date) {
      const endDate = new Date(membership.current_end_date);
      if (endDate > new Date()) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 激活新用户试用期
 */
function activateTrial(userId) {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  // 创建试用订阅
  db.prepare(`
    INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method)
    VALUES (?, 'trial', 'active', datetime('now'), ?, 'trial')
  `).run(userId, trialEnd.toISOString());

  // 更新用户会员快照
  db.prepare(`
    INSERT INTO user_memberships (user_id, is_trial_used, trial_end_date, current_plan, current_end_date, membership_type, status, auto_renew)
    VALUES (?, 1, ?, 'trial', ?, 'trial', 'active', 1)
    ON CONFLICT(user_id) DO UPDATE SET
      is_trial_used = 1,
      trial_end_date = excluded.trial_end_date,
      current_plan = 'trial',
      current_end_date = excluded.current_end_date,
      membership_type = 'trial',
      status = 'active',
      auto_renew = 1,
      updated_at = datetime('now')
  `).run(userId, trialEnd.toISOString(), trialEnd.toISOString());

  return { success: true, trial_end_date: trialEnd.toISOString(), days: TRIAL_DAYS };
}

/**
 * 检查并激活试用（用户首次使用时调用）
 */
function checkAndActivateTrial(userId) {
  const membership = getMembership(userId);

  if (membership.is_trial_used) {
    return { activated: false, reason: 'trial_already_used' };
  }

  return { activated: true, ...activateTrial(userId) };
}

/**
 * 激活付费订阅
 */
function activateSubscription(userId, planCode, options = {}) {
  const plan = db.prepare('SELECT * FROM plans WHERE code = ? AND is_active = 1').get(planCode);
  if (!plan) {
    return { success: false, message: '套餐不存在' };
  }

  const now = new Date();
  let startDate = now;
  let endDate = new Date();

  // 如果有现有有效订阅，从新订阅结束日期开始算
  const existing = db.prepare(`
    SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_date > datetime('now')
    ORDER BY end_date DESC LIMIT 1
  `).get(userId);

  if (existing) {
    startDate = new Date(existing.end_date);
    endDate = new Date(existing.end_date);
  }

  endDate.setDate(endDate.getDate() + plan.duration_days);

  // 创建订阅记录
  const result = db.prepare(`
    INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, auto_renew, pay_method, order_no)
    VALUES (?, ?, 'active', ?, ?, ?, ?, ?)
  `).run(userId, planCode, startDate.toISOString(), endDate.toISOString(),
    options.auto_renew !== false ? 1 : 0,
    options.pay_method || 'wxpay',
    options.order_no || null
  );

  // 更新用户会员快照
  db.prepare(`
    INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew, updated_at)
    VALUES (?, ?, ?, ?, 'active', ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      current_plan = excluded.current_plan,
      current_end_date = excluded.current_end_date,
      membership_type = excluded.membership_type,
      status = 'active',
      auto_renew = excluded.auto_renew,
      updated_at = datetime('now')
  `).run(userId, planCode, endDate.toISOString(), planCode, options.auto_renew !== false ? 1 : 0);

  return {
    success: true,
    subscription_id: result.lastInsertRowid,
    plan_code: planCode,
    start_date: startDate.toISOString(),
    end_date: endDate.toISOString(),
    duration_days: plan.duration_days
  };
}

/**
 * 延长会员时间（用于裂变奖励）
 */
function extendMembership(userId, days, reason) {
  const membership = getMembership(userId);
  let endDate;

  if (membership.current_end_date && membership.status === 'active') {
    endDate = new Date(membership.current_end_date);
    endDate.setDate(endDate.getDate() + days);
  } else {
    endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
  }

  // 创建奖励订阅记录
  db.prepare(`
    INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method)
    VALUES (?, 'reward', 'active', datetime('now'), ?, ?)
  `).run(userId, endDate.toISOString(), 'referral_reward');

  // 更新用户会员快照
  db.prepare(`
    INSERT INTO user_memberships (user_id, current_end_date, status, updated_at)
    VALUES (?, ?, 'active', datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      current_end_date = excluded.current_end_date,
      status = 'active',
      updated_at = datetime('now')
  `).run(userId, endDate.toISOString());

  return { success: true, new_end_date: endDate.toISOString(), days_added: days };
}

/**
 * 获取会员权益信息
 */
function getMembershipInfo(userId) {
  const membership = getMembership(userId);
  const now = new Date();
  let isActive = false;
  let daysLeft = 0;

  if (membership.current_end_date && membership.status === 'active') {
    const endDate = new Date(membership.current_end_date);
    if (endDate > now) {
      isActive = true;
      daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    }
  }

  // 获取可用套餐
  const plans = db.prepare(`
    SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order
  `).all();

  return {
    status: isActive ? membership.status : 'free',
    membership_type: membership.membership_type || 'free',
    is_active: isActive,
    days_left: Math.max(0, daysLeft),
    current_end_date: membership.current_end_date || null,
    auto_renew: !!membership.auto_renew,
    is_trial_used: !!membership.is_trial_used,
    plans: plans.map(p => ({
      code: p.code,
      name: p.name,
      duration_days: p.duration_days,
      price_yuan: p.price_yuan,
      original_price: p.original_price,
      description: p.description
    }))
  };
}

/**
 * 创建兑换码（批量）
 */
function createPromoCodes(batchId, count) {
  const batch = db.prepare('SELECT * FROM promo_batches WHERE id = ?').get(batchId);
  if (!batch) {
    return { success: false, message: '批次不存在' };
  }

  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = 'NNVIP-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    try {
      db.prepare(`
        INSERT INTO promo_codes (batch_id, code)
        VALUES (?, ?)
      `).run(batchId, code);
      codes.push(code);
    } catch (err) {
      // 唯一冲突重试
      i--;
    }
  }

  return { success: true, codes };
}

/**
 * 兑换码兑换
 */
function redeemPromoCode(userId, code) {
  const promoCode = db.prepare(`
    SELECT pc.*, pb.duration_days, pb.valid_from, pb.valid_to, pb.batch_code
    FROM promo_codes pc
    JOIN promo_batches pb ON pc.batch_id = pb.id
    WHERE pc.code = ? AND pb.is_active = 1
  `).get(code);

  if (!promoCode) {
    return { success: false, message: '兑换码无效' };
  }

  if (promoCode.status !== 'unused') {
    return { success: false, message: '兑换码已被使用' };
  }

  const now = new Date();
  if (promoCode.valid_from && new Date(promoCode.valid_from) > now) {
    return { success: false, message: '兑换码尚未生效' };
  }
  if (promoCode.valid_to && new Date(promoCode.valid_to) < now) {
    return { success: false, message: '兑换码已过期' };
  }

  // 标记兑换码已使用
  db.prepare(`
    UPDATE promo_codes SET status = 'used', user_id = ?, used_at = datetime('now') WHERE id = ?
  `).run(userId, promoCode.id);

  // 激活会员
  const result = activateSubscription(userId, 'promo_code', {
    pay_method: 'promo_code',
    duration_days: promoCode.duration_days
  });

  // 特殊处理：如果是老用户批次，标记来源
  if (promoCode.batch_code === 'LEGACY_2025') {
    db.prepare(`
      UPDATE subscriptions SET pay_method = 'legacy_gift' WHERE id = ?
    `).run(result.subscription_id);
  }

  return {
    success: true,
    message: '兑换成功',
    duration_days: promoCode.duration_days,
    end_date: result.end_date
  };
}

/**
 * 定时任务：检查到期并自动续费
 */
function checkExpiredMemberships() {
  const now = new Date();

  // 获取即将到期的会员（3天内）
  const expiring = db.prepare(`
    SELECT um.*, s.auto_renew, s.wx_agreement_id
    FROM user_memberships um
    JOIN subscriptions s ON um.user_id = s.user_id
    WHERE um.status = 'active'
      AND um.current_end_date BETWEEN datetime('now') AND datetime('now', '+3 days')
      AND s.auto_renew = 1
      AND s.status = 'active'
    GROUP BY um.user_id
  `).all();

  return {
    expiring_count: expiring.length,
    users: expiring.map(u => ({
      user_id: u.user_id,
      end_date: u.current_end_date,
      plan: u.current_plan
    }))
  };
}

/**
 * 取消自动续费
 */
function cancelAutoRenew(userId) {
  db.prepare(`
    UPDATE subscriptions SET auto_renew = 0 WHERE user_id = ? AND status = 'active'
  `).run(userId);

  db.prepare(`
    UPDATE user_memberships SET auto_renew = 0 WHERE user_id = ?
  `).run(userId);

  return { success: true, message: '已取消自动续费' };
}

module.exports = {
  getMembership,
  isActiveMember,
  activateTrial,
  checkAndActivateTrial,
  activateSubscription,
  extendMembership,
  getMembershipInfo,
  createPromoCodes,
  redeemPromoCode,
  checkExpiredMemberships,
  cancelAutoRenew,
  TRIAL_DAYS,
  REFERRAL_MAX_DAYS,
  REFERRAL_REWARD_DAYS
};
