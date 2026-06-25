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

loadEnv(path.resolve(__dirname, '../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const app = express();
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const API_PREFIXES = Array.from(new Set([API_PREFIX, '/api/v1']));
const ADMIN_API_PREFIX = process.env.ADMIN_API_PREFIX || '/admin-api/v1';
const PORT = Number(process.env.PORT || 3002);
const HOST = process.env.HOST || '127.0.0.1';
const JWT_SECRET = process.env.JWT_SECRET;
const WECHAT_REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.WECHAT_REQUEST_TIMEOUT_MS || 10000) || 10000);
const CHAT_AI_TIMEOUT_MS = Math.max(1000, Number(process.env.CHAT_AI_TIMEOUT_MS || 60000) || 60000);
const CHAT_RATE_LIMIT_WINDOW_MS = Math.max(1000, Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS || 60000) || 60000);
const CHAT_RATE_LIMIT_MAX = Math.max(1, Number(process.env.CHAT_RATE_LIMIT_MAX || 12) || 12);
const SCENE_TAGS_CACHE_TTL_MS = Math.max(1000, Number(process.env.SCENE_TAGS_CACHE_TTL_MS || 30000) || 30000);
const PARENTING_ARTICLES_CACHE_TTL_MS = Math.max(1000, Number(process.env.PARENTING_ARTICLES_CACHE_TTL_MS || 30000) || 30000);
const REQUEST_SLOW_LOG_MS = Math.max(100, Number(process.env.REQUEST_SLOW_LOG_MS || 800) || 800);
const DB_POOL_CONNECTION_LIMIT = Math.max(1, Number(process.env.DB_POOL_CONNECTION_LIMIT || 20) || 20);
const WECHAT_PAY_HOST = 'api.mch.weixin.qq.com';
const SIGNUP_REWARD_DAYS = 7;
const SIGNUP_REWARD_PLAN_CODE = 'signup_reward';
const SIGNUP_REWARD_MEMBERSHIP_TYPE = 'gift';
const SIGNUP_REWARD_TYPE = 'signup_reward';
const REFERRAL_REWARD_DAYS = 7;
const REFERRAL_MAX_DAYS = 60;
const UNIFIED_PROMO_CODE = String(
  process.env.MEMBERSHIP_PROMO_CODE || process.env.UNIFIED_MEMBERSHIP_PROMO_CODE || 'zgxn'
).trim().toUpperCase();
const UNIFIED_PROMO_DAYS = Math.max(1, Number(process.env.MEMBERSHIP_PROMO_DAYS || 60) || 60);
const UNIFIED_PROMO_PLAN_CODE = 'promo_2month';
const UNIFIED_PROMO_MEMBERSHIP_TYPE = 'gift';
const UNIFIED_PROMO_TYPE = 'unified_membership_2month';
const RAW_NUTRITION_RECIPES = require('../nutrition-recipes.json');
const NUTRITION_RECIPES = RAW_NUTRITION_RECIPES
  .map((recipe) => sanitizeNutritionRecipeSource(recipe))
  .filter(Boolean);
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
  connectionLimit: DB_POOL_CONNECTION_LIMIT,
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

const virtualPayConfig = {
  offerId: process.env.WECHAT_VIRTUAL_PAY_OFFER_ID || process.env.XPAY_OFFER_ID || '',
  env: Number(process.env.WECHAT_VIRTUAL_PAY_ENV || process.env.XPAY_ENV || 1) === 0 ? 0 : 1,
  sandboxAppKey: process.env.WECHAT_VIRTUAL_PAY_SANDBOX_APP_KEY || process.env.XPAY_SANDBOX_APP_KEY || '',
  appKey: process.env.WECHAT_VIRTUAL_PAY_APP_KEY || process.env.XPAY_APP_KEY || '',
  mode: process.env.WECHAT_VIRTUAL_PAY_MODE || process.env.XPAY_MODE || 'short_series_goods',
  productIds: {
    month: process.env.WECHAT_VIRTUAL_PAY_PRODUCT_MONTH || process.env.XPAY_PRODUCT_MONTH || '',
    quarter: process.env.WECHAT_VIRTUAL_PAY_PRODUCT_QUARTER || process.env.XPAY_PRODUCT_QUARTER || '',
    year: process.env.WECHAT_VIRTUAL_PAY_PRODUCT_YEAR || process.env.XPAY_PRODUCT_YEAR || ''
  }
};

const wechatMessagePushConfig = {
  token: process.env.WECHAT_MESSAGE_PUSH_TOKEN || process.env.WX_MESSAGE_PUSH_TOKEN || ''
};

const READING_TASK_MAP = READING_TASKS.reduce((acc, task) => {
  if (task && task.task_code) {
    acc[task.task_code] = task;
  }
  return acc;
}, {});

const READING_TASK_ALIAS_MAP = buildReadingTaskAliasMap();
const VALID_PARENTING_CATEGORIES = new Set(['情绪管理', '行为习惯', '认知发展', '社交能力', '营养健康']);
const VALID_PARENTING_AGE_GROUPS = new Set(['2-3岁', '3-4岁', '4-5岁', '5-6岁', '6-9岁']);
const VALID_SUBJECT_CODES = new Set(['logical_thinking', 'reading_comprehension', 'expression_communication', 'learning_metacognition', 'inquiry_creativity']);
const VALID_CONTENT_FORMS = new Set(['theory', 'method', 'both']);
const VALID_TIP_DISPLAY_TYPES = new Set(['action', 'insight', 'raw']);
const chatRateLimitStore = new Map();
let sceneTagsCache = {
  expiresAt: 0,
  data: null
};
const parentingArticlesCache = new Map();
let wechatPlatformCertificateCache = {
  loadedAt: 0,
  certificates: []
};

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

app.use(['/wechat/message-push'].concat(API_PREFIXES.map((prefix) => `${prefix}/wechat/message-push`)), express.text({ type: '*/*', limit: '2mb' }));
app.use(express.json({
  limit: '2mb',
  verify: (req, res, buf) => {
    if (API_PREFIXES.some((prefix) => req.originalUrl === `${prefix}/payment/notify`)) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
app.use('/uploads', express.static(UPLOAD_ROOT));
app.use('/admin-console', express.static(ADMIN_PORTAL_ROOT));
app.get('/admin-console', adminPortalHandler);
app.get('/admin-console/*', adminPortalHandler);
app.use('/marketing', express.static(path.resolve(__dirname, '../../../宣传计划')));

app.get('/health', healthHandler);
app.get('/wechat/message-push', asyncHandler(wechatMessagePushHandler));
app.all('/wechat/message-push', asyncHandler(wechatMessagePushHandler));
for (const prefix of API_PREFIXES) {
  app.get(`${prefix}/health`, healthHandler);
  app.get(`${prefix}/runtime/config`, runtimeConfigHandler);
  app.post(`${prefix}/auth/login`, asyncHandler(loginHandler));
  app.post(`${prefix}/auth/refresh`, asyncHandler(refreshHandler));
  app.get(`${prefix}/auth/me`, authenticateToken, asyncHandler(meHandler));
  app.post(`${prefix}/auth/bind-phone`, authenticateToken, asyncHandler(bindPhoneHandler));
  app.post(`${prefix}/auth/account-deletion`, authenticateToken, asyncHandler(accountDeletionHandler));
  app.get(`${prefix}/membership/info`, authenticateToken, asyncHandler(membershipInfoHandler));
  app.post(`${prefix}/membership/trial/activate`, authenticateToken, asyncHandler(trialHandler));
  app.post(`${prefix}/membership/promo/redeem`, authenticateToken, asyncHandler(promoHandler));
  app.get(`${prefix}/referral/stats`, authenticateToken, asyncHandler(referralStatsHandler));
  app.get(`${prefix}/referral/code`, authenticateToken, asyncHandler(referralCodeHandler));
  app.post(`${prefix}/payment/create`, authenticateToken, asyncHandler(createPaymentOrderHandler));
  app.post(`${prefix}/payment/virtual-order`, authenticateToken, asyncHandler(virtualOrderHandler));
  app.post(`${prefix}/payment/unified-order`, authenticateToken, asyncHandler(unifiedOrderHandler));
  app.get(`${prefix}/payment/query/:order_no`, authenticateToken, asyncHandler(queryPaymentHandler));
  app.post(`${prefix}/payment/notify`, asyncHandler(paymentNotifyHandler));
  app.get(`${prefix}/wechat/message-push`, asyncHandler(wechatMessagePushHandler));
  app.all(`${prefix}/wechat/message-push`, asyncHandler(wechatMessagePushHandler));
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
  app.post(`${prefix}/marketing/generate`, asyncHandler(marketingGenerateHandler));
  app.options(`${prefix}/marketing/generate`, (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
  });
  app.get(`${prefix}/feedback`, authenticateToken, asyncHandler(feedbackListHandler));
  app.post(`${prefix}/feedback`, authenticateToken, asyncHandler(feedbackSubmitHandler));
  app.all(`${prefix}/chat*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
  app.all(`${prefix}/recommendations*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);
}

async function marketingGenerateHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const topic = String((req.body && req.body.topic) || '').trim();
  const platform = String((req.body && req.body.platform) || 'xhs').trim();
  const contentType = String((req.body && req.body.content_type) || 'post').trim();

  if (!topic) {
    res.status(400).json({ success: false, message: '请输入选题/主题' });
    return;
  }

  const validPlatforms = new Set(['xhs', 'douyin', 'gzh', 'wechat', 'cover', 'headline']);
  const platformName = validPlatforms.has(platform) ? platform : 'xhs';

  const systemPrompt = getMarketingSystemPrompt(platformName, contentType);
  const prompt = `请为以下选题创作营销内容：${topic}`;

  try {
    const aiResult = await generateAIAnswer(prompt, {
      systemPrompt,
      temperature: 0.8,
      maxTokens: 4000
    });

    if (!aiResult.success) {
      res.json({
        success: true,
        data: {
          content: `【${platformName === 'xhs' ? '小红书' : platformName === 'douyin' ? '抖音' : platformName === 'gzh' ? '公众号' : platformName === 'wechat' ? '私聊话术' : platformName === 'cover' ? '封面标题' : '选题标题'}文案】\n\nAI 服务当前不可用（${aiResult.message}），以下是基础模板：\n\n标题：${topic}\n\n请参考右侧话术库和内容中心中的现有素材，或稍后重试。`,
          source: 'fallback',
          provider: null,
          model: null
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        content: aiResult.answer,
        source: 'ai',
        provider: aiResult.provider,
        model: aiResult.model
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        content: `【内容框架】\n主题：${topic}\n\n请参考话术库中的模板手动撰写，或稍后重试。`,
        source: 'error',
        provider: null,
        model: null
      }
    });
  }
}

async function feedbackSubmitHandler(req, res) {
  const userId = req.user.id;
  const type = String((req.body && req.body.type) || '其他');
  const content = String((req.body && req.body.content) || '').trim();
  const contact = String((req.body && req.body.contact) || '').trim();

  if (!content || content.length < 5) {
    res.status(400).json({ success: false, message: '反馈内容不能少于5个字' });
    return;
  }

  const validTypes = ['功能异常/Bug', '体验建议', '内容问题', '其他'];
  const finalType = validTypes.includes(type) ? type : '其他';

  await pool.execute(
    'INSERT INTO feedbacks (user_id, type, content, contact) VALUES (?, ?, ?, ?)',
    [userId, finalType, content, contact]
  );

  res.json({ success: true, message: '感谢你的反馈！' });
}

async function feedbackListHandler(req, res) {
  const userId = req.user.id;
  const [rows] = await pool.execute(
    'SELECT id, type, content, status, created_at FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [userId]
  );

  const list = rows.map(row => ({
    ...row,
    created_at: formatDateValue(row.created_at),
    type_text: row.type || '其他',
    content: row.content.length > 200 ? row.content.substring(0, 200) + '...' : row.content
  }));

  res.json({ success: true, list });
}

const MARKETING_SYSTEM_PROMPT_BASE = `你是资深母婴/亲子类新媒体内容策划专家，专注于为儿童体育培训机构和育儿成长类小程序创作传播内容。

核心受众：2-8岁孩子的妈妈（宝妈），她们日常最焦虑的场景包括——
- 孩子一写作业就跑开/坐不住/拖拉磨蹭
- 孩子说话晚/不爱开口/复述说不清
- 饭桌挑食/一叫吃饭就对抗/吃饭拖拉超40分钟
- 睡前哭闹/夜醒反复/入睡困难
- 绘本翻两页就走/亲子共读坐不住
- 放学回家就想玩iPad/约定10分钟总超时
- 两个孩子抢玩具/大宝学小宝哭/手足冲突
- 每天早上出门磨蹭/去幼儿园就哭/放学问不出话

品牌定位：先看清孩子当前短板，再决定怎么陪，带娃更省心。
产品核心动作：成长观察（3分钟看清短板）→ 10分钟亲子练习 → 7天成长服务。

写作铁律：
1. 开头必须用具体家庭场景（"晚饭后刚拿出作业本""早上7:40你眼看就迟到了""睡前你累得不行孩子突然开始哭"）
2. 正文先共情（"很多家里都有这种情况""你是不是也这样"），再给判断点，再给一句话可执行建议
3. 少用抽象词（任务/方法/问题/训练/方向），多用场景词（写作业/亲子共读/饭桌吃饭/睡前洗漱/出门上课）
4. 标题要让人"一眼就觉得说的就是我家"（用"孩子一X就Y"句式或"先别急着X"句式）
5. 结尾统一用一个CTA：先做成长观察/先看清短板/先领7天服务
6. 语气：像一个懂育儿的过来人妈妈在分享，不是专家在讲课`;

function getMarketingSystemPrompt(platform, contentType) {
  const platformGuides = {
    xhs: `【小红书图文文案要求】
- 字数600-800字
- 每段不超过3行，多用短句和换行
- 正文开头2-3句就要让家长代入
- 内容结构：痛点场景 → 家长常见误区 → 2-4个判断点 → 1个可执行建议 → 结尾CTA
- 适合收藏和转发
- emoji适量使用（每段1-2个即可）`,
    douyin: `【抖音/视频号口播脚本要求】
- 总时长25-40秒（约120-180字）
- 前3秒必须出现具体家庭场景（"你见过孩子饭都没吃两口就想跑吗"）
- 中间10-15秒给2-3个判断线索
- 最后5秒CTA
- 语言像真实家长聊天，不是播音腔
- 同时输出：口播文案、字幕文案（精简版）、封面标题`,
    gzh: `【公众号文章要求】
- 字数1200-1800字
- 有真实育儿场景引入
- 分段清晰，每段有小标题
- 包含判断逻辑和可执行方法
- 结尾引导先做成长观察
- 语气专业、温和、可信`,
    wechat: `【私聊/社群话术要求】
- 2-3句话即可
- 第一句给价值（"我这边有个成长观察工具"）
- 第二句给场景（"很多家长看完后才知道孩子先抓什么"）
- 第三句给入口（"我发您，3分钟先看一眼"）
- 语气像朋友推荐，不是推销`,
    cover: `【封面标题要求】
- 主标题控制在14-18字
- 副标题控制在10-16字
- 主标题用"孩子一X就Y"或"先别急着X"句式
- 一眼能看出痛点场景`,
    headline: `【选题标题要求】
- 输出5个备选标题
- 每个标题12-20字
- 要用"孩子一X就Y""先别急着X""为什么你越X孩子越Y"等高打开率句式
- 每个标题都要让家长觉得"这说的就是我家"`
  };

  return `${MARKETING_SYSTEM_PROMPT_BASE}\n\n${platformGuides[platform] || platformGuides.xhs}`;
}

app.post(`${ADMIN_API_PREFIX}/auth/login`, asyncHandler(adminLoginHandler));
app.post(`${ADMIN_API_PREFIX}/auth/password`, authenticateAdmin, asyncHandler(adminChangePasswordHandler));
app.get(`${ADMIN_API_PREFIX}/auth/me`, authenticateAdmin, asyncHandler(adminMeHandler));
app.get(`${ADMIN_API_PREFIX}/dashboard/overview`, authenticateAdmin, asyncHandler(adminDashboardOverviewHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/users/trends`, authenticateAdmin, asyncHandler(adminUserTrendsHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/revenue/trends`, authenticateAdmin, asyncHandler(adminRevenueTrendsHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/features/ranking`, authenticateAdmin, asyncHandler(adminFeatureRankingHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/content/ranking`, authenticateAdmin, asyncHandler(adminContentRankingHandler));
app.get(`${ADMIN_API_PREFIX}/insights/weekly`, authenticateAdmin, asyncHandler(adminWeeklyInsightsHandler));
app.get(`${ADMIN_API_PREFIX}/segments/:segmentKey/users`, authenticateAdmin, asyncHandler(adminSegmentUsersHandler));
app.get(`${ADMIN_API_PREFIX}/content/ops/overview`, authenticateAdmin, asyncHandler(adminContentOpsOverviewHandler));
app.get(`${ADMIN_API_PREFIX}/content/ops/tips`, authenticateAdmin, asyncHandler(adminContentOpsTipsHandler));
app.get(`${ADMIN_API_PREFIX}/content/ops/articles`, authenticateAdmin, asyncHandler(adminContentOpsArticlesHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/ai-chat/overview`, authenticateAdmin, asyncHandler(adminAiChatOverviewHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/ai-chat/fallback-queries`, authenticateAdmin, asyncHandler(adminAiChatFallbackQueriesHandler));
app.get(`${ADMIN_API_PREFIX}/analytics/ai-chat/recent`, authenticateAdmin, asyncHandler(adminAiChatRecentHandler));

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

function parseRuntimeBooleanEnv(name, fallbackValue) {
  const rawValue = String(process.env[name] || '').trim().toLowerCase();
  if (!rawValue) {
    return fallbackValue;
  }
  if (['1', 'true', 'yes', 'on'].includes(rawValue)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(rawValue)) {
    return false;
  }
  return fallbackValue;
}

function getRuntimeFeatureFlags(aiStatus) {
  return {
    ai_chat_enabled: parseRuntimeBooleanEnv('RUNTIME_AI_CHAT_ENABLED', aiStatus.configured),
    assessments_enabled: parseRuntimeBooleanEnv('RUNTIME_ASSESSMENTS_ENABLED', true),
    education_enabled: parseRuntimeBooleanEnv('RUNTIME_EDUCATION_ENABLED', true),
    parenting_enabled: parseRuntimeBooleanEnv('RUNTIME_PARENTING_ENABLED', true),
    daily_plan_enabled: parseRuntimeBooleanEnv('RUNTIME_DAILY_PLAN_ENABLED', true),
    growth_record_enabled: parseRuntimeBooleanEnv('RUNTIME_GROWTH_RECORD_ENABLED', true),
    weekly_summary_enabled: parseRuntimeBooleanEnv('RUNTIME_WEEKLY_SUMMARY_ENABLED', true),
    scene_search_enabled: parseRuntimeBooleanEnv('RUNTIME_SCENE_SEARCH_ENABLED', true),
    multimodal_enabled: parseRuntimeBooleanEnv('RUNTIME_MULTIMODAL_ENABLED', false),
    payment_enabled: parseRuntimeBooleanEnv('RUNTIME_PAYMENT_ENABLED', false),
    ai_mock_fallback: parseRuntimeBooleanEnv('RUNTIME_AI_MOCK_FALLBACK', false)
  };
}

function runtimeConfigHandler(req, res) {
  const aiStatus = getAIStatus();
  const runtimeFlags = getRuntimeFeatureFlags(aiStatus);
  res.json({
    env_name: process.env.NODE_ENV || 'production',
    debug: process.env.NODE_ENV !== 'production',
    ai_chat_enabled: runtimeFlags.ai_chat_enabled,
    assessments_enabled: runtimeFlags.assessments_enabled,
    education_enabled: runtimeFlags.education_enabled,
    parenting_enabled: runtimeFlags.parenting_enabled,
    daily_plan_enabled: runtimeFlags.daily_plan_enabled,
    growth_record_enabled: runtimeFlags.growth_record_enabled,
    weekly_summary_enabled: runtimeFlags.weekly_summary_enabled,
    scene_search_enabled: runtimeFlags.scene_search_enabled,
    multimodal_enabled: runtimeFlags.multimodal_enabled,
    payment_enabled: runtimeFlags.payment_enabled,
    ai_mock_fallback: runtimeFlags.ai_mock_fallback,
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

async function adminChangePasswordHandler(req, res) {
  const adminUserId = req.admin.adminUserId;
  const oldPassword = String((req.body && req.body.old_password) || (req.body && req.body.oldPassword) || '').trim();
  const newPassword = String((req.body && req.body.new_password) || (req.body && req.body.newPassword) || '').trim();

  if (!oldPassword || !newPassword) {
    res.status(400).json({ success: false, message: '请输入原密码和新密码' });
    return;
  }
  if (newPassword.length < 8) {
    res.status(400).json({ success: false, message: '新密码至少 8 位' });
    return;
  }

  const [rows] = await pool.execute('SELECT password_hash FROM admin_users WHERE id = ? LIMIT 1', [adminUserId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '后台账号不存在' });
    return;
  }
  if (!verifyAdminPassword(oldPassword, rows[0].password_hash)) {
    res.status(401).json({ success: false, message: '原密码不正确' });
    return;
  }

  await pool.execute('UPDATE admin_users SET password_hash = ? WHERE id = ?', [hashAdminPassword(newPassword), adminUserId]);
  res.json({ success: true, message: '密码已更新' });
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

async function adminContentOpsOverviewHandler(req, res) {
  const [tipRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_active,
       SUM(CASE WHEN display_type = 'action' THEN 1 ELSE 0 END) AS action_count,
       SUM(CASE WHEN display_type = 'insight' THEN 1 ELSE 0 END) AS insight_count,
       SUM(CASE WHEN display_type = 'raw' OR display_type IS NULL OR display_type = '' THEN 1 ELSE 0 END) AS raw_count,
       SUM(CASE WHEN display_type IN ('action', 'insight') AND NULLIF(TRIM(COALESCE(display_title, '')), '') IS NOT NULL AND NULLIF(TRIM(COALESCE(display_text, '')), '') IS NOT NULL THEN 1 ELSE 0 END) AS structured_ready_count,
       SUM(CASE WHEN display_type IN ('action', 'insight') AND NULLIF(TRIM(COALESCE(display_title, '')), '') IS NULL THEN 1 ELSE 0 END) AS missing_display_title_count,
       SUM(CASE WHEN display_type IN ('action', 'insight') AND NULLIF(TRIM(COALESCE(display_text, '')), '') IS NULL THEN 1 ELSE 0 END) AS missing_display_text_count,
       MAX(updated_at) AS latest_tip_updated_at
      FROM parenting_tips
     WHERE is_active = 1`
  );
  const [articleRows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_published,
       SUM(CASE WHEN content_form = 'theory' THEN 1 ELSE 0 END) AS theory_count,
       SUM(CASE WHEN content_form = 'method' THEN 1 ELSE 0 END) AS method_count,
       SUM(CASE WHEN content_form = 'both' THEN 1 ELSE 0 END) AS both_count,
       SUM(CASE WHEN content_form IS NULL OR content_form = '' THEN 1 ELSE 0 END) AS unclassified_count,
       SUM(CASE WHEN read_count >= 100 THEN 1 ELSE 0 END) AS high_read_count,
       MAX(updated_at) AS latest_article_updated_at
      FROM articles
     WHERE is_published = 1`
  );

  const tips = tipRows[0] || {};
  const articles = articleRows[0] || {};
  const totalActiveTips = Number(tips.total_active || 0);
  const totalPublishedArticles = Number(articles.total_published || 0);

  res.json({
    success: true,
    data: {
      tips: {
        total_active: totalActiveTips,
        action_count: Number(tips.action_count || 0),
        insight_count: Number(tips.insight_count || 0),
        raw_count: Number(tips.raw_count || 0),
        structured_ready_count: Number(tips.structured_ready_count || 0),
        missing_display_title_count: Number(tips.missing_display_title_count || 0),
        missing_display_text_count: Number(tips.missing_display_text_count || 0),
        structured_ready_rate: calculateRatio(tips.structured_ready_count, totalActiveTips),
        latest_updated_at: tips.latest_tip_updated_at || null
      },
      articles: {
        total_published: totalPublishedArticles,
        theory_count: Number(articles.theory_count || 0),
        method_count: Number(articles.method_count || 0),
        both_count: Number(articles.both_count || 0),
        unclassified_count: Number(articles.unclassified_count || 0),
        high_read_count: Number(articles.high_read_count || 0),
        classified_rate: calculateRatio(totalPublishedArticles - Number(articles.unclassified_count || 0), totalPublishedArticles),
        latest_updated_at: articles.latest_article_updated_at || null
      }
    }
  });
}

async function adminContentOpsTipsHandler(req, res) {
  const limit = clampAdminLimit(req.query.limit, 8);
  const displayType = String(req.query.display_type || req.query.displayType || '').trim();
  const keyword = String(req.query.keyword || '').trim();
  if (displayType && !VALID_TIP_DISPLAY_TYPES.has(displayType)) {
    res.status(400).json({ success: false, message: 'display_type参数无效' });
    return;
  }

  const params = [];
  let whereClause = 'WHERE is_active = 1';
  if (displayType) {
    whereClause += ' AND display_type = ?';
    params.push(displayType);
  }
  if (keyword) {
    const search = `%${keyword}%`;
    whereClause += ' AND (title LIKE ? OR content LIKE ? OR display_title LIKE ? OR display_text LIKE ? OR source_article_title LIKE ?)';
    params.push(search, search, search, search, search);
  }

  const [rows] = await pool.execute(
    `SELECT id, title, display_title, display_text, display_type, display_priority, category, age_group,
            source_article_title, display_source_type, display_source_id, updated_at
       FROM parenting_tips
       ${whereClause}
      ORDER BY display_priority DESC, updated_at DESC, id DESC
      LIMIT ${limit}`,
    params
  );

  res.json({
    success: true,
    data: {
      filters: { limit, display_type: displayType || '', keyword },
      items: rows.map((row) => ({
        id: row.id,
        title: row.display_title || row.title || `锦囊${row.id}`,
        raw_title: row.title || '',
        text: row.display_text || '',
        display_type: row.display_type || 'raw',
        display_priority: Number(row.display_priority || 0),
        category: row.category || '',
        age_group: row.age_group || '',
        source_article_title: row.source_article_title || '',
        source_type: row.display_source_type || '',
        source_id: row.display_source_id || null,
        updated_at: row.updated_at || null
      }))
    }
  });
}

async function adminContentOpsArticlesHandler(req, res) {
  const limit = clampAdminLimit(req.query.limit, 8);
  const contentForm = String(req.query.content_form || req.query.contentForm || '').trim();
  const keyword = String(req.query.keyword || '').trim();
  if (contentForm && !VALID_CONTENT_FORMS.has(contentForm)) {
    res.status(400).json({ success: false, message: 'content_form参数无效' });
    return;
  }

  const params = [];
  let whereClause = 'WHERE is_published = 1';
  if (contentForm) {
    whereClause += ' AND content_form = ?';
    params.push(contentForm);
  }
  if (keyword) {
    const search = `%${keyword}%`;
    whereClause += ' AND (title LIKE ? OR summary LIKE ? OR category LIKE ? OR tags LIKE ?)';
    params.push(search, search, search, search);
  }

  const [rows] = await pool.execute(
    `SELECT id, title, summary, category, age_group, content_form, read_count, updated_at
       FROM articles
       ${whereClause}
      ORDER BY updated_at DESC, read_count DESC, id DESC
      LIMIT ${limit}`,
    params
  );

  res.json({
    success: true,
    data: {
      filters: { limit, content_form: contentForm || '', keyword },
      items: rows.map((row) => ({
        id: row.id,
        title: row.title || `文章${row.id}`,
        summary: String(row.summary || '').slice(0, 120),
        category: row.category || '',
        age_group: row.age_group || '',
        content_form: row.content_form || '',
        read_count: Number(row.read_count || 0),
        updated_at: row.updated_at || null
      }))
    }
  });
}

async function adminAiChatOverviewHandler(req, res) {
  const range = parseAdminDateRange(req.query, 14);
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS total_replies,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.answer_source')) = 'ai' THEN 1 ELSE 0 END) AS ai_reply_count,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.answer_source')) = 'knowledge_fallback' THEN 1 ELSE 0 END) AS knowledge_fallback_count,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.answer_source')) = 'age_clarification' THEN 1 ELSE 0 END) AS age_clarification_count,
       SUM(CASE WHEN CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.reference_count')), '0') AS UNSIGNED) = 0 THEN 1 ELSE 0 END) AS zero_reference_count,
       SUM(CASE WHEN CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.reference_count')), '0') AS UNSIGNED) = 1 THEN 1 ELSE 0 END) AS weak_reference_count,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.structured_available')) = 'true' THEN 1 ELSE 0 END) AS structured_count,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.fallback_reason')) = 'AI_NOT_CONFIGURED' THEN 1 ELSE 0 END) AS ai_not_configured_count,
       AVG(CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.duration_sec')), '0') AS DECIMAL(10,2))) AS avg_duration_sec
      FROM event_tracks
     WHERE event_type = 'ai_chat_reply'
       AND created_at >= ?
       AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
    [range.startDate, range.endDate]
  );

  const summary = rows[0] || {};
  const totalReplies = Number(summary.total_replies || 0);
  res.json({
    success: true,
    data: {
      range,
      summary: {
        total_replies: totalReplies,
        ai_reply_count: Number(summary.ai_reply_count || 0),
        knowledge_fallback_count: Number(summary.knowledge_fallback_count || 0),
        age_clarification_count: Number(summary.age_clarification_count || 0),
        zero_reference_count: Number(summary.zero_reference_count || 0),
        weak_reference_count: Number(summary.weak_reference_count || 0),
        structured_count: Number(summary.structured_count || 0),
        ai_not_configured_count: Number(summary.ai_not_configured_count || 0),
        ai_reply_rate: calculateRatio(summary.ai_reply_count, totalReplies),
        structured_rate: calculateRatio(summary.structured_count, totalReplies),
        zero_reference_rate: calculateRatio(summary.zero_reference_count, totalReplies),
        avg_duration_sec: Number(summary.avg_duration_sec || 0)
      }
    }
  });
}

async function adminAiChatFallbackQueriesHandler(req, res) {
  const range = parseAdminDateRange(req.query, 14);
  const limit = clampAdminLimit(req.query.limit, 8);
  const [rows] = await pool.execute(
    `SELECT
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.query_signature')) AS query_signature,
       MAX(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.query_text'))) AS query_text,
       COUNT(*) AS ask_count,
       SUM(CASE WHEN CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.reference_count')), '0') AS UNSIGNED) = 0 THEN 1 ELSE 0 END) AS zero_reference_count,
       SUM(CASE WHEN CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.reference_count')), '0') AS UNSIGNED) = 1 THEN 1 ELSE 0 END) AS weak_reference_count,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.answer_source')) <> 'ai' THEN 1 ELSE 0 END) AS fallback_count,
       SUM(CASE WHEN JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.structured_available')) = 'true' THEN 1 ELSE 0 END) AS structured_count
      FROM event_tracks
     WHERE event_type = 'ai_chat_reply'
       AND created_at >= ?
       AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
       AND JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.answer_source')) <> 'age_clarification'
       AND NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.query_signature')), '') IS NOT NULL
     GROUP BY query_signature
     HAVING zero_reference_count > 0 OR weak_reference_count > 0 OR fallback_count > 0
     ORDER BY zero_reference_count DESC, fallback_count DESC, ask_count DESC
     LIMIT ${limit}`,
    [range.startDate, range.endDate]
  );

  res.json({
    success: true,
    data: {
      range,
      items: rows.map((row) => ({
        query_signature: row.query_signature || '',
        query_text: row.query_text || '',
        ask_count: Number(row.ask_count || 0),
        zero_reference_count: Number(row.zero_reference_count || 0),
        weak_reference_count: Number(row.weak_reference_count || 0),
        fallback_count: Number(row.fallback_count || 0),
        structured_count: Number(row.structured_count || 0)
      }))
    }
  });
}

async function adminAiChatRecentHandler(req, res) {
  const range = parseAdminDateRange(req.query, 7);
  const limit = clampAdminLimit(req.query.limit, 8);
  const [rows] = await pool.execute(
    `SELECT
       created_at,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.query_text')) AS query_text,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.intent')) AS intent,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.sub_intent')) AS sub_intent,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.answer_source')) AS answer_source,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.fallback_reason')) AS fallback_reason,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.matched_type_text')) AS matched_type_text,
       JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.structured_available')) AS structured_available,
       CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.event_meta.reference_count')), '0') AS UNSIGNED) AS reference_count
      FROM event_tracks
     WHERE event_type = 'ai_chat_reply'
       AND created_at >= ?
       AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    [range.startDate, range.endDate]
  );

  res.json({
    success: true,
    data: {
      range,
      items: rows.map((row) => ({
        created_at: row.created_at || null,
        query_text: row.query_text || '',
        intent: row.intent || '',
        sub_intent: row.sub_intent || '',
        answer_source: row.answer_source || '',
        fallback_reason: row.fallback_reason || '',
        matched_type_text: row.matched_type_text || '',
        structured_available: String(row.structured_available || '') === 'true',
        reference_count: Number(row.reference_count || 0)
      }))
    }
  });
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

function cleanupExpiredChatRateLimits(now) {
  for (const [key, value] of chatRateLimitStore.entries()) {
    if (!value || value.resetAt <= now) {
      chatRateLimitStore.delete(key);
    }
  }
}

function consumeChatRateLimit(userId) {
  const now = Date.now();
  cleanupExpiredChatRateLimits(now);
  const key = String(userId || 'guest');
  const current = chatRateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    const next = { count: 1, resetAt: now + CHAT_RATE_LIMIT_WINDOW_MS };
    chatRateLimitStore.set(key, next);
    return {
      allowed: true,
      remaining: Math.max(0, CHAT_RATE_LIMIT_MAX - next.count),
      retryAfterMs: CHAT_RATE_LIMIT_WINDOW_MS
    };
  }
  if (current.count >= CHAT_RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, current.resetAt - now)
    };
  }
  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, CHAT_RATE_LIMIT_MAX - current.count),
    retryAfterMs: Math.max(0, current.resetAt - now)
  };
}

function logRequestDuration(name, startedAt, meta) {
  const durationMs = Date.now() - startedAt;
  if (durationMs < REQUEST_SLOW_LOG_MS) {
    return;
  }
  console.log(`[Perf] ${name} ${durationMs}ms`, meta || {});
}

function buildParentingArticlesCacheKey(query) {
  return JSON.stringify({
    page: normalizeBoundedInt(query.page, 1, 1, 1000000),
    page_size: normalizeBoundedInt(query.page_size, 10, 1, 20),
    category: String(query.category || '').trim(),
    age_group: String(query.age_group || '').trim(),
    keyword: String(query.keyword || '').trim(),
    content_form: String(query.content_form || '').trim()
  });
}

function getCachedParentingArticles(key) {
  const cached = parentingArticlesCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt <= Date.now()) {
    parentingArticlesCache.delete(key);
    return null;
  }
  return cached.value;
}

function setCachedParentingArticles(key, value) {
  parentingArticlesCache.set(key, {
    expiresAt: Date.now() + PARENTING_ARTICLES_CACHE_TTL_MS,
    value
  });
}

async function generateChatAIResultWithTimeout(prompt, options) {
  return Promise.race([
    generateAIAnswer(prompt, options),
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: false, code: 'AI_TIMEOUT', answer: '' });
      }, CHAT_AI_TIMEOUT_MS);
    })
  ]);
}

async function getCachedSceneTags() {
  if (sceneTagsCache.data && sceneTagsCache.expiresAt > Date.now()) {
    return sceneTagsCache.data;
  }
  const [rows] = await pool.execute(
    `SELECT scene_key, scene_title, scene_category, principle_text, suggested_action
     FROM parenting_scene_tags
     WHERE status = 'active'
     ORDER BY sort_order ASC, id ASC`
  );
  const data = rows.map((row) => ({
    sceneKey: row.scene_key,
    sceneTitle: row.scene_title,
    sceneCategory: row.scene_category,
    principleText: row.principle_text || '',
    suggestedAction: row.suggested_action || ''
  }));
  sceneTagsCache = {
    expiresAt: Date.now() + SCENE_TAGS_CACHE_TTL_MS,
    data
  };
  return data;
}

function buildStructuredResponse(answer, references, chatAnalysis) {
  try {
    const tipRefs = references.filter((ref) => ref.sourceType === 'tip' && ref.extra && isParentingTipDisplayable(ref.extra));
    if (!tipRefs.length) return { available: false };

    const tips = tipRefs
      .sort((a, b) => {
        const scoreA = Number(a.extra.chat_tip_quality_score || 0) + Number(a.score || 0);
        const scoreB = Number(b.extra.chat_tip_quality_score || 0) + Number(b.score || 0);
        return scoreB - scoreA;
      })
      .slice(0, 3)
      .map((ref) => ({
        id: ref.extra.id,
        type: ref.extra.display_type || 'raw',
        title: getParentingTipDisplayTitle(ref.extra),
        text: getParentingTipDisplayText(ref.extra),
        rationale: ref.extra.content || '',
        source_type: ref.extra.display_source_type || 'article',
        source_id: ref.extra.display_source_id || null,
        source_title: ref.extra.source_article_title || ref.title || ''
      }))
      .filter((tip) => tip.type !== 'raw' && tip.title && tip.text);

    if (!tips.length) return { available: false };

    const judgment = extractJudgment(answer);

    const followups = generateFollowups(chatAnalysis);

    return {
      available: true,
      judgment,
      tips,
      followups
    };
  } catch (err) {
    console.error('[structured-response] build failed:', err.message);
    return { available: false };
  }
}

function normalizeStructuredTipText(value, maxLength) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[\u0000-\u001f]+/g, ' ')
    .trim();
  if (!text) return '';
  if (!maxLength || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function getParentingTipDisplayTitle(tip) {
  return normalizeStructuredTipText(tip && (tip.display_title || tip.title), 32);
}

function getParentingTipDisplayText(tip) {
  return normalizeStructuredTipText(tip && (tip.display_text || tip.content), 120);
}

function hasSuspiciousParentingTipTitle(title) {
  const text = String(title || '').trim();
  if (!text) return true;
  if (text.length < 6 || text.length > 32) return true;
  if (!/[\u4e00-\u9fff]/.test(text)) return true;
  if (/^[，。！？、；：,.!?;:~\-\s]|^[的地得和与及但把让给在对将]/.test(text)) return true;
  if (/[，。！？、；：,.!?;:~\-\s]$/.test(text)) return true;
  if (/(宝宝孩子|孩子宝宝|宝宝宝宝|孩子孩子|家宝宝孩子|大便性)/.test(text)) return true;
  return false;
}

function getParentingTipQualityScore(tip, keywords) {
  if (!tip) return 0;
  const displayType = String(tip.display_type || '').trim();
  if (displayType !== 'action' && displayType !== 'insight') return 0;

  const title = getParentingTipDisplayTitle(tip);
  const text = getParentingTipDisplayText(tip);
  if (hasSuspiciousParentingTipTitle(title)) return 0;
  if (text.length < 18) return 0;

  let score = 40;
  score += Math.min(12, Number(tip.display_priority || 0));
  score += Math.min(15, countChatKeywordHits([title, text, tip.title, tip.content, tip.category, tip.scene_tags_text].join(' '), keywords) * 5);

  if (String(tip.content_type || '') === 'actionable' || String(tip.content_type || '') === 'stepwise') score += 6;
  if (String(tip.content_type || '') === 'knowledge' || String(tip.content_type || '') === 'evidence') score += 4;
  if (text.length >= 24 && text.length <= 100) score += 8;
  if (title.length >= 8 && title.length <= 22) score += 6;
  if (String(tip.age_group || '').trim()) score += 3;

  return score;
}

function isParentingTipDisplayable(tip) {
  return Number(tip && tip.chat_tip_quality_score) >= 55;
}

function extractJudgment(answer) {
  const text = String(answer || '').trim();
  if (!text) return '';
  const headerMatch = text.match(/^#{1,3}\s+(.+?)(?:\n|$)/m);
  if (headerMatch) return headerMatch[1].slice(0, 50);
  const firstLine = text.split('\n')[0].replace(/^[#{}\[\]*>\-`~\s]+/, '').trim();
  if (firstLine.length >= 6 && firstLine.length <= 60) return firstLine;
  return firstLine.slice(0, 50);
}

function generateFollowups(chatAnalysis) {
  const base = ['为什么这样做有效？', '还有更简单的做法吗？'];
  const subIntent = String((chatAnalysis && chatAnalysis.subIntent) || '').toLowerCase();
  if (subIntent.includes('emotion') || subIntent.includes('meltdown') || subIntent.includes('anxiety')) {
    base.push('孩子多大的时候会好转？');
  }
  if (subIntent.includes('sleep') || subIntent.includes('bedtime')) {
    base.push('如果试了一周还是没效果怎么办？');
  }
  return base;
}

function normalizeChatQuestionSignature(message) {
  return String(message || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\d+/g, '#')
    .replace(/[，。！？、,.!?;:："'“”‘’（）()【】\[\]<>《》\-—_]/g, '')
    .slice(0, 80);
}

async function recordChatAnalyticsEvent(payload) {
  try {
    const message = String(payload.message || '').trim();
    const matchedTypes = Array.isArray(payload.matchedTypes) ? payload.matchedTypes.filter(Boolean) : [];
    const references = Array.isArray(payload.references) ? payload.references : [];
    const structured = payload.structured && payload.structured.available ? payload.structured : null;
    const durationMs = Math.max(0, Number(payload.durationMs || 0));
    const eventPayload = {
      module_key: 'ai_chat',
      page_key: 'chat',
      content_type: 'chat_reply',
      content_id: payload.sessionId || `chat_${Date.now()}`,
      score: references.length,
      duration_sec: Number((durationMs / 1000).toFixed(2)),
      event_meta: {
        query_text: message.slice(0, 200),
        query_signature: normalizeChatQuestionSignature(message),
        intent: payload.intent || '',
        sub_intent: payload.subIntent || '',
        risk_level: payload.riskLevel || '',
        age_group_used: payload.ageGroup || '',
        child_context_source: payload.childContextSource || '',
        answer_source: payload.answerSource || '',
        ai_status: payload.aiStatus || '',
        fallback_reason: payload.fallbackReason || '',
        structured_available: Boolean(structured),
        structured_tip_count: structured && Array.isArray(structured.tips) ? structured.tips.length : 0,
        reference_count: references.length,
        zero_reference: references.length === 0,
        weak_reference: references.length === 1,
        matched_types: matchedTypes,
        matched_type_text: matchedTypes.join(','),
        source_titles: references.map((item) => item.title).filter(Boolean).slice(0, 5)
      }
    };
    await pool.execute(
      'INSERT INTO event_tracks (user_id, event_type, event_data, session_id) VALUES (?, ?, ?, ?)',
      [payload.userId, 'ai_chat_reply', JSON.stringify(eventPayload), String(payload.sessionId || 'chat_reply')]
    );
  } catch (err) {
    console.error('[chat-analytics] track failed:', err.message);
  }
}

async function chatHandler(req, res) {
  const message = String((req.body && req.body.message) || '').trim();
  if (!message) {
    res.status(400).json({ success: false, message: '缺少提问内容' });
    return;
  }
  const startedAt = Date.now();
  try {
    const rateLimit = consumeChatRateLimit(getUserId(req));
    if (!rateLimit.allowed) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000))));
      res.status(429).json({ success: false, message: '提问过于频繁，请稍后再试', code: 'CHAT_RATE_LIMITED' });
      return;
    }

    const chatChildContext = await resolveChatChildContext(req);
    const ageGroup = extractChatAgeGroupFromMessage(message) || chatChildContext.ageGroup;
    const childName = chatChildContext.childName;
    const intent = analyzeChatIntent(message);
    const subIntent = analyzeChatSubIntent(message, intent);
    const riskLevel = analyzeChatRiskLevel(message);
    const chatAnalysis = { intent, subIntent, riskLevel };

    const sessionId = String((req.body && req.body.session_id) || `session_${Date.now()}`);
    if (!ageGroup) {
      const clarificationAnswer = buildChatAgeClarificationAnswer(chatChildContext);
      await recordChatAnalyticsEvent({
        userId: getUserId(req),
        sessionId,
        message,
        intent,
        subIntent,
        riskLevel,
        ageGroup: '',
        childContextSource: chatChildContext.source,
        answerSource: 'age_clarification',
        aiStatus: getAIStatus(),
        fallbackReason: 'AGE_REQUIRED',
        structured: null,
        matchedTypes: [],
        references: [],
        durationMs: Date.now() - startedAt
      });
      res.json({
        success: true,
        data: {
          answer: clarificationAnswer,
          sources: [],
          matched_types: [],
          age_group_used: '',
          session_id: sessionId,
          intent,
          sub_intent: subIntent,
          risk_level: riskLevel,
          answer_source: 'age_clarification',
          ai_status: getAIStatus(),
          fallback_reason: 'AGE_REQUIRED',
          needs_child_age: true,
          child_context_source: chatChildContext.source,
          child_profile_missing: chatChildContext.profileMissing
        }
      });
      return;
    }

    const references = await collectChatReferences(chatAnalysis, message, ageGroup);
    const fallbackAnswer = buildChatAnswer(message, chatAnalysis, references, ageGroup, childName);
    const aiResult = await generateChatAIResultWithTimeout(buildChatPrompt(message, chatAnalysis, references, ageGroup, childName), {
      systemPrompt: getChatSystemPrompt(intent, ageGroup, subIntent, riskLevel),
      temperature: 0.6,
      maxTokens: 4000
    });
    const answer = normalizeChatAnswerOutput(aiResult.success ? aiResult.answer : fallbackAnswer, riskLevel);
    const aiStatus = getAIStatus();
    const fallbackSource = getChatFallbackSource(references);
    const matchedTypes = getChatMatchedTypes(references);

    const structured = buildStructuredResponse(answer, references, chatAnalysis);

    await recordChatAnalyticsEvent({
      userId: getUserId(req),
      sessionId,
      message,
      intent,
      subIntent,
      riskLevel,
      ageGroup,
      childContextSource: chatChildContext.source,
      answerSource: aiResult.success ? 'ai' : fallbackSource,
      aiStatus,
      fallbackReason: aiResult.success ? '' : aiResult.code || '',
      structured,
      matchedTypes,
      references,
      durationMs: Date.now() - startedAt
    });

    res.json({
      success: true,
      data: {
        answer,
        sources: references.map((item) => item.title).slice(0, 5),
        matched_types: matchedTypes,
        age_group_used: ageGroup || '',
        session_id: sessionId,
        intent,
        sub_intent: subIntent,
        risk_level: riskLevel,
        answer_source: aiResult.success ? 'ai' : fallbackSource,
        ai_status: aiStatus,
        fallback_reason: aiResult.success ? null : aiResult.code || null,
        needs_child_age: false,
        child_context_source: chatChildContext.source,
        child_profile_missing: false,
        structured
      }
    });
  } finally {
    logRequestDuration('chatHandler', startedAt, {
      userId: getUserId(req),
      messageLength: message.length,
      statusCode: res.statusCode,
      ageGroup: ageGroup || '(missing)',
      answerSource: aiResult.success ? 'ai' : fallbackSource
    });
  }
}

function buildChatAgeClarificationAnswer(chatChildContext) {
  if (chatChildContext.profileMissing) {
    return [
      '我需要先知道孩子多大，才能按对应年龄段给你更准确的说明和建议。',
      '你可以直接告诉我孩子现在的年龄，比如“2-3岁”或“4岁”。',
      '如果你已经建了孩子档案，也可以先补全生日，我会优先按档案年龄来回答。'
    ].join('\n\n');
  }

  return [
    `我已经找到${chatChildContext.childName ? `${chatChildContext.childName}的` : '孩子的'}档案，但当前还缺少可用的年龄信息。`,
    '你可以直接告诉我孩子现在多大了，比如“1-2岁”或“5岁”。',
    '补上年龄后，我会按这个年龄段的发育特点给你说明原因和家庭建议。'
  ].join('\n\n');
}

async function resolveChatChildContext(req) {
  const bodyProfile = req.body && req.body.child_profile ? req.body.child_profile : null;
  if (bodyProfile) {
    return buildChatChildContext(bodyProfile, 'request_child_profile');
  }

  const rawChildId = req.body && (req.body.child_id !== undefined ? req.body.child_id : req.body.childId);
  const childId = Number(rawChildId || 0);
  if (childId > 0) {
    const child = await getOwnedChild(getUserId(req), childId);
    if (child) {
      return buildChatChildContext(child, 'request_child_id');
    }
  }

  const defaultChild = await getDefaultChildForUser(getUserId(req));
  if (defaultChild) {
    return buildChatChildContext(defaultChild, 'default_child_profile');
  }

  return {
    ageGroup: '',
    childName: '',
    source: 'missing_child_profile',
    profileMissing: true
  };
}

function buildChatChildContext(childProfile, source) {
  const childName = String((childProfile && (childProfile.name || childProfile.nickname)) || '').trim();
  const ageGroup = normalizeChatAgeGroup(childProfile);
  return {
    ageGroup,
    childName,
    source,
    profileMissing: false
  };
}

function normalizeChatAgeGroup(childProfile) {
  const directAgeGroup = String((childProfile && (childProfile.ageGroup || childProfile.age_group || childProfile.age_range)) || '').trim();
  if (directAgeGroup) {
    return normalizeExplicitAgeGroup(directAgeGroup);
  }

  const birthday = String((childProfile && (childProfile.birthday || childProfile.birth_date)) || '').trim();
  if (!birthday) {
    return '';
  }

  const birthdayDate = new Date(`${birthday}T00:00:00Z`);
  if (Number.isNaN(birthdayDate.getTime())) {
    return '';
  }

  return mapBirthdayToAgeGroup(birthdayDate, new Date());
}

function normalizeExplicitAgeGroup(rawAgeGroup) {
  const value = String(rawAgeGroup || '').trim();
  if (!value) {
    return '';
  }
  if (/^\d+-\d+岁$/.test(value)) {
    return value;
  }
  const ageMatch = value.match(/(\d+(?:\.\d+)?)\s*岁/);
  if (!ageMatch) {
    return value;
  }

  const age = Number(ageMatch[1]);
  if (!Number.isFinite(age) || age < 0) {
    return value;
  }
  if (age < 1) {
    return '0-1岁';
  }
  if (age < 2) {
    return '1-2岁';
  }
  if (age < 3) {
    return '2-3岁';
  }
  if (age < 4) {
    return '3-4岁';
  }
  if (age < 5) {
    return '4-5岁';
  }
  if (age < 6) {
    return '5-6岁';
  }
  if (age < 9) {
    return '6-9岁';
  }
  return '9-12岁';
}

function extractChatAgeGroupFromMessage(message) {
  const text = String(message || '').trim();
  if (!text) {
    return '';
  }

  const directMatch = text.match(/(\d+(?:\.\d+)?)\s*[-~到至]\s*(\d+(?:\.\d+)?)\s*岁/);
  if (directMatch) {
    return normalizeExplicitAgeGroup(`${directMatch[1]}岁`);
  }

  const ageMatch = text.match(/(\d+(?:\.\d+)?)\s*岁/);
  if (ageMatch) {
    return normalizeExplicitAgeGroup(`${ageMatch[1]}岁`);
  }

  // 支持中文数字: 一岁 两岁 三岁 ... 十二岁
  const cnNums = { '一':1,'二':2,'两':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'十一':11,'十二':12,'半':0.5 };
  for (const cn of Object.keys(cnNums)) {
    if (text.includes(cn + '岁')) {
      return normalizeExplicitAgeGroup(`${cnNums[cn]}岁`);
    }
    // 也匹配 "X岁半" 形式
    if (text.includes(cn + '岁半')) {
      return normalizeExplicitAgeGroup(`${cnNums[cn] + 0.5}岁`);
    }
  }

  return '';
}

function mapBirthdayToAgeGroup(birthday, now) {
  const months = getMonthDiff(birthday, now);
  if (months < 0) {
    return '';
  }
  if (months < 12) {
    return '0-1岁';
  }
  if (months < 24) {
    return '1-2岁';
  }
  if (months < 36) {
    return '2-3岁';
  }
  if (months < 48) {
    return '3-4岁';
  }
  if (months < 60) {
    return '4-5岁';
  }
  if (months < 72) {
    return '5-6岁';
  }
  if (months < 108) {
    return '6-9岁';
  }
  return '9-12岁';
}

function getMonthDiff(startDate, endDate) {
  const startYear = startDate.getUTCFullYear();
  const startMonth = startDate.getUTCMonth();
  const startDay = startDate.getUTCDate();
  const endYear = endDate.getUTCFullYear();
  const endMonth = endDate.getUTCMonth();
  const endDay = endDate.getUTCDate();

  let months = (endYear - startYear) * 12 + (endMonth - startMonth);
  if (endDay < startDay) {
    months -= 1;
  }
  return months;
}

function getChatFallbackSource(references) {
  if (references.some((item) => item.sourceType === 'article' || item.sourceType === 'task' || item.sourceType === 'scene')) {
    return 'knowledge_fallback';
  }
  return 'seed_knowledge';
}

function getChatMatchedTypes(references) {
  const matchedTypes = [];
  for (const item of references) {
    const sourceType = String((item && item.sourceType) || '').trim();
    if (!sourceType || matchedTypes.includes(sourceType)) {
      continue;
    }
    matchedTypes.push(sourceType);
  }
  return matchedTypes;
}

const CHAT_SUB_INTENT_RULES = [
  { key: 'homework_start', label: '写作业启动', intents: ['focus', 'general'], patterns: [/(写作业|作业)/, /(拖拉|磨蹭|不肯写|坐不住)/], keywords: ['写作业', '作业', '拖拉', '磨蹭'] },
  { key: 'bedtime_routine', label: '睡前洗漱', intents: ['emotion', 'focus', 'general'], patterns: [/(睡前|洗漱|刷牙|上床)/], keywords: ['睡前', '洗漱', '刷牙', '上床'] },
  { key: 'classroom_focus', label: '上课坐不住', intents: ['focus', 'general'], patterns: [/(上课|课堂)/, /(坐不住|动来动去|走神|注意力)/], keywords: ['上课', '课堂', '坐不住', '动来动去', '走神', '注意力'] },
  { key: 'shared_reading_retell', label: '亲子共读复述', intents: ['reading', 'general'], patterns: [/(亲子共读|共读|绘本|阅读)/, /(复述|讲不出来|不会说)/], keywords: ['亲子共读', '共读', '绘本', '阅读', '复述'] },
  { key: 'meal_refusal', label: '吃饭挑食', intents: ['nutrition', 'general'], patterns: [/(吃饭|吃什么|挑食|不好好吃)/], keywords: ['吃饭', '挑食', '吃什么', '进食'] },
  { key: 'emotional_outburst', label: '情绪爆发', intents: ['emotion', 'general'], patterns: [/(发脾气|哭闹|情绪|生气|吼叫)/], keywords: ['发脾气', '哭闹', '情绪', '生气', '吼叫'] }
];

const CHAT_RISK_PATTERNS = {
  high: /(自伤|伤人|打自己|打别人|不想活|发育倒退|退步很明显|连续高烧|抽搐|呼吸困难|拒食很多天|几乎不吃|整夜不睡)/,
  medium: /(持续.*(哭闹|发脾气|睡不好|拒食)|明显影响.*(睡眠|上学|社交|吃饭)|怀疑.*(多动|自闭|发育迟缓|抑郁|焦虑)|需要就医|要不要看医生)/
};

function getChatSystemPrompt(intent, ageGroup, subIntent, riskLevel) {
  const ageContext = ageGroup ? `当前对话的孩子年龄为${ageGroup}。请确保所有建议、活动时长、食材选择和能力预期都严格匹配这个年龄段。` : '如果用户提到孩子的年龄，请确保建议和预期严格匹配该年龄段。';
  const scenarioRule = getChatSubIntentRule(subIntent);
  const scenarioContext = scenarioRule ? `当前核心场景是${scenarioRule.label}。回答时优先围绕这个家庭场景组织建议。` : '优先识别用户描述的家庭场景，把建议落到具体场景里。';
  const riskContext = riskLevel === 'high'
    ? '当前问题带有高风险信号。必须先提示尽快线下咨询医生、心理或发育专业人士，再给家庭临时观察建议。'
    : riskLevel === 'medium'
      ? '当前问题带有中等风险信号。回答中要加入持续观察与必要时线下求助的提醒，但只说一次，语气平实。'
      : '当前问题风险等级较低。优先把建议讲清楚，只有在确实出现明显异常、持续恶化或用户主动问到就医时，再补一句边界提醒。';
  const styleContext = '回答风格像一位专业、温和、很会和家长沟通的老师。用自然对话口吻，少用说明书腔。禁止给段落加标题，禁止说固定结尾句式。';

  const reasoningFramework = `你每次回答必须按以下路径思考，把推理过程自然融入回答：
1. 先判断：用户描述对应哪个发展阶段、哪类常见卡点，一句话点明
2. 再归因：从参考资料中提取最可能的 2-3 个原因，逐个说明
3. 分情况给方案：针对不同原因给出分支建议，每个建议带具体可执行的动作和频次
4. 说预期：告诉家长坚持多久、观察什么指标、到什么程度算好转
5. 保底线：只有在参考资料中明确提到风险信号时，才给一句就医提醒`;

  const baseFrameworks = {
    nutrition: `### 回答结构
先判断喂养阶段和抗拒类型，再归因到味觉敏感、进餐压力或食物接触频率三大方向。方案部分给出食材替换清单和逐步引入的周计划。预期部分说清楚 2-4 周能看到的进食行为变化。

### 回答示例（达到这个深度）
家长问："3岁孩子只吃白米饭和鸡蛋，蔬菜水果都不碰怎么办？"
理想回答：
你现在遇到的情况是"食物新恐期"末段的单一偏好延续，这在 2-4 岁非常常见。两个主要原因：一是孩子的味觉和触觉敏感度还在发育，绿色蔬菜的微苦感和纤维质地需要重复暴露才能脱敏；二是可能之前强制喂食或追着喂，让孩子把"新食物=压力"联系起来了。

接下来可以分两步走。第一步，建议把一份他拒绝的蔬菜（比如西兰花）切成极小块，混入他接受的蛋炒饭里，比例从 1/10 开始，每周提到 2/10，预计 2-3 周他咀嚼和吞咽的接受度会有明显提升。第二步，用"食物接触代替食物吃下去"——每天在他面前用青椒、胡萝卜做你自己的凉拌或炒菜，不劝他吃，只是让他反复看到、闻到、甚至帮妈妈捏一下，通常 3-4 周后他对这些食物的防备心会明显降低。按这个节奏坚持，一个月左右他开始愿意尝试的蔬菜种类通常能从零增加到 1-2 种。暂时不需要担心生长问题，除非连续两次体检体重百分位掉了超过两根线，再考虑发育门诊。`,
    reading: `### 回答结构
先判断卡在"读不懂""说不出""没兴趣"中的哪一步，归因到识字储备、理解策略或表达信心。方案给每日 10-15 分钟的共读脚本模板。预期说 4-6 周在流畅度和复述完整性上的可观察变化。

### 回答示例（达到这个深度）
家长问："5岁孩子共读绘本后问她讲了什么都说'不知道'，怎么办？"
理想回答：
"问完绘本就沉默"多不是理解力问题，是"提取表达"这个环节还没练到。5 岁孩子工作记忆和语言组织还在发展中，开放性提问（"讲了什么"）对孩子来说检索范围太大，不如把问题拆细。

两个最常见的原因：一是提问方式超出了她的组织能力，问"讲了什么"等于让她自己先筛选、再排序、再输出，三步一起完成负担很重；二是她不确定"正确答案"是什么，怕说错就选择不说。

你可以把每日共读 15 分钟拆成三段：先完整读一遍不提问。再翻到某一页，用填空式问法——"小熊走到了什么地方？走到了__？"，她只需要补一个词。第三段再让她挑最喜欢的一页，说出"这一页发生了什么"，你可以用"是这里吗？对，就是这里"先确认她选的对。按这个节奏每天练，预计 3-4 周她在复述时会从单个词跳到半句话，6 周左右能自己说出 2-3 句的逻辑完整复述。如果 6 周后依然完全沉默，再考虑评估语言表达能力。`,
    emotion: `### 回答结构
先给情绪命名帮家长确认孩子在经历什么，归因到发展阶段、环境变动或表达方式限制。方案分"当下安抚"和"长期引导"两层，每层给出具体话术。预期说 1-3 周情绪爆发的频率和强度变化。

### 回答示例（达到这个深度）
家长问："4岁孩子最近每天早上起床都大哭大闹不肯出门，持续两周了，怎么哄都没用。"
理想回答：
每天固定时间段的规律性情绪爆发，孩子很可能不是"故意闹"，而是"晨间过渡困难"——这是 3-5 岁孩子常见的发育现象。两个原因：一是孩子的生物钟和自控中枢需要时间从睡眠切换到清醒状态，这个过渡期大约 15-20 分钟，如果流程太赶或催促太多，焦虑会叠加；二是持续两周说明可能有触发变化——比如幼儿园有了新老师、好朋友请假、或者上周某天出门前有了一次不愉快的经历。

当下安抚用"先接住、再转移"：蹲下抱 30 秒不动，不说"别哭了"，可以轻声数 10 下呼吸——"妈妈和你一起数十下大喘气，1——呼——2——呼——"，这个动作能帮她的自主神经系统从应激态切回平静态。长期做法是每天提前 15 分钟叫醒，用 3 个固定的"晨间锚点"替代催促——比如"先选袜子颜色 → 一起看窗外 1 分钟 → 背上书包"，每完成一步给一个拍手确认。按这个节奏坚持 1 周，爆发频率通常能降到每周 1-2 次，2 周后晨间情绪强度会明显缓下来。如果 3 周后依然每天都爆，而且哭完一整天情绪都低落，可能需要跟老师沟通一下园内情况。`,
    focus: `### 回答结构
先判断是启动困难、维持困难还是切换困难。归因到任务匹配度、环境干扰或自控发育阶段。方案给环境调整清单和分段计时法。预期说 2-4 周在持续时间和启动速度上的变化。

### 回答示例（达到这个深度）
家长问："6岁大班孩子做作业坐不住，写两个字就东张西望、摸橡皮，半小时作业拖成一个半小时。"
理想回答：
你把问题描述得很清楚——核心是维持困难。6 岁大班孩子的持续注意力生理上限是 15-20 分钟，如果任务超过这个时长又没有分段，走神是发育常态而且不是态度问题。

两个主要原因。第一个是任务切粒度过粗：半小时的"语文作业"在孩子眼里是一整块小山，她不知道该从哪里开始、怎么算做完，焦虑会直接表现为摸橡皮。第二个是桌面视觉噪音：彩色铅笔盒、贴纸、零散橡皮、隔壁桌的玩具，6 岁的执行功能还不支持有意识过滤，每扫到一个新物品就等于被"喊"走一次。

建议用"番茄钟切段+物理分区"两个方法同时做。切段法：把 30 分钟作业拆成 2 个 12 分钟的短块，每个短块只规定一个具体动作——"把这一行的 5 个字各写 3 遍"，用倒计时器让她看见时间往回走，12 分钟一响先给 3 分钟自由休息。物理分区：把书桌清到只剩当前任务需要的铅笔、橡皮、本子三样东西，其他物品都收到她看不见的抽屉里。按这个节奏坚持，第一周能看到她从 2 分钟就散焦延长到 5-7 分钟，3-4 周后 12 分钟短块能基本坐满。如果 4 周后依然全程频繁走神，可以再评估感统和注意力的具体维度。`,
    assessment: `### 回答结构
先帮家长把模糊担忧具体化为可观察维度，再与该年龄段发展常模对比。方案建议选 1-2 个最值得优先关注的维度做家庭观察训练。

### 回答示例（达到这个深度）
家长问："我家3岁半，别的同龄孩子都能说完整句子了，他还是两三个字蹦，是不是语言发育慢了？"
理想回答：
先不用慌，3 岁半词汇量从 50 到 600 都在正常范围，关键不是比"别人家的孩子"，而是看他词汇的发展速度和技术变化。建议先做一个两周的家庭观察：每天记录他说出的"新词组"——不是单纯的新词，而是"把两个词连起来"的使用频率，比如"妈妈抱""喝水水""看车车"。3 岁半的常模是自发词组出现率应超过日常表达的 50%。

如果他已经能稳定说出 10 个以上的双词词组（妈妈抱、吃饭饭、出去玩等），那就是在正常轨道上，只是表达风格偏"慢热型"。如果两周观察下来自发词组明显少于 10 个、且你在说话时他有明显的目光回避或完全不理你，再评估听力先。但先不急着紧张，大部分"晚说"的孩子在 4 岁前会有一个突然爆发期。`,
    general: `### 回答结构
先用一句话缩小家长的核心担忧范围，归因到最常见的发展性原因。方案给 1-2 个马上能做的家庭小动作，频率和时长要明确。预期说大概的观察窗口。

### 回答示例（达到这个深度）
家长问："孩子在家话特别多，一到外面见到陌生人就完全不说话，躲在我身后，是不是性格有问题？"
理想回答：
这更像是"选择性缄默的阈值前表现"，而不是性格缺陷。3-6 岁的孩子对陌生环境的焦虑中枢更活跃，在家里话多说明语言能力没问题，在外面沉默是因为大脑把"陌生=潜在危险"的信号放大了。

两个原因：一是她的气质类型偏慢预热型，需要比其他孩子多 3-5 倍的安全感积累才能开始表达；二是她还没有学会"低风险的打招呼方式"，她觉得"说话"就等于"长篇大论"，压力太大了。

你可以试一个小动作：以后在见人前先跟她定一个暗号——"等一下你可以只跟阿姨说一个字——'嗨'，或者只招一下手，随你选。"给她一个极低门槛的表达入口，出门前练两遍，见面时如果她做到了，立刻捏一下她的手作为确认，不要当场夸。每天如果有一个新的人接触就用这个方法，预计 2-3 周她在陌生场景下出声的窗口会缩短，从 30 分钟降到 10 分钟左右。如果 4 周后没有任何变化，且同时在家里也开始沉默，再考虑评估听力或语言沟通障碍。`
  };

  const basePrompts = {
    nutrition: `你是小牛育儿AI助理中的儿童营养与喂养顾问。${ageContext}${scenarioContext}${riskContext}${styleContext}${reasoningFramework}\n\n${baseFrameworks.nutrition}\n\n只能基于提供的知识片段作答，回答要结合家庭执行成本和连续观察方法。`,
    reading: `你是小牛育儿AI助理中的能力成长顾问。${ageContext}${scenarioContext}${riskContext}${styleContext}${reasoningFramework}\n\n${baseFrameworks.reading}\n\n只能基于提供的知识片段作答，回答要围绕阅读理解、表达沟通、逻辑思维和家庭共练。`,
    emotion: `你是小牛育儿AI助理中的儿童情绪支持顾问。${ageContext}${scenarioContext}${riskContext}${styleContext}${reasoningFramework}\n\n${baseFrameworks.emotion}\n\n只能基于提供的知识片段作答，回答要先稳定家庭回应，再给可执行的情绪引导步骤。`,
    focus: `你是小牛育儿AI助理中的专注力支持顾问。${ageContext}${scenarioContext}${riskContext}${styleContext}${reasoningFramework}\n\n${baseFrameworks.focus}\n\n只能基于提供的知识片段作答，回答要关注场景拆解、家长提示语和任务节奏控制。`,
    assessment: `你是小牛育儿AI助理中的成长观察解读顾问。${ageContext}${scenarioContext}${riskContext}${styleContext}${reasoningFramework}\n\n${baseFrameworks.assessment}\n\n只能基于提供的知识片段作答，回答要帮助家长先厘清表现，再建议合适的观察方向和训练重点。`,
    general: `你是小牛育儿AI助理。${ageContext}${scenarioContext}${riskContext}${styleContext}${reasoningFramework}\n\n${baseFrameworks.general}\n\n只能基于提供的知识片段作答，回答要专业、温和、可执行，优先给家长能在家庭场景里立刻开始的下一步。`
  };
  return basePrompts[intent] || basePrompts.general;
}

function buildChatPrompt(message, chatAnalysis, references, ageGroup, childName) {
  const referenceBlock = references.length
    ? references.map((item, index) => `${index + 1}. [${item.sourceType}] ${item.title}\n${String(item.content || '').slice(0, 1000)}`).join('\n\n')
    : '当前没有直接匹配的知识库条目。请你基于通用的育儿知识，给出温和、专业、可操作的建议。先共情家长的困扰，再解释可能的原因，接着给家庭能立刻开始的1-2个小动作，最后提醒观察窗口。不要要求用户补充更多信息。';

  const scenarioRule = getChatSubIntentRule(chatAnalysis.subIntent);
  const riskInstruction = chatAnalysis.riskLevel === 'high'
    ? '当前问题存在高风险信号，必须明确提醒尽快线下就医或咨询专业人士。'
    : chatAnalysis.riskLevel === 'medium'
      ? '当前问题存在中等风险信号，需要加入持续观察与必要时线下求助提醒，但只说一次，不要把提醒写成固定结尾。'
      : '当前问题风险等级较低。重点是把建议讲清楚，除非用户明确问到就医、内容出现明显异常，或情况已经持续恶化，否则不要主动补线下求助提醒。';

  const parts = [
    `用户问题：${message}`,
    `问题类型：${chatAnalysis.intent}`
  ];
  if (scenarioRule) {
    parts.push(`子场景：${scenarioRule.label}`);
  }
  parts.push(`风险等级：${chatAnalysis.riskLevel}`);
  if (childName || ageGroup) {
    parts.push(`孩子信息：${[childName ? `名字${childName}` : '', ageGroup ? `年龄${ageGroup}` : ''].filter(Boolean).join('，')}`);
  }
  parts.push(
    '回答要求：',
    '1. 只允许基于参考资料回答，不补充参考资料之外的育儿结论。',
    '2. 按"判断→归因→方案→预期→底线"路径组织回答，每个环节给出具体内容而不是泛泛而谈。',
    ageGroup ? `3. 所有建议必须严格匹配${ageGroup}的发育特点，不推荐超出此年龄段的活动、食材和能力要求。` : '3. 当年龄信息不足时，明确指出建议准确性受限。',
    '4. 回答要有深度：归因时至少列出 2 个可能原因，方案给具体的执行动作、频次和时长，预期说明观察窗口和好转标准。语气亲和但判断明确。',
    `5. ${riskInstruction}`,
    '参考资料：',
    referenceBlock
  );
  return parts.join('\n\n');
}

function normalizeChatAnswerOutput(answer, riskLevel) {
  let text = String(answer || '').trim();
  if (!text) {
    return '';
  }

  text = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  if (riskLevel === 'low') {
    const paragraphs = text.split(/\n\n+/).map((item) => item.trim()).filter(Boolean);
    const filtered = paragraphs.filter((paragraph, index) => {
      if (index !== paragraphs.length - 1) {
        return true;
      }
      return !/(持续(存在|恶化|加重)|影响(日常生活|睡眠|社交|吃饭|学习|上学)|建议(尽快)?(线下)?咨询.*专业人士|建议咨询.*(心理科|专业人士)|再考虑线下咨询专业人士)/.test(paragraph);
    });
    text = filtered.join('\n\n').trim();
  }

  return text;
}

function analyzeChatIntent(message) {
  const text = String(message || '').toLowerCase();
  if (/(早餐|午餐|晚餐|晚饭|吃饭|挑食|偏食|厌食|不爱吃|不吃|营养|吃什么|食谱|喂养|喂饭)/.test(text)) {
    return 'nutrition';
  }
  if (/(阅读|绘本|复述|识字|共读)/.test(text)) {
    return 'reading';
  }
  if (/(评估|测评|观察|感统|学习适应|多元智能|adhd|多动|发育迟缓|发育问题|自闭|孤独症)/.test(text) || (/(看医生|就医)/.test(text) && /(发育|多动|注意力|感统|语言|社交)/.test(text))) {
    return 'assessment';
  }
  if (/(情绪|脾气|哭闹|发火|生气)/.test(text)) {
    return 'emotion';
  }
  if (/(专注|注意力|走神|拖拉)/.test(text)) {
    return 'focus';
  }
  return 'general';
}

function analyzeChatSubIntent(message, intent) {
  const text = String(message || '');
  for (const rule of CHAT_SUB_INTENT_RULES) {
    if (rule.intents.indexOf(intent) < 0 && rule.intents.indexOf('general') < 0) {
      continue;
    }
    const matched = rule.patterns.every((pattern) => pattern.test(text));
    if (matched) {
      return rule.key;
    }
  }
  return '';
}

function analyzeChatRiskLevel(message) {
  const text = String(message || '');
  if (CHAT_RISK_PATTERNS.high.test(text)) {
    return 'high';
  }
  if (CHAT_RISK_PATTERNS.medium.test(text)) {
    return 'medium';
  }
  return 'low';
}

function getChatSubIntentRule(subIntent) {
  if (!subIntent) {
    return null;
  }
  return CHAT_SUB_INTENT_RULES.find((rule) => rule.key === subIntent) || null;
}

function extractChatKeywords(message) {
  const terms = String(message || '')
    .split(/[\s，。！？、,.!?：:；;（）()【】\[\]"'“”‘’]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const uniqueTerms = [];

  function pushTerm(term) {
    if (!term || term.length < 2 || uniqueTerms.indexOf(term) >= 0) {
      return;
    }
    uniqueTerms.push(term);
  }

  for (const term of terms) {
    pushTerm(term);
    if (hasEnoughChatKeywords(uniqueTerms)) {
      break;
    }

    const chineseFragments = extractChineseSearchFragments(term);
    for (const fragment of chineseFragments) {
      pushTerm(fragment);
      if (hasEnoughChatKeywords(uniqueTerms)) {
        break;
      }
    }

    if (uniqueTerms.length >= 8) {
      break;
    }
  }
  if (!uniqueTerms.length && String(message || '').trim()) {
    uniqueTerms.push(String(message || '').trim().toLowerCase());
  }
  return uniqueTerms;
}

function hasEnoughChatKeywords(keywords) {
  return keywords.length >= 12;
}

function extractChineseSearchFragments(term) {
  const normalized = String(term || '')
    .replace(/(怎么办|怎么做|怎么说|怎么引导|怎么|如何做|如何引导|如何|怎样|什么|可以吗|有没有|为什么|是不是|总是|一直|一下|这个|那个|然后|之后|以后|进行|一起|可以|能够|需要|已经|还是|还有|以及|和|跟|给|把|用|做|前|后|让)/g, ' ')
    .replace(/(孩子|宝宝|小朋友)/g, ' ')
    .replace(/\s+/g, '');

  if (!/[\u4e00-\u9fff]/.test(normalized) || normalized.length < 2) {
    return [];
  }

  const fragments = [];
  const maxWindow = Math.min(4, normalized.length);
  fragments.push(normalized);

  const preferredMatches = normalized.match(/(坐不住|动来动去|不听话|亲子共读|共读|复述|道德教育|说出情绪|说出|表达|上课|注意力|专注|挑食|吃饭|洗漱|写作业|情绪崩溃|情绪|哭闹|发火|拖拉|睡前|流程图|就寝|安睡|阅读|绘本|手语|冷处理|转盘|角色扮演|按摩|纪律|奖励|惩罚|自由|运动|户外活动|蒙台梭利|孕期|孕妇|怀孕|胎儿|妊娠|三岁|四岁|五岁|六岁)/g) || [];
  for (const match of preferredMatches) {
    if (!fragments.includes(match)) {
      fragments.push(match);
    }
  }

  for (let size = maxWindow; size >= 3; size -= 1) {
    for (let index = 0; index <= normalized.length - size; index += 1) {
      const fragment = normalized.slice(index, index + size);
      if (!fragments.includes(fragment)) {
        fragments.push(fragment);
      }
      if (fragments.length >= 12) {
        return fragments;
      }
    }
  }

  return fragments;
}

function createChatScoreText(keywords) {
  return function scoreText(text) {
    const source = String(text || '').toLowerCase();
    return keywords.reduce((total, keyword) => total + (source.includes(keyword) ? 1 : 0), 0);
  };
}

function countChatKeywordHits(text, keywords) {
  const source = String(text || '').toLowerCase();
  const terms = Array.isArray(keywords) ? keywords : [];
  if (!source) {
    return 0;
  }
  return terms.reduce((total, keyword) => total + (source.includes(keyword) ? 1 : 0), 0);
}

function buildChatSearchCondition(fields, keywords) {
  const conditions = [];
  const params = [];
  for (const keyword of keywords) {
    const likeValue = `%${keyword}%`;
    const fieldConditions = fields.map((field) => `${field} LIKE ?`);
    conditions.push(`(${fieldConditions.join(' OR ')})`);
    for (let index = 0; index < fields.length; index++) {
      params.push(likeValue);
    }
  }
  return {
    sql: conditions.length ? ` AND (${conditions.join(' OR ')})` : '',
    params
  };
}

function getChatArticleCategoryFilters(intent) {
  if (intent === 'emotion') {
    return ['情绪管理', '社交能力'];
  }
  if (intent === 'focus') {
    return ['认知发展', '行为习惯'];
  }
  return [];
}

function getChatTaskSubjectFilters(intent, subIntent) {
  if (intent === 'reading' || subIntent === 'shared_reading_retell') {
    return ['reading', 'expression', 'logic'];
  }
  if (intent === 'emotion' || intent === 'focus' || subIntent) {
    return ['expression', 'reading', 'logic'];
  }
  return [];
}

function isReferenceAgeCompatible(reference, ageGroup) {
  if (!ageGroup || !reference || !reference.extra) {
    return false;
  }
  const ageValue = String(reference.extra.age_group || reference.extra.age_range || '').trim();
  if (!ageValue) {
    return false;
  }
  return ageValue === ageGroup || ageValue.indexOf(ageGroup) >= 0;
}

function getChatSourceWeight(chatAnalysis, reference) {
  const sourceType = reference.sourceType;
  if (chatAnalysis.intent === 'reading') {
    if (sourceType === 'task') return 18;
    if (sourceType === 'article') return 12;
    if (sourceType === 'scene') return 8;
  }
  if (chatAnalysis.intent === 'nutrition') {
    if (sourceType === 'recipe') return 18;
    if (sourceType === 'article') return 12;
    if (sourceType === 'scene') return 6;
  }
  if (chatAnalysis.intent === 'assessment') {
    if (sourceType === 'assessment') return 18;
    if (sourceType === 'article') return 8;
  }
  if (chatAnalysis.intent === 'emotion' || chatAnalysis.intent === 'focus') {
    if (sourceType === 'scene') return 18;
    if (sourceType === 'article') return 14;
    if (sourceType === 'task') return 22;
  }
  if (chatAnalysis.intent === 'general') {
    if (sourceType === 'scene') return 14;
    if (sourceType === 'article') return 12;
    if (sourceType === 'task') return 18;
    if (sourceType === 'tip') return 10;
  }
  if (sourceType === 'tip') return 8;
  return 0;
}

function isPregnancyContext(keywords) {
  const terms = Array.isArray(keywords) ? keywords : [];
  return terms.some((keyword) => /(孕期|孕妇|怀孕|胎儿|妊娠)/.test(String(keyword || '')));
}

function getPregnancyReferenceBonus(reference) {
  const sourceText = [
    reference.title,
    reference.content,
    reference.extra && reference.extra.summary,
    reference.extra && reference.extra.tags,
    reference.extra && reference.extra.aliases
  ].filter(Boolean).join(' ');

  if (!/(孕期|孕妇|怀孕|胎儿|妊娠)/.test(sourceText)) {
    return 0;
  }

  let score = 24;
  if (/(孕期|孕妇|怀孕|胎儿|妊娠)/.test(String(reference.title || ''))) {
    score += 12;
  }
  if (reference.sourceType === 'article') {
    score += 8;
  }
  return score;
}

function getChatReferenceScore(reference, chatAnalysis, ageGroup, keywords) {
  let score = Number(reference.score || 0);
  const pregnancyContext = isPregnancyContext(keywords);
  const titleText = String(reference.title || '');
  const summaryText = String(reference.extra && reference.extra.summary || '');
  const tagsText = String(reference.extra && reference.extra.tags || '');
  const aliasesText = String(reference.extra && reference.extra.aliases || '');
  const contentText = String(reference.content || '');
  const sourceText = [
    titleText,
    contentText,
    summaryText,
    tagsText,
    aliasesText,
    reference.extra && reference.extra.principle_text,
    reference.extra && reference.extra.suggested_action,
    reference.extra && reference.extra.parent_prompt,
    reference.extra && reference.extra.steps
  ].filter(Boolean).join(' ');

  const titleHits = countChatKeywordHits(titleText, keywords);
  const summaryHits = countChatKeywordHits(summaryText, keywords);
  const tagsHits = countChatKeywordHits(tagsText, keywords);
  const aliasHits = countChatKeywordHits(aliasesText, keywords);
  const contentHits = countChatKeywordHits(contentText, keywords);

  score += titleHits * 8;
  score += summaryHits * 4;
  score += tagsHits * 5;
  score += aliasHits * 5;
  score += Math.max(0, contentHits - titleHits) * 2;

  if (chatAnalysis.intent === 'general' && titleHits === 0 && tagsHits === 0 && aliasHits === 0) {
    score -= 18;
  }

  if (ageGroup && !pregnancyContext) {
    if (isReferenceAgeCompatible(reference, ageGroup)) {
      score += 40;
    } else if (!(reference.extra && (reference.extra.age_group || reference.extra.age_range))) {
      score += 10;
    }
  }

  if (pregnancyContext) {
    score += getPregnancyReferenceBonus(reference);
  }

  const scenarioRule = getChatSubIntentRule(chatAnalysis.subIntent);
  if (scenarioRule) {
    const scenarioHits = scenarioRule.keywords.reduce((total, keyword) => total + (sourceText.includes(keyword) ? 1 : 0), 0);
    score += scenarioHits * 10;
  }

  if (chatAnalysis.riskLevel !== 'low' && /(就医|医生|专业|评估|持续|明显影响)/.test(sourceText)) {
    score += 8;
  }

  if (reference.sourceType === 'task' && reference.extra && reference.extra.steps) {
    score += 15;
  }

  if (reference.sourceType === 'scene' && reference.extra && (reference.extra.principle_text || reference.extra.suggested_action)) {
    score += 10;
  }

  score += getChatSourceWeight(chatAnalysis, reference);
  return score;
}

function finalizeChatReferences(references, chatAnalysis, ageGroup, keywords) {
  const deduped = [];
  const seen = new Set();
  for (const reference of references) {
    const dedupeKey = `${reference.sourceType}:${reference.title}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    reference.score = getChatReferenceScore(reference, chatAnalysis, ageGroup, keywords);
    deduped.push(reference);
  }
  deduped.sort((a, b) => b.score - a.score);

  const topN = 8;
  const result = [];
  const includedTypes = new Set();

  for (const reference of deduped) {
    if (result.length >= topN) break;
    if (!includedTypes.has(reference.sourceType)) {
      includedTypes.add(reference.sourceType);
      result.push(reference);
    }
  }

  for (const reference of deduped) {
    if (result.length >= topN) break;
    if (!result.includes(reference)) {
      result.push(reference);
    }
  }

  return result;
}

async function collectArticleReferences(keywords, scoreText, intent, ageGroup) {
  const searchCondition = buildChatSearchCondition(['title', 'summary', 'content', 'tags'], keywords);
  const categoryFilters = getChatArticleCategoryFilters(intent);
  let sql = 'SELECT * FROM articles WHERE is_published = 1';
  const params = [];
  if (categoryFilters.length) {
    sql += ` AND category IN (${categoryFilters.map(() => '?').join(',')})`;
    params.push.apply(params, categoryFilters);
  }
  if (ageGroup) {
    sql += ' AND (age_group = ? OR age_group = "" OR age_group IS NULL)';
    params.push(ageGroup);
  }
  sql += searchCondition.sql;
  params.push.apply(params, searchCondition.params);
  sql += ' ORDER BY updated_at DESC, created_at DESC, read_count DESC LIMIT 36';

  const [rows] = await pool.execute(sql, params);
  return rows.map((article) => {
    const score = scoreText([article.title, article.summary, article.content, article.tags].join(' '));
    return {
      title: article.title,
      score,
      content: article.content || article.summary || '',
      extra: article,
      sourceType: 'article'
    };
  }).filter((item) => item.score > 0);
}

async function collectReadingTaskReferences(keywords, scoreText, ageGroup, chatAnalysis) {
  const searchCondition = buildChatSearchCondition(['title', 'objective', 'content', 'parent_prompt', 'steps', 'tips'], keywords);
  const subjectFilters = getChatTaskSubjectFilters(chatAnalysis && chatAnalysis.intent, chatAnalysis && chatAnalysis.subIntent);
  let sql = 'SELECT * FROM reading_tasks WHERE 1 = 1';
  const params = [];
  if (subjectFilters.length) {
    sql += ` AND subject_code IN (${subjectFilters.map(() => '?').join(',')})`;
    params.push.apply(params, subjectFilters);
  }
  if (ageGroup) {
    sql += ' AND (age_range LIKE ? OR age_range IS NULL OR age_range = "")';
    params.push(`%${ageGroup}%`);
  }
  sql += searchCondition.sql;
  params.push.apply(params, searchCondition.params);
  sql += ' ORDER BY difficulty ASC, updated_at DESC, created_at DESC LIMIT 10';

  const [rows] = await pool.execute(sql, params);
  return rows.map((task) => {
    const score = scoreText([task.title, task.objective, task.content, task.parent_prompt, task.steps, task.tips].join(' '));
    return {
      title: task.title,
      score,
      content: task.content || task.objective || '',
      extra: task,
      sourceType: 'task'
    };
  }).filter((item) => item.score > 0);
}

async function collectSceneReferences(keywords, scoreText, ageGroup) {
  const [rows] = await pool.execute(
    `SELECT t.scene_key, t.scene_title, t.scene_category, t.principle_text, t.suggested_action,
            GROUP_CONCAT(DISTINCT a.alias_text ORDER BY a.sort_order SEPARATOR '、') AS aliases,
            GROUP_CONCAT(DISTINCT r.summary ORDER BY r.sort_order SEPARATOR '\n') AS recommendation_summaries
       FROM parenting_scene_tags t
       LEFT JOIN parenting_scene_aliases a ON a.scene_key = t.scene_key AND a.status = 'active'
       LEFT JOIN parenting_scene_recommendations r ON r.scene_key = t.scene_key AND (r.age_group = '' OR r.age_group = ?)
      WHERE t.status = 'active'
      GROUP BY t.scene_key, t.scene_title, t.scene_category, t.principle_text, t.suggested_action
      ORDER BY t.sort_order ASC`,
    [ageGroup || '']
  );
  return rows.map((scene) => {
    const score = scoreText([
      scene.scene_title,
      scene.scene_category,
      scene.aliases,
      scene.principle_text,
      scene.suggested_action,
      scene.recommendation_summaries
    ].join(' '));
    return {
      title: scene.scene_title,
      score,
      content: [scene.principle_text, scene.suggested_action, scene.recommendation_summaries].filter(Boolean).join('\n'),
      extra: scene,
      sourceType: 'scene'
    };
  }).filter((item) => item.score > 0);
}

async function collectParentingTipReferences(keywords, scoreText, ageGroup, chatAnalysis, message) {
  const searchCondition = buildChatSearchCondition(['title', 'content', 'display_title', 'display_text', 'source_article_title', 'category'], keywords);
  let sql = 'SELECT * FROM parenting_tips WHERE is_active = 1';
  const params = [];
  if (ageGroup) {
    sql += ' AND (age_group = ? OR age_group = "" OR age_group IS NULL)';
    params.push(ageGroup);
  }
  sql += searchCondition.sql;
  params.push.apply(params, searchCondition.params);
  sql += ' ORDER BY display_priority DESC, updated_at DESC, created_at DESC LIMIT 36';

  const queryType = detectQueryType(message);

  const [rows] = await pool.execute(sql, params);
  return rows.map((tip) => {
    let sceneTagsText = '';
    try {
      if (tip.scene_tags) {
        const parsed = typeof tip.scene_tags === 'string' ? JSON.parse(tip.scene_tags) : tip.scene_tags;
        if (Array.isArray(parsed)) sceneTagsText = parsed.join('、');
      }
    } catch (e) { /**/ }
    const qualityScore = getParentingTipQualityScore(Object.assign({}, tip, { scene_tags_text: sceneTagsText }), keywords);
    let score = scoreText([tip.title, tip.content, tip.display_title, tip.display_text, tip.category, sceneTagsText].join(' '));
    score += getContentTypeBonus(queryType, tip.content_type);
    score += Math.floor(qualityScore / 10);
    return {
      title: tip.title,
      score,
      content: tip.content || '',
      extra: Object.assign({}, tip, { scene_tags_text: sceneTagsText, chat_tip_quality_score: qualityScore }),
      sourceType: 'tip'
    };
  }).filter((item) => item.score > 0 && item.extra.chat_tip_quality_score >= 40);
}

function detectQueryType(message) {
  const m = String(message || '');

  // Caution must be checked before howto to catch "不要...怎么做" correctly
  if (/不要|别让|避免|注意(什么|哪些)|小心|警惕|危险|风险|不该|误区|陷阱/.test(m)) return 'caution';

  if (/(步骤|第一步|第二步|流程|先后|顺序|先.*再.*然后)/.test(m)) return 'stepwise';

  if (/怎么(做|办|处理|应对|解决|改善|培养|训练|引导|教)|如何(做|处理|应对|培养|训练|引导|改善|提高|提升)|应该?(怎么|如何)/.test(m)) return 'howto';
  if (/(有什么|有哪些|有啥).*(方法|办法|技巧|步骤|建议|策略|妙招|窍门)/.test(m)) return 'howto';
  if (/(方法|办法|技巧|步骤|建议|策略|妙招|窍门).*(有什么|有哪些|有啥)/.test(m)) return 'howto';

  if (/什么是|是什么(意思|原因|概念|含义)|为什么|什么原因|什么意思|解释一下|什么叫|指的是|含义/.test(m)) return 'whatis';

  return 'general';
}

function getContentTypeBonus(queryType, contentType) {
  if (queryType === 'howto' && (contentType === 'actionable' || contentType === 'stepwise')) return 12;
  if (queryType === 'stepwise' && contentType === 'stepwise') return 18;
  if (queryType === 'whatis' && (contentType === 'knowledge' || contentType === 'evidence')) return 12;
  if (queryType === 'caution' && contentType === 'caution') return 12;
  return 0;
}

async function collectChatReferences(chatAnalysis, message, ageGroup) {
  const keywords = extractChatKeywords(message);
  const scoreText = createChatScoreText(keywords);
  const references = [];

  if (chatAnalysis.intent === 'nutrition') {
    for (const recipe of NUTRITION_RECIPES.slice(0, 120)) {
      if (ageGroup && !isRecipeAgeCompatible(recipe.ageRange || recipe.age_range, ageGroup)) continue;
      const score = scoreText([recipe.title, recipe.description, (recipe.ingredients || []).join(' ')].join(' '));
      if (score > 0) {
        references.push({
          title: recipe.title,
          score,
          content: recipe.description || '',
          extra: recipe,
          sourceType: 'recipe'
        });
      }
    }
  }

  try {
    const articleReferences = await collectArticleReferences(keywords, scoreText, chatAnalysis.intent, ageGroup);
    references.push.apply(references, articleReferences);
  } catch (err) {
    console.error('[Chat] collectArticleReferences failed:', err.message);
  }

  if (chatAnalysis.intent === 'reading' || chatAnalysis.intent === 'emotion' || chatAnalysis.intent === 'focus' || chatAnalysis.intent === 'general' || chatAnalysis.subIntent) {
    try {
      const taskReferences = await collectReadingTaskReferences(keywords, scoreText, ageGroup, chatAnalysis);
      references.push.apply(references, taskReferences);
    } catch (err) {
      console.error('[Chat] collectReadingTaskReferences failed:', err.message);
    }
  }

  if (chatAnalysis.intent === 'emotion' || chatAnalysis.intent === 'focus' || chatAnalysis.intent === 'general' || chatAnalysis.subIntent) {
    try {
      const sceneReferences = await collectSceneReferences(keywords, scoreText, ageGroup);
      references.push.apply(references, sceneReferences);
    } catch (err) {
      console.error('[Chat] collectSceneReferences failed:', err.message);
    }
  }

  try {
    const tipReferences = await collectParentingTipReferences(keywords, scoreText, ageGroup, chatAnalysis, message);
    references.push.apply(references, tipReferences);
  } catch (err) {
    console.error('[Chat] collectParentingTipReferences failed:', err.message);
  }

  if (chatAnalysis.intent === 'assessment') {
    for (const [code, meta] of Object.entries(ASSESSMENT_META)) {
      const score = scoreText([code, meta.name, (meta.age_groups || []).join(' ')].join(' '));
      references.push({
        title: meta.name,
        score: Math.max(score, 1),
        content: `${meta.name}，约${meta.duration}分钟，${meta.total_questions}题，适用年龄${(meta.age_groups || []).join('、')}`,
        extra: { code, meta },
        sourceType: 'assessment'
      });
    }
  }

  return finalizeChatReferences(references, chatAnalysis, ageGroup, keywords);
}

function buildChatSections(sections) {
  return sections.filter(Boolean).join('\n\n');
}

function getChatBoundaryText(riskLevel) {
  if (riskLevel === 'high') {
    return '这个问题已经带有较高风险信号，建议尽快线下咨询儿科、儿童保健、发育行为或心理相关专业人士。';
  }
  if (riskLevel === 'medium') {
    return '如果这种情况已经拖了一段时间，或者开始明显影响睡眠、吃饭、上学或亲子互动，尽快线下找专业人士一起看会更稳妥。';
  }
  return '';
}

function getChatScenarioLabel(chatAnalysis) {
  const rule = getChatSubIntentRule(chatAnalysis.subIntent);
  return rule ? rule.label : '';
}

function buildChatAnswer(message, chatAnalysis, references, ageGroup, childName) {
  const intent = chatAnalysis.intent;
  const scenarioLabel = getChatScenarioLabel(chatAnalysis);
  const boundaryText = getChatBoundaryText(chatAnalysis.riskLevel);

  if (intent === 'nutrition') {
    const recipe = references[0] && references[0].extra;
    const article = references.find((item) => item.extra && item.extra.summary);
    const ageNote = ageGroup ? `（${ageGroup}）` : '';
    return buildChatSections([
      `关于${ageNote}“${message}”，先稳吃饭节奏，比先追着多吃更重要。`,
      recipe ? `原理上，孩子对熟悉食物的安全感更强，所以“${recipe.title}”这类搭配更容易接受，${recipe.description || '家里也更容易连续执行。'}` : '原理上，先保留熟悉食物能降低对抗，再少量加入新食物会更容易接受。',
      article ? `${article.extra.summary}` : '你可以先连续试1周，每餐保留一种愿意吃的食物，再少量加一种新食物。',
      '如果一到饭点就开始对抗，你先看是只对晚饭这样，还是三餐都差不多。',
      boundaryText
    ]);
  }

  if (intent === 'reading') {
    const taskReference = references.find((item) => item.sourceType === 'task');
    const articleReference = references.find((item) => item.sourceType === 'article');
    const task = taskReference && taskReference.extra;
    const article = articleReference && articleReference.extra;
    return buildChatSections([
      `关于“${message}”，${scenarioLabel ? `这更像“${scenarioLabel}”这个场景，` : ''}先做短时、低门槛的表达练习会更有效。`,
      task
        ? `你可以先用“${task.title}”这类任务切入，重点是${task.objective || '先让孩子把读到的内容说出来。'}`
        : article
          ? `可以先按“${article.title}”的思路来带，核心是${article.summary || '把共读拆成更短的表达练习。'}`
          : '先从看图说一句、复述一句话开始，每次控制在10分钟内。',
      '原理上，任务越短、提问越具体，孩子越容易开口，也更容易积累成功感。',
      task ? `${task.parent_prompt || '你先说第一句，我帮你接第二句。'} 如果孩子总是不愿意说，你可以再告诉我是卡在看图、复述，还是回答问题。` : '你提问越具体，孩子越容易接得上。如果孩子总是不愿意说，你可以再告诉我是卡在看图、复述，还是回答问题。',
      boundaryText
    ]);
  }

  if (intent === 'assessment') {
    const assessment = references[0] && references[0].extra;
    const meta = assessment && assessment.meta;
    return buildChatSections([
      `关于“${message}”，先把表现具体化，再决定练什么会更准。`,
      meta ? `原理上，先用 ${meta.name} 这类观察把问题收窄，会比直接上训练更容易找准方向；它大约 ${meta.duration} 分钟，适用 ${(meta.age_groups || []).join('、')}。` : '原理上，先把表现观察清楚，再决定训练重点，会比直接加练更准确。',
      '你做之前先回想最近两周最稳定的表现，按常态作答。结果出来后先盯1到2个最需要支持的点。',
      '如果你愿意继续说，也可以直接告诉我现在最担心的是情绪、专注，还是表达。',
      boundaryText
    ]);
  }

  if (intent === 'emotion' || intent === 'focus') {
    const sceneReference = references.find((item) => item.sourceType === 'scene');
    const articleReference = references.find((item) => item.sourceType === 'article');
    const taskReference = references.find((item) => item.sourceType === 'task');
    const scene = sceneReference && sceneReference.extra;
    const article = articleReference && articleReference.extra;
    const task = taskReference && taskReference.extra;
    const summaryText = scene && (scene.principle_text || scene.suggested_action)
      ? [scene.principle_text, scene.suggested_action].filter(Boolean).join('；')
      : article && (article.summary || article.principle_text || article.suggested_action)
        ? (article.summary || article.principle_text || article.suggested_action)
        : '';
    const actionText = task && task.steps
      ? String(task.steps).split('\n').slice(0, 3).join('；')
      : article && article.content
        ? article.content.split('\n\n').slice(0, 2).join('；')
        : '';
    return buildChatSections([
      `关于“${message}”，${scenarioLabel ? `这更像“${scenarioLabel}”这个场景，` : ''}先从家长回应方式下手通常更快见效。`,
      `原理上，${summaryText || '提示语越短、要求越小，孩子当下能调动出来的配合度 usually 会更高。'.replace(' usually ', ' ')}`,
      `${actionText || '你先说出孩子当下的情绪或任务，再只给一个小步骤。'}${task && task.parent_prompt ? ` 你可以直接说：${task.parent_prompt}` : ''}`,
      '如果你想让我帮你继续细化，可以直接补一句最容易出问题的是哪个场景。',
      boundaryText
    ]);
  }

  const sceneReference = references.find((item) => item.sourceType === 'scene');
  const articleReference = references.find((item) => item.sourceType === 'article');
  const taskReference = references.find((item) => item.sourceType === 'task');
  const scene = sceneReference && sceneReference.extra;
  const article = articleReference && articleReference.extra;
  const task = taskReference && taskReference.extra;
  const generalSummaryText = scene && (scene.principle_text || scene.suggested_action)
    ? [scene.principle_text, scene.suggested_action].filter(Boolean).join('；')
    : article && (article.summary || article.principle_text || article.suggested_action)
      ? (article.summary || article.principle_text || article.suggested_action)
      : '';
  const generalActionText = task && task.steps
    ? String(task.steps).split('\n').slice(0, 3).join('；')
    : article && article.content
      ? article.content.split('\n\n').slice(0, 2).join('；')
      : '';

  const hasUsefulRefs = references.length >= 2 || (references.length === 1 && (generalSummaryText || generalActionText));
  const childRef = childName ? `${childName}` : '孩子';

  if (!references.length) {
    if (intent === 'nutrition') {
      return buildChatSections([
        `关于"${message}"，这类情况很常见，先稳节奏会比先逼着多吃更有效。`,
        '原理上，餐桌对抗一上来，孩子会先抗拒吃饭这件事本身，所以先降对抗更关键。',
        '你每餐保留一种愿意吃的食物，再少量加一种新食物，不催、不哄、不拿零食补。',
        childName ? `${childName}先连续试一周，重点看餐桌对抗有没有下降。要是你愿意，也可以再告诉我是挑食，还是吃饭拖拉。` : '先连续试一周，重点看餐桌对抗有没有下降。你也可以再告诉我是挑食，还是吃饭拖拉。',
        boundaryText
      ]);
    }

    if (intent === 'emotion' || intent === 'focus') {
      return buildChatSections([
        `关于"${message}"，我更建议先稳住情绪，再讲道理。`,
        `${ageGroup || '这个年龄段'}的孩子很多时候不是故意对着来，而是当下收不住，所以家长先帮他降下来会更有效。`,
        '你先把话说短一点，比如“我知道你现在很生气”，然后只给一个小选择，比如先喝水还是先安静半分钟。',
        '如果你愿意继续说，可以直接告诉我最近一次闹情绪是在什么场景发生的。',
        boundaryText
      ]);
    }

    return buildChatSections([
      `关于"${message}"，我先给你一个实用判断：先找最常出现的场景，再决定怎么改。`,
      '原理上，同一个问题在不同场景里触发点常常不一样，先找规律会更容易对准办法。',
      `${childRef}在哪个时间点最明显，你就先改那个点，比如换一句提示语，或者把任务拆小一点。`,
      '先连续试3到5天，再看是不是有一点点变顺。你也可以继续告诉我最明显的是早上、吃饭，还是写作业。',
      boundaryText
    ]);
  }

  if (!hasUsefulRefs) {
    return buildChatSections([
      `关于"${message}"，谢谢你把这个问题提出来。`,
      `${generalSummaryText || '先看它最容易出现在什么场景，再决定改哪里。'}`,
      '原理上，先缩小问题场景，建议才更容易落到家庭里。',
      `${generalActionText || '从一个最小的点开始试，先做三五天，不追求一步到位。'} 你也可以直接补充最常出现在什么场景。`,
      boundaryText
    ]);
  }

  return buildChatSections([
    `关于"${message}"，${scenarioLabel ? `这更像"${scenarioLabel}"这个场景，` : ''}先把问题放回具体生活场景里处理会更有效。`,
    `${generalSummaryText || '先抓最明显的一个信号，再围绕这个信号调整家里的回应方式。'}`,
    '原理上，先改最明显的一个点，家长更容易坚持，也更容易看出是不是有效。',
    `${generalActionText || '先改一个最小动作，连续做几天，再决定下一步。'} 如果你愿意继续说，我可以再按具体场景帮你细化。`,
    boundaryText
  ]);
}

async function loginHandler(req, res) {
  const code = req.body && req.body.code;
  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, message: '缺少微信登录code' });
    return;
  }
  const startedAt = Date.now();
  try {
    let session = null;
    try {
      session = await getWechatSession(code);
    } catch (err) {
      if (/timeout/i.test(String(err && err.message))) {
        res.status(504).json({ success: false, message: '微信登录请求超时，请稍后重试' });
        return;
      }
      throw err;
    }
    const { user, isNew: isNewUser } = await findOrCreateUser(session.openid, req.body.userInfo || {}, session.session_key || '');
    let signupReward = null;
    let referralReward = null;

    if (isNewUser) {
      try {
        signupReward = await grantSignupReward(user.id);
      } catch (err) {
        console.error('[Membership] Signup reward failed:', err.message);
      }
    }

    if (isNewUser && req.body.invite_code) {
      try {
        referralReward = await handleReferralSignup(user.id, req.body.invite_code);
      } catch (err) {
        console.error('[Referral] Signup reward failed:', err.message);
      }
    }

    const payload = { userId: user.id, openid: user.openid, username: user.nickname || '微信用户' };
    res.json({
      success: true,
      data: {
        user,
        token: signToken(payload),
        refresh_token: signToken(Object.assign({}, payload, { tokenType: 'refresh' })),
        signup_reward: signupReward,
        referral_reward: referralReward
      }
    });
  } finally {
    logRequestDuration('loginHandler', startedAt, {
      hasInviteCode: Boolean(req.body && req.body.invite_code),
      statusCode: res.statusCode
    });
  }
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
  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, phone_number, phone_bound_at, created_at, updated_at FROM users WHERE id = ?', [req.user.userId]);
  if (!rows.length) {
    res.status(404).json({ success: false, message: '用户不存在' });
    return;
  }
  res.json({ success: true, data: rows[0] });
}

async function bindPhoneHandler(req, res) {
  const code = String((req.body && req.body.code) || '').trim();
  if (!code) {
    res.status(400).json({ success: false, message: '缺少手机号授权code' });
    return;
  }

  const phoneInfo = await getWechatPhoneNumber(code);
  const phoneNumber = String((phoneInfo && (phoneInfo.phoneNumber || phoneInfo.purePhoneNumber)) || '').trim();
  if (!phoneNumber) {
    res.status(400).json({ success: false, message: '微信手机号获取失败' });
    return;
  }

  const [exists] = await pool.execute('SELECT id FROM users WHERE phone_number = ? AND id <> ? LIMIT 1', [phoneNumber, req.user.userId]);
  if (exists.length) {
    res.status(409).json({ success: false, message: '该手机号已绑定其他账号' });
    return;
  }

  await pool.execute(
    'UPDATE users SET phone_number = ?, phone_bound_at = NOW() WHERE id = ?',
    [phoneNumber, req.user.userId]
  );

  const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, phone_number, phone_bound_at, created_at, updated_at FROM users WHERE id = ?', [req.user.userId]);
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
    const request = https.get(url, (response) => {
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
    });
    request.setTimeout(WECHAT_REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error('wechat request timeout'));
    });
    request.on('error', reject);
  });
}

let wechatAccessTokenCache = {
  token: '',
  expiresAt: 0
};

function requestWechatJson(options, body) {
  const payload = body ? JSON.stringify(body) : '';
  return new Promise((resolve, reject) => {
    const request = https.request(Object.assign({}, options, {
      headers: Object.assign({
        Accept: 'application/json'
      }, options.headers || {}, payload ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      } : {}),
      timeout: 10000
    }), (response) => {
      let responseBody = '';
      response.on('data', (chunk) => { responseBody += chunk; });
      response.on('end', () => {
        let parsed = {};
        if (responseBody) {
          try {
            parsed = JSON.parse(responseBody);
          } catch (err) {
            reject(err);
            return;
          }
        }
        if (response.statusCode >= 200 && response.statusCode < 300 && !parsed.errcode) {
          resolve(parsed);
          return;
        }
        reject(new Error(parsed.errmsg || parsed.message || 'wechat request failed'));
      });
    });
    request.on('timeout', () => request.destroy(new Error('wechat request timeout')));
    request.on('error', reject);
    if (payload) {
      request.write(payload);
    }
    request.end();
  });
}

async function getWechatAccessToken() {
  if (wechatAccessTokenCache.token && wechatAccessTokenCache.expiresAt > Date.now() + 60 * 1000) {
    return wechatAccessTokenCache.token;
  }

  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appid || !secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('WECHAT_APPID and WECHAT_APP_SECRET must be configured');
    }
    return 'dev-access-token';
  }

  const data = await requestWechatJson({
    hostname: 'api.weixin.qq.com',
    path: '/cgi-bin/stable_token',
    method: 'POST'
  }, {
    grant_type: 'client_credential',
    appid,
    secret,
    force_refresh: false
  });

  wechatAccessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in || 7200) * 1000)
  };
  return wechatAccessTokenCache.token;
}

async function getWechatPhoneNumber(code) {
  const appid = process.env.WECHAT_APPID;
  const secret = process.env.WECHAT_APP_SECRET;
  if ((!appid || !secret) && process.env.NODE_ENV !== 'production') {
    return {
      phoneNumber: '13800138000',
      purePhoneNumber: '13800138000'
    };
  }

  const accessToken = await getWechatAccessToken();
  const data = await requestWechatJson({
    hostname: 'api.weixin.qq.com',
    path: `/wxa/business/getuserphonenumber?access_token=${encodeURIComponent(accessToken)}`,
    method: 'POST'
  }, { code });

  return (data && data.phone_info) || {};
}

async function findOrCreateUser(openid, profile, sessionKey) {
  const nickname = profile.nickName || profile.nickname || '微信用户';
  const avatarUrl = profile.avatarUrl || profile.avatar_url || '';
  const [existing] = await pool.execute('SELECT id, openid, nickname, avatar_url, phone_number, phone_bound_at, created_at, updated_at FROM users WHERE openid = ?', [openid]);
  if (existing.length) {
    const currentUser = existing[0];
    if ((nickname && nickname !== currentUser.nickname) || (avatarUrl && avatarUrl !== currentUser.avatar_url) || sessionKey) {
      await pool.execute(
        'UPDATE users SET nickname = ?, avatar_url = ?, session_key = COALESCE(NULLIF(?, \'\'), session_key), session_key_updated_at = IF(? = \'\', session_key_updated_at, NOW()) WHERE id = ?',
        [nickname || currentUser.nickname, avatarUrl || currentUser.avatar_url, sessionKey || '', sessionKey || '', currentUser.id]
      );
      currentUser.nickname = nickname || currentUser.nickname;
      currentUser.avatar_url = avatarUrl || currentUser.avatar_url;
    }
    return { user: currentUser, isNew: false };
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (openid, nickname, avatar_url, session_key, session_key_updated_at) VALUES (?, ?, ?, ?, IF(? = \'\', NULL, NOW()))',
      [openid, nickname, avatarUrl, sessionKey || '', sessionKey || '']
    );
    const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, phone_number, phone_bound_at, created_at, updated_at FROM users WHERE id = ?', [result.insertId]);
    return { user: rows[0], isNew: true };
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') {
      const [rows] = await pool.execute('SELECT id, openid, nickname, avatar_url, phone_number, phone_bound_at, created_at, updated_at FROM users WHERE openid = ? LIMIT 1', [openid]);
      if (rows.length) {
        const currentUser = rows[0];
        if ((nickname && nickname !== currentUser.nickname) || (avatarUrl && avatarUrl !== currentUser.avatar_url) || sessionKey) {
          await pool.execute(
            'UPDATE users SET nickname = ?, avatar_url = ?, session_key = COALESCE(NULLIF(?, \'\'), session_key), session_key_updated_at = IF(? = \'\', session_key_updated_at, NOW()) WHERE id = ?',
            [nickname || currentUser.nickname, avatarUrl || currentUser.avatar_url, sessionKey || '', sessionKey || '', currentUser.id]
          );
          currentUser.nickname = nickname || currentUser.nickname;
          currentUser.avatar_url = avatarUrl || currentUser.avatar_url;
        }
        return { user: currentUser, isNew: false };
      }
    }
    throw err;
  }
}

async function ensureColumnExists(tableName, columnName, definition) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ? LIMIT 1`,
    [tableName, columnName]
  );
  if (!rows.length) {
    await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function ensureIndexExists(tableName, indexName, definition) {
  const [rows] = await pool.execute(
    `SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1`,
    [tableName, indexName]
  );
  if (!rows.length) {
    await pool.execute(`ALTER TABLE ${tableName} ADD ${definition}`);
  }
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
      return null;
    }
    const [existing] = await connection.execute(
      'SELECT id FROM referrals WHERE invitee_id = ? FOR UPDATE',
      [inviteeId]
    );
    if (existing.length) {
      await connection.rollback();
      return null;
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
    return {
      invitee_reward_days: REFERRAL_REWARD_DAYS,
      inviter_reward_days: rewardDays,
      invite_code: String(inviteCode || '').trim().toUpperCase()
    };
  } catch (err) {
    await connection.rollback();
    console.error('[Referral] Handle signup error:', err.message);
    throw err;
  } finally {
    connection.release();
  }
}

async function grantSignupReward(userId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const endDate = await extendMembership(connection, userId, SIGNUP_REWARD_DAYS, SIGNUP_REWARD_TYPE, {
      planCode: SIGNUP_REWARD_PLAN_CODE,
      membershipType: SIGNUP_REWARD_MEMBERSHIP_TYPE,
      preserveAutoRenew: true,
      preservePlanIfActive: true,
      autoRenew: 0,
      orderNo: `${SIGNUP_REWARD_TYPE}_${userId}_${Date.now()}`
    });
    await connection.commit();
    return {
      granted: true,
      duration_days: SIGNUP_REWARD_DAYS,
      current_end_date: endDate.toISOString(),
      message: `新用户注册成功，已到账${SIGNUP_REWARD_DAYS}天成长服务`
    };
  } catch (err) {
    await connection.rollback();
    throw err;
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

function sanitizeNutritionRecipeSourceText(value, ageRange, field) {
  let text = String(value || '').trim();
  if (!text) {
    return text;
  }

  const normalizedAge = normalizeNutritionAgeQuery(ageRange);
  const stageKey = getNutritionAgeStageKey(normalizedAge);

  const ageTextMap = {
    '1-3岁': ['软烂易消化，适合低龄阶段先练接受度再逐步增加颗粒感', '这阶段重点看吞咽安全和接受度，再逐步增加食物种类'],
    '3-6岁': ['口感清晰，适合学龄前阶段练习自主进食和餐桌规则', '这阶段重点看规律进餐和食物多样性，比追求吃得多更重要'],
    '6-12岁': ['适合学习日和活动日的营养补给', '这阶段重点看主食、蛋白质和蔬菜同餐出现，减少零食干扰'],
    '12岁以上': ['适合青少年阶段的营养搭配', '这阶段优先稳住三餐规律和总量均衡']
  };
  const stageTipOngoingMap = {
    '1-3岁': '家长全程看护，先保证进食安全再逐步练自主。',
    '3-6岁': '家长坐在旁边，鼓励孩子自己吃完一餐。',
    '6-12岁': '关注进餐节奏和总量，帮孩子建立规律习惯。',
    '12岁以上': '让孩子参与餐前准备和餐后收尾，培养自主管理能力。'
  };
  const [descPhrase, tipPhrase] = ageTextMap[stageKey] || ageTextMap['3-6岁'];
  const stageOngoingTip = stageTipOngoingMap[stageKey] || stageTipOngoingMap['3-6岁'];

  const replacements = [
    [/成人饮食模式|成人饮食标准/g, '按当前年龄阶段安排'],
    [/成人饮食。|成人饮食标准。|完整咀嚼。|完全独立用餐。|独立用餐安全。/g, '家长看护下练习。'],
    [/完整咀嚼能力|锻炼完整咀嚼|完整咀嚼/g, '逐步建立适合当前阶段的咀嚼能力'],
    [/完全独立用餐|独立用餐安全/g, '在家长看护下练习进食'],
    [/铁吸收率提升3倍/g, '有助于这餐里的铁摄入安排得更均衡'],
    [/促进钙吸收/g, '帮助这餐里的钙来源安排得更合理'],
    [/补铁食材避免与钙质同食以免影响吸收/g, '补铁与补钙可以放在全天不同餐次里灵活安排'],
    [/富含铁的食材宜与橙子、番茄同食提升吸收率/g, '补铁食材可以搭配富含维生素C的蔬果，帮助整餐更均衡'],
    [/富含铁的食材宜与橙子、番茄同食/g, '补铁食材可以搭配富含维生素C的蔬果'],
    [/蛋白质与钙协同作用，促进钙吸收，助力骨骼发育/g, '同时提供蛋白质和钙来源，更适合成长阶段日常搭配'],
    [/维C可将三价铁转化为易吸收的二价铁/g, '维生素C来源有助于这餐里的铁摄入安排更合理'],
    [/贵州(?:早餐|午餐|晚餐|小食)?经典搭配，?营养丰富。?/g, '适合家庭日常搭配。'],
    [/营养丰富。?/g, '适合家庭日常搭配。'],
    [/口感细腻，适合辅食添加。|软烂易嚼，适合学步期宝宝。/g, descPhrase + '。'],
    [/软硬适中，锻炼咀嚼能力。/g, descPhrase + '。'],
    [/口感丰富，培养自主进食。/g, descPhrase + '。'],
    [/营养均衡，适合幼儿园阶段。/g, descPhrase + '。'],
    [/营养全面，为小学做准备。/g, descPhrase + '。'],
    [/蛋白质丰富，助力成长发育。/g, descPhrase + '。'],
    [/能量充足，满足活动需求。/g, descPhrase + '。'],
    [/营养均衡，支持快速成长。/g, descPhrase + '。'],
    [/营养健康，适合青少年。/g, descPhrase + '。'],
    [/建议过滤后食用。|需打成细腻泥状。|应研磨至无颗粒。|需搅拌成糊状。/g, tipPhrase + '。'],
    [/食材需切碎煮软。|切成小块便于咀嚼。|建议软烂易吞咽。/g, tipPhrase + '。'],
    [/食材切适中大小。|可尝试小块状。|可尝试细碎状。/g, tipPhrase + '。'],
    [/锻炼咀嚼能力。|逐步适应成人口感。|可食用常规切法。|接近家庭饮食。/g, tipPhrase + '。'],
    [/锻炼咀嚼耐力。|适应多种口感。|可正常家庭烹饪。/g, tipPhrase + '。'],
    [/锻炼咀嚼各种质地。|正常烹饪方式。|可食用各类食材。/g, tipPhrase + '。'],
    [/适应多种烹饪。|适应所有口感。|完全成人化饮食。/g, tipPhrase + '。'],
    [/成人饮食模式。|成人饮食标准。|各类烹饪方式。|各类烹饪技巧。/g, tipPhrase + '。'],
    [/各类食材。|所有食材。|多样化烹饪。/g, tipPhrase + '。'],
    [/补钙食材建议晒太阳帮助吸收。|补钙食材建议适量运动促进骨骼发育。/g, '搭配日常户外活动帮助钙更好利用。'],
    [/富含钙的食材宜避免高盐饮食以免流失。/g, '控制整体盐分有助于钙更好地保留。'],
    [/监督进食过程。|监督用餐过程。|监督进食速度。|注意用餐安全。/g, stageOngoingTip],
    [/教导细嚼慢咽。|教导用餐礼仪。|培养用餐习惯。/g, '帮孩子建立进食节奏，比纠正单个动作更有用。'],
    [/避免过硬食材。|避免危险食材。|注意食材安全。/g, '按孩子当前咀嚼能力处理食材大小和软硬度。'],
    [/避免整块硬物。|防止噎食风险。|注意鱼刺骨头。/g, '低龄阶段重点检查食材里有没有硬块、骨头或长纤维。'],
    [/确认无过敏反应。|注意过敏源。|注意特殊过敏。|了解过敏风险。|避免过敏风险。|首次食用需观察。/g, '首次吃这类食材先少量试2-3次，观察皮肤和排便情况。'],
    [/维生素C丰富食材建议即食不宜久存。/g, '颜色鲜艳的蔬菜焯水后尽快吃完，保留更多营养。'],
    [/培养卫生习惯。|了解食品安全。|注意饮食卫生。|培养良好习惯。/g, '引导孩子餐前洗手和餐桌清洁，养成稳定的用餐习惯。'],
    [/早餐不宜空腹冷食。|早餐建议清淡少油。|早餐宜易消化食材。|早餐建议营养全面。/g, '早餐优先温热、易入口，主食和蛋白质搭配更稳。'],
    [/午餐不宜过于油腻。|午餐宜荤素搭配。|午餐建议适量油脂。|午餐建议营养均衡。/g, '午餐更适合主食、蛋白质和蔬菜一起安排，下午不容易累。'],
    [/晚餐不宜高脂高糖。|晚餐宜少油少盐。|晚餐建议不宜过饱。|晚餐建议清淡易消化。/g, '晚餐更适合清淡收口，留出睡前消化的空间。'],
    [/加餐不宜影响正餐。|加餐宜健康选择。|加餐建议不宜过甜。|加餐建议适量控制。/g, '加餐更适合小份轻负担，量以不影响下一顿为准。'],
  ];

  replacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });

  text = text.replace(/适合家庭日常搭配。\s*适合家庭日常搭配。/g, '适合家庭日常搭配。');

  return text;
}

function getNutritionRecipeSourceOverride(recipe, ageRange) {
  const title = String((recipe && recipe.title) || '').trim();
  const category = inferNutritionServingCategory(recipe);
  const stageKey = getNutritionAgeStageKey(ageRange);

  if (title === '萝卜排骨汤') {
    const descriptionMap = {
      '1-3岁': '萝卜排骨汤更适合做成清淡汤品，排骨先炖软后分小块，白萝卜煮透后和主食一起安排，更贴合低龄阶段的吞咽与接受节奏。',
      '3-6岁': '萝卜排骨汤更适合放在午餐或晚餐做配汤，先喝几口热汤，再吃萝卜和去骨肉块，整餐会更容易收口。',
      '6-12岁': '萝卜排骨汤更适合学习日或活动日的午晚餐，和米饭、青菜一起安排，更容易把主食、蛋白质和蔬菜吃完整。',
      '12岁以上': '萝卜排骨汤适合放在青少年阶段的午晚餐，口味保持清淡，和主食、蔬菜一起搭配更稳。'
    };
    const tipsMap = {
      '1-3岁': '分给孩子前先把骨头和硬筋处理干净，肉块控制在一口大小。先配主食和软烂蔬菜，再少量喝汤，整餐节奏更稳。',
      '3-6岁': '这道更适合做正餐配汤，先盛小半碗，鼓励孩子自己吃萝卜和肉块。当天如果还有其他荤菜，这道以补汤和补菜为主。',
      '6-12岁': '活动量大的日子更适合放在午餐或晚餐，排骨和萝卜一起吃，比单独喝汤更有饱腹感。控制盐和油，避免把这道做成重口味汤底。',
      '12岁以上': '青少年阶段更适合把这道作为午晚餐配汤，先吃主食和肉菜，再补汤水，整体更均衡。'
    };
    return {
      category,
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '排骨提供蛋白质，白萝卜补充膳食纤维和水分，这道更适合作为正餐配汤，把主食、蛋白质和蔬菜安排进同一餐。'
    };
  }

  if (title === '嫩南瓜蒸蛋') {
    const breakfastDescriptionMap = {
      '1-3岁': '嫩南瓜蒸蛋适合早餐作为软嫩的蛋白质来源，南瓜带来的淡甜口感更容易帮助低龄孩子把早餐吃进去。',
      '3-6岁': '嫩南瓜蒸蛋适合早餐打底，蒸蛋的软嫩口感和南瓜的自然甜味更适合在上学前把一餐收稳。',
      '6-12岁': '嫩南瓜蒸蛋适合早餐作为轻负担蛋白质来源，搭配主食和奶制品后，上午的能量会更稳定。',
      '12岁以上': '嫩南瓜蒸蛋适合作为青少年早餐的一部分，口味清淡，和全谷主食、水果一起安排更完整。'
    };
    const snackDescriptionMap = {
      '1-3岁': '嫩南瓜蒸蛋适合作为两餐之间的小份加餐，分量控制在正餐的一半以内，更容易稳住低龄阶段的正餐节奏。',
      '3-6岁': '嫩南瓜蒸蛋适合作为下午加餐，口感软嫩，分量控制住后更容易兼顾晚餐食欲。',
      '6-12岁': '嫩南瓜蒸蛋适合作为放学后的小份加餐，优先补一点蛋白质，再留出晚餐空间。',
      '12岁以上': '嫩南瓜蒸蛋适合作为青少年阶段的小份加餐，控制总量后更容易和正餐衔接。'
    };
    const breakfastTipsMap = {
      '1-3岁': '蒸蛋中心凝固后再出锅，先从小半碗开始，和馒头或软饭一起吃更稳。连续几次都能接受后，再逐步增加颗粒感。',
      '3-6岁': '早餐里配一份主食会更完整，甜口饮料可以留到其他时间。让孩子自己拿勺收尾，家长主要控制分量和节奏。',
      '6-12岁': '更适合和主食、水果或奶类一起安排成完整早餐，帮助上午的专注和饱腹感更稳定。',
      '12岁以上': '青少年阶段更适合配全麦面包、玉米或燕麦，把早餐里的主食和蛋白质一起补齐。'
    };
    const snackTipsMap = {
      '1-3岁': '加餐量控制在小半碗，和正餐至少留出1.5到2小时。先看接受度，再决定是否连续安排。',
      '3-6岁': '下午加餐更适合放在正餐中间，量以不影响晚餐为准。家长负责控制分量，孩子负责自己吃完。',
      '6-12岁': '放学后如果晚餐还早，这道适合做小份补给，配白水或温奶即可。',
      '12岁以上': '青少年阶段的加餐更看重总量控制，这道适合小份安排，避免和甜食叠加。'
    };
    const isSnack = category === '加餐';
    return {
      category,
      description: (isSnack ? snackDescriptionMap : breakfastDescriptionMap)[stageKey] || breakfastDescriptionMap['3-6岁'],
      tips: (isSnack ? snackTipsMap : breakfastTipsMap)[stageKey] || breakfastTipsMap['3-6岁'],
      nutrientCombination: '鸡蛋提供优质蛋白，南瓜带来自然甜味和胡萝卜素，这道更适合和主食、水果或温奶搭配成轻负担的一餐。'
    };
  }

  if (title === '嫩南瓜粥') {
    const breakfastDescriptionMap = {
      '1-3岁': '嫩南瓜粥更适合早餐做温和主食，南瓜的自然甜味更容易帮助低龄孩子在早晨建立进食节奏。',
      '3-6岁': '嫩南瓜粥适合早餐打底，口感柔和，搭配鸡蛋或豆制品后更容易把早餐吃完整。',
      '6-12岁': '嫩南瓜粥适合早餐作为温热主食，和蛋类或奶类一起安排，更适合学习日前半天。',
      '12岁以上': '嫩南瓜粥适合作为青少年早餐里的温热主食，和蛋白质来源一起搭配更稳。'
    };
    const snackDescriptionMap = {
      '1-3岁': '嫩南瓜粥适合作为两餐之间的小份加餐，口感软烂，比较适合低龄阶段先稳住接受度。',
      '3-6岁': '嫩南瓜粥适合作为加餐的小份能量补充，下午安排一小碗更容易兼顾晚餐。',
      '6-12岁': '嫩南瓜粥适合作为课后或运动前的小份加餐，帮助先垫一垫肚子，再等正餐。',
      '12岁以上': '嫩南瓜粥适合作为青少年阶段的小份加餐，温热、清淡，也方便和正餐错开。'
    };
    const breakfastTipsMap = {
      '1-3岁': '早餐先给小半碗，再配鸡蛋或豆腐，整体更接近完整一餐。粥体保持稠而不黏，孩子更容易吞咽。',
      '3-6岁': '早餐里再配一份蛋白质来源会更稳，单独一碗粥更容易饿得快。适合在赶时间的早晨做基础打底。',
      '6-12岁': '学习日早餐更适合和鸡蛋、牛奶或豆浆一起安排，帮助上午能量更平稳。',
      '12岁以上': '青少年阶段更适合把这道和蛋类、坚果或奶类搭配，避免早餐只有碳水。'
    };
    const snackTipsMap = {
      '1-3岁': '加餐量控制在小半碗，和正餐留出足够间隔。孩子刚起病或胃口差时，这类温热加餐更容易接受。',
      '3-6岁': '加餐更适合放在午晚餐中间，量以不影响下一顿为准。当天如果活动量小，这道更适合小份。',
      '6-12岁': '放学后或运动前可以少量安排，晚餐前1小时左右更容易衔接。',
      '12岁以上': '青少年阶段的加餐更适合少量温热主食，帮助过渡到下一顿正餐。'
    };
    const isSnack = category === '加餐';
    return {
      category,
      description: (isSnack ? snackDescriptionMap : breakfastDescriptionMap)[stageKey] || breakfastDescriptionMap['3-6岁'],
      tips: (isSnack ? snackTipsMap : breakfastTipsMap)[stageKey] || breakfastTipsMap['3-6岁'],
      nutrientCombination: '南瓜提供自然甜味和部分膳食纤维，大米负责基础能量，这道更适合放在早餐或加餐里做温和补充。'
    };
  }

  if (title === '红糖姜枣小米粥') {
    const descriptionMap = {
      '3-6岁': '姜枣小米粥更适合作为早餐里的温热主食，口味保持清淡，比单独当汤品更适合学龄前孩子的早晨节奏。',
      '6-12岁': '姜枣小米粥更适合作为早餐或活动后的小份热食，和鸡蛋、奶类一起安排，更容易把上午的能量垫稳。',
      '12岁以上': '姜枣小米粥适合青少年阶段做温热早餐主食，甜度控制住后，和蛋白质来源搭配会更均衡。'
    };
    const tipsMap = {
      '3-6岁': '这道更适合作为早餐主食的一部分，配鸡蛋或豆制品会更完整。糖度尽量轻一点，避免把甜味做成早餐主导。',
      '6-12岁': '学习日前半天更适合把这道和鸡蛋、牛奶或无糖豆浆一起安排，帮助上午饱腹感更稳定。',
      '12岁以上': '青少年阶段更适合把这道当温热早餐主食，控制额外糖分，再补一份蛋白质来源。'
    };
    return {
      category: '早餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '小米提供基础能量，红枣主要增加风味和接受度，这道更适合作为早餐主食的一部分，再配蛋白质来源和水果会更完整。'
    };
  }

  if (title === '豌豆肉末饭') {
    const descriptionMap = {
      '1-3岁': '豌豆肉末饭更适合作为午餐主食，米饭、肉末和蔬菜放在同一碗里，比分散喂食更容易让低龄孩子把一餐吃完整。',
      '3-6岁': '豌豆肉末饭更适合午餐做一碗饭主食，豌豆和肉末一起拌进米饭里，比较适合学龄前阶段的正餐节奏。',
      '6-12岁': '豌豆肉末饭更适合午餐或放学后的早晚餐主食，主食、蛋白质和蔬菜集中在一碗里，执行起来更稳。',
      '12岁以上': '豌豆肉末饭适合青少年阶段做午餐主食，配一份清淡蔬菜或汤品更容易把整餐吃完整。'
    };
    const tipsMap = {
      '1-3岁': '肉末炒熟后再和软饭拌匀，豌豆颗粒按接受度处理。先从小半碗开始，孩子更容易稳住节奏。',
      '3-6岁': '更适合放在午餐，米饭不要太干，先保证孩子能顺利吃完，再慢慢增加颗粒感和配菜量。',
      '6-12岁': '学习日或活动日更适合放在午餐，配一份蔬菜汤或炒青菜，比单独一碗饭更均衡。',
      '12岁以上': '青少年阶段更适合把这道和蔬菜、汤品一起安排，主食和蛋白质先吃够，再考虑额外加餐。'
    };
    return {
      category: '午餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '米饭负责基础能量，肉末提供蛋白质，豌豆补一些蔬菜和膳食纤维，这道更适合当一餐主食，而不是当早餐快手替代。'
    };
  }

  if (title === '豌豆豆腐汤') {
    const descriptionMap = {
      '1-3岁': '豌豆豆腐汤更适合作为午餐或晚餐的配汤，豆腐提供软嫩蛋白质，豌豆煮透后更容易让低龄孩子接受。',
      '3-6岁': '豌豆豆腐汤更适合晚餐或午餐做清淡配汤，豆腐和豌豆一起入口，比较适合学龄前阶段的收口节奏。',
      '6-12岁': '豌豆豆腐汤更适合学习日和活动日晚餐做配汤，口味保持清淡，比重口味汤底更适合日常。',
      '12岁以上': '豌豆豆腐汤适合青少年阶段做清淡配汤，和米饭、肉菜一起搭配更稳。'
    };
    const tipsMap = {
      '1-3岁': '分给孩子前先确认豌豆煮透，豆腐切成小块。先吃主食和肉菜，再少量喝汤，整餐更稳。',
      '3-6岁': '更适合做晚餐配汤，量不要太大，避免孩子只喝汤不吃主食。豆腐和豌豆一起盛到碗里，饱腹感会更好。',
      '6-12岁': '如果当天已经有一份主菜，这道更适合做清淡配汤，帮助把蔬菜、豆制品和水分补进同一餐。',
      '12岁以上': '青少年阶段更适合把这道做成清淡配汤，优先保证主食和肉菜，再用汤品补足蔬菜和水分。'
    };
    return {
      category: '汤品',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '豆腐提供蛋白质和部分钙来源，豌豆补一些蔬菜和膳食纤维，这道更适合作为正餐配汤，把汤、水分和豆制品一起补进一餐。'
    };
  }

  if (title === '春笋肉末豆腐') {
    const descriptionMap = {
      '1-3岁': '春笋肉末豆腐更适合作为午餐主菜，豆腐提供软嫩蛋白质，肉末补足铁和能量，春笋煮透后更容易让低龄孩子接受。',
      '3-6岁': '春笋肉末豆腐更适合午餐做主菜，和米饭、蔬菜一起安排，比单独当早餐更能把一餐吃完整。',
      '6-12岁': '春笋肉末豆腐更适合学习日午餐或早晚餐主菜，豆腐、肉末和春笋同餐出现，主食和蛋白质一次补齐。',
      '12岁以上': '春笋肉末豆腐适合青少年阶段做午餐主菜，配米饭和青菜更稳。'
    };
    const tipsMap = {
      '1-3岁': '春笋煮透再和豆腐、肉末一起盛碗，先从小半碗开始，配软饭更稳。',
      '3-6岁': '更适合放在午餐，和孩子平时爱吃的蔬菜一起搭配，比单独吃豆腐更容易接受。',
      '6-12岁': '学习日或活动日更适合放在午餐，配一份绿叶菜，整餐更完整。',
      '12岁以上': '青少年阶段更适合和米饭、青菜搭配，把蛋白质和蔬菜一起安排进正餐。'
    };
    return {
      category: '午餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '豆腐提供蛋白质和部分钙来源，肉末补铁和能量，春笋补膳食纤维，这道更适合做午餐主菜而不是早餐快手替代。'
    };
  }

  if (title === '韭菜鸡蛋饺子') {
    const descriptionMap = {
      '3-6岁': '韭菜鸡蛋饺子更适合午餐做主餐，搭配清汤或蔬菜后更容易把一餐吃完整，比放在晚餐更贴合学龄前阶段的消化节奏。',
      '6-12岁': '韭菜鸡蛋饺子更适合午餐或早晚餐主食，一次吃完后再补一份蔬菜，执行起来比分散安排更稳。',
      '12岁以上': '韭菜鸡蛋饺子适合青少年阶段做午餐主食，配清汤或炒菜后更容易把整餐收稳。'
    };
    const tipsMap = {
      '3-6岁': '更适合放在午餐，先给孩子少盛几个，吃完再添，比一次性放很多更容易稳住节奏。搭配一小碗清汤更舒服。',
      '6-12岁': '学习日或周末午间更适合安排，配一份青菜或汤品，整体更均衡。晚餐更适合清淡收口，不建议用饺子代替。',
      '12岁以上': '青少年阶段更适合午餐安排，控制总量后和蔬菜、汤品搭配，避免餐后马上躺下。'
    };
    return {
      category: '午餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '鸡蛋提供优质蛋白，韭菜补充部分维生素和纤维，饺子皮负责基础能量，这道更适合作为午餐主餐而不是晚餐收口。'
    };
  }

  if (title === '菠菜鸡蛋饼') {
    const descriptionMap = {
      '1-3岁': '菠菜鸡蛋饼更适合早餐作为软嫩的蛋白质来源，菠菜切碎后和蛋液一起摊成小饼，比较适合低龄阶段的早晨节奏。',
      '3-6岁': '菠菜鸡蛋饼适合早餐搭配主食，口感软嫩，上学前把蛋和蔬菜一起安排在早晨更稳。',
      '6-12岁': '菠菜鸡蛋饼适合早餐作为蛋白质蔬菜二合一，和奶类、水果一起安排，上午能量更稳定。',
      '12岁以上': '菠菜鸡蛋饼适合青少年早晨快捷蛋白质蔬菜搭配，和全麦主食一起更完整。'
    };
    const tipsMap = {
      '1-3岁': '饼摊薄一点，菠菜切细碎，先从小份开始，和粥或软饭一起吃更稳。',
      '3-6岁': '更适合早餐，配一小碗粥或牛奶，帮助孩子在上午活动前把蛋白质和蔬菜一次补上。',
      '6-12岁': '学习日早晨更适合安排，配牛奶或豆浆，比单独吃饼更均衡。',
      '12岁以上': '青少年阶段更适合和全麦面包、牛奶或酸奶搭配，做成早餐蛋白质蔬菜合一的快捷组合。'
    };
    return {
      category: '早餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '鸡蛋提供优质蛋白，菠菜补充铁和维生素，这道更适合作为早餐蛋白质蔬菜来源，和主食、奶类搭配更完整。'
    };
  }

  if (title === '毛豆肉末粥') {
    const descriptionMap = {
      '1-3岁': '毛豆肉末粥更适合早餐做温热主食，毛豆煮透后和肉末一起放进粥里，比单独白粥更有饱腹感，也更适合低龄阶段早晨建立进食节奏。',
      '3-6岁': '毛豆肉末粥适合早餐打底，豆类、肉末和主食集中在一碗里，上学前的早晨执行起来更轻松。',
      '6-12岁': '毛豆肉末粥适合早餐作为温热主食，豆类和肉末补足蛋白质和能量，学习日前半天更稳。',
      '12岁以上': '毛豆肉末粥适合青少年早餐做温热主食，和蛋类或奶类搭配更完整。'
    };
    const tipsMap = {
      '1-3岁': '毛豆煮透后再和肉末、粥一起盛碗，先从小半碗开始，配蒸蛋或豆腐更稳。',
      '3-6岁': '更适合早餐，毛豆提前煮软，粥体保持稠而不黏，配一小份蛋更完整。',
      '6-12岁': '学习日早餐更适合和鸡蛋或牛奶一起安排，豆类和肉末帮助上午饱腹感更稳定。',
      '12岁以上': '青少年阶段更适合和蛋类、水果搭配，避免早餐只有碳水。'
    };
    return {
      category: '早餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '毛豆提供植物蛋白和部分钙，肉末补足铁和动物蛋白，大米负责基础能量，这道更适合作为早餐温热主食。'
    };
  }

  if (title === '红薯鸡肉粥') {
    const descriptionMap = {
      '1-3岁': '红薯鸡肉粥更适合早餐做温热主食，红薯的自然甜味和鸡肉的蛋白质放在一碗粥里，比较适合低龄孩子早晨建立进食意愿。',
      '3-6岁': '红薯鸡肉粥适合早餐打底，红薯甜味做入口引导，鸡肉补蛋白质，上学前把主食和蛋白质一次安排好。',
      '6-12岁': '红薯鸡肉粥适合早餐作为温热主食，和蛋类一起安排，学习日前半天能量更稳定。',
      '12岁以上': '红薯鸡肉粥适合青少年早餐做温热主食，和蛋类、奶类搭配更均衡。'
    };
    const tipsMap = {
      '1-3岁': '红薯切成小丁煮透，鸡肉撕成细丝，先从小半碗开始，配蒸蛋更接近完整一餐。',
      '3-6岁': '更适合早餐，红薯甜味做自然引导，先保证孩子能吃完，再考虑是否需要搭蛋白质。',
      '6-12岁': '学习日早晨更适合安排，和鸡蛋或牛奶搭配，帮助上午能量更平稳。',
      '12岁以上': '青少年阶段更适合和蛋类或奶制品搭配，主食和蛋白质一起补齐。'
    };
    return {
      category: '早餐',
      description: descriptionMap[stageKey] || descriptionMap['3-6岁'],
      tips: tipsMap[stageKey] || tipsMap['3-6岁'],
      nutrientCombination: '红薯负责自然甜味和部分碳水，鸡肉提供优质蛋白，大米做基础能量，这道更适合早餐做温热主食，和蛋类或奶类搭配更完整。'
    };
  }

  if (title === '豆米白菜粥') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '豆米白菜粥适合早餐做温热主食，豆米软烂、白菜清淡，比较适合低龄孩子从熟悉口感开始建立早餐节奏。' :
        stageKey === '3-6岁' ? '豆米白菜粥适合早餐打底，豆米负责基础能量，白菜补一点蔬菜来源，上学前把主食先安排好。' :
        stageKey === '6-12岁' ? '豆米白菜粥适合早餐作为温热主食，和鸡蛋或豆制品一起安排，学习日半天更稳。' :
        '豆米白菜粥适合青少年早餐做温热主食，搭配蛋类或奶制品后更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，粥体保持稠而不黏。连续几天都能接受后，再尝试搭配蛋黄或嫩豆腐。' :
        stageKey === '3-6岁' ? '早餐里配一份蛋或豆制品更完整，单独一碗粥容易饿得快。适合在赶时间的早晨做基础打底。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和鸡蛋、牛奶或豆浆一起安排，帮助上午能量更平稳。' :
        '青少年阶段更适合把这道和蛋类、坚果或奶类搭配，避免早餐只有碳水。'),
      nutrientCombination: '豆米提供碳水化合物和部分植物蛋白，白菜补充水分和膳食纤维，这道更适合早餐做温热主食，和蛋白质来源一起安排更完整。'
    };
  }

  if (title === '豆腐脑蒸蛋') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '豆腐脑蒸蛋适合早餐做软嫩的蛋白质来源，蒸蛋和豆花的双重嫩滑口感更容易被低龄孩子接受。' :
        stageKey === '3-6岁' ? '豆腐脑蒸蛋适合早餐打底，软嫩口感做入口引导，植物蛋白和动物蛋白同餐搭配更完整。' :
        stageKey === '6-12岁' ? '豆腐脑蒸蛋适合早餐作为轻负担蛋白质来源，搭配主食后上午能量更稳定。' :
        '豆腐脑蒸蛋适合青少年早餐做蛋白质补充，和全谷主食、水果一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '蒸蛋中心凝固后再出锅，先从小份开始。和馒头或软饭一起吃更稳，连续接受后再逐步增加分量。' :
        stageKey === '3-6岁' ? '早餐里再配一份主食会更稳，甜口饮料留到其他时间。家长控制分量和节奏，孩子自己拿勺收尾。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和主食搭配，帮助上午专注和饱腹感更稳定。' :
        '青少年阶段更适合配全麦面包或燕麦，把早餐里的主食和蛋白质一起补齐。'),
      nutrientCombination: '鸡蛋和豆腐分别提供动物蛋白和植物蛋白，双重蛋白搭配，这道更适合早餐和主食一起安排成完整的一餐。',
      ingredients: [
        { name: '鸡蛋', amount: '2个' },
        { name: '嫩豆腐', amount: '100g' },
        { name: '温水', amount: '100ml' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '荠菜豆腐汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '荠菜豆腐汤适合作为正餐配汤，豆腐负责蛋白质，荠菜补充膳食纤维，分量控制在半碗以内更合适。' :
        stageKey === '3-6岁' ? '荠菜豆腐汤适合放在正餐里做配汤，清淡不抢主食，帮助孩子练习喝汤的节奏。' :
        stageKey === '6-12岁' ? '荠菜豆腐汤适合作为正餐的配汤，植物蛋白和蔬菜来源一起补充，和主食、肉类搭配更完整。' :
        '荠菜豆腐汤适合作为家庭正餐的配汤，清淡爽口，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，和主食放在一起上桌。荠菜切细煮软，孩子接受得更快。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。喝汤量控制住更稳。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内，给孩子留出吃主食的空间。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排，喝汤量以不影响主食和蛋白质摄入为准。'),
      nutrientCombination: '豆腐提供植物蛋白，荠菜补充膳食纤维和部分矿物质，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '豆花面') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '豆花面适合午餐作为主食，豆花的软嫩和面条的咀嚼感放在一碗里，比较适合低龄阶段练接受颗粒口感。' :
        stageKey === '3-6岁' ? '豆花面适合午餐做主食，面条提供能量，豆花补蛋白质，整体更适合中午安排。' :
        stageKey === '6-12岁' ? '豆花面适合午餐或晚餐做主食，面条负责碳水，豆花补植物蛋白，和蔬菜一起安排更均衡。' :
        '豆花面适合午餐或晚餐做主食，植物蛋白和碳水同餐，搭配肉类和蔬菜更完整。'),
      tips: (stageKey === '1-3岁' ? '面条煮软、豆花保持温热，先从小半碗开始，配一份蒸蛋更接近完整一餐。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份蔬菜或蒸蛋更完整。家长控制分量，孩子练习自己夹面。' :
        stageKey === '6-12岁' ? '更适合和蔬菜、蛋类一起安排，比单吃面更稳。学习日午餐优先保证主食和蛋白质。' :
        '青少年阶段更适合和蔬菜、肉类一起安排，总热量和蛋白质配比更合理。'),
      nutrientCombination: '面条提供碳水化合物，豆花补充植物蛋白，这道更适合午餐或晚餐做主食，和蔬菜、肉类一起搭配更完整。',
      ingredients: [
        { name: '面条', amount: '150g' },
        { name: '嫩豆花', amount: '120g' },
        { name: '青菜', amount: '80g' },
        { name: '酱油', amount: '少许' }
      ]
    };
  }

  if (title === '萝卜牛肉汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '萝卜牛肉汤适合作为正餐配汤，牛肉提供蛋白质和铁，白萝卜帮助消化，分量控制在小半碗以内更合适。' :
        stageKey === '3-6岁' ? '萝卜牛肉汤适合放在午餐或晚餐里做配汤，牛肉补蛋白质，萝卜温和解腻，和主食一起安排更稳。' :
        stageKey === '6-12岁' ? '萝卜牛肉汤适合作为正餐配汤，牛肉补充蛋白质和铁，搭配主食和蔬菜后更均衡。' :
        '萝卜牛肉汤适合家庭正餐配汤，牛肉和萝卜的传统搭配更适合秋冬季节。'),
      tips: (stageKey === '1-3岁' ? '牛肉炖至软烂，白萝卜切小丁，先从小半碗汤和少量牛肉开始。和软饭或馒头一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合午餐或晚餐里配汤，先保证主食和蔬菜，再喝汤。喝汤量控制住更稳。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，喝汤量控制在半碗以内，给孩子留出吃主食和蛋白质的空间。' :
        '青少年阶段更适合作为家庭正餐的配汤，喝汤量以不影响主食和蛋白质摄入为准。'),
      nutrientCombination: '牛肉提供优质蛋白和血红素铁，白萝卜补充膳食纤维和水分，这道更适合作为正餐配汤，把主食、蛋白质和蔬菜放进同一餐。'
    };
  }

  if (title === '莲藕肉末粥') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '莲藕肉末粥适合早餐做温热主食，莲藕的微甜和肉末的鲜味放在一碗粥里，比较适合低龄孩子早晨建立进食意愿。' :
        stageKey === '3-6岁' ? '莲藕肉末粥适合早餐打底，粥体温和，莲藕补充膳食纤维，肉末补蛋白质，上学前把主食和蛋白质安排好。' :
        stageKey === '6-12岁' ? '莲藕肉末粥适合早餐作为温热主食，和蛋类或豆浆一起安排，学习日半天更稳。' :
        '莲藕肉末粥适合青少年早餐做温热主食，和蛋类、奶类搭配后更均衡。'),
      tips: (stageKey === '1-3岁' ? '莲藕切细丁，肉末搅散，先从小半碗开始。和蒸蛋搭配更接近完整一餐。连续几天都能接受后再加量。' :
        stageKey === '3-6岁' ? '早餐里配一份蛋或豆制品更完整，单独一碗粥容易饿得快。适合赶时间的早晨做基础打底。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和鸡蛋、牛奶一起安排，帮助上午能量更平稳。' :
        '青少年阶段更适合把这道和蛋类、坚果或奶类搭配，避免早餐只有碳水。'),
      nutrientCombination: '莲藕提供膳食纤维和部分碳水，肉末补充蛋白质，大米做基础能量，这道更适合早餐做温热主食，和蛋白质来源一起安排更完整。'
    };
  }

  if (title === '山药小米粥') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '山药小米粥适合早餐做温和主食，山药的细腻和小米的软糯放在一碗里，比较适合低龄孩子从熟悉口感开始建立早餐。' :
        stageKey === '3-6岁' ? '山药小米粥适合早餐打底，口感柔和，搭配鸡蛋或豆腐后更容易把早餐吃完整。' :
        stageKey === '6-12岁' ? '山药小米粥适合早餐作为温热主食，和蛋类或奶类一起安排，学习日前半天更稳。' :
        '山药小米粥适合青少年早餐做温热主食，和蛋白质来源一起搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '粥体保持稠而不黏，先从小半碗开始，配蒸蛋或嫩豆腐更接近完整一餐。连续接受后再加量。' :
        stageKey === '3-6岁' ? '早餐里再配一份蛋白质来源会更稳，单独一碗粥容易饿得快。适合赶时间的早晨做基础打底。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和鸡蛋、牛奶或豆浆一起安排，帮助上午能量更平稳。' :
        '青少年阶段更适合把这道和蛋类、坚果或奶类搭配，避免早餐只有碳水。'),
      nutrientCombination: '山药提供淀粉和部分矿物质，小米做温和主食，这道更适合放在早餐或加餐里做温和补充，和蛋白质来源一起安排更完整。',
      ingredients: [
        { name: '山药', amount: '80g' },
        { name: '小米', amount: '50g' },
        { name: '清水', amount: '600ml' }
      ]
    };
  }

  if (title === '白菜豆腐汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '白菜豆腐汤适合作为正餐配汤，豆腐负责蛋白质，白菜补充水分和膳食纤维，分量控制在半碗以内更合适。' :
        stageKey === '3-6岁' ? '白菜豆腐汤适合放在正餐里做配汤，清淡不抢主食，帮助孩子熟悉饭前喝汤的节奏。' :
        stageKey === '6-12岁' ? '白菜豆腐汤适合作为正餐的配汤，植物蛋白和蔬菜来源一起补充，和主食、肉类搭配更完整。' :
        '白菜豆腐汤适合家庭正餐的配汤，清淡爽口，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，和主食一起上桌。白菜切细煮软，孩子接受得更快。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。喝汤量控制住更稳。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内，给孩子留出吃主食的空间。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排，喝汤量以不影响主食和蛋白质摄入为准。'),
      nutrientCombination: '豆腐提供植物蛋白，白菜补充水分和膳食纤维，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。',
      ingredients: [
        { name: '白菜', amount: '100g' },
        { name: '嫩豆腐', amount: '120g' },
        { name: '清水', amount: '500ml' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '豆花蒸蛋') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '豆花蒸蛋适合早餐做软嫩的蛋白质组合，蒸蛋和豆花放在一碗里，双重嫩滑更容易被低龄孩子接受。' :
        stageKey === '3-6岁' ? '豆花蒸蛋适合早餐做蛋白质来源，口感软嫩，搭配主食后更适合上学前把早餐吃完整。' :
        stageKey === '6-12岁' ? '豆花蒸蛋适合早餐作为轻负担蛋白质来源，和主食搭配后上午能量更稳定。' :
        '豆花蒸蛋适合青少年早餐做蛋白质补充，和全谷主食、水果一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '蒸蛋中心凝固后再出锅，先从小份开始。和馒头或软饭一起吃更稳，连续接受后再逐步增加分量。' :
        stageKey === '3-6岁' ? '早餐里再配一份主食会更稳，甜口饮料留到其他时间。家长控制分量和节奏，孩子自己拿勺收尾。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和主食搭配，帮助上午专注和饱腹感更稳定。' :
        '青少年阶段更适合配全麦面包或燕麦，把早餐里的主食和蛋白质一起补齐。'),
      nutrientCombination: '鸡蛋提供动物蛋白，豆花补充植物蛋白，双重蛋白搭配，这道更适合早餐和主食一起安排成完整的一餐。',
      ingredients: [
        { name: '鸡蛋', amount: '2个' },
        { name: '嫩豆花', amount: '100g' },
        { name: '温水', amount: '100ml' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '山药蒸蛋') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '山药蒸蛋适合早餐做软嫩的蛋白质和淀粉组合，山药的细腻和蒸蛋的嫩滑放在一碗里，比较适合低龄孩子从熟悉口感开始建立早餐。' :
        stageKey === '3-6岁' ? '山药蒸蛋适合早餐打底，蒸蛋负责蛋白质，山药补充淀粉和部分矿物质，上学前先安排好。' :
        stageKey === '6-12岁' ? '山药蒸蛋适合早餐作为轻负担组合，和主食一起安排，学习日前半天能量更稳定。' :
        '山药蒸蛋适合青少年早餐做蛋白质和淀粉组合，和全谷主食、水果一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '山药磨成泥和蛋液搅匀，蒸至中心凝固。先从小份开始，和软饭一起吃更稳。连续接受后再加量。' :
        stageKey === '3-6岁' ? '早餐里再配一份主食会更稳，甜口饮料留到其他时间。家长控制分量和节奏，孩子自己拿勺收尾。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和主食搭配，帮助上午专注和饱腹感更稳定。' :
        '青少年阶段更适合配全麦面包或燕麦，把早餐里的主食和蛋白质一起补齐。'),
      nutrientCombination: '山药提供淀粉和部分矿物质，鸡蛋提供优质蛋白，这道更适合早餐做温和组合，和主食一起安排更完整。'
    };
  }

  if (title === '红薯小米粥') {
    return {
      ingredients: [
        { name: '红薯', amount: '100g' },
        { name: '小米', amount: '50g' },
        { name: '清水', amount: '600ml' }
      ]
    };
  }

  if (title === '豆米南瓜软烩饭') {
    return {
      ingredients: [
        { name: '米饭', amount: '150g' },
        { name: '南瓜', amount: '80g' },
        { name: '芸豆', amount: '50g' },
        { name: '清水', amount: '300ml' }
      ]
    };
  }

  if (title === '四季豆鸡肉丝') {
    return {
      ingredients: [
        { name: '四季豆', amount: '100g' },
        { name: '鸡胸肉', amount: '60g' },
        { name: '植物油', amount: '5ml' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '四季豆豆腐汤') {
    return {
      ingredients: [
        { name: '四季豆', amount: '80g' },
        { name: '嫩豆腐', amount: '100g' },
        { name: '清水', amount: '500ml' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '豆花拌饭') {
    return {
      ingredients: [
        { name: '米饭', amount: '150g' },
        { name: '嫩豆花', amount: '100g' },
        { name: '酱油', amount: '少许' }
      ]
    };
  }

  if (title === '豆花拌黄瓜') {
    return {
      ingredients: [
        { name: '嫩豆花', amount: '100g' },
        { name: '黄瓜', amount: '80g' },
        { name: '香油', amount: '少许' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '番茄酸汤豆花饭') {
    return {
      ingredients: [
        { name: '米饭', amount: '150g' },
        { name: '番茄', amount: '80g' },
        { name: '嫩豆花', amount: '100g' },
        { name: '清水', amount: '300ml' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  if (title === '香椿拌豆腐') {
    return {
      ingredients: [
        { name: '香椿', amount: '60g' },
        { name: '嫩豆腐', amount: '120g' },
        { name: '香油', amount: '少许' },
        { name: '盐', amount: '少许' }
      ]
    };
  }

  // 蒸蛋类
  if (title === '四季豆蒸蛋') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '四季豆蒸蛋适合早餐做蛋白质加蔬菜来源，四季豆切细和蛋液一起蒸，更适合低龄孩子从软嫩口感开始练习接受蔬菜。' :
        stageKey === '3-6岁' ? '四季豆蒸蛋适合早餐打底，蒸蛋负责蛋白质，四季豆补蔬菜来源，上学前把一餐先收稳。' :
        stageKey === '6-12岁' ? '四季豆蒸蛋适合早餐作为轻负担组合，和主食一起安排，学习日半天更稳。' :
        '四季豆蒸蛋适合青少年早餐做蛋白质和蔬菜组合，和全谷主食一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '四季豆去筋切细末，和蛋液搅匀，蒸至中心凝固。先从小份开始，和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '早餐里配一份主食更完整，甜口饮料留到其他时间。让孩子自己拿勺收尾。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和主食搭配，帮助上午专注和饱腹感更稳定。' :
        '青少年阶段更适合配全麦面包或燕麦，把早餐里的主食和蛋白质一起补齐。'),
      nutrientCombination: '鸡蛋提供优质蛋白，四季豆补充膳食纤维和部分植物蛋白，这道更适合早餐和主食一起安排成完整的一餐。'
    };
  }

  if (title === '红薯蒸蛋') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '红薯蒸蛋适合早餐做蛋白质和淀粉组合，红薯的自然甜味更容易帮助低龄孩子建立早餐进食意愿。' :
        stageKey === '3-6岁' ? '红薯蒸蛋适合早餐打底，红薯甜味做入口引导，蒸蛋补蛋白质，上学前把主食和蛋白质一次安排好。' :
        stageKey === '6-12岁' ? '红薯蒸蛋适合早餐作为轻负担组合，和主食一起安排，学习日半天更稳。' :
        '红薯蒸蛋适合青少年早餐做蛋白质和淀粉组合，和全谷主食一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '红薯切小丁和蛋液搅匀，蒸至中心凝固。先从小份开始，连续接受后再加量。' :
        stageKey === '3-6岁' ? '早餐里配一份主食更完整，甜口饮料留到其他时间。让孩子自己拿勺收尾。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和主食搭配，帮助上午专注和饱腹感更稳定。' :
        '青少年阶段更适合配全麦面包或燕麦，把早餐里的主食和蛋白质一起补齐。'),
      nutrientCombination: '鸡蛋提供优质蛋白，红薯提供天然甜味和部分碳水，这道更适合早餐和主食一起安排成完整的一餐。'
    };
  }

  if (title === '豆腐蒸蛋') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '豆腐蒸蛋适合早餐做软嫩的蛋白质组合，豆腐和蒸蛋的双重嫩滑更容易被低龄孩子接受。' :
        stageKey === '3-6岁' ? '豆腐蒸蛋适合早餐做蛋白质来源，软嫩口感做入口引导，植物蛋白和动物蛋白同餐搭配更完整。' :
        stageKey === '6-12岁' ? '豆腐蒸蛋适合早餐作为轻负担蛋白质来源，和主食搭配后上午能量更稳定。' :
        '豆腐蒸蛋适合青少年早餐做蛋白质补充，和全谷主食、水果一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '蒸蛋中心凝固后再出锅，先从小份开始。和馒头或软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '早餐里再配一份主食会更稳，让孩子自己拿勺收尾。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和主食搭配，帮助上午专注和饱腹感更稳定。' :
        '青少年阶段更适合配全麦面包或燕麦，把早餐里的主食和蛋白质一起补齐。'),
      nutrientCombination: '鸡蛋和豆腐分别提供动物蛋白和植物蛋白，双重蛋白搭配，这道更适合早餐和主食一起安排成完整的一餐。'
    };
  }

  // 粥类
  if (title === '蕨菜肉末粥') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '蕨菜肉末粥适合早餐做温热主食，肉末补蛋白质，蕨菜补零星蔬菜，比较适合低龄孩子从温和口感开始建立早餐。' :
        stageKey === '3-6岁' ? '蕨菜肉末粥适合早餐打底，粥体温和，肉末补蛋白质，蕨菜补一点膳食纤维，上学前把主食和蛋白质安排好。' :
        stageKey === '6-12岁' ? '蕨菜肉末粥适合早餐作为温热主食，和蛋类或豆浆一起安排，学习日半天更稳。' :
        '蕨菜肉末粥适合青少年早餐做温热主食，和蛋类、奶类搭配后更均衡。'),
      tips: (stageKey === '1-3岁' ? '蕨菜切细末，肉末搅散，先从小半碗开始。和蒸蛋搭配更接近完整一餐。' :
        stageKey === '3-6岁' ? '早餐里配一份蛋或豆制品更完整，单独一碗粥容易饿得快。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和鸡蛋、牛奶一起安排，帮助上午能量更平稳。' :
        '青少年阶段更适合把这道和蛋类、坚果或奶类搭配，避免早餐只有碳水。'),
      nutrientCombination: '蕨菜提供膳食纤维，肉末补充蛋白质，大米做基础能量，这道更适合早餐做温热主食，和蛋白质来源一起安排更完整。'
    };
  }

  // 汤品类
  if (title === '土豆豆腐汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '土豆豆腐汤适合作为正餐配汤，土豆提供淀粉质，豆腐补蛋白质，分量控制在半碗以内更合适。' :
        stageKey === '3-6岁' ? '土豆豆腐汤适合放在正餐里做配汤，土豆的绵软口感更容易被孩子接受。' :
        stageKey === '6-12岁' ? '土豆豆腐汤适合作为正餐的配汤，植物蛋白和淀粉质一起补充，和主食、肉类搭配更完整。' :
        '土豆豆腐汤适合家庭正餐的配汤，清淡温和，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，和主食一起上桌。土豆煮至绵软，孩子接受得更快。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排，喝汤量以不影响主食和蛋白质摄入为准。'),
      nutrientCombination: '土豆提供淀粉质，豆腐补充植物蛋白，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '山药豆腐汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '山药豆腐汤适合作为正餐配汤，山药的绵密和豆腐的软嫩更适合低龄孩子的口感接受度。' :
        stageKey === '3-6岁' ? '山药豆腐汤适合放在正餐里做配汤，山药补淀粉质，豆腐补蛋白质，口感温和。' :
        stageKey === '6-12岁' ? '山药豆腐汤适合作为正餐的配汤，植物蛋白和淀粉质一起补充，和主食、肉类搭配更完整。' :
        '山药豆腐汤适合家庭正餐的配汤，温和清淡，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，和主食一起上桌。山药切小段煮至绵软。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排。'),
      nutrientCombination: '山药提供淀粉质，豆腐补充植物蛋白，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '茄子豆腐煲') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '茄子豆腐煲适合作为正餐配菜或配汤，茄子软烂、豆腐嫩滑，低龄孩子更容易从这种口感开始接受。' :
        stageKey === '3-6岁' ? '茄子豆腐煲适合放在正餐里做配菜，茄子补蔬菜来源，豆腐补蛋白质，和米饭搭配更稳。' :
        stageKey === '6-12岁' ? '茄子豆腐煲适合作为正餐的配菜，植物蛋白和蔬菜一起补充，和主食、肉类搭配更完整。' :
        '茄子豆腐煲适合家庭正餐的配菜，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '茄子去皮切小块，和豆腐一起炖至软烂。先从小份开始，和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再吃配菜。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，做配菜分量控制在一小份。' :
        '青少年阶段更适合和主食、肉类一起安排，做配菜分量灵活。'),
      nutrientCombination: '茄子提供膳食纤维，豆腐补充植物蛋白，这道更适合作为正餐配菜，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '板栗山药鸡汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '板栗山药鸡汤适合作为正餐配汤，鸡肉补蛋白质，板栗提供淀粉质，山药温和养胃，分量控制在小半碗以内更合适。' :
        stageKey === '3-6岁' ? '板栗山药鸡汤适合放在午餐或晚餐里做配汤，鸡肉补蛋白质，板栗和山药做碳水补充。' :
        stageKey === '6-12岁' ? '板栗山药鸡汤适合作为正餐配汤，动物蛋白和淀粉质一起补充，和主食、蔬菜搭配更完整。' :
        '板栗山药鸡汤适合家庭正餐配汤，传统搭配更适合秋冬季节。'),
      tips: (stageKey === '1-3岁' ? '鸡肉炖至软烂撕丝，板栗和山药切小段，先从小半碗汤和少量鸡肉开始。' :
        stageKey === '3-6岁' ? '更适合午餐或晚餐里配汤，先保证主食和蔬菜，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合作为家庭正餐的配汤。'),
      nutrientCombination: '鸡肉提供优质蛋白，板栗和山药提供淀粉质和部分矿物质，这道更适合作为正餐配汤，和主食、蔬菜一起安排更完整。'
    };
  }

  if (title === '苦瓜鸡蛋汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '苦瓜鸡蛋汤适合作为正餐配汤，苦瓜去苦后更温和，鸡蛋补充蛋白质，分量控制在小半碗以内。' :
        stageKey === '3-6岁' ? '苦瓜鸡蛋汤适合放在正餐里做配汤，鸡蛋补蛋白质，苦瓜提供蔬菜来源，口感清爽。' :
        stageKey === '6-12岁' ? '苦瓜鸡蛋汤适合作为正餐的配汤，蛋白质和蔬菜一起补充，和主食搭配更完整。' :
        '苦瓜鸡蛋汤适合家庭正餐的配汤，清爽解暑，和主食、肉类一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '苦瓜去瓤切片焯水去苦，和蛋花一起煮。先从小半碗开始，和主食一起上桌。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排。'),
      nutrientCombination: '苦瓜提供膳食纤维和部分维生素，鸡蛋补充优质蛋白，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '萝卜羊肉汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '萝卜羊肉汤适合作为正餐配汤，羊肉提供蛋白质和铁，白萝卜帮助消化，分量控制在小半碗以内更合适。' :
        stageKey === '3-6岁' ? '萝卜羊肉汤适合放在午餐或晚餐里做配汤，羊肉补蛋白质，萝卜温和解腻。' :
        stageKey === '6-12岁' ? '萝卜羊肉汤适合作为正餐配汤，羊肉补充蛋白质和铁，和主食、蔬菜搭配更完整。' :
        '萝卜羊肉汤适合家庭正餐配汤，传统搭配更适合秋冬季节。'),
      tips: (stageKey === '1-3岁' ? '羊肉炖至软烂，白萝卜切小丁，先从小半碗汤和少量羊肉开始。和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合午餐或晚餐里配汤，先保证主食和蔬菜，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合作为家庭正餐的配汤。'),
      nutrientCombination: '羊肉提供优质蛋白和血红素铁，白萝卜补充膳食纤维和水分，这道更适合作为正餐配汤，把主食、蛋白质和蔬菜放进同一餐。'
    };
  }

  if (title === '豌豆苗豆腐汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '豌豆苗豆腐汤适合作为正餐配汤，豆腐补蛋白质，豌豆苗提供嫩叶蔬菜，分量控制在半碗以内。' :
        stageKey === '3-6岁' ? '豌豆苗豆腐汤适合放在正餐里做配汤，清淡不抢主食，豌豆苗的嫩口感更容易被孩子接受。' :
        stageKey === '6-12岁' ? '豌豆苗豆腐汤适合作为正餐的配汤，植物蛋白和蔬菜一起补充，和主食、肉类搭配更完整。' :
        '豌豆苗豆腐汤适合家庭正餐的配汤，清淡爽口，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，和主食一起上桌。豌豆苗切短煮软，孩子接受得更快。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排。'),
      nutrientCombination: '豌豆苗提供嫩叶蔬菜和部分维生素，豆腐补充植物蛋白，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '豌豆苗鸡蛋汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '豌豆苗鸡蛋汤适合作为正餐配汤，鸡蛋补蛋白质，豌豆苗提供嫩叶蔬菜，分量控制在半碗以内。' :
        stageKey === '3-6岁' ? '豌豆苗鸡蛋汤适合放在正餐里做配汤，鸡蛋补蛋白质，豌豆苗的嫩口感更容易被孩子接受。' :
        stageKey === '6-12岁' ? '豌豆苗鸡蛋汤适合作为正餐的配汤，蛋白质和蔬菜一起补充，和主食搭配更完整。' :
        '豌豆苗鸡蛋汤适合家庭正餐的配汤，清淡爽口，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '先从小半碗开始，和主食一起上桌。豌豆苗切短，蛋花打散煮嫩。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排。'),
      nutrientCombination: '豌豆苗提供嫩叶蔬菜，鸡蛋补充优质蛋白，这道更适合作为正餐配汤，和主食、肉类一起安排更完整。'
    };
  }

  // 饭类
  if (title === '四季豆肉末饭') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '四季豆肉末饭适合午餐做主食，四季豆切细和肉末、米饭放在一起，低龄孩子更容易从这种混合口感开始练习咀嚼。' :
        stageKey === '3-6岁' ? '四季豆肉末饭适合午餐做主食，米饭负责能量，肉末补蛋白质，四季豆补蔬菜，一餐安排比较完整。' :
        stageKey === '6-12岁' ? '四季豆肉末饭适合午餐或晚餐做主食，主食、蛋白质和蔬菜同餐，学习日能量更稳。' :
        '四季豆肉末饭适合午餐或晚餐做主食，和蛋类或汤品搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '四季豆去筋切细末，肉末搅散，先从小半碗开始。配一碗汤更完整。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份汤或蒸蛋更完整。让孩子自己练习用勺吃完。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和汤品搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排，总热量和蛋白质配比更合理。'),
      nutrientCombination: '米饭提供碳水，肉末补充蛋白质，四季豆提供膳食纤维，这道更适合午餐做主食，和汤品或蒸蛋搭配更完整。'
    };
  }

  if (title === '白菜肉末饭') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '白菜肉末饭适合午餐做主食，白菜清淡、肉末鲜香，低龄孩子更容易从熟悉口感开始接受混合餐。' :
        stageKey === '3-6岁' ? '白菜肉末饭适合午餐做主食，米饭负责能量，肉末补蛋白质，白菜补蔬菜，一餐安排比较完整。' :
        stageKey === '6-12岁' ? '白菜肉末饭适合午餐或晚餐做主食，主食、蛋白质和蔬菜同餐，学习日能量更稳。' :
        '白菜肉末饭适合午餐或晚餐做主食，和蛋类或汤品搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '白菜切细，肉末搅散，先从小半碗开始。配一碗汤更完整。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份汤或蒸蛋更完整。让孩子自己练习用勺吃完。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和汤品搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排。'),
      nutrientCombination: '米饭提供碳水，肉末补充蛋白质，白菜提供水分和膳食纤维，这道更适合午餐做主食，和汤品搭配更完整。'
    };
  }

  if (title === '板栗肉末饭') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '板栗肉末饭适合午餐做主食，板栗的微甜和肉末的鲜味放在一碗饭里，比较适合低龄孩子从甜口开始接受混合餐。' :
        stageKey === '3-6岁' ? '板栗肉末饭适合午餐做主食，米饭负责能量，板栗补碳水，肉末补蛋白质，一餐安排比较完整。' :
        stageKey === '6-12岁' ? '板栗肉末饭适合午餐或晚餐做主食，主食、蛋白质和淀粉质同餐，学习日能量更稳。' :
        '板栗肉末饭适合午餐或晚餐做主食，和蛋类或汤品搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '板栗切小丁，肉末搅散，先从小半碗开始。配一碗汤更完整。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份汤或蒸蛋更完整。让孩子自己练习用勺吃完。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和汤品搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排。'),
      nutrientCombination: '米饭提供碳水，肉末补充蛋白质，板栗提供淀粉质和天然甜味，这道更适合午餐做主食，和汤品或蒸蛋搭配更完整。'
    };
  }

  if (title === '板栗鸡肉饭') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '板栗鸡肉饭适合午餐做主食，板栗的微甜和鸡肉的鲜嫩放在一碗饭里，比较适合低龄孩子从甜口开始接受混合餐。' :
        stageKey === '3-6岁' ? '板栗鸡肉饭适合午餐做主食，米饭负责能量，鸡肉补蛋白质，板栗补碳水，一餐安排比较完整。' :
        stageKey === '6-12岁' ? '板栗鸡肉饭适合午餐或晚餐做主食，主食、蛋白质和淀粉质同餐，学习日能量更稳。' :
        '板栗鸡肉饭适合午餐或晚餐做主食，和蔬菜或汤品搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '鸡肉切小丁，板栗切小丁，先从小半碗开始。配一碗汤更完整。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份蔬菜或汤品更完整。让孩子自己练习用勺吃完。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和蔬菜搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排。'),
      nutrientCombination: '米饭提供碳水，鸡肉补充优质蛋白，板栗提供淀粉质和天然甜味，这道更适合午餐做主食，和蔬菜或汤品搭配更完整。'
    };
  }

  if (title === '茄子肉末饭') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '茄子肉末饭适合午餐做主食，茄子软烂、肉末鲜香，低龄孩子更容易从这种绵软混合口感开始练习咀嚼。' :
        stageKey === '3-6岁' ? '茄子肉末饭适合午餐做主食，米饭负责能量，肉末补蛋白质，茄子补蔬菜，一餐安排比较完整。' :
        stageKey === '6-12岁' ? '茄子肉末饭适合午餐或晚餐做主食，主食、蛋白质和蔬菜同餐，学习日能量更稳。' :
        '茄子肉末饭适合午餐或晚餐做主食，和蛋类或汤品搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '茄子去皮切小丁，肉末搅散，先从小半碗开始。配一碗汤更完整。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份汤或蒸蛋更完整。让孩子自己练习用勺吃完。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和汤品搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排。'),
      nutrientCombination: '米饭提供碳水，肉末补充蛋白质，茄子提供膳食纤维，这道更适合午餐做主食，和汤品搭配更完整。'
    };
  }

  if (title === '腊肉土豆饭') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '不建议低龄阶段食用——腊肉属于高盐腌制食材，建议替换为鲜肉末。' :
        stageKey === '3-6岁' ? '腊肉土豆饭适合偶尔作为午餐主食，土豆提供碳水，米饭做基础能量，腊肉少量调味即可。' :
        stageKey === '6-12岁' ? '腊肉土豆饭适合偶尔作为午餐或晚餐主食，腊肉少量切丁调味，主食和蔬菜同餐更均衡。' :
        '腊肉土豆饭适合偶尔作为午餐或晚餐主食，腊肉少量调味，和蔬菜搭配更完整。'),
      tips: (stageKey === '1-3岁' ? '建议用鲜肉末替换腊肉，保留土豆和米饭的组合。' :
        stageKey === '3-6岁' ? '更适合偶尔安排，腊肉量控制在小份，和蔬菜一起更稳。' :
        stageKey === '6-12岁' ? '更适合偶尔安排，腊肉量少量，和蔬菜、汤品搭配更均衡。' :
        '青少年阶段更适合偶尔安排，腊肉少量调味即可。'),
      nutrientCombination: '土豆提供淀粉质，米饭做基础能量，腊肉少量调味，这道更适合偶尔安排，和蔬菜搭配更完整。注：低龄阶段建议用鲜肉末替换腊肉。'
    };
  }

  // 粉面类
  if (title === '素瓜豆清汤粉') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '素瓜豆清汤粉适合午餐做主食，米粉软滑，南瓜和四季豆做蔬菜来源，比较适合低龄孩子从软滑口感开始练习。' :
        stageKey === '3-6岁' ? '素瓜豆清汤粉适合午餐做主食，米粉负责碳水，南瓜和四季豆补蔬菜，中午安排更合适。' :
        stageKey === '6-12岁' ? '素瓜豆清汤粉适合午餐做主食，碳水、蔬菜同餐，和蛋类或肉类搭配更均衡。' :
        '素瓜豆清汤粉适合午餐做主食，和蛋白质来源一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '米粉煮软，南瓜切小丁，先从小半碗开始。配一份蒸蛋更接近完整一餐。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份蛋或肉更完整。让孩子自己练习用筷夹粉。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食，和蛋白质来源搭配更稳。' :
        '青少年阶段更适合和肉类、蛋类一起安排。'),
      nutrientCombination: '米粉提供碳水，南瓜和四季豆提供蔬菜来源和膳食纤维，这道更适合午餐做主食，和蛋白质来源搭配更完整。'
    };
  }

  // 饺子类
  if (title === '白菜猪肉饺子') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '白菜猪肉饺子适合午餐做主食，饺子皮提供碳水，猪肉补蛋白质，白菜补蔬菜，一颗饺子就是一个小餐包。' :
        stageKey === '3-6岁' ? '白菜猪肉饺子适合午餐做主食，每颗饺子都是主食、蛋白质和蔬菜的组合，更适合中午安排。' :
        stageKey === '6-12岁' ? '白菜猪肉饺子适合午餐或晚餐做主食，碳水、蛋白质和蔬菜同餐，学习日能量更稳。' :
        '白菜猪肉饺子适合午餐或晚餐做主食，和汤品搭配更均衡。'),
      tips: (stageKey === '1-3岁' ? '饺子煮至皮软馅熟，先从小半颗开始，配一碗清汤更完整。逐步增加到2-3颗。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份清汤更完整。让孩子自己练习用手或叉拿饺子。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和汤品搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排。'),
      nutrientCombination: '饺子皮提供碳水，猪肉补充蛋白质，白菜提供蔬菜来源，这道更适合午餐做主食，和清汤搭配更完整。'
    };
  }

  // 炒菜/丝类
  if (title === '板栗山药丝') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '板栗山药丝适合午餐做配菜，板栗的微甜和山药的绵软更适合低龄孩子从熟悉口感开始接受混合食材。' :
        stageKey === '3-6岁' ? '板栗山药丝适合午餐做配菜，板栗补碳水，山药提供淀粉质，和米饭、肉类搭配更完整。' :
        stageKey === '6-12岁' ? '板栗山药丝适合午餐或晚餐做配菜，淀粉质来源，和肉类、蔬菜一起安排更均衡。' :
        '板栗山药丝适合家庭正餐做配菜，和主食、蛋白质来源一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '板栗和山药切细丝，先从小份开始，和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合和米饭、肉类一起安排，做配菜分量控制在一小份。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，做配菜分量小份。' :
        '青少年阶段更适合和主食、肉类一起安排。'),
      nutrientCombination: '板栗提供淀粉质和天然甜味，山药提供淀粉质和部分矿物质，这道更适合作为配菜，和主食、肉类一起安排更完整。'
    };
  }

  if (title === '春笋鸡肉丝') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '春笋鸡肉丝适合午餐做配菜，鸡肉补蛋白质，春笋提供膳食纤维和脆嫩口感，更适合搭配软饭一起安排。' :
        stageKey === '3-6岁' ? '春笋鸡肉丝适合午餐做配菜，鸡肉补蛋白质，春笋补蔬菜，和米饭搭配更完整。' :
        stageKey === '6-12岁' ? '春笋鸡肉丝适合午餐或晚餐做配菜，蛋白质和蔬菜同餐，学习日能量更稳。' :
        '春笋鸡肉丝适合家庭正餐做配菜，和主食一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '鸡肉切细丝，春笋切细丝焯水，先从小份开始。和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合和米饭一起安排，做配菜分量控制在一小份。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，做配菜分量小份。' :
        '青少年阶段更适合和主食、蔬菜一起安排。'),
      nutrientCombination: '鸡肉提供优质蛋白，春笋提供膳食纤维，这道更适合做配菜，和米饭、蔬菜一起安排更完整。'
    };
  }

  if (title === '芦笋鸡肉丝') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '芦笋鸡肉丝适合午餐做配菜，鸡肉补蛋白质，芦笋提供嫩蔬菜和膳食纤维，更适合搭配软饭一起安排。' :
        stageKey === '3-6岁' ? '芦笋鸡肉丝适合午餐做配菜，鸡肉补蛋白质，芦笋补蔬菜，和米饭搭配更完整。' :
        stageKey === '6-12岁' ? '芦笋鸡肉丝适合午餐或晚餐做配菜，蛋白质和蔬菜同餐，学习日能量更稳。' :
        '芦笋鸡肉丝适合家庭正餐做配菜，和主食一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '鸡肉切细丝，芦笋去老皮切小段，先从小份开始。和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合和米饭一起安排，做配菜分量控制在一小份。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，做配菜分量小份。' :
        '青少年阶段更适合和主食、蔬菜一起安排。'),
      nutrientCombination: '鸡肉提供优质蛋白，芦笋提供嫩蔬菜和膳食纤维，这道更适合做配菜，和米饭、蔬菜一起安排更完整。'
    };
  }

  if (title === '蕨菜鸡肉丝') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '蕨菜鸡肉丝适合午餐做配菜，鸡肉补蛋白质，蕨菜提供膳食纤维，更适合搭配软饭一起安排。' :
        stageKey === '3-6岁' ? '蕨菜鸡肉丝适合午餐做配菜，鸡肉补蛋白质，蕨菜补蔬菜，和米饭搭配更完整。' :
        stageKey === '6-12岁' ? '蕨菜鸡肉丝适合午餐或晚餐做配菜，蛋白质和蔬菜同餐，学习日能量更稳。' :
        '蕨菜鸡肉丝适合家庭正餐做配菜，和主食一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '鸡肉切细丝，蕨菜切小段焯水，先从小份开始。和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合和米饭一起安排，做配菜分量控制在一小份。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，做配菜分量小份。' :
        '青少年阶段更适合和主食、蔬菜一起安排。'),
      nutrientCombination: '鸡肉提供优质蛋白，蕨菜提供膳食纤维，这道更适合做配菜，和米饭、蔬菜一起安排更完整。'
    };
  }

  if (title === '蕨菜炒蛋') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '蕨菜炒蛋适合午餐做配菜，鸡蛋补蛋白质，蕨菜提供膳食纤维，软嫩口感更容易被低龄孩子接受。' :
        stageKey === '3-6岁' ? '蕨菜炒蛋适合午餐做配菜，鸡蛋补蛋白质，蕨菜补蔬菜，和米饭搭配更完整。' :
        stageKey === '6-12岁' ? '蕨菜炒蛋适合午餐或晚餐做配菜，蛋白质和蔬菜同餐，学习日能量更稳。' :
        '蕨菜炒蛋适合家庭正餐做配菜，和主食一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '蕨菜切小段焯水，鸡蛋炒嫩，先从小份开始。和软饭一起吃更稳。' :
        stageKey === '3-6岁' ? '更适合和米饭一起安排，做配菜分量控制在一小份。' :
        stageKey === '6-12岁' ? '和主食、蔬菜一起搭配，做配菜分量小份。' :
        '青少年阶段更适合和主食、蔬菜一起安排。'),
      nutrientCombination: '鸡蛋提供优质蛋白，蕨菜提供膳食纤维，这道更适合做配菜，和米饭、蔬菜一起安排更完整。'
    };
  }

  // 饼类
  if (title === '黄瓜鸡蛋饼') {
    return {
      category: '早餐',
      description: (stageKey === '1-3岁' ? '黄瓜鸡蛋饼适合早餐做蛋白质和蔬菜组合，鸡蛋和面粉做基础，黄瓜丝补蔬菜，更适合低龄孩子用手抓着吃。' :
        stageKey === '3-6岁' ? '黄瓜鸡蛋饼适合早餐打底，面粉负责碳水，鸡蛋补蛋白质，黄瓜补蔬菜，一张饼就是一个完整的小餐包。' :
        stageKey === '6-12岁' ? '黄瓜鸡蛋饼适合早餐作为便携组合，和牛奶或豆浆一起安排，学习日半天更稳。' :
        '黄瓜鸡蛋饼适合青少年早餐，和奶类、水果一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '饼摊薄煎至两面微黄，先从小半张开始。配温奶更接近完整一餐。' :
        stageKey === '3-6岁' ? '早餐里配一杯牛奶更完整，让孩子自己拿着吃更开心。' :
        stageKey === '6-12岁' ? '学习日早餐更适合和牛奶一起安排，帮助上午能量更平稳。' :
        '青少年阶段更适合和奶类、水果搭配。'),
      nutrientCombination: '鸡蛋提供优质蛋白，面粉做碳水基础，黄瓜补充蔬菜，这道更适合早餐做便携组合，和奶类搭配更完整。'
    };
  }

  // 特殊
  if (title === '豌豆凉粉鸡丝碗') {
    return {
      category: '午餐',
      description: (stageKey === '1-3岁' ? '豌豆凉粉鸡丝碗适合午餐做主食，凉粉软滑、鸡丝嫩口，比较适合低龄孩子从软滑口感开始练习。' :
        stageKey === '3-6岁' ? '豌豆凉粉鸡丝碗适合午餐做主食，凉粉负责碳水，鸡丝补蛋白质，中午安排更合适。' :
        stageKey === '6-12岁' ? '豌豆凉粉鸡丝碗适合午餐或晚餐做主食，碳水、蛋白质同餐，和蔬菜搭配更均衡。' :
        '豌豆凉粉鸡丝碗适合午餐或晚餐做主食，和蔬菜、汤品一起安排更完整。'),
      tips: (stageKey === '1-3岁' ? '凉粉保持温热，鸡丝撕细，先从小半碗开始。配一份蒸蛋更接近完整一餐。' :
        stageKey === '3-6岁' ? '更适合午餐安排，配一份蔬菜或蒸蛋更完整。让孩子自己练习用勺。' :
        stageKey === '6-12岁' ? '学习日午餐优先保证主食和蛋白质，和蔬菜搭配更稳。' :
        '青少年阶段更适合和蔬菜、汤品一起安排。'),
      nutrientCombination: '凉粉提供碳水，鸡丝补充优质蛋白，这道更适合午餐做主食，和蔬菜搭配更完整。'
    };
  }

  if (title === '木姜子冬瓜丸子汤') {
    return {
      category: '汤品',
      description: (stageKey === '1-3岁' ? '木姜子冬瓜丸子汤适合作为正餐配汤，猪肉丸补蛋白质，冬瓜提供水分和膳食纤维，木姜子油少量提味，分量控制在半碗以内更合适。' :
        stageKey === '3-6岁' ? '木姜子冬瓜丸子汤适合放在正餐里做配汤，丸子补蛋白质，冬瓜清淡解腻，和主食一起安排更稳。' :
        stageKey === '6-12岁' ? '木姜子冬瓜丸子汤适合作为正餐的配汤，蛋白质和蔬菜一起补充，和主食搭配更完整。' :
        '木姜子冬瓜丸子汤适合家庭正餐的配汤，清爽解腻，和主食、蛋白质来源一起安排更均衡。'),
      tips: (stageKey === '1-3岁' ? '丸子做小颗，冬瓜切小丁，木姜子油只用1滴。先从小半碗开始，和主食一起上桌。' :
        stageKey === '3-6岁' ? '更适合和米饭、面食一起安排，先保证主食和蛋白质，再喝汤。' :
        stageKey === '6-12岁' ? '和主食、蛋白质来源一起搭配，喝汤量控制在半碗以内。' :
        '青少年阶段更适合和主食、蛋白质来源一起安排。'),
      nutrientCombination: '猪肉丸提供蛋白质，冬瓜补充水分和膳食纤维，木姜子油少量提味，这道更适合作为正餐配汤，和主食、蔬菜一起安排更完整。'
    };
  }

  return null;
}

function sanitizeNutritionRecipeSource(recipe) {
  if (!recipe || typeof recipe !== 'object') {
    return null;
  }
  const ageRange = normalizeNutritionAgeQuery(recipe.ageRange || recipe.age_range || '');
  if (ageRange === '0-1岁') {
    return null;
  }

  const nextRecipe = Object.assign({}, recipe, {
    ageRange: ageRange || recipe.ageRange,
    description: sanitizeNutritionRecipeSourceText(recipe.description, ageRange, 'description'),
    tips: sanitizeNutritionRecipeSourceText(recipe.tips, ageRange, 'tips'),
    nutrientCombination: sanitizeNutritionRecipeSourceText(recipe.nutrientCombination, ageRange, 'nutrientCombination')
  });

  nextRecipe.category = inferNutritionServingCategory(nextRecipe);

  nextRecipe.tags = Array.isArray(recipe.tags) ? recipe.tags.slice() : [];
  nextRecipe.ingredients = Array.isArray(recipe.ingredients)
    ? recipe.ingredients.map((item) => Object.assign({}, item))
    : [];
  nextRecipe.steps = Array.isArray(recipe.steps) ? recipe.steps.slice() : [];
  nextRecipe.nutrition = Object.assign({}, recipe.nutrition || {});
  nextRecipe.dailyNutritionPercent = recipe.dailyNutritionPercent || '';

  if (nextRecipe.dailyNutritionPercent && typeof nextRecipe.dailyNutritionPercent === 'object') {
    const parts = [];
    if (nextRecipe.dailyNutritionPercent.protein !== undefined) parts.push('蛋白质 ' + nextRecipe.dailyNutritionPercent.protein + '%');
    if (nextRecipe.dailyNutritionPercent.calcium !== undefined) parts.push('钙 ' + nextRecipe.dailyNutritionPercent.calcium + '%');
    if (nextRecipe.dailyNutritionPercent.iron !== undefined) parts.push('铁 ' + nextRecipe.dailyNutritionPercent.iron + '%');
    if (nextRecipe.dailyNutritionPercent.carbs !== undefined) parts.push('碳水化合物 ' + nextRecipe.dailyNutritionPercent.carbs + '%');
    if (nextRecipe.dailyNutritionPercent.fat !== undefined) parts.push('脂肪 ' + nextRecipe.dailyNutritionPercent.fat + '%');
    if (nextRecipe.dailyNutritionPercent.vitamin !== undefined) parts.push('维生素 ' + nextRecipe.dailyNutritionPercent.vitamin + '%');
    if (nextRecipe.dailyNutritionPercent.mineral !== undefined) parts.push('矿物质 ' + nextRecipe.dailyNutritionPercent.mineral + '%');
    if (nextRecipe.dailyNutritionPercent.fiber !== undefined) parts.push('膳食纤维 ' + nextRecipe.dailyNutritionPercent.fiber + '%');
    if (nextRecipe.dailyNutritionPercent.energy !== undefined) parts.push('能量 ' + nextRecipe.dailyNutritionPercent.energy + '%');
    nextRecipe.dailyNutritionPercent = parts.join('，');
  }

  if (nextRecipe.nutrition.highlight) {
    nextRecipe.nutrition.highlight = sanitizeNutritionRecipeSourceText(nextRecipe.nutrition.highlight, ageRange, 'highlight');
  }

  const sourceOverride = getNutritionRecipeSourceOverride(nextRecipe, ageRange);
  if (sourceOverride) {
    Object.assign(nextRecipe, sourceOverride);
  }

  return nextRecipe;
}

function buildNutritionRecipeBase(recipe) {
  const image = getNutritionRecipeImage(recipe);
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
    image,
    images: normalizeNutritionRecipeImages(recipe, image),
    viewCount: recipe.viewCount || 0,
    is_favorited: false,
    isFavorite: false,
    created_at: new Date().toISOString()
  };
}

function getNutritionRecipeFallbackImage(recipe) {
  const category = String((recipe && recipe.category) || '').trim();
  const categoryImageMap = {
    '早餐': 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    '午餐': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
    '晚餐': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    '加餐': 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?auto=format&fit=crop&w=1200&q=80',
    '汤品': 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80'
  };
  return categoryImageMap[category] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80';
}

function getNutritionRecipeImage(recipe) {
  return String((recipe && (recipe.image || recipe.cover_image || recipe.cover)) || '').trim() || getNutritionRecipeFallbackImage(recipe);
}

function normalizeNutritionRecipeImages(recipe, primaryImage) {
  const source = Array.isArray(recipe && recipe.images) ? recipe.images.filter(Boolean) : [];
  if (source.length) {
    return source;
  }
  return primaryImage ? [primaryImage] : [];
}

function normalizeNutritionRecipeSummary(recipe) {
  const normalizedRecipe = enrichNutritionRecipeForSelectedAge(recipe, recipe && (recipe.ageRange || recipe.age_range));
  const deepContent = buildNutritionDeepContent(normalizedRecipe, normalizedRecipe && (normalizedRecipe.ageRange || normalizedRecipe.age_range));
  const base = buildNutritionRecipeBase(normalizedRecipe);
  return Object.assign({}, base, {
    nutrition: {
      highlight: normalizedRecipe.nutrition && normalizedRecipe.nutrition.highlight ? normalizedRecipe.nutrition.highlight : ''
    },
    tips: normalizedRecipe.tips || '',
    depthSummary: deepContent.depthSummary,
    suitableScene: deepContent.suitableScene,
    feedingAdvice: deepContent.feedingAdvice,
    safetyWarnings: deepContent.safetyWarnings,
    pairingAdvice: deepContent.pairingAdvice,
    substitutionAdvice: deepContent.substitutionAdvice,
    ageFocus: deepContent.ageFocus
  });
}

function normalizeNutritionRecipeSummaryForAge(recipe, selectedAgeRange) {
  const normalizedRecipe = enrichNutritionRecipeForSelectedAge(recipe, selectedAgeRange);
  return normalizeNutritionRecipeSummary(normalizedRecipe);
}

function normalizeNutritionRecipeDetail(recipe, selectedAgeRange) {
  const normalizedRecipe = enrichNutritionRecipeForSelectedAge(recipe, selectedAgeRange);
  const deepContent = buildNutritionDeepContent(normalizedRecipe, selectedAgeRange || normalizedRecipe.ageRange || normalizedRecipe.age_range);
  return Object.assign({}, buildNutritionRecipeBase(normalizedRecipe), {
    ingredients: normalizedRecipe.ingredients || [],
    steps: normalizedRecipe.steps || [],
    nutrition: normalizedRecipe.nutrition || {},
    tips: normalizedRecipe.tips || '',
    nutrientCombination: normalizedRecipe.nutrientCombination || '',
    dailyNutritionPercent: normalizedRecipe.dailyNutritionPercent || '',
    depthSummary: deepContent.depthSummary,
    suitableScene: deepContent.suitableScene,
    ageFocus: deepContent.ageFocus,
    feedingAdvice: deepContent.feedingAdvice,
    safetyWarnings: deepContent.safetyWarnings,
    pairingAdvice: deepContent.pairingAdvice,
    substitutionAdvice: deepContent.substitutionAdvice
  });
}

function filterNutritionRecipes(query) {
  const keyword = String((query && query.keyword) || '').trim();
  const category = String((query && query.category) || '').trim();
  const age = normalizeNutritionAgeQuery((query && (query.age_group || query.age)) || '');
  return NUTRITION_RECIPES.filter((recipe) => {
    const text = `${recipe.title} ${recipe.description} ${recipe.category} ${recipe.tags.join(' ')}`;
    if (keyword && !text.includes(keyword)) {
      return false;
    }
    if (category && recipe.category !== category) {
      return false;
    }
    if (age && age !== '全部年龄' && !isNutritionAgeMatch(recipe.ageRange || recipe.age_range, age)) {
      return false;
    }
    return true;
  });
}

function normalizeNutritionAgeQuery(age) {
  const value = String(age || '').trim();
  const ageMap = {
    '全部': '全部年龄',
    'all': '全部年龄',
    '6-12月': '',
    '0-1岁': '',
    'ling-yi-sui': '',
    '1-2岁': '1-2岁',
    'yi-er-sui': '1-2岁',
    '2-3岁': '2-3岁',
    'er-san-sui': '2-3岁',
    '1-3岁': '1-3岁',
    'yi-san-sui': '1-3岁',
    '3-4岁': '3-4岁',
    'san-si-sui': '3-4岁',
    '4-5岁': '4-5岁',
    'si-wu-sui': '4-5岁',
    '5-6岁': '5-6岁',
    'wu-liu-sui': '5-6岁',
    '3-6岁': '3-6岁',
    'san-liu-sui': '3-6岁',
    '6-7岁': '6-7岁',
    'liu-qi-sui': '6-7岁',
    '7-8岁': '7-8岁',
    'qi-ba-sui': '7-8岁',
    '8-12岁': '8-12岁',
    'ba-shi-er-sui': '8-12岁',
    '6-12岁': '6-12岁',
    'liu-shi-er-sui': '6-12岁',
    '12岁以上': '12岁以上'
  };
  return ageMap[value] || value;
}

function getNutritionAgeBucketValues(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  const ageBucketMap = {
    '1-3岁': ['1-2岁', '2-3岁'],
    '3-6岁': ['3-4岁', '4-5岁', '5-6岁'],
    '6-12岁': ['6-7岁', '7-8岁', '8-12岁'],
    '12岁以上': ['12岁以上']
  };
  return ageBucketMap[normalizedAge] || [normalizedAge];
}

function getNutritionAgeStageKey(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  if (getNutritionAgeBucketValues('1-3岁').includes(normalizedAge)) {
    return '1-3岁';
  }
  if (getNutritionAgeBucketValues('3-6岁').includes(normalizedAge)) {
    return '3-6岁';
  }
  if (getNutritionAgeBucketValues('6-12岁').includes(normalizedAge)) {
    return '6-12岁';
  }
  return normalizedAge;
}

function getNutritionAgeStageProfile(age) {
  const stageKey = getNutritionAgeStageKey(age);
  const profileMap = {
    '1-3岁': {
      stageTag: '质地过渡与稳定接受度',
      summaryPrefix: '1-3岁更适合围绕软烂质地、稳定吞咽和基础咀嚼过渡来安排家庭做法。',
      tipSuffix: '先稳住规律进餐和接受度，再逐步增加颗粒感、食物种类和自主拿勺机会。',
      categoryWeights: { '早餐': 8, '加餐': 6, '汤品': 5 },
      keywordBoosts: ['粥', '蒸', '羹', '豆腐', '蛋', '汤']
    },
    '3-6岁': {
      stageTag: '自主进食与餐桌规则',
      summaryPrefix: '3-6岁更适合围绕自主进食、规律三餐、食物多样性和基础餐桌规则来做搭配。',
      tipSuffix: '这阶段适合保留清晰口感、控制加餐干扰，并让孩子参与简单分餐和收尾。',
      categoryWeights: { '早餐': 8, '午餐': 5, '加餐': 6, '汤品': 4 },
      keywordBoosts: ['粥', '蒸蛋', '豆腐', '饭', '面', '饺', '汤']
    },
    '6-12岁': {
      stageTag: '学习活动能量与生长支持',
      summaryPrefix: '6-12岁更关注稳定能量、优质蛋白、铁、钙和日常活动恢复，适合学习日常与运动消耗。',
      tipSuffix: '这阶段优先保证主食、蛋白质、蔬菜同餐出现，同时减少高糖零食和只喝汤不吃主食。',
      categoryWeights: { '早餐': 8, '午餐': 7, '晚餐': 6, '汤品': 4 },
      keywordBoosts: ['牛', '鸡', '鱼', '排骨', '豆', '蛋', '饭', '面']
    }
  };
  return profileMap[stageKey] || null;
}

function getNutritionRecipeIngredientNames(recipe) {
  return (Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients : []).map((item) => String((item && item.name) || '').trim()).filter(Boolean);
}

function nutritionRecipeContainsKeyword(recipe, keywords) {
  const text = [recipe && recipe.title, recipe && recipe.description, Array.isArray(recipe && recipe.tags) ? recipe.tags.join(' ') : '', getNutritionRecipeIngredientNames(recipe).join(' ')].join(' ');
  return (keywords || []).some((keyword) => text.includes(keyword));
}

function getNutritionBlockedKeywordsForAge(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  if (normalizedAge === '1-2岁') {
    return ['腊肉', '腊肠', '香肠', '火腿', '培根', '辣椒', '蜂蜜', '红糖', '韭菜', '香椿', '蕨菜', '凉粉', '木姜子', '鱼头', '排骨'];
  }
  if (normalizedAge === '2-3岁') {
    return ['腊肉', '腊肠', '香肠', '火腿', '培根', '辣椒', '蜂蜜', '红糖', '香椿', '蕨菜', '木姜子', '鱼头'];
  }
  return [];
}

function isNutritionRecipeSafeForAge(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange);
  if (!normalizedAge) {
    return true;
  }
  if (nutritionRecipeContainsKeyword(recipe, getNutritionBlockedKeywordsForAge(normalizedAge))) {
    return false;
  }
  return true;
}

function getNutritionMealLabel(category) {
  const mealMap = {
    '早餐': '早餐或上学前加能量',
    '午餐': '午餐主菜或主食搭配',
    '晚餐': '晚餐收口和全天营养补齐',
    '加餐': '两餐之间的小份补充',
    '汤品': '正餐里的配汤或补水搭配'
  };
  return mealMap[String(category || '').trim()] || '家庭日常一餐';
}

function inferNutritionServingCategory(recipe) {
  const rawCategory = String((recipe && recipe.category) || '').trim();
  const text = [recipe && recipe.title, recipe && recipe.description, getNutritionRecipeIngredientNames(recipe).join(' ')].join(' ');

  if (['粥'].some((keyword) => text.includes(keyword))) {
    return rawCategory === '加餐' ? '加餐' : '早餐';
  }
  if (['蒸蛋', '豆腐脑', '豆花', '蛋羹'].some((keyword) => text.includes(keyword))) {
    return rawCategory === '加餐' ? '加餐' : '早餐';
  }
  if (['汤', '羹', '排骨', '鸡汤', '丸子汤', '鱼头'].some((keyword) => text.includes(keyword))) {
    return rawCategory === '晚餐' ? '晚餐' : '汤品';
  }
  if (['饭', '面', '粉', '饺', '馄饨'].some((keyword) => text.includes(keyword))) {
    return rawCategory === '晚餐' ? '晚餐' : '午餐';
  }
  if (['饼', '卷'].some((keyword) => text.includes(keyword))) {
    return rawCategory === '午餐' ? '午餐' : '早餐';
  }

  return rawCategory;
}

function scoreNutritionRecipeCategoryFit(recipe) {
  const category = inferNutritionServingCategory(recipe);
  const text = [recipe && recipe.title, recipe && recipe.description, getNutritionRecipeIngredientNames(recipe).join(' ')].join(' ');
  let score = 0;

  if (['汤', '羹', '排骨', '鸡汤', '丸子汤', '鱼头'].some((keyword) => text.includes(keyword))) {
    if (['午餐', '晚餐', '汤品'].includes(category)) {
      score += 26;
    }
    if (category === '早餐') {
      score -= 24;
    }
    if (category === '加餐') {
      score -= 18;
    }
  }

  if (['粥', '蒸蛋', '豆腐脑', '豆花', '蛋羹'].some((keyword) => text.includes(keyword))) {
    if (['早餐', '加餐'].includes(category)) {
      score += 22;
    }
    if (['午餐', '晚餐'].includes(category)) {
      score += 4;
    }
    if (category === '汤品') {
      score -= 10;
    }
  }

  if (['饭', '面', '粉', '饺', '馄饨'].some((keyword) => text.includes(keyword))) {
    if (['午餐', '晚餐'].includes(category)) {
      score += 20;
    }
    if (category === '早餐') {
      score -= 6;
    }
    if (category === '加餐') {
      score -= 12;
    }
  }

  if (['饼', '卷'].some((keyword) => text.includes(keyword))) {
    if (['早餐', '午餐'].includes(category)) {
      score += 16;
    }
    if (category === '晚餐') {
      score += 6;
    }
  }

  return score;
}

function getNutritionPortionGuidance(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  const map = {
    '1-2岁': '单次分量控制在小半碗以内，先保证软烂、好吞咽，再看孩子是否愿意持续接受。',
    '2-3岁': '可以做成小半碗到大半碗，重点看咀嚼节奏、坐定进食和是否能稳定吃完。',
    '3-4岁': '一餐里保留这道搭配，再配一种熟悉主食，孩子更容易吃完。',
    '4-5岁': '按幼儿园作息安排，避免加餐过多影响下一顿正餐。',
    '5-6岁': '优先放在早餐或午餐，帮助白天活动和专注更稳定。',
    '6-7岁': '适合上学日前半天或放学后安排，重在稳定能量和蛋白质。',
    '7-8岁': '可作为活动日前后的补充，注意和蔬菜、主食一起搭配。',
    '8-12岁': '适合学习日常与运动后恢复，主食、蛋白质、蔬菜三类尽量同餐出现。',
    '12岁以上': '按青少年食量灵活调整，优先保证规律进餐和总量稳定。'
  };
  return map[normalizedAge] || '按孩子当天食量和接受度灵活调整，先少量试，再逐步稳定。';
}

function getNutritionMetricInsights(recipe) {
  const metrics = [
    { key: 'protein', label: '蛋白质', unit: 'g', value: parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.protein) },
    { key: 'calcium', label: '钙', unit: 'mg', value: parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.calcium) },
    { key: 'iron', label: '铁', unit: 'mg', value: parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.iron) },
    { key: 'fiber', label: '膳食纤维', unit: 'g', value: parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.fiber) },
    { key: 'vitaminC', label: '维生素C', unit: 'mg', value: parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.vitaminC) }
  ].filter((item) => item.value > 0);
  return metrics.sort((a, b) => b.value - a.value).slice(0, 2);
}

function getNutritionAgeFocusText(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  const focusMap = {
    '1-2岁': '软烂质地、手抓进食、稳定接受度和基础餐次规律',
    '2-3岁': '咀嚼练习、规律三餐、减少追喂和减少边吃边玩',
    '3-4岁': '自主进食、基础咀嚼、早餐质量和餐桌规则',
    '4-5岁': '稳定正餐、加餐节奏、食物多样性和午晚餐平衡',
    '5-6岁': '白天活动能量、早餐质量、进餐独立性和挑食管理',
    '6-7岁': '上学日能量稳定、优质蛋白、午餐饱腹感和放学后补给',
    '7-8岁': '学习日常能量、蔬菜摄入、运动前后补给和零食控制',
    '8-12岁': '生长高峰期的蛋白质、钙、铁、早餐稳定和规律进餐',
    '12岁以上': '青少年阶段的总量稳定、饮食均衡和自我管理'
  };
  return focusMap[normalizedAge] || '规律进餐和营养均衡';
}

function getNutritionStageExecutionAdvice(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  const map = {
    '1-2岁': '优先把一餐控制在20分钟左右，先给软烂主食和蛋白质，再补蔬菜，减少边走边喂。',
    '2-3岁': '先固定早餐、午餐、晚餐和1次加餐，让孩子坐定吃完，再慢慢增加颗粒感和食物种类。',
    '3-4岁': '早餐优先保证主食和蛋白质，午晚餐各留一道熟悉食物打底，新食物一次只加一种。',
    '4-5岁': '加餐更适合放在正餐中间，量以不影响下一顿为准，晚餐尽量避免只喝汤或只吃主食。',
    '5-6岁': '幼儿园日常更看重早餐质量和放学后补给节奏，先稳住正餐，再处理挑食问题。',
    '6-7岁': '上学日早餐尽量同时有主食和蛋白质，放学后补给控制分量，避免直接影响晚餐。',
    '7-8岁': '如果当天有运动或户外活动，优先把蛋白质和主食放在白天，晚餐以清淡收口更稳。',
    '8-12岁': '学习日和运动日都要先稳住早餐、午餐和放学后补给，零食和含糖饮料尽量放到最低。',
    '12岁以上': '青少年阶段更适合把三餐和运动后补给固定下来，再根据食量增减总量。'
  };
  return map[normalizedAge] || '先稳住规律三餐，再按孩子活动量和接受度做微调。';
}

function getNutritionStageRiskHint(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  const map = {
    '1-2岁': '这一阶段重点避免追喂、边玩边吃和明显过硬、过大块食物。',
    '2-3岁': '这一阶段重点避免零食顶替正餐，也要减少长时间含饭不咽。',
    '3-4岁': '这一阶段重点避免用甜食奖励进餐，否则更容易打乱正餐节奏。',
    '4-5岁': '这一阶段重点避免加餐过密和晚餐拖太晚，不然第二天早餐更难稳定。',
    '5-6岁': '这一阶段重点避免早餐过简或放学后吃太多零食，不然正餐质量会明显下滑。',
    '6-7岁': '这一阶段重点避免只吃主食或只喝汤，午晚餐都要留出蛋白质位置。',
    '7-8岁': '这一阶段重点避免高糖饮料和高油零食占掉正餐空间。',
    '8-12岁': '这一阶段重点避免早餐缺失、放学后暴食和长期蔬菜不足。',
    '12岁以上': '这一阶段重点避免节食式控制和无节奏加餐。'
  };
  return map[normalizedAge] || '重点避免让零食和饮料占掉正餐空间。';
}

function buildNutritionDescriptionForAge(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange || (recipe && (recipe.ageRange || recipe.age_range)) || '');
  const ingredientNames = getNutritionRecipeIngredientNames(recipe);
  const mealLabel = getNutritionMealLabel(recipe && recipe.category);
  const focusText = getNutritionAgeFocusText(normalizedAge);
  const ingredientsText = ingredientNames.length ? ingredientNames.slice(0, 3).join('、') : '常见家庭食材';
  return `${String((recipe && (recipe.title || recipe.name)) || '这道搭配').trim()}更适合${normalizedAge || '当前年龄'}孩子安排在${mealLabel}，主要围绕${ingredientsText}做搭配，重点支持${focusText}。`;
}

function buildNutritionHighlightForAge(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange || (recipe && (recipe.ageRange || recipe.age_range)) || '');
  const topMetrics = getNutritionMetricInsights(recipe);
  const metricText = topMetrics.length ? topMetrics.map((item) => `${item.label}${item.value}${item.unit}`).join('、') : '主食、蛋白质和蔬菜的基础搭配';
  if (['1-2岁', '2-3岁'].includes(normalizedAge)) {
    return `这道更适合先练接受度和吞咽安全，同时补充${metricText}。`;
  }
  if (['3-4岁', '4-5岁', '5-6岁'].includes(normalizedAge)) {
    return `这道更适合在自主进食阶段补充${metricText}，同时帮助孩子把一餐吃得更完整。`;
  }
  return `这道更适合作为学习和活动日常里的稳定补给，重点补充${metricText}。`;
}

function buildNutritionCombinationForAge(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange || (recipe && (recipe.ageRange || recipe.age_range)) || '');
  const topMetrics = getNutritionMetricInsights(recipe);
  const ingredientNames = getNutritionRecipeIngredientNames(recipe);
  const firstIngredient = ingredientNames[0] || '这道食材';
  const hasIron = topMetrics.some((item) => item.key === 'iron');
  const hasCalcium = topMetrics.some((item) => item.key === 'calcium');
  const hasProtein = topMetrics.some((item) => item.key === 'protein');
  if (hasIron) {
    return `${firstIngredient}这类搭配更适合同餐配一份富含维生素 C 的蔬果，帮助整餐更均衡，也方便家长把补铁安排进日常。`;
  }
  if (hasCalcium && hasProtein) {
    return `这道同时覆盖了蛋白质和钙来源，更适合和清淡蔬菜、主食一起吃成完整一餐，家长执行起来也更稳定。`;
  }
  if (['1-2岁', '2-3岁'].includes(normalizedAge)) {
    return `低龄阶段更适合把这道放进一顿简单的小份餐里，先看接受度，再慢慢增加食物种类。`;
  }
  return `这道更适合和蔬菜、主食一起搭配，比单独吃一道菜更容易把一餐吃完整。`;
}

function buildNutritionTipsForAge(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange || (recipe && (recipe.ageRange || recipe.age_range)) || '');
  const ingredientNames = getNutritionRecipeIngredientNames(recipe);
  const notes = [getNutritionPortionGuidance(normalizedAge)];
  notes.push(getNutritionStageExecutionAdvice(normalizedAge));
  if (ingredientNames.length) {
    notes.push(`先从孩子更容易接受的${ingredientNames[0]}口味开始，再逐步把其他食材加进来。`);
  }
  if (nutritionRecipeContainsKeyword(recipe, ['排骨', '鱼头', '鱼'])) {
    notes.push('给孩子分餐前先确认没有明显骨头或刺，低龄阶段尤其要再检查一次。');
  }
  if (nutritionRecipeContainsKeyword(recipe, ['鸡蛋', '豆腐'])) {
    notes.push('第一次连续吃这类高频食材时，先少量试 2-3 次，再决定是否放进常规菜单。');
  }
  if (['3-4岁', '4-5岁', '5-6岁'].includes(normalizedAge)) {
    notes.push('这阶段更适合让孩子自己拿勺、自己收尾，家长主要负责节奏和分量。');
  }
  if (['6-7岁', '7-8岁', '8-12岁', '12岁以上'].includes(normalizedAge)) {
    notes.push('如果当天活动量大，优先把这道放在早餐或午餐，晚餐尽量收口更清淡。');
  }
  return notes.slice(0, 3).join(' ');
}

function buildNutritionDeepContent(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange || (recipe && (recipe.ageRange || recipe.age_range)) || '');
  const profile = getNutritionAgeStageProfile(normalizedAge) || { stageTag: '', summaryPrefix: '', tipSuffix: '' };
  const ingredientNames = getNutritionRecipeIngredientNames(recipe);
  const topMetrics = getNutritionMetricInsights(recipe);
  const category = String((recipe && recipe.category) || '').trim();
  const mealLabel = getNutritionMealLabel(category);
  const riskWarnings = [];
  const pairingAdvice = [];
  const feedingAdvice = [];
  const substitutionAdvice = [];
  const metricText = topMetrics.map((item) => `${item.label}${item.value}${item.unit}`).join('、');

  feedingAdvice.push(`${mealLabel}更合适，${getNutritionPortionGuidance(normalizedAge)}`);
  if (profile.stageTag) {
    feedingAdvice.push(`${normalizedAge}阶段先关注${profile.stageTag}，比单纯追求吃得多更重要。`);
  }
  if (ingredientNames.length) {
    feedingAdvice.push(`这道的核心食材是${ingredientNames.slice(0, 3).join('、')}，先保留孩子最能接受的一样，再加新食材。`);
  }
  feedingAdvice.push(getNutritionStageExecutionAdvice(normalizedAge));

  if (topMetrics.some((item) => item.key === 'iron')) {
    pairingAdvice.push('如果今天这顿想重点补铁，同餐可搭配番茄、彩椒、橙子这类维生素 C 来源。');
  }
  if (topMetrics.some((item) => item.key === 'calcium')) {
    pairingAdvice.push('如果今天这顿更看重补钙，整体口味尽量清淡，盐不要重。');
  }
  if (topMetrics.some((item) => item.key === 'protein')) {
    pairingAdvice.push('如果蛋白质已经够了，另一道菜更适合补蔬菜和主食，不需要再叠很多肉。');
  }

  if (['1-2岁', '2-3岁'].includes(normalizedAge) && nutritionRecipeContainsKeyword(recipe, ['腊肉', '腊肠', '香肠', '火腿', '培根'])) {
    riskWarnings.push('加工肉盐分偏高，这个年龄段不适合作为常规食谱，建议换成鲜肉、鸡蛋、豆腐或鱼肉。');
    substitutionAdvice.push('把加工肉换成瘦猪肉、鸡胸肉、鱼肉或嫩豆腐，口味和盐分会更适合低龄孩子。');
  }
  if (nutritionRecipeContainsKeyword(recipe, ['排骨', '鱼头', '鱼'])) {
    riskWarnings.push('带骨或带刺食材更适合先处理干净，再分给孩子，低龄阶段尤其要避免直接整块入口。');
  }
  if (nutritionRecipeContainsKeyword(recipe, ['鸡蛋'])) {
    riskWarnings.push('鸡蛋相关食材第一次加量时先少量试，观察皮肤、呕吐和排便情况。');
  }
  riskWarnings.push(getNutritionStageRiskHint(normalizedAge));
  if (!riskWarnings.length) {
    riskWarnings.push('连续吃 2-3 次比一天换很多做法更容易判断孩子是否真正接受。');
  }
  if (!substitutionAdvice.length && ingredientNames.length) {
    substitutionAdvice.push(`如果孩子暂时不接受${ingredientNames[0]}，可以先用熟悉口味做替换，再逐步回到原配方。`);
  }

  return {
    ageFocus: normalizedAge ? `${normalizedAge}当前更该关注${profile.stageTag || '稳定进餐和营养均衡'}` : '当前更该关注稳定进餐和营养均衡',
    suitableScene: `${mealLabel}。${ingredientNames.length ? `这道主要围绕${ingredientNames.slice(0, 2).join('、')}来搭配。` : ''}`.trim(),
    depthSummary: `${normalizedAge || '当前年龄'}更适合把这道放在${mealLabel}，重点看${profile.stageTag || '孩子接受度'}。${metricText ? `这一餐更有价值的营养点主要是${metricText}。` : ''}`.trim(),
    feedingAdvice: feedingAdvice.slice(0, 3),
    safetyWarnings: riskWarnings.slice(0, 3),
    pairingAdvice: pairingAdvice.slice(0, 3),
    substitutionAdvice: substitutionAdvice.slice(0, 2).join(' ')
  };
}

function parseNutritionMetricNumber(value) {
  const match = String(value || '').match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function getNutritionAgeTargetMidpoint(age) {
  const normalizedAge = normalizeNutritionAgeQuery(age);
  if (normalizedAge === '3-6岁') {
    return 4.5;
  }
  if (normalizedAge === '6-12岁') {
    return 9;
  }
  if (normalizedAge === '1-3岁') {
    return 2;
  }
  const range = parseAgeRangeValue(normalizedAge);
  if (!range) {
    return 0;
  }
  return (range.min + range.max) / 2;
}

function scoreNutritionRecipeForAge(recipe, selectedAgeRange, mealPeriod) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange);
  const profile = getNutritionAgeStageProfile(normalizedAge);
  if (!profile) {
    return Number(recipe && recipe.viewCount) || 0;
  }
  const recipeAgeRange = String((recipe && (recipe.ageRange || recipe.age_range)) || '').trim();
  const category = inferNutritionServingCategory(recipe);
  const text = [recipe && recipe.title, recipe && recipe.description, category, Array.isArray(recipe && recipe.ingredients) ? recipe.ingredients.map((item) => item && item.name).join(' ') : ''].join(' ');
  const protein = parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.protein);
  const iron = parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.iron);
  const calcium = parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.calcium);
  const fiber = parseNutritionMetricNumber(recipe && recipe.nutrition && recipe.nutrition.fiber);
  const cookTime = parseNutritionMetricNumber(recipe && recipe.cookTime);
  let score = Number(recipe && recipe.viewCount) || 0;

  if (recipeAgeRange === normalizedAge) {
    score += 160;
  } else if (getNutritionAgeBucketValues(normalizedAge).includes(recipeAgeRange)) {
    score += 120;
  }

  if (recipeAgeRange && normalizedAge && recipeAgeRange !== normalizedAge && !getNutritionAgeBucketValues(normalizedAge).includes(recipeAgeRange)) {
    score -= 80;
  }

  score += Number(profile.categoryWeights[category] || 0) * 10;
  score += scoreNutritionRecipeCategoryFit(recipe);
  score += protein * (normalizedAge === '6-12岁' ? 6 : 4);
  score += iron * 18;
  score += calcium / (normalizedAge === '6-12岁' ? 4 : 5);
  score += fiber * (normalizedAge === '3-6岁' ? 8 : 5);

  if (cookTime > 0 && cookTime <= 30) {
    score += 12;
  }
  if (String((recipe && recipe.difficulty) || '').trim() === '简单') {
    score += 10;
  }

  profile.keywordBoosts.forEach((keyword) => {
    if (text.includes(keyword)) {
      score += 9;
    }
  });

  if (mealPeriod) {
    const categoryScoreMap = {
      breakfast: { '早餐': 50, '加餐': 30 },
      lunch: { '午餐': 50, '汤品': 20 },
      dinner: { '晚餐': 50, '汤品': 20 },
      snack: { '加餐': 50, '早餐': 20 }
    };
    const periodWeights = categoryScoreMap[mealPeriod] || {};
    const catBonus = periodWeights[category] || 0;
    if (catBonus) {
      score += catBonus;
    }
  }

  return score;
}

function pickBestNutritionRecipeVariant(recipes, selectedAgeRange) {
  if (!Array.isArray(recipes) || !recipes.length) {
    return null;
  }
  const targetMidpoint = getNutritionAgeTargetMidpoint(selectedAgeRange);
  return recipes.slice().sort((a, b) => {
    const scoreDiff = scoreNutritionRecipeForAge(b, selectedAgeRange) - scoreNutritionRecipeForAge(a, selectedAgeRange);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }
    const ageDiffA = Math.abs(getNutritionAgeTargetMidpoint(a.ageRange || a.age_range) - targetMidpoint);
    const ageDiffB = Math.abs(getNutritionAgeTargetMidpoint(b.ageRange || b.age_range) - targetMidpoint);
    if (ageDiffA !== ageDiffB) {
      return ageDiffA - ageDiffB;
    }
    return String(a.id).localeCompare(String(b.id));
  })[0];
}

function curateNutritionRecipesForAge(recipes, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange);
  if (!normalizedAge || normalizedAge === '全部年龄') {
    return Array.isArray(recipes) ? recipes.slice() : [];
  }
  const safeRecipes = (recipes || []).filter((recipe) => isNutritionRecipeSafeForAge(recipe, normalizedAge));
  const recipeGroups = new Map();
  safeRecipes.forEach((recipe) => {
    const key = String((recipe && recipe.title) || '').trim() || String((recipe && recipe.id) || '');
    if (!recipeGroups.has(key)) {
      recipeGroups.set(key, []);
    }
    recipeGroups.get(key).push(recipe);
  });
  return Array.from(recipeGroups.values())
    .map((group) => pickBestNutritionRecipeVariant(group, normalizedAge))
    .filter(Boolean)
    .sort((a, b) => scoreNutritionRecipeForAge(b, normalizedAge) - scoreNutritionRecipeForAge(a, normalizedAge));
}

function diversifyNutritionRecommendationPool(recipes, selectedAgeRange, limit, mealPeriod) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange);
  const source = Array.isArray(recipes) ? recipes.slice() : [];
  if (!source.length) {
    return [];
  }
  const count = Math.max(Number(limit) || source.length, 1);
  const picked = [];
  const usedCategories = new Set();
  const sorted = source.slice().sort((a, b) => scoreNutritionRecipeForAge(b, normalizedAge, mealPeriod) - scoreNutritionRecipeForAge(a, normalizedAge, mealPeriod));

  sorted.forEach((recipe) => {
    if (picked.length >= count) {
      return;
    }
    const category = String((recipe && recipe.category) || '').trim();
    if (!category || usedCategories.has(category)) {
      return;
    }
    picked.push(recipe);
    usedCategories.add(category);
  });

  sorted.forEach((recipe) => {
    if (picked.length >= count) {
      return;
    }
    if (!picked.includes(recipe)) {
      picked.push(recipe);
    }
  });

  return picked;
}

function resolveNutritionRecipeForDetail(recipeId, selectedAgeRange) {
  const recipe = NUTRITION_RECIPES.find((item) => item.id === recipeId);
  if (!recipe) {
    return null;
  }
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange);
  if (!normalizedAge || normalizedAge === '全部年龄') {
    return {
      recipe,
      notice: ''
    };
  }
  const title = String(recipe.title || '').trim();
  const sameTitleRecipes = (NUTRITION_RECIPES || []).filter((item) => String(item.title || '').trim() === title && isNutritionAgeMatch(item.ageRange || item.age_range, normalizedAge));
  const curated = curateNutritionRecipesForAge(sameTitleRecipes.length ? sameTitleRecipes : [recipe], normalizedAge);
  if (curated.length) {
    const resolvedRecipe = curated[0];
    if (resolvedRecipe.id !== recipe.id) {
      return {
        recipe: Object.assign({}, resolvedRecipe, { id: recipe.id }),
        notice: `已按${normalizedAge}自动切换为更适合当前年龄的同主题搭配。`
      };
    }
    return {
      recipe: resolvedRecipe,
      notice: ''
    };
  }
  const fallbackPool = curateNutritionRecipesForAge((NUTRITION_RECIPES || []).filter((item) => String((item.category || '')).trim() === String((recipe.category || '')).trim()), normalizedAge);
  if (fallbackPool.length) {
    return {
      recipe: Object.assign({}, fallbackPool[0], { id: recipe.id }),
      notice: `原食谱不适合${normalizedAge}阶段，已切换为同类更稳妥的搭配建议。`
    };
  }
  return {
    recipe,
    notice: ''
  };
}

function enrichNutritionRecipeForSelectedAge(recipe, selectedAgeRange) {
  const normalizedAge = normalizeNutritionAgeQuery(selectedAgeRange || (recipe && (recipe.ageRange || recipe.age_range)) || '');
  const profile = getNutritionAgeStageProfile(normalizedAge);
  if (!normalizedAge || !recipe) {
    return recipe;
  }
  const nextRecipe = Object.assign({}, recipe);
  nextRecipe.category = inferNutritionServingCategory(recipe);
  const tags = Array.isArray(recipe.tags) ? recipe.tags.slice() : [];
  if (normalizedAge && !tags.includes(normalizedAge)) {
    tags.unshift(normalizedAge);
  }
  if (profile && profile.stageTag && !tags.includes(profile.stageTag)) {
    tags.push(profile.stageTag);
  }
  nextRecipe.tags = tags;
  nextRecipe.ageRange = normalizedAge;
  nextRecipe.description = buildNutritionDescriptionForAge(recipe, normalizedAge);
  nextRecipe.tips = buildNutritionTipsForAge(recipe, normalizedAge);
  nextRecipe.nutrientCombination = buildNutritionCombinationForAge(recipe, normalizedAge);
  nextRecipe.nutrition = Object.assign({}, recipe.nutrition || {}, {
    highlight: buildNutritionHighlightForAge(recipe, normalizedAge)
  });
  return nextRecipe;
}

function isNutritionAgeMatch(recipeAgeRange, selectedAgeRange) {
  const normalizedSelectedAge = normalizeNutritionAgeQuery(selectedAgeRange);
  if (!normalizedSelectedAge || normalizedSelectedAge === '全部年龄') {
    return true;
  }
  if (String(recipeAgeRange || '').trim() === normalizedSelectedAge) {
    return true;
  }
  return isRecipeAgeCompatible(recipeAgeRange, normalizedSelectedAge);
}

function nutritionRecommendationsHandler(req, res) {
  const selectedAgeRange = normalizeNutritionAgeQuery((req.query && (req.query.age_group || req.query.age)) || '');
  const count = Math.min(Math.max(Number((req.query && req.query.count) || 7) || 7, 1), 12);
  const filtered = curateNutritionRecipesForAge(filterNutritionRecipes(req.query), selectedAgeRange);
  const source = filtered.length ? filtered : curateNutritionRecipesForAge(NUTRITION_RECIPES, selectedAgeRange);
  const mealPeriod = String((req.query && req.query.meal_period) || '').trim() || null;
  const diversified = diversifyNutritionRecommendationPool(source, selectedAgeRange, count, mealPeriod);
  const recipes = diversified.map((recipe) => normalizeNutritionRecipeSummaryForAge(recipe, selectedAgeRange));
  res.json({ success: true, data: recipes });
}

function nutritionRecipesHandler(req, res) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.page_size || req.query.pageSize || 10), 1), 30);
  const selectedAgeRange = normalizeNutritionAgeQuery((req.query && (req.query.age_group || req.query.age)) || '');
  const filtered = curateNutritionRecipesForAge(filterNutritionRecipes(req.query), selectedAgeRange);
  const offset = (page - 1) * pageSize;
  const recipes = filtered.slice(offset, offset + pageSize).map((recipe) => normalizeNutritionRecipeSummaryForAge(recipe, selectedAgeRange));
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
  const selectedAgeRange = normalizeNutritionAgeQuery((req.query && (req.query.age_group || req.query.age)) || '');
  const resolved = resolveNutritionRecipeForDetail(req.params.id, selectedAgeRange);
  if (!resolved || !resolved.recipe) {
    res.status(404).json({ success: false, message: '食谱不存在' });
    return;
  }
  const detail = normalizeNutritionRecipeDetail(resolved.recipe, selectedAgeRange);
  if (resolved.notice) {
    detail.contentNotice = resolved.notice;
  }
  res.json({ success: true, data: detail });
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

function virtualPayConfigError(planCode) {
  return {
    success: false,
    code: 'WECHAT_VIRTUAL_PAY_NOT_CONFIGURED',
    message: '小程序虚拟支付配置中，请使用试用、兑换码或邀请奖励',
    missing_config: getMissingVirtualPayConfig(planCode)
  };
}

function getVirtualPayAppKey() {
  return virtualPayConfig.env === 0 ? virtualPayConfig.appKey : (virtualPayConfig.sandboxAppKey || virtualPayConfig.appKey);
}

function getVirtualPayProductId(planCode) {
  return virtualPayConfig.productIds[String(planCode || '').trim()] || '';
}

function getMissingVirtualPayConfig(planCode) {
  return [
    ['WECHAT_VIRTUAL_PAY_OFFER_ID', virtualPayConfig.offerId],
    [virtualPayConfig.env === 0 ? 'WECHAT_VIRTUAL_PAY_APP_KEY' : 'WECHAT_VIRTUAL_PAY_SANDBOX_APP_KEY', getVirtualPayAppKey()],
    [`WECHAT_VIRTUAL_PAY_PRODUCT_${String(planCode || '').toUpperCase()}`, getVirtualPayProductId(planCode)]
  ].filter(([, value]) => !value).map(([key]) => key);
}

function isVirtualPayConfigured(planCode) {
  return getMissingVirtualPayConfig(planCode).length === 0;
}

function buildVirtualPayOutTradeNo() {
  return `VP${Date.now()}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
}

function hmacSha256Hex(key, value) {
  return crypto.createHmac('sha256', key).update(value).digest('hex');
}

function yuanToFen(priceYuan) {
  return Math.round(Number(priceYuan || 0));
}

function verifyWechatMessagePushSignature(query) {
  if (!wechatMessagePushConfig.token) {
    return true;
  }
  const signature = String((query && query.signature) || '');
  const timestamp = String((query && query.timestamp) || '');
  const nonce = String((query && query.nonce) || '');
  if (!signature || !timestamp || !nonce) {
    return false;
  }
  const expected = crypto.createHash('sha1')
    .update([wechatMessagePushConfig.token, timestamp, nonce].sort().join(''))
    .digest('hex');
  return expected === signature;
}

function parseWechatMessagePayload(req) {
  if (!req.body) {
    return {};
  }
  if (typeof req.body === 'object') {
    return req.body;
  }
  const rawBody = String(req.body || '').trim();
  if (!rawBody) {
    return {};
  }
  if (rawBody[0] === '{') {
    return JSON.parse(rawBody);
  }
  return parseSimpleXml(rawBody);
}

function parseSimpleXml(xmlText) {
  const result = {};
  String(xmlText || '').replace(/<([A-Za-z0-9_]+)>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([\s\S]*?))<\/\1>/g, (match, key, cdataValue, textValue) => {
    if (key !== 'xml') {
      result[key] = cdataValue !== undefined ? cdataValue : textValue;
    }
    return match;
  });
  return result;
}

function getVirtualPayOrderNo(payload) {
  return payload.OutTradeNo || payload.outTradeNo || payload.out_trade_no || payload.order_no || payload.attach || '';
}

function getVirtualPayTransactionId(payload) {
  const payInfo = payload.WeChatPayInfo || payload.weChatPayInfo || payload.pay_info || {};
  return payload.TransactionId || payload.transactionId || payload.transaction_id || payInfo.TransactionId || payInfo.transactionId || payInfo.transaction_id || '';
}

function getVirtualPayEnv(payload) {
  const value = payload.Env !== undefined ? payload.Env : payload.env;
  return value === undefined || value === '' ? null : Number(value);
}

function getVirtualPayGoodsInfo(payload) {
  return payload.GoodsInfo || payload.goodsInfo || payload.goods_info || {};
}

function getVirtualPayProductIdFromPayload(payload) {
  const goodsInfo = getVirtualPayGoodsInfo(payload);
  return String(payload.ProductId || payload.productId || payload.product_id || goodsInfo.ProductId || goodsInfo.productId || goodsInfo.product_id || '');
}

function getVirtualPayPriceFromPayload(payload) {
  const goodsInfo = getVirtualPayGoodsInfo(payload);
  const value = payload.GoodsPrice || payload.goodsPrice || payload.goods_price || goodsInfo.GoodsPrice || goodsInfo.goodsPrice || goodsInfo.OrigPrice || goodsInfo.origPrice || goodsInfo.orig_price;
  return value === undefined || value === '' ? null : Number(value);
}

function assertVirtualPayDeliveryMatchesOrder(payload, order) {
  const env = getVirtualPayEnv(payload);
  if (env !== null && env !== virtualPayConfig.env) {
    throw new Error(`虚拟支付环境不匹配: ${env}`);
  }
  const productId = getVirtualPayProductIdFromPayload(payload);
  const expectedProductId = getVirtualPayProductId(order.plan_code);
  if (productId && expectedProductId && productId !== expectedProductId) {
    throw new Error(`虚拟支付商品不匹配: ${productId}`);
  }
  const price = getVirtualPayPriceFromPayload(payload);
  if (price !== null && price !== yuanToFen(order.amount)) {
    throw new Error(`虚拟支付金额不匹配: ${price}`);
  }
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

async function virtualOrderHandler(req, res) {
  const planCode = req.body && req.body.plan_code;
  if (!planCode) {
    res.status(400).json({ success: false, message: '请选择套餐' });
    return;
  }
  if (!isVirtualPayConfigured(planCode)) {
    res.status(503).json(virtualPayConfigError(planCode));
    return;
  }

  const [plans] = await pool.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    res.status(400).json({ success: false, message: '套餐不存在' });
    return;
  }
  const [users] = await pool.execute('SELECT session_key FROM users WHERE id = ? LIMIT 1', [req.user.userId]);
  const sessionKey = users[0] && users[0].session_key;
  if (!sessionKey) {
    res.status(401).json({ success: false, code: 'WECHAT_SESSION_REQUIRED', message: '请重新进入小程序后再发起支付' });
    return;
  }

  const plan = plans[0];
  const orderNo = buildVirtualPayOutTradeNo();
  const signPayload = {
    offerId: virtualPayConfig.offerId,
    buyQuantity: 1,
    env: virtualPayConfig.env,
    currencyType: 'CNY',
    productId: getVirtualPayProductId(planCode),
    goodsPrice: yuanToFen(plan.price_yuan),
    outTradeNo: orderNo,
    attach: orderNo
  };
  const signData = JSON.stringify(signPayload);
  const paySig = hmacSha256Hex(getVirtualPayAppKey(), `requestVirtualPayment&${signData}`);
  const signature = hmacSha256Hex(sessionKey, signData);

  await pool.execute(
    'INSERT INTO payment_orders (user_id, plan_code, order_no, amount, status, auto_renew) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.userId, planCode, orderNo, Number(plan.price_yuan || 0), 'pending', req.body.auto_renew === false ? 0 : 1]
  );

  res.json({
    success: true,
    data: {
      success: true,
      order_no: orderNo,
      amount: Number(plan.price_yuan || 0),
      plan_name: plan.name,
      mode: virtualPayConfig.mode,
      signData,
      paySig,
      signature
    }
  });
}

async function wechatMessagePushHandler(req, res) {
  if (!verifyWechatMessagePushSignature(req.query || {})) {
    res.status(403).send('signature invalid');
    return;
  }
  if (req.method === 'GET') {
    res.type('text/plain').send(String((req.query && req.query.echostr) || ''));
    return;
  }

  const payload = parseWechatMessagePayload(req);
  const eventName = payload.Event || payload.event || '';
  if (eventName === 'xpay_goods_deliver_notify') {
    await handleVirtualPayGoodsDeliver(payload);
  }
  res.type('text/plain').send('success');
}

async function handleVirtualPayGoodsDeliver(payload) {
  const orderNo = getVirtualPayOrderNo(payload);
  if (!orderNo) {
    throw new Error('虚拟支付发货通知缺少订单号');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.execute('SELECT * FROM payment_orders WHERE order_no = ? FOR UPDATE', [orderNo]);
    if (!orders.length) {
      await connection.rollback();
      throw new Error(`虚拟支付订单不存在: ${orderNo}`);
    }
    const order = orders[0];
    assertVirtualPayDeliveryMatchesOrder(payload, order);
    if (order.status !== 'paid') {
      await connection.execute(
        'UPDATE payment_orders SET status = ?, wx_transaction_id = COALESCE(NULLIF(?, \'\'), wx_transaction_id), paid_at = NOW() WHERE order_no = ?',
        ['paid', getVirtualPayTransactionId(payload), orderNo]
      );
      await activateSubscription(connection, order.user_id, order.plan_code, orderNo, order.auto_renew === 1, 'wx_virtual_pay');
    }
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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
  if (req.body.resource && !(await verifyWechatNotifySignature(req.headers, req.rawBody || ''))) {
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
      await activateSubscription(connection, order.user_id, order.plan_code, orderNo, order.auto_renew === 1, 'wxpay');
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

async function activateSubscription(connection, userId, planCode, orderNo, autoRenew, payMethod) {
  const [plans] = await connection.execute('SELECT * FROM plans WHERE code = ? AND is_active = 1', [planCode]);
  if (!plans.length) {
    throw new Error('套餐不存在');
  }
  const endDate = new Date(Date.now() + plans[0].duration_days * 86400000);
  await connection.execute(
    'INSERT INTO subscriptions (user_id, plan_code, status, start_date, end_date, auto_renew, pay_method, order_no) VALUES (?, ?, ?, NOW(), ?, ?, ?, ?)',
    [userId, planCode, 'active', endDate, autoRenew ? 1 : 0, payMethod || 'wxpay', orderNo]
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

function decryptWechatPlatformCertificate(resource) {
  if (!resource || resource.algorithm !== 'AEAD_AES_256_GCM') {
    throw new Error('不支持的微信支付平台证书加密算法');
  }
  const ciphertext = Buffer.from(resource.ciphertext, 'base64');
  const authTag = ciphertext.subarray(ciphertext.length - 16);
  const encryptedData = ciphertext.subarray(0, ciphertext.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', wxPayConfig.apiKey, resource.nonce);
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString('utf8');
}

async function loadWechatPlatformCertificates(forceRefresh) {
  const cacheTtlMs = 6 * 60 * 60 * 1000;
  if (!forceRefresh && wechatPlatformCertificateCache.certificates.length && Date.now() - wechatPlatformCertificateCache.loadedAt < cacheTtlMs) {
    return wechatPlatformCertificateCache.certificates;
  }

  if (wxPayConfig.platformCertPath) {
    wechatPlatformCertificateCache = {
      loadedAt: Date.now(),
      certificates: [{ serial_no: '', content: fs.readFileSync(wxPayConfig.platformCertPath, 'utf8') }]
    };
    return wechatPlatformCertificateCache.certificates;
  }

  const response = await requestWechatPay('GET', '/v3/certificates');
  const certificates = Array.isArray(response && response.data)
    ? response.data.map((item) => ({
      serial_no: item.serial_no || '',
      effective_time: item.effective_time || '',
      expire_time: item.expire_time || '',
      content: decryptWechatPlatformCertificate(item.encrypt_certificate)
    })).filter((item) => item.content)
    : [];

  if (!certificates.length) {
    throw new Error('未获取到微信支付平台证书');
  }

  wechatPlatformCertificateCache = {
    loadedAt: Date.now(),
    certificates
  };
  return certificates;
}

async function verifyWechatNotifySignature(headers, rawBody) {
  const signature = headers['wechatpay-signature'];
  const timestamp = headers['wechatpay-timestamp'];
  const nonce = headers['wechatpay-nonce'];
  const serial = headers['wechatpay-serial'] || '';
  if (!signature || !timestamp || !nonce || !rawBody) {
    return false;
  }

  const message = `${timestamp}\n${nonce}\n${rawBody}\n`;
  const certificates = await loadWechatPlatformCertificates(false);
  const preferred = serial ? certificates.find((item) => item.serial_no === serial) : certificates[0];
  const candidates = preferred ? [preferred].concat(certificates.filter((item) => item !== preferred)) : certificates;

  for (const certificate of candidates) {
    if (crypto.createVerify('RSA-SHA256').update(message).verify(certificate.content, signature, 'base64')) {
      return true;
    }
  }

  if (!wxPayConfig.platformCertPath) {
    const refreshed = await loadWechatPlatformCertificates(true);
    for (const certificate of refreshed) {
      if (crypto.createVerify('RSA-SHA256').update(message).verify(certificate.content, signature, 'base64')) {
        return true;
      }
    }
  }

  return false;
}

async function bootstrap() {
  try {
    await ensureProductionTables();
    await ensureAdminBootstrapUser();
  } catch (err) {
    console.error('[niuniu-backend] MySQL init skipped (DB not available):', err.message);
  }
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
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      openid VARCHAR(128) NOT NULL UNIQUE,
      nickname VARCHAR(255),
      avatar_url TEXT,
      session_key VARCHAR(255) DEFAULT NULL,
      session_key_updated_at DATETIME NULL,
      phone_number VARCHAR(32) DEFAULT NULL,
      phone_bound_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumnExists('users', 'session_key', 'VARCHAR(255) DEFAULT NULL');
  await ensureColumnExists('users', 'session_key_updated_at', 'DATETIME NULL');
  await ensureColumnExists('users', 'phone_number', 'VARCHAR(32) DEFAULT NULL');
  await ensureColumnExists('users', 'phone_bound_at', 'DATETIME NULL');
  await ensureIndexExists('users', 'uniq_users_phone_number', 'UNIQUE KEY uniq_users_phone_number (phone_number)');
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
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
      is_active = VALUES(is_active)
  `);
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    INSERT INTO promo_batches (batch_code, description, duration_days, total_count, valid_from, valid_to, is_active) VALUES
      ('LEGACY_2025', '老用户免费3个月', 90, 999999, '2025-01-01', '2025-12-31', 1)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      duration_days = VALUES(duration_days),
      total_count = VALUES(total_count),
      valid_from = VALUES(valid_from),
      valid_to = VALUES(valid_to),
      is_active = VALUES(is_active)
  `);
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
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
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_tips (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT '',
      content_type VARCHAR(20) DEFAULT '',
      concise_domain VARCHAR(30) DEFAULT '',
      age_group VARCHAR(20) DEFAULT '',
      scene_tags JSON DEFAULT NULL,
      source_article_id INT DEFAULT NULL,
      source_article_title VARCHAR(200) DEFAULT '',
      source_author VARCHAR(100) DEFAULT '',
      evidence_level VARCHAR(20) DEFAULT 'expert',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pt_category (category),
      INDEX idx_pt_content_type (content_type),
      INDEX idx_pt_concise_domain (concise_domain),
      INDEX idx_pt_age_group (age_group),
      INDEX idx_pt_source_article (source_article_id),
      FULLTEXT KEY ft_pt_content (title, content)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await ensureColumnExists('parenting_tips', 'display_title', 'VARCHAR(200) DEFAULT NULL');
  await ensureColumnExists('parenting_tips', 'display_text', 'VARCHAR(400) DEFAULT NULL');
  await ensureColumnExists('parenting_tips', 'display_type', "VARCHAR(20) NOT NULL DEFAULT 'raw'");
  await ensureColumnExists('parenting_tips', 'display_source_type', 'VARCHAR(20) DEFAULT NULL');
  await ensureColumnExists('parenting_tips', 'display_source_id', 'INT DEFAULT NULL');
  await ensureColumnExists('parenting_tips', 'display_priority', 'INT NOT NULL DEFAULT 0');
  await ensureIndexExists('parenting_tips', 'idx_pt_display_type', 'INDEX idx_pt_display_type (is_active, display_type)');
  await ensureColumnExists('articles', 'content_form', 'VARCHAR(10) DEFAULT NULL');
  await ensureIndexExists('articles', 'idx_articles_content_form', 'INDEX idx_articles_content_form (is_published, content_form)');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      type VARCHAR(50) DEFAULT '其他',
      content TEXT NOT NULL,
      contact VARCHAR(200) DEFAULT '',
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_fb_user (user_id),
      INDEX idx_fb_status (status),
      INDEX idx_fb_created (created_at)
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

  function buildAssessmentInterpretationSeeds() {
    const L = { i: [0, 39], a: [40, 54], m: [55, 69], g: [70, 84], e: [85, 100] };
    const seeds = {
      sensory: {
        dimension: '感觉统合',
        rows: [
          [L.i[0], L.i[1], 'intervention', '感觉统合能力需要系统支持，当前多个感觉通道的整合效率偏低。', '对日常声音、触觉或运动刺激反应较强或回避明显，动作协调性不足。', '每天安排15分钟的感觉统合游戏，从触觉和本体感优先入手，再逐步扩展到前庭刺激。', '连续四周后，对日常感觉刺激的反应趋于平稳，动作流畅度提升。'],
          [L.a[0], L.a[1], 'attention', '感觉统合处于发展中，部分感觉通道需要更多关注。', '在某些场景下容易分心或过度兴奋，运动时偶尔显得笨拙。', '固定每天两个感觉统合活动时段，先从孩子接受度高的触觉游戏开始。', '四周到六周后，对多种感觉刺激的适应度提高，动作协调性改善。'],
          [L.m[0], L.m[1], 'medium', '感觉统合基本正常，大部分感觉通道整合良好。', '日常活动中能较好地处理多种感觉信息，偶尔在复杂环境下表现出轻微不适。', '保持每日充足户外活动时间，适当增加攀爬、平衡类游戏。', '维持现有活动量，逐步丰富感觉体验的多样性。'],
          [L.g[0], L.g[1], 'good', '感觉统合发展良好，感觉信息处理效率较高。', '在多种环境下能灵活调整身体反应，运动协调性和空间感知能力都不错。', '继续丰富感觉体验，可尝试更复杂的运动项目如球类、游泳。', '保持良好状态，定期提供新的感觉挑战。'],
          [L.e[0], L.e[1], 'excellent', '感觉统合能力优秀，感觉处理和动作协调都非常出色。', '在各种环境中表现自如，动作流畅且富有节奏感。', '可尝试竞技类或技巧类运动项目，进一步挖掘运动潜能。', '继续保持多样化运动体验。']
        ]
      },
      focus: {
        dimension: '集中注意',
        rows: [
          [L.i[0], L.i[1], 'intervention', '专注维持时间较短，容易受环境干扰影响。', '经常东张西望，任务启动后容易离开，难以在单一任务上停留超过几分钟。', '先优化环境减少视觉听觉干扰，再把任务拆成5分钟小段，每段完成后立刻给积极反馈。', '连续两周后，开始出现更稳定的专注时段，每次可延长至8-10分钟。'],
          [L.a[0], L.a[1], 'attention', '专注表现处于发展中，部分场景需要更多支持。', '熟悉任务时较稳定，陌生任务时容易退缩，注意力容易被新鲜事物吸引。', '从孩子熟悉和喜欢的任务开始，逐步增加挑战和时长，中间穿插短暂休息。', '四周内可看到持续专注时间提升，任务切换更流畅。'],
          [L.m[0], L.m[1], 'medium', '专注能力基本达标，多数场景下能维持合理注意时长。', '感兴趣的任务专注较好，重复性任务偶尔走神，能在提醒后回到任务。', '用定时器和任务清单帮助孩子自我监控，逐步减少外部提醒频率。', '六周后自我管理能力提升，外部提醒需求减少。'],
          [L.g[0], L.g[1], 'good', '专注表现整体稳定，能自主管理注意力。', '大部分任务能从头到尾完成，走神后能自行拉回，不需要频繁提醒。', '继续保持高质量阅读和安静环境，可尝试需要更长专注的深度任务。', '稳定巩固现有专注能力，挑战更复杂的持续性任务。'],
          [L.e[0], L.e[1], 'excellent', '专注力出色，能长时间沉浸于复杂任务。', '自控力强，能在有干扰的环境中保持专注，任务完成质量高。', '可安排需要深度思考和创造性的长期项目，进一步发挥专注优势。', '持续提供有深度和挑战性的任务环境。']
        ]
      },
      adhd: {
        dimension: 'ADHD风险',
        rows: [
          [L.i[0], L.i[1], 'intervention', '行为表现中有较多与注意力缺陷和多动冲动相关的信号，建议寻求专业评估。', '坐不住、话多、打断他人、难以等待、做事冲动不计后果。', '优先建立清晰的家庭规则和每日结构化流程，固定起床、用餐、作业、玩耍时间。', '结构化环境和明确规则能在两周内看到行为稳定性的改善，但建议同步专业评估。'],
          [L.a[0], L.a[1], 'attention', '观察到一些与注意力和冲动控制相关的表现，值得持续关注。', '部分场景下表现出冲动或多动的倾向，但并非持续出现。', '从最影响日常的1-2个场景开始干预，使用行为强化和及时反馈策略。', '四周后核心场景的行为频率下降，孩子对规则的理解更清晰。'],
          [L.m[0], L.m[1], 'medium', '注意力和冲动控制在正常范围内，个别场景偶有波动。', '大部分时间能遵守规则和等待，在疲劳或兴奋时可能出现轻微冲动行为。', '继续保持结构化节奏，关注睡眠和运动量对行为的影响。', '保持现有家庭管理策略，定期复评观察趋势。'],
          [L.g[0], L.g[1], 'good', '注意力和行为控制良好，ADHD相关表现不明显。', '能较好地遵守规则、等待轮替和完成多步骤指令。', '继续维持结构化环境和规律作息，丰富运动和户外活动。', '长期保持稳定的行为模式。'],
          [L.e[0], L.e[1], 'excellent', '执行功能和自我调控能力优秀。', '计划性、组织性和持续注意力都表现出色。', '可引导孩子参与需要长期规划和自我管理的项目。', '持续发展执行功能相关能力。']
        ]
      },
      multi_intelligence: {
        dimension: '多元智能',
        rows: [
          [L.i[0], L.i[1], 'intervention', '在多个智能领域表现偏低，可能需要更丰富的刺激和探索机会。', '对各类活动的参与度和表现都不太突出，缺乏明显的兴趣倾向。', '从最容易获得积极体验的领域开始，每天安排不同类型的探索活动。', '四周内可发现孩子在某些领域的兴趣增长和参与度提升。'],
          [L.a[0], L.a[1], 'attention', '部分智能领域有待发展，整体表现尚可。', '在某些类型的活动中表现出兴趣但缺乏持续性，优势领域尚不清晰。', '轮换安排不同智能领域的活动，重点观察孩子在哪些领域自然投入时间更长。', '六周内可识别出2-3个有发展潜力的优势领域。'],
          [L.m[0], L.m[1], 'medium', '多元智能发展均衡，已有初步优势倾向。', '在不同类型的任务中都能参与，部分领域表现出稳定的兴趣和能力。', '在保持均衡的基础上，对表现出兴趣的领域适当增加投入时间。', '逐步形成1-2个明显的优势智能领域。'],
          [L.g[0], L.g[1], 'good', '智能发展态势良好，优势领域突出。', '在多个智能领域有稳定表现，1-2个领域明显领先同龄水平。', '深度发展优势领域的同时，保持其他领域的基本刺激。', '优势领域持续深化，带动其他领域协同发展。'],
          [L.e[0], L.e[1], 'excellent', '多元智能全面发展，多个领域表现优异。', '语言、逻辑、空间、运动、音乐等多个领域都表现出色。', '提供更丰富的深度资源和专业指导，支持多领域持续发展。', '保持多领域高水平发展态势。']
        ]
      },
      emotion: {
        dimension: '情绪识别',
        rows: [
          [L.i[0], L.i[1], 'intervention', '情绪识别和表达能力需要更多家庭支持。', '情绪来时更容易用哭闹或行为代替语言表达，难以准确说出自己的感受。', '每天用情绪命名和共情短句帮孩子识别感受，先从开心、难过、生气三个基本情绪开始。', '两到四周内孩子能用简单词汇描述自己的情绪状态。'],
          [L.a[0], L.a[1], 'attention', '情绪表达正在发展中，需要更多引导和示范。', '能说出基本情绪但不够准确，在强烈情绪下仍然容易失控。', '用绘本和角色扮演帮孩子扩展情绪词汇，每天固定一个情绪分享时间。', '四周后情绪词汇量增加，在低强度情绪下能主动表达。'],
          [L.m[0], L.m[1], 'medium', '情绪识别和表达能力基本达标。', '多数情况下能用语言表达感受，在受挫时仍可能出现短暂的情绪爆发。', '帮孩子建立情绪调节三步法：停一停、想一想、说出来，每天练习一次。', '情绪调节策略内化后，爆发频率和强度都会下降。'],
          [L.g[0], L.g[1], 'good', '情绪能力发展良好，表达和管理都比较成熟。', '能准确识别和表达多种情绪，也能理解他人的情绪状态。', '引导孩子用写日记或画画的方式整理复杂情绪，培养更深层的情绪觉察。', '情绪管理能力持续提升，同伴关系更加和谐。'],
          [L.e[0], L.e[1], 'excellent', '情绪智力出色，共情能力和自我调节都很强。', '善于体察他人情绪，能主动调节自己情绪并为他人提供支持。', '可尝试担任班级或小组中的情绪支持角色，进一步发挥情绪优势。', '持续发展情绪领导力和共情能力。']
        ]
      },
      learning: {
        dimension: '学习适应',
        rows: [
          [L.i[0], L.i[1], 'intervention', '学习准备和任务坚持需要重点支持。', '开始慢、拖延多、完成度波动大，对学习任务有明显的回避倾向。', '用固定流程和明确开始动作帮助启动，把任务切成最小可完成单元。', '逐步建立稳定的学习节奏，四周内可见启动时间缩短。'],
          [L.a[0], L.a[1], 'attention', '学习适应处于发展中，部分环节需要支持。', '启动困难但进入后能维持，任务完成质量不够稳定。', '在学习前设置5分钟过渡活动帮大脑切换状态，使用番茄钟分段完成任务。', '六周后学习启动更顺畅，任务完成度趋于稳定。'],
          [L.m[0], L.m[1], 'medium', '学习适应性基本良好，能独立完成多数任务。', '基本能自主开始学习，但遇到困难时可能需要提醒和鼓励。', '帮孩子建立错题整理和复习的习惯，逐步培养独立解决问题的能力。', '两个月后独立学习能力和自信心都有提升。'],
          [L.g[0], L.g[1], 'good', '学习适应能力强，主动性和坚持性都不错。', '能主动规划和完成学习任务，遇到困难会尝试自己解决。', '引入自主学习管理工具，如周计划表和目标追踪表。', '深化自主学习能力，为更高年级的学习做准备。'],
          [L.e[0], L.e[1], 'excellent', '学习习惯和能力都非常出色。', '自主性强，善于时间管理和目标设定，学习效率高。', '可尝试探究式学习和跨学科项目，进一步拓展学习深度。', '保持优秀的学习品质和习惯。']
        ]
      },
      gross_motor: {
        dimension: '大运动发育',
        rows: [
          [L.i[0], L.i[1], 'intervention', '大运动发育需要重点关注，当前多个里程碑存在明显延迟。', '与同月龄相比，抬头、翻身、坐、爬、站、走等关键动作出现较晚或质量偏低。', '每天安排2-3次5-10分钟的地面活动时间，从当前已掌握的姿势开始逐步推进。', '建议同步进行儿童保健科发育评估，排除器质性因素。'],
          [L.a[0], L.a[1], 'attention', '大运动发育处于追赶期，部分里程碑需要更多练习机会。', '核心动作已出现但不够流畅，切换姿势时需要较多努力。', '增加每日趴玩和地面自由活动时间，减少抱着或限制在设备里的时长。', '连续观察4周，大部分动作质量和频率会有明显提升。'],
          [L.m[0], L.m[1], 'medium', '大运动发育基本符合月龄规律。', '核心里程碑在正常范围内达成，部分高阶动作还需练习。', '保持每天充足的地面活动时间，提供安全的探索空间和适龄的运动玩具。', '持续观察并按月龄调整活动难度。'],
          [L.g[0], L.g[1], 'good', '大运动发育良好，动作协调性和力量都不错。', '在大多数运动项目中表现积极，动作完成质量较高。', '适当增加难度（如不同地面、斜坡、障碍），丰富运动体验。', '保持积极运动习惯，为上幼儿园做准备。'],
          [L.e[0], L.e[1], 'excellent', '大运动发育优秀，运动能力和协调性超出同龄水平。', '动作敏捷、协调性好，敢于尝试新的运动挑战。', '提供丰富的户外探索和适龄的运动器械，鼓励自由探索。', '持续发展运动潜能。']
        ]
      },
      fine_motor: {
        dimension: '精细动作',
        rows: [
          [L.i[0], L.i[1], 'intervention', '精细动作发育需要重点关注，手部操作能力明显低于月龄预期。', '抓握力量弱、指尖操作困难、双手配合不协调，影响自主进食和操作玩具。', '每天安排触觉和抓握练习，从大物件逐步过渡到小物件，先保证成功体验再增加难度。', '建议结合儿童保健科评估，排除肌张力或感觉处理异常。'],
          [L.a[0], L.a[1], 'attention', '精细动作处于发展中，部分手部技能需要更多练习。', '大把抓握已建立，但指尖捏取和双手协调还不太熟练。', '多提供撕纸、捏豆子、串珠、搭积木等手部操作机会，每次5-10分钟。', '持续练习4-6周后，手部精细度和协调性会有明显进步。'],
          [L.m[0], L.m[1], 'medium', '精细动作发展基本符合月龄水平。', '大部分手部操作能完成，精细度和速度还有提升空间。', '保持每日手工游戏时间，逐步引入涂鸦、折纸、使用工具等更复杂的操作。', '按月龄调整活动材料的大小和复杂度。'],
          [L.g[0], L.g[1], 'good', '精细动作发展良好，手眼协调和指尖控制都在线。', '喜欢并擅长手工操作类活动，能够较长时间投入。', '引入更多创意手工项目（如粘贴画、穿珠子做项链），适当延长每次活动时间。', '保持每日手工时间，为上幼儿园的书写做准备。'],
          [L.e[0], L.e[1], 'excellent', '精细动作能力出色，手部操作精细度和速度超过同龄水平。', '握笔、用剪刀、搭积木、穿珠子等技能都能熟练完成。', '提供更复杂的构建类玩具和艺术材料，支持深度探索。', '继续保持手部活动的多样性和挑战性。']
        ]
      },
      language_dev: {
        dimension: '语言发育',
        rows: [
          [L.i[0], L.i[1], 'intervention', '语言发育需要重点关注，表达和理解均明显落后于月龄预期。', '发音少、词汇量极小、不理解简单指令、缺乏交流意图。', '每天保证至少30分钟的高质量面对面互动，用简单清晰的语言描述正在做的事。', '建议同步进行听力筛查和语言发育评估。'],
          [L.a[0], L.a[1], 'attention', '语言发育稍落后，需要更多语言输入和互动刺激。', '有交流意愿但表达有限，理解能力也偏弱。', '增加亲子共读时间，日常多进行命名和描述，给孩子充足的回应时间。', '连续4-8周密集互动后，词汇量和句式会有明显增加。'],
          [L.m[0], L.m[1], 'medium', '语言发展基本符合月龄水平。', '能表达基本需求，理解和表达能力在正常范围内。', '保持每天固定的亲子阅读时间，多进行开放式提问，鼓励孩子用句子回答。', '逐步扩展词汇量和句式复杂度。'],
          [L.g[0], L.g[1], 'good', '语言能力发展良好，表达和理解都比较好。', '词汇丰富、句式多样、能主动发起和维持对话。', '引入更多叙述和讨论类活动，鼓励孩子讲故事、描述经历。', '保持丰富的语言环境，逐步引入识字和书写前备技能。'],
          [L.e[0], L.e[1], 'excellent', '语言能力优秀，表达流畅丰富，理解力强。', '词汇量大、语言逻辑清晰、能进行较复杂的叙述和讨论。', '鼓励孩子讲故事、编故事、参与角色扮演，进一步丰富语言表达形式。', '可开始接触更复杂的语言活动如背诵、复述和简单辩论。']
        ]
      },
      social_emotion: {
        dimension: '社交情绪',
        rows: [
          [L.i[0], L.i[1], 'intervention', '社交情绪发展需要重点关注，互动和情绪调节存在明显困难。', '回避目光接触、对人不感兴趣、情绪反应极端或淡漠、难以被安抚。', '优先建立安全依恋关系，减少环境和照护者的频繁变动，确保回应的一致性和可预测性。', '建议进行社交沟通和情绪行为的专项评估。'],
          [L.a[0], L.a[1], 'attention', '社交情绪发展稍显滞后，需要更多积极的互动体验。', '对人有关注但互动质量不够高，情绪表达和调节能力偏弱。', '每天安排1-2段专属的一对一互动时间，跟随孩子的兴趣做互动，多回应积极情绪。', '连续4-6周后社交回应和情绪调节会有改善。'],
          [L.m[0], L.m[1], 'medium', '社交情绪发展基本符合月龄。', '能与人互动、表达基本情绪，在熟悉环境中情绪较稳定。', '创造与小同伴互动的机会，帮助孩子理解和表达更复杂的情绪。', '提供安全的社交环境，支持孩子逐渐扩展社交圈。'],
          [L.g[0], L.g[1], 'good', '社交情绪能力发展良好。', '喜欢与人互动、共情能力较好、在大多数社交场景中表现积极。', '提供更多样化的社交机会，引导孩子理解他人的观点和感受。', '保持积极的社交体验和情绪对话。'],
          [L.e[0], L.e[1], 'excellent', '社交情绪能力优秀，共情和社交技巧都很出色。', '主动交朋友、善于识别和回应他人的情绪、在群体中受欢迎。', '鼓励孩子在小组中承担一些小组长或帮助者的角色练习。', '持续发展社交领导力和情绪智慧。']
        ]
      }
    };

    const rows = [];
    Object.entries(seeds).forEach(([code, config]) => {
      config.rows.forEach(([scoreMin, scoreMax, level, interpretation, behavior, advice, goal]) => {
        rows.push([code, config.dimension, Number(scoreMin), Number(scoreMax), level, interpretation, behavior, advice, goal]);
      });
    });
    return rows;
  }

  function buildAssessmentSuggestionSeeds() {
    const seeds = {
      sensory: {
        dimension: '感觉统合',
        rows: [
          ['intervention', '触觉脱敏训练', '从孩子接受度最高的触觉材料开始，逐步降低敏感度。', '1.选三种不同质地的材料（毛巾、毛刷、抚触球）\n2.每次从最舒适的开始，轻触手臂\n3.如果抗拒就退回上一步\n4.逐步扩展到腿部和背部', '6周', '每天10分钟'],
          ['intervention', '前庭平衡游戏', '通过温和的摇摆和旋转刺激前庭系统。', '1.抱着孩子轻轻前后摇摆，唱儿歌\n2.坐摇摇马或荡秋千，从短时间开始\n3.玩小飞机游戏：家长躺下用腿托起孩子\n4.每次不超过孩子舒适范围', '8周', '每天10-15分钟'],
          ['attention', '本体感强化活动', '通过推拉搬等重体力活动增强身体感知。', '1.玩推墙游戏，双手撑墙用力推\n2.搬运适重的物品（如装满书的书包）\n3.爬行游戏：熊爬、螃蟹爬\n4.蹦床或跳垫子', '4周', '每天15分钟'],
          ['attention', '多感官整合游戏', '同时调用两个以上感觉系统的活动。', '1.闭眼摸物猜名称\n2.边跳边拍手数数\n3.听指令做动作（如摸头、转圈、蹲下）\n4.沙池或米盆中找小玩具', '4周', '每天10-15分钟'],
          ['medium', '运动协调提升', '增加复杂运动模式帮助感觉整合。', '1.单脚站立比赛，逐步延长时间\n2.走平衡木或画线走\n3.拍球或接抛球练习\n4.攀爬架自由探索', '6周', '每周4-5次每次20分钟'],
          ['good', '感觉统合进阶挑战', '在现有良好基础上引入更复杂的感觉整合任务。', '1.尝试同时处理视觉和听觉信息的游戏\n2.参加球类或舞蹈类需要全身协调的活动\n3.在略微嘈杂的环境中完成精细任务\n4.户外自然探索：爬树、涉水、走不平路面', '持续', '每周2-3次每次30分钟'],
          ['excellent', '运动专项发展', '基于优秀的感觉统合基础发展专项运动能力。', '1.选择1-2项孩子有兴趣的运动项目深入学习\n2.参加竞技类或表演类活动提升表现力\n3.尝试需要高协调性的项目（游泳、武术、体操）\n4.定期参加团队运动发展协作能力', '持续', '每周3-5次']
        ]
      },
      focus: {
        dimension: '集中注意',
        rows: [
          ['intervention', '家庭专注环境优化', '减少干扰、拆小任务、建立稳定节奏。', '1.先清桌面只留当前任务物品\n2.设闹钟从5分钟开始做任务\n3.完成后立刻给具体表扬\n4.逐步延长到8分钟再休息', '2周', '每天2-3次'],
          ['intervention', '视觉追踪训练', '通过需要持续视觉注意的游戏提升专注时长。', '1.玩"找不同"或"视觉大发现"游戏\n2.迷宫和连线类游戏\n3.串珠子或拼图活动\n4.观察计时类游戏', '4周', '每天10分钟'],
          ['attention', '听觉专注训练', '锻炼在听觉干扰中维持注意的能力。', '1.听故事后回答3个简单问题\n2."西蒙说"听从指令游戏\n3.在轻背景音下完成安静任务\n4.听音辨物游戏', '4周', '每天10-15分钟'],
          ['attention', '任务拆分与自我监控', '教会孩子自己管理任务和时间。', '1.用图片制作任务步骤卡\n2.每完成一步翻一张卡\n3.用计时器自我监控\n4.完成后在记录表上打钩', '3周', '每天执行'],
          ['medium', '持续性任务挑战', '逐步提升单次专注时长和任务复杂度。', '1.从15分钟任务开始，每周增加2-3分钟\n2.引入需要多步骤完成的综合任务\n3.中间不打断，训练持续性\n4.完成后让孩子自己评价表现', '6周', '每天1-2次'],
          ['good', '深度专注力培养', '在兴趣领域培养沉浸式专注体验。', '1.每周安排1次40分钟以上不被打断的自由探索时间\n2.让孩子选择最感兴趣的活动\n3.活动结束后聊聊"忘记时间"的感觉\n4.逐步扩展到其他领域', '持续', '每周1-2次'],
          ['excellent', '创造性深度工作', '在出色专注力基础上发展创造性深度工作能力。', '1.每周安排2次以上90分钟不被打断的深度工作时间\n2.尝试需要持续专注的复杂项目（编程、写作、研究）\n3.学习心流状态的自我触发技巧\n4.在适度干扰的环境中练习专注保持', '持续', '每周2-3次']
        ]
      },
      adhd: {
        dimension: 'ADHD风险',
        rows: [
          ['intervention', '结构化日程建立', '用可视化的每日流程帮助孩子建立规则感。', '1.制作图文并茂的每日流程表\n2.固定起床、用餐、作业、运动、睡觉时间\n3.每个环节过渡前给5分钟预告\n4.用代币或贴纸强化遵守流程的行为', '2周', '每天执行'],
          ['intervention', '冲动控制训练', '通过游戏化的等待练习提升自我控制。', '1.玩"一二三木头人"或"红灯绿灯"游戏\n2.轮流等待游戏（如棋盘游戏学等待）\n3."先想再说"练习：听问题后数5秒再回答\n4.延迟满足小练习（如等5分钟再吃零食）', '4周', '每天10-15分钟'],
          ['attention', '行为契约与反馈系统', '建立明确的行为期待和即时反馈机制。', '1.和孩子一起制定3条核心行为规则\n2.每条规则配具体例子和图示范例\n3.遵守规则立刻给积极反馈\n4.每周回顾调整规则', '4周', '每天执行'],
          ['attention', '运动-专注联动', '利用高强度运动后的平静窗口完成需要专注的任务。', '1.每天安排20分钟中高强度运动\n2.运动后5分钟内开始安静任务\n3.观察运动类型与后续专注的关系\n4.找到最适合的运动-任务节奏', '3周', '每天执行'],
          ['medium', '执行功能强化', '系统性训练计划、组织和时间管理能力。', '1.用清单和计时器管理每日任务\n2.教孩子预估任务耗时并与实际对比\n3.整理物品归位训练\n4.周计划制定与回顾', '6周', '每天执行'],
          ['good', '自主管理能力提升', '在现有自控基础上进一步减少外部依赖。', '1.逐步减少外部提醒，让孩子自己追踪任务\n2.引入自我评价机制，事后回顾表现\n3.尝试需要2-3天持续努力的稍长项目\n4.在自然社交场景中练习等待和轮替', '持续', '每天自然融入'],
          ['excellent', '领导力与项目规划', '利用优秀的执行功能发展更高阶的组织能力。', '1.引导孩子策划并执行一个完整的小项目\n2.担任小组活动或班级中的组织角色\n3.尝试学习编程或棋类等需要深度规划的活动\n4.定期参与志愿服务锻炼责任感和持续承诺', '持续', '每周2-3次']
        ]
      },
      multi_intelligence: {
        dimension: '多元智能',
        rows: [
          ['intervention', '智能探索启动计划', '系统性地为孩子提供多领域的探索机会。', '1.每周安排不同类型的探索活动（语言、逻辑、运动、艺术、音乐、自然）\n2.每次活动后记录孩子的参与度和表现\n3.重点关注孩子自然投入时间更长的领域\n4.两周后总结并调整活动方向', '4周', '每周3-4次不同类型活动'],
          ['attention', '优势领域深度探索', '基于观察结果，对潜在优势领域进行深度开发。', '1.从已识别的2-3个兴趣领域中各选一项深度活动\n2.每周每个领域至少投入2次\n3.提供该领域的进阶资源和工具\n4.记录进步和兴趣变化', '6周', '每周每个领域2次'],
          ['medium', '跨领域能力迁移', '将优势领域的成功经验应用到其他领域。', '1.分析孩子擅长领域的学习方式和特点\n2.设计跨领域类比活动\n3.利用优势领域的成就感驱动劣势领域的参与\n4.保持均衡刺激', '8周', '每周2-3次'],
          ['good', '优势领域深度学习', '在已建立的优势基础上系统化深入发展。', '1.为每个优势领域设定季度发展目标\n2.引入该领域的专业资源或课程\n3.定期参加展示、比赛或分享活动\n4.建立作品集或成长档案记录进步', '持续', '每周每个优势领域2-3次'],
          ['excellent', '跨学科创新项目', '融合多个优势领域开展创造性综合项目。', '1.设计一个同时用到2-3个优势智能的项目\n2.鼓励孩子自己选题、规划、执行、展示\n3.引入导师或同伴协作提升项目深度\n4.参与科技创新、艺术展演等校外平台', '持续', '每周3-4次']
        ]
      },
      emotion: {
        dimension: '情绪识别',
        rows: [
          ['intervention', '情绪命名基础训练', '帮孩子建立基本的情绪词汇和理解。', '1.制作情绪卡片：开心、难过、生气、害怕、惊讶\n2.每天读绘本时指认角色的情绪\n3.在孩子有情绪时帮他说出来\n4.睡前聊"今天最开心和最不开心的事"', '3周', '每天5-10分钟'],
          ['intervention', '共情示范练习', '家长通过日常示范教会孩子理解和回应他人情绪。', '1.家长主动表达自己的情绪感受\n2.观察他人情绪并猜测原因\n3.角色扮演不同情绪场景\n4.讨论"如果别人...你会怎么想"', '4周', '每天日常融入'],
          ['attention', '情绪调节策略学习', '教孩子用具体方法管理强烈情绪。', '1.制作"冷静工具箱"（深呼吸卡片、捏压力球、画画、听音乐）\n2.情绪上来时先用"停一停"策略\n3.选一个冷静工具用\n4.冷静后再讨论发生了什么事', '4周', '每次情绪事件后执行'],
          ['attention', '情绪日记', '通过记录帮助孩子觉察情绪模式和触发点。', '1.每天固定时间回顾当天情绪事件\n2.用颜色或表情贴纸记录情绪强度\n3.找找情绪变化的规律\n4.讨论下一次可以怎么做得不一样', '6周', '每天5分钟'],
          ['medium', '社交情绪技能进阶', '在同伴互动中锻炼情绪理解和表达能力。', '1.安排小范围同伴游戏，观察情绪互动\n2.事后复盘：朋友什么感受？你怎么知道的？\n3.练习道歉、安慰、分享喜悦的表达\n4.阅读以情绪为主题的长篇故事', '6周', '每周2-3次社交机会'],
          ['good', '情绪领导力培养', '发展更深层的情绪智慧和对他人的积极影响。', '1.引导孩子在家庭中担任"情绪观察员"\n2.教孩子如何支持情绪低落的同伴\n3.讨论复杂情绪（如又开心又难过）\n4.鼓励孩子用创作表达深层情感', '持续', '日常融入'],
          ['excellent', '情绪智慧社会实践', '将情绪优势扩展到更广泛的社会场景中。', '1.参与同伴调解或班级氛围建设活动\n2.学习非暴力沟通等进阶情绪对话技巧\n3.以情绪主题进行演讲、写作或艺术创作\n4.在志愿服务中运用共情能力帮助他人', '持续', '每周2-3次']
        ]
      },
      learning: {
        dimension: '学习适应',
        rows: [
          ['intervention', '任务启动支持', '用固定流程帮助孩子克服启动困难。', '1.开始前3分钟预告："再过3分钟我们要开始做XX了"\n2.第一步只要求坐到桌前\n3.第二步把任务写在纸上，从最简单的开始\n4.完成第一步后立刻表扬', '4周', '每天每次学习前执行'],
          ['intervention', '任务量渐进法', '从极小任务量开始逐步增加，建立完成感。', '1.第一天只做1道题就结束，并大力表扬\n2.每两天增加1道题\n3.保持轻松愉快的结束体验\n4.不因做得好而临时加量', '4周', '每天'],
          ['attention', '番茄钟分段学习法', '用短时间段降低心理负担，提高任务完成率。', '1.用计时器设15分钟一个番茄钟\n2.明确这一个番茄钟要完成的具体任务\n3.响铃后必须休息5分钟\n4.完成3个番茄钟后大休息', '3周', '每天学习时段使用'],
          ['attention', '错题正面管理', '把错题从"失败"变为"学习机会"。', '1.准备一本专门的"学习发现本"\n2.每道错题旁边写：我学到了什么\n3.每周回顾发现本里的进步\n4.用不同颜色标记"已掌握"的错题', '持续', '每次作业后'],
          ['medium', '自主学习管理', '培养孩子独立规划和管理学习的能力。', '1.每周日和孩子一起做周学习计划\n2.让孩子自己预估每项任务的时长\n3.用完成清单自主追踪\n4.周末回顾计划和实际的差异', '8周', '每周日做计划'],
          ['good', '深度学习与元认知', '培养学习策略意识和自我反思能力。', '1.学习后讨论：我是怎么学会的？\n2.比较不同学习方法的效率\n3.尝试用自己的话教别人\n4.建立个人的"最佳学习方式清单"', '持续', '每周1-2次复盘'],
          ['excellent', '学术探究与创新', '在扎实的学习能力基础上进行学术性深度探索。', '1.选择一个感兴趣的学科领域做专题研究\n2.学习论文写作或学术展示的基本方法\n3.参加学科竞赛或科技创新活动\n4.建立个人知识管理系统，培养终身学习习惯', '持续', '每周3-4次']
        ]
      },
      gross_motor: {
        dimension: '大运动发育',
        rows: [
          ['intervention', '趴玩时间增加', '从孩子当前能接受的趴姿时间开始逐步延长。', '1.每次趴玩从30秒起，每天累计至少30分钟\n2.在孩子前方放有趣的玩具吸引抬头\n3.家长趴在对面做表情和声音互动\n4.在硬实的地垫上进行效果更好', '4周', '每天累计30分钟以上'],
          ['intervention', '被动运动与抚触', '通过轻柔的被动运动和抚触促进本体感觉发展。', '1.每天洗澡后做5分钟婴儿抚触\n2.轻轻活动四肢做关节被动运动\n3.抱着缓慢摇摆和旋转\n4.在不同质感的垫子上活动', '持续', '每天2-3次'],
          ['attention', '姿势转换练习', '重点练习当前卡住的姿势转换环节。', '1.确定孩子当前能完成的最高难度姿势\n2.在略低一级的姿势基础上练习向上一级转换\n3.每次练习不超过孩子疲劳点\n4.用玩具诱导主动移动而非被动摆放', '4周', '每天15-20分钟'],
          ['attention', '核心力量游戏', '通过趣味游戏增强躯干核心肌群。', '1.坐姿接球游戏（需有人在背后保护）\n2.趴在大球上前后左右轻轻滚动\n3.仰卧起坐式拉手坐起\n4.隧道爬行游戏', '6周', '每天10-15分钟'],
          ['medium', '户外大运动探索', '丰富户外运动体验促进协调和平衡。', '1.每周至少3次户外活动\n2.公园的滑梯、秋千、攀爬架轮流体验\n3.不同地面行走练习（草地、沙地、坡道）\n4.和小伙伴一起跑跳追逐', '持续', '每周3-5次每次30分钟']
        ]
      },
      fine_motor: {
        dimension: '精细动作',
        rows: [
          ['intervention', '感官触觉唤醒', '从基础的触觉和抓握练习开始。', '1.每天安排不同质感的触摸材料（布、毛刷、温水、米）\n2.从大而易抓的玩具开始（摇铃、软球）\n3.手把手辅助完成抓握动作\n4.鼓励用整只手探索和操作物体', '6周', '每天10分钟'],
          ['intervention', '手眼协调基础', '建立手-眼-物体的基本连接。', '1.悬挂可拍打的玩具让宝宝伸手触碰\n2.示范把玩具放进容器再倒出来\n3.玩拍手游戏和手指谣\n4.提供安全的敲打玩具', '4周', '每天5-10分钟'],
          ['attention', '指尖捏取训练', '重点发展拇指和食指的精确配合。', '1.提供小泡芙或安全的手指食物练习捏取\n2.玩按、抠、撕的游戏（如泡泡膜）\n3.大珠子串绳练习\n4.用粗蜡笔涂鸦', '4周', '每天10分钟'],
          ['attention', '生活自理练习', '在日常生活中有意识地锻炼手部操作。', '1.鼓励自己用手抓食物吃\n2.练习用敞口杯喝水\n3.尝试自己脱袜子脱鞋\n4.帮忙做简单的家务（撕菜叶、擦拭）', '持续', '日常融入'],
          ['medium', '建构和创意手工', '提升手部操作的复杂度和创造性。', '1.搭积木从2块逐步增加到6-8块\n2.简单的折纸和撕纸拼贴\n3.用橡皮泥做捏、搓、压等动作\n4.儿童安全剪刀剪纸条', '持续', '每周3-4次每次15-20分钟']
        ]
      },
      language_dev: {
        dimension: '语言发育',
        rows: [
          ['intervention', '面对面语言互动', '建立每日固定的高质量语言互动时间。', '1.每天至少30分钟面对面的专注互动\n2.用简单清晰的语言描述正在做的事\n3.模仿宝宝的发音并扩展成正确词汇\n4.减少背景噪音和屏幕时间', '8周', '每天累计30分钟以上'],
          ['intervention', '亲子共读启动', '从最简单的绘本开始建立阅读习惯。', '1.选择色彩鲜明、画面简单、材质安全的绘本\n2.每天固定时段共读5-10分钟\n3.指图命名、学动物叫、做动作互动\n4.同一本书反复读建立熟悉感', '持续', '每天5-10分钟'],
          ['attention', '词汇扩展输入', '有意识地增加词汇输入的量和质。', '1.外出时命名看到的物品、人和动作\n2.用形容词描述物品的属性（大、红、软）\n3.在日常对话中加入新词汇并重复使用\n4.唱儿歌和手指谣帮助记忆', '4周', '日常融入'],
          ['attention', '对话促进技巧', '用提问和等待帮助孩子从单词过渡到短句。', '1.给孩子至少5秒的回应等待时间\n2.在孩子说的单词基础上扩展成短句\n3.少问是不是，多问在哪里、是什么\n4.对孩子说的话表现出真实的兴趣和回应', '6周', '日常融入'],
          ['medium', '叙述和复述能力', '培养更长的语言表达和故事叙述能力。', '1.让孩子描述刚刚发生的事情\n2.一起看照片回忆并讲述经历\n3.讲一半故事让孩子猜结局\n4.玩角色扮演说不同的台词', '持续', '每天5-10分钟']
        ]
      },
      social_emotion: {
        dimension: '社交情绪',
        rows: [
          ['intervention', '安全依恋建立', '优先巩固照护者与孩子之间的安全感和信任。', '1.确保主要照护者稳定且回应一致\n2.每天至少30分钟一对一专注陪伴\n3.跟随孩子的兴趣不做主导\n4.多回应积极情绪减少过度纠正', '8周', '每天'],
          ['intervention', '基础社交回应训练', '通过模仿和轮流游戏建立社交互动的基础。', '1.面对面模仿孩子的发声和表情\n2.玩轮流游戏（如你推我接球）\n3.用夸张的表情和语调吸引注意\n4.每次互动结束时给孩子微笑和拥抱', '6周', '每天10-15分钟'],
          ['attention', '情绪命名与表达', '帮助孩子识别并用简单方式表达情绪。', '1.制作开心、难过、生气的表情卡片\n2.当孩子有情绪时帮他说出来\n3.读关于情绪的绘本并讨论\n4.用玩偶演示不同的情绪场景', '4周', '每天5-10分钟'],
          ['attention', '同伴社交入门', '创造安全的同伴互动环境。', '1.从1-2个熟悉的小朋友开始\n2.准备双份相同玩具减少争抢\n3.安排结构化的合作游戏\n4.事后简单回顾好的互动时刻', '6周', '每周2-3次'],
          ['medium', '共情能力培养', '引导孩子关注和理解他人的感受。', '1.读绘本时讨论角色的感受\n2.看到他人有情绪时帮孩子描述\n3.鼓励孩子说安慰别人的话\n4.玩角色互换的假装游戏', '6周', '每天日常融入']
        ]
      }
    };

    const rows = [];
    Object.entries(seeds).forEach(([code, config]) => {
      config.rows.forEach(([level, title, description, steps, duration, frequency]) => {
        rows.push([code, config.dimension, level, title, description, steps, duration, frequency]);
      });
    });
    return rows;
  }

  const [interpretationCountRows] = await pool.execute('SELECT COUNT(*) AS count FROM assessment_interpretations');
  const interpretationCount = Number(interpretationCountRows[0].count);
  if (interpretationCount < 10) {
    if (interpretationCount > 0) {
      await pool.execute('TRUNCATE TABLE assessment_interpretations');
    }
    const rows = buildAssessmentInterpretationSeeds();
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
  const suggestionCount = Number(suggestionCountRows[0].count);
  if (suggestionCount < 10) {
    if (suggestionCount > 0) {
      await pool.execute('TRUNCATE TABLE assessment_suggestions');
    }
    const rows = buildAssessmentSuggestionSeeds();
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
  const parsed = safeParseJson(value, null);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed !== null) {
    return [];
  }
  return String(value).split(/[、,，\s]+/).filter(Boolean);
}

function safeParseJson(value, fallbackValue) {
  if (value === undefined || value === null || value === '') {
    return fallbackValue;
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('JSON parse failed:', err && err.message ? err.message : err);
    return fallbackValue;
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

function isValidBoundedIntInput(rawValue, minValue, maxValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return true;
  }
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed)) {
    return false;
  }
  return parsed >= minValue && parsed <= maxValue;
}

function normalizeAggregateNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getUserId(req) {
  return req.user && req.user.userId;
}

async function getOwnedChild(userId, childId) {
  const [rows] = await pool.execute(`${buildChildSelectSql()} WHERE id = ? AND user_id = ? LIMIT 1`, [childId, userId]);
  return rows[0] || null;
}

async function getDefaultChildForUser(userId) {
  if (!userId) {
    return null;
  }
  const [rows] = await pool.execute(
    `${buildChildSelectSql()} WHERE user_id = ? ORDER BY is_default DESC, updated_at DESC, id DESC LIMIT 1`,
    [userId]
  );
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

function getRelativeWeekDate(baseWeekStart, offsetWeeks) {
  const date = new Date(`${baseWeekStart}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + (Number(offsetWeeks) || 0) * 7);
  return formatDateValue(date);
}

function getRecentDateValue(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - Number(daysAgo || 0));
  return formatDateValue(date);
}

function buildDefaultGrowthRecord(dateValue, childId) {
  return {
    id: null,
    childId: Number(childId || 0),
    recordDate: dateValue,
    moodStatus: 'steady',
    appetiteStatus: 'normal',
    sleepStatus: 'stable',
    exerciseStatus: 'enough',
    socialStatus: 'smooth',
    noteText: '',
    updatedAt: null
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
    morning_rush: { articleCategory: '行为习惯', articleKeyword: '习惯', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    kindergarten_separation_anxiety: { articleCategory: '情绪养育', articleKeyword: '分离', recipeKeyword: '早餐', subjectCode: 'expression_communication' },
    screen_time_boundary: { articleCategory: '行为习惯', articleKeyword: '屏幕', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    night_waking_repeat: { articleCategory: '睡眠管理', articleKeyword: '夜醒', recipeKeyword: '晚餐', subjectCode: 'learning_metacognition' },
    backtalk_defiance: { articleCategory: '情绪管理', articleKeyword: '顶嘴', recipeKeyword: '镁', subjectCode: 'expression_communication' },
    turn_taking_boundary: { articleCategory: '社交能力', articleKeyword: '分享', recipeKeyword: '能量', subjectCode: 'expression_communication' },
    sore_loser_meltdown: { articleCategory: '情绪管理', articleKeyword: '挫折', recipeKeyword: '镁', subjectCode: 'expression_communication' },
    peer_exclusion_support: { articleCategory: '社交能力', articleKeyword: '同伴', recipeKeyword: '能量', subjectCode: 'expression_communication' },
    reward_system_fatigue: { articleCategory: '纪律管理', articleKeyword: '奖励', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    repeated_rule_ignoring: { articleCategory: '行为习惯', articleKeyword: '规则', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    homework_start_resistance: { articleCategory: '认知发展', articleKeyword: '作业', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    task_freeze_at_first_question: { articleCategory: '认知发展', articleKeyword: '不会', recipeKeyword: '早餐', subjectCode: 'reading_comprehension' },
    prolonged_mealtime_delay: { articleCategory: '营养健康', articleKeyword: '吃饭', recipeKeyword: '补铁', subjectCode: 'learning_metacognition' },
    leave_table_after_two_bites: { articleCategory: '营养健康', articleKeyword: '进餐', recipeKeyword: '补铁', subjectCode: 'learning_metacognition' },
    fall_asleep_delay: { articleCategory: '睡眠管理', articleKeyword: '入睡', recipeKeyword: '晚餐', subjectCode: 'learning_metacognition' },
    rejected_request_meltdown: { articleCategory: '情绪管理', articleKeyword: '情绪', recipeKeyword: '镁', subjectCode: 'expression_communication' },
    chasing_feed_loop: { articleCategory: '营养健康', articleKeyword: '喂养', recipeKeyword: '补铁', subjectCode: 'learning_metacognition' },
    wakeup_activation_delay: { articleCategory: '行为习惯', articleKeyword: '起床', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    peer_join_hesitation: { articleCategory: '社交能力', articleKeyword: '同伴', recipeKeyword: '能量', subjectCode: 'expression_communication' },
    boundary_breaks_in_the_moment: { articleCategory: '纪律管理', articleKeyword: '规则', recipeKeyword: '早餐', subjectCode: 'learning_metacognition' },
    slow_emotional_recovery_after_no: { articleCategory: '情绪管理', articleKeyword: '失落', recipeKeyword: '镁', subjectCode: 'expression_communication' }
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

function getWeeklyAgeStageKey(ageGroup) {
  const value = String(ageGroup || '').trim();
  if (['0-6月', '6-12月', '0-1岁'].includes(value)) return '0-1岁';
  if (['1-1.5岁', '1.5-2岁', '1-2岁', '1-3岁'].includes(value)) return '1-2岁';
  if (['2-3岁'].includes(value)) return '2-3岁';
  if (['3-4岁', '4-5岁', '5-6岁', '3-6岁'].includes(value)) return '3-6岁';
  if (['6-7岁', '7-8岁', '8-12岁', '6-12岁', '9-12岁'].includes(value)) return '6-12岁';
  if (value === '12岁以上') return '12岁以上';
  return '3-6岁';
}

function getWeeklyDimensionAdvice(dimensionKey, ageStage) {
  const adviceMap = {
    moodStatus: {
      '1-3岁': {
        concern: '这阶段情绪波动是正常的探索行为，重点看情绪恢复速度和是否影响进食睡眠。',
        action: '每天固定1-2个安抚动作（抱抱、哼歌），让孩子在可预测的节奏里更容易平复。'
      },
      '3-6岁': {
        concern: '学龄前情绪更多和规则冲突、表达受限有关，先看触发模式再定干预优先级。',
        action: '每天留10分钟让孩子主导一段对话或游戏，情绪信号更容易被看见和安抚。'
      },
      '6-12岁': {
        concern: '学习日疲劳和同伴关系更容易引发情绪波动，关注作业后和睡前两个关键时段。',
        action: '帮孩子建立1-2个固定的情绪释放渠道，比如放学后15分钟自由时间或睡前聊聊。'
      },
      '12岁以上': {
        concern: '青少年情绪更多和独立空间、同伴认同有关，尊重边界的同时保持观察窗口。',
        action: '每周固定一个放松的家庭时间，不评判不追问，只保持在场和可被找到。'
      }
    },
    appetiteStatus: {
      '1-3岁': {
        concern: '这阶段食欲波动更多和咀嚼能力、食物质地、新食物恐惧有关，先看接受度再看总量。',
        action: '保留1-2种孩子熟悉的食物打底，每餐再试着放1种新食材在旁边，不加压不强喂。'
      },
      '3-6岁': {
        concern: '学龄前容易受零食、疲劳和注意力分散的影响，先看正餐前后的零食控制。',
        action: '正餐前1小时不安排零食和甜饮料，让孩子带着适度饥饿感坐到餐桌前。'
      },
      '6-12岁': {
        concern: '学习日节奏快易跳过早餐或午餐匆忙，先稳住三餐时间再调品类。',
        action: '早餐优先保证主食加蛋白，午晚餐每顿至少让主食、蛋白质和蔬菜同餐出现。'
      },
      '12岁以上': {
        concern: '青少年阶段容易受同伴饮食和外卖影响，先看三餐规律度再调具体食物。',
        action: '每周至少保持5天家庭正餐，让孩子参与选菜和备餐，自主感和营养密度一起提升。'
      }
    },
    sleepStatus: {
      '1-3岁': {
        concern: '这阶段睡眠更多看入睡难度和夜醒次数，白天的活动量和午觉时长都会影响夜间睡眠。',
        action: '固定每天晚上入睡前30分钟的安抚流程（洗澡-故事-关灯），连续做1周看变化。'
      },
      '3-6岁': {
        concern: '学龄前抗拒入睡更多和分离焦虑、过度兴奋有关，先看入睡前的屏幕和活动强度。',
        action: '睡前1小时切换为安静活动，用绘本或轻柔音乐做入睡信号，逐步降低兴奋度。'
      },
      '6-12岁': {
        concern: '学习日睡眠更容易被作业和屏幕挤占，先看就寝时间和起床时间是否稳定。',
        action: '固定就寝和起床时间，周末偏差控制在1小时以内，帮助生物钟稳定。'
      },
      '12岁以上': {
        concern: '青少年褪黑素分泌延迟，自然入睡时间更晚，重点看总睡眠时长是否达标。',
        action: '保持周末起床时间不比平时晚超2小时，避免周一生物钟剧烈调整。'
      }
    },
    exerciseStatus: {
      '1-3岁': {
        concern: '这阶段活动量主要看自主探索和户外时间，重点保证每天有安全的爬、走、跑空间。',
        action: '每天至少安排1次户外或室内宽敞场地的自由活动，时长以孩子情绪为准。'
      },
      '3-6岁': {
        concern: '学龄前大运动发展快，重点保证每天有充足的跑跳攀爬时间和安全边界。',
        action: '每天保证至少1小时户外或大运动时间，周末安排1次2小时以上的户外活动。'
      },
      '6-12岁': {
        concern: '学习日久坐时间增加，重点看运动类型是否覆盖有氧和力量，每周频次是否稳定。',
        action: '每周至少3次30分钟以上的中等强度运动，体育课和课后活动一起算。'
      },
      '12岁以上': {
        concern: '青少年阶段运动更多依赖兴趣和同伴驱动，先找到孩子愿意持续的运动形式。',
        action: '帮孩子找到1-2项有兴趣的体育类活动（校内社团或校外），每周保持固定频次。'
      }
    },
    socialStatus: {
      '1-3岁': {
        concern: '这阶段社交以平行游戏为主，先看孩子在熟悉环境里对同伴的观察和接近意愿。',
        action: '每周安排1-2次和同龄孩子在同一空间活动，不做强制互动，只提供机会。'
      },
      '3-6岁': {
        concern: '学龄前开始进入合作游戏阶段，先看轮流、分享和简单冲突的处理能力。',
        action: '安排小范围同伴互动（1-2个孩子），家长在旁边观察，只在必要时介入。'
      },
      '6-12岁': {
        concern: '同伴关系逐渐成为核心，先看孩子是否有1-2个稳定的朋友和是否被接纳。',
        action: '帮孩子创造课后社交机会，比如邀请同学来家或参加小组活动，每周1次即可。'
      },
      '12岁以上': {
        concern: '青少年社交圈扩大，更看重同伴认同，同时需要保持家庭沟通窗口。',
        action: '保持每周至少1次不设评判的家庭对话时间，孩子愿说多少说多少。'
      }
    }
  };
  const dimAdvice = adviceMap[dimensionKey] || adviceMap.moodStatus;
  return dimAdvice[ageStage] || dimAdvice['3-6岁'];
}

function buildWeeklyAgeOverview(recordDays, avgScore, ageStage) {
  if (recordDays < 1) {
    return {
      text: '本周还没有形成连续记录，先从每天30秒的成长记录开始。',
      mood: 'begin'
    };
  }
  const stageOverviews = {
    '1-3岁': recordDays >= 5
      ? { text: `本周记录了${recordDays}天，低龄阶段能做到固定节奏已经是很稳的开始。`, mood: 'steady' }
      : { text: `本周记录了${recordDays}天，低龄阶段先稳住记录节奏比追求完美数据更重要。`, mood: 'building' },
    '3-6岁': recordDays >= 5
      ? { text: `本周记录了${recordDays}天，学龄前阶段能保持这个频率，规律已经在建立。`, mood: 'steady' }
      : { text: `本周记录了${recordDays}天，再增加1-2天就能看到更稳定的趋势变化。`, mood: 'building' },
    '6-12岁': recordDays >= 5
      ? { text: `本周记录了${recordDays}天，学习日保持这个频率，趋势变化会更有参考价值。`, mood: 'steady' }
      : { text: `本周记录了${recordDays}天，上学日更容易疏漏记录，试着把记录放在固定时间点。`, mood: 'building' },
    '12岁以上': recordDays >= 5
      ? { text: `本周记录了${recordDays}天，青少年阶段保持固定记录节奏，变化趋势会越来越清晰。`, mood: 'steady' }
      : { text: `本周记录了${recordDays}天，试着把记录放在睡前5分钟，慢慢连成节奏。`, mood: 'building' }
  };
  return stageOverviews[ageStage] || stageOverviews['3-6岁'];
}

function buildDimensionSummaryFromRecords(records) {
  const summary = { moodStatus: 0, appetiteStatus: 0, sleepStatus: 0, exerciseStatus: 0, socialStatus: 0 };
  records.forEach((item) => {
    Object.keys(summary).forEach((key) => {
      summary[key] += getGrowthStatusScore(key, item[key]);
    });
  });
  Object.keys(summary).forEach((key) => {
    summary[key] = records.length ? Number((summary[key] / records.length).toFixed(2)) : 0;
  });
  return summary;
}

function buildTrendSummary(currentSummary, prevSummary) {
  const dimKeys = Object.keys(currentSummary);
  const diffs = dimKeys.map((key) => ({
    key,
    current: currentSummary[key],
    previous: prevSummary[key] || 0,
    diff: Number((currentSummary[key] - (prevSummary[key] || 0)).toFixed(2))
  }));
  const improved = diffs.filter((d) => d.diff >= 0.3).sort((a, b) => b.diff - a.diff);
  const declined = diffs.filter((d) => d.diff <= -0.3).sort((a, b) => a.diff - b.diff);
  const items = [];
  if (improved.length) {
    items.push({
      direction: 'up',
      label: getWeeklyDimensionLabel(improved[0].key),
      detail:
        improved.length === 1
          ? `${getWeeklyDimensionLabel(improved[0].key)}对比上周有提升，家庭里的固定动作正在产生效果。`
          : `${improved.map((d) => getWeeklyDimensionLabel(d.key)).join('和')}对比上周有提升，多维度同步向好。`
    });
  }
  if (declined.length) {
    items.push({
      direction: 'down',
      label: getWeeklyDimensionLabel(declined[0].key),
      detail:
        declined.length === 1
          ? `${getWeeklyDimensionLabel(declined[0].key)}对比上周有所回落，下周可以优先关注这个维度的记录频率。`
          : `${declined.map((d) => getWeeklyDimensionLabel(d.key)).join('和')}对比上周有所回落，可能和本周节奏变化有关。`
    });
  }
  if (!items.length) {
    items.push({
      direction: 'stable',
      label: '整体',
      detail: '各维度对比上周变化不大，状态总体稳定，下周继续维持记录和固定动作节奏。'
    });
  }
  return items;
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
  const scored = poolList.map((item) => ({
    item,
    score: scoreNutritionRecipeForAge(item, ageGroup)
  }));
  const sorted = scored.sort((a, b) => b.score - a.score);
  const topThree = sorted.slice(0, 3);
  if (!topThree.length) return sorted[0] ? sorted[0].item : null;
  const pick = topThree[Math.floor(Math.random() * topThree.length)];
  return pick.item;
}

function getNutritionAgeOverride(recipe, ageRange, field) {
  const override = getNutritionRecipeSourceOverride(recipe, ageRange);
  if (!override) return '';
  return override[field] || '';
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
  const prevWeekStart = getRelativeWeekDate(weekStart, -1);
  const prevWeekEnd = getWeekEndDateValue(prevWeekStart);
  const [prevGrowthRows] = await pool.execute(
    `SELECT *
     FROM growth_daily_records
     WHERE user_id = ? AND child_id = ? AND record_date BETWEEN ? AND ?
     ORDER BY record_date ASC`,
    [userId, child.id, prevWeekStart, prevWeekEnd]
  );
  const prevGrowthList = prevGrowthRows.map(normalizeGrowthRecord);
  const summaryBase = buildDimensionSummaryFromRecords(growthList);
  const prevSummaryBase = buildDimensionSummaryFromRecords(prevGrowthList);
  const trendItems = prevGrowthList.length ? buildTrendSummary(summaryBase, prevSummaryBase) : [];
  const weakestDimension = Object.entries(summaryBase).sort((a, b) => a[1] - b[1])[0] || ['moodStatus', 0];
  const avgScore = Object.values(summaryBase).reduce((sum, item) => sum + item, 0) / (Object.keys(summaryBase).length || 1);
  const weakestDimensionLabel = getWeeklyDimensionLabel(weakestDimension[0]);
  const sceneProfile = getWeeklySummaryProfileByDimension(weakestDimension[0]);
  const ageStage = getWeeklyAgeStageKey(ageGroup);
  const dimAdvice = getWeeklyDimensionAdvice(weakestDimension[0], ageStage);
  const overviewData = buildWeeklyAgeOverview(growthList.length, avgScore, ageStage);
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
      summary: (recipe.nutrition && recipe.nutrition.highlight) || getNutritionAgeOverride(recipe, ageGroup, 'description') || recipe.description || '',
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
    completedPlanCount: normalizeAggregateNumber(planRows[0] && planRows[0].completed_total),
    totalPlanCount: normalizeAggregateNumber(planRows[0] && planRows[0].total),
    completedTaskCount: normalizeAggregateNumber(taskRows[0] && taskRows[0].completed_total),
    dimensionScores: summaryBase,
    weakestDimension: weakestDimension[0],
    weakestDimensionLabel,
    overview: overviewData.text,
    overviewMood: overviewData.mood,
    highlights: [
      normalizeAggregateNumber(planRows[0] && planRows[0].completed_total) > 0
        ? `本周完成了${normalizeAggregateNumber(planRows[0] && planRows[0].completed_total)}次今日育儿计划，固定动作在形成节奏。`
        : '本周的计划完成次数还可以继续提高，试试把1-2个固定动作放进每天的同一个时段。',
      normalizeAggregateNumber(taskRows[0] && taskRows[0].completed_total) > 0
        ? `能力训练完成${normalizeAggregateNumber(taskRows[0] && taskRows[0].completed_total)}次，执行节奏正在形成。`
        : '本周能力训练触达较少，下周可以试试固定一个时段开始，先从每周2次起。'
    ],
    concernsFull: [
      dimAdvice.concern,
      growthList.length < 4 ? '记录天数还偏少，下周先把记录频率稳定下来再评估趋势。' : '建议把家庭观察和固定动作继续配套执行，连续几周后再对比趋势。'
    ],
    concernsPreview: [
      dimAdvice.concern
    ],
    nextActionsFull: [
      dimAdvice.action,
      growthList.length < 4 ? '下周优先稳住记录节奏，每天固定一个时间点花30秒记录即可。' : '下周继续保留每天一个固定记录时段，观察动作效果。',
      `围绕${sceneProfile.articleCategory}再读一篇方法文并尝试其中一条建议，下周记录变化。`
    ],
    nextActionsPreview: [
      dimAdvice.action
    ],
    recommendedContentPremium: recommendedContent,
    recommendedContentPreview: recommendedContent.slice(0, 1),
    premiumTip: '会员可查看更细的趋势解释、完整下周建议和更多推荐内容。',
    trendItems
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
    payload = safeParseJson(rows[0].summary_payload, null);
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
  res.json({ success: true, data: await getCachedSceneTags() });
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
  if (!isValidBoundedIntInput(req.query.page, 1, 1000000)) {
    res.status(400).json({ success: false, message: 'page参数无效' });
    return;
  }
  if (!isValidBoundedIntInput(req.query.page_size, 1, 20)) {
    res.status(400).json({ success: false, message: 'page_size参数无效' });
    return;
  }
  if (req.query.category && !VALID_PARENTING_CATEGORIES.has(String(req.query.category).trim())) {
    res.status(400).json({ success: false, message: 'category参数无效' });
    return;
  }
  if (req.query.age_group && !VALID_PARENTING_AGE_GROUPS.has(String(req.query.age_group).trim())) {
    res.status(400).json({ success: false, message: 'age_group参数无效' });
    return;
  }
  if (req.query.content_form && !VALID_CONTENT_FORMS.has(String(req.query.content_form).trim())) {
    res.status(400).json({ success: false, message: 'content_form参数无效' });
    return;
  }
  const page = normalizeBoundedInt(req.query.page, 1, 1, 1000000);
  const pageSize = normalizeBoundedInt(req.query.page_size, 10, 1, 20);
  const offset = (page - 1) * pageSize;
  const paginationClause = ` LIMIT ${pageSize} OFFSET ${offset}`;
  const cacheKey = buildParentingArticlesCacheKey(req.query || {});
  const params = [];
  const countParams = [];
  let whereClause = 'WHERE is_published = 1';
  if (req.query.category) {
    whereClause += ' AND category = ?';
    params.push(req.query.category);
    countParams.push(req.query.category);
  }
  if (req.query.age_group) {
    whereClause += ' AND age_group = ?';
    params.push(req.query.age_group);
    countParams.push(req.query.age_group);
  }
  if (req.query.keyword) {
    whereClause += ' AND (title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)';
    const searchTerm = `%${String(req.query.keyword).trim()}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }
  if (req.query.content_form) {
    whereClause += ' AND content_form = ?';
    params.push(req.query.content_form);
    countParams.push(req.query.content_form);
  }
  let cachedPayload = getCachedParentingArticles(cacheKey);
  if (!cachedPayload) {
    const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM articles ${whereClause}`, countParams);
    const [rows] = await pool.execute(`SELECT * FROM articles ${whereClause} ORDER BY created_at DESC${paginationClause}`, params);
    cachedPayload = {
      rows,
      total: normalizeAggregateNumber(countRows[0] && countRows[0].total)
    };
    setCachedParentingArticles(cacheKey, cachedPayload);
  }
  const data = [];
  for (const row of cachedPayload.rows) {
    data.push(await normalizeArticle(row, getUserId(req)));
  }
  const total = cachedPayload.total;
  res.json({
    success: true,
    data: {
      list: data,
      pagination: {
        page,
        page_size: pageSize,
        total,
        has_more: offset + data.length < total,
        hasMore: offset + data.length < total
      }
    }
  });
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
  const rawSubjectCode = String(req.query.subjectCode || '').trim();
  const subjectCode = rawSubjectCode || null;
  const childId = Number(req.query.childId || 0);
  if (!pointId) {
    res.status(400).json({ success: false, message: 'pointId不能为空' });
    return;
  }
  if (rawSubjectCode && !VALID_SUBJECT_CODES.has(rawSubjectCode)) {
    res.status(404).json({ success: false, message: '知识点不存在' });
    return;
  }
  const child = await requireOwnedChildForRead(req, res, childId);
  if (!child) {
    return;
  }
  const canonicalTaskCode = resolveCanonicalReadingTaskCode(pointId);
  const [rows] = await pool.execute(
    `SELECT t.*, tp.status, tp.progress
     FROM reading_tasks t
     LEFT JOIN task_progress tp ON t.id = tp.task_id AND tp.child_id = ?
     WHERE (t.task_code = ? OR CAST(t.id AS CHAR) = ?)
       AND (? IS NULL OR t.subject_code = ?)
     LIMIT 1`,
    [childId, canonicalTaskCode, canonicalTaskCode, subjectCode, subjectCode]
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
  const canonicalTaskCode = resolveCanonicalReadingTaskCode(pointId);
  const [taskRows] = await pool.execute('SELECT id FROM reading_tasks WHERE task_code = ? OR CAST(id AS CHAR) = ? LIMIT 1', [canonicalTaskCode, canonicalTaskCode]);
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
  res.json({ success: true, data: { child_id: childId, knowledge_point_id: canonicalTaskCode, status: req.body.status || 'in_progress', mapped_status: normalizedStatus, mastery_level: progress } });
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
  res.json({ success: true, data: { assessment_code: code, age_group: req.query.age_group || '', questions: buildAssessmentQuestions(code, req.query.age_group || '') } });
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

function buildAssessmentReportData(interpretationRows, suggestionRows, ageGroup) {
  const interpretations = Array.isArray(interpretationRows) ? interpretationRows : [];
  const suggestions = Array.isArray(suggestionRows) ? suggestionRows : [];
  const primaryInterpretation = interpretations[0] || null;
  const code = primaryInterpretation ? primaryInterpretation.assessment_code : '';
  const level = primaryInterpretation ? primaryInterpretation.level : '';
  const ageContext = buildAssessmentAgeContext(code, ageGroup, level);
  return {
    summary: primaryInterpretation ? (primaryInterpretation.interpretation || primaryInterpretation.behavior_description || primaryInterpretation.scene_advice || primaryInterpretation.expected_goal || '') : '',
    recommendations: suggestions.map((item) => item.description || item.steps || item.title || '').filter(Boolean),
    suggestionCards: suggestions.map((item) => ({
      title: item.title || '',
      description: item.description || '',
      steps: item.steps || '',
      duration: item.duration || '',
      frequency: item.frequency || ''
    })),
    interpretations,
    suggestions,
    ageContext
  };
}

function buildAssessmentAgeContext(assessmentCode, ageGroup, level) {
  const stageKey = getWeeklyAgeStageKey(ageGroup);
  const contexts = {
    sensory: {
      '1-3岁': { ageNote: '1-3岁是感觉统合发展的关键窗口期，这个阶段的前庭、触觉和本体感发育会直接影响后续的专注、情绪和运动能力。', expectedByAge: '此年龄段感觉偏好和回避都是正常探索过程，重点看是否严重干扰日常进食、睡眠和互动。', priorityFocus: '优先保证每天充足的爬行、触觉游戏和户外活动时间。' },
      '3-6岁': { ageNote: '3-6岁是感觉统合快速整合期，这个阶段的感觉处理效率直接影响入学准备。', expectedByAge: '此年龄段仍可接受一定的感觉敏感和不协调，但应能看到逐步改善的趋势。', priorityFocus: '优先丰富感觉体验类型，每天保证1小时以上大运动时间。' },
      '6-12岁': { ageNote: '6-12岁感觉统合趋于成熟，重点关注是否影响课堂专注和书写运动。', expectedByAge: '此年龄段大部分孩子已具备良好的感觉调节能力，偶有的感觉不适属正常范围。', priorityFocus: '优先排查课堂上是否存在感觉相关的分心或疲劳问题。' },
      '12岁以上': { ageNote: '12岁以上感觉统合基本定型，重点关注对学习和运动表现的持续影响。', expectedByAge: '此年龄段感觉处理已接近成人水平，明显的失调信号需要专业评估。', priorityFocus: '优先关注运动协调和空间感知是否影响体育和日常生活。' }
    },
    focus: {
      '1-3岁': { ageNote: '1-3岁专注力以"兴趣驱动"为主，时长短、切换快是这个阶段的特点。', expectedByAge: '此年龄段单次专注2-5分钟属于正常范围，重点看是否能被吸引回到任务上。', priorityFocus: '优先从孩子最感兴趣的活动切入，用短时间高反馈的方式培养专注习惯。' },
      '3-6岁': { ageNote: '3-6岁是专注力从"被动吸引"向"主动维持"过渡的关键期。', expectedByAge: '此年龄段能专注8-15分钟属于良好，需要提醒才能维持也属正常。', priorityFocus: '优先建立安静的任务环境和固定的"专注时间"习惯。' },
      '6-12岁': { ageNote: '6-12岁专注力进入自我管理阶段，学业要求提升对专注时长提出更高要求。', expectedByAge: '此年龄段应能独立维持15-25分钟专注，走神后能自行拉回。', priorityFocus: '优先培养自我监控能力，用计时器和任务清单辅助自主管理。' },
      '12岁以上': { ageNote: '12岁以上专注力接近成人水平，重点转向深度专注和抗干扰能力。', expectedByAge: '此年龄段应能维持30分钟以上深度专注，在有干扰的环境中也能完成任务。', priorityFocus: '优先发展元认知策略，让孩子了解自己的最佳专注时段和方式。' }
    },
    adhd: {
      '1-3岁': { ageNote: '1-3岁阶段不诊断ADHD，但可观察行为模式作为早期预警参考。', expectedByAge: '此年龄段活泼好动、冲动都是正常的，重点看安全风险和家庭日常受影响的程度。', priorityFocus: '优先建立安全的结构化环境和可预测的日常节奏。' },
      '3-6岁': { ageNote: '3-6岁是ADHD早期识别窗口，行为模式的持续性和跨场景性是关键指标。', expectedByAge: '此年龄段仍以观察为主，冲动和多动需结合发育商综合判断。', priorityFocus: '优先关注行为是否在家庭和幼儿园两个场景中持续出现。' },
      '6-12岁': { ageNote: '6-12岁是ADHD最常见的确诊年龄段，学业和行为要求提升后信号更明显。', expectedByAge: '此年龄段需关注注意力、冲动控制和执行功能三大核心领域，持续观察跨场景表现。', priorityFocus: '如多个场景持续出现注意力和冲动问题，建议寻求专业评估。' },
      '12岁以上': { ageNote: '12岁以上ADHD表现可能从外化转向内化，如拖延、遗忘、时间管理困难。', expectedByAge: '此年龄段需关注学业组织和时间管理能力，冲动行为可能减少但执行功能困难持续。', priorityFocus: '优先建立外挂执行功能系统（计划表、提醒、清单），用外部结构补内部不足。' }
    },
    multi_intelligence: {
      '1-3岁': { ageNote: '1-3岁智能发展以感官探索和动作经验为主，多元智能的早期迹象在此阶段开始分化。', expectedByAge: '此年龄段智能表现还很不稳定，兴趣快速变化是正常的，重点看探索的广度和投入时长。', priorityFocus: '优先提供丰富的感官和运动体验，不做能力判断，多做兴趣观察。' },
      '3-6岁': { ageNote: '3-6岁多元智能进入快速分化期，孩子的兴趣和能力倾向开始显现。', expectedByAge: '此年龄段在2-3个领域的突出表现已经可见，但不必急于定型。', priorityFocus: '优先保证多领域接触的广度，同时对投入时间明显更长的领域给予深度支持。' },
      '6-12岁': { ageNote: '6-12岁多元智能发展格局趋于清晰，优势领域和待发展领域基本可辨。', expectedByAge: '此年龄段至少应有1-2个明显优势领域，其他领域保持正常参与即可。', priorityFocus: '优先进深优势领域，用优势带动劣势，避免平均用力。' },
      '12岁以上': { ageNote: '12岁以上多元智能结构基本稳定，重点转向优势领域的深度发展和职业探索。', expectedByAge: '此年龄段智能结构已明确，应基于优势做学业和兴趣的定向发展。', priorityFocus: '围绕优势智能规划深度项目，为未来学业和职业方向做早期探索。' }
    },
    emotion: {
      '1-3岁': { ageNote: '1-3岁是情绪发展的基础期，从基本情绪识别到简单情绪表达。', expectedByAge: '此年龄段情绪爆发频繁是正常的，重点看情绪恢复速度和是否能用简单词汇表达。', priorityFocus: '优先帮孩子建立"情绪命名"的习惯，每天用1-2个情绪词描述孩子的状态。' },
      '3-6岁': { ageNote: '3-6岁是情绪理解和共情发展的加速期，开始理解他人有和自己不同的感受。', expectedByAge: '此年龄段应能说出3-5种基本情绪，并在简单场景中表达自己的感受。', priorityFocus: '优先通过绘本和角色扮演扩展情绪词汇，建立"说情绪比做情绪好"的家庭文化。' },
      '6-12岁': { ageNote: '6-12岁情绪能力进入精细化和策略化阶段，开始学习主动调节策略。', expectedByAge: '此年龄段应能识别多种复杂情绪并使用1-2种调节策略，但强烈情绪时仍需成人支持。', priorityFocus: '优先培养情绪调节工具箱（深呼吸、暂停、表达），在低强度情绪时练习使用。' },
      '12岁以上': { ageNote: '12岁以上情绪独立性和复杂性同步增长，青春期荷尔蒙变化带来新的情绪挑战。', expectedByAge: '此年龄段情绪波动和强度增加是正常的，重点看是否影响日常功能和人际关系。', priorityFocus: '优先保持开放的沟通渠道，不评判不追问，让孩子知道"任何时候都可以来找我"。' }
    },
      learning: {
        '1-3岁': { ageNote: '1-3岁学习以探索和模仿为主，学习适应更多体现在对日常流程的接受度上。', expectedByAge: '此年龄段抗拒和转移注意力都是正常的，重点看能否在引导下完成简单的多步骤活动。', priorityFocus: '优先建立固定的"一起做"时间，用游戏化方式引入学习活动。' },
        '3-6岁': { ageNote: '3-6岁是学习习惯养成的黄金期，任务坚持、完成感和规则意识在此阶段建立。', expectedByAge: '此年龄段应能在成人陪伴下完成10-15分钟的结构化活动，但独立启动仍较困难。', priorityFocus: '优先生固定的每日学习时段，用"开始仪式"帮助大脑切换到学习模式。' },
        '6-12岁': { ageNote: '6-12岁是学习适应能力的关键塑造期，小学阶段的习惯会影响整个学业生涯。', expectedByAge: '此年龄段应能独立启动和完成常规学习任务，对困难任务可能需要额外支持。', priorityFocus: '优先培养自主管理能力（计划、执行、检查），逐步减少成人陪伴和提醒。' },
        '12岁以上': { ageNote: '12岁以上学习适应转向自主和策略化，需要更强的元认知和时间管理能力。', expectedByAge: '此年龄段应能独立规划学习、监控进度和调整策略，学业压力管理成为新课题。', priorityFocus: '优先帮助孩子建立个性化的学习系统，包括时间管理、复习策略和应试技巧。' }
      },
      gross_motor: {
        '0-1岁': { ageNote: '0-1岁是大运动发展的第一波爆发期，从抬头到独立行走，每个里程碑都有大致的时间窗口。', expectedByAge: '约2-3月抬头稳，4-6月会翻身，6-8月能独坐，8-10月会爬行，10-14月扶站扶走。个体差异可达2-3个月。', priorityFocus: '优先保证每天充足的趴玩时间和地面自由活动，减少在推车、餐椅、学步车里的时间。' },
        '1-2岁': { ageNote: '1-2岁是独立行走和探索的爆发期，从踉跄学步到稳健跑跳。', expectedByAge: '12-15月独立行走，18月能扶着上楼梯，2岁能跑能踢球。此阶段摔跤是正常学习过程。', priorityFocus: '优先提供安全的探索空间和丰富的户外运动机会，不过度保护也不过度push。' },
        '2-3岁': { ageNote: '2-3岁是运动协调性快速提升期，从基础移动到复杂动作组合。', expectedByAge: '2岁半能双脚跳，3岁能单脚站片刻、骑三轮车。动作的流畅性和自信度在此阶段大幅提升。', priorityFocus: '优先保证每天至少1小时户外活动，提供攀爬、跳跃、投掷等多样化运动体验。' }
      },
      fine_motor: {
        '0-1岁': { ageNote: '0-1岁是手部从反射性抓握到自主精确操作的转变期。', expectedByAge: '3-4月会合拢双手，5-6月会主动抓握，7-8月会换手，9-10月会用指尖捏取。每个小进步都值得鼓励。', priorityFocus: '优先提供各种安全可抓握的玩具和材料，多给孩子自己尝试用手的机会。' },
        '1-2岁': { ageNote: '1-2岁是精细动作从基本抓握向工具使用的过渡期。', expectedByAge: '12-15月能用勺（会洒），15-18月能搭2-3块积木，18-24月能涂鸦、逐页翻书。手部操作开始有目的性。', priorityFocus: '优先提供涂鸦、搭积木、自己吃饭的练习机会，乱和洒是这个阶段的正常代价。' },
        '2-3岁': { ageNote: '2-3岁是精细动作从操作到创造的关键期，手眼协调快速进步。', expectedByAge: '2岁半能串珠子，3岁能用安全剪刀。此阶段手工活动的完成度比精确度更重要。', priorityFocus: '优先生每天的手工和操作类活动，用安全剪刀、橡皮泥、积木等材料培养手部能力。' }
      },
      language_dev: {
        '0-1岁': { ageNote: '0-1岁是语言前备期，从哭声到咿呀学语再到第一个有意义的词。', expectedByAge: '2-3月发咕咕声，6月左右发重复音节（哒哒），9月左右理解简单词汇，12月左右说出第一个词。', priorityFocus: '优先保证每天大量的面对面语言输入和回应，用母语清晰缓慢地描述日常活动。' },
        '1-2岁': { ageNote: '1-2岁是语言爆发前期，从单词到双词组合再到短句。', expectedByAge: '15月左右词汇快速增长，18月能说10-20个词，24月能说50+词并组合双词句。理解远超前于表达。', priorityFocus: '优先通过亲子共读和日常对话扩展词汇量，多用开放性提问但接受孩子的简短回答。' },
        '2-3岁': { ageNote: '2-3岁是语言复杂化期，从短句到复杂句再到叙述和对话。', expectedByAge: '2岁半左右词汇量快速增长，3岁能用3-5词句表达想法和讲故事。发音清晰度在此阶段快速提高。', priorityFocus: '优先通过讲故事、角色扮演和对话扩展句式复杂度，关注发音清晰度但不急于纠正。' }
      },
      social_emotion: {
        '0-1岁': { ageNote: '0-1岁是社交情绪的基础建设期，核心是建立安全依恋和基本的社交回应。', expectedByAge: '2-3月社交性微笑，6-8月开始认生，8-10月出现分离焦虑，12月左右能用手指和声音引起注意。', priorityFocus: '优先保证主要照护者的稳定和回应一致性，多用积极的表情和语调回应宝宝的社交信号。' },
        '1-2岁': { ageNote: '1-2岁是自我意识和社交探索的萌芽期。', expectedByAge: '15-18月能在镜子中认出自己，18-24月开始出现自我主张（我的、不要），此阶段平行游戏为主。', priorityFocus: '优先提供安全的探索环境和可预测的日常流程，接纳正在发展的自主意识。' },
        '2-3岁': { ageNote: '2-3岁是社交技能和情绪调节的快速发展期。', expectedByAge: '2岁半左右开始出现真正的互动游戏，3岁左右能轮流和简单分享。情绪爆发频率仍然较高但恢复更快。', priorityFocus: '优先生创造与同龄孩子游戏的机会，教孩子用简单语言表达需求和感受而非行为爆发。' }
      }
  };
  const codeContexts = contexts[assessmentCode] || contexts.focus;
  const result = codeContexts[stageKey] || codeContexts['3-6岁'];
  return Object.assign({ assessmentCode: assessmentCode || '' }, result);
}

async function assessmentSubmitHandler(req, res) {
  const code = req.params.code;
  const meta = ASSESSMENT_META[code];
  if (!meta) {
    res.status(404).json({ success: false, message: '观察工具不存在' });
    return;
  }
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
      [childId, code, meta.name, req.body.age_group || '', totalScore, maxScore, percentage, level, Number(req.body.elapsed_time || 0)]
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
    const ageGroup = req.body.age_group || inferAgeRangeFromChild(child) || '3-4岁';
    const reportData = buildAssessmentReportData(interpretationRows, suggestionRows, ageGroup);
    res.json({
      success: true,
      data: {
        record_id: result.insertId,
        id: result.insertId,
        assessment_code: code,
        assessment_type: code,
        assessment_name: meta.name,
        total_score: totalScore,
        overall_score: totalScore,
        max_score: maxScore,
        percentage,
        overall_level: level,
        overall_level_text: normalizeLevelText(level),
        dimension_scores: [],
        report_data: reportData,
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
  const ageGroup = record.age_group || '3-4岁';
  const reportData = buildAssessmentReportData(interpretationRows, suggestionRows, ageGroup);
  return {
    ...record,
    assessment_type: record.assessment_code,
    assessment_name: record.assessment_name || ((ASSESSMENT_META[record.assessment_code] && ASSESSMENT_META[record.assessment_code].name) || record.assessment_code),
    child_name: childRows[0] ? childRows[0].name : '',
    overall_score: record.total_score,
    dimension_scores: dimensionRows.map((item) => ({ dimension_id: item.dimension_name, dimension_name: item.dimension_name, name: item.dimension_name, score: item.score, score_rate: item.score_rate, standard_score: item.standard_score })),
    report_data: reportData,
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
