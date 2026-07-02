var app = getApp();

Page({
  data: {
    types: ['功能异常/Bug', '体验建议', '内容问题', '其他'],
    typeIndex: 0,
    content: '',
    contact: '',
    submitting: false,
    canSubmit: false,
    history: []
  },

  onLoad: function () {
    this.loadHistory();
  },

  onTypeChange: function (e) {
    this.setData({ typeIndex: parseInt(e.detail.value) });
  },

  onContentInput: function (e) {
    var val = e.detail.value || '';
    this.setData({
      content: val,
      canSubmit: val.trim().length >= 5
    });
  },

  onContactInput: function (e) {
    this.setData({ contact: e.detail.value || '' });
  },

  submitFeedback: function () {
    var that = this;
    var content = this.data.content.trim();

    if (content.length < 5) {
      wx.showToast({ title: '请至少输入5个字', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    app.request({
      url: '/feedback',
      method: 'POST',
      data: {
        type: this.data.types[this.data.typeIndex],
        content: content,
        contact: this.data.contact.trim()
      }
    }).then(function () {
      wx.showToast({ title: '感谢反馈！', icon: 'success' });
      that.setData({
        content: '',
        contact: '',
        canSubmit: false,
        submitting: false
      });
      that.loadHistory();
    }).catch(function (err) {
      that.setData({ submitting: false });
      wx.showToast({
        title: app.getApiErrorMessage(err, '反馈没提交成功，请稍后再试'),
        icon: 'none'
      });
    });
  },

  loadHistory: function () {
    var that = this;
    if (!app.globalData.isLoggedIn) return;

    app.request({
      url: '/feedback',
      method: 'GET'
    }).then(function (data) {
      that.setData({ history: (data && data.list) || [] });
    }).catch(function () {
      // history load is optional, skip silently
    });
  }
});
