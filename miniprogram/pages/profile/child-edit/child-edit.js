// 孩子档案编辑页面
var app = getApp();

Page({
  data: {
    isEdit: false,
    childId: null,
    today: '',
    formData: {
      name: '',
      nickname: '',
      birthday: '',
      gender: 'male',
      avatar: '',
      height: '',
      weight: '',
      allergies: '',
      specialConditions: '',
      tags: []
    },
    genderOptions: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ],
    tagOptions: ['活泼好动', '内向安静', '喜欢运动', '喜欢阅读', '挑食', '睡眠不好', '过敏体质', '早产'],
    tagItems: [],
    selectedTags: [],
    maxTags: 5,
    errors: {},
    loading: false,
    submitting: false
  },

  onLoad: function(options) {
    this._navigateBackTimer = null;


    var that = this;
    that.setData({
      today: that.getToday(),
      tagItems: that.buildTagItems([]),
      formData: Object.assign({}, that.data.formData)
    });
    if (options.id) {
      that.setData({
        isEdit: true,
        childId: options.id
      });
      that.loadChildData(options.id);
    }
  },

  onUnload: function() {
    this.clearNavigateBackTimer();
  },

  clearNavigateBackTimer: function() {
    if (this._navigateBackTimer) {
      clearTimeout(this._navigateBackTimer);
      this._navigateBackTimer = null;
    }
  },

  scheduleNavigateBack: function(delay) {
    this.clearNavigateBackTimer();
    this._navigateBackTimer = setTimeout(function() {
      wx.navigateBack();
    }, delay || 1000);
  },

  // 加载孩子数据
  loadChildData: function(childId) {
    var that = this;
    that.setData({ loading: true });

    // 先从缓存读取
    var cachedChildren = wx.getStorageSync('childrenList') || [];
    cachedChildren = app.normalizeChildren(cachedChildren);
    var cachedChild = cachedChildren.find(function(child) {
      return String(child.id) === String(childId);
    });

    if (cachedChild) {
      var cachedTags = app.normalizeStringArray(cachedChild.tags);
      var cachedAllergies = app.normalizeStringArray(cachedChild.allergies);
      that.setData({
        formData: {
          name: cachedChild.name || '',
          nickname: cachedChild.nickname || '',
          birthday: cachedChild.birth_date || cachedChild.birthday || '',
          gender: cachedChild.gender || 'male',
          avatar: cachedChild.avatar || '',
          height: cachedChild.current_height || cachedChild.height || '',
          weight: cachedChild.current_weight || cachedChild.weight || '',
          allergies: cachedAllergies.join('、'),
          specialConditions: cachedChild.special_notes || cachedChild.specialConditions || '',
          tags: cachedTags
        },
        selectedTags: cachedTags,
        tagItems: that.buildTagItems(cachedTags),
        loading: false
      });
    }

    if (app.shouldUseMockFallback()) {
      that.setData({ loading: false });
      if (!cachedChild) {
        wx.showToast({
          title: '本地还没有孩子档案',
          icon: 'none'
        });
      }
      return;
    }

    // 从服务器获取最新数据
    app.request({
      url: '/children/' + childId,
      method: 'GET'
    }).then(function(res) {
      var child = app.normalizeChild(res || {});
      var childTags = app.normalizeStringArray(child.tags);
      var childAllergies = app.normalizeStringArray(child.allergies);
      that.setData({
        formData: {
          name: child.name || '',
          nickname: child.nickname || '',
          birthday: child.birth_date || child.birthday || '',
          gender: child.gender || 'male',
          avatar: child.avatar || '',
          height: child.current_height || child.height || '',
          weight: child.current_weight || child.weight || '',
          allergies: childAllergies.join('、'),
          specialConditions: child.special_notes || child.specialConditions || '',
          tags: childTags
        },
        selectedTags: childTags,
        tagItems: that.buildTagItems(childTags),
        loading: false
      });
    }).catch(function(err) {
      that.setData({ loading: false });
      if (!cachedChild) {
        wx.showToast({
          title: '档案没加载出来',
          icon: 'none'
        });
      }
    });
  },

  // 输入框变化
  onInputChange: function(e) {
    var field = e.currentTarget.dataset.field;
    var value = e.detail.value;
    var nextFormData = Object.assign({}, this.data.formData);
    nextFormData[field] = value;
    this.setData({ formData: nextFormData });
    this.clearError(field);
  },

  // 性别选择
  onGenderChange: function(e) {
    var nextFormData = Object.assign({}, this.data.formData, {
      gender: e.detail.value
    });
    this.setData({ formData: nextFormData });
  },

  // 日期选择
  onDateChange: function(e) {
    var nextFormData = Object.assign({}, this.data.formData, {
      birthday: e.detail.value
    });
    this.setData({ formData: nextFormData });
  },

  buildTagItems: function(selectedTags) {
    var selected = app.normalizeStringArray(selectedTags);
    return this.data.tagOptions.map(function(tag) {
      return {
        name: tag,
        selected: selected.indexOf(tag) > -1
      };
    });
  },

  // 标签选择
  onTagToggle: function(e) {
    var that = this;
    var dataset = (e.currentTarget && e.currentTarget.dataset) || {};
    var targetDataset = (e.target && e.target.dataset) || {};
    var tag = dataset.tag || targetDataset.tag;
    var indexValue = dataset.index !== undefined ? dataset.index : targetDataset.index;
    if (!tag) {
      tag = that.data.tagOptions[Number(indexValue)];
    }
    if (!tag) {
      if (app.globalData.isDebug) console.warn('Tag tap ignored: invalid index', {
        index: indexValue,
        dataset: e.currentTarget.dataset
      });
      return;
    }
    var selectedTags = app.normalizeStringArray(that.data.selectedTags);
    var nextFormData = Object.assign({}, that.data.formData);

    var index = selectedTags.indexOf(tag);
    if (index > -1) {
      selectedTags.splice(index, 1);
    } else {
      if (selectedTags.length >= that.data.maxTags) {
        wx.showToast({
          title: '最多选择' + that.data.maxTags + '个标签',
          icon: 'none'
        });
        return;
      }
      selectedTags.push(tag);
    }

    nextFormData.tags = selectedTags.slice();
    that.setData({
      selectedTags: selectedTags.slice(),
      tagItems: that.buildTagItems(selectedTags),
      formData: nextFormData
    });
  },

  getToday: function() {
    var today = new Date();
    var year = today.getFullYear();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    return year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day;
  },

  // 选择头像
  onAvatarError: function() {
    var formData = this.data.formData;
    formData.avatar = '';
    this.setData({ formData: formData });
  },

  chooseAvatar: function() {
    var that = this;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        var tempFilePath = res.tempFiles[0].tempFilePath;
        that.uploadAvatar(tempFilePath);
      }
    });
  },

  // 上传头像
  uploadAvatar: function(filePath) {
    var that = this;
    var uploadUrl = '';
    wx.showLoading({ title: '上传中...' });

    if (app.shouldUseMockFallback()) {
      var localFormData = that.data.formData;
      localFormData.avatar = filePath;
      that.setData({ formData: localFormData });
      wx.hideLoading();
      wx.showToast({
        title: '头像已选择',
        icon: 'success'
      });
      return;
    }

    app.ensureLogin().then(function() {
      uploadUrl = app.getApiUrl('/children/upload-avatar');
      wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        timeout: app.globalData.requestTimeoutMs || 15000,
        header: {
          'Authorization': 'Bearer ' + wx.getStorageSync('token')
        },
        success: function(res) {
          var data = {};
          try {
            data = JSON.parse(res.data || '{}');
          } catch (e) {
            data = {};
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            if (app.globalData.isDebug) console.error('头像上传接口失败', {
              url: uploadUrl,
              statusCode: res.statusCode,
              response: data
            });
            wx.showToast({
              title: that.getErrorMessage(data, '上传失败'),
              icon: 'none'
            });
            return;
          }
          var payload = data.data || data;
          if (payload.url) {
            var formData = that.data.formData;
            formData.avatar = app.normalizeAssetUrl(payload.url);
            that.setData({ formData: formData });
          } else {
            wx.showToast({
              title: '上传失败',
              icon: 'none'
            });
          }
        },
        fail: function(err) {
          if (app.globalData.isDebug) console.error('头像上传网络失败', {
            url: uploadUrl,
            error: err
          });
          wx.showToast({
            title: '上传超时或网络失败',
            icon: 'none'
          });
        },
        complete: function() {
          wx.hideLoading();
        }
      });
    }).catch(function(err) {
      wx.hideLoading();
      if (app.globalData.isDebug) console.error('头像上传前登录失败', err);
      wx.showToast({
        title: that.getErrorMessage(err, '请先登录'),
        icon: 'none'
      });
    });
  },

  // 清除错误
  clearError: function(field) {
    var errors = this.data.errors;
    if (errors[field]) {
      delete errors[field];
      this.setData({ errors: errors });
    }
  },

  // 表单验证
  validateForm: function() {
    var that = this;
    var formData = that.data.formData;
    var errors = {};

    if (!formData.name || formData.name.trim() === '') {
      errors.name = '先填写孩子姓名';
    }
    if (!formData.birthday) {
      errors.birthday = '先选择出生日期';
    }

    that.setData({ errors: errors });
    return Object.keys(errors).length === 0;
  },

  getErrorMessage: function(err, fallback) {
    if (!err) {
      return fallback;
    }
    if (err.message) {
      return err.message;
    }
    if (err.detail) {
      if (typeof err.detail === 'string') {
        return err.detail;
      }
      if (err.detail.message) {
        return err.detail.message;
      }
    }
    if (typeof err === 'string') {
      return err;
    }
    return fallback;
  },

  buildChildPayload: function(data, fallbackId) {
    var child = app.normalizeChild(Object.assign({}, data || {}));
    child.id = child.id || fallbackId || ('local_child_' + Date.now());
    child.birthday = child.birthday || child.birth_date || '';
    child.birth_date = child.birth_date || child.birthday || '';
    child.height = child.height || child.current_height || '';
    child.weight = child.weight || child.current_weight || '';
    child.isDefault = !!child.isDefault;
    return child;
  },

  saveChildLocally: function(data) {
    var childrenList = app.normalizeChildren(wx.getStorageSync('childrenList') || []);
    var savedChild = this.buildChildPayload(data, this.data.childId);
    var savedChildId = savedChild.id;

    if (this.data.isEdit) {
      var index = childrenList.findIndex(function(child) {
        return String(child.id) === String(savedChildId);
      });
      if (index > -1) {
        savedChild.isDefault = !!childrenList[index].isDefault;
        childrenList[index] = savedChild;
      } else {
        childrenList.push(savedChild);
      }
    } else {
      if (childrenList.length === 0) {
        savedChild.isDefault = true;
      }
      childrenList.push(savedChild);
    }

    if (!childrenList.some(function(child) { return child.isDefault; }) && childrenList.length > 0) {
      childrenList[0].isDefault = true;
    }

    app.globalData.childrenList = childrenList;
    wx.setStorageSync('childrenList', childrenList);

    var currentChild = childrenList.find(function(child) {
      return child.isDefault;
    }) || childrenList[0] || null;
    app.globalData.currentChild = currentChild;
    wx.setStorageSync('currentChild', currentChild);
    return savedChild;
  },

  finishSaveSuccess: function() {
    var that = this;
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });

    that.scheduleNavigateBack(1000);
  },

  // 保存
  save: function() {
    var that = this;

    if (!that.validateForm()) {
      return;
    }

    that.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    var formData = that.data.formData;
    var data = {
      name: formData.name.trim(),
      nickname: formData.nickname.trim(),
      birth_date: formData.birthday,
      gender: formData.gender,
      avatar: formData.avatar,
      current_height: formData.height ? parseFloat(formData.height) : null,
      current_weight: formData.weight ? parseFloat(formData.weight) : null,
      allergies: formData.allergies ? formData.allergies.split(/[、,，\s]+/).filter(function(item) { return item; }) : [],
      special_notes: formData.specialConditions.trim(),
      tags: formData.tags
    };

    if (app.shouldUseMockFallback()) {
      that.saveChildLocally(data);
      wx.hideLoading();
      that.setData({ submitting: false });
      that.finishSaveSuccess();
      return;
    }

    app.ensureLogin().then(function() {
      return that.data.isEdit ?
        app.request({
          url: '/children/' + that.data.childId,
          method: 'PUT',
          data: data
        }) :
        app.request({
          url: '/children',
          method: 'POST',
          data: data
        });
    }).then(function(res) {
      wx.hideLoading();
      that.setData({ submitting: false });

      // 更新本地缓存
      var childrenList = app.normalizeChildren(wx.getStorageSync('childrenList') || []);
      var savedChild = app.normalizeChild(res || {});
      var savedChildId = savedChild.id || that.data.childId;

      if (that.data.isEdit) {
        var index = childrenList.findIndex(function(child) {
          return String(child.id) === String(savedChildId) || String(child.id) === String(that.data.childId);
        });
        if (index > -1) {
          childrenList[index] = savedChild;
        } else {
          childrenList.push(savedChild);
        }
      } else {
        // 新添加的孩子，如果是第一个则设为默认
        if (childrenList.length === 0) {
          savedChild.isDefault = true;
          app.globalData.currentChild = savedChild;
          wx.setStorageSync('currentChild', savedChild);
        }
        childrenList.push(savedChild);
      }

      app.globalData.childrenList = childrenList;

      wx.setStorageSync('childrenList', childrenList);

      if (app.globalData.currentChild && (String(app.globalData.currentChild.id) === String(savedChildId) || String(app.globalData.currentChild.id) === String(that.data.childId))) {
        app.globalData.currentChild = savedChild;
        wx.setStorageSync('currentChild', savedChild);
      }

      that.finishSaveSuccess();
    }).catch(function(err) {
      wx.hideLoading();
      that.setData({ submitting: false });
      if (app.globalData.isDebug) console.error('保存孩子档案失败', err);
      wx.showToast({
        title: that.getErrorMessage(err, '没保存上，请再试一次'),
        icon: 'none'
      });
    });
  },

  // 取消
  cancel: function() {
    wx.navigateBack();
  },

  // 删除
  deleteChild: function() {
    var that = this;

    if (!that.data.isEdit) {
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个孩子档案吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#E53935',
      success: function(res) {
        if (res.confirm) {
          that.doDelete();
        }
      }
    });
  },

  // 执行删除
  doDelete: function() {
    var that = this;
    wx.showLoading({ title: '删除中...' });

    if (app.shouldUseMockFallback()) {
      var localChildren = wx.getStorageSync('childrenList') || [];
      localChildren = localChildren.filter(function(child) {
        return String(child.id) !== String(that.data.childId);
      });
      if (localChildren.length > 0 && !localChildren.some(function(child) { return child.isDefault; })) {
        localChildren[0].isDefault = true;
      }
      wx.setStorageSync('childrenList', localChildren);
      app.globalData.childrenList = localChildren;
      var localDefault = localChildren.find(function(child) { return child.isDefault; }) || localChildren[0] || null;
      app.globalData.currentChild = localDefault;
      wx.setStorageSync('currentChild', localDefault);
      wx.hideLoading();
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      that.scheduleNavigateBack(1000);
      return;
    }

    app.request({
      url: '/children/' + that.data.childId,
      method: 'DELETE'
    }).then(function(res) {
      wx.hideLoading();

      // 更新本地缓存
      var childrenList = wx.getStorageSync('childrenList') || [];
      childrenList = childrenList.filter(function(child) {
        return String(child.id) !== String(that.data.childId);
      });
      wx.setStorageSync('childrenList', childrenList);

      // 如果删除的是默认孩子，更新全局状态
      var currentChild = wx.getStorageSync('currentChild');
      if (currentChild && String(currentChild.id) === String(that.data.childId)) {
        var newDefault = childrenList[0] || null;
        if (newDefault) {
          newDefault.isDefault = true;
        }
        app.globalData.currentChild = newDefault;
        wx.setStorageSync('currentChild', newDefault);
      }

      app.globalData.childrenList = childrenList;

      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });

      that.scheduleNavigateBack(1500);
    }).catch(function(err) {
      wx.hideLoading();
      wx.showToast({
        title: '没删掉，请再试一次',
        icon: 'none'
      });
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
