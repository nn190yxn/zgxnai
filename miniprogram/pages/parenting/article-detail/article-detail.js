// 文章详情页面逻辑
var app = getApp();

Page({
  data: {
    // 文章ID
    articleId: 0,
    // 文章详情
    article: null,
    // 是否收藏
    isFavorite: false,
    // 是否点赞
    isLiked: false,
    // 点赞数
    likeCount: 0,
    // 评论列表
    comments: [],
    // 评论输入内容
    commentText: '',
    // 相关文章
    relatedArticles: [],
    // 加载状态
    loading: true,
    // 图片加载状态
    imageLoaded: false
    ,
    offlineFallback: false,
    contentBlocks: []
  },

  getLocalArticleDetail: function(id) {
    var map = {
      local_parenting_001: {
        id: 'local_parenting_001',
        title: '4-5岁孩子情绪表达的4个引导技巧',
        summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
        content: '## 核心结论\n\n先接住情绪，再引导行为，孩子更容易从哭闹转回可表达状态。\n\n## 家庭操作步骤\n\n1. 先说出你看到的情绪，不急着追问原因。\n2. 用一句短话替孩子命名感受，例如“你现在有点生气”。\n3. 再补清楚边界，例如“可以生气，手不能打人”。\n4. 最后给一个可执行选择，例如“你想先抱一下，还是先喝口水”。\n\n## 家长观察重点\n\n- 孩子能否在提醒下说出一个情绪词\n- 情绪最强时能否接受你靠近\n- 说出感受后升级速度有没有变慢\n\n【家长提示】先共情，再立边界，短句最有用。',
        keyPoints: ['先共情后引导', '允许表达但设边界', '重复练习情绪词汇'],
        category: '情绪管理',
        age_group: '4-5岁',
        isFavorite: false
      },
      local_parenting_002: {
        id: 'local_parenting_002',
        title: '建立睡前流程：让孩子更快入睡',
        summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
        content: '## 核心结论\n\n睡前流程越固定，孩子越容易从兴奋切回安静。\n\n## 家庭操作步骤\n\n1. 固定洗漱、阅读、关灯三个顺序。\n2. 尽量每天在相近时间开始，不临时大幅推迟。\n3. 睡前半小时把屏幕、追逐和大声提醒一起降下来。\n4. 入睡前只保留一个收尾动作，例如拥抱、晚安句或轻拍。\n\n## 家长观察重点\n\n- 哪一步最容易拖拉\n- 流程固定后入睡时间有没有缩短\n- 睡前情绪是不是比以前更平稳\n\n【家长提示】睡前先求节奏稳定，再求一步做到完美。',
        keyPoints: ['流程固定', '减少睡前刺激', '保持卧室光线柔和'],
        category: '行为习惯',
        age_group: '5-6岁',
        isFavorite: false
      },
      local_parenting_003: {
        id: 'local_parenting_003',
        title: '同伴冲突时，家长如何做“翻译官”',
        summary: '把争抢背后的需求说出来，帮助孩子学习社交协商。',
        content: '## 核心结论\n\n冲突刚发生时先翻译需求，孩子更容易从争抢回到协商。\n\n## 家庭操作步骤\n\n1. 先把动作停下来，减少推搡和抢夺继续升级。\n2. 分别说出两个孩子现在想要什么。\n3. 用一句短话示范表达需求，例如“我还想再玩两分钟”。\n4. 再给一个可执行方案，例如轮流、等待或交换。\n\n## 家长观察重点\n\n- 冲突是否总在同类玩具或固定时段发生\n- 孩子能不能从拉扯转成开口说需求\n- 给出方案后能否接受短暂等待\n\n【家长提示】先翻译需求，再谈规则，协商会顺很多。',
        keyPoints: ['先分开情绪', '表达需求', '给出协商方案'],
        category: '社交能力',
        age_group: '4-5岁',
        isFavorite: false
      },
      local_parenting_004: {
        id: 'local_parenting_004',
        title: '早餐营养搭配：让早晨吃进去，也吃得稳',
        summary: '主食、蛋白和蔬果搭配得当，更有利于上午精力稳定。',
        content: '## 核心结论\n\n早餐先稳住主食和蛋白，孩子上午更容易保持精力和平稳状态。\n\n## 家庭操作步骤\n\n1. 先保证孩子早晨愿意吃进去的一种主食。\n2. 每天至少配一种蛋白来源，例如鸡蛋、奶、豆制品或肉类。\n3. 再按接受度补一小份水果或蔬菜。\n4. 高糖饮料和纯甜口食物尽量少占早餐主位。\n\n## 家长观察重点\n\n- 哪类早餐最容易真正吃进去\n- 加上蛋白后上午饿得是否更慢\n- 甜饮和零食有没有挤掉正餐位置\n\n【家长提示】早餐先求稳，再慢慢加花样。',
        keyPoints: ['先保证吃进去', '每餐补一种蛋白', '高糖饮料少介入'],
        category: '营养健康',
        age_group: '5-6岁',
        isFavorite: false
      },
      local_parenting_005: {
        id: 'local_parenting_005',
        title: '专注力环境搭建：先减干扰，再谈坚持',
        summary: '把材料和任务长度一起收窄，孩子更容易进入专注状态。',
        content: '## 核心结论\n\n先把环境和任务收窄，孩子更容易真正进入专注。\n\n## 家庭操作步骤\n\n1. 桌面只保留当前这项任务要用到的材料。\n2. 任务时间先短后长，例如先从5分钟开始。\n3. 完成一小段就立刻给具体反馈，例如“你刚才一直在看这页内容”。\n4. 每次只改一个变量，例如先减噪音，再调整任务长度。\n\n## 家长观察重点\n\n- 哪种干扰最容易让孩子分心\n- 多久是当前最合适的任务时长\n- 具体反馈后孩子愿不愿意继续下一轮\n\n【家长提示】专注力先靠环境托住，再慢慢练持续时间。',
        keyPoints: ['单任务环境', '任务拆短', '完成后即时反馈'],
        category: '认知发展',
        age_group: '5-6岁',
        isFavorite: false
      }
    };

    return map[id] || map.local_parenting_001;
  },

  getLocalRelatedArticles: function(currentId) {
    return [
      { id: 'local_parenting_001', title: '4-5岁孩子情绪表达的4个引导技巧' },
      { id: 'local_parenting_002', title: '建立睡前流程：让孩子更快入睡' },
      { id: 'local_parenting_003', title: '同伴冲突时，家长如何做“翻译官”' },
      { id: 'local_parenting_004', title: '早餐营养搭配：让早晨吃进去，也吃得稳' },
      { id: 'local_parenting_005', title: '专注力环境搭建：先减干扰，再谈坚持' }
    ].filter(function(item) {
      return item.id !== currentId;
    });
  },

  sanitizeRichText: function(content) {
    var html = String(content || '');
    html = html.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    html = html.replace(/<(iframe|object|embed|form|meta|link)[\s\S]*?>[\s\S]*?<\/(iframe|object|embed|form)>/gi, '');
    html = html.replace(/<(iframe|object|embed|form|meta|link)[^>]*?>/gi, '');
    html = html.replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '');
    html = html.replace(/\s(href|src)\s*=\s*(["'])javascript:[\s\S]*?\2/gi, '');
    html = html.replace(/\s(href|src)\s*=\s*(["'])vbscript:[\s\S]*?\2/gi, '');
    html = html.replace(/\sstyle\s*=\s*(["'])[\s\S]*?expression\([\s\S]*?\)\1/gi, '');
    html = html.replace(/\sstyle\s*=\s*(["'])[\s\S]*?url\([\s\S]*?javascript:[\s\S]*?\)\1/gi, '');
    return html;
  },

  stripContentMarkup: function(content) {
    var text = String(content || '');
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<\/(p|div|section|article|h1|h2|h3|li)>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
    return text;
  },

  getBlockTheme: function(type) {
    var themes = {
      heading: 'warm',
      subheading: 'warm',
      bullet: 'leaf',
      ordered: 'sky',
      quote: 'soft',
      tip: 'gold',
      paragraph: 'plain',
      lead: 'plain'
    };
    return themes[type] || 'plain';
  },

  makeContentBlock: function(type, text, extra) {
    var block = Object.assign({
      type: type,
      text: String(text || '').trim(),
      theme: this.getBlockTheme(type)
    }, extra || {});
    return block.text || block.title || block.body ? block : null;
  },

  parseArticleContent: function(content) {
    var that = this;
    var text = that.stripContentMarkup(content);
    var lines = text.split(/\r?\n/);
    var blocks = [];
    var paragraphBuffer = [];

    function pushParagraph() {
      var paragraph = paragraphBuffer.join('').replace(/\s+/g, ' ').trim();
      paragraphBuffer = [];
      if (!paragraph) {
        return;
      }
      var blockType = blocks.length === 0 && paragraph.length <= 120 ? 'lead' : 'paragraph';
      var block = that.makeContentBlock(blockType, paragraph);
      if (block) {
        blocks.push(block);
      }
    }

    function pushBlock(type, value, extra) {
      pushParagraph();
      var block = that.makeContentBlock(type, value, extra);
      if (block) {
        blocks.push(block);
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i] || '';
      var line = rawLine.trim();
      if (!line) {
        pushParagraph();
        continue;
      }

      var h2 = line.match(/^##\s+(.+)$/);
      var h3 = line.match(/^###\s+(.+)$/);
      var bullet = line.match(/^[-*]\s+(.+)$/);
      var ordered = line.match(/^(\d+)[\.、]\s+(.+)$/);
      var bracket = line.match(/^【([^】]{2,18})】\s*(.*)$/);

      if (h2) {
        pushBlock('heading', h2[1]);
      } else if (h3) {
        pushBlock('subheading', h3[1]);
      } else if (bullet) {
        pushBlock('bullet', bullet[1]);
      } else if (ordered) {
        pushBlock('ordered', ordered[2], { indexText: ordered[1] });
      } else if (bracket) {
        pushParagraph();
        blocks.push({
          type: 'tip',
          title: bracket[1],
          body: bracket[2],
          text: bracket[2],
          theme: 'gold'
        });
      } else if (/^(提示|注意|建议|专家提示|重点)[:：]/.test(line)) {
        pushBlock('quote', line);
      } else {
        paragraphBuffer.push(line);
      }
    }

    pushParagraph();
    return blocks;
  },

  normalizeArticleForDisplay: function(article) {
    article = article || {};
    article.keyPoints = article.key_points || article.keyPoints || [];
    article.categoryName = article.categoryName || article.category || '';
    article.subCategoryName = article.subCategoryName || article.sub_category || '';
    article.ageRange = article.ageRange || article.age_group || '';
    article.evidenceLevelText = this.getEvidenceLevelText(article.evidence_level || article.evidenceLevel || '');
    article.viewCount = typeof article.viewCount === 'number' ? article.viewCount : Number(article.read_count || article.viewCount || 0);
    article.publishTime = article.publishTime || article.created_at || '';
    article.content = this.sanitizeRichText(article.content);
    article.isFavorite = !!(article.is_favorited || article.isFavorite);
    return article;
  },

  getEvidenceLevelText: function(level) {
    var normalized = String(level || '').trim();
    if (!normalized) {
      return '';
    }
    var map = {
      high: '高证据支持',
      medium: '实践验证',
      low: '观察建议',
      expert: '专家建议'
    };
    return map[normalized] || normalized;
  },

  buildArticleTrackPayload: function(extra) {
    var article = this.data.article || {};
    var baseEventMeta = {
      title: article.title || '',
      category: article.category || '',
      page: 'parenting_article_detail'
    };
    var payload = Object.assign({
      module_key: 'knowledge',
      page_key: 'parenting_article_detail',
      content_type: 'article',
      content_id: String(this.data.articleId || article.id || ''),
      event_meta: baseEventMeta
    }, extra || {});
    payload.event_meta = Object.assign(baseEventMeta, (extra && extra.event_meta) || {});
    return payload;
  },

  onLoad: function(options) {
    var articleId = options && options.id;
    if (!articleId) {
      this.setData({
        loading: false,
        article: null,
        relatedArticles: []
      });
      wx.showToast({
        title: '文章参数缺失',
        icon: 'none'
      });
      if (getCurrentPages().length > 1) {
        wx.navigateBack();
      }
      return;
    }

    this.setData({
      articleId: articleId
    });
    this.loadArticleDetail();
    this.loadRelatedArticles();
  },

  // 加载文章详情
  loadArticleDetail: function(fromPullDown) {
    var that = this;
    that.setData({
      loading: true
    });

    if (String(that.data.articleId || '').indexOf('local_parenting_') === 0) {
      var localArticle = that.normalizeArticleForDisplay(that.getLocalArticleDetail(that.data.articleId));
      that.setData({
        article: localArticle,
        contentBlocks: that.parseArticleContent(localArticle.content),
        isFavorite: !!localArticle.isFavorite,
        offlineFallback: true,
        loading: false
      });
      wx.setNavigationBarTitle({
        title: localArticle.title || '文章详情'
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    if (app.shouldUseMockFallback()) {
      var fallbackArticle = that.normalizeArticleForDisplay(that.getLocalArticleDetail(that.data.articleId));
      that.setData({
        article: fallbackArticle,
        contentBlocks: that.parseArticleContent(fallbackArticle.content),
        isFavorite: !!fallbackArticle.isFavorite,
        offlineFallback: true,
        loading: false
      });
      wx.setNavigationBarTitle({
        title: fallbackArticle.title || '文章详情'
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    app.request({
      url: '/parenting/articles/' + that.data.articleId,
      method: 'GET'
    }).then(function(article) {
      article = that.normalizeArticleForDisplay(article);
      that.setData({
        article: article,
        contentBlocks: that.parseArticleContent(article.content),
        isFavorite: article.isFavorite,
        offlineFallback: false
      });
      wx.setNavigationBarTitle({
        title: article.title || '文章详情'
      });
      app.trackKbEvent(that.buildArticleTrackPayload({
        event_type: 'article_detail_view'
      }));
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        app.showApiError('文章详情加载失败');
        that.setData({
          article: null,
          isFavorite: false,
          offlineFallback: false
        });
        return;
      }
      var article = that.normalizeArticleForDisplay(that.getLocalArticleDetail(that.data.articleId));
      that.setData({
        article: article,
        contentBlocks: that.parseArticleContent(article.content),
        isFavorite: !!article.isFavorite,
        offlineFallback: true
      });
      wx.setNavigationBarTitle({
        title: article.title || '文章详情'
      });
    }).finally(function() {
      that.setData({
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  // 加载相关文章
  loadRelatedArticles: function() {
    var that = this;
    if (that._relatedArticlesLoading) {
      return;
    }
    
    // 本地文章不请求相关文章
    if (String(that.data.articleId || '').indexOf('local_parenting_') === 0) {
      that.setData({
        relatedArticles: that.getLocalRelatedArticles(that.data.articleId)
      });
      return;
    }

    if (app.shouldUseMockFallback()) {
      that.setData({
        relatedArticles: that.getLocalRelatedArticles(that.data.articleId)
      });
      return;
    }
    that._relatedArticlesLoading = true;
    
    app.request({
      url: '/parenting/articles/' + that.data.articleId + '/related',
      method: 'GET'
    }).then(function(list) {
      that.setData({
        relatedArticles: list || []
      });
    }).catch(function(err) {
      if (app.shouldUseMockFallback()) {
        that.setData({
          relatedArticles: that.getLocalRelatedArticles(that.data.articleId)
        });
        return;
      }
      that.setData({
        relatedArticles: []
      });
    }).finally(function() {
      that._relatedArticlesLoading = false;
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
      url: '/parenting/articles/' + that.data.articleId + '/favorite',
      method: 'POST'
    }).then(function() {
      var nextFavoriteState = !isFavorite;
      that.setData({
        isFavorite: nextFavoriteState
      });
      app.trackKbEvent(that.buildArticleTrackPayload({
        event_type: nextFavoriteState ? 'article_favorite' : 'article_unfavorite',
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
        title: app.buildShareTitle('parenting'),
        path: '/pages/parenting/parenting'
      };
    }
    var article = this.data.article;
    if (article) {
      var payload = {
        title: app.buildShareTitle('article_detail', { title: article.title }),
        path: '/pages/parenting/article-detail/article-detail?id=' + article.id
      };
      if (article.cover) {
        payload.imageUrl = article.cover;
      }
      return payload;
    }
    return {
      title: app.buildShareTitle('parenting'),
      path: '/pages/parenting/parenting'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    if (this.data.offlineFallback) {
      return {
        title: app.buildShareTitle('parenting')
      };
    }
    var article = this.data.article;
    if (article) {
      var payload = {
        title: app.buildShareTitle('article_detail', { title: article.title }),
        query: 'id=' + article.id
      };
      if (article.cover) {
        payload.imageUrl = article.cover;
      }
      return payload;
    }
    return {
      title: app.buildShareTitle('parenting')
    };
  },

  // 点击相关文章
  onRelatedArticleTap: function(e) {
    var id = e.currentTarget.dataset.id;
    var relatedArticles = this.data.relatedArticles || [];
    var targetArticle = null;
    for (var i = 0; i < relatedArticles.length; i++) {
      if (String(relatedArticles[i].id || '') === String(id || '')) {
        targetArticle = relatedArticles[i];
        break;
      }
    }
    app.trackKbEvent(this.buildArticleTrackPayload(targetArticle || { id: id }, {
      event_type: 'article_entry_click',
      event_meta: {
        page: 'parenting_article_detail',
        section: 'related_articles',
        source_article_id: String(this.data.articleId || '')
      }
    }));
    wx.redirectTo({
      url: '/pages/parenting/article-detail/article-detail?id=' + id,
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 预览图片
  onImagePreview: function(e) {
    var url = e.currentTarget.dataset.url;
    var article = this.data.article;
    var urls = [url];
    if (article && article.images && article.images.length > 0) {
      urls = article.images;
    }
    wx.previewImage({
      current: url,
      urls: urls
    });
  },

  // 复制关键要点
  copyKeyPoints: function() {
    var article = this.data.article;
    if (!article || !article.keyPoints || article.keyPoints.length === 0) {
      return;
    }
    
    var text = '【' + article.title + '】关键要点：\n';
    for (var i = 0; i < article.keyPoints.length; i++) {
      text += (i + 1) + '. ' + article.keyPoints[i] + '\n';
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
    if (this.data.loading) {
      wx.stopPullDownRefresh();
      return;
    }
    this.loadArticleDetail(true);
    this.loadRelatedArticles();
    this.loadComments();
  },

  // 加载评论列表
  loadComments: function() {
    var that = this;
    if (that._commentsLoading) {
      return;
    }
    if (String(that.data.articleId || '').indexOf('local_parenting_') === 0) {
      that.setData({ comments: [] });
      return;
    }
    that._commentsLoading = true;
    
    app.request({
      url: '/parenting/articles/' + that.data.articleId + '/comments',
      method: 'GET'
    }).then(function(res) {
      if (res && res.data) {
        that.setData({ comments: res.data || [] });
      }
    }).catch(function(err) {
      if (app.globalData.isDebug) console.log('获取评论失败', err);
    }).finally(function() {
      that._commentsLoading = false;
    });
  },

  // 切换点赞
  toggleLike: function() {
    var that = this;
    if (that._likePending) {
      return;
    }
    if (that.data.offlineFallback) {
      wx.showToast({ title: '离线示例不可点赞', icon: 'none' });
      return;
    }

    that._likePending = true;
    app.request({
      url: '/parenting/articles/' + that.data.articleId + '/like',
      method: 'POST'
    }).then(function(res) {
      if (res && res.data) {
        var nextLikedState = !!(res.data.isLiked || res.data.is_liked);
        that.setData({
          isLiked: nextLikedState,
          likeCount: res.data.like_count || 0
        });
        app.trackKbEvent(that.buildArticleTrackPayload({
          event_type: nextLikedState ? 'article_like' : 'article_unlike',
          event_meta: {
            action: nextLikedState ? 'like' : 'unlike',
            like_count: res.data.like_count || 0
          }
        }));
        wx.showToast({
          title: nextLikedState ? '已点赞' : '已取消',
          icon: 'success'
        });
      }
    }).catch(function() {
      wx.showToast({ title: '点赞失败', icon: 'none' });
    }).finally(function() {
      that._likePending = false;
    });
  },

  // 评论输入
  onCommentInput: function(e) {
    this.setData({ commentText: e.detail.value });
  },

  // 提交评论
  submitComment: function() {
    var that = this;
    if (that._commentPending) {
      return;
    }
    var content = that.data.commentText;
    if (!content || !content.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    
    if (that.data.offlineFallback) {
      wx.showToast({ title: '离线示例不可评论', icon: 'none' });
      return;
    }

    that._commentPending = true;
    app.request({
      url: '/parenting/articles/' + that.data.articleId + '/comments',
      method: 'POST',
      data: { content: content.trim() }
    }).then(function() {
      app.trackKbEvent(that.buildArticleTrackPayload({
        event_type: 'article_comment',
        event_meta: {
          action: 'comment'
        }
      }));
      wx.showToast({ title: '评论成功', icon: 'success' });
      that.setData({ commentText: '' });
      that.loadComments();
    }).catch(function() {
      wx.showToast({ title: '评论失败', icon: 'none' });
    }).finally(function() {
      that._commentPending = false;
    });
  },

  // 图片加载完成
  onImageLoad: function() {
    this.setData({
      imageLoaded: true
    });
  }
});
