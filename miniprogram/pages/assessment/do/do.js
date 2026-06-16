// 答题页面逻辑
var app = getApp();
var assessmentUtils = require('../../../utils/assessment.js');
var getAssessmentMetaList = assessmentUtils.getAssessmentMetaList;
var getChildAgeYears = assessmentUtils.getChildAgeYears;
var getDefaultAgeGroup = assessmentUtils.getDefaultAgeGroup;
var normalizeAssessmentCode = assessmentUtils.normalizeAssessmentCode;

function normalizeAssessmentQuestions(questions) {
  return (questions || []).map(function(rawQuestion, questionIndex) {
    var rawOptions = rawQuestion.options || rawQuestion.choices || [];
    var options = rawOptions.map(function(rawOption, optionIndex) {
      if (typeof rawOption === 'string') {
        return {
          value: optionIndex,
          label: rawOption,
          description: ''
        };
      }
      return {
        value: rawOption.value !== undefined ? rawOption.value : optionIndex,
        label: rawOption.label || rawOption.text || rawOption.name || String(rawOption.value !== undefined ? rawOption.value : optionIndex + 1),
        description: rawOption.description || rawOption.desc || ''
      };
    });

    return {
      id: rawQuestion.id || questionIndex + 1,
      dimension: rawQuestion.dimension || 'general',
      text: rawQuestion.text || rawQuestion.question || rawQuestion.title || rawQuestion.description || '',
      description: rawQuestion.description || '',
      options: options
    };
  });
}

var ageGroupMatches = assessmentUtils.ageGroupMatches;

var ASSESSMENT_AGE_GROUPS = getAssessmentMetaList().reduce(function(result, item) {
  result[item.code] = item.ageGroups || [];
  return result;
}, {});

// 观察题目数据（模拟数据，实际应从服务器获取）
var ASSESSMENT_QUESTIONS = {
  sensory: {
    name: '儿童感觉统合能力发展评定量表',
    questions: [
      { id: 1, text: '孩子在进行活动时，是否容易分心？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 2, text: '孩子是否喜欢被拥抱或身体接触？', options: ['非常不喜欢', '不太喜欢', '比较喜欢', '非常喜欢'] },
      { id: 3, text: '孩子对噪音的反应如何？', options: ['完全不敏感', '稍微敏感', '比较敏感', '非常敏感'] },
      { id: 4, text: '孩子是否喜欢旋转、跳跃等运动？', options: ['非常不喜欢', '不太喜欢', '比较喜欢', '非常喜欢'] },
      { id: 5, text: '孩子的平衡能力如何？', options: ['很好', '较好', '一般', '较差'] },
      { id: 6, text: '孩子是否容易摔倒或碰撞物品？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 7, text: '孩子对新环境的适应能力如何？', options: ['很快适应', '较快适应', '需要时间', '很难适应'] },
      { id: 8, text: '孩子是否对某些材质的衣服有抵触？', options: ['没有', '轻微', '明显', '非常强烈'] },
      { id: 9, text: '孩子的手眼协调能力如何？', options: ['很好', '较好', '一般', '较差'] },
      { id: 10, text: '孩子是否喜欢玩沙子、泥土等？', options: ['非常喜欢', '比较喜欢', '不太喜欢', '非常不喜欢'] }
    ]
  },
  focus: {
    name: '专注力观察',
    questions: [
      { id: 1, text: '孩子能否安静地坐着听完一个故事？', options: ['完全可以', '基本可以', '有点困难', '完全不能'] },
      { id: 2, text: '孩子做作业时是否容易走神？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 3, text: '孩子能否专注于一项活动超过15分钟？', options: ['很容易', '比较容易', '有点困难', '非常困难'] },
      { id: 4, text: '孩子是否经常丢三落四？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 5, text: '孩子能否按照指令完成多步骤任务？', options: ['完全可以', '基本可以', '需要提醒', '很难完成'] },
      { id: 6, text: '孩子是否容易被周围的声音或事物分心？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 7, text: '孩子能否在嘈杂环境中完成任务？', options: ['完全可以', '基本可以', '有点困难', '完全不能'] },
      { id: 8, text: '孩子是否经常忘记日常安排？', options: ['从不', '偶尔', '经常', '总是'] }
    ]
  },
  adhd: {
    name: 'ADHD风险观察筛查',
    questions: [
      { id: 1, text: '孩子是否经常坐立不安，手脚动个不停？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 2, text: '孩子是否难以保持坐姿，经常离开座位？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 3, text: '孩子是否难以安静地玩耍或参与休闲活动？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 4, text: '孩子是否经常表现得像被马达驱动一样？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 5, text: '孩子是否经常话多？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 6, text: '孩子是否经常在问题还没问完就抢答？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 7, text: '孩子是否难以等待轮到自己？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 8, text: '孩子是否经常打断或打扰他人？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 9, text: '孩子是否难以集中注意力完成任务？', options: ['从不', '偶尔', '经常', '总是'] },
      { id: 10, text: '孩子是否经常丢三落四？', options: ['从不', '偶尔', '经常', '总是'] }
    ]
  },
  multi_intelligence: {
    name: '多元智能观察',
    questions: [
      { id: 1, text: '孩子是否喜欢阅读并能理解复杂的故事？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 2, text: '孩子是否擅长数数、计算或逻辑推理？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 3, text: '孩子是否喜欢画画、拼图或手工制作？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 4, text: '孩子是否有很好的音乐节奏感？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 5, text: '孩子是否喜欢运动，身体协调性好？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 6, text: '孩子是否善于与人交往，有很多朋友？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 7, text: '孩子是否喜欢独处，了解自己的感受？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] },
      { id: 8, text: '孩子是否对自然界的动植物很感兴趣？', options: ['非常符合', '比较符合', '不太符合', '完全不符合'] }
    ]
  },
  emotion: {
    name: '情绪能力观察',
    questions: [
      { id: 1, text: '孩子是否能识别自己的情绪（开心、生气、难过等）？', options: ['完全可以', '基本可以', '有点困难', '完全不能'] },
      { id: 2, text: '孩子生气时能否用语言表达而不是发脾气？', options: ['总是能', '经常能', '偶尔能', '几乎不能'] },
      { id: 3, text: '孩子遇到挫折时的反应如何？', options: ['能很快调整', '需要一些时间', '需要帮助调整', '很难调整'] },
      { id: 4, text: '孩子是否能理解他人的感受？', options: ['非常理解', '比较理解', '不太理解', '完全不理解'] },
      { id: 5, text: '孩子情绪波动是否频繁？', options: ['很少', '偶尔', '经常', '非常频繁'] },
      { id: 6, text: '孩子是否有固定的安抚方式？', options: ['有且有效', '有但效果一般', '没有固定方式', '完全没有'] },
      { id: 7, text: '孩子是否能等待满足（延迟满足能力）？', options: ['完全可以', '基本可以', '有点困难', '完全不能'] },
      { id: 8, text: '孩子是否容易焦虑或担忧？', options: ['从不', '偶尔', '经常', '总是'] }
    ]
  },
  learning: {
    name: '学习适应观察',
    questions: [
      { id: 1, text: '孩子是否对学习表现出兴趣？', options: ['非常有兴趣', '比较有兴趣', '兴趣一般', '没有兴趣'] },
      { id: 2, text: '孩子能否独立完成作业？', options: ['完全可以', '基本可以', '需要监督', '完全不能'] },
      { id: 3, text: '孩子是否有良好的学习习惯？', options: ['非常好', '比较好', '一般', '较差'] },
      { id: 4, text: '孩子遇到难题时的态度如何？', options: ['积极尝试', '需要鼓励', '容易放弃', '直接放弃'] },
      { id: 5, text: '孩子是否能按时完成学习任务？', options: ['总是能', '经常能', '偶尔不能', '经常不能'] },
      { id: 6, text: '孩子对学校生活的适应程度如何？', options: ['非常适应', '比较适应', '需要时间', '很难适应'] },
      { id: 7, text: '孩子与同学的关系如何？', options: ['非常好', '比较好', '一般', '较差'] },
      { id: 8, text: '孩子是否能遵守课堂纪律？', options: ['完全能', '基本能', '偶尔不能', '经常不能'] }
    ]
  },
  gross_motor: {
    name: '大运动发育观察',
    questions: [
      { id: 1, text: '孩子能否完成当前年龄段常见的大动作里程碑？', options: ['稳定做到', '大多做到', '偶尔做到', '暂时做不到'] },
      { id: 2, text: '孩子在翻身、坐、爬、走、跳等动作转换时是否协调？', options: ['非常协调', '比较协调', '有些吃力', '明显困难'] },
      { id: 3, text: '孩子在户外活动中是否愿意主动尝试跑跳或攀爬？', options: ['经常主动', '多数会', '偶尔会', '很少尝试'] },
      { id: 4, text: '孩子完成大动作后身体控制是否稳定？', options: ['很稳定', '基本稳定', '偶尔不稳', '经常不稳'] }
    ]
  },
  fine_motor: {
    name: '精细动作观察',
    questions: [
      { id: 1, text: '孩子能否用手完成抓握、捏取或放下物品？', options: ['稳定做到', '大多做到', '偶尔做到', '暂时做不到'] },
      { id: 2, text: '孩子双手配合操作玩具或生活物品时是否顺畅？', options: ['很顺畅', '比较顺畅', '偶尔吃力', '明显困难'] },
      { id: 3, text: '孩子使用勺子、蜡笔或翻书等工具时表现如何？', options: ['很熟练', '比较熟练', '需要帮助', '明显困难'] },
      { id: 4, text: '孩子在需要手眼协调的活动中是否能持续参与？', options: ['经常能', '多数能', '偶尔能', '很少能'] }
    ]
  },
  language_dev: {
    name: '语言发育观察',
    questions: [
      { id: 1, text: '孩子是否会用声音、词语或短句表达需求？', options: ['经常主动', '多数会', '偶尔会', '很少表达'] },
      { id: 2, text: '孩子对常见称呼和简单指令的理解情况如何？', options: ['理解很好', '基本理解', '部分理解', '理解较少'] },
      { id: 3, text: '孩子在亲子互动中是否愿意模仿发音或回应对话？', options: ['经常回应', '多数回应', '偶尔回应', '很少回应'] },
      { id: 4, text: '孩子的语言交流是否在持续进步？', options: ['进步明显', '有一定进步', '进步较慢', '暂未看到进步'] }
    ]
  },
  social_emotion: {
    name: '社交情绪观察',
    questions: [
      { id: 1, text: '孩子面对熟悉照护者时是否有积极回应？', options: ['经常主动', '多数会', '偶尔会', '很少回应'] },
      { id: 2, text: '孩子能否通过表情、动作或语言表达情绪？', options: ['表达清楚', '基本能表达', '偶尔表达', '较少表达'] },
      { id: 3, text: '孩子在互动游戏中是否愿意看人、模仿或轮流？', options: ['经常愿意', '多数愿意', '偶尔愿意', '很少愿意'] },
      { id: 4, text: '孩子情绪波动时在照护者帮助下能否逐步安稳？', options: ['通常可以', '大多可以', '偶尔可以', '经常困难'] }
    ]
  }
};

Page({
  data: {
    // 测评信息
    assessmentCode: '',
    assessmentName: '',
    selectedAgeGroup: '',
    
    // 题目数据
    questions: [],
    currentIndex: 0,
    totalQuestions: 0,
    
    // 答案记录
    answers: [],
    
    // 计时相关
    startTime: 0,
    elapsedTime: 0,
    timerInterval: null,
    timeText: '00:00',
    
    // 进度条
    progress: 0,
    
    // 当前题目
    currentQuestion: null,
    selectedOption: -1,
    
    // 当前孩子
    currentChild: null,
    
    // 加载状态
    loading: false,
    
    // 是否继续答题
    isContinue: false,
    pendingNavigateTimer: null
  },

  onLoad: function(options) {
    var that = this;
    var code = options.code;
    var isContinue = options.continue === '1';
    var selectedAgeGroup = options.ageGroup ? decodeURIComponent(options.ageGroup) : '';
    
    if (!code) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      that.scheduleNavigateBack();
      return;
    }
    
    // 设置当前孩子
    var currentChild = app.getCurrentChild();
    
    that.setData({
      assessmentCode: code,
      selectedAgeGroup: selectedAgeGroup,
      isContinue: isContinue,
      currentChild: currentChild
    });
    
    // 加载题目
    that.loadQuestions(code, isContinue);
    
  },

  onUnload: function() {
    var that = this;
    // 清除计时器
    if (that.data.timerInterval) {
      clearInterval(that.data.timerInterval);
    }
    if (that.data.pendingNavigateTimer) {
      clearTimeout(that.data.pendingNavigateTimer);
    }
    
  },

  scheduleNavigateBack: function() {
    var that = this;
    if (that.data.pendingNavigateTimer) {
      clearTimeout(that.data.pendingNavigateTimer);
    }
    var timer = setTimeout(function() {
      that.setData({ pendingNavigateTimer: null });
      wx.navigateBack();
    }, 1500);
    that.setData({ pendingNavigateTimer: timer });
  },
  
  /*
   * 保留下面业务方法，页面错误时统一走 scheduleNavigateBack，防止卸载后延迟导航。
   */
  
  // 加载题目
  loadQuestions: function(code, isContinue) {
    var that = this;
    if (app.shouldUseMockFallback()) {
      var localData = ASSESSMENT_QUESTIONS[normalizeAssessmentCode(code)] || ASSESSMENT_QUESTIONS[code];
      if (localData) {
        that.initQuestions(localData.questions, isContinue, localData.name);
      } else {
        wx.showToast({
          title: '未找到题目',
          icon: 'none'
        });
        that.scheduleNavigateBack();
      }
      return;
    }
    
    // 先尝试从服务器获取
    that.loadQuestionsFromServer(code).then(function(questions) {
      that.initQuestions(questions, isContinue);
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        app.showApiError('观察题目加载失败');
        that.scheduleNavigateBack();
        return;
      }
      // 离线演示模式：使用本地模拟数据
      var localData = ASSESSMENT_QUESTIONS[code];
      if (localData) {
        that.initQuestions(localData.questions, isContinue, localData.name);
      } else {
        wx.showToast({
          title: '未找到题目',
          icon: 'none'
        });
        that.scheduleNavigateBack();
      }
    });
  },

  // 从服务器加载题目
loadQuestionsFromServer: function(code) {
    var that = this;
    return new Promise(function(resolve, reject) {
      app.request({
        url: '/assessments/' + normalizeAssessmentCode(code) + '/questions',
        method: 'GET',
        data: {
          age_group: that.getAssessmentAgeGroup()
        }
      }).then(function(res) {
        if (res && res.questions && res.questions.length > 0) {
          resolve(res.questions);
        } else {
          reject(new Error('题目数据为空'));
        }
      }).catch(function(err) {
        reject(err);
      });
    });
  },

  getAssessmentAgeGroup: function() {
    var selectedAgeGroup = this.data.selectedAgeGroup;
    var assessmentCode = normalizeAssessmentCode(this.data.assessmentCode);
    var supportedGroups = ASSESSMENT_AGE_GROUPS[assessmentCode] || [];

    if (selectedAgeGroup) {
      if (!supportedGroups.length || supportedGroups.indexOf(selectedAgeGroup) >= 0) {
        return selectedAgeGroup;
      }
      for (var i = 0; i < supportedGroups.length; i++) {
        if (ageGroupMatches(supportedGroups[i], selectedAgeGroup)) {
          return supportedGroups[i];
        }
      }
      return supportedGroups[0] || selectedAgeGroup;
    }

    var child = this.data.currentChild || {};
    return getDefaultAgeGroup(child, '6-9岁');
  },

  getChildAge: function(child) {
    return getChildAgeYears(child, 6);
  },

  buildSubmitAnswers: function() {
    var questions = this.data.questions || [];
    var answers = this.data.answers || [];
    var payload = [];

    for (var i = 0; i < answers.length; i++) {
      var answer = answers[i] || {};
      var question = questions[i] || {};
      var selectedOption = question.options && question.options[answer.answer];
      payload.push({
        question_id: String(question.id || answer.questionId || i + 1),
        dimension: question.dimension || 'general',
        value: selectedOption && selectedOption.value !== undefined ? selectedOption.value : Math.max(answer.answer, 0),
        label: selectedOption && selectedOption.label ? selectedOption.label : ''
      });
    }

    return payload;
  },

  // 初始化题目
  initQuestions: function(questions, isContinue, name) {
    var that = this;
    var localAssessment = ASSESSMENT_QUESTIONS[that.data.assessmentCode] || ASSESSMENT_QUESTIONS[normalizeAssessmentCode(that.data.assessmentCode)] || {};
    var assessmentName = name || localAssessment.name || '观察工具';
    questions = normalizeAssessmentQuestions(questions);
    var totalQuestions = questions.length;
    
    that.setData({
      questions: questions,
      totalQuestions: totalQuestions,
      assessmentName: assessmentName
    });
    
    // 检查是否有保存的进度
    if (isContinue) {
      that.loadSavedProgress();
    } else {
      that.startNewAssessment();
    }
  },

  // 开始新的作答
  startNewAssessment: function() {
    var that = this;
    var questions = that.data.questions;
    
    // 初始化答案数组
    var answers = [];
    for (var i = 0; i < questions.length; i++) {
      answers.push({
        questionId: questions[i].id,
        answer: -1
      });
    }
    
    that.setData({
      answers: answers,
      currentIndex: 0,
      currentQuestion: questions[0],
      selectedOption: -1,
      startTime: Date.now(),
      progress: 0
    });
    
    // 开始计时
    that.startTimer();
  },

  // 加载保存的进度
  loadSavedProgress: function() {
    var that = this;
    var progress = wx.getStorageSync('assessmentProgress');
    
    if (progress && progress.assessmentCode === that.data.assessmentCode) {
      var questions = that.data.questions;
      var answers = progress.answers || [];
      var currentIndex = progress.currentIndex || 0;
      var elapsedTime = progress.elapsedTime || 0;
      var selectedAgeGroup = progress.ageGroup || that.data.selectedAgeGroup;
      
      // 确保答案数组完整
      if (answers.length < questions.length) {
        for (var i = answers.length; i < questions.length; i++) {
          answers.push({
            questionId: questions[i].id,
            answer: -1
          });
        }
      }
      
      that.setData({
        answers: answers,
        currentIndex: currentIndex,
        currentQuestion: questions[currentIndex],
        selectedOption: answers[currentIndex].answer,
        selectedAgeGroup: selectedAgeGroup,
        startTime: Date.now() - elapsedTime * 1000,
        elapsedTime: elapsedTime,
        progress: Math.round((currentIndex / questions.length) * 100)
      });
      
      // 开始计时
      that.startTimer();
    } else {
      that.startNewAssessment();
    }
  },

  // 开始计时
  startTimer: function() {
    var that = this;
    
    var timerInterval = setInterval(function() {
      var elapsed = Math.floor((Date.now() - that.data.startTime) / 1000);
      var minutes = Math.floor(elapsed / 60);
      var seconds = elapsed % 60;
      var timeText = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
      
      that.setData({
        elapsedTime: elapsed,
        timeText: timeText
      });
    }, 1000);
    
    that.setData({
      timerInterval: timerInterval
    });
  },

  // 选择选项
  selectOption: function(e) {
    var that = this;
    var index = e.currentTarget.dataset.index;
    var answers = that.data.answers.slice();
    var currentIndex = that.data.currentIndex;
    
    answers[currentIndex].answer = index;
    
    that.setData({
      selectedOption: index,
      answers: answers
    });
    
    // 自动保存进度
    that.saveProgress();
  },

  // 上一题
  prevQuestion: function() {
    var that = this;
    var currentIndex = that.data.currentIndex;
    
    if (currentIndex <= 0) {
      return;
    }
    
    var newIndex = currentIndex - 1;
    var questions = that.data.questions;
    var answers = that.data.answers;
    
    that.setData({
      currentIndex: newIndex,
      currentQuestion: questions[newIndex],
      selectedOption: answers[newIndex].answer,
      progress: Math.round((newIndex / questions.length) * 100)
    });
  },

  // 下一题
  nextQuestion: function() {
    var that = this;
    var currentIndex = that.data.currentIndex;
    var selectedOption = that.data.selectedOption;
    
    // 检查是否已选择
    if (selectedOption < 0) {
      wx.showToast({
        title: '请选择一个选项',
        icon: 'none'
      });
      return;
    }
    
    var questions = that.data.questions;
    var newIndex = currentIndex + 1;
    
    // 检查是否是最后一题
    if (newIndex >= questions.length) {
      // 显示提交确认
      that.showSubmitConfirm();
      return;
    }
    
    var answers = that.data.answers;
    
    that.setData({
      currentIndex: newIndex,
      currentQuestion: questions[newIndex],
      selectedOption: answers[newIndex].answer,
      progress: Math.round((newIndex / questions.length) * 100)
    });
    
    // 自动保存进度
    that.saveProgress();
  },

  // 显示提交确认
  showSubmitConfirm: function() {
    var that = this;
    var answers = that.data.answers;
    var unanswered = 0;
    
    for (var i = 0; i < answers.length; i++) {
      if (answers[i].answer < 0) {
        unanswered++;
      }
    }
    
    var content = unanswered > 0 
      ? '还有' + unanswered + '题未作答，确定要提交吗？'
      : '确定要提交结果吗？';
    
    wx.showModal({
      title: '提交确认',
      content: content,
      confirmText: '提交',
      cancelText: '继续答题',
      success: function(res) {
        if (res.confirm) {
          that.submitAssessment();
        }
      }
    });
  },

  // 保存进度
  saveProgress: function() {
    var that = this;
    var progress = {
      assessmentCode: that.data.assessmentCode,
      currentIndex: that.data.currentIndex,
      answers: that.data.answers,
      ageGroup: that.getAssessmentAgeGroup(),
      elapsedTime: that.data.elapsedTime,
      savedAt: Date.now()
    };
    
    wx.setStorageSync('assessmentProgress', progress);
  },

  // 提交结果
  submitAssessment: function() {
    var that = this;
    if (that._submittingAssessment) {
      return;
    }
    that._submittingAssessment = true;

    app.requireLoginForAction('请先登录后再提交').then(function(canSubmit) {
      if (!canSubmit) {
        that._submittingAssessment = false;
        return;
      }
    
    wx.showLoading({
      title: '提交中...',
      mask: true
    });
    
    var submitData = {
      child_id: that.data.currentChild ? that.data.currentChild.id : null,
      age_group: that.getAssessmentAgeGroup(),
      answers: that.buildSubmitAnswers()
    };
    
    // 尝试提交到服务器
    app.request({
      url: '/assessments/' + normalizeAssessmentCode(that.data.assessmentCode) + '/submit',
      method: 'POST',
      data: submitData
    }).then(function(res) {
      var payload = res && res.result ? res.result : res;
      var totalScore = Number(payload && payload.overall_score);
      var maxScore = Number(payload && payload.max_score);
      if (isNaN(totalScore)) {
        totalScore = 0;
      }
      if (isNaN(maxScore) || maxScore <= 0) {
        maxScore = Math.max(3, (that.data.questions || []).length * 3);
      }
      wx.hideLoading();
      that._submittingAssessment = false;
      
      app.trackKbEvent({
        event_type: 'output_submit',
        task_id: 'assessment_' + that.data.assessmentCode,
        score: maxScore > 0 ? totalScore / maxScore : 0,
        event_meta: { type: 'assessment', source: 'server' }
      });

      // 清除保存的进度
      wx.removeStorageSync('assessmentProgress');
      
      // 保存结果到本地
      var serverResult = that.normalizeServerResult(res);
      that.saveResultLocally(serverResult);
      
      // 跳转到结果页面
      wx.redirectTo({
        url: '/pages/assessment/result/result?recordId=' + serverResult.recordId,
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    }).catch(function(err) {
      wx.hideLoading();
      that._submittingAssessment = false;
      if (!app.shouldUseMockFallback()) {
        app.showApiError('结果提交失败，请检查接口');
        return;
      }
      // 离线模式：本地计算结果
      var localResult = that.calculateLocalResult();
      
      app.trackKbEvent({
        event_type: 'output_submit',
        task_id: 'assessment_' + that.data.assessmentCode,
        score: localResult.totalScore / localResult.maxScore,
        event_meta: { type: 'assessment', source: 'local' }
      });

      // 保存结果到本地
      that.saveResultLocally(localResult);
      
      // 清除保存的进度
      wx.removeStorageSync('assessmentProgress');
      
      // 跳转到结果页面
      wx.redirectTo({
        url: '/pages/assessment/result/result?recordId=' + localResult.recordId + '&local=1',
        fail: function() {
          wx.showToast({ title: '页面跳转失败', icon: 'none' });
        }
      });
    });
    });
  },

  normalizeServerResult: function(res) {
    var payload = res && res.result ? res.result : res;
    var dimensionScores = payload.dimension_scores || {};
    var dimensions = [];
    var totalScore = Number(payload.overall_score);
    if (isNaN(totalScore)) {
      totalScore = 0;
    }
    var isSensory = normalizeAssessmentCode(payload.assessment_type || this.data.assessmentCode) === 'sensory';
    var maxScore = Number(payload.max_score);
    if (isNaN(maxScore) || maxScore <= 0) {
      maxScore = isSensory ? 50 : Math.max(3, (this.data.questions || []).length * 3);
    }
    var percentage = Number(payload.percentage);
    if (isNaN(percentage)) {
      percentage = Math.round((totalScore / maxScore) * 100);
    }

    if (Array.isArray(dimensionScores)) {
      dimensions = dimensionScores;
    } else {
      for (var key in dimensionScores) {
        if (Object.prototype.hasOwnProperty.call(dimensionScores, key)) {
          dimensions.push(dimensionScores[key]);
        }
      }
    }

    return {
      recordId: payload.id || res.record_id || payload.record_id,
      assessmentCode: payload.assessment_type || normalizeAssessmentCode(this.data.assessmentCode),
      assessmentName: payload.assessment_name || this.data.assessmentName,
      childId: payload.child_id || (this.data.currentChild ? this.data.currentChild.id : null),
      childName: this.data.currentChild ? this.data.currentChild.name : '未知',
      totalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      level: payload.overall_level || this.getLevel(percentage),
      elapsedTime: this.data.elapsedTime,
      completedAt: payload.completed_at || Date.now(),
      dimensions: dimensions,
      reportData: payload.report_data || {}
    };
  },

  // 本地计算结果
  calculateLocalResult: function() {
    var that = this;
    var assessmentCode = normalizeAssessmentCode(that.data.assessmentCode);
    var answers = that.data.answers;
    var totalScore = 0;
    var maxScore = answers.length * 3;
    
    for (var i = 0; i < answers.length; i++) {
      totalScore += answers[i].answer; // 0-3分
    }
    
    var percentage = Math.round((totalScore / maxScore) * 100);
    var recordId = 'local_' + Date.now();
    
    return {
      recordId: recordId,
      assessmentCode: assessmentCode,
      assessmentName: that.data.assessmentName,
      childId: that.data.currentChild ? that.data.currentChild.id : null,
      childName: that.data.currentChild ? that.data.currentChild.name : '未知',
      totalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      level: that.getLevel(percentage),
      elapsedTime: that.data.elapsedTime,
      completedAt: Date.now(),
      dimensions: that.calculateDimensions()
    };
  },

  // 计算各维度得分
  calculateDimensions: function() {
    var that = this;
    var code = normalizeAssessmentCode(that.data.assessmentCode);
    var answers = that.data.answers;
    var questions = that.data.questions || [];

    function makeDimensionScore(name, start, end) {
      var total = 0;
      var count = 0;
      for (var i = start; i < end && i < answers.length; i++) {
        var value = typeof answers[i].answer === 'number' ? answers[i].answer : -1;
        if (value >= 0) {
          total += value;
          count++;
        }
      }
      var maxScore = count * 3;
      var score = maxScore > 0 ? Math.round((total / maxScore) * 100) : 0;
      return {
        name: name,
        score: score,
        displayScore: score + '分'
      };
    }

    function buildEvenDimensions(names) {
      if (!names.length) {
        return [];
      }
      var result = [];
      var totalQuestions = Math.max(answers.length, questions.length);
      var groupSize = Math.max(1, Math.ceil(totalQuestions / names.length));
      for (var i = 0; i < names.length; i++) {
        result.push(makeDimensionScore(names[i], i * groupSize, (i + 1) * groupSize));
      }
      return result;
    }

    var dimensionsMap = {
      sensory: ['前庭觉', '本体觉', '触觉', '视觉', '听觉'],
      focus: ['集中注意', '持续注意', '选择性注意', '分配性注意'],
      adhd: ['注意力缺陷', '多动冲动', '对立违抗'],
      multi_intelligence: ['语言智能', '逻辑数学智能', '空间智能', '音乐智能', '运动智能', '人际智能', '内省智能', '自然智能'],
      emotion: ['情绪识别', '情绪表达', '情绪调节', '同理心'],
      learning: ['学习兴趣', '学习习惯', '学习策略', '学校适应']
    };

    return buildEvenDimensions(dimensionsMap[code] || ['整体表现']);
  },

  // 获取评级
  getLevel: function(percentage) {
    if (percentage >= 85) return '优秀';
    if (percentage >= 70) return '良好';
    if (percentage >= 55) return '正常';
    if (percentage >= 40) return '轻度失调';
    return '中度失调';
  },

  // 保存结果到本地
  saveResultLocally: function(result) {
    var records = wx.getStorageSync('assessmentRecords') || wx.getStorageSync('assessmentHistory') || [];
    records.unshift(result);
    
    // 只保留最近50条记录
    if (records.length > 50) {
      records = records.slice(0, 50);
    }
    
    wx.setStorageSync('assessmentRecords', records);
    wx.setStorageSync('assessmentHistory', records);
  },

  // 中途退出
  exitAssessment: function() {
    var that = this;
    
    wx.showModal({
      title: '退出作答',
      content: '确定要退出吗？当前进度将会保存。',
      confirmText: '退出',
      cancelText: '继续答题',
      success: function(res) {
        if (res.confirm) {
          that.saveProgress();
          app.trackKbEvent({
            event_type: 'path_dropout',
            path_id: 'assessment_' + that.data.assessmentCode,
            day_index: Math.max(1, Math.floor(that.data.currentIndex / 2) + 1),
            event_meta: { progress: that.data.currentIndex + '/' + that.data.totalQuestions }
          });
          wx.navigateBack();
        }
      }
    });
  },

  // 跳转到指定题目
  goToQuestion: function(e) {
    var that = this;
    var index = e.currentTarget.dataset.index;
    var questions = that.data.questions;
    var answers = that.data.answers;
    
    that.setData({
      currentIndex: index,
      currentQuestion: questions[index],
      selectedOption: answers[index].answer,
      progress: Math.round((index / questions.length) * 100)
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
