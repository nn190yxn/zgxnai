const assert = require('assert');
const fs = require('fs');
const path = require('path');
const stats = require('../backend/src/scripts/build-admin-daily-stats');
const analytics = require('../backend/src/mysql-production/core-action-analytics');
const coreActionScenes = require('../miniprogram/utils/core-action-scenes');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

function extractSceneKeysFromServer() {
  const source = read('backend/src/mysql-production/server.js');
  const blockMatch = source.match(/const CORE_ACTION_SCENES = \[([\s\S]*?)\];/);
  assert.ok(blockMatch, 'server should define CORE_ACTION_SCENES');
  return Array.from(blockMatch[1].matchAll(/sceneKey: '([^']+)'/g)).map((match) => match[1]).sort();
}

function extractHomeSupportSceneKeys() {
  const source = read('miniprogram/pages/index/index.js');
  const blockMatch = source.match(/var itemsByScene = \{([\s\S]*?)\n    \};/);
  assert.ok(blockMatch, 'home should define result support items by scene');
  return Array.from(blockMatch[1].matchAll(/\n\s{6}([a-z0-9_]+): \[/g)).map((match) => match[1]).sort();
}

const featureSql = stats.buildFeatureKeySql('event_data', 'event_type');
assert.ok(featureSql.includes("event_type LIKE 'ai_chat_%' OR event_type = 'article_ai_followup'"), 'AI follow-up should be counted as AI feature');
assert.ok(featureSql.includes("JSON_EXTRACT(event_data, '$.module_key')"), 'module key should be honored');

const serverSource = read('backend/src/mysql-production/server.js');
const appSource = read('miniprogram/app.js');
const runtimeRouteSource = read('backend/src/routes/runtime.js');
assert.ok(appSource.includes('scene_key: payload.scene_key'), 'miniprogram event tracker should send top-level scene key');
assert.ok(serverSource.includes('scene_key: req.body.scene_key || null'), 'backend event tracker should persist top-level scene key');
assert.ok(runtimeRouteSource.includes("scene_search_enabled: parseRuntimeBooleanEnv('RUNTIME_SCENE_SEARCH_ENABLED', true)"), 'standalone runtime route should expose scene search flag');
assert.ok(runtimeRouteSource.includes("growth_record_enabled: parseRuntimeBooleanEnv('RUNTIME_GROWTH_RECORD_ENABLED', true)"), 'standalone runtime route should expose growth record flag');
assert.ok(runtimeRouteSource.includes("weekly_summary_enabled: parseRuntimeBooleanEnv('RUNTIME_WEEKLY_SUMMARY_ENABLED', true)"), 'standalone runtime route should expose weekly summary flag');
assert.ok(serverSource.includes("{ key: 'next_day_record', label: '次日记录入口率', count: nextDayViews, base_count: saves, rate: summary.next_day_record_rate }"), 'next day record funnel item should use next_day_record_view');
assert.ok(serverSource.includes("{ key: 'effect_submit', label: '效果提交率', count: effectSubmits, base_count: nextDayViews || saves, rate: summary.effect_submit_rate }"), 'effect submit funnel item should use action_effect_submit');
assert.ok(serverSource.includes('async function loadCoreSceneContentCoverageSafe()'), 'content ops should isolate core scene coverage failures');
assert.ok(serverSource.includes("core_scene_coverage_status: coreSceneCoverageResult.status"), 'content ops should expose core scene coverage status');

const contentSql = stats.buildContentTypeSql('event_data', 'event_type');
assert.ok(contentSql.includes("event_type LIKE 'article_%'"), 'article events should map to article content');
assert.ok(contentSql.includes("event_type LIKE 'task_%'"), 'task events should map to reading tasks');

const titleSql = stats.buildContentFallbackTitleSql('event_data', 'event_type');
assert.ok(titleSql.includes("event_type LIKE 'knowledge_%'"), 'knowledge fallback title should be available');

const rows = [
  { scene_key: 'homework_restless', event_type: 'scene_select', event_count: 3 },
  { scene_key: 'homework_focus', event_type: 'scene_select', event_count: 2 },
  { scene_key: 'homework_restless', event_type: 'bottleneck_result_view', event_count: 4 },
  { scene_key: 'homework_restless', event_type: 'tonight_action_save', event_count: 2 },
  { scene_key: 'homework_restless', event_type: 'next_day_record_view', event_count: 1 },
  { scene_key: 'homework_restless', event_type: 'action_effect_submit', event_count: 1 },
  { scene_key: 'meal_picky', event_type: 'scene_select', event_count: 2 },
  { scene_key: 'unknown', event_type: 'scene_select', event_count: 99 },
  { scene_key: '', event_type: 'scene_select', event_count: 99 }
];

const funnel = analytics.buildCoreActionSceneFunnel(rows);
const homework = funnel.find((item) => item.scene_key === 'homework_restless');
const meal = funnel.find((item) => item.scene_key === 'meal_dawdling');
const miniprogramSceneKeys = coreActionScenes.getCoreActionScenes().map((scene) => scene.key).sort();
const analyticsSceneKeys = analytics.CORE_ACTION_SCENES.map((scene) => scene.sceneKey).sort();
const serverSceneKeys = extractSceneKeysFromServer();
const homeSupportSceneKeys = extractHomeSupportSceneKeys();

assert.deepStrictEqual(analyticsSceneKeys, miniprogramSceneKeys, 'backend analytics scene keys should match miniprogram core scene keys');
assert.deepStrictEqual(serverSceneKeys, miniprogramSceneKeys, 'backend server scene keys should match miniprogram core scene keys');
assert.deepStrictEqual(homeSupportSceneKeys, miniprogramSceneKeys, 'home result support scene keys should match miniprogram core scene keys');
assert.strictEqual(homework.scene_select, 5, 'duplicate scene events should be summed');
assert.strictEqual(homework.result_view, 4);
assert.strictEqual(homework.result_rate, 80);
assert.strictEqual(homework.tonight_action_save, 2);
assert.strictEqual(homework.next_day_record_view, 1);
assert.strictEqual(homework.action_effect_submit, 1);
assert.strictEqual(meal.scene_select, 2, 'search scene aliases should normalize to core scene keys');
assert.strictEqual(analytics.normalizeCoreActionSceneKey('sleep_resist'), 'bedtime_meltdown');
assert.strictEqual(analytics.normalizeCoreActionSceneKey('homework_focus'), 'homework_restless');

console.log('Admin core action analytics tests passed.');
