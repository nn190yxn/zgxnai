#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ACTION_PATTERNS = [
  { regex: /可以(试着|尝试|让|用|通过|跟|和|给)/, score: 1 },
  { regex: /让孩子|帮孩子|帮助孩子|给孩子/, score: 1 },
  { regex: /第[一二三四五六七八九]步|先做|然后|最后/, score: 1 },
  { regex: /每天|每次|坚持|定期|每周/, score: 1 },
  { regex: /用(手指|手掌|手|玩具|绘本|故事|游戏)/, score: 1 },
  { regex: /和孩子一起|陪孩子|带着孩子|跟孩子/, score: 1 },
  { regex: /告诉孩子|跟孩子说|对孩子说/, score: 1 },
  { regex: /试试看|不妨|最好要/, score: 1 },
  { regex: /准备|材料|需要|工具/, score: 1 },
  { regex: /鼓励|表扬|肯定|赞美/, score: 1 },
  { regex: /不要|别让|少给|少用|少放/, score: 1 },
  { regex: /培养|锻炼|训练|练习/, score: 1 },
  { regex: /注意|避免|防止|小心/, score: 1 },
  { regex: /方法|技巧|窍门|妙招/, score: 1 },
  { regex: /建议|推荐/, score: 1 },
  { regex: /具体|做法|步骤|操作/, score: 1 },
  { regex: /把|先/, score: 0.5 }
];

const NEGATIVE_PATTERNS = [
  /但是|然而|不过|可是|却/,
  /指的是|什么是|意思是|即/,
  /研究表明|数据表明|调查发现|实验表明/,
  /理论|概念|规律|机制|原理|定义/,
  /研究发现|观察到|证实了/,
  /发展心理学|认知心理学|教育心理学/,
  /皮亚杰|蒙台梭利|维果茨基|埃里克森/
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

function extractFirstActionSentence(content) {
  const text = String(content || '');
  const sentences = text.split(/[。！？\n]+/);
  for (const sent of sentences) {
    const s = sent.trim();
    if (!s || s.length < 8) continue;
    for (const p of ACTION_PATTERNS) {
      if (p.regex.test(s)) return s;
    }
  }
  const first = sentences[0]?.trim() || '';
  return first.length > 200 ? first.slice(0, 197) + '...' : first;
}

function extractWhyText(content) {
  const text = String(content || '');
  const causal = text.match(/(因为[^。！？\n]{10,80})/);
  if (causal) return causal[1].slice(0, 120);
  const purpose = text.match(/(这[能会可]让[^。！？\n]{10,80})/);
  if (purpose) return purpose[1].slice(0, 120);
  const result = text.match(/(目的是[^。！？\n]{10,80})/);
  if (result) return result[1].slice(0, 120);
  const reason = text.match(/(原因是[^。！？\n]{10,80})/);
  if (reason) return reason[1].slice(0, 120);
  return null;
}

function trimTitle(title) {
  let t = String(title || '').trim();
  if (t.length <= 40) return t;
  t = t.slice(0, 37) + '...';
  return t;
}

function classifyTip(row) {
  const content = String(row.content || '');
  const contentType = String(row.content_type || '').toLowerCase();

  let actionScore = 0;
  for (const p of ACTION_PATTERNS) {
    if (p.regex.test(content)) actionScore += p.score;
  }

  let theoryScore = 0;
  for (const p of NEGATIVE_PATTERNS) {
    if (p.test(content)) theoryScore += 1;
  }

  if (contentType === 'actionable' || contentType === 'stepwise') {
    actionScore += 6;
  }
  if (contentType === 'knowledge' || contentType === 'caution' || contentType === 'evidence') {
    theoryScore += 6;
  }

  const totalScore = actionScore + theoryScore;
  if (totalScore < 2) {
    return {
      display_type: 'raw',
      display_title: null,
      display_text: null,
      display_source_type: 'article',
      display_source_id: row.source_article_id || null
    };
  }

  if (actionScore > theoryScore + 1) {
    const actionSentence = extractFirstActionSentence(content);
    const whyText = extractWhyText(content);
    let displayText = actionSentence.slice(0, 120);
    if (whyText) {
      const remain = 200 - displayText.length - 2;
      if (remain > 10) {
        displayText += '——' + whyText.slice(0, remain);
      }
    }
    return {
      display_type: 'action',
      display_title: trimTitle(actionSentence),
      display_text: displayText.slice(0, 200),
      display_source_type: 'article',
      display_source_id: row.source_article_id || null
    };
  }

  if (theoryScore > actionScore + 1) {
    return {
      display_type: 'insight',
      display_title: null,
      display_text: null,
      display_source_type: 'article',
      display_source_id: row.source_article_id || null
    };
  }

  return {
    display_type: 'raw',
    display_title: null,
    display_text: null,
    display_source_type: 'article',
    display_source_id: row.source_article_id || null
  };
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
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM parenting_tips WHERE is_active = 1');
    console.log(`[tips-structure] total_active=${total} batch_size=${batchSize}${dryRun ? ' mode=dry-run' : ''}`);

    const stats = { action: 0, insight: 0, raw: 0 };
    let offset = 0;

    while (offset < total) {
      const safeLimit = Number.parseInt(batchSize, 10);
      const safeOffset = Number.parseInt(offset, 10);
      const [rows] = await pool.query(
        `SELECT * FROM parenting_tips WHERE is_active = 1 ORDER BY id LIMIT ${safeLimit} OFFSET ${safeOffset}`
      );

      if (!rows.length) break;

      const updates = [];
      for (const row of rows) {
        const result = classifyTip(row);
        stats[result.display_type]++;

        if (!dryRun && result.display_type !== 'raw') {
          updates.push({
            id: row.id,
            display_type: result.display_type,
            display_title: result.display_title,
            display_text: result.display_text ? result.display_text.slice(0, 400) : null,
            display_source_type: result.display_source_type,
            display_source_id: result.display_source_id
          });
        }
      }

      if (!dryRun && updates.length) {
        const conn = await pool.getConnection();
        try {
          for (const u of updates) {
            await conn.execute(
              `UPDATE parenting_tips SET display_type = ?, display_title = ?, display_text = ?, display_source_type = ?, display_source_id = ? WHERE id = ?`,
              [u.display_type, u.display_title, u.display_text, u.display_source_type, u.display_source_id, u.id]
            );
          }
        } finally {
          conn.release();
        }
      }

      offset += batchSize;
    }

    const pct = (n) => ((n / total) * 100).toFixed(1) + '%';
    console.log(`[tips-structure] action=${stats.action} (${pct(stats.action)}) insight=${stats.insight} (${pct(stats.insight)}) raw=${stats.raw} (${pct(stats.raw)})`);

    if (dryRun) {
      console.log('[tips-structure] dry-run complete (no writes)');
    } else {
      const rawPct = (stats.raw / total) * 100;
      if (rawPct > 15) {
        console.warn(`[tips-structure] WARNING raw_ratio=${rawPct.toFixed(1)}% exceeds 15% threshold`);
      }
      console.log('[tips-structure] done');
    }

    if (!dryRun) {
      const [[{ actionNonNull }]] = await pool.execute(
        "SELECT COUNT(*) AS actionNonNull FROM parenting_tips WHERE display_type = 'action' AND display_title IS NOT NULL"
      );
      const [[{ actionTotal }]] = await pool.execute(
        "SELECT COUNT(*) AS actionTotal FROM parenting_tips WHERE display_type = 'action'"
      );
      if (actionTotal > 0) {
        const filledPct = ((actionNonNull / actionTotal) * 100).toFixed(1);
        console.log(`[tips-structure] action_title_filled=${actionNonNull}/${actionTotal} (${filledPct}%)`);
        if (filledPct < 95) {
          console.warn(`[tips-structure] WARNING action_title_filled ${filledPct}% below 95% threshold`);
        }
      }
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[tips-structure] FATAL', err.message);
  process.exit(1);
});
