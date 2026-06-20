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
    const [[{ total }]] = await pool.execute('SELECT COUNT(*) AS total FROM parenting_tips WHERE is_active = 1');

    const [[{ actionCount }]] = await pool.execute(
      "SELECT COUNT(*) AS actionCount FROM parenting_tips WHERE display_type = 'action'"
    );
    const [[{ insightCount }]] = await pool.execute(
      "SELECT COUNT(*) AS insightCount FROM parenting_tips WHERE display_type = 'insight'"
    );
    const [[{ rawCount }]] = await pool.execute(
      "SELECT COUNT(*) AS rawCount FROM parenting_tips WHERE display_type = 'raw' OR display_type IS NULL OR display_type = ''"
    );

    const pct = (n) => ((n / total) * 100).toFixed(1) + '%';
    console.log(`[verify:tips-structure] total=${total} action=${actionCount} (${pct(actionCount)}) insight=${insightCount} (${pct(insightCount)}) raw=${rawCount} (${pct(rawCount)})`);

    if (total === 0) {
      console.log('[verify:tips-structure] SKIP (empty table)');
      return;
    }

    const [[{ actionFilled }]] = await pool.execute(
      "SELECT COUNT(*) AS actionFilled FROM parenting_tips WHERE display_type = 'action' AND display_title IS NOT NULL AND display_text IS NOT NULL"
    );
    if (actionCount > 0) {
      const filledPct = ((actionFilled / actionCount) * 100).toFixed(1);
      console.log(`[verify:tips-structure] action_filled=${actionFilled}/${actionCount} (${filledPct}%)`);
      if (filledPct < 95) {
        console.error(`[verify:tips-structure] FAIL action_filled=${filledPct}% < 95%`);
        pass = false;
      } else {
        console.log('[verify:tips-structure] PASS action_filled >= 95%');
      }
    }

    const [[{ longTextCount }]] = await pool.execute(
      "SELECT COUNT(*) AS longTextCount FROM parenting_tips WHERE display_type = 'action' AND CHAR_LENGTH(display_text) > 200"
    );
    if (longTextCount > 0) {
      console.error(`[verify:tips-structure] FAIL display_text_too_long=${longTextCount} > 200 chars`);
      pass = false;
    } else {
      console.log('[verify:tips-structure] PASS display_text max_length <= 200');
    }

    const [[{ longTitleCount }]] = await pool.execute(
      "SELECT COUNT(*) AS longTitleCount FROM parenting_tips WHERE display_type = 'action' AND CHAR_LENGTH(display_title) > 40"
    );
    if (longTitleCount > 0) {
      console.warn(`[verify:tips-structure] WARN display_title_too_long=${longTitleCount} > 40 chars`);
    } else {
      console.log('[verify:tips-structure] PASS display_title max_length <= 40');
    }

    const rawPct = (rawCount / total) * 100;
    if (rawPct > 15) {
      console.error(`[verify:tips-structure] FAIL raw_ratio=${rawPct.toFixed(1)}% > 15%`);
      pass = false;
    } else {
      console.log(`[verify:tips-structure] PASS raw_ratio=${rawPct.toFixed(1)}% <= 15%`);
    }

    const [[{ sourceFilled }]] = await pool.execute(
      "SELECT COUNT(*) AS sourceFilled FROM parenting_tips WHERE display_source_id IS NOT NULL AND display_source_id > 0 AND display_type IN ('action', 'insight')"
    );
    const structuredTotal = actionCount + insightCount;
    if (structuredTotal > 0) {
      const sourcePct = ((sourceFilled / structuredTotal) * 100).toFixed(1);
      console.log(`[verify:tips-structure] source_linked=${sourceFilled}/${structuredTotal} (${sourcePct}%)`);
    }

    const [[{ fieldIntact }]] = await pool.execute(
      `SELECT COUNT(*) AS fieldIntact FROM parenting_tips WHERE content IS NOT NULL AND title IS NOT NULL AND category IS NOT NULL`
    );
    if (fieldIntact !== total) {
      console.error(`[verify:tips-structure] FAIL old_fields_modified intact=${fieldIntact} expected=${total}`);
      pass = false;
    } else {
      console.log(`[verify:tips-structure] PASS old_fields_intact=${fieldIntact}/${total}`);
    }

    if (!pass) {
      console.error('[verify:tips-structure] OVERALL FAIL');
      process.exit(1);
    }
    console.log('[verify:tips-structure] OVERALL PASS');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[verify:tips-structure] FATAL', err.message);
  process.exit(1);
});
