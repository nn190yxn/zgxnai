// 家长痛点标签：由文章文本与分类在查询期派生，不写入数据库。
const PAIN_POINT_TAGS = Object.freeze([
  {
    key: 'called_no_response',
    label: '叫了几次像没听见',
    category: '做事与学习',
    keywords: ['叫不应', '没反应', '听不见', '不理人', '喊不动'],
    articleCategories: ['行为习惯']
  },
  {
    key: 'distracted_during_task',
    label: '做事容易分心',
    category: '做事与学习',
    keywords: ['分心', '坐不住', '走神', '专注', '磨蹭', '拖延'],
    articleCategories: ['行为习惯', '认知发展']
  },
  {
    key: 'cries_when_switching',
    label: '换活动就哭闹',
    category: '情绪与配合',
    keywords: ['哭闹', '发脾气', '情绪', '分离焦虑', '顶嘴', '崩溃'],
    articleCategories: ['情绪管理']
  },
  {
    key: 'unclear_speech',
    label: '说话说不清楚',
    category: '说话与表达',
    keywords: ['说不清', '表达', '语言', '复述', '词汇', '口齿'],
    articleCategories: ['认知发展', '社交能力']
  },
  {
    key: 'cannot_play_together',
    label: '不会和同伴相处',
    category: '同伴与相处',
    keywords: ['同伴', '冲突', '抢玩具', '分享', '一起玩', '社交'],
    articleCategories: ['社交能力']
  },
  {
    key: 'sleep_resistance',
    label: '睡前不肯睡',
    category: '身体与适应',
    keywords: ['睡前', '入睡', '睡眠', '作息', '洗漱'],
    articleCategories: ['行为习惯']
  },
  {
    key: 'picky_eating',
    label: '吃饭挑食磨蹭',
    category: '身体与适应',
    keywords: ['挑食', '吃饭', '食欲', '偏食', '早餐', '营养'],
    articleCategories: ['营养健康']
  },
  {
    key: 'body_adaptation',
    label: '身体适应与安全',
    category: '身体与适应',
    keywords: ['运动', '安全', '适应', '换季', '健康', '体能'],
    articleCategories: ['营养健康']
  }
]);

const MAX_TAGS_PER_ARTICLE = 3;
const TEXT_FIELDS = ['title', 'summary', 'content', 'tags', 'sub_category'];

function listPainPointTags() {
  return PAIN_POINT_TAGS.map(function(tag) {
    return { key: tag.key, label: tag.label, category: tag.category };
  });
}

function getPainPointTag(key) {
  const normalized = String(key || '').trim();
  return PAIN_POINT_TAGS.find(function(tag) { return tag.key === normalized; }) || null;
}

function isPainPointTagKey(key) {
  return !!getPainPointTag(key);
}

function buildArticleText(article) {
  const source = article || {};
  return TEXT_FIELDS.map(function(field) {
    return String(source[field] || '');
  }).join(' ').toLowerCase();
}

function matchesTag(article, tag) {
  const category = String((article || {}).category || '').trim();
  if (tag.articleCategories.includes(category)) {
    return true;
  }
  const text = buildArticleText(article);
  return tag.keywords.some(function(keyword) {
    return text.indexOf(String(keyword).toLowerCase()) !== -1;
  });
}

function matchArticlePainPoints(article) {
  return PAIN_POINT_TAGS
    .filter(function(tag) { return matchesTag(article, tag); })
    .slice(0, MAX_TAGS_PER_ARTICLE)
    .map(function(tag) {
      return { key: tag.key, label: tag.label, category: tag.category };
    });
}

// 生成与 matchesTag 等价的 SQL 条件，供文章接口下推筛选。
function buildPainPointFilter(key) {
  const tag = getPainPointTag(key);
  if (!tag) {
    return null;
  }
  const clauses = [];
  const params = [];
  const keywordClauses = tag.keywords.map(function(keyword) {
    params.push('%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%', '%' + keyword + '%');
    return '(title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ? OR sub_category LIKE ?)';
  });
  if (keywordClauses.length) {
    clauses.push('(' + keywordClauses.join(' OR ') + ')');
  }
  if (tag.articleCategories.length) {
    clauses.push('category IN (' + tag.articleCategories.map(function() { return '?'; }).join(', ') + ')');
    tag.articleCategories.forEach(function(category) { params.push(category); });
  }
  return { sql: '(' + clauses.join(' OR ') + ')', params: params };
}

module.exports = {
  PAIN_POINT_TAGS: PAIN_POINT_TAGS,
  MAX_TAGS_PER_ARTICLE: MAX_TAGS_PER_ARTICLE,
  listPainPointTags: listPainPointTags,
  getPainPointTag: getPainPointTag,
  isPainPointTagKey: isPainPointTagKey,
  matchArticlePainPoints: matchArticlePainPoints,
  buildPainPointFilter: buildPainPointFilter
};
