const assert = require('assert');
const access = require('../src/mysql-production/admin-access');
const media = require('../src/mysql-production/media-service');
const publishing = require('../src/mysql-production/content-publishing');
const tickets = require('../src/mysql-production/support-tickets');
const contracts = require('../src/mysql-production/platform-contract');
const { cleanRichText, boundedLimit } = require('../src/mysql-production/platform-routes');
const { buildSnapshot } = require('../src/scripts/import-pain-points');
const membership = require('../src/mysql-production/membership-operations');
const userOperations = require('../src/mysql-production/user-operations');

describe('运营平台契约与领域服务', () => {
  test('稳定痛点 key 与导入快照跨端一致', () => {
    const rows = buildSnapshot();
    assert.deepStrictEqual(rows.map((row) => row.pain_point_key), contracts.PAIN_POINT_KEYS);
    rows.forEach((row) => assert.ok(contracts.PAIN_POINT_CATEGORIES.includes(row.category)));
  });

  test('角色动作与字段权限拒绝', () => {
    assert.equal(access.can('content_editor', 'article:write'), true);
    assert.equal(access.can('content_editor', 'content:approve'), false);
    assert.throws(() => access.assertPermission({ role: 'content_editor' }, 'content:approve'), (error) => error.code === 'ADMIN_PERMISSION_DENIED');
  });

  test('审计载荷脱敏联系方式和 token', () => {
    const payload = access.auditPayload({ adminUserId: 1, actionType: 'x', targetType: 'y', targetId: 2, after: { contact: '13800138000', nested: { token: 'secret' } } });
    assert.equal(payload.after.contact, '[REDACTED]');
    assert.equal(payload.after.nested.token, '[REDACTED]');
  });

  test('媒体校验拒绝路径穿越和超限', () => {
    assert.throws(() => media.validateMedia({ filename: '../x.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') }));
    assert.throws(() => media.validateMedia({ filename: 'x.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('x') }));
    assert.equal(media.validateMedia({ filename: 'x.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('x') }).mediaType, 'image');
  });

  test('内容状态机与公共版本过滤', () => {
    assert.equal(publishing.canTransition('draft', 'pending_review'), true);
    assert.throws(() => publishing.assertTransition('draft', 'published'));
    assert.equal(publishing.isPublicVersion({ review_status: 'approved', publish_status: 'published' }), true);
    assert.equal(publishing.isPublicVersion({ review_status: 'approved', publish_status: 'scheduled' }), false);
  });

  test('工单状态、联系方式脱敏和兼容文章字段', () => {
    assert.throws(() => tickets.assertStatusTransition('closed', 'processing'));
    assert.equal(tickets.maskContact('13800138000'), '138****8000');
    assert.equal(boundedLimit('999'), 100);
    assert.ok(cleanRichText('<p>ok</p><script>alert(1)</script>').includes('<p>ok</p>'));
    assert.equal(cleanRichText('<p>ok</p><script>alert(1)</script>').includes('alert'), false);
  });

  test('会员配置归一化并按运营顺序合并套餐展示', () => {
    const config = membership.normalizeMembershipConfig({
      entry: { title: '新版会员', button_text: '立即了解' },
      benefits: [{ key: 'report', title: '成长报告', description: '按周期查看' }],
      plans: [{ key: 'year', title: '年度方案', sort_order: 1 }, { key: 'month', title: '月度方案', sort_order: 2 }]
    });
    const merged = membership.mergeMembershipDisplayConfig(config, [
      { plan_code: 'month', sort_order: 1 },
      { plan_code: 'year', sort_order: 2 }
    ]);
    assert.equal(merged.entry.title, '新版会员');
    assert.deepStrictEqual(merged.plans.map((item) => item.plan_code), ['year', 'month']);
    assert.equal(merged.plans[0].display_title, '年度方案');
  });

  test('用户运营视图按活跃和会员状态归一化', () => {
    const now = Date.now();
    assert.equal(userOperations.membershipStatus({ membership_type: 'trial', current_end_date: new Date(now + 86400000) }), 'trial');
    assert.equal(userOperations.activityStatus(new Date(now - 2 * 86400000)), 'active_7d');
    assert.equal(userOperations.formatUser({ id: 7, phone_number: '13800138000', membership_type: 'free', last_active_at: null }, false).phone, '已授权可查看');
  });
});
