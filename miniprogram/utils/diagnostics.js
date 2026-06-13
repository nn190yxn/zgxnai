// 原生API诊断工具
function installNativeApiDiagnostics(app) {
  if (!app.globalData.enableNativeApiDiagnostics || wx.__gantuNativeApiDiagnosticsInstalled) {
    return;
  }
  wx.__gantuNativeApiDiagnosticsInstalled = true;
  wx.__gantuPendingApiCalls = {};
  wx.__gantuLastPendingApi = null;

  ['login', 'chooseMedia', 'uploadFile', 'navigateTo', 'redirectTo', 'switchTab', 'navigateBack', 'request'].forEach(function(apiName) {
    var original = wx[apiName];
    if (typeof original !== 'function') {
      return;
    }

    wx[apiName] = function(options) {
      var callId = apiName + '_' + Date.now();
      var startedAt = Date.now();
      var hasOptions = options && typeof options === 'object';
      var nextOptions = hasOptions ? Object.assign({}, options) : {};
      wx.__gantuPendingApiCalls[callId] = { api: apiName, startedAt: startedAt, url: nextOptions.url || '' };
      var pendingTimer = setTimeout(function() {
        wx.__gantuLastPendingApi = {
          api: apiName,
          callId: callId,
          elapsedMs: Date.now() - startedAt,
          url: nextOptions.url || '',
          timeout: nextOptions.timeout || ''
        };
        console.warn('[wx-api:pending]', {
          api: apiName,
          callId: callId,
          elapsedMs: Date.now() - startedAt,
          url: nextOptions.url || '',
          timeout: nextOptions.timeout || ''
        });
      }, 8000);

      console.log('[wx-api:start]', {
        api: apiName,
        callId: callId,
        url: nextOptions.url || '',
        timeout: nextOptions.timeout || ''
      });

      ['success', 'fail', 'complete'].forEach(function(callbackName) {
        var originalCallback = nextOptions[callbackName];
        nextOptions[callbackName] = function(res) {
          clearTimeout(pendingTimer);
          delete wx.__gantuPendingApiCalls[callId];
          if (wx.__gantuLastPendingApi && wx.__gantuLastPendingApi.callId === callId) {
            wx.__gantuLastPendingApi = null;
          }
          console.log('[wx-api:' + callbackName + ']', {
            api: apiName,
            callId: callId,
            elapsedMs: Date.now() - startedAt,
            errMsg: res && res.errMsg
          });
          if (typeof originalCallback === 'function') {
            originalCallback(res);
          }
        };
      });

      try {
        return original.call(wx, hasOptions ? nextOptions : options);
      } catch (err) {
        clearTimeout(pendingTimer);
        delete wx.__gantuPendingApiCalls[callId];
        if (wx.__gantuLastPendingApi && wx.__gantuLastPendingApi.callId === callId) {
          wx.__gantuLastPendingApi = null;
        }
        console.error('[wx-api:throw]', {
          api: apiName,
          callId: callId,
          elapsedMs: Date.now() - startedAt,
          error: err
        });
        throw err;
      }
    };
  });
}

module.exports = {
  installNativeApiDiagnostics: installNativeApiDiagnostics
};
