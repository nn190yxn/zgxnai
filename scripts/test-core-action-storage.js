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

const ageFirstRecord = Object.assign(buildRecord('age-first-a', baseTime + 1), {
  ageSegmentKey: 'age_8_9',
  ageSegmentLabel: '8-9岁',
  categoryKey: ' attention_learning ',
  categoryLabel: ' 专注学习 ',
  painPointKey: 'reading_slow_forgets',
  painPointTitle: '阅读慢又记不住',
  focusAreas: ['学习能力底层支持', '执行力', null],
  abilityTags: ['阅读效率', '学习能力底层支持', ''],
  observableSigns: ['读得慢', '复述困难', undefined],
  actionSteps: ['读一小段。', '', '说一个关键词。']
});
const savedAgeFirst = storageApi.saveTonightAction(ageFirstRecord, baseTime + 1);
assert.strictEqual(savedAgeFirst.success, true);
assert.strictEqual(savedAgeFirst.record.ageSegmentKey, 'age_8_9');
assert.strictEqual(savedAgeFirst.record.ageSegmentLabel, '8-9岁');
assert.strictEqual(savedAgeFirst.record.categoryKey, 'attention_learning');
assert.strictEqual(savedAgeFirst.record.categoryLabel, '专注学习');
assert.strictEqual(savedAgeFirst.record.painPointKey, 'reading_slow_forgets');
assert.strictEqual(savedAgeFirst.record.painPointTitle, '阅读慢又记不住');
assert.deepStrictEqual(savedAgeFirst.record.focusAreas, ['学习能力底层支持', '执行力']);
assert.deepStrictEqual(savedAgeFirst.record.abilityTags, ['阅读效率', '学习能力底层支持']);
assert.deepStrictEqual(savedAgeFirst.record.observableSigns, ['读得慢', '复述困难']);
assert.deepStrictEqual(savedAgeFirst.record.actionSteps, ['读一小段。', '说一个关键词。']);

const updatedAgeFirst = storageApi.updateActionEffect('age-first-a', { key: 'started_smoothly', label: '顺利开始了' }, baseTime + 86400000);
assert.strictEqual(updatedAgeFirst.success, true);
assert.strictEqual(updatedAgeFirst.record.completed, true);
assert.strictEqual(updatedAgeFirst.record.ageSegmentKey, 'age_8_9');
assert.strictEqual(updatedAgeFirst.record.categoryKey, 'attention_learning');
assert.strictEqual(updatedAgeFirst.record.categoryLabel, '专注学习');
assert.strictEqual(updatedAgeFirst.record.painPointKey, 'reading_slow_forgets');
assert.deepStrictEqual(updatedAgeFirst.record.abilityTags, ['阅读效率', '学习能力底层支持']);
assert.deepStrictEqual(updatedAgeFirst.record.observableSigns, ['读得慢', '复述困难']);

const updated = storageApi.updateActionEffect('record-a', { key: 'slow_but_started', label: '写了一点但很慢' }, baseTime + 86400000);
assert.strictEqual(updated.success, true);
assert.strictEqual(updated.record.completed, true);
assert.strictEqual(updated.record.effectKey, 'slow_but_started');
assert.strictEqual(updated.record.effectLabel, '写了一点但很慢');

const missingUpdate = storageApi.updateActionEffect('missing-id', { key: 'not_tried', label: '没来得及试' }, baseTime);
assert.strictEqual(missingUpdate.success, false);

resetStorage([buildRecord('legacy-record', baseTime)]);
const legacyRecord = storageApi.getLatestCoreAction();
assert.strictEqual(legacyRecord.id, 'legacy-record');
assert.strictEqual(legacyRecord.ageSegmentKey, undefined);
assert.strictEqual(legacyRecord.categoryKey, undefined);
assert.strictEqual(legacyRecord.painPointKey, undefined);

resetStorage([
  Object.assign(buildRecord('done-today', baseTime), { completed: true, recordedAt: baseTime + 2 * 86400000 }),
  Object.assign(buildRecord('done-yesterday', baseTime - 86400000), {
    completed: true,
    recordedAt: baseTime + 86400000,
    ageSegmentKey: 'age_8_9',
    painPointKey: 'reading_slow_forgets',
    abilityTags: ['阅读效率']
  }),
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
