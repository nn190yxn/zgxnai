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
    growthStatus: {
      weekCompletion: 68,
      currentFocus: '阅读力提升',
      todaySuggestion: '完成10分钟阅读任务'
    },
    todayTask: {
      title: '阅读力提升：短文理解 + 3题',
      duration: '预计10分钟'
    },
    weeklyProgress: {
      understandingFrom: 62,
      understandingTo: 74,
      streakDays: 5
    },
    bannerList: [
      {
        title: '3分钟看清孩子问题在哪',
        desc: '阅读理解、专注习惯、表达能力，一测就明白',
        cta: '立即查看',
        action: 'assessment'
      },
      {
        title: '每天10分钟，21天看变化',
        desc: '家庭可执行任务，不再知道但做不到',
        cta: '开始任务',
        action: 'task'
      },
      {
        title: '不是上了课，而是有进步',
        desc: '周报自动生成，成长轨迹清晰可见',
        cta: '查看周报',
        action: 'report'
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
  },

  onShow() {
    if (app.globalData.enableStartupSafeMode) {
      return;
    }
    this.syncFeatureFlags();
    this.checkLogin();
    this.loadReadingStatus();
  },

  syncFeatureFlags() {
    var runtimeConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : {};
    this.setData({
      featureFlags: runtimeConfig
    });
    if (app.loadRuntimeConfig && !this._runtimeConfigLoading && !runtimeConfig.configLoaded) {
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

    var suggestion = total > 0 ? ('已完成 ' + completed + '/' + total + ' 项阅读力任务') : '完成10分钟阅读力任务';

    this.setData({
      growthStatus: {
        weekCompletion: completionRate || this.data.growthStatus.weekCompletion,
        currentFocus: '阅读力提升',
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
    this.goToWeeklyReport();
  },

  onShareTaskCard() {
    var stats = app.getReadingTaskStats();
    var draft = {
      type: 'task_checkin',
      title: this.data.todayTask.title || '阅读力提升任务',
      summary: '我正在进行阅读打卡，欢迎一起坚持！',
      metrics: {
        completed: stats.completed || 0,
        total: stats.total || 0,
        completionRate: stats.completionRate || 0,
        streakDays: this.data.weeklyProgress.streakDays || 0,
        recordingCount: wx.getStorageSync('readingRecordingCount') || 0
      },
      source: 'index_today_task',
      createdAt: Date.now(),
      payload: {
        scene: 'home_today_task'
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
      path: '/pages/index/index?shareSource=' + encodeURIComponent(source) + '&from=index'
    };
  }
});

