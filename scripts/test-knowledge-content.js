const assert = require('assert');

const dimensions = require('../backend/src/shared/business-dimensions');
const knowledgeContent = require('../backend/src/mysql-production/knowledge-content');
const knowledgeImporter = require('../backend/src/scripts/import-knowledge-base');
const sample = require('../backend/examples/knowledgebase-sample.json');

function testSampleValidation() {
  const validation = knowledgeImporter.validateKnowledgeItems(sample);
  assert.strictEqual(validation.summary.total, sample.length);
  assert.strictEqual(validation.summary.valid, sample.length);
  assert.strictEqual(validation.summary.failed, 0);
  assert.ok(sample.some((item) => item.type === 'assessment'));

  const invalid = knowledgeContent.validateKnowledgeItem({
    type: 'task',
    task_code: 'invalid_task',
    title: '缺字段任务',
    age_segment_codes: ['unknown_age'],
    ability_codes: ['unknown_ability'],
    scene_codes: ['unknown_scene'],
    content_form: 'task'
  });
  assert.strictEqual(invalid.valid, false);
  assert.ok(invalid.errors.some((message) => message.includes('age_segment_codes')));
  assert.ok(invalid.errors.some((message) => message.includes('training_objective')));
}

function testNormalizationAndQueryBuilder() {
  assert.deepStrictEqual(knowledgeContent.normalizeAgeCodes(['4-5岁', 'age_5_6']), ['age_4_5', 'age_5_6']);
  assert.deepStrictEqual(knowledgeContent.normalizeAbilityCodes(['专注力', 'sensory_motor']), ['attention', 'sensory_motor']);
  assert.deepStrictEqual(knowledgeContent.normalizeSceneCodes(['学习与专注', 'daily_life']), ['learning_focus', 'daily_life']);

  const query = knowledgeContent.buildKnowledgeQuery({
    ageSegmentCodes: ['age_4_5'],
    abilityCodes: ['attention'],
    sceneCodes: ['learning_focus'],
    contentType: 'task',
    contentForm: 'task',
    reviewStatus: 'approved',
    keywords: ['专注'],
    limit: 10
  });
  assert.ok(query.sql.includes('is_published = 1'));
  assert.ok(query.sql.includes('review_status = ?'));
  assert.ok(query.sql.includes('JSON_CONTAINS(age_segment_codes'));
  assert.ok(query.sql.includes('JSON_CONTAINS(ability_codes'));
  assert.ok(query.sql.includes('JSON_CONTAINS(scene_codes'));
  assert.ok(query.params.includes('approved'));
  assert.ok(query.params.includes('attention'));
}

function createFormalRow(overrides) {
  return Object.assign({
    id: 1,
    content_type: 'task',
    content_id: 'focus_36_red_light_freeze',
    title: '红灯停一停',
    summary: '练习动作控制',
    content: '听口令开始和暂停',
    age_segment_codes: JSON.stringify(['age_4_5']),
    ability_codes: JSON.stringify(['attention']),
    scene_codes: JSON.stringify(['learning_focus']),
    content_form: 'task',
    source_name: '小牛育儿内容组',
    source_url: '',
    evidence_level: 'B',
    content_version: '2026.08.1',
    review_status: 'approved',
    is_published: 1,
    training_objective: '练习动作控制',
    duration_minutes: 5,
    steps_json: JSON.stringify(['开始', '暂停']),
    parent_prompt: '听口令',
    observe_signals: JSON.stringify(['能停住']),
    safety_notice: '清理活动区域'
  }, overrides || {});
}

async function testFormalQueryLegality() {
  const fakePool = {
    execute: async () => [[
      createFormalRow(),
      createFormalRow({ id: 2, content_id: 'draft', review_status: 'draft' }),
      createFormalRow({ id: 3, content_id: 'bad_age', age_segment_codes: JSON.stringify(['bad_age']) })
    ]]
  };
  const items = await knowledgeContent.queryFormalKnowledge(fakePool, { contentType: 'task' });
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].retrievalSource, 'formal');
  assert.strictEqual(knowledgeContent.isFormalKnowledgeContent(items[0]), true);
}

async function testFallbackPaths() {
  const gaps = [];
  const emptyResult = await knowledgeContent.queryKnowledgeWithFallback({ execute: async () => [[]] }, {
    contentType: 'task',
    ageSegmentCodes: ['age_4_5'],
    abilityCodes: ['attention']
  }, (reason) => gaps.push(reason));
  assert.strictEqual(emptyResult.source, 'local_fallback');
  assert.strictEqual(emptyResult.fallback, true);
  assert.ok(emptyResult.items.length > 0);
  assert.ok(emptyResult.items.every((item) => item.isFallback));
  assert.deepStrictEqual(gaps, ['formal_content_missing']);

  const failedResult = await knowledgeContent.queryKnowledgeWithFallback({
    execute: async () => { throw Object.assign(new Error('database unavailable'), { code: 'ECONNREFUSED' }); }
  }, { contentType: 'assessment', ageSegmentCodes: ['age_4_5'] }, (reason) => gaps.push(reason));
  assert.strictEqual(failedResult.gapReason, 'formal_content_query_failed');
  assert.ok(failedResult.items.some((item) => item.contentType === 'assessment'));
}

function createImportPool() {
  const stored = new Map();
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    rollback: async () => {},
    release: () => {},
    execute: async (sql, params) => {
      if (sql.includes('SELECT id, content_hash FROM knowledge_contents')) {
        const key = `${params[0]}:${params[1]}`;
        return [stored.has(key) ? [{ id: 1, content_hash: stored.get(key) }] : []];
      }
      if (sql.includes('INSERT INTO knowledge_contents')) {
        stored.set(`${params[0]}:${params[1]}`, params[21]);
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('SELECT id FROM reading_tasks')) return [[]];
      if (sql.includes('INSERT INTO reading_tasks')) return [{ affectedRows: 1 }];
      return [[]];
    }
  };
  return { getConnection: async () => connection };
}

async function testIdempotentImportResults() {
  const task = sample.find((item) => item.task_code === 'focus_36_red_light_freeze');
  const pool = createImportPool();
  const first = await knowledgeImporter.importKnowledgeItems(pool, [task], { dryRun: false });
  assert.strictEqual(first.inserted, 1);
  assert.strictEqual(first.failed, 0);
  assert.strictEqual(first.results[0].status, 'inserted');

  const second = await knowledgeImporter.importKnowledgeItems(pool, [task], { dryRun: false });
  assert.strictEqual(second.skipped, 1);
  assert.strictEqual(second.results[0].status, 'skipped');

  const failed = await knowledgeImporter.importKnowledgeItems(pool, [{ type: 'task' }], { dryRun: false });
  assert.strictEqual(failed.failed, 1);
  assert.strictEqual(failed.results[0].status, 'failed');
}

function testFormalContentProperty() {
  const ages = dimensions.getAgeSegments();
  const abilities = dimensions.getAbilities();
  const scenes = dimensions.getSceneCategories();
  for (let index = 0; index < 200; index += 1) {
    const row = createFormalRow({
      id: index + 1,
      content_id: `property_${index}`,
      age_segment_codes: JSON.stringify([ages[index % ages.length].code]),
      ability_codes: JSON.stringify([abilities[index % abilities.length].code]),
      scene_codes: JSON.stringify([scenes[index % scenes.length].code])
    });
    const item = knowledgeContent.normalizeKnowledgeRow(row, false);
    assert.strictEqual(knowledgeContent.isFormalKnowledgeContent(item), true);
  }
}

async function run() {
  testSampleValidation();
  testNormalizationAndQueryBuilder();
  await testFormalQueryLegality();
  await testFallbackPaths();
  await testIdempotentImportResults();
  testFormalContentProperty();
  console.log('Knowledge content import, query, recall, fallback and property tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
