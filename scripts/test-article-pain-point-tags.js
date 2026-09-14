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
  }
];

// 按 SQL 条件出现顺序消费参数，模拟数据库 LIKE/IN 语义。
function evaluateFilter(filter, article) {
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
  let index = 0;
  return tokens.map(function(token) {
    if (token.type === 'like') {
      const needle = String(filter.params[index++]).replace(/%/g, '').toLowerCase();
      return String(article[token.field] || '').toLowerCase().indexOf(needle) !== -1;
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
  assert.ok(filter && filter.sql && Array.isArray(filter.params), tag.key + ' should build a SQL filter');
  articles.forEach(function(article) {
    const matchedInJs = articlePainPoints.matchArticlePainPoints(article)
      .some(function(item) { return item.key === tag.key; });
    assert.equal(
      evaluateFilter(filter, article),
      matchedInJs,
      tag.key + ' SQL filter should match JS result for article ' + article.id
    );
  });
});

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

assert.ok(articlePainPoints.matchArticlePainPoints(articles[2]).length, 'nutrition articles should match through category fallback');

console.log('Article pain point tag tests passed.');
