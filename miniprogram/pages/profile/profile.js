// 个人中心
var app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
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
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  // 加载孩子数据
  loadChildrenData: function() {
    var that = this;
    var currentChild = app.normalizeChild(wx.getStorageSync('currentChild') || null);
    var childrenList = wx.getStorageSync('childrenList') || [];

    that.setData({
      currentChild: currentChild,
      childrenCount: childrenList.length
    });

    // 同步全局状态
    if (currentChild) {
      app.globalData.currentChild = currentChild;
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
      wx.hideLoading();
      that.loadUserData();
      wx.showToast({ title: '登录成功', icon: 'success' });
    }).catch(function(error) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败', icon: 'none' });
    });
  },

  // 加载会员信息
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
        console.error('获取会员信息失败', err);
      }
    });
  },

  // 进入会员中心
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
    wx.navigateTo({
      url: '/pages/profile/children/children',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看历史
  viewHistory: function() {
    wx.navigateTo({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看成长记录
  viewAssessments: function() {
    wx.navigateTo({
      url: '/pages/assessment/history/history',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
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
