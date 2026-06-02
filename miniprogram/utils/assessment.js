var ASSESSMENT_CODE_MAP = {
  attention: 'focus',
  multiple: 'multi_intelligence'
};

function normalizeAssessmentCode(code) {
  return ASSESSMENT_CODE_MAP[code] || code;
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

module.exports = {
  normalizeAssessmentCode: normalizeAssessmentCode,
  getAgeBounds: getAgeBounds,
  ageGroupMatches: ageGroupMatches
};
