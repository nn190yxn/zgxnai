var SENSITIVE_KEYS = {
  name: true,
  childName: true,
  nickname: true,
  avatar: true,
  avatarUrl: true,
  birthday: true,
  birth_date: true,
  height: true,
  weight: true,
  bodyData: true,
  phone: true,
  address: true
};

function sanitizePayload(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizePayload);
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  return Object.keys(value).reduce(function(result, key) {
    if (!SENSITIVE_KEYS[key]) {
      result[key] = sanitizePayload(value[key]);
    }
    return result;
  }, {});
}

function normalizeGrowthShareDraft(input) {
  var source = input || {};
  var type = source.type || 'growth_share';
  var allowedTypes = ['ability_profile', 'today_training', 'weekly_streak', 'stage_report', 'development_practice', 'growth_share'];
  if (allowedTypes.indexOf(type) < 0) {
    type = 'growth_share';
  }
  return sanitizePayload(Object.assign({}, source, {
    type: type,
    childId: source.childId || source.child_id || null,
    source: source.source || 'growth_share',
    createdAt: source.createdAt || Date.now(),
    metrics: Object.assign({}, source.metrics || {})
  }));
}

function saveGrowthShareDraft(storage, draft) {
  var normalized = normalizeGrowthShareDraft(draft);
  storage.save('growthShareDraft', normalized, {
    childId: normalized.childId,
    source: normalized.source,
    ttlMs: 24 * 60 * 60 * 1000
  });
  return normalized;
}

module.exports = {
  SENSITIVE_KEYS: SENSITIVE_KEYS,
  sanitizePayload: sanitizePayload,
  normalizeGrowthShareDraft: normalizeGrowthShareDraft,
  saveGrowthShareDraft: saveGrowthShareDraft
};
