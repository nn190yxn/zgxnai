// 隐私政策页面
Page({
  data: {},

  onLoad: function() {
    // 设置页面标题
    wx.setNavigationBarTitle({
      title: '隐私保护指引'
    });
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿',
      path: '/pages/index/index'
    };
  }
});
