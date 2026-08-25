const assert = require('assert');
const homeState = require('../miniprogram/utils/home-state');

function testPriority() {
  assert.strictEqual(homeState.getStatus({}).toString(), 'no_observation');
  assert.strictEqual(homeState.getStatus({ hasObservation: true, unfinishedTraining: true, pendingFeedback: true, reportAvailable: true, membershipExpired: true }), 'unfinished_training');
  assert.strictEqual(homeState.getStatus({ hasObservation: true, pendingFeedback: true, reportAvailable: true, membershipExpired: true }), 'pending_feedback');
  assert.strictEqual(homeState.getStatus({ hasObservation: true, reportAvailable: true, membershipExpired: true }), 'report_available');
  assert.strictEqual(homeState.getStatus({ hasObservation: true, membershipExpired: true }), 'membership_expired');
}

function testUniquePrimaryAction() {
  const statuses = ['no_observation', 'unfinished_training', 'pending_feedback', 'report_available', 'membership_expired'];
  for (let i = 0; i < 500; i += 1) {
    const state = {
      hasObservation: i % 2 === 0,
      unfinishedTraining: i % 3 === 0,
      pendingFeedback: i % 5 === 0,
      reportAvailable: i % 7 === 0,
      membershipExpired: i % 11 === 0,
      dailyPlanCards: i % 13 === 0 ? [{ completed: false }] : []
    };
    const action = homeState.getPrimaryAction(state);
    assert.ok(action.status, 'every legal state has one status');
    assert.ok(action.cta, 'every legal state has one primary action');
    assert.strictEqual(statuses.includes(action.status) || action.status === 'ready', true);
    assert.strictEqual(action.reason, action.status);
  }
}

function testFailureRecovery() {
  const local = {
    hasObservation: true,
    dailyPlanCards: [{ id: 'local-task', completed: false }],
    membershipState: { status: 'free' }
  };
  const recovered = homeState.mergeRemoteState(local, null);
  assert.strictEqual(recovered.source, 'local');
  assert.strictEqual(recovered.recovered, true);
  assert.strictEqual(recovered.dailyPlanCards[0].id, 'local-task');

  const remote = homeState.mergeRemoteState(local, {
    hasObservation: true,
    dailyPlanCards: [],
    membershipState: { status: 'expired', membership_type: 'expired' }
  });
  assert.strictEqual(remote.source, 'remote');
  assert.strictEqual(remote.recovered, false);
  assert.strictEqual(homeState.getStatus(remote), 'membership_expired');
}

testPriority();
testUniquePrimaryAction();
testFailureRecovery();
console.log('Home state priority, property, and recovery tests passed');
