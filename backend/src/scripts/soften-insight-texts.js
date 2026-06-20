#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ACADEMIC_TO_EVERYDAY = [
  ['研究表明', '很多爸妈发现'],
  ['研究发现', '很多观察发现'],
  ['数据表明', '实际情况是'],
  ['调查发现', '很多家长反映'],
  ['实验证实', '有观察发现'],
  ['皮亚杰指出', '有研究发现'],
  ['蒙台梭利认为', '有不少教育者认为'],
  ['维果茨基提出', '有研究提出'],
  ['埃里克森强调', '有学者指出'],
  ['客体永存性', '物体不会消失的概念'],
  ['过渡性客体', '能让他安心的东西'],
  ['依恋理论', '孩子跟你的连接方式'],
  ['执行功能', '大脑的自我控制能力'],
  ['认知发展里程碑', '大脑发育的关键节点'],
  ['前额叶皮质', '大脑中负责自我控制的部分'],
  ['神经可塑性', '大脑能够改变和成长的能力'],
  ['社会化参照', '孩子通过观察你来判断安全与否'],
  ['情绪调节能力', '管理情绪的本领'],
  ['自我效能感', '觉得自己能做到的信心'],
  ['心理韧性', '从困难中恢复的能力'],
  ['镜像神经元', '让孩子天生会模仿的大脑区域'],
  ['元认知', '对自己想法的觉察'],
  ['延迟满足', '为了更好的结果愿意等待'],
  ['共情能力', '感受别人情绪的能力'],
  ['内在动机', '发自内心想做的动力'],
  ['气质类型', '天生的性格底色'],
  ['最近发展区', '孩子刚好能够到的学习区域'],
  ['认知发展阶段', '思维发展的自然过程'],
  ['敏感期', '对某件事特别敏感的时期'],
  ['关键期', '大脑发展的关键窗口'],
  ['过渡性客体现象', '需要一个能安心的东西陪着'],
  ['安全型依恋', '和妈妈之间牢固的信任关系'],
  ['回避型依恋', '对和妈妈的亲近不太在意的表现'],
  ['矛盾型依恋', '和妈妈又想要又抗拒的矛盾心理'],
  ['分离个体化', '慢慢变成一个独立的小人'],
  ['心智化能力', '能猜别人在想什么的本领'],
  ['情境记忆', '对发生过的事情的记忆'],
  ['工作记忆', '在脑海里短暂记住信息的能力'],
  ['抑制控制', '控制住自己不做某件事'],
  ['认知灵活性', '从一件事切换到另一件事的能力'],
  ['执行功能失调', '大脑自我控制方面暂时跟不上'],
  ['睡眠周期', '睡觉的自然循环'],
  ['昼夜节律', '身体的生物钟'],
  ['快速眼动睡眠', '做梦时的浅睡'],
  ['深度睡眠', '睡得最熟的时候'],
  ['睡眠卫生', '帮助好好睡觉的习惯'],
  ['生长激素分泌', '身体长高的激素释放'],
  ['免疫球蛋白', '身体里抵抗病菌的卫士']
];

const SENTENCE_TRANSFORMS = [
  [/(.+?)在(.+?)过程中/g, '$1当$2的时候'],
  [/的的/g, '的'],
  [/被(.+?)所/g, '被$1'],
  [/基于(.+?)的研究发现/g, '从对$1的了解中发现'],
  [/(.+?)是(.+?)的重要(.+?)[之一]?[。，]/g, '$1能帮助$2更好地$3'],
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

function softenText(content) {
  let text = String(content || '').trim();
  if (!text) return null;

  for (const [academic, everyday] of ACADEMIC_TO_EVERYDAY) {
    text = text.replace(new RegExp(escapeRegExp(academic), 'g'), everyday);
  }

  for (const [pattern, replacement] of SENTENCE_TRANSFORMS) {
    text = text.replace(pattern, replacement);
  }

  text = text.replace(/(了)了/g, '$1');

  text = collapseSpaces(text);

  const sentences = text.split(/[。！？\n]+/).map(s => s.trim()).filter(s => s.length >= 4);
  if (sentences.length === 0) return null;

  let result = sentences.join('');
  if (!result.endsWith('。') && !result.endsWith('？') && !result.endsWith('！')) {
    result += '';
  }

  if (result.length > 200) {
    let truncated = '';
    for (const s of sentences) {
      if (truncated.length + s.length + 1 > 190) break;
      truncated += s;
    }
    result = truncated;
  }

  const summary = extractSummary(result);
  if (summary && summary !== result.slice(0, summary.length)) {
    result = result + '简单说就是：' + summary;
  }

  if (result.length > 200) {
    result = result.slice(0, 197) + '...';
  }

  return result || null;
}

function extractSummary(text) {
  const cleaned = text.replace(/[^\u4e00-\u9fa5\uff0c\u3002]/g, '');
  const keywords = ['安全感', '注意力', '控制力', '信心', '能力', '连接', '关系', '信任', '独立', '成长'];
  for (const kw of keywords) {
    if (text.includes(kw)) {
      return '这其实是在帮助孩子建立' + kw;
    }
  }
  return null;
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collapseSpaces(str) {
  return str.replace(/\s+/g, '').replace(/\u3000+/g, '');
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
  const batchSize = parseInt(process.argv.find(a => a.startsWith('--batch='))?.split('=')[1] || '100', 10);

  try {
    const [[{ total }]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM parenting_tips WHERE display_type = 'insight' AND is_active = 1"
    );

    console.log(`[insight-soften] insight_total=${total} batch_size=${batchSize}${dryRun ? ' mode=dry-run' : ''}`);

    if (total === 0) {
      console.log('[insight-soften] nothing to soften');
      return;
    }

    let softened = 0;
    let offset = 0;

    while (offset < total) {
      const [rows] = await pool.execute(
        "SELECT id, content, display_text FROM parenting_tips WHERE display_type = 'insight' AND is_active = 1 ORDER BY id LIMIT ? OFFSET ?",
        [batchSize, offset]
      );

      if (!rows.length) break;

      if (!dryRun) {
        const conn = await pool.getConnection();
        try {
          for (const row of rows) {
            const softenedText = softenText(row.content);
            if (softenedText && softenedText !== (row.display_text || '')) {
              await conn.execute(
                'UPDATE parenting_tips SET display_text = ? WHERE id = ?',
                [softenedText, row.id]
              );
              softened++;
            }
          }
        } finally {
          conn.release();
        }
      } else {
        for (const row of rows) {
          const softenedText = softenText(row.content);
          if (softenedText) softened++;
        }
      }

      offset += batchSize;
    }

    const pct = ((softened / total) * 100).toFixed(1);
    console.log(`[insight-soften] softened=${softened}/${total} (${pct}%)`);

    if (!dryRun) {
      const [[{ filled }]] = await pool.execute(
        "SELECT COUNT(*) AS filled FROM parenting_tips WHERE display_type = 'insight' AND display_text IS NOT NULL AND display_text != '' AND is_active = 1"
      );
      if (total > 0) {
        const filledPct = ((filled / total) * 100).toFixed(1);
        console.log(`[insight-soften] text_filled=${filled}/${total} (${filledPct}%)`);
        if (filledPct < 80) {
          console.warn(`[insight-soften] WARNING filled_pct=${filledPct}% below 80% threshold`);
        }
      }

      const [[{ academicCount }]] = await pool.execute(
        `SELECT COUNT(*) AS academicCount FROM parenting_tips WHERE display_type = 'insight' AND is_active = 1 AND display_text IS NOT NULL AND (display_text LIKE '%研究发现%' OR display_text LIKE '%指出%' OR display_text LIKE '%证实%')`
      );
      console.log(`[insight-soften] remaining_academic_phrases=${academicCount}`);
    }

    console.log(`[insight-soften] ${dryRun ? 'dry-run complete' : 'done'}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[insight-soften] FATAL', err.message);
  process.exit(1);
});
