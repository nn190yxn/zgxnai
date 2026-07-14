const assert = require('assert');
const appConfig = require('../miniprogram/utils/app-config');

const storage = {};
const events = [];
const navigations = [];

global.wx = {
  getStorageSync(key) {
    return storage[key];
  },
  setStorageSync(key, value) {
    storage[key] = value;
  },
  removeStorageSync(key) {
    delete storage[key];
  },
  showToast() {},
  navigateTo(options) {
    navigations.push(options && options.url ? options.url : '');
  },
  switchTab() {}
};

const app = {
  globalData: {
    enableStartupSafeMode: false,
    runtimeConfig: {
      aiChatEnabled: true,
      assessmentsEnabled: true,
      educationEnabled: true,
      parentingEnabled: true,
      growthRecordEnabled: true,
      weeklySummaryEnabled: true,
      sceneSearchEnabled: true,
      coreRefactorEnabled: true,
      ageFirstCoreEnabled: true,
      coreRefactorRolloutPercent: 0,
      coreRefactorUserWhitelist: [],
      configLoaded: true
    },
    userInfo: { id: 9 },
    isLoggedIn: true
  },
  getRuntimeConfig() {
    return this.globalData.runtimeConfig;
  },
  isFeatureEnabled(featureName) {
    return appConfig.isFeatureEnabled(this, featureName);
  },
  getCurrentChild() {
    return { id: 12, name: '牛牛', age: 5 };
  },
  calculateAgeYears() {
    return 5;
  },
  trackKbEvent(payload) {
    events.push(payload);
  }
};

global.getApp = function() {
  return app;
};

let page = null;
global.Page = function(definition) {
  page = definition;
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function applyPath(target, path, value) {
  const parts = path.split('.');
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    if (!cursor[part] || typeof cursor[part] !== 'object') {
      cursor[part] = {};
    }
    cursor = cursor[part];
  }
  cursor[parts[parts.length - 1]] = value;
}

function createPageInstance() {
  page = null;
  delete require.cache[require.resolve('../miniprogram/pages/index/index.js')];
  require('../miniprogram/pages/index/index.js');
  assert.ok(page, 'home page should register itself');
  const instance = Object.assign({}, page, { data: clone(page.data) });
  instance.setData = function(patch) {
    Object.keys(patch || {}).forEach(function(key) {
      if (key.indexOf('.') === -1) {
        instance.data[key] = patch[key];
        return;
      }
      applyPath(instance.data, key, patch[key]);
    });
  };
  return instance;
}

function createChatPageInstance() {
  page = null;
  delete require.cache[require.resolve('../miniprogram/pages/chat/chat.js')];
  require('../miniprogram/pages/chat/chat.js');
  assert.ok(page, 'chat page should register itself');
  const instance = Object.assign({}, page, { data: clone(page.data) });
  instance.setData = function(patch) {
    Object.keys(patch || {}).forEach(function(key) {
      if (key.indexOf('.') === -1) {
        instance.data[key] = patch[key];
        return;
      }
      applyPath(instance.data, key, patch[key]);
    });
  };
  return instance;
}

function resetState() {
  Object.keys(storage).forEach(function(key) {
    delete storage[key];
  });
  events.length = 0;
  navigations.length = 0;
  app.globalData.runtimeConfig.coreRefactorEnabled = true;
  app.globalData.runtimeConfig.coreRefactorRolloutPercent = 0;
  app.globalData.runtimeConfig.coreRefactorUserWhitelist = [];
  app.globalData.runtimeConfig.sceneSearchEnabled = true;
  app.globalData.runtimeConfig.ageFirstCoreEnabled = true;
}

function tap(dataset) {
  return { currentTarget: { dataset: dataset || {} } };
}

function assertFullPainCategoryList(categories, messagePrefix) {
  assert.strictEqual(categories.length, 4, messagePrefix + ' should expose four pain categories');
  const total = categories.reduce(function(count, category) {
    assert.ok(category.key, messagePrefix + ' category should expose key');
    assert.ok(category.label, messagePrefix + ' category should expose title');
    assert.ok(category.description, messagePrefix + ' category should expose description');
    assert.ok(Array.isArray(category.painPoints), messagePrefix + ' category should expose pain point list');
    assert.strictEqual(category.painPoints.length, 10, messagePrefix + ' category should expose ten pain points');
    category.painPoints.forEach(function(painPoint) {
      assert.ok(painPoint.key, messagePrefix + ' full pain point should expose key');
      assert.ok(painPoint.title, messagePrefix + ' full pain point should expose title');
      assert.ok(painPoint.description, messagePrefix + ' full pain point should expose description');
    });
    return count + category.painPoints.length;
  }, 0);
  assert.strictEqual(total, 40, messagePrefix + ' should expose forty categorized pain points');
}

function testHomeCoreFlow() {
  resetState();
  const home = createPageInstance();
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.coreRefactorEnabled, true);
  assert.strictEqual(home.data.showLegacyHomeSections, false);

  home.onHomePrimaryActionTap();
  assert.strictEqual(home.data.coreRefactorState.stage, 'age_select');
  assert.ok(home.data.coreRefactorState.selectedAgeSegment, 'home should select a default age segment');
  assert.strictEqual(home.data.coreRefactorState.painPoints.length, 40, 'home should keep full age pain point catalog');
  assert.strictEqual(home.data.coreRefactorState.featuredPainPoints.length, 5, 'home should expose five featured pain points first');
  home.data.coreRefactorState.featuredPainPoints.forEach(function(painPoint) {
    assert.ok(painPoint.title, 'featured pain point should expose title');
    assert.ok(painPoint.description, 'featured pain point should expose description');
    assert.ok(Array.isArray(painPoint.observableSigns) && painPoint.observableSigns.length >= 1, 'featured pain point should expose observable signs');
    assert.ok(Array.isArray(painPoint.abilityTags) && painPoint.abilityTags.length >= 1, 'featured pain point should expose ability tags');
  });
  assertFullPainCategoryList(home.data.coreRefactorState.painCategories, 'default age segment');
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, false, 'home should keep full catalog collapsed first');
  assert.strictEqual(home.data.coreRefactorState.recentPainCategoryKey, '', 'home should start without recent pain category');

  home.onCoreAgeSegmentTap(tap({ segmentKey: 'age_8_9' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'pain_point_select');
  assert.strictEqual(home.data.coreRefactorState.selectedAgeSegment.key, 'age_8_9');
  assert.strictEqual(home.data.coreRefactorState.selectedAgeLabel, '8-9岁');
  assert.ok(home.data.coreRefactorState.focusAreas.indexOf('执行力') !== -1);
  assert.ok(home.data.coreRefactorState.painPoints.some((item) => item.key === 'reading_slow_forgets'));
  assert.strictEqual(home.data.coreRefactorState.painPoints.length, 40);
  assert.strictEqual(home.data.coreRefactorState.featuredPainPoints.length, 5);
  home.data.coreRefactorState.featuredPainPoints.forEach(function(painPoint) {
    assert.ok(painPoint.title, 'age-selected featured pain point should expose title');
    assert.ok(painPoint.description, 'age-selected featured pain point should expose description');
    assert.ok(Array.isArray(painPoint.observableSigns) && painPoint.observableSigns.length >= 1, 'age-selected featured pain point should expose observable signs');
    assert.ok(Array.isArray(painPoint.abilityTags) && painPoint.abilityTags.length >= 1, 'age-selected featured pain point should expose ability tags');
  });
  assertFullPainCategoryList(home.data.coreRefactorState.painCategories, 'selected age segment');
  assert.strictEqual(wx.getStorageSync('lastCoreAgeSegmentKey'), 'age_8_9');

  home.onToggleCorePainPointList();
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, true, 'home should expand full categorized pain list');
  assertFullPainCategoryList(home.data.coreRefactorState.painCategories, 'expanded selected age segment');
  home.onCorePainCategoryTap(tap({ categoryKey: 'motor_fitness' }));
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, true, 'category tap should keep full list expanded');
  assert.strictEqual(home.data.coreRefactorState.recentPainCategoryKey, 'motor_fitness', 'category tap should save recent category');
  home.onToggleCorePainPointList();
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, false, 'home should collapse categorized pain list');
  assert.strictEqual(home.data.coreRefactorState.recentPainCategoryKey, 'motor_fitness', 'collapse should keep recent category for return positioning');

  home.onCoreAgeSegmentTap(tap({ segmentKey: 'age_9_12' }));
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, false, 'home should collapse full list after switching age segment');
  assert.strictEqual(home.data.coreRefactorState.recentPainCategoryKey, '', 'home should reset recent category after switching age segment');
  assertFullPainCategoryList(home.data.coreRefactorState.painCategories, 'switched age segment');

  home.onCoreAgeSegmentTap(tap({ segmentKey: 'age_8_9' }));
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, false, 'home should keep list collapsed after switching back');
  assert.strictEqual(home.data.coreRefactorState.recentPainCategoryKey, '', 'home should keep recent category reset after switching back');

  home.onCorePainPointTap(tap({ painPointKey: 'reading_slow_forgets' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'bottleneck_result');
  assert.strictEqual(home.data.coreRefactorState.selectedPainPoint.key, 'reading_slow_forgets');
  assert.strictEqual(home.data.coreRefactorState.recentPainCategoryKey, 'attention_learning');
  assert.strictEqual(home.data.coreRefactorState.currentBottleneck.ageSegmentKey, 'age_8_9');
  assert.strictEqual(home.data.coreRefactorState.currentBottleneck.painPointKey, 'reading_slow_forgets');
  assert.ok(home.data.coreRefactorState.observableSigns.length >= 1);
  assert.ok(home.data.coreRefactorState.abilityTags.indexOf('阅读效率') !== -1);
  assert.ok(home.data.coreRefactorState.nextAction.steps.length >= 1);
  home.goToParentingSearchWithCoreContext(home.data.coreRefactorState.currentBottleneck);
  assert.ok(navigations[0].indexOf('ageSegmentKey=age_8_9') !== -1, 'parenting search URL should include age segment key');
  assert.ok(navigations[0].indexOf('categoryKey=attention_learning') !== -1, 'parenting search URL should include category key');
  assert.ok(navigations[0].indexOf('categoryLabel=') !== -1, 'parenting search URL should include category label');
  assert.ok(navigations[0].indexOf('painPointKey=reading_slow_forgets') !== -1, 'parenting search URL should include pain point key');
  assert.ok(navigations[0].indexOf('painPointTitle=') !== -1, 'parenting search URL should include pain point title');
  assert.ok(navigations[0].indexOf('abilityTags=') !== -1, 'parenting search URL should include ability tags');

  home.onCoreSceneTap(tap({ sceneKey: 'homework_restless' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'age_select');
  assert.strictEqual(home.data.coreRefactorState.selectedScene.key, 'homework_restless');

  home.onCoreAgeTap(tap({ ageKey: '5-6' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'symptom_select');
  assert.strictEqual(home.data.coreRefactorState.selectedAgeGroup, '5-6');

  home.onCoreSymptomTap(tap({ symptomKey: 'can_do_but_slow' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'bottleneck_result');
  assert.strictEqual(home.data.coreRefactorState.currentBottleneck.sceneKey, 'homework_restless');
  assert.ok(home.data.coreRefactorState.currentBottleneck.actionSteps.length > 0);

  home.onCoreTryTonightTap();
  const recordsAfterSave = wx.getStorageSync('coreActionRecords') || [];
  assert.strictEqual(recordsAfterSave.length, 1);
  assert.strictEqual(recordsAfterSave[0].saved, true);
  assert.strictEqual(home.data.recentCoreAction.id, recordsAfterSave[0].id);

  home.setData({
    'coreRefactorState.currentBottleneck': recordsAfterSave[0],
    'coreRefactorState.stage': 'effect_record'
  });
  home.onCoreEffectTap(tap({ effectKey: 'slow_but_started' }));
  const recordsAfterEffect = wx.getStorageSync('coreActionRecords') || [];
  assert.strictEqual(recordsAfterEffect.length, 1);
  assert.strictEqual(recordsAfterEffect[0].completed, true);
  assert.strictEqual(recordsAfterEffect[0].effectKey, 'slow_but_started');
  assert.strictEqual(home.data.coreRefactorState.stage, 'effect_recorded');
  assert.ok(home.data.coreRefactorState.nextActionSuggestion.actionSteps.length > 0);
  home.onSaveNextCoreActionTap();
  const recordsAfterNextSave = wx.getStorageSync('coreActionRecords') || [];
  assert.strictEqual(recordsAfterNextSave.length, 2);
  assert.strictEqual(recordsAfterNextSave[0].saved, true);
  assert.strictEqual(recordsAfterNextSave[0].sourceType, 'next_action_recommendation');

  const eventTypes = events.map((item) => item.event_type);
  assert.ok(eventTypes.includes('first_action_entry_click'));
  assert.ok(eventTypes.includes('age_segment_select'));
  assert.ok(eventTypes.includes('pain_point_select'));
  assert.ok(eventTypes.includes('scene_select'));
  assert.ok(eventTypes.includes('bottleneck_result_view'));
  assert.strictEqual(eventTypes.filter((item) => item === 'tonight_action_save').length, 2);
  assert.ok(eventTypes.includes('action_effect_submit'));
}

function testHomePainPointCarryingInteraction() {
  resetState();
  const home = createPageInstance();
  home.refreshCoreActionHomeState();
  home.onHomePrimaryActionTap();

  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, false, 'pain point catalog should start collapsed');
  assert.strictEqual(home.data.coreRefactorState.featuredPainPoints.length, 5, 'collapsed catalog should expose five featured pain points');
  assert.strictEqual(home.data.coreRefactorState.painPoints.length, 40, 'home should keep full pain point catalog in state');
  home.data.coreRefactorState.featuredPainPoints.forEach(function(featuredPainPoint) {
    assert.ok(home.data.coreRefactorState.painPoints.some(function(painPoint) {
      return painPoint.key === featuredPainPoint.key;
    }), 'featured pain point should come from the full catalog');
  });

  home.onToggleCorePainPointList();
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, true, 'more action should expand full pain point catalog');
  assertFullPainCategoryList(home.data.coreRefactorState.painCategories, 'expanded carrying interaction');

  home.onCoreAgeSegmentTap(tap({ segmentKey: 'age_9_12' }));
  assert.strictEqual(home.data.coreRefactorState.showAllPainPoints, false, 'switching age segment should collapse full catalog');
  assert.strictEqual(home.data.coreRefactorState.featuredPainPoints.length, 5, 'switched age segment should still expose five featured pain points');
  assert.strictEqual(home.data.coreRefactorState.painPoints.length, 40, 'switched age segment should keep full catalog in state');
  assertFullPainCategoryList(home.data.coreRefactorState.painCategories, 'switched carrying interaction');
}

function testHomePrimaryCardPriority() {
  resetState();
  const home = createPageInstance();
  const baseAction = {
    id: 'action-a',
    saved: true,
    completed: false,
    savedAt: Date.now(),
    createdAt: Date.now(),
    actionTitle: '今晚先做一个小步骤'
  };

  assert.strictEqual(home.buildHomePrimaryCard({}).reason, 'no_context');
  assert.strictEqual(home.buildHomePrimaryCard({ recentAction: baseAction }).reason, 'unfinished_action');
  assert.strictEqual(home.buildHomePrimaryCard({ recentAction: Object.assign({}, baseAction, { savedAt: 1, createdAt: 1 }) }).reason, 'next_day_record');
  assert.strictEqual(home.buildHomePrimaryCard({ recentAction: Object.assign({}, baseAction, { completed: true }) }).reason, 'recent_record');
  assert.strictEqual(home.buildHomePrimaryCard({ recentAction: Object.assign({}, baseAction, { completed: true }), continuousRecordCount: 2 }).reason, 'continuous_record');
  assert.strictEqual(home.buildHomePrimaryCard({ continueTask: { id: 'task-a', title: '继续任务' } }).reason, 'unfinished_action');
  assert.strictEqual(home.buildHomePrimaryCard({ retentionSummary: '最近有成长记录' }).reason, 'recent_record');
}

function testAgeFirstSaveFlow() {
  resetState();
  const home = createPageInstance();
  home.refreshCoreActionHomeState();

  home.onHomePrimaryActionTap();
  assert.strictEqual(home.data.coreRefactorState.stage, 'age_select');

  home.onCoreAgeSegmentTap(tap({ segmentKey: 'age_9_12' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'pain_point_select');

  home.onCorePainPointTap(tap({ painPointKey: 'middle_exam_training_prepare' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'bottleneck_result');

  home.onCoreAskDetailTap();
  const pendingContext = wx.getStorageSync('pendingCoreActionContext');
  assert.strictEqual(pendingContext.ageSegmentKey, 'age_9_12');
  assert.strictEqual(pendingContext.categoryKey, 'motor_fitness');
  assert.strictEqual(pendingContext.categoryLabel, '运动体能');
  assert.strictEqual(pendingContext.painPointKey, 'middle_exam_training_prepare');
  assert.ok(pendingContext.abilityTags.indexOf('中考体训准备') !== -1);
  assert.ok(pendingContext.observableSigns.length >= 1);
  assert.ok(pendingContext.actionSteps.length >= 1);
  const chat = createChatPageInstance();
  const pendingQuestion = chat.buildPendingCoreActionQuestion(pendingContext);
  assert.ok(pendingQuestion.indexOf('年龄段Key：age_9_12') !== -1, 'chat question should include age segment key');
  assert.ok(pendingQuestion.indexOf('类别：运动体能') !== -1, 'chat question should include category label');
  assert.ok(pendingQuestion.indexOf('类别Key：motor_fitness') !== -1, 'chat question should include category key');
  assert.ok(pendingQuestion.indexOf('痛点：') !== -1, 'chat question should include pain point title');
  assert.ok(pendingQuestion.indexOf('可观察表现：') !== -1, 'chat question should include observable signs');
  assert.ok(pendingQuestion.indexOf('背后能力：') !== -1, 'chat question should include ability tags');
  assert.ok(pendingQuestion.indexOf('今晚第一步：') !== -1, 'chat question should include first action');

  home.onCoreTryTonightTap();
  const records = wx.getStorageSync('coreActionRecords') || [];
  assert.strictEqual(records.length, 1);
  assert.strictEqual(records[0].saved, true);
  assert.strictEqual(records[0].ageSegmentKey, 'age_9_12');
  assert.strictEqual(records[0].categoryKey, 'motor_fitness');
  assert.strictEqual(records[0].categoryLabel, '运动体能');
  assert.strictEqual(records[0].painPointKey, 'middle_exam_training_prepare');
  assert.ok(records[0].abilityTags.indexOf('中考体训准备') !== -1);
  assert.ok(records[0].observableSigns.length >= 1);
  assert.ok(records[0].actionSteps.length >= 1);

  home.setData({
    'coreRefactorState.currentBottleneck': records[0],
    'coreRefactorState.stage': 'effect_record'
  });
  home.onCoreEffectTap(tap({ effectKey: 'started_smoothly' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'effect_recorded');
  assert.strictEqual(home.data.coreRefactorState.nextActionSuggestion.ageSegmentKey, 'age_9_12');
  assert.strictEqual(home.data.coreRefactorState.nextActionSuggestion.categoryKey, 'motor_fitness');
  assert.strictEqual(home.data.coreRefactorState.nextActionSuggestion.categoryLabel, '运动体能');
  assert.strictEqual(home.data.coreRefactorState.nextActionSuggestion.painPointKey, 'middle_exam_training_prepare');
  assert.ok(home.data.coreRefactorState.nextActionSuggestion.abilityTags.indexOf('中考体训准备') !== -1);

  home.onSaveNextCoreActionTap();
  const nextRecords = wx.getStorageSync('coreActionRecords') || [];
  assert.strictEqual(nextRecords.length, 2);
  assert.strictEqual(nextRecords[0].sourceType, 'next_action_recommendation');
  assert.strictEqual(nextRecords[0].ageSegmentKey, 'age_9_12');
  assert.strictEqual(nextRecords[0].categoryKey, 'motor_fitness');
  assert.strictEqual(nextRecords[0].categoryLabel, '运动体能');
  assert.strictEqual(nextRecords[0].painPointKey, 'middle_exam_training_prepare');
  assert.ok(nextRecords[0].abilityTags.indexOf('中考体训准备') !== -1);

  const eventTypes = events.map((item) => item.event_type);
  assert.ok(eventTypes.includes('age_segment_select'));
  assert.ok(eventTypes.includes('pain_point_select'));
  assert.ok(eventTypes.includes('bottleneck_result_view'));
  assert.ok(eventTypes.includes('tonight_action_save'));
  const ageFirstPainPointEvent = events.find((item) => item.event_type === 'pain_point_select' && item.event_meta.age_segment_key === 'age_9_12');
  assert.ok(ageFirstPainPointEvent, 'age-first pain point event should include age segment metadata');
  assert.strictEqual(ageFirstPainPointEvent.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstPainPointEvent.category_label, '运动体能');
  assert.strictEqual(ageFirstPainPointEvent.event_meta.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstPainPointEvent.event_meta.category_label, '运动体能');
  const ageFirstBottleneckEvent = events.find((item) => item.event_type === 'bottleneck_result_view' && item.event_meta.age_segment_key === 'age_9_12');
  assert.ok(ageFirstBottleneckEvent, 'age-first bottleneck view event should include age segment metadata');
  assert.strictEqual(ageFirstBottleneckEvent.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstBottleneckEvent.category_label, '运动体能');
  assert.strictEqual(ageFirstBottleneckEvent.event_meta.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstBottleneckEvent.event_meta.category_label, '运动体能');
  assert.strictEqual(ageFirstBottleneckEvent.event_meta.pain_point_key, 'middle_exam_training_prepare');
  assert.ok(ageFirstBottleneckEvent.event_meta.ability_tags.indexOf('中考体训准备') !== -1);
  const ageFirstSaveEvents = events.filter((item) => item.event_type === 'tonight_action_save' && item.event_meta.age_segment_key === 'age_9_12');
  assert.strictEqual(ageFirstSaveEvents.length, 2);
  assert.strictEqual(ageFirstSaveEvents[0].category_key, 'motor_fitness');
  assert.strictEqual(ageFirstSaveEvents[0].category_label, '运动体能');
  assert.strictEqual(ageFirstSaveEvents[0].event_meta.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstSaveEvents[0].event_meta.category_label, '运动体能');
  assert.strictEqual(ageFirstSaveEvents[1].event_meta.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstSaveEvents[1].event_meta.category_label, '运动体能');
  assert.strictEqual(ageFirstSaveEvents[0].event_meta.pain_point_key, 'middle_exam_training_prepare');
  assert.ok(ageFirstSaveEvents[0].event_meta.ability_tags.indexOf('中考体训准备') !== -1);
  const ageFirstEffectEvent = events.find((item) => item.event_type === 'action_effect_submit' && item.event_meta.age_segment_key === 'age_9_12');
  assert.ok(ageFirstEffectEvent, 'age-first effect event should include age segment metadata');
  assert.strictEqual(ageFirstEffectEvent.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstEffectEvent.category_label, '运动体能');
  assert.strictEqual(ageFirstEffectEvent.event_meta.category_key, 'motor_fitness');
  assert.strictEqual(ageFirstEffectEvent.event_meta.category_label, '运动体能');
  assert.strictEqual(ageFirstEffectEvent.event_meta.pain_point_key, 'middle_exam_training_prepare');
}

function testFeatureFlagFallback() {
  resetState();
  app.globalData.runtimeConfig.coreRefactorEnabled = false;
  app.globalData.runtimeConfig.coreRefactorRolloutPercent = 0;
  const home = createPageInstance();
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.coreRefactorEnabled, false);
  assert.strictEqual(home.data.showLegacyHomeSections, true);

  app.globalData.runtimeConfig.coreRefactorUserWhitelist = ['9'];
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.coreRefactorEnabled, true);
  assert.strictEqual(home.data.showLegacyHomeSections, false);
}

function testAgeFirstCoreFlagFallback() {
  resetState();
  app.globalData.runtimeConfig.ageFirstCoreEnabled = false;
  const home = createPageInstance();
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.coreRefactorEnabled, true);
  assert.strictEqual(home.data.ageFirstCoreEnabled, false);
  assert.strictEqual(home.data.showLegacyHomeSections, false);

  home.onHomePrimaryActionTap();
  assert.strictEqual(home.data.coreRefactorState.stage, 'scene_select');
  assert.strictEqual(home.data.coreRefactorState.selectedAgeSegment, null);
  assert.strictEqual(home.data.coreRefactorState.painPoints.length, 0);

  home.onCoreSceneTap(tap({ sceneKey: 'homework_restless' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'age_select');
  assert.strictEqual(home.data.coreRefactorState.selectedScene.key, 'homework_restless');

  home.onCoreAgeTap(tap({ ageKey: '5-6' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'symptom_select');
  assert.strictEqual(home.data.coreRefactorState.selectedAgeGroup, '5-6');

  home.onCoreSymptomTap(tap({ symptomKey: 'can_do_but_slow' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'bottleneck_result');
  assert.strictEqual(home.data.coreRefactorState.currentBottleneck.sceneKey, 'homework_restless');
  assert.ok(home.data.coreRefactorState.currentBottleneck.actionSteps.length > 0);
}

function testAgeFirstConfigFallback() {
  resetState();
  const home = createPageInstance();
  home.setData({ 'coreRefactorState.ageSegments': [] });
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.ageFirstCoreEnabled, true);
  assert.strictEqual(home.data.ageFirstCoreAvailable, false);

  home.onHomePrimaryActionTap();
  assert.strictEqual(home.data.coreRefactorState.stage, 'scene_select');
  assert.strictEqual(home.data.coreRefactorState.selectedAgeSegment, null);

  const emptySegmentHome = createPageInstance();
  emptySegmentHome.setData({
    'coreRefactorState.ageSegments': [{ key: 'age_empty', label: '空配置', painPoints: [] }]
  });
  emptySegmentHome.refreshCoreActionHomeState();
  assert.strictEqual(emptySegmentHome.data.ageFirstCoreAvailable, false);
  emptySegmentHome.onHomePrimaryActionTap();
  assert.strictEqual(emptySegmentHome.data.coreRefactorState.stage, 'scene_select');
}

function testRuntimeConfigCoreRefactorMapping() {
  const config = appConfig.normalizeRuntimeConfig({
    core_refactor_enabled: true,
    age_first_core_enabled: true,
    core_refactor_rollout_percent: 35,
    core_refactor_user_whitelist: ['user-a', 'user-b']
  });
  assert.strictEqual(config.coreRefactorEnabled, true);
  assert.strictEqual(config.ageFirstCoreEnabled, true);
  assert.strictEqual(config.coreRefactorRolloutPercent, 35);
  assert.deepStrictEqual(config.coreRefactorUserWhitelist, ['user-a', 'user-b']);

  const clamped = appConfig.normalizeRuntimeConfig({
    core_refactor_enabled: false,
    age_first_core_enabled: false,
    core_refactor_rollout_percent: 150,
    core_refactor_user_whitelist: 'user-c,user-d'
  });
  assert.strictEqual(clamped.coreRefactorEnabled, false);
  assert.strictEqual(clamped.ageFirstCoreEnabled, false);
  assert.strictEqual(clamped.coreRefactorRolloutPercent, 100);
  assert.deepStrictEqual(clamped.coreRefactorUserWhitelist, ['user-c', 'user-d']);

  const camelCase = appConfig.normalizeRuntimeConfig({
    coreRefactorEnabled: true,
    ageFirstCoreEnabled: true,
    coreRefactorRolloutPercent: 12,
    coreRefactorUserWhitelist: 'user-e,user-f'
  });
  assert.strictEqual(camelCase.coreRefactorEnabled, true);
  assert.strictEqual(camelCase.ageFirstCoreEnabled, true);
  assert.strictEqual(camelCase.coreRefactorRolloutPercent, 12);
  assert.deepStrictEqual(camelCase.coreRefactorUserWhitelist, ['user-e', 'user-f']);
  assert.strictEqual(appConfig.isFeatureEnabled({ globalData: { runtimeConfig: camelCase } }, 'ageFirstCore'), true);
}

function testCoreSceneSearchFeatureFlag() {
  resetState();
  const home = createPageInstance();
  const navigations = [];
  let toastTitle = '';
  wx.navigateTo = function(options) {
    navigations.push(options.url);
  };
  wx.showToast = function(options) {
    toastTitle = options.title;
  };

  app.globalData.runtimeConfig.sceneSearchEnabled = false;
  home.goToParentingSearchWithCoreContext({
    sceneKey: 'homework_restless',
    ageGroup: '5-6岁',
    bottleneckTitle: '更像是启动困难',
    sceneLabel: '写作业坐不住'
  });
  assert.strictEqual(navigations.length, 0);
  assert.strictEqual(toastTitle, '场景搜索还在准备中');

  app.globalData.runtimeConfig.sceneSearchEnabled = true;
  home.goToParentingSearchWithCoreContext({
    sceneKey: 'homework_restless',
    ageGroup: '5-6岁',
    bottleneckTitle: '更像是启动困难',
    sceneLabel: '写作业坐不住'
  });
  assert.strictEqual(navigations.length, 1);
  assert.ok(navigations[0].includes('sceneKey=homework_restless'));
}

function testNextDayRecordRuleAndMembershipTouchpoint() {
  resetState();
  const home = createPageInstance();
  const record = {
    id: 'saved-yesterday',
    sceneKey: 'homework_restless',
    sceneLabel: '写作业坐不住',
    ageGroup: '5-6岁',
    symptomKey: 'can_do_but_slow',
    symptomLabel: '会做但拖很久',
    bottleneckTitle: '更像是启动困难',
    bottleneckText: '先把目标缩小到开始。',
    actionTitle: '今晚先做 3 分钟开头陪跑',
    actionSteps: ['读第一题。'],
    saved: true,
    completed: false,
    savedAt: 1,
    createdAt: 1
  };

  storage.coreActionRecords = [record];
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.homePrimaryCard.reason, 'next_day_record');
  assert.strictEqual(home.data.homePrimaryCard.title, '孩子这个问题，昨晚试得怎么样？');
  assert.ok(home.data.homePrimaryCard.desc.indexOf('写作业坐不住') !== -1);
  assert.ok(home.data.homePrimaryCard.desc.indexOf('小牛育儿') !== -1);
  assert.strictEqual(home.data.homePrimaryCard.cta, '记录孩子反应');
  home.onHomePrimaryActionTap();
  assert.strictEqual(home.data.coreRefactorState.stage, 'effect_record');

  home.onCoreEffectTap(tap({ effectKey: 'started_smoothly' }));
  assert.strictEqual(home.data.coreRefactorState.stage, 'effect_recorded');
  assert.ok(home.data.coreRefactorState.nextActionSuggestion.actionSteps.length > 0);
  assert.strictEqual(home.data.membershipTouchpointVisible, true);
  assert.strictEqual(home.data.membershipTouchpointTitle, '周末看变化');

  home.applyCoreMembershipTouchpoint('tonight_action_save');
  assert.strictEqual(home.data.membershipTouchpointTitle, '每天一个更适合的小步骤');

  home.setData({ membershipTouchpointEligible: false, membershipTouchpointVisible: false });
  home.applyCoreMembershipTouchpoint('continuous_record');
  assert.strictEqual(home.data.membershipTouchpointVisible, false);
}

testHomeCoreFlow();
testHomePainPointCarryingInteraction();
testHomePrimaryCardPriority();
testAgeFirstSaveFlow();
testFeatureFlagFallback();
testAgeFirstCoreFlagFallback();
testAgeFirstConfigFallback();
testRuntimeConfigCoreRefactorMapping();
testCoreSceneSearchFeatureFlag();
testNextDayRecordRuleAndMembershipTouchpoint();

console.log('Home core flow tests passed.');
