var app = getApp();

Page({
  data: {
    currentChild: null,
    childId: 0,
    loading: false,
    summary: null
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
      recommendedContent: Array.isArray(summary.recommendedContent) ? summary.recommendedContent : [],
      developmentZoneSummary: summary.developmentZoneSummary || {
        totalCount: 0,
        primaryZoneTitle: '',
        zones: [],
        recentPractices: []
      },
      ageGroup: summary.ageGroup || '',
      weakestDimensionLabel: summary.weakestDimensionLabel || (dimensionScoreList[0] ? dimensionScoreList[0].label : ''),
      dimensionScoreList: dimensionScoreList
    });
  },

  onLoad: function(options) {
    this.bootstrap(options);
  },

  onShow: function() {
    this.bootstrap();
  },

  bootstrap: function(options) {
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
        summary: null
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
      currentChild: child && Number(child.id || 0) === childId ? child : this.data.currentChild
    });
    this.loadSummary();
  },

  loadSummary: function() {
    var that = this;
    if (!this.data.childId) {
      return;
    }
    this.setData({ loading: true });
    app.request({
      url: '/weekly-summary',
      method: 'GET',
      data: { childId: this.data.childId }
    }).then(function(data) {
      var summary = that.normalizeSummaryForDisplay(data);
      that.setData({
        summary: summary,
        currentChild: that.data.currentChild || (summary ? { id: that.data.childId, name: summary.childName || '' } : null)
      });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'weekly_summary_view',
          module_key: 'weekly_summary',
          page_key: 'weekly_summary_index',
          child_id: that.data.childId,
          event_meta: {
            premium_unlocked: !!(summary && summary.premiumUnlocked),
            record_days: Number((summary && summary.recordDays) || 0)
          }
        });
      }
    }).catch(function(err) {
      wx.showToast({ title: app.getApiErrorMessage(err, '每周总结没加载出来'), icon: 'none' });
    }).finally(function() {
      that.setData({ loading: false });
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

  goToMembership: function() {
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_action_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { action: 'open_membership' }
      });
    }
    wx.navigateTo({ url: '/pages/membership/index' });
  },

  goToChildSetup: function() {
    app.requireLoginForAction('请先完成微信登录，再添加孩子档案').then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      wx.navigateTo({ url: '/pages/profile/child-edit/child-edit' });
    });
  }
});
