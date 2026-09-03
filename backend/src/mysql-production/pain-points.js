const crypto = require('crypto');
const { PAIN_POINT_CATEGORIES, PAIN_POINT_KEYS } = require('./platform-contract');

function normalizePainPoint(input) {
  const value = input || {};
  const key = String(value.pain_point_key || value.painPointKey || '').trim();
  if (!PAIN_POINT_KEYS.includes(key)) throw new Error('成长痛点 key 不受支持');
  const category = String(value.category || '').trim();
  if (!PAIN_POINT_CATEGORIES.includes(category)) throw new Error('成长痛点分类不受支持');
  return {
    pain_point_key: key,
    category,
    short_title: String(value.short_title || value.shortTitle || '').trim().slice(0, 32),
    description: String(value.description || '').trim(),
    observable_signs: Array.isArray(value.observable_signs || value.observableSigns) ? (value.observable_signs || value.observableSigns) : [],
    possible_reasons: Array.isArray(value.possible_reasons || value.possibleReasons) ? (value.possible_reasons || value.possibleReasons) : [],
    today_action: value.today_action || value.todayAction || {},
    parent_prompt: String(value.parent_prompt || value.parentPrompt || '').trim(),
    observe_signals: Array.isArray(value.observe_signals || value.observeSignals) ? (value.observe_signals || value.observeSignals) : [],
    content_hash: crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex')
  };
}

module.exports = { normalizePainPoint };
