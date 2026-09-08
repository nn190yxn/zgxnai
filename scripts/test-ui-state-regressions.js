const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const path = require('path');

function page(file, app, wx) {
  let definition;
  const absolute = path.resolve(__dirname, '../miniprogram', file);
  vm.runInNewContext(fs.readFileSync(absolute, 'utf8'), {
    getApp: () => app, wx, Page: value => { definition = value; },
    require: require('module').createRequire(absolute), console, setTimeout, clearTimeout
  });
  definition.data = JSON.parse(JSON.stringify(definition.data));
  definition.setData = function(values) { Object.assign(this.data, values); };
  return definition;
}

async function main() {
  let storage = { token: 'test', userInfo: { nickname: 'test' }, refreshToken: 'refresh' };
  const wx = { getStorageSync: key => storage[key], removeStorageSync: key => { delete storage[key]; } };
  global.wx = wx;
  const auth = require('../miniprogram/utils/auth');
  const app = { globalData: {} };
  auth.checkLoginStatus(app);
  assert.strictEqual(app.globalData.isLoggedIn, true);
  storage = {};
  auth.checkLoginStatus(app);
  assert.strictEqual(app.globalData.isLoggedIn, false);
  assert.strictEqual(app.globalData.userInfo, null);
  assert.strictEqual(app.globalData.refreshToken, null);
  app.globalData.refreshToken = 'old';
  auth.logout(app);
  assert.strictEqual(app.globalData.refreshToken, null);

  let calls = 0;
  let mock = false;
  const recipe = page('pages/nutrition/recipe-detail/recipe-detail.js', {
    shouldUseMockFallback: () => mock,
    request: async () => { calls++; return { is_favorited: true }; }
  }, wx);
  recipe.data.recipeId = 1;
  recipe.loadFavoriteState();
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(calls, 1);
  assert.strictEqual(recipe.data.isFavorite, true);
  mock = true;
  recipe.loadFavoriteState();
  assert.strictEqual(calls, 1);

  let finishLogin;
  let toastCount = 0;
  const home = page('pages/index/index.js', {
    requireLoginForAction: () => new Promise(resolve => { finishLogin = resolve; })
  }, { ...wx, showToast: () => { toastCount++; } });
  home.data.operationTouchpoint = { key: 'login_to_personalize' };
  home.onOperationTouchpointTap();
  home.onHide();
  finishLogin(true);
  await new Promise(resolve => setImmediate(resolve));
  assert.strictEqual(toastCount, 0, 'hidden home must ignore delayed login');

  for (const transition of ['logout', 'no-child', 'unload', 'normal']) {
    storage = { token: 'test' };
    let resolveRequest;
    const summary = page('pages/weekly-summary/index.js', {
      request: () => new Promise(resolve => { resolveRequest = resolve; }),
      restoreCurrentChildFromStorage: () => null
    }, wx);
    let applied = 0;
    summary.applySummary = () => { applied++; };
    summary.clearPendingCoreWeeklySummary = () => {};
    summary.data.childId = 1;
    summary.loadSummary();
    if (transition === 'logout') { storage = {}; summary.bootstrap(); }
    if (transition === 'no-child') { summary.data.childId = 0; summary.bootstrap(); }
    if (transition === 'unload') summary.onUnload();
    resolveRequest({ recordDays: 1 });
    await new Promise(resolve => setImmediate(resolve));
    assert.strictEqual(applied, transition === 'normal' ? 1 : 0, transition);
  }
  console.log('UI state regression tests passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
