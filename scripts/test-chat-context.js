const assert = require('assert');
const chatContext = require('../backend/src/mysql-production/chat-context.js');

function testNormalizeChatStringArray() {
  assert.deepStrictEqual(chatContext.normalizeChatStringArray([' 敏感 ', '', '慢热']), ['敏感', '慢热']);
  assert.deepStrictEqual(chatContext.normalizeChatStringArray('["睡前拖延","情绪表达"]'), ['睡前拖延', '情绪表达']);
  assert.deepStrictEqual(chatContext.normalizeChatStringArray('专注力、吃饭,睡觉'), ['专注力', '吃饭', '睡觉']);
  assert.deepStrictEqual(chatContext.normalizeChatStringArray(''), []);
}

function testBuildChatChildContext() {
  const context = chatContext.buildChatChildContext({
    nickname: '牛牛',
    age_group: '4-5岁',
    personality_tags: '敏感、慢热',
    parenting_concerns: '["睡前拖延","情绪表达"]'
  }, 'request_child_profile', function(childProfile) {
    return childProfile.age_group;
  });

  assert.deepStrictEqual(context, {
    ageGroup: '4-5岁',
    childName: '牛牛',
    tags: ['敏感', '慢热'],
    concerns: ['睡前拖延', '情绪表达'],
    source: 'request_child_profile',
    profileMissing: false
  });
}

function testBuildPromptLine() {
  assert.strictEqual(chatContext.buildChatChildProfilePromptLine(null, ''), '');
  assert.strictEqual(chatContext.buildChatChildProfilePromptLine({
    childName: '牛牛',
    ageGroup: '4-5岁',
    tags: ['敏感', '慢热'],
    concerns: ['睡前拖延', '情绪表达']
  }, ''), '孩子档案：牛牛；4-5岁；特点：敏感、慢热；家长关注：睡前拖延、情绪表达');
  assert.strictEqual(chatContext.buildChatChildProfilePromptLine({
    childName: '牛牛',
    ageGroup: '4-5岁',
    tags: ['慢热'],
    concerns: ['吃饭']
  }, '5-6岁'), '孩子档案：牛牛；5-6岁；特点：慢热；家长关注：吃饭');
}

testNormalizeChatStringArray();
testBuildChatChildContext();
testBuildPromptLine();

console.log('Chat context tests passed.');
