const fs = require('fs');
const path = require('path');

const DATA_PATH = path.resolve(__dirname, '../../examples/development-zones-3-6.json');

let cachedData = null;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadDevelopmentZonesData() {
  if (!cachedData) {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    cachedData = JSON.parse(raw);
  }
  return clone(cachedData);
}

function getDevelopmentAgeGroups() {
  const data = loadDevelopmentZonesData();
  return Array.isArray(data.ageGroups) ? data.ageGroups : [];
}

function isDevelopmentAgeGroup(ageGroup) {
  const target = String(ageGroup || '').trim();
  return getDevelopmentAgeGroups().indexOf(target) >= 0;
}

function getDevelopmentZones() {
  const data = loadDevelopmentZonesData();
  return Array.isArray(data.zones) ? data.zones : [];
}

function getDevelopmentZoneByCode(code) {
  const targetCode = String(code || '').trim();
  if (!targetCode) {
    return null;
  }
  const zone = getDevelopmentZones().find(function(item) {
    return item && item.code === targetCode;
  });
  return zone || null;
}

function getDevelopmentScenarios(zoneCode, ageGroup) {
  const zone = getDevelopmentZoneByCode(zoneCode);
  if (!zone || !Array.isArray(zone.scenarios)) {
    return [];
  }
  const targetAgeGroup = String(ageGroup || '').trim();
  if (!targetAgeGroup) {
    return zone.scenarios;
  }
  if (!isDevelopmentAgeGroup(targetAgeGroup)) {
    return [];
  }
  return zone.scenarios.filter(function(scenario) {
    return Array.isArray(scenario.ageGroups) && scenario.ageGroups.indexOf(targetAgeGroup) >= 0;
  });
}

function getDevelopmentScenario(zoneCode, scenarioCode) {
  const targetScenarioCode = String(scenarioCode || '').trim();
  if (!targetScenarioCode) {
    return null;
  }
  const scenario = getDevelopmentScenarios(zoneCode).find(function(item) {
    return item && item.code === targetScenarioCode;
  });
  return scenario || null;
}

function getDevelopmentZoneDetail(code, ageGroup) {
  const zone = getDevelopmentZoneByCode(code);
  if (!zone) {
    return null;
  }
  const detail = clone(zone);
  detail.scenarios = getDevelopmentScenarios(code, ageGroup);
  detail.selectedAgeGroup = isDevelopmentAgeGroup(ageGroup) ? String(ageGroup).trim() : '';
  return detail;
}

module.exports = {
  loadDevelopmentZonesData,
  getDevelopmentAgeGroups,
  isDevelopmentAgeGroup,
  getDevelopmentZones,
  getDevelopmentZoneByCode,
  getDevelopmentScenarios,
  getDevelopmentScenario,
  getDevelopmentZoneDetail
};
