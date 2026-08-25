var app = getApp();
var trainingSync = require('../../../utils/training-sync.js');

Page({
  data: { task: null, selectedFeedback: '', note: '', loading: true, submitting: false, syncStatus: 'synced', syncMessage: '', nextSuggestion: '', feedbackOptions: [{ key: 'smooth', label: '完成顺利' }, { key: 'reminder_needed', label: '需要提醒' }, { key: 'left_early', label: '中途离开' }, { key: 'resisted', label: '孩子有些抗拒' }, { key: 'incomplete', label: '今天未完成' }] },
  onLoad: function(options) { this.taskId = Number(options && options.taskId); this.loadTask(); },
  onShow: function() {
    var that = this;
    Promise.resolve(app.retryPendingTrainingRecords && app.retryPendingTrainingRecords()).then(function() { that.refreshSyncStatus(); });
  },
  onUnload: function() {
    var task = this.data.task;
    if (task && !task.completed && app.trackKbEvent) {
      app.trackKbEvent({ event_type: 'training_task_abandon', action_id: 'training:' + task.childId + ':' + task.id, plan_id: task.planId, ability_codes: [task.abilityDomain], source_module: 'training', source_page: 'training_detail', source_content_type: 'training_task', source_content_id: String(task.id) });
    }
  },
  trackTaskEvent: function(eventType, extra) {
    var task = this.data.task;
    if (!task || !app.trackKbEvent) return;
    app.trackKbEvent({ event_type: eventType, action_id: 'training:' + task.childId + ':' + task.id, plan_id: task.planId, ability_codes: [task.abilityDomain], source_module: 'training', source_page: 'training_detail', source_content_type: 'training_task', source_content_id: String(task.id), event_meta: extra || {} });
  },
  refreshSyncStatus: function() {
    var task = this.data.task;
    if (!task) return;
    var pending = trainingSync.list(task.childId).filter(function(item) { return Number(item.data && item.data.taskId || 0) === Number(task.id) || item.url.indexOf('/' + task.id + '/') >= 0; });
    var failed = pending.some(function(item) { return item.status === 'failed'; });
    this.setData({ syncStatus: failed ? 'failed' : (pending.length ? 'pending' : 'synced'), syncMessage: failed ? '同步失败，请稍后重试' : (pending.length ? '已保存在本机，联网后自动同步' : '') });
  },
  loadTask: function() {
    var that = this;
    var child = app.getCurrentChild && app.getCurrentChild();
    if (!child || !child.id) { that.setData({ loading: false }); return; }
    var url = that.taskId ? '/training-tasks/' + that.taskId : '/training-plans/next?childId=' + child.id;
    app.request({ url: url, method: 'GET' }).then(function(res) {
      var task = (res.data || res).task;
      that.setData({ task: task, loading: false });
      that.refreshSyncStatus();
      if (!that._startedTracked) {
        that._startedTracked = true;
        that.trackTaskEvent('training_task_start');
      }
      that.trackTaskEvent('training_task_view');
    }).catch(function() { that.setData({ loading: false }); });
  },
  selectFeedback: function(e) { this.setData({ selectedFeedback: e.currentTarget.dataset.key }); },
  onNoteInput: function(e) { this.setData({ note: e.detail.value }); },
  completeTask: function() {
    var that = this;
    if (!that.data.task || that.data.submitting) return;
    that.setData({ submitting: true });
    var task = that.data.task;
    var url = '/training-tasks/' + task.id + '/complete';
    var data = { idempotencyKey: 'complete:' + task.childId + ':' + task.id };
    app.request({ url: url, method: 'POST', data: data }).then(function(res) {
      that.setData({ task: Object.assign({}, task, { completed: true }), syncStatus: 'synced', syncMessage: '', nextSuggestion: (res && res.nextSuggestion) || '' });
      that.trackTaskEvent('training_task_complete', { sync_status: 'synced' });
      wx.showToast({ title: '今天完成了', icon: 'success' });
    }).catch(function(err) {
      if (!trainingSync.isRetryableError(err)) { wx.showToast({ title: '完成状态没保存，请重试', icon: 'none' }); return; }
      trainingSync.enqueue({ childId: task.childId, type: 'complete', url: url, method: 'POST', data: data });
      that.setData({ task: Object.assign({}, task, { completed: true }), syncStatus: 'pending', syncMessage: '已保存在本机，联网后自动同步' });
      that.trackTaskEvent('training_task_complete', { sync_status: 'pending' });
      wx.showToast({ title: '已保存，联网后同步', icon: 'none' });
    }).finally(function() { that.setData({ submitting: false }); });
  },
  submitFeedback: function() {
    var that = this;
    if (!that.data.task || !that.data.selectedFeedback) { wx.showToast({ title: '先选一个反馈', icon: 'none' }); return; }
    var task = that.data.task;
    var data = { taskId: task.id, feedbackKey: that.data.selectedFeedback, note: that.data.note, idempotencyKey: 'feedback:' + task.childId + ':' + task.id };
    app.request({ url: '/training-feedback', method: 'POST', data: data }).then(function(res) {
      var suggestion = (res && res.nextSuggestion) || '';
      that.setData({ syncStatus: 'synced', syncMessage: '', nextSuggestion: suggestion });
      that.trackTaskEvent('training_feedback_submit', { feedback_key: data.feedbackKey, sync_status: 'synced' });
      if (suggestion) that.trackTaskEvent('training_next_suggestion_view');
      wx.showToast({ title: '反馈已记录', icon: 'success' });
    }).catch(function(err) {
      if (!trainingSync.isRetryableError(err)) { wx.showToast({ title: '反馈没保存，请重试', icon: 'none' }); return; }
      trainingSync.enqueue({ childId: task.childId, type: 'feedback', url: '/training-feedback', method: 'POST', data: data });
      that.setData({ syncStatus: 'pending', syncMessage: '反馈已保存在本机，联网后自动同步', nextSuggestion: '下次继续保持短时、具体、可完成。' });
      that.trackTaskEvent('training_feedback_submit', { feedback_key: data.feedbackKey, sync_status: 'pending' });
      that.trackTaskEvent('training_next_suggestion_view', { source: 'local_fallback' });
      wx.showToast({ title: '已保存，联网后同步', icon: 'none' });
    });
  }
});
