const crypto = require('crypto');
const defaultMigrations = require('./migrations');

const MIGRATION_LOCK_NAME = 'niuniu_parenting_schema_migrations';

function migrationChecksum(migration) {
  return crypto
    .createHash('sha256')
    .update([migration.version, migration.name, ...migration.statements].join('\n'))
    .digest('hex');
}

function assertMigration(migration) {
  if (!migration || !migration.version || !migration.name || !Array.isArray(migration.statements) || migration.statements.length === 0) {
    throw new Error('Invalid MySQL migration definition');
  }
}

async function ensureMigrationTable(connection) {
  await connection.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(128) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    checksum CHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    started_at DATETIME NULL,
    finished_at DATETIME NULL,
    failed_at DATETIME NULL,
    rolled_back_at DATETIME NULL,
    error_message TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_schema_migrations_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
}

async function executeMigrationStatement(connection, statement) {
  const addColumnMatch = String(statement).match(
    /^ALTER TABLE ([A-Za-z0-9_]+) ADD COLUMN IF NOT EXISTS ([A-Za-z0-9_]+) (.+)$/i
  );
  if (!addColumnMatch) {
    await connection.execute(statement);
    return;
  }

  const [, tableName, columnName, definition] = addColumnMatch;
  const [rows] = await connection.execute(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?
     LIMIT 1`,
    [tableName, columnName]
  );
  if (rows.length) return;
  await connection.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
}

async function runMigration(connection, migration) {
  assertMigration(migration);
  const checksum = migrationChecksum(migration);
  const [rows] = await connection.execute(
    'SELECT version, checksum, status FROM schema_migrations WHERE version = ? LIMIT 1',
    [migration.version]
  );
  const existing = rows[0];

  if (existing && existing.status === 'applied') {
    if (existing.checksum !== checksum) {
      throw new Error(`Applied migration checksum mismatch: ${migration.version}`);
    }
    return { version: migration.version, status: 'skipped' };
  }

  await connection.execute(
    `INSERT INTO schema_migrations
      (version, name, checksum, status, started_at, finished_at, failed_at, rolled_back_at, error_message)
     VALUES (?, ?, ?, 'running', NOW(), NULL, NULL, NULL, NULL)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name), checksum = VALUES(checksum), status = 'running', started_at = NOW(),
       finished_at = NULL, failed_at = NULL, rolled_back_at = NULL, error_message = NULL`,
    [migration.version, migration.name, checksum]
  );

  await connection.beginTransaction();
  try {
    for (const statement of migration.statements) {
      await executeMigrationStatement(connection, statement);
    }
    await connection.commit();
    await connection.execute(
      `UPDATE schema_migrations
       SET status = 'applied', finished_at = NOW(), failed_at = NULL, rolled_back_at = NULL, error_message = NULL
       WHERE version = ?`,
      [migration.version]
    );
    return { version: migration.version, status: 'applied' };
  } catch (err) {
    await connection.rollback();
    await connection.execute(
      `UPDATE schema_migrations
       SET status = 'failed', failed_at = NOW(), rolled_back_at = NOW(), error_message = ?
       WHERE version = ?`,
      [String(err && err.message ? err.message : err).slice(0, 2000), migration.version]
    );
    throw err;
  }
}

async function runMigrations(pool, migrations = defaultMigrations, options = {}) {
  const connection = await pool.getConnection();
  const lockTimeoutSeconds = Number.isInteger(options.lockTimeoutSeconds) ? options.lockTimeoutSeconds : 30;
  let lockAcquired = false;

  try {
    const [lockRows] = await connection.execute('SELECT GET_LOCK(?, ?) AS acquired', [MIGRATION_LOCK_NAME, lockTimeoutSeconds]);
    lockAcquired = Boolean(lockRows[0] && Number(lockRows[0].acquired) === 1);
    if (!lockAcquired) {
      throw new Error('Timed out waiting for MySQL migration lock');
    }

    await ensureMigrationTable(connection);
    const results = [];
    for (const migration of migrations) {
      results.push(await runMigration(connection, migration));
    }
    return results;
  } finally {
    if (lockAcquired) {
      await connection.execute('SELECT RELEASE_LOCK(?) AS released', [MIGRATION_LOCK_NAME]);
    }
    connection.release();
  }
}

module.exports = {
  MIGRATION_LOCK_NAME,
  migrationChecksum,
  executeMigrationStatement,
  runMigrations
};
