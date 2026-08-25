const {
  LEGACY_EVENT_ALIASES,
  MAX_EVENT_META_BYTES,
  normalizeClientSessionId,
  normalizeEvent,
  sanitizeEventMeta
} = require('../src/mysql-production/event-protocol');

describe('事件协议与脱敏', () => {
  it('补齐公共字段并映射旧事件名称', () => {
    const event = normalizeEvent({
      event_type: 'payment_success',
      child_id: 12,
      plan_id: 'plan_12',
      client_session_id: 'client_session_1',
      event_meta: { plan_code: 'month' }
    });

    expect(event.eventType).toBe(LEGACY_EVENT_ALIASES.payment_success);
    expect(event.payload.schema_version).toBe(1);
    expect(event.payload.child_id).toBe(12);
    expect(event.payload.plan_id).toBe('plan_12');
    expect(event.eventId).toMatch(/^evt_/);
    expect(event.eventData.authorization).toBeUndefined();
  });

  it('移除授权、令牌和密钥字段，不把用户标识混入孩子标识', () => {
    const event = normalizeEvent({
      event_type: 'app_launch',
      user_id: 999,
      authorization: 'Bearer secret',
      event_meta: {
        access_token: 'token',
        cookie: 'cookie',
        safe_value: 'ok'
      }
    });

    expect(event.eventData.user_id).toBeUndefined();
    expect(event.eventData.authorization).toBeUndefined();
    expect(event.payload.event_meta).toEqual({ safe_value: 'ok' });
  });

  it('拒绝携带授权内容的会话标识并限制元数据大小', () => {
    expect(normalizeClientSessionId('Bearer abc')).toBeNull();
    expect(normalizeClientSessionId('client_session_1')).toBe('client_session_1');
    expect(sanitizeEventMeta({ large: 'x'.repeat(MAX_EVENT_META_BYTES + 1) })).toEqual({ truncated: true });
  });

  it('使用客户端事件 ID 支持重试幂等', () => {
    const first = normalizeEvent({ event_type: 'training_task_complete', event_id: 'evt_retry_1' });
    const retry = normalizeEvent({ event_type: 'training_task_complete', event_id: 'evt_retry_1' });
    expect(first.eventId).toBe(retry.eventId);
  });
});
