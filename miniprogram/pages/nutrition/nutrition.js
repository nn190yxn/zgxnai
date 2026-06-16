// 营养中心页面逻辑
var app = getApp();

Page({
  data: {
    // 搜索关键词
    searchKeyword: '',
    currentAgeGroup: '',
    ageOptions: [
      { id: 'all', name: '全部年龄', value: '' },
      { id: '1-2', name: '1-2岁', value: '1-2岁' },
      { id: '2-3', name: '2-3岁', value: '2-3岁' },
      { id: '3-4', name: '3-4岁', value: '3-4岁' },
      { id: '4-5', name: '4-5岁', value: '4-5岁' },
      { id: '5-6', name: '5-6岁', value: '5-6岁' },
      { id: '6-7', name: '6-7岁', value: '6-7岁' },
      { id: '7-8', name: '7-8岁', value: '7-8岁' },
      { id: '8-12', name: '8-12岁', value: '8-12岁' },
      { id: '12+', name: '12岁以上', value: '12岁以上' }
    ],
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
    nutritionAdviceList: [],
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

  getSelectedAgeLabel: function() {
    var ageGroup = this.data.currentAgeGroup || '';
    var option = (this.data.ageOptions || []).find(function(item) {
      return item.value === ageGroup;
    });
    return option ? option.name : '全部年龄';
  },

  syncAgeGroupFromCurrentChild: function() {
    var child = app.getCurrentChild ? app.getCurrentChild() : null;
    var nextAgeGroup = app.inferNutritionAgeGroup ? app.inferNutritionAgeGroup(child) : '';
    if (nextAgeGroup === this.data.currentAgeGroup) {
      return false;
    }
    this.setData({
      currentAgeGroup: nextAgeGroup
    });
    return true;
  },

  getNutritionAdviceProfile: function(ageGroup) {
    var value = String(ageGroup || '').trim();
    if (!value) {
      return {
        title: '先按孩子年龄切换，再看更贴近的搭配',
        focus: '先确定年龄段，再看对应食谱和提醒，执行会更稳。',
        action: '先保留孩子愿意吃的一类食物，再补主食、蛋白质和蔬菜。'
      };
    }
    if (value === '1-2岁' || value === '2-3岁') {
      return {
        title: value + '更看重质地过渡、稳定接受和规律进餐',
        focus: '这阶段先稳住软烂质地、咀嚼过渡和固定餐次，比追求吃得多更重要。',
        action: '优先保留1种孩子熟悉食物，再补1种蛋白质和1种蔬菜，连续观察接受度再扩种类。'
      };
    }
    if (value === '3-4岁' || value === '4-5岁' || value === '5-6岁') {
      return {
        title: value + '更适合练自主进食、餐桌规则和食物多样性',
        focus: '这阶段适合保留可咀嚼口感，稳定早餐和正餐节奏，让孩子练习自己收尾一餐。',
        action: '早餐先稳主食加蛋白，午晚餐保留熟悉食物打底，再加入1种新蔬菜或新做法。'
      };
    }
    return {
      title: value + '更需要稳定能量、优质蛋白和生长支持',
      focus: '这阶段饮食更适合覆盖学习日常、户外活动、持续饱腹感和骨骼发育支持。',
      action: '每餐优先保证主食、蛋白质、蔬菜同餐出现，早餐和放学后补给都要控制高糖零食占比。'
    };
  },

  buildNutritionAdviceList: function(recipes) {
    var list = recipes || [];
    var ageLabel = this.getSelectedAgeLabel();
    var profile = this.getNutritionAdviceProfile(this.data.currentAgeGroup);
    var adviceList = [
      {
        id: 'profile',
        badge: ageLabel,
        title: profile.title,
        content: profile.focus
      },
      {
        id: 'routine',
        badge: '执行建议',
        title: '今天先抓一顿最容易落地的饭',
        content: profile.action
      }
    ];
    if (list[0]) {
      adviceList.push({
        id: 'recipe-highlight',
        badge: list[0].category || '推荐食谱',
        title: '优先试试：' + (list[0].name || list[0].title || '家常搭配'),
        content: list[0].depthSummary || (list[0].feedingAdvice && list[0].feedingAdvice[0]) || (list[0].nutrition && list[0].nutrition.highlight) || list[0].tips || list[0].description || '先从孩子接受度更高的食材开始。'
      });
    }
    if (list[1]) {
      adviceList.push({
        id: 'recipe-tip',
        badge: '家长提醒',
        title: '第二选择：' + (list[1].name || list[1].title || '家庭补充搭配'),
        content: (list[1].safetyWarnings && list[1].safetyWarnings[0]) || (list[1].pairingAdvice && list[1].pairingAdvice[0]) || list[1].tips || (list[1].nutrition && list[1].nutrition.highlight) || list[1].description || '连续观察 3 天，比一天换很多做法更容易判断效果。'
      });
    }
    return adviceList.slice(0, 3);
  },

  buildAgeQueryString: function() {
    return this.data.currentAgeGroup ? ('?age_group=' + encodeURIComponent(this.data.currentAgeGroup)) : '';
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
      tips: item.tips || '',
      depthSummary: item.depthSummary || '',
      suitableScene: item.suitableScene || '',
      feedingAdvice: item.feedingAdvice || [],
      safetyWarnings: item.safetyWarnings || [],
      pairingAdvice: item.pairingAdvice || [],
      substitutionAdvice: item.substitutionAdvice || '',
      ageFocus: item.ageFocus || '',
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
      depthSummary: recipe.depthSummary,
      suitableScene: recipe.suitableScene,
      feedingAdvice: recipe.feedingAdvice,
      safetyWarnings: recipe.safetyWarnings,
      pairingAdvice: recipe.pairingAdvice,
      substitutionAdvice: recipe.substitutionAdvice,
      ageFocus: recipe.ageFocus,
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
    this.syncAgeGroupFromCurrentChild();
    this.loadData();
  },

  onShow: function() {
    var ageChanged = this.syncAgeGroupFromCurrentChild();
    // 避免首屏 onLoad + onShow 重复请求
    if (!this.data.initialized) {
      return;
    }
    if (ageChanged) {
      this.loadData();
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
        hotRecipes: fallback.slice(1, 7),
        nutritionAdviceList: that.buildNutritionAdviceList(fallback),
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
      method: 'GET',
      data: Object.assign({ count: 8 }, that.data.currentAgeGroup ? { age_group: that.data.currentAgeGroup } : {})
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
        hotRecipes: list.slice(1, 7),
        nutritionAdviceList: that.buildNutritionAdviceList(list),
        loadError: ''
      });
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        var message = app.getApiErrorMessage(err, '营养推荐加载失败');
        that.setData({
          todayRecommend: null,
          hotRecipes: [],
          nutritionAdviceList: [],
          loadError: message
        });
        return;
      }
      var fallback = that.getLocalRecipes().map(function(item) {
        return that.buildRecipeCardData(item);
      });
      that.setData({
        todayRecommend: fallback[0] || null,
        hotRecipes: fallback.slice(1, 7),
        nutritionAdviceList: that.buildNutritionAdviceList(fallback),
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

  onAgeOptionTap: function(e) {
    var ageGroup = e.currentTarget.dataset.value || '';
    if (ageGroup === this.data.currentAgeGroup) {
      return;
    }
    this.setData({
      currentAgeGroup: ageGroup
    });
    this.loadData();
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
        url: '/pages/nutrition/recipe-list/recipe-list?keyword=' + encodeURIComponent(keyword) + (this.data.currentAgeGroup ? '&age_group=' + encodeURIComponent(this.data.currentAgeGroup) : ''),
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    }
  },

  // 点击搜索框
  onSearchTap: function() {
    wx.navigateTo({
      url: '/pages/nutrition/recipe-list/recipe-list' + this.buildAgeQueryString(),
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
      url: '/pages/nutrition/recipe-list/recipe-list?categoryId=' + id + '&categoryName=' + encodeURIComponent(name) + (this.data.currentAgeGroup ? '&age_group=' + encodeURIComponent(this.data.currentAgeGroup) : ''),
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
        url: '/pages/nutrition/recipe-detail/recipe-detail?id=' + recipe.id + (this.data.currentAgeGroup ? '&age_group=' + encodeURIComponent(this.data.currentAgeGroup) : ''),
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
      url: '/pages/nutrition/recipe-detail/recipe-detail?id=' + id + (this.data.currentAgeGroup ? '&age_group=' + encodeURIComponent(this.data.currentAgeGroup) : ''),
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
      url: '/pages/nutrition/recipe-list/recipe-list?type=hot' + (this.data.currentAgeGroup ? '&age_group=' + encodeURIComponent(this.data.currentAgeGroup) : ''),
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
