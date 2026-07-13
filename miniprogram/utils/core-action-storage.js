var STORAGE_KEY = 'coreActionRecords';
var MAX_RECORDS = 50;

function getWxStorage() {
  if (typeof wx === 'undefined') {
    return null;
  }
  return wx;
}

function normalizeRecords(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(function(item) {
    return item && typeof item === 'object' && item.id;
  }).map(function(item) {
    return Object.assign({}, item);
  });
}

function readRecords() {
  var storage = getWxStorage();
  if (!storage || typeof storage.getStorageSync !== 'function') {
    return [];
  }
  try {
    return normalizeRecords(storage.getStorageSync(STORAGE_KEY));
  } catch (err) {
    return [];
  }
}

function writeRecords(records) {
  var storage = getWxStorage();
  if (!storage || typeof storage.setStorageSync !== 'function') {
    return false;
  }
  try {
    storage.setStorageSync(STORAGE_KEY, normalizeRecords(records).slice(0, MAX_RECORDS));
    return true;
  } catch (err) {
    return false;
  }
}

function sortByCreatedAtDesc(records) {
  return normalizeRecords(records).sort(function(a, b) {
    return Number(b.createdAt || 0) - Number(a.createdAt || 0);
  });
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(function(item) {
    return item !== null && item !== undefined && String(item).trim();
  }).map(function(item) {
    return String(item).trim();
  });
}

function normalizeString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function buildSevenDayPlanDraft(actionResult, timestamp) {
  var baseTitle = actionResult && actionResult.actionTitle ? actionResult.actionTitle : '今晚先做一个小步骤';
  var sceneLabel = actionResult && actionResult.sceneLabel ? actionResult.sceneLabel : '这个场景';
  var firstSteps = Array.isArray(actionResult && actionResult.actionSteps) ? actionResult.actionSteps : [];
  var dayMs = 86400000;
  var templates = [
    { title: baseTitle, desc: '先完成今晚第一步，记录孩子最明显的反应。', steps: firstSteps },
    { title: '继续同一个开头', desc: '保持昨天最容易开始的动作，只观察孩子是否更愿意。', steps: ['沿用昨天的第一步。', '中间只提醒一次。', '结束后记下一个变化。'] },
    { title: '把目标缩到更稳', desc: '围绕' + sceneLabel + '保留一个小目标，减少新的要求。', steps: ['只做最容易的一个动作。', '孩子抗拒时先停一下。', '完成一点就结束。'] },
    { title: '增加一个小选择', desc: '给孩子一点选择感，让行动更容易发生。', steps: ['给两个可接受选项。', '让孩子自己选一个。', '只完成选中的那一步。'] },
    { title: '观察哪一步最有效', desc: '比较这几天孩子在哪个动作上更容易配合。', steps: ['重复最顺的一步。', '观察开始速度。', '记录更顺或更抗拒。'] },
    { title: '稳定家庭小流程', desc: '把有效做法固定到同一时间和同一句提醒里。', steps: ['放到固定时间。', '只说同一句提醒。', '完成后给一句具体肯定。'] },
    { title: '周末看一次变化', desc: '回看 7 天记录，决定下周继续、缩小还是换一步。', steps: ['看孩子最顺的一天。', '看最卡的一步。', '选下周继续的小动作。'] }
  ];
  return templates.map(function(item, index) {
    return {
      day: index + 1,
      planDate: formatDate(timestamp + index * dayMs),
      title: item.title,
      desc: item.desc,
      steps: item.steps || []
    };
  });
}

function formatDate(timestamp) {
  var date = new Date(Number(timestamp) || Date.now());
  var monthNumber = date.getMonth() + 1;
  var dayNumber = date.getDate();
  var month = monthNumber < 10 ? '0' + monthNumber : String(monthNumber);
  var day = dayNumber < 10 ? '0' + dayNumber : String(dayNumber);
  return date.getFullYear() + '-' + month + '-' + day;
}

function saveTonightAction(actionResult, now) {
  if (!actionResult || !actionResult.id) {
    return { success: false, record: null, records: readRecords() };
  }
  var timestamp = Number(now) || Date.now();
  var records = readRecords().filter(function(item) {
    return item.id !== actionResult.id;
  });
  var record = Object.assign({}, actionResult, {
    categoryKey: normalizeString(actionResult.categoryKey),
    categoryLabel: normalizeString(actionResult.categoryLabel),
    focusAreas: normalizeStringArray(actionResult.focusAreas),
    abilityTags: normalizeStringArray(actionResult.abilityTags),
    observableSigns: normalizeStringArray(actionResult.observableSigns),
    actionSteps: normalizeStringArray(actionResult.actionSteps),
    saved: true,
    completed: false,
    savedAt: timestamp,
    updatedAt: timestamp,
    sevenDayPlanDraft: actionResult.sevenDayPlanDraft || buildSevenDayPlanDraft(actionResult, timestamp)
  });
  records.unshift(record);
  records = sortByCreatedAtDesc(records).slice(0, MAX_RECORDS);
  return {
    success: writeRecords(records),
    record: record,
    records: records
  };
}

function getCoreActionRecords() {
  return sortByCreatedAtDesc(readRecords());
}

function getLatestCoreAction() {
  return getCoreActionRecords()[0] || null;
}

function updateActionEffect(recordId, effect, now) {
  var id = String(recordId || '').trim();
  var timestamp = Number(now) || Date.now();
  var records = readRecords();
  var updatedRecord = null;
  var nextRecords = records.map(function(item) {
    if (item.id !== id) {
      return item;
    }
    updatedRecord = Object.assign({}, item, {
      effectKey: String((effect && effect.key) || effect || '').trim(),
      effectLabel: String((effect && effect.label) || '').trim(),
      effectNote: String((effect && effect.note) || '').trim(),
      completed: true,
      recordedAt: timestamp,
      updatedAt: timestamp
    });
    return updatedRecord;
  });
  if (!updatedRecord) {
    return { success: false, record: null, records: sortByCreatedAtDesc(records) };
  }
  nextRecords = sortByCreatedAtDesc(nextRecords);
  return {
    success: writeRecords(nextRecords),
    record: updatedRecord,
    records: nextRecords
  };
}

function getContinuousRecordCount(now) {
  var current = new Date(Number(now) || Date.now());
  current.setHours(0, 0, 0, 0);
  var completedDayMap = {};
  getCoreActionRecords().forEach(function(item) {
    var time = Number(item.recordedAt || 0);
    if (!item.completed || !time) {
      return;
    }
    var day = new Date(time);
    day.setHours(0, 0, 0, 0);
    completedDayMap[day.getTime()] = true;
  });

  var count = 0;
  while (completedDayMap[current.getTime()]) {
    count += 1;
    current.setDate(current.getDate() - 1);
  }
  return count;
}

module.exports = {
  STORAGE_KEY: STORAGE_KEY,
  getCoreActionRecords: getCoreActionRecords,
  getLatestCoreAction: getLatestCoreAction,
  getContinuousRecordCount: getContinuousRecordCount,
  readRecords: readRecords,
  saveTonightAction: saveTonightAction,
  updateActionEffect: updateActionEffect
};
