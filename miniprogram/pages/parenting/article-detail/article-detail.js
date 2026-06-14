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
        title: '3-6岁孩子情绪表达的4个引导技巧',
        summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
        content: '先接住情绪，再引导行为。家长可通过描述感受、提供选择来帮助孩子表达。',
        keyPoints: ['先共情后引导', '允许表达但设边界', '重复练习情绪词汇'],
        category: '情绪管理',
        age_group: '3-6岁',
        isFavorite: false
      },
      local_parenting_002: {
        id: 'local_parenting_002',
        title: '建立睡前流程：让孩子更快入睡',
        summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
        content: '固定洗漱、阅读、关灯顺序，尽量每天同一时间执行。',
        keyPoints: ['流程固定', '减少睡前刺激', '保持卧室光线柔和'],
        category: '行为习惯',
        age_group: '3-6岁',
        isFavorite: false
      },
      local_parenting_003: {
        id: 'local_parenting_003',
        title: '同伴冲突时，家长如何做“翻译官”',
        summary: '把争抢背后的需求说出来，帮助孩子学习社交协商。',
        content: '帮助孩子说出需求和感受，示范轮流、交换、等待等策略。',
        keyPoints: ['先分开情绪', '表达需求', '给出协商方案'],
        category: '社交能力',
        age_group: '3-6岁',
        isFavorite: false
      }
    };

    return map[id] || map.local_parenting_001;
  },

  getLocalRelatedArticles: function(currentId) {
    return [
      { id: 'local_parenting_001', title: '3-6岁孩子情绪表达的4个引导技巧' },
      { id: 'local_parenting_002', title: '建立睡前流程：让孩子更快入睡' },
      { id: 'local_parenting_003', title: '同伴冲突时，家长如何做“翻译官”' }
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
    article.content = this.sanitizeRichText(article.content);
    article.isFavorite = !!(article.is_favorited || article.isFavorite);
    return article;
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
    if (options.id) {
      this.setData({
        articleId: options.id
      });
      this.loadArticleDetail();
      this.loadRelatedArticles();
    }
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
    
    app.request({
      url: '/parenting/articles/' + that.data.articleId + '/related',
      method: 'GET'
    }).then(function(list) {
      that.setData({
        relatedArticles: list || []
      });
    }).catch(function(err) {
      that.setData({
        relatedArticles: that.getLocalRelatedArticles(that.data.articleId)
      });
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
        title: '小牛育儿锦囊',
        path: '/pages/parenting/parenting'
      };
    }
    var article = this.data.article;
    if (article) {
      return {
        title: article.title + ' - 小牛育儿锦囊',
        path: '/pages/parenting/article-detail/article-detail?id=' + article.id,
        imageUrl: article.cover || ''
      };
    }
    return {
      title: '小牛育儿锦囊',
      path: '/pages/parenting/parenting'
    };
  },

  // 分享到朋友圈
  onShareTimeline: function() {
    if (this.data.offlineFallback) {
      return {
        title: '小牛育儿锦囊'
      };
    }
    var article = this.data.article;
    if (article) {
      return {
        title: article.title + ' - 小牛育儿锦囊',
        query: 'id=' + article.id,
        imageUrl: article.cover || ''
      };
    }
    return {
      title: '小牛育儿锦囊'
    };
  },

  // 点击相关文章
  onRelatedArticleTap: function(e) {
    var id = e.currentTarget.dataset.id;
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
    this.loadArticleDetail(true);
    this.loadRelatedArticles();
    this.loadComments();
  },

  // 加载评论列表
  loadComments: function() {
    var that = this;
    if (String(that.data.articleId || '').indexOf('local_parenting_') === 0) {
      that.setData({ comments: [] });
      return;
    }
    
    app.request({
      url: '/parenting/articles/' + that.data.articleId + '/comments',
      method: 'GET'
    }).then(function(res) {
      if (res && res.data) {
        that.setData({ comments: res.data || [] });
      }
    }).catch(function(err) {
      console.log('获取评论失败', err);
    });
  },

  // 切换点赞
  toggleLike: function() {
    var that = this;
    if (that.data.offlineFallback) {
      wx.showToast({ title: '离线示例不可点赞', icon: 'none' });
      return;
    }
    
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
          title: that.data.isLiked ? '已点赞' : '已取消',
          icon: 'success'
        });
      }
    }).catch(function(err) {
      wx.showToast({ title: '点赞失败', icon: 'none' });
    });
  },

  // 评论输入
  onCommentInput: function(e) {
    this.setData({ commentText: e.detail.value });
  },

  // 提交评论
  submitComment: function() {
    var that = this;
    var content = that.data.commentText;
    if (!content || !content.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' });
      return;
    }
    
    if (that.data.offlineFallback) {
      wx.showToast({ title: '离线示例不可评论', icon: 'none' });
      return;
    }
    
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
    }).catch(function(err) {
      wx.showToast({ title: '评论失败', icon: 'none' });
    });
  },

  // 图片加载完成
  onImageLoad: function() {
    this.setData({
      imageLoaded: true
    });
  }
});
