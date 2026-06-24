// AI聊天页面
var app = getApp();
var msgIdCounter = 0;
var speechPlugin = null;
var recordRecognitionManager = null;

try {
  speechPlugin = requirePlugin('WechatSI');
  if (speechPlugin && speechPlugin.getRecordRecognitionManager) {
    recordRecognitionManager = speechPlugin.getRecordRecognitionManager();
  }
} catch (err) {
  speechPlugin = null;
  recordRecognitionManager = null;
}

function generateMsgId() {
  msgIdCounter++;
  return 'msg_' + Date.now() + '_' + msgIdCounter;
}

function getScrollToBottomPayload(targetIndex) {
  return {
    scrollToView: 'msg-' + targetIndex,
    scrollTop: 999999  // 大值强制 scroll-view 滚到底部
  };
}

Page({
  data: {
    messages: [],
    inputValue: '',
    loading: false,
    isRecording: false,
    isRecognizing: false,
    voiceSupported: false,
    voiceResultText: '',
    voiceResultVisible: false,
    voiceHint: '',
    scrollToView: '',
    scrollTop: 0,
    featureFlags: {
      aiChatEnabled: true,
      configLoaded: false
    }
  },

  onLoad: function() {
    this.syncFeatureFlags();
    this.initVoiceRecognition();
    var self = this;
    var saved = wx.getStorageSync('chatMessages');
    if (saved && saved.length > 0) {
      saved.forEach(function(msg) {
        if (msg.role !== 'user' && msg.content && !msg.markdownNodes) {
          msg.markdownNodes = self.parseMarkdownToNodes(msg.content);
        }
      });
      this.setData(Object.assign({
        messages: saved
      }, getScrollToBottomPayload(saved.length - 1)));
    }
  },

  onHide: function() {
    this.stopVoiceInput({ silent: true });
  },

  onUnload: function() {
    this.stopVoiceInput({ silent: true });
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

  initVoiceRecognition: function() {
    var self = this;
    if (!recordRecognitionManager) {
      this.setData({
        voiceSupported: false,
        voiceHint: '当前基础库暂不支持语音输入'
      });
      return;
    }

    recordRecognitionManager.onRecognize = function(res) {
      self.setData({
        isRecognizing: true,
        voiceHint: (res && res.result) ? ('正在识别：' + res.result) : '正在识别语音...'
      });
    };

    recordRecognitionManager.onStop = function(res) {
      var resultText = String((res && res.result) || '').trim();
      if (resultText) {
        var mergedText = resultText;
        if (self.data.inputValue) {
          mergedText = (self.data.inputValue + ' ' + resultText).trim();
        }
        self.setData({
          isRecording: false,
          isRecognizing: false,
          inputMode: 'text',
          voiceResultText: mergedText,
          voiceResultVisible: true,
          voiceHint: ''
        });
      } else {
        self.setData({
          isRecording: false,
          isRecognizing: false,
          voiceHint: ''
        });
        wx.showToast({ title: '没有识别到语音，请再说一次', icon: 'none' });
      }
    };

    recordRecognitionManager.onError = function() {
      self.setData({
        isRecording: false,
        isRecognizing: false,
        voiceHint: '语音识别失败，请换安静环境再试'
      });
      wx.showToast({ title: '语音识别失败', icon: 'none' });
    };

    this.setData({
      voiceSupported: true,
      voiceHint: '可先语音输入，再转成文字发送'
    });
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

  startVoiceInput: function() {
    if (!recordRecognitionManager) {
      wx.showToast({ title: '语音识别不可用', icon: 'none' });
      return;
    }
    this.setData({
      isRecording: true,
      isRecognizing: false,
      voiceHint: '正在录音，松开后自动识别文字'
    });
    recordRecognitionManager.start({
      lang: 'zh_CN',
      duration: 30000
    });
  },

  onVoiceTouchStart: function() {
    if (this.data.loading || this.data.isRecording || this.data.isRecognizing) {
      return;
    }
    this.startVoiceInput();
  },

  onVoiceTouchEnd: function() {
    if (!this.data.isRecording) {
      return;
    }
    this.stopVoiceInput();
  },

  onVoiceTouchCancel: function() {
    if (!this.data.isRecording) {
      return;
    }
    this.stopVoiceInput({ cancelled: true });
  },

  stopVoiceInput: function(options) {
    if (!recordRecognitionManager || !this.data.isRecording) {
      return;
    }
    var cancelled = !!(options && options.cancelled);
    this.setData({
      isRecording: false,
      isRecognizing: true,
      voiceHint: (options && options.silent)
        ? ((options && options.keepHint) ? this.data.voiceHint : '')
        : (cancelled ? '正在结束录音...' : '正在把语音转成文字...')
    });
    recordRecognitionManager.stop();
  },

  onFollowupTap: function(e) {
    const question = e.currentTarget.dataset.question;
    if (!question) return;
    this.setData({ inputValue: question });
    this.sendMessage();
  },

  onEditVoiceResult: function() {
    this.setData({
      inputValue: this.data.voiceResultText,
      voiceResultVisible: false,
      voiceResultText: ''
    });
  },

  onSendVoiceResult: function() {
    var text = this.data.voiceResultText;
    if (!text || !text.trim()) return;
    this.setData({
      inputValue: text,
      voiceResultVisible: false,
      voiceResultText: ''
    });
    this.sendMessage();
  },

  onDismissVoiceResult: function() {
    this.setData({
      voiceResultVisible: false,
      voiceResultText: ''
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

    if (!wx.getStorageSync('token')) {
      app.promptLogin('请先登录后再使用AI问答功能');
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
    this.setData(Object.assign({
      messages: newMessages,
      inputValue: '',
      loading: true
    }, getScrollToBottomPayload(newMessages.length - 1)));

    // 调用AI接口
    app.chat(userMessage.content).then(function(result) {
      var answer = (result && result.answer) ? result.answer : '抱歉，暂时无法回答，请稍后再试。';
      var sources = (result && result.sources) ? result.sources : [];

      var botMessage = {
        id: generateMsgId(),
        role: 'bot',
        content: answer,
        markdownNodes: self.parseMarkdownToNodes(answer),
        sources: sources,
        structured: (result && result.structured) || null
      };

      var updatedMessages = self.data.messages.concat([botMessage]);
      self.setData(Object.assign({
        messages: updatedMessages,
        loading: false
      }, getScrollToBottomPayload(updatedMessages.length - 1)));
      self.saveMessages();

    }).catch(function(error) {
      if (app.globalData.isDebug && (!error || error.code !== 'DEV_API_HOST_REQUIRED')) console.error('Chat error:', error);
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
      self.setData(Object.assign({
        messages: updatedMessages,
        loading: false
      }, getScrollToBottomPayload(updatedMessages.length - 1)));
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

  // 分享
  onShareAppMessage: function() {
    return {
      title: app.buildShareTitle('chat'),
      path: '/pages/index/index'
    };
  },

  parseMarkdownToNodes: function(text) {
    if (!text) return [];
    var nodes = [];
    var lines = String(text).split('\n');
    var i = 0;

    while (i < lines.length) {
      var line = lines[i];

      if (!line.trim()) {
        nodes.push({ name: 'br' });
        i++;
        continue;
      }

      if (/^#{1,3}\s/.test(line)) {
        var level = line.match(/^(#{1,3})/)[1].length;
        var headingText = line.replace(/^#{1,3}\s/, '');
        nodes.push({
          name: 'p',
          attrs: { style: 'font-weight:700;font-size:' + (36 - level * 4) + 'rpx;margin-top:16rpx;margin-bottom:8rpx;color:#2c2623;' },
          children: this.parseInlineMarkdown(headingText)
        });
        i++;
        continue;
      }

      if (/^[\*\-\+]\s/.test(line)) {
        var bulletText = line.replace(/^[\*\-\+]\s/, '');
        nodes.push({
          name: 'p',
          attrs: { style: 'padding-left:24rpx;margin-bottom:4rpx;line-height:1.8;' },
          children: [{ name: 'span', attrs: { style: 'color:#d65a1f;margin-right:12rpx;' }, children: [{ type: 'text', text: '•' }] }].concat(this.parseInlineMarkdown(bulletText))
        });
        i++;
        continue;
      }

      if (/^\d+[.。]\s/.test(line)) {
        var numText = line.replace(/^\d+[.。]\s/, '');
        var num = line.match(/^(\d+)/)[1];
        nodes.push({
          name: 'p',
          attrs: { style: 'padding-left:24rpx;margin-bottom:4rpx;line-height:1.8;' },
          children: [{ name: 'span', attrs: { style: 'color:#d65a1f;margin-right:8rpx;font-weight:600;' }, children: [{ type: 'text', text: num + '.' }] }].concat(this.parseInlineMarkdown(numText))
        });
        i++;
        continue;
      }

      nodes.push({
        name: 'p',
        attrs: { style: 'margin-bottom:8rpx;line-height:1.8;' },
        children: this.parseInlineMarkdown(line)
      });
      i++;
    }

    return nodes;
  },

  parseInlineMarkdown: function(text) {
    var children = [];
    var remaining = text || '';
    while (remaining.length > 0) {
      var boldMatch = remaining.match(/^(.*?)\*\*(.+?)\*\*/);
      if (boldMatch) {
        if (boldMatch[1]) children.push({ type: 'text', text: boldMatch[1] });
        children.push({ name: 'span', attrs: { style: 'font-weight:700;' }, children: [{ type: 'text', text: boldMatch[2] }] });
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }
      children.push({ type: 'text', text: remaining });
      break;
    }
    return children;
  }

});
