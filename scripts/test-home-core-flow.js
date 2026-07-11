const assert = require('assert');
const appConfig = require('../miniprogram/utils/app-config');

const storage = {};
const events = [];

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
  navigateTo() {},
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

function resetState() {
  Object.keys(storage).forEach(function(key) {
    delete storage[key];
  });
  events.length = 0;
  app.globalData.runtimeConfig.coreRefactorEnabled = true;
  app.globalData.runtimeConfig.coreRefactorRolloutPercent = 0;
  app.globalData.runtimeConfig.coreRefactorUserWhitelist = [];
  app.globalData.runtimeConfig.sceneSearchEnabled = true;
}

function tap(dataset) {
  return { currentTarget: { dataset: dataset || {} } };
}

function testHomeCoreFlow() {
  resetState();
  const home = createPageInstance();
  home.refreshCoreActionHomeState();
  assert.strictEqual(home.data.coreRefactorEnabled, true);
  assert.strictEqual(home.data.showLegacyHomeSections, false);

  home.onHomePrimaryActionTap();
  assert.strictEqual(home.data.coreRefactorState.stage, 'scene_select');

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
  assert.ok(eventTypes.includes('scene_select'));
  assert.ok(eventTypes.includes('bottleneck_result_view'));
  assert.strictEqual(eventTypes.filter((item) => item === 'tonight_action_save').length, 2);
  assert.ok(eventTypes.includes('action_effect_submit'));
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

function testRuntimeConfigCoreRefactorMapping() {
  const config = appConfig.normalizeRuntimeConfig({
    core_refactor_enabled: true,
    core_refactor_rollout_percent: 35,
    core_refactor_user_whitelist: ['user-a', 'user-b']
  });
  assert.strictEqual(config.coreRefactorEnabled, true);
  assert.strictEqual(config.coreRefactorRolloutPercent, 35);
  assert.deepStrictEqual(config.coreRefactorUserWhitelist, ['user-a', 'user-b']);

  const clamped = appConfig.normalizeRuntimeConfig({
    core_refactor_enabled: false,
    core_refactor_rollout_percent: 150,
    core_refactor_user_whitelist: 'user-c,user-d'
  });
  assert.strictEqual(clamped.coreRefactorEnabled, false);
  assert.strictEqual(clamped.coreRefactorRolloutPercent, 100);
  assert.deepStrictEqual(clamped.coreRefactorUserWhitelist, ['user-c', 'user-d']);

  const camelCase = appConfig.normalizeRuntimeConfig({
    coreRefactorEnabled: true,
    coreRefactorRolloutPercent: 12,
    coreRefactorUserWhitelist: 'user-e,user-f'
  });
  assert.strictEqual(camelCase.coreRefactorEnabled, true);
  assert.strictEqual(camelCase.coreRefactorRolloutPercent, 12);
  assert.deepStrictEqual(camelCase.coreRefactorUserWhitelist, ['user-e', 'user-f']);
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
testHomePrimaryCardPriority();
testFeatureFlagFallback();
testRuntimeConfigCoreRefactorMapping();
testCoreSceneSearchFeatureFlag();
testNextDayRecordRuleAndMembershipTouchpoint();

console.log('Home core flow tests passed.');
