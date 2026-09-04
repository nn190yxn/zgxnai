var app = getApp();

Page({
  data: {
    childId: 0,
    currentChild: null,
    list: [],
    loading: false,
    errorMessage: '',
    loadState: 'loading'
  },

  onLoad: function(options) {
    var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : null);
    this.setData({ childId: Number((options && options.childId) || (child && child.id) || 0), currentChild: child });
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
    if (!wx.getStorageSync('token')) {
      this.setData({ loading: false, errorMessage: '', loadState: 'login_required', list: [] });
      return Promise.resolve(null);
    }
    if (!this.data.childId) {
      this.setData({ loading: false, errorMessage: '', loadState: 'profile_required', list: [] });
      return Promise.resolve(null);
    }
    this.setData({ loading: true, errorMessage: '', loadState: 'loading' });
    app.request({
      url: '/growth-records/history',
      method: 'GET',
      data: {
        childId: this.data.childId,
        page: 1,
        pageSize: 30
      }
    }).then(function(data) {
      var list = (data && data.list) || [];
      that.setData({ list: list, errorMessage: '', loadState: list.length ? 'ready' : 'empty' });
    }).catch(function(err) {
      that.setData({ errorMessage: app.getApiErrorMessage(err, '记录暂时没加载出来'), loadState: 'error' });
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  retryLoad: function() { this.loadHistory(); },

  loginAndReload: function() {
    var that = this;
    app.requireLoginForAction('请先完成微信登录，再查看成长记录').then(function(canOperate) {
      if (canOperate) that.loadHistory();
    });
  },

  goToChildSetup: function() {
    app.requireLoginForAction('请先完成微信登录，再完善孩子档案').then(function(canOperate) {
      if (canOperate) wx.navigateTo({ url: '/pages/profile/children/children' });
    });
  }
});
