const assert = require('assert');
const coreActionScenes = require('../miniprogram/utils/core-action-scenes');

const scenes = coreActionScenes.getCoreActionScenes();
const ageGroups = coreActionScenes.getCoreActionAgeGroups();

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

console.log('Core action scene tests passed.');
