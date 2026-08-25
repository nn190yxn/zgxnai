const assert = require('assert');
const crossPageStorage = require('../miniprogram/utils/cross-page-storage.js');

const storage = {};
global.wx = {
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; },
  removeStorageSync(key) { delete storage[key]; }
};

const now = Date.UTC(2026, 7, 21, 8, 0, 0);
for (let childId = 1; childId <= 20; childId += 1) {
  crossPageStorage.save('pending', { childId, value: 'child-' + childId }, {
    childId,
    source: 'property-test',
    ttlMs: 1000
  }, now);
  const own = crossPageStorage.read('pending', childId, now + 500);
  const other = crossPageStorage.read('pending', childId + 100, now + 500);
  assert.strictEqual(own.payload.value, 'child-' + childId);
  assert.strictEqual(other, null, 'a child must never read another child temporary data');
  assert.strictEqual(crossPageStorage.read('pending', childId, now + 1001), null, 'expired data must be rejected');
}

crossPageStorage.save('pendingCoreWeeklySummary', { value: 'one' }, { childId: 1, source: 'weekly' }, now);
crossPageStorage.save('pendingChatQuestion', 'question', { childId: 1, source: 'chat' }, now);
storage.pendingTrainingRecordsV1 = [{ childId: 1, recordId: 'one' }, { childId: 2, recordId: 'two' }];
const clearResult = crossPageStorage.clearChildData(1);
assert.strictEqual(clearResult.cleared, 3);
assert.strictEqual(storage.pendingCoreWeeklySummary, undefined);
assert.strictEqual(storage.pendingChatQuestion, undefined);
assert.deepStrictEqual(storage.pendingTrainingRecordsV1, [{ childId: 2, recordId: 'two' }]);

console.log('Child data isolation property tests passed.');
