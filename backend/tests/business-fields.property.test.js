const dimensions = require('../src/shared/business-dimensions');
const {
  normalizeAgeSegmentCodes,
  normalizeAbilityCodes
} = require('../src/shared/business-fields');

function acceptedValues(items) {
  return items.flatMap((item) => [item.code, item.label, ...(item.aliases || [])]);
}

describe('属性：标准维度闭包', () => {
  it('任意可接受年龄值只产生标准年龄代码', () => {
    const standardCodes = new Set(dimensions.getAgeSegments().map((item) => item.code));
    const values = acceptedValues(dimensions.getAgeSegments()).concat(['4-6岁', '4-6', '6+', '6岁以上']);

    for (const value of values) {
      const resolved = normalizeAgeSegmentCodes(value);
      expect(resolved.length).toBeGreaterThan(0);
      expect(resolved.every((code) => standardCodes.has(code))).toBe(true);
    }
  });

  it('任意可接受能力值只产生标准能力代码', () => {
    const abilities = dimensions.getAbilities();
    const standardCodes = new Set(abilities.map((item) => item.code));

    for (const value of acceptedValues(abilities)) {
      const resolved = normalizeAbilityCodes(value);
      expect(resolved.length).toBeGreaterThan(0);
      expect(resolved.every((code) => standardCodes.has(code))).toBe(true);
    }
  });

  it('任意月龄映射结果都属于标准年龄代码', () => {
    const standardCodes = new Set(dimensions.getAgeSegments().map((item) => item.code));
    for (let months = 0; months < 144; months += 0.25) {
      expect(standardCodes.has(dimensions.resolveAgeSegmentByMonths(months).code)).toBe(true);
    }
  });
});
