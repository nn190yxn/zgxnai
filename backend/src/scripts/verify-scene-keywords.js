'use strict';

const fs = require('fs');

const DEFAULT_BASE_URL = process.env.DAILY_GUIDANCE_BASE_URL || 'https://api.woyai.cn/api/v1';
const TOKEN = process.env.DAILY_GUIDANCE_TOKEN || '';
const CHILD_ID = Number(process.env.DAILY_GUIDANCE_CHILD_ID || 0);
const OUTPUT_FILE = String(process.env.DAILY_GUIDANCE_OUTPUT_FILE || '').trim();
const KEYWORDS = String(process.env.DAILY_GUIDANCE_SCENE_KEYWORDS || '')
  .split(/[\n,，]/)
  .map((item) => item.trim())
  .filter(Boolean);

const DEFAULT_KEYWORDS = [
  '孩子发脾气', '爱发脾气', '公共场合哭闹', '商场哭闹', '出门闹脾气',
  '睡前拖延', '不肯睡觉', '哄睡困难', '入睡困难', '晚上兴奋',
  '挑食', '不肯吃饭', '边吃边玩', '不爱吃菜', '只吃主食',
  '坐不住', '写作业分心', '学习拖拉', '容易走神', '专注力差',
  '抢玩具', '和小朋友打架', '不会分享', '同伴冲突', '和同学吵架',
  '早上磨蹭', '出门慢', '上学拖延', '起床拖拉', '晨起磨蹭'
];

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

async function requestJson(path, query) {
  const response = await fetch(buildUrl(path, query), {
    method: 'GET',
    headers: {
      Authorization: TOKEN ? `Bearer ${TOKEN}` : ''
    }
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

async function verifyKeyword(keyword) {
  const result = await requestJson('/search/solutions', {
    childId: CHILD_ID || undefined,
    keyword
  });
  return {
    keyword,
    matched: !!(result && result.matched),
    sceneKey: result && result.scene ? result.scene.sceneKey : '',
    sceneTitle: result && result.scene ? result.scene.sceneTitle : '',
    solutionCount: result && result.solutions ? result.solutions.length : 0,
    articleCount: result && result.articles ? result.articles.length : 0
  };
}

async function main() {
  const keywords = KEYWORDS.length ? KEYWORDS : DEFAULT_KEYWORDS;
  const rows = [];
  for (const keyword of keywords) {
    rows.push(await verifyKeyword(keyword));
  }
  const summary = {
    baseUrl: DEFAULT_BASE_URL,
    childId: CHILD_ID,
    total: rows.length,
    matchedCount: rows.filter((item) => item.matched).length,
    fallbackCount: rows.filter((item) => !item.matched && item.articleCount > 0).length,
    emptyCount: rows.filter((item) => !item.matched && item.articleCount === 0).length,
    rows
  };
  const text = `${JSON.stringify(summary, null, 2)}\n`;
  process.stdout.write(text);
  if (OUTPUT_FILE) {
    fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
  }
  if (summary.emptyCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
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
