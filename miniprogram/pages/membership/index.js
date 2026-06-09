// 会员中心页面 - 审核期版本
const app = getApp();
const { ENABLE_WECHAT_PAY, SHOW_MEMBERSHIP } = require('../../config/payment');

Page({
  data: {
    // 会员信息
    membershipInfo: {
      status: 'free',
      membership_type: 'free',
      is_active: false,
      days_left: 0,
      is_trial_used: false,
      plans: []
    },
    
    // 支付开关
    showMembership: SHOW_MEMBERSHIP,
    showPayment: ENABLE_WECHAT_PAY,
    paymentNotice: ENABLE_WECHAT_PAY ? '选择套餐后可发起微信支付' : '微信支付暂未开放，可先使用试用或兑换码',
    
    // 套餐列表
    plans: [
      { code: 'month', name: '月卡', price: '19.9', duration: '30天', description: '每天不到1元' },
      { code: 'quarter', name: '季卡', price: '49.9', duration: '90天', description: '省30%' },
      { code: 'year', name: '年卡', price: '99', duration: '365天', description: '省60%' }
    ],
    
    // 兑换码
    promoCode: '',
    
    // 邀请统计
    referralStats: {},
    
    // 选中套餐
    selectedPlan: ''
  },

  onLoad() {
    this.loadMembershipInfo();
    this.loadReferralStats();
  },

  onShow() {
    this.loadMembershipInfo();
  },

  // 加载会员信息
  loadMembershipInfo() {
    app.request({
      url: '/membership/info',
      method: 'GET'
    }).then(data => {
      this.setData({ membershipInfo: data });
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('获取会员信息失败', err);
      }
    });
  },

  // 加载邀请统计
  loadReferralStats() {
    app.request({
      url: '/referral/stats',
      method: 'GET'
    }).then(data => {
      this.setData({ referralStats: data });
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('获取邀请统计失败', err);
      }
    });
  },

  // 激活试用
  activateTrial() {
    app.request({
      url: '/membership/trial/activate',
      method: 'POST'
    }).then(data => {
      if (data.activated !== false) {
        wx.showToast({ title: '试用已激活', icon: 'success' });
        this.loadMembershipInfo();
      } else {
        wx.showToast({ title: '试用期已使用过', icon: 'none' });
      }
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('激活试用失败', err);
      }
      wx.showToast({ title: '激活失败', icon: 'none' });
    });
  },

  // 选择套餐
  selectPlan(e) {
    const code = e.currentTarget.dataset.code;
    this.setData({ selectedPlan: code });
    if (!this.data.showPayment) {
      wx.showToast({ title: '微信支付暂未开放', icon: 'none' });
    }
  },

  // 输入兑换码
  inputPromoCode(e) {
    this.setData({ promoCode: e.detail.value });
  },

  // 兑换码兑换
  redeemPromoCode() {
    if (!this.data.promoCode) {
      wx.showToast({ title: '请输入兑换码', icon: 'none' });
      return;
    }

    app.request({
      url: '/membership/promo/redeem',
      method: 'POST',
      data: { code: this.data.promoCode }
    }).then(data => {
      if (data.success) {
        wx.showToast({ title: '兑换成功', icon: 'success' });
        this.loadMembershipInfo();
      } else {
        wx.showToast({ title: data.message || '兑换失败', icon: 'none' });
      }
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('兑换失败', err);
      }
      wx.showToast({ title: '兑换失败', icon: 'none' });
    });
  },

  // 邀请好友
  shareInvite() {
    app.request({
      url: '/referral/code',
      method: 'GET'
    }).then(data => {
      if (data.success && data.invite_code) {
        wx.showModal({
          title: '邀请好友',
          content: '邀请码: ' + data.invite_code,
          showCancel: false
        });
      }
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('获取邀请码失败', err);
      }
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  }
});
