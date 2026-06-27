var ASSESSMENT_CODE_MAP = {
  attention: 'focus',
  multiple: 'multi_intelligence'
};

var ASSESSMENT_META = {
  sensory: {
    icon: '🧠',
    name: '儿童感觉统合能力发展评定量表',
    shortName: '感统观察',
    desc: '58题评估前庭、触觉、本体感和学习相关表现',
    count: 58,
    duration: 15,
    ageGroups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁']
  },
  focus: {
    icon: '💡',
    name: '专注力观察',
    shortName: '专注力观察',
    desc: '了解孩子注意力集中、持续和抗干扰表现',
    count: 25,
    duration: 12,
    ageGroups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁']
  },
  adhd: {
    icon: '📝',
    name: 'ADHD风险观察筛查',
    shortName: 'ADHD风险观察筛查',
    desc: '观察注意力、多动和冲动相关表现，仅作风险提示',
    count: 18,
    duration: 10,
    ageGroups: ['4-6岁', '6-9岁', '9-12岁']
  },
  multi_intelligence: {
    icon: '🎨',
    name: '多元智能观察',
    shortName: '多元智能观察',
    desc: '发现孩子优势智能领域',
    count: 40,
    duration: 20,
    ageGroups: ['3-6岁', '6-9岁', '9-12岁']
  },
  emotion: {
    icon: '🤗',
    name: '情绪能力观察',
    shortName: '情绪能力观察',
    desc: '了解孩子情绪识别、表达和调节表现',
    count: 22,
    duration: 12,
    ageGroups: ['3-6岁', '6-9岁', '9-12岁']
  },
  learning: {
    icon: '📚',
    name: '学习适应观察',
    shortName: '学习适应观察',
    desc: '了解孩子学习适应与准备情况',
    count: 35,
    duration: 18,
    ageGroups: ['6-9岁', '9-12岁']
  },
  gross_motor: {
    icon: '🦵',
    name: '大运动发育观察',
    shortName: '大运动发育观察',
    desc: '观察抬头、翻身、坐爬、站立、行走和跑跳等里程碑表现',
    count: 20,
    duration: 8,
    ageGroups: ['0-1岁', '1-2岁', '2-3岁']
  },
  fine_motor: {
    icon: '✋',
    name: '精细动作观察',
    shortName: '精细动作观察',
    desc: '观察抓握、捏取、双手配合、涂鸦和工具使用等精细动作表现',
    count: 18,
    duration: 8,
    ageGroups: ['0-1岁', '1-2岁', '2-3岁']
  },
  language_dev: {
    icon: '🗣️',
    name: '语言发育观察',
    shortName: '语言发育观察',
    desc: '观察发音、词汇理解、表达需求和句式发展等语言表现',
    count: 22,
    duration: 10,
    ageGroups: ['0-1岁', '1-2岁', '2-3岁']
  },
  social_emotion: {
    icon: '🥰',
    name: '社交情绪观察',
    shortName: '社交情绪观察',
    desc: '观察微笑回应、依恋表现、模仿互动和情绪表达等发展表现',
    count: 20,
    duration: 8,
    ageGroups: ['0-1岁', '1-2岁', '2-3岁']
  }
};

function normalizeAssessmentCode(code) {
  return ASSESSMENT_CODE_MAP[code] || code;
}

function getAssessmentMeta(code) {
  return ASSESSMENT_META[normalizeAssessmentCode(code)] || null;
}

function getAssessmentMetaList() {
  return Object.keys(ASSESSMENT_META).map(function(code) {
    return Object.assign({ code: code }, ASSESSMENT_META[code]);
  });
}

function getAgeBounds(ageGroup) {
  var text = String(ageGroup || '');
  var numbers = text.match(/\d+/g) || [];
  if (numbers.length === 0) {
    return null;
  }
  if (text.indexOf('个月') >= 0) {
    var minMonth = parseInt(numbers[0], 10);
    var maxMonth = parseInt(numbers[numbers.length - 1], 10);
    return { min: minMonth / 12, max: maxMonth / 12 };
  }
  var min = parseInt(numbers[0], 10);
  var max = numbers.length > 1 ? parseInt(numbers[1], 10) : min + 1;
  return { min: min, max: max };
}

function ageGroupMatches(assessmentAgeGroup, selectedAgeGroup) {
  if (assessmentAgeGroup === selectedAgeGroup) {
    return true;
  }
  var assessmentBounds = getAgeBounds(assessmentAgeGroup);
  var selectedBounds = getAgeBounds(selectedAgeGroup);
  if (!assessmentBounds || !selectedBounds) {
    return false;
  }
  var midpoint = (selectedBounds.min + selectedBounds.max) / 2;
  return midpoint >= assessmentBounds.min && midpoint < assessmentBounds.max;
}

function getChildAgeYears(child, fallbackAge) {
  if (child && typeof child.age === 'number' && child.age >= 0) {
    return child.age;
  }

  var birthDate = child && (child.birth_date || child.birthday);
  if (!birthDate) {
    return fallbackAge === undefined ? 3 : fallbackAge;
  }

  var birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return fallbackAge === undefined ? 3 : fallbackAge;
  }

  var today = new Date();
  var age = today.getFullYear() - birth.getFullYear();
  var monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age >= 0 ? age : 0;
}

function getDefaultAgeGroup(child, fallbackAgeGroup) {
  var age = getChildAgeYears(child, -1);
  if (age < 0) {
    return fallbackAgeGroup !== undefined ? fallbackAgeGroup : '3-4岁';
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

module.exports = {
  getAssessmentMeta: getAssessmentMeta,
  getAssessmentMetaList: getAssessmentMetaList,
  getChildAgeYears: getChildAgeYears,
  getDefaultAgeGroup: getDefaultAgeGroup,
  normalizeAssessmentCode: normalizeAssessmentCode,
  getAgeBounds: getAgeBounds,
  ageGroupMatches: ageGroupMatches
};
