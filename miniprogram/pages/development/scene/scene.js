const developmentZones = require('../../../utils/development-zones.js');

Page({
  data: {
    zoneCode: '',
    scenarioCode: '',
    selectedAgeGroup: '',
    zone: null,
    scenario: null,
    displayAgeGuidance: [],
    loadError: ''
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
    wx.setStorageSync('pendingChatQuestion', question + '\n' + this.buildContextText());
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
    wx.setStorageSync('pendingChatQuestion', question);
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
    wx.setStorageSync('pendingGrowthRecordNote', this.buildContextText());
    wx.setStorageSync('pendingGrowthRecordSource', this.buildGrowthRecordSource());
    wx.navigateTo({
      url: '/pages/growth-record/index?source=development_zone&zone=' + encodeURIComponent(this.data.zoneCode || '') + '&scenario=' + encodeURIComponent(this.data.scenarioCode || ''),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  }
});
