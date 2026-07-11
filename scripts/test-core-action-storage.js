const assert = require('assert');
const storageApi = require('../miniprogram/utils/core-action-storage');

const storage = {};

global.wx = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  }
};

function resetStorage(value) {
  storage[storageApi.STORAGE_KEY] = value;
}

function buildRecord(id, timestamp) {
  return {
    id,
    sceneKey: 'homework_restless',
    sceneLabel: '写作业坐不住',
    ageGroup: '5-6岁',
    symptomKey: 'can_do_but_slow',
    symptomLabel: '会做但拖很久',
    bottleneckTitle: '更像是启动困难',
    bottleneckText: '先把目标缩小到开始。',
    actionTitle: '今晚先做 3 分钟开头陪跑',
    actionSteps: ['读第一题。'],
    createdAt: timestamp,
    saved: false,
    completed: false
  };
}

const baseTime = Date.UTC(2026, 6, 10, 9, 0, 0);
resetStorage('bad-data');
assert.deepStrictEqual(storageApi.getCoreActionRecords(), [], 'bad storage data should fall back to empty records');

const saved = storageApi.saveTonightAction(buildRecord('record-a', baseTime), baseTime);
assert.strictEqual(saved.success, true);
assert.strictEqual(saved.record.saved, true);
assert.strictEqual(saved.record.completed, false);
assert.strictEqual(saved.record.sevenDayPlanDraft.length, 7);
assert.strictEqual(storageApi.getLatestCoreAction().id, 'record-a');

const updated = storageApi.updateActionEffect('record-a', { key: 'slow_but_started', label: '写了一点但很慢' }, baseTime + 86400000);
assert.strictEqual(updated.success, true);
assert.strictEqual(updated.record.completed, true);
assert.strictEqual(updated.record.effectKey, 'slow_but_started');
assert.strictEqual(updated.record.effectLabel, '写了一点但很慢');

const missingUpdate = storageApi.updateActionEffect('missing-id', { key: 'not_tried', label: '没来得及试' }, baseTime);
assert.strictEqual(missingUpdate.success, false);

resetStorage([
  Object.assign(buildRecord('done-today', baseTime), { completed: true, recordedAt: baseTime + 2 * 86400000 }),
  Object.assign(buildRecord('done-yesterday', baseTime - 86400000), { completed: true, recordedAt: baseTime + 86400000 }),
  Object.assign(buildRecord('done-before', baseTime - 2 * 86400000), { completed: true, recordedAt: baseTime }),
  Object.assign(buildRecord('not-done', baseTime - 3 * 86400000), { completed: false, recordedAt: baseTime - 86400000 })
]);
assert.strictEqual(storageApi.getContinuousRecordCount(baseTime + 2 * 86400000), 3);

resetStorage([
  Object.assign(buildRecord('done-today', baseTime), { completed: true, recordedAt: baseTime + 2 * 86400000 }),
  Object.assign(buildRecord('gap-before', baseTime - 2 * 86400000), { completed: true, recordedAt: baseTime })
]);
assert.strictEqual(storageApi.getContinuousRecordCount(baseTime + 2 * 86400000), 1);

console.log('Core action storage tests passed.');
