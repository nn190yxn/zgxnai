#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

async function main() {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length ? 0 : 1);
  }

  const dryRun = args.includes('--dry-run');
  const validateOnly = args.includes('--validate-only');
  const fileArg = args.find((arg) => !arg.startsWith('--'));
  if (!fileArg) {
    printUsage();
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(filePath)) {
    throw new Error(`知识库文件不存在: ${filePath}`);
  }

  const payload = parseKnowledgeFile(filePath);
  const normalizedSummary = summarizeKnowledgeItems(payload);
  if (validateOnly) {
    console.log('[knowledge-import] mode=validate-only');
    console.log(`[knowledge-import] file=${filePath}`);
    console.log(`[knowledge-import] total=${normalizedSummary.total} article=${normalizedSummary.article} task=${normalizedSummary.task} scene=${normalizedSummary.scene} unsupported=${normalizedSummary.unsupported}`);
    return;
  }

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
    await ensureKnowledgeTables(pool);
    const summary = await importKnowledgeItems(pool, payload, { dryRun });
    console.log(`[knowledge-import] mode=${dryRun ? 'dry-run' : 'apply'}`);
    console.log(`[knowledge-import] file=${filePath}`);
    console.log(`[knowledge-import] total=${summary.total} article=${summary.article} task=${summary.task} scene=${summary.scene}`);
    console.log(`[knowledge-import] inserted=${summary.inserted} updated=${summary.updated} skipped=${summary.skipped}`);
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

function printUsage() {
  console.log('Usage: node src/scripts/import-knowledge-base.js <json-file> [--dry-run] [--validate-only]');
}

function parseKnowledgeFile(filePath) {
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`知识库 JSON 解析失败: ${error.message}`);
  }
  if (!Array.isArray(data)) {
    throw new Error('知识库文件必须是 JSON 顶层数组');
  }
  return data;
}

function summarizeKnowledgeItems(items) {
  const summary = { total: items.length, article: 0, task: 0, scene: 0, unsupported: 0 };
  for (const rawItem of items) {
    const type = String(rawItem && rawItem.type || '').trim();
    if (type === 'article') {
      summary.article += 1;
      continue;
    }
    if (type === 'task') {
      summary.task += 1;
      continue;
    }
    if (type === 'scene') {
      summary.scene += 1;
      continue;
    }
    summary.unsupported += 1;
  }
  return summary;
}

async function ensureKnowledgeTables(pool) {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS articles (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      summary TEXT,
      content LONGTEXT,
      category VARCHAR(128),
      sub_category VARCHAR(128),
      age_group VARCHAR(64),
      tags TEXT,
      author VARCHAR(128),
      evidence_level VARCHAR(32),
      read_count INT DEFAULT 0,
      is_published TINYINT DEFAULT 1,
      cover TEXT,
      cover_image TEXT,
      icon_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_articles_category (category),
      INDEX idx_articles_published (is_published)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS reading_tasks (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      task_code VARCHAR(128) NOT NULL UNIQUE,
      title VARCHAR(255) NOT NULL,
      subject_code VARCHAR(128) NOT NULL,
      age_range VARCHAR(64),
      difficulty INT DEFAULT 1,
      duration INT DEFAULT 10,
      material TEXT,
      objective TEXT,
      steps TEXT,
      parent_prompt TEXT,
      content TEXT,
      image_url TEXT,
      icon_url TEXT,
      cover_image TEXT,
      audio_url TEXT,
      video_url TEXT,
      tips TEXT,
      example_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_reading_tasks_subject (subject_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_scene_tags (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      scene_key VARCHAR(64) NOT NULL,
      scene_title VARCHAR(255) NOT NULL,
      scene_category VARCHAR(64) NOT NULL,
      principle_text TEXT,
      suggested_action TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_parenting_scene_key (scene_key),
      INDEX idx_parenting_scene_category (scene_category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_scene_aliases (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      scene_key VARCHAR(64) NOT NULL,
      alias_text VARCHAR(128) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'active',
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_parenting_scene_alias (scene_key, alias_text),
      INDEX idx_parenting_scene_alias_text (alias_text)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS parenting_scene_recommendations (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      scene_key VARCHAR(64) NOT NULL,
      result_type VARCHAR(64) NOT NULL,
      title VARCHAR(255) NOT NULL,
      summary TEXT,
      target_type VARCHAR(64) DEFAULT '',
      target_id VARCHAR(128) DEFAULT '',
      target_path TEXT,
      age_group VARCHAR(32) DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_parenting_scene_recommendation (scene_key, result_type, title(120)),
      INDEX idx_parenting_scene_recommendations_key (scene_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function importKnowledgeItems(pool, items, options) {
  const summary = {
    total: items.length,
    article: 0,
    task: 0,
    scene: 0,
    inserted: 0,
    updated: 0,
    skipped: 0
  };

  const connection = await pool.getConnection();
  try {
    if (!options.dryRun) {
      await connection.beginTransaction();
    }
    for (const rawItem of items) {
      const item = normalizeBaseItem(rawItem);
      if (!item.type) {
        summary.skipped += 1;
        continue;
      }
      if (item.type === 'article') {
        summary.article += 1;
        updateSummary(summary, await upsertArticle(connection, item, options));
        continue;
      }
      if (item.type === 'task') {
        summary.task += 1;
        updateSummary(summary, await upsertTask(connection, item, options));
        continue;
      }
      if (item.type === 'scene') {
        summary.scene += 1;
        updateSummary(summary, await upsertScene(connection, item, options));
        continue;
      }
      summary.skipped += 1;
    }
    if (options.dryRun) {
      return summary;
    }
    await connection.commit();
    return summary;
  } catch (error) {
    if (!options.dryRun) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

function updateSummary(summary, operation) {
  if (operation === 'inserted') {
    summary.inserted += 1;
    return;
  }
  if (operation === 'updated') {
    summary.updated += 1;
    return;
  }
  summary.skipped += 1;
}

function normalizeBaseItem(rawItem) {
  if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
    return { type: '' };
  }
  return Object.assign({}, rawItem, { type: String(rawItem.type || '').trim() });
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join(',');
  }
  return String(value || '').trim();
}

function normalizeTextArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join('\n');
  }
  return String(value || '').trim();
}

function normalizeSceneArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => String(item || '').trim()).filter(Boolean);
}

async function upsertArticle(connection, item, options) {
  const title = String(item.title || '').trim();
  if (!title) {
    throw new Error('article 缺少 title');
  }
  const payload = {
    title,
    summary: String(item.summary || '').trim(),
    content: String(item.content || '').trim(),
    category: String(item.category || '').trim(),
    subCategory: String(item.sub_category || item.subCategory || '').trim(),
    ageGroup: String(item.age_group || item.ageGroup || '').trim(),
    tags: normalizeTags(item.tags),
    author: String(item.author || '').trim(),
    evidenceLevel: String(item.evidence_level || item.evidenceLevel || '').trim(),
    isPublished: item.is_published === undefined ? 1 : Number(item.is_published ? 1 : 0)
  };
  const [rows] = await connection.execute('SELECT id FROM articles WHERE title = ? LIMIT 1', [payload.title]);
  if (options.dryRun) {
    return rows.length ? 'updated' : 'inserted';
  }
  if (rows.length) {
    await connection.execute(
      `UPDATE articles
          SET summary = ?, content = ?, category = ?, sub_category = ?, age_group = ?, tags = ?, author = ?, evidence_level = ?, is_published = ?
        WHERE id = ?`,
      [payload.summary, payload.content, payload.category, payload.subCategory, payload.ageGroup, payload.tags, payload.author, payload.evidenceLevel, payload.isPublished, rows[0].id]
    );
    return 'updated';
  }
  await connection.execute(
    `INSERT INTO articles
      (title, summary, content, category, sub_category, age_group, tags, author, evidence_level, is_published, cover)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')`,
    [payload.title, payload.summary, payload.content, payload.category, payload.subCategory, payload.ageGroup, payload.tags, payload.author, payload.evidenceLevel, payload.isPublished]
  );
  return 'inserted';
}

async function upsertTask(connection, item, options) {
  const taskCode = String(item.task_code || item.taskCode || '').trim();
  const title = String(item.title || '').trim();
  const subjectCode = String(item.subject_code || item.subjectCode || '').trim();
  if (!taskCode || !title || !subjectCode) {
    throw new Error('task 缺少 task_code、title 或 subject_code');
  }
  const payload = {
    taskCode,
    title,
    subjectCode,
    ageRange: String(item.age_range || item.ageRange || '').trim(),
    difficulty: normalizePositiveInt(item.difficulty, 1),
    duration: normalizePositiveInt(item.duration, 10),
    material: String(item.material || '').trim(),
    objective: String(item.objective || '').trim(),
    steps: normalizeTextArray(item.steps),
    parentPrompt: String(item.parent_prompt || item.parentPrompt || '').trim(),
    content: String(item.content || '').trim(),
    tips: normalizeTextArray(item.tips),
    exampleAnswer: String(item.example_answer || item.exampleAnswer || '').trim()
  };
  const [rows] = await connection.execute('SELECT id FROM reading_tasks WHERE task_code = ? LIMIT 1', [payload.taskCode]);
  if (options.dryRun) {
    return rows.length ? 'updated' : 'inserted';
  }
  await connection.execute(
    `INSERT INTO reading_tasks
      (task_code, title, subject_code, age_range, difficulty, duration, material, objective, steps, parent_prompt, content, image_url, icon_url, cover_image, audio_url, video_url, tips, example_answer)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', '', '', '', ?, ?)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       subject_code = VALUES(subject_code),
       age_range = VALUES(age_range),
       difficulty = VALUES(difficulty),
       duration = VALUES(duration),
       material = VALUES(material),
       objective = VALUES(objective),
       steps = VALUES(steps),
       parent_prompt = VALUES(parent_prompt),
       content = VALUES(content),
       tips = VALUES(tips),
       example_answer = VALUES(example_answer)`,
    [payload.taskCode, payload.title, payload.subjectCode, payload.ageRange, payload.difficulty, payload.duration, payload.material, payload.objective, payload.steps, payload.parentPrompt, payload.content, payload.tips, payload.exampleAnswer]
  );
  return rows.length ? 'updated' : 'inserted';
}

async function upsertScene(connection, item, options) {
  const sceneKey = String(item.scene_key || item.sceneKey || '').trim();
  const sceneTitle = String(item.scene_title || item.sceneTitle || '').trim();
  const sceneCategory = String(item.scene_category || item.sceneCategory || '').trim();
  if (!sceneKey || !sceneTitle || !sceneCategory) {
    throw new Error('scene 缺少 scene_key、scene_title 或 scene_category');
  }

  const payload = {
    sceneKey,
    sceneTitle,
    sceneCategory,
    principleText: String(item.principle_text || item.principleText || '').trim(),
    suggestedAction: String(item.suggested_action || item.suggestedAction || '').trim(),
    aliases: normalizeSceneArray(item.aliases),
    recommendations: Array.isArray(item.recommendations) ? item.recommendations : []
  };

  const [rows] = await connection.execute('SELECT id FROM parenting_scene_tags WHERE scene_key = ? LIMIT 1', [payload.sceneKey]);
  if (!options.dryRun) {
    await connection.execute(
      `INSERT INTO parenting_scene_tags
        (scene_key, scene_title, scene_category, principle_text, suggested_action, status, sort_order)
       VALUES (?, ?, ?, ?, ?, 'active', 0)
       ON DUPLICATE KEY UPDATE
         scene_title = VALUES(scene_title),
         scene_category = VALUES(scene_category),
         principle_text = VALUES(principle_text),
         suggested_action = VALUES(suggested_action),
         status = 'active'`,
      [payload.sceneKey, payload.sceneTitle, payload.sceneCategory, payload.principleText, payload.suggestedAction]
    );

    for (let index = 0; index < payload.aliases.length; index += 1) {
      await connection.execute(
        `INSERT INTO parenting_scene_aliases (scene_key, alias_text, status, sort_order)
         VALUES (?, ?, 'active', ?)
         ON DUPLICATE KEY UPDATE
           status = 'active',
           sort_order = VALUES(sort_order)`,
        [payload.sceneKey, payload.aliases[index], index + 1]
      );
    }

    for (let index = 0; index < payload.recommendations.length; index += 1) {
      const recommendation = normalizeSceneRecommendation(payload.recommendations[index]);
      if (!recommendation.title || !recommendation.resultType) {
        throw new Error(`scene ${payload.sceneKey} 的 recommendation 缺少 title 或 result_type`);
      }
      await connection.execute(
        `INSERT INTO parenting_scene_recommendations
          (scene_key, result_type, title, summary, target_type, target_id, target_path, age_group, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           summary = VALUES(summary),
           target_type = VALUES(target_type),
           target_id = VALUES(target_id),
           target_path = VALUES(target_path),
           age_group = VALUES(age_group),
           sort_order = VALUES(sort_order)`,
        [payload.sceneKey, recommendation.resultType, recommendation.title, recommendation.summary, recommendation.targetType, recommendation.targetId, recommendation.targetPath, recommendation.ageGroup, index + 1]
      );
    }
  }

  return rows.length ? 'updated' : 'inserted';
}

function normalizeSceneRecommendation(item) {
  return {
    resultType: String((item && (item.result_type || item.resultType)) || '').trim(),
    title: String((item && item.title) || '').trim(),
    summary: String((item && item.summary) || '').trim(),
    targetType: String((item && (item.target_type || item.targetType)) || '').trim(),
    targetId: String((item && (item.target_id || item.targetId)) || '').trim(),
    targetPath: String((item && (item.target_path || item.targetPath)) || '').trim(),
    ageGroup: String((item && (item.age_group || item.ageGroup)) || '').trim()
  };
}

function normalizePositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.round(parsed);
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

function formatErrorMessage(error) {
  if (!error) {
    return 'unknown error';
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message;
  }

  if (Array.isArray(error.errors) && error.errors.length) {
    return error.errors
      .map((item) => item && (item.message || item.code || item.name) || 'unknown nested error')
      .join('; ');
  }

  return error.code || error.name || String(error);
}

main().catch((error) => {
  console.error('[knowledge-import]', formatErrorMessage(error));
  process.exit(1);
});
