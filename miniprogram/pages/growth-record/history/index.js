var app = getApp();

Page({
  data: {
    childId: 0,
    list: [],
    loading: false
  },

  onLoad: function(options) {
    this.setData({ childId: Number((options && options.childId) || 0) });
    this.loadHistory();
  },

  loadHistory: function() {
    var that = this;
    if (!this.data.childId) {
      return;
    }
    this.setData({ loading: true });
    app.request({
      url: '/growth-records/history',
      method: 'GET',
      data: {
        childId: this.data.childId,
        page: 1,
        pageSize: 30
      }
    }).then(function(data) {
      that.setData({ list: (data.list || []) });
    }).catch(function(err) {
      wx.showToast({ title: app.getApiErrorMessage(err, '记录没加载出来'), icon: 'none' });
    }).finally(function() {
      that.setData({ loading: false });
    });
  }
});
