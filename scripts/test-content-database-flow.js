const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const express = require('express');
const request = require('supertest');
const { registerPlatformRoutes, registerPublicRoutes } = require('../backend/src/mysql-production/platform-routes');
const { publishDue } = require('../backend/src/mysql-production/content-publishing');
const { sourceItems } = require('../backend/src/mysql-production/managed-editing');
const { listRecipes } = require('../backend/src/mysql-production/recipe-content');
const migrations = require('../backend/src/mysql-production/migrations');

async function main() {
  // Use an explicitly supplied local socket and a fresh database for each run.
  const socketPath = process.argv[2];
  assert.ok(socketPath && path.isAbsolute(socketPath), 'Pass the isolated database socket path');
  const database = `content_test_${Date.now()}_${process.pid}`;
  const setup = await mysql.createConnection({ socketPath, user: 'root' });
  await setup.query(`CREATE DATABASE ${database} CHARACTER SET utf8mb4`);
  await setup.end();
  const pool = mysql.createPool({ socketPath, user: 'root', database, connectionLimit: 4 });
  try {
    const source = fs.readFileSync(path.join(__dirname, '../backend/src/mysql-production/server.js'), 'utf8');
    for (const table of ['articles', 'reading_tasks', 'admin_audit_logs']) {
      const sql = source.match(new RegExp('CREATE TABLE IF NOT EXISTS ' + table + ' \\([\\s\\S]*?ENGINE=InnoDB[^`]+'));
      assert.ok(sql, `Missing production schema: ${table}`);
      await pool.query(sql[0]);
    }
    for (const match of source.matchAll(/ensureColumnExists\('(articles|reading_tasks|admin_audit_logs)', '([^']+)', '([^']+)'\)/g)) {
      const [, table, column, definition] = match;
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
    }
    for (const migration of migrations.filter((item) => item.version.startsWith('20260902_'))) {
      for (const sql of migration.statements) await pool.query(sql);
    }
    const app = express();
    app.use(express.json());
    registerPlatformRoutes(app, { prefix: '/admin', pool, uploadRoot: '/tmp/opencode', releaseFlags: { adminContentWrite: true }, authenticateAdmin: (req, res, next) => { req.admin = { adminUserId: 1, role: 'super_admin' }; next(); } });
    registerPublicRoutes(app, { prefix: '/public', pool, releaseFlags: { serverContentRead: true }, authenticateToken: (req, res, next) => next() });
    app.use((error, req, res, next) => res.status(error.statusCode || 500).json({ success: false, message: error.message }));
    async function call(method, url, body = {}) {
      const res = await request(app)[method](url).send(body);
      assert.ok(res.status >= 200 && res.status < 300, `${method} ${url}: ${res.status} ${JSON.stringify(res.body)}`);
      return res.body;
    }
    async function approve(type, id) {
      await call('post', `/admin/content/${type}/${id}/submit-review`);
      await call('post', `/admin/content/${type}/${id}/approve`);
    }
    async function publish(type, id) {
      await approve(type, id);
      await call('post', `/admin/content/${type}/${id}/publish`);
    }
    async function due() {
      const connection = await pool.getConnection();
      try { await connection.beginTransaction(); const count = await publishDue(connection); await connection.commit(); return count; }
      catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    }
    const article = await call('post', '/admin/articles', { title: 'Live article', content: 'Live body', age_group: '3-6岁' });
    const id = article.data.id;
    await publish('article', id);
    await call('put', `/admin/articles/${id}`, { title: 'Draft article', content: 'Draft body' });
    const [live] = await pool.execute('SELECT * FROM articles WHERE id = ?', [id]);
    assert.equal(live[0].title, 'Live article');
    assert.equal(live[0].is_published, 1);
    const list = await call('get', '/admin/articles');
    assert.equal(list.list.find((item) => item.id === id).title, 'Draft article');
    await publish('article', id);
    await call('post', `/admin/content/article/${id}/restore`, { version: 1 });
    await publish('article', id);
    const [restored] = await pool.execute('SELECT * FROM articles WHERE id = ?', [id]);
    assert.equal(restored[0].content, 'Live body');
    console.log('PASS article draft, list, publish and restore');

    const pain = { pain_point_key: 'called_no_response', category: '做事与学习', short_title: 'Published pain', description: 'Original', today_action: { title: 'Action' } };
    await call('post', '/admin/pain-points', pain);
    await publish('pain_point', pain.pain_point_key);
    await call('put', `/admin/pain-points/${pain.pain_point_key}`, { ...pain, description: 'Draft' });
    assert.equal((await call('get', `/public/pain-points/${pain.pain_point_key}`)).data.description, 'Original');
    console.log('PASS pain point public snapshot isolation');

    await pool.execute('INSERT INTO reading_tasks (task_code, title, subject_code, duration, steps) VALUES (?, ?, ?, ?, ?)', ['reading_test', 'Old task', 'reading', 10, 'Old step']);
    await call('put', '/admin/content/managed/task/reading_test', { title: 'Updated task', steps: ['First', 'Second'] });
    const [taskBefore] = await pool.execute('SELECT * FROM reading_tasks WHERE task_code = ?', ['reading_test']);
    assert.equal(taskBefore[0].title, 'Old task');
    await publish('task', 'reading_test');
    const [taskAfter] = await pool.execute('SELECT * FROM reading_tasks WHERE task_code = ?', ['reading_test']);
    assert.equal(taskAfter[0].id, taskBefore[0].id);
    assert.equal(taskAfter[0].title, 'Updated task');
    assert.deepEqual(JSON.parse(taskAfter[0].steps), ['First', 'Second']);
    const [versionCount] = await pool.execute("SELECT COUNT(*) AS total FROM content_versions WHERE content_type = 'task'");
    const invalid = await request(app).put('/admin/content/managed/task/reading_test').send({ duration: 0 });
    assert.equal(invalid.status, 400);
    const [afterInvalid] = await pool.execute("SELECT COUNT(*) AS total FROM content_versions WHERE content_type = 'task'");
    assert.equal(afterInvalid[0].total, versionCount[0].total);
    console.log('PASS task business projection and stable ID');

    const [recipe] = await sourceItems(pool, 'recipe');
    await call('put', `/admin/content/managed/recipe/${recipe.id}`, { title: 'Published recipe' });
    await publish('recipe', recipe.id);
    await call('put', `/admin/content/managed/recipe/${recipe.id}`, { title: 'Draft recipe' });
    assert.equal((await listRecipes(pool, [recipe]))[0].title, 'Published recipe');
    await publish('recipe', recipe.id);
    await call('post', `/admin/content/recipe/${recipe.id}/offline`);
    assert.deepEqual(await listRecipes(pool, [recipe]), []);
    console.log('PASS recipe draft isolation and offline tombstone');

    await call('put', `/admin/articles/${id}`, { title: 'Scheduled older' });
    await approve('article', id);
    await call('post', `/admin/content/article/${id}/schedule`, { scheduled_at: '2020-01-01T00:00:00Z' });
    await call('put', `/admin/articles/${id}`, { title: 'Newer published' });
    await publish('article', id);
    await due();
    const [latest] = await pool.execute('SELECT title FROM articles WHERE id = ?', [id]);
    assert.equal(latest[0].title, 'Newer published', 'An old scheduled job must preserve the newer public version');
    const [jobs] = await pool.execute('SELECT status, failure_code, attempt_count FROM content_publish_jobs WHERE content_type = ? AND content_id = ?', ['article', String(id)]);
    assert.equal(jobs[0].status, 'failed');
    assert.equal(jobs[0].attempt_count, 1);
    assert.equal(await due(), 0);
    console.log('PASS outdated scheduled job preserves newer publication');
    await call('put', `/admin/articles/${id}`, { title: 'Current scheduled' });
    await approve('article', id);
    await call('post', `/admin/content/article/${id}/schedule`, { scheduled_at: '2020-01-01T00:00:00Z' });
    assert.equal(await due(), 1);
    const [scheduled] = await pool.execute('SELECT title, is_published FROM articles WHERE id = ?', [id]);
    assert.equal(scheduled[0].title, 'Current scheduled');
    assert.equal(scheduled[0].is_published, 1);
    assert.equal(await due(), 0);
    console.log('PASS current scheduled publication and repeated execution');
    console.log(`Database integration passed; retained isolated database: ${database}`);
  } finally { await pool.end(); }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
