// 家长痛点合集页：按痛点标签浏览同一类问题的文章
var app = getApp();
var appConfig = require('../../../utils/app-config.js');

Page({
  data: {
    featureEnabled: true,
    loadState: 'loading',
    catalogError: '',
    articleError: '',
    tags: [],
    activeTagKey: '',
    activeTagLabel: '',
    articles: [],
    articlesLoading: false,
    page: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad: function(options) {
    options = options || {};
    this._unloaded = false;
    this._pullDownPending = false;
    this._initialTagKey = this.decodeQueryValue(options.painPointKey || options.pain_point_key);
    var featureEnabled = appConfig.isFeatureEnabled(app, 'painPointCollection');
    this.setData({
      featureEnabled: featureEnabled
    });
    if (!featureEnabled) {
      this.setData({
        loadState: 'disabled'
      });
      return;
    }
    this.loadCatalogs();
  },

  decodeQueryValue: function(value) {
    var normalized = String(value || '').trim();
    if (!normalized) {
      return '';
    }
    try {
      return decodeURIComponent(normalized);
    } catch (e) {
      return normalized;
    }
  },

  buildTrackPayload: function(extra) {
    var baseEventMeta = {
      page: 'parenting_pain_point_collection',
      pain_point_key: this.data.activeTagKey || '',
      pain_point_label: this.data.activeTagLabel || ''
    };
    var payload = Object.assign({
      module_key: 'knowledge',
      page_key: 'parenting_pain_point_collection',
      content_type: 'article',
      content_id: '',
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
  },

  // 加载痛点标签目录
  loadCatalogs: function() {
    var that = this;
    that.setData({
      catalogError: '',
      loadState: that.data.articles.length ? that.data.loadState : 'loading'
    });
    return app.request({
      url: '/pain-point-tags',
      method: 'GET'
    }).then(function(payload) {
      if (that._unloaded) return;
      var list = payload && Array.isArray(payload.list) ? payload.list : [];
      var tags = list.map(function(item) {
        item = item || {};
        return {
          key: String(item.key || '').trim(),
          label: item.label || '',
          category: item.category || ''
        };
      }).filter(function(item) {
        return !!item.key;
      });
      if (!tags.length) {
        that.setData({
          tags: [],
          loadState: 'catalog_error',
          catalogError: '痛点合集暂时没加载出来'
        });
        return;
      }
      that.setData({
        tags: tags
      });
      that.applyCatalog(tags);
    }).catch(function(error) {
      if (that._unloaded) return;
      that.setData({
        loadState: 'catalog_error',
        catalogError: app.getApiErrorMessage ? app.getApiErrorMessage(error, '痛点合集暂时没加载出来') : '痛点合集暂时没加载出来'
      });
    }).finally(function() {
      if (that._pullDownPending) {
        that._pullDownPending = false;
        wx.stopPullDownRefresh();
      }
    });
  },

  // 目录加载完成后确定当前标签
  applyCatalog: function(tags) {
    var existingKey = this.data.activeTagKey;
    var initialKey = this._initialTagKey;
    this._initialTagKey = '';
    var hasExisting = tags.some(function(item) { return item.key === existingKey; });
    var hasInitial = !!initialKey && tags.some(function(item) { return item.key === initialKey; });
    var targetKey = hasInitial ? initialKey : (hasExisting ? existingKey : tags[0].key);
    var target = tags.filter(function(item) { return item.key === targetKey; })[0] || tags[0];
    if (target.key === existingKey && this.data.articles.length) {
      return;
    }
    this.setData({
      activeTagKey: target.key,
      activeTagLabel: target.label || '',
      articles: [],
      page: 1,
      hasMore: true,
      articleError: '',
      loadState: 'ready'
    });
    app.trackKbEvent(this.buildTrackPayload({
      event_type: 'pain_point_collection_view',
      event_meta: {
        source: initialKey ? 'article_tag' : 'collection_page'
      }
    }));
    this.loadArticles();
  },

  // 切换标签或刷新时调用：让仍在飞行中的旧请求失效，避免旧数据写入新标签
  invalidateArticleRequest: function() {
    this._requestGeneration = (this._requestGeneration || 0) + 1;
    this.setData({
      articlesLoading: false
    });
  },

  // 加载当前标签下的文章
  loadArticles: function() {
    var that = this;
    if (!that.data.activeTagKey || that.data.articlesLoading || !that.data.hasMore) {
      return Promise.resolve();
    }
    var requestGeneration = that._requestGeneration = (that._requestGeneration || 0) + 1;
    var currentPage = that.data.page;
    that.setData({
      articlesLoading: true,
      articleError: ''
    });
    return app.request({
      url: '/parenting/articles',
      method: 'GET',
      data: {
        pain_point_key: that.data.activeTagKey,
        page: currentPage,
        page_size: that.data.pageSize
      }
    }).then(function(payload) {
      if (requestGeneration !== that._requestGeneration || that._unloaded) return;
      var pagination = payload && payload.pagination ? payload.pagination : null;
      var list = payload && Array.isArray(payload.list) ? payload.list : [];
      list.forEach(function(item) {
        that.normalizeArticleCard(item);
      });
      var newList = currentPage > 1 ? that.data.articles.concat(list) : list;
      var hasMore = pagination && typeof pagination.hasMore === 'boolean'
        ? pagination.hasMore
        : list.length >= that.data.pageSize;
      that.setData({
        articles: newList,
        hasMore: hasMore,
        page: list.length > 0 ? currentPage + 1 : currentPage,
        loadState: newList.length ? 'ready' : 'empty'
      });
      if (currentPage > 1 && !hasMore) {
        wx.showToast({
          title: '已经到底了',
          icon: 'none'
        });
      }
    }).catch(function(error) {
      if (requestGeneration !== that._requestGeneration || that._unloaded) return;
      if (currentPage === 1) {
        that.setData({
          articles: [],
          hasMore: false,
          loadState: 'error',
          articleError: app.getApiErrorMessage ? app.getApiErrorMessage(error, '文章暂时没加载出来') : '文章暂时没加载出来'
        });
        return;
      }
      wx.showToast({
        title: '没加载出来，请再试一次',
        icon: 'none'
      });
    }).finally(function() {
      if (requestGeneration !== that._requestGeneration || that._unloaded) return;
      that.setData({
        articlesLoading: false
      });
    });
  },

  normalizeArticleCard: function(article) {
    article = article || {};
    article.categoryName = article.categoryName || article.category || '';
    article.ageRange = article.ageRange || article.age_group || '';
    return article;
  },

  retryLoadCatalog: function() {
    this.loadCatalogs();
  },

  retryLoadArticles: function() {
    this.setData({
      page: 1,
      hasMore: true,
      articles: [],
      loadState: 'ready'
    });
    this.loadArticles();
  },

  onTagTap: function(e) {
    var key = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.key : '';
    if (!key || key === this.data.activeTagKey) {
      return;
    }
    var target = (this.data.tags || []).filter(function(item) { return item.key === key; })[0];
    if (!target) {
      return;
    }
    this.setData({
      activeTagKey: target.key,
      activeTagLabel: target.label || '',
      articles: [],
      page: 1,
      hasMore: true,
      articleError: '',
      loadState: 'ready'
    });
    app.trackKbEvent(this.buildTrackPayload({
      event_type: 'pain_point_tag_click',
      event_meta: {
        source: 'collection_page'
      }
    }));
    this.invalidateArticleRequest();
    this.loadArticles();
  },

  onArticleTap: function(e) {
    var dataset = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset : {};
    var id = dataset.id;
    var index = dataset.index;
    if (!id) {
      return;
    }
    var article = this.data.articles[index] || { id: id };
    app.trackKbEvent(this.buildTrackPayload({
      content_id: String(id),
      event_type: 'pain_point_article_click',
      event_meta: {
        title: article.title || ''
      }
    }));
    wx.navigateTo({
      url: '/pages/parenting/article-detail/article-detail?id=' + id,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onPullDownRefresh: function() {
    if (!this.data.featureEnabled) {
      wx.stopPullDownRefresh();
      return;
    }
    this._pullDownPending = true;
    this.setData({
      articles: [],
      page: 1,
      hasMore: true,
      articleError: ''
    });
    this.invalidateArticleRequest();
    this.loadCatalogs();
  },

  onReachBottom: function() {
    this.loadArticles();
  },

  onUnload: function() {
    this._unloaded = true;
    this._requestGeneration = (this._requestGeneration || 0) + 1;
    if (this._pullDownPending) {
      this._pullDownPending = false;
      wx.stopPullDownRefresh();
    }
  },

  onShareAppMessage: function() {
    return {
      title: app.buildShareTitle ? app.buildShareTitle('pain_point_collection') : '家长痛点合集：按问题翻文章',
      path: '/pages/parenting/pain-point-collection/index' + (this.data.activeTagKey ? '?painPointKey=' + encodeURIComponent(this.data.activeTagKey) : '')
    };
  }
});
