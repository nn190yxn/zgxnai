function buildMissingAgeDailyPlanCards(child, planDate) {
  return [
    {
      slotIndex: 0,
      planType: 'child_profile',
      title: '先补孩子生日，再看今日建议',
      reasonText: '缺少年龄时，首页不会再按某个年龄段乱推内容。',
      actionText: '去补充',
      summaryText: '填完生日后，建议会按孩子当前阶段来。',
      durationMinutes: 2,
      targetType: 'child_profile',
      targetId: String(child && child.id ? child.id : 'child_profile_setup'),
      targetPath: '/pages/profile/child-edit/child-edit',
      sourceKey: 'missing_child_age',
      score: 100,
      planDate,
      childId: child && child.id ? child.id : 0
    },
    {
      slotIndex: 1,
      planType: 'habit_reminder',
      title: '今天先做一次成长观察',
      reasonText: '先看清孩子最近卡在哪一步，再决定怎么陪。',
      actionText: '去观察',
      summaryText: '从专注、表达、情绪或习惯里选一个先看。',
      durationMinutes: 3,
      targetType: 'assessment',
      targetId: 'assessment_entry',
      targetPath: '/pages/assessment/assessment',
      sourceKey: 'missing_age_assessment',
      score: 90,
      planDate,
      childId: child && child.id ? child.id : 0
    },
    {
      slotIndex: 2,
      planType: 'parenting_home',
      title: '去育儿锦囊，按场景找办法',
      reasonText: '先按场景看，不用先选年龄段。',
      actionText: '去看看',
      summaryText: '情绪、习惯、认知、社交、营养，都可以从这里找。',
      durationMinutes: 5,
      targetType: 'parenting_home',
      targetId: 'parenting_home',
      targetPath: '/pages/parenting/parenting',
      sourceKey: 'missing_age_parenting',
      score: 80,
      planDate,
      childId: child && child.id ? child.id : 0
    }
  ];
}

function normalizeLegacyDailyPlanText(type, title, reason, summary) {
  let normalizedTitle = title || '';
  let normalizedReason = reason || '';
  let normalizedSummary = summary || '';
  if (normalizedTitle.indexOf('再读一篇：') === 0) {
    normalizedTitle = normalizedTitle.replace('再读一篇：', '这篇也许用得上：');
  }
  if (normalizedReason === '你最近已经在看内容，这一篇更适合直接转成家庭做法。') {
    normalizedReason = '你最近常看这类，今天可以照着试一小步。';
  }
  if (/相关问题更适合今天顺手补一篇方法文。$/.test(normalizedReason)) {
    normalizedReason = normalizedReason.replace('相关问题更适合今天顺手补一篇方法文。', '这类情况，今天可以先看一篇。');
  }
  if (type === 'parenting_article' && normalizedSummary.indexOf('再读一篇') >= 0) {
    normalizedSummary = normalizedSummary.replace(/再读一篇/g, '再看一篇');
  }
  return {
    title: normalizedTitle,
    reason: normalizedReason,
    summary: normalizedSummary
  };
}

module.exports = {
  buildMissingAgeDailyPlanCards,
  normalizeLegacyDailyPlanText
};
