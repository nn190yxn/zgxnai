var STATUS_TEXT = {
  pending: '已收到',
  processing: '处理中',
  pending_callback: '等待回访',
  closed: '已完成'
};

function canSubmitFeedback(content, callbackRequested, contact) {
  if (String(content || '').trim().length < 5) {
    return false;
  }
  return !callbackRequested || !!String(contact || '').trim();
}

function normalizeHistory(list) {
  return (Array.isArray(list) ? list : []).map(function(item) {
    var status = item && (item.public_status || item.status) || 'pending';
    return Object.assign({}, item, {
      status_text: STATUS_TEXT[status] || '处理中',
      callback_requested: !!(item && (item.callback_requested || item.channel === 'callback_request'))
    });
  });
}

function normalizeDeviceInfo(info) {
  var source = info || {};
  return {
    platform: String(source.platform || '').slice(0, 32),
    system: String(source.system || '').slice(0, 64),
    version: String(source.version || '').slice(0, 32),
    model: String(source.model || '').slice(0, 64),
    brand: String(source.brand || '').slice(0, 32),
    SDKVersion: String(source.SDKVersion || '').slice(0, 32),
    screenWidth: Number(source.screenWidth) || 0,
    screenHeight: Number(source.screenHeight) || 0
  };
}

module.exports = {
  canSubmitFeedback: canSubmitFeedback,
  normalizeHistory: normalizeHistory,
  normalizeDeviceInfo: normalizeDeviceInfo
};
