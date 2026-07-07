const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function getRules(source, selector) {
  const rules = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match = pattern.exec(source);
  while (match) {
    const selectors = match[1].split(',').map(function(item) { return item.trim(); });
    if (selectors.indexOf(selector) >= 0) {
      rules.push(match[2]);
    }
    match = pattern.exec(source);
  }
  assert.ok(rules.length > 0, selector + ' rule missing');
  return rules;
}

function assertRuleHas(source, selector, property, expected) {
  const pattern = new RegExp(property + '\\s*:\\s*' + expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*;');
  assert.ok(getRules(source, selector).some(function(rule) { return pattern.test(rule); }), selector + ' should include ' + property + ': ' + expected);
}

function assertRuleHasNumberAtLeast(source, selector, property, minValue) {
  const pattern = new RegExp(property + '\\s*:\\s*([0-9.]+)');
  const match = getRules(source, selector).map(function(rule) {
    return rule.match(pattern);
  }).find(function(item) { return !!item; });
  assert.ok(match, selector + ' should include ' + property);
  assert.ok(Number(match[1]) >= minValue, selector + ' ' + property + ' should be at least ' + minValue);
}

function assertRuleHasNumberAtMost(source, selector, property, maxValue) {
  const pattern = new RegExp(property + '\\s*:\\s*([0-9.]+)');
  const match = getRules(source, selector).map(function(rule) {
    return rule.match(pattern);
  }).find(function(item) { return !!item; });
  assert.ok(match, selector + ' should include ' + property);
  assert.ok(Number(match[1]) <= maxValue, selector + ' ' + property + ' should be at most ' + maxValue);
}

function testIndexZoneLayout() {
  const wxss = read('miniprogram/pages/index/index.wxss');
  const wxml = read('miniprogram/pages/index/index.wxml');
  const js = read('miniprogram/pages/index/index.js');

  assert.ok(wxml.includes('3-6 岁发展专区'), 'index should show development zone entry title');
  assert.ok(wxml.includes('每天一个小动作'), 'index should show action-oriented zone subtitle');
  assert.strictEqual(wxml.includes('featuredDevelopmentZones'), false, 'index should use one compact development zone entry');
  assert.ok(wxml.includes('development-zone-entry'), 'index should show one compact development zone card');
  assert.ok(wxml.includes('goToAllDevelopmentZones'), 'index should keep a compact entry to development zones');
  assert.ok(js.includes("url: '/pages/development/index/index'"), 'index should open the development zone overview first');
  assert.strictEqual(js.includes("goToAllDevelopmentZones() {\n    wx.navigateTo({\n      url: '/pages/development/detail/detail?zone="), false, 'index should not default to language detail page');
  assert.strictEqual(wxss.includes('word-break: break-all'), false, 'development zone cards should avoid hard character breaks');

  ['.development-zone-entry-title', '.development-zone-entry-desc', '.development-zone-entry-action'].forEach(function(selector) {
    assertRuleHas(wxss, selector, 'letter-spacing', '0');
    assertRuleHas(wxss, selector, 'overflow-wrap', 'break-word');
    assertRuleHasNumberAtLeast(wxss, selector, 'line-height', 1.45);
  });
  assertRuleHasNumberAtLeast(wxss, '.development-zone-tag', 'line-height', 1.45);
}

function testOverviewPageLayout() {
  const appJson = read('miniprogram/app.json');
  const js = read('miniprogram/pages/development/index/index.js');
  const wxss = read('miniprogram/pages/development/index/index.wxss');
  const wxml = read('miniprogram/pages/development/index/index.wxml');

  assert.ok(appJson.includes('pages/development/index/index'), 'app should register development overview page');
  assert.ok(wxml.includes('先选发展方向，再看具体场景'), 'overview page should explain the second-level step');
  assert.ok(wxml.includes('wx:for="{{zones}}"'), 'overview page should render eight zone cards from data');
  assert.ok(wxml.includes('openZone'), 'overview page should open zone detail from each card');
  assert.ok(js.includes('developmentZones.getDevelopmentZones()'), 'overview page should load the eight zone modules');
  assert.ok(js.includes('/pages/development/detail/detail?zone='), 'overview page should navigate to the detail page as the next level');
  assert.strictEqual(wxss.includes('word-break: break-all'), false, 'overview cards should avoid hard character breaks');

  ['.title', '.subtitle', '.zone-title', '.zone-subtitle', '.zone-meta', '.zone-action', '.guide-title', '.guide-desc'].forEach(function(selector) {
    assertRuleHasNumberAtLeast(wxss, selector, 'line-height', 1.45);
  });
}

function testDetailPageLayout() {
  const wxss = read('miniprogram/pages/development/detail/detail.wxss');
  const wxml = read('miniprogram/pages/development/detail/detail.wxml');

  ['先选年龄段', '你家孩子像哪种情况', '今日练习', '7 天慢慢练', '需要继续判断'].forEach(function(text) {
    assert.ok(wxml.includes(text), 'detail page should keep section copy: ' + text);
  });
  assert.ok(wxml.includes('scenarioGroups'), 'detail page should group scenarios after age selection');
  assert.ok(wxss.includes('overflow-wrap: break-word'), 'detail page should support long text wrapping');
  assert.ok(wxss.includes('letter-spacing: 0'), 'detail page should set stable letter spacing');
  ['.title', '.section-title', '.scenario-group-title', '.scenario-title', '.practice-title', '.practice-action', '.practice-note-text', '.plan-name', '.placeholder-desc'].forEach(function(selector) {
    assertRuleHasNumberAtLeast(wxss, selector, 'line-height', 1.45);
  });
  ['.empty-action', '.detail-link', '.related-btn'].forEach(function(selector) {
    assertRuleHasNumberAtLeast(wxss, selector, 'line-height', 1.45);
  });
}

function testScenePageLayout() {
  const wxss = read('miniprogram/pages/development/scene/scene.wxss');
  const wxml = read('miniprogram/pages/development/scene/scene.wxml');

  ['先判断', '今天做什么', '可以这样说', '看什么变化', '亲子小游戏', '难度阶梯', '做完以后'].forEach(function(text) {
    assert.ok(wxml.includes(text), 'scene page should keep section copy: ' + text);
  });
  assert.ok(wxss.includes('overflow-wrap: break-word'), 'scene page should support long text wrapping');
  assert.ok(wxss.includes('letter-spacing: 0'), 'scene page should set stable letter spacing');
  ['.title', '.card-title', '.card-desc', '.script-text', '.game-title', '.depth-text', '.depth-line', '.placeholder-desc'].forEach(function(selector) {
    assertRuleHasNumberAtLeast(wxss, selector, 'line-height', 1.4);
  });
  ['.action-btn', '.placeholder-action', '.duration-badge'].forEach(function(selector) {
    assertRuleHasNumberAtLeast(wxss, selector, 'line-height', 1.45);
  });
}

testIndexZoneLayout();
testOverviewPageLayout();
testDetailPageLayout();
testScenePageLayout();

console.log('Development zones layout audit passed.');
