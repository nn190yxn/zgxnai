'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const jwt = require('jsonwebtoken');

function requireMysqlPromise() {
  try {
    return require('mysql2/promise');
  } catch (err) {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'mysql2/promise'));
  }
}

const mysql = requireMysqlPromise();

const DEFAULT_BASE_URL = process.env.CHAT_VERIFY_BASE_URL || 'http://127.0.0.1:3002/api/v1';
const OUTPUT_FILE = String(process.env.CHAT_VERIFY_OUTPUT_FILE || '').trim();

function loadEnvFile() {
  const envPath = path.resolve(__dirname, '../../../.env');
  const text = fs.readFileSync(envPath, 'utf8');
  const result = {};
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const index = trimmed.indexOf('=');
    if (index <= 0) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    result[key] = value;
  }
  return result;
}

const LOCAL_ENV = loadEnvFile();
const JWT_SECRET = process.env.JWT_SECRET || LOCAL_ENV.JWT_SECRET || 'dev-niuniu-secret';

function buildUrl(path) {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  return new URL(normalizedPath, DEFAULT_BASE_URL.endsWith('/') ? DEFAULT_BASE_URL : `${DEFAULT_BASE_URL}/`).toString();
}

async function requestJson(path, options) {
  const opts = options || {};
  const response = await fetch(buildUrl(path), {
    method: opts.method || 'GET',
    headers: Object.assign({
      'Content-Type': 'application/json'
    }, opts.token ? { Authorization: `Bearer ${opts.token}` } : {}, opts.headers || {}),
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

function signToken(user) {
  return jwt.sign({
    userId: user.id,
    openid: user.openid,
    username: user.nickname || '微信用户'
  }, JWT_SECRET, { expiresIn: '7d' });
}

async function createMysqlConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || LOCAL_ENV.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || LOCAL_ENV.DB_PORT || 3306),
    user: process.env.DB_USER || LOCAL_ENV.DB_USER || 'root',
    password: process.env.DB_PASSWORD || LOCAL_ENV.DB_PASSWORD || '',
    database: process.env.DB_NAME || LOCAL_ENV.DB_NAME || ''
  });
}

async function createUser(connection, openid, nickname) {
  const [result] = await connection.execute(
    'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)',
    [openid, nickname, '']
  );
  return {
    id: Number(result.insertId),
    openid,
    nickname
  };
}

async function createChild(token, payload) {
  return requestJson('/children', {
    method: 'POST',
    token,
    body: payload
  });
}

async function activateTrial(token) {
  return requestJson('/membership/trial/activate', {
    method: 'POST',
    token,
    body: {}
  });
}

async function sendChat(token, message) {
  return requestJson('/chat', {
    method: 'POST',
    token,
    body: {
      message,
      session_id: `verify-chat-${Date.now()}-${Math.random().toString(16).slice(2)}`
    }
  });
}

function summarizeCase(name, data) {
  return {
    name,
    intent: data.intent || '',
    subIntent: data.sub_intent || '',
    riskLevel: data.risk_level || '',
    answerSource: data.answer_source || '',
    matchedTypes: Array.isArray(data.matched_types) ? data.matched_types : [],
    ageGroupUsed: data.age_group_used || '',
    needsChildAge: !!data.needs_child_age,
    childContextSource: data.child_context_source || '',
    sources: Array.isArray(data.sources) ? data.sources.slice(0, 5) : []
  };
}

function assertChatResponseShape(data, name) {
  assertCheck(!!data && typeof data === 'object', `${name} 返回数据为空`, data);
  assertCheck(typeof data.answer === 'string' && data.answer.trim().length >= 12, `${name} 回答内容过短`, data);
  assertCheck(Array.isArray(data.sources), `${name} sources 结构异常`, data);
  assertCheck(Array.isArray(data.matched_types), `${name} matched_types 结构异常`, data);
  assertCheck(!!data.ai_status && typeof data.ai_status === 'object', `${name} ai_status 结构异常`, data);
}

async function bootstrapAgeUser(connection, runId, index) {
  const user = await createUser(connection, `verify_chat_age_${index}_${runId}`, `回测年龄用户${index}`);
  const token = signToken(user);
  await activateTrial(token);
  await createChild(token, {
    name: `回测年龄孩子${index}`,
    gender: 'unknown',
    birthday: '2021-06-01'
  });
  return { user, token };
}

async function main() {
  const runId = `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
  const connection = await createMysqlConnection();

  const missingAgeUser = await createUser(connection, `verify_chat_missing_age_${runId}`, '回测缺龄用户');
  const noProfileUser = await createUser(connection, `verify_chat_no_profile_${runId}`, '回测无档案用户');
  const ageUsers = [];
  for (let index = 1; index <= 3; index += 1) {
    ageUsers.push(await bootstrapAgeUser(connection, runId, index));
  }
  await connection.end();

  const missingAgeToken = signToken(missingAgeUser);
  const noProfileToken = signToken(noProfileUser);

  await activateTrial(missingAgeToken);
  await activateTrial(noProfileToken);

  await createChild(missingAgeToken, {
    name: '回测缺龄孩子',
    gender: 'unknown'
  });

  let ageTokenIndex = 0;
  function nextAgeToken() {
    const current = ageUsers[ageTokenIndex % ageUsers.length];
    ageTokenIndex += 1;
    return current.token;
  }

  const summary = {
    baseUrl: DEFAULT_BASE_URL,
    runId,
    checks: []
  };

  const classroom = await sendChat(nextAgeToken(), '孩子上课坐不住怎么办');
  assertChatResponseShape(classroom, '上课坐不住');
  assertCheck(classroom.sub_intent === 'classroom_focus', '上课坐不住子场景识别失败', classroom);
  assertCheck(classroom.risk_level === 'low', '上课坐不住风险等级异常', classroom);
  assertCheck(Array.isArray(classroom.matched_types) && classroom.matched_types.includes('article') && classroom.matched_types.includes('scene'), '上课坐不住召回类型异常', classroom);
  assertCheck(!classroom.needs_child_age && !!classroom.age_group_used, '上课坐不住年龄命中异常', classroom);
  summary.checks.push(summarizeCase('classroom_focus_with_age', classroom));

  const missingAge = await sendChat(missingAgeToken, '孩子上课坐不住怎么办');
  assertCheck(missingAge.answer_source === 'age_clarification', '缺年龄用户没有进入年龄追问', missingAge);
  assertCheck(!!missingAge.needs_child_age, '缺年龄用户 needs_child_age 异常', missingAge);
  summary.checks.push(summarizeCase('classroom_focus_missing_age', missingAge));

  const noProfile = await sendChat(noProfileToken, '孩子上课坐不住怎么办');
  assertCheck(noProfile.answer_source === 'age_clarification', '无档案用户没有进入年龄追问', noProfile);
  assertCheck(noProfile.child_context_source === 'missing_child_profile', '无档案用户上下文来源异常', noProfile);
  summary.checks.push(summarizeCase('classroom_focus_no_profile', noProfile));

  const reading = await sendChat(nextAgeToken(), '亲子共读后怎么让孩子复述');
  assertChatResponseShape(reading, '亲子共读复述');
  assertCheck(reading.sub_intent === 'shared_reading_retell', '亲子共读复述子场景识别失败', reading);
  assertCheck(reading.matched_types.includes('task') || reading.matched_types.includes('article'), '亲子共读复述未命中阅读知识内容', reading);
  summary.checks.push(summarizeCase('shared_reading_retell', reading));

  const meal = await sendChat(nextAgeToken(), '孩子挑食吃饭怎么办');
  assertChatResponseShape(meal, '挑食吃饭');
  assertCheck(meal.sub_intent === 'meal_refusal', '挑食吃饭子场景识别失败', meal);
  assertCheck(meal.matched_types.includes('article'), '挑食吃饭未命中文章内容', meal);
  summary.checks.push(summarizeCase('meal_refusal', meal));

  const highRisk = await sendChat(nextAgeToken(), '孩子总说不想活还会打自己怎么办');
  assertChatResponseShape(highRisk, '高风险边界');
  assertCheck(highRisk.risk_level === 'high', '高风险识别失败', highRisk);
  assertCheck(/专业人士|就医/.test(String(highRisk.answer || '')), '高风险边界提示缺失', highRisk);
  summary.checks.push(summarizeCase('high_risk_boundary', highRisk));

  const bedtime = await sendChat(nextAgeToken(), '孩子睡前洗漱特别磨蹭怎么办');
  assertChatResponseShape(bedtime, '睡前洗漱');
  assertCheck(bedtime.sub_intent === 'bedtime_routine', '睡前洗漱子场景识别失败', bedtime);
  assertCheck(bedtime.matched_types.includes('scene'), '睡前洗漱未命中场景内容', bedtime);
  summary.checks.push(summarizeCase('bedtime_routine', bedtime));

  const emotion = await sendChat(nextAgeToken(), '孩子总发脾气哭闹怎么办');
  assertChatResponseShape(emotion, '情绪爆发');
  assertCheck(emotion.sub_intent === 'emotional_outburst', '情绪爆发子场景识别失败', emotion);
  summary.checks.push(summarizeCase('emotional_outburst', emotion));

  const assessment = await sendChat(nextAgeToken(), '怀疑孩子多动和发育迟缓要不要看医生');
  assertChatResponseShape(assessment, '多动发育疑虑');
  assertCheck(assessment.intent === 'assessment', '多动发育疑虑未进入 assessment', assessment);
  assertCheck(assessment.risk_level === 'medium', '多动发育疑虑风险等级异常', assessment);
  assertCheck(assessment.matched_types.includes('assessment'), '多动发育疑虑未命中观察量表', assessment);
  summary.checks.push(summarizeCase('development_assessment', assessment));

  const pregnancyExercise = await sendChat(nextAgeToken(), '孕期每天锻炼30分钟有什么好处');
  assertChatResponseShape(pregnancyExercise, '孕期锻炼');
  assertCheck(pregnancyExercise.matched_types.includes('article'), '孕期锻炼问句未命中文章内容', pregnancyExercise);
  assertCheck((pregnancyExercise.sources || []).some((title) => {
    const sourceTitle = String(title || '');
    return sourceTitle.includes('4 每天锻炼30分钟') || /(孕期|胎教|胎儿|怀孕|妊娠)/.test(sourceTitle);
  }), '孕期锻炼问句未命中孕期相关知识源', pregnancyExercise);
  summary.checks.push(summarizeCase('raw_text_zero_to_five', pregnancyExercise));

  const emotionalNeglect = await sendChat(nextAgeToken(), '情感忽视需要治疗吗');
  assertChatResponseShape(emotionalNeglect, '情感忽视');
  assertCheck(emotionalNeglect.matched_types.includes('article'), '情感忽视问句未命中文章内容', emotionalNeglect);
  assertCheck((emotionalNeglect.sources || []).some((title) => /情感忽视|第2章 造成情感忽视|第9章 给治疗师/.test(String(title))), '情感忽视问句未命中 被忽视的孩子 原始书稿标题', emotionalNeglect);
  summary.checks.push(summarizeCase('raw_text_emotional_neglect', emotionalNeglect));

  const agelessBrain = await sendChat(nextAgeToken(), '怎么打造不老大脑');
  assertChatResponseShape(agelessBrain, '不老大脑');
  assertCheck(agelessBrain.matched_types.includes('article'), '不老大脑问句未命中文章内容', agelessBrain);
  assertCheck((agelessBrain.sources || []).some((title) => String(title).includes('第十二章 打造不老大脑的成功案例')), '不老大脑问句未命中 不老大脑 原始书稿标题', agelessBrain);
  summary.checks.push(summarizeCase('raw_text_ageless_brain', agelessBrain));

  const bedtimeTask = await sendChat(nextAgeToken(), '怎么和孩子一起做睡前流程图');
  assertChatResponseShape(bedtimeTask, '睡前流程图');
  assertCheck(bedtimeTask.matched_types.includes('task'), '睡前流程图问句未命中新任务内容', bedtimeTask);
  assertCheck((bedtimeTask.sources || []).some((title) => /就寝流程图|睡前流程建立/.test(String(title))), '睡前流程图问句未命中第六批任务或场景标题', bedtimeTask);
  summary.checks.push(summarizeCase('batch6_bedtime_task', bedtimeTask));

  const babySignTask = await sendChat(nextAgeToken(), '宝宝不会说话前能学手语吗');
  assertChatResponseShape(babySignTask, '宝宝手语');
  assertCheck(babySignTask.matched_types.includes('task'), '宝宝手语问句未命中新任务内容', babySignTask);
  assertCheck((babySignTask.sources || []).some((title) => /宝宝手语入门训练|教宝宝学手语/.test(String(title))), '宝宝手语问句未命中第六批任务或文章标题', babySignTask);
  summary.checks.push(summarizeCase('batch6_sign_language_task', babySignTask));

  const emotionTask = await sendChat(nextAgeToken(), '孩子情绪崩溃时怎么替他说出情绪');
  assertChatResponseShape(emotionTask, '情绪替说');
  assertCheck(emotionTask.matched_types.includes('task'), '情绪替说问句未命中新任务内容', emotionTask);
  assertCheck((emotionTask.sources || []).some((title) => /替孩子说出情绪练习|说出情绪/.test(String(title))), '情绪替说问句未命中第六批任务或文章标题', emotionTask);
  summary.checks.push(summarizeCase('batch6_emotion_task', emotionTask));

  writeOutput({ ok: true, ...summary });
}

main().catch((err) => {
  writeOutput({
    ok: false,
    baseUrl: DEFAULT_BASE_URL,
    message: err.message,
    detail: err.payload || null
  });
  process.exit(1);
});
