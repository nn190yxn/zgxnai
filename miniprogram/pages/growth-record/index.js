var app = getApp();

function getToday() {
  var date = new Date();
  return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
}

Page({
  data: {
    currentChild: null,
    recordDate: getToday(),
    loading: false,
    saving: false,
    sourceContext: null,
    form: {
      moodStatus: 'steady',
      appetiteStatus: 'normal',
      sleepStatus: 'stable',
      exerciseStatus: 'enough',
      socialStatus: 'smooth',
      noteText: ''
    },
    sections: [
      {
        field: 'moodStatus',
        title: '情绪状态',
        options: [
        { value: 'happy', label: '轻松开心' },
        { value: 'steady', label: '整体平稳' },
        { value: 'sensitive', label: '比较敏感' },
        { value: 'meltdown', label: '情绪爆发' }
        ]
      },
      {
        field: 'appetiteStatus',
        title: '进食状态',
        options: [
        { value: 'good', label: '吃得不错' },
        { value: 'normal', label: '正常进食' },
        { value: 'picky', label: '挑食明显' },
        { value: 'low', label: '胃口偏低' }
        ]
      },
      {
        field: 'sleepStatus',
        title: '睡眠状态',
        options: [
        { value: 'stable', label: '睡眠稳定' },
        { value: 'late', label: '入睡偏晚' },
        { value: 'night_wake', label: '夜醒较多' },
        { value: 'short', label: '睡得偏少' }
        ]
      },
      {
        field: 'exerciseStatus',
        title: '活动状态',
        options: [
        { value: 'active', label: '活动充分' },
        { value: 'enough', label: '基本够用' },
        { value: 'little', label: '活动偏少' },
        { value: 'resist', label: '有点抗拒' }
        ]
      },
      {
        field: 'socialStatus',
        title: '社交状态',
        options: [
        { value: 'warm', label: '互动主动' },
        { value: 'smooth', label: '基本顺畅' },
        { value: 'shy', label: '偏害羞' },
        { value: 'conflict', label: '容易起冲突' }
        ]
      }
    ]
  },

  onLoad: function(options) {
    this.applySourceContext(options || {});
    this.bootstrap();
  },

  onShow: function() {
    this.bootstrap();
  },

  bootstrap: function() {
    var that = this;
    var currentChild = app.restoreCurrentChildFromStorage ? app.restoreCurrentChildFromStorage() : (app.getCurrentChild ? app.getCurrentChild() : app.normalizeChild(wx.getStorageSync('currentChild') || null));
    if (currentChild && currentChild.id) {
      that.applyBootstrapChild(currentChild);
      return;
    }
    that.setData({ currentChild: null });
    if (app.ensureCurrentChild) {
      app.ensureCurrentChild().then(function(child) {
        if (child && child.id) {
          that.applyBootstrapChild(child);
        }
      }).catch(function() {
        return null;
      });
    }
  },

  applySourceContext: function(options) {
    var source = String((options && options.source) || '').trim();
    var pendingSource = wx.getStorageSync('pendingGrowthRecordSource') || null;
    if (pendingSource) {
      wx.removeStorageSync('pendingGrowthRecordSource');
    }
    if (pendingSource && (pendingSource.sourceType === 'development_zone' || pendingSource.sourceType === 'core_action')) {
      this.setData({ sourceContext: pendingSource });
      return;
    }
    if (source === 'core_action') {
      this.setData({
        sourceContext: {
          sourceType: 'core_action',
          sourceId: String((options && options.sourceId) || ''),
          actionTitle: '今晚小任务',
          summary: ''
        }
      });
      return;
    }
    if (source === 'development_zone') {
      this.setData({
        sourceContext: {
          sourceType: 'development_zone',
          zoneCode: String((options && options.zone) || ''),
          scenarioCode: String((options && options.scenario) || ''),
          practiceTitle: '专区练习',
          sourceId: String((options && options.zone) || '') + ':' + String((options && options.scenario) || '')
        }
      });
    }
  },

  applyBootstrapChild: function(child) {
    this.setData({ currentChild: child });
    if (!this._openedTracked && app.trackKbEvent) {
      this._openedTracked = true;
      app.trackKbEvent({
        event_type: 'growth_record_open',
        module_key: 'growth_record',
        page_key: 'growth_record_index',
        child_id: child.id,
        event_meta: { record_date: this.data.recordDate }
      });
    }
    this.loadRecord();
  },

  loadRecord: function() {
    var that = this;
    if (!this.data.currentChild || !this.data.currentChild.id) {
      return;
    }
    var pendingNote = String(wx.getStorageSync('pendingGrowthRecordNote') || '').trim();
    if (pendingNote) {
      wx.removeStorageSync('pendingGrowthRecordNote');
    }
    this.setData({ loading: true });
    app.ensureLogin().then(function() {
      return app.request({
        url: '/growth-records/daily',
        method: 'GET',
        data: {
          childId: that.data.currentChild.id,
          date: that.data.recordDate
        }
      });
    }).then(function(data) {
      that.setData({
        form: {
          moodStatus: data.moodStatus || 'steady',
          appetiteStatus: data.appetiteStatus || 'normal',
          sleepStatus: data.sleepStatus || 'stable',
          exerciseStatus: data.exerciseStatus || 'enough',
          socialStatus: data.socialStatus || 'smooth',
          noteText: pendingNote || data.noteText || ''
        }
      });
    }).catch(function() {
      if (pendingNote) {
        var form = Object.assign({}, that.data.form);
        form.noteText = pendingNote;
        that.setData({ form: form });
      }
      wx.showToast({ title: '记录没加载出来', icon: 'none' });
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  onPickStatus: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.currentTarget.dataset.value;
    var form = Object.assign({}, this.data.form);
    form[field] = value;
    this.setData({ form: form });
  },

  onNoteInput: function(e) {
    var form = Object.assign({}, this.data.form);
    form.noteText = e.detail.value;
    this.setData({ form: form });
  },

  onDateChange: function(e) {
    this.setData({ recordDate: e.detail.value }, this.loadRecord);
  },

  submitRecord: function() {
    var that = this;
    if (!this.data.currentChild || !this.data.currentChild.id || this.data.saving) {
      return;
    }
    this.setData({ saving: true });
    app.request({
      url: '/growth-records',
      method: 'POST',
      data: Object.assign({}, this.data.form, {
        childId: this.data.currentChild.id,
        recordDate: this.data.recordDate
      })
    }).then(function() {
      return that.saveSourceEntryIfNeeded();
    }).then(function() {
      wx.showToast({ title: '已保存', icon: 'success' });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'growth_record_submit',
          module_key: 'growth_record',
          event_meta: { child_id: that.data.currentChild.id, record_date: that.data.recordDate }
        });
      }
    }).catch(function(err) {
      wx.showToast({ title: app.getApiErrorMessage(err, '保存失败'), icon: 'none' });
    }).finally(function() {
      that.setData({ saving: false });
    });
  },

  saveSourceEntryIfNeeded: function() {
    var sourceContext = this.data.sourceContext || null;
    if (!sourceContext) {
      return Promise.resolve();
    }
    if (sourceContext.sourceType === 'core_action') {
      return app.request({
        url: '/growth-records/entry',
        method: 'POST',
        data: {
          childId: this.data.currentChild.id,
          entry_type: 'core_action',
          source_type: 'core_action',
          title: sourceContext.actionTitle || sourceContext.bottleneckTitle || '今晚小任务',
          summary: this.data.form.noteText || sourceContext.summary || '',
          source_id: sourceContext.sourceId || ('core_action_' + Date.now()),
          scene_key: sourceContext.sceneKey || '',
          scene_label: sourceContext.sceneLabel || '',
          symptom_key: sourceContext.symptomKey || '',
          symptom_label: sourceContext.symptomLabel || '',
          age_group: sourceContext.ageGroup || '',
          effect_key: sourceContext.effectKey || '',
          effect_label: sourceContext.effectLabel || '',
          user_note: this.data.form.noteText || ''
        }
      });
    }
    if (sourceContext.sourceType !== 'development_zone') {
      return Promise.resolve();
    }
    return app.request({
      url: '/growth-records/entry',
      method: 'POST',
      data: {
        childId: this.data.currentChild.id,
        entry_type: 'development_zone',
        source_type: 'development_zone',
        title: sourceContext.practiceTitle || sourceContext.scenarioTitle || '专区练习',
        summary: this.data.form.noteText || sourceContext.practiceAction || '',
        source_id: sourceContext.sourceId || ((sourceContext.zoneCode || '') + ':' + (sourceContext.scenarioCode || '')),
        zone_code: sourceContext.zoneCode || '',
        scenario_code: sourceContext.scenarioCode || '',
        practice_title: sourceContext.practiceTitle || sourceContext.scenarioTitle || '专区练习',
        user_note: this.data.form.noteText || ''
      }
    });
  },

  goToHistory: function() {
    if (!this.data.currentChild || !this.data.currentChild.id) {
      return;
    }
    wx.navigateTo({
      url: '/pages/growth-record/history/index?childId=' + this.data.currentChild.id
    });
  },

  goToWeeklySummary: function() {
    if (!this.data.currentChild || !this.data.currentChild.id) {
      return;
    }
    wx.navigateTo({
      url: '/pages/weekly-summary/index?childId=' + this.data.currentChild.id
    });
  },

  goToChildSetup: function() {
    app.requireLoginForAction('请先完成微信登录，再添加孩子档案').then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      wx.navigateTo({ url: '/pages/profile/child-edit/child-edit' });
    });
  }
});
