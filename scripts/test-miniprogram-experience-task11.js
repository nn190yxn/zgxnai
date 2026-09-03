const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(file) {
  return fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
}

const app = JSON.parse(read('miniprogram/app.json'));
const tabs = app.tabBar.list;
assert.deepStrictEqual(tabs.map((item) => item.text), ['首页', '功能', '成长', '我的']);
assert.deepStrictEqual(tabs.map((item) => item.pagePath), [
  'pages/index/index', 'pages/development/index/index', 'pages/growth-record/index', 'pages/profile/profile'
]);

const tabPaths = tabs.map((item) => '/' + item.pagePath);
[
  'miniprogram/pages/index/index.js',
  'miniprogram/pages/parenting/article-detail/article-detail.js',
  'miniprogram/pages/development/detail/detail.js',
  'miniprogram/pages/profile/profile.js',
  'miniprogram/pages/weekly-summary/index.js',
  'miniprogram/pages/chat/chat.js'
].forEach((file) => {
  const source = read(file);
  tabPaths.forEach((tabPath) => {
    const escapedPath = tabPath.replace(/\//g, '\\/');
    assert.ok(!new RegExp(`wx\\.navigateTo\\(\\{\\s*url:\\s*['\"]${escapedPath}['\"]`).test(source), `${file} should use switchTab for ${tabPath}`);
  });
});

const painPoints = require('../miniprogram/utils/pain-points.js');
const local = painPoints.getLocalPainPoints();
assert.ok(local.length > 0, 'local pain point snapshot should be available');
assert.ok(local.every((item) => item.key && item.title), 'pain points should have stable keys and titles');
assert.deepStrictEqual(painPoints.normalizeList({ list: [{ pain_point_key: 'demo', short_title: '叫了不动' }] })[0].key, 'demo');

const feature = read('miniprogram/pages/development/index/index.wxml');
assert.ok(feature.includes('/pages/development/detail/detail?painPointKey') || read('miniprogram/pages/development/index/index.js').includes('painPointKey='));
assert.ok(feature.includes('selectPainPointCategory') && feature.includes('openPainPoint'));
assert.ok(feature.includes('familyScenes') && feature.includes('openFamilyScene'), 'feature tab should expose family scene navigation');
['写作业', '吃饭', '睡前', '出门', '亲子共读'].forEach((scene) => assert.ok(read('miniprogram/pages/development/index/index.js').includes(scene), `feature tab should include ${scene}`));
assert.ok(read('miniprogram/pages/development/detail/detail.wxml').includes('media-gallery'));
assert.ok(read('miniprogram/components/media-gallery/media-gallery.js').includes('wx.previewImage'));
assert.ok(read('miniprogram/pages/profile/feedback/feedback.js').includes("url: '/feedback/history'"));
assert.ok(read('miniprogram/pages/profile/feedback/feedback.js').includes('child_id'));
assert.ok(read('miniprogram/pages/parenting/article-detail/article-detail.js').includes('readPublishedOrLegacy'));
assert.ok(read('miniprogram/pages/training/detail/detail.js').includes("'training_task'"));
assert.ok(read('miniprogram/pages/nutrition/recipe-detail/recipe-detail.js').includes("'nutrition_recipe'"));

const growth = read('miniprogram/pages/growth-record/index.wxml');
['行动进度', '观察记录', '周总结', '阶段变化'].forEach((section) => assert.ok(growth.includes(section), `growth tab should include ${section}`));

console.log('Miniprogram experience task 11 contract tests passed.');
