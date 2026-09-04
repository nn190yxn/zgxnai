const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const appConfig = JSON.parse(read('miniprogram/app.json'));
const pageReviewMatrix = {
  'pages/index/index': 'remote-content',
  'pages/chat/chat': 'interactive',
  'pages/profile/profile': 'authenticated',
  'pages/profile/children/children': 'authenticated-list',
  'pages/profile/child-edit/child-edit': 'authenticated-form',
  'pages/profile/privacy/privacy': 'static',
  'pages/profile/agreement/agreement': 'static',
  'pages/profile/account-deletion/account-deletion': 'authenticated-form',
  'pages/profile/feedback/feedback': 'authenticated-list-form',
  'pages/assessment/assessment': 'remote-content',
  'pages/assessment/do/do': 'interactive',
  'pages/assessment/result/result': 'authenticated-detail',
  'pages/assessment/history/history': 'cached-authenticated-list',
  'pages/training/index/index': 'child-authenticated-list',
  'pages/training/detail/detail': 'child-authenticated-detail',
  'pages/nutrition/nutrition': 'remote-content',
  'pages/nutrition/recipe-list/recipe-list': 'remote-content-list',
  'pages/nutrition/recipe-detail/recipe-detail': 'remote-content-detail',
  'pages/parenting/parenting': 'remote-content',
  'pages/parenting/article-list/article-list': 'remote-content-list',
  'pages/parenting/article-detail/article-detail': 'remote-content-detail',
  'pages/parenting/search/search': 'parallel-remote-search',
  'pages/parenting/milestone/milestone': 'interactive',
  'pages/parenting/milestone-result/milestone-result': 'local-detail',
  'pages/development/index/index': 'remote-content',
  'pages/development/detail/detail': 'remote-content-detail',
  'pages/development/scene/scene': 'remote-content-detail',
  'pages/textbook/textbook': 'remote-content',
  'pages/textbook/knowledge-list/knowledge-list': 'child-authenticated-list',
  'pages/textbook/knowledge-detail/knowledge-detail': 'child-authenticated-detail',
  'pages/growth-record/index': 'child-authenticated-form',
  'pages/growth-record/history/index': 'child-authenticated-list',
  'pages/weekly-summary/index': 'child-authenticated-detail',
  'pages/weekly-summary/history/index': 'child-authenticated-list',
  'pages/share/preview/preview': 'local-detail',
  'pages/membership/index': 'cached-authenticated-detail'
};

assert.deepStrictEqual(
  Object.keys(pageReviewMatrix).sort(),
  appConfig.pages.slice().sort(),
  '每个注册页面都必须在状态验收矩阵中明确分类'
);

appConfig.pages.forEach(function(pagePath) {
  const js = read('miniprogram/' + pagePath + '.js');
  const wxml = read('miniprogram/' + pagePath + '.wxml');
  const handlers = Array.from(wxml.matchAll(/(?:bind|catch)tap="([A-Za-z_$][\w$]*)"/g)).map(function(match) {
    return match[1];
  });
  handlers.forEach(function(handler) {
    const escaped = handler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const methodPattern = new RegExp('(?:^|[,{\\n]\\s*)' + escaped + '\\s*(?::\\s*function\\s*\\(|\\([^)]*\\)\\s*\\{)');
    assert.ok(methodPattern.test(js), pagePath + ' 的模板事件 ' + handler + ' 必须存在于页面脚本中');
  });
});

const stateContracts = [
  {
    page: 'pages/membership/index',
    js: ['membershipLoadState', 'membershipFallbackMessage', 'retryLoadMembership', 'loginAndReload'],
    wxml: ['正在加载成长服务状态', '登录后查看成长服务状态', '成长服务状态暂时没加载出来', '重新加载']
  },
  {
    page: 'pages/weekly-summary/history/index',
    js: ["loadState: 'loading'", "'login_required'", "'profile_required'", "'empty'", "'error'", 'retryLoad'],
    wxml: ['正在加载历史报告', '登录后查看历史报告', '先完善孩子档案', '历史报告暂时没加载出来', '还没有历史报告']
  },
  {
    page: 'pages/textbook/knowledge-list/knowledge-list',
    js: ["'login_required'", "'empty'", "'error'", 'loginAndReload', 'retryLoad'],
    wxml: ['登录后查看练习内容', '练习列表暂时没加载出来', '这里暂时还没有练习内容']
  },
  {
    page: 'pages/textbook/knowledge-detail/knowledge-detail',
    js: ["'login_required'", "loadState: 'empty'", "loadState: 'ready'", 'loginAndReload', 'retryLoad'],
    wxml: ['登录后查看练习内容', '练习内容暂时没加载出来', '练习内容没找到']
  },
  {
    page: 'pages/training/index/index',
    js: ["'login_required'", "'profile_required'", "'empty'", "'error'", 'loginAndReload', 'retryLoad'],
    wxml: ['登录后查看训练计划', '先完善孩子档案', '正在加载训练计划', '训练计划暂时没加载出来', '还没有可用的训练计划', "dataStatus === 'ready' || dataStatus === 'empty'"]
  },
  {
    page: 'pages/training/detail/detail',
    js: ["'login_required'", "'profile_required'", "'empty'", "'error'", 'loginAndReload', 'retryLoad'],
    wxml: ['登录后查看训练内容', '先完善孩子档案', '正在加载训练内容', '训练内容暂时没加载出来', '这项训练暂时没有内容']
  },
  {
    page: 'pages/growth-record/history/index',
    js: ["loadState: 'loading'", "'login_required'", "'profile_required'", "'empty'", "'error'", 'loginAndReload', 'retryLoad'],
    wxml: ['登录后查看成长记录', '先完善孩子档案', '正在加载成长记录', '成长记录暂时没加载出来', '还没有记录']
  },
  {
    page: 'pages/assessment/history/history',
    js: ['loginRequired', 'syncMessage', 'retryLogin', 'retryLoad', 'String(record.childId) === String(filterChild)'],
    wxml: ['登录后查看观察记录', '观察记录暂时没加载出来', '还没有观察记录', '重新同步']
  },
  {
    page: 'pages/assessment/result/result',
    js: ['loadState', 'errorMessage', 'localFallbackMessage', 'needsChildSetup', 'retryLoad'],
    wxml: ['result-state', '重新加载', '去完善档案']
  },
  {
    page: 'pages/parenting/search/search',
    js: ['errorMessage', 'partialMessage', 'retrySearch'],
    wxml: ['重新搜索', '还没有找到直接匹配的内容']
  },
  {
    page: 'pages/profile/children/children',
    js: ['loginRequired', 'loadError', 'retryLogin', 'retryLoad'],
    wxml: ['登录后管理孩子档案', '孩子档案暂时没加载出来', '还没有添加孩子档案', '加载中']
  }
];

stateContracts.forEach(function(contract) {
  const js = read('miniprogram/' + contract.page + '.js');
  const wxml = read('miniprogram/' + contract.page + '.wxml');
  contract.js.forEach(function(token) {
    assert.ok(js.includes(token), contract.page + ' 脚本缺少状态契约：' + token);
  });
  contract.wxml.forEach(function(token) {
    assert.ok(wxml.includes(token), contract.page + ' 模板缺少状态反馈：' + token);
  });
});

console.log('Miniprogram page state contracts passed for ' + appConfig.pages.length + ' registered pages.');
