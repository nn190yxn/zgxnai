// 知识点列表页面逻辑
var app = getApp();

Page({
  data: {
    // 学科信息
    subjectCode: '',
    subjectName: '',
    grade: 1,
    childId: 0,

    // 章节列表
    chapterList: [],

    // 当前展开的章节ID
    expandedChapterId: null,

    // 加载状态
    loading: false,

    // 快速测试弹窗
    showTestModal: false,
    currentPoint: null
  },

  handleInvalidEntry: function(message) {
    wx.showToast({
      title: message || '页面参数缺失',
      icon: 'none'
    });
    setTimeout(function() {
      wx.navigateBack({
        fail: function() {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
    }, 300);
  },

  onLoad: function(options) {
    var that = this;
    options = options || {};

    if (!options.subjectCode) {
      that.handleInvalidEntry('缺少学科参数');
      return;
    }
    
    // 获取页面参数
    that.setData({
      subjectCode: options.subjectCode
    });
    if (options.subjectName) {
      that.setData({
        subjectName: decodeURIComponent(options.subjectName)
      });
    }
    if (options.grade) {
      that.setData({
        grade: parseInt(options.grade)
      });
    }
    if (options.childId) {
      that.setData({
        childId: parseInt(options.childId, 10) || 0
      });
    }

    // 设置页面标题
    wx.setNavigationBarTitle({
      title: that.data.subjectName || '知识点列表'
    });

    // 加载章节数据
    that.loadChapterList();
  },

  // 加载章节列表
  loadChapterList: function(fromPullDown) {
    var that = this;
    if (that.data.loading) {
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }
    
    that.setData({
      loading: true
    });

    if (app.shouldUseMockFallback()) {
      that.setData({
        chapterList: that.getMockChapterList(),
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    app.request({
      url: '/education/knowledge/chapters',
      method: 'GET',
      data: {
        subjectCode: that.data.subjectCode,
        grade: that.data.grade,
        childId: that.data.childId || ((app.getCurrentChild && app.getCurrentChild() && app.getCurrentChild().id) || 0)
      }
    }).then(function(res) {
      if (res && res.list) {
        that.setData({
          chapterList: res.list
        });
      }
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        app.showApiError('章节列表加载失败');
        that.setData({
          chapterList: []
        });
        return;
      }
      // 使用模拟数据
      that.setData({
        chapterList: that.getMockChapterList()
      });
    }).finally(function() {
      that.setData({
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  // 获取模拟章节数据（支持五大主题）
  getMockChapterList: function() {
    var subjectCode = this.data.subjectCode;
    
    // 五大主题模拟数据
    var topicMockData = {
      'logical_thinking': [
        {
          id: 1,
          name: '逻辑推理启蒙',
          progress: 60,
          points: [
            { id: 101, name: '形状配对游戏', status: 'mastered', difficulty: 1 },
            { id: 102, name: '因果关系探索', status: 'learning', difficulty: 2 },
            { id: 103, name: '简单模式识别', status: 'pending', difficulty: 1 }
          ]
        },
        {
          id: 2,
          name: '分析思维训练',
          progress: 30,
          points: [
            { id: 201, name: '分类与比较', status: 'learning', difficulty: 2 },
            { id: 202, name: '顺序与排序', status: 'pending', difficulty: 2 }
          ]
        }
      ],
      'reading_comprehension': [
        {
          id: 1,
          name: '阅读理解基础',
          progress: 50,
          points: [
            { id: 101, name: '绘本分镜阅读', status: 'mastered', difficulty: 1 },
            { id: 102, name: '短文理解练习', status: 'learning', difficulty: 2 },
            { id: 103, name: '关键词提取', status: 'pending', difficulty: 2 }
          ]
        },
        {
          id: 2,
          name: '深度理解训练',
          progress: 20,
          points: [
            { id: 201, name: '主旨概括', status: 'learning', difficulty: 3 },
            { id: 202, name: '推理判断', status: 'pending', difficulty: 3 }
          ]
        }
      ],
      'expression_communication': [
        {
          id: 1,
          name: '表达沟通启蒙',
          progress: 70,
          points: [
            { id: 101, name: '单词表达鼓励', status: 'mastered', difficulty: 1 },
            { id: 102, name: '手势沟通引导', status: 'learning', difficulty: 1 },
            { id: 103, name: '情绪表情认知', status: 'pending', difficulty: 2 }
          ]
        },
        {
          id: 2,
          name: '沟通技巧提升',
          progress: 40,
          points: [
            { id: 201, name: '需求表达训练', status: 'learning', difficulty: 2 },
            { id: 202, name: '简单指令回应', status: 'pending', difficulty: 2 }
          ]
        }
      ],
      'learning_metacognition': [
        {
          id: 1,
          name: '学习策略基础',
          progress: 45,
          points: [
            { id: 101, name: '注意力训练', status: 'mastered', difficulty: 1 },
            { id: 102, name: '记忆方法启蒙', status: 'learning', difficulty: 2 }
          ]
        },
        {
          id: 2,
          name: '自我监控能力',
          progress: 25,
          points: [
            { id: 201, name: '学习计划制定', status: 'learning', difficulty: 2 },
            { id: 202, name: '进度自我评估', status: 'pending', difficulty: 3 }
          ]
        }
      ],
      'inquiry_creativity': [
        {
          id: 1,
          name: '探究能力培养',
          progress: 55,
          points: [
            { id: 101, name: '观察与发现', status: 'mastered', difficulty: 1 },
            { id: 102, name: '提问与假设', status: 'learning', difficulty: 2 }
          ]
        },
        {
          id: 2,
          name: '创造性思维',
          progress: 35,
          points: [
            { id: 201, name: '联想与想象', status: 'learning', difficulty: 2 },
            { id: 202, name: '问题解决创新', status: 'pending', difficulty: 3 }
          ]
        }
      ]
    };
    
    if (topicMockData[subjectCode]) {
      return topicMockData[subjectCode];
    }
    
    // 兼容旧版学科数据
    if (subjectCode === 'chinese') {
      return [
        {
          id: 1,
          name: '第一单元 识字',
          progress: 80,
          points: [
            { id: 101, name: '生字学习：春、夏、秋、冬', status: 'mastered', difficulty: 1 },
            { id: 102, name: '生字学习：风、雨、雷、电', status: 'learning', difficulty: 2 },
            { id: 103, name: '生字学习：山、水、田、土', status: 'pending', difficulty: 1 },
            { id: 104, name: '词语搭配练习', status: 'pending', difficulty: 2 }
          ]
        },
        {
          id: 2,
          name: '第二单元 阅读',
          progress: 45,
          points: [
            { id: 201, name: '课文理解：《小蝌蚪找妈妈》', status: 'mastered', difficulty: 2 },
            { id: 202, name: '课文理解：《乌鸦喝水》', status: 'learning', difficulty: 2 },
            { id: 203, name: '阅读理解技巧', status: 'pending', difficulty: 3 }
          ]
        },
        {
          id: 3,
          name: '第三单元 写话',
          progress: 20,
          points: [
            { id: 301, name: '看图写话基础', status: 'learning', difficulty: 2 },
            { id: 302, name: '简单句子写作', status: 'pending', difficulty: 2 },
            { id: 303, name: '标点符号使用', status: 'pending', difficulty: 1 }
          ]
        }
      ];
    } else if (subjectCode === 'math') {
      return [
        {
          id: 1,
          name: '第一单元 数与运算',
          progress: 60,
          points: [
            { id: 101, name: '10以内数的认识', status: 'mastered', difficulty: 1 },
            { id: 102, name: '10以内加减法', status: 'mastered', difficulty: 2 },
            { id: 103, name: '20以内进位加法', status: 'learning', difficulty: 3 },
            { id: 104, name: '20以内退位减法', status: 'pending', difficulty: 3 }
          ]
        },
        {
          id: 2,
          name: '第二单元 图形与几何',
          progress: 30,
          points: [
            { id: 201, name: '认识平面图形', status: 'mastered', difficulty: 1 },
            { id: 202, name: '图形的拼组', status: 'learning', difficulty: 2 },
            { id: 203, name: '认识立体图形', status: 'pending', difficulty: 2 }
          ]
        },
        {
          id: 3,
          name: '第三单元 测量',
          progress: 0,
          points: [
            { id: 301, name: '认识长度单位', status: 'pending', difficulty: 2 },
            { id: 302, name: '简单的测量', status: 'pending', difficulty: 2 }
          ]
        }
      ];
    } else if (subjectCode === 'english') {
      return [
        {
          id: 1,
          name: 'Unit 1 Hello!',
          progress: 90,
          points: [
            { id: 101, name: 'Greetings 问候语', status: 'mastered', difficulty: 1 },
            { id: 102, name: 'Self-introduction 自我介绍', status: 'mastered', difficulty: 1 },
            { id: 103, name: 'Numbers 1-10 数字', status: 'learning', difficulty: 1 }
          ]
        },
        {
          id: 2,
          name: 'Unit 2 My Family',
          progress: 50,
          points: [
            { id: 201, name: 'Family Members 家庭成员', status: 'mastered', difficulty: 1 },
            { id: 202, name: 'This is... 句型', status: 'learning', difficulty: 2 },
            { id: 203, name: 'Possessive Pronouns 物主代词', status: 'pending', difficulty: 2 }
          ]
        }
      ];
    } else {
      return [
        {
          id: 1,
          name: '第一章 基础知识',
          progress: 40,
          points: [
            { id: 101, name: '知识点1', status: 'mastered', difficulty: 1 },
            { id: 102, name: '知识点2', status: 'learning', difficulty: 2 },
            { id: 103, name: '知识点3', status: 'pending', difficulty: 1 }
          ]
        }
      ];
    }
  },

  // 展开/收起章节
  toggleChapter: function(e) {
    var that = this;
    var chapterId = e.currentTarget.dataset.id;
    
    if (that.data.expandedChapterId === chapterId) {
      // 收起当前章节
      that.setData({
        expandedChapterId: null
      });
    } else {
      // 展开新章节
      that.setData({
        expandedChapterId: chapterId
      });
    }
  },

  // 点击知识点
  onPointTap: function(e) {
    var that = this;
    var point = e.currentTarget.dataset.point;
    
    if (!point) {
      return;
    }

    // 跳转到知识点详情页面
    wx.navigateTo({
      url: '/pages/textbook/knowledge-detail/knowledge-detail?pointId=' + point.id + '&subjectCode=' + that.data.subjectCode + '&pointName=' + encodeURIComponent(point.name) + '&childId=' + (that.data.childId || 0),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 快速测试
  onQuickTest: function(e) {
    var that = this;
    var point = e.currentTarget.dataset.point;
    
    if (!point) {
      return;
    }

    that.setData({
      currentPoint: point,
      showTestModal: true
    });
  },

  // 开始测试
  startTest: function() {
    var that = this;
    var point = that.data.currentPoint;
    
    if (!point) {
      return;
    }

    that.hideTestModal();

    // 跳转到测试页面
    wx.navigateTo({
      url: '/pages/textbook/knowledge-detail/knowledge-detail?pointId=' + point.id + '&subjectCode=' + that.data.subjectCode + '&mode=test&childId=' + (that.data.childId || 0),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 隐藏测试弹窗
  hideTestModal: function() {
    this.setData({
      showTestModal: false,
      currentPoint: null
    });
  },

  // 阻止事件冒泡
  preventBubble: function() {
    // 空函数
  },

  // 获取状态文字
  getStatusText: function(status) {
    var statusMap = {
      'mastered': '已掌握',
      'learning': '学习中',
      'pending': '待学习'
    };
    return statusMap[status] || '未知';
  },

  // 获取难度文字
  getDifficultyText: function(difficulty) {
    var difficultyMap = {
      1: '简单',
      2: '中等',
      3: '困难'
    };
    return difficultyMap[difficulty] || '未知';
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    that.loadChapterList(true);
  },

  // 分享
  onShareAppMessage: function() {
    var that = this;
    return {
      title: app.buildShareTitle('knowledge_list', {
        subjectName: that.data.subjectName
      }),
      path: '/pages/textbook/knowledge-list/knowledge-list?subjectCode=' + that.data.subjectCode + '&subjectName=' + encodeURIComponent(that.data.subjectName) + '&grade=' + that.data.grade
    };
  }
});
