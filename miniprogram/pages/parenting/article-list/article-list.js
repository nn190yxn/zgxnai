// 文章列表页面逻辑
var app = getApp();

Page({
  data: {
    // 分类列表
    categoryList: [
      { id: 0, name: '全部' },
      { id: 1, name: '情绪管理' },
      { id: 2, name: '行为习惯' },
      { id: 3, name: '认知发展' },
      { id: 4, name: '社交能力' },
      { id: 5, name: '营养健康' }
    ],
    // 年龄段列表
    ageList: [
      { id: 0, name: '全部年龄' },
      { id: 1, name: '2-3岁' },
      { id: 2, name: '3-4岁' },
      { id: 3, name: '4-5岁' },
      { id: 4, name: '5-6岁' },
      { id: 5, name: '6-9岁' }
    ],
    // 当前选中的分类
    currentCategory: 0,
    // 当前选中的年龄段
    currentAge: 0,
    // 搜索关键词
    keyword: '',
    // 文章列表
    articleList: [],
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 加载状态
    loading: false
  },

  getLocalArticles: function() {
    return [
      {
        id: 'local_parenting_001',
        title: '4-5岁孩子情绪表达的4个引导技巧',
        summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
        category: '情绪管理',
        age_group: '4-5岁',
        imageLoaded: false,
        isFavorite: false
      },
      {
        id: 'local_parenting_002',
        title: '建立睡前流程：让孩子更快入睡',
        summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
        category: '行为习惯',
        age_group: '5-6岁',
        imageLoaded: false,
        isFavorite: false
      },
      {
        id: 'local_parenting_003',
        title: '同伴冲突时，家长如何做“翻译官”',
        summary: '把争抢背后的需求说出来，帮助孩子学习社交协商。',
        category: '社交能力',
        age_group: '4-5岁',
        imageLoaded: false,
        isFavorite: false
      },
      {
        id: 'local_parenting_004',
        title: '专注力环境搭建：先减干扰，再谈坚持',
        summary: '把材料和任务长度一起收窄，孩子更容易进入专注状态。',
        category: '认知发展',
        age_group: '5-6岁',
        imageLoaded: false,
        isFavorite: false
      },
      {
        id: 'local_parenting_005',
        title: '早餐营养搭配：让早晨吃进去，也吃得稳',
        summary: '主食、蛋白和蔬果搭配得当，更有利于上午精力稳定。',
        category: '营养健康',
        age_group: '5-6岁',
        imageLoaded: false,
        isFavorite: false
      }
    ];
  },

  buildArticleTrackPayload: function(article, extra) {
    article = article || {};
    var baseEventMeta = {
      title: article.title || '',
      category: article.category || '',
      age_group: article.age_group || '',
      page: 'parenting_article_list'
    };
    var payload = Object.assign({
      module_key: 'knowledge',
      page_key: 'parenting_article_list',
      content_type: 'article',
      content_id: String(article.id || ''),
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
  },

  onLoad: function(options) {
    // 处理传入的参数
    if (options.categoryId) {
      this.setData({
        currentCategory: parseInt(options.categoryId)
      });
    }
    if (options.categoryName) {
      wx.setNavigationBarTitle({
        title: decodeURIComponent(options.categoryName)
      });
    }
    if (options.keyword) {
      this.setData({
        keyword: decodeURIComponent(options.keyword)
      });
    }
    this.loadArticles();
  },

  // 加载文章列表
  loadArticles: function(fromPullDown) {
    var that = this;
    if (that.data.loading || !that.data.hasMore) {
      return;
    }

    that.setData({
      loading: true
    });

    var params = {
      page: that.data.page,
      page_size: that.data.pageSize
    };

    if (that.data.currentCategory > 0) {
      params.category = that.data.categoryList[that.data.currentCategory].name;
    }
    if (that.data.currentAge > 0) {
      params.age_group = that.data.ageList[that.data.currentAge].name;
    }
    if (that.data.keyword) {
      params.keyword = that.data.keyword;
    }

    if (app.shouldUseMockFallback()) {
      var fallback = that.getLocalArticles();
      fallback.forEach(function(item) {
        item.imageLoaded = false;
      });
      that.setData({
        articleList: that.data.page === 1 ? fallback : that.data.articleList,
        hasMore: false,
        page: 2,
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    app.request({
      url: '/parenting/articles',
      method: 'GET',
      data: params
    }).then(function(list) {
      list = list || [];
      if (!Array.isArray(list)) {
        list = [];
      }
      if (!list.length && that.data.page === 1) {
        list = that.getLocalArticles();
      }
      list.forEach(function(item) {
        item.imageLoaded = false;
        item.isFavorite = !!(item.is_favorited || item.isFavorite);
      });
      var newList = that.data.page === 1 ? list : that.data.articleList.concat(list);
      that.setData({
        articleList: newList,
        hasMore: list.length >= that.data.pageSize,
        page: that.data.page + 1
      });
    }).catch(function(err) {
      if (that.data.page === 1) {
        that.setData({
          articleList: that.getLocalArticles(),
          hasMore: false,
          page: 2
        });
      }
    }).finally(function() {
      that.setData({
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  // 图片加载完成
  onImageLoad: function(e) {
    var index = e.currentTarget.dataset.index;
    var key = 'articleList[' + index + '].imageLoaded';
    this.setData({
      [key]: true
    });
  },

  // 分类选择
  onCategoryChange: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id === this.data.currentCategory) {
      return;
    }
    this.setData({
      currentCategory: id,
      articleList: [],
      page: 1,
      hasMore: true
    });
    this.loadArticles();
  },

  // 年龄段选择
  onAgeChange: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id === this.data.currentAge) {
      return;
    }
    this.setData({
      currentAge: id,
      articleList: [],
      page: 1,
      hasMore: true
    });
    this.loadArticles();
  },

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      keyword: e.detail.value
    });
  },

  // 搜索确认
  onSearchConfirm: function() {
    this.setData({
      articleList: [],
      page: 1,
      hasMore: true
    });
    this.loadArticles();
  },

  // 清除搜索
  onClearSearch: function() {
    this.setData({
      keyword: '',
      articleList: [],
      page: 1,
      hasMore: true
    });
    this.loadArticles();
  },

  // 点击文章
  onArticleTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var article = this.data.articleList[index] || { id: id };
    app.trackKbEvent(this.buildArticleTrackPayload(article, {
      event_type: 'article_entry_click',
      event_meta: {
        section: 'article_list',
        keyword: this.data.keyword || ''
      }
    }));
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
    var article = that.data.articleList[index];
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
      var articleList = that.data.articleList;
      articleList[index].isFavorite = !isFavorite;
      that.setData({
        articleList: articleList
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

  // 下拉刷新
  onPullDownRefresh: function() {
    this.setData({
      articleList: [],
      page: 1,
      hasMore: true
    });
    this.loadArticles(true);
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadArticles();
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理',
      path: '/pages/index/index'
    };
  }
});
