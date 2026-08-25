const crypto = require('crypto');

const ENTRY_TYPES = Object.freeze([
  'ai_answer',
  'assessment_result',
  'training_complete',
  'training_feedback',
  'daily_plan_complete',
  'daily_status',
  'user_note',
  'development_zone',
  'core_action'
]);

const SOURCE_TYPES = Object.freeze([
  'ability_observation',
  'assessment',
  'training',
  'development_zone',
  'ai',
  'daily_status',
  'core_action',
  'manual'
]);

const ENTRY_TYPE_ALIASES = Object.freeze({
  assessment: 'assessment_result',
  observation: 'assessment_result',
  training: 'training_complete',
  daily_plan: 'daily_plan_complete',
  zone: 'development_zone',
  ai: 'ai_answer',
  note: 'user_note'
});

const SOURCE_TYPE_ALIASES = Object.freeze({
  observation: 'ability_observation',
  assessment_result: 'assessment',
  training_complete: 'training',
  daily_plan_complete: 'training',
  zone: 'development_zone',
  ai_answer: 'ai',
  user_note: 'manual'
});

class GrowthTimelineValidationError extends Error {
  constructor(field, message) {
    super(message);
    this.name = 'GrowthTimelineValidationError';
    this.field = field;
    this.code = 'INVALID_GROWTH_TIMELINE_ENTRY';
  }
}

function firstDefined(input, keys) {
  for (const key of keys) {
    if (input[key] !== undefined && input[key] !== null && input[key] !== '') {
      return input[key];
    }
  }
  return undefined;
}

function parseJson(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    return fallback;
  }
}

function normalizeList(value) {
  const list = Array.isArray(value) ? value : String(value || '').split(/[、,，]+/);
  return Array.from(new Set(list.map((item) => String(item).trim()).filter(Boolean)));
}

function normalizeDate(value, now) {
  const date = value ? new Date(value) : now;
  if (Number.isNaN(date.getTime())) {
    throw new GrowthTimelineValidationError('occurredAt', 'occurredAt必须是有效时间');
  }
  return date.toISOString();
}

function hashPayload(payload) {
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function normalizeEntry(input, options = {}) {
  const source = input || {};
  const now = options.now instanceof Date ? options.now : new Date();
  const rawEntryType = String(firstDefined(source, ['entryType', 'entry_type', 'type', 'source_type']) || '').trim().toLowerCase();
  const entryType = ENTRY_TYPE_ALIASES[rawEntryType] || rawEntryType;
  if (!ENTRY_TYPES.includes(entryType)) {
    throw new GrowthTimelineValidationError('entryType', `entryType参数无效: ${rawEntryType}`);
  }

  const rawSourceType = String(firstDefined(source, ['sourceType', 'source_type', 'source']) || entryType).trim().toLowerCase();
  const sourceType = SOURCE_TYPE_ALIASES[rawSourceType] || rawSourceType;
  if (!SOURCE_TYPES.includes(sourceType)) {
    throw new GrowthTimelineValidationError('sourceType', `sourceType参数无效: ${rawSourceType}`);
  }

  const childId = Number(firstDefined(source, ['childId', 'child_id']));
  if (!Number.isSafeInteger(childId) || childId <= 0) {
    throw new GrowthTimelineValidationError('childId', 'childId必须是正整数');
  }

  const title = String(firstDefined(source, ['title', 'practice_title']) || '').trim().slice(0, 255);
  if (!title) {
    throw new GrowthTimelineValidationError('title', 'title不能为空');
  }

  const summary = String(firstDefined(source, ['summary', 'user_note', 'note']) || '').slice(0, 4000);
  const sourceId = String(firstDefined(source, ['sourceId', 'source_id']) || '').trim().slice(0, 128);
  const abilityCodes = normalizeList(parseJson(firstDefined(source, ['abilityCodes', 'ability_codes', 'abilityTags', 'ability_tags']), []));
  const dimensions = parseJson(firstDefined(source, ['dimensions', 'dimensionScores', 'dimension_scores']), {});
  const metadata = Object.assign({}, parseJson(firstDefined(source, ['metadata', 'businessMetadata', 'business_metadata']), {}) || {});
  ['zoneCode', 'zone_code', 'scenarioCode', 'scenario_code', 'practiceTitle', 'practice_title', 'userNote', 'user_note'].forEach((key) => {
    if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
      metadata[key] = source[key];
    }
  });
  const occurredAt = normalizeDate(firstDefined(source, ['occurredAt', 'occurred_at', 'eventTime', 'event_time']), now);
  const explicitIdempotencyKey = firstDefined(source, ['idempotencyKey', 'idempotency_key', 'actionId', 'action_id']);
  const legacyFields = [];
  ['entry_type', 'source_type', 'source_id', 'ability_codes', 'occurred_at', 'idempotency_key'].forEach((field) => {
    if (source[field] !== undefined) legacyFields.push(field);
  });
  if (!explicitIdempotencyKey) legacyFields.push('idempotency_key');
  const stablePayload = { childId, entryType, sourceType, sourceId, title, summary, abilityCodes, occurredAt };
  const idempotencyKey = String(explicitIdempotencyKey || `timeline:${hashPayload(stablePayload)}`).trim().slice(0, 128);
  const entryId = String(firstDefined(source, ['entryId', 'entry_id']) || `growth:${hashPayload({ idempotencyKey, childId })}`).trim().slice(0, 128);

  return {
    entryId,
    childId,
    entryType,
    sourceType,
    sourceId,
    abilityCodes,
    occurredAt,
    title,
    summary,
    dimensions,
    metadata,
    idempotencyKey,
    legacyFields
  };
}

function parseStoredJson(value, fallback) {
  const parsed = parseJson(value, fallback);
  return parsed === null || parsed === undefined ? fallback : parsed;
}

function normalizeStoredEntry(row, deduplicated = false) {
  return {
    entryId: row.entry_id,
    childId: Number(row.child_id),
    entryType: row.entry_type,
    sourceType: row.source_type,
    sourceId: row.source_id || '',
    abilityCodes: parseStoredJson(row.ability_codes, []),
    occurredAt: row.occurred_at ? new Date(row.occurred_at).toISOString() : null,
    title: row.title,
    summary: row.summary || '',
    dimensions: parseStoredJson(row.dimensions, {}),
    metadata: parseStoredJson(row.metadata, {}),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    deduplicated
  };
}

async function recordLegacyUsage(pool, endpoint, fields) {
  if (!pool || !fields || !fields.length) return;
  for (const field of fields) {
    try {
      await pool.execute(
        `INSERT INTO api_compatibility_stats (endpoint, field_name, usage_count, last_used_at)
         VALUES (?, ?, 1, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE usage_count = usage_count + 1, last_used_at = CURRENT_TIMESTAMP`,
        [endpoint, field]
      );
    } catch (err) {
      console.warn('[growth-timeline] compatibility stat skipped:', err.message);
    }
  }
}

async function saveTimelineEntry(pool, input, options = {}) {
  const entry = normalizeEntry(input, options);
  const [existingRows] = await pool.execute(
    'SELECT * FROM growth_timeline_entries WHERE child_id = ? AND idempotency_key = ? LIMIT 1',
    [entry.childId, entry.idempotencyKey]
  );
  if (existingRows.length) {
    await recordLegacyUsage(pool, options.endpoint || 'growth-records', entry.legacyFields);
    return { entry: normalizeStoredEntry(existingRows[0], true), deduplicated: true, normalized: entry };
  }

  await pool.execute(
    `INSERT INTO growth_timeline_entries
      (entry_id, child_id, entry_type, source_type, source_id, ability_codes, occurred_at, title, summary, dimensions, metadata, idempotency_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [entry.entryId, entry.childId, entry.entryType, entry.sourceType, entry.sourceId, JSON.stringify(entry.abilityCodes), entry.occurredAt.slice(0, 19).replace('T', ' '), entry.title, entry.summary, JSON.stringify(entry.dimensions), JSON.stringify(entry.metadata), entry.idempotencyKey]
  );
  const [rows] = await pool.execute('SELECT * FROM growth_timeline_entries WHERE entry_id = ? LIMIT 1', [entry.entryId]);
  await recordLegacyUsage(pool, options.endpoint || 'growth-records', entry.legacyFields);
  return { entry: normalizeStoredEntry(rows[0] || Object.assign({}, entry, { created_at: entry.occurredAt, updated_at: entry.occurredAt })), deduplicated: false, normalized: entry };
}

async function listTimelineEntries(pool, filters = {}) {
  const childId = Number(filters.childId);
  if (!Number.isSafeInteger(childId) || childId <= 0) {
    throw new GrowthTimelineValidationError('childId', 'childId必须是正整数');
  }
  const page = Math.max(1, Math.floor(Number(filters.page) || 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(filters.pageSize) || 20)));
  const offset = (page - 1) * pageSize;
  const params = [childId];
  let where = 'WHERE child_id = ?';
  if (filters.entryType) {
    const entryType = ENTRY_TYPE_ALIASES[String(filters.entryType).trim()] || String(filters.entryType).trim();
    if (!ENTRY_TYPES.includes(entryType)) throw new GrowthTimelineValidationError('entryType', 'entryType参数无效');
    where += ' AND entry_type = ?';
    params.push(entryType);
  }
  const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM growth_timeline_entries ${where}`, params);
  const [rows] = await pool.execute(
    `SELECT * FROM growth_timeline_entries ${where} ORDER BY occurred_at DESC, id DESC LIMIT ? OFFSET ?`,
    params.concat([pageSize, offset])
  );
  return { list: rows.map((row) => normalizeStoredEntry(row)), pagination: { page, pageSize, total: Number(countRows[0] && countRows[0].total || 0) } };
}

module.exports = {
  ENTRY_TYPES,
  SOURCE_TYPES,
  GrowthTimelineValidationError,
  normalizeEntry,
  normalizeStoredEntry,
  saveTimelineEntry,
  listTimelineEntries,
  recordLegacyUsage
};
