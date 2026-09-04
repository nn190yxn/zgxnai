const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const miniprogramRoot = path.join(root, 'miniprogram');
const sourceExtensions = new Set(['.js', '.json', '.wxml', '.wxss']);

function collectFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(file) : [file];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function ruleBody(source, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`${escaped}\\s*\\{([^}]+)\\}`));
  assert.ok(match, `缺少视觉规则 ${selector}`);
  return match[1];
}

const appStyle = read('miniprogram/app.wxss');
[
  '#FAF8F5', '#FFFFFF', '#ECEFEB', '#6AAE98', '#397A68', '#E6F7ED', '#F28C72',
  '#2F3432', '#626A66', '#929995', '#F5E8BC', '#E7DDF2', '#DDEBF3', '#F3DFE3', '#DDEDE5'
].forEach((color) => assert.ok(appStyle.includes(color), `全局视觉令牌缺少 ${color}`));
assert.ok(appStyle.includes("'Microsoft YaHei'"));
assert.ok(appStyle.includes("'Noto Sans CJK SC'"));

const appConfig = JSON.parse(read('miniprogram/app.json'));
assert.strictEqual(appConfig.window.backgroundColor, '#FAF8F5');
assert.strictEqual(appConfig.window.navigationBarBackgroundColor, '#FAF8F5');
assert.strictEqual(appConfig.tabBar.color, '#929995');
assert.strictEqual(appConfig.tabBar.selectedColor, '#397A68');

const pageConfigsWithLightNavigation = collectFiles(miniprogramRoot)
  .filter((file) => path.extname(file) === '.json' && path.basename(file) !== 'app.json');
pageConfigsWithLightNavigation.forEach((file) => {
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (config.navigationBarBackgroundColor === '#FAF8F5') {
    assert.notStrictEqual(config.navigationBarTextStyle, 'white', `${path.relative(root, file)} 白底导航栏文字不可为白色`);
  }
});

const files = collectFiles(miniprogramRoot).filter((file) => sourceExtensions.has(path.extname(file)));
const forbiddenColors = [
  '#F7F7F2', '#F7F9FA', '#F5F5F5', '#FAF6F3', '#2F9D8E', '#2AAE9B', '#2F8175',
  '#E8F5F1', '#DDE8E3', '#FBE5D6', '#F5C7AD', '#FF6B35', '#FF7E4B', '#FFA000'
];
const violations = [];

files.forEach((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(root, file);
  forbiddenColors.forEach((color) => {
    if (source.toUpperCase().includes(color)) violations.push(`${relative}: 旧色 ${color}`);
  });
  const gradients = source.match(/(?:linear|radial|conic)-gradient\([^;"']+/g) || [];
  gradients.forEach((gradient) => {
    const allowedProgress = relative === 'miniprogram/pages/assessment/result/result.wxml'
      && gradient.startsWith('conic-gradient(');
    if (!allowedProgress) violations.push(`${relative}: 装饰渐变 ${gradient}`);
  });
  if (path.extname(file) === '.wxss') {
    const shadows = source.match(/box-shadow\s*:\s*([^;]+);/g) || [];
    shadows.forEach((shadow) => {
      const value = shadow.replace(/^box-shadow\s*:\s*/, '').replace(/;$/, '').trim();
      const allowed = value === 'none'
        || value === 'var(--shadow-floating)'
        || value === '0 8rpx 32rpx rgba(106, 174, 152, 0.12)';
      if (!allowed) violations.push(`${relative}: 非规范阴影 ${value}`);
    });
  }
});

assert.deepStrictEqual(violations, [], violations.join('\n'));

const homeStyle = read('miniprogram/pages/index/index.wxss');
assert.ok(/\.core-today-task-desc\s*\{[^}]*color:\s*#626A66/.test(homeStyle), '首页任务描述缺少正文色');
assert.ok(/\.core-today-task-action\s*\{[^}]*color:\s*#397A68/.test(homeStyle), '首页任务行动文字缺少品牌深色');
assert.ok(/\.module-icon-parenting\s*\{[^}]*background:\s*#E7DDF2;[^}]*color:\s*#397A68/.test(homeStyle), '首页育儿图标前景色不可见');

[
  ['miniprogram/pages/index/index.wxss', '.home-topic-card'],
  ['miniprogram/pages/development/index/index.wxss', '.family-scene-item'],
  ['miniprogram/pages/growth-record/index.wxss', '.growth-overview-card'],
  ['miniprogram/pages/profile/profile.wxss', '.child-entry']
].forEach(([file, selector]) => {
  const body = ruleBody(read(file), selector);
  assert.ok(/border\s*:\s*1rpx solid #ECEFEB/.test(body), `${file} ${selector} 缺少规范边框`);
});

console.log('Miniprogram visual system audit passed.');
