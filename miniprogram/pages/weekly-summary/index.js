var app = getApp();

Page({
  data: {
    currentChild: null,
    childId: 0,
    loading: false,
    summary: null
  },

  onLoad: function(options) {
    this.bootstrap(options);
  },

  onShow: function() {
    this.bootstrap();
  },

  bootstrap: function(options) {
    var childId = Number((options && options.childId) || this.data.childId || 0);
    var child = app.getCurrentChild ? app.getCurrentChild() : app.normalizeChild(wx.getStorageSync('currentChild') || null);
    if (!childId && child && child.id) {
      childId = Number(child.id || 0);
    }
    if (!childId) {
      this.setData({
        currentChild: null,
        childId: 0,
        loading: false,
        summary: null
      });
      return;
    }
    this.setData({
      childId: childId,
      currentChild: child && Number(child.id || 0) === childId ? child : this.data.currentChild
    });
    this.loadSummary();
  },

  loadSummary: function() {
    var that = this;
    if (!this.data.childId) {
      return;
    }
    this.setData({ loading: true });
    app.request({
      url: '/weekly-summary',
      method: 'GET',
      data: { childId: this.data.childId }
    }).then(function(data) {
      that.setData({
        summary: data || null,
        currentChild: that.data.currentChild || (data ? { id: that.data.childId, name: data.childName || '' } : null)
      });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'weekly_summary_view',
          module_key: 'weekly_summary',
          page_key: 'weekly_summary_index',
          child_id: that.data.childId,
          event_meta: {
            premium_unlocked: !!(data && data.premiumUnlocked),
            record_days: Number((data && data.recordDays) || 0)
          }
        });
      }
    }).catch(function(err) {
      wx.showToast({ title: app.getApiErrorMessage(err, '加载失败'), icon: 'none' });
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  onOpenContent: function(e) {
    var targetPath = e.currentTarget.dataset.targetPath;
    if (!targetPath) {
      return;
    }
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_action_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { action: 'open_content', target_path: targetPath }
      });
    }
    wx.navigateTo({ url: targetPath });
  },

  goToMembership: function() {
    if (app.trackKbEvent) {
      app.trackKbEvent({
        event_type: 'weekly_summary_action_click',
        module_key: 'weekly_summary',
        page_key: 'weekly_summary_index',
        child_id: this.data.childId,
        event_meta: { action: 'open_membership' }
      });
    }
    wx.navigateTo({ url: '/pages/membership/index' });
  },

  goToChildSetup: function() {
    wx.navigateTo({ url: '/pages/profile/child-edit/child-edit' });
  }
});
