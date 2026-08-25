var DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function getStorage() {
  return typeof wx !== 'undefined' ? wx : null;
}

function normalizeChildId(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

function buildEnvelope(payload, options, now) {
  var opts = options || {};
  var timestamp = Number(now) || Date.now();
  var ttl = Number(opts.ttlMs);
  if (!isFinite(ttl) || ttl <= 0) {
    ttl = DEFAULT_TTL_MS;
  }
  return {
    childId: normalizeChildId(opts.childId),
    source: String(opts.source || '').trim(),
    createdAt: timestamp,
    expiresAt: timestamp + ttl,
    payload: payload
  };
}

function isValidEnvelope(value, childId, now) {
  if (!value || typeof value !== 'object' || !value.createdAt || !value.expiresAt) {
    return false;
  }
  if (Number(value.expiresAt) <= (Number(now) || Date.now())) {
    return false;
  }
  var expectedChildId = normalizeChildId(childId);
  return expectedChildId === null || normalizeChildId(value.childId) === expectedChildId;
}

function save(key, payload, options, now) {
  var storage = getStorage();
  if (!storage || typeof storage.setStorageSync !== 'function') {
    return false;
  }
  try {
    storage.setStorageSync(key, buildEnvelope(payload, options, now));
    return true;
  } catch (err) {
    return false;
  }
}

function read(key, childId, now) {
  var storage = getStorage();
  if (!storage || typeof storage.getStorageSync !== 'function') {
    return null;
  }
  var value;
  try {
    value = storage.getStorageSync(key);
  } catch (err) {
    return null;
  }
  if (!isValidEnvelope(value, childId, now)) {
    return null;
  }
  return value;
}

function consume(key, childId, now) {
  var value = read(key, childId, now);
  if (value && typeof wx !== 'undefined' && typeof wx.removeStorageSync === 'function') {
    wx.removeStorageSync(key);
  }
  return value;
}

function clearChildData(childId, keys) {
  var storage = getStorage();
  if (!storage || typeof storage.getStorageSync !== 'function' || typeof storage.setStorageSync !== 'function') {
    return { cleared: 0, removedKeys: [] };
  }
  var target = normalizeChildId(childId);
  var keyList = keys || [
    'pendingCoreActionContext',
    'pendingGrowthRecordNote',
    'pendingGrowthRecordSource',
    'pendingCoreWeeklySummary',
    'pendingChatQuestion',
    'readingShareDraft',
    'assessmentProgress',
    'growthShareDraft',
    'pendingTrainingRecordsV1'
  ];
  var removedKeys = [];
  keyList.forEach(function(key) {
    var value;
    try {
      value = storage.getStorageSync(key);
    } catch (err) {
      return;
    }
    if (key === 'pendingTrainingRecordsV1' && Array.isArray(value)) {
      var retained = value.filter(function(item) { return normalizeChildId(item && item.childId) !== target; });
      if (retained.length !== value.length) {
        storage.setStorageSync(key, retained);
        removedKeys.push(key);
      }
      return;
    }
    if (value && typeof value === 'object' && normalizeChildId(value.childId) === target) {
      if (typeof storage.removeStorageSync === 'function') {
        storage.removeStorageSync(key);
      }
      removedKeys.push(key);
    }
  });
  return { cleared: removedKeys.length, removedKeys: removedKeys };
}

module.exports = {
  DEFAULT_TTL_MS: DEFAULT_TTL_MS,
  buildEnvelope: buildEnvelope,
  save: save,
  read: read,
  consume: consume,
  clearChildData: clearChildData
};
