// 运行时配置管理
var envConfig = require('../config/env.js');

function normalizeRuntimeConfig(payload) {
  var data = payload || {};
  return {
    envName: data.env_name || data.envName || (envConfig.envName || 'development'),
    debug: !!data.debug,
    aiChatEnabled: data.ai_chat_enabled !== undefined ? !!data.ai_chat_enabled : (envConfig.envName !== 'production'),
    multimodalEnabled: data.multimodal_enabled !== undefined ? !!data.multimodal_enabled : (envConfig.envName !== 'production'),
    paymentEnabled: data.payment_enabled !== undefined ? !!data.payment_enabled : false,
    aiMockFallback: data.ai_mock_fallback !== undefined ? !!data.ai_mock_fallback : !!envConfig.allowMockFallback,
    aiServiceReady: data.ai_service_ready !== undefined ? !!data.ai_service_ready : (envConfig.envName !== 'production'),
    configLoaded: true
  };
}

function loadRuntimeConfig(options) {
  var that = this;
  var opts = options || {};
  if (!that.globalData.enableRuntimeConfigFetch && !opts.force) {
    return Promise.resolve(that.globalData.runtimeConfig);
  }
  var force = !!opts.force;
  var staleMs = typeof opts.staleMs === 'number' ? opts.staleMs : 5 * 60 * 1000;
  var now = Date.now();

  if (!force && that.globalData.runtimeConfig && that.globalData.runtimeConfig.configLoaded && that.globalData._runtimeConfigLoadedAt && (now - that.globalData._runtimeConfigLoadedAt) < staleMs) {
    return Promise.resolve(that.globalData.runtimeConfig);
  }

  if (that.globalData._runtimeConfigPromise) {
    return that.globalData._runtimeConfigPromise;
  }

  that.globalData._runtimeConfigPromise = that.request({
    url: '/runtime/config',
    method: 'GET',
    _skipAuthRetry: true,
    timeout: 5000
  }).then(function(data) {
    that.globalData.runtimeConfig = normalizeRuntimeConfig(data);
    that.globalData._runtimeConfigLoadedAt = Date.now();
    return that.globalData.runtimeConfig;
  }).catch(function() {
    var fallback = normalizeRuntimeConfig({});
    fallback.configLoaded = false;
    that.globalData.runtimeConfig = fallback;
    that.globalData._runtimeConfigLoadedAt = Date.now();
    return fallback;
  }).finally(function() {
    that.globalData._runtimeConfigPromise = null;
  });

  return that.globalData._runtimeConfigPromise;
}

function getRuntimeConfig(app) {
  return (app && app.globalData && app.globalData.runtimeConfig) || {};
}

function isFeatureEnabled(app, featureName) {
  var config = getRuntimeConfig(app);
  if (featureName === 'aiChat') {
    return !!config.aiChatEnabled;
  }
  if (featureName === 'multimodal') {
    return !!config.multimodalEnabled;
  }
  if (featureName === 'payment') {
    return !!config.paymentEnabled;
  }
  return true;
}

module.exports = {
  normalizeRuntimeConfig: normalizeRuntimeConfig,
  loadRuntimeConfig: loadRuntimeConfig,
  getRuntimeConfig: getRuntimeConfig,
  isFeatureEnabled: isFeatureEnabled
};
