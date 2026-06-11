// AI聊天页面
var app = getApp();
var msgIdCounter = 0;

function generateMsgId() {
  msgIdCounter++;
  return 'msg_' + Date.now() + '_' + msgIdCounter;
}

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    scrollToView: '',
    featureFlags: {
      aiChatEnabled: true,
      configLoaded: false
    },
    operationItems: [
      {
        icon: '🧠',
        title: '成长观察',
        desc: '通过测评和观察记录了解孩子能力发展情况，形成家庭训练建议。',
        type: 'assessment'
      },
      {
        icon: '🥗',
        title: '营养食谱',
        desc: '提供儿童早餐、加餐、营养搭配和贵州本地食材参考。',
        type: 'nutrition'
      },
      {
        icon: '📚',
        title: '育儿知识',
        desc: '整理亲子沟通、情绪管理、习惯培养和家庭教育内容。',
        type: 'parenting'
      },
      {
        icon: '📖',
        title: '能力成长',
        desc: '提供阅读力提升、口头复述录音、每日打卡和成长周报。',
        type: 'textbook'
      }
    ],
    sampleQuestions: [
      '孩子早餐怎么搭配更营养？',
      '孩子发脾气时家长怎么沟通？',
      '如何在家做阅读力训练？'
    ]
  },

  onLoad: function() {
    this.syncFeatureFlags();
    // 恢复聊天记录
    var saved = wx.getStorageSync('chatMessages');
    if (saved && saved.length > 0) {
      this.setData({
        messages: saved,
        scrollToView: 'msg-' + (saved.length - 1)
      });
    }
  },

  syncFeatureFlags: function() {
    var that = this;
    var runtimeConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : {};
    var shouldFetchRuntimeConfig = !!(app.globalData && app.globalData.enableRuntimeConfigFetch);
    that.setData({
      featureFlags: {
        aiChatEnabled: runtimeConfig.aiChatEnabled !== undefined ? !!runtimeConfig.aiChatEnabled : true,
        configLoaded: !!runtimeConfig.configLoaded
      }
    });

    if (shouldFetchRuntimeConfig && app.loadRuntimeConfig && !runtimeConfig.configLoaded) {
      app.loadRuntimeConfig().then(function() {
        var config = app.getRuntimeConfig ? app.getRuntimeConfig() : {};
        that.setData({
          featureFlags: {
            aiChatEnabled: config.aiChatEnabled !== undefined ? !!config.aiChatEnabled : true,
            configLoaded: !!config.configLoaded
          }
        });
      });
    }
  },

  // 保存聊天记录到本地
  saveMessages: function() {
    var messages = this.data.messages || [];
    var MAX_MESSAGES = 100;
    if (messages.length > MAX_MESSAGES) {
      messages = messages.slice(messages.length - MAX_MESSAGES);
      this.setData({ messages: messages });
    }
    wx.setStorageSync('chatMessages', messages);
  },

  // 输入内容变化
  onInput: function(e) {
    this.setData({
      inputValue: e.detail.value
    });
  },

  // 发送消息
  sendMessage: function() {
    var self = this;
    var inputValue = this.data.inputValue;
    var loading = this.data.loading;
    var messages = this.data.messages;

    if (!this.data.featureFlags.aiChatEnabled) {
      wx.showToast({
        title: 'AI问答暂未开放',
        icon: 'none'
      });
      return;
    }

    if (!inputValue.trim() || loading) return;

    // 输入长度限制
    var MAX_INPUT_LENGTH = 2000;
    var trimmedInput = inputValue.trim();
    if (trimmedInput.length > MAX_INPUT_LENGTH) {
      wx.showToast({
        title: '输入内容不能超过' + MAX_INPUT_LENGTH + '个字符',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 添加用户消息
    var userMessage = {
      id: generateMsgId(),
      role: 'user',
      content: trimmedInput
    };

    var newMessages = messages.concat([userMessage]);
    this.setData({
      messages: newMessages,
      inputValue: '',
      loading: true,
      scrollToView: 'msg-' + (newMessages.length - 1)
    });

    // 调用AI接口
    app.chat(userMessage.content).then(function(result) {
      var answer = (result && result.answer) ? result.answer : '抱歉，暂时无法回答，请稍后再试。';
      var sources = (result && result.sources) ? result.sources : [];

      var botMessage = {
        id: generateMsgId(),
        role: 'bot',
        content: answer,
        sources: sources
      };

      var updatedMessages = self.data.messages.concat([botMessage]);
      self.setData({
        messages: updatedMessages,
        loading: false,
        scrollToView: 'msg-' + (updatedMessages.length - 1)
      });
      self.saveMessages();

    }).catch(function(error) {
      if (app.globalData.isDebug) console.error('Chat error:', error);
      var errorText = app.getApiErrorMessage(
        error,
        '抱歉，暂时无法回答，请稍后再试。'
      );

      var errorMessage = {
        id: generateMsgId(),
        role: 'bot',
        content: errorText,
        isError: true
      };

      var updatedMessages = self.data.messages.concat([errorMessage]);
      self.setData({
        messages: updatedMessages,
        loading: false,
        scrollToView: 'msg-' + (updatedMessages.length - 1)
      });
      self.saveMessages();
    });
  },

  // 清空聊天
  clearChat: function() {
    var self = this;
    wx.showModal({
      title: '提示',
      content: '确定要清空聊天记录吗？',
      success: function(res) {
        if (res.confirm) {
          self.setData({ messages: [] });
          wx.removeStorageSync('chatMessages');
        }
      }
    });
  },

  goToAssessment: function() {
    wx.navigateTo({
      url: '/pages/assessment/assessment',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  goToParenting: function() {
    wx.navigateTo({
      url: '/pages/parenting/parenting',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onOperationItemTap: function(e) {
    var type = e.currentTarget.dataset.type;
    var urlMap = {
      assessment: '/pages/assessment/assessment',
      nutrition: '/pages/nutrition/nutrition',
      parenting: '/pages/parenting/parenting',
      textbook: '/pages/textbook/textbook'
    };
    var url = urlMap[type] || '/pages/index/index';
    wx.navigateTo({
      url: url,
      fail: function() {
        wx.switchTab({
          url: url,
          fail: function() {
            wx.showToast({ title: '页面跳转失败', icon: 'none' });
          }
        });
      }
    });
  },

  useSampleQuestion: function(e) {
    var question = e.currentTarget.dataset.question || '';
    this.setData({ inputValue: question });
    if (!this.data.featureFlags.aiChatEnabled) {
      wx.showToast({ title: 'AI问答配置中，可先查看正式内容', icon: 'none' });
    }
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理 - 儿童成长智能问答',
      path: '/pages/index/index'
    };
  }
});
