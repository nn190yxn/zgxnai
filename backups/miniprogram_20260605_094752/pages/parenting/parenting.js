// 育儿锦囊页面逻辑
var app = getApp();

Page({
  data: {
    // 分类列表
    categoryList: [
      {
        id: 1,
        icon: '🧘',
        name: '情绪管理',
        desc: '帮助孩子认识和管理情绪'
      },
      {
        id: 2,
        icon: '📝',
        name: '行为习惯',
        desc: '培养良好生活习惯和行为规范'
      },
      {
        id: 3,
        icon: '🤝',
        name: '社交能力',
        desc: '提升孩子人际交往与沟通能力'
      },
      {
        id: 4,
        icon: '🧠',
        name: '认知发展',
        desc: '促进孩子思维与认知能力提升'
      },
      {
        id: 5,
        icon: '🛡️',
        name: '安全教育',
        desc: '提高孩子安全意识和自我保护能力'
      },
      {
        id: 6,
        icon: '👨‍👩‍👧',
        name: '性教育',
        desc: '适龄性教育知识与方法指导'
      }
    ],
    // 热门文章轮播
    hotArticles: [],
    // 轮播当前索引
    swiperCurrent: 0,
    // 最新文章列表
    latestArticles: [],
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 加载状态
    loading: true,
    initialized: false,
    loadError: ''
  },

  getLocalArticles: function() {
    return [
      {
        id: 'local_parenting_001',
        title: '3-6岁孩子情绪表达的4个引导技巧',
        summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
        category: '情绪管理',
        age_group: '3-6岁',
        isFavorite: false
      },
      {
        id: 'local_parenting_002',
        title: '建立睡前流程：让孩子更快入睡',
        summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
        category: '行为习惯',
        age_group: '3-6岁',
        isFavorite: false
      },
      {
        id: 'local_parenting_003',
        title: '同伴冲突时，家长如何做“翻译官”',
        summary: '把争抢背后的需求说出来，帮助孩子学习社交协商。',
        category: '社交能力',
        age_group: '3-6岁',
        isFavorite: false
      }
    ];
  },

  onLoad: function() {
    this.loadData();
  },

  onShow: function() {
    // 避免首屏 onLoad + onShow 重复请求
    if (!this.data.initialized) {
      return;
    }
    this.loadData();
  },

  // 加载数据
  loadData: function(fromPullDown) {
    var that = this;
    that.setData({
      loading: true,
      loadError: ''
    });

    if (app.shouldUseMockFallback()) {
      var fallback = that.getLocalArticles();
      that.setData({
        hotArticles: fallback.slice(0, 3),
        latestArticles: fallback,
        hasMore: false,
        page: 2,
        loadError: '',
        loading: false,
        initialized: true
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    app.request({
      url: '/parenting/articles',
      method: 'GET',
      data: {
        page: 1,
        page_size: that.data.pageSize
      }
    }).then(function(list) {
      list = list || [];
      if (!Array.isArray(list)) {
        list = [];
      }
      if (!list.length && app.shouldUseMockFallback()) {
        list = that.getLocalArticles();
      }
      that.setData({
        hotArticles: list.slice(0, 5),
        latestArticles: list,
        hasMore: list.length >= that.data.pageSize,
        page: 2,
        loadError: ''
      });
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        var message = app.getApiErrorMessage(err, '育儿文章加载失败');
        that.setData({
          hotArticles: [],
          latestArticles: [],
          hasMore: false,
          page: 1,
          loadError: message
        });
        return;
      }
      var fallback = that.getLocalArticles();
      that.setData({
        hotArticles: fallback.slice(0, 3),
        latestArticles: fallback,
        hasMore: false,
        page: 2,
        loadError: ''
      });
    }).finally(function() {
      that.setData({
        loading: false,
        initialized: true
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  retryLoadData: function() {
    this.loadData(true);
  },

  // 轮播切换
  onSwiperChange: function(e) {
    this.setData({
      swiperCurrent: e.detail.current
    });
  },

  // 点击轮播文章
  onSwiperTap: function(e) {
    var index = e.currentTarget.dataset.index;
    var article = this.data.hotArticles[index];
    if (article && article.id) {
      wx.navigateTo({
        url: '/pages/parenting/article-detail/article-detail?id=' + article.id,
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    }
  },

  // 点击搜索入口
  onSearchTap: function() {
    wx.navigateTo({
      url: '/pages/parenting/search/search',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 点击分类
  onCategoryTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    wx.navigateTo({
      url: '/pages/parenting/article-list/article-list?categoryId=' + id + '&categoryName=' + encodeURIComponent(name),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
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
    var article = that.data.latestArticles[index];
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
      var latestArticles = that.data.latestArticles;
      latestArticles[index].isFavorite = !isFavorite;
      that.setData({
        latestArticles: latestArticles
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

  // 查看更多文章
  onMoreArticlesTap: function() {
    wx.navigateTo({
      url: '/pages/parenting/article-list/article-list',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      page: 1,
      hasMore: true
    });
    this.loadData(true);
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadMoreArticles();
  },

  // 加载更多文章
  loadMoreArticles: function() {
    var that = this;
    if (that.data.loading || !that.data.hasMore) {
      return;
    }
    
    that.setData({
      loading: true
    });

    app.request({
      url: '/parenting/articles',
      method: 'GET',
      data: {
        page: that.data.page,
        page_size: that.data.pageSize
      }
    }).then(function(list) {
      list = list || [];
      var newList = that.data.latestArticles.concat(list);
      that.setData({
        latestArticles: newList,
        hasMore: list.length >= that.data.pageSize,
        page: that.data.page + 1
      });
    }).catch(function(err) {
      console.error('加载更多文章失败', err);
    }).finally(function() {
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
