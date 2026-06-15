const crypto = require('crypto');
const fs = require('fs');
const https = require('https');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { generateAIAnswer, getAIStatus } = require('../services/ai');
const {
  HOT_KEYWORDS,
  PARENTING_ARTICLES,
  READING_TASKS,
  ASSESSMENT_META,
  buildAssessmentQuestions,
  buildReadingPracticeExample
} = require('./content-seeds');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const API_PREFIXES = Array.from(new Set([API_PREFIX, '/api/v1']));
const ADMIN_API_PREFIX = process.env.ADMIN_API_PREFIX || '/admin-api/v1';
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET;
const WECHAT_PAY_HOST = 'api.mch.weixin.qq.com';
const REFERRAL_REWARD_DAYS = 7;
const REFERRAL_MAX_DAYS = 60;
const UNIFIED_PROMO_CODE = String(
  process.env.MEMBERSHIP_PROMO_CODE || process.env.UNIFIED_MEMBERSHIP_PROMO_CODE || 'zgxn'
).trim().toUpperCase();
const UNIFIED_PROMO_DAYS = Math.max(1, Number(process.env.MEMBERSHIP_PROMO_DAYS || 60) || 60);
const UNIFIED_PROMO_PLAN_CODE = 'promo_2month';
const UNIFIED_PROMO_MEMBERSHIP_TYPE = 'gift';
const UNIFIED_PROMO_TYPE = 'unified_membership_2month';
const NUTRITION_RECIPES = require('../nutrition-recipes.json');
const UPLOAD_ROOT = path.resolve(__dirname, '../../../uploads');
const AVATAR_UPLOAD_DIR = path.join(UPLOAD_ROOT, 'avatars');
const ADMIN_PORTAL_ROOT = path.resolve(__dirname, '../../../admin-portal');

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

const READING_TASK_MAP = READING_TASKS.reduce((acc, task) => {
  if (task && task.task_code) {
    acc[task.task_code] = task;
  }
  return acc;
}, {});

const READING_TASK_ALIAS_MAP = buildReadingTaskAliasMap();

function buildReadingTaskAliasMap() {
  const aliasMap = {};

  function registerCanonical(taskCode, aliases) {
    const canonical = READING_TASK_MAP[taskCode];
    if (!canonical) {
      return;
    }
    aliases.forEach((alias) => {
      aliasMap[alias] = canonical;
    });
  }

  ['34', '45', '56', '69', '912'].forEach((ageCode) => {
    registerCanonical(`read_${ageCode}_cover_guess`, [`read_${ageCode}_cover`, `read_${ageCode}_cover_guess`]);
    registerCanonical(`read_${ageCode}_fact_find`, [`read_${ageCode}_find`, `read_${ageCode}_fact`, `read_${ageCode}_fact_find`]);
    registerCanonical(`read_${ageCode}_sequence_story`, [`read_${ageCode}_sequence`, `read_${ageCode}_sequence_story`]);
    registerCanonical(`read_${ageCode}_emotion_clue`, [`read_${ageCode}_emotion`, `read_${ageCode}_emotion_clue`]);
    registerCanonical(`read_${ageCode}_cause_effect`, [`read_${ageCode}_cause`, `read_${ageCode}_reason`, `read_${ageCode}_cause_effect`]);
    registerCanonical(`read_${ageCode}_summary_sentence`, [`read_${ageCode}_retell`, `read_${ageCode}_summary`, `read_${ageCode}_summary_sentence`]);
  });

  registerCanonical('read_34_cover_guess', ['r1']);
  registerCanonical('read_34_fact_find', ['r2']);
  registerCanonical('read_45_sequence_story', ['r3']);
  registerCanonical('read_45_emotion_clue', ['r4']);
  registerCanonical('read_56_cause_effect', ['r5']);
  registerCanonical('read_56_summary_sentence', ['r6']);

  return aliasMap;
}

function inferReadingSemanticKey(row) {
  const text = [row.task_code, row.title, row.objective, row.material, row.parent_prompt, row.content]
    .map((item) => String(item || ''))
    .join(' ');

  if (/封面|主角|预测故事|读开头先猜/.test(text)) {
    return 'cover_guess';
  }
  if (/谁在哪里做什么|画面找一找|基础事实信息/.test(text)) {
    return 'fact_find';
  }
  if (/顺序|先后|接下来发生了什么/.test(text)) {
    return 'sequence_story';
  }
  if (/表情|心情|情绪/.test(text)) {
    return 'emotion_clue';
  }
  if (/因果|为什么会这样|原因和结果|原因/.test(text)) {
    return 'cause_effect';
  }
  if (/复述|一句话讲给别人听|概括/.test(text)) {
    return 'summary_sentence';
  }
  return '';
}

function findCanonicalReadingTask(row) {
  if (!row || !row.task_code) {
    return null;
  }
  if (READING_TASK_MAP[row.task_code]) {
    return READING_TASK_MAP[row.task_code];
  }
  if (READING_TASK_ALIAS_MAP[row.task_code]) {
    return READING_TASK_ALIAS_MAP[row.task_code];
  }

  const semanticKey = inferReadingSemanticKey(row);
  if (!semanticKey) {
    return null;
  }

  return READING_TASKS.find((task) => {
    return task.subject_code === row.subject_code
      && task.age_range === row.age_range
      && String(task.task_code || '').endsWith(`_${semanticKey}`);
  }) || null;
}

app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (req.originalUrl === `${API_PREFIX}/payment/notify`) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
app.use('/uploads', express.static(UPLOAD_ROOT));
app.use('/admin-console', express.static(ADMIN_PORTAL_ROOT));
app.get('/admin-console', adminPortalHandler);
app.get('/admin-console/*', adminPortalHandler);

app.get('/health', healthHandler);
for (const prefix of API_PREFIXES) {
  app.get(`${prefix}/health`, healthHandler);
  app.get(`${prefix}/runtime/config`, runtimeConfigHandler);
  app.post(`${prefix}/auth/login`, asyncHandler(loginHandler));
  app.post(`${prefix}/auth/refresh`, asyncHandler(refreshHandler));
  app.get(`${prefix}/auth/me`, authenticateToken, asyncHandler(meHandler));
  app.post(`${prefix}/auth/account-deletion`, authenticateToken, asyncHandler(accountDeletionHandler));
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
  app.post(`${prefix}/children/upload-avatar`, authenticateToken, asyncHandler(childAvatarUploadHandler));
  app.get(`${prefix}/children/:id`, authenticateToken, asyncHandler(childDetailHandler));
  app.put(`${prefix}/children/:id`, authenticateToken, asyncHandler(childrenUpdateHandler));
  app.put(`${prefix}/children/:id/set-default`, authenticateToken, asyncHandler(childrenSetDefaultHandler));
  app.delete(`${prefix}/children/:id`, authenticateToken, asyncHandler(childrenDeleteHandler));
  app.get(`${prefix}/daily-plan`, authenticateToken, asyncHandler(dailyPlanHandler));
  app.post(`${prefix}/daily-plan/complete`, authenticateToken, asyncHandler(dailyPlanCompleteHandler));
  app.get(`${prefix}/growth-records/daily`, authenticateToken, asyncHandler(growthRecordDailyHandler));
  app.post(`${prefix}/growth-records`, authenticateToken, asyncHandler(growthRecordUpsertHandler));
  app.get(`${prefix}/growth-records/history`, authenticateToken, asyncHandler(growthRecordHistoryHandler));
  app.get(`${prefix}/growth-records/summary`, authenticateToken, asyncHandler(growthRecordSummaryHandler));
  app.get(`${prefix}/weekly-summary`, authenticateToken, asyncHandler(weeklySummaryHandler));
  app.get(`${prefix}/search/scenes`, optionalAuthenticateToken, asyncHandler(sceneSearchTagsHandler));
  app.get(`${prefix}/search/solutions`, optionalAuthenticateToken, asyncHandler(sceneSearchSolutionsHandler));
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
  app.post(`${prefix}/kb/events/track`, authenticateToken, asyncHandler(kbEventTrackHandler));
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

app.post(`${ADMIN_API_PREFIX}/auth/login`, asyncHandler(adminLoginHandler));
app.get(`${ADMIN_API_PREFIX}/auth/me`, authenticateAdmin, asyncHandler(adminMeHandler));
app.get(`${ADMIN_API_PREFIX}/dashboard/overview`, authenticateAdmin, asyncHandler(adminDashboardOverviewHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/users/trends`, authenticateAdmin, asyncHandler(adminUserTrendsHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/revenue/trends`, authenticateAdmin, asyncHandler(adminRevenueTrendsHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/features/ranking`, authenticateAdmin, asyncHandler(adminFeatureRankingHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/content/ranking`, authenticateAdmin, asyncHandler(adminContentRankingHandler));
app.get(`${ADMIN_API_PREFIX}/insights/weekly`, authenticateAdmin, asyncHandler(adminWeeklyInsightsHandler));
app.get(`${ADMIN_API_PREFIX}/segments/:segmentKey/users`, authenticateAdmin, asyncHandler(adminSegmentUsersHandler));

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

function runtimeConfigHandler(req, res) {
  const aiStatus = getAIStatus();
  res.json({
    env_name: process.env.NODE_ENV || 'production',
    debug: process.env.NODE_ENV !== 'production',
    ai_chat_enabled: true,
    assessments_enabled: true,
    education_enabled: true,
    parenting_enabled: true,
    daily_plan_enabled: true,
    growth_record_enabled: true,
    weekly_summary_enabled: true,
    scene_search_enabled: true,
    multimodal_enabled: false,
    payment_enabled: false,
    ai_mock_fallback: false,
    ai_service_ready: aiStatus.configured,
    ai_provider: aiStatus.provider,
    ai_model: aiStatus.model,
    config_loaded: true
  });
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET || 'dev-niuniu-secret', { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function signAdminToken(payload) {
  return jwt.sign(payload, process.env.ADMIN_JWT_SECRET || JWT_SECRET || 'dev-niuniu-admin-secret', { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '12h' });
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) {
    res.status(401).json({ success: false, message: '未提供后台访问令牌' });
    return;
  }
  try {
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || JWT_SECRET || 'dev-niuniu-admin-secret');
    if (!decoded || decoded.tokenType !== 'admin') {
      res.status(403).json({ success: false, message: '后台访问令牌无效' });
      return;
    }
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, code: 'ADMIN_TOKEN_EXPIRED', message: '后台访问令牌无效或已过期' });
  }
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

function adminPortalHandler(req, res) {
  res.sendFile(path.join(ADMIN_PORTAL_ROOT, 'index.html'));
}

async function adminLoginHandler(req, res) {
  const username = String((req.body && req.body.username) || '').trim();
  const password = String((req.body && req.body.password) || '').trim();
  if (!username || !password) {
    res.status(400).json({ success: false, message: '请输入后台账号和密码' });
    return;
  }

  const [rows] = await pool.execute(
    'SELECT id, username, password_hash, display_name, role, status, last_login_at FROM admin_users WHERE username = ? LIMIT 1',
    [username]
  );
  if (!rows.length || rows[0].status !== 'active' || !verifyAdminPassword(password, rows[0].password_hash)) {
    res.status(401).json({ success: false, message: '后台账号或密码错误' });
    return;
  }

  await pool.execute('UPDATE admin_users SET last_login_at = NOW() WHERE id = ?', [rows[0].id]);
  res.json({
    success: true,
    data: {
      token: signAdminToken({ adminUserId: rows[0].id, username: rows[0].username, role: rows[0].role, tokenType: 'admin' }),
      admin: {
        id: rows[0].id,
        username: rows[0].username,
        display_name: rows[0].display_name || rows[0].username,
        role: rows[0].role,
        last_login_at: rows[0].last_login_at
      }
    }
  });
}

async function adminMeHandler(req, res) {
  const [rows] = await pool.execute(
    'SELECT id, username, display_name, role, status, last_login_at, created_at FROM admin_users WHERE id = ? LIMIT 1',
    [req.admin.adminUserId]
  );
  if (!rows.length) {
    res.status(404).json({ success: false, message: '后台账号不存在' });
    return;
  }
  res.json({ success: true, data: rows[0] });
}

async function adminDashboardOverviewHandler(req, res) {
  const [userRows] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM users) AS total_users,
       (SELECT COUNT(*) FROM users WHERE DATE(created_at) = CURDATE()) AS today_new_users,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE DATE(created_at) = CURDATE()) AS dau,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS wau,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS mau`
  );
  const [membershipRows] = await pool.execute(
    `SELECT
       COUNT(*) AS active_memberships,
       SUM(CASE WHEN membership_type = 'trial' THEN 1 ELSE 0 END) AS trial_memberships,
       SUM(CASE WHEN current_plan = 'month' THEN 1 ELSE 0 END) AS month_memberships,
       SUM(CASE WHEN current_plan = 'quarter' THEN 1 ELSE 0 END) AS quarter_memberships,
       SUM(CASE WHEN current_plan = 'year' THEN 1 ELSE 0 END) AS year_memberships
     FROM user_memberships
     WHERE current_end_date IS NOT NULL AND current_end_date >= NOW()`
  );
  const [paymentRows] = await pool.execute(
    `SELECT
       COUNT(*) AS paid_order_count,
       COUNT(DISTINCT user_id) AS paid_user_count,
       COALESCE(SUM(amount), 0) AS total_revenue,
       COALESCE(SUM(CASE WHEN DATE(paid_at) = CURDATE() THEN amount ELSE 0 END), 0) AS today_revenue,
       SUM(CASE WHEN DATE(paid_at) = CURDATE() THEN 1 ELSE 0 END) AS today_paid_order_count
      FROM payment_orders
      WHERE status = 'paid'`
  );
  const [familyRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_children,
       COUNT(DISTINCT user_id) AS families_with_children,
       COALESCE(AVG(child_count), 0) AS avg_children_per_family
      FROM (
        SELECT user_id, COUNT(*) AS child_count
          FROM children
         GROUP BY user_id
      ) grouped_children`
  );
  const [membershipStructureRows] = await pool.execute(
    `SELECT
       CASE
         WHEN membership_type = 'trial' THEN 'trial'
         WHEN current_plan = 'month' THEN 'month'
         WHEN current_plan = 'quarter' THEN 'quarter'
         WHEN current_plan = 'year' THEN 'year'
         ELSE 'other'
       END AS segment_key,
       COUNT(*) AS user_count
      FROM user_memberships
      WHERE current_end_date IS NOT NULL AND current_end_date >= NOW()
      GROUP BY segment_key`
  );
  const [childAgeRows] = await pool.execute(
    `SELECT age_bucket, COUNT(*) AS child_count
       FROM (
         SELECT CASE
           WHEN birthday IS NULL THEN 'unknown'
           WHEN TIMESTAMPDIFF(MONTH, birthday, CURDATE()) < 12 THEN '0-1'
           WHEN TIMESTAMPDIFF(MONTH, birthday, CURDATE()) < 24 THEN '1-2'
           WHEN TIMESTAMPDIFF(MONTH, birthday, CURDATE()) < 36 THEN '2-3'
           WHEN TIMESTAMPDIFF(MONTH, birthday, CURDATE()) < 48 THEN '3-4'
           WHEN TIMESTAMPDIFF(MONTH, birthday, CURDATE()) < 72 THEN '4-6'
           ELSE '6+'
         END AS age_bucket
         FROM children
       ) child_buckets
      GROUP BY age_bucket`
  );
  const [childGenderRows] = await pool.execute(
    `SELECT
       CASE
         WHEN gender IN ('male', 'boy', 'm', '男') THEN 'male'
         WHEN gender IN ('female', 'girl', 'f', '女') THEN 'female'
         ELSE 'unknown'
       END AS gender_key,
       COUNT(*) AS child_count
      FROM children
      GROUP BY gender_key`
  );
  const [funnelRows] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM users) AS registered_users,
       (SELECT COUNT(DISTINCT user_id) FROM children) AS profiled_families,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS active_users_30d,
       (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS order_users_30d,
       (SELECT COUNT(DISTINCT user_id) FROM payment_orders WHERE status = 'paid' AND COALESCE(paid_at, created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS paid_users_30d`
  );
  const [lifecycleRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN current_end_date IS NOT NULL AND current_end_date >= NOW() AND current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_in_7_days,
       SUM(CASE WHEN current_end_date IS NOT NULL AND current_end_date >= NOW() AND current_end_date < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS expiring_in_30_days,
       SUM(CASE WHEN current_end_date IS NOT NULL AND current_end_date >= NOW() AND auto_renew = 1 THEN 1 ELSE 0 END) AS auto_renew_on,
       SUM(CASE WHEN current_end_date IS NOT NULL AND current_end_date >= NOW() AND auto_renew = 0 THEN 1 ELSE 0 END) AS auto_renew_off,
       SUM(CASE WHEN membership_type = 'trial' AND current_end_date IS NOT NULL AND current_end_date >= NOW() THEN 1 ELSE 0 END) AS active_trials,
       SUM(CASE WHEN membership_type = 'trial' AND current_end_date IS NOT NULL AND current_end_date >= NOW() AND current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_trials
      FROM user_memberships`
  );
  const [ageFeatureRows] = await pool.execute(
    `SELECT
       child_profiles.age_bucket,
       ${buildFeatureKeySql('et')} AS feature_key,
       COUNT(DISTINCT et.user_id) AS user_count,
       COUNT(*) AS event_count
      FROM event_tracks et
      INNER JOIN (
        SELECT child_source.user_id,
               CASE
                 WHEN child_source.birthday IS NULL THEN 'unknown'
                 WHEN TIMESTAMPDIFF(MONTH, child_source.birthday, CURDATE()) < 12 THEN '0-1'
                 WHEN TIMESTAMPDIFF(MONTH, child_source.birthday, CURDATE()) < 24 THEN '1-2'
                 WHEN TIMESTAMPDIFF(MONTH, child_source.birthday, CURDATE()) < 36 THEN '2-3'
                 WHEN TIMESTAMPDIFF(MONTH, child_source.birthday, CURDATE()) < 48 THEN '3-4'
                 WHEN TIMESTAMPDIFF(MONTH, child_source.birthday, CURDATE()) < 72 THEN '4-6'
                 ELSE '6+'
               END AS age_bucket
          FROM (
            SELECT c.user_id,
                   COALESCE(MAX(CASE WHEN c.is_default = 1 THEN c.birthday END), MIN(c.birthday)) AS birthday
              FROM children c
             GROUP BY c.user_id
          ) child_source
     ) child_profiles
        ON child_profiles.user_id = et.user_id
     WHERE et.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       AND ${buildFeatureKeySql('et')} IS NOT NULL
     GROUP BY child_profiles.age_bucket, feature_key
     ORDER BY child_profiles.age_bucket ASC, user_count DESC, event_count DESC`
  );
  const [featureConversionRows] = await pool.execute(
    `SELECT
       feature_source.feature_key,
       COUNT(DISTINCT feature_source.user_id) AS feature_users,
       COUNT(DISTINCT paid_orders.user_id) AS paid_users
      FROM (
        SELECT DISTINCT et.user_id,
               ${buildFeatureKeySql('et')} AS feature_key
          FROM event_tracks et
         WHERE et.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           AND ${buildFeatureKeySql('et')} IS NOT NULL
      ) feature_source
      LEFT JOIN (
        SELECT DISTINCT user_id
          FROM payment_orders
         WHERE status = 'paid'
           AND COALESCE(paid_at, created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      ) paid_orders
        ON paid_orders.user_id = feature_source.user_id
     GROUP BY feature_source.feature_key
     ORDER BY feature_users DESC, paid_users DESC
     LIMIT 12`
  );
  const [segmentRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN COALESCE(payments.paid_order_count, 0) > 0 AND (COALESCE(payments.total_paid_amount, 0) >= 199 OR COALESCE(payments.paid_order_count, 0) >= 2) THEN 1 ELSE 0 END) AS high_value_paid_users,
       SUM(CASE WHEN memberships.current_end_date IS NOT NULL AND memberships.current_end_date >= NOW() AND memberships.current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) AND COALESCE(memberships.auto_renew, 0) = 0 THEN 1 ELSE 0 END) AS churn_risk_users,
       SUM(CASE WHEN COALESCE(payments.paid_order_count, 0) > 0 AND COALESCE(activity.active_14d, 0) = 0 THEN 1 ELSE 0 END) AS paid_low_activity_users,
       SUM(CASE WHEN COALESCE(activity.active_14d, 0) = 1 AND COALESCE(payments.paid_order_count, 0) = 0 THEN 1 ELSE 0 END) AS active_unpaid_users,
       SUM(CASE WHEN memberships.membership_type = 'trial' AND memberships.current_end_date IS NOT NULL AND memberships.current_end_date >= NOW() AND COALESCE(activity.active_7d, 0) = 1 THEN 1 ELSE 0 END) AS active_trial_users
      FROM users u
      LEFT JOIN (
        SELECT user_id,
               1 AS active_14d,
               MAX(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS active_7d
          FROM event_tracks
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY user_id
      ) activity
        ON activity.user_id = u.id
      LEFT JOIN (
        SELECT user_id,
               COUNT(*) AS paid_order_count,
               COALESCE(SUM(amount), 0) AS total_paid_amount
          FROM payment_orders
         WHERE status = 'paid'
         GROUP BY user_id
      ) payments
        ON payments.user_id = u.id
      LEFT JOIN user_memberships memberships
        ON memberships.user_id = u.id`
  );
  const [featureRows] = await pool.execute(
    `SELECT event_type, COUNT(*) AS count
       FROM event_tracks
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10`
  );

  const users = userRows[0] || {};
  const memberships = membershipRows[0] || {};
  const revenue = paymentRows[0] || {};
  const families = familyRows[0] || {};
  const totalUsers = Number(users.total_users || 0);
  const paidUserCount = Number(revenue.paid_user_count || 0);
  const activeMemberships = Number(memberships.active_memberships || 0);
  const familiesWithChildren = Number(families.families_with_children || 0);
  const totalChildren = Number(families.total_children || 0);
  const paidOrderCount = Number(revenue.paid_order_count || 0);
  const totalRevenue = Number(revenue.total_revenue || 0);
  const funnel = funnelRows[0] || {};
  const lifecycle = lifecycleRows[0] || {};
  const segments = segmentRows[0] || {};
  const funnelItems = [
    { key: 'registered', label: '注册用户', count: Number(funnel.registered_users || 0) },
    { key: 'active30d', label: '近30天活跃', count: Number(funnel.active_users_30d || 0) },
    { key: 'order30d', label: '近30天下单', count: Number(funnel.order_users_30d || 0) },
    { key: 'paid30d', label: '近30天支付', count: Number(funnel.paid_users_30d || 0) }
  ].map((item, index, source) => ({
    ...item,
    conversion_rate: index === 0 ? 100 : calculateRatio(item.count, source[index - 1].count),
    total_rate: calculateRatio(item.count, source[0].count)
  }));

  res.json({
    success: true,
    data: {
      users,
      memberships,
      revenue,
      family: {
        total_children: totalChildren,
        families_with_children: familiesWithChildren,
        avg_children_per_family: Number(families.avg_children_per_family || 0),
        child_profile_penetration: calculateRatio(familiesWithChildren, totalUsers)
      },
      operations: {
        active_membership_rate: calculateRatio(activeMemberships, totalUsers),
        paid_user_penetration: calculateRatio(paidUserCount, totalUsers),
        arppu: paidUserCount > 0 ? Number((totalRevenue / paidUserCount).toFixed(2)) : 0,
        average_order_value: paidOrderCount > 0 ? Number((totalRevenue / paidOrderCount).toFixed(2)) : 0
      },
      membership_structure: formatDistributionRows(membershipStructureRows, activeMemberships, {
        trial: '试用会员',
        month: '月会员',
        quarter: '季会员',
        year: '年会员',
        other: '其他会员'
      }),
      child_age_distribution: formatDistributionRows(childAgeRows, totalChildren, {
        '0-1': '0-1岁',
        '1-2': '1-2岁',
        '2-3': '2-3岁',
        '3-4': '3-4岁',
        '4-6': '4-6岁',
        '6+': '6岁以上',
        unknown: '年龄待补充'
      }, ['0-1', '1-2', '2-3', '3-4', '4-6', '6+', 'unknown']),
      child_gender_distribution: formatDistributionRows(childGenderRows, totalChildren, {
        male: '男孩',
        female: '女孩',
        unknown: '性别待补充'
      }, ['male', 'female', 'unknown']),
      conversion_funnel: funnelItems,
      membership_lifecycle: {
        expiring_in_7_days: Number(lifecycle.expiring_in_7_days || 0),
        expiring_in_30_days: Number(lifecycle.expiring_in_30_days || 0),
        auto_renew_on: Number(lifecycle.auto_renew_on || 0),
        auto_renew_off: Number(lifecycle.auto_renew_off || 0),
        active_trials: Number(lifecycle.active_trials || 0),
        expiring_trials: Number(lifecycle.expiring_trials || 0),
        auto_renew_on_rate: calculateRatio(lifecycle.auto_renew_on, activeMemberships),
        expiring_7_days_rate: calculateRatio(lifecycle.expiring_in_7_days, activeMemberships)
      },
      age_feature_preferences: formatAgeFeatureRows(ageFeatureRows),
      feature_conversion: featureConversionRows.map((row) => ({
        feature_key: row.feature_key || 'unknown',
        feature_users: Number(row.feature_users || 0),
        paid_users: Number(row.paid_users || 0),
        conversion_rate: calculateRatio(row.paid_users, row.feature_users)
      })),
      user_segments: buildUserSegments(segments, totalUsers),
      top_events_7d: featureRows,
      ai_status: getAIStatus()
    }
  });
}

function formatDistributionRows(rows, total, labelMap, orderedKeys) {
  const items = Array.isArray(rows) ? rows.map((row) => {
    const rawKey = row.segment_key || row.age_bucket || row.gender_key || 'unknown';
    const count = Number(row.user_count || row.child_count || row.count || 0);
    return {
      key: rawKey,
      label: labelMap[rawKey] || rawKey,
      count,
      percentage: calculateRatio(count, total)
    };
  }) : [];

  if (Array.isArray(orderedKeys) && orderedKeys.length) {
    const order = new Map(orderedKeys.map((key, index) => [key, index]));
    items.sort((left, right) => {
      const leftOrder = order.has(left.key) ? order.get(left.key) : Number.MAX_SAFE_INTEGER;
      const rightOrder = order.has(right.key) ? order.get(right.key) : Number.MAX_SAFE_INTEGER;
      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }
      return right.count - left.count;
    });
    return items;
  }

  return items.sort((left, right) => right.count - left.count);
}

function formatAgeFeatureRows(rows) {
  const ageLabelMap = {
    '0-1': '0-1岁',
    '1-2': '1-2岁',
    '2-3': '2-3岁',
    '3-4': '3-4岁',
    '4-6': '4-6岁',
    '6+': '6岁以上',
    unknown: '年龄待补充'
  };
  const featureLabelMap = {
    assessment: '成长测评',
    ai_chat: 'AI 问答',
    membership: '会员页',
    nutrition_recipe: '营养食谱',
    nutrition: '营养模块',
    parenting: '家长知识',
    knowledge: '知识卡片',
    reading_tasks: '阅读任务',
    education: '能力成长',
    share: '分享传播',
    unknown: '未标记功能'
  };
  const grouped = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const ageKey = row.age_bucket || 'unknown';
    const current = grouped.get(ageKey) || {
      age_key: ageKey,
      age_label: ageLabelMap[ageKey] || ageKey,
      items: []
    };
    current.items.push({
      feature_key: row.feature_key || 'unknown',
      feature_label: featureLabelMap[row.feature_key] || row.feature_key || 'unknown',
      user_count: Number(row.user_count || 0),
      event_count: Number(row.event_count || 0)
    });
    grouped.set(ageKey, current);
  }
  return Array.from(grouped.values())
    .map((group) => ({
      ...group,
      items: group.items.sort((left, right) => right.user_count - left.user_count || right.event_count - left.event_count).slice(0, 3)
    }))
    .sort((left, right) => {
      const order = ['0-1', '1-2', '2-3', '3-4', '4-6', '6+', 'unknown'];
      return order.indexOf(left.age_key) - order.indexOf(right.age_key);
    });
}

function buildUserSegments(row, totalUsers) {
  const definitions = getUserSegmentDefinitions().map((item) => ({
    ...item,
    count: Number(row[item.countField] || 0)
  }));
  return definitions.map((item) => ({
    key: item.key,
    label: item.label,
    description: item.description,
    count: item.count,
    percentage: calculateRatio(item.count, totalUsers)
  }));
}

function getUserSegmentDefinitions() {
  return [
    {
      key: 'high_value_paid',
      label: '高价值付费用户',
      description: '累计支付金额较高或已支付 2 单及以上，适合重点维系和转介绍。',
      countField: 'high_value_paid_users',
      sql: "COALESCE(payments.paid_order_count, 0) > 0 AND (COALESCE(payments.total_paid_amount, 0) >= 199 OR COALESCE(payments.paid_order_count, 0) >= 2)",
      orderBy: 'payments.total_paid_amount DESC, payments.paid_order_count DESC, COALESCE(activity.last_active_at, u.created_at) DESC, u.id DESC'
    },
    {
      key: 'churn_risk',
      label: '即将流失会员',
      description: '7 天内到期且未开启自动续费，适合重点召回。',
      countField: 'churn_risk_users',
      sql: "memberships.current_end_date IS NOT NULL AND memberships.current_end_date >= NOW() AND memberships.current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) AND COALESCE(memberships.auto_renew, 0) = 0",
      orderBy: 'memberships.current_end_date ASC, COALESCE(activity.last_active_at, u.created_at) DESC, u.id DESC'
    },
    {
      key: 'paid_low_activity',
      label: '低活跃付费用户',
      description: '已经付费，但近 14 天没有活跃行为，适合做使用唤醒。',
      countField: 'paid_low_activity_users',
      sql: 'COALESCE(payments.paid_order_count, 0) > 0 AND activity.last_active_at IS NULL',
      orderBy: 'payments.total_paid_amount DESC, memberships.current_end_date ASC, u.id DESC'
    },
    {
      key: 'active_unpaid',
      label: '高活跃未付费用户',
      description: '近 14 天活跃但还没有付费，适合做转化承接。',
      countField: 'active_unpaid_users',
      sql: 'activity.last_active_at IS NOT NULL AND COALESCE(payments.paid_order_count, 0) = 0',
      orderBy: 'activity.active_event_count_14d DESC, activity.last_active_at DESC, u.id DESC'
    },
    {
      key: 'active_trial',
      label: '活跃试用用户',
      description: '当前试用中且近 7 天活跃，适合做试用转付费。',
      countField: 'active_trial_users',
      sql: "memberships.membership_type = 'trial' AND memberships.current_end_date IS NOT NULL AND memberships.current_end_date >= NOW() AND activity.last_active_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)",
      orderBy: 'memberships.current_end_date ASC, activity.last_active_at DESC, u.id DESC'
    }
  ];
}

function getUserSegmentDefinition(segmentKey) {
  return getUserSegmentDefinitions().find((item) => item.key === segmentKey) || null;
}

function buildFeatureKeySql(alias) {
  const prefix = alias ? `${alias}.` : '';
  return `CASE
    WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${prefix}event_data, '$.module_key')), '') IS NOT NULL THEN JSON_UNQUOTE(JSON_EXTRACT(${prefix}event_data, '$.module_key'))
    WHEN ${prefix}event_type LIKE 'task_%' OR ${prefix}event_type = 'retell_complete' THEN 'reading_tasks'
    WHEN ${prefix}event_type LIKE 'ai_chat_%' THEN 'ai_chat'
    WHEN ${prefix}event_type LIKE 'assessment_%' THEN 'assessment'
    WHEN ${prefix}event_type LIKE 'recipe_%' THEN 'nutrition_recipe'
    WHEN ${prefix}event_type LIKE 'article_%' OR ${prefix}event_type LIKE 'knowledge_%' THEN 'knowledge'
    WHEN ${prefix}event_type LIKE 'membership_%' OR ${prefix}event_type LIKE 'payment_%' THEN 'membership'
    WHEN ${prefix}event_type LIKE 'share_%' THEN 'share'
    ELSE NULL
  END`;
}

function calculateRatio(part, total) {
  const numerator = Number(part || 0);
  const denominator = Number(total || 0);
  if (!denominator) {
    return 0;
  }
  return Number(((numerator / denominator) * 100).toFixed(2));
}

async function adminUserTrendsHandler(req, res) {
  const range = parseAdminDateRange(req.query, 14);
  const [rows] = await pool.execute(
    `SELECT stat_date, new_users, active_users, paid_active_users, trial_users, ai_users, content_users
       FROM admin_daily_user_stats
      WHERE stat_date BETWEEN ? AND ?
      ORDER BY stat_date ASC`,
    [range.startDate, range.endDate]
  );
  res.json({ success: true, data: { range, items: rows } });
}

async function adminRevenueTrendsHandler(req, res) {
  const range = parseAdminDateRange(req.query, 14);
  const [rows] = await pool.execute(
    `SELECT stat_date, paid_users, new_paid_users, order_count, paid_order_count, revenue_amount, month_membership_count, quarter_membership_count, year_membership_count
       FROM admin_daily_revenue_stats
      WHERE stat_date BETWEEN ? AND ?
      ORDER BY stat_date ASC`,
    [range.startDate, range.endDate]
  );
  res.json({ success: true, data: { range, items: rows } });
}

async function adminFeatureRankingHandler(req, res) {
  const range = parseAdminDateRange(req.query, 14);
  const limit = clampAdminLimit(req.query.limit, 20);
  const [rows] = await pool.execute(
    `SELECT feature_key,
            SUM(view_count) AS view_count,
            SUM(click_count) AS click_count,
            SUM(start_count) AS start_count,
            SUM(complete_count) AS complete_count,
            SUM(paywall_visit_count) AS paywall_visit_count,
            SUM(membership_conversion_count) AS membership_conversion_count
       FROM admin_daily_feature_stats
      WHERE stat_date BETWEEN ? AND ?
      GROUP BY feature_key
      ORDER BY view_count DESC, click_count DESC, start_count DESC
      LIMIT ${limit}`,
    [range.startDate, range.endDate]
  );
  res.json({ success: true, data: { range, items: rows } });
}

async function adminContentRankingHandler(req, res) {
  const range = parseAdminDateRange(req.query, 14);
  const limit = clampAdminLimit(req.query.limit, 20);
  const contentType = String(req.query.content_type || '').trim();
  const filters = ['stat_date BETWEEN ? AND ?'];
  const params = [range.startDate, range.endDate];
  if (contentType) {
    filters.push('content_type = ?');
    params.push(contentType);
  }
  const [rows] = await pool.execute(
    `SELECT content_type,
            content_id,
            MAX(title) AS title,
            SUM(view_count) AS view_count,
            SUM(favorite_count) AS favorite_count,
            SUM(like_count) AS like_count,
            SUM(comment_count) AS comment_count,
            SUM(completion_count) AS completion_count
       FROM admin_daily_content_stats
      WHERE ${filters.join(' AND ')}
      GROUP BY content_type, content_id
      ORDER BY view_count DESC, completion_count DESC, favorite_count DESC
      LIMIT ${limit}`,
    params
  );
  res.json({ success: true, data: { range, content_type: contentType || null, items: rows } });
}

async function adminWeeklyInsightsHandler(req, res) {
  const range = parseAdminDateRange(req.query, 7);
  const [featureRows] = await pool.execute(
    `SELECT feature_key,
            SUM(view_count) AS view_count,
            SUM(click_count) AS click_count,
            SUM(start_count) AS start_count,
            SUM(complete_count) AS complete_count,
            SUM(membership_conversion_count) AS membership_conversion_count
       FROM admin_daily_feature_stats
      WHERE stat_date BETWEEN ? AND ?
      GROUP BY feature_key
      ORDER BY view_count DESC, click_count DESC, start_count DESC`,
    [range.startDate, range.endDate]
  );
  const [contentRows] = await pool.execute(
    `SELECT content_type,
            content_id,
            MAX(title) AS title,
            SUM(view_count) AS view_count,
            SUM(completion_count) AS completion_count,
            SUM(favorite_count) AS favorite_count
       FROM admin_daily_content_stats
      WHERE stat_date BETWEEN ? AND ?
      GROUP BY content_type, content_id
      ORDER BY view_count DESC, completion_count ASC, favorite_count DESC`,
    [range.startDate, range.endDate]
  );
  const [contentUserRows] = await pool.execute(
    `SELECT SUM(content_users) AS content_users
       FROM admin_daily_user_stats
      WHERE stat_date BETWEEN ? AND ?`,
    [range.startDate, range.endDate]
  );
  const [contentCoverageRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_content_events,
       SUM(
         CASE
           WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.content_type')), '') IS NOT NULL
            AND NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.content_id')), '') IS NOT NULL
           THEN 1 ELSE 0
         END
       ) AS content_events_with_detail
      FROM event_tracks
     WHERE created_at >= ?
       AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND event_type IN ('article_detail_view', 'knowledge_detail_view', 'recipe_detail_view', 'task_start', 'task_complete', 'retell_complete')`,
    [range.startDate, range.endDate]
  );
  const [contentMissingRows] = await pool.execute(
    `SELECT event_type, COUNT(*) AS missing_count
       FROM event_tracks
      WHERE created_at >= ?
        AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND event_type IN ('article_detail_view', 'knowledge_detail_view', 'recipe_detail_view', 'task_start', 'task_complete', 'retell_complete')
        AND (
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.content_type')), '') IS NULL
          OR NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.content_id')), '') IS NULL
        )
      GROUP BY event_type
      ORDER BY missing_count DESC, event_type ASC
      LIMIT 3`,
    [range.startDate, range.endDate]
  );
  const [lifecycleRows] = await pool.execute(
    `SELECT
       SUM(CASE WHEN membership_type = 'trial' AND current_end_date IS NOT NULL AND current_end_date >= NOW() AND current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS expiring_trials,
       SUM(CASE WHEN current_end_date IS NOT NULL AND current_end_date >= NOW() AND current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY) AND COALESCE(auto_renew, 0) = 0 THEN 1 ELSE 0 END) AS expiring_no_renew,
       SUM(CASE WHEN current_end_date IS NOT NULL AND current_end_date >= NOW() THEN 1 ELSE 0 END) AS active_memberships
      FROM user_memberships`
  );

  const cards = buildWeeklyInsightCards(
    featureRows,
    contentRows,
    Object.assign({}, contentUserRows[0] || {}, contentCoverageRows[0] || {}, { missing_detail_breakdown: contentMissingRows || [] }),
    lifecycleRows[0] || {},
    range
  );
  res.json({ success: true, data: { range, cards } });
}

function buildWeeklyInsightCards(featureRows, contentRows, contentSummary, lifecycle, range) {
  const cards = [];
  const featureLabels = {
    assessment: '成长测评',
    ai_chat: 'AI 问答',
    membership: '会员页',
    nutrition_recipe: '营养食谱',
    nutrition: '营养模块',
    parenting: '家长知识',
    knowledge: '知识卡片',
    reading_tasks: '阅读任务',
    education: '能力成长',
    share: '分享传播'
  };
  const featureCandidates = (Array.isArray(featureRows) ? featureRows : [])
    .map((row) => {
      const rawFeatureKey = String(row.feature_key || '').trim();
      const featureKey = rawFeatureKey === 'unknown' ? '' : rawFeatureKey;
      return {
        feature_key: featureKey || 'unknown',
        feature_label: featureLabels[featureKey] || (featureKey ? featureKey : '未标记功能'),
        is_known_feature: Boolean(featureLabels[featureKey]),
        view_count: Number(row.view_count || 0),
        conversion_count: Number(row.membership_conversion_count || 0),
        conversion_rate: calculateRatio(row.membership_conversion_count, row.view_count)
      };
    });
  const labeledFeatureCandidates = featureCandidates.filter((item) => item.is_known_feature);

  const lowConversionFeatureSelection = pickWeeklyInsightCandidate(
    labeledFeatureCandidates.length ? labeledFeatureCandidates : featureCandidates,
    'conversion_rate'
  );
  const lowConversionFeature = lowConversionFeatureSelection && lowConversionFeatureSelection.item;

  if (lowConversionFeature) {
    cards.push({
      key: 'feature_low_conversion',
      title: '高流量低转化功能',
      priority: lowConversionFeature.conversion_rate < 5 || lowConversionFeatureSelection.isLowSample ? 'high' : 'medium',
      summary: `${lowConversionFeature.feature_label} 近一周浏览 ${lowConversionFeature.view_count} 次，会员转化 ${lowConversionFeature.conversion_count} 次。`,
      metric: `${lowConversionFeature.conversion_rate.toFixed(2)}%`,
      metric_label: '浏览转会员转化率',
      recommendation: `优先检查 ${lowConversionFeature.feature_label} 到会员页之间的承接文案、按钮位置和权益说明。`,
      evidence: `${lowConversionFeatureSelection.isLowSample ? '当前样本偏少，建议结合后续 7 天继续观察。' : '统计区间 ' + range.startDate + ' 至 ' + range.endDate}`
    });
  }

  const lowCompletionContentSelection = pickWeeklyInsightCandidate(
    (Array.isArray(contentRows) ? contentRows : [])
    .map((row) => ({
      title: row.title || `${row.content_type || 'content'}:${row.content_id || '-'}`,
      view_count: Number(row.view_count || 0),
      completion_count: Number(row.completion_count || 0),
      favorite_count: Number(row.favorite_count || 0),
      completion_rate: calculateRatio(row.completion_count, row.view_count)
    })),
    'completion_rate'
  );
  const lowCompletionContent = lowCompletionContentSelection && lowCompletionContentSelection.item;

  if (lowCompletionContent) {
    cards.push({
      key: 'content_low_completion',
      title: '高浏览低完成内容',
      priority: lowCompletionContent.completion_rate < 20 || lowCompletionContentSelection.isLowSample ? 'high' : 'medium',
      summary: `${lowCompletionContent.title} 近一周浏览 ${lowCompletionContent.view_count} 次，完成 ${lowCompletionContent.completion_count} 次。`,
      metric: `${lowCompletionContent.completion_rate.toFixed(2)}%`,
      metric_label: '内容完成率',
      recommendation: '优先缩短首屏内容长度，强化关键结论前置和收藏引导。',
      evidence: `${lowCompletionContentSelection.isLowSample ? '当前样本偏少，建议结合收藏和后续浏览继续观察。' : '收藏 ' + lowCompletionContent.favorite_count + ' 次'}`
    });
  } else {
    const totalContentEvents = Number(contentSummary.total_content_events || 0);
    const contentEventsWithDetail = Number(contentSummary.content_events_with_detail || 0);
    const contentDetailCoverage = calculateRatio(contentEventsWithDetail, totalContentEvents);
    const missingDetailBreakdown = Array.isArray(contentSummary.missing_detail_breakdown) ? contentSummary.missing_detail_breakdown : [];
    const missingDetailSummary = missingDetailBreakdown.length
      ? '缺失最多的是 ' + missingDetailBreakdown.map((item) => `${item.event_type}(${Number(item.missing_count || 0)})`).join('、') + '。'
      : `统计区间 ${range.startDate} 至 ${range.endDate}。`;
    cards.push({
      key: 'content_low_completion',
      title: '高浏览低完成内容',
      priority: Number(contentSummary.content_users || 0) > 0 ? 'medium' : 'low',
      summary: `近一周有 ${Number(contentSummary.content_users || 0)} 位内容用户，内容相关事件 ${totalContentEvents} 次，其中 ${contentEventsWithDetail} 次带有可分析明细。`,
      metric: `${contentDetailCoverage.toFixed(2)}%`,
      metric_label: '内容埋点明细覆盖率',
      recommendation: '优先补齐内容浏览与完成埋点中的 content_type 和 content_id，随后继续观察具体内容完成率。',
      evidence: `当前仍有 ${Math.max(totalContentEvents - contentEventsWithDetail, 0)} 次内容事件缺少明细。${missingDetailSummary}`
    });
  }

  const expiringNoRenew = Number(lifecycle.expiring_no_renew || 0);
  const expiringTrials = Number(lifecycle.expiring_trials || 0);
  const activeMemberships = Number(lifecycle.active_memberships || 0);
  cards.push({
    key: 'membership_recall',
    title: '会员到期召回提醒',
    priority: expiringNoRenew > 0 ? 'high' : 'medium',
    summary: `未来 7 天内有 ${expiringNoRenew} 位有效会员即将到期且未开启自动续费，另有 ${expiringTrials} 位试用用户临近结束。`,
    metric: `${calculateRatio(expiringNoRenew, activeMemberships).toFixed(2)}%`,
    metric_label: '近到期会员占比',
    recommendation: '优先触达到期前 3 天的用户，突出续费权益和已解锁能力内容。',
    evidence: `当前有效会员 ${activeMemberships} 位`
  });

  return cards;
}

function pickWeeklyInsightCandidate(items, rateKey) {
  const candidates = (Array.isArray(items) ? items : []).filter((item) => Number(item.view_count || 0) > 0);
  if (!candidates.length) {
    return null;
  }
  const sortCandidates = (rows) => rows.slice().sort((left, right) => right.view_count - left.view_count || Number(left[rateKey] || 0) - Number(right[rateKey] || 0));
  const highSample = candidates.filter((item) => item.view_count >= 20);
  if (highSample.length) {
    return { item: sortCandidates(highSample)[0], isLowSample: false };
  }
  const mediumSample = candidates.filter((item) => item.view_count >= 5);
  if (mediumSample.length) {
    return { item: sortCandidates(mediumSample)[0], isLowSample: true };
  }
  return { item: sortCandidates(candidates)[0], isLowSample: true };
}

async function adminSegmentUsersHandler(req, res) {
  const definition = getUserSegmentDefinition(String(req.params.segmentKey || '').trim());
  if (!definition) {
    res.status(404).json({ success: false, message: '用户分层不存在' });
    return;
  }

  const limit = clampAdminLimit(req.query.limit, 20);
  const expiringOnly = normalizeBooleanQuery(req.query.expiring_only || req.query.expiringOnly);
  const highActivityOnly = normalizeBooleanQuery(req.query.high_activity_only || req.query.highActivityOnly);
  const filters = [definition.sql];
  if (expiringOnly) {
    filters.push("memberships.current_end_date IS NOT NULL AND memberships.current_end_date >= NOW() AND memberships.current_end_date < DATE_ADD(NOW(), INTERVAL 7 DAY)");
  }
  if (highActivityOnly) {
    filters.push('COALESCE(activity.active_event_count_14d, 0) >= 10');
  }
  const [rows] = await pool.execute(
    `SELECT
       u.id,
       u.nickname,
       u.created_at,
       child_profile.child_name,
       child_profile.age_label,
       child_profile.gender,
       memberships.membership_type,
       memberships.current_plan,
       memberships.current_end_date,
       memberships.auto_renew,
       COALESCE(payments.total_paid_amount, 0) AS total_paid_amount,
       COALESCE(payments.paid_order_count, 0) AS paid_order_count,
       activity.last_active_at,
       COALESCE(activity.active_event_count_14d, 0) AS active_event_count_14d
      FROM users u
      LEFT JOIN (
        SELECT user_id,
               COUNT(*) AS paid_order_count,
               COALESCE(SUM(amount), 0) AS total_paid_amount
          FROM payment_orders
         WHERE status = 'paid'
         GROUP BY user_id
      ) payments ON payments.user_id = u.id
      LEFT JOIN user_memberships memberships ON memberships.user_id = u.id
      LEFT JOIN (
        SELECT et.user_id,
               MAX(et.created_at) AS last_active_at,
               COUNT(*) AS active_event_count_14d
          FROM event_tracks et
         WHERE et.created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY)
         GROUP BY et.user_id
      ) activity ON activity.user_id = u.id
      LEFT JOIN (
        SELECT source.user_id,
               source.child_name,
               source.gender,
               CASE
                 WHEN source.birthday IS NULL THEN '年龄待补充'
                 WHEN TIMESTAMPDIFF(MONTH, source.birthday, CURDATE()) < 12 THEN '0-1岁'
                 WHEN TIMESTAMPDIFF(MONTH, source.birthday, CURDATE()) < 24 THEN '1-2岁'
                 WHEN TIMESTAMPDIFF(MONTH, source.birthday, CURDATE()) < 36 THEN '2-3岁'
                 WHEN TIMESTAMPDIFF(MONTH, source.birthday, CURDATE()) < 48 THEN '3-4岁'
                 WHEN TIMESTAMPDIFF(MONTH, source.birthday, CURDATE()) < 72 THEN '4-6岁'
                 ELSE '6岁以上'
               END AS age_label
          FROM (
            SELECT c.user_id,
                   COALESCE(MAX(CASE WHEN c.is_default = 1 THEN c.name END), MAX(c.name), '') AS child_name,
                   COALESCE(MAX(CASE WHEN c.is_default = 1 THEN c.gender END), MAX(c.gender), 'unknown') AS gender,
                   COALESCE(MAX(CASE WHEN c.is_default = 1 THEN c.birthday END), MIN(c.birthday)) AS birthday
              FROM children c
             GROUP BY c.user_id
          ) source
      ) child_profile ON child_profile.user_id = u.id
      WHERE ${filters.join(' AND ')}
      ORDER BY ${definition.orderBy}
      LIMIT ${limit}`
  );

  res.json({
    success: true,
    data: {
      segment: {
        key: definition.key,
        label: definition.label,
        description: definition.description
      },
      filters: {
        expiring_only: expiringOnly,
        high_activity_only: highActivityOnly,
        limit
      },
      items: rows.map((row) => ({
        id: row.id,
        nickname: row.nickname || `用户${row.id}`,
        child_name: row.child_name || '',
        child_age_label: row.age_label || '年龄待补充',
        child_gender: row.gender || 'unknown',
        membership_type: row.membership_type || 'free',
        current_plan: row.current_plan || 'free',
        current_end_date: row.current_end_date || null,
        auto_renew: Number(row.auto_renew || 0) === 1,
        total_paid_amount: Number(row.total_paid_amount || 0),
        paid_order_count: Number(row.paid_order_count || 0),
        last_active_at: row.last_active_at || null,
        active_event_count_14d: Number(row.active_event_count_14d || 0),
        created_at: row.created_at || null,
        suggested_action: buildSegmentUserSuggestedAction(definition.key, row),
        action_priority: buildSegmentUserActionPriority(definition.key, row)
      }))
    }
  });
}

function normalizeBooleanQuery(value) {
  const text = String(value || '').trim().toLowerCase();
  return text === '1' || text === 'true' || text === 'yes' || text === 'on';
}

function buildSegmentUserSuggestedAction(segmentKey, row) {
  const amount = Number(row.total_paid_amount || 0);
  const activeEvents = Number(row.active_event_count_14d || 0);
  const autoRenew = Number(row.auto_renew || 0) === 1;
  if (segmentKey === 'high_value_paid') {
    return amount >= 500 ? '安排高价值会员回访，优先引导转介绍或续费升级。' : '推送专属陪跑内容，强化会员价值感知。';
  }
  if (segmentKey === 'churn_risk') {
    return autoRenew ? '发送续费价值提醒，强调持续使用收益。' : '优先发送到期召回提醒，并附带续费权益说明。';
  }
  if (segmentKey === 'paid_low_activity') {
    return '推送孩子年龄匹配的任务或测评，拉回使用频次。';
  }
  if (segmentKey === 'active_unpaid') {
    return activeEvents >= 15 ? '优先推荐试用转会员权益，承接高意向用户。' : '结合最近活跃模块推送限时会员权益。';
  }
  if (segmentKey === 'active_trial') {
    return '围绕试用即将结束场景推送正式会员转化提醒。';
  }
  return '结合最近活跃行为安排精细化触达。';
}

function buildSegmentUserActionPriority(segmentKey, row) {
  const amount = Number(row.total_paid_amount || 0);
  const activeEvents = Number(row.active_event_count_14d || 0);
  if (segmentKey === 'churn_risk') {
    return 'high';
  }
  if (segmentKey === 'high_value_paid' && amount >= 500) {
    return 'high';
  }
  if ((segmentKey === 'active_unpaid' || segmentKey === 'active_trial') && activeEvents >= 15) {
    return 'high';
  }
  return 'medium';
}

function parseAdminDateRange(query, defaultDays) {
  const days = Math.max(1, Math.min(Number(query.days || defaultDays || 14), 90));
  const endDate = normalizeDateInput(query.end_date || query.endDate) || formatDateOnly(new Date());
  const startDate = normalizeDateInput(query.start_date || query.startDate) || formatDateOnly(new Date(Date.parse(`${endDate}T00:00:00Z`) - (days - 1) * 86400000));
  return { startDate, endDate, days };
}

function normalizeDateInput(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return '';
  }
  return text;
}

function formatDateOnly(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function clampAdminLimit(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.min(parsed, 100));
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
  const fallbackAnswer = buildChatAnswer(message, intent, references);
  const aiResult = await generateAIAnswer(buildChatPrompt(message, intent, references), {
    systemPrompt: getChatSystemPrompt(intent),
    temperature: 0.6,
    maxTokens: 900
  });
  const answer = aiResult.success ? aiResult.answer : fallbackAnswer;
  const aiStatus = getAIStatus();

  res.json({
    success: true,
    data: {
      answer,
      sources: references.map((item) => item.title).slice(0, 5),
      session_id: sessionId,
      intent,
      answer_source: aiResult.success ? 'ai' : 'seed_knowledge',
      ai_status: aiStatus,
      fallback_reason: aiResult.success ? null : aiResult.code || null
    }
  });
}

function getChatSystemPrompt(intent) {
  const prompts = {
    nutrition: '你是小牛育儿AI助理中的儿童营养与喂养顾问。回答要结合年龄、家庭执行成本和连续观察方法，优先给家长能当场执行的建议。',
    reading: '你是小牛育儿AI助理中的能力成长顾问。回答要围绕阅读理解、表达沟通、逻辑思维和家庭共练，优先给短时高频的训练建议。',
    emotion: '你是小牛育儿AI助理中的儿童情绪支持顾问。回答要先稳定家庭回应，再给可执行的情绪引导步骤。',
    focus: '你是小牛育儿AI助理中的专注力支持顾问。回答要关注场景拆解、家长提示语和任务节奏控制。',
    assessment: '你是小牛育儿AI助理中的成长观察解读顾问。回答要帮助家长先厘清表现，再建议合适的观察方向和训练重点。',
    general: '你是小牛育儿AI助理。回答要专业、温和、可执行，优先给家长能在家庭场景里立刻开始的下一步。'
  };
  return prompts[intent] || prompts.general;
}

function buildChatPrompt(message, intent, references) {
  const referenceBlock = references.length
    ? references.map((item, index) => `${index + 1}. ${item.title}\n${String(item.content || '').slice(0, 220)}`).join('\n\n')
    : '当前没有直接匹配的知识库条目，请基于儿童发展与家庭养育常识给出稳妥建议。';

  return [
    `用户问题：${message}`,
    `问题类型：${intent}`,
    '回答要求：',
    '1. 先给判断，再给家庭可执行方案。',
    '2. 优先使用清晰短句和分步骤建议。',
    '3. 当问题涉及就医、发育异常或持续恶化时，明确提醒线下咨询专业人士。',
    '4. 不编造产品能力，不输出无法执行的空泛表述。',
    '参考资料：',
    referenceBlock
  ].join('\n\n');
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
      current_end_date: isActive && membership.current_end_date ? new Date(membership.current_end_date).toISOString() : null,
      is_trial_used: !!membership.is_trial_used,
      promo_enabled: !!UNIFIED_PROMO_CODE,
      promo_benefit_text: `输入统一兑换码可领取${Math.round(UNIFIED_PROMO_DAYS / 30)}个月会员`,
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

async function extendMembership(connection, userId, days, payMethod, options) {
  const config = Object.assign({
    planCode: 'reward',
    membershipType: 'reward',
    autoRenew: 1,
    preserveAutoRenew: false,
    preservePlanIfActive: false,
    orderNo: null
  }, options || {});
  const [memberships] = await connection.execute(
    'SELECT current_plan, membership_type, current_end_date, status, auto_renew FROM user_memberships WHERE user_id = ? FOR UPDATE',
    [userId]
  );
  const now = new Date();
  let endDate = now;
  let autoRenew = Number(config.autoRenew) ? 1 : 0;
  let planCode = config.planCode;
  let membershipType = config.membershipType;
  if (memberships.length && memberships[0].status === 'active' && memberships[0].current_end_date) {
    const currentEndDate = new Date(memberships[0].current_end_date);
    if (currentEndDate > now) {
      endDate = currentEndDate;
    }
    if (config.preservePlanIfActive) {
      planCode = memberships[0].current_plan || planCode;
      membershipType = memberships[0].membership_type || membershipType;
    }
  }
  if (config.preserveAutoRenew && memberships.length) {
    autoRenew = Number(memberships[0].auto_renew) ? 1 : 0;
  }
  endDate.setDate(endDate.getDate() + days);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, auto_renew, pay_method, order_no) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
    [userId, planCode, 'active', endDate, autoRenew, payMethod, config.orderNo]
  );
  await connection.execute(
    `INSERT INTO user_memberships (user_id, current_plan, current_end_date, membership_type, status, auto_renew)
     VALUES (?, ?, ?, ?, 'active', ?)
     ON DUPLICATE KEY UPDATE current_plan = VALUES(current_plan), current_end_date = VALUES(current_end_date), membership_type = VALUES(membership_type), status = 'active', auto_renew = VALUES(auto_renew)`,
    [userId, planCode, endDate, membershipType, autoRenew]
  );
  return endDate;
}

async function trialHandler(req, res) {
  const membership = await getMembership(req.user.userId);
  if (membership.is_trial_used) {
    res.json({ success: true, data: { activated: false, reason: 'trial_already_used' } });
    return;
  }
  const isActive = membership.status === 'active'
    && membership.current_end_date
    && new Date(membership.current_end_date).getTime() > Date.now();
  if (isActive) {
    res.json({ success: true, data: { activated: false, reason: 'active_membership_exists' } });
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
  const code = String(req.body.code || '').trim().toUpperCase();
  if (!code) {
    res.status(400).json({ success: false, message: '请输入兑换码' });
    return;
  }
  if (!UNIFIED_PROMO_CODE) {
    res.status(503).json({ success: false, message: '兑换码功能暂未开放' });
    return;
  }
  if (code !== UNIFIED_PROMO_CODE) {
    res.status(400).json({ success: false, message: '兑换码无效' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [usedRows] = await connection.execute(
      `SELECT id
       FROM promo_code_redemptions
       WHERE promo_code = ? AND user_id = ?
       LIMIT 1
       FOR UPDATE`,
      [code, req.user.userId]
    );
    if (usedRows.length) {
      await connection.rollback();
      res.status(409).json({ success: false, message: '当前账号已兑换过该礼包' });
      return;
    }

    const endDate = await extendMembership(connection, req.user.userId, UNIFIED_PROMO_DAYS, 'promo_code', {
      planCode: UNIFIED_PROMO_PLAN_CODE,
      membershipType: UNIFIED_PROMO_MEMBERSHIP_TYPE,
      preserveAutoRenew: true,
      preservePlanIfActive: true,
      autoRenew: 0,
      orderNo: `${UNIFIED_PROMO_TYPE}_${req.user.userId}_${Date.now()}`
    });
    await connection.execute(
      `INSERT INTO promo_code_redemptions (promo_code, user_id, promo_type, reward_days, redeemed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [code, req.user.userId, UNIFIED_PROMO_TYPE, UNIFIED_PROMO_DAYS]
    );
    await connection.commit();
    res.json({
      success: true,
      data: {
        activated: true,
        duration_days: UNIFIED_PROMO_DAYS,
        current_end_date: endDate.toISOString(),
        message: `兑换成功，已到账${Math.round(UNIFIED_PROMO_DAYS / 30)}个月会员`
      }
    });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
  await ensureAdminBootstrapUser();
  await fs.promises.mkdir(AVATAR_UPLOAD_DIR, { recursive: true });
  app.listen(PORT, HOST, () => {
    console.log(`[niuniu-backend] listening on http://${HOST}:${PORT}`);
  });
}

async function ensureAdminBootstrapUser() {
  const username = String(process.env.ADMIN_BOOTSTRAP_USERNAME || '').trim();
  const password = String(process.env.ADMIN_BOOTSTRAP_PASSWORD || '').trim();
  if (!username || !password) {
    return;
  }
  const [rows] = await pool.execute('SELECT id FROM admin_users WHERE username = ? LIMIT 1', [username]);
  if (rows.length) {
    return;
  }
  await pool.execute(
    'INSERT INTO admin_users (username, password_hash, display_name, role, status) VALUES (?, ?, ?, ?, ?)',
    [username, hashAdminPassword(password), username, 'super_admin', 'active']
  );
}

function hashAdminPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyAdminPassword(password, storedHash) {
  const value = String(storedHash || '');
  if (!value || !value.startsWith('scrypt$')) {
    return false;
  }
  const parts = value.split('$');
  if (parts.length !== 3) {
    return false;
  }
  const actual = crypto.scryptSync(String(password), parts[1], 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(parts[2], 'hex'));
}

function getSubjectDisplayName(subjectCode) {
  const map = {
    logical_thinking: '逻辑思维',
    reading_comprehension: '阅读理解',
    expression_communication: '表达沟通',
    learning_metacognition: '学习元认知',
    inquiry_creativity: '探究创造'
  };
  return map[subjectCode] || '综合能力';
}

async function tableExists(connection, tableName) {
  const [rows] = await connection.execute(
    `SELECT 1
     FROM information_schema.tables
     WHERE table_schema = DATABASE() AND table_name = ?
     LIMIT 1`,
    [tableName]
  );
  return rows.length > 0;
}

async function executeIfTableExists(connection, tableName, sql, params) {
  if (await tableExists(connection, tableName)) {
    await connection.execute(sql, params);
  }
}

function getMultipartBoundary(contentType) {
  const match = String(contentType || '').match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? (match[1] || match[2] || '').trim() : '';
}

function readRequestBuffer(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > limitBytes) {
        reject(new Error('上传文件过大'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function parseMultipartFile(req) {
  const boundary = getMultipartBoundary(req.headers['content-type']);
  if (!boundary) {
    throw new Error('缺少上传边界');
  }
  const buffer = await readRequestBuffer(req, 2 * 1024 * 1024);
  const bodyText = buffer.toString('latin1');
  const delimiter = `--${boundary}`;
  const headerStart = bodyText.indexOf(delimiter);
  const headersEnd = bodyText.indexOf('\r\n\r\n', headerStart);
  if (headerStart === -1 || headersEnd === -1) {
    throw new Error('上传内容格式无效');
  }
  const headerText = bodyText.slice(headerStart + delimiter.length + 2, headersEnd);
  const filenameMatch = headerText.match(/filename="([^"]+)"/i);
  const contentTypeMatch = headerText.match(/Content-Type:\s*([^\r\n]+)/i);
  const fileStart = headersEnd + 4;
  const fileEnd = bodyText.indexOf(`\r\n${delimiter}`, fileStart);
  if (!filenameMatch || fileEnd === -1) {
    throw new Error('未找到上传文件');
  }
  return {
    filename: path.basename(filenameMatch[1]),
    mimeType: (contentTypeMatch && contentTypeMatch[1] ? contentTypeMatch[1] : 'application/octet-stream').trim(),
    buffer: buffer.subarray(fileStart, fileEnd)
  };
}

function inferUploadExtension(filename, mimeType) {
  const extension = path.extname(filename || '').toLowerCase();
  if (extension && ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) {
    return extension === '.jpeg' ? '.jpg' : extension;
  }
  const mimeMap = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif'
  };
  return mimeMap[String(mimeType || '').toLowerCase()] || '';
}

function getSubjectVisualIcon(subjectCode) {
  const map = {
    logical_thinking: '🧠',
    reading_comprehension: '📖',
    expression_communication: '💬',
    learning_metacognition: '🎯',
    inquiry_creativity: '🔬'
  };
  return map[subjectCode] || '🌱';
}

function getDifficultyLabel(level) {
  const map = {
    1: '启蒙练习',
    2: '基础训练',
    3: '进阶训练',
    4: '拓展挑战'
  };
  return map[level] || '成长任务';
}

function getChapterDisplayName(subjectCode, level) {
  return `${getSubjectDisplayName(subjectCode)}·${getDifficultyLabel(level || 1)}`;
}

function buildReadingTaskExplainContent(row) {
  const steps = String(row.steps || '').split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const materialLabel = row.material_label || '材料准备';
  const sections = [
    `【能力方向】${getSubjectDisplayName(row.subject_code)}`,
    `【适龄阶段】${row.age_range || '通用'}`,
    `【训练目标】${row.objective || row.title}`,
    `【${materialLabel}】${row.material || '准备当日阅读或生活场景材料'}`,
    `【家长提问】${row.parent_prompt || '围绕“谁、做什么、为什么”展开追问'}`
  ];
  if (steps.length) {
    sections.push(`【操作步骤】\n${steps.map((item, index) => `${index + 1}. ${item}`).join('\n')}`);
  }
  if (row.content) {
    sections.push(`【训练说明】\n${row.content}`);
  }
  if (row.tips) {
    sections.push(`【使用提醒】${row.tips}`);
  }
  return sections.join('\n\n');
}

function extractBracketSection(content, labels) {
  const source = String(content || '');
  const normalizedLabels = (labels || []).map((label) => String(label || '').trim()).filter(Boolean);
  if (!source || !normalizedLabels.length) {
    return { value: '', label: '', content: source };
  }

  const lines = source.split(/\r?\n/);
  const extracted = [];
  const remained = [];
  let activeLabel = '';
  let foundLabel = '';

  for (const rawLine of lines) {
    const line = String(rawLine || '');
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^【([^】]+)】\s*(.*)$/);
    if (headingMatch) {
      const label = headingMatch[1].trim();
      const isTarget = normalizedLabels.includes(label);
      activeLabel = isTarget ? label : '';
      if (isTarget) {
        foundLabel = label;
        if (headingMatch[2]) {
          extracted.push(headingMatch[2].trim());
        }
        continue;
      }
    }

    if (activeLabel) {
      if (trimmed) {
        extracted.push(trimmed);
      }
      continue;
    }

    remained.push(line);
  }

  return {
    value: extracted.join('\n').trim(),
    label: foundLabel || normalizedLabels[0],
    content: remained.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  };
}

function splitBracketSections(content) {
  const source = String(content || '');
  if (!source) {
    return { intro: '', sections: {} };
  }

  const lines = source.split(/\r?\n/);
  const intro = [];
  const sections = {};
  let currentLabel = '';

  for (const rawLine of lines) {
    const line = String(rawLine || '');
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^【([^】]+)】\s*(.*)$/);
    if (headingMatch) {
      currentLabel = headingMatch[1].trim();
      sections[currentLabel] = sections[currentLabel] || [];
      if (headingMatch[2]) {
        sections[currentLabel].push(headingMatch[2].trim());
      }
      continue;
    }

    if (!trimmed) {
      continue;
    }

    if (currentLabel) {
      sections[currentLabel].push(trimmed);
      continue;
    }

    intro.push(trimmed);
  }

  return {
    intro: intro.join(' ').trim(),
    sections
  };
}

function getReadingDisplayMaterial(row, practiceMaterialSection) {
  if (practiceMaterialSection && practiceMaterialSection.value) {
    return '阅读正文已提供，可准备铅笔，方便圈关键词或记录答案。';
  }
  return row.material || '准备当日阅读或生活场景材料';
}

function getReadingDisplayMaterialLabel(practiceMaterialSection) {
  if (practiceMaterialSection && practiceMaterialSection.value) {
    return '辅助材料';
  }
  return '材料准备';
}

function applyCanonicalReadingTask(row) {
  const canonical = findCanonicalReadingTask(row);
  if (!canonical) {
    return row;
  }
  return Object.assign({}, row, {
    title: canonical.title || row.title,
    material: canonical.material || row.material,
    objective: canonical.objective || row.objective,
    steps: canonical.steps || row.steps,
    parent_prompt: canonical.parent_prompt || row.parent_prompt,
    content: canonical.content || row.content,
    tips: canonical.tips || row.tips,
    example_answer: canonical.example_answer || row.example_answer,
    duration: canonical.duration || row.duration,
    difficulty: canonical.difficulty || row.difficulty,
    age_range: canonical.age_range || row.age_range,
    subject_code: canonical.subject_code || row.subject_code,
    image_url: canonical.image_url || '',
    cover_image: canonical.cover_image || ''
  });
}

function resolvePracticeMaterialSection(row) {
  const section = extractBracketSection(row.content, ['练习短文', '练习材料示例']);
  if (section && section.value) {
    return section;
  }
  const fallback = buildReadingPracticeExample(row.task_code || row.id, row.title);
  if (!fallback) {
    return section;
  }
  return extractBracketSection(fallback, ['练习短文', '练习材料示例']);
}

function buildReadingStructuredSections(row, practiceMaterialSection, parsedContent) {
  const contentSections = (parsedContent && parsedContent.sections) || {};
  const intro = (parsedContent && parsedContent.intro) || '';
  const analysis = [];
  const extension = [];

  if (intro) {
    analysis.push(intro);
  }

  ['适龄重点', '家长支持', '这节任务在练什么', '怎么判断原因和结果', '陪练顺序', '怎么抓重点', '怎么带着读', '卡住时怎么帮', '回答句式', '家长示范说法', '示范回答'].forEach(function(label) {
    const values = contentSections[label] || [];
    if (values.length) {
      analysis.push(`【${label}】${values.join(' ')}`.trim());
    }
  });

  ['结束动作', '结束复盘'].forEach(function(label) {
    const values = contentSections[label] || [];
    if (values.length) {
      extension.push(`【${label}】${values.join(' ')}`.trim());
    }
  });

  if (row.tips) {
    extension.push(`【家长提醒】${row.tips}`);
  }

  if (!analysis.length) {
    analysis.push(`【这节任务在练什么】${row.objective || '先读懂材料，再把答案和依据连起来。'}`);
    analysis.push(`【怎么带着读】${row.parent_prompt || '先读完整段，再回到关键句找线索。'}`);
    if (row.example_answer) {
      analysis.push(`【家长示范说法】${row.example_answer}`);
    }
  }

  if (!extension.length) {
    extension.push('【结束复盘】请孩子最后自己说一遍：这次答案是从哪一句或哪一个线索看出来的。');
  }

  return {
    passage: practiceMaterialSection.value,
    passageLabel: practiceMaterialSection.label || '',
    questions: [row.parent_prompt || '围绕“谁、做什么、为什么”展开追问'].filter(Boolean),
    analysis,
    extension
  };
}

function buildReadingTaskPractices(row, keyPoints) {
  const subjectName = getSubjectDisplayName(row.subject_code);
  const firstPoint = keyPoints[0] ? keyPoints[0].content : (row.objective || row.title);
  const secondPoint = keyPoints[1] ? keyPoints[1].content : (row.parent_prompt || row.title);
  const thirdPoint = keyPoints[2] ? keyPoints[2].content : (row.material || row.tips || row.title);
  return [
    {
      id: 1,
      type: 'choice',
      question: `这节${subjectName}任务最先要抓住什么？`,
      options: [firstPoint, '先追求标准答案', '先把任务做快', '先跳过观察阶段'],
      answer: 0,
      analysis: '先抓住当前任务的核心目标，孩子更容易进入有效练习。'
    },
    {
      id: 2,
      type: 'choice',
      question: '家长陪练时更适合怎么做？',
      options: [secondPoint, '连续追问不给停顿', '直接替孩子回答', '只纠正错误不示范'],
      answer: 0,
      analysis: '家长的主要作用是搭脚手架，让孩子在提示下完成表达和思考。'
    },
    {
      id: 3,
      type: 'choice',
      question: '这次开始前，最适合先准备什么？',
      options: [thirdPoint, '先催孩子快点开始', '先把步骤全部跳过', '先直接公布标准答案'],
      answer: 0,
      analysis: '先把材料、线索或关键步骤准备好，家长带练会更稳。'
    }
  ];
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
    CREATE TABLE IF NOT EXISTS event_tracks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      event_type VARCHAR(128) NOT NULL,
      event_data JSON NULL,
      session_id VARCHAR(255) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_event_tracks_user (user_id),
      INDEX idx_event_tracks_type (event_type),
      INDEX idx_event_tracks_created (created_at)
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
    CREATE TABLE IF NOT EXISTS admin_users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(64) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      display_name VARCHAR(128) DEFAULT '',
      role VARCHAR(32) NOT NULL DEFAULT 'operator',
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      last_login_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_admin_users_role (role),
      INDEX idx_admin_users_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      admin_user_id BIGINT NOT NULL,
      action_type VARCHAR(64) NOT NULL,
      target_type VARCHAR(64) NOT NULL,
      target_id VARCHAR(128) DEFAULT '',
      before_payload JSON NULL,
      after_payload JSON NULL,
      ip_address VARCHAR(64) DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_admin_audit_logs_admin (admin_user_id),
      INDEX idx_admin_audit_logs_action (action_type),
      INDEX idx_admin_audit_logs_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_runtime_configs (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      config_key VARCHAR(128) NOT NULL,
      config_value JSON NULL,
      version INT NOT NULL DEFAULT 1,
      status VARCHAR(32) NOT NULL DEFAULT 'draft',
      updated_by BIGINT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_admin_runtime_configs_version (config_key, version),
      INDEX idx_admin_runtime_configs_key (config_key),
      INDEX idx_admin_runtime_configs_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_daily_user_stats (
      stat_date DATE PRIMARY KEY,
      new_users INT NOT NULL DEFAULT 0,
      active_users INT NOT NULL DEFAULT 0,
      paid_active_users INT NOT NULL DEFAULT 0,
      trial_users INT NOT NULL DEFAULT 0,
      ai_users INT NOT NULL DEFAULT 0,
      content_users INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_daily_revenue_stats (
      stat_date DATE PRIMARY KEY,
      paid_users INT NOT NULL DEFAULT 0,
      new_paid_users INT NOT NULL DEFAULT 0,
      order_count INT NOT NULL DEFAULT 0,
      paid_order_count INT NOT NULL DEFAULT 0,
      revenue_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      month_membership_count INT NOT NULL DEFAULT 0,
      quarter_membership_count INT NOT NULL DEFAULT 0,
      year_membership_count INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_daily_content_stats (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      stat_date DATE NOT NULL,
      content_type VARCHAR(64) NOT NULL,
      content_id VARCHAR(128) NOT NULL,
      title VARCHAR(255) DEFAULT '',
      view_count INT NOT NULL DEFAULT 0,
      favorite_count INT NOT NULL DEFAULT 0,
      like_count INT NOT NULL DEFAULT 0,
      comment_count INT NOT NULL DEFAULT 0,
      completion_count INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_admin_daily_content_stats (stat_date, content_type, content_id),
      INDEX idx_admin_daily_content_stats_type (content_type),
      INDEX idx_admin_daily_content_stats_date (stat_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_daily_feature_stats (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      stat_date DATE NOT NULL,
      feature_key VARCHAR(128) NOT NULL,
      view_count INT NOT NULL DEFAULT 0,
      click_count INT NOT NULL DEFAULT 0,
      start_count INT NOT NULL DEFAULT 0,
      complete_count INT NOT NULL DEFAULT 0,
      paywall_visit_count INT NOT NULL DEFAULT 0,
      membership_conversion_count INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_admin_daily_feature_stats (stat_date, feature_key),
      INDEX idx_admin_daily_feature_stats_date (stat_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS admin_daily_funnel_stats (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      stat_date DATE NOT NULL,
      funnel_key VARCHAR(128) NOT NULL,
      step_key VARCHAR(128) NOT NULL,
      user_count INT NOT NULL DEFAULT 0,
      event_count INT NOT NULL DEFAULT 0,
      conversion_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_admin_daily_funnel_stats (stat_date, funnel_key, step_key),
      INDEX idx_admin_daily_funnel_stats_date (stat_date),
      INDEX idx_admin_daily_funnel_stats_funnel (funnel_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS promo_code_redemptions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      promo_code VARCHAR(128) NOT NULL,
      user_id BIGINT NOT NULL,
      promo_type VARCHAR(64) NOT NULL DEFAULT 'membership',
      reward_days INT NOT NULL DEFAULT 0,
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_promo_code_redemptions (promo_code, user_id),
      INDEX idx_promo_code_redemptions_user (user_id),
      INDEX idx_promo_code_redemptions_code (promo_code)
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
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS daily_plan_records (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      child_id BIGINT NOT NULL,
      plan_date DATE NOT NULL,
      slot_index INT NOT NULL DEFAULT 0,
      plan_type VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      reason_text TEXT,
      action_text VARCHAR(64) DEFAULT '',
      summary_text TEXT,
      duration_minutes INT NOT NULL DEFAULT 0,
      target_type VARCHAR(64) DEFAULT '',
      target_id VARCHAR(128) DEFAULT '',
      target_path VARCHAR(500) DEFAULT '',
      source_key VARCHAR(128) DEFAULT '',
      score INT NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL DEFAULT 'pending',
      completed_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_daily_plan_slot (child_id, plan_date, slot_index),
      INDEX idx_daily_plan_user_date (user_id, plan_date),
      INDEX idx_daily_plan_child_date (child_id, plan_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS daily_plan_completions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      daily_plan_record_id BIGINT NOT NULL,
      user_id BIGINT NOT NULL,
      child_id BIGINT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_daily_plan_completion (daily_plan_record_id, user_id),
      INDEX idx_daily_plan_completion_child (child_id),
      INDEX idx_daily_plan_completion_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS growth_daily_records (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      child_id BIGINT NOT NULL,
      record_date DATE NOT NULL,
      mood_status VARCHAR(32) NOT NULL DEFAULT 'steady',
      appetite_status VARCHAR(32) NOT NULL DEFAULT 'normal',
      sleep_status VARCHAR(32) NOT NULL DEFAULT 'stable',
      exercise_status VARCHAR(32) NOT NULL DEFAULT 'enough',
      social_status VARCHAR(32) NOT NULL DEFAULT 'smooth',
      note_text TEXT,
      source VARCHAR(32) NOT NULL DEFAULT 'manual',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_growth_daily_record (child_id, record_date),
      INDEX idx_growth_daily_user_date (user_id, record_date),
      INDEX idx_growth_daily_child_date (child_id, record_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS weekly_growth_summaries (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT NOT NULL,
      child_id BIGINT NOT NULL,
      week_start DATE NOT NULL,
      week_end DATE NOT NULL,
      summary_payload JSON NULL,
      generated_from VARCHAR(32) NOT NULL DEFAULT 'server',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_weekly_growth_summary (child_id, week_start),
      INDEX idx_weekly_growth_user_week (user_id, week_start),
      INDEX idx_weekly_growth_child_week (child_id, week_start)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_scene_tags (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      scene_key VARCHAR(64) NOT NULL,
      scene_title VARCHAR(128) NOT NULL,
      scene_category VARCHAR(64) NOT NULL,
      principle_text TEXT,
      suggested_action TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_parenting_scene_key (scene_key),
      INDEX idx_parenting_scene_category (scene_category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_scene_aliases (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      scene_key VARCHAR(64) NOT NULL,
      alias_text VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_parenting_scene_alias (scene_key, alias_text),
      INDEX idx_parenting_scene_alias_text (alias_text)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_scene_recommendations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      scene_key VARCHAR(64) NOT NULL,
      result_type VARCHAR(32) NOT NULL,
      title VARCHAR(255) NOT NULL,
      summary TEXT,
      target_type VARCHAR(64) DEFAULT '',
      target_id VARCHAR(128) DEFAULT '',
      target_path VARCHAR(500) DEFAULT '',
      age_group VARCHAR(32) DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_parenting_scene_recommendation (scene_key, result_type, title(120)),
      INDEX idx_parenting_scene_recommendations_key (scene_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await seedContentIfNeeded();
}

async function seedContentIfNeeded() {
  for (const article of PARENTING_ARTICLES) {
    const [existingArticleRows] = await pool.execute('SELECT id FROM articles WHERE title = ? LIMIT 1', [article.title]);
    if (existingArticleRows.length) {
      await pool.execute(
        `UPDATE articles
         SET summary = ?, content = ?, category = ?, sub_category = ?, age_group = ?, tags = ?, author = ?, evidence_level = ?
         WHERE id = ?`,
        [
          article.summary,
          article.content,
          article.category,
          article.sub_category,
          article.age_group,
          article.tags,
          article.author,
          article.evidence_level,
          existingArticleRows[0].id
        ]
      );
      continue;
    }
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

  for (const task of READING_TASKS) {
    await pool.execute(
      `INSERT INTO reading_tasks
       (task_code, title, subject_code, age_range, difficulty, duration, material, objective, steps, parent_prompt, content, image_url, icon_url, cover_image, audio_url, video_url, tips, example_answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         subject_code = VALUES(subject_code),
         age_range = VALUES(age_range),
         difficulty = VALUES(difficulty),
         duration = VALUES(duration),
         material = VALUES(material),
         objective = VALUES(objective),
         steps = VALUES(steps),
         parent_prompt = VALUES(parent_prompt),
         content = VALUES(content),
         tips = VALUES(tips),
         example_answer = VALUES(example_answer)`,
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

  const sceneSeed = getDefaultSceneSeedData();
  for (const scene of sceneSeed.scenes) {
    await pool.execute(
      `INSERT INTO parenting_scene_tags (scene_key, scene_title, scene_category, principle_text, suggested_action, status, sort_order)
       VALUES (?, ?, ?, ?, ?, 'active', ?)
       ON DUPLICATE KEY UPDATE
         scene_title = VALUES(scene_title),
         scene_category = VALUES(scene_category),
         principle_text = VALUES(principle_text),
         suggested_action = VALUES(suggested_action),
         sort_order = VALUES(sort_order),
         status = 'active'`,
      [scene.sceneKey, scene.sceneTitle, scene.sceneCategory, scene.principleText, scene.suggestedAction, scene.sortOrder]
    );
  }
  for (const alias of sceneSeed.aliases) {
    await pool.execute(
      `INSERT INTO parenting_scene_aliases (scene_key, alias_text, status, sort_order)
       VALUES (?, ?, 'active', ?)
       ON DUPLICATE KEY UPDATE sort_order = VALUES(sort_order), status = 'active'`,
      [alias.sceneKey, alias.aliasText, alias.sortOrder]
    );
  }
  for (const recommendation of sceneSeed.recommendations) {
    await pool.execute(
      `INSERT INTO parenting_scene_recommendations (scene_key, result_type, title, summary, target_type, target_id, target_path, age_group, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         summary = VALUES(summary),
         target_type = VALUES(target_type),
         target_id = VALUES(target_id),
         target_path = VALUES(target_path),
         age_group = VALUES(age_group),
         sort_order = VALUES(sort_order)`,
      [
        recommendation.sceneKey,
        recommendation.resultType,
        recommendation.title,
        recommendation.summary,
        recommendation.targetType,
        recommendation.targetId,
        recommendation.targetPath,
        recommendation.ageGroup,
        recommendation.sortOrder
      ]
    );
  }
}

function getDefaultSceneSeedData() {
  const scenes = [
    {
      sceneKey: 'tantrum_public',
      sceneTitle: '公共场合闹情绪',
      sceneCategory: '情绪支持',
      principleText: '先稳情绪，再做要求，孩子会更愿意回到规则里。',
      suggestedAction: '压低声音，先给一句确认，再给一个简单选择。',
      sortOrder: 10
    },
    {
      sceneKey: 'sleep_resist',
      sceneTitle: '睡前拖延',
      sceneCategory: '作息习惯',
      principleText: '用固定流程和固定顺序，比临时催促更容易稳定入睡。',
      suggestedAction: '把洗漱、收玩具、讲故事固定成同一顺序。',
      sortOrder: 20
    },
    {
      sceneKey: 'meal_picky',
      sceneTitle: '吃饭挑食',
      sceneCategory: '营养支持',
      principleText: '减少对抗，增加稳定暴露和小份尝试，饮食接受度会更好。',
      suggestedAction: '主食、蛋白质、蔬菜各放一点，先允许孩子从熟悉项开始。',
      sortOrder: 30
    },
    {
      sceneKey: 'homework_focus',
      sceneTitle: '写作业坐不住',
      sceneCategory: '学习支持',
      principleText: '先把任务启动做顺，再慢慢拉长专注时间。',
      suggestedAction: '只给一个起始动作，先做五分钟再反馈。',
      sortOrder: 40
    },
    {
      sceneKey: 'peer_conflict',
      sceneTitle: '和同伴起冲突',
      sceneCategory: '社交支持',
      principleText: '先复盘事情过程，再练替代表达，社交修复会更稳。',
      suggestedAction: '先问发生了什么，再教孩子说出需求和边界。',
      sortOrder: 50
    },
    {
      sceneKey: 'morning_rush',
      sceneTitle: '早晨出门磨蹭',
      sceneCategory: '习惯执行',
      principleText: '把准备动作前置成清单，早晨冲突会明显下降。',
      suggestedAction: '睡前先摆好衣物和书包，早晨按清单走。',
      sortOrder: 60
    }
  ];
  const aliases = [
    ['tantrum_public', ['孩子发脾气', '公共场合哭闹', '商场哭闹', '出门闹脾气', '超市躺地', '外面发脾气', '爱发脾气', '当众哭闹']],
    ['sleep_resist', ['不肯睡觉', '睡前磨蹭', '晚上兴奋', '拖着不睡', '哄睡困难', '入睡困难']],
    ['meal_picky', ['挑食', '不爱吃菜', '只吃主食', '吃饭闹', '不肯吃饭', '边吃边玩']],
    ['homework_focus', ['坐不住', '写作业分心', '学习拖拉', '容易走神', '专注力差', '上课分心']],
    ['peer_conflict', ['抢玩具', '和小朋友打架', '不会分享', '同伴冲突', '和同学吵架', '被小朋友排斥']],
    ['morning_rush', ['早上磨蹭', '出门慢', '不想穿衣服', '上学拖延', '起床拖拉', '晨起磨蹭']]
  ].flatMap(([sceneKey, words], sceneIndex) => words.map((aliasText, aliasIndex) => ({
    sceneKey,
    aliasText,
    sortOrder: sceneIndex * 10 + aliasIndex + 1
  })));
  const recommendations = scenes.map((scene, index) => ({
    sceneKey: scene.sceneKey,
    resultType: 'solution_card',
    title: `${scene.sceneTitle}处理建议`,
    summary: `${scene.principleText}${scene.suggestedAction}`,
    targetType: 'scene_solution',
    targetId: scene.sceneKey,
    targetPath: '/pages/parenting/search/search',
    ageGroup: '',
    sortOrder: index + 1
  }));
  return { scenes, aliases, recommendations };
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
    birthday: row.birthday ? formatStoredDateValue(row.birthday) : '',
    birth_date: row.birthday ? formatStoredDateValue(row.birthday) : '',
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

function formatStoredDateValue(value) {
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function normalizeBoundedInt(rawValue, fallbackValue, minValue, maxValue) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return fallbackValue;
  }
  const normalized = Math.floor(parsed);
  if (normalized < minValue) {
    return minValue;
  }
  if (normalized > maxValue) {
    return maxValue;
  }
  return normalized;
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

function getPlanDateValue(rawDate) {
  if (!rawDate) {
    return formatDateValue(new Date());
  }
  const value = String(rawDate).trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : formatDateValue(new Date());
}

function getWeekStartDateValue(rawDate) {
  const date = rawDate ? new Date(`${getPlanDateValue(rawDate)}T00:00:00Z`) : new Date();
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() - day + 1);
  return formatDateValue(date);
}

function getWeekEndDateValue(weekStart) {
  const date = new Date(`${weekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 6);
  return formatDateValue(date);
}

function getRecentDateValue(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Number(daysAgo || 0));
  return formatDateValue(date);
}

function buildDefaultGrowthRecord(dateValue, childId) {
  return {
    childId: Number(childId || 0),
    recordDate: dateValue,
    moodStatus: 'steady',
    appetiteStatus: 'normal',
    sleepStatus: 'stable',
    exerciseStatus: 'enough',
    socialStatus: 'smooth',
    noteText: ''
  };
}

function normalizeGrowthRecord(row) {
  return {
    id: row.id,
    childId: row.child_id,
    recordDate: formatStoredDateValue(row.record_date),
    moodStatus: row.mood_status,
    appetiteStatus: row.appetite_status,
    sleepStatus: row.sleep_status,
    exerciseStatus: row.exercise_status,
    socialStatus: row.social_status,
    noteText: row.note_text || '',
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null
  };
}

function sanitizeGrowthRecordPayload(payload, dateValue) {
  const data = payload || {};
  const allowList = {
    moodStatus: ['steady', 'happy', 'sensitive', 'meltdown'],
    appetiteStatus: ['normal', 'good', 'picky', 'low'],
    sleepStatus: ['stable', 'late', 'night_wake', 'short'],
    exerciseStatus: ['enough', 'active', 'little', 'resist'],
    socialStatus: ['smooth', 'warm', 'shy', 'conflict']
  };
  const sanitized = buildDefaultGrowthRecord(dateValue, data.childId);
  Object.keys(allowList).forEach((key) => {
    const nextValue = String(data[key] || '').trim();
    if (allowList[key].includes(nextValue)) {
      sanitized[key] = nextValue;
    }
  });
  sanitized.noteText = String(data.noteText || data.note_text || '').trim().slice(0, 500);
  return sanitized;
}

function getGrowthStatusScore(field, value) {
  const maps = {
    moodStatus: { happy: 4, steady: 3, sensitive: 2, meltdown: 1 },
    appetiteStatus: { good: 4, normal: 3, picky: 2, low: 1 },
    sleepStatus: { stable: 4, late: 3, short: 2, night_wake: 1 },
    exerciseStatus: { active: 4, enough: 3, little: 2, resist: 1 },
    socialStatus: { warm: 4, smooth: 3, shy: 2, conflict: 1 }
  };
  return (maps[field] && maps[field][value]) || 0;
}

function buildGrowthTrendLabel(score) {
  if (score >= 3.4) {
    return '整体比较稳定';
  }
  if (score >= 2.6) {
    return '本周有波动，适合继续观察';
  }
  return '本周需要优先支持';
}

function getSceneProfileByKey(sceneKey) {
  const profiles = {
    tantrum_public: { articleCategory: '情绪管理', articleKeyword: '情绪', recipeKeyword: '镁', subjectCode: 'expression_communication' },
    sleep_resist: { articleCategory: '行为习惯', articleKeyword: '睡眠', recipeKeyword: '晚餐', subjectCode: 'learning_metacognition' },
    meal_picky: { articleCategory: '营养健康', articleKeyword: '挑食', recipeKeyword: '补铁', subjectCode: 'reading_comprehension' },
    homework_focus: { articleCategory: '认知发展', articleKeyword: '专注', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    peer_conflict: { articleCategory: '社交能力', articleKeyword: '同伴', recipeKeyword: '能量', subjectCode: 'expression_communication' },
    morning_rush: { articleCategory: '行为习惯', articleKeyword: '习惯', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' }
  };
  return profiles[sceneKey] || { articleCategory: '行为习惯', articleKeyword: '', recipeKeyword: '', subjectCode: 'learning_metacognition' };
}

function getWeeklyDimensionLabel(dimensionKey) {
  const labels = {
    moodStatus: '情绪状态',
    appetiteStatus: '进食状态',
    sleepStatus: '睡眠状态',
    exerciseStatus: '活动状态',
    socialStatus: '社交状态'
  };
  return labels[dimensionKey] || '成长状态';
}

function getWeeklySummaryProfileByDimension(dimensionKey) {
  const profiles = {
    moodStatus: { articleCategory: '情绪管理', articleKeyword: '情绪', subjectCode: 'expression_communication' },
    appetiteStatus: { articleCategory: '营养健康', articleKeyword: '挑食', subjectCode: 'reading_comprehension' },
    sleepStatus: { articleCategory: '行为习惯', articleKeyword: '睡眠', subjectCode: 'learning_metacognition' },
    exerciseStatus: { articleCategory: '行为习惯', articleKeyword: '活动', subjectCode: 'learning_metacognition' },
    socialStatus: { articleCategory: '社交能力', articleKeyword: '同伴', subjectCode: 'expression_communication' }
  };
  return profiles[dimensionKey] || { articleCategory: '认知发展', articleKeyword: '', subjectCode: 'reading_comprehension' };
}

async function getDefaultChildForUser(userId) {
  const [rows] = await pool.execute(`${buildChildSelectSql()} WHERE user_id = ? ORDER BY is_default DESC, created_at ASC LIMIT 1`, [userId]);
  return rows[0] || null;
}

async function resolveDailyPlanChild(userId, childId) {
  if (childId) {
    return getOwnedChild(userId, childId);
  }
  return getDefaultChildForUser(userId);
}

function getDailyPlanProfileByDimension(dimensionName) {
  const key = String(dimensionName || '').trim();
  const profiles = {
    focus: {
      subjectCode: 'learning_metacognition',
      articleCategory: '行为习惯',
      articleKeyword: '专注',
      reasonText: '最近更适合先稳住任务启动和专注节奏。'
    },
    emotion: {
      subjectCode: 'expression_communication',
      articleCategory: '情绪管理',
      articleKeyword: '情绪',
      reasonText: '最近更适合先帮助孩子把情绪和表达接起来。'
    },
    learning: {
      subjectCode: 'reading_comprehension',
      articleCategory: '认知发展',
      articleKeyword: '阅读',
      reasonText: '最近更适合先补理解、复述和读懂重点的能力。'
    },
    social: {
      subjectCode: 'expression_communication',
      articleCategory: '社交能力',
      articleKeyword: '同伴',
      reasonText: '最近更适合先支持同伴互动和开口表达。'
    },
    nutrition: {
      subjectCode: 'learning_metacognition',
      articleCategory: '营养健康',
      articleKeyword: '营养',
      reasonText: '最近更适合先把饮食支持做得更稳定。'
    }
  };
  return profiles[key] || {
    subjectCode: 'reading_comprehension',
    articleCategory: '认知发展',
    articleKeyword: '',
    reasonText: '先从家庭里最容易做到的一步开始。'
  };
}

async function getLatestWeakDimension(childId) {
  const [recordRows] = await pool.execute(
    `SELECT id
     FROM assessment_records
     WHERE child_id = ?
     ORDER BY completed_at DESC, id DESC
     LIMIT 1`,
    [childId]
  );
  if (!recordRows.length) {
    return null;
  }
  const [rows] = await pool.execute(
    `SELECT dimension_name, score_rate
     FROM assessment_dimensions
     WHERE record_id = ?
     ORDER BY score_rate ASC, id ASC
     LIMIT 1`,
    [recordRows[0].id]
  );
  return rows[0] || null;
}

async function getRecentModuleUsage(userId, childId) {
  const [rows] = await pool.execute(
    `SELECT COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.module_key')), ''), 'unknown') AS module_key,
            COUNT(*) AS total
     FROM event_tracks
     WHERE user_id = ?
       AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       AND (? = 0 OR JSON_EXTRACT(event_data, '$.child_id') IS NULL OR JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.child_id')) = CAST(? AS CHAR))
     GROUP BY module_key`,
    [userId, childId || 0, childId || 0]
  );
  const usage = {
    reading_tasks: 0,
    knowledge: 0,
    nutrition_recipe: 0,
    assessment: 0,
    parenting_home: 0,
    unknown: 0
  };
  rows.forEach((row) => {
    usage[row.module_key] = Number(row.total) || 0;
  });
  return usage;
}

async function getRecommendedReadingTask(childId, ageGroup, subjectCode) {
  const likeAge = `%${ageGroup || '3-4岁'}%`;
  let [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE t.age_range LIKE ?
       AND (? = '' OR t.subject_code = ?)
     ORDER BY CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END ASC, t.difficulty ASC, t.id ASC
     LIMIT 1`,
    [childId, likeAge, subjectCode || '', subjectCode || '']
  );
  if (!rows.length) {
    [rows] = await pool.execute(
      `SELECT t.*, tp.status, tp.progress
       FROM reading_tasks t
       LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
       WHERE t.age_range LIKE ?
       ORDER BY CASE WHEN tp.status = 'completed' THEN 1 ELSE 0 END ASC, t.difficulty ASC, t.id ASC
       LIMIT 1`,
      [childId, likeAge]
    );
  }
  if (!rows.length) {
    return null;
  }
  return normalizeReadingTask(rows[0]);
}

async function getRecommendedParentingArticle(ageGroup, articleCategory, articleKeyword, userId) {
  const params = [ageGroup || '3-4岁'];
  let whereClause = 'WHERE is_published = 1 AND age_group = ?';
  if (articleCategory) {
    whereClause += ' AND category = ?';
    params.push(articleCategory);
  }
  if (articleKeyword) {
    whereClause += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
    const searchTerm = `%${articleKeyword}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  let [rows] = await pool.execute(
    `SELECT * FROM articles ${whereClause} ORDER BY read_count DESC, created_at DESC LIMIT 1`,
    params
  );
  if (!rows.length) {
    [rows] = await pool.execute(
      'SELECT * FROM articles WHERE is_published = 1 AND age_group = ? ORDER BY read_count DESC, created_at DESC LIMIT 1',
      [ageGroup || '3-4岁']
    );
  }
  if (!rows.length) {
    return null;
  }
  return normalizeArticle(rows[0], userId);
}

function parseAgeRangeValue(value) {
  const match = String(value || '').match(/(\d+)(?:-(\d+))?岁/);
  if (!match) {
    return null;
  }
  const min = Number(match[1]);
  const max = Number(match[2] || match[1]);
  return { min, max };
}

function isRecipeAgeCompatible(recipeAgeRange, childAgeRange) {
  const recipeRange = parseAgeRangeValue(recipeAgeRange);
  const childRange = parseAgeRangeValue(childAgeRange);
  if (!recipeRange || !childRange) {
    return false;
  }
  return recipeRange.min <= childRange.max && recipeRange.max >= childRange.min;
}

function getRecommendedNutritionRecipe(ageGroup) {
  const matched = (NUTRITION_RECIPES || []).filter((item) => isRecipeAgeCompatible(item.ageRange || item.age_range, ageGroup));
  const poolList = matched.length ? matched : (NUTRITION_RECIPES || []);
  if (!poolList.length) {
    return null;
  }
  return poolList
    .slice()
    .sort((a, b) => Number(b.viewCount || 0) - Number(a.viewCount || 0))[0];
}

function buildNoChildDailyPlanCards(planDate) {
  return [
    {
      slotIndex: 0,
      planType: 'onboarding',
      title: '先补孩子档案，后面的建议会更准',
      reasonText: '先告诉我孩子年龄和基本情况，首页建议才能真正贴近你家当下阶段。',
      actionText: '去完善',
      summaryText: '完成孩子档案后，可以拿到按年龄整理的每日建议。',
      durationMinutes: 2,
      targetType: 'child_profile',
      targetId: 'child_profile_setup',
      targetPath: '/pages/profile/child-edit/child-edit',
      sourceKey: 'no_child_profile',
      score: 100,
      planDate
    },
    {
      slotIndex: 1,
      planType: 'habit_reminder',
      title: '今天先做一次成长观察，别急着猜孩子怎么了',
      reasonText: '很多育儿卡点先看清，再行动，家庭执行会更稳。',
      actionText: '去观察',
      summaryText: '用成长观察先判断孩子当前卡在专注、表达还是习惯。',
      durationMinutes: 3,
      targetType: 'assessment',
      targetId: 'assessment_entry',
      targetPath: '/pages/assessment/assessment',
      sourceKey: 'no_child_assessment',
      score: 90,
      planDate
    },
    {
      slotIndex: 2,
      planType: 'parenting_article',
      title: '先看看育儿知识首页，找到和你家最像的问题',
      reasonText: '先用高频问题入口缩小范围，会比盲目翻内容更省心。',
      actionText: '去看看',
      summaryText: '从情绪、习惯、认知、社交、营养五类问题快速进入。',
      durationMinutes: 5,
      targetType: 'parenting_home',
      targetId: 'parenting_home',
      targetPath: '/pages/parenting/parenting',
      sourceKey: 'no_child_parenting',
      score: 80,
      planDate
    }
  ];
}

async function buildDailyPlanCards(userId, child, planDate) {
  if (!child) {
    return buildNoChildDailyPlanCards(planDate);
  }
  const ageGroup = inferAgeRangeFromChild(child) || '3-4岁';
  const weakDimension = await getLatestWeakDimension(child.id);
  const planProfile = getDailyPlanProfileByDimension(weakDimension && weakDimension.dimension_name);
  const recentUsage = await getRecentModuleUsage(userId, child.id);
  const readingTask = await getRecommendedReadingTask(child.id, ageGroup, planProfile.subjectCode);
  const article = await getRecommendedParentingArticle(ageGroup, planProfile.articleCategory, planProfile.articleKeyword, userId);
  const recipe = getRecommendedNutritionRecipe(ageGroup);
  const cards = [];

  if (readingTask) {
    cards.push({
      slotIndex: cards.length,
      planType: 'ability_task',
      title: `今天先做 1 次：${readingTask.title}`,
      reasonText: weakDimension
        ? `${planProfile.reasonText} 最近测评里“${weakDimension.dimension_name}”更值得优先补一补。`
        : '先做一个短任务，最容易把今天的陪伴真正开始起来。',
      actionText: '现在去练',
      summaryText: readingTask.objective || readingTask.parent_prompt || readingTask.title,
      durationMinutes: Number(readingTask.duration || 10),
      targetType: 'knowledge_task',
      targetId: String(readingTask.id),
      targetPath: `/pages/textbook/knowledge-detail/knowledge-detail?pointId=${encodeURIComponent(readingTask.task_code || String(readingTask.id))}&subjectCode=${encodeURIComponent(readingTask.subject_code || '')}&pointName=${encodeURIComponent(readingTask.title || '')}&childId=${child.id}`,
      sourceKey: weakDimension ? String(weakDimension.dimension_name) : 'default_task',
      score: 90 + Math.max(0, 10 - Number(recentUsage.reading_tasks || 0)),
      planDate,
      childId: child.id
    });
  }

  if (article) {
    cards.push({
      slotIndex: cards.length,
      planType: 'parenting_article',
      title: `再读一篇：${article.title}`,
      reasonText: recentUsage.knowledge > recentUsage.reading_tasks
        ? '你最近已经在看内容，这一篇更适合直接转成家庭做法。'
        : `${planProfile.articleCategory}相关问题更适合今天顺手补一篇方法文。`,
      actionText: '去看方法',
      summaryText: article.summary || article.title,
      durationMinutes: 6,
      targetType: 'parenting_article',
      targetId: String(article.id),
      targetPath: `/pages/parenting/article-detail/article-detail?id=${article.id}`,
      sourceKey: article.category || 'parenting_article',
      score: 80 + Math.max(0, 10 - Number(recentUsage.knowledge || 0)),
      planDate,
      childId: child.id
    });
  }

  if (recipe) {
    cards.push({
      slotIndex: cards.length,
      planType: 'nutrition_recipe',
      title: `饮食上先关注：${recipe.title || recipe.name}`,
      reasonText: '日常饮食最适合做成小动作，今天先从一顿更容易落实的搭配开始。',
      actionText: '看搭配',
      summaryText: (recipe.nutrition && recipe.nutrition.highlight) || recipe.description || '',
      durationMinutes: 5,
      targetType: 'nutrition_recipe',
      targetId: String(recipe.id),
      targetPath: `/pages/nutrition/recipe-detail/recipe-detail?id=${encodeURIComponent(recipe.id)}`,
      sourceKey: 'nutrition_recipe',
      score: 70 + Math.max(0, 10 - Number(recentUsage.nutrition_recipe || 0)),
      planDate,
      childId: child.id
    });
  }

  while (cards.length < 3) {
    cards.push({
      slotIndex: cards.length,
      planType: 'habit_reminder',
      title: '今天留 3 分钟，先复盘孩子最卡的一步',
      reasonText: '每天只复盘一件小事，比一次解决很多问题更容易坚持。',
      actionText: '去观察',
      summaryText: '先判断今天最想继续保持什么、最想调整什么。',
      durationMinutes: 3,
      targetType: 'assessment',
      targetId: 'assessment_entry',
      targetPath: '/pages/assessment/assessment',
      sourceKey: 'habit_reminder',
      score: 60,
      planDate,
      childId: child.id
    });
  }

  return cards.slice(0, 3);
}

async function storeDailyPlanCards(userId, childId, planDate, cards) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM daily_plan_records WHERE user_id = ? AND child_id = ? AND plan_date = ?', [userId, childId, planDate]);
    for (const card of cards) {
      await connection.execute(
        `INSERT INTO daily_plan_records
         (user_id, child_id, plan_date, slot_index, plan_type, title, reason_text, action_text, summary_text, duration_minutes, target_type, target_id, target_path, source_key, score, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          userId,
          childId,
          planDate,
          Number(card.slotIndex || 0),
          card.planType,
          card.title,
          card.reasonText,
          card.actionText,
          card.summaryText,
          Number(card.durationMinutes || 0),
          card.targetType,
          card.targetId,
          card.targetPath,
          card.sourceKey,
          Number(card.score || 0)
        ]
      );
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

function normalizeDailyPlanRecord(row) {
  return {
    id: row.id,
    childId: row.child_id,
    planDate: formatStoredDateValue(row.plan_date),
    type: row.plan_type,
    title: row.title,
    reason: row.reason_text || '',
    actionText: row.action_text || '',
    summary: row.summary_text || '',
    durationMinutes: Number(row.duration_minutes || 0),
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    targetPath: row.target_path || '',
    sourceKey: row.source_key || '',
    score: Number(row.score || 0),
    status: row.status || 'pending',
    completed: row.status === 'completed',
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null
  };
}

async function loadDailyPlanRecords(userId, childId, planDate) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM daily_plan_records
     WHERE user_id = ? AND child_id = ? AND plan_date = ?
     ORDER BY slot_index ASC, id ASC`,
    [userId, childId, planDate]
  );
  return rows.map(normalizeDailyPlanRecord);
}

async function dailyPlanHandler(req, res) {
  const userId = getUserId(req);
  const childId = Number(req.query.childId || 0);
  const planDate = getPlanDateValue(req.query.date);
  const child = await resolveDailyPlanChild(userId, childId);
  if (childId && !child) {
    res.status(403).json({ success: false, message: '无权访问该孩子的计划' });
    return;
  }

  if (!child) {
    res.json({
      success: true,
      data: {
        date: planDate,
        child_id: 0,
        child_name: '',
        age_group: '',
        cards: buildNoChildDailyPlanCards(planDate).map((item, index) => ({
          id: `guest_${index + 1}`,
          childId: 0,
          planDate,
          type: item.planType,
          title: item.title,
          reason: item.reasonText,
          actionText: item.actionText,
          summary: item.summaryText,
          durationMinutes: item.durationMinutes,
          targetType: item.targetType,
          targetId: item.targetId,
          targetPath: item.targetPath,
          sourceKey: item.sourceKey,
          score: item.score,
          status: 'pending',
          completed: false,
          completedAt: null
        }))
      }
    });
    return;
  }

  let cards = await loadDailyPlanRecords(userId, child.id, planDate);
  if (!cards.length) {
    const generated = await buildDailyPlanCards(userId, child, planDate);
    await storeDailyPlanCards(userId, child.id, planDate, generated);
    cards = await loadDailyPlanRecords(userId, child.id, planDate);
  }
  res.json({
    success: true,
    data: {
      date: planDate,
      child_id: child.id,
      child_name: child.name || '',
      age_group: inferAgeRangeFromChild(child) || '',
      cards
    }
  });
}

async function dailyPlanCompleteHandler(req, res) {
  const userId = getUserId(req);
  const recordId = Number((req.body && req.body.record_id) || 0);
  if (!recordId) {
    res.status(400).json({ success: false, message: 'record_id不能为空' });
    return;
  }
  const [rows] = await pool.execute(
    `SELECT *
     FROM daily_plan_records
     WHERE id = ? AND user_id = ?
     LIMIT 1`,
    [recordId, userId]
  );
  if (!rows.length) {
    res.status(404).json({ success: false, message: '计划卡不存在' });
    return;
  }
  const record = rows[0];
  await pool.execute(
    `INSERT INTO daily_plan_completions (daily_plan_record_id, user_id, child_id, completed_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
    [record.id, userId, record.child_id]
  );
  await pool.execute(
    `UPDATE daily_plan_records
     SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [record.id, userId]
  );
  await deleteWeeklySummaryCache(userId, record.child_id, formatStoredDateValue(record.plan_date));
  const [updatedRows] = await pool.execute('SELECT * FROM daily_plan_records WHERE id = ? LIMIT 1', [record.id]);
  res.json({ success: true, data: normalizeDailyPlanRecord(updatedRows[0]) });
}

async function deleteWeeklySummaryCache(userId, childId, dateValue) {
  const weekStart = getWeekStartDateValue(dateValue);
  await pool.execute('DELETE FROM weekly_growth_summaries WHERE user_id = ? AND child_id = ? AND week_start = ?', [userId, childId, weekStart]);
}

async function growthRecordDailyHandler(req, res) {
  const userId = getUserId(req);
  const childId = Number(req.query.childId || 0);
  const recordDate = getPlanDateValue(req.query.date);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const [rows] = await pool.execute(
    `SELECT *
     FROM growth_daily_records
     WHERE user_id = ? AND child_id = ? AND record_date = ?
     LIMIT 1`,
    [userId, childId, recordDate]
  );
  res.json({
    success: true,
    data: rows.length ? normalizeGrowthRecord(rows[0]) : buildDefaultGrowthRecord(recordDate, childId)
  });
}

async function growthRecordUpsertHandler(req, res) {
  const userId = getUserId(req);
  const childId = Number((req.body && req.body.childId) || 0);
  const recordDate = getPlanDateValue(req.body && req.body.recordDate);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const payload = sanitizeGrowthRecordPayload(req.body, recordDate);
  await pool.execute(
    `INSERT INTO growth_daily_records
     (user_id, child_id, record_date, mood_status, appetite_status, sleep_status, exercise_status, social_status, note_text, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual')
     ON DUPLICATE KEY UPDATE
       mood_status = VALUES(mood_status),
       appetite_status = VALUES(appetite_status),
       sleep_status = VALUES(sleep_status),
       exercise_status = VALUES(exercise_status),
       social_status = VALUES(social_status),
       note_text = VALUES(note_text),
       source = 'manual',
       updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      childId,
      recordDate,
      payload.moodStatus,
      payload.appetiteStatus,
      payload.sleepStatus,
      payload.exerciseStatus,
      payload.socialStatus,
      payload.noteText
    ]
  );
  await deleteWeeklySummaryCache(userId, childId, recordDate);
  const [rows] = await pool.execute(
    'SELECT * FROM growth_daily_records WHERE user_id = ? AND child_id = ? AND record_date = ? LIMIT 1',
    [userId, childId, recordDate]
  );
  res.json({ success: true, data: normalizeGrowthRecord(rows[0]) });
}

async function growthRecordHistoryHandler(req, res) {
  const userId = getUserId(req);
  const childId = Number(req.query.childId || 0);
  const page = normalizeBoundedInt(req.query.page, 1, 1, 1000000);
  const pageSize = normalizeBoundedInt(req.query.pageSize, 14, 1, 30);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const offset = (page - 1) * pageSize;
  const paginationClause = ` LIMIT ${pageSize} OFFSET ${offset}`;
  const [rows] = await pool.execute(
    `SELECT *
     FROM growth_daily_records
     WHERE user_id = ? AND child_id = ?
     ORDER BY record_date DESC
     ${paginationClause}`,
    [userId, childId]
  );
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM growth_daily_records WHERE user_id = ? AND child_id = ?',
    [userId, childId]
  );
  res.json({
    success: true,
    data: {
      list: rows.map(normalizeGrowthRecord),
      pagination: {
        page,
        pageSize,
        total: Number(countRows[0].total || 0)
      }
    }
  });
}

async function growthRecordSummaryHandler(req, res) {
  const userId = getUserId(req);
  const childId = Number(req.query.childId || 0);
  const periodDays = normalizeBoundedInt(req.query.days, 7, 7, 30);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const startDate = getRecentDateValue(periodDays - 1);
  const [rows] = await pool.execute(
    `SELECT *
     FROM growth_daily_records
     WHERE user_id = ? AND child_id = ? AND record_date >= ?
     ORDER BY record_date ASC`,
    [userId, childId, startDate]
  );
  const list = rows.map(normalizeGrowthRecord);
  const dimensionKeys = ['moodStatus', 'appetiteStatus', 'sleepStatus', 'exerciseStatus', 'socialStatus'];
  const averages = {};
  dimensionKeys.forEach((key) => {
    const values = list.map((item) => getGrowthStatusScore(key, item[key])).filter(Boolean);
    averages[key] = values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : 0;
  });
  const overallValues = Object.values(averages).filter(Boolean);
  const overallScore = overallValues.length ? Number((overallValues.reduce((sum, value) => sum + value, 0) / overallValues.length).toFixed(2)) : 0;
  const weakestKey = Object.entries(averages).sort((a, b) => a[1] - b[1])[0] || ['moodStatus', 0];
  res.json({
    success: true,
    data: {
      childId,
      periodDays,
      completedDays: list.length,
      overallScore,
      overallLabel: buildGrowthTrendLabel(overallScore),
      weakestDimension: weakestKey[0],
      averages,
      latestRecord: list[list.length - 1] || null
    }
  });
}

async function buildWeeklySummaryPayload(userId, child, weekStart) {
  const weekEnd = getWeekEndDateValue(weekStart);
  const ageGroup = inferAgeRangeFromChild(child) || '3-4岁';
  const [growthRows] = await pool.execute(
    `SELECT *
     FROM growth_daily_records
     WHERE user_id = ? AND child_id = ? AND record_date BETWEEN ? AND ?
     ORDER BY record_date ASC`,
    [userId, child.id, weekStart, weekEnd]
  );
  const [planRows] = await pool.execute(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_total
     FROM daily_plan_records
     WHERE user_id = ? AND child_id = ? AND plan_date BETWEEN ? AND ?`,
    [userId, child.id, weekStart, weekEnd]
  );
  const [taskRows] = await pool.execute(
    `SELECT COUNT(*) AS completed_total
     FROM task_progress
     WHERE child_id = ? AND status = 'completed' AND completed_at BETWEEN ? AND DATE_ADD(?, INTERVAL 1 DAY)`,
    [child.id, weekStart, weekEnd]
  );
  const growthList = growthRows.map(normalizeGrowthRecord);
  const summaryBase = {
    moodStatus: 0,
    appetiteStatus: 0,
    sleepStatus: 0,
    exerciseStatus: 0,
    socialStatus: 0
  };
  growthList.forEach((item) => {
    Object.keys(summaryBase).forEach((key) => {
      summaryBase[key] += getGrowthStatusScore(key, item[key]);
    });
  });
  Object.keys(summaryBase).forEach((key) => {
    summaryBase[key] = growthList.length ? Number((summaryBase[key] / growthList.length).toFixed(2)) : 0;
  });
  const weakestDimension = Object.entries(summaryBase).sort((a, b) => a[1] - b[1])[0] || ['moodStatus', 0];
  const weakestDimensionLabel = getWeeklyDimensionLabel(weakestDimension[0]);
  const sceneProfile = getWeeklySummaryProfileByDimension(weakestDimension[0]);
  const article = await getRecommendedParentingArticle(ageGroup, sceneProfile.articleCategory, sceneProfile.articleKeyword, userId);
  const recipe = getRecommendedNutritionRecipe(ageGroup);
  const recommendedContent = [
    article ? {
      type: 'parenting_article',
      title: article.title,
      summary: article.summary || '',
      targetPath: `/pages/parenting/article-detail/article-detail?id=${article.id}`
    } : null,
    recipe ? {
      type: 'nutrition_recipe',
      title: recipe.title || recipe.name,
      summary: (recipe.nutrition && recipe.nutrition.highlight) || recipe.description || '',
      targetPath: `/pages/nutrition/recipe-detail/recipe-detail?id=${encodeURIComponent(recipe.id)}`
    } : null
  ].filter(Boolean);
  return {
    childId: child.id,
    childName: child.name || '',
    ageGroup,
    weekStart,
    weekEnd,
    recordDays: growthList.length,
    completedPlanCount: Number(planRows[0].completed_total || 0),
    totalPlanCount: Number(planRows[0].total || 0),
    completedTaskCount: Number(taskRows[0].completed_total || 0),
    dimensionScores: summaryBase,
    weakestDimension: weakestDimension[0],
    weakestDimensionLabel,
    overview: growthList.length
      ? `本周共记录${growthList.length}天，${buildGrowthTrendLabel(Object.values(summaryBase).reduce((sum, item) => sum + item, 0) / 5 || 0)}。`
      : '本周还没有形成连续记录，先从每天30秒的成长记录开始。',
    highlights: [
      Number(planRows[0].completed_total || 0) > 0 ? `本周完成了${Number(planRows[0].completed_total || 0)}次今日育儿计划。` : '本周的计划完成次数还可以继续提高。',
      Number(taskRows[0].completed_total || 0) > 0 ? `能力训练完成${Number(taskRows[0].completed_total || 0)}次，执行节奏正在形成。` : '本周能力训练触达较少，适合下周固定一个时段开始。'
    ],
    concernsFull: [
      `当前更值得优先观察的是${weakestDimensionLabel}。`,
      growthList.length < 4 ? '记录天数还偏少，下周先把记录频率稳定下来。' : '建议把家庭观察和固定动作继续配套执行。'
    ],
    concernsPreview: [
      `当前更值得优先观察的是${weakestDimensionLabel}。`
    ],
    nextActionsFull: [
      '下周继续保留每天一个固定记录时段。',
      `围绕${sceneProfile.articleCategory}再补一篇方法文并尝试一条动作。`,
      '继续跟踪趋势变化和建议完成度，优先把家庭里的固定动作做稳。'
    ],
    nextActionsPreview: [
      '下周继续保留每天一个固定记录时段。',
      `围绕${sceneProfile.articleCategory}先补一篇方法文。`
    ],
    recommendedContentPremium: recommendedContent,
    recommendedContentPreview: recommendedContent.slice(0, 1),
    premiumTip: '会员可查看更细的趋势解释、完整下周建议和更多推荐内容。'
  };
}

function formatWeeklySummaryForMembership(payload, activeMember) {
  const data = Object.assign({}, payload || {});
  const concernsPreview = Array.isArray(data.concernsPreview) ? data.concernsPreview : (Array.isArray(data.concerns) ? data.concerns.slice(0, 1) : []);
  const concernsFull = Array.isArray(data.concernsFull) ? data.concernsFull : (Array.isArray(data.concerns) ? data.concerns : concernsPreview);
  const nextActionsPreview = Array.isArray(data.nextActionsPreview) ? data.nextActionsPreview : (Array.isArray(data.nextActions) ? data.nextActions.slice(0, 2) : []);
  const nextActionsFull = Array.isArray(data.nextActionsFull) ? data.nextActionsFull : (Array.isArray(data.nextActions) ? data.nextActions : nextActionsPreview);
  const recommendedContentPreview = Array.isArray(data.recommendedContentPreview) ? data.recommendedContentPreview : (Array.isArray(data.recommendedContent) ? data.recommendedContent.slice(0, 1) : []);
  const recommendedContentPremium = Array.isArray(data.recommendedContentPremium) ? data.recommendedContentPremium : (Array.isArray(data.recommendedContent) ? data.recommendedContent : recommendedContentPreview);
  return Object.assign({}, data, {
    concerns: activeMember ? concernsFull : concernsPreview,
    nextActions: activeMember ? nextActionsFull : nextActionsPreview,
    recommendedContent: activeMember ? recommendedContentPremium : recommendedContentPreview,
    premiumUnlocked: !!activeMember,
    premiumTip: activeMember ? '本周已解锁完整周总结。' : (data.premiumTip || '会员可查看更细的趋势解释、完整下周建议和更多推荐内容。')
  });
}

async function weeklySummaryHandler(req, res) {
  const userId = getUserId(req);
  const childId = Number(req.query.childId || 0);
  const weekStart = getWeekStartDateValue(req.query.weekStart || req.query.date);
  const activeMember = await isActiveMember(userId);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const [rows] = await pool.execute(
    `SELECT *
     FROM weekly_growth_summaries
     WHERE user_id = ? AND child_id = ? AND week_start = ?
     LIMIT 1`,
    [userId, childId, weekStart]
  );
  let payload = null;
  if (rows.length && rows[0].summary_payload) {
    try {
      payload = JSON.parse(rows[0].summary_payload);
    } catch (err) {
      payload = null;
    }
  }
  if (payload && (!Array.isArray(payload.concernsFull) || !Array.isArray(payload.nextActionsFull))) {
    payload = null;
  }
  if (!payload) {
    payload = await buildWeeklySummaryPayload(userId, child, weekStart);
    await pool.execute(
      `INSERT INTO weekly_growth_summaries (user_id, child_id, week_start, week_end, summary_payload, generated_from)
       VALUES (?, ?, ?, ?, ?, 'server')
       ON DUPLICATE KEY UPDATE week_end = VALUES(week_end), summary_payload = VALUES(summary_payload), generated_from = 'server', updated_at = CURRENT_TIMESTAMP`,
      [userId, childId, weekStart, payload.weekEnd, JSON.stringify(payload)]
    );
  }
  res.json({ success: true, data: formatWeeklySummaryForMembership(payload, activeMember) });
}

async function sceneSearchTagsHandler(req, res) {
  const [rows] = await pool.execute(
    `SELECT scene_key, scene_title, scene_category, principle_text, suggested_action
     FROM parenting_scene_tags
     WHERE status = 'active'
     ORDER BY sort_order ASC, id ASC`
  );
  res.json({
    success: true,
    data: rows.map((row) => ({
      sceneKey: row.scene_key,
      sceneTitle: row.scene_title,
      sceneCategory: row.scene_category,
      principleText: row.principle_text || '',
      suggestedAction: row.suggested_action || ''
    }))
  });
}

async function searchParentingArticlesByKeyword(keyword, page, pageSize, userId) {
  const searchTerm = `%${String(keyword || '').trim()}%`;
  const safePage = normalizeBoundedInt(page, 1, 1, 1000000);
  const safePageSize = normalizeBoundedInt(pageSize, 10, 1, 20);
  const offset = (safePage - 1) * safePageSize;
  const paginationClause = ` LIMIT ${safePageSize} OFFSET ${offset}`;
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
    data.push(await normalizeArticle(row, userId || 0));
  }
  return data;
}

async function sceneSearchSolutionsHandler(req, res) {
  const keyword = String(req.query.keyword || '').trim();
  const sceneKey = String(req.query.sceneKey || '').trim();
  const childId = Number(req.query.childId || 0);
  const userId = req.user ? getUserId(req) : 0;
  let child = null;
  if (userId) {
    child = childId ? await getOwnedChild(userId, childId) : await getDefaultChildForUser(userId);
  }
  const ageGroup = child ? (inferAgeRangeFromChild(child) || '3-4岁') : '3-4岁';
  let matchedScene = null;
  if (sceneKey) {
    const [sceneRows] = await pool.execute('SELECT * FROM parenting_scene_tags WHERE scene_key = ? AND status = ? LIMIT 1', [sceneKey, 'active']);
    matchedScene = sceneRows[0] || null;
  }
  if (!matchedScene && keyword) {
    const searchTerm = `%${keyword}%`;
    const [sceneRows] = await pool.execute(
      `SELECT t.*
       FROM parenting_scene_tags t
       LEFT JOIN parenting_scene_aliases a ON a.scene_key = t.scene_key AND a.status = 'active'
       WHERE t.status = 'active'
         AND (t.scene_title LIKE ? OR a.alias_text LIKE ?)
       ORDER BY t.sort_order ASC, a.sort_order ASC
       LIMIT 1`,
      [searchTerm, searchTerm]
    );
    matchedScene = sceneRows[0] || null;
  }
  if (!matchedScene) {
    const fallbackArticles = keyword ? await searchParentingArticlesByKeyword(keyword, 1, 10, userId) : [];
    res.json({
      success: true,
      data: {
        matched: false,
        scene: null,
        solutions: [],
        articles: fallbackArticles
      }
    });
    return;
  }
  const profile = getSceneProfileByKey(matchedScene.scene_key);
  const article = await getRecommendedParentingArticle(ageGroup, profile.articleCategory, profile.articleKeyword || keyword, userId || 0);
  const recipe = getRecommendedNutritionRecipe(ageGroup);
  const task = child ? await getRecommendedReadingTask(child.id, ageGroup, profile.subjectCode) : null;
  const [recommendationRows] = await pool.execute(
    `SELECT *
     FROM parenting_scene_recommendations
     WHERE scene_key = ? AND (age_group = '' OR age_group = ?)
     ORDER BY sort_order ASC, id ASC`,
    [matchedScene.scene_key, ageGroup]
  );
  const solutions = recommendationRows.map((row) => ({
    type: row.result_type,
    title: row.title,
    summary: row.summary || '',
    targetType: row.target_type || '',
    targetId: row.target_id || '',
    targetPath: row.target_path || ''
  }));
  if (article) {
    solutions.push({
      type: 'parenting_article',
      title: article.title,
      summary: article.summary || '',
      targetType: 'parenting_article',
      targetId: String(article.id),
      targetPath: `/pages/parenting/article-detail/article-detail?id=${article.id}`
    });
  }
  if (task) {
    solutions.push({
      type: 'ability_task',
      title: task.title,
      summary: task.objective || task.parent_prompt || '',
      targetType: 'knowledge_task',
      targetId: String(task.id),
      targetPath: `/pages/textbook/knowledge-detail/knowledge-detail?pointId=${encodeURIComponent(task.task_code || String(task.id))}&subjectCode=${encodeURIComponent(task.subject_code || '')}&pointName=${encodeURIComponent(task.title || '')}&childId=${child.id}`
    });
  }
  if (recipe) {
    solutions.push({
      type: 'nutrition_recipe',
      title: recipe.title || recipe.name,
      summary: (recipe.nutrition && recipe.nutrition.highlight) || recipe.description || '',
      targetType: 'nutrition_recipe',
      targetId: String(recipe.id),
      targetPath: `/pages/nutrition/recipe-detail/recipe-detail?id=${encodeURIComponent(recipe.id)}`
    });
  }
  res.json({
    success: true,
    data: {
      matched: true,
      scene: {
        sceneKey: matchedScene.scene_key,
        sceneTitle: matchedScene.scene_title,
        sceneCategory: matchedScene.scene_category,
        principleText: matchedScene.principle_text || '',
        suggestedAction: matchedScene.suggested_action || ''
      },
      solutions,
      articles: article ? [article] : []
    }
  });
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

async function childAvatarUploadHandler(req, res) {
  const file = await parseMultipartFile(req);
  const extension = inferUploadExtension(file.filename, file.mimeType);
  if (!extension) {
    res.status(400).json({ success: false, message: '仅支持 jpg、png、webp、gif 图片' });
    return;
  }
  const fileName = `${Date.now()}_${req.user.userId}_${crypto.randomBytes(6).toString('hex')}${extension}`;
  const targetPath = path.join(AVATAR_UPLOAD_DIR, fileName);
  await fs.promises.writeFile(targetPath, file.buffer);
  res.json({
    success: true,
    data: {
      url: `/uploads/avatars/${fileName}`
    }
  });
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
  const readCount = Number(row.read_count || 0);
  const category = row.category || '';
  const ageGroup = row.age_group || '';
  return {
    id: row.id,
    title: row.title,
    summary: row.summary || '',
    content: row.content || '',
    category,
    categoryName: category,
    sub_category: row.sub_category || '',
    age_group: ageGroup,
    ageRange: ageGroup,
    tags: row.tags || '',
    author: row.author || '',
    evidence_level: row.evidence_level || '',
    read_count: readCount,
    viewCount: readCount,
    publishTime: row.created_at || '',
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
  const page = normalizeBoundedInt(req.query.page, 1, 1, 1000000);
  const pageSize = normalizeBoundedInt(req.query.page_size, 10, 1, 20);
  const offset = (page - 1) * pageSize;
  const paginationClause = ` LIMIT ${pageSize} OFFSET ${offset}`;
  const params = [];
  let whereClause = 'WHERE is_published = 1';
  if (req.query.category) {
    whereClause += ' AND category = ?';
    params.push(req.query.category);
  }
  if (req.query.age_group) {
    whereClause += ' AND age_group = ?';
    params.push(req.query.age_group);
  }
  if (req.query.keyword) {
    whereClause += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)';
    const searchTerm = `%${String(req.query.keyword).trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
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
  const page = normalizeBoundedInt(req.query.page, 1, 1, 1000000);
  const pageSize = normalizeBoundedInt(req.query.page_size, 10, 1, 20);
  const data = await searchParentingArticlesByKeyword(keyword, page, pageSize, getUserId(req));
  res.json({ success: true, data });
}

async function parentingCommentsHandler(req, res) {
  const page = normalizeBoundedInt(req.query.page, 1, 1, 1000000);
  const pageSize = normalizeBoundedInt(req.query.page_size, 20, 1, 50);
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
  const normalizedRow = applyCanonicalReadingTask(row);
  const practiceMaterialSection = resolvePracticeMaterialSection(normalizedRow);
  return {
    id: normalizedRow.id,
    task_code: normalizedRow.task_code,
    title: normalizedRow.title,
    subject_code: normalizedRow.subject_code,
    age_range: normalizedRow.age_range,
    difficulty: normalizedRow.difficulty,
    duration: normalizedRow.duration,
    material: getReadingDisplayMaterial(normalizedRow, practiceMaterialSection),
    objective: normalizedRow.objective,
    steps: normalizedRow.steps ? String(normalizedRow.steps).split(/\n+/).filter(Boolean) : [],
    parent_prompt: normalizedRow.parent_prompt || '',
    content: normalizedRow.content || '',
    image_url: normalizedRow.image_url || '',
    icon_url: normalizedRow.icon_url || '',
    cover_image: normalizedRow.cover_image || '',
    audio_url: normalizedRow.audio_url || '',
    video_url: normalizedRow.video_url || '',
    tips: normalizedRow.tips || '',
    example_answer: normalizedRow.example_answer || '',
    status: normalizedRow.status || 'pending',
    progress: normalizedRow.progress || 0
  };
}

async function educationTasksTodayHandler(req, res) {
  const childId = Number(req.query.childId || 0);
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const grade = normalizeEducationGrade(req.query.grade, child);
  const likeGrade = `%${grade || inferAgeRangeFromChild(child) || '3-4岁'}%`;
  let [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE t.age_range LIKE ?
     ORDER BY t.difficulty ASC, t.id ASC
     LIMIT 4`,
    [childId, likeGrade]
  );
  if (!rows.length) {
    [rows] = await pool.execute(
      `SELECT t.*, tp.status, tp.progress
       FROM reading_tasks t
       LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
       ORDER BY t.difficulty ASC, t.id ASC
       LIMIT 4`,
      [childId]
    );
  }
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
  const effectiveGrade = normalizeEducationGrade(req.query.grade, child) || inferAgeRangeFromChild(child) || null;
  let [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE (? IS NULL OR t.subject_code = ?)
       AND (? IS NULL OR t.age_range LIKE ?)
     ORDER BY t.difficulty ASC, t.id ASC`,
    [childId, subjectCode, subjectCode, effectiveGrade, effectiveGrade ? `%${effectiveGrade}%` : null]
  );
  if (!rows.length) {
    [rows] = await pool.execute(
      `SELECT t.*, tp.status, tp.progress
       FROM reading_tasks t
       LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
       WHERE (? IS NULL OR t.subject_code = ?)
       ORDER BY t.difficulty ASC, t.id ASC`,
      [childId, subjectCode, subjectCode]
    );
  }
  const chaptersMap = new Map();
  for (const item of rows) {
    const row = applyCanonicalReadingTask(item);
    const chapterId = `${row.subject_code || 'general'}-${row.difficulty || 1}`;
    if (!chaptersMap.has(chapterId)) {
      chaptersMap.set(chapterId, {
        id: chapterId,
        name: getChapterDisplayName(row.subject_code, row.difficulty),
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
  const row = applyCanonicalReadingTask(rows[0]);
  const keyPoints = String(row.steps || '').split(/\n+/).filter(Boolean).map((content, index) => ({ id: index + 1, content }));
  const subjectName = getSubjectDisplayName(row.subject_code);
  const practiceMaterialSection = resolvePracticeMaterialSection(row);
  const parsedContent = splitBracketSections(practiceMaterialSection.content);
  const displayMaterial = getReadingDisplayMaterial(row, practiceMaterialSection);
  const displayMaterialLabel = getReadingDisplayMaterialLabel(practiceMaterialSection);
  const explainContent = buildReadingTaskExplainContent(Object.assign({}, row, {
    material_label: displayMaterialLabel,
    material: displayMaterial,
    content: practiceMaterialSection.content
  }));
  const practices = buildReadingTaskPractices(row, keyPoints);
  const readingSections = buildReadingStructuredSections(row, practiceMaterialSection, parsedContent);
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
        icon: row.icon_url || getSubjectVisualIcon(row.subject_code),
        title: `${subjectName} · ${getDifficultyLabel(row.difficulty || 1)}`,
        desc: row.objective || row.material || ''
      },
      explain: {
        title: row.title,
        content: explainContent
      },
      keyPoints,
      difficulties: row.tips ? [{ id: 1, content: row.tips }] : [],
      examples: row.example_answer ? [{ id: 1, title: '参考答案', question: row.parent_prompt || row.objective || row.title, answer: row.example_answer, analysis: row.content || row.tips || '' }] : [],
      practices,
      practice_material: practiceMaterialSection.value,
      practice_material_label: practiceMaterialSection.value ? practiceMaterialSection.label : '',
      reading_sections: readingSections,
      material_label: displayMaterialLabel,
      material: displayMaterial,
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

async function accountDeletionHandler(req, res) {
  const userId = getUserId(req);
  const [users] = await pool.execute('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
  if (!users.length) {
    res.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [children] = await connection.execute('SELECT id FROM children WHERE user_id = ?', [userId]);
    for (const child of children) {
      const [records] = await connection.execute('SELECT id FROM assessment_records WHERE child_id = ?', [child.id]);
      for (const record of records) {
        await connection.execute('DELETE FROM assessment_dimensions WHERE record_id = ?', [record.id]);
      }
      await connection.execute('DELETE FROM assessment_records WHERE child_id = ?', [child.id]);
      await connection.execute('DELETE FROM task_progress WHERE child_id = ?', [child.id]);
    }

    await connection.execute('DELETE FROM children WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'daily_plan_completions', 'DELETE FROM daily_plan_completions WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'daily_plan_records', 'DELETE FROM daily_plan_records WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'growth_daily_records', 'DELETE FROM growth_daily_records WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'weekly_growth_summaries', 'DELETE FROM weekly_growth_summaries WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'chat_messages', 'DELETE FROM chat_messages WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'event_tracks', 'DELETE FROM event_tracks WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'subscriptions', 'DELETE FROM subscriptions WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'user_memberships', 'DELETE FROM user_memberships WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'promo_codes', 'UPDATE promo_codes SET user_id = NULL, status = ? WHERE user_id = ?', ['unused', userId]);
    await executeIfTableExists(connection, 'payment_orders', 'DELETE FROM payment_orders WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'referrals', 'DELETE FROM referrals WHERE inviter_id = ? OR invitee_id = ?', [userId, userId]);
    await executeIfTableExists(connection, 'user_favorites', 'DELETE FROM user_favorites WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'article_likes', 'DELETE FROM article_likes WHERE user_id = ?', [userId]);
    await executeIfTableExists(connection, 'article_comments', 'DELETE FROM article_comments WHERE user_id = ?', [userId]);
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
    await connection.commit();
    res.json({ success: true, message: '账号已注销' });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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

function normalizeEducationGrade(rawGrade, child) {
  const value = String(rawGrade || '').trim();
  if (!value) {
    return inferAgeRangeFromChild(child) || '';
  }

  if (value.indexOf('岁') !== -1) {
    return value;
  }

  const gradeIndex = Number(value);
  const gradeMap = {
    1: '3-4岁',
    2: '3-4岁',
    3: '3-4岁',
    4: '3-4岁',
    5: '4-5岁',
    6: '5-6岁',
    7: '6-9岁',
    8: '6-9岁',
    9: '6-9岁',
    10: '9-12岁',
    11: '9-12岁',
    12: '9-12岁',
    13: '9-12岁',
    14: '9-12岁'
  };

  if (gradeMap[gradeIndex]) {
    return gradeMap[gradeIndex];
  }

  return inferAgeRangeFromChild(child) || '';
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

async function kbEventTrackHandler(req, res) {
  const eventType = String((req.body && req.body.event_type) || '').trim();
  if (!eventType) {
    res.status(400).json({ success: false, message: 'event_type不能为空' });
    return;
  }

  const payload = {
    module_key: req.body.module_key || null,
    page_key: req.body.page_key || null,
    content_type: req.body.content_type || null,
    content_id: req.body.content_id || null,
    child_id: req.body.child_id || null,
    task_id: req.body.task_id || null,
    path_id: req.body.path_id || null,
    share_source: req.body.share_source || null,
    day_index: req.body.day_index || null,
    score: req.body.score || null,
    duration_sec: req.body.duration_sec || null,
    has_recording: !!req.body.has_recording,
    event_meta: req.body.event_meta || {}
  };

  const [result] = await pool.execute(
    'INSERT INTO event_tracks (user_id, event_type, event_data, session_id) VALUES (?, ?, ?, ?)',
    [req.user.userId, eventType, JSON.stringify(payload), req.headers.authorization || 'authenticated']
  );

  res.json({ success: true, data: { id: result.insertId } });
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
