const express = require('express');
const https = require('https');
const { db } = require('../config/database');
const { authenticateToken, generateToken, verifyToken } = require('../middleware/auth');
const { handleReferralSignup } = require('../services/referral');

const router = express.Router();

function normalizeUser(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    openid: row.openid,
    nickname: row.nickname || '',
    avatar_url: row.avatar_url || '',
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function getWechatSession(code) {
  return new Promise((resolve, reject) => {
    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_APP_SECRET;

    if (!appid || !secret) {
      if (process.env.NODE_ENV === 'production') {
        reject(new Error('WECHAT_APPID and WECHAT_APP_SECRET must be configured in production'));
        return;
      }
      resolve({ openid: `dev_${String(code).replace(/[^a-zA-Z0-9_-]/g, '_')}` });
      return;
    }

    const url = 'https://api.weixin.qq.com/sns/jscode2session'
      + `?appid=${encodeURIComponent(appid)}`
      + `&secret=${encodeURIComponent(secret)}`
      + `&js_code=${encodeURIComponent(code)}`
      + '&grant_type=authorization_code';

    https.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.errcode) {
            reject(new Error(data.errmsg || 'wechat code exchange failed'));
            return;
          }
          if (!data.openid) {
            reject(new Error('wechat response missing openid'));
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

function findOrCreateUser(openid, profile) {
  const existing = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
  if (existing) {
    return {
      user: normalizeUser(existing),
      isNew: false
    };
  }

  const result = db.prepare(`
    INSERT INTO users (openid, nickname, avatar_url)
    VALUES (?, ?, ?)
  `).run(openid, profile.nickname || '微信用户', profile.avatar_url || '');

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  return {
    user: normalizeUser(user),
    isNew: true
  };
}

function issueTokens(user) {
  const payload = {
    userId: user.id,
    openid: user.openid,
    username: user.nickname || '微信用户'
  };
  return {
    token: generateToken(payload),
    refresh_token: generateToken(Object.assign({}, payload, { tokenType: 'refresh' }))
  };
}

router.post('/login', async (req, res) => {
  try {
    const { code, userInfo, invite_code } = req.body || {};
    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: '缺少微信登录code'
      });
    }

    const session = await getWechatSession(code);
    const { user, isNew } = findOrCreateUser(session.openid, {
      nickname: userInfo && userInfo.nickName,
      avatar_url: userInfo && userInfo.avatarUrl
    });
    if (isNew && invite_code) {
      handleReferralSignup(user.id, invite_code);
    }
    const tokens = issueTokens(user);

    return res.json({
      success: true,
      data: {
        user,
        token: tokens.token,
        refresh_token: tokens.refresh_token,
        is_new_user: isNew
      }
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      message: '微信登录服务暂时不可用',
      detail: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

router.post('/refresh', (req, res) => {
  const { refresh_token } = req.body || {};
  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      message: '缺少refresh_token'
    });
  }

  const decoded = verifyToken(refresh_token);
  if (!decoded || decoded.tokenType !== 'refresh' || !decoded.userId) {
    return res.status(403).json({
      success: false,
      message: 'refresh_token无效或已过期'
    });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const tokens = issueTokens(normalizeUser(user));
  return res.json({
    success: true,
    data: tokens
  });
});

router.get('/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  return res.json({
    success: true,
    data: normalizeUser(user)
  });
});

router.put('/me', authenticateToken, (req, res) => {
  const { nickname, avatar_url } = req.body || {};
  const current = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  if (!current) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  db.prepare(`
    UPDATE users
    SET nickname = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    nickname !== undefined ? String(nickname).slice(0, 50) : current.nickname,
    avatar_url !== undefined ? String(avatar_url).slice(0, 500) : current.avatar_url,
    req.user.userId
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.userId);
  return res.json({
    success: true,
    data: normalizeUser(updated)
  });
});

router.post('/account-deletion', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: '用户不存在'
    });
  }

  const transaction = db.transaction(() => {
    const children = db.prepare('SELECT id FROM children WHERE user_id = ?').all(userId);
    for (const child of children) {
      const records = db.prepare('SELECT id FROM assessment_records WHERE child_id = ?').all(child.id);
      for (const record of records) {
        db.prepare('DELETE FROM assessment_dimensions WHERE record_id = ?').run(record.id);
      }
      db.prepare('DELETE FROM assessment_records WHERE child_id = ?').run(child.id);
    }

    db.prepare('DELETE FROM children WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM chat_messages WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM event_tracks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM subscriptions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM user_memberships WHERE user_id = ?').run(userId);
    db.prepare('UPDATE promo_codes SET user_id = NULL, status = ? WHERE user_id = ?').run('unused', userId);
    db.prepare('DELETE FROM payment_orders WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM referrals WHERE inviter_id = ? OR invitee_id = ?').run(userId, userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });

  transaction();

  return res.json({
    success: true,
    message: '账号已注销'
  });
});

module.exports = router;
