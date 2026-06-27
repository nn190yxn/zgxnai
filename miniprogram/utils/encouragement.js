function normalizeEncouragementLevel(level) {
  var value = Number(level) || 1;
  if (value < 1) return 1;
  if (value > 5) return 5;
  return value;
}

function getEncouragementLevelClass(level) {
  return 'level-' + normalizeEncouragementLevel(level);
}

function buildHomeEncouragementState(retentionState) {
  var data = retentionState || {};
  if (data.show_encouragement !== true || !data.encouragement_message) {
    return { visible: false, message: '', level: 1 };
  }
  return {
    visible: true,
    message: data.encouragement_message || '',
    level: normalizeEncouragementLevel(data.encouragement_level)
  };
}

function hasReadEnough(scrollTop, viewportHeight, pageHeight) {
  var currentScrollTop = Number(scrollTop) || 0;
  var currentViewportHeight = Number(viewportHeight) || 0;
  var currentPageHeight = Number(pageHeight) || 0;
  if (currentScrollTop < 200 || currentViewportHeight <= 0 || currentPageHeight <= 0) {
    return false;
  }
  return currentScrollTop + currentViewportHeight >= currentPageHeight * 0.7;
}

function shouldShowReadingAnnotation(options) {
  var config = options || {};
  var alreadyShown = config.alreadyShown === true;
  var todayCount = Number(config.todayCount) || 0;
  var randomValue = Number(config.randomValue);
  if (alreadyShown || todayCount >= 2) {
    return false;
  }
  if (Number.isNaN(randomValue)) {
    randomValue = 1;
  }
  return randomValue < 0.3;
}

module.exports = {
  normalizeEncouragementLevel: normalizeEncouragementLevel,
  getEncouragementLevelClass: getEncouragementLevelClass,
  buildHomeEncouragementState: buildHomeEncouragementState,
  hasReadEnough: hasReadEnough,
  shouldShowReadingAnnotation: shouldShowReadingAnnotation
};
