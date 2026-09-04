var app = getApp();
var feedbackFlow = require('../../../utils/feedback-flow.js');

Page({
  data: {
    types: ['功能异常/Bug', '体验建议', '内容问题', '其他'],
    typeIndex: 0,
    content: '',
    contact: '',
    submitting: false,
    canSubmit: false,
    callbackRequested: false,
    history: [],
    historyLoading: false,
    historyError: ''
  },

  onShow: function () {
    this.loadHistory();
  },

  onTypeChange: function (e) {
    this.setData({ typeIndex: parseInt(e.detail.value) });
  },

  onContentInput: function (e) {
    var val = e.detail.value || '';
    this.setData({
      content: val,
      canSubmit: feedbackFlow.canSubmitFeedback(val, this.data.callbackRequested, this.data.contact)
    });
  },

  onContactInput: function (e) {
    var contact = e.detail.value || '';
    this.setData({
      contact: contact,
      canSubmit: feedbackFlow.canSubmitFeedback(this.data.content, this.data.callbackRequested, contact)
    });
  },

  onCallbackChange: function (e) {
    var callbackRequested = !!e.detail.value;
    this.setData({
      callbackRequested: callbackRequested,
      canSubmit: feedbackFlow.canSubmitFeedback(this.data.content, callbackRequested, this.data.contact)
    });
  },

  submitFeedback: function () {
    if (this.data.submitting) {
      return;
    }

    var that = this;
    var content = this.data.content.trim();
    var contact = this.data.contact.trim();

    if (content.length < 5) {
      wx.showToast({ title: '请至少输入5个字', icon: 'none' });
      return;
    }

    if (this.data.callbackRequested && !contact) {
      wx.showToast({ title: '请填写手机号或微信号', icon: 'none' });
      return;
    }

    app.requireLoginForAction('请先完成微信登录，再提交反馈').then(function(canSubmit) {
      if (!canSubmit) {
        return;
      }

      that.setData({ submitting: true });
      var systemInfo = {};
      try {
        systemInfo = wx.getSystemInfoSync();
      } catch (error) {
        systemInfo = {};
      }

      return app.request({
        url: '/feedback',
        method: 'POST',
        data: {
          type: that.data.types[that.data.typeIndex],
          content: content,
          contact: contact,
          child_id: app.getCurrentChild && app.getCurrentChild() ? app.getCurrentChild().id : null,
          source_page: 'profile_feedback',
          channel: that.data.callbackRequested ? 'callback_request' : 'feedback',
          device_info: feedbackFlow.normalizeDeviceInfo(systemInfo)
        }
      }).then(function () {
        wx.showToast({ title: that.data.callbackRequested ? '已提交回访请求' : '反馈已提交', icon: 'success' });
        that.setData({
          content: '',
          contact: '',
          callbackRequested: false,
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
    });
  },

  loadHistory: function () {
    var that = this;
    var userInfo = app.globalData.userInfo || {};
    if (!app.globalData.isLoggedIn || !wx.getStorageSync('token') || !userInfo.id) {
      that.setData({ history: [], historyLoading: false, historyError: '' });
      return;
    }
    var cacheKey = 'feedbackHistory:' + userInfo.id;
    that.setData({ historyLoading: true, historyError: '' });

    app.request({
      url: '/feedback/history',
      method: 'GET'
    }).then(function (data) {
      var history = feedbackFlow.normalizeHistory((data && data.list) || []);
      wx.setStorageSync(cacheKey, history);
      that.setData({ history: history, historyLoading: false, historyError: '' });
    }).catch(function () {
      var cached = feedbackFlow.normalizeHistory(wx.getStorageSync(cacheKey) || []);
      that.setData({
        history: cached,
        historyLoading: false,
        historyError: cached.length ? '进展暂未刷新，当前显示上次记录' : '进展加载失败，请稍后重试'
      });
    });
  },

  retryHistory: function () {
    this.loadHistory();
  }
});
