const { formatWeeklySummaryForMembership } = require('../src/mysql-production/report-membership');

const payload = {
  recordDays: 4,
  highlights: ['亮点1', '亮点2'],
  concernsPreview: ['基础关注'],
  concernsFull: ['基础关注', '会员关注'],
  nextActionsPreview: ['基础建议'],
  nextActionsFull: ['基础建议', '会员建议'],
  recommendedContentPreview: [{ title: '基础内容' }],
  recommendedContentPremium: [{ title: '基础内容' }, { title: '会员内容' }],
  trendItems: [{ label: '基础趋势' }, { label: '会员趋势' }]
};

describe('阶段报告会员字段裁剪', () => {
  it('基础用户只获得预览数组和基础趋势', () => {
    const result = formatWeeklySummaryForMembership(payload, false);

    expect(result).toEqual(expect.objectContaining({
      concerns: ['基础关注'],
      nextActions: ['基础建议'],
      recommendedContent: [{ title: '基础内容' }],
      highlights: ['亮点1'],
      trendItems: [{ label: '基础趋势' }],
      premiumUnlocked: false
    }));
    expect(result.concernsFull).toBeUndefined();
    expect(result.nextActionsFull).toBeUndefined();
    expect(result.recommendedContentPremium).toBeUndefined();
  });

  it('会员用户获得完整报告字段', () => {
    const result = formatWeeklySummaryForMembership(payload, true);

    expect(result.concerns).toEqual(payload.concernsFull);
    expect(result.nextActions).toEqual(payload.nextActionsFull);
    expect(result.recommendedContent).toEqual(payload.recommendedContentPremium);
    expect(result.premiumUnlocked).toBe(true);
  });

  it('基础响应不泄漏常见会员专属字段', () => {
    const result = formatWeeklySummaryForMembership({
      concerns: ['基础关注', '会员关注'],
      nextActions: ['基础建议', '会员建议'],
      recommendedContent: [{ title: '基础内容' }, { title: '会员内容' }],
      premiumTrend: [{ label: '会员趋势' }],
      fullTrend: [{ label: '完整趋势' }],
      premiumContent: [{ title: '会员内容' }],
      fullConcerns: ['完整关注'],
      fullNextActions: ['完整建议']
    }, false);

    expect(result.concerns).toEqual(['基础关注']);
    expect(result.nextActions).toEqual(['基础建议', '会员建议'].slice(0, 2));
    expect(result.premiumTrend).toBeUndefined();
    expect(result.fullTrend).toBeUndefined();
    expect(result.premiumContent).toBeUndefined();
    expect(result.fullConcerns).toBeUndefined();
    expect(result.fullNextActions).toBeUndefined();
  });
});
