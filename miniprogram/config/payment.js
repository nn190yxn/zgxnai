// 支付开关配置
const envConfig = require('../config/env.js');

// 支付功能总开关
const ENABLE_PAYMENT = envConfig.enablePayment || false;

// 微信支付配置
const WX_CONFIG = {
  // 是否启用真实支付（沙箱环境关闭）
  enabled: ENABLE_PAYMENT,
  
  // 沙箱环境提示
  sandboxTip: '支付功能即将上线，敬请期待',
  
  // 支付套餐
  plans: [
    {
      code: 'month',
      name: '月卡',
      price: 19.9,
      duration: '30天',
      description: '每天不到1元'
    },
    {
      code: 'quarter',
      name: '季卡',
      price: 49.9,
      duration: '90天',
      description: '省30%'
    },
    {
      code: 'year',
      name: '年卡',
      price: 99,
      duration: '365天',
      description: '省60%'
    }
  ]
};

module.exports = {
  ENABLE_PAYMENT,
  WX_CONFIG
};
