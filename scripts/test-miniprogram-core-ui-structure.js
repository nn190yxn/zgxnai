const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

const home = read('miniprogram/pages/index/index.wxml');
assert.ok(home.includes('class="core-hero"'), 'home should render core hero');
assert.ok(home.includes('class="core-hero" wx:if="{{coreRefactorEnabled}}"'), 'core hero should be gated by core refactor flag');
assert.ok(home.includes('bindtap="onHomePrimaryActionTap"'), 'home should expose primary action');
assert.ok(home.includes('wx:for="{{coreScenes}}"'), 'home should render core scenes');
assert.ok(home.includes('data-scene-key="{{item.key}}"'), 'scene cards should pass scene key');
assert.ok(home.includes('data-age-key="{{item.key}}"'), 'age options should pass age key');
assert.ok(home.includes('data-symptom-key="{{item.key}}"'), 'symptom options should pass symptom key');
assert.ok(home.includes('data-effect-key="{{item.key}}"'), 'effect options should pass effect key');
assert.ok(home.includes('class="core-result-card"'), 'home should render first action result card');
assert.ok(home.includes('bindtap="onCoreAskDetailTap"'), 'result should include chat follow-up action');
assert.ok(home.includes('bindtap="onSaveCoreActionToGrowthRecordTap"'), 'result should include growth record action');
assert.ok(home.includes('class="core-membership"'), 'home should render core membership touchpoint');
assert.ok(home.includes('wx:if="{{coreRefactorEnabled && membershipTouchpointVisible}}"'), 'core membership should be gated by core refactor flag');
assert.ok(home.includes('class="core-tools" wx:if="{{coreRefactorEnabled}}"'), 'core tools should be gated by core refactor flag');
assert.ok(home.includes('wx:if="{{showLegacyHomeSections}}"'), 'home should keep legacy fallback sections');

const chatJs = read('miniprogram/pages/chat/chat.js');
const chatWxml = read('miniprogram/pages/chat/chat.wxml');
assert.ok(chatJs.includes('pendingCoreActionContext'), 'chat should read pending core context');
assert.ok(chatJs.includes('buildPendingCoreActionQuestion'), 'chat should build core context question');
assert.ok(chatJs.includes('年龄：'), 'chat follow-up should include child age context');
assert.ok(chatJs.includes('场景：'), 'chat follow-up should include family scene context');
assert.ok(chatJs.includes('表现：'), 'chat follow-up should include symptom context');
assert.ok(chatJs.includes('卡点判断：'), 'chat follow-up should include bottleneck context');
assert.ok(chatJs.includes('今晚第一步：'), 'chat follow-up should include tonight action context');
assert.ok(chatJs.includes('孩子反应不同怎么办'), 'chat follow-up should ask for response-specific guidance');
assert.ok(chatWxml.includes('继续追问细节'), 'chat empty state should align with core follow-up copy');

const searchJs = read('miniprogram/pages/parenting/search/search.js');
assert.ok(searchJs.includes('sceneKey: sceneKey'), 'scene search should keep core scene key');
assert.ok(searchJs.includes('ageGroup: ageGroup'), 'scene search should keep child age group');
assert.ok(searchJs.includes("url: '/search/solutions'"), 'scene search should request structured solutions');
assert.ok(searchJs.includes("url: '/parenting/search'"), 'scene search should request article knowledge');

const serverJs = read('backend/src/mysql-production/server.js');
assert.ok(serverJs.includes('const references = await collectChatReferences'), 'chat backend should collect knowledge references before answering');
assert.ok(serverJs.includes('只允许基于参考资料回答'), 'chat prompt should constrain answers to references');
assert.ok(serverJs.includes('所有建议必须严格匹配'), 'chat prompt should constrain advice by age group');
assert.ok(serverJs.includes('reference_count'), 'chat analytics should record reference count');

const growth = read('miniprogram/pages/growth-record/index.wxml');
assert.ok(growth.includes('empty-card'), 'growth record should include empty state');

const nutrition = read('miniprogram/pages/nutrition/nutrition.wxml');
const textbook = read('miniprogram/pages/textbook/textbook.wxml');
assert.ok(nutrition.includes('empty-wrap'), 'nutrition should include empty state');
assert.ok(textbook.includes('reading-empty-section'), 'reading practice should include empty state');

const weeklySummaryJs = read('miniprogram/pages/weekly-summary/index.js');
assert.ok(weeklySummaryJs.includes("wx.removeStorageSync('pendingCoreWeeklySummary')"), 'weekly summary should clear consumed core fallback summary');

console.log('Miniprogram core UI structure tests passed.');
