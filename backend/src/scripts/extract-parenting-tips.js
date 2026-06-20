#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const SCENE_KEYWORDS = {
  '吃饭': ['吃饭', '挑食', '喂饭', '辅食', '餐桌', '零食', '营养', '饮食', '进食', '饭菜', '胃口', '偏食'],
  '睡觉': ['睡觉', '入睡', '睡眠', '睡前', '起床', '午睡', '夜醒', '哄睡', '熬夜', '就寝'],
  '写作业': ['作业', '学习', '写字', '读书', '功课', '复习', '预习', '考试', '成绩'],
  '出门': ['出门', '外出', '上学', '幼儿园', '学校', '社交', '朋友', '玩耍'],
  '情绪': ['情绪', '发脾气', '哭闹', '生气', '焦虑', '害怕', '紧张', '沮丧', '委屈', '伤心', '烦躁'],
  '亲子互动': ['陪伴', '游戏', '亲子', '玩耍', '聊天', '沟通', '对话', '拥抱', '共读'],
  '生活习惯': ['洗手', '刷牙', '穿衣', '整理', '收拾', '规矩', '习惯', '自理', '独立'],
  '电子产品': ['手机', '电视', '屏幕', 'iPad', '平板', '电子', '游戏机', '视频', '动画'],
  '健康': ['发烧', '感冒', '咳嗽', '生病', '疫苗', '体检', '发育', '身高', '体重', '运动']
};

const ACTION_PATTERNS = [
  { regex: /家长先|先把|先让|先看|先做/, score: 2 },
  { regex: /可以(试着|尝试|让|用|通过|跟|和|给)/, score: 4 },
  { regex: /建议|推荐/, score: 3 },
  { regex: /试试|不妨|最好/, score: 3 },
  { regex: /每天|每次|坚持|定期/, score: 2 },
  { regex: /帮助孩子|帮孩子|让孩子/, score: 3 },
  { regex: /培养|锻炼|训练|练习/, score: 2 },
  { regex: /注意|避免|防止|小心/, score: 1 },
  { regex: /鼓励|表扬|肯定|赞美/, score: 2 },
  { regex: /告诉孩子|跟孩子说|对孩子说/, score: 2 },
  { regex: /和孩子一起|陪孩子|带着孩子/, score: 3 },
  { regex: /不要|别|少用|少给|少让/, score: 1 },
  { regex: /重要|关键|核心/, score: 1 },
  { regex: /方法|技巧|窍门|妙招/, score: 1 }
];

const NEGATIVE_PATTERNS = [
  /^但是|^然而|^不过|^可是|^却/,
  /因此|所以|于是/,
  /什么是|指的是|意思是|即/,
  /参考文献|引用|来源/
];

const TARGET_CATEGORIES = [
  '家庭教育', '行为习惯', '情绪养育', '情绪管理',
  '营养健康', '社交能力', '亲子关系', '生活技能',
  '睡眠管理', '运动发展', '语言发展', '性格形成',
  '认知发展', '纪律管理'
];

const JACCARD_THRESHOLD = 0.70;

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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0', 10) || 0;

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
    await ensureTable(pool);
    const tips = await extractTips(pool, { limit });
    console.log(`[tips-extract] candidates=${tips.length}`);

    const deduped = deduplicateTips(tips);
    console.log(`[tips-extract] after_dedup=${deduped.length}`);

    if (dryRun) {
      console.log('[tips-extract] mode=dry-run (no insert)');
      deduped.slice(0, 10).forEach((t, i) => {
        console.log(`  #${i + 1} [${t.category}] ${t.title.slice(0, 50)}`);
      });
      return;
    }

    const inserted = await insertTips(pool, deduped);
    console.log(`[tips-extract] inserted=${inserted}`);
  } finally {
    await pool.end();
  }
}

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS parenting_tips (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(50) DEFAULT '',
      age_group VARCHAR(20) DEFAULT '',
      scene_tags JSON DEFAULT NULL,
      source_article_id INT DEFAULT NULL,
      source_article_title VARCHAR(200) DEFAULT '',
      source_author VARCHAR(100) DEFAULT '',
      evidence_level VARCHAR(20) DEFAULT 'expert',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_category (category),
      KEY idx_age_group (age_group),
      KEY idx_source_article (source_article_id),
      FULLTEXT KEY ft_content (title, content)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function extractTips(pool, options) {
  const catList = TARGET_CATEGORIES.map(c => `'${c}'`).join(',');
  const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
  const [rows] = await pool.query(
    `SELECT id, title, content, category, age_group, author FROM articles WHERE category IN (${catList}) ORDER BY id ${limitClause}`
  );

  const tips = [];
  for (const row of rows) {
    const sentences = splitIntoSentences(row.content);
    for (const sent of sentences) {
      const score = scoreSentence(sent);
      if (score >= 4) {
        const scenes = detectScenes(sent);
        tips.push({
          title: makeTitle(sent),
          content: sent,
          category: row.category,
          age_group: row.age_group || '',
          scene_tags: scenes.length ? JSON.stringify(scenes) : null,
          source_article_id: row.id,
          source_article_title: row.title,
          source_author: row.author || '',
          score
        });
      }
    }
  }

  tips.sort((a, b) => b.score - a.score);
  return tips;
}

function splitIntoSentences(content) {
  const cleaned = String(content || '')
    .replace(/来源：.+/g, '')
    .replace(/章节：.+/g, '')
    .replace(/核心内容：/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\n{2,}/g, '\n');

  const raw = cleaned.split(/[。！？\n]+/);
  const result = [];

  for (const part of raw) {
    const text = part.replace(/[\s\u3000]+/g, ' ').trim();
    if (!text) continue;
    if (text.length < 15) continue;
    if (text.length > 200) {
      const subParts = text.split(/[；;，,]/);
      for (const sub of subParts) {
        const st = sub.trim();
        if (st && st.length >= 15 && st.length <= 200) {
          result.push(st);
        }
      }
      continue;
    }
    if (text.length <= 200) {
      result.push(text);
    }
  }

  return result;
}

function scoreSentence(text) {
  let score = 0;

  for (const { regex, score: s } of ACTION_PATTERNS) {
    if (regex.test(text)) score += s;
  }

  for (const pattern of NEGATIVE_PATTERNS) {
    if (pattern.test(text)) score -= 2;
  }

  if (text.length >= 40 && text.length <= 120) score += 2;
  else if (text.length >= 20 && text.length <= 180) score += 1;

  if (/孩子|宝宝|小朋友/.test(text)) score += 2;

  if (/。$/.test(text)) score += 1;

  if (text.length <= 30) score -= 1;
  if (text.length > 200) score -= 3;

  const chineseCharCount = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (chineseCharCount < 8) score -= 2;

  return score;
}

function detectScenes(text) {
  const scenes = [];
  for (const [scene, keywords] of Object.entries(SCENE_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      scenes.push(scene);
    }
  }
  return scenes;
}

function makeTitle(sentence) {
  const cleaned = sentence.replace(/[，,。！？；;：:\s]+$/, '');
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 38) + '...';
}

function deduplicateTips(tips) {
  const unique = [];
  const seen = new Set();

  for (const tip of tips) {
    const sig = buildSignature(tip.content);
    if (seen.has(sig)) continue;

    let isDuplicate = false;
    for (const existing of unique.slice(-500)) {
      if (jaccardSimilarity(tip.content, existing.content) > JACCARD_THRESHOLD) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      unique.push(tip);
      seen.add(sig);
    }
  }

  return unique;
}

function buildSignature(text) {
  const chars = text.replace(/[\s，。！？；：""'']/g, '');
  if (chars.length <= 5) return chars;
  return chars.slice(0, 5) + '|' + chars.slice(-5);
}

function jaccardSimilarity(a, b) {
  const gramsA = ngrams(a, 3);
  const gramsB = ngrams(b, 3);
  if (!gramsA.length || !gramsB.length) return 0;

  const setA = new Set(gramsA);
  const setB = new Set(gramsB);

  let intersection = 0;
  for (const g of setA) {
    if (setB.has(g)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function ngrams(text, n) {
  const chars = text.replace(/[\s，。！？；：""''，、《》【】（）\(\)\[\]]/g, '');
  const grams = [];
  for (let i = 0; i <= chars.length - n; i++) {
    grams.push(chars.slice(i, i + n));
  }
  return grams;
}

async function insertTips(pool, tips) {
  await pool.query('TRUNCATE TABLE parenting_tips');
  let inserted = 0;
  for (const tip of tips) {
    try {
      await pool.query(
        `INSERT INTO parenting_tips (title, content, category, age_group, scene_tags, source_article_id, source_article_title, source_author) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [tip.title, tip.content, tip.category, tip.age_group, tip.scene_tags, tip.source_article_id, tip.source_article_title, tip.source_author]
      );
      inserted++;
    } catch (err) {
      if (err.code !== 'ER_DUP_ENTRY') {
        console.error(`[tips-extract] insert error: ${err.message} title=${tip.title.slice(0, 30)}`);
      }
    }
  }
  return inserted;
}

main().catch((error) => {
  console.error('[tips-extract]', error.message);
  process.exit(1);
});
