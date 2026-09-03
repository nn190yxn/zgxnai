const DEFAULT_CONFIG = Object.freeze({
  entry: {
    title: '会员服务',
    subtitle: '解锁完整成长支持和持续陪伴',
    button_text: '查看会员权益'
  },
  benefits: [
    { key: 'ability_profile', title: '能力画像', description: '更完整地了解孩子当前发展状态' },
    { key: 'weekly_summary', title: '阶段报告', description: '持续查看成长变化和下一步建议' },
    { key: 'training_plan', title: '家庭训练', description: '获得适龄、可执行的家庭练习' }
  ],
  plans: [
    { key: 'month', title: '月会员', description: '灵活体验', sort_order: 1 },
    { key: 'quarter', title: '季会员', description: '连续陪伴', sort_order: 2 },
    { key: 'year', title: '年会员', description: '长期成长支持', sort_order: 3 }
  ]
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeText(value, fallback, maxLength) {
  const text = String(value == null ? fallback : value).trim();
  return text.slice(0, maxLength);
}

function normalizeMembershipConfig(input) {
  const source = input && typeof input === 'object' ? input : {};
  const entry = source.entry && typeof source.entry === 'object' ? source.entry : {};
  const benefits = Array.isArray(source.benefits) ? source.benefits : [];
  const plans = Array.isArray(source.plans) ? source.plans : [];
  const result = {
    entry: {
      title: normalizeText(entry.title, DEFAULT_CONFIG.entry.title, 80),
      subtitle: normalizeText(entry.subtitle, DEFAULT_CONFIG.entry.subtitle, 160),
      button_text: normalizeText(entry.button_text, DEFAULT_CONFIG.entry.button_text, 40)
    },
    benefits: benefits.slice(0, 20).map((item, index) => ({
      key: normalizeText(item && item.key, `benefit_${index + 1}`, 64),
      title: normalizeText(item && item.title, '会员权益', 80),
      description: normalizeText(item && item.description, '', 200)
    })).filter((item) => item.title),
    plans: plans.slice(0, 20).map((item, index) => ({
      key: normalizeText(item && item.key, `plan_${index + 1}`, 64),
      title: normalizeText(item && item.title, '会员套餐', 80),
      description: normalizeText(item && item.description, '', 200),
      sort_order: Number.isFinite(Number(item && item.sort_order)) ? Number(item.sort_order) : index + 1
    })).filter((item) => item.title)
  };
  if (!result.benefits.length) result.benefits = clone(DEFAULT_CONFIG.benefits);
  if (!result.plans.length) result.plans = clone(DEFAULT_CONFIG.plans);
  result.plans.sort((a, b) => a.sort_order - b.sort_order || a.key.localeCompare(b.key));
  return result;
}

function mergeMembershipDisplayConfig(config, plans) {
  const normalized = normalizeMembershipConfig(config);
  const planMap = new Map(normalized.plans.map((item) => [item.key, item]));
  const configuredPlans = (Array.isArray(plans) ? plans : []).map((plan, index) => ({
    ...plan,
    display_title: planMap.get(plan.plan_code || plan.plan_key || plan.key)?.title || plan.title || plan.name || plan.plan_code,
    display_description: planMap.get(plan.plan_code || plan.plan_key || plan.key)?.description || '',
    display_sort_order: planMap.get(plan.plan_code || plan.plan_key || plan.key)?.sort_order ?? index + 1
  }));
  configuredPlans.sort((a, b) => a.display_sort_order - b.display_sort_order);
  return { ...normalized, plans: configuredPlans };
}

function toPayload(value) {
  return JSON.stringify(normalizeMembershipConfig(value));
}

function parsePayload(value) {
  try { return normalizeMembershipConfig(typeof value === 'string' ? JSON.parse(value) : value); } catch (error) { return normalizeMembershipConfig({}); }
}

module.exports = { DEFAULT_CONFIG, normalizeMembershipConfig, mergeMembershipDisplayConfig, toPayload, parsePayload };
