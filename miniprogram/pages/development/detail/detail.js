const app = getApp();
const developmentZones = require('../../../utils/development-zones.js');
const crossPageStorage = require('../../../utils/cross-page-storage.js');
const growthShare = require('../../../utils/growth-share.js');
const painPointApi = require('../../../utils/pain-points.js');

Page({
  data: {
    zoneCode: '',
    painPointKey: '',
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
    loadError: '',
    contentSource: 'local_fallback',
    isFallback: true,
    relatedContent: [],
    professionalBoundary: ''
  },

  onLoad(options) {
    if (options && options.painPointKey) {
      this.loadPainPoint(decodeURIComponent(String(options.painPointKey)));
      return;
    }
    this.loadZone(options && options.zone ? String(options.zone) : '');
  },

  loadPainPoint: function(key) {
    var that = this;
    return painPointApi.readDetail(app, key).then(function(result) {
      var point = result.item;
      if (!point) {
        that.setData({
          zoneCode: '',
          painPointKey: key,
          zone: null,
          scenarios: [],
          scenarioGroups: [],
          selectedScenarioCode: '',
          selectedScenario: null,
          activePractice: null,
          loadError: '这个成长痛点暂时没有内容'
        });
        return result;
      }
      var action = point.todayAction && typeof point.todayAction === 'object'
        ? point.todayAction
        : point.defaultAction || {};
      var possibleReasons = Array.isArray(point.possibleReasons) && point.possibleReasons.length
        ? point.possibleReasons
        : [point.defaultBottleneck && point.defaultBottleneck.text].filter(function(item) { return !!item; });
      var observeSignals = Array.isArray(point.observeSignals) && point.observeSignals.length
        ? point.observeSignals
        : point.observableSigns || [];
      var scenario = {
        code: point.key, title: point.title, symptomText: point.description,
        categoryKey: point.categoryKey || point.category_key || '',
        categoryLabel: point.categoryLabel || point.category_label || point.category || '',
        sceneKey: point.sceneKey || point.scene_key || '',
        abilityTags: point.abilityTags || point.ability_tags || [],
        bottleneckTitle: point.defaultBottleneck && point.defaultBottleneck.title || '',
        parentCheck: (point.observableSigns || []).join('、') || '观察孩子在家庭场景中的具体表现。',
        todayAction: action.title || action.action || '先做一个 3 分钟小练习',
        parentScript: point.parentPrompt || '我先陪你做一小步，做完我们再看下一步。',
        observeSignal: observeSignals.join('、'),
        possibleReasons: possibleReasons,
        developmentalFocus: possibleReasons.join('、'),
        practicePrinciples: [], difficultySteps: action.steps || [], progressSignals: observeSignals,
        adjustmentSignals: [], commonPitfalls: [], safetyBoundary: '', media: point.media || []
      };
      var zone = { code: point.key, title: point.title, subtitle: point.description, actionText: '先判断，再做一个小行动', theme: { color: '#6AAE98', tint: '#E6F7ED' }, scenarios: [scenario], sevenDayPlan: [] };
      that.setData({ zoneCode: zone.code, painPointKey: point.key, zone: zone, scenarios: [scenario], scenarioGroups: [], selectedAgeGroup: '当前孩子', selectedScenarioCode: scenario.code, selectedScenario: scenario, activePractice: that.buildActivePractice(scenario), currentChild: app.getCurrentChild ? app.getCurrentChild() : null, contentSource: result.source, isFallback: result.fallback, professionalBoundary: that.getProfessionalBoundary(zone.code) });
      wx.setNavigationBarTitle({ title: scenario.title });
      return result;
    });
  },

  onShow() {
    if (this.data.zoneCode && !this.data.painPointKey) {
      this.refreshCurrentChild();
    }
  },

  loadZone(zoneCode) {
    var zone = developmentZones.getDevelopmentZoneByCode(zoneCode);
    if (!zone) {
      this.setData({
        zoneCode: zoneCode || '',
        painPointKey: '',
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
      painPointKey: '',
      zone: zone,
      loadError: ''
    });
    wx.setNavigationBarTitle({ title: zone.title });
    this.refreshCurrentChild();
    this.loadRemoteZone();
  },

  loadRemoteZone() {
    var that = this;
    if (!app || typeof app.request !== 'function' || !this.data.zoneCode) return Promise.resolve(null);
    var query = this.data.selectedAgeGroup ? '?age_group=' + encodeURIComponent(this.data.selectedAgeGroup) : '';
    return app.request({ url: '/development-zones/' + encodeURIComponent(this.data.zoneCode) + query, method: 'GET' }).then(function(data) {
      if (!data) return data;
      var remoteZone = Object.assign({}, that.data.zone || {}, data);
      that.setData({
        zone: remoteZone,
        relatedContent: Array.isArray(data.relatedContent) ? data.relatedContent : [],
        contentSource: data.contentSource || 'server',
        isFallback: !!data.isFallback,
        professionalBoundary: that.getProfessionalBoundary(remoteZone.code)
      });
      that.applyAgeGroup(that.data.selectedAgeGroup, that.data.currentChild);
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

  refreshCurrentChild() {
    var child = app.getCurrentChild ? app.getCurrentChild() : null;
    var ageGroup = developmentZones.inferDevelopmentAgeGroupFromBirthday(child && (child.birthday || child.birth_date));
    this.applyAgeGroup(ageGroup, child || null);
  },

  applyAgeGroup(ageGroup, child) {
    var validAgeGroup = developmentZones.isDevelopmentAgeGroup(ageGroup) ? ageGroup : '';
    var localScenarios = validAgeGroup ? developmentZones.getDevelopmentScenarios(this.data.zoneCode, validAgeGroup) : [];
    var remoteScenarios = this.data.contentSource === 'server' && this.data.zone && Array.isArray(this.data.zone.scenarios)
      ? this.data.zone.scenarios.filter(function(item) {
        return !validAgeGroup || !Array.isArray(item.ageGroups) || item.ageGroups.indexOf(validAgeGroup) >= 0;
      })
      : [];
    var scenarios = remoteScenarios.length ? remoteScenarios : localScenarios;
    this.setData({
      currentChild: child || null,
      selectedAgeGroup: validAgeGroup,
      ageStatusText: validAgeGroup ? '当前按 ' + validAgeGroup + ' 展示' : this.data.agePrompt,
      scenarios: scenarios,
      scenarioGroups: this.buildScenarioGroups(scenarios),
      selectedScenarioCode: '',
      selectedScenario: null,
      activePractice: null,
      professionalBoundary: this.getProfessionalBoundary(this.data.zoneCode)
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
    if (this.data.painPointKey) return;
    var scenarioCode = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.scenario : '';
    var targetScenarioCode = scenarioCode || this.data.selectedScenarioCode;
    if (!this.data.zoneCode || !targetScenarioCode) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/development/scene/scene?zone=' + encodeURIComponent(this.data.zoneCode) + '&scenario=' + encodeURIComponent(targetScenarioCode) + '&ageGroup=' + encodeURIComponent(this.data.selectedAgeGroup || ''),
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
    var question = this.data.painPointKey && scenario
      ? this.buildPainPointChatQuestion()
      : scenario && scenario.chatQuestion
      ? scenario.chatQuestion
      : (zone.title ? '孩子在' + zone.title + '方面需要怎么陪？' : '孩子发展练习怎么做？');
    crossPageStorage.save('pendingChatQuestion', question, {
      childId: this.data.currentChild && this.data.currentChild.id,
      source: 'development_detail'
    });
    wx.navigateTo({
      url: '/pages/chat/chat',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  buildPainPointChatQuestion() {
    var child = this.data.currentChild || {};
    var childContext = app.buildChildChatContext ? app.buildChildChatContext(child) : null;
    var scenario = this.data.selectedScenario || {};
    var practice = this.data.activePractice || {};
    var ageGroup = childContext && childContext.age_group
      ? childContext.age_group
      : developmentZones.inferDevelopmentAgeGroupFromBirthday(child.birthday || child.birth_date);
    var childName = childContext && childContext.name || child.name || child.nickname || '当前孩子';
    var categoryLabel = scenario.categoryLabel || this.getScenarioCategory(scenario);
    var observableSigns = Array.isArray(scenario.progressSignals) ? scenario.progressSignals : [];
    var abilityTags = Array.isArray(scenario.abilityTags) ? scenario.abilityTags : [];
    return [
      '我想继续问问这个成长痛点怎么陪。',
      '孩子：' + childName,
      '年龄：' + (ageGroup || '未确认'),
      '类别：' + (categoryLabel || '日常表现'),
      scenario.categoryKey ? '类别Key：' + scenario.categoryKey : '',
      '场景：' + (scenario.title || '当前家庭场景'),
      scenario.sceneKey ? '场景Key：' + scenario.sceneKey : '',
      '痛点：' + (scenario.title || this.data.zoneCode || '当前成长痛点'),
      scenario.symptomText ? '表现：' + scenario.symptomText : '',
      observableSigns.length ? '可观察表现：' + observableSigns.join('、') : '',
      abilityTags.length ? '背后能力：' + abilityTags.join('、') : '',
      scenario.bottleneckTitle ? '卡点判断：' + scenario.bottleneckTitle : '',
      practice.action ? '今晚第一步：' + practice.action : '',
      scenario.difficultySteps && scenario.difficultySteps.length ? '具体步骤：' + scenario.difficultySteps.join('；') : '',
      '请结合孩子年龄和这个家庭场景，告诉我今晚怎么说、怎么做，以及明天观察什么。'
    ].filter(function(item) { return !!item; }).join('\n');
  },

  askFallback() {
    var zone = this.data.zone || {};
    var question = zone.title
      ? '孩子在' + zone.title + '方面需要怎么陪？'
      : '孩子发展练习怎么做？';
    crossPageStorage.save('pendingChatQuestion', question, {
      childId: this.data.currentChild && this.data.currentChild.id,
      source: 'development_detail'
    });
    wx.navigateTo({
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
      zone.title ? (this.data.painPointKey ? '成长痛点：' : '专区：') + zone.title : '',
      !this.data.painPointKey && scenario.title ? '场景：' + scenario.title : '',
      practice.action ? (this.data.painPointKey ? '今日行动：' : '今天练习：') + practice.action : '',
      practice.observeSignal ? '观察：' + practice.observeSignal : ''
    ].filter(function(item) { return !!item; }).join('\n');
  },

  buildGrowthRecordSource() {
    var zone = this.data.zone || {};
    var scenario = this.data.selectedScenario || {};
    var practice = this.data.activePractice || {};
    return {
      sourceType: this.data.painPointKey ? 'development_pain_point' : 'development_zone',
      zoneCode: this.data.zoneCode || zone.code || '',
      zoneTitle: zone.title || '',
      painPointKey: this.data.painPointKey || '',
      painPointTitle: this.data.painPointKey ? (scenario.title || zone.title || '') : '',
      scenarioCode: this.data.selectedScenarioCode || scenario.code || '',
      scenarioTitle: scenario.title || '',
      practiceTitle: practice.title || scenario.title || '专区练习',
      practiceAction: practice.action || '',
      sourceId: this.data.painPointKey || ((this.data.zoneCode || '') + ':' + (this.data.selectedScenarioCode || ''))
    };
  },

  recordPractice() {
    if (!this.data.selectedScenarioCode) {
      wx.showToast({ title: '先选一个表现', icon: 'none' });
      return;
    }
    crossPageStorage.save('pendingGrowthRecordNote', this.buildGrowthRecordContext(), {
      childId: this.data.currentChild && this.data.currentChild.id,
      source: 'development_detail'
    });
    crossPageStorage.save('pendingGrowthRecordSource', this.buildGrowthRecordSource(), {
      childId: this.data.currentChild && this.data.currentChild.id,
      source: 'development_detail'
    });
    wx.switchTab({
      url: '/pages/growth-record/index',
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  onShareAppMessage() {
    var scenario = this.data.selectedScenario || {};
    growthShare.saveGrowthShareDraft(crossPageStorage, {
      type: 'development_practice',
      source: 'development_zone',
      childId: this.data.currentChild && this.data.currentChild.id,
      title: scenario.title || (this.data.zone && this.data.zone.title) || '专区练习',
      durationMinutes: scenario.durationMinutes || 5
    });
    if (app.trackKbEvent) {
      app.trackKbEvent({ event_type: 'development_share', module_key: 'development_zone', page_key: 'development_detail', child_id: this.data.currentChild && this.data.currentChild.id });
    }
    return {
      title: scenario.title || '今天和孩子做一个小练习',
      path: '/pages/share/preview/preview?shareType=development_practice',
      imageUrl: '/images/default-article.png'
    };
  }
});
