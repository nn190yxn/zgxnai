// 小程序虚拟支付开关配置
const envConfig = require('../config/env.js');

// 会员展示与官方虚拟支付能力分离，避免未完成配置时展示可支付状态。
const SHOW_MEMBERSHIP = envConfig.showMembership !== false;
const ENABLE_VIRTUAL_PAY = envConfig.enableVirtualPay === true || envConfig.enableWechatPay === true;

// 官方小程序虚拟支付配置
const WX_CONFIG = {
  // 是否启用真实支付
  enabled: ENABLE_VIRTUAL_PAY,
  
  // 未开通提示
  sandboxTip: '虚拟支付能力正在配置中',
  
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
  ENABLE_PAYMENT: ENABLE_VIRTUAL_PAY,
  ENABLE_WECHAT_PAY: ENABLE_VIRTUAL_PAY,
  ENABLE_VIRTUAL_PAY,
  SHOW_MEMBERSHIP,
  WX_CONFIG
};
