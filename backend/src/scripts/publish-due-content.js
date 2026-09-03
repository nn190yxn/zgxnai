const { publishDue } = require('../mysql-production/content-publishing');
const mysql = require('mysql2/promise');
const { recordAlert, safeError } = require('../mysql-production/release-protection');

async function runPublishDue(pool, now = new Date()) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const count = await publishDue(connection, now);
    await connection.commit();
    return { published: count, at: now.toISOString() };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { runPublishDue };

if (require.main === module) {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 2
  });
  runPublishDue(pool).then((result) => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return pool.end();
  }).catch(async (error) => {
    await recordAlert({ event: 'publish_due_failed', code: safeError(error).code }, { filePath: process.env.RELEASE_ALERT_LOG_PATH });
    process.stderr.write('定时发布任务失败，已记录告警\n');
    await pool.end();
    process.exitCode = 1;
  });
}
