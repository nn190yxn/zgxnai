function formatWeeklySummaryForMembership(payload, activeMember) {
  const data = Object.assign({}, payload || {});
  const concernsPreview = Array.isArray(data.concernsPreview) ? data.concernsPreview : (Array.isArray(data.concerns) ? data.concerns.slice(0, 1) : []);
  const concernsFull = Array.isArray(data.concernsFull) ? data.concernsFull : (Array.isArray(data.concerns) ? data.concerns : concernsPreview);
  const nextActionsPreview = Array.isArray(data.nextActionsPreview) ? data.nextActionsPreview : (Array.isArray(data.nextActions) ? data.nextActions.slice(0, 2) : []);
  const nextActionsFull = Array.isArray(data.nextActionsFull) ? data.nextActionsFull : (Array.isArray(data.nextActions) ? data.nextActions : nextActionsPreview);
  const recommendedContentPreview = Array.isArray(data.recommendedContentPreview) ? data.recommendedContentPreview : (Array.isArray(data.recommendedContent) ? data.recommendedContent.slice(0, 1) : []);
  const recommendedContentPremium = Array.isArray(data.recommendedContentPremium) ? data.recommendedContentPremium : (Array.isArray(data.recommendedContent) ? data.recommendedContent : recommendedContentPreview);
  if (activeMember) {
    return Object.assign({}, data, {
      concerns: concernsFull,
      nextActions: nextActionsFull,
      recommendedContent: recommendedContentPremium,
      premiumUnlocked: true,
      premiumTip: '本周已解锁完整周总结。'
    });
  }
  const preview = Object.assign({}, data, {
    concerns: concernsPreview,
    nextActions: nextActionsPreview,
    recommendedContent: recommendedContentPreview,
    trendItems: Array.isArray(data.trendItems) ? data.trendItems.slice(0, 1) : [],
    highlights: Array.isArray(data.highlights) ? data.highlights.slice(0, 1) : [],
    premiumUnlocked: false,
    premiumTip: data.premiumTip || '会员可查看更细的趋势解释、完整下周建议和更多推荐内容。'
  });
  delete preview.concernsFull;
  delete preview.nextActionsFull;
  delete preview.recommendedContentPremium;
  delete preview.trendItemsPremium;
  delete preview.premiumTrend;
  delete preview.fullTrend;
  delete preview.premiumContent;
  delete preview.fullConcerns;
  delete preview.fullNextActions;
  return preview;
}

module.exports = { formatWeeklySummaryForMembership };
