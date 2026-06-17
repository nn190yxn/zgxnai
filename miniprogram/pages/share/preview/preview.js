var app = getApp();

Page({
  data: {
      draft: {
        type: 'app_intro',
        title: '小牛育儿AI助理',
        summary: '3分钟看懂孩子近况，专注、表达、阅读、吃饭睡眠都有对应建议。',
      metrics: {
        completed: 0,
        total: 0,
        completionRate: 0,
        streakDays: 0
      }
    },
    previewText: '',
      shareCard: {
        badge: '宝妈育儿工具箱',
        headline: '3分钟看懂孩子近况',
        subline: '专注、表达、阅读、吃饭睡眠，都有对应建议',
      heroMetric: '3分钟',
      heroLabel: '快速了解孩子近期表现',
      chips: [],
        cta: '一起看看孩子近况'
    },
    sourceInfo: {
      source: '',
      from: '',
      timestampText: ''
    },
    showLogs: false,
    recentLogs: [],
    statsSummary: {
      totalEvents: 0,
      entryCount: 0,
      previewCount: 0,
      copyCount: 0,
      sourceTop: [],
      latestEntry: ''
    }
  },

  onLoad: function() {
    this.setData({
      showLogs: !!app.globalData.isDebug
    });
  },

  onShow: function() {
    this.loadDraft();
  },

  loadDraft: function() {
    var draft = wx.getStorageSync('readingShareDraft') || this.data.draft;
    var card = this.buildMarketingCard(draft);
    var text = card.copyText;
    var lastShareSource = wx.getStorageSync('lastShareSource') || {};
    this.setData({
      draft: draft,
      previewText: text,
      shareCard: card,
      sourceInfo: {
        source: lastShareSource.source || draft.source || 'unknown',
        from: lastShareSource.from || 'preview',
        timestampText: this.formatTime(lastShareSource.timestamp || draft.createdAt || Date.now())
      }
    });

    app.appendShareEventLog({
      type: 'share_preview_view',
      source: (lastShareSource.source || draft.source || 'unknown'),
      from: (lastShareSource.from || 'preview'),
      timestamp: Date.now(),
      page: 'share_preview'
    });
    app.trackKbEvent({
      event_type: 'share_preview',
      share_source: (lastShareSource.source || draft.source || 'unknown'),
      event_meta: { from: (lastShareSource.from || 'preview') }
    });

    this.loadShareStatsSummary();
  },

  buildMarketingCard: function(draft) {
    var data = draft || {};
    var metrics = data.metrics || {};
    var completed = metrics.completed || 0;
    var total = metrics.total || 0;
    var completionRate = metrics.completionRate || 0;
    var streakDays = metrics.streakDays || 0;
    var recordingCount = metrics.recordingCount || 0;
    var isWeekly = data.type === 'weekly_report';

    if (data.type === 'app_intro' || data.type === 'home_intro') {
      return {
        badge: '宝妈育儿工具箱',
        headline: '3分钟看懂孩子近况',
        subline: '专注、表达、阅读、吃饭睡眠，都有对应建议',
        heroMetric: '4合1',
        heroLabel: '成长观察 + AI答疑 + 育儿知识 + 营养食谱',
        chips: [
          { value: '3分钟', label: '快速观察' },
          { value: '随时问', label: 'AI答疑' },
          { value: '分龄看', label: '育儿营养' }
        ],
        cta: '一起看看孩子近况',
        copyText: '我在用小牛育儿AI助理，3分钟看懂孩子近况，专注、表达、阅读、吃饭睡眠都有对应建议。'
      };
    }

    if (isWeekly) {
      return {
        badge: '本周成果',
        headline: streakDays > 0 ? ('坚持 ' + streakDays + ' 天') : '开始积累成长力',
        subline: '每天10分钟，阅读表达和专注力都在积累',
        heroMetric: completionRate + '%',
        heroLabel: '任务完成率',
        chips: [
          { value: completed + '/' + total, label: '完成任务' },
          { value: streakDays + '天', label: '连续打卡' },
          { value: recordingCount + '次', label: '复述练习' }
        ],
        cta: '一起坚持10分钟',
        copyText: '这周坚持' + streakDays + '天，完成' + completed + '/' + total + '个能力成长任务。每天10分钟，阅读表达和专注力都在一点点积累。'
      };
    }

    return {
      badge: '今日打卡',
      headline: '每天10分钟，稳步积累成长力',
      subline: '把阅读、表达和专注训练放进日常',
      heroMetric: '+1',
      heroLabel: data.title || '能力成长任务',
      chips: [
        { value: completed + '/' + total, label: '累计完成' },
        { value: streakDays + '天', label: '连续坚持' },
        { value: recordingCount + '次', label: '复述录音' }
      ],
      cta: '一起开始10分钟训练',
      copyText: '今天完成一个能力成长任务。每天10分钟，阅读表达和专注力都在慢慢积累。'
    };
  },

  loadShareStatsSummary: function() {
    var logs = wx.getStorageSync('shareEventLogs') || [];
    var sourceCount = {};
    var entryCount = 0;
    var previewCount = 0;
    var copyCount = 0;
    var latestEntry = '';

    for (var i = 0; i < logs.length; i++) {
      var item = logs[i] || {};
      var source = item.source || 'unknown';
      sourceCount[source] = (sourceCount[source] || 0) + 1;

      if (item.type === 'share_entry') {
        entryCount++;
        latestEntry = source;
      } else if (item.type === 'share_preview_view') {
        previewCount++;
      } else if (item.type === 'share_copy_text') {
        copyCount++;
      }
    }

    var sourceTop = Object.keys(sourceCount).map(function(key) {
      return { source: key, count: sourceCount[key] };
    }).sort(function(a, b) {
      return b.count - a.count;
    }).slice(0, 3);

    this.setData({
      statsSummary: {
        totalEvents: logs.length,
        entryCount: entryCount,
        previewCount: previewCount,
        copyCount: copyCount,
        sourceTop: sourceTop,
        latestEntry: latestEntry || '暂无'
      }
    });
  },

  formatTime: function(ts) {
    var d = new Date(ts);
    var y = d.getFullYear();
    var m = d.getMonth() + 1;
    var day = d.getDate();
    var hh = d.getHours();
    var mm = d.getMinutes();
    if (m < 10) m = '0' + m;
    if (day < 10) day = '0' + day;
    if (hh < 10) hh = '0' + hh;
    if (mm < 10) mm = '0' + mm;
    return y + '-' + m + '-' + day + ' ' + hh + ':' + mm;
  },

  copyShareText: function() {
    var that = this;
    var text = this.data.previewText || '';
    if (!text) {
      wx.showToast({ title: '暂无可复制内容', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: text,
      success: function() {
        wx.showToast({ title: '文案已复制', icon: 'none' });
        app.appendShareEventLog({
          type: 'share_copy_text',
          source: (that.data.sourceInfo.source || 'unknown'),
          from: 'share_preview',
          timestamp: Date.now(),
          page: 'share_preview'
        });
        app.trackKbEvent({
          event_type: 'share_copy',
          share_source: (that.data.sourceInfo.source || 'unknown'),
          event_meta: { from: 'share_preview' }
        });
      }
    });
  },

  refreshDraft: function() {
    this.loadDraft();
    wx.showToast({ title: '已刷新', icon: 'none' });
  },

  toggleRecentLogs: function() {
    if (!app.globalData.isDebug) {
      return;
    }
    var show = !this.data.showLogs;
    if (!show) {
      this.setData({
        showLogs: false
      });
      return;
    }
    var logs = wx.getStorageSync('shareEventLogs') || [];
    var recent = logs.slice(logs.length - 8).reverse();
    this.setData({
      showLogs: true,
      recentLogs: recent
    });
    this.loadShareStatsSummary();
  },

  goToHome: function() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onShareAppMessage: function() {
    var draft = this.data.draft || {};
    var source = draft.type || 'share_preview';
    return {
      title: (this.data.shareCard && this.data.shareCard.headline) || '孩子的问题，先别靠猜',
      path: '/pages/index/index?shareSource=' + encodeURIComponent(source) + '&from=preview',
      imageUrl: '/images/default-article.png'
    };
  }
});
