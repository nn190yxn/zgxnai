#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    connectionLimit: 2,
    queueLimit: 0
  });

  let pass = true;
  try {
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM articles WHERE is_published = 1');

    if (total === 0) {
      console.log('[verify:articles-form] SKIP (empty table)');
      return;
    }

    const [[{ theoryCount }]] = await pool.execute(
      "SELECT COUNT(*) AS theoryCount FROM articles WHERE content_form = 'theory' AND is_published = 1"
    );
    const [[{ methodCount }]] = await pool.execute(
      "SELECT COUNT(*) AS methodCount FROM articles WHERE content_form = 'method' AND is_published = 1"
    );
    const [[{ bothCount }]] = await pool.execute(
      "SELECT COUNT(*) AS bothCount FROM articles WHERE content_form = 'both' AND is_published = 1"
    );
    const [[{ nullCount }]] = await pool.execute(
      "SELECT COUNT(*) AS nullCount FROM articles WHERE (content_form IS NULL OR content_form = '') AND is_published = 1"
    );

    const pct = (n) => ((n / total) * 100).toFixed(1) + '%';
    console.log(`[verify:articles-form] total=${total} theory=${theoryCount} (${pct(theoryCount)}) method=${methodCount} (${pct(methodCount)}) both=${bothCount} (${pct(bothCount)}) unclassified=${nullCount} (${pct(nullCount)})`);

    const filled = theoryCount + methodCount + bothCount;
    const filledPct = (filled / total) * 100;
    if (filledPct < 50) {
      console.error(`[verify:articles-form] FAIL classified_ratio=${filledPct.toFixed(1)}% < 50%`);
      pass = false;
    } else {
      console.log(`[verify:articles-form] PASS classified_ratio=${filledPct.toFixed(1)}% >= 50%`);
    }

    const [[{ invalidCount }]] = await pool.execute(
      "SELECT COUNT(*) AS invalidCount FROM articles WHERE content_form IS NOT NULL AND content_form NOT IN ('theory', 'method', 'both') AND is_published = 1"
    );
    if (invalidCount > 0) {
      console.error(`[verify:articles-form] FAIL invalid_values=${invalidCount}`);
      pass = false;
    } else {
      console.log(`[verify:articles-form] PASS valid_values (no out-of-range)`);
    }

    const [[{ fieldIntact }]] = await pool.execute(
      `SELECT COUNT(*) AS fieldIntact FROM articles WHERE title IS NOT NULL AND content IS NOT NULL`
    );
    if (fieldIntact !== total) {
      console.error(`[verify:articles-form] FAIL old_fields_modified intact=${fieldIntact} expected=${total}`);
      pass = false;
    } else {
      console.log(`[verify:articles-form] PASS old_fields_intact=${fieldIntact}/${total}`);
    }

    if (!pass) {
      console.error('[verify:articles-form] OVERALL FAIL');
      process.exit(1);
    }
    console.log('[verify:articles-form] OVERALL PASS');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[verify:articles-form] FATAL', err.message);
  process.exit(1);
});
