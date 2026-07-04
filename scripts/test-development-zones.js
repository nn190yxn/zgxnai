const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramZones = require('../miniprogram/utils/development-zones.js');
const backendZones = require('../backend/src/mysql-production/development-zones.js');

const EXPECTED_AGE_GROUPS = ['3-4岁', '4-5岁', '5-6岁'];
const EXPECTED_ZONES = [
  ['language', '语言发育'],
  ['sensory', '感统支持'],
  ['focus', '专注力'],
  ['gross_motor', '大运动练习'],
  ['emotion', '情绪管理'],
  ['social', '社交能力'],
  ['confidence', '自信与适应'],
  ['habits', '生活习惯']
];
const FORBIDDEN_TEXT = /感统失调|胆量专区|AI|人工智能|发育迟缓|异常|缺陷|诊断|崩溃|社交规则|感统方面|平衡弱|腿部力量弱/;

function assertScenarioDepthComplete(scenario, zoneCode) {
  assert.ok(scenario.developmentalFocus, zoneCode + ' scenario developmentalFocus missing');
  assert.ok(Array.isArray(scenario.ageGuidance), zoneCode + ' scenario ageGuidance missing');
  assert.strictEqual(scenario.ageGuidance.length, 3, zoneCode + ' scenario ageGuidance should cover three age groups');
  scenario.ageGuidance.forEach(function(item) {
    assert.ok(EXPECTED_AGE_GROUPS.indexOf(item.ageGroup) >= 0, zoneCode + ' scenario ageGuidance invalid: ' + item.ageGroup);
    assert.ok(item.guidance, zoneCode + ' scenario ageGuidance text missing');
  });
  assert.ok(Array.isArray(scenario.difficultySteps), zoneCode + ' scenario difficultySteps missing');
  assert.strictEqual(scenario.difficultySteps.length, 3, zoneCode + ' scenario difficultySteps should have three levels');
  assert.ok(scenario.playGame, zoneCode + ' scenario playGame missing');
  ['name', 'setup', 'howToPlay', 'parentTip', 'variation'].forEach(function(key) {
    assert.ok(scenario.playGame[key], zoneCode + ' scenario playGame.' + key + ' missing');
  });
  assert.ok(Array.isArray(scenario.progressSignals), zoneCode + ' scenario progressSignals missing');
  assert.ok(scenario.progressSignals.length >= 3, zoneCode + ' scenario progressSignals should have enough signals');
  assert.ok(Array.isArray(scenario.commonPitfalls), zoneCode + ' scenario commonPitfalls missing');
  assert.ok(scenario.commonPitfalls.length >= 2, zoneCode + ' scenario commonPitfalls should have enough items');
  assert.ok(scenario.safetyBoundary, zoneCode + ' scenario safetyBoundary missing');
}

function assertScenarioComplete(scenario, zoneCode) {
  assert.ok(scenario.code, zoneCode + ' scenario code missing');
  assert.ok(scenario.title, zoneCode + ' scenario title missing');
  assert.ok(scenario.symptomText, zoneCode + ' scenario symptomText missing');
  assert.ok(scenario.parentCheck, zoneCode + ' scenario parentCheck missing');
  assert.ok(scenario.todayAction, zoneCode + ' scenario todayAction missing');
  assert.ok(scenario.parentScript, zoneCode + ' scenario parentScript missing');
  assert.ok(scenario.observeSignal, zoneCode + ' scenario observeSignal missing');
  assert.ok(scenario.chatQuestion, zoneCode + ' scenario chatQuestion missing');
  assert.ok(Array.isArray(scenario.ageGroups) && scenario.ageGroups.length > 0, zoneCode + ' scenario ageGroups missing');
  scenario.ageGroups.forEach(function(ageGroup) {
    assert.ok(EXPECTED_AGE_GROUPS.indexOf(ageGroup) >= 0, zoneCode + ' scenario ageGroup invalid: ' + ageGroup);
  });
  assertScenarioDepthComplete(scenario, zoneCode);
}

function assertZoneComplete(zone) {
  assert.ok(zone.code, 'zone code missing');
  assert.ok(zone.title, zone.code + ' title missing');
  assert.ok(zone.subtitle, zone.code + ' subtitle missing');
  assert.ok(zone.actionText, zone.code + ' actionText missing');
  assert.deepStrictEqual(zone.ageGroups, EXPECTED_AGE_GROUPS);
  assert.ok(zone.theme && zone.theme.color && zone.theme.tint, zone.code + ' theme missing');
  assert.ok(zone.todayPractice && zone.todayPractice.title && zone.todayPractice.action, zone.code + ' practice missing');
  assert.strictEqual(zone.sevenDayPlan.length, 7, zone.code + ' plan should have seven days');
  assert.ok(zone.scenarios.length >= 32, zone.code + ' should have enough scenarios');
  zone.scenarios.forEach(function(scenario) {
    assertScenarioComplete(scenario, zone.code);
  });
}

function testMiniprogramConfig() {
  const zones = miniprogramZones.getDevelopmentZones();
  assert.deepStrictEqual(miniprogramZones.DEVELOPMENT_AGE_GROUPS, EXPECTED_AGE_GROUPS);
  assert.deepStrictEqual(zones.map(function(zone) { return [zone.code, zone.title]; }), EXPECTED_ZONES);
  zones.forEach(assertZoneComplete);
  assert.strictEqual(FORBIDDEN_TEXT.test(JSON.stringify(zones)), false);
  assert.strictEqual(miniprogramZones.getDevelopmentZoneByCode('sensory').title, '感统支持');
  assert.strictEqual(miniprogramZones.getDevelopmentZoneByCode('confidence').title, '自信与适应');
  assert.strictEqual(miniprogramZones.getDevelopmentZoneByCode('missing'), null);
}

function testBirthdayAgeMapping() {
  const now = new Date('2026-07-03T00:00:00');
  assert.strictEqual(miniprogramZones.inferDevelopmentAgeGroupFromBirthday('', now), '');
  assert.strictEqual(miniprogramZones.inferDevelopmentAgeGroupFromBirthday('bad-date', now), '');
  assert.strictEqual(miniprogramZones.inferDevelopmentAgeGroupFromBirthday('2023-07-03', now), '3-4岁');
  assert.strictEqual(miniprogramZones.inferDevelopmentAgeGroupFromBirthday('2022-07-03', now), '4-5岁');
  assert.strictEqual(miniprogramZones.inferDevelopmentAgeGroupFromBirthday('2021-07-03', now), '5-6岁');
  assert.strictEqual(miniprogramZones.inferDevelopmentAgeGroupFromBirthday('2020-07-03', now), '');
}

function testSeedSync() {
  const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../backend/examples/development-zones-3-6.json'), 'utf8'));
  const zones = miniprogramZones.getDevelopmentZones();
  assert.deepStrictEqual(seed.ageGroups, EXPECTED_AGE_GROUPS);
  assert.strictEqual(seed.zones.length, zones.length);
  zones.forEach(function(zone, index) {
    const seedZone = seed.zones[index];
    ['code', 'title', 'subtitle', 'actionText'].forEach(function(key) {
      assert.strictEqual(seedZone[key], zone[key], key + ' mismatch for ' + zone.code);
    });
    assert.deepStrictEqual(seedZone.sevenDayPlan, zone.sevenDayPlan);
    assert.deepStrictEqual(seedZone.scenarios, zone.scenarios);
    assert.strictEqual(seedZone.scenarios.length, zone.scenarios.length);
  });
  assert.strictEqual(FORBIDDEN_TEXT.test(JSON.stringify(seed)), false);
}

function testBackendZoneDataRules() {
  assert.deepStrictEqual(backendZones.getDevelopmentAgeGroups(), EXPECTED_AGE_GROUPS);
  assert.strictEqual(backendZones.getDevelopmentZones().length, 8);
  assert.strictEqual(backendZones.isDevelopmentAgeGroup('4-5岁'), true);
  assert.strictEqual(backendZones.isDevelopmentAgeGroup('6-9岁'), false);
  assert.ok(backendZones.getDevelopmentScenarios('language', '4-5岁').length >= 10);
  assert.deepStrictEqual(backendZones.getDevelopmentScenarios('language', '6-9岁'), []);
  assert.strictEqual(backendZones.getDevelopmentZoneByCode('missing'), null);
  assert.strictEqual(backendZones.getDevelopmentZoneDetail('language', '4-5岁').selectedAgeGroup, '4-5岁');
  assert.strictEqual(backendZones.getDevelopmentZoneDetail('language', '6-9岁').selectedAgeGroup, '');
  assert.strictEqual(backendZones.getDevelopmentZoneDetail('missing', '4-5岁'), null);
}

function loadPageModule(relativePath) {
  let pageDefinition = null;
  global.getApp = function() {
    return { getCurrentChild: function() { return null; } };
  };
  global.Page = function(definition) {
    pageDefinition = definition;
  };
  global.wx = {
    navigateTo: function() {},
    setNavigationBarTitle: function() {},
    setStorageSync: function() {},
    showToast: function() {},
    switchTab: function() {}
  };
  const modulePath = path.resolve(__dirname, '..', relativePath);
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  pageDefinition.setData = function(patch) {
    Object.assign(this.data, patch);
  };
  return pageDefinition;
}

function testDetailPageFallbacks() {
  const detailPage = loadPageModule('miniprogram/pages/development/detail/detail.js');
  assert.strictEqual(detailPage.data.agePrompt, '先选孩子年龄，内容会更贴近。');
  detailPage.loadZone('missing');
  assert.strictEqual(detailPage.data.loadError, '这个方向正在补充，先问小牛');
  detailPage.loadZone('language');
  detailPage.applyAgeGroup('', null);
  assert.strictEqual(detailPage.data.selectedAgeGroup, '');
  assert.strictEqual(detailPage.data.ageStatusText, '先选孩子年龄，内容会更贴近。');
  detailPage.applyAgeGroup('4-5岁', null);
  assert.strictEqual(detailPage.data.selectedAgeGroup, '4-5岁');
  assert.ok(detailPage.data.scenarios.length > 0);
  assert.strictEqual(typeof detailPage.askFallback, 'function');
}

function testScenePageFallbacks() {
  const scenePage = loadPageModule('miniprogram/pages/development/scene/scene.js');
  scenePage.loadScene({ zone: 'language', scenario: 'missing' });
  assert.strictEqual(scenePage.data.loadError, '这个方向正在补充，先问小牛');
  scenePage.loadScene({ zone: 'language', scenario: 'unclear_speech' });
  assert.strictEqual(scenePage.data.scenario.code, 'unclear_speech');
  assert.strictEqual(scenePage.data.scenario.ageGuidance.length, 3);
  assert.ok(scenePage.data.scenario.playGame && scenePage.data.scenario.playGame.howToPlay);
  assert.strictEqual(typeof scenePage.askFallback, 'function');
}

function testDevelopmentZoneRouteSource() {
  const serverSource = fs.readFileSync(path.resolve(__dirname, '../backend/src/mysql-production/server.js'), 'utf8');
  assert.ok(serverSource.includes("app.get(`${prefix}/development-zones`, optionalAuthenticateToken, asyncHandler(developmentZonesHandler))"));
  assert.ok(serverSource.includes("app.get(`${prefix}/development-zones/:code`, optionalAuthenticateToken, asyncHandler(developmentZoneDetailHandler))"));
  assert.ok(serverSource.includes("res.status(400).json({ success: false, message: 'age_group参数无效' })"));
  assert.ok(serverSource.includes("res.status(404).json({ success: false, message: '专区不存在' })"));
}

testMiniprogramConfig();
testBirthdayAgeMapping();
testSeedSync();
testBackendZoneDataRules();
testDetailPageFallbacks();
testScenePageFallbacks();
testDevelopmentZoneRouteSource();

console.log('Development zones tests passed.');
