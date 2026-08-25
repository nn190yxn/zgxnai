var DIMENSIONS = require('../../shared/business-dimensions.json');

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAgeSegments() {
  return clone(DIMENSIONS.ageSegments);
}

function getAgeSegmentByCode(code) {
  var target = normalize(code);
  return getAgeSegments().find(function(item) { return item.code === target; }) || null;
}

function resolveAgeSegmentCodes(value) {
  var target = normalize(value);
  if (!target) {
    return [];
  }
  var direct = DIMENSIONS.ageSegments.find(function(item) {
    return item.code === target || item.aliases.some(function(alias) { return normalize(alias) === target; });
  });
  if (direct) {
    return [direct.code];
  }
  return Array.isArray(DIMENSIONS.legacyAgeMappings[target]) ? DIMENSIONS.legacyAgeMappings[target].slice() : [];
}

function resolveAgeSegmentByMonths(months) {
  var value = Number(months);
  if (!isFinite(value) || value < 0) {
    return null;
  }
  return getAgeSegments().find(function(item) {
    return value >= item.minMonths && value < item.maxMonths;
  }) || null;
}

function getAbilities() {
  return clone(DIMENSIONS.abilities);
}

function resolveAbilityCodes(values) {
  var list = Array.isArray(values) ? values : String(values || '').split(/[、,，\s]+/);
  var targets = list.map(normalize).filter(Boolean);
  return DIMENSIONS.abilities.filter(function(item) {
    return targets.some(function(target) {
      return item.code === target || item.aliases.some(function(alias) { return normalize(alias) === target; });
    });
  }).map(function(item) { return item.code; });
}

function getSceneCategories() {
  return clone(DIMENSIONS.sceneCategories);
}

function getContentForms() {
  return clone(DIMENSIONS.contentForms);
}

module.exports = {
  version: DIMENSIONS.version,
  getAgeSegments: getAgeSegments,
  getAgeSegmentByCode: getAgeSegmentByCode,
  resolveAgeSegmentCodes: resolveAgeSegmentCodes,
  resolveAgeSegmentByMonths: resolveAgeSegmentByMonths,
  getAbilities: getAbilities,
  resolveAbilityCodes: resolveAbilityCodes,
  getSceneCategories: getSceneCategories,
  getContentForms: getContentForms
};
