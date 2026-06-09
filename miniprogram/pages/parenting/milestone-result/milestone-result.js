const { request } = require('../../../utils/request');

Page({
  data: {
    history: []
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    request({
      url: '/parenting/milestone/history',
      method: 'GET'
    }).then(res => {
      if (res.success && res.data) {
        this.setData({ history: res.data });
      }
    }).catch(err => {
      console.error('加载历史失败:', err);
    });
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/parenting/milestone/milestone?historyId=${id}`
    });
  },

  startNewAssessment() {
    wx.navigateTo({
      url: '/pages/parenting/milestone/milestone'
    });
  }
});
