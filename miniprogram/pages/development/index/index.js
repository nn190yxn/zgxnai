const app = getApp();
const developmentZones = require('../../../utils/development-zones.js');
const painPoints = require('../../../utils/pain-points.js');

Page({
  data: {
    zones: [],
    featuredZones: [],
    loading: false,
    contentSource: 'local_fallback',
    isFallback: true,
    loadError: '',
    painPoints: [],
    painPointSource: 'local_fallback',
    painPointCategory: ''
  },

  onLoad() {
    var localCards = this.buildZoneCards();
    this.setData({
      zones: localCards,
      featuredZones: localCards.filter(function(item) { return item.isPrimary; })
    });
    this.loadZones();
    this.loadPainPoints();
  },

  loadPainPoints: function() {
    var that = this;
    return painPoints.readList(app, {}).then(function(result) {
      that.setData({ painPoints: result.list, painPointSource: result.source });
      return result;
    });
  },

  selectPainPointCategory: function(e) {
    this.setData({ painPointCategory: e.currentTarget.dataset.category || '' });
  },

  visiblePainPoints: function() {
    var category = this.data.painPointCategory;
    return (this.data.painPoints || []).filter(function(item) { return !category || item.category === category || item.categoryKey === category; });
  },

  openPainPoint: function(e) {
    var key = e.currentTarget.dataset.key || '';
    if (!key) return;
    wx.navigateTo({ url: '/pages/development/detail/detail?painPointKey=' + encodeURIComponent(key) });
  },

  loadZones() {
    var that = this;
    this.setData({ loading: true, loadError: '' });
    if (!app || typeof app.request !== 'function') {
      this.setData({ loading: false });
      return Promise.resolve(this.data.zones);
    }
    return app.request({ url: '/development-zones', method: 'GET' }).then(function(data) {
      var list = data && Array.isArray(data.list) ? data.list : [];
      if (list.length) {
        var cards = that.buildZoneCards(list);
        that.setData({
          zones: cards,
          featuredZones: cards.filter(function(item) { return item.isPrimary; }),
          contentSource: data.contentSource || 'server',
          isFallback: !!data.isFallback
        });
      }
      return data;
    }).catch(function(err) {
      that.setData({ loadError: app.getApiErrorMessage ? app.getApiErrorMessage(err, '专区内容暂时使用本地版本') : '专区内容暂时使用本地版本' });
      return null;
    }).finally(function() {
      that.setData({ loading: false });
    });
  },

  buildZoneCards(zones) {
    var source = Array.isArray(zones) ? zones : developmentZones.getDevelopmentZones();
    var primaryCodes = ['focus', 'sensory'];
    return source.map(function(zone) {
      return {
        code: zone.code,
        title: zone.title,
        subtitle: zone.subtitle,
        actionText: zone.actionText,
        scenarioCount: (zone.scenarios || []).length,
        isPrimary: primaryCodes.indexOf(zone.code) >= 0,
        isPremiumTopic: ['growth_management', 'body_safety'].indexOf(zone.code) >= 0,
        color: zone.theme && zone.theme.color ? zone.theme.color : '#FF6B35',
        tint: zone.theme && zone.theme.tint ? zone.theme.tint : '#FFF3EC'
      };
    });
  },

  openZone(e) {
    var zoneCode = e && e.currentTarget && e.currentTarget.dataset ? e.currentTarget.dataset.zone : '';
    var zone = developmentZones.getDevelopmentZoneByCode(zoneCode);
    if (!zone) {
      wx.showToast({ title: '这个专区还在准备中', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: '/pages/development/detail/detail?zone=' + encodeURIComponent(zone.code),
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  }
});
