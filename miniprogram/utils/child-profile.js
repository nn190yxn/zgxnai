// 孩子档案管理
function normalizeChildren(childrenList) {
  if (!Array.isArray(childrenList)) {
    return [];
  }
  return childrenList.map(function(child) {
    return Object.assign({}, child);
  });
}

function loadChildProfile(app) {
  var profile = wx.getStorageSync('childProfile');
  if (profile) {
    app.globalData.childProfile = profile;
  }
}

function loadChildrenData(app) {
  var childrenList = normalizeChildren(wx.getStorageSync('childrenList') || []);
  var currentChild = wx.getStorageSync('currentChild');

  app.globalData.childrenList = childrenList;

  if (currentChild) {
    app.globalData.currentChild = currentChild;
  } else if (childrenList.length > 0) {
    var defaultChild = childrenList.find(function(child) {
      return child.isDefault;
    });
    if (!defaultChild) {
      defaultChild = Object.assign({}, childrenList[0]);
      defaultChild.isDefault = true;
      childrenList[0] = defaultChild;
      app.globalData.childrenList = childrenList;
      wx.setStorageSync('childrenList', childrenList);
    }
    app.globalData.currentChild = defaultChild;
    wx.setStorageSync('currentChild', defaultChild);
  }
}

function switchCurrentChild(app, childId) {
  var childrenList = app.globalData.childrenList;
  var child = childrenList.find(function(c) {
    return c.id === childId;
  });

  if (child) {
    childrenList.forEach(function(c) {
      c.isDefault = c.id === childId;
    });

    app.globalData.currentChild = child;
    app.globalData.childrenList = childrenList;

    wx.setStorageSync('currentChild', child);
    wx.setStorageSync('childrenList', childrenList);

    return true;
  }
  return false;
}

function updateReadingTaskStats(app, payload) {
  if (!payload) {
    return;
  }
  var stats = {
    total: payload.total || 0,
    completed: payload.completed || 0,
    completionRate: payload.completionRate || 0,
    updatedAt: Date.now()
  };
  app.globalData.readingTaskStats = stats;
  wx.setStorageSync('readingTaskStats', stats);
}

function getReadingTaskStats(app) {
  return app.globalData.readingTaskStats || wx.getStorageSync('readingTaskStats') || {
    total: 0,
    completed: 0,
    completionRate: 0,
    updatedAt: 0
  };
}

module.exports = {
  loadChildProfile: loadChildProfile,
  loadChildrenData: loadChildrenData,
  switchCurrentChild: switchCurrentChild,
  updateReadingTaskStats: updateReadingTaskStats,
  getReadingTaskStats: getReadingTaskStats
};
