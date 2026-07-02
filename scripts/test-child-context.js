const assert = require('assert');
const childContext = require('../miniprogram/utils/child-context.js');

const fixedNow = new Date('2026-06-27T00:00:00');

function testAgeGroupMapping() {
  assert.strictEqual(childContext.normalizeChatAgeGroup({}), '');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ birthday: '' }, fixedNow), '');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ birthday: 'invalid' }, fixedNow), '');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ birthday: '2022-06-27' }, fixedNow), '4-5岁');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ birthday: '2019-06-27' }, fixedNow), '6-9岁');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ birthday: '2016-06-27' }, fixedNow), '9-12岁');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ birthday: '2022-06-27', age_group: '6-9岁' }, fixedNow), '4-5岁');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ age_group: '6-9岁' }, fixedNow), '6-9岁');
  assert.strictEqual(childContext.normalizeChatAgeGroup({ ageGroup: '4岁' }, fixedNow), '4-5岁');
}

function testParentingAgeGroup() {
  assert.strictEqual(childContext.inferParentingAgeGroup({}, fixedNow), '');
  assert.strictEqual(childContext.inferParentingAgeGroup({ birthday: '2026-01-01' }, fixedNow), '');
  assert.strictEqual(childContext.inferParentingAgeGroup({ birthday: '2022-06-27' }, fixedNow), '4-5岁');
  assert.strictEqual(childContext.inferParentingAgeGroup({ birthday: '2019-06-27' }, fixedNow), '6-9岁');
  assert.strictEqual(childContext.inferParentingAgeGroup({ birthday: '2016-06-27' }, fixedNow), '');
}

function testChildChatContext() {
  assert.strictEqual(childContext.buildChildChatContext(null), null);
  assert.deepStrictEqual(childContext.buildChildChatContext({
    id: 9,
    name: '牛牛',
    birthday: '2022-06-27',
    age_group: '6-9岁',
    tags: '敏感、慢热',
    concerns: '["睡前拖延","情绪表达"]'
  }, fixedNow), {
    id: 9,
    name: '牛牛',
    birthday: '2022-06-27',
    age_group: '4-5岁',
    tags: ['敏感', '慢热'],
    concerns: ['睡前拖延', '情绪表达'],
    source: 'current_child'
  });
}

function testRecommendation() {
  assert.deepStrictEqual(childContext.buildParentingRecommendation({ name: '牛牛', birthday: '2022-06-27' }, fixedNow), {
    ageGroup: '4-5岁',
    label: '先按牛牛的年龄挑几篇',
    fallback: ''
  });
  assert.deepStrictEqual(childContext.buildParentingRecommendation({ id: 1, name: '牛牛' }, fixedNow), {
    ageGroup: '',
    label: '',
    fallback: '填完生日后，会先看适合这个年龄的。'
  });
  assert.deepStrictEqual(childContext.buildParentingRecommendation(null, fixedNow), {
    ageGroup: '',
    label: '',
    fallback: '填完孩子信息后，会少一些泛泛的推荐。'
  });
}

function testArticleListInitialAgeFilter() {
  var ageList = [
    { id: 0, name: '全部年龄' },
    { id: 1, name: '2-3岁' },
    { id: 2, name: '3-4岁' },
    { id: 3, name: '4-5岁' },
    { id: 4, name: '5-6岁' },
    { id: 5, name: '6-9岁' }
  ];
  var recommendation = {
    ageGroup: '4-5岁',
    label: '先按牛牛的年龄挑几篇',
    fallback: ''
  };
  assert.deepStrictEqual(childContext.resolveArticleListInitialAgeFilter({}, ageList, recommendation), {
    currentAge: 3,
    recommendationLabel: '先按牛牛的年龄挑几篇',
    recommendationFallback: '',
    userSelectedAge: false
  });
  assert.deepStrictEqual(childContext.resolveArticleListInitialAgeFilter({ age_group: encodeURIComponent('5-6岁') }, ageList, recommendation), {
    currentAge: 4,
    recommendationLabel: '',
    recommendationFallback: '',
    userSelectedAge: true
  });
  assert.deepStrictEqual(childContext.resolveArticleListInitialAgeFilter({ ageGroup: '9-12岁' }, ageList, recommendation), {
    currentAge: 0,
    recommendationLabel: '',
    recommendationFallback: '',
    userSelectedAge: true
  });
  assert.deepStrictEqual(childContext.resolveArticleListInitialAgeFilter({}, ageList, {
    ageGroup: '',
    label: '',
    fallback: '填完生日后，会先看适合这个年龄的。'
  }), {
    currentAge: 0,
    recommendationLabel: '',
    recommendationFallback: '填完生日后，会先看适合这个年龄的。',
    userSelectedAge: false
  });
}

testAgeGroupMapping();
testParentingAgeGroup();
testChildChatContext();
testRecommendation();
testArticleListInitialAgeFilter();

console.log('Child context tests passed.');
