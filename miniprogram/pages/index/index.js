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
      currentFocus: '围绕成长观察、每日训练和成长记录安排今天的育儿重点',
      todaySuggestion: '从成长观察、每日训练或成长记录中选择一个开始'
    },
    dailyPlanLoading: false,
    dailyPlanCards: [],
    dailyPlanDate: '',
    dailyPlanCompletedCount: 0,
    dailyPlanEmptyText: '',
    membershipTouchpointVisible: false,
    membershipTouchpointTitle: '宝贝每周成长总结',
    membershipTouchpointDesc: '可查看更完整的每周成长总结、趋势提醒和陪伴建议。',
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

    var suggestion = total > 0 ? ('已完成 ' + completed + '/' + total + ' 项每日训练任务') : '从成长观察、每日训练或成长记录中选择一个开始';

    this.setData({
        growthStatus: {
          weekCompletion: completionRate || this.data.growthStatus.weekCompletion,
          currentFocus: '围绕成长观察、每日训练和成长记录安排今天的育儿重点',
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
          summary: '接入真实记录后，这里会展示孩子本周的成长趋势和建议。',
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
      that.setData({
        weeklyProgress: {
          headline: '登录后可查看孩子本周的成长总结',
          summary: '登录后系统会结合最近 7 天记录，整理趋势和陪伴建议。',
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
        that.applyWeeklyProgressLoadError('周总结暂时无法加载，请稍后重试。');
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
      that.applyWeeklyProgressLoadError('周总结暂时无法加载，请稍后重试。');
    });
  },

  applyWeeklyProgressLoadError: function(message) {
    var text = message || '周总结暂时无法加载，请稍后重试。';
    this.setData({
      weeklyProgress: {
        headline: text,
        summary: '请稍后刷新重试，或先继续记录今天的成长变化。',
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
      ability_task: '每日训练',
      parenting_article: '育儿锦囊',
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
        type: 'parenting_article',
        title: '先登录并完善孩子档案，再生成更贴合年龄的育儿建议',
        reason: '年龄、阶段和当前重点不同，首页建议内容也会不同。',
        summary: '先完成登录，再补充孩子生日和基础情况，系统才会按年龄生成更准确的今日建议。',
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
        title: '先完善孩子档案，再生成今日育儿建议',
        reason: '年龄不同，成长观察、营养建议和陪伴重点都会不一样。',
        summary: '补充孩子生日和基础情况后，首页才会按当前年龄阶段生成更准确的建议。',
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
        title: '演示模式：今日建议展示为示例内容',
        reason: '当前环境使用演示数据，内容仅用于展示首页布局和交互。',
        summary: '接入真实孩子档案和记录后，这里会生成当天的实际陪伴建议。',
        actionText: '查看示例',
        durationMinutes: 2,
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      }),
      this.normalizeDailyPlanCard({
        id: 'mock_2',
        planDate: dateText,
        type: 'habit_reminder',
        title: '演示模式：成长观察入口示例',
        reason: '用于展示首页如何引导用户进入成长观察。',
        summary: '真实模式下会根据孩子年龄和近期记录推荐更具体的观察方向。',
        actionText: '查看示例',
        durationMinutes: 3,
        targetType: 'assessment',
        targetPath: '/pages/assessment/assessment'
      })
    ];
  },

  applyDailyPlan: function(cards, payload) {
    var list = (cards || []).map(this.normalizeDailyPlanCard.bind(this));
    var completedCount = list.filter(function(item) { return item.completed; }).length;
    var firstCard = list[0] || null;
    var growthStatus = Object.assign({}, this.data.growthStatus, {
      todaySuggestion: firstCard ? firstCard.title : '从成长观察、每日训练或成长记录中选择一个开始'
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

  applyDailyPlanLoadError: function(message) {
    var text = message || '今日建议加载失败，请稍后重试。';
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
        duration: '请稍后刷新重试'
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
      that.applyDailyPlan(cards, res || {});
      that.trackDailyPlanView(that.data.dailyPlanCards, res || {});
    }).catch(function() {
      that.applyDailyPlanLoadError('今日建议加载失败，请稍后重试。');
    }).finally(function() {
      that.setData({ dailyPlanLoading: false });
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
        desc: '填写孩子的年龄和性别后，AI 会算出更精准的每日建议。',
        cta: '立即完善',
        targetType: 'child_profile',
        targetPath: '/pages/profile/child-edit/child-edit'
      },
      continue_daily_plan: function() {
        var plan = data.unfinished_daily_plan || {};
        return {
          title: '继续上次的任务',
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
            ? '您的会员将在3天内到期，续费可继续享受1v1成长陪伴服务。'
            : '您的会员将在7天内到期，提前续费享受连续陪伴。',
          cta: '查看会员',
          targetType: 'membership',
          targetPath: '/pages/membership/index'
        };
      },
      membership_conversion: {
        title: '解锁完整成长陪伴',
        desc: '开通会员可获得AI专属陪伴建议、成长曲线分析和周总结报告。',
        cta: '了解会员',
        targetType: 'membership',
        targetPath: '/pages/membership/index'
      },
      quick_return_task: {
        title: '3分钟快速回归',
        desc: '好久不见！从一次简单的成长观察重新开始吧。',
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
        title: '继续育儿问答',
        desc: '上次和AI聊了育儿话题，还有问题可以接着问。',
        cta: '继续提问',
        targetType: 'ai_chat',
        targetPath: '/pages/chat/chat'
      },
      start_growth_observation: {
        title: '开始今天的成长观察',
        desc: '从成长观察、每日训练或成长记录中选择一个开始。',
        cta: '去看看',
        targetType: 'assessment',
        targetPath: '/pages/assessment/assessment'
      },
      login_to_personalize: {
        title: '登录后开启个性化陪伴',
        desc: '登录后可获得基于孩子年龄的每日建议、成长观察和AI问答。',
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
      title: plan.title || '继续任务',
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
    }).catch(function() {
      that.setData({
        operationTouchpoint: Object.assign({}, that.data.operationTouchpoint, { key: '' }),
        retentionSummary: null,
        continueTask: null
      });
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
            wx.showToast({ title: '页面跳转失败', icon: 'none' });
          }
        });
      });
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

  askAiForToday: function() {
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    var childText = currentChild && currentChild.nickname ? currentChild.nickname : '孩子';
    wx.setStorageSync('pendingChatQuestion', childText + '今天遇到的育儿问题，能不能帮我拆成今晚可以做的三步？');
    this.goToChat();
  },

  // 跳转到成长观察
  goToAssessment() {
    if (!this.ensureFeatureEnabled('assessments', '成长观察暂未开放')) {
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
    if (!this.ensureFeatureEnabled('parenting', '育儿锦囊暂未开放')) {
      return;
    }
    wx.navigateTo({
      url: '/pages/parenting/parenting',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 跳转到每日训练
  goToTextbook() {
    if (!this.ensureFeatureEnabled('education', '每日训练暂未开放')) {
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
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      wx.showToast({ title: '请先完善孩子档案', icon: 'none' });
      this.navigateByDailyPlan({ targetPath: '/pages/profile/child-edit/child-edit' });
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
    var isMockMode = !!(app.shouldUseMockFallback && app.shouldUseMockFallback());
    var draft = {
      type: 'app_intro',
      mode: isMockMode ? 'mock' : 'live',
      title: isMockMode ? '演示模式：首页建议卡示例' : (firstPlan.title || this.data.todayTask.title || '成长观察建议'),
      summary: isMockMode ? '当前为演示内容分享，用于展示首页建议卡样式。' : '我正在用小牛育儿AI助理观察孩子的成长状态。',
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

