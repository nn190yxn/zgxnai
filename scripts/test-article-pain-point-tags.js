'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const articlePainPoints = require(path.join(__dirname,
  '../backend/src/mysql-production/article-pain-points.js'));

const articles = [
  {
    id: 1,
    title: '4-5岁孩子情绪表达的4个引导技巧',
    summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
    content: '哭闹时先命名情绪。',
    tags: '情绪词汇,情绪调节',
    sub_category: '情绪表达',
    category: '情绪管理'
  },
  {
    id: 2,
    title: '建立睡前流程：让孩子更快入睡',
    summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
    content: '睡前流程越稳定，入睡越快。',
    tags: '睡眠习惯',
    sub_category: '作息',
    category: '行为习惯'
  },
  {
    id: 3,
    title: '早餐营养搭配：让早晨吃进去，也吃得稳',
    summary: '主食、蛋白和蔬果搭配得当，更有利于上午精力稳定。',
    content: '早餐要包含蛋白质。',
    tags: '营养',
    sub_category: '饮食',
    category: '营养健康'
  },
  {
    id: 4,
    title: '同伴冲突时，家长如何做翻译官',
    summary: '把争抢背后的需求说出来，帮助孩子学习社交协商。',
    content: '同伴冲突时先描述事实。',
    tags: '同伴关系',
    sub_category: '冲突解决',
    category: '社交能力'
  },
  {
    id: 5,
    title: '专注力环境搭建：先减干扰，再谈坚持',
    summary: '把材料和任务长度一起收窄，孩子更容易进入专注状态。',
    content: '减少干扰能延长专注。',
    tags: '专注',
    sub_category: '注意力',
    category: '认知发展'
  },
  {
    id: 6,
    title: '一个没有明显关键词的文章',
    summary: '内容与常见育儿话题无关。',
    content: '',
    tags: '',
    sub_category: '',
    category: '未知分类'
  },
  {
    id: 7,
    title: '整理玩具的小方法',
    summary: '把玩具按大小归位，方便下次找。',
    content: '',
    tags: '',
    sub_category: '',
    category: '行为习惯'
  },
  {
    id: 8,
    title: '数数练习小游戏',
    summary: '按顺序数到十。',
    content: '',
    tags: '',
    sub_category: '',
    category: '认知发展'
  },
  {
    id: 9,
    title: '蔬菜的挑选方法',
    summary: '看颜色和手感挑选当季蔬菜。',
    content: '',
    tags: '',
    sub_category: '',
    category: '营养健康'
  },
  {
    id: 10,
    title: '第9章 给治疗师 治疗（片段5）',
    summary: '运动能改善情绪。',
    content: '每天运动三十分钟。',
    tags: '运动',
    sub_category: '',
    category: '认知健康'
  },
  {
    id: 11,
    title: '第一章 全新理念的起源',
    summary: '睡眠与健康的关系。',
    content: '入睡质量影响健康。',
    tags: '',
    sub_category: '',
    category: '认知健康'
  },
  {
    id: 12,
    title: '65 摇晃宝宝',
    summary: '运动能改善情绪。',
    content: '每天运动三十分钟。',
    tags: '运动',
    sub_category: '',
    category: '营养健康'
  },
  {
    id: 13,
    title: '第二阶段 从病态模式到主动选择 - 我得想个办法',
    summary: '运动能改善情绪。',
    content: '每天运动三十分钟。',
    tags: '运动',
    sub_category: '',
    category: '营养健康'
  },
  {
    id: 14,
    title: '睡前流程怎么安排，先固定起床时间',
    summary: '运动能改善情绪。',
    content: '每天运动三十分钟。',
    tags: '运动',
    sub_category: '',
    category: '家庭教育'
  }
];

// 把 SQL LIKE 模式（含 % 通配）转成等价正则，避免用子串近似
function likeToRegExp(likePattern) {
  const escaped = String(likePattern).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^' + escaped.replace(/%/g, '[\\s\\S]*') + '$', 'i');
}

// 按 SQL 条件出现顺序消费参数，模拟数据库 LIKE/IN 语义。
function evaluateFilter(filter, article, exclusion) {
  if (exclusion) {
    const title = String(article.title || '');
    const match = /REGEXP \?/.test(exclusion.sql);
    const titleExcluded = match
      ? new RegExp(exclusion.params[0]).test(title)
      : exclusion.params.some(function(param) { return likeToRegExp(param).test(title); });
    const categoryExcluded = /category, ''\) NOT IN \(/.test(exclusion.sql)
      ? exclusion.params.slice(1).indexOf(String(article.category || '').trim()) !== -1
      : false;
    if (titleExcluded || categoryExcluded) return false;
  }
  const tokens = [];
  const pattern = /(title|summary|content|tags|sub_category) LIKE \?|category IN \(([^)]*)\)/g;
  let match;
  while ((match = pattern.exec(filter.sql))) {
    if (match[1]) {
      tokens.push({ type: 'like', field: match[1] });
    } else {
      tokens.push({ type: 'in', count: (match[2].match(/\?/g) || []).length });
    }
  }
  assert.ok(tokens.length, 'filter SQL should expose at least one condition');
  let index = 0;
  return tokens.map(function(token) {
    if (token.type === 'like') {
      const matcher = likeToRegExp(filter.params[index++]);
      return matcher.test(String(article[token.field] || ''));
    }
    const categories = filter.params.slice(index, index + token.count);
    index += token.count;
    return categories.indexOf(String(article.category || '')) !== -1;
  }).some(Boolean);
}

const catalog = articlePainPoints.listPainPointTags();
assert.ok(catalog.length >= 6, 'catalog should cover the main parent pain points');
catalog.forEach(function(tag) {
  assert.ok(tag.key && tag.label && tag.category, 'catalog entries should expose key, label and category');
  assert.ok(articlePainPoints.isPainPointTagKey(tag.key), 'catalog keys should be accepted by the filter');
});
assert.equal(articlePainPoints.isPainPointTagKey('unknown_key'), false, 'unknown keys should be rejected');
assert.equal(articlePainPoints.buildPainPointFilter('unknown_key'), null, 'unknown keys should not build a filter');

catalog.forEach(function(tag) {
  const filter = articlePainPoints.buildPainPointFilter(tag.key);
  const exclusion = articlePainPoints.buildPainPointExclusion();
  assert.ok(filter && filter.sql && Array.isArray(filter.params), tag.key + ' should build a SQL filter');
  assert.ok(exclusion && exclusion.sql && Array.isArray(exclusion.params),
    'should build a SQL exclusion for non-article content');
  articles.forEach(function(article) {
    const matchedInJs = articlePainPoints.matchArticlePainPoints(article)
      .some(function(item) { return item.key === tag.key; });
    assert.equal(
      evaluateFilter(filter, article, exclusion),
      matchedInJs,
      tag.key + ' SQL filter should match JS result for article ' + article.id
    );
  });
});

// 书籍章节与拆条内容不参与痛点标签与筛选
const bookChapter = articles.filter(function(article) { return article.id >= 10; });
bookChapter.forEach(function(article) {
  assert.equal(articlePainPoints.isPainPointEligible(article), false,
    'book chapter should be ineligible: ' + article.id);
  assert.deepEqual(articlePainPoints.matchArticlePainPoints(article), [],
    'book chapter should not receive pain point tags: ' + article.id);
  catalog.forEach(function(tag) {
    const filter = articlePainPoints.buildPainPointFilter(tag.key);
    const exclusion = articlePainPoints.buildPainPointExclusion();
    assert.equal(evaluateFilter(filter, article, exclusion), false,
      'book chapter should be filtered out for ' + tag.key + ' (article ' + article.id + ')');
  });
});

assert.equal(articlePainPoints.isPainPointEligible({ title: '睡前流程怎么安排' }), true,
  'normal articles stay eligible');
assert.equal(articlePainPoints.isPainPointEligible({ title: '文章里提到章节结构' }), true,
  'titles mentioning 章节 without 第…章 stay eligible');
assert.equal(articlePainPoints.isPainPointEligible({ title: '上学前磨蹭，第一步小到马上能做' }), true,
  'chinese first step phrasing stays eligible');
assert.equal(articlePainPoints.isPainPointEligible({ title: '迈出社交第一步' }), true,
  'chinese first step phrasing stays eligible without keywords');
assert.equal(articlePainPoints.isPainPointEligible({ title: '第16步 重新看待犯错' }), false,
  'numeric step book content is excluded');
assert.equal(articlePainPoints.isPainPointEligible({ title: '第9章 给治疗师 治疗' }), false,
  'chapter book content is excluded');
assert.equal(articlePainPoints.isPainPointEligible({ title: '10 个亲子游戏（片段2）' }), false,
  'fragment book content is excluded');
assert.equal(articlePainPoints.isPainPointEligible({ title: '第二阶段 从病态模式到主动选择 - 我得想个办法' }), false,
  'dash-separated book prose is excluded');
assert.equal(articlePainPoints.isPainPointEligible({ title: '65 摇晃宝宝' }), false,
  'leading numeric section marker is excluded');
assert.equal(articlePainPoints.isPainPointEligible({ title: '3岁孩子的分离焦虑怎么处理' }), true,
  'titles starting with a number without whitespace stay eligible');
assert.equal(articlePainPoints.isPainPointEligible({ title: '睡前流程怎么安排', category: '家庭教育' }), false,
  'import-only category is excluded even with a clean title');
assert.equal(articlePainPoints.isPainPointEligible({ title: '睡前流程怎么安排', category: '行为习惯' }), true,
  'canonical category with a clean title stays eligible');

// 排除参数必须与 EXCLUDED_CATEGORIES 对齐，避免 SQL 与 JS 判定分叉
const exclusionContract = articlePainPoints.buildPainPointExclusion();
assert.equal(exclusionContract.params[0], '片段|第[0-9]+步|第[0-9一二三四五六七八九十百]+章| - |^[0-9]+\\s',
  'exclusion should reuse a single shared title pattern');
assert.deepEqual(exclusionContract.params.slice(1), Array.from(articlePainPoints.EXCLUDED_CATEGORIES),
  'exclusion should push the excluded category list in order');

articles.forEach(function(article) {
  const first = articlePainPoints.matchArticlePainPoints(article);
  const second = articlePainPoints.matchArticlePainPoints(article);
  assert.deepEqual(first, second, 'matching should be deterministic for article ' + article.id);
  assert.ok(first.length <= articlePainPoints.MAX_TAGS_PER_ARTICLE, 'tags per article should be capped');
});

const emotional = articlePainPoints.matchArticlePainPoints(articles[0]);
assert.ok(emotional.some(function(tag) { return tag.key === 'cries_when_switching'; }),
  'emotional articles should match the crying and switching pain point');
assert.ok(emotional.every(function(tag) { return tag.label && tag.category; }),
  'matched tags should be display ready');

const orphan = articlePainPoints.matchArticlePainPoints(articles[5]);
assert.deepEqual(orphan, [], 'articles without keyword or category hit should stay untagged');

// 宽泛分类不再兜底：只有行为习惯/认知发展分类、正文无关键词的文章不应被打上痛点标签
['called_no_response', 'distracted_during_task', 'sleep_resistance', 'unclear_speech', 'body_adaptation']
  .forEach(function(key) {
    assert.deepEqual(
      articlePainPoints.getPainPointTag(key).articleCategories,
      [],
      key + ' should not fall back to a broad category'
    );
  });
assert.deepEqual(articlePainPoints.matchArticlePainPoints(articles[6]), [],
  '行为习惯 articles without keywords should stay untagged');
assert.deepEqual(articlePainPoints.matchArticlePainPoints(articles[7]), [],
  '认知发展 articles without keywords should stay untagged');

assert.ok(articlePainPoints.matchArticlePainPoints(articles[2]).length,
  'nutrition articles should match through keyword');
assert.ok(articlePainPoints.matchArticlePainPoints(articles[8]).some(function(tag) {
  return tag.key === 'picky_eating';
}), 'near-synonymous category fallback should still apply for picky eating');

console.log('Article pain point tag tests passed.');
