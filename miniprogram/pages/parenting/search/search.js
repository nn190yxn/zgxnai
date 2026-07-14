// 搜索页面逻辑
var app = getApp();

Page({
  data: {
    keyword: '',
    currentAgeGroup: '',
    currentCategory: '',
    searchHistory: [],
    hotKeywords: [],
    sceneTags: [],
    searchResults: [],
    sceneSolutions: [],
    matchedScene: null,
    coreActionContext: null,
    showResults: false,
    loading: false,
    hasMore: false,
    page: 1,
    pageSize: 10,
    requestSeq: 0
  },

  decodeQueryValue: function(value) {
    var text = String(value || '').trim();
    if (!text) {
      return '';
    }
    try {
      return decodeURIComponent(text.replace(/\+/g, ' ')).trim();
    } catch (err) {
      return text;
    }
  },

  trackSceneEvent: function(eventType, extraMeta) {
    if (!app.trackKbEvent) {
      return;
    }
    app.trackKbEvent({
      event_type: eventType,
      module_key: 'scene_search',
      page_key: 'parenting_search',
      event_meta: Object.assign({
        keyword: this.data.keyword || '',
        matched_scene_key: this.data.matchedScene ? this.data.matchedScene.sceneKey : ''
      }, extraMeta || {})
    });
  },

  onLoad: function(options) {
    var sceneKey = this.decodeQueryValue(options && (options.sceneKey || options.scene_key));
    var keyword = this.decodeQueryValue(options && options.keyword);
    var bottleneckTitle = this.decodeQueryValue(options && (options.bottleneckTitle || options.bottleneck_title));
    var ageGroup = this.decodeQueryValue(options && (options.ageGroup || options.age_group));
    var ageSegmentKey = this.decodeQueryValue(options && (options.ageSegmentKey || options.age_segment_key));
    var ageSegmentLabel = this.decodeQueryValue(options && (options.ageSegmentLabel || options.age_segment_label));
    var categoryKey = this.decodeQueryValue(options && (options.categoryKey || options.category_key));
    var categoryLabel = this.decodeQueryValue(options && (options.categoryLabel || options.category_label));
    var painPointKey = this.decodeQueryValue(options && (options.painPointKey || options.pain_point_key));
    var painPointTitle = this.decodeQueryValue(options && (options.painPointTitle || options.pain_point_title));
    var abilityTags = this.decodeQueryValue(options && (options.abilityTags || options.ability_tags));
    this.setData({
      keyword: keyword || painPointTitle || bottleneckTitle,
      currentAgeGroup: ageGroup,
      currentCategory: this.decodeQueryValue(options && options.category),
      coreActionContext: sceneKey ? {
        sceneKey: sceneKey,
        ageGroup: ageGroup,
        ageSegmentKey: ageSegmentKey,
        ageSegmentLabel: ageSegmentLabel,
        categoryKey: categoryKey,
        categoryLabel: categoryLabel,
        painPointKey: painPointKey,
        painPointTitle: painPointTitle,
        abilityTags: abilityTags,
        bottleneckTitle: bottleneckTitle,
        keyword: keyword || painPointTitle || bottleneckTitle
      } : null
    });
    this.loadSearchHistory();
    this.loadHotKeywords();
    this.loadSceneTags();
    if (sceneKey || keyword || bottleneckTitle) {
      this.trackSceneEvent('scene_search_submit', {
        submit_type: 'core_action_result',
        keyword: keyword || painPointTitle || bottleneckTitle,
        scene_key: sceneKey,
        age_segment_key: ageSegmentKey,
        category_key: categoryKey,
        category_label: categoryLabel,
        pain_point_key: painPointKey,
        pain_point_title: painPointTitle,
        ability_tags: abilityTags,
        bottleneck_title: bottleneckTitle,
        age_group: ageGroup
      });
      this.doSearch({
        sceneKey: sceneKey,
        keyword: keyword || painPointTitle || bottleneckTitle,
        ageGroup: ageGroup,
        ageSegmentKey: ageSegmentKey,
        ageSegmentLabel: ageSegmentLabel,
        categoryKey: categoryKey,
        categoryLabel: categoryLabel,
        painPointKey: painPointKey,
        painPointTitle: painPointTitle,
        abilityTags: abilityTags
      });
    }
  },

  onShow: function() {
    this.loadSearchHistory();
  },

  normalizeArticleCard: function(article) {
    article = article || {};
    return Object.assign({}, article, {
      categoryName: article.categoryName || article.category || '',
      ageRange: article.ageRange || article.age_group || '',
      viewCount: typeof article.viewCount === 'number' ? article.viewCount : Number(article.read_count || article.viewCount || 0),
      publishTime: article.publishTime || article.created_at || '',
      isFavorite: !!(article.is_favorited || article.isFavorite)
    });
  },

  loadSearchHistory: function() {
    this.setData({
      searchHistory: wx.getStorageSync('parenting_search_history') || []
    });
  },

  loadHotKeywords: function() {
    var that = this;
    if (app.shouldUseMockFallback()) {
      that.setData({
        hotKeywords: ['孩子发脾气', '睡前拖延', '挑食', '坐不住', '同伴冲突', '早晨磨蹭']
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
    }).catch(function() {
      that.setData({
        hotKeywords: []
      });
    });
  },

  loadSceneTags: function() {
    var that = this;
    if (app.shouldUseMockFallback()) {
      that.setData({
        sceneTags: [
          { sceneKey: 'tantrum_public', sceneTitle: '公共场合闹情绪', sceneCategory: '情绪支持' },
          { sceneKey: 'sleep_resist', sceneTitle: '睡前拖延', sceneCategory: '作息习惯' },
          { sceneKey: 'meal_picky', sceneTitle: '吃饭挑食', sceneCategory: '营养支持' },
          { sceneKey: 'homework_focus', sceneTitle: '写作业坐不住', sceneCategory: '学习支持' }
        ]
      });
      return;
    }
    app.request({
      url: '/search/scenes',
      method: 'GET'
    }).then(function(list) {
      that.setData({ sceneTags: list || [] });
      if ((list || []).length) {
        that.trackSceneEvent('scene_search_exposure', {
          exposure_type: 'scene_tags',
          total: (list || []).length
        });
      }
    }).catch(function() {
      that.setData({ sceneTags: [] });
    });
  },

  onSearchInput: function(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearchConfirm: function() {
    var keyword = String(this.data.keyword || '').trim();
    if (!keyword) {
      return;
    }
    this.saveSearchHistory(keyword);
    this.trackSceneEvent('scene_search_submit', { submit_type: 'manual_keyword', keyword: keyword });
    this.doSearch({ keyword: keyword });
  },

  saveSearchHistory: function(keyword) {
    var history = (this.data.searchHistory || []).filter(function(item) {
      return item !== keyword;
    });
    history.unshift(keyword);
    history = history.slice(0, 10);
    this.setData({ searchHistory: history });
    wx.setStorageSync('parenting_search_history', history);
  },

  doSearch: function(options) {
    var that = this;
    var opts = options || {};
    var keyword = String(opts.keyword || this.data.keyword || '').trim();
    var sceneKey = String(opts.sceneKey || '').trim();
    var ageGroup = String(opts.ageGroup || opts.age_group || this.data.currentAgeGroup || '').trim();
    var category = String(opts.category || this.data.currentCategory || '').trim();
    var coreContext = opts.sceneKey ? opts : (this.data.coreActionContext || {});
    var abilityTags = Array.isArray(coreContext.abilityTags) ? coreContext.abilityTags.join('、') : String(coreContext.abilityTags || '');
    var coreQuery = Object.assign(
      {},
      coreContext.ageSegmentKey ? { ageSegmentKey: coreContext.ageSegmentKey } : {},
      coreContext.ageSegmentLabel ? { ageSegmentLabel: coreContext.ageSegmentLabel } : {},
      coreContext.categoryKey ? { categoryKey: coreContext.categoryKey } : {},
      coreContext.categoryLabel ? { categoryLabel: coreContext.categoryLabel } : {},
      coreContext.painPointKey ? { painPointKey: coreContext.painPointKey } : {},
      coreContext.painPointTitle ? { painPointTitle: coreContext.painPointTitle } : {},
      abilityTags ? { abilityTags: abilityTags } : {}
    );
    if (!keyword && !sceneKey) {
      return;
    }
    var requestSeq = this.data.requestSeq + 1;
    this.setData({
      loading: true,
      showResults: true,
      requestSeq: requestSeq,
      keyword: keyword,
      searchResults: [],
      sceneSolutions: [],
      matchedScene: null
    });

    if (app.shouldUseMockFallback()) {
      var sceneTitle = keyword || '家庭场景';
      that.setData({
        loading: false,
        matchedScene: {
          sceneTitle: sceneTitle,
          sceneCategory: '场景建议',
          principleText: '先把场景说具体，再选一条今天就能做的动作。',
          suggestedAction: '先做一条最容易执行的家庭动作。'
        },
        sceneSolutions: [
          {
            type: 'solution_card',
            title: sceneTitle + '处理建议',
            summary: '先稳住节奏，再给孩子一个简单动作。',
            targetPath: ''
          }
        ],
        searchResults: [
          that.normalizeArticleCard({
            id: 'local_parenting_001',
            title: '孩子发脾气时，家里先怎么接',
            summary: '先确认感受，再给边界，执行会更稳。',
            category: '情绪管理',
            age_group: '4-5岁'
          })
        ]
      });
      return;
    }

    Promise.all([
      app.request({
        url: '/search/solutions',
        method: 'GET',
        data: Object.assign({ keyword: keyword }, sceneKey ? { sceneKey: sceneKey } : {}, ageGroup ? { ageGroup: ageGroup } : {}, coreQuery)
      }).catch(function() {
        return { matched: false, scene: null, solutions: [], articles: [] };
      }),
      app.request({
        url: '/parenting/search',
        method: 'GET',
        data: Object.assign({
          keyword: keyword || sceneKey,
          page: 1,
          page_size: that.data.pageSize
        }, ageGroup ? { age_group: ageGroup } : {}, category ? { category: category } : {}, coreQuery)
      }).catch(function() {
        return [];
      })
    ]).then(function(result) {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      var sceneResult = result[0] || {};
      var fallbackArticles = Array.isArray(sceneResult.articles) ? sceneResult.articles : [];
      var list = fallbackArticles.length ? fallbackArticles : (result[1] || []);
      list = list.map(function(item) {
        return that.normalizeArticleCard(item);
      });
      that.setData({
        matchedScene: sceneResult.scene || null,
        sceneSolutions: sceneResult.solutions || [],
        searchResults: list,
        hasMore: list.length >= that.data.pageSize,
        page: 2
      });
      if (sceneResult.scene) {
        that.trackSceneEvent('scene_search_exposure', {
          exposure_type: 'scene_result',
          matched_scene_key: sceneResult.scene.sceneKey || '',
          solution_count: Number((sceneResult.solutions || []).length),
          article_count: Number(list.length || 0)
        });
      }
    }).catch(function() {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      wx.showToast({ title: '没搜出来，请再试一次', icon: 'none' });
    }).finally(function() {
      if (requestSeq !== that.data.requestSeq) {
        return;
      }
      that.setData({ loading: false });
    });
  },

  onSceneTap: function(e) {
    var sceneKey = e.currentTarget.dataset.sceneKey;
    var sceneTitle = e.currentTarget.dataset.sceneTitle;
    this.saveSearchHistory(sceneTitle);
    this.trackSceneEvent('scene_search_submit', {
      submit_type: 'scene_tag',
      keyword: sceneTitle,
      matched_scene_key: sceneKey
    });
    this.doSearch({ sceneKey: sceneKey, keyword: sceneTitle });
  },

  onHistoryTap: function(e) {
    var keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword: keyword });
    this.doSearch({ keyword: keyword });
  },

  onHotKeywordTap: function(e) {
    var keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword: keyword });
    this.saveSearchHistory(keyword);
    this.trackSceneEvent('scene_search_submit', { submit_type: 'hot_keyword', keyword: keyword });
    this.doSearch({ keyword: keyword });
  },

  onClearHistory: function() {
    wx.removeStorageSync('parenting_search_history');
    this.setData({ searchHistory: [] });
  },

  onClearInput: function() {
    this.setData({
      keyword: '',
      showResults: false,
      searchResults: [],
      sceneSolutions: [],
      matchedScene: null
    });
  },

  onBackTap: function() {
    wx.navigateBack({
      fail: function() {
        wx.navigateTo({ url: '/pages/parenting/parenting' });
      }
    });
  },

  onArticleTap: function(e) {
    var articleId = e.currentTarget.dataset.id;
    if (!articleId) {
      return;
    }
    wx.navigateTo({
      url: '/pages/parenting/article-detail/article-detail?id=' + articleId
    });
  },

  onSolutionTap: function(e) {
    var targetPath = e.currentTarget.dataset.targetPath;
    if (!targetPath) {
      return;
    }
    this.trackSceneEvent('scene_solution_click', { target_path: targetPath });
    wx.navigateTo({
      url: targetPath,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onFavoriteTap: function(e) {
    var that = this;
    var articleId = e.currentTarget.dataset.id;
    var index = Number(e.currentTarget.dataset.index || 0);
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      return app.request({
        url: '/parenting/articles/' + articleId + '/favorite',
        method: 'POST'
      }).then(function() {
        var list = that.data.searchResults.slice();
        if (list[index]) {
          list[index].isFavorite = !list[index].isFavorite;
          that.setData({ searchResults: list });
        }
      });
    });
  }
});
