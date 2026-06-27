// 运行时配置管理
var envConfig = require('../config/env.js');

function normalizeRuntimeConfig(payload) {
  var data = payload || {};
  return {
    envName: data.env_name || data.envName || (envConfig.envName || 'development'),
    debug: !!data.debug,
    aiChatEnabled: data.ai_chat_enabled !== undefined ? !!data.ai_chat_enabled : (envConfig.enableAiChat !== false),
    assessmentsEnabled: data.assessments_enabled !== undefined ? !!data.assessments_enabled : (envConfig.enableAssessments !== false),
    educationEnabled: data.education_enabled !== undefined ? !!data.education_enabled : (envConfig.enableEducation !== false),
    parentingEnabled: data.parenting_enabled !== undefined ? !!data.parenting_enabled : (envConfig.enableParenting !== false),
    dailyPlanEnabled: data.daily_plan_enabled !== undefined ? !!data.daily_plan_enabled : true,
    growthRecordEnabled: data.growth_record_enabled !== undefined ? !!data.growth_record_enabled : true,
    weeklySummaryEnabled: data.weekly_summary_enabled !== undefined ? !!data.weekly_summary_enabled : true,
    sceneSearchEnabled: data.scene_search_enabled !== undefined ? !!data.scene_search_enabled : true,
    multimodalEnabled: data.multimodal_enabled !== undefined ? !!data.multimodal_enabled : (envConfig.enableMultimodal === true),
    paymentEnabled: data.payment_enabled !== undefined ? !!data.payment_enabled : (envConfig.enableVirtualPay === true || envConfig.enableWechatPay === true),
    aiMockFallback: data.ai_mock_fallback !== undefined ? !!data.ai_mock_fallback : !!envConfig.allowMockFallback,
    aiServiceReady: data.ai_service_ready !== undefined ? !!data.ai_service_ready : (envConfig.envName !== 'production'),
    configLoaded: true
  };
}

function loadRuntimeConfig(options) {
  var that = this;
  var opts = options || {};
  if (!that.globalData.enableRuntimeConfigFetch && !opts.force) {
    if (that.globalData.runtimeConfig) {
      that.globalData.runtimeConfig.configLoaded = true;
    }
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
  if (featureName === 'assessments') {
    return !!config.assessmentsEnabled;
  }
  if (featureName === 'education') {
    return !!config.educationEnabled;
  }
  if (featureName === 'parenting') {
    return !!config.parentingEnabled;
  }
  if (featureName === 'dailyPlan') {
    return !!config.dailyPlanEnabled;
  }
  if (featureName === 'growthRecord') {
    return !!config.growthRecordEnabled;
  }
  if (featureName === 'weeklySummary') {
    return !!config.weeklySummaryEnabled;
  }
  if (featureName === 'sceneSearch') {
    return !!config.sceneSearchEnabled;
  }
  return true;
}

module.exports = {
  normalizeRuntimeConfig: normalizeRuntimeConfig,
  loadRuntimeConfig: loadRuntimeConfig,
  getRuntimeConfig: getRuntimeConfig,
  isFeatureEnabled: isFeatureEnabled
};
