var TAB_PATHS = {
  development: '/pages/development/index/index',
  growth: '/pages/growth-record/index',
  profile: '/pages/profile/profile'
};

function returnToMainPath(fallbackKey) {
  var fallbackUrl = TAB_PATHS[fallbackKey] || TAB_PATHS.development;
  var pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
  if (pages.length > 1) {
    wx.navigateBack({
      delta: 1,
      fail: function() {
        wx.switchTab({ url: fallbackUrl });
      }
    });
    return;
  }
  wx.switchTab({ url: fallbackUrl });
}

module.exports = {
  TAB_PATHS: TAB_PATHS,
  returnToMainPath: returnToMainPath
};
