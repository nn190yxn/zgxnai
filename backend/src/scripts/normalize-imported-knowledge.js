#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const SOURCE_LABELS = [
  '蒙台梭利早期教育法',
  '蒙台梭利儿童教育手册',
  '儿童的自发成长',
  '童年的秘密',
  '发现孩子',
  '有吸收力的心灵',
  '真希望我父母读过这本书',
  '0到5岁大脑发育的黄金法则',
  '不老大脑',
  '崔玉涛自然养育法',
  '被忽视的孩子'
];

const VALID_AGE_GROUPS = new Set([
  '0-1岁',
  '1-2岁',
  '2-3岁',
  '3-4岁',
  '4-5岁',
  '5-6岁',
  '6-9岁',
  '9-12岁'
]);

main().catch((error) => {
  console.error('[knowledge-normalize]', formatError(error));
  process.exit(1);
});

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const mysql = requireMysqlPromise();
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0
  });

  try {
    const articleRows = await fetchImportedArticles(pool);
    const taskRows = await fetchImportedTasks(pool);

    const articleSummary = await normalizeArticles(pool, articleRows, { dryRun });
    const taskSummary = await normalizeTasks(pool, taskRows, { dryRun });

    console.log(`[knowledge-normalize] mode=${dryRun ? 'dry-run' : 'apply'}`);
    console.log(`[knowledge-normalize] imported_articles=${articleRows.length} imported_tasks=${taskRows.length}`);
    console.log(`[knowledge-normalize] article_updated=${articleSummary.updated} article_unchanged=${articleSummary.unchanged}`);
    console.log(`[knowledge-normalize] task_updated=${taskSummary.updated} task_unchanged=${taskSummary.unchanged}`);
  } finally {
    await pool.end();
  }
}

function requireMysqlPromise() {
  try {
    return require('mysql2/promise');
  } catch (error) {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'mysql2/promise'));
  }
}

async function fetchImportedArticles(pool) {
  const where = SOURCE_LABELS.map(() => 'tags LIKE ?').join(' OR ');
  const params = SOURCE_LABELS.map((label) => `%${label}%`);
  const [rows] = await pool.execute(
    `SELECT id, title, summary, content, category, sub_category, age_group, tags, author, evidence_level
       FROM articles
      WHERE ${where}
      ORDER BY id ASC`,
    params
  );
  return rows;
}

async function fetchImportedTasks(pool) {
  const where = SOURCE_LABELS.map(() => 'tips LIKE ?').join(' OR ');
  const params = SOURCE_LABELS.map((label) => `%知识库来源：${label}%`);
  const [rows] = await pool.execute(
    `SELECT id, task_code, title, subject_code, age_range, difficulty, duration, material, objective, steps, parent_prompt, content, tips, example_answer
       FROM reading_tasks
      WHERE ${where}
      ORDER BY id ASC`,
    params
  );
  return rows;
}

async function normalizeArticles(pool, rows, options) {
  const summary = { updated: 0, unchanged: 0 };
  for (const row of rows) {
    const next = normalizeImportedArticle(row);
    if (isArticleSame(row, next)) {
      summary.unchanged += 1;
      continue;
    }

    summary.updated += 1;
    if (options.dryRun) {
      continue;
    }

    await pool.execute(
      `UPDATE articles
          SET summary = ?, content = ?, category = ?, sub_category = ?, age_group = ?, tags = ?, author = ?, evidence_level = ?
        WHERE id = ?`,
      [next.summary, next.content, next.category, next.subCategory, next.ageGroup, next.tags, next.author, next.evidenceLevel, row.id]
    );
  }
  return summary;
}

async function normalizeTasks(pool, rows, options) {
  const summary = { updated: 0, unchanged: 0 };
  for (const row of rows) {
    const next = normalizeImportedTask(row);
    if (isTaskSame(row, next)) {
      summary.unchanged += 1;
      continue;
    }

    summary.updated += 1;
    if (options.dryRun) {
      continue;
    }

    await pool.execute(
      `UPDATE reading_tasks
          SET age_range = ?, difficulty = ?, duration = ?, material = ?, objective = ?, steps = ?, parent_prompt = ?, content = ?, tips = ?, example_answer = ?
        WHERE id = ?`,
      [next.ageRange, next.difficulty, next.duration, next.material, next.objective, next.steps, next.parentPrompt, next.content, next.tips, next.exampleAnswer, row.id]
    );
  }
  return summary;
}

function normalizeImportedArticle(row) {
  const tags = splitList(row.tags, /[,\n]/);
  const sourceLabel = inferSourceLabel(tags, row.content);
  const meta = parseMetaBlock(row.content, row.age_group);
  const body = normalizeBodyText(stripMetaBlock(row.content));
  const isQa = /^问题：/m.test(body) || tags.includes('问答');
  const title = String(row.title || '').trim();
  const category = String(row.category || '').trim();
  const subCategory = String(row.sub_category || '').trim();
  const author = String(row.author || '').trim();
  const evidenceLevel = String(row.evidence_level || '').trim();

  const question = isQa ? extractQuestion(title, body) : '';
  const answer = isQa ? extractAnswer(body) : '';
  const ageText = meta.ageText || inferAgeText(tags, row.age_group);
  const sceneText = meta.sceneText || inferSceneText(tags);
  const sourceText = meta.sourceText || sourceLabel;
  const usageHint = buildArticleUsageHint(category, sceneText, title);
  const summarySource = isQa ? answer : body;
  const summary = buildArticleSummary(summarySource, ageText, sceneText);
  const content = buildArticleContent({
    isQa,
    title,
    question,
    answer,
    body,
    ageText,
    sceneText,
    sourceText,
    usageHint
  });
  const ageGroup = normalizeSingleAgeGroup(ageText);
  const mergedTags = buildArticleTags({ title, category, subCategory, tags, ageText, sceneText, sourceLabel, body, isQa });

  return {
    summary,
    content,
    category,
    subCategory,
    ageGroup,
    tags: mergedTags.join(','),
    author,
    evidenceLevel
  };
}

function normalizeImportedTask(row) {
  const title = String(row.title || '').trim();
  const material = String(row.material || '').trim();
  const sourceLabel = inferSourceLabel([], row.tips || row.content);
  const meta = parseTaskMeta(row);
  const ageText = meta.ageText || normalizeAgeText(String(row.age_range || '').trim());
  const sceneText = meta.sceneText;
  const sourceText = meta.sourceText || sourceLabel;
  const rawSteps = splitTaskSteps(row.steps || row.content);
  const steps = normalizeStepLines(rawSteps);
  const objective = buildTaskObjective(title, material, sceneText);
  const parentPrompt = buildTaskParentPrompt(sceneText, title);
  const tips = buildTaskTips({ ageText, sceneText, sourceLabel, title, material, content: row.content, parentPrompt });
  const content = buildTaskContent({ title, objective, steps, parentPrompt, ageText, sceneText, sourceText });

  return {
    ageRange: normalizeSingleAgeGroup(ageText),
    difficulty: Number(row.difficulty || 1),
    duration: Number(row.duration || inferDurationFromText(row.content) || 10),
    material,
    objective,
    steps: steps.join('\n'),
    parentPrompt,
    content,
    tips: tips.join('\n'),
    exampleAnswer: String(row.example_answer || '').trim()
  };
}

function buildArticleSummary(text, ageText, sceneText) {
  const core = truncateText(firstUsefulSentence(text), 72);
  const prefix = [];
  if (ageText) {
    prefix.push(`适用年龄：${ageText}`);
  }
  if (sceneText) {
    prefix.push(`适用场景：${truncateText(sceneText, 18)}`);
  }
  return prefix.concat(core || '适合家长在日常场景里直接使用。').join('。') + '。';
}

function buildArticleContent({ isQa, question, answer, body, ageText, sceneText, sourceText, usageHint }) {
  const sections = [];
  if (isQa) {
    sections.push(`问题：\n${question}`);
    sections.push(`回答：\n${answer}`);
  } else {
    sections.push(`核心内容：\n${body}`);
  }
  sections.push(`家长使用提示：\n${usageHint}`);
  sections.push(buildMetaBlock(ageText, sceneText, sourceText));
  return sections.filter(Boolean).join('\n\n');
}

function buildTaskContent({ objective, steps, parentPrompt, ageText, sceneText, sourceText }) {
  const lines = [];
  lines.push(`练习目标：\n${objective}`);
  if (steps.length) {
    lines.push(`操作步骤：\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}`);
  }
  lines.push(`家长提示：\n${parentPrompt}`);
  lines.push(buildMetaBlock(ageText, sceneText, sourceText));
  return lines.filter(Boolean).join('\n\n');
}

function buildMetaBlock(ageText, sceneText, sourceText) {
  const metaLines = [];
  if (ageText) {
    metaLines.push(`适用年龄：${ageText}`);
  }
  if (sceneText) {
    metaLines.push(`适用场景：${sceneText}`);
  }
  if (sourceText) {
    metaLines.push(`来源：${sourceText}`);
  }
  return metaLines.join('\n');
}

function buildArticleUsageHint(category, sceneText, title) {
  const sceneLead = sceneText ? `先在${firstScene(sceneText)}这个小场景里` : '先在一个固定小场景里';
  if (category === '情绪管理') {
    return `${sceneLead}接住孩子当下的感受，再用一句短话把边界说清楚。`;
  }
  if (category === '行为习惯') {
    return `${sceneLead}稳住节奏，再把要求缩成一句孩子马上能做到的话。`;
  }
  if (category === '社交能力' || category === '亲子关系') {
    return `${sceneLead}先描述事实和感受，再带孩子练一句更合适的表达。`;
  }
  if (category === '语言发展' || category === '认知发展' || category === '教育方法' || category === '科学观察' || category === '吸收性心智') {
    return `${sceneLead}先做一次短时间示范，再留给孩子自己观察、表达或重复。`;
  }
  if (category === '运动发展' || category === '感觉训练') {
    return `${sceneLead}先让孩子动起来，再根据反应慢慢加一点点难度。`;
  }
  return `${sceneLead}先用一次，再连续观察 3 到 7 天的变化。`;
}

function buildTaskObjective(title, material, sceneText) {
  const category = String(material || '').split('/')[0].trim();
  const sceneLead = sceneText ? `在${firstScene(sceneText)}里` : '在家庭日常里';
  if (category) {
    return `帮助孩子${sceneLead}练习${category}，把“${title}”变成一次马上能开始的小练习。`;
  }
  return `帮助孩子${sceneLead}把“${title}”练熟，先从一轮短时练习开始。`;
}

function buildTaskParentPrompt(sceneText, title) {
  if (sceneText) {
    return `先在${firstScene(sceneText)}里陪孩子做第一步，只给一句提示，再把节奏慢慢交给孩子。`;
  }
  return `先陪孩子把“${title}”做出第一步，等孩子进入状态后再退后观察。`;
}

function buildTaskTips({ ageText, sceneText, sourceLabel, title, material, content, parentPrompt }) {
  const lines = [];
  if (ageText) {
    lines.push(`原始适用年龄：${ageText}`);
  }
  if (sceneText) {
    lines.push(`适用场景：${sceneText}`);
  }
  if (sourceLabel) {
    lines.push(`知识库来源：${sourceLabel}`);
  }
  const searchPhrases = buildSearchPhrases(title, `${material} ${content} ${parentPrompt}`);
  if (searchPhrases.length) {
    lines.push(`常见问法：${searchPhrases.slice(0, 6).join('、')}`);
  }
  return lines;
}

function buildArticleTags({ title, category, subCategory, tags, ageText, sceneText, sourceLabel, body, isQa }) {
  const merged = [];
  pushUnique(merged, tags);
  pushUnique(merged, [category, subCategory, sourceLabel]);
  pushUnique(merged, splitList(ageText, /、/));
  pushUnique(merged, splitList(sceneText, /、/));
  pushUnique(merged, buildSearchPhrases(title, body));
  if (isQa) {
    pushUnique(merged, ['问答']);
  }
  return merged.filter(Boolean).slice(0, 22);
}

function buildSearchPhrases(title, text) {
  const values = [];
  const normalizedTitle = normalizeShortText(title).replace(/[？?！!]/g, '');
  if (normalizedTitle) {
    values.push(normalizedTitle);
  }

  const combined = `${title} ${text}`;
  const patterns = [
    '坐不住', '动来动去', '不听话', '发脾气', '对孩子发火', '控制不住脾气', '亲子沟通', '夫妻争吵',
    '孩子哭闹', '不想上学', '吃饭', '边吃边玩', '写作业', '专注力', '注意力', '亲子共读', '复述',
    '分离焦虑', '怕黑', '独自睡觉', '孩子打人', '说谎', '谈死亡', '上幼儿园', '情绪管理', '感受确认'
  ];
  for (const pattern of patterns) {
    if (combined.includes(pattern)) {
      values.push(pattern);
    }
  }

  const titleParts = normalizedTitle.split(/[：:，,]/).map((item) => item.trim()).filter(Boolean);
  pushUnique(values, titleParts);
  return Array.from(new Set(values.filter((item) => item && item.length >= 2)));
}

function parseMetaBlock(content, ageGroup) {
  const paragraphs = String(content || '').split(/\n\n+/).map((item) => item.trim()).filter(Boolean);
  const last = paragraphs.length ? paragraphs[paragraphs.length - 1] : '';
  const lines = last.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  const ageText = findMetaValue(lines, '适用年龄') || normalizeAgeText(ageGroup);
  const sceneText = findMetaValue(lines, '适用场景');
  const sourceText = findMetaValue(lines, '来源');
  return { ageText, sceneText, sourceText };
}

function parseTaskMeta(row) {
  const tipLines = splitList(row.tips, /\n/);
  const contentMeta = parseMetaBlock(row.content, row.age_range);
  return {
    ageText: findMetaValue(tipLines, '原始适用年龄') || contentMeta.ageText,
    sceneText: findMetaValue(tipLines, '适用场景') || contentMeta.sceneText || inferSceneText([row.material]),
    sourceText: findMetaValue(tipLines, '来源') || contentMeta.sourceText || inferSourceLabel([], row.tips || row.content)
  };
}

function stripMetaBlock(content) {
  const paragraphs = String(content || '').split(/\n\n+/).map((item) => item.trim()).filter(Boolean);
  if (!paragraphs.length) {
    return '';
  }
  const last = paragraphs[paragraphs.length - 1];
  const lines = last.split(/\n+/).map((item) => item.trim()).filter(Boolean);
  if (lines.length && lines.every((line) => /^(适用年龄|适用场景|来源)：/.test(line))) {
    paragraphs.pop();
  }
  return paragraphs.join('\n\n').trim();
}

function extractQuestion(title, body) {
  const match = body.match(/问题：\s*([\s\S]*?)\n\n回答：/);
  return normalizeShortText(match ? match[1] : title);
}

function extractAnswer(body) {
  const match = body.match(/回答：\s*([\s\S]*)$/);
  return normalizeBodyText(match ? match[1] : body);
}

function inferSourceLabel(tags, text) {
  for (const label of SOURCE_LABELS) {
    if (tags.includes(label) || String(text || '').includes(label)) {
      return label;
    }
  }
  return '';
}

function inferAgeText(tags, ageGroup) {
  const ages = tags.filter((tag) => VALID_AGE_GROUPS.has(tag));
  if (ages.length) {
    return Array.from(new Set(ages)).join('、');
  }
  return normalizeAgeText(ageGroup);
}

function inferSceneText(tags) {
  const sceneTags = tags.filter((tag) => {
    return tag && /场景|互动|哭闹|发脾气|不听话|吃饭|睡前|上学|公园|幼儿园|写作业|家庭|亲子|共读|沟通|活动/.test(tag);
  });
  return Array.from(new Set(sceneTags)).slice(0, 4).join('、');
}

function splitTaskSteps(value) {
  const text = String(value || '').trim();
  if (!text) {
    return [];
  }
  const cleaned = text
    .replace(/^练习目标：[\s\S]*?操作步骤：/m, '')
    .replace(/^步骤：/m, '')
    .trim();
  const numbered = cleaned.split(/(?:^|\n)\d+[\.、]/).map((item) => item.trim()).filter(Boolean);
  if (numbered.length >= 2) {
    return numbered;
  }
  return cleaned
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeStepLines(lines) {
  return lines
    .map((line) => normalizeShortText(line.replace(/^[-•]\s*/, '')))
    .filter(Boolean)
    .slice(0, 6);
}

function firstUsefulSentence(text) {
  const normalized = normalizeBodyText(text)
    .replace(/^问题：.*?回答：/s, '')
    .trim();
  const parts = normalized.split(/[。！？!?]/).map((item) => item.trim()).filter(Boolean);
  return parts[0] || normalized;
}

function normalizeBodyText(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/→/g, '，再')
    .replace(/->/g, '，再')
    .replace(/\s*\/\s*/g, '、')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeShortText(text) {
  return normalizeBodyText(text).replace(/\n+/g, ' ').trim();
}

function normalizeAgeText(text) {
  const values = splitList(text, /[、,\n]/).filter((item) => VALID_AGE_GROUPS.has(item));
  return Array.from(new Set(values)).join('、');
}

function normalizeSingleAgeGroup(ageText) {
  const values = splitList(ageText, /、/).filter((item) => VALID_AGE_GROUPS.has(item));
  return values.length === 1 ? values[0] : '';
}

function inferDurationFromText(text) {
  const match = String(text || '').match(/(\d+)\s*分钟/);
  return match ? Number(match[1]) : 0;
}

function findMetaValue(lines, label) {
  const line = lines.find((item) => item.startsWith(`${label}：`));
  return line ? line.slice(label.length + 1).trim() : '';
}

function splitList(value, pattern) {
  return String(value || '')
    .split(pattern)
    .map((item) => item.trim())
    .filter(Boolean);
}

function firstScene(sceneText) {
  return splitList(sceneText, /、/)[0] || '当前场景';
}

function truncateText(text, limit) {
  const normalized = normalizeShortText(text);
  if (normalized.length <= limit) {
    return normalized;
  }
  return normalized.slice(0, Math.max(0, limit - 3)).trim() + '...';
}

function pushUnique(target, values) {
  const list = Array.isArray(values) ? values : [values];
  for (const value of list) {
    const normalized = String(value || '').trim();
    if (!normalized || target.includes(normalized)) {
      continue;
    }
    target.push(normalized);
  }
}

function isArticleSame(row, next) {
  return String(row.summary || '') === next.summary
    && String(row.content || '') === next.content
    && String(row.category || '') === next.category
    && String(row.sub_category || '') === next.subCategory
    && String(row.age_group || '') === next.ageGroup
    && String(row.tags || '') === next.tags
    && String(row.author || '') === next.author
    && String(row.evidence_level || '') === next.evidenceLevel;
}

function isTaskSame(row, next) {
  return String(row.age_range || '') === next.ageRange
    && Number(row.difficulty || 0) === next.difficulty
    && Number(row.duration || 0) === next.duration
    && String(row.material || '') === next.material
    && String(row.objective || '') === next.objective
    && String(row.steps || '') === next.steps
    && String(row.parent_prompt || '') === next.parentPrompt
    && String(row.content || '') === next.content
    && String(row.tips || '') === next.tips
    && String(row.example_answer || '') === next.exampleAnswer;
}

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

function formatError(error) {
  if (!error) {
    return 'unknown error';
  }
  if (error.message) {
    return error.message;
  }
  return String(error);
}
