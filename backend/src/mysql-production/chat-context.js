function normalizeChatStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (!text) {
      return [];
    }
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return normalizeChatStringArray(parsed);
      }
    } catch (err) {
      // Fall through to delimiter splitting.
    }
    return text.split(/[、,，\s]+/).map((item) => item.trim()).filter(Boolean).slice(0, 8);
  }
  return [];
}

function buildChatChildContext(childProfile, source, normalizeAgeGroup) {
  const childName = String((childProfile && (childProfile.name || childProfile.nickname)) || '').trim();
  const ageGroup = typeof normalizeAgeGroup === 'function' ? normalizeAgeGroup(childProfile) : '';
  const tags = normalizeChatStringArray(childProfile && (childProfile.tags || childProfile.personality_tags || childProfile.trait_tags));
  const concerns = normalizeChatStringArray(childProfile && (childProfile.concerns || childProfile.focus_points || childProfile.parenting_concerns || childProfile.goals));
  return {
    ageGroup,
    childName,
    tags,
    concerns,
    source,
    profileMissing: false
  };
}

function buildChatChildProfilePromptLine(childContext, ageGroup) {
  const context = childContext || {};
  const parts = [];
  if (context.childName) {
    parts.push(context.childName);
  }
  if (ageGroup || context.ageGroup) {
    parts.push(ageGroup || context.ageGroup);
  }
  if (Array.isArray(context.tags) && context.tags.length) {
    parts.push('特点：' + context.tags.slice(0, 5).join('、'));
  }
  if (Array.isArray(context.concerns) && context.concerns.length) {
    parts.push('家长关注：' + context.concerns.slice(0, 5).join('、'));
  }
  return parts.length ? `孩子档案：${parts.join('；')}` : '';
}

module.exports = {
  normalizeChatStringArray,
  buildChatChildContext,
  buildChatChildProfilePromptLine
};
