const assert = require('assert');
const membershipState = require('../miniprogram/utils/membership-state.js');
const growthShare = require('../miniprogram/utils/growth-share.js');

function testMembershipState() {
  const free = membershipState.normalizeMembershipState({ status: 'free' });
  assert.strictEqual(membershipState.hasEntitlement(free, 'weekly_summary'), false);
  const member = membershipState.normalizeMembershipState({ is_active: true, membership_type: 'trial' });
  assert.strictEqual(membershipState.hasEntitlement(member, 'weekly_summary'), true);
  assert.strictEqual(
    membershipState.buildMembershipEntryUrl('stage_report', { childId: 7, ability: 'attention', reportId: '2026-08-18' }),
    '/pages/membership/index?source=stage_report&ability=attention&childId=7&reportId=2026-08-18'
  );
}

function testSharePrivacy() {
  const draft = growthShare.normalizeGrowthShareDraft({
    type: 'stage_report',
    childName: '小明',
    avatar: '/avatar.png',
    height: 110,
    metrics: { completed: 3 }
  });
  assert.strictEqual(draft.type, 'stage_report');
  assert.strictEqual(draft.childName, undefined);
  assert.strictEqual(draft.avatar, undefined);
  assert.strictEqual(draft.height, undefined);
  assert.deepStrictEqual(draft.metrics, { completed: 3 });
}

function testSourceContracts() {
  const fs = require('fs');
  const detail = fs.readFileSync(require.resolve('../miniprogram/pages/development/detail/detail.js'), 'utf8');
  const scene = fs.readFileSync(require.resolve('../miniprogram/pages/development/scene/scene.js'), 'utf8');
  assert.ok(detail.includes("'/development-zones/'"));
  assert.ok(scene.includes("'/development-zones/'"));
  assert.ok(detail.includes('professionalBoundary'));
  assert.ok(scene.includes('professionalBoundary'));
}

testMembershipState();
testSharePrivacy();
testSourceContracts();
console.log('Membership and growth share tests passed.');
