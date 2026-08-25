const {
  GrowthTimelineValidationError,
  normalizeEntry,
  saveTimelineEntry,
  listTimelineEntries
} = require('../src/mysql-production/growth-timeline');

function createTimelinePool() {
  const rows = [];
  const compatibility = [];
  return {
    rows,
    compatibility,
    async execute(sql, params = []) {
      if (sql.includes('api_compatibility_stats')) {
        compatibility.push(params);
        return [{}];
      }
      if (sql.startsWith('SELECT * FROM growth_timeline_entries WHERE child_id = ? AND idempotency_key')) {
        return [rows.filter((row) => row.child_id === params[0] && row.idempotency_key === params[1])];
      }
      if (sql.startsWith('SELECT * FROM growth_timeline_entries WHERE entry_id')) {
        return [rows.filter((row) => row.entry_id === params[0])];
      }
      if (sql.startsWith('SELECT COUNT(*)')) {
        return [[{ total: rows.filter((row) => row.child_id === params[0]).length }]];
      }
      if (sql.startsWith('SELECT * FROM growth_timeline_entries WHERE child_id')) {
        return [rows.filter((row) => row.child_id === params[0]).slice().sort((a, b) => b.id - a.id).slice(params[2], params[2] + params[1])];
      }
      if (sql.startsWith('INSERT INTO growth_timeline_entries')) {
        const row = {
          id: rows.length + 1,
          entry_id: params[0],
          child_id: params[1],
          entry_type: params[2],
          source_type: params[3],
          source_id: params[4],
          ability_codes: params[5],
          occurred_at: params[6],
          title: params[7],
          summary: params[8],
          dimensions: params[9],
          metadata: params[10],
          idempotency_key: params[11],
          created_at: new Date(),
          updated_at: new Date()
        };
        rows.push(row);
        return [{ insertId: row.id }];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    }
  };
}

describe('成长时间线存储服务', () => {
  it('兼容旧字段并将 core_action 映射为统一来源', () => {
    const entry = normalizeEntry({
      child_id: 7,
      entry_type: 'core_action',
      source_type: 'core_action',
      source_id: 'homework_restless',
      title: '写作业坐不住',
      user_note: '先做一个两分钟动作',
      ability_codes: ['focus', 'focus']
    });

    expect(entry.childId).toBe(7);
    expect(entry.entryType).toBe('core_action');
    expect(entry.sourceType).toBe('core_action');
    expect(entry.abilityCodes).toEqual(['focus']);
    expect(entry.metadata.user_note).toBe('先做一个两分钟动作');
    expect(entry.legacyFields).toEqual(expect.arrayContaining(['entry_type', 'source_type', 'source_id', 'ability_codes', 'idempotency_key']));
  });

  it('同一幂等标识重复写入只产生一条时间线记录', async () => {
    const pool = createTimelinePool();
    const payload = { childId: 7, entryType: 'training_complete', sourceType: 'training', title: '专注训练', idempotencyKey: 'task-1-done' };
    const first = await saveTimelineEntry(pool, payload);
    const second = await saveTimelineEntry(pool, payload);

    expect(pool.rows).toHaveLength(1);
    expect(first.deduplicated).toBe(false);
    expect(second.deduplicated).toBe(true);
    expect(second.entry.entryId).toBe(first.entry.entryId);
  });

  it('分页查询按孩子隔离并返回分页信息', async () => {
    const pool = createTimelinePool();
    await saveTimelineEntry(pool, { childId: 1, entryType: 'daily_status', sourceType: 'daily_status', title: '状态1', idempotencyKey: '1' });
    await saveTimelineEntry(pool, { childId: 2, entryType: 'daily_status', sourceType: 'daily_status', title: '状态2', idempotencyKey: '2' });
    const result = await listTimelineEntries(pool, { childId: 1, page: 1, pageSize: 10 });

    expect(result.list).toHaveLength(1);
    expect(result.list[0].childId).toBe(1);
    expect(result.pagination).toEqual({ page: 1, pageSize: 10, total: 1 });
  });

  it('拒绝未知来源类型', () => {
    expect(() => normalizeEntry({ childId: 1, entryType: 'unknown', title: 'x' })).toThrow(GrowthTimelineValidationError);
  });
});
