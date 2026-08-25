var STORAGE_KEY = 'pendingTrainingRecordsV1';

function getStorage() {
  return typeof wx !== 'undefined' ? wx : null;
}

function readAll() {
  var storage = getStorage();
  if (!storage || typeof storage.getStorageSync !== 'function') return [];
  try {
    var records = storage.getStorageSync(STORAGE_KEY);
    return Array.isArray(records) ? records : [];
  } catch (err) {
    return [];
  }
}

function writeAll(records) {
  var storage = getStorage();
  if (!storage || typeof storage.setStorageSync !== 'function') return false;
  try {
    storage.setStorageSync(STORAGE_KEY, records);
    return true;
  } catch (err) {
    return false;
  }
}

function normalizeChildId(value) {
  var childId = Number(value);
  return isFinite(childId) && childId > 0 ? childId : 0;
}

function getRecordId(input) {
  var data = (input && input.data) || {};
  var key = data.idempotencyKey || data.idempotency_key || '';
  return String((input && input.type) || 'training') + ':' + String(key);
}

function enqueue(input, now) {
  var childId = normalizeChildId(input && input.childId);
  var recordId = getRecordId(input);
  if (!childId || /:$/.test(recordId) || !input.url) return null;
  var records = readAll();
  var existing = records.find(function(item) {
    return item.recordId === recordId && item.childId === childId;
  });
  if (existing) return existing;
  var timestamp = Number(now) || Date.now();
  var record = {
    recordId: recordId,
    childId: childId,
    type: String(input.type || 'training'),
    url: String(input.url),
    method: String(input.method || 'POST'),
    data: input.data || {},
    status: 'pending',
    attempts: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastError: ''
  };
  records.push(record);
  writeAll(records);
  return record;
}

function list(childId) {
  var normalized = normalizeChildId(childId);
  return readAll().filter(function(item) { return item.childId === normalized; });
}

function updateRecord(recordId, childId, changes) {
  var records = readAll();
  var changed = false;
  records = records.map(function(item) {
    if (item.recordId !== recordId || item.childId !== childId) return item;
    changed = true;
    return Object.assign({}, item, changes, { updatedAt: Date.now() });
  });
  if (changed) writeAll(records);
}

function removeRecord(recordId, childId) {
  var records = readAll();
  var next = records.filter(function(item) {
    return item.recordId !== recordId || item.childId !== childId;
  });
  if (next.length !== records.length) writeAll(next);
}

function isRetryableError(err) {
  if (err && err.success === false) return false;
  var message = String((err && (err.errMsg || err.message)) || '');
  return !message || /request:fail|network|网络|timeout|超时/i.test(message);
}

function retryPending(app, childId) {
  var normalized = normalizeChildId(childId);
  if (!app || typeof app.request !== 'function' || !normalized) return Promise.resolve({ synced: 0, failed: 0, pending: 0 });
  var records = list(normalized);
  var result = { synced: 0, failed: 0, pending: records.length };
  return records.reduce(function(chain, record) {
    return chain.then(function() {
      updateRecord(record.recordId, normalized, { status: 'syncing' });
      return app.request({ url: record.url, method: record.method, data: record.data }).then(function() {
        removeRecord(record.recordId, normalized);
        result.synced += 1;
      }).catch(function(err) {
        result.failed += 1;
        updateRecord(record.recordId, normalized, {
          status: isRetryableError(err) ? 'pending' : 'failed',
          attempts: Number(record.attempts || 0) + 1,
          lastError: String((err && (err.message || err.errMsg)) || '同步失败').slice(0, 200)
        });
      });
    });
  }, Promise.resolve()).then(function() {
    result.pending = list(normalized).length;
    return result;
  });
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  enqueue: enqueue,
  isRetryableError: isRetryableError,
  list: list,
  retryPending: retryPending
};
