CREATE DATABASE IF NOT EXISTS niuniu_parenting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE niuniu_parenting;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(128) NOT NULL UNIQUE,
  nickname VARCHAR(255),
  avatar_url TEXT,
  phone_number VARCHAR(32) DEFAULT NULL,
  phone_bound_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_users_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS plans (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  duration_days INT NOT NULL,
  price_yuan INT NOT NULL,
  original_price INT,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  plan_code VARCHAR(64) NOT NULL,
  status VARCHAR(32) DEFAULT 'active',
  start_date DATETIME,
  end_date DATETIME,
  auto_renew TINYINT DEFAULT 0,
  wx_agreement_id VARCHAR(255),
  pay_method VARCHAR(64),
  order_no VARCHAR(128),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subscriptions_user (user_id),
  INDEX idx_subscriptions_status (status),
  INDEX idx_subscriptions_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_memberships (
  user_id BIGINT PRIMARY KEY,
  is_trial_used TINYINT DEFAULT 0,
  trial_end_date DATETIME,
  current_plan VARCHAR(64),
  current_end_date DATETIME,
  auto_renew TINYINT DEFAULT 1,
  membership_type VARCHAR(64) DEFAULT 'free',
  status VARCHAR(32) DEFAULT 'free',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promo_batches (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_code VARCHAR(128) NOT NULL UNIQUE,
  description TEXT,
  duration_days INT NOT NULL,
  total_count INT DEFAULT 0,
  used_count INT DEFAULT 0,
  valid_from DATETIME,
  valid_to DATETIME,
  is_active TINYINT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promo_codes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  batch_id BIGINT,
  code VARCHAR(128) NOT NULL UNIQUE,
  status VARCHAR(32) DEFAULT 'unused',
  user_id BIGINT,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_promo_codes_batch (batch_id),
  INDEX idx_promo_codes_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS referrals (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  inviter_id BIGINT NOT NULL,
  invitee_id BIGINT,
  invitee_order_id BIGINT,
  reward_days INT DEFAULT 7,
  status VARCHAR(32) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_referrals_inviter (inviter_id),
  INDEX idx_referrals_invitee (invitee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_orders (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  plan_code VARCHAR(64) NOT NULL,
  order_no VARCHAR(128) NOT NULL UNIQUE,
  amount INT NOT NULL,
  status VARCHAR(32) DEFAULT 'pending',
  wx_prepay_id VARCHAR(255),
  wx_transaction_id VARCHAR(255),
  auto_renew TINYINT DEFAULT 1,
  wx_agreement_id VARCHAR(255),
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_payment_orders_user (user_id),
  INDEX idx_payment_orders_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO plans (code, name, duration_days, price_yuan, original_price, description, sort_order, is_active) VALUES
  ('trial', '免费试用', 15, 0, 0, '新用户15天全功能试用', 0, 1),
  ('month', '月卡', 30, 3900, 5900, '每天不到2元，畅享会员权益', 1, 1),
  ('quarter', '季卡', 90, 6900, 9900, '省40%，更划算', 2, 1),
  ('year', '年卡', 365, 16900, 19900, '省60%，最超值', 3, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  duration_days = VALUES(duration_days),
  price_yuan = VALUES(price_yuan),
  original_price = VALUES(original_price),
  description = VALUES(description),
  sort_order = VALUES(sort_order),
  is_active = VALUES(is_active);

INSERT INTO promo_batches (batch_code, description, duration_days, total_count, valid_from, valid_to, is_active) VALUES
  ('LEGACY_2025', '老用户免费3个月', 90, 999999, '2025-01-01', '2025-12-31', 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  duration_days = VALUES(duration_days),
  total_count = VALUES(total_count),
  valid_from = VALUES(valid_from),
  valid_to = VALUES(valid_to),
  is_active = VALUES(is_active);
