#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const THEORY_PATTERNS = [
  { regex: /研究(表明|发现|指出|显示|证实)/, score: 1 },
  { regex: /实验(表明|发现|研究)/, score: 1 },
  { regex: /调查(发现|表明|显示)/, score: 1 },
  { regex: /是指|指的是|概念|定义|理论|框架/, score: 1 },
  { regex: /发育|成熟|阶段|规律|机制/, score: 1 },
  { regex: /前额叶|大脑|神经|皮层|激素|基因/, score: 1 },
  { regex: /EEG|fMRI|实验|测量|统计|样本/, score: 1 },
  { regex: /心理学|教育学|神经科学|认知科学/, score: 1 },
  { regex: /为什么|原因|根源|本质/, score: 1 },
  { regex: /知识|认知|理解|原理|体系/, score: 1 }
];

const METHOD_PATTERNS = [
  { regex: /第一步|第二步|第[一二三四五六七八九]步/, score: 1 },
  { regex: /可以(试着|尝试|让|用|通过|跟|和|给)/, score: 1 },
  { regex: /让孩子|帮孩子|帮助孩子|给孩子/, score: 1 },
  { regex: /每天(做|带|陪|练)|坚持|定期/, score: 1 },
  { regex: /准备|材料|工具|时间|场地|前提/, score: 1 },
  { regex: /注意|避免|不要|当心|小心|防止/, score: 1 },
  { regex: /比如|例如|示范|话术|这么说|这样跟孩子说/, score: 1 },
  { regex: /具体做法|操作步骤|怎么做|怎么办|试试看/, score: 1 },
  { regex: /鼓励|表扬|肯定|赞美/, score: 1 },
  { regex: /培养|锻炼|训练|练习|陪练/, score: 1 },
  { regex: /方法|技巧|窍门|妙招|策略/, score: 1 },
  { regex: /建议|推荐|方案/, score: 1 }
];

function loadEnv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0 || line.startsWith('#')) continue;
    const key = line.slice(0, eqIdx).trim();
    if (!process.env[key]) process.env[key] = line.slice(eqIdx + 1).trim();
  }
}

function requireMysqlPromise() {
  try {
    return require('mysql2/promise');
  } catch (err) {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'mysql2/promise'));
  }
}

function classifyArticle(row) {
  const text = [row.title, row.summary, row.content].filter(Boolean).join(' ');
  const len = text.length;

  let theoryScore = 0;
  for (const p of THEORY_PATTERNS) {
    if (p.regex.test(text)) theoryScore += p.score;
  }

  let methodScore = 0;
  for (const p of METHOD_PATTERNS) {
    if (p.regex.test(text)) methodScore += p.score;
  }

  const combinedScore = theoryScore + methodScore;
  const isShort = len < 300;

  if (combinedScore < 2) return null;

  if (theoryScore >= 2 && methodScore === 0) return 'theory';
  if (methodScore >= 2 && theoryScore === 0) return 'method';
  if (isShort) {
    return theoryScore >= methodScore ? 'theory' : 'method';
  }
  if (theoryScore >= 2 && methodScore >= 2) return 'both';
  if (theoryScore >= 2) return 'theory';
  if (methodScore >= 2) return 'method';
  return null;
}

function buildLimitOffsetClause(limit, offset) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 200, 1000));
  const safeOffset = Math.max(0, Number(offset) || 0);
  return `LIMIT ${safeLimit} OFFSET ${safeOffset}`;
}

async function main() {
  loadEnv(path.resolve(__dirname, '../../../.env'));
  loadEnv('/home/ubuntu/niuniu-parenting/.env');

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

  const dryRun = process.argv.includes('--dry-run');
  const batchSize = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '200', 10);

  try {
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM articles WHERE is_published = 1');
    console.log(`[articles-form] total_published=${total} batch_size=${batchSize}${dryRun ? ' mode=dry-run' : ''}`);

    const stats = { theory: 0, method: 0, both: 0, null: 0 };
    let offset = 0;

    while (offset < total) {
      const [rows] = await pool.execute(
        `SELECT id, title, summary, content FROM articles WHERE is_published = 1 ORDER BY id ${buildLimitOffsetClause(batchSize, offset)}`
      );

      if (!rows.length) break;

      if (!dryRun) {
        const conn = await pool.getConnection();
        try {
          for (const row of rows) {
            const form = classifyArticle(row);
            const key = form || 'null';
            stats[key]++;
            await conn.execute(
              'UPDATE articles SET content_form = ? WHERE id = ?',
              [form, row.id]
            );
          }
        } finally {
          conn.release();
        }
      } else {
        for (const row of rows) {
          const form = classifyArticle(row);
          const key = form || 'null';
          stats[key]++;
        }
      }

      offset += batchSize;
    }

    const pct = (n) => ((n / total) * 100).toFixed(1) + '%';
    console.log(`[articles-form] theory=${stats.theory} (${pct(stats.theory)}) method=${stats.method} (${pct(stats.method)}) both=${stats.both} (${pct(stats.both)}) unclassified=${stats.null} (${pct(stats.null)})`);

    if (dryRun) {
      console.log('[articles-form] dry-run complete (no writes)');
    } else {
      const nullPct = (stats.null / total) * 100;
      if (nullPct > 30) {
        console.warn(`[articles-form] WARNING unclassified_ratio=${nullPct.toFixed(1)}% exceeds 30%`);
      }
      console.log('[articles-form] done');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[articles-form] FATAL', err.message);
  process.exit(1);
});
