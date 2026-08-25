const assert = require('assert');
const abilityTraining = require('../backend/src/mysql-production/ability-training');

const storage = {};
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; }
};

const trainingSync = require('../miniprogram/utils/training-sync.js');

async function run() {
  const profile = abilityTraining.buildAbilityProfile({
    childId: 11,
    ageGroup: '4-5岁',
    answers: abilityTraining.OBSERVATION_CONFIG.questions.map((question, index) => ({ questionId: question.id, value: index % 4 }))
  });
  const tasks = abilityTraining.buildTrainingTasks(profile, 3).map((task, index) => Object.assign({}, task, {
    id: index + 1,
    childId: 11,
    planId: 101,
    abilityDomain: task.domain
  }));
  assert.strictEqual(tasks.length, 3);
  assert.strictEqual(abilityTraining.hasUniqueTrainingAssignments(tasks), true);

  const complete = { childId: 11, type: 'complete', url: '/training-tasks/1/complete', method: 'POST', data: { idempotencyKey: 'complete:11:1' } };
  const feedback = { childId: 11, type: 'feedback', url: '/training-feedback', method: 'POST', data: { taskId: 1, feedbackKey: 'smooth', idempotencyKey: 'feedback:11:1' } };
  trainingSync.enqueue(complete, 1);
  trainingSync.enqueue(complete, 2);
  trainingSync.enqueue(feedback, 3);
  trainingSync.enqueue({ childId: 12, type: 'complete', url: '/training-tasks/9/complete', method: 'POST', data: { idempotencyKey: 'complete:12:9' } }, 4);
  assert.strictEqual(trainingSync.list(11).length, 2, 'duplicate idempotency keys must share one pending record');
  assert.strictEqual(trainingSync.list(12).length, 1, 'pending records must be isolated by child');

  const requests = [];
  const result = await trainingSync.retryPending({
    request(options) {
      requests.push(options);
      return Promise.resolve({ success: true, nextSuggestion: '继续下一天训练' });
    }
  }, 11);
  assert.strictEqual(result.synced, 2);
  assert.strictEqual(result.pending, 0);
  assert.deepStrictEqual(requests.map((item) => item.url), ['/training-tasks/1/complete', '/training-feedback']);
  assert.strictEqual(trainingSync.list(12).length, 1, 'retrying one child must preserve another child records');

  const emptyPlan = abilityTraining.normalizeDailyPlanPayload({ childId: 11, cards: [] }, { dataStatus: 'empty' });
  const fallbackPlan = abilityTraining.normalizeDailyPlanPayload({ childId: 11, cards: [{ id: 'fallback' }] }, { degraded: true, degradationReason: 'content_missing' });
  assert.strictEqual(emptyPlan.empty, true);
  assert.strictEqual(fallbackPlan.degraded, true);
  assert.strictEqual(fallbackPlan.degradationReason, 'content_missing');
  console.log('Training loop integration tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
