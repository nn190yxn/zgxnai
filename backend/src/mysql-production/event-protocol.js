const crypto = require('crypto');

const EVENT_SCHEMA_VERSION = 1;
const MAX_EVENT_META_BYTES = 8192;
const MAX_BATCH_SIZE = 100;

const LEGACY_EVENT_ALIASES = Object.freeze({
  payment_success: 'payment_order_success',
  membership_payment_success: 'payment_order_success',
  membership_trial_activate: 'trial_activate',
  nutrition_recipe_view: 'recipe_detail_view',
  nutrition_recipe_favorite: 'recipe_favorite_click',
  development_zone_view: 'ability_observation_exposure',
  assessment_submit: 'ability_observation_complete'
});

const SENSITIVE_KEY = /(authorization|access[_-]?token|refresh[_-]?token|password|passwd|secret|cookie|set-cookie|private[_-]?key|api[_-]?key|session[_-]?token)/i;

function createId(prefix) {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${crypto.randomBytes(12).toString('hex')}`;
}

function normalizeText(value, maxLength = 255) {
  const text = String(value === undefined || value === null ? '' : value).trim();
  return text ? text.slice(0, maxLength) : null;
}

function normalizeEventType(value) {
  const eventType = normalizeText(value, 128);
  return eventType ? (LEGACY_EVENT_ALIASES[eventType] || eventType) : '';
}

function normalizeClientSessionId(value) {
  const sessionId = normalizeText(value, 128);
  if (!sessionId || !/^[A-Za-z0-9._:-]+$/.test(sessionId)) {
    return null;
  }
  return sessionId;
}

function sanitizeValue(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) {
    return value === undefined ? null : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.keys(value).reduce((result, key) => {
      if (!SENSITIVE_KEY.test(key)) {
        result[key] = sanitizeValue(value[key], depth + 1);
      }
      return result;
    }, {});
  }
  if (typeof value === 'string') {
    return value.slice(0, 2000);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  return null;
}

function sanitizeEventMeta(value) {
  const source = value && typeof value === 'object' ? value : {};
  let sourceSerialized;
  try {
    sourceSerialized = JSON.stringify(source);
  } catch (error) {
    return { truncated: true };
  }
  if (Buffer.byteLength(sourceSerialized, 'utf8') > MAX_EVENT_META_BYTES) {
    return { truncated: true };
  }

  const sanitized = sanitizeValue(source);
  const serialized = JSON.stringify(sanitized);
  if (Buffer.byteLength(serialized, 'utf8') <= MAX_EVENT_META_BYTES) {
    return sanitized;
  }
  return { truncated: true };
}

function normalizeOccurredAt(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function normalizeEvent(raw, context = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const eventType = normalizeEventType(source.event_type || source.eventType);
  if (!eventType) {
    const error = new Error('event_type不能为空');
    error.code = 'EVENT_TYPE_REQUIRED';
    throw error;
  }

  const clientSessionId = normalizeClientSessionId(
    source.client_session_id || source.clientSessionId || source.session_id || context.clientSessionId
  );
  const eventId = normalizeText(source.event_id || source.eventId, 128) || createId('evt');
  const childId = source.child_id || source.childId || context.childId || null;
  const actionId = normalizeText(source.action_id || source.actionId, 128);
  const abilityCodes = source.ability_codes || source.abilityCodes || null;
  const eventMeta = sanitizeEventMeta(source.event_meta || source.eventMeta);
  const payload = {
    schema_version: Number(source.schema_version || source.schemaVersion || EVENT_SCHEMA_VERSION),
    event_id: eventId,
    client_session_id: clientSessionId,
    action_id: actionId,
    child_id: childId === null || childId === '' ? null : Number(childId) || null,
    age_segment_code: normalizeText(source.age_segment_code || source.ageSegmentCode || source.age_segment_key, 64),
    ability_codes: Array.isArray(abilityCodes) ? abilityCodes.slice(0, 20).map((item) => normalizeText(item, 64)).filter(Boolean) : normalizeText(abilityCodes, 255),
    plan_id: normalizeText(source.plan_id || source.planId, 128),
    source_module: normalizeText(source.source_module || source.sourceModule || source.module_key, 128),
    source_page: normalizeText(source.source_page || source.sourcePage || source.page_key, 128),
    source_content_type: normalizeText(source.source_content_type || source.sourceContentType || source.content_type, 64),
    source_content_id: normalizeText(source.source_content_id || source.sourceContentId || source.content_id, 128),
    scene_key: normalizeText(source.scene_key || source.sceneKey, 128),
    category_key: normalizeText(source.category_key || source.categoryKey, 128),
    category_label: normalizeText(source.category_label || source.categoryLabel, 128),
    age_segment_key: normalizeText(source.age_segment_key || source.ageSegmentKey, 64),
    pain_point_key: normalizeText(source.pain_point_key || source.painPointKey, 128),
    ability_tags: Array.isArray(source.ability_tags || source.abilityTags)
      ? (source.ability_tags || source.abilityTags).slice(0, 20).map((item) => normalizeText(item, 64)).filter(Boolean)
      : normalizeText(source.ability_tags || source.abilityTags, 255),
    membership_status: normalizeText(source.membership_status || source.membershipStatus, 32) || 'free',
    membership_entry_source: normalizeText(source.membership_entry_source || source.membershipEntrySource, 128),
    occurred_at: normalizeOccurredAt(source.occurred_at || source.occurredAt),
    event_meta: eventMeta
  };

  return {
    eventType,
    eventId,
    clientSessionId,
    actionId,
    payload,
    eventData: payload
  };
}

function buildDeduplicationKey(event) {
  return event.eventId || event.payload.event_id;
}

module.exports = {
  EVENT_SCHEMA_VERSION,
  LEGACY_EVENT_ALIASES,
  MAX_BATCH_SIZE,
  MAX_EVENT_META_BYTES,
  buildDeduplicationKey,
  normalizeClientSessionId,
  normalizeEvent,
  sanitizeEventMeta,
  sanitizeValue
};
