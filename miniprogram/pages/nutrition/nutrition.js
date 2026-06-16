// 营养中心页面逻辑
var app = getApp();

Page({
  data: {
    // 搜索关键词
    searchKeyword: '',
    // 分类列表
    categoryList: [
      {
        id: 1,
        icon: '\uD83C\uDF05',
        name: '早餐',
        desc: '营养早餐'
      },
      {
        id: 2,
        icon: '\u2600\uFE0F',
        name: '午餐',
        desc: '均衡午餐'
      },
      {
        id: 3,
        icon: '\uD83C\uDF19',
        name: '晚餐',
        desc: '清淡晚餐'
      },
      {
        id: 4,
        icon: '\uD83C\uDF6B',
        name: '加餐',
        desc: '健康零食'
      },
      {
        id: 5,
        icon: '\uD83E\uDD5B',
        name: '汤品',
        desc: '营养汤品'
      }
    ],
    // 今日推荐食谱
    todayRecommend: null,
    // 热门食谱列表
    hotRecipes: [],
    // 加载状态
    loading: true,
    initialized: false,
    loadError: ''
  },

  getLocalRecipes: function() {
    return [
      {
        id: 'local_nutrition_001',
        name: '小米南瓜粥',
        title: '小米南瓜粥',
        description: '南瓜香甜、小米软糯，适合早餐或晚餐，口感温和好入口。',
        category: '早餐',
        tags: ['早餐', '3-6岁'],
        cookTime: '35分钟',
        calories: '180卡',
        viewCount: 128,
        nutrition: { highlight: '易消化，适合早餐' },
        visualIcon: '🥣',
        isFavorite: false
      },
      {
        id: 'local_nutrition_002',
        name: '豆腐鱼头汤',
        title: '豆腐鱼头汤',
        description: '豆腐软嫩，汤味清淡，适合作为家庭正餐的蛋白质补充。',
        category: '汤品',
        tags: ['汤品', '3-6岁'],
        cookTime: '40分钟',
        calories: '220卡',
        viewCount: 96,
        nutrition: { highlight: '高蛋白，补钙' },
        visualIcon: '🍲',
        isFavorite: false
      },
      {
        id: 'local_nutrition_003',
        name: '糯玉米蒸蛋',
        title: '糯玉米蒸蛋',
        description: '蒸蛋细腻，加入玉米粒提升咀嚼兴趣，适合加餐或早餐。',
        category: '早餐',
        tags: ['早餐', '3-6岁'],
        cookTime: '15分钟',
        calories: '160卡',
        viewCount: 86,
        nutrition: { highlight: '优质蛋白，口感软嫩' },
        visualIcon: '🥚',
        isFavorite: false
      }
    ];
  },

  buildRecipeTrackPayload: function(recipe, extra) {
    recipe = recipe || {};
    var baseEventMeta = {
      title: recipe.name || recipe.title || '',
      category: recipe.category || '',
      age_range: recipe.ageRange || recipe.age_range || '',
      page: 'nutrition_home'
    };
    var payload = Object.assign({
      module_key: 'nutrition_recipe',
      page_key: 'nutrition_home',
      content_type: 'recipe',
      content_id: String(recipe.id || ''),
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
  },

  getRecipeVisualIcon: function(recipe) {
    var text = ((recipe && (recipe.category || recipe.name || recipe.title)) || '').toString();
    if (text.indexOf('汤') !== -1 || text.indexOf('粥') !== -1) return '🍲';
    if (text.indexOf('蛋') !== -1) return '🥚';
    if (text.indexOf('早餐') !== -1) return '🥣';
    if (text.indexOf('午餐') !== -1) return '🍱';
    if (text.indexOf('晚餐') !== -1) return '🍚';
    if (text.indexOf('加餐') !== -1) return '🍎';
    return '🍽️';
  },

  normalizeRecipeForDisplay: function(recipe) {
    var item = Object.assign({}, recipe || {});
    item.name = item.name || item.title || '营养食谱';
    item.description = item.description || item.desc || (item.nutrition && item.nutrition.highlight) || '适合家庭日常搭配，具体食材可按孩子接受度调整。';
    item.cookTime = item.cookTime || item.cook_time || '30分钟';
    item.calories = item.calories || '200卡';
    item.tags = item.tags || [item.category || '家常', '儿童友好'];
    item.visualIcon = item.visualIcon || this.getRecipeVisualIcon(item);
    item.hasImage = !!item.image;
    item.isFavorite = !!(item.is_favorited || item.isFavorite);
    return item;
  },

  buildRecipeCardData: function(recipe) {
    var item = this.normalizeRecipeForDisplay(recipe);
    return {
      id: item.id,
      title: item.title,
      name: item.name,
      description: item.description,
      desc: item.desc,
      category: item.category,
      tags: item.tags,
      cookTime: item.cookTime,
      calories: item.calories,
      visualIcon: item.visualIcon,
      image: item.image,
      hasImage: item.hasImage,
      nutrition: item.nutrition ? { highlight: item.nutrition.highlight || '' } : { highlight: '' },
      is_favorited: item.is_favorited,
      isFavorite: item.isFavorite,
      viewCount: item.viewCount || 0,
      ageRange: item.ageRange,
      difficulty: item.difficulty
    };
  },

  buildRecipeSnapshot: function(recipe) {
    if (!recipe) {
      return null;
    }
    return {
      id: recipe.id,
      title: recipe.title,
      name: recipe.name,
      description: recipe.description,
      desc: recipe.desc,
      category: recipe.category,
      tags: recipe.tags,
      ageRange: recipe.ageRange,
      cookTime: recipe.cookTime,
      calories: recipe.calories,
      difficulty: recipe.difficulty,
      visualIcon: recipe.visualIcon,
      image: recipe.image,
      nutrition: recipe.nutrition,
      ingredients: recipe.ingredients,
      tips: recipe.tips,
      nutrientCombination: recipe.nutrientCombination,
      dailyNutritionPercent: recipe.dailyNutritionPercent,
      is_favorited: recipe.is_favorited,
      isFavorite: recipe.isFavorite,
      viewCount: recipe.viewCount
    };
  },

  cacheRecipeSnapshot: function(recipe) {
    if (!recipe || !recipe.id) {
      return;
    }
    wx.setStorageSync('nutritionRecipeSnapshot:' + recipe.id, this.buildRecipeSnapshot(recipe));
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
      var fallback = that.getLocalRecipes();
      fallback = fallback.map(function(item) {
        return that.buildRecipeCardData(item);
      });
      that.setData({
        todayRecommend: fallback[0] || null,
        hotRecipes: fallback,
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
      url: '/nutrition/recommendations',
      method: 'GET'
    }).then(function(list) {
      list = list || [];
      if (!Array.isArray(list)) {
        list = [];
      }
      list = list.map(function(item) {
        return that.buildRecipeCardData(item);
      });
      that.setData({
        todayRecommend: list[0] || null,
        hotRecipes: list.slice(0, 6),
        loadError: ''
      });
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        var message = app.getApiErrorMessage(err, '营养推荐加载失败');
        that.setData({
          todayRecommend: null,
          hotRecipes: [],
          loadError: message
        });
        return;
      }
      var fallback = that.getLocalRecipes().map(function(item) {
        return that.buildRecipeCardData(item);
      });
      that.setData({
        todayRecommend: fallback[0] || null,
        hotRecipes: fallback,
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

  // 搜索输入
  onSearchInput: function(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  // 搜索确认
  onSearchConfirm: function() {
    var keyword = this.data.searchKeyword.trim();
    if (keyword) {
      wx.navigateTo({
        url: '/pages/nutrition/recipe-list/recipe-list?keyword=' + encodeURIComponent(keyword),
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    }
  },

  // 点击搜索框
  onSearchTap: function() {
    wx.navigateTo({
      url: '/pages/nutrition/recipe-list/recipe-list',
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
      url: '/pages/nutrition/recipe-list/recipe-list?categoryId=' + id + '&categoryName=' + encodeURIComponent(name),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 点击今日推荐
  onTodayRecommendTap: function() {
    var recipe = this.data.todayRecommend;
    if (recipe && recipe.id) {
      app.trackKbEvent(this.buildRecipeTrackPayload(recipe, {
        event_type: 'recipe_entry_click',
        event_meta: {
          section: 'today_recommend'
        }
      }));
      this.cacheRecipeSnapshot(recipe);
      wx.navigateTo({
        url: '/pages/nutrition/recipe-detail/recipe-detail?id=' + recipe.id,
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    }
  },

  // 点击热门食谱
  onRecipeTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var recipe = this.data.hotRecipes[index];
    app.trackKbEvent(this.buildRecipeTrackPayload(recipe, {
      event_type: 'recipe_entry_click',
      event_meta: {
        section: 'hot_recipes'
      }
    }));
    this.cacheRecipeSnapshot(recipe);
    wx.navigateTo({
      url: '/pages/nutrition/recipe-detail/recipe-detail?id=' + id,
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
    var recipe = that.data.hotRecipes[index];
    var isFavorite = recipe.isFavorite;
    that._favoritePending = true;

    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }

      return app.request({
      url: '/nutrition/recipes/' + id + '/favorite',
      method: 'POST'
    }).then(function() {
      var hotRecipes = that.data.hotRecipes;
      hotRecipes[index].isFavorite = !isFavorite;
      that.setData({
        hotRecipes: hotRecipes
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

  // 查看更多热门食谱
  onMoreHotTap: function() {
    wx.navigateTo({
      url: '/pages/nutrition/recipe-list/recipe-list?type=hot',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    if (this.data.loading) {
      wx.stopPullDownRefresh();
      return;
    }
    this.loadData(true);
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理',
      path: '/pages/index/index'
    };
  }
});
