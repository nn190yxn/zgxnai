const milestoneData = require('../milestone/milestoneData');

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
    // 纯前端实现：从本地存储读取历史记录
    const history = milestoneData.getHistory();
    
    // 格式化日期显示
    const formattedHistory = history.map(item => ({
      ...item,
      created_at: this.formatDate(item.created_at)
    }));
    
    this.setData({ history: formattedHistory });
  },

  formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    const history = milestoneData.getHistory();
    const assessment = history.find(item => item.id === id);
    
    if (assessment) {
      // 跳转到评估页面查看详情
      wx.navigateTo({
        url: `/pages/parenting/milestone/milestone?historyId=${id}`
      });
    }
  },

  startNewAssessment() {
    wx.navigateTo({
      url: '/pages/parenting/milestone/milestone'
    });
  }
});
