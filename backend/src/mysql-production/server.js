const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const {
  HOT_KEYWORDS,
  PARENTING_ARTICLES,
  READING_TASKS,
  ASSESSMENT_META,
  buildAssessmentQuestions
} = require('./content-seeds');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const API_PREFIXES = Array.from(new Set([API_PREFIX, '/api/v1']));
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET;
const WECHAT_PAY_HOST = 'api.mch.weixin.qq.com';
const REFERRAL_REWARD_DAYS = 7;
const REFERRAL_MAX_DAYS = 60;
const NUTRITION_RECIPES = require('../nutrition-recipes.json');

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const wxPayConfig = {
  appid: process.env.WECHAT_APPID || process.env.WX_APPID || '',
  mchid: process.env.WECHAT_PAY_MCH_ID || process.env.WX_MCHID || '',
  apiKey: process.env.WECHAT_PAY_API_KEY || process.env.WX_API_KEY || '',
  notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL || process.env.WX_NOTIFY_URL || '',
  keyPath: process.env.WECHAT_PAY_KEY_PATH || process.env.WX_KEY_PATH || '',
  certSerialNo: process.env.WECHAT_PAY_CERT_SERIAL_NO || process.env.WX_CERT_SERIAL_NO || '',
  platformCertPath: process.env.WECHAT_PAY_PLATFORM_CERT_PATH || process.env.WX_PLATFORM_CERT_PATH || ''
};

app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === `${API_PREFIX}/payment/notify`) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));

app.get('/health', healthHandler);
for (const prefix of API_PREFIXES) {
  app.get(`${prefix}/health`, healthHandler);
  app.post(`${prefix}/auth/login`, asyncHandler(loginHandler));
  app.post(`${prefix}/auth/refresh`, asyncHandler(refreshHandler));
  app.get(`${prefix}/auth/me`, authenticateToken, asyncHandler(meHandler));
  app.get(`${prefix}/membership/info`, authenticateToken, asyncHandler(membershipInfoHandler));
  app.post(`${prefix}/membership/trial/activate`, authenticateToken, asyncHandler(trialHandler));
  app.post(`${prefix}/membership/promo/redeem`, authenticateToken, asyncHandler(promoHandler));
  app.get(`${prefix}/referral/stats`, authenticateToken, asyncHandler(referralStatsHandler));
  app.get(`${prefix}/referral/code`, authenticateToken, asyncHandler(referralCodeHandler));
  app.post(`${prefix}/payment/create`, authenticateToken, asyncHandler(createPaymentOrderHandler));
  app.post(`${prefix}/payment/unified-order`, authenticateToken, asyncHandler(unifiedOrderHandler));
  app.get(`${prefix}/payment/query/:order_no`, authenticateToken, asyncHandler(queryPaymentHandler));
  app.post(`${prefix}/payment/notify`, asyncHandler(paymentNotifyHandler));
  app.get(`${prefix}/children`, authenticateToken, asyncHandler(childrenListHandler));
  app.post(`${prefix}/children`, authenticateToken, asyncHandler(childrenCreateHandler));
  app.get(`${prefix}/children/:id`, authenticateToken, asyncHandler(childDetailHandler));
  app.put(`${prefix}/children/:id`, authenticateToken, asyncHandler(childrenUpdateHandler));
  app.put(`${prefix}/children/:id/set-default`, authenticateToken, asyncHandler(childrenSetDefaultHandler));
  app.delete(`${prefix}/children/:id`, authenticateToken, asyncHandler(childrenDeleteHandler));
  app.get(`${prefix}/parenting/articles`, optionalAuthenticateToken, asyncHandler(parentingArticlesHandler));
  app.get(`${prefix}/parenting/articles/:id`, optionalAuthenticateToken, asyncHandler(parentingArticleDetailHandler));
  app.get(`${prefix}/parenting/articles/:id/related`, optionalAuthenticateToken, asyncHandler(parentingRelatedArticlesHandler));
  app.post(`${prefix}/parenting/articles/:id/favorite`, authenticateToken, asyncHandler(parentingFavoriteHandler));
  app.get(`${prefix}/parenting/articles/:id/comments`, asyncHandler(parentingCommentsHandler));
  app.post(`${prefix}/parenting/articles/:id/comments`, authenticateToken, asyncHandler(parentingCreateCommentHandler));
  app.post(`${prefix}/parenting/articles/:id/like`, authenticateToken, asyncHandler(parentingLikeHandler));
  app.get(`${prefix}/parenting/hot-keywords`, asyncHandler(parentingHotKeywordsHandler));
  app.get(`${prefix}/parenting/search`, optionalAuthenticateToken, asyncHandler(parentingSearchHandler));
  app.get(`${prefix}/education/tasks/today`, authenticateToken, requireActiveMembership, asyncHandler(educationTasksTodayHandler));
  app.post(`${prefix}/education/tasks/:id/complete`, authenticateToken, requireActiveMembership, asyncHandler(educationCompleteTaskHandler));
  app.get(`${prefix}/education/progress/overview`, authenticateToken, requireActiveMembership, asyncHandler(educationProgressOverviewHandler));
  app.get(`${prefix}/education/knowledge/chapters`, authenticateToken, requireActiveMembership, asyncHandler(educationKnowledgeChaptersHandler));
  app.get(`${prefix}/education/knowledge/detail`, authenticateToken, requireActiveMembership, asyncHandler(educationKnowledgeDetailHandler));
  app.post(`${prefix}/education/progress`, authenticateToken, requireActiveMembership, asyncHandler(educationUpdateProgressHandler));
  app.get(`${prefix}/assessments`, authenticateToken, requireActiveMembership, asyncHandler(assessmentsListHandler));
  app.get(`${prefix}/assessments/:code/questions`, authenticateToken, requireActiveMembership, asyncHandler(assessmentQuestionsHandler));
  app.post(`${prefix}/assessments/:code/submit`, authenticateToken, requireActiveMembership, asyncHandler(assessmentSubmitHandler));
  app.get(`${prefix}/assessments/results/:id`, authenticateToken, requireActiveMembership, asyncHandler(assessmentResultHandler));
  app.get(`${prefix}/assessments/history`, authenticateToken, requireActiveMembership, asyncHandler(assessmentHistoryHandler));
  app.get(`${prefix}/assessments/history/count`, authenticateToken, requireActiveMembership, asyncHandler(assessmentHistoryCountHandler));
  app.delete(`${prefix}/assessments/records/:id`, authenticateToken, requireActiveMembership, asyncHandler(assessmentDeleteHandler));
  app.post(`${prefix}/chat`, authenticateToken, requireActiveMembership, asyncHandler(chatHandler));
  app.get(`${prefix}/nutrition/recommendations`, nutritionRecommendationsHandler);
  app.get(`${prefix}/nutrition/recipes`, nutritionRecipesHandler);
  app.get(`${prefix}/nutrition/recipes/:id`, nutritionRecipeDetailHandler);
  app.post(`${prefix}/nutrition/recipes/:id/favorite`, authenticateToken, nutritionRecipeFavoriteHandler);
  app.all(`${prefix}/chat*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
  app.all(`${prefix}/recommendations*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
}

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('[niuniu-backend]', err.message);
  res.status(500).json({ success: false, message: err.message || '服务异常' });
});

bootstrap().catch((err) => {
  console.error('[niuniu-backend] bootstrap failed:', err.message);
  process.exit(1);
});

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function healthHandler(req, res) {
  res.json({ status: 'ok', service: 'niuniu-backend', timestamp: new Date().toISOString() });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET || 'dev-niuniu-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ success: false, message: '未提供访问令牌' });
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET || 'dev-niuniu-secret');
    next();
  } catch (err) {
    res.status(401).json({ success: false, code: 'TOKEN_EXPIRED', message: '访问令牌无效或已过期' });
  }
}

function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    next();
    return;
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET || 'dev-niuniu-secret');
  } catch (err) {
    req.user = null;
  }
  next();
}

async function requireActiveMembership(req, res, next) {
  const active = await isActiveMember(req.user.userId);
  if (!active) {
    res.status(403).json({
      success: false,
      code: 'MEMBERSHIP_REQUIRED',
      message: '会员已到期或尚未开通，请先开通会员'
    });
    return;
  }
  next();
}

function paidFeaturePlaceholderHandler(req, res) {
  res.status(404).json({ success: false, message: '接口暂未在生产服务开放', path: req.path });
}

async function chatHandler(req, res) {
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) {
    res.status(400).json({ success: false, message: '缺少提问内容' });
    return;
  }

  const sessionId = String((req.body && req.body.session_id) || `session_${Date.now()}`);
  const intent = analyzeChatIntent(message);
  const references = collectChatReferences(intent, message);
  const answer = buildChatAnswer(message, intent, references);

  res.json({
    success: true,
    data: {
      answer,
      sources: references.map((item) => item.title).slice(0, 5),
      session_id: sessionId,
      intent,
      answer_source: 'seed_knowledge'
    }
  });
}

function analyzeChatIntent(message) {
  const text = String(message || '').toLowerCase();
  if (/(早餐|午餐|晚餐|挑食|营养|吃什么|食谱)/.test(text)) {
    return 'nutrition';
  }
  if (/(阅读|绘本|复述|识字|共读)/.test(text)) {
    return 'reading';
  }
  if (/(情绪|脾气|哭闹|发火|生气)/.test(text)) {
    return 'emotion';
  }
  if (/(专注|注意力|走神|拖拉)/.test(text)) {
    return 'focus';
  }
  if (/(评估|测评|观察|感统|学习适应|多元智能|adhd)/.test(text)) {
    return 'assessment';
  }
  return 'general';
}

function collectChatReferences(intent, message) {
  const keywords = String(message || '').split(/[\s，。！？、,.!?]+/).filter(Boolean);
  const lowerKeywords = keywords.map((item) => item.toLowerCase());

  function scoreText(text) {
    const source = String(text || '').toLowerCase();
    return lowerKeywords.reduce((total, keyword) => total + (source.includes(keyword) ? 1 : 0), 0);
  }

  const references = [];

  if (intent === 'nutrition') {
    for (const recipe of NUTRITION_RECIPES.slice(0, 120)) {
      const score = scoreText([recipe.title, recipe.description, (recipe.ingredients || []).join(' ')].join(' '));
      if (score > 0) {
        references.push({
          title: recipe.title,
          score,
          content: recipe.description || '',
          extra: recipe
        });
      }
    }
  }

  for (const article of PARENTING_ARTICLES) {
    const score = scoreText([article.title, article.summary, article.content, article.tags].join(' '));
    if (score > 0 || (intent === 'emotion' && article.category === '情绪管理') || (intent === 'focus' && article.sub_category === '专注训练')) {
      references.push({
        title: article.title,
        score: Math.max(score, 1),
        content: article.content,
        extra: article
      });
    }
  }

  if (intent === 'reading') {
    for (const task of READING_TASKS) {
      const score = scoreText([task.title, task.objective, task.content, task.parent_prompt].join(' '));
      references.push({
        title: task.title,
        score: Math.max(score, 1),
        content: task.content,
        extra: task
      });
    }
  }

  if (intent === 'assessment') {
    for (const [code, meta] of Object.entries(ASSESSMENT_META)) {
      const score = scoreText([code, meta.name, (meta.age_groups || []).join(' ')].join(' '));
      references.push({
        title: meta.name,
        score: Math.max(score, 1),
        content: `${meta.name}，约${meta.duration}分钟，${meta.total_questions}题，适用年龄${(meta.age_groups || []).join('、')}`,
        extra: { code, meta }
      });
    }
  }

  references.sort((a, b) => b.score - a.score);
  return references.slice(0, 5);
}

function buildChatAnswer(message, intent, references) {
  if (intent === 'nutrition') {
    const recipe = references[0] && references[0].extra;
    const article = references.find((item) => item.extra && item.extra.summary);
    return [
      `关于“${message}”，我建议先按“稳定进食节奏 + 简单均衡搭配”来处理。`,
      recipe ? `优先参考 ${recipe.title}：${recipe.description || '这道搭配更适合孩子接受，能同时补充主食、蛋白质和蔬菜。'}` : '每餐优先保证主食、蛋白质、蔬菜三类食物同时出现。',
      recipe && Array.isArray(recipe.ingredients) && recipe.ingredients.length ? `这类搭配可以从 ${recipe.ingredients.slice(0, 4).join('、')} 开始，先做孩子熟悉的口味。` : '先保留一种孩子愿意吃的安全食物，再增加一种少量新食物。',
      article ? `家庭执行要点：${article.extra.summary}` : '家长负责提供，孩子负责决定吃多少，连续多次接触比一次吃很多更有效。',
      '连续观察1到2周，重点看进食对抗是否下降、接受的新食物是否增加。'
    ].join('\n\n');
  }

  if (intent === 'reading') {
    const task = references[0] && references[0].extra;
    return [
      `关于“${message}”，我建议先做短时、高频、能马上开始的阅读训练。`,
      task ? `可以先用“${task.title}”这类任务：${task.objective}` : '先从看图说信息、复述一句话这类低门槛任务开始。',
      task ? `家庭操作步骤：${String(task.steps || '').split('\n').slice(0, 3).join('；')}` : '每次10分钟以内，先看图，再追问，再让孩子自己说。',
      task ? `家长提示语可以直接用：${task.parent_prompt}` : '家长的问题越具体，孩子越容易回答。',
      '连续练2周后，再逐步增加复述长度和表达难度。'
    ].join('\n\n');
  }

  if (intent === 'assessment') {
    const assessment = references[0] && references[0].extra;
    const meta = assessment && assessment.meta;
    return [
      `关于“${message}”，我建议先用观察工具把问题具体化，再决定训练重点。`,
      meta ? `当前最接近的是 ${meta.name}，大约 ${meta.duration} 分钟，${meta.total_questions} 题，适用 ${(meta.age_groups || []).join('、')}。` : '可以先从最贴近当前困扰的成长观察开始。',
      '做评估前先回想孩子最近2周在家庭、外出、任务场景中的稳定表现，按常态作答。',
      '拿到结果后先看最需要支持的1到2个维度，再把训练拆成每天能执行的小动作。',
      '如果你愿意继续描述孩子年龄和主要困扰，我建议你优先做更匹配的一类观察。'
    ].join('\n\n');
  }

  if (intent === 'emotion' || intent === 'focus') {
    const article = references[0] && references[0].extra;
    return [
      `关于“${message}”，我建议先从家庭回应方式入手，再看训练安排。`,
      article ? article.summary : '先降低对抗，再把家长提示语缩短，孩子会更容易进入配合状态。',
      article ? article.content.split('\n\n').slice(0, 2).join('\n\n') : '先命名情绪或任务，再给出一个清晰的小步骤。',
      '先连续执行7天，记录问题最常出现的时间、场景和触发点。',
      '如果问题已经明显影响睡眠、社交或学习，再考虑配合专业评估。'
    ].join('\n\n');
  }

  const article = references[0] && references[0].extra;
  return [
    `关于“${message}”，我建议先把问题落到一个具体场景里处理。`,
    article ? article.summary : '先描述孩子的年龄、典型场景和你最困扰的表现，建议会更准确。',
    article ? article.content.split('\n\n').slice(0, 2).join('\n\n') : '先观察频率、触发点和持续时间，再决定是调环境、调回应还是做训练。',
    '先稳定执行1周，再看变化决定下一步。'
  ].join('\n\n');
}

async function loginHandler(req, res) {
  const code = req.body && req.body.code;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, message: '缺少微信登录code' });
    return;
  }
  const session = await getWechatSession(code);
  const { user, isNew: isNewUser } = await findOrCreateUser(session.openid, req.body.userInfo || {});

  // 处理邀请码（新用户注册时）
  if (isNewUser && req.body.invite_code) {
    await handleReferralSignup(user.id, req.body.invite_code);
  }

  const payload = { userId: user.id, openid: user.openid, username: user.nickname || '微信用户' };
  res.json({
    success: true,
    data: {
      user,
      token: signToken(payload),
      refresh_token: signToken(Object.assign({}, payload, { tokenType: 'refresh' }))
    }
  });
}

async function refreshHandler(req, res) {
  const refreshToken = req.body && req.body.refresh_token;
  if (!refreshToken) {
    res.status(400).json({ success: false, message: '缺少刷新令牌' });
    return;
  }
  const decoded = jwt.verify(refreshToken, JWT_SECRET || 'dev-niuniu-secret');
  const payload = { userId: decoded.userId, openid: decoded.openid, username: decoded.username || '微信用户' };
  res.json({ success: true, data: { token: signToken(payload) } });
}

async function meHandler(req, res) {
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?', [req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '用户不存在' });
    return;
  }
  res.json({ success: true, data: rows[0] });
}

async function getWechatSession(code) {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WECHAT_APPID and WECHAT_APP_SECRET must be configured');
    }
    return { openid: `dev_${code.replace(/[^a-zA-Z0-9_-]/g, '_')}` };
  }
  const url = 'https://api.weixin.qq.com/sns/jscode2session'
    + `?appid=${encodeURIComponent(appid)}`
    + `&secret=${encodeURIComponent(secret)}`
    + `&js_code=${encodeURIComponent(code)}`
    + '&grant_type=authorization_code';
  return requestJson(url);
}

function requestJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      let body = '';
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.errcode) {
            reject(new Error(data.errmsg || 'wechat request failed'));
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

async function findOrCreateUser(openid, profile) {
  const [existing] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE openid = ?', [openid]);
  if (existing.length) {
    return { user: existing[0], isNew: false };
  }
  const [result] = await pool.execute(
    'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)',
    [openid, profile.nickName || profile.nickname || '微信用户', profile.avatarUrl || profile.avatar_url || '']
  );
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, created_at, updated_at FROM users WHERE id = ?', [result.insertId]);
  return { user: rows[0], isNew: true };
}

async function handleReferralSignup(inviteeId, inviteCode) {
  const inviterId = parseInviteCode(inviteCode);
  if (!inviterId || inviterId === inviteeId) {
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [inviters] = await connection.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [inviterId]);
    if (!inviters.length) {
      await connection.rollback();
      return;
    }
    const [existing] = await connection.execute(
      'SELECT id FROM referrals WHERE invitee_id = ? FOR UPDATE',
      [inviteeId]
    );
    if (existing.length) {
      await connection.rollback();
      return;
    }
    const rewardDays = await getAvailableReferralRewardDays(connection, inviterId);
    await connection.execute(
      'INSERT INTO referrals (inviter_id, invitee_id, reward_days, status) VALUES (?, ?, ?, ?)',
      [inviterId, inviteeId, rewardDays, 'completed']
    );
    if (rewardDays > 0) {
      await extendMembership(connection, inviterId, rewardDays, 'referral_reward');
    }
    await extendMembership(connection, inviteeId, REFERRAL_REWARD_DAYS, 'invitee_reward');
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    console.error('[Referral] Handle signup error:', err.message);
  } finally {
    connection.release();
  }
}

function parseInviteCode(inviteCode) {
  if (!inviteCode || typeof inviteCode !== 'string') {
    return 0;
  }
  const match = inviteCode.trim().toUpperCase().match(/^NN(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function getAvailableReferralRewardDays(connection, inviterId) {
  const [rows] = await connection.execute(
    `SELECT COALESCE(SUM(reward_days), 0) AS total_days
     FROM referrals
     WHERE inviter_id = ?
       AND status = 'completed'
       AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
    [inviterId]
  );
  const usedDays = Number(rows[0] && rows[0].total_days) || 0;
  return Math.max(0, Math.min(REFERRAL_REWARD_DAYS, REFERRAL_MAX_DAYS - usedDays));
}

async function membershipInfoHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  const [plans] = await pool.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY sort_order');
  const now = Date.now();
  const endTime = membership.current_end_date ? new Date(membership.current_end_date).getTime() : 0;
  const isActive = membership.status === 'active' && endTime > now;
  res.json({
    success: true,
    data: {
      status: isActive ? 'active' : 'free',
      membership_type: isActive ? membership.membership_type : 'free',
      is_active: isActive,
      days_left: isActive ? Math.ceil((endTime - now) / 86400000) : 0,
      is_trial_used: !!membership.is_trial_used,
      plans
    }
  });
}

async function getMembership(userId) {
  const [rows] = await pool.execute('SELECT * FROM user_memberships WHERE user_id = ?', [userId]);
  return rows[0] || { status: 'free', membership_type: 'free', is_trial_used: 0, auto_renew: 1 };
}

async function isActiveMember(userId) {
  const membership = await getMembership(userId);
  const endTime = membership.current_end_date ? new Date(membership.current_end_date).getTime() : 0;
  return membership.status === 'active' && endTime > Date.now();
}

async function extendMembership(connection, userId, days, payMethod) {
  const [memberships] = await connection.execute(
    'SELECT current_end_date, status FROM user_memberships WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const now = new Date();
  let endDate = now;
  if (memberships.length && memberships[0].status === 'active' && memberships[0].current_end_date) {
    const currentEndDate = new Date(memberships[0].current_end_date);
    if (currentEndDate > now) {
      endDate = currentEndDate;
    }
  }
  endDate.setDate(endDate.getDate() + days);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method) VALUES (?, ?, ?, NOW(), ?, ?)',
    [userId, 'reward', 'active', endDate, payMethod]
  );
  await connection.execute(
    `INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, 'reward', ?, 'reward', 'active', 1)
     ON DUPLICATE KEY UPDATE current_plan = 'reward', current_end_date = VALUES(current_end_date), membership_type = 'reward', status = 'active'`,
    [userId, endDate]
  );
}

async function trialHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  if (membership.is_trial_used) {
    res.json({ success: true, data: { activated: false, reason: 'trial_already_used' } });
    return;
  }
  const endDate = new Date(Date.now() + 15 * 86400000);
  await pool.execute('INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, pay_method) VALUES (?, ?, ?, NOW(), ?, ?)', [req.user.userId, 'trial', 'active', endDate, 'trial']);
  await pool.execute(
    `INSERT INTO user_memberships (user_id, is_trial_used, trial_end_date, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, 1, ?, 'trial', ?, 'trial', 'active', 1)
     ON DUPLICATE KEY UPDATE is_trial_used = 1, trial_end_date = VALUES(trial_end_date), current_plan = 'trial', current_end_date = VALUES(current_end_date), membership_type = 'trial', status = 'active', auto_renew = 1`,
    [req.user.userId, endDate, endDate]
  );
  res.json({ success: true, data: { activated: true, trial_end_date: endDate.toISOString(), days: 15 } });
}

async function promoHandler(req, res) {
  res.json({ success: false, message: '兑换码暂未开放' });
}

async function referralStatsHandler(req, res) {
  const [totalRows] = await pool.execute('SELECT COUNT(*) AS count FROM referrals WHERE inviter_id = ?', [req.user.userId]);
  const [monthlyRows] = await pool.execute(
    `SELECT COUNT(*) AS count, COALESCE(SUM(reward_days), 0) AS total_days
     FROM referrals
     WHERE inviter_id = ?
       AND status = 'completed'
       AND DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`,
    [req.user.userId]
  );
  const monthlyRewardDays = Number(monthlyRows[0] && monthlyRows[0].total_days) || 0;
  res.json({
    success: true,
    data: {
      total_invites: Number(totalRows[0] && totalRows[0].count) || 0,
      monthly_invites: Number(monthlyRows[0] && monthlyRows[0].count) || 0,
      monthly_reward_days: monthlyRewardDays,
      monthly_max_days: REFERRAL_MAX_DAYS,
      remaining_days: Math.max(0, REFERRAL_MAX_DAYS - monthlyRewardDays),
      can_earn_more: monthlyRewardDays < REFERRAL_MAX_DAYS,
      invite_code: `NN${String(req.user.userId).padStart(6, '0')}`
    }
  });
}

async function referralCodeHandler(req, res) {
  res.json({ success: true, data: { invite_code: `NN${String(req.user.userId).padStart(6, '0')}` } });
}

function buildNutritionRecipeBase(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    name: recipe.name || recipe.title,
    description: recipe.description,
    desc: recipe.description,
    category: recipe.category,
    tags: recipe.tags,
    ageRange: recipe.ageRange,
    cookTime: recipe.cookTime,
    calories: recipe.calories,
    difficulty: recipe.difficulty,
    visualIcon: recipe.visualIcon || '',
    image: recipe.image || '',
    viewCount: recipe.viewCount || 0,
    is_favorited: false,
    isFavorite: false,
    created_at: new Date().toISOString()
  };
}

function normalizeNutritionRecipeSummary(recipe) {
  const base = buildNutritionRecipeBase(recipe);
  return Object.assign({}, base, {
    nutrition: {
      highlight: recipe.nutrition && recipe.nutrition.highlight ? recipe.nutrition.highlight : ''
    }
  });
}

function normalizeNutritionRecipeDetail(recipe) {
  return Object.assign({}, buildNutritionRecipeBase(recipe), {
    ingredients: recipe.ingredients || [],
    nutrition: recipe.nutrition || {},
    tips: recipe.tips || '',
    nutrientCombination: recipe.nutrientCombination || '',
    dailyNutritionPercent: recipe.dailyNutritionPercent || ''
  });
}

function filterNutritionRecipes(query) {
  const keyword = String((query && query.keyword) || '').trim();
  const category = String((query && query.category) || '').trim();
  const age = String((query && query.age) || '').trim();
  return NUTRITION_RECIPES.filter((recipe) => {
    const text = `${recipe.title} ${recipe.description} ${recipe.category} ${recipe.tags.join(' ')}`;
    if (keyword && !text.includes(keyword)) {
      return false;
    }
    if (category && recipe.category !== category) {
      return false;
    }
    if (age && age !== '全部年龄' && recipe.ageRange !== age) {
      return false;
    }
    return true;
  });
}

function nutritionRecommendationsHandler(req, res) {
  const shuffled = [...NUTRITION_RECIPES].sort(() => 0.5 - Math.random());
  res.json({ success: true, data: shuffled.slice(0, 6).map(normalizeNutritionRecipeSummary) });
}

function nutritionRecipesHandler(req, res) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.page_size || req.query.pageSize || 10), 1), 30);
  const filtered = filterNutritionRecipes(req.query);
  const offset = (page - 1) * pageSize;
  const recipes = filtered.slice(offset, offset + pageSize).map(normalizeNutritionRecipeSummary);
  res.json({
    success: true,
    data: {
      recipes,
      pagination: {
        page,
        page_size: pageSize,
        total: filtered.length,
        has_more: offset + pageSize < filtered.length
      }
    }
  });
}

function nutritionRecipeDetailHandler(req, res) {
  const recipe = NUTRITION_RECIPES.find((item) => item.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ success: false, message: '食谱不存在' });
    return;
  }
  res.json({ success: true, data: normalizeNutritionRecipeDetail(recipe) });
}

function nutritionRecipeFavoriteHandler(req, res) {
  const recipe = NUTRITION_RECIPES.find((item) => item.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ success: false, message: '食谱不存在' });
    return;
  }
  res.json({ success: true, data: { is_favorited: true, isFavorite: true } });
}

function paymentConfigError() {
  return { success: false, code: 'WECHAT_PAY_NOT_CONFIGURED', message: '微信支付配置中，请使用试用或兑换码功能', missing_config: getMissingPayConfig() };
}

function getMissingPayConfig() {
  return [
    ['WECHAT_APPID', wxPayConfig.appid],
    ['WECHAT_PAY_MCH_ID', wxPayConfig.mchid],
    ['WECHAT_PAY_API_KEY', wxPayConfig.apiKey],
    ['WECHAT_PAY_NOTIFY_URL', wxPayConfig.notifyUrl],
    ['WECHAT_PAY_KEY_PATH', wxPayConfig.keyPath],
    ['WECHAT_PAY_CERT_SERIAL_NO', wxPayConfig.certSerialNo]
  ].filter(([, value]) => !value).map(([key]) => key);
}

function isWechatPayConfigured() {
  return getMissingPayConfig().length === 0 && fs.existsSync(wxPayConfig.keyPath);
}

async function createPaymentOrderHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json(paymentConfigError());
    return;
  }
  const planCode = req.body && req.body.plan_code;
  if (!planCode) {
    res.status(400).json({ success: false, message: '请选择套餐' });
    return;
  }
  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    res.status(400).json({ success: false, message: '套餐不存在' });
    return;
  }
  const plan = plans[0];
  const orderNo = `NN${Date.now()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
  const autoRenew = req.body.auto_renew !== false ? 1 : 0;
  await pool.execute(
    'INSERT INTO payment_orders (user_id, plan_code, order_no, amount, status, auto_renew) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.userId, planCode, orderNo, plan.price_yuan, 'pending', autoRenew]
  );
  res.json({ success: true, data: { success: true, order_no: orderNo, amount: plan.price_yuan, plan_name: plan.name, auto_renew: autoRenew === 1 } });
}

async function unifiedOrderHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json(paymentConfigError());
    return;
  }
  const orderNo = req.body && req.body.order_no;
  if (!orderNo) {
    res.status(400).json({ success: false, message: '订单号不能为空' });
    return;
  }
  const [orders] = await pool.execute('SELECT * FROM payment_orders WHERE order_no = ? AND user_id = ?', [orderNo, req.user.userId]);
  if (!orders.length) {
    res.status(404).json({ success: false, message: '订单不存在' });
    return;
  }
  const order = orders[0];
  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ?', [order.plan_code]);
  const wxResult = await requestWechatPay('POST', '/v3/pay/transactions/jsapi', {
    appid: wxPayConfig.appid,
    mchid: wxPayConfig.mchid,
    description: plans[0] ? `小牛育儿${plans[0].name}` : '小牛育儿会员',
    out_trade_no: order.order_no,
    notify_url: wxPayConfig.notifyUrl,
    amount: { total: order.amount, currency: 'CNY' },
    payer: { openid: req.user.openid }
  });
  await pool.execute('UPDATE payment_orders SET wx_prepay_id = ? WHERE order_no = ?', [wxResult.prepay_id, order.order_no]);
  res.json({ success: true, data: Object.assign({ success: true }, buildMiniProgramPayParams(wxResult.prepay_id)) });
}

async function queryPaymentHandler(req, res) {
  const [rows] = await pool.execute('SELECT order_no, status, amount, plan_code, paid_at, auto_renew FROM payment_orders WHERE order_no = ? AND user_id = ?', [req.params.order_no, req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '订单不存在' });
    return;
  }
  res.json({ success: true, data: Object.assign({ success: true }, rows[0]) });
}

async function paymentNotifyHandler(req, res) {
  if (!isWechatPayConfigured()) {
    res.status(503).json({ code: 'FAIL', message: '微信支付未配置' });
    return;
  }
  if (req.body.resource && !verifyWechatNotifySignature(req.headers, req.rawBody || '')) {
    res.status(400).json({ code: 'FAIL', message: '微信支付回调签名无效' });
    return;
  }
  const paymentData = req.body.resource ? decryptWechatResource(req.body.resource) : req.body;
  const orderNo = paymentData.out_trade_no;
  const transactionId = paymentData.transaction_id;
  if (paymentData.trade_state !== 'SUCCESS' && paymentData.result_code !== 'SUCCESS') {
    await pool.execute('UPDATE payment_orders SET status = ? WHERE order_no = ? AND status != ?', ['failed', orderNo, 'paid']);
    res.status(400).json({ code: 'FAIL', message: '支付失败' });
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute('SELECT * FROM payment_orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!orders.length) {
      await connection.rollback();
      res.status(404).json({ code: 'FAIL', message: '订单不存在' });
      return;
    }
    const order = orders[0];
    if (order.status !== 'paid') {
      await connection.execute('UPDATE payment_orders SET status = ?, wx_transaction_id = ?, paid_at = NOW() WHERE order_no = ?', ['paid', transactionId, orderNo]);
      await activateSubscription(connection, order.user_id, order.plan_code, orderNo, order.auto_renew === 1);
    }
    await connection.commit();
    res.json({ code: 'SUCCESS', message: '成功' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function activateSubscription(connection, userId, planCode, orderNo, autoRenew) {
  const [plans] = await connection.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    throw new Error('套餐不存在');
  }
  const endDate = new Date(Date.now() + plans[0].duration_days * 86400000);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, auto_renew, pay_method, order_no) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
    [userId, planCode, 'active', endDate, autoRenew ? 1 : 0, 'wxpay', orderNo]
  );
  await connection.execute(
    `INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, ?, ?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE current_plan = VALUES(current_plan), current_end_date = VALUES(current_end_date), membership_type = VALUES(membership_type), status = 'active', auto_renew = VALUES(auto_renew)`,
    [userId, planCode, endDate, planCode, autoRenew ? 1 : 0]
  );
}

function requestWechatPay(method, apiPath, body) {
  const payload = body ? JSON.stringify(body) : '';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const message = [method, apiPath, timestamp, nonceStr, payload].join('\n') + '\n';
  const signature = crypto.createSign('RSA-SHA256').update(message).sign(fs.readFileSync(wxPayConfig.keyPath, 'utf8'), 'base64');
  const authorization = 'WECHATPAY2-SHA256-RSA2048 '
    + `mchid="${wxPayConfig.mchid}",`
    + `nonce_str="${nonceStr}",`
    + `signature="${signature}",`
    + `timestamp="${timestamp}",`
    + `serial_no="${wxPayConfig.certSerialNo}"`;
  return new Promise((resolve, reject) => {
    const request = https.request({
      hostname: WECHAT_PAY_HOST,
      path: apiPath,
      method,
      headers: {
        Authorization: authorization,
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'niuniu-parenting-backend/1.0'
      },
      timeout: 10000
    }, (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let parsed = {};
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch (err) {
            reject(new Error('微信支付响应解析失败'));
            return;
          }
        }
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(parsed);
          return;
        }
        reject(new Error(parsed.message || parsed.detail || '微信支付请求失败'));
      });
    });
    request.on('timeout', () => request.destroy(new Error('微信支付请求超时')));
    request.on('error', reject);
    if (payload) {
      request.write(payload);
    }
    request.end();
  });
}

function buildMiniProgramPayParams(prepayId) {
  const timeStamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const packageValue = `prepay_id=${prepayId}`;
  const message = `${wxPayConfig.appid}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`;
  const paySign = crypto.createSign('RSA-SHA256').update(message).sign(fs.readFileSync(wxPayConfig.keyPath, 'utf8'), 'base64');
  return { appId: wxPayConfig.appid, timeStamp, nonceStr, package: packageValue, signType: 'RSA', paySign };
}

function decryptWechatResource(resource) {
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', wxPayConfig.apiKey, resource.nonce);
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  return JSON.parse(Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8'));
}

function verifyWechatNotifySignature(headers, rawBody) {
  if (!wxPayConfig.platformCertPath) {
    return true;
  }
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  if (!signature || !timestamp || !nonce || !rawBody) {
    return false;
  }
  const certificate = fs.readFileSync(wxPayConfig.platformCertPath, 'utf8');
  return crypto.createVerify('RSA-SHA256').update(`${timestamp}\n${nonce}\n${rawBody}\n`).verify(certificate, signature, 'base64');
}

async function bootstrap() {
  await ensureProductionTables();
  app.listen(PORT, HOST, () => {
    console.log(`[niuniu-backend] listening on http://${HOST}:${PORT}`);
  });
}

async function ensureProductionTables() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS children (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      name VARCHAR(64) NOT NULL,
      nickname VARCHAR(64) DEFAULT '',
      gender VARCHAR(16) DEFAULT 'unknown',
      birthday DATE NULL,
      avatar TEXT,
      is_default TINYINT DEFAULT 0,
      current_height DECIMAL(6,2) NULL,
      current_weight DECIMAL(6,2) NULL,
      allergies TEXT,
      special_notes TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_children_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS assessment_records (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      child_id BIGINT NOT NULL,
      assessment_code VARCHAR(64) NOT NULL,
      assessment_name VARCHAR(255),
      age_group VARCHAR(32),
      total_score DECIMAL(8,2) DEFAULT 0,
      max_score DECIMAL(8,2) DEFAULT 0,
      percentage DECIMAL(8,2) DEFAULT 0,
      overall_level VARCHAR(32),
      elapsed_time INT DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_assessment_child (child_id),
      INDEX idx_assessment_code (assessment_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS assessment_dimensions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      record_id BIGINT NOT NULL,
      dimension_name VARCHAR(128) NOT NULL,
      score DECIMAL(8,2) DEFAULT 0,
      score_rate DECIMAL(8,2) DEFAULT 0,
      standard_score DECIMAL(8,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_assessment_dimensions_record (record_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS assessment_interpretations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      assessment_code VARCHAR(64) NOT NULL,
      dimension_name VARCHAR(128),
      score_min DECIMAL(8,2) DEFAULT 0,
      score_max DECIMAL(8,2) DEFAULT 100,
      level VARCHAR(32),
      interpretation TEXT,
      behavior_description TEXT,
      scene_advice TEXT,
      expected_goal TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_assessment_interpretations_code (assessment_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS assessment_suggestions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      assessment_code VARCHAR(64) NOT NULL,
      dimension_name VARCHAR(128),
      level VARCHAR(32),
      title VARCHAR(255) NOT NULL,
      description TEXT,
      steps TEXT,
      duration VARCHAR(64),
      frequency VARCHAR(64),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_assessment_suggestions_code (assessment_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reading_tasks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      task_code VARCHAR(128) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      subject_code VARCHAR(128) NOT NULL,
      age_range VARCHAR(64),
      difficulty INT DEFAULT 1,
      duration INT DEFAULT 10,
      material TEXT,
      objective TEXT,
      steps TEXT,
      parent_prompt TEXT,
      content TEXT,
      image_url TEXT,
      icon_url TEXT,
      cover_image TEXT,
      audio_url TEXT,
      video_url TEXT,
      tips TEXT,
      example_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reading_tasks_subject (subject_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS task_progress (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      child_id BIGINT NOT NULL,
      task_id BIGINT NOT NULL,
      status VARCHAR(32) DEFAULT 'pending',
      progress INT DEFAULT 0,
      completed_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_task_progress (child_id, task_id),
      INDEX idx_task_progress_child (child_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      summary TEXT,
      content LONGTEXT,
      category VARCHAR(128),
      sub_category VARCHAR(128),
      age_group VARCHAR(64),
      tags TEXT,
      author VARCHAR(128),
      evidence_level VARCHAR(32),
      read_count INT DEFAULT 0,
      is_published TINYINT DEFAULT 1,
      cover TEXT,
      cover_image TEXT,
      icon_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_articles_category (category),
      INDEX idx_articles_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      item_type VARCHAR(64) NOT NULL,
      item_id VARCHAR(128) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_favorites (user_id, item_type, item_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS article_likes (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      article_id BIGINT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_article_likes (user_id, article_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS article_comments (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      article_id BIGINT NOT NULL,
      content TEXT NOT NULL,
      parent_id BIGINT DEFAULT 0,
      likes INT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_article_comments_article (article_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await seedContentIfNeeded();
}

async function seedContentIfNeeded() {
  const [articleCountRows] = await pool.execute('SELECT COUNT(*) AS count FROM articles');
  if (Number(articleCountRows[0].count) === 0) {
    for (const article of PARENTING_ARTICLES) {
      await pool.execute(
        `INSERT INTO articles (title, summary, content, category, sub_category, age_group, tags, author, evidence_level, cover)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          article.title,
          article.summary,
          article.content,
          article.category,
          article.sub_category,
          article.age_group,
          article.tags,
          article.author,
          article.evidence_level,
          ''
        ]
      );
    }
  }

  const [taskCountRows] = await pool.execute('SELECT COUNT(*) AS count FROM reading_tasks');
  if (Number(taskCountRows[0].count) === 0) {
    for (const task of READING_TASKS) {
      await pool.execute(
        `INSERT INTO reading_tasks
         (task_code, title, subject_code, age_range, difficulty, duration, material, objective, steps, parent_prompt, content, image_url, icon_url, cover_image, audio_url, video_url, tips, example_answer)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.task_code,
          task.title,
          task.subject_code,
          task.age_range,
          task.difficulty,
          task.duration,
          task.material,
          task.objective,
          task.steps,
          task.parent_prompt,
          task.content,
          '',
          '',
          '',
          '',
          '',
          task.tips,
          task.example_answer
        ]
      );
    }
  }

  const [interpretationCountRows] = await pool.execute('SELECT COUNT(*) AS count FROM assessment_interpretations');
  if (Number(interpretationCountRows[0].count) === 0) {
    const rows = [
      ['focus', '集中注意', 0, 40, 'intervention', '专注维持时间较短，容易受环境影响。', '经常东张西望，任务启动后容易离开。', '先优化环境，再把任务拆成5分钟小段。', '连续两周后，开始出现更稳定的专注时段。'],
      ['focus', '集中注意', 40, 70, 'attention', '专注表现处于发展中，部分场景需要更多支持。', '熟悉任务时较稳定，陌生任务时容易退缩。', '从孩子熟悉的内容开始，逐步增加挑战。', '四周内可看到持续时间提升。'],
      ['focus', '集中注意', 70, 100, 'good', '专注表现整体稳定。', '能够在提醒后回到任务。', '继续保持高质量阅读和安静环境。', '稳定巩固现有专注能力。'],
      ['emotion', '情绪识别', 0, 40, 'intervention', '情绪识别和表达需要更多家庭支持。', '情绪来时更容易用行为代替表达。', '用情绪命名和共情短句帮助孩子表达。', '两到四周内情绪表达会更清晰。'],
      ['learning', '学习适应', 0, 40, 'intervention', '学习准备与任务坚持需要重点支持。', '开始慢、拖延多、完成度波动。', '用固定流程和明确开始动作帮助启动。', '逐步建立稳定的学习节奏。']
    ];
    for (const row of rows) {
      await pool.execute(
        `INSERT INTO assessment_interpretations
         (assessment_code, dimension_name, score_min, score_max, level, interpretation, behavior_description, scene_advice, expected_goal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
  }

  const [suggestionCountRows] = await pool.execute('SELECT COUNT(*) AS count FROM assessment_suggestions');
  if (Number(suggestionCountRows[0].count) === 0) {
    const rows = [
      ['focus', '集中注意', 'intervention', '家庭专注环境优化', '减少干扰、拆小任务、建立稳定节奏。', '先清桌面\n再做5分钟任务\n完成后立刻反馈', '2周', '每天'],
      ['emotion', '情绪识别', 'intervention', '情绪表达训练', '帮助孩子先识别再表达情绪。', '每天命名一次情绪\n家长示范表达\n复盘替代表达', '4周', '每天'],
      ['learning', '学习适应', 'intervention', '任务启动支持', '用固定流程帮助孩子开始任务。', '开始前预告\n第一步写出来\n完成后及时强化', '4周', '每天']
    ];
    for (const row of rows) {
      await pool.execute(
        `INSERT INTO assessment_suggestions
         (assessment_code, dimension_name, level, title, description, steps, duration, frequency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
  }
}

function parseJsonArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return String(value).split(/[、,，\s]+/).filter(Boolean);
  }
}

function serializeJsonArray(value) {
  if (!value) {
    return JSON.stringify([]);
  }
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter(Boolean));
  }
  return JSON.stringify(String(value).split(/[、,，\s]+/).filter(Boolean));
}

function normalizeChild(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    nickname: row.nickname || '',
    gender: row.gender || 'unknown',
    birthday: row.birthday ? formatDateValue(row.birthday) : '',
    birth_date: row.birthday ? formatDateValue(row.birthday) : '',
    avatar: row.avatar || '',
    is_default: row.is_default ? 1 : 0,
    isDefault: !!row.is_default,
    current_height: row.current_height,
    height: row.current_height,
    current_weight: row.current_weight,
    weight: row.current_weight,
    allergies: parseJsonArray(row.allergies),
    special_notes: row.special_notes || '',
    specialConditions: row.special_notes || '',
    tags: parseJsonArray(row.tags),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function formatDateValue(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function getUserId(req) {
  return req.user && req.user.userId;
}

async function getOwnedChild(userId, childId) {
  const [rows] = await pool.execute(`${buildChildSelectSql()} WHERE id = ? AND user_id = ? LIMIT 1`, [childId, userId]);
  return rows[0] || null;
}

function buildChildSelectSql() {
  return `SELECT id, user_id, name, nickname, gender, DATE_FORMAT(birthday, '%Y-%m-%d') AS birthday, avatar, is_default, current_height, current_weight, allergies, special_notes, tags, created_at, updated_at FROM children`;
}

async function requireOwnedChildForRead(req, res, childId) {
  if (!childId) {
    res.status(400).json({ success: false, message: 'childId不能为空' });
    return null;
  }
  const child = await getOwnedChild(getUserId(req), childId);
  if (!child) {
    res.status(403).json({ success: false, message: '无权访问该孩子的数据' });
    return null;
  }
  return child;
}

function validateChildPayload(payload, isUpdate) {
  const data = payload || {};
  if (!isUpdate && (!data.name || !String(data.name).trim())) {
    return '孩子姓名不能为空';
  }
  if (data.gender && !['male', 'female', 'unknown'].includes(data.gender)) {
    return '性别参数无效';
  }
  return null;
}

function buildChildPayload(payload, existing) {
  const data = payload || {};
  return {
    name: data.name !== undefined ? String(data.name).trim().slice(0, 50) : existing.name,
    nickname: data.nickname !== undefined ? String(data.nickname).trim().slice(0, 50) : existing.nickname,
    gender: data.gender !== undefined ? data.gender : existing.gender,
    birthday: data.birth_date !== undefined ? data.birth_date : (data.birthday !== undefined ? data.birthday : existing.birthday),
    avatar: data.avatar !== undefined ? String(data.avatar).slice(0, 500) : existing.avatar,
    current_height: data.current_height !== undefined ? data.current_height : existing.current_height,
    current_weight: data.current_weight !== undefined ? data.current_weight : existing.current_weight,
    allergies: data.allergies !== undefined ? serializeJsonArray(data.allergies) : existing.allergies,
    special_notes: data.special_notes !== undefined ? String(data.special_notes).slice(0, 500) : existing.special_notes,
    tags: data.tags !== undefined ? serializeJsonArray(data.tags) : existing.tags
  };
}

async function childrenListHandler(req, res) {
  const [rows] = await pool.execute(`${buildChildSelectSql()} WHERE user_id = ? ORDER BY is_default DESC, created_at ASC`, [getUserId(req)]);
  res.json({ success: true, data: rows.map(normalizeChild) });
}

async function childrenCreateHandler(req, res) {
  const error = validateChildPayload(req.body, false);
  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }
  const userId = getUserId(req);
  const [countRows] = await pool.execute('SELECT COUNT(*) AS count FROM children WHERE user_id = ?', [userId]);
  if (Number(countRows[0].count) >= 5) {
    res.status(400).json({ success: false, message: '最多添加5个孩子档案' });
    return;
  }
  const isDefault = Number(countRows[0].count) === 0 || req.body.is_default || req.body.isDefault ? 1 : 0;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (isDefault) {
      await connection.execute('UPDATE children SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    const [result] = await connection.execute(
      `INSERT INTO children (user_id, name, nickname, gender, birthday, avatar, is_default, current_height, current_weight, allergies, special_notes, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        String(req.body.name).trim().slice(0, 50),
        req.body.nickname ? String(req.body.nickname).trim().slice(0, 50) : '',
        req.body.gender || 'unknown',
        req.body.birth_date || req.body.birthday || null,
        req.body.avatar ? String(req.body.avatar).slice(0, 500) : '',
        isDefault,
        req.body.current_height || null,
        req.body.current_weight || null,
        serializeJsonArray(req.body.allergies),
        req.body.special_notes ? String(req.body.special_notes).slice(0, 500) : '',
        serializeJsonArray(req.body.tags)
      ]
    );
    const [rows] = await connection.execute(`${buildChildSelectSql()} WHERE id = ?`, [result.insertId]);
    await connection.commit();
    res.status(201).json({ success: true, data: normalizeChild(rows[0]) });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function childDetailHandler(req, res) {
  const child = await getOwnedChild(getUserId(req), req.params.id);
  if (!child) {
    res.status(404).json({ success: false, message: '孩子档案不存在' });
    return;
  }
  res.json({ success: true, data: normalizeChild(child) });
}

async function childrenUpdateHandler(req, res) {
  const existing = await getOwnedChild(getUserId(req), req.params.id);
  if (!existing) {
    res.status(404).json({ success: false, message: '孩子档案不存在' });
    return;
  }
  const error = validateChildPayload(req.body, true);
  if (error) {
    res.status(400).json({ success: false, message: error });
    return;
  }
  const nextPayload = buildChildPayload(req.body, existing);
  await pool.execute(
    `UPDATE children
     SET name = ?, nickname = ?, gender = ?, birthday = ?, avatar = ?, current_height = ?, current_weight = ?, allergies = ?, special_notes = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [
      nextPayload.name,
      nextPayload.nickname,
      nextPayload.gender,
      nextPayload.birthday || null,
      nextPayload.avatar || '',
      nextPayload.current_height || null,
      nextPayload.current_weight || null,
      nextPayload.allergies,
      nextPayload.special_notes || '',
      nextPayload.tags,
      req.params.id,
      getUserId(req)
    ]
  );
  const updated = await getOwnedChild(getUserId(req), req.params.id);
  res.json({ success: true, data: normalizeChild(updated) });
}

async function childrenSetDefaultHandler(req, res) {
  const child = await getOwnedChild(getUserId(req), req.params.id);
  if (!child) {
    res.status(404).json({ success: false, message: '孩子档案不存在' });
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('UPDATE children SET is_default = 0 WHERE user_id = ?', [getUserId(req)]);
    await connection.execute('UPDATE children SET is_default = 1 WHERE id = ? AND user_id = ?', [req.params.id, getUserId(req)]);
    await connection.commit();
    const updated = await getOwnedChild(getUserId(req), req.params.id);
    res.json({ success: true, data: normalizeChild(updated) });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function childrenDeleteHandler(req, res) {
  const child = await getOwnedChild(getUserId(req), req.params.id);
  if (!child) {
    res.status(404).json({ success: false, message: '孩子档案不存在' });
    return;
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [recordRows] = await connection.execute('SELECT id FROM assessment_records WHERE child_id = ?', [req.params.id]);
    for (const row of recordRows) {
      await connection.execute('DELETE FROM assessment_dimensions WHERE record_id = ?', [row.id]);
    }
    await connection.execute('DELETE FROM assessment_records WHERE child_id = ?', [req.params.id]);
    await connection.execute('DELETE FROM task_progress WHERE child_id = ?', [req.params.id]);
    await connection.execute('DELETE FROM children WHERE id = ? AND user_id = ?', [req.params.id, getUserId(req)]);
    if (child.is_default) {
      const [nextRows] = await connection.execute('SELECT id FROM children WHERE user_id = ? ORDER BY created_at ASC LIMIT 1', [getUserId(req)]);
      if (nextRows.length) {
        await connection.execute('UPDATE children SET is_default = 1 WHERE id = ?', [nextRows[0].id]);
      }
    }
    await connection.commit();
    res.json({ success: true, message: '孩子档案已删除' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

function buildArticleCover(category) {
  const colors = {
    '情绪管理': '#4A90D9',
    '行为习惯': '#5DBA8B',
    '认知发展': '#9B7ED9',
    '社交能力': '#E89A4C',
    '营养健康': '#E8737A'
  };
  const color = colors[category] || '#9AA4B2';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-size="36">${category}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function isArticleFavorited(userId, articleId) {
  if (!userId) {
    return false;
  }
  const [rows] = await pool.execute('SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ? LIMIT 1', [userId, 'parenting_article', String(articleId)]);
  return rows.length > 0;
}

async function normalizeArticle(row, userId) {
  const favorited = await isArticleFavorited(userId, row.id);
  return {
    id: row.id,
    title: row.title,
    summary: row.summary || '',
    content: row.content || '',
    category: row.category || '',
    sub_category: row.sub_category || '',
    age_group: row.age_group || '',
    tags: row.tags || '',
    author: row.author || '',
    evidence_level: row.evidence_level || '',
    read_count: row.read_count || 0,
    cover: row.cover || row.cover_image || row.icon_url || buildArticleCover(row.category),
    is_favorited: favorited,
    isFavorite: favorited,
    keyPoints: buildKeyPointsFromContent(row.content || row.summary || ''),
    images: []
  };
}

function buildKeyPointsFromContent(content) {
  return String(content || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

async function parentingArticlesHandler(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.max(1, Math.min(20, Number(req.query.page_size || 10)));
  const offset = (page - 1) * pageSize;
  const paginationClause = ` LIMIT ${pageSize} OFFSET ${offset}`;
  const params = [];
  let whereClause = 'WHERE is_published = 1';
  if (req.query.category) {
    whereClause += ' AND category = ?';
    params.push(req.query.category);
  }
  const [rows] = await pool.execute(`SELECT * FROM articles ${whereClause} ORDER BY created_at DESC${paginationClause}`, params);
  const data = [];
  for (const row of rows) {
    data.push(await normalizeArticle(row, getUserId(req)));
  }
  res.json({ success: true, data });
}

async function parentingArticleDetailHandler(req, res) {
  const [rows] = await pool.execute('SELECT * FROM articles WHERE id = ? AND is_published = 1 LIMIT 1', [req.params.id]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '文章不存在' });
    return;
  }
  await pool.execute('UPDATE articles SET read_count = read_count + 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true, data: await normalizeArticle(rows[0], getUserId(req)) });
}

async function parentingRelatedArticlesHandler(req, res) {
  const [rows] = await pool.execute('SELECT * FROM articles WHERE id = ? AND is_published = 1 LIMIT 1', [req.params.id]);
  if (!rows.length) {
    res.json({ success: true, data: [] });
    return;
  }
  const article = rows[0];
  const [relatedRows] = await pool.execute(
    `SELECT * FROM articles
     WHERE is_published = 1 AND id != ? AND (category = ? OR sub_category = ?)
     ORDER BY read_count DESC, created_at DESC LIMIT 5`,
    [req.params.id, article.category, article.sub_category]
  );
  const data = [];
  for (const row of relatedRows) {
    data.push(await normalizeArticle(row, getUserId(req)));
  }
  res.json({ success: true, data });
}

async function parentingFavoriteHandler(req, res) {
  const [articleRows] = await pool.execute('SELECT id FROM articles WHERE id = ? AND is_published = 1 LIMIT 1', [req.params.id]);
  if (!articleRows.length) {
    res.status(404).json({ success: false, message: '文章不存在' });
    return;
  }
  const userId = getUserId(req);
  const [existingRows] = await pool.execute('SELECT id FROM user_favorites WHERE user_id = ? AND item_type = ? AND item_id = ? LIMIT 1', [userId, 'parenting_article', String(req.params.id)]);
  if (existingRows.length) {
    await pool.execute('DELETE FROM user_favorites WHERE id = ?', [existingRows[0].id]);
    res.json({ success: true, data: { is_favorited: false, isFavorite: false } });
    return;
  }
  await pool.execute('INSERT INTO user_favorites (user_id, item_type, item_id) VALUES (?, ?, ?)', [userId, 'parenting_article', String(req.params.id)]);
  res.json({ success: true, data: { is_favorited: true, isFavorite: true } });
}

async function parentingHotKeywordsHandler(req, res) {
  res.json({ success: true, data: HOT_KEYWORDS });
}

async function parentingSearchHandler(req, res) {
  const keyword = String(req.query.keyword || req.query.q || '').trim();
  if (!keyword) {
    res.json({ success: true, data: [] });
    return;
  }
  const searchTerm = `%${keyword}%`;
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.max(1, Math.min(20, Number(req.query.page_size || 10)));
  const offset = (page - 1) * pageSize;
  const paginationClause = ` LIMIT ${pageSize} OFFSET ${offset}`;
  const [rows] = await pool.execute(
    `SELECT * FROM articles
     WHERE is_published = 1
       AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)
     ORDER BY read_count DESC, created_at DESC
     ${paginationClause}`,
    [searchTerm, searchTerm, searchTerm, searchTerm]
  );
  const data = [];
  for (const row of rows) {
    data.push(await normalizeArticle(row, getUserId(req)));
  }
  res.json({ success: true, data });
}

async function parentingCommentsHandler(req, res) {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.max(1, Math.min(50, Number(req.query.page_size || 20)));
  const offset = (page - 1) * pageSize;
  const paginationClause = ` LIMIT ${pageSize} OFFSET ${offset}`;
  const [rows] = await pool.execute(
    `SELECT c.*, u.nickname AS user_nickname, u.avatar_url AS user_avatar
     FROM article_comments c
     LEFT JOIN users u ON c.user_id = u.id
     WHERE c.article_id = ? AND c.parent_id = 0
     ORDER BY c.created_at DESC
     ${paginationClause}`,
    [req.params.id]
  );
  res.json({ success: true, data: rows });
}

async function parentingCreateCommentHandler(req, res) {
  const content = String((req.body && req.body.content) || '').trim();
  if (!content) {
    res.status(400).json({ success: false, message: '评论内容不能为空' });
    return;
  }
  await pool.execute('INSERT INTO article_comments (user_id, article_id, content, parent_id) VALUES (?, ?, ?, ?)', [getUserId(req), req.params.id, content, Number(req.body.parent_id || 0)]);
  res.json({ success: true, message: '评论成功' });
}

async function parentingLikeHandler(req, res) {
  const userId = getUserId(req);
  const [existingRows] = await pool.execute('SELECT id FROM article_likes WHERE user_id = ? AND article_id = ? LIMIT 1', [userId, req.params.id]);
  if (existingRows.length) {
    await pool.execute('DELETE FROM article_likes WHERE id = ?', [existingRows[0].id]);
    const [countRows] = await pool.execute('SELECT COUNT(*) AS count FROM article_likes WHERE article_id = ?', [req.params.id]);
    res.json({ success: true, data: { is_liked: false, isLiked: false, like_count: Number(countRows[0].count) } });
    return;
  }
  await pool.execute('INSERT INTO article_likes (user_id, article_id) VALUES (?, ?)', [userId, req.params.id]);
  const [countRows] = await pool.execute('SELECT COUNT(*) AS count FROM article_likes WHERE article_id = ?', [req.params.id]);
  res.json({ success: true, data: { is_liked: true, isLiked: true, like_count: Number(countRows[0].count) } });
}

function normalizeReadingTask(row) {
  return {
    id: row.id,
    task_code: row.task_code,
    title: row.title,
    subject_code: row.subject_code,
    age_range: row.age_range,
    difficulty: row.difficulty,
    duration: row.duration,
    material: row.material,
    objective: row.objective,
    steps: row.steps ? String(row.steps).split(/\n+/).filter(Boolean) : [],
    parent_prompt: row.parent_prompt || '',
    content: row.content || '',
    image_url: row.image_url || '',
    icon_url: row.icon_url || '',
    cover_image: row.cover_image || '',
    audio_url: row.audio_url || '',
    video_url: row.video_url || '',
    tips: row.tips || '',
    example_answer: row.example_answer || '',
    status: row.status || 'pending',
    progress: row.progress || 0
  };
}

async function educationTasksTodayHandler(req, res) {
  const childId = Number(req.query.childId || 0);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const grade = String(req.query.grade || '').trim();
  const likeGrade = `%${grade || inferAgeRangeFromChild(child) || '3-4'}%`;
  const [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE t.age_range LIKE ?
     ORDER BY t.difficulty ASC, t.id ASC
     LIMIT 4`,
    [childId, likeGrade]
  );
  res.json({ success: true, data: { list: rows.map(normalizeReadingTask) } });
}

async function educationCompleteTaskHandler(req, res) {
  const childId = Number((req.body && req.body.child_id) || 0);
  if (!childId) {
    res.status(400).json({ success: false, message: 'child_id不能为空' });
    return;
  }
  const child = await getOwnedChild(getUserId(req), childId);
  if (!child) {
    res.status(403).json({ success: false, message: '无权操作该孩子的任务' });
    return;
  }
  await pool.execute(
    `INSERT INTO task_progress (child_id, task_id, status, progress, completed_at)
     VALUES (?, ?, 'completed', 100, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE status = 'completed', progress = 100, completed_at = CURRENT_TIMESTAMP`,
    [childId, req.params.id]
  );
  res.json({ success: true, data: { message: '任务已完成' } });
}

async function educationProgressOverviewHandler(req, res) {
  const childId = Number(req.query.childId || 0);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const [totalRows] = await pool.execute('SELECT COUNT(*) AS count FROM reading_tasks');
  const [completedRows] = await pool.execute('SELECT COUNT(*) AS count FROM task_progress WHERE child_id = ? AND status = ?', [childId, 'completed']);
  const totalTasks = Number(totalRows[0].count) || 0;
  const completedTasks = Number(completedRows[0].count) || 0;
  const masteryRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  res.json({
    success: true,
    data: {
      totalPoints: totalTasks * 10,
      masteredPoints: completedTasks * 10,
      learningPoints: Math.max(0, totalTasks - completedTasks) * 10,
      masteryRate
    }
  });
}

async function educationKnowledgeChaptersHandler(req, res) {
  const childId = Number(req.query.childId || 0);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const subjectCode = req.query.subjectCode || null;
  const grade = req.query.grade || null;
  const effectiveGrade = grade || inferAgeRangeFromChild(child) || null;
  const [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE (? IS NULL OR t.subject_code = ?)
       AND (? IS NULL OR t.age_range LIKE ?)
     ORDER BY t.difficulty ASC, t.id ASC`,
    [childId, subjectCode, subjectCode, effectiveGrade, effectiveGrade ? `%${effectiveGrade}%` : null]
  );
  const chaptersMap = new Map();
  for (const row of rows) {
    const chapterId = `${row.subject_code || 'general'}-${row.difficulty || 1}`;
    if (!chaptersMap.has(chapterId)) {
      chaptersMap.set(chapterId, {
        id: chapterId,
        name: `${row.subject_code || 'general'} Lv.${row.difficulty || 1}`,
        progress: 0,
        points: []
      });
    }
    chaptersMap.get(chapterId).points.push({
      id: row.task_code || String(row.id),
      task_id: row.id,
      name: row.title,
      title: row.title,
      status: row.status || 'pending',
      difficulty: row.difficulty || 1,
      progress: row.progress || 0,
      duration: row.duration,
      objective: row.objective
    });
  }
  const list = Array.from(chaptersMap.values()).map((chapter) => {
    const total = chapter.points.reduce((sum, point) => sum + (point.progress || 0), 0);
    chapter.progress = chapter.points.length ? Math.round(total / chapter.points.length) : 0;
    return chapter;
  });
  res.json({ success: true, data: { list } });
}

async function educationKnowledgeDetailHandler(req, res) {
  const pointId = String(req.query.pointId || '').trim();
  const subjectCode = req.query.subjectCode || null;
  const childId = Number(req.query.childId || 0);
  if (!pointId) {
    res.status(400).json({ success: false, message: 'pointId不能为空' });
    return;
  }
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE (t.task_code = ? OR CAST(t.id AS CHAR) = ?)
       AND (? IS NULL OR t.subject_code = ?)
     LIMIT 1`,
    [childId, pointId, pointId, subjectCode, subjectCode]
  );
  if (!rows.length) {
    res.status(404).json({ success: false, message: '知识点不存在' });
    return;
  }
  const row = rows[0];
  const keyPoints = String(row.steps || '').split(/\n+/).filter(Boolean).map((content, index) => ({ id: index + 1, content }));
  res.json({
    success: true,
    data: {
      id: row.task_code || String(row.id),
      task_id: row.id,
      name: row.title,
      title: row.title,
      status: row.status || 'pending',
      difficulty: row.difficulty || 1,
      progress: row.progress || 0,
      visual: {
        icon: row.icon_url || '',
        title: row.title,
        desc: row.objective || row.material || ''
      },
      explain: {
        title: row.title,
        content: row.content || row.objective || ''
      },
      keyPoints,
      difficulties: row.tips ? [{ id: 1, content: row.tips }] : [],
      examples: row.example_answer ? [{ id: 1, title: '参考答案', question: row.parent_prompt || row.objective || row.title, answer: row.example_answer, analysis: row.tips || '' }] : [],
      practices: [],
      material: row.material || '',
      objective: row.objective || '',
      parent_prompt: row.parent_prompt || '',
      duration: row.duration || 10,
      audio_url: row.audio_url || '',
      video_url: row.video_url || '',
      image_url: row.image_url || '',
      cover_image: row.cover_image || ''
    }
  });
}

function inferAgeRangeFromChild(child) {
  const birthday = child && child.birthday;
  if (!birthday) {
    return '';
  }
  const birthDate = new Date(`${birthday}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }
  const ageYears = Math.max(0, Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
  if (ageYears <= 3) {
    return '3-4岁';
  }
  if (ageYears === 4) {
    return '4-5岁';
  }
  if (ageYears === 5) {
    return '5-6岁';
  }
  if (ageYears <= 8) {
    return '6-9岁';
  }
  return '9-12岁';
}

async function educationUpdateProgressHandler(req, res) {
  const childId = Number(req.body.child_id || 0);
  const pointId = String(req.body.knowledge_point_id || '').trim();
  if (!childId || !pointId) {
    res.status(400).json({ success: false, message: 'child_id和knowledge_point_id不能为空' });
    return;
  }
  const child = await getOwnedChild(getUserId(req), childId);
  if (!child) {
    res.status(403).json({ success: false, message: '无权更新该孩子的学习进度' });
    return;
  }
  const [taskRows] = await pool.execute('SELECT id FROM reading_tasks WHERE task_code = ? OR CAST(id AS CHAR) = ? LIMIT 1', [pointId, pointId]);
  if (!taskRows.length) {
    res.status(404).json({ success: false, message: '知识点不存在' });
    return;
  }
  const normalizedStatus = req.body.status === 'mastered' ? 'completed' : (req.body.status || 'in_progress');
  const progress = Math.max(0, Math.min(100, Number(req.body.mastery_level) || 0));
  await pool.execute(
    `INSERT INTO task_progress (child_id, task_id, status, progress, completed_at)
     VALUES (?, ?, ?, ?, CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE NULL END)
     ON DUPLICATE KEY UPDATE status = VALUES(status), progress = VALUES(progress), completed_at = CASE WHEN VALUES(status) = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END`,
    [childId, taskRows[0].id, normalizedStatus, progress, normalizedStatus]
  );
  res.json({ success: true, data: { child_id: childId, knowledge_point_id: pointId, status: req.body.status || 'in_progress', mapped_status: normalizedStatus, mastery_level: progress } });
}

async function assessmentsListHandler(req, res) {
  const data = Object.keys(ASSESSMENT_META).map((code, index) => ({ id: index + 1, code, name: ASSESSMENT_META[code].name, description: `${ASSESSMENT_META[code].name}，用于家庭观察与训练建议。`, total_questions: ASSESSMENT_META[code].total_questions, duration: ASSESSMENT_META[code].duration, age_groups: ASSESSMENT_META[code].age_groups }));
  res.json({ success: true, data });
}

async function assessmentQuestionsHandler(req, res) {
  const code = req.params.code;
  const meta = ASSESSMENT_META[code];
  if (!meta) {
    res.status(404).json({ success: false, message: '观察工具不存在' });
    return;
  }
  res.json({ success: true, data: { assessment_code: code, age_group: req.query.age_group || '', questions: buildAssessmentQuestions(code) } });
}

function normalizeAssessmentLevel(percentage) {
  if (percentage >= 85) {
    return 'excellent';
  }
  if (percentage >= 70) {
    return 'good';
  }
  if (percentage >= 55) {
    return 'medium';
  }
  if (percentage >= 40) {
    return 'attention';
  }
  return 'intervention';
}

function normalizeLevelText(level) {
  const map = { excellent: '优秀', good: '良好', medium: '中等', attention: '需关注', intervention: '需干预' };
  return map[level] || level || '';
}

async function assessmentSubmitHandler(req, res) {
  const code = req.params.code;
  const childId = Number(req.body.child_id || 0);
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
  if (!childId || !answers.length) {
    res.status(400).json({ success: false, message: '参数错误：缺少必要字段' });
    return;
  }
  const child = await getOwnedChild(getUserId(req), childId);
  if (!child) {
    res.status(403).json({ success: false, message: '无权提交该孩子的评估记录' });
    return;
  }
  let totalScore = 0;
  const grouped = new Map();
  for (const answer of answers) {
    const value = Number(answer.value || 0);
    totalScore += value;
    const dimension = answer.dimension || 'general';
    if (!grouped.has(dimension)) {
      grouped.set(dimension, { score: 0, count: 0 });
    }
    grouped.get(dimension).score += value;
    grouped.get(dimension).count += 1;
  }
  const maxScore = answers.length * 3;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const level = normalizeAssessmentLevel(percentage);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO assessment_records (child_id, assessment_code, assessment_name, age_group, total_score, max_score, percentage, overall_level, elapsed_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [childId, code, (ASSESSMENT_META[code] && ASSESSMENT_META[code].name) || code, req.body.age_group || '', totalScore, maxScore, percentage, level, Number(req.body.elapsed_time || 0)]
    );
    for (const [dimension, info] of grouped.entries()) {
      const scoreRate = info.count > 0 ? Math.round((info.score / (info.count * 3)) * 100) : 0;
      await connection.execute(
        `INSERT INTO assessment_dimensions (record_id, dimension_name, score, score_rate, standard_score)
         VALUES (?, ?, ?, ?, ?)`,
        [result.insertId, dimension, info.score, scoreRate, scoreRate]
      );
    }
    await connection.commit();
    const [interpretationRows] = await pool.execute(
      `SELECT * FROM assessment_interpretations
       WHERE assessment_code = ? AND ? BETWEEN score_min AND score_max`,
      [code, percentage]
    );
    const [suggestionRows] = await pool.execute('SELECT * FROM assessment_suggestions WHERE assessment_code = ? AND level = ?', [code, level]);
    res.json({
      success: true,
      data: {
        record_id: result.insertId,
        id: result.insertId,
        assessment_code: code,
        assessment_type: code,
        assessment_name: (ASSESSMENT_META[code] && ASSESSMENT_META[code].name) || code,
        total_score: totalScore,
        overall_score: totalScore,
        max_score: maxScore,
        percentage,
        overall_level: level,
        overall_level_text: normalizeLevelText(level),
        dimension_scores: [],
        report_data: {
          interpretations: interpretationRows,
          suggestions: suggestionRows
        },
        interpretations: interpretationRows,
        suggestions: suggestionRows
      }
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function buildAssessmentRecord(record) {
  const [childRows] = await pool.execute('SELECT name FROM children WHERE id = ? LIMIT 1', [record.child_id]);
  const [dimensionRows] = await pool.execute('SELECT * FROM assessment_dimensions WHERE record_id = ?', [record.id]);
  const [interpretationRows] = await pool.execute(
    `SELECT * FROM assessment_interpretations
     WHERE assessment_code = ? AND ? BETWEEN score_min AND score_max`,
    [record.assessment_code, record.percentage || 0]
  );
  const [suggestionRows] = await pool.execute('SELECT * FROM assessment_suggestions WHERE assessment_code = ? AND level = ?', [record.assessment_code, record.overall_level]);
  return {
    ...record,
    assessment_type: record.assessment_code,
    assessment_name: record.assessment_name || ((ASSESSMENT_META[record.assessment_code] && ASSESSMENT_META[record.assessment_code].name) || record.assessment_code),
    child_name: childRows[0] ? childRows[0].name : '',
    overall_score: record.total_score,
    dimension_scores: dimensionRows.map((item) => ({ dimension_id: item.dimension_name, dimension_name: item.dimension_name, name: item.dimension_name, score: item.score, score_rate: item.score_rate, standard_score: item.standard_score })),
    report_data: { interpretations: interpretationRows, suggestions: suggestionRows },
    overall_level_text: normalizeLevelText(record.overall_level)
  };
}

async function assessmentResultHandler(req, res) {
  const [rows] = await pool.execute(
    `SELECT ar.* FROM assessment_records ar
     JOIN children c ON c.id = ar.child_id
     WHERE ar.id = ? AND c.user_id = ?
     LIMIT 1`,
    [req.params.id, getUserId(req)]
  );
  if (!rows.length) {
    res.status(404).json({ success: false, message: '评估记录不存在' });
    return;
  }
  res.json({ success: true, data: await buildAssessmentRecord(rows[0]) });
}

async function assessmentHistoryHandler(req, res) {
  const limit = Math.max(1, Math.min(50, Number(req.query.limit || 20)));
  const offset = Math.max(0, Number(req.query.offset || 0));
  const paginationClause = ` LIMIT ${limit} OFFSET ${offset}`;
  const params = [getUserId(req)];
  let whereClause = 'WHERE c.user_id = ?';
  if (req.query.child_id) {
    whereClause += ' AND ar.child_id = ?';
    params.push(req.query.child_id);
  }
  const [rows] = await pool.execute(
    `SELECT ar.* FROM assessment_records ar
     JOIN children c ON c.id = ar.child_id
     ${whereClause}
     ORDER BY ar.completed_at DESC
     ${paginationClause}`,
    params
  );
  const data = [];
  for (const row of rows) {
    data.push(await buildAssessmentRecord(row));
  }
  res.json({ success: true, data });
}

async function assessmentHistoryCountHandler(req, res) {
  const params = [getUserId(req)];
  let whereClause = 'WHERE c.user_id = ?';
  if (req.query.child_id) {
    whereClause += ' AND ar.child_id = ?';
    params.push(req.query.child_id);
  }
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count FROM assessment_records ar
     JOIN children c ON c.id = ar.child_id
     ${whereClause}`,
    params
  );
  res.json({ success: true, data: { count: Number(rows[0].count) || 0 } });
}

async function assessmentDeleteHandler(req, res) {
  const [rows] = await pool.execute(
    `SELECT ar.id FROM assessment_records ar
     JOIN children c ON c.id = ar.child_id
     WHERE ar.id = ? AND c.user_id = ?
     LIMIT 1`,
    [req.params.id, getUserId(req)]
  );
  if (!rows.length) {
    res.status(404).json({ success: false, message: '评估记录不存在' });
    return;
  }
  await pool.execute('DELETE FROM assessment_dimensions WHERE record_id = ?', [req.params.id]);
  await pool.execute('DELETE FROM assessment_records WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: '评估记录已删除' });
}
