const { READING_TASKS } = require('../mysql-production/content-seeds');
const { PARENTING_ARTICLES } = require('../mysql-production/parenting-articles');

function summarize(items, name, requiredMarkers, shortThreshold) {
  const lengths = items.map((item) => {
    const content = String(item.content || '');
    const missingMarkers = requiredMarkers.filter((marker) => !content.includes(marker));
    return {
      id: item.task_code || item.title,
      title: item.title,
      len: content.length,
      missingMarkers
    };
  });

  const empty = lengths.filter((item) => item.len === 0);
  const shortItems = lengths.filter((item) => item.len < shortThreshold).sort((a, b) => a.len - b.len);
  const markerIssues = lengths.filter((item) => item.missingMarkers.length > 0);
  const min = lengths.reduce((acc, item) => Math.min(acc, item.len), Infinity);
  const max = lengths.reduce((acc, item) => Math.max(acc, item.len), 0);
  const avg = Math.round(lengths.reduce((acc, item) => acc + item.len, 0) / lengths.length);

  return {
    name,
    total: lengths.length,
    emptyCount: empty.length,
    shortThreshold,
    shortCount: shortItems.length,
    markerIssueCount: markerIssues.length,
    min,
    max,
    avg,
    shortest: shortItems.slice(0, 10),
    markerIssues: markerIssues.slice(0, 10)
  };
}

const readingSummary = summarize(
  READING_TASKS,
  'reading_tasks',
  ['【适龄重点】', '【家长支持】', '【结束'],
  320
);

const articleSummary = summarize(
  PARENTING_ARTICLES,
  'parenting_articles',
  ['## 核心结论', '## 家庭操作步骤', '## 家长观察重点', '## 证据依据'],
  780
);

const result = {
  ok:
    readingSummary.emptyCount === 0 &&
    articleSummary.emptyCount === 0 &&
    readingSummary.markerIssueCount === 0 &&
    articleSummary.markerIssueCount === 0,
  generatedAt: new Date().toISOString(),
  summaries: [readingSummary, articleSummary]
};

console.log(JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exit(1);
}
