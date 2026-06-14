'use strict';

const fs = require('fs');

const DEFAULT_BASE_URL = process.env.DAILY_GUIDANCE_BASE_URL || 'https://api.woyai.cn/api/v1';
const TOKEN = process.env.DAILY_GUIDANCE_TOKEN || '';
const CHILD_ID = Number(process.env.DAILY_GUIDANCE_CHILD_ID || 0);
const EXPECT_MEMBER = String(process.env.DAILY_GUIDANCE_EXPECT_MEMBER || '').trim().toLowerCase();
const PROMO_CODE = String(process.env.DAILY_GUIDANCE_PROMO_CODE || '').trim();
const OUTPUT_FILE = String(process.env.DAILY_GUIDANCE_OUTPUT_FILE || '').trim();

function buildUrl(path, query) {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  const url = new URL(normalizedPath, DEFAULT_BASE_URL.endsWith('/') ? DEFAULT_BASE_URL : `${DEFAULT_BASE_URL}/`);
  Object.keys(query || {}).forEach((key) => {
    const value = query[key];
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function requestJson(path, options) {
  const opts = options || {};
  const response = await fetch(buildUrl(path, opts.query), {
    method: opts.method || 'GET',
    headers: Object.assign({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`
    }, opts.headers || {}),
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await response.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch (err) {
    payload = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} ${path}`);
    error.payload = payload;
    throw error;
  }
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'success')) {
    if (payload.success === false) {
      const error = new Error(payload.message || `业务返回失败 ${path}`);
      error.payload = payload;
      throw error;
    }
    return Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  }
  return payload;
}

function getToday() {
  const date = new Date();
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function assertCheck(condition, message, extra) {
  if (!condition) {
    const error = new Error(message);
    error.payload = extra || null;
    throw error;
  }
}

function writeOutput(payload) {
  const text = `${JSON.stringify(payload, null, 2)}\n`;
  process.stdout.write(text);
  if (OUTPUT_FILE) {
    fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
  }
}

async function verify() {
  if (!TOKEN) {
    throw new Error('缺少 DAILY_GUIDANCE_TOKEN');
  }
  if (!CHILD_ID) {
    throw new Error('缺少 DAILY_GUIDANCE_CHILD_ID');
  }

  const today = getToday();
  const summary = {
    baseUrl: DEFAULT_BASE_URL,
    childId: CHILD_ID,
    date: today,
    checks: []
  };

  const membership = await requestJson('/membership/info');
  if (EXPECT_MEMBER === 'active') {
    assertCheck(membership && membership.is_active, '会员状态校验失败：预期当前账号为激活会员', membership);
  }
  if (EXPECT_MEMBER === 'inactive') {
    assertCheck(!(membership && membership.is_active), '会员状态校验失败：预期当前账号为非会员', membership);
  }
  summary.checks.push({
    name: 'membership_info',
    status: 'ok',
    isActive: !!(membership && membership.is_active),
    membershipType: membership && membership.membership_type,
    currentEndDate: membership && membership.current_end_date,
    promoEnabled: !!(membership && membership.promo_enabled)
  });

  if (PROMO_CODE) {
    const promoResult = await requestJson('/membership/promo/redeem', {
      method: 'POST',
      body: { code: PROMO_CODE }
    });
    const membershipAfterPromo = await requestJson('/membership/info');
    assertCheck(membershipAfterPromo && membershipAfterPromo.is_active, '兑换码领取后会员状态未激活', membershipAfterPromo);
    summary.checks.push({
      name: 'membership_promo_redeem',
      status: 'ok',
      activated: !!(promoResult && promoResult.activated),
      currentEndDate: promoResult && promoResult.current_end_date,
      membershipType: membershipAfterPromo && membershipAfterPromo.membership_type
    });
  }

  const dailyPlan = await requestJson('/daily-plan', { query: { childId: CHILD_ID } });
  summary.checks.push({
    name: 'daily_plan',
    status: 'ok',
    cardCount: ((dailyPlan && dailyPlan.cards) || []).length,
    firstCardType: dailyPlan && dailyPlan.cards && dailyPlan.cards[0] ? dailyPlan.cards[0].type : ''
  });

  const growthPayload = {
    childId: CHILD_ID,
    recordDate: today,
    moodStatus: 'steady',
    appetiteStatus: 'normal',
    sleepStatus: 'stable',
    exerciseStatus: 'enough',
    socialStatus: 'smooth',
    noteText: '脚本回测写入：用于验证成长记录与周总结链路。'
  };
  const growthUpsert = await requestJson('/growth-records', { method: 'POST', body: growthPayload });
  summary.checks.push({
    name: 'growth_record_upsert',
    status: 'ok',
    recordDate: growthUpsert && growthUpsert.recordDate,
    moodStatus: growthUpsert && growthUpsert.moodStatus
  });

  const growthDaily = await requestJson('/growth-records/daily', { query: { childId: CHILD_ID, date: today } });
  summary.checks.push({
    name: 'growth_record_daily',
    status: 'ok',
    noteLength: growthDaily && growthDaily.noteText ? growthDaily.noteText.length : 0
  });

  const growthHistory = await requestJson('/growth-records/history', { query: { childId: CHILD_ID, page: 1, pageSize: 7 } });
  summary.checks.push({
    name: 'growth_record_history',
    status: 'ok',
    listCount: growthHistory && growthHistory.list ? growthHistory.list.length : 0
  });

  const growthSummary = await requestJson('/growth-records/summary', { query: { childId: CHILD_ID, days: 7 } });
  summary.checks.push({
    name: 'growth_record_summary',
    status: 'ok',
    completedDays: growthSummary && growthSummary.completedDays,
    overallLabel: growthSummary && growthSummary.overallLabel
  });

  const weeklySummary = await requestJson('/weekly-summary', { query: { childId: CHILD_ID } });
  const expectedPremiumUnlocked = PROMO_CODE ? true : (EXPECT_MEMBER === 'active' ? true : (EXPECT_MEMBER === 'inactive' ? false : null));
  if (expectedPremiumUnlocked !== null) {
    assertCheck(!!(weeklySummary && weeklySummary.premiumUnlocked) === expectedPremiumUnlocked, '周总结会员口径校验失败', weeklySummary);
  }
  if (expectedPremiumUnlocked === true) {
    assertCheck((weeklySummary && weeklySummary.concerns ? weeklySummary.concerns.length : 0) >= 2, '会员周总结重点观察数量不足', weeklySummary);
    assertCheck((weeklySummary && weeklySummary.recommendedContent ? weeklySummary.recommendedContent.length : 0) >= 1, '会员周总结推荐内容为空', weeklySummary);
  }
  if (expectedPremiumUnlocked === false) {
    assertCheck((weeklySummary && weeklySummary.concerns ? weeklySummary.concerns.length : 0) <= 1, '基础版周总结返回了过多重点观察', weeklySummary);
    assertCheck((weeklySummary && weeklySummary.recommendedContent ? weeklySummary.recommendedContent.length : 0) <= 1, '基础版周总结返回了过多推荐内容', weeklySummary);
  }
  summary.checks.push({
    name: 'weekly_summary',
    status: 'ok',
    premiumUnlocked: !!(weeklySummary && weeklySummary.premiumUnlocked),
    concernCount: weeklySummary && weeklySummary.concerns ? weeklySummary.concerns.length : 0,
    nextActionCount: weeklySummary && weeklySummary.nextActions ? weeklySummary.nextActions.length : 0,
    recommendedCount: weeklySummary && weeklySummary.recommendedContent ? weeklySummary.recommendedContent.length : 0,
    premiumTip: weeklySummary && weeklySummary.premiumTip ? weeklySummary.premiumTip : ''
  });

  const sceneTags = await requestJson('/search/scenes');
  const sceneSolutions = await requestJson('/search/solutions', { query: { childId: CHILD_ID, keyword: '睡前拖延' } });
  const sceneFallback = await requestJson('/search/solutions', { query: { childId: CHILD_ID, keyword: '补铁' } });
  assertCheck(!!(sceneSolutions && sceneSolutions.matched), '场景搜索命中词未返回场景结果', sceneSolutions);
  assertCheck((sceneFallback && sceneFallback.matched) === false, '文章回退词被错误识别为场景', sceneFallback);
  assertCheck((sceneFallback && sceneFallback.articles ? sceneFallback.articles.length : 0) >= 1, '场景未命中时没有返回文章回退结果', sceneFallback);
  summary.checks.push({
    name: 'scene_search',
    status: 'ok',
    sceneCount: Array.isArray(sceneTags) ? sceneTags.length : 0,
    matched: !!(sceneSolutions && sceneSolutions.matched),
    solutionCount: sceneSolutions && sceneSolutions.solutions ? sceneSolutions.solutions.length : 0,
    fallbackArticleCount: sceneFallback && sceneFallback.articles ? sceneFallback.articles.length : 0
  });

  writeOutput(summary);
}

verify().catch((err) => {
  const output = {
    ok: false,
    message: err.message,
    detail: err.payload || null
  };
  const text = `${JSON.stringify(output, null, 2)}\n`;
  process.stderr.write(text);
  if (OUTPUT_FILE) {
    fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
  }
  process.exit(1);
});
