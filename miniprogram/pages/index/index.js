// 首页逻辑
const app = getApp();
const encouragementUtils = require('../../utils/encouragement.js');
const developmentZones = require('../../utils/development-zones.js');
const allDevelopmentZones = developmentZones.getDevelopmentZones();

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
      currentFocus: '先判断孩子当前状态，再选今天的做法',
      todaySuggestion: '完成一次观察，拿到今日建议'
    },
    dailyPlanLoading: false,
    dailyPlanCards: [],
    dailyPlanDate: '',
    dailyPlanCompletedCount: 0,
    dailyPlanEmptyText: '',
    developmentZones: allDevelopmentZones,
    featuredDevelopmentZones: allDevelopmentZones.slice(0, 4),
    membershipTouchpointVisible: false,
    membershipTouchpointTitle: '宝贝每周成长总结',
    membershipTouchpointDesc: '查看每周成长趋势和下周建议。',
    operationTouchpoint: {
      key: '',
      title: '',
      desc: '',
      cta: '',
      targetPath: '',
      targetType: '',
      sourceId: ''
    },
    retentionSummary: null,
    continueTask: null,
    showEncouragementPopup: false,
    encouragementMessage: '',
    encouragementLevel: 1,
    todayTask: {
      title: '3分钟了解孩子当前状态',
      duration: '完成后获得今日建议'
    },
    weeklyProgress: {
      headline: '连续记录，成长变化更清楚',
      summary: '记录越完整，周总结越有用。',
      streakDays: 0,
      actionText: '查看完整周报',
      premiumUnlocked: false
    },
    bannerList: [
      {
        title: '3分钟成长观察',
        desc: '快速判断孩子当前状态，获得今日建议',
        cta: '开始观察',
        action: 'assessment'
      },
      {
        title: '小牛育儿问答',
        desc: '输入问题，小牛给你具体步骤',
        cta: '问问小牛',
        action: 'chat'
      },
      {
        title: '成长记录',
        desc: '每天记一点，周总结更准确',
        cta: '看看入口',
        action: 'assessment'
      }
    ]
  },

  onLoad() {
    this._heroImageTimer = null;
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
    this.loadRetentionState();
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
    this.loadRetentionState();
    this.deferHeroImage();
  },

  onUnload() {
    this.clearHeroImageTimer();
  },

  clearHeroImageTimer() {
    if (this._heroImageTimer) {
      clearTimeout(this._heroImageTimer);
      this._heroImageTimer = null;
    }
  },

  deferHeroImage() {
    if (this.data.heroImageReady) {
      return;
    }
    this.clearHeroImageTimer();
    this._heroImageTimer = setTimeout(() => {
      this._heroImageTimer = null;
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
    var allowDraftMetrics = shareDraft.mode !== 'mock';
    var completionRate = stats.completionRate || 0;
    var completed = stats.completed || 0;
    var total = stats.total || 0;

    // 优先使用最近周报/分享草稿中的指标，其次使用全局统计
    if (allowDraftMetrics && metrics.total > 0) {
      completionRate = metrics.completionRate || completionRate;
      completed = metrics.completed || completed;
      total = metrics.total || total;
    }

    var streakDays = allowDraftMetrics ? (metrics.streakDays || this.data.weeklyProgress.streakDays) : this.data.weeklyProgress.streakDays;

    var suggestion = total > 0 ? ('已完成 ' + completed + '/' + total + ' 项每日练习') : '从成长观察、每日练习或成长记录中选一个开始';

    this.setData({
        growthStatus: {
          weekCompletion: completionRate || this.data.growthStatus.weekCompletion,
          currentFocus: '围绕成长观察、每日练习和成长记录安排今天的育儿重点',
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
          headline: '当前为演示模式，周总结展示为示例内容',
          summary: '添加真实记录后即可查看成长趋势。',
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
          summary: '补充年龄和基础信息后，建议会更贴合当前阶段。',
          streakDays: 0,
          actionText: '先去完善',
          premiumUnlocked: false
        }
      });
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      that.setData({
        weeklyProgress: {
          headline: '登录后可查看孩子本周的成长总结',
          summary: '登录后可查看最近 7 天的成长趋势。',
          streakDays: 0,
          actionText: '立即登录',
          premiumUnlocked: false
        }
      });
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
        that.applyWeeklyProgressLoadError('周总结没加载出来，请稍后再试。');
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
      that.applyWeeklyProgressLoadError('周总结没加载出来，请稍后再试。');
    });
  },

  applyWeeklyProgressLoadError: function(message) {
    var text = message || '周总结没加载出来，请稍后再试。';
    this.setData({
      weeklyProgress: {
        headline: text,
        summary: '可以稍后刷新，先继续记录今天的成长变化。',
        streakDays: 0,
        actionText: '稍后再试',
        premiumUnlocked: false
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

  getPlanTypeLabel: function(type) {
    var map = {
      ability_task: '每日练习',
      parenting_article: '育儿锦囊',
      development_zone: '发展专区',
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
        title: '先填孩子档案，首页会更贴近你家',
        reason: '年龄和基本情况清楚后，建议会少一些泛泛的话。',
        summary: '补完档案后，首页会按孩子当前阶段给建议。',
        actionText: '去完善',
        durationMinutes: 2,
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      }),
      this.normalizeDailyPlanCard({
        id: 'guest_2',
        planDate: dateText,
        type: 'parenting_article',
        title: '先登录并填写孩子档案',
        reason: '年龄和阶段不同，建议内容也会不同。',
        summary: '补充生日和基础信息后，首页建议会更贴近。',
        actionText: '先登录',
        durationMinutes: 2,
        targetType: 'profile',
        targetPath: '/pages/profile/profile'
      })
    ];
  },

  getNoChildDailyPlanCards: function() {
    var today = new Date();
    var dateText = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    return [
      this.normalizeDailyPlanCard({
        id: 'child_setup_1',
        planDate: dateText,
        type: 'onboarding',
        title: '先完善孩子档案，再看今日建议',
        reason: '年龄不同，成长观察、营养建议和陪伴重点都会不一样。',
        summary: '补充生日和基础情况后，首页会按当前阶段给建议。',
        actionText: '去完善',
        durationMinutes: 2,
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      })
    ];
  },

  getMockDailyPlanCards: function() {
    var today = new Date();
    var dateText = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    return [
      this.normalizeDailyPlanCard({
        id: 'mock_1',
        planDate: dateText,
        type: 'onboarding',
        title: '演示模式：这里展示示例内容',
        reason: '以下为演示内容，添加真实档案后这里会展示实际建议。',
        summary: '添加孩子档案后，会看到更贴近孩子年龄的建议。',
        actionText: '查看示例',
        durationMinutes: 2,
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      }),
      this.normalizeDailyPlanCard({
        id: 'mock_2',
        planDate: dateText,
        type: 'habit_reminder',
        title: '演示模式：成长观察入口',
        reason: '以下为演示：从成长观察开始了解孩子当前状态。',
        summary: '基于孩子年龄和近期记录推荐观察方向。',
        actionText: '查看示例',
        durationMinutes: 3,
        targetType: 'assessment',
        targetPath: '/pages/assessment/assessment'
      })
    ];
  },

  applyDailyPlan: function(cards, payload, streakDays) {
    var list = (cards || []).map(this.normalizeDailyPlanCard.bind(this));
    var completedCount = list.filter(function(item) { return item.completed; }).length;
    var firstCard = list[0] || null;
    var growthStatus = Object.assign({}, this.data.growthStatus, {
      todaySuggestion: firstCard ? firstCard.title : '从成长观察、每日练习或成长记录中选一个开始'
    });
    var todayTask = Object.assign({}, this.data.todayTask, firstCard ? {
      title: firstCard.title,
      duration: (firstCard.durationMinutes || 3) + '分钟可完成'
    } : {});
    var weeklyProgress = Object.assign({}, this.data.weeklyProgress);
    if (typeof streakDays === 'number' && streakDays > 0) {
      weeklyProgress.streakDays = streakDays;
      weeklyProgress.headline = '已连续记录 ' + streakDays + ' 天';
      if (streakDays >= 7) {
        weeklyProgress.headline = '连续 ' + streakDays + ' 天！这周的成长总结会更完整';
      }
    }
    this.setData({
      dailyPlanCards: list,
      dailyPlanDate: (payload && payload.date) || '',
      dailyPlanCompletedCount: completedCount,
      dailyPlanEmptyText: list.length ? '' : '今天先从一个明确的育儿主题开始。',
      growthStatus: growthStatus,
      todayTask: todayTask,
      weeklyProgress: weeklyProgress
    });
  },

  applyDailyPlanLoadError: function(message) {
    var text = message || '今日建议没加载出来，请稍后再试。';
    this.setData({
      dailyPlanCards: [],
      dailyPlanDate: '',
      dailyPlanCompletedCount: 0,
      dailyPlanEmptyText: text,
      growthStatus: Object.assign({}, this.data.growthStatus, {
        todaySuggestion: text
      }),
      todayTask: {
        title: '今日建议暂时无法加载',
        duration: '可以稍后刷新'
      }
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
      that.applyDailyPlan(that.getMockDailyPlanCards(), { date: '' });
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      that.applyDailyPlan(that.getGuestDailyPlanCards(), { date: '' });
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      that.applyDailyPlan(that.getNoChildDailyPlanCards(), { date: '' });
      return;
    }
    that.setData({ dailyPlanLoading: true });
    app.ensureLogin().then(function() {
      return app.request({
        url: '/daily-plan',
        method: 'GET',
        data: currentChild && currentChild.id ? { childId: currentChild.id } : {}
      });
    }).then(function(res) {
      var cards = (res && res.cards) || [];
      var streakDaysVal = (res && typeof res.streak_days === 'number') ? res.streak_days : 0;
      that.applyDailyPlan(cards, res || {}, streakDaysVal);
      that.trackDailyPlanView(that.data.dailyPlanCards, res || {});
    }).catch(function() {
      that.applyDailyPlanLoadError('今日建议没加载出来，请稍后再试。');
    }).finally(function() {
      that.setData({ dailyPlanLoading: false });
    });
  },

  fetchNextDayPlan: function() {
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      return Promise.resolve(null);
    }
    return app.request({
      url: '/daily-plan/next',
      method: 'GET',
      data: { childId: currentChild.id }
    }).then(function(res) {
      return (res && res.data) || null;
    }).catch(function() {
      return null;
    });
  },

  loadMembershipTouchpoint: function() {
    var that = this;
    if (app.shouldUseMockFallback && app.shouldUseMockFallback()) {
      that.setData({
        membershipTouchpointVisible: true,
        membershipTouchpointTitle: '演示模式：会员周总结入口示例',
        membershipTouchpointDesc: '当前展示为演示文案，真实会员状态和完整周总结以正式环境数据为准。'
      });
      if (!that._membershipTouchpointExposed) {
        that._membershipTouchpointExposed = true;
        that.trackMembershipTouchpointEvent('membership_touchpoint_exposure', { mode: 'mock' });
      }
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      that.setData({
        membershipTouchpointVisible: true,
        membershipTouchpointTitle: '登录后可查看宝贝每周成长总结',
        membershipTouchpointDesc: '登录并完成记录后，这里会展示本周趋势、提醒和陪伴建议。'
      });
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
      that.setData({ membershipTouchpointVisible: false });
    });
  },

  buildRetentionTouchpoint: function(data) {
    var key = data.recommended_touchpoint || '';
    var mapping = {
      complete_child_profile: {
        title: '完善孩子档案',
        desc: '填写孩子的年龄和性别后，每日建议会更精准。',
        cta: '立即完善',
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      },
      continue_daily_plan: function() {
        var plan = data.unfinished_daily_plan || {};
        return {
          title: '继续上次的小练习',
          desc: plan.title || '上次的每日建议还未完成，接着做吧。',
          cta: '继续完成',
          targetType: plan.target_path ? 'daily_plan' : 'assessment',
          targetPath: plan.target_path || '/pages/assessment/assessment',
          sourceId: plan.id || ''
        };
      },
      membership_expiring: function() {
        var level = data.membership_expiring_level || 'soon';
        return {
          title: level === 'urgent' ? '会员即将到期' : '会员快到期了',
          desc: level === 'urgent'
            ? '您的会员将在3天内到期，续费后可继续使用成长总结和小牛问答。'
            : '您的会员将在7天内到期，提前续费避免服务中断。',
          cta: '查看会员',
          targetType: 'membership',
          targetPath: '/pages/membership/index'
        };
      },
      membership_conversion: {
        title: '开通成长服务',
        desc: '开通后可查看成长曲线、每周总结和定制建议。',
        cta: '了解会员',
        targetType: 'membership',
        targetPath: '/pages/membership/index'
      },
      quick_return_task: {
        title: '继续成长观察',
        desc: '从一次成长观察开始。',
        cta: '开始观察',
        targetType: 'assessment',
        targetPath: '/pages/assessment/assessment'
      },
      review_growth_record: {
        title: '查看近期成长记录',
        desc: '最近的成长记录已经整理好了，看看孩子这阶段的变化。',
        cta: '查看记录',
        targetType: 'growth_record',
        targetPath: '/pages/growth-record/index'
      },
      continue_ai_chat: {
        title: '继续问小牛',
        desc: '上次和小牛聊了育儿话题，还有问题可以接着问。',
        cta: '继续提问',
        targetType: 'ai_chat',
        targetPath: '/pages/chat/chat'
      },
      start_growth_observation: {
        title: '开始今天的成长观察',
        desc: '从成长观察、每日练习或成长记录中选一个开始。',
        cta: '去看看',
        targetType: 'assessment',
        targetPath: '/pages/assessment/assessment'
      },
      login_to_personalize: {
        title: '登录后查看今日建议',
        desc: '登录后可根据孩子年龄获得每日建议。',
        cta: '立即登录',
        targetType: 'login',
        targetPath: ''
      }
    };
    var entry = mapping[key] || mapping.start_growth_observation;
    return typeof entry === 'function' ? entry() : entry;
  },

  buildRetentionContinueTask: function(data) {
    var plan = data.unfinished_daily_plan;
    if (!plan) {
      return null;
    }
    return {
      id: plan.id || '',
      title: plan.title || '接着完成上次那件事',
      targetPath: plan.target_path || '',
      planDate: plan.plan_date || ''
    };
  },

  loadRetentionState: function() {
    var that = this;
    if (app.globalData.enableStartupSafeMode) {
      return;
    }
    if (app.shouldUseMockFallback && app.shouldUseMockFallback()) {
      that.setData({
        operationTouchpoint: {
          key: 'quick_return_task',
          title: '演示模式：3分钟快速回归',
          desc: '当前为演示内容。真实模式下会根据您的使用状态展示个性化运营入口。',
          cta: '查看示例',
          targetType: 'assessment',
          targetPath: '/pages/assessment/assessment',
          sourceId: ''
        },
        retentionSummary: null,
        continueTask: null
      });
      return;
    }
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      that.setData({
        operationTouchpoint: that.buildRetentionTouchpoint({
          recommended_touchpoint: 'login_to_personalize'
        }),
        retentionSummary: null,
        continueTask: null
      });
      return;
    }
    var runtimeConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : (app.globalData.runtimeConfig || {});
    if (!runtimeConfig.retentionStatusEnabled) {
      that.setData({
        operationTouchpoint: that.buildRetentionTouchpoint({
          recommended_touchpoint: 'start_growth_observation'
        }),
        retentionSummary: null,
        continueTask: null
      });
      return;
    }
    app.ensureLogin().then(function() {
      return app.request({
        url: '/retention/status',
        method: 'GET'
      });
    }).then(function(res) {
      var data = (res && res.data) ? res.data : res;
      if (!data) {
        that.setData({
          operationTouchpoint: Object.assign({}, that.data.operationTouchpoint, { key: '' }),
          retentionSummary: null,
          continueTask: null
        });
        return;
      }
      var tp = that.buildRetentionTouchpoint(data);
      tp.key = data.recommended_touchpoint || '';
      tp.sourceId = tp.sourceId || '';
      var ct = that.buildRetentionContinueTask(data);
      that.setData({
        operationTouchpoint: tp,
        retentionSummary: data.recent_record_summary || null,
        continueTask: ct
      });
      var encouragementState = encouragementUtils.buildHomeEncouragementState(data);
      if (encouragementState.visible) {
        that.setData({
          showEncouragementPopup: true,
          encouragementMessage: encouragementState.message,
          encouragementLevel: encouragementState.level
        });
      }
      if (!that._retentionTouchpointExposed) {
        that._retentionTouchpointExposed = true;
        if (app.trackKbEvent) {
          app.trackKbEvent({
            event_type: 'retention_touchpoint_exposure',
            module_key: 'retention_touchpoint',
            page_key: 'home_index',
            event_meta: {
              touchpoint_key: data.recommended_touchpoint || '',
              title: tp.title,
              source: 'retention_status_api'
            }
          });
        }
      }
    }).catch(function(err) {
      var statusCode = err && (err.statusCode || err.status || err.code);
      if (Number(statusCode) === 404) {
        that.setData({
          operationTouchpoint: that.buildRetentionTouchpoint({
            recommended_touchpoint: 'start_growth_observation'
          }),
          retentionSummary: null,
          continueTask: null
        });
        return;
      }
      that.setData({
        operationTouchpoint: Object.assign({}, that.data.operationTouchpoint, { key: '' }),
        retentionSummary: null,
        continueTask: null
      });
    });
  },

  onOperationTouchpointTap: function() {
    var tp = this.data.operationTouchpoint;
    if (!tp || !tp.key) {
      return;
    }
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'retention_touchpoint_click',
        module_key: 'retention_touchpoint',
        page_key: 'home_index',
        event_meta: {
          touchpoint_key: tp.key,
          title: tp.title,
          source: 'retention_status_api'
        }
      });
    }
    if (tp.key === 'login_to_personalize') {
      app.requireLoginForAction('请先登录，获得个性化育儿陪伴').then(function(canOperate) {
        if (canOperate) {
          wx.showToast({ title: '登录成功，刷新中', icon: 'success' });
          setTimeout(function() {
            wx.reLaunch({ url: '/pages/index/index' });
          }, 800);
        }
      });
      return;
    }
    if (!tp.targetPath) {
      wx.showToast({ title: '入口暂未准备好', icon: 'none' });
      return;
    }
    if (tp.targetPath === '/pages/chat/chat') {
      wx.switchTab({
        url: tp.targetPath,
        fail: function() {
          wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
        }
      });
      return;
    }
    wx.navigateTo({
      url: tp.targetPath,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  navigateByDailyPlan: function(plan) {
    if (!plan || !plan.targetPath) {
      wx.showToast({ title: '入口暂未准备好', icon: 'none' });
      return;
    }
    if (plan.targetPath === '/pages/profile/child-edit/child-edit') {
      app.requireLoginForAction('请先完成微信登录，再完善孩子档案').then(function(canOperate) {
        if (!canOperate) {
          return;
        }
        wx.navigateTo({
          url: plan.targetPath,
          fail: function() {
            wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
          }
        });
      });
      return;
    }
    wx.navigateTo({
      url: plan.targetPath,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
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
    if (String(plan.id || '').indexOf('mock_') === 0) {
      wx.showToast({ title: '演示内容不可记录完成状态', icon: 'none' });
      return;
    }
    if (String(plan.id || '').indexOf('child_setup_') === 0) {
      wx.showToast({ title: '完善孩子档案后会生成正式建议', icon: 'none' });
      that.navigateByDailyPlan(plan);
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
        return that.fetchNextDayPlan();
      }).then(function(nextData) {
        if (nextData && nextData.card) {
          var next = nextData.card;
          wx.showModal({
            title: '明天继续',
            content: next.title || '明天还有新的任务等你完成',
            confirmText: '知道了',
            showCancel: false
          });
        }
      });
    }).catch(function() {
      wx.showToast({ title: '没记录成功，请再试一次', icon: 'none' });
    }).finally(function() {
      that._dailyPlanCompletePending = false;
    });
  },

  // 跳转到小牛问答
  goToChat() {
    if (!this.ensureFeatureEnabled('aiChat', '小牛问答还在准备中')) {
      return;
    }
    wx.switchTab({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  askAiForToday: function() {
    this.goToChat();
  },

  // 跳转到成长观察
  goToAssessment() {
    if (!this.ensureFeatureEnabled('assessments', '成长观察还在准备中')) {
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      wx.showToast({ title: '请先完善孩子档案', icon: 'none' });
      this.navigateByDailyPlan({ targetPath: '/pages/profile/child-edit/child-edit' });
      return;
    }
    wx.navigateTo({
      url: '/pages/assessment/assessment',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 跳转到营养
  goToNutrition() {
    wx.navigateTo({
      url: '/pages/nutrition/nutrition',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 跳转到育儿
  goToParenting() {
    if (!this.ensureFeatureEnabled('parenting', '育儿锦囊还在准备中')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/parenting/parenting',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 跳转到每日练习
  goToTextbook() {
    if (!this.ensureFeatureEnabled('education', '每日练习还在准备中')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/textbook/textbook',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToDevelopmentZone(e) {
    var zoneCode = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.zone : '';
    var zone = developmentZones.getDevelopmentZoneByCode(zoneCode);
    if (!zone) {
      wx.showToast({ title: '这个专区还在准备中', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/development/detail/detail?zone=' + encodeURIComponent(zone.code),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToAllDevelopmentZones() {
    wx.navigateTo({
      url: '/pages/development/detail/detail?zone=' + encodeURIComponent('language'),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
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
    if (!this.ensureFeatureEnabled('education', '今天的小练习还在准备中')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/textbook/textbook',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 查看进步报告
  goToGrowthRecord() {
    if (!this.ensureFeatureEnabled('growthRecord', '成长记录还在准备中')) {
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      wx.showToast({ title: '请先完善孩子档案', icon: 'none' });
      this.navigateByDailyPlan({ targetPath: '/pages/profile/child-edit/child-edit' });
      return;
    }
    wx.navigateTo({
      url: '/pages/growth-record/index',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToMembership() {
    this.trackMembershipTouchpointEvent('membership_touchpoint_click');
    wx.navigateTo({
      url: '/pages/membership/index',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToWeeklyReport() {
    if (!this.ensureFeatureEnabled('weeklySummary', '周总结还在准备中')) {
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
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
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
    var isMockMode = !!(app.shouldUseMockFallback && app.shouldUseMockFallback());
    var draft = {
      type: 'app_intro',
      mode: isMockMode ? 'mock' : 'live',
      title: isMockMode ? '演示模式：首页建议卡示例' : (firstPlan.title || this.data.todayTask.title || '成长观察建议'),
      summary: isMockMode ? '当前为演示内容分享，用于展示首页建议卡样式。' : '我正在用小牛育儿观察孩子的成长状态。',
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
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onShareProgressCard() {
    var stats = app.getReadingTaskStats();
    var isMockMode = !!(app.shouldUseMockFallback && app.shouldUseMockFallback());
    var draft = {
      type: 'weekly_report',
      mode: isMockMode ? 'mock' : 'live',
      title: isMockMode ? '演示模式：本周成长成果卡示例' : '本周成长成果卡',
      summary: isMockMode ? '当前展示为演示周报卡片，真实成长结果以正式环境数据为准。' : (this.data.weeklyProgress.summary || '本周坚持记录和行动，继续加油。'),
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
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onEncouragementConfirm: function() {
    this.setData({ showEncouragementPopup: false });
    this.acknowledgeEncouragement();
  },

  onEncouragementCancel: function() {
    this.setData({ showEncouragementPopup: false });
    this.acknowledgeEncouragement();
  },

  acknowledgeEncouragement: function() {
    var that = this;
    var level = that.data.encouragementLevel;
    app.request({
      url: '/encouragement/acknowledge',
      method: 'POST',
      data: {
        level: level,
        type: 'daily_visit'
      }
    }).catch(function() {});
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

