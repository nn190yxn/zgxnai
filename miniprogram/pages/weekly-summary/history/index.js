var app = getApp();

Page({
  data: {
    childId: 0,
    currentChild: null,
    loadState: 'loading',
    errorMessage: '',
    list: []
  },

  onLoad: function(options) {
    var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : null);
    var childId = Number((options && options.childId) || (child && child.id) || 0);
    this.setData({ childId: childId, currentChild: child });
    this.loadHistory();
  },

  onShow: function() {
    if (!this._hasShown) {
      this._hasShown = true;
      return;
    }
    var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : null);
    this.setData({ childId: Number((child && child.id) || 0), currentChild: child });
    this.loadHistory();
  },

  loadHistory: function() {
    var that = this;
    if (!(app.globalData.isLoggedIn && wx.getStorageSync('token'))) {
      this.setData({ loadState: 'login_required', errorMessage: '', list: [] });
      return Promise.resolve(null);
    }
    if (!this.data.childId) {
      this.setData({ loadState: 'profile_required', errorMessage: '', list: [] });
      return Promise.resolve(null);
    }
    this.setData({ loadState: 'loading', errorMessage: '' });
    app.request({
      url: '/weekly-summary/history',
      method: 'GET',
      data: { childId: this.data.childId, limit: 20 }
    }).then(function(data) {
      var list = data && Array.isArray(data.list) ? data.list : [];
      that.setData({ list: list, loadState: list.length ? 'ready' : 'empty' });
    }).catch(function(err) {
      that.setData({
        loadState: 'error',
        errorMessage: app.getApiErrorMessage(err, '历史报告暂时没加载出来')
      });
    });
  },

  retryLoad: function() {
    this.loadHistory();
  },

  loginAndReload: function() {
    app.ensureLogin('请先完成微信登录，再查看历史报告').then(() => {
      var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : null);
      this.setData({ childId: Number((child && child.id) || 0), currentChild: child });
      this.loadHistory();
    }).catch(function() {});
  },

  goToChildSetup: function() {
    app.ensureLogin('请先完成微信登录，再添加孩子档案').then(function() {
      wx.navigateTo({ url: '/pages/profile/children/children' });
    }).catch(function() {});
  }
});
