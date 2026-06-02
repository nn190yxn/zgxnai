// 网络状态管理
function initNetworkStatus(app) {
  var that = app;
  if (!that.globalData.enableNetworkProbe) {
    return;
  }
  if (typeof wx.getNetworkType === 'function') {
    wx.getNetworkType({
      success: function(res) {
        that.globalData.networkType = res.networkType || 'unknown';
        that.globalData.isOnline = res.networkType !== 'none';
      }
    });
  }

  if (typeof wx.onNetworkStatusChange === 'function' && !wx.__gantuNetworkStatusInstalled) {
    wx.__gantuNetworkStatusInstalled = true;
    wx.onNetworkStatusChange(function(res) {
      that.globalData.isOnline = !!res.isConnected;
      that.globalData.networkType = res.networkType || (res.isConnected ? 'unknown' : 'none');
      if (!res.isConnected) {
        wx.showToast({
          title: '当前无网络，请连接后重试',
          icon: 'none'
        });
      }
    });
  }
}

module.exports = {
  initNetworkStatus: initNetworkStatus
};
