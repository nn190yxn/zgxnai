const fs = require('fs');
const path = require('path');
const snapshot = require('../../examples/pain-points-snapshot.json');
const { normalizePainPoint } = require('../mysql-production/pain-points');

function buildSnapshot() {
  return snapshot.map(normalizePainPoint);
}

async function importPainPoints(pool, { dryRun = false } = {}) {
  const rows = buildSnapshot();
  const report = { inserted: 0, skipped: 0, failed: 0, total: rows.length };
  if (dryRun) return report;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const row of rows) {
      const [result] = await connection.execute(`INSERT INTO pain_points (pain_point_key, category, short_title, description, observable_signs, possible_reasons, today_action, parent_prompt, observe_signals, content_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category), short_title = VALUES(short_title), description = VALUES(description), observable_signs = VALUES(observable_signs), possible_reasons = VALUES(possible_reasons), today_action = VALUES(today_action), parent_prompt = VALUES(parent_prompt), observe_signals = VALUES(observe_signals), content_hash = VALUES(content_hash)`, [row.pain_point_key, row.category, row.short_title, row.description, JSON.stringify(row.observable_signs), JSON.stringify(row.possible_reasons), JSON.stringify(row.today_action), row.parent_prompt, JSON.stringify(row.observe_signals), row.content_hash]);
      if (result.affectedRows === 1) report.inserted += 1; else report.skipped += 1;
    }
    await connection.commit();
    return report;
  } catch (error) { await connection.rollback(); throw error; } finally { connection.release(); }
}

if (require.main === module) {
  const output = path.resolve(__dirname, '../../examples/pain-points-snapshot.normalized.json');
  fs.writeFileSync(output, JSON.stringify(buildSnapshot(), null, 2));
  process.stdout.write(`pain point snapshot written: ${output}\n`);
}

module.exports = { buildSnapshot, importPainPoints };
