// 请求封装工具
var envConfig = require('../config/env.js');

function getApiUrl(app, path) {
  var finalUrl = '';
  if (!path) {
    finalUrl = app.globalData.apiBaseUrl;
  } else if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) {
    finalUrl = path;
  } else if (path.indexOf('/api/v1/') === 0) {
    finalUrl = app.globalData.baseUrl + path;
  } else if (path.indexOf('/api/') === 0) {
    finalUrl = app.globalData.baseUrl + path;
  } else if (path.charAt(0) === '/') {
    finalUrl = app.globalData.apiBaseUrl + path;
  } else {
    finalUrl = app.globalData.apiBaseUrl + '/' + path;
  }

  if (finalUrl.indexOf('http://') === 0 && !app.globalData.allowHttpApi) {
    throw new Error('不安全的接口地址：仅允许 HTTPS');
  }
  return finalUrl;
}

function unwrapResponse(payload) {
  if (!payload) {
    return payload;
  }
  if (payload.data !== undefined) {
    return payload.data;
  }
  return payload;
}

function shouldUseMockFallback(app) {
  return !!app.globalData.allowMockFallback && !app.globalData.apiStrictMode;
}

function getApiErrorMessage(err, fallback) {
  var defaultMessage = fallback || '接口请求失败，请稍后重试';
  if (!err) {
    return defaultMessage;
  }

  if (typeof err === 'string') {
    return err;
  }

  if (err.detail && err.detail.error_type === 'AI_SERVICE_UNAVAILABLE') {
    return 'AI服务正在配置或维护中，请稍后再试';
  }

  if (err.error_type === 'AI_SERVICE_UNAVAILABLE') {
    return 'AI服务正在配置或维护中，请稍后再试';
  }

  if (err.detail && err.detail.message) {
    if (err.detail.error_type === 'NOT_FOUND_ERROR' && err.detail.message.indexOf('用户') !== -1) {
      return '账号不存在或已注销，请重新登录';
    }
    return err.detail.message;
  }

  if (err.error_type === 'NOT_FOUND_ERROR' && err.message && err.message.indexOf('用户') !== -1) {
    return '账号不存在或已注销，请重新登录';
  }

  if (err.message) {
    if (err.message.indexOf('当前无网络') !== -1) {
      return '当前无网络，请连接后重试';
    }
    if (err.message.indexOf('timeout') !== -1 || err.message.indexOf('超时') !== -1) {
      return '网络请求超时，请稍后重试';
    }
    if (err.message.indexOf('网络请求失败') !== -1 || err.message.indexOf('request:fail') !== -1) {
      return '网络请求失败，请检查网络后重试';
    }
    return err.message;
  }

  if (err.errMsg) {
    if (err.errMsg.indexOf('timeout') !== -1) {
      return '网络请求超时，请稍后重试';
    }
    if (err.errMsg.indexOf('request:fail') !== -1) {
      return '网络请求失败，请检查网络后重试';
    }
    return err.errMsg;
  }

  if (err.statusCode === 503) {
    return '服务暂时不可用，请稍后再试';
  }
  if (err.statusCode === 401) {
    return '登录状态已过期，请重新进入页面';
  }
  if (err.statusCode === 403) {
    return '当前账号暂无权限访问该内容';
  }
  if (err.statusCode === 404) {
    return '内容暂未找到，请返回后重试';
  }

  return defaultMessage;
}

function showApiError(app, message) {
  var finalMessage = typeof message === 'string'
    ? message
    : getApiErrorMessage(message);
  wx.showToast({
    title: finalMessage || '接口请求失败',
    icon: 'none'
  });
}

function isAuthExpiredResponse(statusCode, payload) {
  var message = '';
  var code = '';
  if (payload) {
    message = payload.message || (payload.detail && payload.detail.message) || '';
    code = payload.code || (payload.detail && payload.detail.code) || '';
  }

  if (statusCode === 401) {
    return true;
  }

  return statusCode === 403 && (
    code === 'TOKEN_EXPIRED' ||
    message.indexOf('访问令牌无效或已过期') !== -1 ||
    message.indexOf('登录状态已过期') !== -1
  );
}

function requiresAuthForPath(path) {
  if (!path || typeof path !== 'string') {
    return false;
  }

  return [
    '/assessments',
    '/children',
    '/daily-plan',
    '/growth-records',
    '/weekly-summary',
    '/education',
    '/membership',
    '/referral',
    '/payment',
    '/chat',
    '/kb/events'
  ].some(function(prefix) {
    return path.indexOf(prefix) === 0;
  });
}

function retryWithFreshAuth(app, options, resolve, reject, fallbackError) {
  var refreshToken = wx.getStorageSync('refreshToken') || app.globalData.refreshToken;
  var authPromise = refreshToken
    ? app.refreshAccessToken()
    : Promise.reject(new Error('missing refresh token'));

  authPromise.then(function() {
    request(app, Object.assign({}, options, { _skipAuthRetry: true })).then(resolve).catch(reject);
  }).catch(function(err) {
    app.logout();
    app.promptLogin('登录状态已失效，请重新登录');
    reject(err || fallbackError || new Error('请求失败'));
  });
}

function request(app, options) {
  return new Promise(function(resolve, reject) {
    var url = options.url;
    var originalPath = options.url;
    var method = options.method || 'GET';
    var data = options.data || {};
    var header = options.header || {};
    var skipAuthRetry = !!options._skipAuthRetry;

    try {
      url = getApiUrl(app, url);
    } catch (err) {
      reject(err);
      return;
    }

    var token = wx.getStorageSync('token');
    if (!token && !skipAuthRetry && requiresAuthForPath(originalPath)) {
      app.ensureLogin().then(function() {
        request(app, Object.assign({}, options, { _skipPreAuth: true })).then(resolve).catch(reject);
      }).catch(function(err) {
        reject(err || new Error('登录失败'));
      });
      return;
    }
    if (token) {
      header['Authorization'] = 'Bearer ' + token;
    }

    wx.request({
      url: url,
      method: method,
      data: data,
      header: header,
      timeout: options.timeout || app.globalData.requestTimeoutMs || 15000,
      success: function(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(unwrapResponse(res.data));
        } else if (res.statusCode === 403 && res.data && res.data.code === 'MEMBERSHIP_REQUIRED') {
          wx.showToast({ title: res.data.message || '请先查看宝贝成长服务', icon: 'none' });
          wx.navigateTo({ url: '/pages/membership/index' });
          reject(res.data);
        } else if (isAuthExpiredResponse(res.statusCode, res.data) && !skipAuthRetry) {
          retryWithFreshAuth(app, options, resolve, reject, res.data || new Error('请求失败'));
        } else {
          reject(res.data || new Error('请求失败'));
        }
      },
      fail: function(err) {
        reject(err);
      }
    });
  });
}

module.exports = {
  getApiUrl: getApiUrl,
  unwrapResponse: unwrapResponse,
  shouldUseMockFallback: shouldUseMockFallback,
  getApiErrorMessage: getApiErrorMessage,
  showApiError: showApiError,
  request: request
};
