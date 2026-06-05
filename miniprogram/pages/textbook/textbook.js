// 能力成长页面逻辑
var app = getApp();

Page({
  data: {
    // 五大核心主题列表（新架构）
    subjectList: [
      {
        id: 1,
        code: 'logical_thinking',
        icon: '🧠',
        name: '逻辑思维',
        desc: '培养推理、分析与问题解决能力',
        color: '#2F80ED'
      },
      {
        id: 2,
        code: 'reading_comprehension',
        icon: '📖',
        name: '阅读理解',
        desc: '提升阅读速度与理解深度',
        color: '#E65100'
      },
      {
        id: 3,
        code: 'expression_communication',
        icon: '💬',
        name: '表达沟通',
        desc: '训练口头表达与社交沟通能力',
        color: '#FF6B35'
      },
      {
        id: 4,
        code: 'learning_metacognition',
        icon: '🎯',
        name: '学习元认知',
        desc: '培养学习策略与自我监控能力',
        color: '#6A1B9A'
      },
      {
        id: 5,
        code: 'inquiry_creativity',
        icon: '🔬',
        name: '探究创造',
        desc: '激发好奇心与创造性思维',
        color: '#C62828'
      }
    ],

    // 年龄段列表（替代年级）
    gradeList: [
      { id: 1, name: '0-1 岁' },
      { id: 2, name: '1-2 岁' },
      { id: 3, name: '2-3 岁' },
      { id: 4, name: '3-4 岁' },
      { id: 5, name: '4-5 岁' },
      { id: 6, name: '5-6 岁' },
      { id: 7, name: '6-7 岁' },
      { id: 8, name: '7-8 岁' },
      { id: 9, name: '8-9 岁' },
      { id: 10, name: '9-10 岁' },
      { id: 11, name: '10-11 岁' },
      { id: 12, name: '11-12 岁' },
      { id: 13, name: '12-13 岁' },
      { id: 14, name: '13-14 岁' }
    ],

    // 当前选中的年龄段索引
    currentGrade: 1,

    // 当前孩子信息
    currentChild: null,

    // 成长进度概览
    progressOverview: {
      totalPoints: 0,
      masteredPoints: 0,
      learningPoints: 0,
      masteryRate: 0
    },

    // 今日成长任务
    todayTasks: [],

    // 阅读力提升任务（阶段2最小闭环）
    readingTasks: [],

    // 阅读周报（阶段3最小版）
    readingWeeklyReport: {
      completionRate: 0,
      completed: 0,
      total: 0,
      streakDays: 0,
      suggestion: '坚持每天10分钟阅读任务',
      recordingCount: 0
    },

    // 语音辅助（阶段5最小版）
    ttsSampleUrl: '',
    isPlayingTts: false,
    isRecording: false,
    recordFilePath: '',

    // 加载状态
    loading: false,

    // 年级选择器显示状态
    showGradePicker: false,
    initialized: false
  },

  onLoad: function() {
    this.loadCurrentChild();
    this.loadGradeFromStorage();
    this.refreshCurrentChildFromServer().finally(function() {
      this.loadProgressOverview();
      this.loadTodayTasks();
      this.loadReadingTasks();
    }.bind(this));
  },

  onShow: function() {
    // 避免首屏 onLoad + onShow 重复请求
    if (!this.data.initialized) {
      return;
    }
    this.refreshCurrentChildFromServer().finally(function() {
      this.loadProgressOverview();
      this.loadTodayTasks();
      this.loadReadingTasks();
    }.bind(this));
  },

  onUnload: function() {
    if (this.ttsAudioContext) {
      this.ttsAudioContext.destroy();
    }
    if (this.recordAudioContext) {
      this.recordAudioContext.destroy();
    }
  },

  ensureAudioManagers: function() {
    if (!this.recorderManager && wx.getRecorderManager) {
      this.recorderManager = wx.getRecorderManager();
    }
    if (!this.ttsAudioContext && wx.createInnerAudioContext) {
      this.ttsAudioContext = wx.createInnerAudioContext();
    }
    if (!this.recordAudioContext && wx.createInnerAudioContext) {
      this.recordAudioContext = wx.createInnerAudioContext();
    }
    this.bindAudioEvents();
  },

  bindAudioEvents: function() {
    var that = this;
    if (this._audioEventsBound) {
      return;
    }
    if (!this.recorderManager || !this.ttsAudioContext || !this.recordAudioContext) {
      return;
    }
    this._audioEventsBound = true;

    this.recorderManager.onStop(function(res) {
      var path = (res && res.tempFilePath) || '';
      that.setData({
        isRecording: false,
        recordFilePath: path
      });
      if (path) {
        that.increaseRecordingCount();
        app.trackKbEvent({
          event_type: 'retell_complete',
          has_recording: true,
          duration_sec: 0,
          event_meta: { page: 'textbook_recording' }
        });
      }
    });

    this.ttsAudioContext.onEnded(function() {
      that.setData({ isPlayingTts: false });
    });

    this.ttsAudioContext.onError(function() {
      that.setData({ isPlayingTts: false });
      wx.showToast({ title: '音频播放失败', icon: 'none' });
    });

    this.recordAudioContext.onError(function() {
      wx.showToast({ title: '录音回放失败', icon: 'none' });
    });
  },

  loadReadingTasks: function() {
    var that = this;
    var completedMap = wx.getStorageSync('readingTaskCompletionMap') || {};
    var currentGrade = this.data.currentGrade || 1;
    var ageName = (this.data.gradeList[currentGrade - 1] || {}).name || '当前年龄';

    // 难度映射：后端 difficulty -> 前端 level
    var levelMap = {
      1: '入门',
      2: '标准',
      3: '提升',
      4: '拓展'
    };

    // 图标映射：后端 subject_code -> 前端 emoji
    var iconMap = {
      'reading_comprehension': { icon: '📖', label: '图文共读' },
      'logical_thinking': { icon: '🧠', label: '逻辑思维' },
      'expression_communication': { icon: '💬', label: '表达沟通' },
      'learning_metacognition': { icon: '🎯', label: '学习策略' },
      'inquiry_creativity': { icon: '🔬', label: '探究创造' }
    };

    // 从后端 API 获取阅读任务
    app.request({
      url: '/education/tasks/today',
      method: 'GET',
      data: {
        childId: (this.data.currentChild && this.data.currentChild.id) || 0,
        grade: ageName
      }
    }).then(function(res) {
      var list = (res && res.list) || [];

      // 如果后端没有数据，回退到默认数据
      if (list.length === 0) {
        that.loadDefaultReadingTasks(completedMap, ageName);
        return;
      }

      var tasks = list.map(function(task) {
        var subject = iconMap[task.subject_code] || { icon: '📖', label: '阅读任务' };
        // 使用后端返回的 cover_image 作为封面，如果没有则使用 icon_url
        var coverImage = task.cover_image || task.image_url || task.icon_url || '';
        // 使用后端返回的 icon_url 作为图标
        var iconUrl = task.icon_url || '';
        // 本地完成状态优先
        var localStatus = completedMap[task.task_code] ? 'completed' : (task.status || 'pending');

        return {
          id: task.id || task.task_code,
          taskCode: task.task_code,
          title: task.title,
          duration: task.duration || 10,
          level: levelMap[task.difficulty] || '入门',
          visualIcon: subject.icon,
          visualLabel: subject.label,
          ageRange: task.age_range || ageName,
          material: task.material || '',
          objective: task.objective || '',
          steps: task.steps || [],
          parentPrompt: task.parent_prompt || '',
          content: task.content || '',
          // 图片相关
          coverImage: coverImage,
          iconUrl: iconUrl,
          imageUrl: task.image_url || '',
          // 音频视频
          ttsUrl: task.audio_url || '',
          hasTts: !!(task.audio_url && task.audio_url.length > 0),
          audioUrl: task.audio_url || '',
          videoUrl: task.video_url || '',
          // 新增字段
          tips: task.tips || '',
          exampleAnswer: task.example_answer || '',
          // 状态
          status: localStatus,
          progress: task.progress || 0
        };
      });

      that.setData({
        readingTasks: tasks
      });

      // 曝光埋点
      for (var i = 0; i < tasks.length; i++) {
        app.trackKbEvent({
          event_type: 'task_exposure',
          task_id: tasks[i].id,
          event_meta: { page: 'textbook' }
        });
      }

      that.updateReadingTaskStats(tasks);
      that.loadReadingWeeklyReport();
    }).catch(function(err) {
      if (app.globalData.isDebug) console.error('[Textbook] 获取阅读任务失败:', err);
      // 出错时回退到默认数据
      that.loadDefaultReadingTasks(completedMap, ageName);
    });
  },

  // 默认阅读任务（作为后端 API 失败时的回退）
  loadDefaultReadingTasks: function(completedMap, ageName) {
    var currentGrade = this.data.currentGrade || 1;
    var tasks = [
      {
        id: 'r1',
        title: currentGrade <= 3 ? '亲子共读：找一找画面里的东西' : '绘本《小种子》分镜阅读',
        duration: 10,
        level: '入门',
        visualIcon: '📖',
        visualLabel: '图文共读',
        ageRange: ageName,
        material: currentGrade <= 3 ? '选择一本画面清楚、文字少的绘本，重点看人物、动物和动作。' : '选择一本有清晰开头、变化和结尾的绘本，用3页画面串起故事。',
        objective: currentGrade <= 3 ? '让孩子指出画面中的人物、物品或动作' : '找出故事主角与关键变化',
        steps: currentGrade <= 3
          ? ['家长先读一页', '请孩子指一指画面', '用一句短话回应孩子']
          : ['先看封面猜主角', '读3个关键画面', '让孩子说出发生了什么'],
        parentPrompt: currentGrade <= 3 ? '你看到谁了？它在做什么？' : '主角一开始在哪里？后来发生了什么变化？',
        content: '',
        coverImage: '',
        iconUrl: '',
        imageUrl: '',
        ttsUrl: '',
        hasTts: false,
        audioUrl: '',
        videoUrl: '',
        tips: '',
        exampleAnswer: '',
        status: completedMap.r1 ? 'completed' : 'pending',
        progress: 0
      },
      {
        id: 'r2',
        title: currentGrade <= 6 ? '故事理解：谁在做什么' : '短文理解：春天来了',
        duration: 10,
        level: '标准',
        visualIcon: '🌱',
        visualLabel: '理解提问',
        ageRange: ageName,
        material: currentGrade <= 6 ? '用一段3-5句话的小故事，围绕人物、地点、动作提问。' : '阅读一段80-120字短文，找出时间、地点、人物和结果。',
        objective: currentGrade <= 6 ? '回答“谁、在哪里、做什么”三个问题' : '完成3道理解题并口头复述1句',
        steps: currentGrade <= 6
          ? ['读完后停顿3秒', '问一个事实问题', '追问一个为什么']
          : ['圈出关键词', '回答3个问题', '用一句话复述'],
        parentPrompt: currentGrade <= 6 ? '你觉得他为什么这样做？' : '这段话最重要的信息是什么？',
        content: '',
        coverImage: '',
        iconUrl: '',
        imageUrl: '',
        ttsUrl: '',
        hasTts: false,
        audioUrl: '',
        videoUrl: '',
        tips: '',
        exampleAnswer: '',
        status: completedMap.r2 ? 'completed' : 'pending',
        progress: 0
      },
      {
        id: 'r3',
        title: '表达练习：一句话讲重点',
        duration: 8,
        level: '提升',
        visualIcon: '💬',
        visualLabel: '口头复述',
        ageRange: ageName,
        material: '从刚读过的故事或短文里选一个片段，练习用自己的话说出来。',
        objective: '用一句话说出段落中心',
        steps: ['先说主角', '再说发生了什么', '最后说结果或感受'],
        parentPrompt: '如果只用一句话讲给别人听，你会怎么说？',
        content: '',
        coverImage: '',
        iconUrl: '',
        imageUrl: '',
        ttsUrl: '',
        hasTts: false,
        audioUrl: '',
        videoUrl: '',
        tips: '',
        exampleAnswer: '',
        status: completedMap.r3 ? 'completed' : 'pending',
        progress: 0
      },
      {
        id: 'r4',
        title: currentGrade <= 6 ? '亲子对话：我喜欢哪一页' : '阅读迁移：联系生活说一说',
        duration: 8,
        level: '拓展',
        visualIcon: '⭐',
        visualLabel: '兴趣表达',
        ageRange: ageName,
        material: currentGrade <= 6 ? '读完后让孩子选一页最喜欢的画面，说出一个理由。' : '把文章里的一个情节，联系到自己的经历或生活观察。',
        objective: currentGrade <= 6 ? '说出喜欢的画面和原因' : '把阅读内容和真实生活联系起来',
        steps: currentGrade <= 6
          ? ['选一页喜欢的画面', '说出喜欢什么', '家长补一句完整表达']
          : ['找一个相似经历', '说出相同点', '说出不同点'],
        parentPrompt: currentGrade <= 6 ? '你最喜欢哪一页？为什么？' : '你有没有遇到过类似的事情？',
        content: '',
        coverImage: '',
        iconUrl: '',
        imageUrl: '',
        ttsUrl: '',
        hasTts: false,
        audioUrl: '',
        videoUrl: '',
        tips: '',
        exampleAnswer: '',
        status: completedMap.r4 ? 'completed' : 'pending',
        progress: 0
      }
    ];

    this.setData({
      readingTasks: tasks
    });

    for (var i = 0; i < tasks.length; i++) {
      app.trackKbEvent({
        event_type: 'task_exposure',
        task_id: tasks[i].id,
        event_meta: { page: 'textbook' }
      });
    }

    this.updateReadingTaskStats(tasks);
    this.loadReadingWeeklyReport();
  },

  loadReadingWeeklyReport: function() {
    var stats = app.getReadingTaskStats();
    var streakDays = this.calculateReadingStreakDays();
    var recordingCount = wx.getStorageSync('readingRecordingCount') || 0;
    var report = {
      completionRate: stats.completionRate || 0,
      completed: stats.completed || 0,
      total: stats.total || 0,
      streakDays: streakDays,
      suggestion: (stats.completed || 0) < (stats.total || 0) ? '优先完成未打卡任务，连续3天更容易形成习惯' : '保持节奏，下一步可挑战表达提升任务',
      recordingCount: recordingCount
    };
    this.setData({
      readingWeeklyReport: report
    });
  },

  calculateReadingStreakDays: function() {
    var log = wx.getStorageSync('readingTaskCheckinLog') || [];
    if (!log.length) {
      return 0;
    }
    return log.length;
  },

  increaseRecordingCount: function() {
    var count = wx.getStorageSync('readingRecordingCount') || 0;
    count += 1;
    wx.setStorageSync('readingRecordingCount', count);
    this.loadReadingWeeklyReport();
  },

  playTtsSample: function(e) {
    var url = e.currentTarget.dataset.url || this.data.ttsSampleUrl;
    if (!url) {
      wx.showToast({ title: '当前任务暂无朗读音频', icon: 'none' });
      return;
    }
    this.ensureAudioManagers();
    if (!this.ttsAudioContext) {
      wx.showToast({ title: '音频播放不可用', icon: 'none' });
      return;
    }
    try {
      this.ttsAudioContext.src = url;
      this.ttsAudioContext.play();
      this.setData({ isPlayingTts: true });
    } catch (err) {
      wx.showToast({ title: '播放失败', icon: 'none' });
    }
  },

  stopTtsSample: function() {
    if (this.ttsAudioContext) {
      this.ttsAudioContext.stop();
    }
    this.setData({ isPlayingTts: false });
  },

  startRecording: function() {
    this.ensureAudioManagers();
    if (!this.recorderManager) {
      wx.showToast({ title: '录音不可用', icon: 'none' });
      return;
    }
    this.setData({ isRecording: true, recordFilePath: '' });
    this.recorderManager.start({
      duration: 60000,
      sampleRate: 16000,
      numberOfChannels: 1,
      encodeBitRate: 96000,
      format: 'mp3'
    });
  },

  stopRecording: function() {
    if (!this.recorderManager) {
      return;
    }
    this.recorderManager.stop();
  },

  playRecording: function() {
    var path = this.data.recordFilePath;
    if (!path) {
      wx.showToast({ title: '暂无录音', icon: 'none' });
      return;
    }
    this.ensureAudioManagers();
    if (!this.recordAudioContext) {
      wx.showToast({ title: '录音回放不可用', icon: 'none' });
      return;
    }
    try {
      this.recordAudioContext.src = path;
      this.recordAudioContext.play();
    } catch (err) {
      wx.showToast({ title: '回放失败', icon: 'none' });
    }
  },

  updateReadingTaskStats: function(tasks) {
    var list = tasks || this.data.readingTasks || [];
    var total = list.length;
    var completed = list.filter(function(item) {
      return item.status === 'completed';
    }).length;
    var completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    app.updateReadingTaskStats({
      total: total,
      completed: completed,
      completionRate: completionRate
    });
  },

  // 加载当前孩子信息
  loadCurrentChild: function() {
    var currentChild = app.getCurrentChild();
    if (currentChild) {
      this.setData({
        currentChild: currentChild
      });
      // 根据孩子年龄或生日设置默认年级
      var age = currentChild.age || this.calculateAgeFromBirthDate(currentChild.birth_date);
      if (age) {
        var grade = this.calculateGradeFromAge(age);
        this.setData({
          currentGrade: grade
        });
      }
    }
  },

  refreshCurrentChildFromServer: function() {
    var that = this;
    if (app.shouldUseMockFallback()) {
      return Promise.resolve(that.data.currentChild || app.getCurrentChild() || null);
    }
    if (that._refreshingChild) {
      return that._refreshingChild;
    }

    that._refreshingChild = app.ensureLogin().then(function() {
      return app.request({
        url: '/children',
        method: 'GET',
        _skipAuthRetry: true
      });
    }).then(function(res) {
      var children = app.normalizeChildren(res || []);
      wx.setStorageSync('childrenList', children);
      app.globalData.childrenList = children;

      if (!children.length) {
        app.globalData.currentChild = null;
        wx.removeStorageSync('currentChild');
        that.setData({ currentChild: null });
        return null;
      }

      var currentChild = children.find(function(child) {
        return child.is_default || child.isDefault;
      }) || children[0];
      app.globalData.currentChild = currentChild;
      wx.setStorageSync('currentChild', currentChild);
      that.setData({ currentChild: currentChild });
      return currentChild;
    }).finally(function() {
      that._refreshingChild = null;
    });

    return that._refreshingChild;
  },

  // 根据生日计算年龄
  calculateAgeFromBirthDate: function(birthDate) {
    if (!birthDate) return 0;
    var parts = String(birthDate).split('-');
    if (parts.length !== 3) return 0;
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    if (!year || !month || !day) return 0;

    var now = new Date();
    var age = now.getFullYear() - year;
    var monthDiff = now.getMonth() + 1 - month;
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < day)) {
      age -= 1;
    }
    return age > 0 ? age : 0;
  },

  // 根据年龄计算年级
  calculateGradeFromAge: function(age) {
    // 6岁一年级，7岁二年级，以此类推
    var grade = age - 5;
    if (grade < 1) grade = 1;
    if (grade > 6) grade = 6;
    return grade;
  },

  // 从本地存储加载年级设置
  loadGradeFromStorage: function() {
    var grade = wx.getStorageSync('selectedGrade');
    if (grade) {
      this.setData({
        currentGrade: grade
      });
    }
  },

  // 加载成长进度概览
  loadProgressOverview: function() {
    var that = this;
    var currentChild = that.data.currentChild;

    if (app.shouldUseMockFallback()) {
      that.setData({
        progressOverview: {
          totalPoints: 120,
          masteredPoints: 45,
          learningPoints: 18,
          masteryRate: 37.5
        },
        loading: false,
        initialized: true
      });
      return;
    }
    
    if (!currentChild) {
      if (!app.shouldUseMockFallback()) {
        that.setData({
          progressOverview: {
            totalPoints: 0,
            masteredPoints: 0,
            learningPoints: 0,
            masteryRate: 0
          },
          initialized: true
        });
        return;
      }
      // 使用模拟数据
      that.setData({
        progressOverview: {
          totalPoints: 120,
          masteredPoints: 45,
          learningPoints: 18,
          masteryRate: 37.5
        }
      });
      return;
    }

    that.setData({
      loading: true
    });

    app.request({
      url: '/education/progress/overview',
      method: 'GET',
      data: {
        childId: currentChild.id,
        grade: that.data.currentGrade
      }
    }).then(function(res) {
      if (res) {
        that.setData({
          progressOverview: res
        });
      }
    }).catch(function(err) {
      if (err && err.statusCode === 403 && !that._progressOverviewRetried) {
        that._progressOverviewRetried = true;
        that.refreshCurrentChildFromServer().then(function(child) {
          if (child) {
            that.loadProgressOverview();
          }
        });
        return;
      }
      that._progressOverviewRetried = false;
      if (!app.shouldUseMockFallback()) {
        app.showApiError('成长进度加载失败');
        that.setData({
          progressOverview: {
            totalPoints: 0,
            masteredPoints: 0,
            learningPoints: 0,
            masteryRate: 0
          }
        });
        return;
      }
      // 使用模拟数据
      that.setData({
        progressOverview: {
          totalPoints: 120,
          masteredPoints: 45,
          learningPoints: 18,
          masteryRate: 37.5
        }
      });
    }).finally(function() {
      that.setData({
        loading: false,
        initialized: true
      });
    });
  },

  // 加载今日成长任务
  loadTodayTasks: function() {
    var that = this;
    var currentChild = that.data.currentChild;

    if (app.shouldUseMockFallback()) {
      that.setData({
        todayTasks: [
          {
            id: 1,
            subjectCode: 'logical_thinking',
            subjectName: '逻辑思维',
            title: '形状配对游戏',
            type: 'learn',
            status: 'pending',
            icon: '🧠'
          },
          {
            id: 2,
            subjectCode: 'reading_comprehension',
            subjectName: '阅读理解',
            title: '绘本《小种子》分镜阅读',
            type: 'practice',
            status: 'in_progress',
            progress: 60,
            icon: '📖'
          },
          {
            id: 3,
            subjectCode: 'expression_communication',
            subjectName: '表达沟通',
            title: '单词表达鼓励练习',
            type: 'review',
            status: 'completed',
            icon: '💬'
          }
        ]
      });
      return;
    }

    if (!currentChild) {
      that.setData({
        todayTasks: []
      });
      return;
    }

    app.request({
      url: '/education/tasks/today',
      method: 'GET',
      data: {
        childId: currentChild.id,
        grade: that.data.currentGrade
      }
    }).then(function(res) {
      if (res && res.list) {
        that.setData({
          todayTasks: res.list
        });
      }
    }).catch(function(err) {
      if (err && err.statusCode === 403 && !that._todayTasksRetried) {
        that._todayTasksRetried = true;
        that.refreshCurrentChildFromServer().then(function(child) {
          if (child) {
            that.loadTodayTasks();
          }
        });
        return;
      }
      that._todayTasksRetried = false;
      if (!app.shouldUseMockFallback()) {
        app.showApiError('今日任务加载失败');
        that.setData({
          todayTasks: []
        });
        return;
      }
      // 使用模拟数据（五大主题）
      that.setData({
        todayTasks: [
          {
            id: 1,
            subjectCode: 'logical_thinking',
            subjectName: '逻辑思维',
            title: '形状配对游戏',
            type: 'learn',
            status: 'pending',
            icon: '🧠'
          },
          {
            id: 2,
            subjectCode: 'reading_comprehension',
            subjectName: '阅读理解',
            title: '绘本《小种子》分镜阅读',
            type: 'practice',
            status: 'in_progress',
            progress: 60,
            icon: '📖'
          }
        ]
      });
    });
  },

  // 显示年级选择器
  showGradePicker: function() {
    this.setData({
      showGradePicker: true
    });
  },

  // 隐藏年级选择器
  hideGradePicker: function() {
    this.setData({
      showGradePicker: false
    });
  },

  // 选择年级
  onGradeSelect: function(e) {
    var that = this;
    var grade = e.currentTarget.dataset.grade;
    
    if (grade === that.data.currentGrade) {
      that.hideGradePicker();
      return;
    }

    that.setData({
      currentGrade: grade
    });

    // 保存到本地存储
    wx.setStorageSync('selectedGrade', grade);

    // 重新加载数据
    that.loadProgressOverview();
    that.loadTodayTasks();
    that.loadReadingTasks();

    that.hideGradePicker();

    wx.showToast({
      title: '已切换到' + that.data.gradeList[grade - 1].name,
      icon: 'success',
      duration: 1500
    });
  },

  // 阻止事件冒泡
  preventBubble: function() {
    // 空函数
  },

  // 点击学科
  onSubjectTap: function(e) {
    var that = this;
    var code = e.currentTarget.dataset.code;
    var subject = that.data.subjectList.find(function(item) {
      return item.code === code;
    });

    if (!subject) {
      wx.showToast({
        title: '学科不存在',
        icon: 'none'
      });
      return;
    }

    // 检查是否有当前孩子
    if (!that.data.currentChild) {
      wx.showModal({
        title: '提示',
        content: '请先添加孩子档案',
        confirmText: '去添加',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/profile/child-edit/child-edit',
              fail: function() {
                wx.showToast({ title: '页面跳转失败', icon: 'none' });
              }
            });
          }
        }
      });
      return;
    }

    // 跳转到知识点列表页面
    wx.navigateTo({
      url: '/pages/textbook/knowledge-list/knowledge-list?subjectCode=' + code + '&subjectName=' + encodeURIComponent(subject.name) + '&grade=' + that.data.currentGrade,
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 点击今日任务
  onTaskTap: function(e) {
    var that = this;
    var task = e.currentTarget.dataset.task;

    if (!task) {
      return;
    }

    // 跳转到知识点详情页面
    wx.navigateTo({
      url: '/pages/textbook/knowledge-detail/knowledge-detail?pointId=' + encodeURIComponent(task.id) + '&subjectCode=' + task.subjectCode + '&pointName=' + encodeURIComponent(task.title || ''),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  onReadingTaskTap: function(e) {
    var taskId = e.currentTarget.dataset.id;
    var taskTitle = e.currentTarget.dataset.title || '';
    app.trackKbEvent({
      event_type: 'task_start',
      task_id: taskId,
      event_meta: { title: taskTitle }
    });
    wx.navigateTo({
      url: '/pages/textbook/knowledge-detail/knowledge-detail?pointId=' + encodeURIComponent(taskId) + '&subjectCode=reading_comprehension&pointName=' + encodeURIComponent(taskTitle),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  markReadingTaskDone: function(e) {
    var taskId = e.currentTarget.dataset.id;
    if (!taskId) return;
    var completedMap = wx.getStorageSync('readingTaskCompletionMap') || {};
    completedMap[taskId] = true;
    wx.setStorageSync('readingTaskCompletionMap', completedMap);

    // 调用后端 API 记录任务完成
    var app = getApp();
    var currentChild = this.data.currentChild;
    app.request({
      url: '/education/tasks/' + taskId + '/complete',
      method: 'POST',
      data: {
        child_id: (currentChild && currentChild.id) || 0
      }
    }).then(function() {
      console.log('[Textbook] 任务完成状态已同步到后端');
    }).catch(function(err) {
      console.log('[Textbook] 同步任务完成状态失败:', err);
    });

    this.loadReadingTasks();

    var checkinLog = wx.getStorageSync('readingTaskCheckinLog') || [];
    var today = new Date();
    var dateKey = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    if (checkinLog.indexOf(dateKey) === -1) {
      checkinLog.push(dateKey);
      if (checkinLog.length > 30) {
        checkinLog = checkinLog.slice(checkinLog.length - 30);
      }
      wx.setStorageSync('readingTaskCheckinLog', checkinLog);
    }

    // 预埋分享卡草稿数据（第4阶段用于生成卡片）
    wx.setStorageSync('readingShareDraft', {
      type: 'task_checkin',
      title: e.currentTarget.dataset.title || '阅读力提升任务',
      summary: '我完成了今日阅读力打卡，欢迎一起坚持！',
      metrics: {
        completed: this.data.readingWeeklyReport.completed || 0,
        total: this.data.readingWeeklyReport.total || 0,
        completionRate: this.data.readingWeeklyReport.completionRate || 0,
        streakDays: this.data.readingWeeklyReport.streakDays || 0,
        recordingCount: this.data.readingWeeklyReport.recordingCount || 0
      },
      source: 'textbook_reading_task',
      createdAt: Date.now(),
      payload: {
        taskId: taskId,
        taskTitle: e.currentTarget.dataset.title || '阅读力提升任务'
      }
    });

    this.loadReadingWeeklyReport();

    var readingTask = (this.data.readingTasks || []).find(function(t) {
      return t.id === taskId;
    }) || {};
    app.trackKbEvent({
      event_type: 'task_complete',
      task_id: taskId,
      duration_sec: (readingTask.duration || 10) * 60,
      has_recording: false,
      score: 1,
      event_meta: { source: 'miniprogram_local_checkin' }
    });

    var streak = this.data.readingWeeklyReport.streakDays || 1;
    app.trackKbEvent({
      event_type: 'path_day_complete',
      path_id: 'reading_daily_path',
      day_index: streak,
      event_meta: { source: 'miniprogram_checkin' }
    });

    wx.showToast({
      title: '已完成打卡',
      icon: 'success'
    });
  },

  shareWeeklyReport: function() {
    var report = this.data.readingWeeklyReport || {};
    var text = '本周阅读力打卡 ' + (report.completed || 0) + '/' + (report.total || 0) + '，完成率 ' + (report.completionRate || 0) + '%，连续坚持 ' + (report.streakDays || 0) + ' 天。';
    wx.setStorageSync('readingShareDraft', {
      type: 'weekly_report',
      title: '本周阅读力成果卡',
      summary: text,
      metrics: {
        completed: report.completed || 0,
        total: report.total || 0,
        completionRate: report.completionRate || 0,
        streakDays: report.streakDays || 0,
        recordingCount: report.recordingCount || 0
      },
      source: 'textbook_weekly_report',
      createdAt: Date.now()
    });
    this.openShareScenePicker();
  },

  shareReadingTask: function(e) {
    var title = e.currentTarget.dataset.title || '阅读力提升任务';
    wx.setStorageSync('readingShareDraft', {
      type: 'task_checkin',
      title: title,
      summary: '我正在进行阅读力打卡，欢迎一起坚持！',
      metrics: {
        completed: this.data.readingWeeklyReport.completed || 0,
        total: this.data.readingWeeklyReport.total || 0,
        completionRate: this.data.readingWeeklyReport.completionRate || 0,
        streakDays: this.data.readingWeeklyReport.streakDays || 0,
        recordingCount: this.data.readingWeeklyReport.recordingCount || 0
      },
      source: 'textbook_reading_task',
      createdAt: Date.now(),
      payload: {
        taskTitle: title
      }
    });
    this.openShareScenePicker();
  },

  openShareScenePicker: function() {
    var that = this;
    wx.showActionSheet({
      itemList: ['复制朋友圈文案', '预览分享成果卡'],
      success: function(res) {
        if (res.tapIndex === 0) {
          that.copyShareTemplate();
          return;
        }
        that.goToSharePreview();
      }
    });
  },

  copyShareTemplate: function() {
    var draft = wx.getStorageSync('readingShareDraft') || {};
    var text = app.buildShareTemplate(draft);
    wx.setClipboardData({
      data: text,
      success: function() {
        wx.showToast({
          title: '文案已复制，可发朋友圈',
          icon: 'none'
        });
      }
    });
  },

  goToSharePreview: function() {
    wx.navigateTo({
      url: '/pages/share/preview/preview',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 查看全部进度
  onViewAllProgress: function() {
    var currentChild = this.data.currentChild;
    var firstSubject = this.data.subjectList[0] || {};
    wx.navigateTo({
      url: '/pages/textbook/knowledge-list/knowledge-list?subjectCode=' + (firstSubject.code || 'logical_thinking') + '&subjectName=' + encodeURIComponent(firstSubject.name || '逻辑思维') + '&grade=' + this.data.currentGrade + '&childId=' + (currentChild ? currentChild.id : ''),
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    that.loadProgressOverview();
    that.loadTodayTasks();
    that.loadReadingTasks();
    that.loadReadingWeeklyReport();
    wx.stopPullDownRefresh();
  },

  // 分享
  onShareAppMessage: function() {
    return {
      title: '阅读与专注提升：每天10分钟，周周看见进步',
      path: '/pages/textbook/textbook'
    };
  }
});

