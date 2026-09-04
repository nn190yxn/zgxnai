const assert = require('assert');
const fs = require('fs');
const path = require('path');

const storage = {};
const navigations = [];
const tabSwitches = [];
const requests = [];

const app = {
  globalData: {
    runtimeConfig: {
      miniprogramRemoteContentEnabled: false
    }
  },
  getCurrentChild() {
    return { id: 12, name: '牛牛', birthday: '2022-09-03' };
  },
  buildChildChatContext(child) {
    return { id: child.id, name: child.name, age_group: '4-5岁' };
  },
  request(options) {
    requests.push(options);
    return Promise.resolve({ success: true });
  }
};

global.getApp = function() {
  return app;
};

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
  navigateTo(options) {
    navigations.push(options.url);
  },
  switchTab(options) {
    tabSwitches.push(options.url);
  },
  setNavigationBarTitle() {},
  showToast() {}
};

let pageDefinition = null;
global.Page = function(definition) {
  pageDefinition = definition;
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadPage(relativePath) {
  pageDefinition = null;
  const modulePath = path.resolve(__dirname, '..', relativePath);
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  assert.ok(pageDefinition, relativePath + ' should register a page');
  const instance = Object.assign({}, pageDefinition, { data: clone(pageDefinition.data) });
  instance.setData = function(patch) {
    Object.assign(instance.data, patch || {});
  };
  return instance;
}

function resetRuntime() {
  Object.keys(storage).forEach(function(key) {
    delete storage[key];
  });
  navigations.length = 0;
  tabSwitches.length = 0;
  requests.length = 0;
}

function testHomeEntryContract() {
  const source = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/index/index.js'), 'utf8');
  assert.ok(source.includes('this.goToAllDevelopmentZones();'), 'home core tool should open development overview');
  assert.ok(source.includes("url: '/pages/development/index/index'"), 'home should route to development overview tab');
}

function testOverviewPainPointNavigation() {
  const overview = loadPage('miniprogram/pages/development/index/index.js');
  overview.openPainPoint({ currentTarget: { dataset: { key: 'age_2_3_attention_start_delay' } } });
  assert.strictEqual(navigations.pop(), '/pages/development/detail/detail?painPointKey=age_2_3_attention_start_delay');
}

async function testPainPointDetailAction() {
  const detail = loadPage('miniprogram/pages/development/detail/detail.js');
  await detail.loadPainPoint('age_2_3_attention_start_delay');

  assert.strictEqual(detail.data.painPointKey, 'age_2_3_attention_start_delay');
  assert.strictEqual(detail.data.selectedScenario.title, '开始玩之前磨很久');
  assert.strictEqual(detail.data.activePractice.action, '今晚只让孩子放第一个积木');
  assert.deepStrictEqual(detail.data.selectedScenario.difficultySteps, ['大人先放一个积木。', '把第二个递给孩子。', '孩子放上去就结束这一轮。']);
  assert.ok(detail.data.selectedScenario.possibleReasons.length > 0);
  assert.ok(detail.data.selectedScenario.progressSignals.length > 0);

  const selectedScenario = detail.data.selectedScenario;
  detail.onShow();
  assert.strictEqual(detail.data.selectedScenario, selectedScenario, 'onShow should preserve pain point detail');

  const navigationCount = navigations.length;
  detail.openScenarioDetail({ currentTarget: { dataset: { scenario: detail.data.selectedScenarioCode } } });
  assert.strictEqual(navigations.length, navigationCount, 'pain point should stay on its detail page');

  detail.askXiaoniu();
  assert.strictEqual(navigations.pop(), '/pages/chat/chat');
  const questionEnvelope = storage.pendingChatQuestion;
  assert.strictEqual(questionEnvelope.childId, '12');
  ['孩子：牛牛', '年龄：4-5岁', '类别：专注学习', '场景：开始玩之前磨很久', '痛点：开始玩之前磨很久', '今晚第一步：今晚只让孩子放第一个积木'].forEach(function(text) {
    assert.ok(questionEnvelope.payload.includes(text), 'pain point chat context missing: ' + text);
  });
  const chat = loadPage('miniprogram/pages/chat/chat.js');
  chat.applyPendingQuestion();
  assert.strictEqual(chat.data.inputValue, questionEnvelope.payload, 'chat should consume the complete pain point context');

  detail.recordPractice();
  assert.strictEqual(tabSwitches.pop(), '/pages/growth-record/index');
  assert.strictEqual(detail.buildGrowthRecordSource().sourceType, 'development_pain_point');
  assert.strictEqual(detail.buildGrowthRecordSource().painPointKey, 'age_2_3_attention_start_delay');
}

async function testMissingPainPointFallback() {
  const detail = loadPage('miniprogram/pages/development/detail/detail.js');
  await detail.loadPainPoint('missing');
  assert.strictEqual(detail.data.zone, null);
  assert.strictEqual(detail.data.selectedScenario, null);
  assert.strictEqual(detail.data.loadError, '这个成长痛点暂时没有内容');
}

async function testGrowthRecordCompletion() {
  const growth = loadPage('miniprogram/pages/growth-record/index.js');
  growth.bootstrap = function() {};
  growth.onShow();
  assert.strictEqual(growth.data.sourceContext.sourceType, 'development_pain_point');
  assert.strictEqual(growth.data.sourceContext.painPointKey, 'age_2_3_attention_start_delay');
  assert.strictEqual(growth.data.sourceContext.childId, '12');
  assert.strictEqual(growth.data.sourceSaved, false);

  growth.setData({
    currentChild: app.getCurrentChild(),
    form: Object.assign({}, growth.data.form, { noteText: '孩子愿意放下第一个积木。' })
  });
  await growth.submitRecord();

  assert.strictEqual(requests.length, 2, 'saving a pain point record should write daily status and timeline entry');
  assert.strictEqual(requests[0].url, '/growth-records');
  assert.strictEqual(requests[1].url, '/growth-records/entry');
  assert.strictEqual(requests[1].data.entry_type, 'core_action');
  assert.strictEqual(requests[1].data.source_type, 'core_action');
  assert.strictEqual(requests[1].data.metadata.painPointKey, 'age_2_3_attention_start_delay');
  assert.strictEqual(requests[1].data.idempotency_key, 'pain_point:12:' + growth.data.recordDate + ':age_2_3_attention_start_delay');
  assert.strictEqual(growth.data.sourceSaved, true);

  await growth.submitRecord();
  assert.strictEqual(requests.length, 3, 'updating the daily record should not duplicate the completed action entry');
  assert.strictEqual(requests[2].url, '/growth-records');

  growth.loadRecord = function() {};
  growth.applyBootstrapChild({ id: 13, name: '果果' });
  assert.strictEqual(growth.data.sourceContext, null, 'switching children should clear the previous child action context');
  assert.strictEqual(growth.data.sourceSaved, false);
}

function testPainPointTemplateContract() {
  const template = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/development/detail/detail.wxml'), 'utf8');
  ['先看看是不是这种表现', '可能卡在哪里', '今日行动', '家长可以这样说', '做完观察什么', '行动做完了，记录变化', 'bindtap="askXiaoniu"', 'bindtap="recordPractice"'].forEach(function(text) {
    assert.ok(template.includes(text), 'pain point detail template missing: ' + text);
  });
  const growthTemplate = fs.readFileSync(path.resolve(__dirname, '../miniprogram/pages/growth-record/index.wxml'), 'utf8');
  ['刚完成的今日行动', '今日行动已记录', 'sourceContext.practiceAction'].forEach(function(text) {
    assert.ok(growthTemplate.includes(text), 'growth record template missing: ' + text);
  });
}

async function run() {
  resetRuntime();
  testHomeEntryContract();
  testOverviewPainPointNavigation();
  await testPainPointDetailAction();
  await testGrowthRecordCompletion();
  await testMissingPainPointFallback();
  testPainPointTemplateContract();
  console.log('Development pain point flow tests passed.');
}

run().catch(function(error) {
  console.error(error);
  process.exitCode = 1;
});
