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
// 书籍章节与拆条内容混在文章表里，以下标题形态不参与痛点标签与筛选：
//   「…片段N」「第N步 …」「第N章 …」拆条标记；
//   「 - 」书名/章节与正文分隔符，如「第二阶段 从病态模式到主动选择 - …」；
//   前导序号加空格，如「65 摇晃宝宝」「09 大脑训练计划 塑造你的大脑」。
// 只用阿拉伯数字匹配序号，避免误伤「第一步」「迈出社交第一步」这类正常文章标题；
// 前导序号要求数字后跟空白，避免误伤「3岁孩子…」这类以数字开头的正常标题。
// JS 与 SQL 复用同一个模式串，保证展示判定与下推筛选等价。
const EXCLUDED_TITLE_PATTERN_SOURCE = '片段|第[0-9]+步|第[0-9一二三四五六七八九十百]+章| - |^[0-9]+\\s';
const EXCLUDED_TITLE_PATTERN = new RegExp(EXCLUDED_TITLE_PATTERN_SOURCE);
// 整批导入、经核对不含正式手写内容的分类；这些分类下的文章全部不参与痛点标签与筛选。
const EXCLUDED_CATEGORIES = Object.freeze(['家庭教育']);
// 痛点合集只收录内容团队自产的方案卡与问答。书籍导入内容由书名或外籍作者署名，不属于合集来源，
// 其正文是书稿散文，直接展示会污染合集。空白作者是历史问答内容的署名方式，一并纳入白名单。
const CURATED_AUTHORS = Object.freeze(['小牛育儿内容组', '小牛育儿编辑部', '追光小牛']);
const CURATED_AUTHOR_PATTERN_SOURCE = '^(' + CURATED_AUTHORS.join('|') + ')?$';
const CURATED_AUTHOR_PATTERN = new RegExp(CURATED_AUTHOR_PATTERN_SOURCE);

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
  const source = article || {};
  if (EXCLUDED_TITLE_PATTERN.test(String(source.title || ''))) {
    return false;
  }
  if (EXCLUDED_CATEGORIES.indexOf(String(source.category || '').trim()) !== -1) {
    return false;
  }
  return CURATED_AUTHOR_PATTERN.test(String(source.author || '').trim());
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
  const params = [EXCLUDED_TITLE_PATTERN_SOURCE];
  const conditions = ['NOT (COALESCE(title, \'\') REGEXP ?)'];
  if (EXCLUDED_CATEGORIES.length) {
    conditions.push('COALESCE(category, \'\') NOT IN (' + EXCLUDED_CATEGORIES.map(function() { return '?'; }).join(', ') + ')');
    params.push.apply(params, EXCLUDED_CATEGORIES);
  }
  conditions.push('TRIM(COALESCE(author, \'\')) REGEXP ?');
  params.push(CURATED_AUTHOR_PATTERN_SOURCE);
  return { sql: conditions.join(' AND '), params: params };
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
  buildPainPointExclusion: buildPainPointExclusion,
  EXCLUDED_TITLE_PATTERN_SOURCE: EXCLUDED_TITLE_PATTERN_SOURCE,
  EXCLUDED_CATEGORIES: EXCLUDED_CATEGORIES,
  CURATED_AUTHORS: CURATED_AUTHORS
};
