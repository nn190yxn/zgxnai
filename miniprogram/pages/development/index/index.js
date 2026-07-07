const developmentZones = require('../../../utils/development-zones.js');

Page({
  data: {
    zones: []
  },

  onLoad() {
    this.setData({
      zones: this.buildZoneCards()
    });
  },

  buildZoneCards() {
    return developmentZones.getDevelopmentZones().map(function(zone) {
      return {
        code: zone.code,
        title: zone.title,
        subtitle: zone.subtitle,
        actionText: zone.actionText,
        scenarioCount: (zone.scenarios || []).length,
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
