const { hasUniqueTrainingAssignments } = require('../src/mysql-production/ability-training');

describe('训练归属唯一性属性', () => {
  test('任意合法任务只对应一个孩子、一个计划和一个能力方向', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const childId = (seed % 17) + 1;
      const planId = (seed % 31) + 1;
      const abilityDomain = seed % 2 ? 'attention' : 'sensory_motor';
      const task = { id: seed, childId, planId, abilityDomain };
      expect(hasUniqueTrainingAssignments([task, Object.assign({}, task)])).toBe(true);
      expect(hasUniqueTrainingAssignments([task, Object.assign({}, task, { childId: childId + 100 })])).toBe(false);
      expect(hasUniqueTrainingAssignments([task, Object.assign({}, task, { planId: planId + 100 })])).toBe(false);
      expect(hasUniqueTrainingAssignments([task, Object.assign({}, task, { abilityDomain: abilityDomain === 'attention' ? 'sensory_motor' : 'attention' })])).toBe(false);
    }
  });
});
