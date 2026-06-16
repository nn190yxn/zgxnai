// 成长观察历史记录页面
var app = getApp();
var assessmentUtils = require('../../../utils/assessment.js');
var getAssessmentMeta = assessmentUtils.getAssessmentMeta;
var getAssessmentMetaList = assessmentUtils.getAssessmentMetaList;
var normalizeAssessmentCode = assessmentUtils.normalizeAssessmentCode;

function getAssessmentRecordsStorage() {
  return wx.getStorageSync('assessmentRecords') || wx.getStorageSync('assessmentHistory') || [];
}

Page({
  data: {
    // 记录列表
    records: [],
    
    // 筛选条件
    filterType: 'all', // all, sensory, focus, adhd, multi_intelligence, emotion, learning
    filterChild: 'all',
    
    // 孩子列表
    childrenList: [],
    
    // 类型列表
    assessmentTypes: [{ code: 'all', name: '全部类型' }].concat(getAssessmentMetaList().map(function(item) {
      return { code: item.code, name: item.shortName || item.name };
    })),
    
    // 显示筛选弹窗
    showFilterModal: false,
    
    // 成长趋势数据
    trendData: [],
    showTrend: false,
    
    // 加载状态
    loading: true,
    
    // 是否有更多数据
    hasMore: true,
    
    // 分页
    page: 1,
    pageSize: 20
  },

  onLoad: function() {
    var that = this;
    that.loadChildrenList();
    that.loadRecords();
  },

  onShow: function() {
    var that = this;
    // 每次显示时刷新数据
    that.loadRecords();
  },

  // 加载孩子列表
  loadChildrenList: function() {
    var that = this;
    var childrenList = app.globalData.childrenList || [];
    
    that.setData({
      childrenList: childrenList
    });
  },

  // 加载记录
  loadRecords: function(fromPullDown) {
    var that = this;
    
    // 先从本地加载
    var localRecords = getAssessmentRecordsStorage();
    
    // 应用筛选
    var filteredRecords = that.applyFilters(localRecords);
    
    that.setData({
      records: filteredRecords,
      loading: false,
      hasMore: false
    });
    
    // 尝试从服务器加载
    return that.loadRecordsFromServer(fromPullDown);
  },

  // 从服务器加载记录
  loadRecordsFromServer: function(fromPullDown) {
    var that = this;

    if (app.shouldUseMockFallback()) {
      return Promise.resolve();
    }
    
    return app.request({
      url: '/assessments/history',
      method: 'GET',
      data: {
        limit: that.data.pageSize
      }
    }).then(function(res) {
      if (res && res.length !== undefined) {
        // 合并本地和服务器数据
        var localRecords = getAssessmentRecordsStorage();
        var serverRecords = that.normalizeServerRecords(res);
        
        // 合并并去重
        var allRecords = that.mergeRecords(localRecords, serverRecords);
        
        // 应用筛选
        var filteredRecords = that.applyFilters(allRecords);
        
        that.setData({
          records: filteredRecords,
          hasMore: false
        });
        
        // 更新本地存储
        wx.setStorageSync('assessmentRecords', allRecords.slice(0, 50));
        wx.setStorageSync('assessmentHistory', allRecords.slice(0, 50));
      }
    }).catch(function(err) {
      // 使用本地数据
    });
  },

  normalizeServerRecords: function(records) {
    var normalized = [];
    for (var i = 0; i < records.length; i++) {
      var item = records[i] || {};
      var totalScore = Number(item.overall_score);
      if (isNaN(totalScore)) {
        totalScore = 0;
      }
      var maxScore = Number(item.max_score);
      if (isNaN(maxScore) || maxScore <= 0) {
        var dimensions = Array.isArray(item.dimension_scores) ? item.dimension_scores : [];
        maxScore = normalizeAssessmentCode(item.assessment_type) === 'sensory' ? 50 : Math.max(3, dimensions.length * 3);
      }
      var percentage = Number(item.percentage);
      if (isNaN(percentage)) {
        percentage = Math.round((totalScore / maxScore) * 100);
      }
      normalized.push({
        recordId: item.id,
        assessmentCode: normalizeAssessmentCode(item.assessment_type),
        childId: item.child_id,
        totalScore: totalScore,
        percentage: percentage,
        level: this.normalizeLevel(item.overall_level),
        completedAt: item.completed_at,
        completed_at: item.completed_at,
        assessmentName: item.assessment_name || this.getAssessmentName(item.assessment_type),
        childName: item.child_name || '',
        dimensions: item.dimension_scores || [],
        reportData: item.report_data || {},
        completedAtStr: this.formatDate(item.completed_at)
      });
    }
    return normalized;
  },

  normalizeLevel: function(level) {
    if (level === 'excellent') return '优秀';
    if (level === 'good') return '良好';
    if (level === 'medium') return '正常';
    if (level === 'attention') return '轻度失调';
    if (level === 'intervention') return '中度失调';
    if (level === '中等') return '正常';
    if (level === '需关注') return '轻度失调';
    if (level === '需干预') return '中度失调';
    return level || '';
  },

  // 合并记录
  mergeRecords: function(localRecords, serverRecords) {
    var merged = localRecords.slice();
    
    for (var i = 0; i < serverRecords.length; i++) {
      var serverRecord = serverRecords[i];
      var exists = merged.find(function(r) {
        return r.recordId === serverRecord.recordId;
      });
      
      if (!exists) {
        merged.push(serverRecord);
      }
    }
    
    // 按时间排序
    merged.sort(function(a, b) {
      var timeA = a && a.completedAt ? new Date(a.completedAt).getTime() : 0;
      var timeB = b && b.completedAt ? new Date(b.completedAt).getTime() : 0;
      if (isNaN(timeA)) timeA = 0;
      if (isNaN(timeB)) timeB = 0;
      return timeB - timeA;
    });
    
    return merged;
  },

  // 应用筛选
  applyFilters: function(records) {
    var that = this;
    var filterType = that.data.filterType;
    var filterChild = that.data.filterChild;
    
    var filtered = records.filter(function(record) {
      var typeMatch = filterType === 'all' || record.assessmentCode === filterType;
      var childMatch = filterChild === 'all' || record.childId === filterChild;
      return typeMatch && childMatch;
    });
    
    return filtered;
  },

  // 显示筛选弹窗
  showFilter: function() {
    this.setData({
      showFilterModal: true
    });
  },

  // 关闭筛选弹窗
  hideFilter: function() {
    this.setData({
      showFilterModal: false
    });
  },

  // 阻止冒泡
  preventBubble: function() {},

  // 选择类型
  selectType: function(e) {
    var that = this;
    var code = e.currentTarget.dataset.code;
    
    that.setData({
      filterType: code
    });
    
    that.applyAndRefresh();
  },

  // 选择孩子
  selectChild: function(e) {
    var that = this;
    var childId = e.currentTarget.dataset.id;
    
    that.setData({
      filterChild: childId
    });
    
    that.applyAndRefresh();
  },

  // 应用筛选并刷新
  applyAndRefresh: function() {
    var that = this;
    var localRecords = wx.getStorageSync('assessmentRecords') || wx.getStorageSync('assessmentHistory') || [];
    var filteredRecords = that.applyFilters(localRecords);
    
    that.setData({
      records: filteredRecords
    });
    
    that.hideFilter();
  },

  // 重置筛选
  resetFilter: function() {
    var that = this;
    
    that.setData({
      filterType: 'all',
      filterChild: 'all'
    });
    
    that.applyAndRefresh();
  },

  // 查看记录详情
  viewRecord: function(e) {
    var recordId = e.currentTarget.dataset.id;
    
    wx.navigateTo({
      url: '/pages/assessment/result/result?recordId=' + recordId,
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 删除记录
  deleteRecord: function(e) {
    var that = this;
    var recordId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条记录吗？',
      confirmText: '删除',
      confirmColor: '#D32F2F',
      success: function(res) {
        if (res.confirm) {
          that.doDeleteRecord(recordId);
        }
      }
    });
  },

  // 执行删除
  doDeleteRecord: function(recordId) {
    var that = this;
    var records = that.data.records.filter(function(r) {
      return r.recordId !== recordId;
    });
    
    that.setData({
      records: records
    });
    
    // 更新本地存储
    wx.setStorageSync('assessmentRecords', records);
    wx.setStorageSync('assessmentHistory', records);
    
    // 尝试从服务器删除
    app.request({
      url: '/assessments/records/' + recordId,
      method: 'DELETE'
    }).then(function(res) {
      // 服务器删除成功
    }).catch(function(err) {
      // 服务器删除失败，已保存到本地
    });
    
    wx.showToast({
      title: '已删除',
      icon: 'success'
    });
  },

  // 显示成长趋势
  showTrendChart: function() {
    var that = this;
    var records = that.data.records;
    
    if (records.length < 2) {
      wx.showToast({
        title: '至少需要2条记录',
        icon: 'none'
      });
      return;
    }
    
    // 按类型分组
    var groupedRecords = {};
    for (var i = 0; i < records.length; i++) {
      var record = records[i];
      var code = record.assessmentCode;
      if (!groupedRecords[code]) {
        groupedRecords[code] = [];
      }
      groupedRecords[code].push(record);
    }
    
    // 找出记录最多的类型
    var maxCode = '';
    var maxCount = 0;
    for (var code in groupedRecords) {
      if (groupedRecords[code].length > maxCount) {
        maxCount = groupedRecords[code].length;
        maxCode = code;
      }
    }
    
    // 生成趋势数据
    var trendRecords = groupedRecords[maxCode] || [];
    trendRecords.sort(function(a, b) {
      return (a.completedAt || 0) - (b.completedAt || 0);
    });
    
    that.setData({
      trendData: trendRecords.slice(-5), // 最近5次
      showTrend: true
    });
  },

  // 隐藏趋势图
  hideTrend: function() {
    this.setData({
      showTrend: false
    });
  },

  // 获取评级颜色
  getLevelColor: function(level) {
    var colors = {
      '优秀': '#FF6B35',
      '良好': '#FF7E4B',
      '中等': '#FFA000',
      '正常': '#FFA000',
      '需关注': '#FF5722',
      '轻度失调': '#FF5722',
      '需干预': '#D32F2F',
      '中度失调': '#D32F2F'
    };
    return colors[level] || '#FF6B35';
  },

  // 获取名称
  getAssessmentName: function(code) {
    var meta = getAssessmentMeta(code);
    if (meta) {
      return meta.shortName || meta.name;
    }
    return normalizeAssessmentCode(code) || code;
  },

  // 格式化日期
  formatDate: function(timestamp) {
    if (!timestamp) return '';
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    
    return year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    var task = that.loadRecords(true);
    if (task && typeof task.finally === 'function') {
      task.finally(function() {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '小牛育儿成长记录',
      path: '/pages/assessment/assessment'
    };
  }
});
