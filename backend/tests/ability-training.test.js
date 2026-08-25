const {
  AGE_GROUPS,
  OBSERVATION_CONFIG,
  validateObservationSubmission,
  buildAbilityProfile,
  buildTrainingTasks,
  normalizeFeedbackKey,
  isPlanExpired,
  assertChildOwnership,
  normalizeTrainingAssignment,
  hasUniqueTrainingAssignments,
  normalizeDailyPlanPayload
} = require('../src/mysql-production/ability-training');

describe('能力观察和训练领域服务', () => {
  const answers = OBSERVATION_CONFIG.questions.map((question, index) => ({ questionId: question.id, value: index % 4 }));

  test('只接受3-6岁标准年龄和至少一个非空表现', () => {
    expect(AGE_GROUPS).toEqual(['3-4岁', '4-5岁', '5-6岁']);
    expect(validateObservationSubmission({ childId: 1, ageGroup: '3-4岁', answers: [] }).valid).toBe(false);
    expect(validateObservationSubmission({ childId: 1, ageGroup: '6岁以上', answers }).valid).toBe(false);
    expect(validateObservationSubmission({ childId: 1, ageGroup: '3-4岁', answers }).valid).toBe(true);
  });

  test('重复题目、非法选项和空输入都会被拒绝', () => {
    expect(validateObservationSubmission({ childId: 1, ageGroup: '3-4岁', answers: [{ questionId: 'attention_start', value: 1 }, { questionId: 'attention_start', value: 1 }] }).message).toMatch(/重复/);
    expect(validateObservationSubmission({ childId: 1, ageGroup: '3-4岁', answers: [{ questionId: 'attention_start', value: 4 }] }).message).toMatch(/0到3/);
    expect(validateObservationSubmission({ childId: 1, ageGroup: '3-4岁', answers: [{ questionId: 'unknown', value: 1 }] }).message).toMatch(/无效/);
  });

  test('能力画像保存所需字段和主关注方向稳定生成', () => {
    const profile = buildAbilityProfile({ childId: 9, ageGroup: '4-5岁', answers });
    expect(profile).toEqual(expect.objectContaining({ assessmentVersion: 1, abilityDomain: expect.any(String), primaryFocus: expect.any(String) }));
    expect(profile.dimensionScores).toEqual(expect.objectContaining({ attention: expect.any(Number), sensory_motor: expect.any(Number) }));
    expect(profile.notice).toMatch(/不替代/);
  });

  test('3天、7天和30天计划都生成完整任务，训练任务保持能力方向', () => {
    const profile = { primaryFocus: 'attention' };
    [3, 7, 30].forEach((duration) => {
      const tasks = buildTrainingTasks(profile, duration);
      expect(tasks).toHaveLength(duration);
      expect(tasks[0]).toEqual(expect.objectContaining({ dayIndex: 1, domain: 'attention', steps: expect.any(Array), parentPrompt: expect.any(String) }));
    });
  });

  test('反馈枚举、跨孩子归属和过期计划规则可验证', () => {
    expect(normalizeFeedbackKey('smooth')).toBe('smooth');
    expect(normalizeFeedbackKey('')).toBe('');
    expect(assertChildOwnership(3, 3)).toBe(true);
    expect(assertChildOwnership(3, 4)).toBe(false);
    expect(isPlanExpired('2026-08-20', new Date('2026-08-21T08:00:00Z'))).toBe(true);
    expect(isPlanExpired('2026-08-21', new Date('2026-08-21T08:00:00Z'))).toBe(false);
  });

  test('训练任务必须同时具备唯一孩子、计划和能力方向', () => {
    expect(normalizeTrainingAssignment({ id: 1, childId: 2, planId: 3, abilityDomain: 'attention' })).toEqual({ taskId: 1, childId: 2, planId: 3, abilityDomain: 'attention' });
    expect(normalizeTrainingAssignment({ id: 1, childId: 2, planId: 3, abilityDomain: 'unknown' })).toBeNull();
    expect(hasUniqueTrainingAssignments([
      { id: 1, childId: 2, planId: 3, abilityDomain: 'attention' },
      { id: 1, childId: 4, planId: 3, abilityDomain: 'attention' }
    ])).toBe(false);
  });

  test('每日计划统一返回就绪、空态和降级字段', () => {
    expect(normalizeDailyPlanPayload({ child_id: 2, date: '2026-08-21', cards: [{ id: 1 }] })).toEqual(expect.objectContaining({ childId: 2, planDate: '2026-08-21', empty: false, degraded: false, dataStatus: 'ready' }));
    expect(normalizeDailyPlanPayload({ childId: 2, cards: [] }, { dataStatus: 'empty', message: '暂无计划' })).toEqual(expect.objectContaining({ empty: true, degraded: false, dataStatus: 'empty', message: '暂无计划' }));
    expect(normalizeDailyPlanPayload({ cards: [{ id: 'fallback' }] }, { degraded: true, degradationReason: 'remote_plan_unavailable' })).toEqual(expect.objectContaining({ empty: false, degraded: true, dataStatus: 'degraded', degradationReason: 'remote_plan_unavailable' }));
  });
});
