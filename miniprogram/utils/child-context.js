var PARENTING_AGE_GROUPS = ['2-3岁', '3-4岁', '4-5岁', '5-6岁', '6-9岁'];

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter(function(item) {
      return typeof item === 'string' && item.trim();
    }).map(function(item) {
      return item.trim();
    });
  }
  if (typeof value === 'string') {
    var text = value.trim();
    if (!text) {
      return [];
    }
    try {
      var parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return normalizeStringArray(parsed);
      }
    } catch (err) {
      // Fall through to delimiter splitting.
    }
    return text.split(/[、,，\s]+/).filter(function(item) {
      return item && item.trim();
    }).map(function(item) {
      return item.trim();
    });
  }
  return [];
}

function calculateAgeYears(birthday, now) {
  var value = String(birthday || '').trim();
  if (!value) {
    return null;
  }
  var birthDate = new Date(value + 'T00:00:00');
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }
  var current = now instanceof Date ? now : new Date();
  return Math.max(0, Math.floor((current.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)));
}

function normalizeExplicitAgeGroup(value) {
  var text = String(value || '').trim();
  if (!text) {
    return '';
  }
  if (/^\d+-\d+岁$/.test(text)) {
    return text;
  }
  var ageMatch = text.match(/(\d+(?:\.\d+)?)\s*岁/);
  if (!ageMatch) {
    return text;
  }
  var age = Number(ageMatch[1]);
  if (!Number.isFinite(age) || age < 0) {
    return '';
  }
  if (age < 1) return '0-1岁';
  if (age < 2) return '1-2岁';
  if (age < 3) return '2-3岁';
  if (age < 4) return '3-4岁';
  if (age < 5) return '4-5岁';
  if (age < 6) return '5-6岁';
  if (age < 9) return '6-9岁';
  return '9-12岁';
}

function normalizeChatAgeGroup(child, now) {
  child = child || {};
  var directAgeGroup = String(child.ageGroup || child.age_group || child.age_range || '').trim();
  if (directAgeGroup) {
    return normalizeExplicitAgeGroup(directAgeGroup);
  }
  var birthday = String(child.birthday || child.birth_date || '').trim();
  var ageYears = calculateAgeYears(birthday, now);
  if (ageYears === null) {
    return '';
  }
  if (ageYears < 1) return '0-1岁';
  if (ageYears < 2) return '1-2岁';
  if (ageYears < 3) return '2-3岁';
  if (ageYears < 4) return '3-4岁';
  if (ageYears < 5) return '4-5岁';
  if (ageYears < 6) return '5-6岁';
  if (ageYears < 9) return '6-9岁';
  return '9-12岁';
}

function inferParentingAgeGroup(child, now) {
  var ageGroup = normalizeChatAgeGroup(child, now);
  return PARENTING_AGE_GROUPS.indexOf(ageGroup) >= 0 ? ageGroup : '';
}

function buildChildChatContext(child, now) {
  if (!child) {
    return null;
  }
  var item = Object.assign({}, child || {});
  var tags = normalizeStringArray(item.tags || item.personality_tags || item.trait_tags);
  var concerns = normalizeStringArray(item.concerns || item.focus_points || item.parenting_concerns || item.goals);
  return {
    id: item.id || item.child_id || '',
    name: String(item.name || item.nickname || '').trim(),
    birthday: String(item.birthday || item.birth_date || '').trim(),
    age_group: normalizeChatAgeGroup(item, now),
    tags: tags,
    concerns: concerns,
    source: item.source || 'current_child'
  };
}

function buildParentingRecommendation(child, now) {
  var ageGroup = inferParentingAgeGroup(child, now);
  var name = String((child && (child.name || child.nickname)) || '').trim();
  if (ageGroup) {
    return {
      ageGroup: ageGroup,
      label: name ? '先按' + name + '的年龄挑几篇' : '先按孩子年龄挑几篇',
      fallback: ''
    };
  }
  return {
    ageGroup: '',
    label: '',
    fallback: child && (child.id || child.name || child.nickname)
      ? '填完生日后，会先看适合这个年龄的。'
      : '填完孩子信息后，会少一些泛泛的推荐。'
  };
}

function resolveArticleListInitialAgeFilter(options, ageList, recommendation) {
  options = options || {};
  ageList = Array.isArray(ageList) ? ageList : [];
  recommendation = recommendation || { ageGroup: '', label: '', fallback: '' };
  var explicitAgeGroup = String(options.age_group || options.ageGroup || options.age || '').trim();
  var ageGroup = explicitAgeGroup ? decodeURIComponent(explicitAgeGroup) : recommendation.ageGroup;
  var ageIndex = ageList.findIndex(function(item) {
    return item && item.name === ageGroup;
  });
  return {
    currentAge: ageIndex > 0 ? ageIndex : 0,
    recommendationLabel: ageIndex > 0 && !explicitAgeGroup ? recommendation.label : '',
    recommendationFallback: ageIndex > 0 ? '' : recommendation.fallback,
    userSelectedAge: !!explicitAgeGroup
  };
}

module.exports = {
  PARENTING_AGE_GROUPS: PARENTING_AGE_GROUPS,
  normalizeStringArray: normalizeStringArray,
  calculateAgeYears: calculateAgeYears,
  normalizeExplicitAgeGroup: normalizeExplicitAgeGroup,
  normalizeChatAgeGroup: normalizeChatAgeGroup,
  inferParentingAgeGroup: inferParentingAgeGroup,
  buildChildChatContext: buildChildChatContext,
  buildParentingRecommendation: buildParentingRecommendation,
  resolveArticleListInitialAgeFilter: resolveArticleListInitialAgeFilter
};
