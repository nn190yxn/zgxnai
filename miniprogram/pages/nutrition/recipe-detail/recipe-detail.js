// 食谱详情页面逻辑
var app = getApp();

Page({
  data: {
    // 食谱ID
    recipeId: 0,
    // 食谱详情
    recipe: null,
    // 是否收藏
    isFavorite: false,
    // 加载状态
    loading: true,
    // 图片加载状态
    imageLoaded: false
    ,
    offlineFallback: false
  },

  getLocalRecipeDetail: function(id) {
    var map = {
      local_nutrition_001: {
        id: 'local_nutrition_001',
        title: '小米南瓜粥',
        name: '小米南瓜粥',
        description: '南瓜香甜、小米软糯，适合早餐或晚餐，口感温和好入口。',
        category: '早餐',
        tags: ['早餐', '3-6岁'],
        cookTime: '35分钟',
        calories: '180卡',
        difficulty: '简单',
        ageRange: '3-6岁',
        ingredients: [
          { name: '小米', amount: '50g' },
          { name: '南瓜', amount: '100g' },
          { name: '清水', amount: '500ml' }
        ],
        steps: ['小米洗净浸泡', '南瓜切块', '先煮小米后加南瓜', '小火煮至软糯'],
        nutrition: { highlight: '易消化，适合早餐', protein: '4g', carbs: '32g', fat: '2g', fiber: '3g' },
        tips: '口味清淡，适合低龄儿童。',
        keywords: ['早餐', '粥'],
        visualIcon: '🥣',
        isFavorite: false
      },
      local_nutrition_002: {
        id: 'local_nutrition_002',
        title: '豆腐鱼头汤',
        name: '豆腐鱼头汤',
        description: '豆腐软嫩，汤味清淡，适合作为家庭正餐的蛋白质补充。',
        category: '汤品',
        tags: ['汤品', '3-6岁'],
        cookTime: '40分钟',
        calories: '220卡',
        difficulty: '中等',
        ageRange: '3-6岁',
        ingredients: [
          { name: '鱼头', amount: '半个' },
          { name: '豆腐', amount: '100g' },
          { name: '姜片', amount: '3片' }
        ],
        steps: ['鱼头煎香', '加开水煮汤', '放入豆腐炖煮', '少盐调味'],
        nutrition: { highlight: '高蛋白，补钙', protein: '18g', carbs: '5g', fat: '10g', fiber: '1g' },
        tips: '注意鱼刺处理，避免儿童误食。',
        keywords: ['汤品', '补钙'],
        visualIcon: '🍲',
        isFavorite: false
      },
      local_nutrition_003: {
        id: 'local_nutrition_003',
        title: '糯玉米蒸蛋',
        name: '糯玉米蒸蛋',
        description: '蒸蛋细腻，加入玉米粒提升咀嚼兴趣，适合加餐或早餐。',
        category: '早餐',
        tags: ['早餐', '3-6岁'],
        cookTime: '15分钟',
        calories: '160卡',
        difficulty: '简单',
        ageRange: '3-6岁',
        ingredients: [
          { name: '鸡蛋', amount: '1个' },
          { name: '糯玉米粒', amount: '30g' },
          { name: '温水', amount: '100ml' }
        ],
        steps: ['蛋液加温水打匀', '加入玉米粒', '中火蒸约10分钟'],
        nutrition: { highlight: '优质蛋白，口感软嫩', protein: '9g', carbs: '12g', fat: '7g', fiber: '2g' },
        tips: '蒸制时间不宜过长，避免口感变老。',
        keywords: ['早餐', '蒸蛋'],
        visualIcon: '🥚',
        isFavorite: false
      }
    };

    return map[id] || map.local_nutrition_001;
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
    item.difficulty = item.difficulty || '简单';
    item.ageRange = item.ageRange || item.age_range || '3-6岁';
    item.tags = item.tags || [item.category || '家常', '儿童友好'];
    item.visualIcon = item.visualIcon || this.getRecipeVisualIcon(item);
    item.hasImage = !!item.image;
    item.isFavorite = !!(item.is_favorited || item.isFavorite);
    if (item.dailyNutritionPercent && typeof item.dailyNutritionPercent === 'object') {
      var parts = [];
      if (item.dailyNutritionPercent.protein !== undefined) {
        parts.push('蛋白质约' + item.dailyNutritionPercent.protein + '%');
      }
      if (item.dailyNutritionPercent.calcium !== undefined) {
        parts.push('钙约' + item.dailyNutritionPercent.calcium + '%');
      }
      if (item.dailyNutritionPercent.iron !== undefined) {
        parts.push('铁约' + item.dailyNutritionPercent.iron + '%');
      }
      item.dailyNutritionPercent = parts.join('，');
    }
    return item;
  },

  buildRecipeTrackPayload: function(extra) {
    var recipe = this.data.recipe || {};
    var baseEventMeta = {
      title: recipe.name || recipe.title || '',
      category: recipe.category || '',
      page: 'nutrition_recipe_detail'
    };
    var payload = Object.assign({
      module_key: 'nutrition_recipe',
      page_key: 'nutrition_recipe_detail',
      content_type: 'recipe',
      content_id: String(this.data.recipeId || recipe.id || ''),
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
  },

  getCachedRecipeDetail: function(id) {
    if (!id) {
      return null;
    }
    return wx.getStorageSync('nutritionRecipeSnapshot:' + id) || null;
  },

  hasCompleteRecipeDetail: function(recipe) {
    return !!(recipe && recipe.ingredients && recipe.ingredients.length && recipe.nutrition);
  },

  onLoad: function(options) {
    if (options.id) {
      this.setData({
        recipeId: options.id
      });
      var cachedRecipe = this.getCachedRecipeDetail(options.id);
      if (cachedRecipe) {
        this.setData({
          recipe: this.normalizeRecipeForDisplay(cachedRecipe),
          isFavorite: !!(cachedRecipe.is_favorited || cachedRecipe.isFavorite),
          imageLoaded: false,
          offlineFallback: false,
          loading: false
        });
        app.trackKbEvent(this.buildRecipeTrackPayload({
          event_type: 'recipe_detail_view'
        }));
        if (!this.hasCompleteRecipeDetail(cachedRecipe)) {
          this.loadRecipeDetail({ silent: true });
        }
        return;
      }
      var fallbackRecipe = this.normalizeRecipeForDisplay(this.getLocalRecipeDetail(options.id));
      this.setData({
        recipe: fallbackRecipe,
        isFavorite: !!fallbackRecipe.isFavorite,
        imageLoaded: false,
        offlineFallback: true,
        loading: false
      });
      if (!String(options.id).startsWith('local_')) {
        this.loadRecipeDetail({ silent: true });
      }
    }
  },

  // 加载食谱详情
  loadRecipeDetail: function(options) {
    var that = this;
    var fromPullDown = !!options;
    var silent = false;
    if (typeof options === 'object' && options !== null) {
      fromPullDown = !!options.fromPullDown;
      silent = !!options.silent;
    }
    if (!silent) {
      that.setData({
        loading: true
      });
    }

    if (app.shouldUseMockFallback()) {
      var fallbackRecipe = that.normalizeRecipeForDisplay(that.getLocalRecipeDetail(that.data.recipeId));
      that.setData({
        recipe: fallbackRecipe,
        isFavorite: !!fallbackRecipe.isFavorite,
        offlineFallback: true,
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    app.request({
      url: '/nutrition/recipes/' + that.data.recipeId,
      method: 'GET',
      timeout: 30000
    }).then(function(recipe) {
      recipe = that.normalizeRecipeForDisplay(recipe || {});
      wx.setStorageSync('nutritionRecipeSnapshot:' + that.data.recipeId, recipe);
      that.setData({
        recipe: recipe,
        isFavorite: recipe.isFavorite,
        imageLoaded: false,
        offlineFallback: false
      });
      app.trackKbEvent(that.buildRecipeTrackPayload({
        event_type: 'recipe_detail_view'
      }));
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        if (!silent) {
          app.showApiError('食谱详情加载失败');
          that.setData({
            recipe: null,
            isFavorite: false,
            offlineFallback: false
          });
        }
        return;
      }
      var recipe = that.normalizeRecipeForDisplay(that.getLocalRecipeDetail(that.data.recipeId));
      that.setData({
        recipe: recipe,
        isFavorite: !!recipe.isFavorite,
        imageLoaded: false,
        offlineFallback: true
      });
    }).finally(function() {
      if (!silent) {
        that.setData({
          loading: false
        });
      }
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  // 切换收藏状态
  toggleFavorite: function() {
    var that = this;
    if (that._favoritePending) {
      return;
    }
    if (that.data.offlineFallback) {
      wx.showToast({
        title: '离线示例不可收藏',
        icon: 'none'
      });
      return;
    }
    var isFavorite = that.data.isFavorite;
    that._favoritePending = true;

    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }

      return app.request({
      url: '/nutrition/recipes/' + that.data.recipeId + '/favorite',
      method: 'POST'
    }).then(function() {
      var nextFavoriteState = !isFavorite;
      that.setData({
        isFavorite: nextFavoriteState
      });
      app.trackKbEvent(that.buildRecipeTrackPayload({
        event_type: nextFavoriteState ? 'recipe_favorite' : 'recipe_unfavorite',
        event_meta: {
          action: nextFavoriteState ? 'favorite' : 'unfavorite'
        }
      }));
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

  // 分享
  onShareAppMessage: function() {
    if (this.data.offlineFallback) {
      return {
        title: '小牛育儿营养食谱',
        path: '/pages/nutrition/nutrition'
      };
    }
    var recipe = this.data.recipe;
    if (recipe) {
      return {
        title: recipe.name + ' - 小牛育儿营养食谱',
        path: '/pages/nutrition/recipe-detail/recipe-detail?id=' + recipe.id,
        imageUrl: recipe.image || ''
      };
    }
    return {
      title: '小牛育儿营养食谱',
      path: '/pages/nutrition/nutrition'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    if (this.data.offlineFallback) {
      return {
        title: '小牛育儿营养食谱'
      };
    }
    var recipe = this.data.recipe;
    if (recipe) {
      return {
        title: recipe.name + ' - 小牛育儿营养食谱',
        query: 'id=' + recipe.id,
        imageUrl: recipe.image || ''
      };
    }
    return {
      title: '小牛育儿营养食谱'
    };
  },

  // 预览图片
  previewImage: function(e) {
    var url = e.currentTarget.dataset.url;
    var urls = [url];
    if (this.data.recipe && this.data.recipe.images) {
      urls = this.data.recipe.images;
    }
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 步骤切换
  onStepChange: function(e) {
    var index = e.currentTarget.dataset.index;
    this.setData({
      currentStep: index
    });
  },

  // 上一步
  prevStep: function() {
    var current = this.data.currentStep;
    if (current > 0) {
      this.setData({
        currentStep: current - 1
      });
    }
  },

  // 下一步
  nextStep: function() {
    var recipe = this.data.recipe;
    var current = this.data.currentStep;
    if (recipe && recipe.steps && current < recipe.steps.length - 1) {
      this.setData({
        currentStep: current + 1
      });
    }
  },

  // 复制食材清单
  copyIngredients: function() {
    var recipe = this.data.recipe;
    if (!recipe || !recipe.ingredients) {
      return;
    }
    
    var text = '【' + recipe.name + '】食材清单：\n';
    for (var i = 0; i < recipe.ingredients.length; i++) {
      var item = recipe.ingredients[i];
      text += (i + 1) + '. ' + item.name + '：' + item.amount + '\n';
    }
    
    wx.setClipboardData({
      data: text,
      success: function() {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.loadRecipeDetail({ fromPullDown: true });
  },

  // 图片加载完成
  onImageLoad: function() {
    this.setData({
      imageLoaded: true
    });
  }
});
