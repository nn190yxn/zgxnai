// 认证相关工具
function checkLoginStatus(app) {
  var userInfo = wx.getStorageSync('userInfo');
  var token = wx.getStorageSync('token');
  var refreshToken = wx.getStorageSync('refreshToken');
  if (token) {
    app.globalData.userInfo = userInfo || null;
    app.globalData.isLoggedIn = true;
  }
  if (refreshToken) {
    app.globalData.refreshToken = refreshToken;
  }
}

function logout(app) {
  app.globalData.userInfo = null;
  app.globalData.isLoggedIn = false;
  app.globalData.currentChild = null;
  app.globalData.childrenList = [];
  wx.removeStorageSync('userInfo');
  wx.removeStorageSync('token');
  wx.removeStorageSync('refreshToken');
  wx.removeStorageSync('childProfile');
  wx.removeStorageSync('currentChild');
  wx.removeStorageSync('childrenList');
  wx.removeStorageSync('chatMessages');
  wx.removeStorageSync('assessmentProgress');
  wx.removeStorageSync('assessmentHistory');
  wx.removeStorageSync('parenting_search_history');
}

module.exports = {
  checkLoginStatus: checkLoginStatus,
  logout: logout
};
