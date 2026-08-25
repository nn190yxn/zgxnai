const FEEDBACK_LABELS = Object.freeze({
  smooth: '完成顺利',
  reminder_needed: '需要提醒',
  left_early: '中途离开',
  resisted: '有所抗拒',
  incomplete: '未完成'
});

function parseJson(value, fallback) {
  if (value && typeof value === 'object') return value;
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (err) {
    return fallback;
  }
}

function normalizeDimensionScores(entry) {
  const dimensions = parseJson(entry && (entry.dimensions || entry.dimensionScores || entry.dimension_scores), {});
  return Object.entries(dimensions).reduce((result, [key, value]) => {
    const score = Number(value);
    if (Number.isFinite(score)) result[key] = Math.max(0, Math.min(100, score));
    return result;
  }, {});
}

function aggregateStageReport(entries = []) {
  const list = Array.isArray(entries) ? entries : [];
  const trainingEntries = list.filter((entry) => entry && entry.entryType === 'training_complete');
  const feedbackEntries = list.filter((entry) => entry && entry.entryType === 'training_feedback');
  const observationEntries = list.filter((entry) => entry && entry.entryType === 'assessment_result');
  const feedbackCounts = {};
  feedbackEntries.forEach((entry) => {
    const metadata = parseJson(entry.metadata, {});
    const key = String(metadata.feedbackKey || metadata.feedback_key || '').trim();
    if (key) feedbackCounts[key] = (feedbackCounts[key] || 0) + 1;
  });

  const dimensionTotals = {};
  const dimensionCounts = {};
  observationEntries.forEach((entry) => {
    Object.entries(normalizeDimensionScores(entry)).forEach(([key, score]) => {
      dimensionTotals[key] = (dimensionTotals[key] || 0) + score;
      dimensionCounts[key] = (dimensionCounts[key] || 0) + 1;
    });
  });
  const dimensionScores = Object.keys(dimensionTotals).reduce((result, key) => {
    result[key] = Math.round(dimensionTotals[key] / dimensionCounts[key]);
    return result;
  }, {});
  const feedbackTrend = Object.entries(feedbackCounts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, count]) => ({ key, label: FEEDBACK_LABELS[key] || key, count }));

  return {
    completedTaskCount: trainingEntries.length,
    feedbackCount: feedbackEntries.length,
    feedbackCounts,
    feedbackTrend,
    observationCount: observationEntries.length,
    dimensionScores,
    traceableEntryCount: list.length
  };
}

module.exports = {
  FEEDBACK_LABELS,
  aggregateStageReport,
  normalizeDimensionScores
};
