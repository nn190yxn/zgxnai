// 用户协议页面
Page({
  data: {},

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '用户服务协议'
    });
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿AI助理',
      path: '/pages/index/index'
    };
  }
});
