var app = getApp();
var crossPageStorage = require('../../utils/cross-page-storage.js');
var growthShare = require('../../utils/growth-share.js');

Page({
  data: {
    currentChild: null,
    childId: 0,
    loading: false,
    summary: null,
    errorMessage: '',
    loginRequired: false
  },

  getDimensionLabel: function(key) {
    var map = {
      moodStatus: '情绪状态',
      appetiteStatus: '进食状态',
      sleepStatus: '睡眠状态',
      exerciseStatus: '活动状态',
      socialStatus: '社交状态',
      habitConsistency: '习惯稳定度',
      socialEngagement: '社交参与',
      learningInitiative: '学习主动性',
      nutritionBalance: '营养均衡'
    };
    return map[key] || key || '成长维度';
  },

  normalizeDimensionScore: function(rawScore) {
    var score = Number(rawScore);
    if (isNaN(score)) {
      return 0;
    }
    if (score > 0 && score <= 4) {
      return Math.round(score / 4 * 100);
    }
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  normalizeDimensionScores: function(dimensionScores) {
    var list = [];
    var source = dimensionScores || {};
    for (var key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) {
        continue;
      }
      var score = this.normalizeDimensionScore(source[key]);
      list.push({
        key: key,
        label: this.getDimensionLabel(key),
        score: score,
        scoreText: score + '分'
      });
    }
    list.sort(function(a, b) {
      return a.score - b.score;
    });
    return list;
  },

  normalizeSummaryForDisplay: function(summary) {
    summary = summary || null;
    if (!summary) {
      return null;
    }
    var dimensionScoreList = this.normalizeDimensionScores(summary.dimensionScores);
    return Object.assign({}, summary, {
      highlights: Array.isArray(summary.highlights) ? summary.highlights : [],
      concerns: Array.isArray(summary.concerns) ? summary.concerns : [],
      nextActions: Array.isArray(summary.nextActions) ? summary.nextActions : [],
      trendItems: Array.isArray(summary.trendItems) ? summary.trendItems : [],
      recommendedContent: Array.isArray(summary.recommendedContent) ? summary.recommendedContent : [],
      developmentZoneSummary: summary.developmentZoneSummary || {
        totalCount: 0,
        primaryZoneTitle: '',
        zones: [],
        recentPractices: []
      },
      childName: summary.childName || (this.data.currentChild && (this.data.currentChild.name || this.data.currentChild.nickname)) || '孩子',
      overview: summary.overview || '这周的记录已经整理好，可以先看变化，再定下周一步。',
      recordDays: Number(summary.recordDays || 0),
      completedPlanCount: Number(summary.completedPlanCount || 0),
      totalPlanCount: Number(summary.totalPlanCount || 0),
      completedTaskCount: Number(summary.completedTaskCount || 0),
      feedbackCount: Number(summary.feedbackCount || 0),
      feedbackTrend: Array.isArray(summary.feedbackTrend) ? summary.feedbackTrend : [],
      observationCount: Number(summary.observationCount || 0),
      dataStatus: summary.dataStatus || 'insufficient_data',
      generationVersion: Number(summary.generationVersion || 1),
      updatedAt: summary.updatedAt || '',
      premiumUnlocked: !!summary.premiumUnlocked,
      premiumTip: summary.premiumTip || '开通后可以看到更细的变化趋势和下周陪娃建议。',
      ageGroup: summary.ageGroup || '',
      weakestDimensionLabel: summary.weakestDimensionLabel || (dimensionScoreList[0] ? dimensionScoreList[0].label : ''),
      dimensionScoreList: dimensionScoreList
    });
  },

  getPendingCoreWeeklySummary: function(options) {
    var opts = options || {};
    try {
      var envelope = crossPageStorage.read('pendingCoreWeeklySummary', this.data.childId);
      var pending = envelope ? envelope.payload : null;
      if (!pending || pending.source !== 'core_action') {
        return null;
      }
      if (pending.childId && this.data.childId && Number(pending.childId) !== Number(this.data.childId)) {
        return null;
      }
      if (opts.consume) {
        crossPageStorage.consume('pendingCoreWeeklySummary', this.data.childId);
      }
      return pending;
    } catch (err) {
      return null;
    }
  },

  clearPendingCoreWeeklySummary: function() {
    this.getPendingCoreWeeklySummary({ consume: true });
  },

  applySummary: function(rawSummary, source) {
    var summary = this.normalizeSummaryForDisplay(rawSummary);
    this.setData({
      summary: summary,
      currentChild: this.data.currentChild || (summary ? { id: this.data.childId, name: summary.childName || '' } : null)
    });
    if (summary && app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_view',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: {
          source: source || 'api',
           premium_unlocked: !!summary.premiumUnlocked,
           record_days: Number(summary.recordDays || 0),
           data_status: summary.dataStatus || 'insufficient_data',
           generation_version: Number(summary.generationVersion || 1)
        }
      });
    }
  },

  onLoad: function(options) {
    this.bootstrap(options);
  },

  onUnload: function() {
    this._summaryRequestId = (this._summaryRequestId || 0) + 1;
  },

  onShow: function() {
    if (!this._hasShown) {
      this._hasShown = true;
      return;
    }
    var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : null);
    var childId = Number((child && child.id) || 0);
    this.setData({ childId: childId, currentChild: child || null, summary: null, errorMessage: '' });
    this.bootstrap({ childId: childId });
  },

  bootstrap: function(options) {
    this._summaryRequestId = (this._summaryRequestId || 0) + 1;
    if (!wx.getStorageSync('token')) {
      this.setData({ currentChild: null, childId: 0, loading: false, summary: null, errorMessage: '', loginRequired: true });
      return;
    }
    var childId = Number((options && options.childId) || this.data.childId || 0);
    var child = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : app.normalizeChild(wx.getStorageSync('currentChild') || null));
    if (!childId && child && child.id) {
      childId = Number(child.id || 0);
    }
    if (!childId) {
      this.setData({
        currentChild: null,
        childId: 0,
        loading: false,
        summary: null,
        loginRequired: false
      });
      if (app.ensureCurrentChild) {
        app.ensureCurrentChild().then(function(nextChild) {
          if (nextChild && nextChild.id) {
            this.bootstrap(options);
          }
        }.bind(this)).catch(function() {
          return null;
        });
      }
      return;
    }
    this.setData({
      childId: childId,
      currentChild: child && Number(child.id || 0) === childId ? child : null,
      loginRequired: false
    });
    this.loadSummary();
  },

  loadSummary: function() {
    var that = this;
    if (!this.data.childId) {
      return;
    }
    var requestId = (this._summaryRequestId || 0) + 1;
    this._summaryRequestId = requestId;
    this.setData({ loading: true });
    this.setData({ errorMessage: '' });
    app.request({
      url: '/weekly-summary',
      method: 'GET',
      data: { childId: this.data.childId }
    }).then(function(data) {
      if (requestId !== that._summaryRequestId) return;
      if (data) {
        that.clearPendingCoreWeeklySummary();
        that.applySummary(data, 'api');
        if (app.trackKbEvent) {
          app.trackKbEvent({
            event_type: 'stage_report_generated',
            module_key: 'weekly_summary',
            page_key: 'weekly_summary_index',
            child_id: that.data.childId,
            event_meta: { status: 'success', data_status: data.dataStatus || 'unknown' }
          });
        }
        return;
      }
      that.applySummary(that.getPendingCoreWeeklySummary({ consume: true }), 'core_action_fallback');
    }).catch(function(err) {
      if (requestId !== that._summaryRequestId) return;
      var fallback = that.getPendingCoreWeeklySummary({ consume: true });
      if (fallback) {
        that.applySummary(fallback, 'core_action_fallback');
        return;
      }
      that.setData({
        summary: null,
        errorMessage: app.getApiErrorMessage(err, '每周总结没加载出来')
      });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'stage_report_generation_failed',
          module_key: 'weekly_summary',
          page_key: 'weekly_summary_index',
          child_id: that.data.childId,
          event_meta: { message: String(err && err.message || 'request_failed').slice(0, 100) }
        });
      }
    }).finally(function() {
      if (requestId === that._summaryRequestId) that.setData({ loading: false });
    });
  },

  onOpenContent: function(e) {
    var targetPath = e.currentTarget.dataset.targetPath;
    if (!targetPath) {
      return;
    }
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_action_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { action: 'open_content', target_path: targetPath }
      });
    }
    wx.navigateTo({ url: targetPath });
  },

  onOpenDimension: function(e) {
    var dimensionKey = e.currentTarget.dataset.dimensionKey || '';
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_dimension_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { dimension_key: dimensionKey }
      });
    }
    wx.switchTab({
      url: '/pages/growth-record/index',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToMembership: function() {
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_action_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { action: 'open_membership' }
      });
      app.trackKbEvent({
        event_type: 'stage_report_membership_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { premium_unlocked: !!(this.data.summary && this.data.summary.premiumUnlocked) }
      });
    }
    wx.navigateTo({ url: app.buildMembershipEntryUrl ? app.buildMembershipEntryUrl('stage_report', { childId: this.data.childId, reportId: this.data.summary && this.data.summary.weekStart }) : '/pages/membership/index' });
  },

  goToHistory: function() {
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'stage_report_complete_read',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { action: 'open_history' }
      });
    }
    wx.navigateTo({ url: '/pages/weekly-summary/history/index?childId=' + this.data.childId });
  },

  onShareAppMessage: function() {
    var summary = this.data.summary || {};
    growthShare.saveGrowthShareDraft(crossPageStorage, {
      type: 'stage_report',
      source: 'stage_report',
      childId: this.data.childId,
      title: '阶段成长报告',
      metrics: { completed: summary.completedTaskCount || 0, total: summary.totalPlanCount || 0, streakDays: summary.recordDays || 0 },
      overview: summary.overview || ''
    });
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'stage_report_share',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { premium_unlocked: !!(this.data.summary && this.data.summary.premiumUnlocked), share_type: 'stage_report' }
      });
    }
    return {
      title: (this.data.summary && this.data.summary.overview) || '看看孩子这周的成长记录',
      path: '/pages/share/preview/preview?shareType=stage_report',
      imageUrl: '/images/default-article.png'
    };
  },

  goToChildSetup: function() {
    app.requireLoginForAction('请先完成微信登录，再添加孩子档案').then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      wx.navigateTo({ url: '/pages/profile/child-edit/child-edit' });
    });
  },

  loginAndReload: function() {
    var that = this;
    app.requireLoginForAction('请先完成微信登录，再查看成长总结').then(function(canOperate) {
      if (canOperate) that.bootstrap();
    });
  },

  retryLoadSummary: function() {
    this.loadSummary();
  },

  goToGrowthRecord: function() {
    wx.switchTab({ url: '/pages/growth-record/index' });
  },

  goHome: function() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
