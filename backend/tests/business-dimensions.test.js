const dimensions = require('../src/shared/business-dimensions');
const {
  BusinessFieldValidationError,
  normalizeAgeSegmentCodes,
  normalizeAbilityCodes,
  normalizeBusinessFields,
  validateBusinessFields
} = require('../src/shared/business-fields');

describe('统一业务字典与字段转换', () => {
  it('解析标准代码、标签、别名和历史宽年龄段', () => {
    expect(normalizeAgeSegmentCodes('age_3_4')).toEqual(['age_3_4']);
    expect(normalizeAgeSegmentCodes('3-4岁')).toEqual(['age_3_4']);
    expect(normalizeAgeSegmentCodes('4-6岁')).toEqual(['age_4_5', 'age_5_6']);
    expect(normalizeAbilityCodes(['专注力', '感觉统合'])).toEqual(['attention', 'sensory_motor']);
  });

  it.each([
    [0, 'age_0_1'],
    [11.999, 'age_0_1'],
    [12, 'age_1_2'],
    [35.999, 'age_2_3'],
    [36, 'age_3_4'],
    [143.999, 'age_9_12']
  ])('月龄 %s 映射到 %s', (months, expectedCode) => {
    expect(dimensions.resolveAgeSegmentByMonths(months).code).toBe(expectedCode);
  });

  it('拒绝未知值和越界月龄', () => {
    expect(() => normalizeAgeSegmentCodes('三到四岁左右')).toThrow(BusinessFieldValidationError);
    expect(() => normalizeAbilityCodes(['专注力', '未知能力'])).toThrow(BusinessFieldValidationError);
    expect(dimensions.resolveAgeSegmentByMonths(-1)).toBeNull();
    expect(dimensions.resolveAgeSegmentByMonths(144)).toBeNull();
  });

  it('把旧业务字段转换为统一字段', () => {
    expect(normalizeBusinessFields({
      child_id: '42',
      age_group: '4-6岁',
      ability_labels: '注意力、感统',
      source: 'daily_plan',
      event_time: '2026-08-21T10:00:00+08:00',
      data_version: 'v2'
    })).toEqual({
      childId: 42,
      ageSegmentCodes: ['age_4_5', 'age_5_6'],
      abilityCodes: ['attention', 'sensory_motor'],
      sourceType: 'training',
      occurredAt: '2026-08-21T02:00:00.000Z',
      schemaVersion: 2
    });
  });

  it('校验必填业务字段', () => {
    expect(() => validateBusinessFields({ childId: 1 }, ['childId', 'occurredAt']))
      .toThrow('Missing required business field: occurredAt');
  });
});
