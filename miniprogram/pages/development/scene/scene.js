const app = getApp();
const developmentZones = require('../../../utils/development-zones.js');
const crossPageStorage = require('../../../utils/cross-page-storage.js');
const growthShare = require('../../../utils/growth-share.js');

Page({
  data: {
    zoneCode: '',
    scenarioCode: '',
    selectedAgeGroup: '',
    zone: null,
    scenario: null,
    displayAgeGuidance: [],
    loadError: '',
    contentSource: 'local_fallback',
    isFallback: true,
    professionalBoundary: ''
  },

  onLoad(options) {
    this.loadScene(options || {});
  },

  loadScene(options) {
    var zoneCode = options && options.zone ? String(options.zone) : '';
    var scenarioCode = options && options.scenario ? String(options.scenario) : '';
    var selectedAgeGroup = options && options.ageGroup ? decodeURIComponent(String(options.ageGroup)) : '';
    var validAgeGroup = developmentZones.isDevelopmentAgeGroup(selectedAgeGroup) ? selectedAgeGroup : '';
    var zone = developmentZones.getDevelopmentZoneByCode(zoneCode);
    var scenario = developmentZones.getDevelopmentScenario(zoneCode, scenarioCode);

    if (!zone || !scenario) {
      this.setData({
        zoneCode: zoneCode,
        scenarioCode: scenarioCode,
        selectedAgeGroup: validAgeGroup,
        zone: zone || null,
        scenario: null,
        displayAgeGuidance: [],
        loadError: '这个方向正在补充，先问小牛'
      });
      return;
    }

    var ageGuidance = Array.isArray(scenario.ageGuidance) ? scenario.ageGuidance : [];
    var displayAgeGuidance = validAgeGroup
      ? ageGuidance.filter(function(item) { return item.ageGroup === validAgeGroup; })
      : ageGuidance;

    this.setData({
      zoneCode: zone.code,
      scenarioCode: scenario.code,
      selectedAgeGroup: validAgeGroup,
      zone: zone,
      scenario: scenario,
      displayAgeGuidance: displayAgeGuidance,
      loadError: ''
    });
    wx.setNavigationBarTitle({ title: scenario.title });
    this.loadRemoteScene();
  },

  loadRemoteScene() {
    var that = this;
    if (!app || typeof app.request !== 'function' || !this.data.zoneCode) return Promise.resolve(null);
    var query = this.data.selectedAgeGroup ? '?age_group=' + encodeURIComponent(this.data.selectedAgeGroup) : '';
    return app.request({ url: '/development-zones/' + encodeURIComponent(this.data.zoneCode) + query, method: 'GET' }).then(function(data) {
      var remoteZone = data || {};
      var scenarios = Array.isArray(remoteZone.scenarios) ? remoteZone.scenarios : [];
      var remoteScenario = scenarios.find(function(item) { return item && item.code === that.data.scenarioCode; });
      if (!remoteScenario) return data;
      var displayAgeGuidance = that.data.selectedAgeGroup
        ? (remoteScenario.ageGuidance || []).filter(function(item) { return item.ageGroup === that.data.selectedAgeGroup; })
        : (remoteScenario.ageGuidance || []);
      that.setData({
        zone: Object.assign({}, that.data.zone || {}, remoteZone),
        scenario: remoteScenario,
        displayAgeGuidance: displayAgeGuidance,
        contentSource: remoteZone.contentSource || 'server',
        isFallback: !!remoteZone.isFallback,
        professionalBoundary: that.getProfessionalBoundary(that.data.zoneCode)
      });
      return data;
    }).catch(function() {
      that.setData({ isFallback: true, contentSource: 'local_fallback' });
      return null;
    });
  },

  getProfessionalBoundary(zoneCode) {
    if (zoneCode === 'habits' || zoneCode === 'emotion') {
      return '家庭练习用于观察和支持日常表现。持续影响吃饭、睡眠、上学或情绪安全时，请联系儿科或儿童发展专业人员。';
    }
    return '内容用于家庭观察和日常练习，家长按孩子当下状态调整节奏。出现持续疼痛、受伤风险或明显安全隐患时，请及时寻求专业帮助。';
  },

  buildContextText() {
    var zone = this.data.zone || {};
    var scenario = this.data.scenario || {};
    return [
      zone.title ? '专区：' + zone.title : '',
      scenario.title ? '场景：' + scenario.title : '',
      scenario.symptomText ? '表现：' + scenario.symptomText : '',
      scenario.todayAction ? '今天练习：' + scenario.todayAction : ''
    ].filter(function(item) { return !!item; }).join('\n');
  },

  buildGrowthRecordSource() {
    var zone = this.data.zone || {};
    var scenario = this.data.scenario || {};
    return {
      sourceType: 'development_zone',
      zoneCode: this.data.zoneCode || zone.code || '',
      zoneTitle: zone.title || '',
      scenarioCode: this.data.scenarioCode || scenario.code || '',
      scenarioTitle: scenario.title || '',
      practiceTitle: scenario.title || '专区练习',
      practiceAction: scenario.todayAction || '',
      sourceId: (this.data.zoneCode || '') + ':' + (this.data.scenarioCode || '')
    };
  },

  askXiaoniu() {
    var scenario = this.data.scenario;
    if (!scenario) {
      wx.showToast({ title: '先选一个练习场景', icon: 'none' });
      return;
    }
    var question = scenario.chatQuestion || '这个练习怎么做得更顺？';
    crossPageStorage.save('pendingChatQuestion', question + '\n' + this.buildContextText(), {
      childId: getApp().getCurrentChild && getApp().getCurrentChild() ? getApp().getCurrentChild().id : null,
      source: 'development_scene'
    });
    wx.switchTab({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  askFallback() {
    var zone = this.data.zone || {};
    var question = zone.title
      ? '孩子在' + zone.title + '方面需要怎么陪？'
      : '孩子发展练习怎么做？';
    crossPageStorage.save('pendingChatQuestion', question, {
      childId: getApp().getCurrentChild && getApp().getCurrentChild() ? getApp().getCurrentChild().id : null,
      source: 'development_scene'
    });
    wx.switchTab({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  recordPractice() {
    var scenario = this.data.scenario;
    if (!scenario) {
      wx.showToast({ title: '先选一个练习场景', icon: 'none' });
      return;
    }
    var currentChild = getApp().getCurrentChild ? getApp().getCurrentChild() : null;
    crossPageStorage.save('pendingGrowthRecordNote', this.buildContextText(), {
      childId: currentChild && currentChild.id,
      source: 'development_scene'
    });
    crossPageStorage.save('pendingGrowthRecordSource', this.buildGrowthRecordSource(), {
      childId: currentChild && currentChild.id,
      source: 'development_scene'
    });
    wx.navigateTo({
      url: '/pages/growth-record/index?source=development_zone&zone=' + encodeURIComponent(this.data.zoneCode || '') + '&scenario=' + encodeURIComponent(this.data.scenarioCode || ''),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    var scenario = this.data.scenario || {};
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    growthShare.saveGrowthShareDraft(crossPageStorage, {
      type: 'development_practice',
      source: 'development_scene',
      childId: currentChild && currentChild.id,
      title: scenario.title || '专区练习',
      durationMinutes: scenario.durationMinutes || 5
    });
    if (app.trackKbEvent) {
      app.trackKbEvent({ event_type: 'development_share', module_key: 'development_zone', page_key: 'development_scene', child_id: currentChild && currentChild.id, event_meta: { scenario_code: this.data.scenarioCode } });
    }
    return {
      title: scenario.title || '今天和孩子做一个小练习',
      path: '/pages/share/preview/preview?shareType=development_practice',
      imageUrl: '/images/default-article.png'
    };
  }
});
