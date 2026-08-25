const dimensions = require('./business-dimensions');

const BUSINESS_SOURCES = Object.freeze([
  'ability_observation',
  'assessment',
  'training',
  'development_zone',
  'ai',
  'daily_status',
  'core_action',
  'manual',
  'knowledge_import',
  'analytics'
]);

const SOURCE_ALIASES = Object.freeze({
  observation: 'ability_observation',
  ability_profile: 'ability_observation',
  daily_plan: 'training',
  training_task: 'training',
  zone: 'development_zone',
  ai_chat: 'ai',
  growth_record: 'manual',
  import: 'knowledge_import'
});

class BusinessFieldValidationError extends Error {
  constructor(field, value, message) {
    super(message || `Invalid business field: ${field}`);
    this.name = 'BusinessFieldValidationError';
    this.field = field;
    this.value = value;
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

function splitValues(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/[、,，]+/);
  return values.map((item) => String(item).trim()).filter(Boolean);
}

function unique(values) {
  return Array.from(new Set(values));
}

function normalizeChildId(value) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  if (!/^\d+$/.test(text)) {
    throw new BusinessFieldValidationError('childId', value, 'childId must be a positive integer');
  }
  const childId = Number(text);
  if (!Number.isSafeInteger(childId) || childId <= 0) {
    throw new BusinessFieldValidationError('childId', value, 'childId must be a positive safe integer');
  }
  return childId;
}

function normalizeAgeSegmentCodes(value) {
  const inputValues = splitValues(value);
  if (inputValues.length === 0) {
    throw new BusinessFieldValidationError('ageSegmentCodes', value, 'At least one age segment is required');
  }
  const codes = [];
  for (const inputValue of inputValues) {
    const resolved = dimensions.resolveAgeSegmentCodes(inputValue);
    if (resolved.length === 0) {
      throw new BusinessFieldValidationError('ageSegmentCodes', inputValue, `Unknown age segment: ${inputValue}`);
    }
    codes.push(...resolved);
  }
  return unique(codes);
}

function normalizeAbilityCodes(value) {
  const inputValues = splitValues(value);
  if (inputValues.length === 0) {
    throw new BusinessFieldValidationError('abilityCodes', value, 'At least one ability is required');
  }
  const codes = [];
  for (const inputValue of inputValues) {
    const resolved = dimensions.resolveAbilityCodes([inputValue]);
    if (resolved.length === 0) {
      throw new BusinessFieldValidationError('abilityCodes', inputValue, `Unknown ability: ${inputValue}`);
    }
    codes.push(...resolved);
  }
  return unique(codes);
}

function normalizeBusinessSource(value) {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const source = SOURCE_ALIASES[normalized] || normalized;
  if (!BUSINESS_SOURCES.includes(source)) {
    throw new BusinessFieldValidationError('sourceType', value, `Unknown business source: ${value}`);
  }
  return source;
}

function normalizeOccurredAt(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BusinessFieldValidationError('occurredAt', value, 'occurredAt must be a valid date or timestamp');
  }
  return date.toISOString();
}

function normalizeSchemaVersion(value) {
  const normalized = String(value === undefined || value === null ? '' : value).trim().replace(/^v/i, '');
  if (!/^\d+$/.test(normalized)) {
    throw new BusinessFieldValidationError('schemaVersion', value, 'schemaVersion must be a positive integer');
  }
  const version = Number(normalized);
  if (!Number.isSafeInteger(version) || version <= 0) {
    throw new BusinessFieldValidationError('schemaVersion', value, 'schemaVersion must be a positive safe integer');
  }
  return version;
}

const FIELD_DEFINITIONS = Object.freeze({
  childId: { keys: ['childId', 'child_id'], normalize: normalizeChildId },
  ageSegmentCodes: { keys: ['ageSegmentCodes', 'age_segment_codes', 'ageSegmentCode', 'age_segment_code', 'ageGroup', 'age_group'], normalize: normalizeAgeSegmentCodes },
  abilityCodes: { keys: ['abilityCodes', 'ability_codes', 'abilityCode', 'ability_code', 'abilityLabels', 'ability_labels'], normalize: normalizeAbilityCodes },
  sourceType: { keys: ['sourceType', 'source_type', 'businessSource', 'business_source', 'source'], normalize: normalizeBusinessSource },
  occurredAt: { keys: ['occurredAt', 'occurred_at', 'eventTime', 'event_time', 'createdAt', 'created_at'], normalize: normalizeOccurredAt },
  schemaVersion: { keys: ['schemaVersion', 'schema_version', 'dataVersion', 'data_version', 'version'], normalize: normalizeSchemaVersion }
});

function normalizeBusinessFields(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BusinessFieldValidationError('payload', input, 'Business fields payload must be an object');
  }
  const normalized = {};
  for (const [field, definition] of Object.entries(FIELD_DEFINITIONS)) {
    const value = firstDefined(input, definition.keys);
    if (value !== undefined) {
      normalized[field] = definition.normalize(value);
    }
  }
  return normalized;
}

function validateBusinessFields(input, requiredFields = Object.keys(FIELD_DEFINITIONS)) {
  const normalized = normalizeBusinessFields(input);
  for (const field of requiredFields) {
    if (!FIELD_DEFINITIONS[field]) {
      throw new Error(`Unknown required business field: ${field}`);
    }
    if (normalized[field] === undefined) {
      throw new BusinessFieldValidationError(field, undefined, `Missing required business field: ${field}`);
    }
  }
  return normalized;
}

module.exports = {
  BUSINESS_SOURCES,
  BusinessFieldValidationError,
  normalizeChildId,
  normalizeAgeSegmentCodes,
  normalizeAbilityCodes,
  normalizeBusinessSource,
  normalizeOccurredAt,
  normalizeSchemaVersion,
  normalizeBusinessFields,
  validateBusinessFields
};
