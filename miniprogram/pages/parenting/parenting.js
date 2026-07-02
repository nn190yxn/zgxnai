// 育儿锦囊页面逻辑
var app = getApp();

Page({
  data: {
    // 分类列表 - 每个分类配有独特的emoji、颜色和描述
    categoryList: [
      {
        id: 1,
        icon: '🧘',
        name: '情绪管理',
        desc: '哭闹、发脾气、输不起时看这里',
        color: '#4A90D9',
        bgColor: '#E8F0FE',
        emoji: '😊'
      },
      {
        id: 2,
        icon: '🌱',
        name: '行为习惯',
        desc: '吃饭、睡觉、刷牙、出门守规则',
        color: '#5DBA8B',
        bgColor: '#E8F5EE',
        emoji: '✨'
      },
      {
        id: 3,
        icon: '🧠',
        name: '认知发展',
        desc: '听不懂、记不住、不会表达时看这里',
        color: '#9B7ED9',
        bgColor: '#F0EBFA',
        emoji: '💡'
      },
      {
        id: 4,
        icon: '🤝',
        name: '社交能力',
        desc: '不敢加入、抢玩具、被拒绝时用得上',
        color: '#E89A4C',
        bgColor: '#FDF2E3',
        emoji: '💬'
      },
      {
        id: 5,
        icon: '🍎',
        name: '营养健康',
        desc: '挑食、零食、家常饭搭配看这里',
        color: '#E8737A',
        bgColor: '#FDECEC',
        emoji: '🥗'
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
    loadError: '',
    recommendationLabel: '',
    recommendationFallback: ''
  },

  getLocalArticles: function() {
    return [
      {
        id: 'local_parenting_001',
        title: '4-5岁孩子情绪表达的4个引导技巧',
        summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
        category: '情绪管理',
        age_group: '4-5岁',
        isFavorite: false
      },
      {
        id: 'local_parenting_002',
        title: '建立睡前流程：让孩子更快入睡',
        summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
        category: '行为习惯',
        age_group: '5-6岁',
        isFavorite: false
      },
      {
        id: 'local_parenting_003',
        title: '同伴冲突时，家长如何做“翻译官”',
        summary: '把争抢背后的需求说出来，帮助孩子学习社交协商。',
        category: '社交能力',
        age_group: '4-5岁',
        isFavorite: false
      }
    ];
  },

  normalizeArticleCard: function(article) {
    article = article || {};
    article.categoryName = article.categoryName || article.category || '';
    article.ageRange = article.ageRange || article.age_group || '';
    article.viewCount = typeof article.viewCount === 'number' ? article.viewCount : Number(article.read_count || article.viewCount || 0);
    article.publishTime = article.publishTime || article.created_at || '';
    article.isFavorite = !!(article.is_favorited || article.isFavorite);
    return article;
  },

  buildArticleTrackPayload: function(article, extra) {
    article = article || {};
    var baseEventMeta = {
      title: article.title || '',
      category: article.category || '',
      age_group: article.age_group || '',
      page: 'parenting_home'
    };
    var payload = Object.assign({
      module_key: 'knowledge',
      page_key: 'parenting_home',
      content_type: 'article',
      content_id: String(article.id || ''),
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
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
      var fallback = that.getLocalArticles().map(function(item) {
        return that.normalizeArticleCard(item);
      });
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

    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    var recommendation = app.buildParentingRecommendation ? app.buildParentingRecommendation(currentChild) : { ageGroup: '', label: '', fallback: '' };
    var ageGroup = recommendation.ageGroup;
    var requestData = {
      page: 1,
      page_size: that.data.pageSize
    };
    if (ageGroup) {
      requestData.age_group = ageGroup;
    }
    that.setData({
      recommendationLabel: recommendation.label || '',
      recommendationFallback: recommendation.fallback || ''
    });

    app.request({
      url: '/parenting/articles',
      method: 'GET',
      data: requestData
    }).then(function(payload) {
      var pagination = payload && payload.pagination ? payload.pagination : null;
      var list = payload && Array.isArray(payload.list) ? payload.list : payload;
      list = list || [];
      if (!Array.isArray(list)) {
        list = [];
      }
      list = list.map(function(item) {
        return that.normalizeArticleCard(item);
      });
      that.setData({
        hotArticles: list.slice(0, 5),
        latestArticles: list,
        hasMore: pagination && typeof pagination.hasMore === 'boolean' ? pagination.hasMore : list.length >= that.data.pageSize,
        page: 2,
        loadError: ''
      });
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        var message = app.getApiErrorMessage(err, '育儿文章没加载出来');
        that.setData({
          hotArticles: [],
          latestArticles: [],
          hasMore: false,
          page: 1,
          loadError: message
        });
        return;
      }
      var fallback = that.getLocalArticles().map(function(item) {
        return that.normalizeArticleCard(item);
      });
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
      app.trackKbEvent(this.buildArticleTrackPayload(article, {
        event_type: 'article_entry_click',
        event_meta: {
          section: 'hot_swiper'
        }
      }));
      wx.navigateTo({
        url: '/pages/parenting/article-detail/article-detail?id=' + article.id,
        fail: function() {
          wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
        }
      });
    }
  },

  // 点击搜索入口
  onSearchTap: function() {
    wx.navigateTo({
      url: '/pages/parenting/search/search',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
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
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 跳转到发展里程碑评估
  goToMilestone: function() {
    wx.navigateTo({
      url: '/pages/parenting/milestone/milestone',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 点击文章
  onArticleTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var article = this.data.latestArticles[index] || { id: id };
    app.trackKbEvent(this.buildArticleTrackPayload(article, {
      event_type: 'article_entry_click',
      event_meta: {
        section: 'latest_list'
      }
    }));
    wx.navigateTo({
      url: '/pages/parenting/article-detail/article-detail?id=' + id,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
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
        title: isFavorite ? '已取消收藏' : '已收藏',
        icon: 'success'
      });
    }).catch(function() {
      wx.showToast({
        title: '没处理成功，请再试一次',
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
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    if (this.data.loading) {
      wx.stopPullDownRefresh();
      return;
    }
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

    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    var recommendation = app.buildParentingRecommendation ? app.buildParentingRecommendation(currentChild) : { ageGroup: '' };
    var ageGroup = recommendation.ageGroup;
    var requestData = {
      page: that.data.page,
      page_size: that.data.pageSize
    };
    if (ageGroup) {
      requestData.age_group = ageGroup;
    }

    app.request({
      url: '/parenting/articles',
      method: 'GET',
      data: requestData
    }).then(function(payload) {
      var pagination = payload && payload.pagination ? payload.pagination : null;
      var list = payload && Array.isArray(payload.list) ? payload.list : payload;
      list = list || [];
      list = list.map(function(item) {
        return that.normalizeArticleCard(item);
      });
      var newList = that.data.latestArticles.concat(list);
      that.setData({
        latestArticles: newList,
        hasMore: pagination && typeof pagination.hasMore === 'boolean' ? pagination.hasMore : list.length >= that.data.pageSize,
        page: that.data.page + 1
      });
    }).catch(function(err) {
      if (app.globalData.isDebug) console.error('加载更多文章失败', err);
    }).finally(function() {
      that.setData({
        loading: false
      });
    });
  }
,

  onShareAppMessage: function() {
    return {
      title: app.buildShareTitle('parenting'),
      path: '/pages/index/index'
    };
  }
});
