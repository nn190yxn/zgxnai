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
    paymentNotice: ENABLE_WECHAT_PAY ? '选择套餐后可发起微信支付' : '微信支付暂未开放，可先使用试用和邀请奖励',
    
    // 套餐列表
    plans: [
      { code: 'month', name: '月卡', price: '39', duration: '30天', description: '每天不到2元' },
      { code: 'quarter', name: '季卡', price: '69', duration: '90天', description: '省40%' },
      { code: 'year', name: '年卡', price: '169', duration: '365天', description: '省60%' }
    ],
    
    // 兑换码
    promoCode: '',
    promoEnabled: false,
    promoBenefitText: '输入统一兑换码可领取2个月会员',
    premiumFeatures: [
      { key: 'weekly_summary', title: '每周成长总结', desc: '持续看记录趋势、计划完成度和下周重点' },
      { key: 'scene_search', title: '场景化搜索承接', desc: '把“发脾气、挑食、睡前拖延”直接变成行动方案' },
      { key: 'daily_guidance', title: '持续能力陪伴', desc: '把观察、训练、营养和方法连成闭环' }
    ],
    displayFeatures: [],
    
    // 邀请统计
    referralStats: {},
    inviteCode: '',
    
    // 选中套餐
    selectedPlan: '',
    isPaying: false
  },

  onLoad() {
    this.setData({
      displayFeatures: this.buildDisplayFeatures(this.data.membershipInfo)
    });
    app.ensureLogin().then(() => {
      this.loadMembershipInfo();
      this.loadReferralStats();
    }).catch(() => {
      this.loadMembershipInfo();
    });
  },

  onShow() {
    this.loadMembershipInfo();
    this.trackMembershipEvent('membership_center_view');
  },

  trackMembershipEvent(eventType, extraMeta) {
    if (!app.trackKbEvent) {
      return;
    }
    app.trackKbEvent({
      event_type: eventType,
      module_key: 'membership_center',
      page_key: 'membership_index',
      event_meta: Object.assign({
        is_active: !!(this.data.membershipInfo && this.data.membershipInfo.is_active),
        membership_type: (this.data.membershipInfo && this.data.membershipInfo.membership_type) || 'free'
      }, extraMeta || {})
    });
  },

  buildDisplayFeatures(membershipInfo) {
    var isActive = !!(membershipInfo && membershipInfo.is_active);
    return (this.data.premiumFeatures || []).map(function(item) {
      return Object.assign({}, item, {
        statusText: isActive ? '已解锁' : '待解锁',
        unlocked: isActive
      });
    });
  },

  // 加载会员信息
  loadMembershipInfo() {
    app.request({
      url: '/membership/info',
      method: 'GET'
    }).then(data => {
      this.setData({
        membershipInfo: data,
        promoEnabled: !!data.promo_enabled,
        promoBenefitText: data.promo_benefit_text || '输入统一兑换码可领取2个月会员',
        displayFeatures: this.buildDisplayFeatures(data)
      });
    }).catch(err => {
      console.error('[Membership] Failed to load membership info:', err);
      this.setData({
        displayFeatures: this.buildDisplayFeatures(this.data.membershipInfo)
      });
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
      this.setData({
        referralStats: data,
        inviteCode: data.invite_code || this.getFallbackInviteCode()
      });
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
        this.trackMembershipEvent('membership_trial_activate');
        wx.showToast({ title: '试用已激活', icon: 'success' });
        this.loadMembershipInfo();
      } else if (data.reason === 'active_membership_exists') {
        wx.showToast({ title: '当前会员有效期内无需试用', icon: 'none' });
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
    this.trackMembershipEvent('membership_plan_select', { plan_code: code });
    if (!this.data.showPayment) {
      wx.showToast({ title: '微信支付暂未开放', icon: 'none' });
    }
  },

  paySelectedPlan() {
    if (!this.data.showPayment) {
      wx.showToast({ title: '微信支付暂未开放', icon: 'none' });
      return;
    }
    if (!this.data.selectedPlan) {
      wx.showToast({ title: '请先选择套餐', icon: 'none' });
      return;
    }
    if (this.data.isPaying) {
      return;
    }

    const that = this;
    app.ensureLogin().then(function() {
      that.setData({ isPaying: true });
      return app.request({
        url: '/payment/create',
        method: 'POST',
        data: {
          plan_code: that.data.selectedPlan,
          auto_renew: true
        }
      });
    }).then(function(order) {
      if (!order || !order.success) {
        throw new Error((order && order.message) || '创建订单失败');
      }
      return app.request({
        url: '/payment/unified-order',
        method: 'POST',
        data: {
          order_no: order.order_no
        }
      });
    }).then(function(payParams) {
      if (!payParams || !payParams.success) {
        throw new Error((payParams && payParams.message) || '获取支付参数失败');
      }
      return new Promise(function(resolve, reject) {
        wx.requestPayment({
          timeStamp: payParams.timeStamp,
          nonceStr: payParams.nonceStr,
          package: payParams.package,
          signType: payParams.signType || 'RSA',
          paySign: payParams.paySign,
          success: resolve,
          fail: reject
        });
      });
    }).then(function() {
      that.trackMembershipEvent('membership_payment_success', { plan_code: that.data.selectedPlan });
      wx.showToast({ title: '支付成功', icon: 'success' });
      that.loadMembershipInfo();
    }).catch(function(err) {
      const message = err && err.errMsg && err.errMsg.indexOf('cancel') !== -1
        ? '已取消支付'
        : app.getApiErrorMessage(err, '支付失败，请稍后重试');
      wx.showToast({ title: message, icon: 'none' });
      if (app.globalData.isDebug) {
        console.error('支付失败', err);
      }
    }).finally(function() {
      that.setData({ isPaying: false });
    });
  },

  // 输入兑换码
  inputPromoCode(e) {
    this.setData({ promoCode: e.detail.value });
  },

  // 兑换码兑换
  redeemPromoCode() {
    if (!this.data.promoEnabled) {
      wx.showToast({ title: '兑换码功能暂未开放', icon: 'none' });
      return;
    }
    const code = String(this.data.promoCode || '').trim().toUpperCase();
    if (!code) {
      wx.showToast({ title: '请输入兑换码', icon: 'none' });
      return;
    }

    app.request({
      url: '/membership/promo/redeem',
      method: 'POST',
      data: { code }
    }).then(data => {
      this.trackMembershipEvent('membership_promo_redeem', { code_type: 'unified' });
      this.setData({ promoCode: '' });
      wx.showToast({ title: '兑换成功', icon: 'success' });
      this.loadMembershipInfo();
      if (data && data.message) {
        setTimeout(() => {
          wx.showModal({
            title: '会员已到账',
            content: data.message,
            showCancel: false
          });
        }, 350);
      }
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('兑换失败', err);
      }
      wx.showToast({ title: app.getApiErrorMessage(err, '兑换失败'), icon: 'none' });
    });
  },

  // 邀请好友
  shareInvite() {
    this.trackMembershipEvent('membership_invite_click');
    app.request({
      url: '/referral/code',
      method: 'GET'
    }).then(data => {
      if (data.success && data.invite_code) {
        wx.showModal({
          title: '邀请好友',
          content: '邀请好友注册，双方各得7天会员！',
          confirmText: '复制邀请码',
          success: (res) => {
            if (res.confirm) {
              wx.setClipboardData({
                data: data.invite_code,
                success: () => {
                  wx.showToast({ title: '邀请码已复制', icon: 'success' });
                }
              });
            }
          }
        });
      }
    }).catch(err => {
      if (app.globalData.isDebug) {
        console.error('获取邀请码失败', err);
      }
    });
  },

  getFallbackInviteCode() {
    const user = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    return user.id ? 'NN' + String(user.id).padStart(6, '0') : '';
  },

  onShareAppMessage() {
    const inviteCode = this.data.inviteCode || this.getFallbackInviteCode();
    return {
      title: '小牛育儿AI助理，邀请你领取7天会员',
      path: '/pages/index/index?invite_code=' + encodeURIComponent(inviteCode) + '&shareSource=membership_invite',
      imageUrl: '/images/default-article.png'
    };
  },

  onShareTimeline() {
    const inviteCode = this.data.inviteCode || this.getFallbackInviteCode();
    return {
      title: '小牛育儿AI助理，邀请你领取7天会员',
      query: 'invite_code=' + encodeURIComponent(inviteCode) + '&shareSource=membership_timeline',
      imageUrl: '/images/default-article.png'
    };
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN');
  }
});
