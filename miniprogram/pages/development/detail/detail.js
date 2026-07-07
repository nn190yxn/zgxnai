const app = getApp();
const developmentZones = require('../../../utils/development-zones.js');

Page({
  data: {
    zoneCode: '',
    zone: null,
    ageGroups: developmentZones.DEVELOPMENT_AGE_GROUPS,
    selectedAgeGroup: '',
    scenarios: [],
    scenarioGroups: [],
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
        scenarioGroups: [],
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
    this.setData({
      currentChild: child || null,
      selectedAgeGroup: validAgeGroup,
      ageStatusText: validAgeGroup ? '当前按 ' + validAgeGroup + ' 展示' : this.data.agePrompt,
      scenarios: scenarios,
      scenarioGroups: this.buildScenarioGroups(scenarios),
      selectedScenarioCode: '',
      selectedScenario: null,
      activePractice: null
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

  getScenarioCategory(scenario) {
    var text = [
      scenario && scenario.title,
      scenario && scenario.symptomText,
      scenario && scenario.parentCheck,
      scenario && scenario.todayAction
    ].filter(function(item) { return !!item; }).join('');
    if (/吃饭|饭|挑食|睡|洗漱|穿衣|如厕|收拾|整理|生活|习惯|刷牙|起床/.test(text)) {
      return '生活习惯';
    }
    if (/情绪|生气|哭|害怕|紧张|挫折|适应|自信|不敢|分离|害羞|胆|怕/.test(text)) {
      return '情绪与适应';
    }
    if (/同伴|朋友|分享|轮流|合作|社交|集体|排队|规则|冲突/.test(text)) {
      return '社交与规则';
    }
    if (/坐|专注|开始|完成|听|等|指令|任务|拖|注意|坚持/.test(text)) {
      return '专注与任务';
    }
    if (/跑|跳|走|碰|动作|身体|吵|声音|洗头|剪指甲|用力|平衡|爬|球|手眼/.test(text)) {
      return '身体与感官';
    }
    if (/说|讲|回答|故事|表达|句|词|听|绘本|复述|开口/.test(text)) {
      return '表达与理解';
    }
    return '日常表现';
  },

  buildScenarioGroups(scenarios) {
    var order = ['表达与理解', '专注与任务', '身体与感官', '情绪与适应', '社交与规则', '生活习惯', '日常表现'];
    var grouped = {};
    (scenarios || []).forEach(function(scenario) {
      var category = this.getScenarioCategory(scenario);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(scenario);
    }, this);
    return order.filter(function(category) {
      return grouped[category] && grouped[category].length;
    }).map(function(category) {
      return {
        title: category,
        count: grouped[category].length,
        scenarios: grouped[category]
      };
    });
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

  openScenarioDetail(e) {
    var scenarioCode = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.scenario : '';
    var targetScenarioCode = scenarioCode || this.data.selectedScenarioCode;
    if (!this.data.zoneCode || !targetScenarioCode) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/development/scene/scene?zone=' + encodeURIComponent(this.data.zoneCode) + '&scenario=' + encodeURIComponent(targetScenarioCode),
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
