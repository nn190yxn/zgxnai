// 首页逻辑
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    featureFlags: {
      aiChatEnabled: true,
      assessmentsEnabled: true,
      educationEnabled: true,
      parentingEnabled: true,
      growthRecordEnabled: true,
      weeklySummaryEnabled: true,
      sceneSearchEnabled: true,
      multimodalEnabled: true,
      paymentEnabled: false,
      configLoaded: false
    },
    startupSafeMode: false,
    heroImageReady: false,
    growthStatus: {
      weekCompletion: 68,
      currentFocus: '围绕成长观察、能力训练和成长记录安排今天的育儿重点',
      todaySuggestion: '从成长观察、能力成长或成长记录中选择一个开始'
    },
    dailyPlanLoading: false,
    dailyPlanCards: [],
    dailyPlanDate: '',
    dailyPlanCompletedCount: 0,
    dailyPlanEmptyText: '',
    membershipTouchpointVisible: false,
    membershipTouchpointTitle: '宝贝每周成长总结',
    membershipTouchpointDesc: '可查看更完整的每周成长总结、趋势提醒和陪伴建议。',
    todayTask: {
      title: '今日建议：开始今天的成长观察',
      duration: '3分钟了解孩子近期状态'
    },
    weeklyProgress: {
      headline: '连续记录几天后，本周成长总结会更完整',
      summary: '把每天的成长变化记录下来，系统会整理出更清晰的阶段总结。',
      streakDays: 0,
      actionText: '查看完整周报',
      premiumUnlocked: false
    },
    bannerList: [
      {
        title: '宝贝成长观察',
        desc: '围绕吃饭、睡眠、表达、情绪和习惯，了解孩子近期成长状态',
        cta: '开始观察',
        action: 'assessment'
      },
      {
        title: '育儿问题解答',
        desc: '结合孩子的具体情况，获得更清晰的家庭陪伴建议',
        cta: '问问AI助理',
        action: 'chat'
      },
      {
        title: '宝贝成长记录',
        desc: '把观察、练习、饮食和成长变化整理在一起，持续记录成长过程',
        cta: '查看功能',
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
    this.loadDailyPlan();
    this.loadWeeklyProgress();
    this.loadMembershipTouchpoint();
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
    this.loadDailyPlan();
    this.loadWeeklyProgress();
    this.loadMembershipTouchpoint();
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
      if (options.invite_code || options.inviteCode) {
        wx.setStorageSync('inviteCode', options.invite_code || options.inviteCode);
      }
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

    var suggestion = total > 0 ? ('已完成 ' + completed + '/' + total + ' 项能力成长任务') : '从成长观察、能力成长或成长记录中选择一个开始';

    this.setData({
        growthStatus: {
          weekCompletion: completionRate || this.data.growthStatus.weekCompletion,
          currentFocus: '围绕成长观察、能力训练和成长记录安排今天的育儿重点',
          todaySuggestion: suggestion
        },
      weeklyProgress: {
        headline: this.data.weeklyProgress.headline,
        summary: this.data.weeklyProgress.summary,
        streakDays: streakDays,
        actionText: this.data.weeklyProgress.actionText,
        premiumUnlocked: this.data.weeklyProgress.premiumUnlocked
      }
    });
  },

  loadWeeklyProgress: function() {
    var that = this;
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (app.shouldUseMockFallback && app.shouldUseMockFallback()) {
      that.setData({
        weeklyProgress: {
          headline: '先完成连续记录，本周成长总结会更完整',
          summary: '连续记录每天的变化后，系统会整理出更清晰的本周成长总结。',
          streakDays: 0,
          actionText: '查看完整周报',
          premiumUnlocked: false
        }
      });
      return;
    }
    if (!currentChild || !currentChild.id) {
      that.setData({
        weeklyProgress: {
          headline: '完善孩子档案后，可以获得更准确的成长总结',
          summary: '补充年龄和基础情况后，系统会提供更贴合成长阶段的记录和建议。',
          streakDays: 0,
          actionText: '先去完善',
          premiumUnlocked: false
        }
      });
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      return;
    }
    app.ensureLogin().then(function() {
      return Promise.all([
        app.request({
          url: '/weekly-summary',
          method: 'GET',
          data: { childId: currentChild.id }
        }).catch(function() { return null; }),
        app.request({
          url: '/growth-records/summary',
          method: 'GET',
          data: { childId: currentChild.id, days: 7 }
        }).catch(function() { return null; })
      ]);
    }).then(function(result) {
      var weeklySummary = result[0];
      var trendSummary = result[1];
      if (!weeklySummary && !trendSummary) {
        return;
      }
      var recordDays = Number((weeklySummary && weeklySummary.recordDays) || (trendSummary && trendSummary.completedDays) || 0);
      var headline = weeklySummary && weeklySummary.overview
        ? weeklySummary.overview
        : ((trendSummary && trendSummary.overallLabel) || '本周正在形成新的记录节奏');
      var summary = weeklySummary && weeklySummary.highlights && weeklySummary.highlights.length
        ? weeklySummary.highlights[0]
        : (recordDays ? ('最近 7 天已记录 ' + recordDays + ' 天。') : '先记录 3 天，系统才能给出更稳定的趋势判断。');
      that.setData({
        weeklyProgress: {
          headline: headline,
          summary: summary,
          streakDays: recordDays,
          actionText: weeklySummary && weeklySummary.premiumUnlocked ? '查看完整周报' : '查看周总结',
          premiumUnlocked: !!(weeklySummary && weeklySummary.premiumUnlocked)
        }
      });
      if (weeklySummary && !weeklySummary.premiumUnlocked) {
        that.setData({
          membershipTouchpointTitle: '宝贝每周成长总结',
          membershipTouchpointDesc: weeklySummary.premiumTip || that.data.membershipTouchpointDesc
        });
      }
    }).catch(function() {
      return null;
    });
  },

  // 检查登录状态
  checkLogin() {
    this.setData({
      userInfo: app.globalData.userInfo,
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  getPlanTypeLabel: function(type) {
    var map = {
      ability_task: '能力训练',
      parenting_article: '育儿方法',
      nutrition_recipe: '饮食支持',
      habit_reminder: '家庭提醒',
      onboarding: '开始设置'
    };
    return map[type] || '今日建议';
  },

  normalizeDailyPlanCard: function(card) {
    card = card || {};
    return {
      id: card.id,
      childId: card.childId || card.child_id || 0,
      planDate: card.planDate || card.plan_date || '',
      type: card.type || card.plan_type || '',
      typeLabel: this.getPlanTypeLabel(card.type || card.plan_type || ''),
      title: card.title || '今日建议',
      reason: card.reason || card.reason_text || '',
      summary: card.summary || card.summary_text || '',
      actionText: card.actionText || card.action_text || '现在去做',
      durationMinutes: Number(card.durationMinutes || card.duration_minutes || 0),
      targetType: card.targetType || card.target_type || '',
      targetId: card.targetId || card.target_id || '',
      targetPath: card.targetPath || card.target_path || '',
      sourceKey: card.sourceKey || card.source_key || '',
      completed: !!(card.completed || card.status === 'completed'),
      completedAt: card.completedAt || card.completed_at || null
    };
  },

  getGuestDailyPlanCards: function() {
    var today = new Date();
    var dateText = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    return [
      this.normalizeDailyPlanCard({
        id: 'guest_1',
        planDate: dateText,
        type: 'onboarding',
        title: '完善孩子档案，获取更准确的成长建议',
        reason: '年龄和基础情况越完整，首页推荐内容越准确。',
        summary: '补完档案后，系统会按年龄和当前重点生成今日育儿建议。',
        actionText: '去完善',
        durationMinutes: 2,
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      }),
      this.normalizeDailyPlanCard({
        id: 'guest_2',
        planDate: dateText,
        type: 'habit_reminder',
        title: '开始成长观察，了解孩子近期状态',
        reason: '先完成一次观察，后面的陪伴建议会更有针对性。',
        summary: '从专注、表达或习惯中选择一个方向，开始今天的成长观察。',
        actionText: '去观察',
        durationMinutes: 3,
        targetType: 'assessment',
        targetPath: '/pages/assessment/assessment'
      }),
      this.normalizeDailyPlanCard({
        id: 'guest_3',
        planDate: dateText,
        type: 'parenting_article',
        title: '查看育儿知识，找到适合当前问题的内容',
        reason: '按场景进入，更容易找到对应的育儿方法。',
        summary: '从情绪、习惯、认知、社交、营养五类内容中开始查找。',
        actionText: '去看看',
        durationMinutes: 5,
        targetType: 'parenting_home',
        targetPath: '/pages/parenting/parenting'
      })
    ];
  },

  applyDailyPlan: function(cards, payload) {
    var list = (cards || []).map(this.normalizeDailyPlanCard.bind(this));
    var completedCount = list.filter(function(item) { return item.completed; }).length;
    var firstCard = list[0] || null;
    var growthStatus = Object.assign({}, this.data.growthStatus, {
      todaySuggestion: firstCard ? firstCard.title : '从成长观察、能力成长或成长记录中选择一个开始'
    });
    var todayTask = Object.assign({}, this.data.todayTask, firstCard ? {
      title: firstCard.title,
      duration: (firstCard.durationMinutes || 3) + '分钟可完成'
    } : {});
    this.setData({
      dailyPlanCards: list,
      dailyPlanDate: (payload && payload.date) || '',
      dailyPlanCompletedCount: completedCount,
      dailyPlanEmptyText: list.length ? '' : '今天先从一个明确的育儿主题开始。',
      growthStatus: growthStatus,
      todayTask: todayTask
    });
  },

  trackDailyPlanEvent: function(eventType, plan, extraMeta) {
    if (!plan || !eventType) {
      return;
    }
    app.trackKbEvent({
      event_type: eventType,
      module_key: 'daily_guidance',
      page_key: 'home_index',
      content_type: 'daily_plan',
      content_id: plan.id,
      child_id: plan.childId || 0,
      event_meta: Object.assign({
        plan_type: plan.type,
        target_type: plan.targetType,
        target_id: plan.targetId,
        plan_date: plan.planDate,
        section: 'daily_plan'
      }, extraMeta || {})
    });
  },

  trackDailyPlanView: function(cards, payload) {
    var viewKey = [payload && payload.date, payload && payload.child_id, (cards || []).map(function(item) { return item.id; }).join(',')].join(':');
    if (!viewKey || this._lastDailyPlanViewKey === viewKey) {
      return;
    }
    this._lastDailyPlanViewKey = viewKey;
    (cards || []).forEach(function(plan) {
      this.trackDailyPlanEvent('daily_plan_view', plan);
    }, this);
  },

  trackMembershipTouchpointEvent: function(eventType, extraMeta) {
    if (!app.trackKbEvent) {
      return;
    }
    app.trackKbEvent({
      event_type: eventType,
      module_key: 'membership_touchpoint',
      page_key: 'home_index',
      event_meta: Object.assign({
        title: this.data.membershipTouchpointTitle,
        source: 'home_weekly_progress'
      }, extraMeta || {})
    });
  },

  loadDailyPlan: function() {
    var that = this;
    if (app.globalData.enableStartupSafeMode) {
      return;
    }
    if (app.shouldUseMockFallback && app.shouldUseMockFallback()) {
      that.applyDailyPlan(that.getGuestDailyPlanCards(), { date: '' });
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      that.applyDailyPlan(that.getGuestDailyPlanCards(), { date: '' });
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    that.setData({ dailyPlanLoading: true });
    app.ensureLogin().then(function() {
      return app.request({
        url: '/daily-plan',
        method: 'GET',
        data: currentChild && currentChild.id ? { childId: currentChild.id } : {}
      });
    }).then(function(res) {
      var cards = (res && res.cards) || [];
      that.applyDailyPlan(cards, res || {});
      that.trackDailyPlanView(that.data.dailyPlanCards, res || {});
    }).catch(function() {
      that.applyDailyPlan(that.getGuestDailyPlanCards(), { date: '' });
    }).finally(function() {
      that.setData({ dailyPlanLoading: false });
    });
  },

  loadMembershipTouchpoint: function() {
    var that = this;
    if (app.shouldUseMockFallback && app.shouldUseMockFallback()) {
      that.setData({ membershipTouchpointVisible: true });
      if (!that._membershipTouchpointExposed) {
        that._membershipTouchpointExposed = true;
        that.trackMembershipTouchpointEvent('membership_touchpoint_exposure', { mode: 'mock' });
      }
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      that.setData({ membershipTouchpointVisible: true });
      if (!that._membershipTouchpointExposed) {
        that._membershipTouchpointExposed = true;
        that.trackMembershipTouchpointEvent('membership_touchpoint_exposure', { mode: 'guest' });
      }
      return;
    }
    app.ensureLogin().then(function() {
      return app.request({
        url: '/membership/info',
        method: 'GET'
      });
    }).then(function(data) {
      that.setData({
        membershipTouchpointVisible: !(data && data.is_active)
      });
      if (!(data && data.is_active) && !that._membershipTouchpointExposed) {
        that._membershipTouchpointExposed = true;
        that.trackMembershipTouchpointEvent('membership_touchpoint_exposure', { mode: 'logged_in_preview' });
      }
    }).catch(function() {
      that.setData({ membershipTouchpointVisible: true });
      if (!that._membershipTouchpointExposed) {
        that._membershipTouchpointExposed = true;
        that.trackMembershipTouchpointEvent('membership_touchpoint_exposure', { mode: 'fallback' });
      }
    });
  },

  navigateByDailyPlan: function(plan) {
    if (!plan || !plan.targetPath) {
      wx.showToast({ title: '入口暂未准备好', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: plan.targetPath,
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onDailyPlanTap: function(e) {
    var index = Number(e.currentTarget.dataset.index || 0);
    var plan = this.data.dailyPlanCards[index];
    if (!plan) {
      return;
    }
    this.trackDailyPlanEvent('daily_plan_click', plan, {
      action: 'open_target'
    });
    this.navigateByDailyPlan(plan);
  },

  onDailyPlanComplete: function(e) {
    var that = this;
    var index = Number(e.currentTarget.dataset.index || 0);
    var plan = that.data.dailyPlanCards[index];
    if (!plan || plan.completed) {
      return;
    }
    if (String(plan.id || '').indexOf('guest_') === 0) {
      wx.showToast({ title: '登录后可记录完成状态', icon: 'none' });
      return;
    }
    if (that._dailyPlanCompletePending) {
      return;
    }
    that._dailyPlanCompletePending = true;
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return null;
      }
      return app.request({
        url: '/daily-plan/complete',
        method: 'POST',
        data: {
          record_id: plan.id
        }
      }).then(function(res) {
        var list = that.data.dailyPlanCards.slice();
        list[index] = that.normalizeDailyPlanCard(res || plan);
        that.applyDailyPlan(list, {
          date: that.data.dailyPlanDate
        });
        that.trackDailyPlanEvent('daily_plan_complete', list[index], {
          action: 'mark_completed'
        });
        wx.showToast({ title: '已记录完成', icon: 'success' });
      });
    }).catch(function() {
      wx.showToast({ title: '记录失败', icon: 'none' });
    }).finally(function() {
      that._dailyPlanCompletePending = false;
    });
  },

  // 跳转到AI问答
  goToChat() {
    if (!this.ensureFeatureEnabled('aiChat', 'AI问答暂未开放')) {
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
    if (!this.ensureFeatureEnabled('assessments', '成长观察暂未开放')) {
      return;
    }
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
    if (!this.ensureFeatureEnabled('parenting', '育儿知识暂未开放')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/parenting/parenting',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 跳转到能力成长
  goToTextbook() {
    if (!this.ensureFeatureEnabled('education', '能力成长暂未开放')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/textbook/textbook',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看今日任务
  goToTodayTask() {
    var firstCard = (this.data.dailyPlanCards || [])[0];
    if (firstCard && firstCard.targetPath) {
      this.trackDailyPlanEvent('daily_plan_click', firstCard, {
        action: 'open_from_quick_entry'
      });
      this.navigateByDailyPlan(firstCard);
      return;
    }
    if (!this.ensureFeatureEnabled('education', '今日任务暂未开放')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/textbook/textbook',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看进步报告
  goToGrowthRecord() {
    if (!this.ensureFeatureEnabled('growthRecord', '成长记录暂未开放')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/growth-record/index',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  goToMembership() {
    this.trackMembershipTouchpointEvent('membership_touchpoint_click');
    wx.navigateTo({
      url: '/pages/membership/index',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  goToWeeklyReport() {
    if (!this.ensureFeatureEnabled('weeklySummary', '周总结暂未开放')) {
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      this.goToGrowthRecord();
      return;
    }
    wx.navigateTo({
      url: '/pages/weekly-summary/index' + (currentChild && currentChild.id ? ('?childId=' + currentChild.id) : ''),
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

  ensureFeatureEnabled(featureName, message) {
    if (app.isFeatureEnabled && app.isFeatureEnabled(featureName)) {
      return true;
    }
    wx.showToast({
      title: message,
      icon: 'none'
    });
    return false;
  },

  onShareTaskCard() {
    var stats = app.getReadingTaskStats();
    var firstPlan = (this.data.dailyPlanCards || [])[0] || {};
    var draft = {
      type: 'app_intro',
      title: firstPlan.title || this.data.todayTask.title || '成长观察建议',
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
      summary: this.data.weeklyProgress.summary || '本周坚持记录和行动，继续加油。',
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
      imageUrl: '/images/default-article.png'
    };
  }
});

