const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

const navigation = read('miniprogram/utils/detail-navigation.js');
assert.ok(navigation.includes('pages.length > 1'), 'detail navigation should prefer the existing page stack');
assert.ok(navigation.includes('wx.navigateBack'), 'detail navigation should return to the entry page');
assert.ok(navigation.includes('wx.switchTab'), 'direct detail visits should return to a main tab');
['development', 'growth', 'profile'].forEach((key) => {
  assert.ok(navigation.includes(key + ':'), `detail navigation should define the ${key} fallback`);
});

const originalWx = global.wx;
const originalGetCurrentPages = global.getCurrentPages;
const calls = [];
global.wx = {
  navigateBack(options) { calls.push(['back', options.delta]); },
  switchTab(options) { calls.push(['tab', options.url]); }
};
global.getCurrentPages = () => [{}, {}];
delete require.cache[require.resolve('../miniprogram/utils/detail-navigation.js')];
const detailNavigation = require('../miniprogram/utils/detail-navigation.js');
detailNavigation.returnToMainPath('growth');
assert.deepStrictEqual(calls, [['back', 1]], 'stacked detail pages should return to their entry page');
calls.length = 0;
global.getCurrentPages = () => [{}];
detailNavigation.returnToMainPath('profile');
assert.deepStrictEqual(calls, [['tab', '/pages/profile/profile']], 'direct detail visits should use the configured main tab');
global.wx = originalWx;
global.getCurrentPages = originalGetCurrentPages;

const cases = [
  {
    name: 'article',
    js: read('miniprogram/pages/parenting/article-detail/article-detail.js'),
    wxml: read('miniprogram/pages/parenting/article-detail/article-detail.wxml'),
    fallback: "returnToMainPath('development')",
    primary: 'bindtap="recordArticlePractice">使用这个方法',
    context: "crossPageStorage.save('pendingGrowthRecordNote'"
  },
  {
    name: 'training',
    js: read('miniprogram/pages/training/detail/detail.js'),
    wxml: read('miniprogram/pages/training/detail/detail.wxml'),
    fallback: "returnToMainPath('growth')",
    primary: "'完成今天练习'",
    context: "url = '/training-tasks/' + task.id + '/complete'"
  },
  {
    name: 'nutrition',
    js: read('miniprogram/pages/nutrition/recipe-detail/recipe-detail.js'),
    wxml: read('miniprogram/pages/nutrition/recipe-detail/recipe-detail.wxml'),
    fallback: "returnToMainPath('development')",
    primary: 'bindtap="useRecipeMethod">使用这个食谱',
    context: "crossPageStorage.save('pendingGrowthRecordNote'"
  },
  {
    name: 'membership',
    js: read('miniprogram/pages/membership/index.js'),
    wxml: read('miniprogram/pages/membership/index.wxml'),
    fallback: "returnToMainPath('profile')",
    primary: 'bindtap="handleMembershipPrimaryAction"',
    context: 'buildMembershipPrimaryAction'
  }
];

cases.forEach((item) => {
  assert.ok(item.js.includes("require('../../../utils/detail-navigation.js')") || item.js.includes("require('../../utils/detail-navigation.js')"), `${item.name} should share detail navigation`);
  assert.ok(item.js.includes(item.fallback), `${item.name} should return to its owning main tab`);
  assert.ok(item.wxml.includes(item.primary), `${item.name} should expose one clear primary action`);
  assert.ok(item.wxml.includes('bindtap="returnToMainPath"'), `${item.name} should expose an explicit return action`);
  assert.ok(item.js.includes(item.context), `${item.name} should preserve its existing business action`);
});

const membership = cases[3].js;
['成长服务试用中', '成长服务已开通', '续上成长服务', '领取体验服务'].forEach((copy) => {
  assert.ok(membership.includes(copy), `membership primary action should cover ${copy}`);
});
assert.ok(membership.includes("entrySource === 'membership_required'"), 'membership return should leave gated pages instead of bouncing back into them');
assert.ok(membership.includes("url: '/pages/index/index'"), 'gated membership visits should return to home');

const requestSource = read('miniprogram/utils/request.js');
assert.ok(requestSource.includes('openMembershipRequiredPage'), 'membership intercept should use a shared redirect helper');
assert.ok(requestSource.includes("wx.redirectTo({"), 'membership intercept should replace the gated page');
assert.ok(requestSource.includes("source=membership_required"), 'membership intercept should mark the gated entry source');
assert.ok(requestSource.includes('membershipRedirectInFlight'), 'membership intercept should ignore concurrent 403s');

const originalWxForMembership = global.wx;
const originalGetCurrentPagesForMembership = global.getCurrentPages;
const membershipNavCalls = [];
let membershipRedirectComplete = null;
global.wx = {
  showToast() {},
  redirectTo(options) {
    membershipNavCalls.push(['redirect', options.url]);
    membershipRedirectComplete = options.complete;
  },
  navigateTo(options) {
    membershipNavCalls.push(['navigate', options.url]);
  }
};
global.getCurrentPages = () => [{ route: 'pages/textbook/textbook' }];
delete require.cache[require.resolve('../miniprogram/utils/request.js')];
const requestUtil = require('../miniprogram/utils/request.js');
requestUtil.openMembershipRequiredPage({ message: '会员已到期或尚未开通，请先开通会员' });
requestUtil.openMembershipRequiredPage({ message: '会员已到期或尚未开通，请先开通会员' });
assert.deepStrictEqual(membershipNavCalls, [['redirect', '/pages/membership/index?source=membership_required']], 'concurrent membership 403s should open the membership page once');
membershipNavCalls.length = 0;
if (membershipRedirectComplete) {
  membershipRedirectComplete();
}
global.getCurrentPages = () => [{ route: 'pages/membership/index' }];
requestUtil.openMembershipRequiredPage({ message: '会员已到期或尚未开通，请先开通会员' });
assert.deepStrictEqual(membershipNavCalls, [], 'membership page should not redirect onto itself');
global.wx = originalWxForMembership;
global.getCurrentPages = originalGetCurrentPagesForMembership;

console.log('Detail primary action and navigation contract tests passed.');
