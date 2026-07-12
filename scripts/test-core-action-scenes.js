const assert = require('assert');
const coreActionScenes = require('../miniprogram/utils/core-action-scenes');

const scenes = coreActionScenes.getCoreActionScenes();
const ageGroups = coreActionScenes.getCoreActionAgeGroups();
const expectedAgeFirstKeys = ['age_2_3', 'age_3_4', 'age_4_5', 'age_5_6', 'age_6_8', 'age_8_9', 'age_9_12'];

assert.strictEqual(scenes.length, 6, 'should define six core scenes');
assert.strictEqual(ageGroups.length, 4, 'should define four age groups');

scenes.forEach((scene) => {
  assert.ok(scene.key, 'scene should have key');
  assert.ok(scene.label, `${scene.key} should have label`);
  assert.ok(Array.isArray(scene.ageGroups) && scene.ageGroups.length === 4, `${scene.key} should expose age groups`);
  assert.ok(Array.isArray(scene.symptoms) && scene.symptoms.length >= 5, `${scene.key} should expose symptoms`);
  assert.ok(scene.defaultBottleneck && scene.defaultBottleneck.title, `${scene.key} should have default bottleneck`);
  assert.ok(scene.defaultAction && scene.defaultAction.steps && scene.defaultAction.steps.length > 0, `${scene.key} should have default action steps`);

  ageGroups.forEach((ageGroup) => {
    scene.symptoms.forEach((symptom) => {
      const result = coreActionScenes.buildFirstActionResult({
        sceneKey: scene.key,
        symptomKey: symptom.key,
        ageGroup: ageGroup.key,
        createdAt: 1780000000000
      });
      assert.strictEqual(result.sceneKey, scene.key, 'result should preserve scene');
      assert.strictEqual(result.ageGroup, ageGroup.label, 'result should normalize age label');
      assert.strictEqual(result.symptomKey, symptom.key, 'result should preserve symptom');
      assert.ok(result.bottleneckTitle, 'result should include bottleneck title');
      assert.ok(result.actionTitle, 'result should include action title');
      assert.ok(Array.isArray(result.actionSteps) && result.actionSteps.length >= 1, 'result should include executable steps');
      assert.ok(result.nextActions && Object.keys(result.nextActions).length >= 4, 'result should include next actions');
    });
  });
});

const missingAge = coreActionScenes.buildFirstActionResult({ sceneKey: scenes[0].key, symptomKey: scenes[0].symptoms[0].key });
assert.strictEqual(missingAge.ageGroup, '待确认年龄');
assert.strictEqual(missingAge.fallbackReason, 'missing_age_group');

const missingSymptom = coreActionScenes.buildFirstActionResult({ sceneKey: scenes[0].key, ageGroup: ageGroups[0].key });
assert.strictEqual(missingSymptom.symptomLabel, '先用默认判断');
assert.strictEqual(missingSymptom.fallbackReason, 'missing_symptom');
assert.ok(missingSymptom.actionSteps.length >= 1);

const unknownScene = coreActionScenes.buildFirstActionResult({ sceneKey: 'unknown_scene', ageGroup: ageGroups[1].key, symptomKey: 'unknown_symptom' });
assert.strictEqual(unknownScene.sceneKey, scenes[0].key);
assert.strictEqual(unknownScene.fallbackReason, 'unknown_scene');
assert.ok(unknownScene.bottleneckTitle);

const ageFirstResult = coreActionScenes.buildAgeFirstActionResult({
  ageSegmentKey: 'age_8_9',
  painPointKey: 'reading_slow_forgets',
  childId: 12,
  createdAt: 1780000000000
});
assert.strictEqual(ageFirstResult.childId, 12);
assert.strictEqual(ageFirstResult.ageGroup, '8-9岁');
assert.strictEqual(ageFirstResult.ageSegmentKey, 'age_8_9');
assert.strictEqual(ageFirstResult.ageSegmentLabel, '8-9岁');
assert.strictEqual(ageFirstResult.painPointKey, 'reading_slow_forgets');
assert.strictEqual(ageFirstResult.painPointTitle, '阅读慢又记不住');
assert.strictEqual(ageFirstResult.sceneLabel, ageFirstResult.painPointTitle);
assert.ok(ageFirstResult.sceneKey, 'age-first result should keep scene key compatibility');
assert.ok(Array.isArray(ageFirstResult.focusAreas) && ageFirstResult.focusAreas.length >= 1, 'age-first result should include focus areas');
assert.ok(Array.isArray(ageFirstResult.observableSigns) && ageFirstResult.observableSigns.length >= 1, 'age-first result should include observable signs');
assert.ok(Array.isArray(ageFirstResult.abilityTags) && ageFirstResult.abilityTags.indexOf('阅读效率') !== -1, 'age-first result should include ability tags');
assert.ok(ageFirstResult.bottleneckTitle, 'age-first result should include bottleneck title');
assert.ok(ageFirstResult.bottleneckText, 'age-first result should include bottleneck text');
assert.ok(ageFirstResult.actionTitle, 'age-first result should include action title');
assert.ok(Array.isArray(ageFirstResult.actionSteps) && ageFirstResult.actionSteps.length >= 1, 'age-first result should include action steps');
assert.strictEqual(ageFirstResult.sourceType, 'age_first_scene_recommendation');

const ageFirstFallback = coreActionScenes.buildAgeFirstActionResult({ ageSegmentKey: 'age_8_9' });
assert.strictEqual(ageFirstFallback.fallbackReason, 'missing_pain_point');
assert.strictEqual(ageFirstFallback.ageSegmentKey, 'age_8_9');
assert.ok(ageFirstFallback.painPointKey, 'age-first fallback should choose a usable pain point');

const unknownAgeFirst = coreActionScenes.buildAgeFirstActionResult({ ageSegmentKey: 'unknown_age', painPointKey: 'unknown_pain' });
assert.strictEqual(unknownAgeFirst.fallbackReason, 'unknown_age_segment');
assert.ok(unknownAgeFirst.ageSegmentKey, 'unknown age segment should fall back to a usable segment');
assert.ok(unknownAgeFirst.painPointKey, 'unknown age segment should fall back to a usable pain point');
assert.ok(unknownAgeFirst.actionSteps.length >= 1, 'unknown age segment should still produce action steps');

const ageFirstSegments = coreActionScenes.getAgeFirstSegments();
assert.deepStrictEqual(ageFirstSegments.map((segment) => segment.key), expectedAgeFirstKeys, 'age-first segments should cover the required seven age ranges in order');
const lowAgeSegmentKeys = ['age_2_3', 'age_3_4', 'age_4_5', 'age_5_6'];
const highAgeBlockedWords = ['中考', '体训', '专项强化', '专项体能'];
const highAgeCoverageWords = ['学习能力底层支持', '体测准备', '中考体训准备', '专项体能'];
ageFirstSegments.forEach((segment) => {
  assert.ok(segment.label, `${segment.key} should expose label`);
  assert.ok(segment.title, `${segment.key} should expose title`);
  assert.ok(segment.subtitle, `${segment.key} should expose subtitle`);
  assert.ok(Array.isArray(segment.focusAreas) && segment.focusAreas.length >= 1, `${segment.key} should expose focus areas`);
  assert.ok(segment.parentSummary, `${segment.key} should expose parent summary`);
  assert.ok(Array.isArray(segment.painPoints) && segment.painPoints.length >= 5, `${segment.key} should expose at least five pain points`);
  segment.painPoints.forEach((painPoint) => {
    assert.ok(painPoint.key, `${segment.key} pain point should expose key`);
    assert.ok(painPoint.title, `${segment.key}/${painPoint.key} should expose title`);
    assert.ok(painPoint.description, `${segment.key}/${painPoint.key} should expose description`);
    assert.ok(painPoint.sceneKey, `${segment.key}/${painPoint.key} should expose scene key`);
    assert.ok(Array.isArray(painPoint.observableSigns) && painPoint.observableSigns.length >= 1, `${segment.key}/${painPoint.key} should expose observable signs`);
    assert.ok(Array.isArray(painPoint.abilityTags) && painPoint.abilityTags.length >= 1, `${segment.key}/${painPoint.key} should expose ability tags`);
    assert.ok(painPoint.defaultBottleneck && painPoint.defaultBottleneck.title && painPoint.defaultBottleneck.text, `${segment.key}/${painPoint.key} should expose default bottleneck`);
    assert.ok(painPoint.defaultAction && painPoint.defaultAction.title, `${segment.key}/${painPoint.key} should expose default action title`);
    assert.ok(Array.isArray(painPoint.defaultAction.steps) && painPoint.defaultAction.steps.length >= 1, `${segment.key}/${painPoint.key} should expose default action steps`);
    const result = coreActionScenes.buildAgeFirstActionResult({
      ageSegmentKey: segment.key,
      painPointKey: painPoint.key,
      createdAt: 1780000000000
    });
    assert.strictEqual(result.ageSegmentKey, segment.key, `${segment.key}/${painPoint.key} should preserve age segment key`);
    assert.strictEqual(result.ageSegmentLabel, segment.label, `${segment.key}/${painPoint.key} should preserve age segment label`);
    assert.strictEqual(result.painPointKey, painPoint.key, `${segment.key}/${painPoint.key} should preserve pain point key`);
    assert.strictEqual(result.painPointTitle, painPoint.title, `${segment.key}/${painPoint.key} should preserve pain point title`);
    assert.ok(Array.isArray(result.focusAreas) && result.focusAreas.length >= 1, `${segment.key}/${painPoint.key} should include focus areas`);
    assert.ok(Array.isArray(result.observableSigns) && result.observableSigns.length >= 1, `${segment.key}/${painPoint.key} should include observable signs`);
    assert.ok(Array.isArray(result.abilityTags) && result.abilityTags.length >= 1, `${segment.key}/${painPoint.key} should include ability tags`);
    assert.ok(result.bottleneckTitle, `${segment.key}/${painPoint.key} should include bottleneck title`);
    assert.ok(result.bottleneckText, `${segment.key}/${painPoint.key} should include bottleneck text`);
    assert.ok(result.actionTitle, `${segment.key}/${painPoint.key} should include action title`);
    assert.ok(Array.isArray(result.actionSteps) && result.actionSteps.length >= 1, `${segment.key}/${painPoint.key} should include action steps`);
  });
});

lowAgeSegmentKeys.forEach((segmentKey) => {
  const segment = ageFirstSegments.find((item) => item.key === segmentKey);
  const segmentText = JSON.stringify(segment);
  highAgeBlockedWords.forEach((word) => {
    assert.strictEqual(segmentText.indexOf(word), -1, `${segmentKey} should not include high-age expression ${word}`);
  });
});

['age_8_9', 'age_9_12'].forEach((segmentKey) => {
  const segment = ageFirstSegments.find((item) => item.key === segmentKey);
  const segmentText = JSON.stringify(segment);
  assert.ok(highAgeCoverageWords.some((word) => segmentText.indexOf(word) !== -1), `${segmentKey} should cover learning support or fitness preparation entry`);
});

console.log('Core action scene tests passed.');
