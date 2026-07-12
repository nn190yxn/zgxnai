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
const adminPortalSource = read('admin-portal/app.js');
const adminPortalHtml = read('admin-portal/index.html');
assert.ok(appSource.includes('scene_key: payload.scene_key'), 'miniprogram event tracker should send top-level scene key');
assert.ok(serverSource.includes('scene_key: req.body.scene_key || null'), 'backend event tracker should persist top-level scene key');
assert.ok(runtimeRouteSource.includes("scene_search_enabled: parseRuntimeBooleanEnv('RUNTIME_SCENE_SEARCH_ENABLED', true)"), 'standalone runtime route should expose scene search flag');
assert.ok(runtimeRouteSource.includes("growth_record_enabled: parseRuntimeBooleanEnv('RUNTIME_GROWTH_RECORD_ENABLED', true)"), 'standalone runtime route should expose growth record flag');
assert.ok(runtimeRouteSource.includes("weekly_summary_enabled: parseRuntimeBooleanEnv('RUNTIME_WEEKLY_SUMMARY_ENABLED', true)"), 'standalone runtime route should expose weekly summary flag');
assert.ok(runtimeRouteSource.includes("age_first_core_enabled: parseRuntimeBooleanEnv('RUNTIME_AGE_FIRST_CORE_ENABLED', false)"), 'standalone runtime route should expose age-first core flag');
assert.ok(serverSource.includes("{ key: 'next_day_record', label: '次日记录入口率', count: nextDayViews, base_count: saves, rate: summary.next_day_record_rate }"), 'next day record funnel item should use next_day_record_view');
assert.ok(serverSource.includes("{ key: 'effect_submit', label: '效果提交率', count: effectSubmits, base_count: nextDayViews || saves, rate: summary.effect_submit_rate }"), 'effect submit funnel item should use action_effect_submit');
assert.ok(serverSource.includes('async function loadCoreSceneContentCoverageSafe()'), 'content ops should isolate core scene coverage failures');
assert.ok(serverSource.includes("core_scene_coverage_status: coreSceneCoverageResult.status"), 'content ops should expose core scene coverage status');
assert.ok(serverSource.includes('age_segment_items: ageSegmentItems'), 'core funnel should expose age segment items');
assert.ok(serverSource.includes('pain_point_items: painPointItems'), 'core funnel should expose pain point items');
assert.ok(serverSource.includes('ability_items: abilityItems'), 'core funnel should expose ability dimension items');
assert.ok(serverSource.includes('age_segment_key: req.body.age_segment_key'), 'backend event tracker should persist age segment key');
assert.ok(serverSource.includes('ability_tags: req.body.ability_tags'), 'backend event tracker should persist ability tags');
assert.ok(serverSource.includes("age_first_core_enabled: parseRuntimeBooleanEnv('RUNTIME_AGE_FIRST_CORE_ENABLED', false)"), 'production runtime handler should expose age-first core flag');
assert.ok(serverSource.includes('age_first_core_enabled: runtimeFlags.age_first_core_enabled'), 'production runtime response should include age-first core flag');
assert.ok(adminPortalHtml.includes('coreActionAgeSegmentFunnel'), 'admin portal should render age segment funnel container');
assert.ok(adminPortalHtml.includes('coreActionPainPointFunnel'), 'admin portal should render pain point funnel container');
assert.ok(adminPortalHtml.includes('coreActionAbilityFunnel'), 'admin portal should render ability funnel container');
assert.ok(adminPortalSource.includes('renderCoreActionDimensionFunnel'), 'admin portal should render core action dimension funnels');
assert.ok(adminPortalSource.includes('age_segment_items'), 'admin portal should consume age segment funnel data');
assert.ok(adminPortalSource.includes('pain_point_items'), 'admin portal should consume pain point funnel data');
assert.ok(adminPortalSource.includes('ability_items'), 'admin portal should consume ability funnel data');
assert.ok(adminPortalSource.includes('未分龄'), 'admin portal should display historical events without age segment as unsegmented');

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
const analyticsAgeSegmentKeys = analytics.CORE_ACTION_AGE_SEGMENTS.map((segment) => segment.key).sort();
const miniprogramAgeSegmentKeys = coreActionScenes.getAgeFirstSegments().map((segment) => segment.key).sort();
const serverSceneKeys = extractSceneKeysFromServer();
const homeSupportSceneKeys = extractHomeSupportSceneKeys();

assert.deepStrictEqual(analyticsSceneKeys, miniprogramSceneKeys, 'backend analytics scene keys should match miniprogram core scene keys');
assert.deepStrictEqual(analyticsAgeSegmentKeys, miniprogramAgeSegmentKeys, 'backend analytics age segments should match miniprogram age-first segments');
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

const ageSegmentFunnel = analytics.buildCoreActionAgeSegmentFunnel([
  { age_segment_key: 'age_8_9', age_segment_label: '8-9岁', event_type: 'age_segment_select', event_count: 3 },
  { age_segment_key: 'age_8_9', age_segment_label: '8-9岁', event_type: 'pain_point_select', event_count: 2 },
  { age_segment_key: 'age_8_9', age_segment_label: '8-9岁', event_type: 'bottleneck_result_view', event_count: 2 },
  { age_segment_key: 'age_8_9', age_segment_label: '8-9岁', event_type: 'tonight_action_save', event_count: 1 },
  { age_segment_key: 'age_8_9', age_segment_label: '8-9岁', event_type: 'action_effect_submit', event_count: 1 },
  { age_segment_key: 'unknown', age_segment_label: 'unknown', event_type: 'age_segment_select', event_count: 99 }
]);
const age89 = ageSegmentFunnel.find((item) => item.age_segment_key === 'age_8_9');
const unknownAge = ageSegmentFunnel.find((item) => item.age_segment_key === 'unknown');
assert.strictEqual(age89.age_segment_label, '8-9岁');
assert.strictEqual(age89.select, 3);
assert.strictEqual(age89.result_view, 2);
assert.strictEqual(age89.result_rate, 66.67);
assert.strictEqual(age89.tonight_action_save, 1);
assert.strictEqual(age89.action_effect_submit, 1);
assert.strictEqual(unknownAge.age_segment_label, '未分龄');
assert.strictEqual(unknownAge.select, 99);

const painPointFunnel = analytics.buildCoreActionPainPointFunnel([
  { pain_point_key: 'reading_slow_forgets', pain_point_title: '读得慢还记不住', event_type: 'pain_point_select', event_count: 2 },
  { pain_point_key: 'reading_slow_forgets', pain_point_title: '读得慢还记不住', event_type: 'bottleneck_result_view', event_count: 1 },
  { pain_point_key: 'reading_slow_forgets', pain_point_title: '读得慢还记不住', event_type: 'tonight_action_save', event_count: 1 }
]);
assert.strictEqual(painPointFunnel[0].pain_point_key, 'reading_slow_forgets');
assert.strictEqual(painPointFunnel[0].select, 2);
assert.strictEqual(painPointFunnel[0].result_view, 1);
assert.strictEqual(painPointFunnel[0].save_rate, 100);

const abilityFunnel = analytics.buildCoreActionAbilityFunnel([
  { ability_tags: '["阅读效率","执行力"]', event_type: 'pain_point_select', event_count: 2 },
  { ability_tags: '阅读效率、学习能力底层支持', event_type: 'bottleneck_result_view', event_count: 1 },
  { ability_tags: ['阅读效率'], event_type: 'tonight_action_save', event_count: 1 }
]);
const readingAbility = abilityFunnel.find((item) => item.ability_tag === '阅读效率');
assert.strictEqual(readingAbility.select, 2);
assert.strictEqual(readingAbility.result_view, 1);
assert.strictEqual(readingAbility.tonight_action_save, 1);

console.log('Admin core action analytics tests passed.');
