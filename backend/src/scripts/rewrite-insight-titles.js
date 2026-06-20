#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TITLE_TEMPLATES = {
  cognitive_learning: [
    '为什么你家宝宝{X}？',
    '{X}的背后，藏着孩子还没说出口的话',
    '很多爸妈不知道——{X}其实是好事',
    '孩子{X}，不是不聪明，是大脑还没准备好',
    '关于孩子学东西的节奏，很多家长误解了',
    '大脑的成长顺序，决定了孩子先学会什么'
  ],
  emotion_psychology: [
    '当孩子{Y}时，他的大脑其实在{Z}',
    '哭闹不是坏脾气——是孩子唯一会说的语言',
    '孩子{Y}，说明他正在建立一件重要能力',
    '别急着安抚——先看懂{Y}背后的信号',
    '每一种情绪背后，都有孩子还没学会的能力',
    '孩子发脾气不是因为任性，他是在发出一个信号'
  ],
  school_adaptation: [
    '入园{X}，其实是孩子大脑发出的信号',
    '{X}的背后，是孩子在告诉你什么',
    '不肯上学的真相——比你想象的简单',
    '从{Y}到{Z}，孩子的安全感是怎么建立起来的',
    '不想去幼儿园不一定是逃避，可能是需要这个',
    '分离时的慌张，是大脑在学习的正常过程'
  ],
  behavior_management: [
    '别急着纠正——先看懂{X}在告诉你什么',
    '孩子{X}，其实他在培养一项关键能力',
    '{X}不是不听话，而是孩子学会了什么',
    '用一个更简单的方式，理解孩子为什么{X}',
    '很多大人认为是坏习惯的事，其实是正常发展过程',
    '管不住的行为背后，往往藏着一个还没掌握的能力'
  ],
  health_body: [
    '关于{Y}，老一辈说的对还是错？',
    '孩子{X}，不一定是生病——可能是这个原因',
    '{Y}的真相，比你听说的要简单',
    '身体的信号，往往比我们想的更简单直接',
    '不是所有的身体反应都需要担心，有些是正常过程'
  ],
  general: [
    '关于{X}，每个家长都该知道的真相',
    '别再为{Y}焦虑了——先看懂这一件事',
    '孩子{X}，他不是故意的',
    '{X}的答案，可能和你想的不一样',
    '很多父母忽略的一件小事，其实是关键信号',
    '用一分钟看懂一个育儿道理',
    '孩子身上的秘密，比我们以为的要多',
    '换个角度看，孩子的很多行为都不是问题',
    '你以为的坏毛病，可能是一个成长的信号',
    '有件事很多家长都说错——其实孩子这样做很正常'
  ]
};

const SUBSTITUTION_PAIRS = [
  ['客体永存性', '物体不会消失的概念'],
  ['过渡性客体', '能让他安心的东西'],
  ['依恋理论', '孩子跟你的连接方式'],
  ['执行功能', '大脑的自我控制能力'],
  ['认知发展里程碑', '大脑发育的关键节点'],
  ['前额叶皮质', '大脑中负责自我控制的部分'],
  ['维果茨基最近发展区', '孩子刚好能学会的区域'],
  ['皮亚杰认知发展阶段', '孩子思维发展的自然步骤'],
  ['蒙台梭利敏感期', '孩子对某件事特别感兴趣的时期'],
  ['社会化参照', '孩子通过观察你来判断安全不安全'],
  ['情绪调节能力', '孩子管理自己情绪的本领'],
  ['神经可塑性', '大脑能够改变和成长的能力'],
  ['自我效能感', '孩子觉得自己能做到的信心'],
  ['心理韧性', '遭遇困难还能恢复过来的能力'],
  ['气质类型', '孩子天生的性格底色'],
  ['镜像神经元', '大脑中让孩子模仿的那部分'],
  ['元认知', '孩子对自己想法的觉察能力'],
  ['延迟满足', '为了更大的奖励愿意等待'],
  ['共情能力', '能感受到别人情绪的能力'],
  ['内在动机', '发自内心想做的驱动力']
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

function extractKeywords(content) {
  const text = String(content || '');

  const broadPatterns = [
    /[^，。！？\s]{2,4}(性|感|力|期|区|体|念|理|论|法|式|型)/g,
    /[^，。！？\s]{2,4}(发展|成长|能力|行为|习惯|情绪|认知|学习|社交|语言|睡眠|饮食|健康|注意|记忆|思维|创造)/g
  ];

  let keywords = [];

  const specificPattern = /安全感|注意力|分离焦虑|哭闹|抗拒|拖延|专注|情绪|社交|语言|记忆|想象|创造|逻辑|好奇|探索|独立|自信|恐惧|愤怒|沮丧|害羞|胆小|攻击|撒谎|磨蹭|挑食|偏食|厌食|夜醒|失眠|噩梦|尿床|多动|冲动|自控|耐心/;
  const m = text.match(specificPattern);
  if (m) keywords.push(m[0]);

  for (const pattern of broadPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const kw = match[0];
      if (!keywords.includes(kw)) {
        keywords.push(kw);
        if (keywords.length >= 5) break;
      }
    }
    if (keywords.length >= 5) break;
  }

  if (keywords.length === 0) {
    const words = text.match(/[\u4e00-\u9fa5]{2,4}/g);
    if (words) {
      const freq = {};
      words.forEach(w => { freq[w] = (freq[w] || 0) + 1; });
      keywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => w);
    }
  }

  return [...new Set(keywords)];
}

function generateTitle(content, domain, category) {
  const keywords = extractKeywords(content);

  let usableTemplates = TITLE_TEMPLATES[domain] || TITLE_TEMPLATES[category] || [];

  if (usableTemplates.length === 0) {
    usableTemplates = TITLE_TEMPLATES.general;
  }

  let templatesWithPlaceholders = usableTemplates.filter(t => /\{[XYZ]\}/.test(t));
  let templatesWithoutPlaceholders = usableTemplates.filter(t => !/\{[XYZ]\}/.test(t));

  if (keywords.length === 0 && templatesWithoutPlaceholders.length > 0) {
    const pick = templatesWithoutPlaceholders[Math.floor(Math.random() * templatesWithoutPlaceholders.length)];
    return pick.length > 25 ? pick.slice(0, 22) + '...' : pick;
  }

  if (templatesWithPlaceholders.length === 0) {
    templatesWithPlaceholders = TITLE_TEMPLATES.general.filter(t => /\{[XYZ]\}/.test(t));
  }

  let bestTitle = null;
  for (const template of templatesWithPlaceholders) {
    let title = template;
    let kwIdx = 0;
    let used = false;

    for (const placeholder of ['{X}', '{Y}', '{Z}']) {
      while (kwIdx < keywords.length && title.includes(placeholder)) {
        title = title.replace(placeholder, keywords[kwIdx]);
        kwIdx++;
        used = true;
      }
    }

    title = title.replace(/\{[XYZ]\}/g, '').replace(/\s+/g, '').trim();

    if (used && title.length >= 5 && title.length <= 25) {
      bestTitle = title;
      break;
    }
    if (!bestTitle && used && title.length >= 5) {
      bestTitle = title;
    }
  }

  if (!bestTitle || bestTitle.length < 5) {
    if (templatesWithoutPlaceholders.length > 0) {
      const pick = templatesWithoutPlaceholders[Math.floor(Math.random() * templatesWithoutPlaceholders.length)];
      return pick;
    }

    const firstSentence = content.split(/[。！？\n]/)[0]?.trim() || '';
    if (firstSentence.length >= 8) {
      return firstSentence.length > 25 ? firstSentence.slice(0, 22) + '...' : firstSentence;
    }
    if (content.length >= 8) {
      return content.length > 25 ? content.slice(0, 22) + '...' : content;
    }
    return null;
  }

  if (bestTitle.length > 25) {
    bestTitle = bestTitle.slice(0, 22) + '...';
  }

  return bestTitle;
}

function genDomain(category) {
  const c = String(category || '').toLowerCase();
  if (c.includes('认知') || c.includes('学习') || c.includes('教育')) return 'cognitive_learning';
  if (c.includes('情绪') || c.includes('心理') || c.includes('情感')) return 'emotion_psychology';
  if (c.includes('社交') || c.includes('行为') || c.includes('习惯')) return 'behavior_management';
  if (c.includes('健康') || c.includes('营养') || c.includes('身体')) return 'health_body';
  return 'general';
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
    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM parenting_tips WHERE display_type = 'insight' AND display_title IS NULL AND is_active = 1"
    );

    console.log(`[insight-rewrite] insight_null_title=${total} batch_size=${batchSize}${dryRun ? ' mode=dry-run' : ''}`);

    if (total === 0) {
      console.log('[insight-rewrite] nothing to rewrite');
      return;
    }

    let rewritten = 0;
    let offset = 0;

    while (offset < total) {
      const [rows] = await pool.execute(
        "SELECT id, content, category, concise_domain FROM parenting_tips WHERE display_type = 'insight' AND display_title IS NULL AND is_active = 1 ORDER BY id LIMIT ? OFFSET ?",
        [batchSize, offset]
      );

      if (!rows.length) break;

      if (!dryRun) {
        const conn = await pool.getConnection();
        try {
          for (const row of rows) {
            const domain = genDomain(row.category || row.concise_domain || '');
            const title = generateTitle(row.content, domain, row.category);
            if (title) {
              await conn.execute(
                'UPDATE parenting_tips SET display_title = ? WHERE id = ?',
                [title, row.id]
              );
              rewritten++;
            }
          }
        } finally {
          conn.release();
        }
      } else {
        for (const row of rows) {
          const title = generateTitle(row.content, genDomain(row.category || ''), row.category);
          if (title) rewritten++;
        }
      }

      offset += batchSize;
    }

    console.log(`[insight-rewrite] rewritten=${rewritten}/${total} (${((rewritten / total) * 100).toFixed(1)}%)`);

    if (!dryRun) {
      const [[{ filled }]] = await pool.execute(
        "SELECT COUNT(*) AS filled FROM parenting_tips WHERE display_type = 'insight' AND display_title IS NOT NULL AND is_active = 1"
      );
      const [[{ insightTotal }]] = await pool.execute(
        "SELECT COUNT(*) AS insightTotal FROM parenting_tips WHERE display_type = 'insight' AND is_active = 1"
      );
      if (insightTotal > 0) {
        const filledPct = ((filled / insightTotal) * 100).toFixed(1);
        console.log(`[insight-rewrite] filled=${filled}/${insightTotal} (${filledPct}%)`);
        if (filledPct < 80) {
          console.warn(`[insight-rewrite] WARNING filled_pct=${filledPct}% below 80% threshold`);
        }
      }
    }

    console.log(`[insight-rewrite] ${dryRun ? 'dry-run complete' : 'done'}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[insight-rewrite] FATAL', err.message);
  process.exit(1);
});
