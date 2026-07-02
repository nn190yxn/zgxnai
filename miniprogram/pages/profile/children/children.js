// 孩子档案列表页面
var app = getApp();

Page({
  data: {
    children: [],
    maxChildren: 5,
    loading: false,
    initialized: false
  },

  onLoad: function() {
    this.loadChildren();
  },

  onShow: function() {
    if (!this.data.initialized) {
      return;
    }
    this.loadChildren();
  },

  // 加载孩子档案列表
  loadChildren: function() {
    var that = this;
    if (that._loadingPromise) {
      return that._loadingPromise;
    }
    that.setData({ loading: true });

    // 先从本地缓存读取
    var cachedChildren = wx.getStorageSync('childrenList');
    if (cachedChildren && cachedChildren.length > 0) {
      cachedChildren = app.normalizeChildren(cachedChildren);
      that.setData({
        children: cachedChildren,
        loading: false
      });
    }

    // 从服务器获取最新数据
    if (app.shouldUseMockFallback()) {
      that.setData({
        children: cachedChildren || [],
        loading: false,
        initialized: true
      });
      return Promise.resolve(cachedChildren || []);
    }

    that._loadingPromise = app.ensureLogin().then(function() {
      return app.request({
        url: '/children',
        method: 'GET'
      });
    }).then(function(res) {
      var children = app.normalizeChildren(Array.isArray(res) ? res : []);
      that.setData({
        children: children,
        loading: false
      });
      // 更新本地缓存
      wx.setStorageSync('childrenList', children);
    }).catch(function(err) {
      if (app.globalData.isDebug) console.error('加载孩子档案列表失败', err);
      that.setData({ loading: false });
      // 如果没有缓存数据，显示空状态
      if (!cachedChildren || cachedChildren.length === 0) {
        // 加载失败，显示空状态
      }
    }).finally(function() {
      that._loadingPromise = null;
    });

    that.setData({ initialized: true });
    return that._loadingPromise;
  },

  // 计算年龄
  calculateAge: function(birthday) {
    if (!birthday) return '';
    var birth = new Date(birthday);
    var today = new Date();
    var age = today.getFullYear() - birth.getFullYear();
    var monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  },

  // 格式化年龄显示
  formatAge: function(birthday) {
    if (!birthday) return '未知';
    var birth = new Date(birthday);
    var today = new Date();
    var years = today.getFullYear() - birth.getFullYear();
    var months = today.getMonth() - birth.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < birth.getDate())) {
      years--;
      months += 12;
    }
    if (today.getDate() < birth.getDate() && months > 0) {
      months--;
    }

    if (years < 1) {
      return months + '个月';
    } else if (years < 3) {
      return years + '岁' + months + '个月';
    } else {
      return years + '岁';
    }
  },

  // 获取性别图标
  getGenderIcon: function(gender) {
    if (gender === 'male') return '👦';
    if (gender === 'female') return '👧';
    return '👶';
  },

  onAvatarError: function(e) {
    var childId = e.currentTarget.dataset.id;
    var children = (this.data.children || []).map(function(child) {
      if (String(child.id) === String(childId)) {
        var nextChild = Object.assign({}, child);
        nextChild.avatar = '';
        return nextChild;
      }
      return child;
    });
    this.setData({ children: children });
  },

  // 设置默认孩子
  setDefault: function(e) {
    var that = this;
    if (that._setDefaultPending) {
      return;
    }
    var childId = e.currentTarget.dataset.id;
    var children = that.data.children;
    that._setDefaultPending = true;

    if (app.shouldUseMockFallback()) {
      var localChildren = children.map(function(child) {
        child.isDefault = String(child.id) === String(childId);
        return child;
      });
      that.setData({ children: localChildren });
      var localDefault = localChildren.find(function(child) {
        return String(child.id) === String(childId);
      }) || null;
      app.globalData.currentChild = localDefault;
      wx.setStorageSync('currentChild', localDefault);
      wx.setStorageSync('childrenList', localChildren);
      that._setDefaultPending = false;
      wx.showToast({
        title: '已设为默认',
        icon: 'success'
      });
      return;
    }

    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }

    // 更新本地状态
    var updatedChildren = children.map(function(child) {
      child.isDefault = String(child.id) === String(childId);
      return child;
    });

    that.setData({ children: updatedChildren });

    // 更新全局状态
    var defaultChild = updatedChildren.find(function(child) {
      return String(child.id) === String(childId);
    });
    app.globalData.currentChild = defaultChild;
    wx.setStorageSync('currentChild', defaultChild);
    wx.setStorageSync('childrenList', updatedChildren);

    // 同步到服务器
    return app.request({
      url: '/children/' + childId + '/set-default',
      method: 'PUT'
    }).then(function(res) {
      wx.showToast({
        title: '已设为默认',
        icon: 'success'
      });
    }).catch(function(err) {
      wx.showToast({
        title: '设置失败',
        icon: 'none'
      });
      // 回滚
      that.loadChildren();
    });
    }).finally(function() {
      that._setDefaultPending = false;
    });
  },

  // 添加孩子
  addChild: function() {
    var that = this;
    if (that.data.children.length >= that.data.maxChildren) {
      wx.showToast({
        title: '最多添加' + that.data.maxChildren + '个孩子',
        icon: 'none'
      });
      return;
    }
    if (app.shouldUseMockFallback()) {
      wx.navigateTo({
        url: '/pages/profile/child-edit/child-edit',
        fail: function() {
          wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
        }
      });
      return;
    }
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }

      wx.navigateTo({
        url: '/pages/profile/child-edit/child-edit',
        fail: function() {
          wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
        }
      });
    });
  },

  // 编辑孩子
  editChild: function(e) {
    var childId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '/pages/profile/child-edit/child-edit?id=' + childId,
      fail: function() {
        wx.showToast({ title: '页面没打开，请再试一次', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    var task = that.loadChildren();
    if (task && typeof task.finally === 'function') {
      task.finally(function() {
        wx.stopPullDownRefresh();
      });
      return;
    }
    wx.stopPullDownRefresh();
  }
,

  onShareAppMessage: function() {
    return {
      title: '小牛育儿',
      path: '/pages/index/index'
    };
  }
});
