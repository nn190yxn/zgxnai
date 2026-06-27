// 成长服务页面 - 审核期版本
const app = getApp();
const { ENABLE_VIRTUAL_PAY, SHOW_MEMBERSHIP } = require('../../config/payment');

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
    showPayment: ENABLE_VIRTUAL_PAY,
    paymentNotice: ENABLE_VIRTUAL_PAY ? '成长服务属于虚拟内容服务，购买时将调用微信官方小程序虚拟支付能力' : '官方小程序虚拟支付能力正在配置中，新用户可先领取体验服务并使用邀请奖励',
    signupBenefitText: '新用户首次注册自动赠送7天成长服务，可与邀请奖励叠加。',
    paymentCapabilityHint: 'Android、鸿蒙、Windows 端使用微信虚拟支付，iOS 端按微信官方能力自动拉起 Apple 支付。',
    
    // 套餐列表
    plans: [
      { code: 'month', name: '月卡', price: '39', duration: '30天', description: '每天不到2元' },
      { code: 'quarter', name: '季卡', price: '69', duration: '90天', description: '省40%' },
      { code: 'year', name: '年卡', price: '169', duration: '365天', description: '省60%' }
    ],
    
    // 兑换码
    promoCode: '',
    promoEnabled: false,
    promoBenefitText: '兑换码兑换区',
    premiumFeatures: [
      { key: 'weekly_summary', title: '宝贝每周成长总结', desc: '持续查看记录趋势、计划完成度和下周重点' },
      { key: 'scene_search', title: '育儿场景内容', desc: '把“发脾气、挑食、睡前拖延”直接变成可参考的方法' },
      { key: 'daily_guidance', title: '每日成长陪伴', desc: '把观察、训练、营养和方法连成持续陪伴内容' }
    ],
    displayFeatures: [],
    
    // 邀请统计
    referralStats: {},
    inviteCode: '',
    
    // 选中套餐
    selectedPlan: '',
    isPaying: false
  },

  isLoggedIn() {
    return !!(app.globalData.isLoggedIn && wx.getStorageSync('token'));
  },

  onLoad() {
    this._redeemSuccessTimer = null;
    this.syncPaymentStatus();
    this.setData({
      displayFeatures: this.buildDisplayFeatures(this.data.membershipInfo)
    });
    this.loadMembershipInfo();
    this.loadReferralStats();
  },

  onUnload() {
    this.clearRedeemSuccessTimer();
  },

  clearRedeemSuccessTimer() {
    if (this._redeemSuccessTimer) {
      clearTimeout(this._redeemSuccessTimer);
      this._redeemSuccessTimer = null;
    }
  },

  onShow() {
    this.syncPaymentStatus();
    this.loadMembershipInfo();
    this.loadReferralStats();
    this.trackMembershipEvent('membership_center_view');
  },

  syncPaymentStatus() {
    const runtimeConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : {};
    const runtimePaymentEnabled = runtimeConfig.paymentEnabled;
    const showPayment = runtimePaymentEnabled !== undefined ? !!runtimePaymentEnabled : ENABLE_VIRTUAL_PAY;
    this.setData({
      showPayment: showPayment,
      paymentNotice: showPayment ? '成长服务属于虚拟内容服务，购买时将调用微信官方小程序虚拟支付能力' : '官方小程序虚拟支付能力正在配置中，新用户可先领取体验服务并使用邀请奖励'
    });
    if (app.globalData && app.globalData.enableRuntimeConfigFetch && app.loadRuntimeConfig && !runtimeConfig.configLoaded) {
      app.loadRuntimeConfig().then(() => {
        const latestConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : {};
        const latestShowPayment = latestConfig.paymentEnabled !== undefined ? !!latestConfig.paymentEnabled : ENABLE_VIRTUAL_PAY;
        this.setData({
          showPayment: latestShowPayment,
          paymentNotice: latestShowPayment ? '成长服务属于虚拟内容服务，购买时将调用微信官方小程序虚拟支付能力' : '官方小程序虚拟支付能力正在配置中，新用户可先领取体验服务并使用邀请奖励'
        });
      });
    }
  },

  ensureLoggedIn(message) {
    return app.ensureLogin(message || '请先完成微信登录，再继续开通成长服务');
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
        statusText: isActive ? '当前可查看' : '开通后可查看',
        unlocked: isActive
      });
    });
  },

  // 加载会员信息
  loadMembershipInfo() {
    if (!this.isLoggedIn()) {
      this.setData({
        membershipInfo: {
          status: 'free',
          membership_type: 'free',
          is_active: false,
          days_left: 0,
          is_trial_used: false,
          plans: []
        },
        promoEnabled: false,
        displayFeatures: this.buildDisplayFeatures({ is_active: false })
      });
      return Promise.resolve(null);
    }
    app.request({
      url: '/membership/info',
      method: 'GET'
    }).then(data => {
      this.setData({
        membershipInfo: data,
        promoEnabled: !!data.promo_enabled,
        promoBenefitText: data.promo_benefit_text || '兑换码兑换区',
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
    if (!this.isLoggedIn()) {
      this.setData({
        referralStats: {},
        inviteCode: ''
      });
      return Promise.resolve(null);
    }
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
    this.ensureLoggedIn('请先完成微信登录，再领取成长服务试用').then(() => app.request({
      url: '/membership/trial/activate',
      method: 'POST'
    })).then(data => {
      if (data.activated !== false) {
        this.trackMembershipEvent('membership_trial_activate');
        wx.showToast({ title: '试用已开启', icon: 'success' });
        this.loadMembershipInfo();
      } else if (data.reason === 'active_membership_exists') {
        wx.showToast({ title: '当前成长服务有效期内无需试用', icon: 'none' });
      } else {
        wx.showToast({ title: '试用资格已使用', icon: 'none' });
      }
    }).catch(err => {
      if (err && err.message === 'LOGIN_REQUIRED') {
        return;
      }
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
      wx.showToast({ title: '虚拟支付能力配置中', icon: 'none' });
    }
  },

  paySelectedPlan() {
    if (!this.data.showPayment) {
      wx.showToast({ title: '虚拟支付能力配置中', icon: 'none' });
      return;
    }
    if (!wx.requestVirtualPayment) {
      wx.showToast({ title: '当前微信版本暂不支持虚拟支付', icon: 'none' });
      return;
    }
    if (!this.data.selectedPlan) {
      wx.showToast({ title: '请先选择方案', icon: 'none' });
      return;
    }
    if (this.data.isPaying) {
      return;
    }

    const that = this;
    let currentOrderNo = '';
    that.ensureLoggedIn('请先完成微信登录，再开通成长服务').then(function() {
      that.setData({ isPaying: true });
      return app.request({
        url: '/payment/virtual-order',
        method: 'POST',
        data: {
          plan_code: that.data.selectedPlan,
          auto_renew: false
        }
      });
    }).then(function(payParams) {
      if (!payParams || !payParams.order_no || !payParams.signData || !payParams.paySig || !payParams.signature) {
        throw new Error((payParams && payParams.message) || '获取虚拟支付参数失败');
      }
      currentOrderNo = payParams.order_no;
      return new Promise(function(resolve, reject) {
        wx.requestVirtualPayment({
          mode: payParams.mode || 'short_series_goods',
          signData: payParams.signData,
          paySig: payParams.paySig,
          signature: payParams.signature,
          success: resolve,
          fail: reject
        });
      });
    }).then(function() {
      that.trackMembershipEvent('membership_payment_success', {
        plan_code: that.data.selectedPlan,
        order_no: currentOrderNo
      });
      wx.showLoading({ title: '正在确认成长服务...' });
      return that.waitForMembershipActivation(currentOrderNo).then(function(activated) {
        wx.hideLoading();
        if (activated) {
          wx.showToast({ title: '开通成功', icon: 'success' });
          return;
        }
        wx.showToast({ title: '已完成支付，成长服务稍后到账', icon: 'none' });
      }).catch(function(err) {
        wx.hideLoading();
        throw err;
      });
    }).catch(function(err) {
      if (err && err.message === 'LOGIN_REQUIRED') {
        return;
      }
      wx.hideLoading();
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

  waitForMembershipActivation(orderNo) {
    const that = this;
    const maxAttempts = 6;
    const intervalMs = 1500;

    function poll(attempt) {
      return app.request({
        url: '/payment/query/' + encodeURIComponent(orderNo),
        method: 'GET'
      }).then(function(orderInfo) {
        if (orderInfo && orderInfo.status === 'paid') {
          return that.loadMembershipInfo().then(function() {
            return true;
          });
        }
        if (attempt >= maxAttempts) {
          return false;
        }
        return new Promise(function(resolve) {
          setTimeout(resolve, intervalMs);
        }).then(function() {
          return poll(attempt + 1);
        });
      }).catch(function(err) {
        if (attempt >= maxAttempts) {
          throw err;
        }
        return new Promise(function(resolve) {
          setTimeout(resolve, intervalMs);
        }).then(function() {
          return poll(attempt + 1);
        });
      });
    }

    if (!orderNo) {
      return Promise.resolve(false);
    }
    return poll(1);
  },

  // 输入兑换码
  inputPromoCode(e) {
    this.setData({ promoCode: e.detail.value });
  },

  // 兑换码兑换
  redeemPromoCode() {
    if (!this.isLoggedIn()) {
      this.ensureLoggedIn('请先完成微信登录，再使用兑换码');
      return;
    }
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
        this.clearRedeemSuccessTimer();
        this._redeemSuccessTimer = setTimeout(() => {
          this._redeemSuccessTimer = null;
          wx.showModal({
            title: '成长服务已到账',
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
    if (!this.isLoggedIn()) {
      this.ensureLoggedIn('请先完成微信登录，再邀请家人朋友');
      return;
    }
    this.trackMembershipEvent('membership_invite_click');
    app.request({
      url: '/referral/code',
      method: 'GET'
    }).then(data => {
      if (data && data.invite_code) {
          wx.showModal({
            title: '邀请家人朋友',
            content: '邀请好友注册，双方各得7天成长服务！',
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
      title: app.buildShareTitle('membership_invite'),
      path: '/pages/index/index?invite_code=' + encodeURIComponent(inviteCode) + '&shareSource=membership_invite',
      imageUrl: '/images/default-article.png'
    };
  },

  onShareTimeline() {
    const inviteCode = this.data.inviteCode || this.getFallbackInviteCode();
    return {
      title: app.buildShareTitle('membership_invite'),
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
