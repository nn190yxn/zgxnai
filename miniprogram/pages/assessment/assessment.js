// 成长观察页面逻辑
var app = getApp();
var assessmentUtils = require('../../utils/assessment.js');
var normalizeAssessmentCode = assessmentUtils.normalizeAssessmentCode;

Page({
  data: {
    // 观察工具列表
    assessmentList: [
      {
        id: 1,
        code: 'sensory',
        icon: '🧠',
        name: '儿童感觉统合能力发展评定量表',
        desc: '58题评估前庭、触觉、本体感和学习相关表现',
        count: 58,
        duration: 15,
        ageGroups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 2,
        code: 'focus',
        icon: '💡',
        name: '专注力观察',
        desc: '了解孩子注意力集中、持续和抗干扰表现',
        count: 25,
        duration: 12,
        ageGroups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 3,
        code: 'adhd',
        icon: '📝',
        name: 'ADHD风险观察筛查',
        desc: '观察注意力、多动和冲动相关表现，仅作风险提示',
        count: 18,
        duration: 10,
        ageGroups: ['4-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 4,
        code: 'multi_intelligence',
        icon: '🎨',
        name: '多元智能观察',
        desc: '发现孩子优势智能领域',
        count: 40,
        duration: 20,
        ageGroups: ['3-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 5,
        code: 'emotion',
        icon: '🤗',
        name: '情绪能力观察',
        desc: '了解孩子情绪识别、表达和调节表现',
        count: 22,
        duration: 12,
        ageGroups: ['3-6岁', '6-9岁', '9-12岁']
      },
      {
        id: 6,
        code: 'learning',
        icon: '📚',
        name: '学习适应观察',
        desc: '了解孩子学习适应与准备情况',
        count: 35,
        duration: 18,
        ageGroups: ['6-9岁', '9-12岁']
      }
    ],
    filteredAssessmentList: [],
    ageOptions: [
      { label: '3-4岁', value: '3-4岁' },
      { label: '4-5岁', value: '4-5岁' },
      { label: '5-6岁', value: '5-6岁' },
      { label: '6-9岁', value: '6-9岁' },
      { label: '9-12岁', value: '9-12岁' }
    ],
    selectedAgeGroup: '3-4岁',
    
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
    this.loadCurrentChild();
    this.applyAgeFilter();
    this.loadAssessmentListFromServer();
    this.loadHistoryCount();
    this.checkPendingProgress();
  },

  onShow: function() {
    // 每次显示页面时刷新数据
    this.loadCurrentChild();
    this.loadHistoryCount();
    this.checkPendingProgress();
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
    if (typeof child.age === 'number' && child.age >= 0) {
      return child.age;
    }

    var birthDate = child.birth_date || child.birthday;
    if (!birthDate) {
      return 3;
    }

    var birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return 3;
    }

    var today = new Date();
    var age = today.getFullYear() - birth.getFullYear();
    var monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age > 0 ? age : 3;
  },

  getDefaultAgeGroup: function(child) {
    var age = this.getChildAge(child || {});
    if (age < 4) return '3-4岁';
    if (age < 5) return '4-5岁';
    if (age < 6) return '5-6岁';
    if (age < 9) return '6-9岁';
    return '9-12岁';
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
      loading: true,
      loadError: ''
    });

    if (app.shouldUseMockFallback()) {
      that.applyAgeFilter();
      that.setData({
        loading: false,
        loadError: ''
      });
      return Promise.resolve();
    }

    return app.request({
      url: '/assessments',
      method: 'GET'
    }).then(function(res) {
      if (!Array.isArray(res) || res.length === 0) {
        return;
      }
      var serverList = res.map(function(item, index) {
        return that.normalizeServerAssessment(item, index);
      }).filter(function(item) {
        return !!item.code;
      });
      if (serverList.length > 0) {
        that.setData({
          assessmentList: serverList,
          loadError: ''
        });
        that.applyAgeFilter();
      }
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        that.setData({
          loadError: app.getApiErrorMessage(err, '成长观察列表加载失败')
        });
      }
      that.applyAgeFilter();
    }).finally(function() {
      that.setData({
        loading: false
      });
    });
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
    
    // 尝试从服务器获取
    that.loadHistoryFromServer();
  },

  // 从服务器加载历史记录
  loadHistoryFromServer: function() {
    var that = this;
    if (app.shouldUseMockFallback()) {
      return Promise.resolve();
    }
    // 仅在已登录时请求服务器，避免未登录时无意义的请求超时
    if (!app.globalData.isLoggedIn) {
      return Promise.resolve();
    }
    return app.request({
      url: '/assessments/history/count',
      method: 'GET'
    }).then(function(res) {
      if (res && res.count !== undefined) {
      that.setData({
        historyCount: res.count
      });
    } else if (res && res.length !== undefined) {
      that.setData({
        historyCount: res.length
      });
      }
    }).catch(function(err) {
      // 使用本地缓存数据，静默处理
    });
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
                  wx.showToast({ title: '页面跳转失败', icon: 'none' });
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
        title: '项目不存在',
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
            wx.navigateTo({
              url: '/pages/profile/child-edit/child-edit',
              fail: function() {
                wx.showToast({ title: '页面跳转失败', icon: 'none' });
              }
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
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看成长记录
  goToHistory: function() {
    wx.navigateTo({
      url: '/pages/assessment/history/history',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    var tasks = [
      that.loadAssessmentListFromServer(),
      that.loadHistoryCount()
    ];
    Promise.allSettled(tasks).finally(function() {
      that.checkPendingProgress();
      wx.stopPullDownRefresh();
    });
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '小牛育儿成长观察 - 看懂孩子近期表现',
      path: '/pages/assessment/assessment'
    };
  }
});
