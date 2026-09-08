const crypto = require('crypto');
const dimensions = require('../shared/business-dimensions');
const localKnowledgeItems = require('../../examples/knowledgebase-sample.json');

const CONTENT_TYPES = new Set(['article', 'task', 'scene', 'assessment']);
const REVIEW_STATUSES = new Set(['draft', 'pending', 'approved', 'rejected']);

function asList(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return String(value || '').split(/[、,，\s]+/);
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeAgeCodes(value) {
  const result = [];
  asList(value).forEach((item) => {
    result.push.apply(result, dimensions.resolveAgeSegmentCodes(item));
  });
  return unique(result);
}

function normalizeAbilityCodes(value) {
  return unique(dimensions.resolveAbilityCodes(asList(value)));
}

function normalizeSceneCodes(value) {
  const scenes = dimensions.getSceneCategories();
  return unique(asList(value).map((rawValue) => {
    const target = String(rawValue || '').trim().toLowerCase();
    const matched = scenes.find((item) => item.code === target || String(item.label || '').trim().toLowerCase() === target || (item.aliases || []).some((alias) => String(alias).trim().toLowerCase() === target));
    return matched ? matched.code : '';
  }));
}

function normalizeContentForm(value, type) {
  const target = String(value || type || '').trim().toLowerCase();
  const matched = dimensions.getContentForms().find((item) => item.code === target || String(item.label || '').trim().toLowerCase() === target);
  return matched ? matched.code : '';
}

function normalizeTextList(value) {
  return unique(asList(value).map((item) => String(item || '').trim()));
}

function normalizeStructuredTextList(value) {
  if (Array.isArray(value)) return unique(value.map((item) => String(item || '').trim()));
  const text = String(value || '').trim();
  return text ? text.split(/\n+/).map((item) => item.trim()).filter(Boolean) : [];
}

function getContentId(item, type) {
  const explicitId = item.content_id || item.contentId;
  if (explicitId) return String(explicitId).trim();
  if (type === 'article') return String(item.title || '').trim();
  if (type === 'task') return String(item.task_code || item.taskCode || '').trim();
  if (type === 'scene') return String(item.scene_key || item.sceneKey || '').trim();
  if (type === 'assessment') return String(item.assessment_code || item.assessmentCode || '').trim();
  return '';
}

function normalizeKnowledgeItem(rawItem) {
  const source = rawItem && typeof rawItem === 'object' && !Array.isArray(rawItem) ? rawItem : {};
  const type = String(source.type || source.content_type || '').trim().toLowerCase();
  const ageValue = source.age_segment_codes || source.ageSegmentCodes || source.age_group || source.ageGroup || source.age_range || source.ageRange;
  const abilityValue = source.ability_codes || source.abilityCodes || source.ability_tags || source.abilityTags;
  const sceneValue = source.scene_codes || source.sceneCodes || source.scene_category || source.sceneCategory;
  const steps = normalizeStructuredTextList(source.steps);
  const observeSignals = normalizeStructuredTextList(source.observe_signals || source.observeSignals);
  const publishedValue = source.is_published === undefined ? source.isPublished : source.is_published;
  const title = String(source.title || source.scene_title || source.sceneTitle || source.name || '').trim();
  const content = String(source.content || source.principle_text || source.principleText || source.description || '').trim();
  const normalized = {
    type,
    contentId: getContentId(source, type),
    title,
    summary: String(source.summary || source.objective || source.suggested_action || source.suggestedAction || '').trim(),
    content,
    ageSegmentCodes: normalizeAgeCodes(ageValue),
    abilityCodes: normalizeAbilityCodes(abilityValue),
    sceneCodes: normalizeSceneCodes(sceneValue),
    contentForm: normalizeContentForm(source.content_form || source.contentForm, type),
    sourceName: String(source.source_name || source.sourceName || source.author || '').trim(),
    sourceUrl: String(source.source_url || source.sourceUrl || '').trim(),
    evidenceLevel: String(source.evidence_level || source.evidenceLevel || '').trim(),
    contentVersion: String(source.content_version || source.contentVersion || '').trim(),
    reviewStatus: String(source.review_status || source.reviewStatus || '').trim().toLowerCase(),
    isPublished: publishedValue === undefined ? true : ![false, 0, '0', 'false'].includes(publishedValue),
    trainingObjective: String(source.training_objective || source.trainingObjective || source.objective || '').trim(),
    durationMinutes: Number(source.duration_minutes || source.durationMinutes || source.duration || 0),
    steps,
    parentPrompt: String(source.parent_prompt || source.parentPrompt || '').trim(),
    observeSignals,
    safetyNotice: String(source.safety_notice || source.safetyNotice || '').trim(),
    raw: source
  };
  return normalized;
}

function validateKnowledgeItem(rawItem) {
  const item = normalizeKnowledgeItem(rawItem);
  const errors = [];
  if (!CONTENT_TYPES.has(item.type)) errors.push('type 必须是 article、task、scene 或 assessment');
  if (!item.contentId) errors.push('缺少稳定 content_id');
  if (!item.title) errors.push('缺少 title');
  if (!item.ageSegmentCodes.length) errors.push('age_segment_codes 缺失或不含标准年龄代码');
  if (!item.abilityCodes.length) errors.push('ability_codes 缺失或不含标准能力代码');
  if (!item.sceneCodes.length) errors.push('scene_codes 缺失或不含标准场景代码');
  if (!item.contentForm) errors.push('content_form 缺失或不合法');
  if (!item.sourceName) errors.push('缺少 source_name');
  if (!item.evidenceLevel) errors.push('缺少 evidence_level');
  if (!item.contentVersion) errors.push('缺少 content_version');
  if (!REVIEW_STATUSES.has(item.reviewStatus)) errors.push('review_status 必须是 draft、pending、approved 或 rejected');
  if (item.type === 'task') {
    if (!item.trainingObjective) errors.push('训练内容缺少 training_objective');
    if (!Number.isInteger(item.durationMinutes) || item.durationMinutes <= 0) errors.push('训练内容 duration_minutes 必须是正整数');
    if (!item.steps.length) errors.push('训练内容缺少 steps');
    if (!item.parentPrompt) errors.push('训练内容缺少 parent_prompt');
    if (!item.observeSignals.length) errors.push('训练内容缺少 observe_signals');
    if (!item.safetyNotice) errors.push('训练内容缺少 safety_notice');
  }
  return { valid: errors.length === 0, item, errors };
}

function buildContentHash(item) {
  const payload = {
    title: item.title,
    summary: item.summary,
    content: item.content,
    ageSegmentCodes: item.ageSegmentCodes,
    abilityCodes: item.abilityCodes,
    sceneCodes: item.sceneCodes,
    contentForm: item.contentForm,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    evidenceLevel: item.evidenceLevel,
    contentVersion: item.contentVersion,
    reviewStatus: item.reviewStatus,
    isPublished: item.isPublished,
    trainingObjective: item.trainingObjective,
    durationMinutes: item.durationMinutes,
    steps: item.steps,
    parentPrompt: item.parentPrompt,
    observeSignals: item.observeSignals,
    safetyNotice: item.safetyNotice
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function parseJsonList(value) {
  if (Array.isArray(value)) return value.slice();
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function normalizeKnowledgeRow(row, fallback) {
  return {
    id: row.id || null,
    contentType: row.content_type || row.type,
    contentId: row.content_id || row.contentId,
    title: row.title || '',
    summary: row.summary || '',
    content: row.content || '',
    ageSegmentCodes: parseJsonList(row.age_segment_codes || row.ageSegmentCodes),
    abilityCodes: parseJsonList(row.ability_codes || row.abilityCodes),
    sceneCodes: parseJsonList(row.scene_codes || row.sceneCodes),
    contentForm: row.content_form || row.contentForm || '',
    sourceName: row.source_name || row.sourceName || '',
    sourceUrl: row.source_url || row.sourceUrl || '',
    evidenceLevel: row.evidence_level || row.evidenceLevel || '',
    contentVersion: row.content_version || row.contentVersion || '',
    reviewStatus: row.review_status || row.reviewStatus || '',
    isPublished: row.is_published === undefined ? Boolean(row.isPublished) : Boolean(row.is_published),
    trainingObjective: row.training_objective || row.trainingObjective || '',
    durationMinutes: Number(row.duration_minutes || row.durationMinutes || 0),
    steps: parseJsonList(row.steps_json || row.steps),
    parentPrompt: row.parent_prompt || row.parentPrompt || '',
    observeSignals: parseJsonList(row.observe_signals || row.observeSignals),
    safetyNotice: row.safety_notice || row.safetyNotice || '',
    retrievalSource: fallback ? 'local_fallback' : 'formal',
    isFallback: Boolean(fallback)
  };
}

function isGovernedKnowledgeContent(item, reviewStatus, publishedOnly) {
  const validAgeCodes = new Set(dimensions.getAgeSegments().map((entry) => entry.code));
  const validAbilityCodes = new Set(dimensions.getAbilities().map((entry) => entry.code));
  const validSceneCodes = new Set(dimensions.getSceneCategories().map((entry) => entry.code));
  const validContentForms = new Set(dimensions.getContentForms().map((entry) => entry.code));
  return Boolean(
    item && CONTENT_TYPES.has(item.contentType) && item.contentId && item.title &&
    item.ageSegmentCodes.length && item.ageSegmentCodes.every((code) => validAgeCodes.has(code)) &&
    item.abilityCodes.length && item.abilityCodes.every((code) => validAbilityCodes.has(code)) &&
    item.sceneCodes.length && item.sceneCodes.every((code) => validSceneCodes.has(code)) &&
    validContentForms.has(item.contentForm) && item.sourceName && item.evidenceLevel && item.contentVersion &&
    REVIEW_STATUSES.has(item.reviewStatus) && (!reviewStatus || item.reviewStatus === reviewStatus) &&
    (publishedOnly === false || item.isPublished)
  );
}

function isFormalKnowledgeContent(item) {
  return isGovernedKnowledgeContent(item, 'approved', true);
}

function buildKnowledgeQuery(filters) {
  const options = filters || {};
  const where = [];
  const params = [];
  if (options.publishedOnly !== false) where.push('is_published = 1');
  const reviewStatus = String(options.reviewStatus || 'approved').trim().toLowerCase();
  if (reviewStatus) {
    where.push('review_status = ?');
    params.push(reviewStatus);
  }
  const contentTypes = normalizeTextList(options.contentTypes || options.contentType);
  if (contentTypes.length) {
    where.push(`content_type IN (${contentTypes.map(() => '?').join(',')})`);
    params.push.apply(params, contentTypes);
  }
  [['ageSegmentCodes', 'age_segment_codes'], ['abilityCodes', 'ability_codes'], ['sceneCodes', 'scene_codes']].forEach(([key, column]) => {
    const codes = normalizeTextList(options[key]);
    if (codes.length) {
      where.push(`(${codes.map(() => `JSON_CONTAINS(${column}, JSON_QUOTE(?))`).join(' OR ')})`);
      params.push.apply(params, codes);
    }
  });
  if (options.contentForm) {
    where.push('content_form = ?');
    params.push(String(options.contentForm));
  }
  const keywords = normalizeTextList(options.keywords);
  if (keywords.length) {
    where.push(`(${keywords.map(() => '(title LIKE ? OR summary LIKE ? OR content LIKE ? OR training_objective LIKE ?)').join(' OR ')})`);
    keywords.forEach((keyword) => {
      const term = `%${keyword}%`;
      params.push(term, term, term, term);
    });
  }
  const limit = Math.max(1, Math.min(50, Number(options.limit || 20)));
  const offset = Math.max(0, Number(options.offset || 0));
  const sql = `SELECT * FROM knowledge_contents${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC, id DESC LIMIT ${limit} OFFSET ${offset}`;
  return { sql, params };
}

async function queryFormalKnowledge(pool, filters) {
  const query = buildKnowledgeQuery(filters);
  const [rows] = await pool.execute(query.sql, query.params);
  const reviewStatus = String(filters && filters.reviewStatus || 'approved').trim().toLowerCase();
  const publishedOnly = !filters || filters.publishedOnly !== false;
  return rows.map((row) => normalizeKnowledgeRow(row, false)).filter((item) => isGovernedKnowledgeContent(item, reviewStatus, publishedOnly));
}

function getLocalKnowledge(filters) {
  const options = filters || {};
  const ageCodes = normalizeTextList(options.ageSegmentCodes);
  const abilityCodes = normalizeTextList(options.abilityCodes);
  const sceneCodes = normalizeTextList(options.sceneCodes);
  const contentTypes = normalizeTextList(options.contentTypes || options.contentType);
  const keywords = normalizeTextList(options.keywords).map((item) => item.toLowerCase());
  const limit = Math.max(1, Math.min(50, Number(options.limit || 20)));
  const offset = Math.max(0, Number(options.offset || 0));
  return localKnowledgeItems.map((rawItem) => validateKnowledgeItem(rawItem)).filter((result) => result.valid).map((result) => result.item).filter((item) => {
    if (contentTypes.length && !contentTypes.includes(item.type)) return false;
    if (options.contentForm && item.contentForm !== options.contentForm) return false;
    if (ageCodes.length && !ageCodes.some((code) => item.ageSegmentCodes.includes(code))) return false;
    if (abilityCodes.length && !abilityCodes.some((code) => item.abilityCodes.includes(code))) return false;
    if (sceneCodes.length && !sceneCodes.some((code) => item.sceneCodes.includes(code))) return false;
    if (keywords.length) {
      const text = [item.title, item.summary, item.content, item.trainingObjective, item.parentPrompt].join(' ').toLowerCase();
      if (!keywords.some((keyword) => text.includes(keyword))) return false;
    }
    const reviewStatus = String(options.reviewStatus || 'approved').trim().toLowerCase();
    return item.reviewStatus === reviewStatus && (options.publishedOnly === false || item.isPublished);
  }).slice(offset, offset + limit).map((item) => normalizeKnowledgeRow({
    type: item.type,
    contentId: item.contentId,
    title: item.title,
    summary: item.summary,
    content: item.content,
    ageSegmentCodes: item.ageSegmentCodes,
    abilityCodes: item.abilityCodes,
    sceneCodes: item.sceneCodes,
    contentForm: item.contentForm,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    evidenceLevel: item.evidenceLevel,
    contentVersion: item.contentVersion,
    reviewStatus: item.reviewStatus,
    isPublished: item.isPublished,
    trainingObjective: item.trainingObjective,
    durationMinutes: item.durationMinutes,
    steps: item.steps,
    parentPrompt: item.parentPrompt,
    observeSignals: item.observeSignals,
    safetyNotice: item.safetyNotice
  }, true));
}

async function queryKnowledgeWithFallback(pool, filters, onGap) {
  try {
    const items = await queryFormalKnowledge(pool, filters);
    if (items.length) return { items, source: 'formal', fallback: false, gapReason: '' };
    if (Number(filters && filters.offset || 0) > 0) {
      const firstPage = await queryFormalKnowledge(pool, { ...filters, offset: 0 });
      if (firstPage.length) return { items, source: 'formal', fallback: false, gapReason: '' };
    }
    if (onGap) onGap('formal_content_missing', filters);
    return { items: getLocalKnowledge(filters), source: 'local_fallback', fallback: true, gapReason: 'formal_content_missing' };
  } catch (error) {
    if (onGap) onGap('formal_content_query_failed', filters, error);
    return { items: getLocalKnowledge(filters), source: 'local_fallback', fallback: true, gapReason: 'formal_content_query_failed' };
  }
}

module.exports = {
  CONTENT_TYPES,
  REVIEW_STATUSES,
  normalizeAgeCodes,
  normalizeAbilityCodes,
  normalizeSceneCodes,
  normalizeContentForm,
  normalizeKnowledgeItem,
  validateKnowledgeItem,
  buildContentHash,
  normalizeKnowledgeRow,
  isGovernedKnowledgeContent,
  isFormalKnowledgeContent,
  buildKnowledgeQuery,
  queryFormalKnowledge,
  getLocalKnowledge,
  queryKnowledgeWithFallback
};
