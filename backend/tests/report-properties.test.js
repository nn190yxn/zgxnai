const { aggregateStageReport } = require('../src/mysql-production/stage-report');
const { formatWeeklySummaryForMembership } = require('../src/mysql-production/report-membership');

describe('阶段报告属性约束', () => {
  test('报告训练次数始终等于训练完成记录数', () => {
    for (let size = 0; size < 40; size += 1) {
      const entries = Array.from({ length: size }, (_, index) => ({
        entryType: index % 3 === 0 ? 'training_complete' : 'user_note'
      }));
      expect(aggregateStageReport(entries).completedTaskCount)
        .toBe(entries.filter((entry) => entry.entryType === 'training_complete').length);
    }
  });

  test('基础用户永远只获得裁剪后的会员字段', () => {
    for (let size = 0; size < 20; size += 1) {
      const payload = {
        concerns: Array.from({ length: size + 1 }, (_, index) => '关注' + index),
        nextActions: Array.from({ length: size + 1 }, (_, index) => '建议' + index),
        recommendedContent: Array.from({ length: size + 1 }, (_, index) => ({ title: '内容' + index })),
        trendItems: Array.from({ length: size + 1 }, (_, index) => ({ label: '趋势' + index })),
        concernsFull: ['会员关注'],
        nextActionsFull: ['会员建议'],
        recommendedContentPremium: [{ title: '会员内容' }]
      };
      const result = formatWeeklySummaryForMembership(payload, false);
      expect(result.premiumUnlocked).toBe(false);
      expect(result.concerns).toHaveLength(1);
      expect(result.trendItems).toHaveLength(1);
      expect(result.concernsFull).toBeUndefined();
      expect(result.nextActionsFull).toBeUndefined();
      expect(result.recommendedContentPremium).toBeUndefined();
    }
  });
});
