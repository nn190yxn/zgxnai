// 账号注销页面
var app = getApp();

Page({
  data: {
    canDelete: false
  },

  onLoad: function() {
    wx.setNavigationBarTitle({
      title: '账号注销'
    });
  },

  // 勾选确认
  onCheckboxChange: function(e) {
    var checked = e.detail.value;
    this.setData({
      canDelete: checked.includes('confirmed')
    });
  },

  // 注销账号
  onDeleteAccount: function() {
    var that = this;
    
    if (!that.data.canDelete) {
      wx.showToast({
        title: '请先勾选确认',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认注销',
      content: '注销后所有数据将无法恢复，确定要注销账号吗？',
      confirmText: '确定注销',
      confirmColor: '#FF3B30',
      success: function(res) {
        if (res.confirm) {
          that.requestAccountDeletion();
        }
      }
    });
  },

  // 请求注销
  requestAccountDeletion: function() {
    var that = this;
    
    wx.showLoading({
      title: '正在处理...',
      mask: true
    });

    app.request({
      url: '/auth/account-deletion',
      method: 'POST'
    }).then(function(res) {
      wx.hideLoading();

      var success = !!(res && (res.success === true || res.code === 0));
      if (success) {
        // 清除本地数据
        app.logout();
        
        wx.showModal({
          title: '注销成功',
          content: '您的账号已成功注销，感谢您的使用。',
          showCancel: false,
          success: function() {
            wx.reLaunch({
              url: '/pages/index/index',
              fail: function() {
                wx.showToast({ title: '页面跳转失败', icon: 'none' });
              }
            });
          }
        });
      } else {
        wx.showToast({
          title: (res && res.message) || '注销失败',
          icon: 'none'
        });
      }
    }).catch(function(err) {
      wx.hideLoading();
      wx.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none'
      });
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
