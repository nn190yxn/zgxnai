// 家长痛点标签：由文章文本与分类在查询期派生，不写入数据库。
// 分类兜底只保留与痛点近乎同义、实测漂移极低的分类；宽泛分类（如行为习惯、认知发展）会引入大量无关文章，仅靠关键词匹配。
const PAIN_POINT_TAGS = Object.freeze([
  {
    key: 'called_no_response',
    label: '叫了几次像没听见',
    category: '做事与学习',
    keywords: ['叫不应', '没反应', '听不见', '不理人', '喊不动'],
    articleCategories: []
  },
  {
    key: 'distracted_during_task',
    label: '做事容易分心',
    category: '做事与学习',
    keywords: ['分心', '坐不住', '走神', '专注', '磨蹭', '拖延'],
    articleCategories: []
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
    articleCategories: []
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
    articleCategories: []
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
    label: '运动与安全',
    category: '身体与适应',
    keywords: ['运动', '体能', '户外', '换季', '身体不适', '摔倒', '磕碰', '受伤'],
    articleCategories: []
  }
]);

const MAX_TAGS_PER_ARTICLE = 3;
const TEXT_FIELDS = ['title', 'summary', 'content', 'tags', 'sub_category'];
// 书籍章节与拆条内容混在文章表里，标题含「片段」或「第…章」的内容不参与痛点标签与筛选。
// 这两条同时可以用 LIKE 表达，保证 JS 判定与 SQL 下推筛选等价。
const EXCLUDED_TITLE_SUBSTRINGS = ['片段'];
const EXCLUDED_TITLE_PATTERN = /第[\s\S]*章/;
const EXCLUDED_TITLE_LIKE_PARAMS = ['%\u7247\u6bb5%', '%\u7b2c%\u7ae0%'];

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

function isPainPointEligible(article) {
  const title = String((article || {}).title || '');
  if (EXCLUDED_TITLE_SUBSTRINGS.some(function(item) { return title.indexOf(item) !== -1; })) {
    return false;
  }
  return !EXCLUDED_TITLE_PATTERN.test(title);
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
  if (!isPainPointEligible(article)) {
    return [];
  }
  return PAIN_POINT_TAGS
    .filter(function(tag) { return matchesTag(article, tag); })
    .slice(0, MAX_TAGS_PER_ARTICLE)
    .map(function(tag) {
      return { key: tag.key, label: tag.label, category: tag.category };
    });
}

// 与 isPainPointEligible 等价的 SQL 排除条件，供文章接口下推。
function buildPainPointExclusion() {
  return {
    sql: 'NOT (COALESCE(title, \'\') LIKE ? OR COALESCE(title, \'\') LIKE ?)',
    params: EXCLUDED_TITLE_LIKE_PARAMS.slice()
  };
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
  buildPainPointFilter: buildPainPointFilter,
  isPainPointEligible: isPainPointEligible,
  buildPainPointExclusion: buildPainPointExclusion
};
