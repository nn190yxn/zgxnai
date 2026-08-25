const businessDimensions = require('../shared/business-dimensions');

const EVENT_COMMON_FIELDS = Object.freeze([
  'event_id',
  'client_session_id',
  'action_id',
  'child_id',
  'age_segment_code',
  'ability_codes',
  'plan_id',
  'source_module',
  'source_page',
  'source_content_type',
  'source_content_id',
  'membership_status',
  'membership_entry_source',
  'occurred_at',
  'schema_version'
]);

const UNKNOWN_VALUE_FIELDS = Object.freeze({
  age_segment_code: new Set(businessDimensions.getAgeSegments().map((item) => item.code)),
  ability_codes: new Set(businessDimensions.getAbilities().map((item) => item.code)),
  source_content_type: new Set(businessDimensions.getContentForms().map((item) => item.code))
});

const DEFAULT_LATE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

function validateAnalyticsQuery(query = {}) {
  const startDate = query.start_date || query.startDate;
  const endDate = query.end_date || query.endDate;
  const days = query.days === undefined ? null : Number(query.days);
  if ((startDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(startDate))) || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(endDate)))) {
    return { valid: false, code: 'INVALID_ANALYTICS_DATE' };
  }
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 90)) {
    return { valid: false, code: 'INVALID_ANALYTICS_DAYS' };
  }
  return { valid: true };
}

function isPresent(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function asList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  const text = String(value || '').trim();
  if (!text) {
    return [];
  }
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return asList(parsed);
    }
  } catch (error) {
    // Keep compatibility with legacy comma-separated event fields.
  }
  return text.split(/[、,，;；|\s]+/).map((item) => item.trim()).filter(Boolean);
}

function parseEventRow(row) {
  const eventData = row && row.event_data && typeof row.event_data === 'object'
    ? row.event_data
    : parseJson(row && row.event_data);
  const event = Object.assign({}, eventData, row || {});
  event.event_id = event.event_id || event.eventId || null;
  event.client_session_id = event.client_session_id || event.clientSessionId || event.session_id || null;
  event.ability_codes = asList(event.ability_codes || event.abilityCodes);
  event.child_id = event.child_id || event.childId || null;
  event.occurred_at = event.occurred_at || event.occurredAt || null;
  event.created_at = event.created_at || event.createdAt || null;
  return event;
}

function parseJson(value) {
  try {
    return JSON.parse(String(value || '{}'));
  } catch (error) {
    return {};
  }
}

function countUnknownValues(events) {
  const unknown = {};
  Object.keys(UNKNOWN_VALUE_FIELDS).forEach((field) => {
    const allowed = UNKNOWN_VALUE_FIELDS[field];
    const counts = {};
    events.forEach((event) => {
      const values = field === 'ability_codes' ? event[field] : [event[field]];
      values.forEach((value) => {
        const normalized = String(value || '').trim();
        if (normalized && !allowed.has(normalized)) {
          counts[normalized] = (counts[normalized] || 0) + 1;
        }
      });
    });
    unknown[field] = Object.keys(counts).sort().map((value) => ({ value, count: counts[value] }));
  });
  return unknown;
}

function aggregateEventQuality(rows, options = {}) {
  const events = (rows || []).map(parseEventRow);
  const total = events.length;
  const fieldCoverage = {};
  EVENT_COMMON_FIELDS.forEach((field) => {
    const count = events.filter((event) => isPresent(event[field])).length;
    fieldCoverage[field] = {
      present_count: count,
      total_count: total,
      coverage_rate: total ? Number(((count / total) * 100).toFixed(2)) : 0
    };
  });

  const eventIdCounts = events.reduce((counts, event) => {
    if (event.event_id) {
      counts[event.event_id] = (counts[event.event_id] || 0) + 1;
    }
    return counts;
  }, {});
  const duplicateCount = Object.values(eventIdCounts).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const threshold = Number(options.lateThresholdMs || DEFAULT_LATE_THRESHOLD_MS);
  const lateCount = events.filter((event) => {
    const occurredAt = Date.parse(event.occurred_at || '');
    const createdAt = Date.parse(event.created_at || '');
    return Number.isFinite(occurredAt) && Number.isFinite(createdAt) && createdAt - occurredAt > threshold;
  }).length;
  const noChildCount = events.filter((event) => !isPresent(event.child_id)).length;

  return {
    total_event_count: total,
    field_coverage: fieldCoverage,
    unknown_values: countUnknownValues(events),
    duplicate_count: duplicateCount,
    duplicate_rate: total ? Number(((duplicateCount / total) * 100).toFixed(2)) : 0,
    late_count: lateCount,
    late_rate: total ? Number(((lateCount / total) * 100).toFixed(2)) : 0,
    no_child_count: noChildCount,
    no_child_rate: total ? Number(((noChildCount / total) * 100).toFixed(2)) : 0
  };
}

function buildCoverageMatrix(rows) {
  const matrix = [];
  const counts = new Map();
  (rows || []).forEach((row) => {
    const ageCodes = asList(row.age_segment_codes || row.ageSegmentCodes);
    const abilityCodes = asList(row.ability_codes || row.abilityCodes);
    const sceneCodes = asList(row.scene_codes || row.sceneCodes);
    const contentForm = String(row.content_form || row.contentForm || '').trim();
    ageCodes.forEach((ageCode) => abilityCodes.forEach((abilityCode) => {
      const key = `${ageCode}\u0000${abilityCode}`;
      const item = counts.get(key) || { age_segment_code: ageCode, ability_code: abilityCode, content_count: 0, published_count: 0, scene_codes: new Set(), content_forms: new Set() };
      item.content_count += 1;
      item.published_count += Number(row.is_published) ? 1 : 0;
      sceneCodes.forEach((sceneCode) => item.scene_codes.add(sceneCode));
      if (contentForm) item.content_forms.add(contentForm);
      counts.set(key, item);
    }));
  });
  counts.forEach((item) => matrix.push({
    age_segment_code: item.age_segment_code,
    ability_code: item.ability_code,
    content_count: item.content_count,
    published_count: item.published_count,
    scene_codes: Array.from(item.scene_codes).sort(),
    content_forms: Array.from(item.content_forms).sort(),
    covered: item.published_count > 0
  }));
  return matrix.sort((a, b) => `${a.age_segment_code}:${a.ability_code}`.localeCompare(`${b.age_segment_code}:${b.ability_code}`));
}

function aggregateContentCoverage(rows) {
  const matrix = buildCoverageMatrix(rows);
  const matrixKeys = new Set(matrix.map((item) => `${item.age_segment_code}\u0000${item.ability_code}`));
  const gaps = [];
  businessDimensions.getAgeSegments().forEach((age) => {
    businessDimensions.getAbilities().forEach((ability) => {
      const key = `${age.code}\u0000${ability.code}`;
      const item = matrix.find((entry) => `${entry.age_segment_code}\u0000${entry.ability_code}` === key);
      if (!matrixKeys.has(key) || !item || !item.published_count) {
        gaps.push({ age_segment_code: age.code, ability_code: ability.code, reason: item ? 'unpublished_only' : 'missing_content' });
      }
    });
  });
  return {
    content_count: (rows || []).length,
    published_content_count: (rows || []).filter((row) => Number(row.is_published) === 1).length,
    coverage_matrix: matrix,
    gap_list: gaps.sort((a, b) => `${a.age_segment_code}:${a.ability_code}`.localeCompare(`${b.age_segment_code}:${b.ability_code}`))
  };
}

module.exports = {
  DEFAULT_LATE_THRESHOLD_MS,
  EVENT_COMMON_FIELDS,
  aggregateContentCoverage,
  aggregateEventQuality,
  buildCoverageMatrix,
  parseEventRow,
  validateAnalyticsQuery
};
