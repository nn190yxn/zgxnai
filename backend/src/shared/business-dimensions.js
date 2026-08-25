const dimensions = require('../../../shared/business-dimensions.json');

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getAgeSegments() {
  return clone(dimensions.ageSegments);
}

function getAgeSegmentByCode(code) {
  const target = normalize(code);
  return getAgeSegments().find((item) => item.code === target) || null;
}

function resolveAgeSegmentCodes(value) {
  const target = normalize(value);
  if (!target) {
    return [];
  }
  const direct = dimensions.ageSegments.find((item) => item.code === target || item.aliases.some((alias) => normalize(alias) === target));
  if (direct) {
    return [direct.code];
  }
  return Array.isArray(dimensions.legacyAgeMappings[target]) ? dimensions.legacyAgeMappings[target].slice() : [];
}

function resolveAgeSegmentByMonths(months) {
  const value = Number(months);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }
  return getAgeSegments().find((item) => value >= item.minMonths && value < item.maxMonths) || null;
}

function getAbilities() {
  return clone(dimensions.abilities);
}

function resolveAbilityCodes(values) {
  const list = Array.isArray(values) ? values : String(values || '').split(/[、,，\s]+/);
  const targets = list.map(normalize).filter(Boolean);
  return dimensions.abilities.filter((item) => targets.some((target) => item.code === target || normalize(item.label) === target || item.aliases.some((alias) => normalize(alias) === target))).map((item) => item.code);
}

function getSceneCategories() {
  return clone(dimensions.sceneCategories);
}

function getContentForms() {
  return clone(dimensions.contentForms);
}

module.exports = {
  version: dimensions.version,
  getAgeSegments,
  getAgeSegmentByCode,
  resolveAgeSegmentCodes,
  resolveAgeSegmentByMonths,
  getAbilities,
  resolveAbilityCodes,
  getSceneCategories,
  getContentForms
};
