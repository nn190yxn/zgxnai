// 个人中心
var app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    phoneNumber: '',
    phoneNumberMasked: '',
    currentChild: null,
    childrenCount: 0,
    membershipInfo: {
      status: 'free',
      membership_type: 'free',
      is_active: false,
      days_left: 0
    }
  },

  onLoad: function() {
    this.loadUserData();
  },

  onShow: function() {
    this.loadUserData();
    this.loadChildrenData();
    this.loadMembershipInfo();
  },

  // 加载用户数据
  loadUserData: function() {
    var userInfo = app.globalData.userInfo || {};
    this.setData({
      userInfo: userInfo,
      isLoggedIn: app.globalData.isLoggedIn,
      phoneNumber: userInfo.phone_number || '',
      phoneNumberMasked: this.maskPhoneNumber(userInfo.phone_number || '')
    });

    if (app.globalData.isLoggedIn && (!userInfo || !userInfo.id) && wx.getStorageSync('token')) {
      app.loadUserData().then(this.loadUserData.bind(this)).catch(function() {
        return null;
      });
    }
  },

  maskPhoneNumber: function(phoneNumber) {
    var value = String(phoneNumber || '').trim();
    if (value.length < 7) {
      return value;
    }
    return value.slice(0, 3) + '****' + value.slice(-4);
  },

  // 加载孩子数据
  loadChildrenData: function() {
    var that = this;
    var currentChild = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : app.normalizeChild(wx.getStorageSync('currentChild') || null);
    var childrenList = app.normalizeChildren(wx.getStorageSync('childrenList') || []);

    that.setData({
      currentChild: currentChild,
      childrenCount: childrenList.length
    });

    // 同步全局状态
    if (currentChild) {
      app.globalData.currentChild = currentChild;
    }

    if (app.globalData.isLoggedIn && !currentChild && app.syncChildrenFromServer) {
      app.syncChildrenFromServer().then(function(child) {
        that.setData({
          currentChild: child,
          childrenCount: (app.globalData.childrenList || []).length
        });
      }).catch(function() {
        return null;
      });
    }
  },

  onCurrentChildAvatarError: function() {
    var currentChild = this.data.currentChild;
    if (!currentChild) {
      return;
    }
    var nextChild = Object.assign({}, currentChild, { avatar: '' });
    this.setData({ currentChild: nextChild });
    app.globalData.currentChild = nextChild;
    wx.setStorageSync('currentChild', nextChild);
  },

  // 登录
  login: function() {
    var that = this;
    wx.showLoading({ title: '登录中...' });
    
    app.login().then(function() {
      return app.loadUserData();
    }).then(function() {
      wx.hideLoading();
      that.loadUserData();
      that.loadMembershipInfo();
      wx.showToast({ title: '登录成功', icon: 'success' });
    }).catch(function(error) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
    });
  },

  bindPhoneNumber: function(event) {
    var that = this;
    var detail = event && event.detail ? event.detail : {};
    if (!detail.code) {
      var message = detail.errMsg && detail.errMsg.indexOf('deny') !== -1
        ? '您还没有授权手机号'
        : '手机号授权失败';
      wx.showToast({ title: message, icon: 'none' });
      return;
    }

    wx.showLoading({ title: '绑定中...' });
    app.request({
      url: '/auth/bind-phone',
      method: 'POST',
      data: { code: detail.code }
    }).then(function(userInfo) {
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);
      that.loadUserData();
      wx.hideLoading();
      wx.showToast({ title: '手机号已绑定', icon: 'success' });
    }).catch(function(err) {
      wx.hideLoading();
      wx.showToast({
        title: app.getApiErrorMessage(err, '手机号绑定失败'),
        icon: 'none'
      });
    });
  },

  ensureLoginBeforeNavigate: function(message, callback) {
    app.requireLoginForAction(message).then(function(ok) {
      if (ok && typeof callback === 'function') {
        callback();
      }
    });
  },

  // 加载成长服务信息
  loadMembershipInfo: function() {
    var that = this;
    if (!app.globalData.isLoggedIn) {
      return;
    }
    app.request({
      url: '/membership/info',
      method: 'GET'
    }).then(function(data) {
      that.setData({
        membershipInfo: data || {
          status: 'free',
          membership_type: 'free',
          is_active: false,
          days_left: 0
        }
      });
    }).catch(function(err) {
      if (app.globalData.isDebug) {
        console.error('获取成长服务信息失败', err);
      }
    });
  },

  // 进入成长服务页
  goToMembership: function() {
    wx.navigateTo({
      url: '/pages/membership/index',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 进入孩子档案列表
  goToChildren: function() {
    this.ensureLoginBeforeNavigate('请先完成微信登录，再管理孩子档案', function() {
      wx.navigateTo({
        url: '/pages/profile/children/children',
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    });
  },

  // 查看历史
  viewHistory: function() {
    this.ensureLoginBeforeNavigate('请先完成微信登录，再查看AI问答记录', function() {
      wx.navigateTo({
        url: '/pages/chat/chat',
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    });
  },

  // 查看成长记录
  viewAssessments: function() {
    this.ensureLoginBeforeNavigate('请先完成微信登录，再查看成长记录', function() {
      wx.navigateTo({
        url: '/pages/growth-record/index',
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    });
  },

  viewWeeklySummary: function() {
    var childId = (this.data.currentChild && this.data.currentChild.id) || 0;
    this.ensureLoginBeforeNavigate('请先完成微信登录，再查看每周成长总结', function() {
      wx.navigateTo({
        url: '/pages/weekly-summary/index' + (childId ? ('?childId=' + childId) : ''),
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    });
  },

  // 意见反馈
  feedback: function() {
    wx.showModal({
      title: '意见反馈',
      content: '请通过小程序内意见反馈或运营人员公布的官方渠道联系我们。',
      showCancel: false
    });
  },

  // 关于我们
  aboutUs: function() {
    wx.showModal({
      title: '关于小牛育儿',
      content: '小牛育儿\n聚焦儿童成长观察、能力发展与家庭养育支持\n\nAI助手版本：v4.0\n能力：成长观察、能力成长、育儿知识、营养建议',
      showCancel: false
    });
  },

  // 查看隐私政策
  viewPrivacy: function() {
    wx.navigateTo({
      url: '/pages/profile/privacy/privacy',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看用户协议
  viewAgreement: function() {
    wx.navigateTo({
      url: '/pages/profile/agreement/agreement',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 账号注销
  viewAccountDeletion: function() {
    if (!this.data.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    wx.navigateTo({
      url: '/pages/profile/account-deletion/account-deletion',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理',
      path: '/pages/index/index'
    };
  }
});
