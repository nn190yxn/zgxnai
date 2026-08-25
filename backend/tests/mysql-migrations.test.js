const migrations = require('../src/mysql-production/migrations');
const { executeMigrationStatement, migrationChecksum, runMigrations } = require('../src/mysql-production/migration-runner');

function createFakePool(options = {}) {
  const records = new Map();
  const statements = [];
  let transactionStarted = false;
  let rollbackCount = 0;

  const connection = {
    async execute(sql, params = []) {
      statements.push(sql);
      if (sql.includes('GET_LOCK')) return [[{ acquired: options.lockAcquired === false ? 0 : 1 }]];
      if (sql.includes('RELEASE_LOCK')) return [[{ released: 1 }]];
      if (sql.startsWith('SELECT version, checksum, status')) {
        const record = records.get(params[0]);
        return [record ? [record] : []];
      }
      if (sql.includes('INSERT INTO schema_migrations')) {
        records.set(params[0], { version: params[0], name: params[1], checksum: params[2], status: 'running' });
        return [{}];
      }
      if (options.failOn && sql.includes(options.failOn)) {
        throw new Error('simulated migration failure');
      }
      if (sql.includes("SET status = 'applied'")) {
        records.get(params[0]).status = 'applied';
      }
      if (sql.includes("SET status = 'failed'")) {
        records.get(params[1]).status = 'failed';
        records.get(params[1]).errorMessage = params[0];
      }
      return [{}];
    },
    async beginTransaction() { transactionStarted = true; },
    async commit() { transactionStarted = false; },
    async rollback() { transactionStarted = false; rollbackCount += 1; },
    release: jest.fn()
  };

  return {
    pool: { getConnection: async () => connection },
    records,
    statements,
    get transactionStarted() { return transactionStarted; },
    get rollbackCount() { return rollbackCount; }
  };
}

describe('MySQL 迁移执行器', () => {
  it('创建任务要求的五类基础表', () => {
    const sql = migrations.flatMap((migration) => migration.statements).join('\n');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS ability_profiles');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS training_feedbacks');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS growth_timeline_entries');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS knowledge_content_metadata');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS analytics_daily_aggregates');
  });

  it('在 MySQL 中以列查询实现 ADD COLUMN 幂等兼容', async () => {
    const connection = {
      execute: jest.fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{}])
    };

    await executeMigrationStatement(
      connection,
      'ALTER TABLE ability_profiles ADD COLUMN IF NOT EXISTS observation_submission_id BIGINT NULL'
    );

    expect(connection.execute).toHaveBeenNthCalledWith(1, expect.stringContaining('information_schema.columns'), [
      'ability_profiles',
      'observation_submission_id'
    ]);
    expect(connection.execute).toHaveBeenNthCalledWith(2, 'ALTER TABLE `ability_profiles` ADD COLUMN `observation_submission_id` BIGINT NULL');
  });

  it('目标列已存在时跳过 ADD COLUMN', async () => {
    const connection = { execute: jest.fn().mockResolvedValue([[{ exists: 1 }]]) };

    await executeMigrationStatement(
      connection,
      'ALTER TABLE training_feedbacks ADD COLUMN IF NOT EXISTS plan_id BIGINT NULL'
    );

    expect(connection.execute).toHaveBeenCalledTimes(1);
  });

  it('重复执行已应用迁移时跳过建表语句', async () => {
    const fake = createFakePool();
    expect(await runMigrations(fake.pool)).toEqual(migrations.map((migration) => ({ version: migration.version, status: 'applied' })));
    const statementCount = fake.statements.length;

    expect(await runMigrations(fake.pool)).toEqual(migrations.map((migration) => ({ version: migration.version, status: 'skipped' })));
    expect(fake.statements.slice(statementCount).some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS ability_profiles'))).toBe(false);
    expect(fake.records.get(migrations[0].version).checksum).toBe(migrationChecksum(migrations[0]));
  });

  it('迁移失败时回滚并记录失败状态', async () => {
    const fake = createFakePool({ failOn: 'growth_timeline_entries' });

    await expect(runMigrations(fake.pool)).rejects.toThrow('simulated migration failure');
    expect(fake.rollbackCount).toBe(1);
    expect(fake.transactionStarted).toBe(false);
    expect(fake.records.get(migrations[0].version)).toEqual(expect.objectContaining({
      status: 'failed',
      errorMessage: 'simulated migration failure'
    }));
    expect(fake.statements.some((sql) => sql.includes('rolled_back_at = NOW()'))).toBe(true);
  });

  it('迁移锁等待超时时释放连接且不尝试释放未持有的锁', async () => {
    const fake = createFakePool({ lockAcquired: false });

    await expect(runMigrations(fake.pool, migrations, { lockTimeoutSeconds: 0 })).rejects.toThrow('Timed out waiting for MySQL migration lock');
    expect(fake.statements.some((sql) => sql.includes('RELEASE_LOCK'))).toBe(false);
    expect((await fake.pool.getConnection()).release).toHaveBeenCalledTimes(1);
  });

  it('已应用迁移内容变化时拒绝继续执行并释放迁移锁', async () => {
    const fake = createFakePool();
    await runMigrations(fake.pool, [migrations[0]]);
    fake.records.get(migrations[0].version).checksum = 'changed-checksum';

    await expect(runMigrations(fake.pool, [migrations[0]])).rejects.toThrow(`Applied migration checksum mismatch: ${migrations[0].version}`);
    expect(fake.statements.filter((sql) => sql.includes('RELEASE_LOCK'))).toHaveLength(2);
  });
});
