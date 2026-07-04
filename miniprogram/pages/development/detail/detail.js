const app = getApp();
const developmentZones = require('../../../utils/development-zones.js');

Page({
  data: {
    zoneCode: '',
    zone: null,
    ageGroups: developmentZones.DEVELOPMENT_AGE_GROUPS,
    selectedAgeGroup: '',
    scenarios: [],
    selectedScenarioCode: '',
    selectedScenario: null,
    activePractice: null,
    currentChild: null,
    ageStatusText: '',
    agePrompt: '先选孩子年龄，内容会更贴近。',
    loadError: ''
  },

  onLoad(options) {
    this.loadZone(options && options.zone ? String(options.zone) : '');
  },

  onShow() {
    if (this.data.zoneCode) {
      this.refreshCurrentChild();
    }
  },

  loadZone(zoneCode) {
    var zone = developmentZones.getDevelopmentZoneByCode(zoneCode);
    if (!zone) {
      this.setData({
        zoneCode: zoneCode || '',
        zone: null,
        selectedAgeGroup: '',
        scenarios: [],
        loadError: '这个方向正在补充，先问小牛'
      });
      return;
    }
    this.setData({
      zoneCode: zone.code,
      zone: zone,
      loadError: ''
    });
    wx.setNavigationBarTitle({ title: zone.title });
    this.refreshCurrentChild();
  },

  refreshCurrentChild() {
    var child = app.getCurrentChild ? app.getCurrentChild() : null;
    var ageGroup = developmentZones.inferDevelopmentAgeGroupFromBirthday(child && (child.birthday || child.birth_date));
    this.applyAgeGroup(ageGroup, child || null);
  },

  applyAgeGroup(ageGroup, child) {
    var validAgeGroup = developmentZones.isDevelopmentAgeGroup(ageGroup) ? ageGroup : '';
    var scenarios = validAgeGroup ? developmentZones.getDevelopmentScenarios(this.data.zoneCode, validAgeGroup) : [];
    var selectedScenario = scenarios[0] || null;
    this.setData({
      currentChild: child || null,
      selectedAgeGroup: validAgeGroup,
      ageStatusText: validAgeGroup ? '当前按 ' + validAgeGroup + ' 展示' : this.data.agePrompt,
      scenarios: scenarios,
      selectedScenarioCode: selectedScenario ? selectedScenario.code : '',
      selectedScenario: selectedScenario,
      activePractice: this.buildActivePractice(selectedScenario)
    });
  },

  buildActivePractice(scenario) {
    if (scenario) {
      return {
        title: scenario.title,
        durationMinutes: scenario.durationMinutes,
        action: scenario.todayAction,
        parentScript: scenario.parentScript,
        observeSignal: scenario.observeSignal
      };
    }
    var zone = this.data.zone || {};
    var practice = zone.todayPractice || null;
    if (!practice) {
      return null;
    }
    return {
      title: practice.title,
      durationMinutes: practice.durationMinutes,
      action: practice.action,
      parentScript: '',
      observeSignal: ''
    };
  },

  selectAgeGroup(e) {
    var ageGroup = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.age : '';
    this.applyAgeGroup(ageGroup, this.data.currentChild);
  },

  selectScenario(e) {
    var scenarioCode = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.scenario : '';
    var scenario = (this.data.scenarios || []).find(function(item) {
      return item.code === scenarioCode;
    }) || null;
    this.setData({
      selectedScenarioCode: scenario ? scenario.code : '',
      selectedScenario: scenario,
      activePractice: this.buildActivePractice(scenario)
    });
  },

  openScenarioDetail() {
    if (!this.data.zoneCode || !this.data.selectedScenarioCode) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/development/scene/scene?zone=' + encodeURIComponent(this.data.zoneCode) + '&scenario=' + encodeURIComponent(this.data.selectedScenarioCode),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  goToChildProfile() {
    wx.navigateTo({
      url: '/pages/profile/child-edit/child-edit',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  askXiaoniu() {
    var scenario = this.data.selectedScenario;
    var zone = this.data.zone || {};
    var question = scenario && scenario.chatQuestion
      ? scenario.chatQuestion
      : (zone.title ? '孩子在' + zone.title + '方面需要怎么陪？' : '孩子发展练习怎么做？');
    wx.setStorageSync('pendingChatQuestion', question);
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

  buildGrowthRecordContext() {
    var zone = this.data.zone || {};
    var scenario = this.data.selectedScenario || {};
    var practice = this.data.activePractice || {};
    return [
      zone.title ? '专区：' + zone.title : '',
      scenario.title ? '场景：' + scenario.title : '',
      practice.action ? '今天练习：' + practice.action : '',
      practice.observeSignal ? '观察：' + practice.observeSignal : ''
    ].filter(function(item) { return !!item; }).join('\n');
  },

  buildGrowthRecordSource() {
    var zone = this.data.zone || {};
    var scenario = this.data.selectedScenario || {};
    var practice = this.data.activePractice || {};
    return {
      sourceType: 'development_zone',
      zoneCode: this.data.zoneCode || zone.code || '',
      zoneTitle: zone.title || '',
      scenarioCode: this.data.selectedScenarioCode || scenario.code || '',
      scenarioTitle: scenario.title || '',
      practiceTitle: practice.title || scenario.title || '专区练习',
      practiceAction: practice.action || '',
      sourceId: (this.data.zoneCode || '') + ':' + (this.data.selectedScenarioCode || '')
    };
  },

  recordPractice() {
    if (!this.data.selectedScenarioCode) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    var query = '?source=development_zone&zone=' + encodeURIComponent(this.data.zoneCode || '');
    if (this.data.selectedScenarioCode) {
      query += '&scenario=' + encodeURIComponent(this.data.selectedScenarioCode);
    }
    wx.setStorageSync('pendingGrowthRecordNote', this.buildGrowthRecordContext());
    wx.setStorageSync('pendingGrowthRecordSource', this.buildGrowthRecordSource());
    wx.navigateTo({
      url: '/pages/growth-record/index' + query,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  }
});
