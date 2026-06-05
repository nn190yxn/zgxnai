// 搜索页面逻辑
var app = getApp();

Page({
  data: {
    // 搜索关键词
    keyword: '',
    // 搜索历史
    searchHistory: [],
    // 热门搜索
    hotKeywords: [],
    // 搜索结果
    searchResults: [],
    // 是否显示搜索结果
    showResults: false,
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 加载状态
    loading: false,
    requestSeq: 0
  },

  onLoad: function() {
    this.loadSearchHistory();
    this.loadHotKeywords();
  },

  onShow: function() {
    // 每次显示时刷新搜索历史
    this.loadSearchHistory();
  },

  // 加载搜索历史
  loadSearchHistory: function() {
    var history = wx.getStorageSync('parenting_search_history') || [];
    this.setData({
      searchHistory: history
    });
  },

  // 加载热门搜索
  loadHotKeywords: function() {
    var that = this;

    if (app.shouldUseMockFallback()) {
      that.setData({
        hotKeywords: ['情绪管理', '孩子哭闹', '睡眠问题', '饮食习惯', '社交能力', '专注力培养', '性教育']
      });
      return;
    }

    app.request({
      url: '/parenting/hot-keywords',
      method: 'GET'
    }).then(function(list) {
      that.setData({
        hotKeywords: list || []
      });
    }).catch(function(err) {
      if (app.globalData.isDebug) console.error('加载热门搜索失败', err);
      that.setData({
        hotKeywords: ['情绪管理', '孩子哭闹', '睡眠问题', '饮食习惯', '社交能力', '专注力培养']
      });
    });
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 搜索确认
  onSearchConfirm: function() {
    var keyword = this.data.keyword.trim();
    if (!keyword) {
      return;
    }
    
    // 保存搜索历史
    this.saveSearchHistory(keyword);
    
    // 执行搜索
    this.doSearch();
  },

  // 执行搜索
  doSearch: function() {
    var that = this;
    var keyword = that.data.keyword.trim();
    
    if (!keyword) {
      return;
    }
    
    var requestSeq = that.data.requestSeq + 1;
    that.setData({
      loading: true,
      showResults: true,
      searchResults: [],
      page: 1,
      hasMore: true,
      requestSeq: requestSeq
    });

    if (app.shouldUseMockFallback()) {
      var fallback = [
        {
          id: 'local_parenting_001',
          title: '3-6岁孩子情绪表达的4个引导技巧',
          summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
          category: '情绪管理',
          age_group: '3-6岁',
          isFavorite: false
        },
        {
          id: 'local_parenting_004',
          title: '认识身体边界：背心短裤盖住的地方',
          summary: '用温和的方式帮助孩子理解隐私部位、拒绝和告诉可信任的大人。',
          category: '性教育',
          age_group: '3-6岁',
          isFavorite: false
        }
      ].filter(function(item) {
        return item.title.indexOf(keyword) !== -1 || item.summary.indexOf(keyword) !== -1 || item.category.indexOf(keyword) !== -1;
      });
      if (!fallback.length) {
        fallback = [
          {
            id: 'local_parenting_001',
            title: '3-6岁孩子情绪表达的4个引导技巧',
            summary: '换个关键词试试，也可以从热门搜索进入。',
            category: '情绪管理',
            age_group: '3-6岁',
            isFavorite: false
          }
        ];
      }
      that.setData({
        searchResults: fallback,
        hasMore: false,
        page: 2,
        loading: false
      });
      return;
    }

    app.request({
      url: '/parenting/search',
      method: 'GET',
      data: {
        keyword: keyword,
        page: 1,
        page_size: that.data.pageSize
      }
    }).then(function(list) {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      list = list || [];
      for (var i = 0; i < list.length; i++) {
        list[i].isFavorite = !!(list[i].is_favorited || list[i].isFavorite);
      }
      that.setData({
        searchResults: list,
        hasMore: list.length >= that.data.pageSize,
        page: 2
      });
    }).catch(function(err) {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      if (app.globalData.isDebug) console.error('搜索失败', err);
      wx.showToast({
        title: '搜索失败',
        icon: 'none'
      });
    }).finally(function() {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      that.setData({
        loading: false
      });
    });
  },

  // 保存搜索历史
  saveSearchHistory: function(keyword) {
    var history = this.data.searchHistory;
    
    // 移除已存在的相同关键词
    var index = history.indexOf(keyword);
    if (index > -1) {
      history.splice(index, 1);
    }
    
    // 添加到开头
    history.unshift(keyword);
    
    // 最多保存10条
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    this.setData({
      searchHistory: history
    });
    
    wx.setStorageSync('parenting_search_history', history);
  },

  // 点击历史关键词
  onHistoryTap: function(e) {
    var keyword = e.currentTarget.dataset.keyword;
    this.setData({
      keyword: keyword
    });
    this.saveSearchHistory(keyword);
    this.doSearch();
  },

  // 点击热门关键词
  onHotKeywordTap: function(e) {
    var keyword = e.currentTarget.dataset.keyword;
    this.setData({
      keyword: keyword
    });
    this.saveSearchHistory(keyword);
    this.doSearch();
  },

  // 清除搜索历史
  onClearHistory: function() {
    var that = this;
    wx.showModal({
      title: '提示',
      content: '确定要清除搜索历史吗？',
      success: function(res) {
        if (res.confirm) {
          that.setData({
            searchHistory: []
          });
          wx.removeStorageSync('parenting_search_history');
        }
      }
    });
  },

  // 清除搜索框
  onClearInput: function() {
    this.setData({
      keyword: '',
      showResults: false,
      searchResults: []
    });
  },

  // 返回
  onBackTap: function() {
    if (this.data.showResults) {
      this.setData({
        showResults: false,
        searchResults: [],
        keyword: ''
      });
    } else {
      wx.navigateBack();
    }
  },

  // 点击文章
  onArticleTap: function(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/parenting/article-detail/article-detail?id=' + id,
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 收藏/取消收藏
  onFavoriteTap: function(e) {
    var that = this;
    if (that._favoritePending) {
      return;
    }
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var article = that.data.searchResults[index];
    var isFavorite = article.isFavorite;
    that._favoritePending = true;

    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }

      return app.request({
      url: '/parenting/articles/' + id + '/favorite',
      method: 'POST'
    }).then(function() {
      var searchResults = that.data.searchResults;
      searchResults[index].isFavorite = !isFavorite;
      that.setData({
        searchResults: searchResults
      });
      wx.showToast({
        title: isFavorite ? '已取消收藏' : '收藏成功',
        icon: 'success'
      });
    }).catch(function() {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      });
    });
    }).finally(function() {
      that._favoritePending = false;
    });
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadMoreResults();
  },

  // 加载更多结果
  loadMoreResults: function() {
    var that = this;
    if (that.data.loading || !that.data.hasMore || !that.data.showResults) {
      return;
    }
    
    var requestSeq = that.data.requestSeq;
    that.setData({
      loading: true
    });

    if (app.shouldUseMockFallback()) {
      that.setData({
        hasMore: false,
        loading: false
      });
      return;
    }

    app.request({
      url: '/parenting/search',
      method: 'GET',
      data: {
        keyword: that.data.keyword,
        page: that.data.page,
        page_size: that.data.pageSize
      }
    }).then(function(list) {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      list = list || [];
      for (var i = 0; i < list.length; i++) {
        list[i].isFavorite = !!(list[i].is_favorited || list[i].isFavorite);
      }
      var newList = that.data.searchResults.concat(list);
      that.setData({
        searchResults: newList,
        hasMore: list.length >= that.data.pageSize,
        page: that.data.page + 1
      });
    }).catch(function(err) {
      if (app.globalData.isDebug) console.error('加载更多失败', err);
    }).finally(function() {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      that.setData({
        loading: false
      });
    });
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理',
      path: '/pages/index/index'
    };
  }
});
