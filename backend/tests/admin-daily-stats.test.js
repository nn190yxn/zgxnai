const stats = require('../src/scripts/build-admin-daily-stats');
const {
  aggregateContentCoverage,
  aggregateEventQuality,
  EVENT_COMMON_FIELDS,
  validateAnalyticsQuery
} = require('../src/mysql-production/analytics-quality');
const { aggregateOperationsMetrics, aggregateSupportMetrics, safeObject } = require('../src/mysql-production/operations-analytics');

describe('后台日统计 SQL 边界', () => {
  it('保留日期格式化的自然日边界', () => {
    expect(stats.formatDate(new Date('2026-08-21T12:00:00.000Z'))).toBe('2026-08-21');
  });

  it('统计脚本暴露统一内容维度 SQL 构造器', () => {
    expect(stats.buildFeatureKeySql('event_data', 'event_type')).toContain('module_key');
    expect(stats.buildContentTypeSql('event_data', 'event_type')).toContain('content_type');
  });

  it('固定样本返回事件质量指标和内容覆盖缺口', () => {
    const events = [
      {
        event_id: 'evt_1',
        event_data: JSON.stringify({
          event_id: 'evt_1',
          client_session_id: 'session_1',
          child_id: 10,
          age_segment_code: 'age_3_4',
          ability_codes: ['attention'],
          source_content_type: 'article',
          occurred_at: '2026-08-21T10:00:00.000Z',
          schema_version: 1
        }),
        created_at: '2026-08-21T10:05:00.000Z'
      },
      {
        event_id: 'evt_1',
        event_data: JSON.stringify({ event_id: 'evt_1', age_segment_code: 'age_unknown', ability_codes: ['unknown_ability'] }),
        created_at: '2026-08-21T12:00:00.000Z'
      },
      {
        event_id: 'evt_3',
        event_data: JSON.stringify({ occurred_at: '2026-08-19T12:00:00.000Z' }),
        created_at: '2026-08-21T12:00:00.000Z'
      }
    ];
    const quality = aggregateEventQuality(events);
    expect(quality.total_event_count).toBe(3);
    expect(quality.duplicate_count).toBe(1);
    expect(quality.late_count).toBe(1);
    expect(quality.no_child_count).toBe(2);
    expect(quality.field_coverage).toHaveProperty('event_id');
    expect(quality.unknown_values.age_segment_code).toEqual([{ value: 'age_unknown', count: 1 }]);
    expect(quality.unknown_values.ability_codes).toEqual([{ value: 'unknown_ability', count: 1 }]);

    const coverage = aggregateContentCoverage([
      { age_segment_codes: ['age_3_4'], ability_codes: ['attention'], scene_codes: ['learning_focus'], content_form: 'article', is_published: 1 },
      { age_segment_codes: ['age_3_4'], ability_codes: ['attention'], scene_codes: ['learning_focus'], content_form: 'task', is_published: 0 }
    ]);
    expect(coverage.content_count).toBe(2);
    expect(coverage.coverage_matrix).toEqual([
      expect.objectContaining({ age_segment_code: 'age_3_4', ability_code: 'attention', content_count: 2, published_count: 1 })
    ]);
    expect(coverage.gap_list).toContainEqual({ age_segment_code: 'age_3_4', ability_code: 'sensory_motor', reason: 'missing_content' });
  });

  it('相同原始事件和内容集合重复聚合结果保持稳定', () => {
    const events = [
      { event_id: 'a', event_data: { age_segment_code: 'age_3_4', ability_codes: ['attention'], occurred_at: '2026-08-21T00:00:00Z' }, created_at: '2026-08-21T01:00:00Z' },
      { event_id: 'b', event_data: { age_segment_code: 'age_4_5', ability_codes: ['sensory_motor'], child_id: 2 }, created_at: '2026-08-21T01:00:00Z' }
    ];
    const contents = [
      { age_segment_codes: ['age_3_4'], ability_codes: ['attention'], scene_codes: ['learning_focus'], content_form: 'article', is_published: 1 },
      { age_segment_codes: ['age_4_5'], ability_codes: ['sensory_motor'], scene_codes: ['sensory_motor'], content_form: 'task', is_published: 1 }
    ];
    const reversedEvents = events.slice().reverse();
    const reversedContents = contents.slice().reverse();
    expect(aggregateEventQuality(events)).toEqual(aggregateEventQuality(reversedEvents));
    expect(aggregateContentCoverage(contents)).toEqual(aggregateContentCoverage(reversedContents));
    expect(Object.keys(aggregateEventQuality(events).field_coverage)).toEqual(EVENT_COMMON_FIELDS);
  });

  it('分析查询参数只接受受控日期范围', () => {
    expect(validateAnalyticsQuery({ start_date: '2026-08-01', end_date: '2026-08-21', days: '21' })).toEqual({ valid: true });
    expect(validateAnalyticsQuery({ start_date: '2026/08/01' })).toEqual({ valid: false, code: 'INVALID_ANALYTICS_DATE' });
    expect(validateAnalyticsQuery({ days: '91' })).toEqual({ valid: false, code: 'INVALID_ANALYTICS_DAYS' });
  });

  it('聚合发布、媒体和版本恢复指标，并为无数据区间返回零值', () => {
    const metrics = aggregateOperationsMetrics({ versions: [{ created_at: '2026-09-02T01:00:00Z', publish_status: 'published' }], reviews: [], media: [{ created_at: '2026-09-02T01:00:00Z', status: 'failed' }], usage: [{ created_at: '2026-09-02T02:00:00Z' }], restores: [{ created_at: '2026-09-02T03:00:00Z' }] }, { startDate: '2026-09-02', endDate: '2026-09-02' });
    expect(metrics).toMatchObject({ content_created_count: 1, published_count: 1, content_usage_count: 1, media_failure_count: 1, version_restore_count: 1 });
    expect(aggregateOperationsMetrics({}, { startDate: '2026-09-01', endDate: '2026-09-01' }).published_count).toBe(0);
  });

  it('聚合工单处理、回访和关闭结果，并兼容历史缺失字段', () => {
    const metrics = aggregateSupportMetrics({ tickets: [{ status: 'pending', created_at: '2026-09-02T01:00:00Z' }], events: [{ event_type: 'callback', callback_result: 'resolved', created_at: '2026-09-02T02:00:00Z' }, { event_type: 'closed', created_at: '2026-09-02T03:00:00Z' }] }, { startDate: '2026-09-02', endDate: '2026-09-02' });
    expect(metrics).toMatchObject({ pending_count: 1, callback_count: 1, callback_completion_rate: 100, closed_count: 1 });
    expect(metrics.close_outcomes).toEqual({ resolved: 1 });
    expect(safeObject({ phone: '13800000000', nested: { api_key: 'hidden' }, visible: 1 })).toEqual({ nested: {}, visible: 1 });
  });
});
