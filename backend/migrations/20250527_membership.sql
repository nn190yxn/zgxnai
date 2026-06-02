-- 会员制度数据库迁移脚本
-- 2025-05-27 会员制度

-- 1. 套餐表
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price_yuan INTEGER NOT NULL, -- 单位：分
  original_price INTEGER,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. 订阅表
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_code TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active/expired/cancelled
  start_date DATETIME,
  end_date DATETIME,
  auto_renew INTEGER DEFAULT 0,
  wx_agreement_id TEXT,
  pay_method TEXT, -- trial/wxpay/promo_code/gift/referral
  order_no TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. 用户会员快照表
CREATE TABLE IF NOT EXISTS user_memberships (
  user_id INTEGER PRIMARY KEY,
  is_trial_used INTEGER DEFAULT 0,
  trial_end_date DATETIME,
  current_plan TEXT,
  current_end_date DATETIME,
  auto_renew INTEGER DEFAULT 1,
  membership_type TEXT DEFAULT 'free', -- free/trial/month/quarter/year
  status TEXT DEFAULT 'free', -- free/active/expired
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 兑换码批次表
CREATE TABLE IF NOT EXISTS promo_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_code TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_days INTEGER NOT NULL,
  total_count INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  valid_from DATETIME,
  valid_to DATETIME,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. 兑换码表
CREATE TABLE IF NOT EXISTS promo_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id INTEGER,
  code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'unused', -- unused/used/expired
  user_id INTEGER,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. 裂变记录表
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  inviter_id INTEGER NOT NULL,
  invitee_id INTEGER,
  invitee_order_id INTEGER,
  reward_days INTEGER DEFAULT 7,
  status TEXT DEFAULT 'pending', -- pending/completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. 支付订单表
CREATE TABLE IF NOT EXISTS payment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  plan_code TEXT NOT NULL,
  order_no TEXT NOT NULL UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending/paid/failed/refunded
  wx_prepay_id TEXT,
  wx_transaction_id TEXT,
  auto_renew INTEGER DEFAULT 1,
  wx_agreement_id TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. 创建索引
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_promo_codes_batch ON promo_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);
CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee ON referrals(invitee_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_order_no ON payment_orders(order_no);

-- 9. 插入默认套餐数据
INSERT OR IGNORE INTO plans (code, name, duration_days, price_yuan, original_price, description, sort_order) VALUES
  ('trial', '免费试用', 15, 0, 0, '新用户15天全功能试用', 0),
  ('month', '月卡', 30, 1990, 2990, '每天不到1元，畅享会员权益', 1),
  ('quarter', '季卡', 90, 4990, 6990, '省30%，更划算', 2),
  ('year', '年卡', 365, 9900, 11990, '省60%，最超值', 3);

-- 10. 插入老用户兑换码批次（免费3个月）
INSERT OR IGNORE INTO promo_batches (batch_code, description, duration_days, total_count, valid_from, valid_to) VALUES
  ('LEGACY_2025', '老用户免费3个月', 90, 999999, '2025-01-01', '2025-12-31');
