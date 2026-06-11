// 支付开关配置
const envConfig = require('../config/env.js');

// 会员展示与真实微信支付能力分离，避免未配置商户信息时展示可支付状态。
const SHOW_MEMBERSHIP = envConfig.showMembership !== false;
const ENABLE_WECHAT_PAY = envConfig.enableWechatPay === true;

// 微信支付配置
const WX_CONFIG = {
  // 是否启用真实支付（沙箱环境关闭）
  enabled: ENABLE_WECHAT_PAY,
  
  // 沙箱环境提示
  sandboxTip: '支付功能即将上线，敬请期待',
  
  // 支付套餐
  plans: [
    {
      code: 'month',
      name: '月卡',
      price: 39,
      duration: '30天',
      description: '每天不到2元'
    },
    {
      code: 'quarter',
      name: '季卡',
      price: 69,
      duration: '90天',
      description: '省40%'
    },
    {
      code: 'year',
      name: '年卡',
      price: 169,
      duration: '365天',
      description: '省60%'
    }
  ]
};

module.exports = {
  ENABLE_PAYMENT: ENABLE_WECHAT_PAY,
  ENABLE_WECHAT_PAY,
  SHOW_MEMBERSHIP,
  WX_CONFIG
};
