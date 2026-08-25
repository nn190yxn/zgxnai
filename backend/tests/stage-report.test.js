const { aggregateStageReport } = require('../src/mysql-production/stage-report');

describe('阶段报告时间线聚合', () => {
  it('训练次数只统计周期内可追溯的训练完成条目', () => {
    const report = aggregateStageReport([
      { entryType: 'training_complete' },
      { entryType: 'training_complete' },
      { entryType: 'training_feedback', metadata: { feedbackKey: 'smooth' } },
      { entryType: 'user_note' }
    ]);

    expect(report.completedTaskCount).toBe(2);
    expect(report.traceableEntryCount).toBe(4);
  });

  it('聚合反馈趋势和观察维度平均分', () => {
    const report = aggregateStageReport([
      { entryType: 'assessment_result', dimensions: { attention: 60, sensory_motor: 80 } },
      { entryType: 'assessment_result', dimensions: { attention: 80 } },
      { entryType: 'training_feedback', metadata: { feedbackKey: 'smooth' } },
      { entryType: 'training_feedback', metadata: { feedback_key: 'smooth' } },
      { entryType: 'training_feedback', metadata: { feedbackKey: 'resisted' } }
    ]);

    expect(report.dimensionScores).toEqual({ attention: 70, sensory_motor: 80 });
    expect(report.feedbackTrend[0]).toEqual({ key: 'smooth', label: '完成顺利', count: 2 });
    expect(report.feedbackTrend[1]).toEqual({ key: 'resisted', label: '有所抗拒', count: 1 });
  });

  it('空时间线返回稳定的空报告', () => {
    expect(aggregateStageReport()).toEqual({
      completedTaskCount: 0,
      feedbackCount: 0,
      feedbackCounts: {},
      feedbackTrend: [],
      observationCount: 0,
      dimensionScores: {},
      traceableEntryCount: 0
    });
  });

  it('忽略非训练完成记录，保持报告次数可追溯', () => {
    const entries = [];
    for (let index = 0; index < 50; index += 1) {
      entries.push({ entryType: index % 2 === 0 ? 'training_complete' : 'training_feedback' });
    }
    expect(aggregateStageReport(entries).completedTaskCount).toBe(25);
  });

  it('限制异常维度分数，避免报告输出越界数据', () => {
    const report = aggregateStageReport([
      { entryType: 'assessment_result', dimensions: { low: -20, high: 180, invalid: 'x' } }
    ]);
    expect(report.dimensionScores).toEqual({ low: 0, high: 100 });
  });
});
