// 小牛育儿AI助理 v4.0
// 小程序入口
var envConfig = require('./config/env.js');
var appConfig = require('./utils/app-config.js');
var network = require('./utils/network.js');
var authUtil = require('./utils/auth.js');
var childProfileUtil = require('./utils/child-profile.js');
var diagnostics = require('./utils/diagnostics.js');
var requestUtil = require('./utils/request.js');

App({
  globalData: {
    // API基础地址（从 config/env.js 读取；本地联调可通过 storage 覆盖）
    apiBaseUrl: envConfig.apiBaseUrl,
    baseUrl: envConfig.baseUrl,
    allowHttpApi: !!envConfig.allowHttp,
    requestTimeoutMs: envConfig.requestTimeoutMs || 10000,
    apiStrictMode: envConfig.apiStrictMode !== false,
    allowMockFallback: !!envConfig.allowMockFallback,
    isDebug: envConfig.envName !== 'production',
    enableDevLoginFallback: !!envConfig.enableDevLoginFallback,
    enableNativeApiDiagnostics: !!envConfig.enableNativeApiDiagnostics,
    enableNetworkProbe: !!envConfig.enableNetworkProbe,
    enableBootIsolation: !!envConfig.enableBootIsolation,
    enableRuntimeConfigFetch: !!envConfig.enableRuntimeConfigFetch,
    enableStartupSafeMode: !!envConfig.enableStartupSafeMode,

    // 用户信息
    userInfo: null,
    isLoggedIn: false,

    // 孩子档案（兼容旧版单孩子）
    childProfile: null,

    // 多孩子档案支持
    currentChild: null,
    childrenList: [],

    // 阅读任务统计（首页状态联动）
    readingTaskStats: {
      total: 0,
      completed: 0,
      completionRate: 0,
      updatedAt: 0
    },

    // 运行时能力配置
    runtimeConfig: {
      envName: envConfig.envName || 'development',
      debug: envConfig.envName !== 'production',
      aiChatEnabled: envConfig.enableAiChat !== false,
      assessmentsEnabled: envConfig.enableAssessments !== false,
      educationEnabled: envConfig.enableEducation !== false,
      parentingEnabled: envConfig.enableParenting !== false,
      multimodalEnabled: envConfig.enableMultimodal === true,
      paymentEnabled: false,
      aiMockFallback: !!envConfig.allowMockFallback,
      aiServiceReady: envConfig.envName !== 'production',
      configLoaded: !envConfig.enableRuntimeConfigFetch
    },
    _runtimeConfigLoadedAt: 0,

    // 登录重试计数器（防止401无限递归）
    _loginRetryCount: 0,
    // 登录刷新互斥锁（防止并发401触发登录风暴）
    _loginPromise: null,
    _refreshTokenPromise: null,

    // 网络状态
    networkType: 'unknown',
    isOnline: true,
  },

  onLaunch: function(options) {
    if (this.globalData.enableBootIsolation) {
      return;
    }
    if (this.globalData.enableStartupSafeMode) {
      console.warn('Startup safe mode enabled: skip all wx native calls in App.onLaunch.');
      return;
    }
    this.captureInviteCode(options);
    this.initApiBaseUrl();
    diagnostics.installNativeApiDiagnostics(this);
    authUtil.checkLoginStatus(this);
    childProfileUtil.loadChildProfile(this);
    childProfileUtil.loadChildrenData(this);
  },

onError: function(error) {
    console.error('App runtime error', error);
    
    // 超时诊断在显式开启时始终生效，避免 production 环境无法定位问题
    if (this.globalData.isDebug || this.globalData.enableNativeApiDiagnostics) {
      var message = typeof error === 'string' ? error : (error && (error.message || error.errMsg)) || '';
      if (message.indexOf('timeout') !== -1) {
        console.warn('[DEBUG] === TIMEOUT ERROR DETECTED ===');
        console.warn('[DEBUG] Error string repr:', JSON.stringify(error));
        console.warn('[DEBUG] Error constructor:', error && error.constructor && error.constructor.name);
        console.warn('[DEBUG] Stack:', error && error.stack);
        console.warn('[DEBUG] Check [wx-api:pending] logs above for the native API that timed out.');

        if (wx.__gantuPendingApiCalls) {
          console.warn('[DEBUG] Pending API calls:', JSON.stringify(wx.__gantuPendingApiCalls));
        }

        var pendingApi = wx.__gantuLastPendingApi;
        if (pendingApi && typeof wx.showModal === 'function') {
          wx.showModal({
            title: 'Timeout Diagnostics',
            content: 'api=' + pendingApi.api + '\nurl=' + (pendingApi.url || '-') + '\nelapsed=' + pendingApi.elapsedMs + 'ms',
            showCancel: false
          });
        }
      }
    }
  },

  captureInviteCode: function(options) {
    var query = (options && options.query) || {};
    var inviteCode = query.invite_code || query.inviteCode || '';
    if (inviteCode) {
      wx.setStorageSync('inviteCode', inviteCode);
    }
  },

  onShow: function(options) {
    this.captureInviteCode(options);
  },

  // 初始化 API 基址（允许开发环境通过 storage 覆盖）
  initApiBaseUrl: function() {
var allowHosts = {
      'api.woyai.cn': true,
      'woyai.cn': true,
      'www.woyai.cn': true,
      'api.supercalf.com': true,
      'supercalf.com': true,
      'www.supercalf.com': true,
      '127.0.0.1': true,
      'localhost': true
    };

    function getHost(url) {
      var match = /^https?:\/\/([^\/?#:]+)(?::\d+)?/i.exec(url);
      return match ? match[1] : '';
    }

    function isAllowed(url) {
      var host = getHost(url);
      if (allowHosts[host]) {
        return true;
      }
      // 预览域名白名单
      return /\.monkeycode-ai\.online$/i.test(host);
    }

    var customApiBaseUrl = wx.getStorageSync('apiBaseUrl');
    var customBaseUrl = wx.getStorageSync('baseUrl');
    var requestTimeoutOverride = wx.getStorageSync('requestTimeoutMs');
    var strictModeOverride = wx.getStorageSync('apiStrictMode');
    var mockFallbackOverride = wx.getStorageSync('allowMockFallback');
    if (this.globalData.isDebug && customApiBaseUrl && /^https?:\/\//.test(customApiBaseUrl) && isAllowed(customApiBaseUrl)) {
      this.globalData.apiBaseUrl = customApiBaseUrl;
    }
    if (this.globalData.isDebug && customBaseUrl && /^https?:\/\//.test(customBaseUrl) && isAllowed(customBaseUrl)) {
      this.globalData.baseUrl = customBaseUrl;
    }
    if (typeof requestTimeoutOverride === 'number' && requestTimeoutOverride >= 3000) {
      this.globalData.requestTimeoutMs = requestTimeoutOverride;
    }
    if (typeof strictModeOverride === 'boolean') {
      this.globalData.apiStrictMode = strictModeOverride;
    }
    if (typeof mockFallbackOverride === 'boolean') {
      this.globalData.allowMockFallback = mockFallbackOverride;
    }
  },

  onPageNotFound: function(res) {
    console.error('Page not found', res);
    wx.switchTab({
      url: '/pages/index/index',
      fail: function() {
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    });
  },

  // === 委托给 utils 的方法 ===

  installNativeApiDiagnostics: function() {
    diagnostics.installNativeApiDiagnostics(this);
  },

  initNetworkStatus: function() {
    network.initNetworkStatus(this);
  },

  normalizeRuntimeConfig: function(payload) {
    return appConfig.normalizeRuntimeConfig(payload);
  },

  getRuntimeConfig: function() {
    return appConfig.getRuntimeConfig(this);
  },

  isFeatureEnabled: function(featureName) {
    return appConfig.isFeatureEnabled(this, featureName);
  },

  loadRuntimeConfig: function(options) {
    return appConfig.loadRuntimeConfig.call(this, options);
  },

  // 检查登录状态
  checkLoginStatus: function() {
    authUtil.checkLoginStatus(this);
  },

  // 加载孩子档案（兼容旧版）
  loadChildProfile: function() {
    childProfileUtil.loadChildProfile(this);
  },

  // 加载多孩子档案数据
  loadChildrenData: function() {
    childProfileUtil.loadChildrenData(this);
  },

  // 更新阅读任务统计（供首页状态联动）
  updateReadingTaskStats: function(payload) {
    childProfileUtil.updateReadingTaskStats(this, payload);
  },

  getReadingTaskStats: function() {
    return childProfileUtil.getReadingTaskStats(this);
  },

  // 生成分享文案模板（第4阶段）
  buildShareTemplate: function(draft) {
    var data = draft || {};
    var metrics = data.metrics || {};
    var completed = metrics.completed || 0;
    var total = metrics.total || 0;
    var completionRate = metrics.completionRate || 0;
    var streakDays = metrics.streakDays || 0;

    if (data.type === 'weekly_report') {
      return '这周坚持了' + streakDays + '天，完成' + completed + '/' + total + '个能力成长任务。每天10分钟，孩子的变化看得见。';
    }

    if (data.type === 'app_intro' || data.type === 'home_intro') {
      return '孩子专注、表达、阅读、吃饭睡眠有困惑？小牛育儿AI助理，帮妈妈先找到切入口。';
    }

    return '小牛育儿AI助理：成长观察、AI答疑、育儿知识、营养食谱，帮妈妈把问题拆成可执行的小建议。';
  },

  appendShareEventLog: function(event) {
    if (!event) {
      return;
    }
    var logs = wx.getStorageSync('shareEventLogs') || [];
    logs.push(event);
    if (logs.length > 200) {
      logs = logs.slice(logs.length - 200);
    }
    wx.setStorageSync('shareEventLogs', logs);
  },

  // 切换当前孩子
  switchCurrentChild: function(childId) {
    return childProfileUtil.switchCurrentChild(this, childId);
  },

  // 加载用户数据
  loadUserData: function() {
    var that = this;
    return that.request({
      url: '/auth/me',
      method: 'GET'
    }).then(function(data) {
      that.globalData.userInfo = data;
      wx.setStorageSync('userInfo', data);
      return data;
    });
  },

  // 登录
  login: function() {
    var that = this;

    if (that.globalData._loginPromise) {
      return that.globalData._loginPromise;
    }

    function finishLoginWithCode(code, resolve, reject) {
      // 获取邀请码（如果有）
      var inviteCode = wx.getStorageSync('inviteCode') || '';
      that.request({
        url: '/auth/login',
        method: 'POST',
        data: { code: code, invite_code: inviteCode },
        _skipAuthRetry: true
      }).then(function(data) {
        that.globalData.userInfo = data.user;
        that.globalData.isLoggedIn = true;
        wx.setStorageSync('userInfo', data.user);
        wx.setStorageSync('token', data.token);
        wx.setStorageSync('refreshToken', data.refresh_token);
        that.globalData.refreshToken = data.refresh_token;
        that.globalData._loginRetryCount = 0;
        if (inviteCode) {
          wx.removeStorageSync('inviteCode');
        }
        resolve(data);
      }).catch(function(err) {
        reject(err);
      });
    }

    function useDevLoginFallback(reason, resolve, reject) {
      if (!that.globalData.enableDevLoginFallback) {
        reject(reason instanceof Error ? reason : new Error(String(reason || 'wx.login failed')));
        return;
      }
      var fallbackCode = 'devtools-fallback-stable-user';
      console.warn('Using local DEBUG login fallback', {
        reason: reason && (reason.errMsg || reason.message || reason),
        fallbackCode: fallbackCode
      });
      finishLoginWithCode(fallbackCode, resolve, reject);
    }

    that.globalData._loginPromise = new Promise(function(resolve, reject) {
      if (that.globalData.enableDevLoginFallback) {
        useDevLoginFallback(new Error('dev login fallback enabled; skip wx.login'), resolve, reject);
        return;
      }

      var settled = false;
      var loginTimeoutMs = that.globalData.requestTimeoutMs || 15000;
      var loginTimer = setTimeout(function() {
        if (settled) {
          return;
        }
        settled = true;
        useDevLoginFallback(new Error('wx.login timeout after ' + loginTimeoutMs + 'ms'), resolve, reject);
      }, loginTimeoutMs);

      wx.login({
        success: function(res) {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(loginTimer);
          if (res.code) {
            // 发送code到后端换取openid和token
            finishLoginWithCode(res.code, resolve, reject);
          } else {
            useDevLoginFallback(new Error('wx.login returned empty code'), resolve, reject);
          }
        },
        fail: function(err) {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(loginTimer);
          useDevLoginFallback(err, resolve, reject);
        }
      });
    }).finally(function() {
      that.globalData._loginPromise = null;
    });

    return that.globalData._loginPromise;
  },

  refreshAccessToken: function() {
    var that = this;
    var refreshToken = wx.getStorageSync('refreshToken') || that.globalData.refreshToken;

    if (!refreshToken) {
      return Promise.reject(new Error('missing refresh token'));
    }

    if (that.globalData._refreshTokenPromise) {
      return that.globalData._refreshTokenPromise;
    }

    that.globalData._refreshTokenPromise = new Promise(function(resolve, reject) {
      var fullUrl = '';
      try {
        fullUrl = that.getApiUrl('/auth/refresh');
      } catch (err) {
        reject(err);
        return;
      }

      wx.request({
        url: fullUrl,
        method: 'POST',
        data: { refresh_token: refreshToken },
        header: { 'Content-Type': 'application/json' },
        timeout: that.globalData.requestTimeoutMs || 10000,
        success: function(res) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            var data = that.unwrapResponse(res.data);
            if (data && data.token) {
              wx.setStorageSync('token', data.token);
              that.globalData.isLoggedIn = true;
              resolve(data);
              return;
            }
            reject(new Error('refresh token response missing access token'));
          } else {
            wx.removeStorageSync('token');
            wx.removeStorageSync('refreshToken');
            that.globalData.refreshToken = null;
            reject(res.data || new Error('refresh token failed'));
          }
        },
        fail: function(err) {
          reject(err);
        }
      });
    }).finally(function() {
      that.globalData._refreshTokenPromise = null;
    });

    return that.globalData._refreshTokenPromise;
  },

  // 登出
  logout: function() {
    authUtil.logout(this);
  },

  getApiUrl: function(path) {
    return requestUtil.getApiUrl(this, path);
  },

  unwrapResponse: function(payload) {
    return requestUtil.unwrapResponse(payload);
  },

  shouldUseMockFallback: function() {
    return requestUtil.shouldUseMockFallback(this);
  },

  getApiErrorMessage: function(err, fallback) {
    return requestUtil.getApiErrorMessage(err, fallback);
  },

  showApiError: function(message) {
    requestUtil.showApiError(this, message);
  },

  // 统一请求方法
  request: function(options) {
    return requestUtil.request(this, options);
  },

  // AI问答
  chat: function(message) {
    var that = this;
    return that.request({
      url: '/chat',
      method: 'POST',
      data: {
        message: message.substring(0, 2000), // 前端限制长度
        child_profile: that.globalData.currentChild || that.globalData.childProfile
      }
    });
  },

  ensureLogin: function() {
    if (this.globalData.isLoggedIn && wx.getStorageSync('token')) {
      return Promise.resolve(this.globalData.userInfo);
    }
    return this.login();
  },

  requireLoginForAction: function(message) {
    return this.ensureLogin().then(function() {
      return true;
    }).catch(function() {
      wx.showToast({
        title: message || '请先登录后再操作',
        icon: 'none'
      });
      return false;
    });
  },

  normalizeAssetUrl: function(url) {
    if (!url) {
      return '';
    }
    if (url.indexOf('http://') === 0 || url.indexOf('https://') === 0) {
      return url;
    }
    if (url.charAt(0) === '/') {
      return this.globalData.baseUrl + url;
    }
    return url;
  },

  normalizeChild: function(child) {
    var item = Object.assign({}, child || {});
    item.avatar = this.normalizeAssetUrl(item.avatar || '');
    item.birthday = item.birthday || item.birth_date || '';
    item.tags = this.normalizeStringArray(item.tags);
    item.allergies = this.normalizeStringArray(item.allergies);
    return item;
  },

  normalizeStringArray: function(value) {
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
          return parsed.filter(function(item) {
            return typeof item === 'string' && item.trim();
          }).map(function(item) {
            return item.trim();
          });
        }
      } catch (err) {
        // Ignore parse error and fall back to delimiter splitting.
      }
      return text.split(/[、,，\s]+/).filter(function(item) {
        return item && item.trim();
      }).map(function(item) {
        return item.trim();
      });
    }
    return [];
  },

  normalizeChildren: function(children) {
    var that = this;
    return (children || []).map(function(child) {
      return that.normalizeChild(child);
    });
  },

  // 上报知识库埋点（失败不阻塞主流程）
  trackKbEvent: function(payload) {
    var that = this;
    if (!payload || !payload.event_type) {
      return Promise.resolve({ skipped: true });
    }
    if (that.shouldUseMockFallback && that.shouldUseMockFallback()) {
      return Promise.resolve({ skipped: true, reason: 'mock_fallback' });
    }
    var token = wx.getStorageSync('token');
    if (!token) {
      return Promise.resolve({ skipped: true, reason: 'no_token' });
    }
    var currentChild = that.getCurrentChild();
    var body = {
      event_type: payload.event_type,
      module_key: payload.module_key,
      page_key: payload.page_key,
      content_type: payload.content_type,
      content_id: payload.content_id,
      child_id: payload.child_id || (currentChild ? currentChild.id : undefined),
      task_id: payload.task_id,
      path_id: payload.path_id,
      share_source: payload.share_source,
      day_index: payload.day_index,
      score: payload.score,
      duration_sec: payload.duration_sec,
      has_recording: !!payload.has_recording,
      event_meta: payload.event_meta || {}
    };

    return that.request({
      url: '/kb/events/track',
      method: 'POST',
      data: body,
      timeout: 5000,
      _skipAuthRetry: true
    }).catch(function() {
      return { skipped: true };
    });
  },

  // 获取当前孩子信息（兼容方法）
  getCurrentChild: function() {
    return this.globalData.currentChild || this.globalData.childProfile;
  },

  // 更新孩子档案到服务器
  syncChildrenToServer: function() {
    wx.setStorageSync('childrenList', this.globalData.childrenList);
    return Promise.resolve({ success: true });
  }
});
