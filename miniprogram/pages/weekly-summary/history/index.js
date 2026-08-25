var app = getApp();

Page({
  data: {
    childId: 0,
    currentChild: null,
    loading: false,
    errorMessage: '',
    list: []
  },

  onLoad: function(options) {
    var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : null);
    var childId = Number((options && options.childId) || (child && child.id) || 0);
    this.setData({ childId: childId, currentChild: child });
    this.loadHistory();
  },

  loadHistory: function() {
    var that = this;
    if (!this.data.childId) return;
    this.setData({ loading: true, errorMessage: '' });
    app.request({
      url: '/weekly-summary/history',
      method: 'GET',
      data: { childId: this.data.childId, limit: 20 }
    }).then(function(data) {
      that.setData({ list: data && Array.isArray(data.list) ? data.list : [] });
    }).catch(function(err) {
      that.setData({ errorMessage: app.getApiErrorMessage(err, '历史报告暂时没加载出来') });
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  retryLoad: function() {
    this.loadHistory();
  }
});
