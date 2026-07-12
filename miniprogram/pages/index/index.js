// 首页逻辑
const app = getApp();
const encouragementUtils = require('../../utils/encouragement.js');
const coreActionScenes = require('../../utils/core-action-scenes.js');
const coreActionStorage = require('../../utils/core-action-storage.js');
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
      ageFirstCoreEnabled: true,
      configLoaded: false
    },
    coreRefactorState: {
      claim: '先看懂孩子当前卡点，再做今晚第一步',
      primaryActionText: '开始看看孩子卡在哪',
      activeScene: '',
      selectedAgeSegment: null,
      selectedPainPoint: null,
      selectedScene: null,
      selectedAgeGroup: '',
      selectedAgeLabel: '',
      selectedSymptomKey: '',
      selectedSymptomLabel: '',
      focusAreas: [],
      abilityTags: [],
      observableSigns: [],
      painPoints: [],
      profileAgeGroup: null,
      effectOptions: [
        { key: 'started_smoothly', label: '顺利开始了' },
        { key: 'still_resisted', label: '还是抗拒' },
        { key: 'slow_but_started', label: '写了一点但很慢' },
        { key: 'not_tried', label: '没来得及试' }
      ],
      nextActionSuggestion: null,
      currentBottleneck: null,
      nextAction: null,
      resultSupportItems: [],
      stage: 'idle',
      ageSegments: coreActionScenes.getAgeFirstSegments ? coreActionScenes.getAgeFirstSegments().filter(function(segment) {
        return segment && segment.key && Array.isArray(segment.painPoints) && segment.painPoints.length > 0;
      }) : [],
      ageOptions: coreActionScenes.getCoreActionAgeGroups()
    },
    coreScenes: coreActionScenes.getCoreActionScenes(),
    coreSupportTools: [
      {
        key: 'chat',
        title: '继续追问细节',
        desc: '围绕刚才的卡点问做法',
        action: 'chat'
      },
      {
        key: 'assessment',
        title: '做观察',
        desc: '系统看一次整体状态',
        action: 'assessment'
      },
      {
        key: 'textbook',
        title: '做练习',
        desc: '按年龄练阅读表达',
        action: 'textbook'
      },
      {
        key: 'parenting',
        title: '找方法',
        desc: '按场景查育儿步骤',
        action: 'parenting'
      },
      {
        key: 'nutrition',
        title: '看营养',
        desc: '查挑食和搭配建议',
        action: 'nutrition'
      },
      {
        key: 'growth',
        title: '记成长',
        desc: '看看最近变化',
        action: 'growth_record'
      },
      {
        key: 'weekly',
        title: '看周报',
        desc: '复盘一周变化',
        action: 'weekly_report'
      },
      {
        key: 'membership',
        title: '成长服务',
        desc: '解锁连续陪伴建议',
        action: 'membership'
      }
    ],
    homePrimaryCard: {
      primaryCardType: 'first_action',
      reason: 'no_context',
      title: '孩子今天这个表现，先看懂卡在哪',
      desc: '选一个家里正在发生的场景，小牛帮你判断原因，再给今晚能做的一步。',
      cta: '开始看看孩子卡在哪',
      targetPath: '',
      targetPayload: {}
    },
    recentCoreAction: null,
    coreRefactorEnabled: false,
    ageFirstCoreEnabled: true,
    ageFirstCoreAvailable: true,
    showLegacyHomeSections: true,
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
    membershipTouchpointVisible: false,
    membershipTouchpointTitle: '宝贝每周成长总结',
    membershipTouchpointDesc: '查看每周成长趋势和下周建议。',
    membershipTouchpointCta: '查看宝贝成长总结',
    membershipTouchpointEligible: true,
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
    this.refreshCoreActionHomeState();
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
    this.refreshCoreActionHomeState();
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

  refreshCoreActionHomeState: function() {
    var runtimeConfig = app.getRuntimeConfig ? app.getRuntimeConfig() : (app.globalData.runtimeConfig || {});
    var coreRefactorEnabled = this.resolveCoreRefactorEnabled(runtimeConfig);
    var ageFirstCoreEnabled = coreRefactorEnabled && this.resolveAgeFirstCoreEnabled(runtimeConfig);
    var ageFirstCoreAvailable = this.hasUsableAgeFirstSegments();
    var recentAction = coreActionStorage.getLatestCoreAction();
    var continuousRecordCount = coreActionStorage.getContinuousRecordCount();
    var primaryCard = this.buildHomePrimaryCard({
      recentAction: recentAction,
      retentionSummary: this.data.retentionSummary,
      continueTask: this.data.continueTask,
      continuousRecordCount: continuousRecordCount
    });

    this.setData({
      recentCoreAction: recentAction,
      homePrimaryCard: primaryCard,
      coreRefactorEnabled: coreRefactorEnabled,
      ageFirstCoreEnabled: ageFirstCoreEnabled,
      ageFirstCoreAvailable: ageFirstCoreAvailable,
      showLegacyHomeSections: !coreRefactorEnabled
    });
    if (!coreRefactorEnabled) {
      return;
    }
    this.trackCoreHomeClaimView(primaryCard);
    this.trackNextDayRecordView(primaryCard, recentAction);
  },

  resolveCoreRefactorEnabled: function(runtimeConfig) {
    var config = runtimeConfig || {};
    if (config.coreRefactorEnabled === true) {
      return true;
    }
    var whitelist = config.coreRefactorUserWhitelist || [];
    var userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo') || {};
    var userKeys = [userInfo.id, userInfo.openid, userInfo.open_id, userInfo.unionid, userInfo.union_id].map(function(item) {
      return String(item || '').trim();
    }).filter(Boolean);
    if (userKeys.some(function(key) { return whitelist.indexOf(key) !== -1; })) {
      return true;
    }
    var rolloutPercent = Number(config.coreRefactorRolloutPercent || 0);
    if (!rolloutPercent || rolloutPercent <= 0) {
      return false;
    }
    return this.getCoreRefactorBucket(userKeys[0] || this.getCoreRefactorAnonymousKey()) < Math.min(100, Math.max(0, rolloutPercent));
  },

  resolveAgeFirstCoreEnabled: function(runtimeConfig) {
    var config = runtimeConfig || {};
    return config.ageFirstCoreEnabled !== false;
  },

  getCoreRefactorAnonymousKey: function() {
    var key = wx.getStorageSync('coreRefactorAnonKey');
    if (!key) {
      key = 'anon_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
      wx.setStorageSync('coreRefactorAnonKey', key);
    }
    return key;
  },

  getCoreRefactorBucket: function(key) {
    var text = String(key || 'anonymous');
    var hash = 0;
    for (var i = 0; i < text.length; i += 1) {
      hash = (hash * 31 + text.charCodeAt(i)) % 10000;
    }
    return hash % 100;
  },

  trackCoreActionEvent: function(eventType, payload) {
    if (!eventType || !app.trackKbEvent) {
      return;
    }
    var data = payload || {};
    var meta = Object.assign({}, data.event_meta || {});
    if (data.scene_key || data.sceneKey) {
      meta.scene_key = data.scene_key || data.sceneKey;
    }
    if (data.age_group || data.ageGroup) {
      meta.age_group = data.age_group || data.ageGroup;
    }
    if (data.age_segment_key || data.ageSegmentKey) {
      meta.age_segment_key = data.age_segment_key || data.ageSegmentKey;
    }
    if (data.pain_point_key || data.painPointKey) {
      meta.pain_point_key = data.pain_point_key || data.painPointKey;
    }
    if (data.ability_tags || data.abilityTags) {
      meta.ability_tags = data.ability_tags || data.abilityTags;
    }
    if (data.symptom_key || data.symptomKey) {
      meta.symptom_key = data.symptom_key || data.symptomKey;
    }
    if (data.result_id || data.resultId) {
      meta.result_id = data.result_id || data.resultId;
    }
    app.trackKbEvent({
      event_type: eventType,
      module_key: 'core_action',
      page_key: 'home_index',
      scene_key: data.scene_key || data.sceneKey || '',
      event_meta: meta
    });
  },

  trackCoreHomeClaimView: function(primaryCard) {
    var card = primaryCard || this.data.homePrimaryCard || {};
    var viewKey = card.reason || card.primaryCardType || 'default';
    if (this._trackedCoreHomeClaimView === viewKey) {
      return;
    }
    this._trackedCoreHomeClaimView = viewKey;
    this.trackCoreActionEvent('home_core_claim_view', {
      event_meta: {
        card_type: card.primaryCardType || '',
        reason: card.reason || '',
        cta: card.cta || ''
      }
    });
  },

  trackNextDayRecordView: function(primaryCard, recentAction) {
    if (!primaryCard || primaryCard.reason !== 'next_day_record' || !recentAction || !recentAction.id) {
      return;
    }
    this._trackedNextDayRecordIds = this._trackedNextDayRecordIds || {};
    if (this._trackedNextDayRecordIds[recentAction.id]) {
      return;
    }
    this._trackedNextDayRecordIds[recentAction.id] = true;
    this.trackCoreActionEvent('next_day_record_view', {
      sceneKey: recentAction.sceneKey,
      ageGroup: recentAction.ageGroup,
      ageSegmentKey: recentAction.ageSegmentKey,
      painPointKey: recentAction.painPointKey,
      abilityTags: recentAction.abilityTags,
      symptomKey: recentAction.symptomKey,
      resultId: recentAction.id,
      event_meta: {
        action_id: recentAction.id,
        saved_at: recentAction.savedAt || 0
      }
    });
  },

  isBeforeToday: function(timestamp) {
    var time = Number(timestamp || 0);
    if (!time) {
      return false;
    }
    var target = new Date(time);
    var today = new Date();
    target.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return target.getTime() < today.getTime();
  },

  buildHomePrimaryCard: function(options) {
    var context = options || {};
    var recentAction = context.recentAction || null;
    var continueTask = context.continueTask || null;
    var retentionSummary = context.retentionSummary || null;
    var continuousRecordCount = Number(context.continuousRecordCount || 0);

    if (recentAction && recentAction.completed && continuousRecordCount >= 2) {
      return {
        primaryCardType: 'weekly_summary',
        reason: 'continuous_record',
        title: '已经连续记录 ' + continuousRecordCount + ' 次',
        desc: '看看这个问题这几天怎么变了，再选下一周的小步骤。',
        cta: '看一周变化',
        targetPath: '/pages/weekly-summary/index',
        targetPayload: { actionId: recentAction.id, continuousRecordCount: continuousRecordCount }
      };
    }

    if (recentAction && recentAction.saved && !recentAction.completed && this.isBeforeToday(recentAction.savedAt || recentAction.createdAt)) {
      return {
        primaryCardType: 'continue_action',
        reason: 'next_day_record',
        title: '昨晚这一步效果怎么样？',
        desc: recentAction.actionTitle || '记录一下效果，小牛再给下一步。',
        cta: '记录一下效果',
        targetPath: '',
        targetPayload: { actionId: recentAction.id }
      };
    }

    if (recentAction && recentAction.saved && !recentAction.completed) {
      return {
        primaryCardType: 'continue_action',
        reason: 'unfinished_action',
        title: '今晚继续这一步',
        desc: recentAction.actionTitle || '上次的小行动还可以继续试一次。',
        cta: '继续看看',
        targetPath: '',
        targetPayload: { actionId: recentAction.id }
      };
    }

    if (recentAction && recentAction.completed) {
      return {
        primaryCardType: 'weekly_summary',
        reason: 'recent_record',
        title: '上次记录有结果了',
        desc: recentAction.effectLabel || '看看下一步怎么做。',
        cta: '看下一步',
        targetPath: '',
        targetPayload: { actionId: recentAction.id }
      };
    }

    if (continueTask && continueTask.id) {
      return {
        primaryCardType: 'continue_action',
        reason: 'unfinished_action',
        title: continueTask.title || '接着完成上次那件事',
        desc: '继续完成后，小牛会帮你整理下一步。',
        cta: '继续完成',
        targetPath: continueTask.targetPath || '',
        targetPayload: { sourceId: continueTask.id }
      };
    }

    if (retentionSummary) {
      return {
        primaryCardType: 'weekly_summary',
        reason: 'recent_record',
        title: '最近状态有记录了',
        desc: String(retentionSummary || '看看孩子最近的变化，再选今晚一步。'),
        cta: '看下一步',
        targetPath: '/pages/growth-record/index',
        targetPayload: {}
      };
    }

    return {
      primaryCardType: 'first_action',
      reason: 'no_context',
      title: '孩子今天这个表现，先看懂卡在哪',
      desc: '选一个家里正在发生的场景，小牛帮你判断原因，再给今晚能做的一步。',
      cta: '开始看看孩子卡在哪',
      targetPath: '',
      targetPayload: {}
    };
  },

  onHomePrimaryActionTap: function() {
    var card = this.data.homePrimaryCard || {};
    var recentAction = this.data.recentCoreAction;
    this.trackCoreActionEvent('first_action_entry_click', {
      event_meta: {
        card_type: card.primaryCardType || '',
        reason: card.reason || '',
        cta: card.cta || ''
      }
    });
    if (card.reason === 'next_day_record' && recentAction && recentAction.id) {
      this.setData({
        'coreRefactorState.currentBottleneck': recentAction,
        'coreRefactorState.nextAction': {
          title: recentAction.actionTitle,
          steps: recentAction.actionSteps || []
        },
        'coreRefactorState.resultSupportItems': this.buildCoreResultSupportItems(recentAction),
        'coreRefactorState.stage': 'effect_record'
      });
      wx.showToast({ title: '记录昨晚效果', icon: 'none' });
      return;
    }
    if (card.reason === 'unfinished_action' && recentAction && recentAction.id) {
      this.setData({
        'coreRefactorState.currentBottleneck': recentAction,
        'coreRefactorState.nextAction': {
          title: recentAction.actionTitle,
          steps: recentAction.actionSteps || []
        },
        'coreRefactorState.resultSupportItems': this.buildCoreResultSupportItems(recentAction),
        'coreRefactorState.stage': 'bottleneck_result'
      });
      return;
    }
    if (card.primaryCardType === 'weekly_summary' || card.targetPath === '/pages/weekly-summary/index') {
      this.goToWeeklyReport();
      return;
    }
    if (card.targetPath) {
      this.navigateByDailyPlan({ targetPath: card.targetPath });
      return;
    }
    this.startCoreActionFlow();
  },

  startCoreActionFlow: function() {
    var profileAgeGroup = this.getProfileCoreActionAgeGroup();
    if (!this.data.ageFirstCoreEnabled || !this.hasUsableAgeFirstSegments()) {
      this.startSceneFirstCoreActionFlow(profileAgeGroup);
      wx.showToast({ title: '先选一个场景', icon: 'none' });
      return;
    }
    var ageSegment = this.resolveCoreAgeFirstSegment(profileAgeGroup);
    if (!ageSegment || !ageSegment.painPoints || !ageSegment.painPoints.length) {
      this.startSceneFirstCoreActionFlow(profileAgeGroup);
      wx.showToast({ title: '先选一个场景', icon: 'none' });
      return;
    }
    this.setData({
      'coreRefactorState.selectedAgeSegment': ageSegment,
      'coreRefactorState.selectedPainPoint': null,
      'coreRefactorState.focusAreas': ageSegment ? ageSegment.focusAreas || [] : [],
      'coreRefactorState.painPoints': ageSegment ? ageSegment.painPoints || [] : [],
      'coreRefactorState.abilityTags': [],
      'coreRefactorState.observableSigns': [],
      'coreRefactorState.stage': 'age_select',
      'coreRefactorState.profileAgeGroup': profileAgeGroup
    });
    wx.showToast({ title: '先选孩子年龄', icon: 'none' });
  },

  startSceneFirstCoreActionFlow: function(profileAgeGroup) {
    this.setData({
      'coreRefactorState.activeScene': '',
      'coreRefactorState.selectedAgeSegment': null,
      'coreRefactorState.selectedPainPoint': null,
      'coreRefactorState.selectedScene': null,
      'coreRefactorState.selectedAgeGroup': profileAgeGroup ? profileAgeGroup.key : '',
      'coreRefactorState.selectedAgeLabel': profileAgeGroup ? profileAgeGroup.label : '',
      'coreRefactorState.selectedSymptomKey': '',
      'coreRefactorState.selectedSymptomLabel': '',
      'coreRefactorState.focusAreas': [],
      'coreRefactorState.painPoints': [],
      'coreRefactorState.abilityTags': [],
      'coreRefactorState.observableSigns': [],
      'coreRefactorState.currentBottleneck': null,
      'coreRefactorState.nextAction': null,
      'coreRefactorState.resultSupportItems': [],
      'coreRefactorState.stage': 'scene_select',
      'coreRefactorState.profileAgeGroup': profileAgeGroup
    });
  },

  hasUsableAgeFirstSegments: function() {
    return (this.data.coreRefactorState.ageSegments || []).some(function(segment) {
      return segment && segment.key && Array.isArray(segment.painPoints) && segment.painPoints.length > 0;
    });
  },

  resolveCoreAgeFirstSegment: function(profileAgeGroup) {
    var segments = (this.data.coreRefactorState.ageSegments || []).filter(function(segment) {
      return segment && segment.key && Array.isArray(segment.painPoints) && segment.painPoints.length > 0;
    });
    var cachedKey = wx.getStorageSync('lastCoreAgeSegmentKey') || '';
    var cachedSegment = cachedKey ? segments.find(function(item) {
      return item.key === cachedKey;
    }) : null;
    if (cachedSegment) {
      return cachedSegment;
    }
    var profileKey = profileAgeGroup && profileAgeGroup.key ? profileAgeGroup.key : '';
    var keyMap = {
      '3-4': 'age_3_4',
      '4-5': 'age_4_5',
      '5-6': 'age_5_6',
      '6-plus': 'age_6_8'
    };
    var targetKey = keyMap[profileKey] || 'age_4_5';
    var targetSegment = segments.find(function(item) {
      return item.key === targetKey;
    });
    var defaultSegment = segments.find(function(item) {
      return item.key === 'age_4_5';
    });
    return targetSegment || defaultSegment || segments[0] || null;
  },

  getProfileCoreActionAgeGroup: function() {
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild) {
      return null;
    }
    var ageYears = Number(currentChild.age || currentChild.age_years || currentChild.ageYears || 0);
    if (!ageYears && app.calculateAgeYears) {
      ageYears = app.calculateAgeYears(currentChild.birthday || currentChild.birth_date || '') || 0;
    }
    if (!ageYears) {
      return null;
    }
    var matched = null;
    if (ageYears <= 3) {
      matched = { key: '3-4', label: '3-4岁' };
    } else if (ageYears === 4) {
      matched = { key: '4-5', label: '4-5岁' };
    } else if (ageYears === 5) {
      matched = { key: '5-6', label: '5-6岁' };
    } else {
      matched = { key: '6-plus', label: '6岁以上' };
    }
    return {
      key: matched.key,
      label: matched.label,
      childId: currentChild.id || 0,
      childName: currentChild.name || currentChild.nickname || '孩子'
    };
  },

  trackCoreSceneSelect: function(scene) {
    if (!scene) {
      return;
    }
    this.trackCoreActionEvent('scene_select', {
      sceneKey: scene.key,
      event_meta: {
        scene_label: scene.label,
        source: 'home_core_scene_grid'
      }
    });
  },

  onCoreSceneTap: function(e) {
    var sceneKey = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.sceneKey : '';
    var scene = coreActionScenes.getCoreActionScene(sceneKey);
    var profileAgeGroup = this.getProfileCoreActionAgeGroup();
    if (!scene) {
      wx.showToast({ title: '场景还在准备中', icon: 'none' });
      return;
    }
    this.setData({
      'coreRefactorState.activeScene': scene.key,
      'coreRefactorState.selectedScene': scene,
      'coreRefactorState.selectedAgeGroup': profileAgeGroup ? profileAgeGroup.key : '',
      'coreRefactorState.selectedAgeLabel': profileAgeGroup ? profileAgeGroup.label : '',
      'coreRefactorState.selectedSymptomKey': '',
      'coreRefactorState.selectedSymptomLabel': '',
      'coreRefactorState.profileAgeGroup': profileAgeGroup,
      'coreRefactorState.currentBottleneck': null,
      'coreRefactorState.nextAction': null,
      'coreRefactorState.resultSupportItems': [],
      'coreRefactorState.stage': 'age_select'
    });
    this.trackCoreSceneSelect(scene);
    wx.showToast({ title: '下一步确认年龄', icon: 'none' });
  },

  onCoreAgeTap: function(e) {
    var ageKey = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.ageKey : '';
    var ageOptions = this.data.coreRefactorState.ageOptions || [];
    var ageGroup = ageOptions.find(function(item) {
      return item.key === ageKey;
    });
    if (!ageGroup) {
      wx.showToast({ title: '年龄选项没找到', icon: 'none' });
      return;
    }
    this.setData({
      'coreRefactorState.selectedAgeGroup': ageGroup.key,
      'coreRefactorState.selectedAgeLabel': ageGroup.label,
      'coreRefactorState.stage': 'symptom_select'
    });
    this.trackCoreActionEvent('age_select', {
      sceneKey: (this.data.coreRefactorState.selectedScene || {}).key || this.data.coreRefactorState.activeScene || '',
      ageGroup: ageGroup.key,
      event_meta: {
        age_label: ageGroup.label
      }
    });
    wx.showToast({ title: '接着选最像的表现', icon: 'none' });
  },

  onCoreAgeSegmentTap: function(e) {
    var segmentKey = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.segmentKey : '';
    var ageSegment = (this.data.coreRefactorState.ageSegments || []).find(function(item) {
      return item.key === segmentKey;
    }) || (coreActionScenes.getAgeFirstSegmentByKey ? coreActionScenes.getAgeFirstSegmentByKey(segmentKey) : null);
    if (!ageSegment) {
      wx.showToast({ title: '年龄段没找到', icon: 'none' });
      return;
    }
    if (!ageSegment.painPoints || !ageSegment.painPoints.length) {
      this.startSceneFirstCoreActionFlow(this.getProfileCoreActionAgeGroup());
      wx.showToast({ title: '先选一个场景', icon: 'none' });
      return;
    }
    this.setData({
      'coreRefactorState.selectedAgeSegment': ageSegment,
      'coreRefactorState.selectedPainPoint': null,
      'coreRefactorState.selectedAgeGroup': ageSegment.key,
      'coreRefactorState.selectedAgeLabel': ageSegment.label,
      'coreRefactorState.selectedSymptomKey': '',
      'coreRefactorState.selectedSymptomLabel': '',
      'coreRefactorState.focusAreas': ageSegment.focusAreas || [],
      'coreRefactorState.painPoints': ageSegment.painPoints || [],
      'coreRefactorState.abilityTags': [],
      'coreRefactorState.observableSigns': [],
      'coreRefactorState.currentBottleneck': null,
      'coreRefactorState.nextAction': null,
      'coreRefactorState.resultSupportItems': [],
      'coreRefactorState.stage': 'pain_point_select'
    });
    this.trackCoreActionEvent('age_segment_select', {
      ageGroup: ageSegment.label,
      event_meta: {
        age_segment_key: ageSegment.key,
        age_segment_label: ageSegment.label,
        focus_areas: ageSegment.focusAreas || [],
        pain_point_count: (ageSegment.painPoints || []).length
      }
    });
    wx.setStorageSync('lastCoreAgeSegmentKey', ageSegment.key);
    wx.showToast({ title: '接着选最像的问题', icon: 'none' });
  },

  onCorePainPointTap: function(e) {
    var painPointKey = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.painPointKey : '';
    var state = this.data.coreRefactorState || {};
    var ageSegment = state.selectedAgeSegment || this.resolveCoreAgeFirstSegment(state.profileAgeGroup);
    var painPoints = ageSegment && ageSegment.painPoints ? ageSegment.painPoints : [];
    var painPoint = painPoints.find(function(item) {
      return item.key === painPointKey;
    });
    if (!ageSegment || !painPoint) {
      wx.showToast({ title: '问题场景没找到', icon: 'none' });
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    var result = coreActionScenes.buildAgeFirstActionResult({
      ageSegmentKey: ageSegment.key,
      painPointKey: painPoint.key,
      childId: currentChild && currentChild.id ? currentChild.id : 0
    });
    this.setData({
      'coreRefactorState.selectedAgeSegment': ageSegment,
      'coreRefactorState.selectedPainPoint': painPoint,
      'coreRefactorState.selectedAgeGroup': ageSegment.key,
      'coreRefactorState.selectedAgeLabel': ageSegment.label,
      'coreRefactorState.selectedScene': null,
      'coreRefactorState.activeScene': painPoint.sceneKey || '',
      'coreRefactorState.selectedSymptomKey': '',
      'coreRefactorState.selectedSymptomLabel': painPoint.title,
      'coreRefactorState.focusAreas': ageSegment.focusAreas || [],
      'coreRefactorState.abilityTags': painPoint.abilityTags || [],
      'coreRefactorState.observableSigns': painPoint.observableSigns || [],
      'coreRefactorState.currentBottleneck': result,
      'coreRefactorState.nextAction': {
        title: result.actionTitle,
        steps: result.actionSteps
      },
      'coreRefactorState.resultSupportItems': this.buildCoreResultSupportItems(result),
      'coreRefactorState.stage': 'bottleneck_result'
    });
    this.applyCoreMembershipTouchpoint('bottleneck_result');
    this.trackCoreActionEvent('pain_point_select', {
      sceneKey: result.sceneKey,
      ageGroup: result.ageSegmentLabel || result.ageGroup,
      event_meta: {
        age_segment_key: result.ageSegmentKey,
        pain_point_key: result.painPointKey,
        pain_point_title: result.painPointTitle,
        ability_tags: result.abilityTags || []
      }
    });
    this.trackCoreBottleneckView(result);
  },

  trackCoreSymptomSelect: function(result) {
    if (!result) {
      return;
    }
    this.trackCoreActionEvent('symptom_select', {
      sceneKey: result.sceneKey,
      ageGroup: result.ageGroup,
      symptomKey: result.symptomKey,
      event_meta: {
        symptom_label: result.symptomLabel
      }
    });
  },

  trackCoreBottleneckView: function(result) {
    if (!result) {
      return;
    }
    this.trackCoreActionEvent('bottleneck_result_view', {
      sceneKey: result.sceneKey,
      ageGroup: result.ageGroup,
      ageSegmentKey: result.ageSegmentKey,
      painPointKey: result.painPointKey,
      abilityTags: result.abilityTags,
      symptomKey: result.symptomKey,
      resultId: result.id || '',
      event_meta: {
        bottleneck_title: result.bottleneckTitle,
        fallback_reason: result.fallbackReason
      }
    });
  },

  onCoreSymptomTap: function(e) {
    var symptomKey = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.symptomKey : '';
    var state = this.data.coreRefactorState || {};
    var scene = state.selectedScene || coreActionScenes.getCoreActionScene(state.activeScene);
    var symptoms = scene && scene.symptoms ? scene.symptoms : [];
    var symptom = symptoms.find(function(item) {
      return item.key === symptomKey;
    });
    if (!scene || !symptom) {
      wx.showToast({ title: '表现选项没找到', icon: 'none' });
      return;
    }
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    var result = coreActionScenes.buildFirstActionResult({
      sceneKey: scene.key,
      symptomKey: symptom.key,
      ageGroup: state.selectedAgeGroup || state.selectedAgeLabel || '',
      childId: currentChild && currentChild.id ? currentChild.id : 0
    });
    this.setData({
      'coreRefactorState.selectedSymptomKey': symptom.key,
      'coreRefactorState.selectedSymptomLabel': symptom.label,
      'coreRefactorState.currentBottleneck': result,
      'coreRefactorState.nextAction': {
        title: result.actionTitle,
        steps: result.actionSteps
      },
      'coreRefactorState.resultSupportItems': this.buildCoreResultSupportItems(result),
      'coreRefactorState.stage': 'bottleneck_result'
    });
    this.applyCoreMembershipTouchpoint('bottleneck_result');
    this.trackCoreSymptomSelect(result);
    this.trackCoreBottleneckView(result);
  },

  onCoreTryTonightTap: function() {
    this.onSaveTonightAction();
  },

  onSaveTonightAction: function() {
    if (!this.data.coreRefactorState.currentBottleneck) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    var saved = coreActionStorage.saveTonightAction(this.data.coreRefactorState.currentBottleneck);
    if (!saved.success || !saved.record) {
      wx.showToast({ title: '没保存成功，请再试一次', icon: 'none' });
      return;
    }
    this.trackCoreActionEvent('tonight_action_save', {
      sceneKey: saved.record.sceneKey,
      ageGroup: saved.record.ageGroup,
      ageSegmentKey: saved.record.ageSegmentKey,
      painPointKey: saved.record.painPointKey,
      abilityTags: saved.record.abilityTags,
      symptomKey: saved.record.symptomKey,
      resultId: saved.record.id,
      event_meta: {
        action_id: saved.record.id,
        action_title: saved.record.actionTitle
      }
    });
    this.setData({
      'coreRefactorState.currentBottleneck': saved.record,
      recentCoreAction: saved.record,
      homePrimaryCard: this.buildHomePrimaryCard({
        recentAction: saved.record,
        retentionSummary: this.data.retentionSummary,
        continueTask: this.data.continueTask,
        continuousRecordCount: coreActionStorage.getContinuousRecordCount()
      })
    });
    this.applyCoreMembershipTouchpoint('tonight_action_save');
    wx.showToast({ title: '已保存，今晚照这一步试试', icon: 'success' });
  },

  buildCoreResultSupportItems: function(result) {
    var sceneKey = result && result.sceneKey ? result.sceneKey : '';
    var itemsByScene = {
      homework_restless: [
        { key: 'parenting_homework', title: '看写作业方法', desc: '查同场景育儿步骤', action: 'parenting' },
        { key: 'assessment_focus', title: '做专注观察', desc: '看整体注意力状态', action: 'assessment' }
      ],
      bedtime_meltdown: [
        { key: 'parenting_bedtime', title: '看睡前方法', desc: '查睡前流程和情绪安抚', action: 'parenting' },
        { key: 'growth_bedtime', title: '记录睡前反应', desc: '保存今晚尝试后的变化', action: 'growth_record' }
      ],
      picture_book_runs: [
        { key: 'reading_practice', title: '做阅读练习', desc: '用更短任务练坐住和复述', action: 'textbook' },
        { key: 'parenting_reading', title: '看绘本方法', desc: '查亲子阅读步骤', action: 'parenting' }
      ],
      meal_dawdling: [
        { key: 'nutrition_meal', title: '看饮食建议', desc: '查挑食和正餐安排', action: 'nutrition' },
        { key: 'parenting_meal', title: '看饭桌方法', desc: '查饭桌规则和沟通步骤', action: 'parenting' }
      ],
      class_departure_dawdling: [
        { key: 'parenting_morning', title: '看出门方法', desc: '查早晨流程和分离步骤', action: 'parenting' },
        { key: 'growth_morning', title: '记录明早变化', desc: '保存明早执行后的反应', action: 'growth_record' }
      ],
      weak_expression: [
        { key: 'expression_practice', title: '做表达练习', desc: '用短句练开口和复述', action: 'textbook' },
        { key: 'assessment_expression', title: '做表达观察', desc: '看语言表达整体状态', action: 'assessment' }
      ]
    };
    return (itemsByScene[sceneKey] || [
      { key: 'parenting_default', title: '看相关方法', desc: '查同场景育儿步骤', action: 'parenting' },
      { key: 'growth_default', title: '记录孩子反应', desc: '把今晚变化记下来', action: 'growth_record' }
    ]).slice(0, 2);
  },

  applyCoreMembershipTouchpoint: function(reason) {
    if (this.data.membershipTouchpointEligible === false) {
      return;
    }
    var copy = {
      bottleneck_result: {
        title: '连续 7 天跟踪孩子变化',
        desc: '今天先看懂卡点，后面每天一个更适合的小步骤，周末看孩子变化。',
        cta: '查看 7 天陪伴'
      },
      tonight_action_save: {
        title: '每天一个更适合的小步骤',
        desc: '已保存今晚任务，连续记录后可以看到下一步怎么微调。',
        cta: '查看连续计划'
      },
      effect_recorded: {
        title: '周末看变化',
        desc: '记录孩子反应后，小牛会把这几天的尝试整理成趋势和建议。',
        cta: '查看周总结'
      },
      continuous_record: {
        title: '继续跟踪这个问题',
        desc: '继续跟 7 天，每天一个更适合的小步骤，周末看孩子真正的变化。',
        cta: '解锁连续跟踪'
      }
    }[reason] || null;
    if (!copy) {
      return;
    }
    this.setData({
      membershipTouchpointVisible: true,
      membershipTouchpointTitle: copy.title,
      membershipTouchpointDesc: copy.desc,
      membershipTouchpointCta: copy.cta
    });
    if (!this._coreMembershipTouchpointExposed || this._coreMembershipTouchpointReason !== reason) {
      this._coreMembershipTouchpointExposed = true;
      this._coreMembershipTouchpointReason = reason;
      this.trackMembershipTouchpointEvent('membership_touchpoint_exposure', {
        mode: 'core_action',
        reason: reason
      });
    }
  },

  onCoreAskDetailTap: function() {
    var state = this.data.coreRefactorState || {};
    var result = state.currentBottleneck;
    if (!result) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    if (!this.ensureFeatureEnabled('aiChat', '小牛问答还在准备中')) {
      var fallbackSuggestion = this.buildCoreNextActionSuggestion(result);
      this.setData({
        'coreRefactorState.nextActionSuggestion': fallbackSuggestion,
        'coreRefactorState.stage': 'effect_recorded'
      });
      this.trackCoreNextActionView(result, fallbackSuggestion);
      return;
    }
    wx.setStorageSync('pendingCoreActionContext', {
      source: 'home_core_action_result',
      sceneKey: result.sceneKey,
      sceneLabel: result.sceneLabel,
      ageGroup: result.ageGroup,
      ageSegmentKey: result.ageSegmentKey || '',
      ageSegmentLabel: result.ageSegmentLabel || '',
      painPointKey: result.painPointKey || '',
      painPointTitle: result.painPointTitle || '',
      abilityTags: result.abilityTags || [],
      observableSigns: result.observableSigns || [],
      symptomKey: result.symptomKey,
      symptomLabel: result.symptomLabel,
      bottleneckTitle: result.bottleneckTitle,
      bottleneckText: result.bottleneckText,
      actionTitle: result.actionTitle,
      actionSteps: result.actionSteps || []
    });
    wx.switchTab({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onCoreEffectTap: function(e) {
    var effectKey = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.effectKey : '';
    var state = this.data.coreRefactorState || {};
    var action = state.currentBottleneck || this.data.recentCoreAction;
    var effect = (state.effectOptions || []).find(function(item) {
      return item.key === effectKey;
    });
    if (!action || !action.id || !effect) {
      wx.showToast({ title: '记录项没找到', icon: 'none' });
      return;
    }
    var updated = coreActionStorage.updateActionEffect(action.id, effect);
    if (!updated.success || !updated.record) {
      wx.showToast({ title: '没记录成功，请再试一次', icon: 'none' });
      return;
    }
    var nextSuggestion = this.buildCoreNextActionSuggestion(updated.record);
    var continuousCount = coreActionStorage.getContinuousRecordCount();
    this.trackCoreActionEvent('action_effect_submit', {
      sceneKey: updated.record.sceneKey,
      ageGroup: updated.record.ageGroup,
      ageSegmentKey: updated.record.ageSegmentKey,
      painPointKey: updated.record.painPointKey,
      abilityTags: updated.record.abilityTags,
      symptomKey: updated.record.symptomKey,
      resultId: updated.record.id,
      event_meta: {
        action_id: updated.record.id,
        effect_key: updated.record.effectKey,
        effect_label: updated.record.effectLabel,
        continuous_record_count: continuousCount
      }
    });
    this.setData({
      recentCoreAction: updated.record,
      'coreRefactorState.currentBottleneck': updated.record,
      'coreRefactorState.nextActionSuggestion': nextSuggestion,
      'coreRefactorState.stage': 'effect_recorded',
      homePrimaryCard: this.buildHomePrimaryCard({
        recentAction: updated.record,
        retentionSummary: this.data.retentionSummary,
        continueTask: this.data.continueTask,
        continuousRecordCount: continuousCount
      })
    });
    this.applyCoreMembershipTouchpoint(continuousCount >= 2 ? 'continuous_record' : 'effect_recorded');
    this.trackCoreNextActionView(updated.record, nextSuggestion);
    wx.showToast({ title: '已记录效果', icon: 'success' });
  },

  buildCoreNextActionSuggestion: function(record) {
    var effectKey = record && record.effectKey;
    var baseTitle = record && record.actionTitle ? record.actionTitle : '今晚继续一个小步骤';
    var sceneLabel = record && record.sceneLabel ? record.sceneLabel : '这个场景';
    var configuredNextActions = record && record.nextActions ? record.nextActions : null;
    if (configuredNextActions && configuredNextActions[effectKey]) {
      var configured = configuredNextActions[effectKey];
      return {
        id: String((record && record.id) || 'core_action') + '_next_' + Date.now(),
        sourceRecordId: record && record.id ? record.id : '',
        sceneKey: record && record.sceneKey ? record.sceneKey : '',
        sceneLabel: sceneLabel,
        ageGroup: record && record.ageGroup ? record.ageGroup : '',
        ageSegmentKey: record && record.ageSegmentKey ? record.ageSegmentKey : '',
        ageSegmentLabel: record && record.ageSegmentLabel ? record.ageSegmentLabel : '',
        painPointKey: record && record.painPointKey ? record.painPointKey : '',
        painPointTitle: record && record.painPointTitle ? record.painPointTitle : '',
        focusAreas: record && record.focusAreas ? record.focusAreas : [],
        abilityTags: record && record.abilityTags ? record.abilityTags : [],
        observableSigns: record && record.observableSigns ? record.observableSigns : [],
        symptomKey: record && record.symptomKey ? record.symptomKey : '',
        symptomLabel: record && record.symptomLabel ? record.symptomLabel : '',
        bottleneckTitle: record && record.bottleneckTitle ? record.bottleneckTitle : '',
        bottleneckText: record && record.bottleneckText ? record.bottleneckText : '',
        actionTitle: configured.title || baseTitle,
        actionSteps: configured.steps || [],
        nextActionDesc: configured.desc || '',
        nextActions: configuredNextActions,
        sourceType: 'next_action_recommendation',
        createdAt: Date.now(),
        saved: false,
        completed: false
      };
    }
    var map = {
      started_smoothly: {
        title: '今晚把这一步再稳定一次',
        desc: '孩子已经能开始了，先保持同一个步骤，让它变成更熟的家庭节奏。',
        steps: ['沿用昨晚的开头方式。', '只比昨晚多坚持 1 分钟。', '结束时说一句：你今天比昨天更快开始了。']
      },
      still_resisted: {
        title: '今晚再把目标缩小一半',
        desc: '抗拒还在，说明入口仍然偏大。今晚先追求愿意靠近这件事。',
        steps: ['先不要求完成任务。', '只做原步骤里的第一个动作。', '孩子抗拒时停 30 秒，再给一个二选一。']
      },
      slow_but_started: {
        title: '今晚保留开始动作，减少催促',
        desc: '能开始就是有效信号。慢的时候先稳住节奏，再看能否多走一步。',
        steps: ['先重复昨晚的开始动作。', '中间只提醒一次下一步。', '完成一点就停下来记录反应。']
      },
      not_tried: {
        title: '今晚只安排一个最小开头',
        desc: '昨天没试也没关系，先把任务放到更容易发生的时间点。',
        steps: ['提前选好今晚要试的时间。', '只做第一步，不追完整结果。', '试完马上记录孩子的第一反应。']
      }
    };
    var suggestion = map[effectKey] || {
      title: '今晚继续观察一个小变化',
      desc: '先围绕' + sceneLabel + '保留一个可观察的小动作。',
      steps: ['重复昨晚最容易开始的一步。', '观察孩子是更愿意、还是更抗拒。', '记录一个最明显的变化。']
    };
    return {
      id: String((record && record.id) || 'core_action') + '_next_' + Date.now(),
      sourceRecordId: record && record.id ? record.id : '',
      sceneKey: record && record.sceneKey ? record.sceneKey : '',
      sceneLabel: sceneLabel,
      ageGroup: record && record.ageGroup ? record.ageGroup : '',
      ageSegmentKey: record && record.ageSegmentKey ? record.ageSegmentKey : '',
      ageSegmentLabel: record && record.ageSegmentLabel ? record.ageSegmentLabel : '',
      painPointKey: record && record.painPointKey ? record.painPointKey : '',
      painPointTitle: record && record.painPointTitle ? record.painPointTitle : '',
      focusAreas: record && record.focusAreas ? record.focusAreas : [],
      abilityTags: record && record.abilityTags ? record.abilityTags : [],
      observableSigns: record && record.observableSigns ? record.observableSigns : [],
      symptomKey: record && record.symptomKey ? record.symptomKey : '',
      symptomLabel: record && record.symptomLabel ? record.symptomLabel : '',
      bottleneckTitle: record && record.bottleneckTitle ? record.bottleneckTitle : '',
      bottleneckText: record && record.bottleneckText ? record.bottleneckText : '',
      actionTitle: suggestion.title || baseTitle,
      actionSteps: suggestion.steps || [],
      nextActionDesc: suggestion.desc || '',
      nextActions: configuredNextActions || {},
      sourceType: 'next_action_recommendation',
      createdAt: Date.now(),
      saved: false,
      completed: false
    };
  },

  trackCoreNextActionView: function(record, suggestion) {
    if (!record || !suggestion) {
      return;
    }
    this.trackCoreActionEvent('next_action_view', {
      sceneKey: record.sceneKey,
      ageGroup: record.ageGroup,
      ageSegmentKey: record.ageSegmentKey,
      painPointKey: record.painPointKey,
      abilityTags: record.abilityTags,
      symptomKey: record.symptomKey,
      resultId: record.id,
      event_meta: {
        action_id: record.id,
        effect_key: record.effectKey,
        next_action_title: suggestion.actionTitle
      }
    });
  },

  onSaveNextCoreActionTap: function() {
    var suggestion = this.data.coreRefactorState.nextActionSuggestion;
    if (!suggestion) {
      wx.showToast({ title: '下一步还没生成', icon: 'none' });
      return;
    }
    var saved = coreActionStorage.saveTonightAction(suggestion);
    if (!saved.success || !saved.record) {
      wx.showToast({ title: '没保存成功，请再试一次', icon: 'none' });
      return;
    }
    this.trackCoreActionEvent('tonight_action_save', {
      sceneKey: saved.record.sceneKey,
      ageGroup: saved.record.ageGroup,
      ageSegmentKey: saved.record.ageSegmentKey,
      painPointKey: saved.record.painPointKey,
      abilityTags: saved.record.abilityTags,
      symptomKey: saved.record.symptomKey,
      resultId: saved.record.id,
      event_meta: {
        action_id: saved.record.id,
        action_title: saved.record.actionTitle,
        source_type: saved.record.sourceType || 'next_action_recommendation'
      }
    });
    this.setData({
      recentCoreAction: saved.record,
      'coreRefactorState.nextActionSuggestion': saved.record,
      homePrimaryCard: this.buildHomePrimaryCard({
        recentAction: saved.record,
        retentionSummary: this.data.retentionSummary,
        continueTask: this.data.continueTask,
        continuousRecordCount: coreActionStorage.getContinuousRecordCount()
      })
    });
    this.applyCoreMembershipTouchpoint('tonight_action_save');
    wx.showToast({ title: '已保存为今晚小任务', icon: 'success' });
  },

  buildCoreGrowthRecordPayload: function(record) {
    var item = record || this.data.coreRefactorState.nextActionSuggestion || this.data.coreRefactorState.currentBottleneck || this.data.recentCoreAction;
    if (!item) {
      return null;
    }
    var effectLine = item.effectLabel ? ('效果记录：' + item.effectLabel) : '';
    var steps = Array.isArray(item.actionSteps) && item.actionSteps.length ? item.actionSteps.join('；') : '';
    var note = [
      '场景：' + (item.sceneLabel || '未填写'),
      '年龄：' + (item.ageGroup || '未确认'),
      '表现：' + (item.symptomLabel || '未填写'),
      '卡点判断：' + (item.bottleneckTitle || '未填写'),
      item.bottleneckText || '',
      '行动建议：' + (item.actionTitle || '未填写'),
      steps ? ('步骤：' + steps) : '',
      effectLine
    ].filter(Boolean).join('\n');
    return {
      note: note,
      source: {
        sourceType: 'core_action',
        sourceId: item.id || ('core_action_' + Date.now()),
        sceneKey: item.sceneKey || '',
        sceneLabel: item.sceneLabel || '',
        symptomKey: item.symptomKey || '',
        symptomLabel: item.symptomLabel || '',
        ageGroup: item.ageGroup || '',
        bottleneckTitle: item.bottleneckTitle || '',
        actionTitle: item.actionTitle || '今晚小任务',
        effectKey: item.effectKey || '',
        effectLabel: item.effectLabel || '',
        summary: note
      }
    };
  },

  onSaveCoreActionToGrowthRecordTap: function() {
    var payload = this.buildCoreGrowthRecordPayload();
    if (!payload) {
      wx.showToast({ title: '先生成一个判断结果', icon: 'none' });
      return;
    }
    wx.setStorageSync('pendingGrowthRecordNote', payload.note);
    wx.setStorageSync('pendingGrowthRecordSource', payload.source);
    wx.navigateTo({
      url: '/pages/growth-record/index?source=core_action',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToCoreChildProfile: function() {
    this.navigateByDailyPlan({ targetPath: '/pages/profile/child-edit/child-edit' });
  },

  onCoreToolTap: function(e) {
    var action = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.action : '';
    this.openCoreSupportAction(action);
  },

  onCoreResultSupportTap: function(e) {
    var action = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.action : '';
    var state = this.data.coreRefactorState || {};
    this.openCoreSupportAction(action, state.currentBottleneck || this.data.recentCoreAction || null);
  },

  openCoreSupportAction: function(action, context) {
    if (action === 'chat') {
      this.goToChat();
      return;
    }
    if (action === 'assessment') {
      this.goToAssessment();
      return;
    }
    if (action === 'parenting') {
      if (context && context.sceneKey) {
        this.goToParentingSearchWithCoreContext(context);
        return;
      }
      this.goToParenting();
      return;
    }
    if (action === 'growth_record') {
      this.goToGrowthRecord();
      return;
    }
    if (action === 'nutrition') {
      this.goToNutrition();
      return;
    }
    if (action === 'textbook') {
      this.goToTextbook();
      return;
    }
    if (action === 'weekly_report') {
      this.goToWeeklyReport();
      return;
    }
    if (action === 'membership') {
      this.goToMembership();
      return;
    }
    wx.showToast({ title: '入口暂未准备好', icon: 'none' });
  },

  goToParentingSearchWithCoreContext: function(context) {
    if (!this.ensureFeatureEnabled('sceneSearch', '场景搜索还在准备中')) {
      return;
    }
    var abilityTags = Array.isArray(context.abilityTags) ? context.abilityTags.join('、') : String(context.abilityTags || '');
    var query = [
      'sceneKey=' + encodeURIComponent(context.sceneKey || ''),
      'ageGroup=' + encodeURIComponent(context.ageGroup || ''),
      'ageSegmentKey=' + encodeURIComponent(context.ageSegmentKey || ''),
      'ageSegmentLabel=' + encodeURIComponent(context.ageSegmentLabel || ''),
      'painPointKey=' + encodeURIComponent(context.painPointKey || ''),
      'painPointTitle=' + encodeURIComponent(context.painPointTitle || ''),
      'abilityTags=' + encodeURIComponent(abilityTags),
      'bottleneckTitle=' + encodeURIComponent(context.bottleneckTitle || ''),
      'keyword=' + encodeURIComponent(context.painPointTitle || context.sceneLabel || context.bottleneckTitle || '')
    ].join('&');
    wx.navigateTo({
      url: '/pages/parenting/search/search?' + query,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
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
        this.refreshCoreActionHomeState();
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
        membershipTouchpointDesc: '当前展示为演示文案，真实会员状态和完整周总结以正式环境数据为准。',
        membershipTouchpointCta: '查看示例',
        membershipTouchpointEligible: true
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
        membershipTouchpointDesc: '登录并完成记录后，这里会展示本周趋势、提醒和陪伴建议。',
        membershipTouchpointCta: '登录后查看',
        membershipTouchpointEligible: true
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
        membershipTouchpointVisible: !(data && data.is_active),
        membershipTouchpointEligible: !(data && data.is_active)
      });
      if (!(data && data.is_active) && !that._membershipTouchpointExposed) {
        that._membershipTouchpointExposed = true;
        that.trackMembershipTouchpointEvent('membership_touchpoint_exposure', { mode: 'logged_in_preview' });
      }
    }).catch(function() {
      that.setData({ membershipTouchpointVisible: false, membershipTouchpointEligible: false });
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
        title: '继续追问细节',
        desc: '带着孩子的具体场景、卡点和今天行动，继续拆今晚怎么做。',
        cta: '追问做法',
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
      that.refreshCoreActionHomeState();
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
      that.refreshCoreActionHomeState();
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
      that.refreshCoreActionHomeState();
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
        that.refreshCoreActionHomeState();
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
      that.refreshCoreActionHomeState();
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
        that.refreshCoreActionHomeState();
        return;
      }
      that.setData({
        operationTouchpoint: Object.assign({}, that.data.operationTouchpoint, { key: '' }),
        retentionSummary: null,
        continueTask: null
      });
      that.refreshCoreActionHomeState();
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
      url: '/pages/development/index/index',
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
    this.prepareCoreWeeklySummaryDraft(currentChild);
    wx.navigateTo({
      url: '/pages/weekly-summary/index' + (currentChild && currentChild.id ? ('?childId=' + currentChild.id) : ''),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  prepareCoreWeeklySummaryDraft: function(currentChild) {
    var records = coreActionStorage.getCoreActionRecords().filter(function(item) {
      return item && item.sceneKey;
    }).slice(0, 7);
    if (!records.length) {
      return;
    }
    var completedRecords = records.filter(function(item) { return item.completed; });
    var latest = records[0] || {};
    var continuousCount = coreActionStorage.getContinuousRecordCount();
    var nextDraft = latest.sevenDayPlanDraft || [];
    var oldest = records[records.length - 1] || {};
    wx.setStorageSync('pendingCoreWeeklySummary', {
      source: 'core_action',
      childId: currentChild && currentChild.id ? Number(currentChild.id) : 0,
      childName: (currentChild && (currentChild.name || currentChild.nickname)) || '孩子',
      weekStart: oldest.createdAt || oldest.savedAt || oldest.recordedAt ? this.formatCoreActionDate(oldest.createdAt || oldest.savedAt || oldest.recordedAt) : this.formatCoreActionDate(Date.now()),
      weekEnd: this.formatCoreActionDate(Date.now()),
      recordDays: completedRecords.length,
      completedPlanCount: completedRecords.length,
      totalPlanCount: records.length,
      completedTaskCount: records.length,
      ageGroup: latest.ageGroup || '',
      overview: '这周主要围绕' + (latest.sceneLabel || '一个高频场景') + '做小步骤尝试，已经连续记录 ' + continuousCount + ' 次。',
      highlights: completedRecords.length ? completedRecords.map(function(item) {
        return (item.sceneLabel || '场景') + '：' + (item.effectLabel || '已记录一次反应');
      }).slice(0, 3) : ['已经开始把孩子的表现拆成具体卡点和今晚小步骤。'],
      concerns: ['继续观察孩子在' + (latest.sceneLabel || '这个场景') + '里是更愿意开始，还是仍然抗拒。'],
      nextActions: nextDraft.length ? nextDraft.slice(1, 4).map(function(item) {
        return item.title + '：' + item.desc;
      }) : ['下周继续保留一个小步骤，记录孩子最明显的变化。'],
      trendItems: completedRecords.map(function(item) {
        return {
          label: item.sceneLabel || '第一动作',
          direction: item.effectKey === 'started_smoothly' ? 'up' : (item.effectKey === 'still_resisted' ? 'down' : 'stable'),
          detail: (item.sceneLabel || '这个场景') + '记录为：' + (item.effectLabel || '已尝试')
        };
      }).slice(0, 4),
      premiumUnlocked: false,
      premiumTip: '开通后可以把连续 7 天的小步骤和效果变化整理成更完整的周总结。'
    });
  },

  formatCoreActionDate: function(timestamp) {
    var date = new Date(Number(timestamp) || Date.now());
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + '-' + (month < 10 ? '0' + month : month) + '-' + (day < 10 ? '0' + day : day);
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

