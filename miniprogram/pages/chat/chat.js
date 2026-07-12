// 小牛聊天页面
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

var scrollBottomCounter = 0;

function scrollToBottom(page) {
  scrollBottomCounter++;
  page.setData({
    scrollTop: 99999000 + scrollBottomCounter
  });
}

function flushScrollToBottom(page, delayMs) {
  var ms = typeof delayMs === 'number' ? delayMs : 80;
  setTimeout(function () {
    scrollToBottom(page);
  }, ms);
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
      this.setData({
        messages: saved
      });
      flushScrollToBottom(this, 150);
    }
    this.applyPendingQuestion();
  },

  onShow: function() {
    this.applyPendingQuestion();
  },

  applyPendingQuestion: function() {
    var question = String(wx.getStorageSync('pendingChatQuestion') || '').trim();
    if (!question) {
      question = this.buildPendingCoreActionQuestion(wx.getStorageSync('pendingCoreActionContext'));
    }
    if (!question) {
      return;
    }
    wx.removeStorageSync('pendingChatQuestion');
    wx.removeStorageSync('pendingCoreActionContext');
    this.setData({ inputValue: question });
    wx.showToast({ title: '已带入问题，可直接发送', icon: 'none' });
  },

  buildPendingCoreActionQuestion: function(context) {
    if (!context || context.source !== 'home_core_action_result') {
      return '';
    }
    var steps = Array.isArray(context.actionSteps) && context.actionSteps.length
      ? ('今晚第一步：' + context.actionTitle + '\n具体步骤：' + context.actionSteps.join('；'))
      : ('今晚第一步：' + (context.actionTitle || '未填写'));
    var abilityText = Array.isArray(context.abilityTags) && context.abilityTags.length
      ? context.abilityTags.join('、')
      : '未填写';
    var observableText = Array.isArray(context.observableSigns) && context.observableSigns.length
      ? context.observableSigns.join('、')
      : '未填写';
    return [
      '我想继续追问孩子这个卡点的细节。',
      '年龄：' + (context.ageGroup || '未确认'),
      '年龄段Key：' + (context.ageSegmentKey || '未填写'),
      '场景：' + (context.sceneLabel || '未填写'),
      '痛点：' + (context.painPointTitle || '未填写'),
      '表现：' + (context.symptomLabel || '未填写'),
      '可观察表现：' + observableText,
      '背后能力：' + abilityText,
      '卡点判断：' + (context.bottleneckTitle || '未填写'),
      '判断解释：' + (context.bottleneckText || '未填写'),
      steps,
      '请围绕这个年龄段、痛点、背后能力和卡点，帮我细化今晚怎么说、怎么做、孩子反应不同怎么办，以及明天要观察什么。'
    ].join('\n');
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
      wx.showToast({ title: '没听清，请换个安静地方再说一次', icon: 'none' });
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

  askForTodaySteps: function() {
    if (this.data.loading) {
      return;
    }
    var messages = this.data.messages || [];
    var lastAnswer = '';
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== 'user' && !messages[i].isError && messages[i].content) {
        lastAnswer = String(messages[i].content).trim();
        break;
      }
    }
    var context = lastAnswer ? ('这是刚才的建议：' + lastAnswer.slice(0, 600) + '\n\n') : '';
    this.setData({ inputValue: context + '请把刚才的建议整理成今晚可以执行的三步，每一步都要简单、可观察。' });
    this.sendMessage();
  },

  generateSevenDayPlan: function() {
    var that = this;
    if (that.data.loading) {
      return;
    }
    var messages = that.data.messages || [];
    var lastAnswer = '';
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== 'user' && !messages[i].isError && messages[i].content) {
        lastAnswer = String(messages[i].content).trim();
        break;
      }
    }
    if (!lastAnswer) {
      wx.showToast({ title: '先问一个具体问题，再生成计划', icon: 'none' });
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      wx.showToast({ title: '请先在首页完善孩子档案', icon: 'none' });
      return;
    }
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      wx.showLoading({ title: '生成计划中...' });
      return app.request({
        url: '/daily-plan/generate',
        method: 'POST',
        data: {
          childId: currentChild.id,
          source_type: 'ai_answer',
          source_title: lastAnswer.substring(0, 60).replace(/\n/g, ' ') + '...',
          source_summary: lastAnswer.substring(0, 500)
        }
      });
    }).then(function() {
      wx.hideLoading();
      wx.showToast({ title: '7天计划已生成', icon: 'success' });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'daily_plan_generate',
          module_key: 'daily_plan',
          page_key: 'chat',
          event_meta: { source_type: 'ai_answer' }
        });
      }
    }).catch(function(err) {
      wx.hideLoading();
      if (err && err.code === 'TOKEN_EXPIRED') {
        wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
        return;
      }
      wx.showToast({ title: '计划没生成，请再试一次', icon: 'none' });
    });
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
        title: '小牛问答还在准备中',
        icon: 'none'
      });
      return;
    }

    if (!wx.getStorageSync('token')) {
      app.promptLogin('请先登录后再使用小牛问答');
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
      loading: true
    });
    flushScrollToBottom(this, 80);

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
        structured: (result && result.structured) || null,
        followUpQuestions: (result && result.follow_up_questions) || [],
        saveAvailable: result && result.save_available !== false,
        planAvailable: !!(result && result.plan_available)
      };

      var updatedMessages = self.data.messages.concat([botMessage]);
      self.setData({
        messages: updatedMessages,
        loading: false
      });
      flushScrollToBottom(self, 80);
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
      self.setData({
        messages: updatedMessages,
        loading: false
      });
      flushScrollToBottom(self, 80);
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
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToParenting: function() {
    wx.navigateTo({
      url: '/pages/parenting/parenting',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToParentingSearch: function() {
    wx.navigateTo({
      url: '/pages/parenting/search/search',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToGrowthRecord: function() {
    wx.navigateTo({
      url: '/pages/growth-record/index',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  saveAiAnswerToGrowthRecord: function() {
    var that = this;
    var messages = that.data.messages || [];
    var lastBot = null;
    for (var i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'bot' && !messages[i].isError) {
        lastBot = messages[i];
        break;
      }
    }
    if (!lastBot || !lastBot.content) {
      wx.showToast({ title: '现在还没有可保存的回答', icon: 'none' });
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      wx.showToast({ title: '请先在首页完善孩子档案', icon: 'none' });
      return;
    }
    var title = (lastBot.content || '').substring(0, 40).replace(/\n/g, ' ') + '...';
    var summary = (lastBot.content || '').substring(0, 500);
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      return app.request({
        url: '/growth-records/entry',
        method: 'POST',
        data: {
          childId: currentChild.id,
          entry_type: 'ai_answer',
          title: title,
          summary: summary,
          source_id: 'chat_' + Date.now()
        }
      });
    }).then(function() {
      wx.showToast({ title: '已保存到成长记录', icon: 'success' });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'growth_record_save',
          module_key: 'growth_record',
          page_key: 'chat',
          event_meta: { entry_type: 'ai_answer' }
        });
      }
    }).catch(function() {
      wx.showToast({ title: '没保存成功，请再试一次', icon: 'none' });
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
