const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(relativePath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relativePath), 'utf8');
}

function hasRule(source, selector, declarations) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rule = source.match(new RegExp(escapedSelector + '\\s*\\{([\\s\\S]*?)\\}'));
  assert.ok(rule, '缺少样式规则：' + selector);
  declarations.forEach(function(declaration) {
    assert.ok(declaration.test(rule[1]), selector + ' 缺少长内容适配：' + declaration);
  });
}

const articleWxml = read('miniprogram/pages/parenting/article-detail/article-detail.wxml');
const articleWxss = read('miniprogram/pages/parenting/article-detail/article-detail.wxss');
assert.ok(articleWxml.includes('<rich-text nodes="{{article.content}}"'), '文章详情必须保留富文本正文');
hasRule(articleWxss, '.rich-content-section', [
  /max-width\s*:\s*100%/,
  /overflow-wrap\s*:\s*anywhere/,
  /word-break\s*:\s*break-word/
]);
hasRule(articleWxss, '.reading-annotation', [
  /bottom\s*:\s*calc\(100rpx\s*\+\s*env\(safe-area-inset-bottom\)\)/
]);

const recipeWxml = read('miniprogram/pages/nutrition/recipe-detail/recipe-detail.wxml');
const recipeWxss = read('miniprogram/pages/nutrition/recipe-detail/recipe-detail.wxss');
assert.ok(recipeWxml.includes('wx:for="{{recipe.steps}}"'), '食谱详情必须渲染烹饪步骤');
assert.ok(recipeWxml.includes('class="recipe-step-text"'), '食谱步骤必须使用长文本样式');
hasRule(recipeWxss, '.ingredient-name', [/flex\s*:\s*1/, /min-width\s*:\s*0/, /overflow-wrap\s*:\s*anywhere/]);
hasRule(recipeWxss, '.ingredient-amount', [/flex-shrink\s*:\s*0/, /overflow-wrap\s*:\s*anywhere/]);
hasRule(recipeWxss, '.recipe-step-text', [/min-width\s*:\s*0/, /overflow-wrap\s*:\s*anywhere/]);
hasRule(recipeWxss, '.bottom-placeholder', [/env\(safe-area-inset-bottom\)/]);

const trainingWxss = read('miniprogram/pages/training/detail/detail.wxss');
hasRule(trainingWxss, '.training-detail-page', [/overflow-x\s*:\s*hidden/]);
hasRule(trainingWxss, '.detail-title', [/overflow-wrap\s*:\s*anywhere/]);
hasRule(trainingWxss, '.detail-objective, .step, .prompt, .signal', [/overflow-wrap\s*:\s*anywhere/]);

const chatJs = read('miniprogram/pages/chat/chat.js');
const chatWxml = read('miniprogram/pages/chat/chat.wxml');
const chatWxss = read('miniprogram/pages/chat/chat.wxss');
[
  'keyboardHeight',
  'chatBottomInset',
  'bindKeyboardHeightChange',
  'onKeyboardHeightChange',
  'measureBottomDock',
  'unbindKeyboardHeightChange'
].forEach(function(token) {
  assert.ok(chatJs.includes(token), '聊天页缺少键盘避让契约：' + token);
});
assert.ok(chatJs.includes("scrollToView: 'chat-bottom'"), '聊天消息必须滚动到稳定底部锚点');
assert.ok(chatWxml.includes('id="chat-bottom"'), '聊天模板必须提供底部滚动锚点');
assert.ok(chatWxml.includes('padding-bottom: {{chatBottomInset}}px'), '聊天区域必须使用动态底部留白');
assert.ok(chatWxml.includes('bottom: {{keyboardHeight}}px'), '聊天输入区必须跟随键盘高度');
assert.ok(chatWxml.includes('adjust-position="{{false}}"'), '聊天页必须关闭系统重复顶起');
assert.ok(chatWxml.includes('bindlinechange="onInputLineChange"'), '输入框增高后必须重新测量底部输入区');
hasRule(chatWxss, '.chat-area', [/box-sizing\s*:\s*border-box/]);
hasRule(chatWxss, '.bubble', [/min-width\s*:\s*0/, /overflow-wrap\s*:\s*anywhere/]);
assert.ok(
  /messages:\s*newMessages[\s\S]{0,240}saveMessages\(\)/.test(chatJs),
  '用户消息加入列表后必须立即保存'
);

const originalWx = global.wx;
const originalPage = global.Page;
const originalGetApp = global.getApp;
let pageDefinition;
let keyboardHandler;
let removedKeyboardHandler;
global.wx = {
  onKeyboardHeightChange(handler) { keyboardHandler = handler; },
  offKeyboardHeightChange(handler) { removedKeyboardHandler = handler; },
  createSelectorQuery() {
    return {
      in() { return this; },
      select() { return this; },
      boundingClientRect(callback) { callback({ height: 180 }); return this; },
      exec() {}
    };
  }
};
global.getApp = function() {
  return { globalData: {} };
};
global.Page = function(definition) {
  pageDefinition = definition;
};
const chatModulePath = require.resolve('../miniprogram/pages/chat/chat.js');
delete require.cache[chatModulePath];
require(chatModulePath);

const page = Object.assign({}, pageDefinition, {
  data: Object.assign({}, pageDefinition.data),
  _isUnloaded: false,
  setData(update, callback) {
    Object.assign(this.data, update);
    if (callback) callback();
  }
});
page.bindKeyboardHeightChange();
assert.strictEqual(typeof keyboardHandler, 'function', '聊天页必须注册键盘高度监听');
keyboardHandler({ height: 320 });
assert.strictEqual(page.data.keyboardHeight, 320, '键盘高度必须同步到输入区定位状态');
assert.strictEqual(page.data.chatBottomInset, 512, '消息区留白必须包含输入区、键盘和滚动余量');
page.unbindKeyboardHeightChange();
assert.strictEqual(removedKeyboardHandler, keyboardHandler, '页面卸载时必须移除同一个键盘监听器');
page._isUnloaded = true;

delete require.cache[chatModulePath];
global.wx = originalWx;
global.Page = originalPage;
global.getApp = originalGetApp;

console.log('Miniprogram long content and keyboard avoidance tests passed.');
