const AGE_GROUPS = Object.freeze(['3-4岁', '4-5岁', '5-6岁']);
const ABILITY_DOMAINS = Object.freeze(['attention', 'sensory_motor']);
const FEEDBACK_KEYS = Object.freeze(['smooth', 'reminder_needed', 'left_early', 'resisted', 'incomplete']);

const OBSERVATION_CONFIG = Object.freeze({
  version: 1,
  boundaryNotice: '本观察用于家庭支持和训练方向参考，不替代医学、心理或发育评估。持续影响生活时请咨询专业人士。',
  domains: [
    { code: 'attention', name: '专注启动与持续', signs: ['能在提醒后开始活动', '能在短时任务中保持参与', '能听完一到两步指令'] },
    { code: 'sensory_motor', name: '感觉运动与身体协调', signs: ['能安全完成跑跳和停下', '能协调双手完成简单操作', '能在变化的活动中调整动作'] }
  ],
  questions: [
    { id: 'attention_start', domain: 'attention', text: '孩子能在提醒后开始一个熟悉的小活动吗？' },
    { id: 'attention_sustain', domain: 'attention', text: '孩子能在 5-10 分钟的小活动中保持参与吗？' },
    { id: 'instruction_follow', domain: 'attention', text: '孩子能听完并完成一到两步指令吗？' },
    { id: 'body_control', domain: 'sensory_motor', text: '孩子在跑、跳、停下或转身时身体控制稳定吗？' },
    { id: 'hand_eye', domain: 'sensory_motor', text: '孩子能协调双手完成搭建、穿插或投接吗？' },
    { id: 'movement_adjust', domain: 'sensory_motor', text: '活动规则变化时，孩子能在提醒下调整动作吗？' }
  ]
});

const TRAINING_LIBRARY = Object.freeze([
  { key: 'focus_start', domain: 'attention', title: '两分钟开始仪式', objective: '练习听到提示后开始一件小事', duration: 5, steps: ['把材料放在孩子面前', '说“准备、开始”并示范第一步', '完成两分钟后一起说出做到了什么'], parentPrompt: '我看到你听到提示后就开始了。', observeSignals: ['是否在一次提醒后开始', '是否能完成两分钟'], safetyNotice: '材料保持无尖角，家长全程陪伴。' },
  { key: 'focus_listen', domain: 'attention', title: '听指令找物品', objective: '练习听完两步指令并按顺序完成', duration: 6, steps: ['先说“拿积木，再放进盒子”', '让孩子复述或直接尝试', '完成后换一个熟悉物品再做一次'], parentPrompt: '你先听清楚，再一步一步来。', observeSignals: ['是否漏掉其中一步', '是否需要重复指令'], safetyNotice: '选择大件、可吞咽风险低的物品。' },
  { key: 'movement_stop', domain: 'sensory_motor', title: '走走停停小游戏', objective: '练习身体启动、停止和方向调整', duration: 8, steps: ['在安全空地设定起点和终点', '听到“走”向前，听到“停”停住', '加入一次绕开软垫的变化'], parentPrompt: '你停得很稳，我们再试一次换方向。', observeSignals: ['能否听到提示后停下', '转身时是否保持平衡'], safetyNotice: '避开台阶、尖角和湿滑地面。' },
  { key: 'movement_hands', domain: 'sensory_motor', title: '双手合作搭一座桥', objective: '练习双手配合和动作计划', duration: 7, steps: ['准备 4-6 个大积木', '先让孩子说准备怎么搭', '搭好后一起轻轻测试是否稳定'], parentPrompt: '你先想好顺序，再用两只手一起完成。', observeSignals: ['是否主动安排步骤', '双手配合是否顺畅'], safetyNotice: '使用大颗粒软质材料，防止误吞。' }
]);

function normalizeAgeGroup(value) {
  const age = String(value || '').trim();
  return AGE_GROUPS.includes(age) ? age : '';
}

function normalizeAnswers(answers) {
  return Array.isArray(answers) ? answers.map((item) => ({
    questionId: String(item && (item.questionId || item.question_id) || '').trim(),
    value: Number(item && item.value),
    note: String(item && item.note || '').trim().slice(0, 500)
  })) : [];
}

function validateObservationSubmission(input) {
  const source = input || {};
  const childId = Number(source.childId || source.child_id);
  const ageGroup = normalizeAgeGroup(source.ageGroup || source.age_group);
  const answers = normalizeAnswers(source.answers);
  if (!Number.isSafeInteger(childId) || childId <= 0) return { valid: false, field: 'childId', message: 'childId必须是正整数' };
  if (!ageGroup) return { valid: false, field: 'ageGroup', message: '3-6岁观察必须选择有效年龄段' };
  if (!answers.length) return { valid: false, field: 'answers', message: '请至少填写一项可观察表现' };
  const questionMap = new Map(OBSERVATION_CONFIG.questions.map((question) => [question.id, question]));
  const seen = new Set();
  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question || seen.has(answer.questionId)) return { valid: false, field: 'answers', message: '题目无效或重复提交' };
    if (!Number.isInteger(answer.value) || answer.value < 0 || answer.value > 3) return { valid: false, field: 'answers', message: '选项值必须为0到3' };
    seen.add(answer.questionId);
  }
  return { valid: true, childId, ageGroup, answers };
}

function buildAbilityProfile(input) {
  const valid = validateObservationSubmission(input);
  if (!valid.valid) throw new Error(valid.message);
  const byDomain = {};
  valid.answers.forEach((answer) => {
    const question = OBSERVATION_CONFIG.questions.find((item) => item.id === answer.questionId);
    if (!byDomain[question.domain]) byDomain[question.domain] = { total: 0, count: 0, signs: [] };
    byDomain[question.domain].total += answer.value;
    byDomain[question.domain].count += 1;
    if (answer.value <= 1) byDomain[question.domain].signs.push(question.text);
  });
  const dimensionScores = {};
  Object.keys(byDomain).forEach((domain) => {
    const item = byDomain[domain];
    dimensionScores[domain] = Math.round((item.total / (item.count * 3)) * 100);
  });
  const primaryFocus = Object.keys(dimensionScores).sort((a, b) => dimensionScores[a] - dimensionScores[b])[0] || 'attention';
  return {
    ageGroup: valid.ageGroup,
    assessmentVersion: OBSERVATION_CONFIG.version,
    abilityDomain: primaryFocus,
    dimensionScores,
    observableSigns: byDomain[primaryFocus] ? byDomain[primaryFocus].signs : [],
    primaryFocus,
    notice: OBSERVATION_CONFIG.boundaryNotice,
    suggestions: primaryFocus === 'attention' ? ['把任务拆成两分钟', '先说步骤再开始', '完成后立即具体表扬'] : ['每天安排短时安全运动', '先示范再让孩子尝试', '记录动作是否越来越稳定']
  };
}

function buildTrainingTasks(profile, durationDays) {
  const days = Number(durationDays) === 3 ? 3 : Number(durationDays) === 30 ? 30 : 7;
  const preferred = TRAINING_LIBRARY.filter((task) => task.domain === profile.primaryFocus);
  const fallback = TRAINING_LIBRARY.filter((task) => task.domain !== profile.primaryFocus);
  const library = preferred.concat(fallback);
  return Array.from({ length: days }, (_, index) => {
    const task = library[index % library.length];
    return Object.assign({}, task, { dayIndex: index + 1, contentVersion: 1 });
  });
}

function normalizeFeedbackKey(value) {
  const key = String(value || '').trim();
  return FEEDBACK_KEYS.includes(key) ? key : '';
}

function isPlanExpired(endDate, now = new Date()) {
  const end = new Date(`${String(endDate || '').slice(0, 10)}T23:59:59`);
  return Number.isNaN(end.getTime()) || end < now;
}

function assertChildOwnership(requestedChildId, ownerChildId) {
  return Number(requestedChildId) > 0 && Number(requestedChildId) === Number(ownerChildId);
}

function normalizeTrainingAssignment(task) {
  const source = task || {};
  const taskId = Number(source.id || source.taskId || source.task_id);
  const childId = Number(source.childId || source.child_id);
  const planId = Number(source.planId || source.plan_id);
  const abilityDomain = String(source.abilityDomain || source.ability_domain || source.domain || '').trim();
  if (!Number.isSafeInteger(taskId) || taskId <= 0) return null;
  if (!Number.isSafeInteger(childId) || childId <= 0) return null;
  if (!Number.isSafeInteger(planId) || planId <= 0) return null;
  if (!ABILITY_DOMAINS.includes(abilityDomain)) return null;
  return { taskId, childId, planId, abilityDomain };
}

function hasUniqueTrainingAssignments(tasks) {
  const assignments = new Map();
  for (const task of Array.isArray(tasks) ? tasks : []) {
    const assignment = normalizeTrainingAssignment(task);
    if (!assignment) return false;
    const current = assignments.get(assignment.taskId);
    if (current && (current.childId !== assignment.childId || current.planId !== assignment.planId || current.abilityDomain !== assignment.abilityDomain)) {
      return false;
    }
    assignments.set(assignment.taskId, assignment);
  }
  return true;
}

function normalizeDailyPlanPayload(payload, options = {}) {
  const source = payload || {};
  const cards = Array.isArray(source.cards) ? source.cards : [];
  const childId = Number(source.childId !== undefined ? source.childId : source.child_id) || 0;
  const planDate = source.planDate || source.date || null;
  const ageSegment = source.ageSegment || source.age_group || '';
  const streakDays = Number(source.streakDays !== undefined ? source.streakDays : source.streak_days) || 0;
  const degraded = options.degraded === true || source.degraded === true;
  const empty = options.empty === true || (!cards.length && !source.card);
  return Object.assign({}, source, {
    childId,
    childName: source.childName || source.child_name || '',
    planDate,
    ageSegment,
    streakDays,
    cards,
    empty,
    degraded,
    degradationReason: options.degradationReason || source.degradationReason || null,
    dataStatus: options.dataStatus || source.dataStatus || (degraded ? 'degraded' : (empty ? 'empty' : 'ready')),
    message: options.message || source.message || ''
  });
}

module.exports = {
  AGE_GROUPS,
  ABILITY_DOMAINS,
  FEEDBACK_KEYS,
  OBSERVATION_CONFIG,
  TRAINING_LIBRARY,
  normalizeAgeGroup,
  normalizeAnswers,
  validateObservationSubmission,
  buildAbilityProfile,
  buildTrainingTasks,
  normalizeFeedbackKey,
  isPlanExpired,
  assertChildOwnership,
  normalizeTrainingAssignment,
  hasUniqueTrainingAssignments,
  normalizeDailyPlanPayload
};
