// 成长观察页面逻辑
var app = getApp();
var assessmentUtils = require('../../utils/assessment.js');
var getAssessmentMetaList = assessmentUtils.getAssessmentMetaList;
var getChildAgeYears = assessmentUtils.getChildAgeYears;
var getDefaultAgeGroup = assessmentUtils.getDefaultAgeGroup;
var normalizeAssessmentCode = assessmentUtils.normalizeAssessmentCode;

Page({
  data: {
    // 观察工具列表
    assessmentList: getAssessmentMetaList().map(function(item, index) {
      return Object.assign({ id: index + 1 }, item);
    }),
    filteredAssessmentList: [],
    ageOptions: [
      { label: '0-1岁', value: '0-1岁' },
      { label: '1-2岁', value: '1-2岁' },
      { label: '2-3岁', value: '2-3岁' },
      { label: '3-4岁', value: '3-4岁' },
      { label: '4-5岁', value: '4-5岁' },
      { label: '5-6岁', value: '5-6岁' },
      { label: '6-9岁', value: '6-9岁' },
      { label: '9-12岁', value: '9-12岁' }
    ],
    selectedAgeGroup: '0-1岁',

    // 当前孩子信息
    currentChild: null,

    // 弹窗相关
    showIntroModal: false,
    currentAssessment: null,

    // 历史记录数量
    historyCount: 0,

    // 加载状态
    loading: false,
    loadError: ''
  },

  onLoad: function() {
    this.bootstrap();
  },

  onShow: function() {
    this.bootstrap();
  },

  bootstrap: function() {
    var that = this;
    that.loadCurrentChild();
    that.applyAgeFilter();
    that.loadAssessmentListFromServer();
    that.loadHistoryCount();
    that.checkPendingProgress();

    if (app.ensureCurrentChild) {
      app.ensureCurrentChild().then(function(child) {
        if (child && child.id) {
          that.loadCurrentChild();
          that.loadHistoryCount();
        }
      }).catch(function() {
        return null;
      });
    }
  },

  // 加载当前孩子信息
  loadCurrentChild: function() {
    var currentChild = app.getCurrentChild();
    var selectedAgeGroup = this.data.selectedAgeGroup;
    if (currentChild) {
      selectedAgeGroup = this.getDefaultAgeGroup(currentChild);
      this.setData({
        currentChild: currentChild,
        selectedAgeGroup: selectedAgeGroup
      });
    }
    this.applyAgeFilter();
  },

  getChildAge: function(child) {
    return getChildAgeYears(child, 3);
  },

  getDefaultAgeGroup: function(child) {
    return getDefaultAgeGroup(child || {}, '3-4岁');
  },

  getAgeBounds: function(ageGroup) {
    return assessmentUtils.getAgeBounds(ageGroup);
  },

  ageGroupMatches: function(assessmentAgeGroup, selectedAgeGroup) {
    return assessmentUtils.ageGroupMatches(assessmentAgeGroup, selectedAgeGroup);
  },

  getAssessmentRequestAgeGroup: function(assessment) {
    var selectedAgeGroup = this.data.selectedAgeGroup;
    var groups = (assessment && (assessment.ageGroups || assessment.age_groups)) || [];
    if (!groups.length) {
      return selectedAgeGroup;
    }
    if (groups.indexOf(selectedAgeGroup) >= 0) {
      return selectedAgeGroup;
    }
    for (var i = 0; i < groups.length; i++) {
      if (this.ageGroupMatches(groups[i], selectedAgeGroup)) {
        return groups[i];
      }
    }
    return groups[0] || selectedAgeGroup;
  },

  normalizeServerAssessment: function(item, index) {
    var code = normalizeAssessmentCode(item.type || item.code || item.assessment_type || '');
    var local = this.data.assessmentList.find(function(entry) {
      return entry.code === code;
    }) || {};
    return {
      id: local.id || index + 1,
      code: code,
      icon: item.icon || local.icon || '📋',
      name: item.name || local.name || '观察工具',
      desc: item.description || item.desc || local.desc || '',
      count: item.total_questions || item.count || local.count || 0,
      duration: item.duration || local.duration || 10,
      ageGroups: item.age_groups || item.ageGroups || local.ageGroups || []
    };
  },

  loadAssessmentListFromServer: function() {
    var that = this;
    that.setData({
      loading: false,
      loadError: ''
    });
    that.applyAgeFilter();
    return Promise.resolve();
  },

  retryLoadAssessmentList: function() {
    this.loadAssessmentListFromServer();
  },

  applyAgeFilter: function() {
    var that = this;
    var selectedAgeGroup = that.data.selectedAgeGroup;
    var filtered = (that.data.assessmentList || []).filter(function(item) {
      var groups = item.ageGroups || item.age_groups || [];
      if (!groups.length) {
        return true;
      }
      return groups.some(function(group) {
        return that.ageGroupMatches(group, selectedAgeGroup);
      });
    });

    that.setData({
      filteredAssessmentList: filtered
    });
  },

  onAgeFilterTap: function(e) {
    var ageGroup = e.currentTarget.dataset.age;
    if (!ageGroup || ageGroup === this.data.selectedAgeGroup) {
      return;
    }
    this.setData({
      selectedAgeGroup: ageGroup
    });
    this.applyAgeFilter();
  },

  // 加载历史记录数量
  loadHistoryCount: function() {
    var that = this;
    var records = wx.getStorageSync('assessmentRecords') || wx.getStorageSync('assessmentHistory') || [];

    // 筛选当前孩子的记录
    var currentChild = that.data.currentChild;
    if (currentChild) {
      records = records.filter(function(r) {
        return r.childId === currentChild.id;
      });
    }

    that.setData({
      historyCount: records.length
    });

    return Promise.resolve(records.length);
  },

  // 检查是否有未完成的答题进度
  checkPendingProgress: function() {
    var that = this;
    var progress = wx.getStorageSync('assessmentProgress');

    if (progress && progress.answers && progress.answers.length > 0) {
      var assessment = that.data.assessmentList.find(function(item) {
          return item.code === normalizeAssessmentCode(progress.assessmentCode);
      });

      if (assessment) {
        wx.showModal({
          title: '继续答题',
          content: '您有一份未完成的' + assessment.name + '，是否继续？',
          confirmText: '继续',
          cancelText: '重新开始',
          success: function(res) {
            if (res.confirm) {
              // 继续答题
              wx.navigateTo({
                url: '/pages/assessment/do/do?code=' + progress.assessmentCode + '&continue=1',
                fail: function() {
                  wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
                }
              });
            } else {
              // 清除进度
              wx.removeStorageSync('assessmentProgress');
            }
          }
        });
      }
    }
  },

  // 点击观察卡片
  onAssessmentTap: function(e) {
    var that = this;
    var code = e.currentTarget.dataset.code;
    var assessment = that.data.assessmentList.find(function(item) {
      return item.code === code;
    });

    if (!assessment) {
      wx.showToast({
        title: '这个观察项没找到',
        icon: 'none'
      });
      return;
    }

    // 检查是否有当前孩子
    if (!that.data.currentChild) {
      wx.showModal({
        title: '提示',
        content: '请先添加孩子档案',
        confirmText: '去添加',
        success: function(res) {
          if (res.confirm) {
            app.requireLoginForAction('请先完成微信登录，再添加孩子档案').then(function(canOperate) {
              if (!canOperate) {
                return;
              }
              wx.navigateTo({
                url: '/pages/profile/child-edit/child-edit',
                fail: function() {
                  wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
                }
              });
            });
          }
        }
      });
      return;
    }

    // 显示说明弹窗
    that.setData({
      currentAssessment: assessment,
      showIntroModal: true
    });
  },

  // 关闭弹窗
  closeModal: function() {
    this.setData({
      showIntroModal: false,
      currentAssessment: null
    });
  },

  // 阻止弹窗内容点击事件冒泡
  preventBubble: function() {
    // 空函数，阻止事件冒泡
  },

  // 开始作答
  startAssessment: function() {
    var that = this;
    var assessment = that.data.currentAssessment;

    if (!assessment) {
      return;
    }

    that.closeModal();

    // 跳转到答题页面
    var requestAgeGroup = that.getAssessmentRequestAgeGroup(assessment);
    wx.navigateTo({
      url: '/pages/assessment/do/do?code=' + assessment.code + '&ageGroup=' + encodeURIComponent(requestAgeGroup),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 查看成长记录
  goToHistory: function() {
    wx.navigateTo({
      url: '/pages/assessment/history/history',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    var tasks = [
      that.loadAssessmentListFromServer(),
      that.loadHistoryCount()
    ].map(function(task) {
      return Promise.resolve(task).catch(function() {
        return null;
      });
    });
    Promise.all(tasks).finally(function() {
      that.checkPendingProgress();
      wx.stopPullDownRefresh();
    });
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: app.buildShareTitle('assessment'),
      path: '/pages/assessment/assessment'
    };
  }
});
