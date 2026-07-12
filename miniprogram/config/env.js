// 小程序环境配置
// auto: 开发版使用本地接口，体验版/正式版使用 production。
// 生产发布前必须替换 production 域名，并在微信后台配置合法域名。
var CURRENT_ENV = 'auto';

var ENV_CONFIG = {
  development: {
    apiBaseUrl: 'https://api.woyai.cn/api/v1',
    baseUrl: 'https://api.woyai.cn',
    allowHttp: false,
    requestTimeoutMs: 15000,
    apiStrictMode: true,
    allowMockFallback: false,
    requireCustomApiHost: false,
    enableDevLoginFallback: false,
    enableNativeApiDiagnostics: true,
    enableNetworkProbe: false,
    enableBootIsolation: false,
    enableRuntimeConfigFetch: true,
    enableStartupSafeMode: false,
    enableAssessments: true,
    enableEducation: true,
    enableParenting: true,
    showMembership: true,
    enableVirtualPay: true,
    enableWechatPay: true,
    enableAiChat: true,
    enableMultimodal: false,
    enableRetentionStatus: false,
    enableCoreRefactor: true,
    enableAgeFirstCore: true,
    coreRefactorRolloutPercent: 100,
    coreRefactorUserWhitelist: []
  },
  production: {
    apiBaseUrl: 'https://api.woyai.cn/api/v1',
    baseUrl: 'https://api.woyai.cn',
    allowHttp: false,
    requestTimeoutMs: 15000,
    apiStrictMode: true,
    allowMockFallback: false,
    requireCustomApiHost: false,
    enableDevLoginFallback: false,
    enableNativeApiDiagnostics: false,
    enableNetworkProbe: false,
    enableBootIsolation: false,
    enableRuntimeConfigFetch: true,
    enableStartupSafeMode: false,
    enableAssessments: true,
    enableEducation: true,
    enableParenting: true,
    showMembership: true,
    enableVirtualPay: true,
    enableWechatPay: true,
    enableAiChat: true,
    enableMultimodal: false,
    enableRetentionStatus: false,
    enableCoreRefactor: false,
    enableAgeFirstCore: false,
    coreRefactorRolloutPercent: 0,
    coreRefactorUserWhitelist: []
  }
};

function resolveEnv() {
  if (CURRENT_ENV !== 'auto') {
    return CURRENT_ENV;
  }

  try {
    if (typeof wx !== 'undefined' && wx.getAccountInfoSync) {
      var accountInfo = wx.getAccountInfoSync();
      var envVersion = accountInfo && accountInfo.miniProgram && accountInfo.miniProgram.envVersion;
      if (envVersion === 'release' || envVersion === 'trial') {
        return 'production';
      }
    }
  } catch (e) {
    // 开发者工具或语法检查环境下可能无法读取账号信息，默认走开发环境。
  }

  return 'development';
}

var selectedEnv = resolveEnv();
var selectedConfig = ENV_CONFIG[selectedEnv] || ENV_CONFIG.development;
selectedConfig.envName = selectedEnv;
selectedConfig.getConfigByEnv = function(envName) {
  return ENV_CONFIG[envName] || null;
};

module.exports = selectedConfig;
