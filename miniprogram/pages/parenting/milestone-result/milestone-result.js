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
    const formattedHistory = history.map((item, index) => {
      const previous = history[index + 1];
      const trend = this.getTrend(item, previous);

      return {
        ...item,
        ageLabel: this.getAgeLabel(item.ageRange),
        createdAtText: this.formatDate(item.created_at || item.createdAt),
        trendText: trend.text,
        trendClass: trend.className
      };
    });
    
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

  getAgeLabel(ageRange) {
    const matched = milestoneData.ageRanges.find(item => item.id === ageRange);
    return matched ? matched.name : ageRange;
  },

  getTrend(current, previous) {
    if (!previous) {
      return { text: '首次记录，建议4-8周后复测', className: 'neutral' };
    }

    const diff = current.overallPercentage - previous.overallPercentage;
    if (diff >= 5) {
      return { text: `较上次提升 ${diff}%`, className: 'up' };
    }

    if (diff <= -5) {
      return { text: `较上次下降 ${Math.abs(diff)}%`, className: 'down' };
    }

    return { text: '较上次基本稳定', className: 'neutral' };
  },

  viewDetail(e) {
    const id = e.currentTarget.dataset.id;
    const history = milestoneData.getHistory();
    const assessment = history.find(item => String(item.id) === String(id));
    
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
