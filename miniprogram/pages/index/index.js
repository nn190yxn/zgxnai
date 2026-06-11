// 首页逻辑
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    featureFlags: {
      aiChatEnabled: true,
      multimodalEnabled: true,
      paymentEnabled: false,
      configLoaded: false
    },
    startupSafeMode: false,
    heroImageReady: false,
    growthStatus: {
      weekCompletion: 68,
      currentFocus: '先判断孩子卡在哪',
      todaySuggestion: '从成长观察或AI问答开始'
    },
    todayTask: {
      title: '今日建议：先做一次成长观察',
      duration: '3分钟了解孩子近期表现'
    },
    weeklyProgress: {
      understandingFrom: 62,
      understandingTo: 74,
      streakDays: 5
    },
    bannerList: [
      {
        title: '孩子的问题，先别靠猜',
        desc: '专注、表达、阅读、吃饭睡眠，3分钟帮妈妈找到切入口',
        cta: '立即观察',
        action: 'assessment'
      },
      {
        title: '育儿问题随时问',
        desc: '把孩子的具体情况说清楚，获得可执行的家庭建议',
        cta: '问问AI助理',
        action: 'chat'
      },
      {
        title: '每天一点点，妈妈更有底',
        desc: '观察、练习、饮食、知识都放在一个育儿助手里',
        cta: '查看工具',
        action: 'assessment'
      }
    ]
  },

  onLoad() {
    this._runtimeConfigLoading = false;
    if (app.globalData.enableStartupSafeMode) {
      this.setData({ startupSafeMode: true });
      return;
    }
    this.syncFeatureFlags();
    this.checkLogin();
    this.loadReadingStatus();
    this.captureShareSource();
    this.deferHeroImage();
  },

  onShow() {
    if (app.globalData.enableStartupSafeMode) {
      return;
    }
    this.syncFeatureFlags();
    this.checkLogin();
    this.loadReadingStatus();
    this.deferHeroImage();
  },

  deferHeroImage() {
    if (this.data.heroImageReady) {
      return;
    }
    setTimeout(() => {
      this.setData({ heroImageReady: true });
    }, 300);
  },

  syncFeatureFlags() {
    var runtimeConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : {};
    var shouldFetchRuntimeConfig = !!(app.globalData && app.globalData.enableRuntimeConfigFetch);
    this.setData({
      featureFlags: runtimeConfig
    });
    if (shouldFetchRuntimeConfig && app.loadRuntimeConfig && !this._runtimeConfigLoading && !runtimeConfig.configLoaded) {
      this._runtimeConfigLoading = true;
      app.loadRuntimeConfig().then(() => {
        this.setData({
          featureFlags: app.getRuntimeConfig()
        });
      }).finally(() => {
        this._runtimeConfigLoading = false;
      });
    }
  },

  captureShareSource() {
    try {
      var pages = getCurrentPages();
      var current = pages[pages.length - 1];
      var options = (current && current.options) || {};
      if (options.shareSource) {
        var sourceInfo = {
          source: options.shareSource,
          from: options.from || '',
          timestamp: Date.now()
        };
        wx.setStorageSync('lastShareSource', sourceInfo);
        app.appendShareEventLog({
          type: 'share_entry',
          source: sourceInfo.source,
          from: sourceInfo.from,
          timestamp: sourceInfo.timestamp,
          page: 'index'
        });
        app.trackKbEvent({
          event_type: 'share_entry',
          share_source: sourceInfo.source,
          event_meta: { from: sourceInfo.from, page: 'index' }
        });
      }
    } catch (e) {
      // 忽略来源解析异常
    }
  },

  loadReadingStatus() {
    var stats = app.getReadingTaskStats();
    var shareDraft = wx.getStorageSync('readingShareDraft') || {};
    var metrics = shareDraft.metrics || {};
    var completionRate = stats.completionRate || 0;
    var completed = stats.completed || 0;
    var total = stats.total || 0;

    // 优先使用最近周报/分享草稿中的指标，其次使用全局统计
    if (metrics.total > 0) {
      completionRate = metrics.completionRate || completionRate;
      completed = metrics.completed || completed;
      total = metrics.total || total;
    }

    var streakDays = metrics.streakDays || this.data.weeklyProgress.streakDays;

    var suggestion = total > 0 ? ('已完成 ' + completed + '/' + total + ' 项阅读力任务') : '从成长观察或AI问答开始';

    this.setData({
      growthStatus: {
        weekCompletion: completionRate || this.data.growthStatus.weekCompletion,
        currentFocus: '先判断孩子卡在哪',
        todaySuggestion: suggestion
      },
      weeklyProgress: {
        understandingFrom: this.data.weeklyProgress.understandingFrom,
        understandingTo: Math.max(this.data.weeklyProgress.understandingTo, completionRate),
        streakDays: streakDays
      }
    });
  },

  // 检查登录状态
  checkLogin() {
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  // 跳转到AI问答
  goToChat() {
    if (app.isFeatureEnabled && !app.isFeatureEnabled('aiChat')) {
      wx.showToast({
        title: 'AI问答暂未开放',
        icon: 'none'
      });
      return;
    }
    wx.switchTab({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 跳转到成长观察
  goToAssessment() {
    wx.navigateTo({
      url: '/pages/assessment/assessment',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 跳转到营养
  goToNutrition() {
    wx.navigateTo({
      url: '/pages/nutrition/nutrition',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 跳转到育儿
  goToParenting() {
    wx.navigateTo({
      url: '/pages/parenting/parenting',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 跳转到能力成长
  goToTextbook() {
    wx.navigateTo({
      url: '/pages/textbook/textbook',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看今日任务
  goToTodayTask() {
    wx.navigateTo({
      url: '/pages/textbook/textbook',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看进步报告
  goToWeeklyReport() {
    wx.navigateTo({
      url: '/pages/assessment/history/history',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onTapBannerCta(e) {
    var action = e.currentTarget.dataset.action;
    if (action === 'assessment') {
      this.goToAssessment();
      return;
    }
    if (action === 'task') {
      this.goToTodayTask();
      return;
    }
    if (action === 'chat') {
      this.goToChat();
      return;
    }
    this.goToWeeklyReport();
  },

  onShareTaskCard() {
    var stats = app.getReadingTaskStats();
    var draft = {
      type: 'app_intro',
      title: this.data.todayTask.title || '成长观察建议',
      summary: '我正在用小牛育儿AI助理观察孩子的成长状态。',
      metrics: {
        completed: stats.completed || 0,
        total: stats.total || 0,
        completionRate: stats.completionRate || 0,
        streakDays: this.data.weeklyProgress.streakDays || 0,
        recordingCount: wx.getStorageSync('readingRecordingCount') || 0
      },
      source: 'index_app_intro',
      createdAt: Date.now(),
      payload: {
        scene: 'home_intro_card'
      }
    };
    wx.setStorageSync('readingShareDraft', draft);
    app.trackKbEvent({
      event_type: 'share_preview',
      share_source: draft.source,
      event_meta: { scene: draft.payload.scene }
    });
    wx.navigateTo({
      url: '/pages/share/preview/preview',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onShareProgressCard() {
    var stats = app.getReadingTaskStats();
    var draft = {
      type: 'weekly_report',
      title: '本周成长成果卡',
      summary: '本周坚持阅读与专注训练，继续加油！',
      metrics: {
        completed: stats.completed || 0,
        total: stats.total || 0,
        completionRate: stats.completionRate || this.data.growthStatus.weekCompletion || 0,
        streakDays: this.data.weeklyProgress.streakDays || 0,
        recordingCount: wx.getStorageSync('readingRecordingCount') || 0
      },
      source: 'index_weekly_progress',
      createdAt: Date.now(),
      payload: {
        scene: 'home_weekly_progress'
      }
    };
    wx.setStorageSync('readingShareDraft', draft);
    app.trackKbEvent({
      event_type: 'share_preview',
      share_source: draft.source,
      event_meta: { scene: draft.payload.scene }
    });
    wx.navigateTo({
      url: '/pages/share/preview/preview',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    var draft = wx.getStorageSync('readingShareDraft') || {};
    var source = draft.type || 'index_default';
    return {
      title: app.buildShareTemplate(draft),
      path: '/pages/index/index?shareSource=' + encodeURIComponent(source) + '&from=index',
      imageUrl: '/images/share-app-intro.png'
    };
  }
});

