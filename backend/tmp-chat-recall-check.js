const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const env = {};
for (const line of fs.readFileSync(path.resolve('/workspace/.env'), 'utf8').split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#')) {
    continue;
  }
  const index = line.indexOf('=');
  if (index === -1) {
    continue;
  }
  env[line.slice(0, index).trim()] = line.slice(index + 1).trim();
}

function extractChatKeywords(message) {
  const terms = String(message || '')
    .split(/[\s，。！？、,.!?：:；;（）()【】\[\]"'“”‘’]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  const uniqueTerms = [];

  function pushTerm(term) {
    if (!term || term.length < 2 || uniqueTerms.includes(term)) {
      return;
    }
    uniqueTerms.push(term);
  }

  for (const term of terms) {
    pushTerm(term);
    if (hasEnoughChatKeywords(uniqueTerms)) {
      break;
    }
    for (const fragment of extractChineseSearchFragments(term)) {
      pushTerm(fragment);
      if (hasEnoughChatKeywords(uniqueTerms)) {
        break;
      }
    }
    if (hasEnoughChatKeywords(uniqueTerms)) {
      break;
    }
  }
  if (!uniqueTerms.length && String(message || '').trim()) {
    uniqueTerms.push(String(message || '').trim().toLowerCase());
  }
  return uniqueTerms;
}

function hasEnoughChatKeywords(keywords) {
  return keywords.length >= 8;
}

function extractChineseSearchFragments(term) {
  const normalized = String(term || '')
    .replace(/(怎么办|怎么做|怎么说|怎么引导|如何做|如何引导|可以吗|有没有|为什么|是不是|总是|一直|一下|这个|那个|然后|之后|以后|前|后|让|进行)/g, ' ')
    .replace(/(孩子|宝宝|小朋友)/g, ' ')
    .replace(/\s+/g, '');

  if (!/[\u4e00-\u9fff]/.test(normalized) || normalized.length < 2) {
    return [];
  }

  const fragments = [normalized];
  const preferredMatches = normalized.match(/(坐不住|动来动去|不听话|亲子共读|共读|复述|道德教育|上课|注意力|专注|挑食|吃饭|洗漱|写作业|情绪|哭闹|发火|拖拉|睡前|阅读|绘本|纪律|奖励|惩罚|自由|蒙台梭利|三岁|四岁|五岁|六岁)/g) || [];
  for (const match of preferredMatches) {
    if (!fragments.includes(match)) {
      fragments.push(match);
    }
  }
  const maxWindow = Math.min(4, normalized.length);
  for (let size = maxWindow; size >= 2; size -= 1) {
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

function buildChatSearchCondition(fields, keywords) {
  const conditions = [];
  const params = [];
  for (const keyword of keywords) {
    const likeValue = `%${keyword}%`;
    const fieldConditions = fields.map((field) => `${field} LIKE ?`);
    conditions.push(`(${fieldConditions.join(' OR ')})`);
    for (let index = 0; index < fields.length; index += 1) {
      params.push(likeValue);
    }
  }
  return {
    sql: conditions.length ? ` AND (${conditions.join(' OR ')})` : '',
    params
  };
}

async function queryArticles(connection, message) {
  const keywords = extractChatKeywords(message);
  const search = buildChatSearchCondition(['title', 'summary', 'content', 'tags'], keywords);
  const sql = `SELECT title, category, sub_category
    FROM articles
    WHERE is_published = 1${search.sql}
    ORDER BY read_count DESC, updated_at DESC, created_at DESC
    LIMIT 5`;
  const [rows] = await connection.execute(sql, search.params);
  return { keywords, rows };
}

async function queryTasks(connection, message) {
  const keywords = extractChatKeywords(message);
  const search = buildChatSearchCondition(['title', 'objective', 'content', 'parent_prompt', 'steps', 'tips'], keywords);
  const sql = `SELECT task_code, title, subject_code
    FROM reading_tasks
    WHERE subject_code IN ('reading', 'expression', 'logic')${search.sql}
    ORDER BY difficulty ASC, updated_at DESC, created_at DESC
    LIMIT 5`;
  const [rows] = await connection.execute(sql, search.params);
  return { keywords, rows };
}

async function main() {
  const connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME
  });

  const messages = [
    '孩子上课坐不住怎么办',
    '三岁孩子总是动来动去怎么引导',
    '怎么给孩子做道德教育',
    '亲子共读后怎么让孩子复述',
    '孩子不听话怎么办'
  ];

  for (const message of messages) {
    const article = await queryArticles(connection, message);
    const task = await queryTasks(connection, message);
    console.log('---');
    console.log(message);
    console.log(`article_keywords=${JSON.stringify(article.keywords)}`);
    console.log(`article_hits=${article.rows.length}`);
    article.rows.forEach((row, index) => {
      console.log(`A${index + 1}: ${row.title} | ${row.category} | ${row.sub_category}`);
    });
    console.log(`task_keywords=${JSON.stringify(task.keywords)}`);
    console.log(`task_hits=${task.rows.length}`);
    task.rows.forEach((row, index) => {
      console.log(`T${index + 1}: ${row.task_code} | ${row.title} | ${row.subject_code}`);
    });
  }

  await connection.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
