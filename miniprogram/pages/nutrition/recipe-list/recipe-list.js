// 食谱列表页面逻辑
var app = getApp();

Page({
  data: {
    // 分类列表
    categoryList: [
      { id: 0, name: '全部' },
      { id: 1, name: '早餐' },
      { id: 2, name: '午餐' },
      { id: 3, name: '晚餐' },
      { id: 4, name: '加餐' },
      { id: 5, name: '汤品' }
    ],
    // 年龄段列表
    ageList: [
      { id: 0, name: '全部年龄' },
      { id: 1, name: '6-12月' },
      { id: 2, name: '1-3岁' },
      { id: 3, name: '3-6岁' },
      { id: 4, name: '6-12岁' }
    ],
    // 当前选中的分类
    currentCategory: 0,
    // 当前选中的年龄段
    currentAge: 0,
    // 搜索关键词
    keyword: '',
    // 食谱列表
    recipeList: [],
    // 分页
    page: 1,
    pageSize: 10,
    hasMore: true,
    // 加载状态
    loading: false,
    // 筛选弹窗显示
    showFilter: false
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
        nutrition: { highlight: '易消化，适合早餐' },
        visualIcon: '🥣',
        imageLoaded: false,
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
        nutrition: { highlight: '高蛋白，补钙' },
        visualIcon: '🍲',
        imageLoaded: false,
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
        nutrition: { highlight: '优质蛋白，口感软嫩' },
        visualIcon: '🥚',
        imageLoaded: false,
        isFavorite: false
      }
    ];
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
    item.tags = item.tags || [item.category || '家常', '儿童友好'];
    item.visualIcon = item.visualIcon || this.getRecipeVisualIcon(item);
    item.hasImage = !!item.image;
    item.imageLoaded = false;
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
      difficulty: item.difficulty,
      visualIcon: item.visualIcon,
      image: item.image,
      hasImage: item.hasImage,
      imageLoaded: false,
      nutrition: item.nutrition ? { highlight: item.nutrition.highlight || '' } : { highlight: '' },
      is_favorited: item.is_favorited,
      isFavorite: item.isFavorite,
      viewCount: item.viewCount || 0,
      ageRange: item.ageRange
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

  buildRecipeTrackPayload: function(recipe, extra) {
    recipe = recipe || {};
    var baseEventMeta = {
      title: recipe.name || recipe.title || '',
      category: recipe.category || '',
      age_range: recipe.ageRange || recipe.age_range || '',
      page: 'nutrition_recipe_list'
    };
    var payload = Object.assign({
      module_key: 'nutrition_recipe',
      page_key: 'nutrition_recipe_list',
      content_type: 'recipe',
      content_id: String(recipe.id || ''),
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
  },

  cacheRecipeSnapshot: function(recipe) {
    if (!recipe || !recipe.id) {
      return;
    }
    wx.setStorageSync('nutritionRecipeSnapshot:' + recipe.id, this.buildRecipeSnapshot(recipe));
  },

  onLoad: function(options) {
    // 处理传入的参数
    if (options.categoryId) {
      this.setData({
        currentCategory: parseInt(options.categoryId)
      });
    }
    if (options.keyword) {
      this.setData({
        keyword: decodeURIComponent(options.keyword)
      });
    }
    if (options.type === 'hot') {
      // 热门食谱
      this.loadHotRecipes();
    } else {
      this.loadRecipes();
    }
  },

  // 加载食谱列表
  loadRecipes: function(fromPullDown) {
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
      params.age = that.data.ageList[that.data.currentAge].name;
    }
    if (that.data.keyword) {
      params.keyword = that.data.keyword;
    }

    if (app.shouldUseMockFallback()) {
      var list = that.getLocalRecipes().map(function(item) {
        return that.buildRecipeCardData(item);
      });
      that.setData({
        recipeList: that.data.page === 1 ? list : that.data.recipeList,
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
      url: '/nutrition/recipes',
      method: 'GET',
      data: params
    }).then(function(payload) {
      var list = (payload && payload.recipes) || [];
      if (!Array.isArray(list)) {
        list = [];
      }
      if (!list.length && that.data.page === 1) {
        list = that.getLocalRecipes();
      }
      list = list.map(function(item) {
        return that.buildRecipeCardData(item);
      });
      var newList = that.data.page === 1 ? list : that.data.recipeList.concat(list);
      that.setData({
        recipeList: newList,
        hasMore: list.length >= that.data.pageSize,
        page: that.data.page + 1
      });
    }).catch(function(err) {
      if (that.data.page === 1) {
        that.setData({
          recipeList: that.getLocalRecipes().map(function(item) {
            return that.buildRecipeCardData(item);
          }),
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
    var key = 'recipeList[' + index + '].imageLoaded';
    this.setData({
      [key]: true
    });
  },

  // 加载热门食谱
  loadHotRecipes: function() {
    var that = this;
    that.setData({
      loading: true
    });

    if (app.shouldUseMockFallback()) {
      that.setData({
        recipeList: that.getLocalRecipes().map(function(item) {
          return that.buildRecipeCardData(item);
        }),
        hasMore: false,
        loading: false
      });
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
      if (!list.length) {
        list = that.getLocalRecipes();
      }
      list = list.map(function(item) {
        return that.buildRecipeCardData(item);
      });
      that.setData({
        recipeList: list,
        hasMore: false
      });
    }).catch(function(err) {
      that.setData({
        recipeList: that.getLocalRecipes().map(function(item) {
          return that.buildRecipeCardData(item);
        }),
        hasMore: false
      });
    }).finally(function() {
      that.setData({
        loading: false
      });
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
      recipeList: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  // 年龄段选择
  onAgeChange: function(e) {
    var id = e.currentTarget.dataset.id;
    if (id === this.data.currentAge) {
      return;
    }
    this.setData({
      currentAge: id,
      recipeList: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  // 显示筛选弹窗
  showFilterPopup: function() {
    this.setData({
      showFilter: true
    });
  },

  // 隐藏筛选弹窗
  hideFilterPopup: function() {
    this.setData({
      showFilter: false
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
    this.setData({
      recipeList: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  // 清除搜索
  onClearSearch: function() {
    this.setData({
      keyword: '',
      recipeList: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes();
  },

  // 点击食谱
  onRecipeTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var index = e.currentTarget.dataset.index;
    var recipe = this.data.recipeList[index] || { id: id };
    app.trackKbEvent(this.buildRecipeTrackPayload(recipe, {
      event_type: 'recipe_entry_click',
      event_meta: {
        section: 'recipe_list',
        keyword: this.data.keyword || ''
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
    var recipe = that.data.recipeList[index];
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
      var recipeList = that.data.recipeList;
      recipeList[index].isFavorite = !isFavorite;
      that.setData({
        recipeList: recipeList
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
      recipeList: [],
      page: 1,
      hasMore: true
    });
    this.loadRecipes(true);
  },

  // 上拉加载更多
  onReachBottom: function() {
    this.loadRecipes();
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理',
      path: '/pages/index/index'
    };
  }
});
