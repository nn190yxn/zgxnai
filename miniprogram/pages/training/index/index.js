var app = getApp();

Page({
  data: { child: null, task: null, plans: [], loading: true, error: '', dataStatus: 'loading', degraded: false },

  onShow: function() {
    var that = this;
    Promise.resolve(app.retryPendingTrainingRecords && app.retryPendingTrainingRecords()).finally(function() { that.loadData(); });
  },

  loadData: function() {
    var that = this;
    var child = app.getCurrentChild && app.getCurrentChild();
    if (!wx.getStorageSync('token')) { that.setData({ child: child || null, task: null, plans: [], loading: false, error: '', dataStatus: 'login_required' }); return; }
    if (!child || !child.id) { that.setData({ child: null, task: null, plans: [], loading: false, error: '', dataStatus: 'profile_required' }); return; }
    that.setData({ child: child, task: null, loading: true, error: '', dataStatus: 'loading' });
    Promise.all([
      app.request({ url: '/training-plans/next?childId=' + child.id, method: 'GET' }),
      app.request({ url: '/training-plans?childId=' + child.id, method: 'GET' })
    ]).then(function(result) {
      var next = result[0] && (result[0].data || result[0]);
      var plans = result[1] && (result[1].data || result[1]);
      var task = next && next.task;
      that.setData({ task: task, plans: (plans && plans.list) || [], loading: false, dataStatus: task ? 'ready' : 'empty', degraded: !!(next && next.degraded) });
      if (task && app.trackKbEvent) {
        app.trackKbEvent({ event_type: 'training_task_view', action_id: 'training:' + task.childId + ':' + task.id, plan_id: task.planId, ability_codes: [task.abilityDomain], source_module: 'training', source_page: 'training_index', source_content_type: 'training_task', source_content_id: String(task.id) });
      }
    }).catch(function() { that.setData({ loading: false, error: '训练计划暂时没加载出来，请重试', dataStatus: 'error' }); });
  },

  retryLoad: function() {
    this.loadData();
  },

  loginAndReload: function() {
    var that = this;
    app.requireLoginForAction('请先完成微信登录，再查看训练计划').then(function(canOperate) {
      if (canOperate) that.loadData();
    });
  },

  goToChildSetup: function() {
    app.requireLoginForAction('请先完成微信登录，再完善孩子档案').then(function(canOperate) {
      if (canOperate) wx.navigateTo({ url: '/pages/profile/children/children' });
    });
  },

  goToObservation: function() {
    wx.navigateTo({ url: '/pages/assessment/assessment' });
  },

  openTask: function() {
    if (!this.data.task) return;
    wx.navigateTo({ url: '/pages/training/detail/detail?taskId=' + this.data.task.id });
  },

  generatePlan: function(e) {
    var that = this;
    var days = Number(e.currentTarget.dataset.days || 7);
    if (!that.data.child) return;
    var childId = that.data.child.id;
    app.request({ url: '/training-plans/generate', method: 'POST', data: { childId: childId, durationDays: days, idempotencyKey: 'plan:' + childId + ':' + days } }).then(function(res) {
      var plan = res && (res.data || res);
      if (app.trackKbEvent) {
        app.trackKbEvent({ event_type: 'training_plan_generate', action_id: 'plan:' + childId + ':' + days, plan_id: plan && plan.id, ability_codes: plan && plan.abilityDomain ? [plan.abilityDomain] : null, source_module: 'training', source_page: 'training_index', event_meta: { duration_days: days, degraded: !!(plan && plan.degraded) } });
      }
      that.loadData();
      wx.showToast({ title: '计划已生成', icon: 'success' });
    }).catch(function() { wx.showToast({ title: '生成失败，请先完成能力观察', icon: 'none' }); });
  }
});
