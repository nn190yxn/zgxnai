const app = getApp();
const { request } = require('../../../utils/request');

Page({
  data: {
    step: 'age',
    selectedAge: null,
    ageRanges: [
      { id: '0-1', name: '0-1岁', months: '0-12个月' },
      { id: '1-2', name: '1-2岁', months: '12-24个月' },
      { id: '2-3', name: '2-3岁', months: '24-36个月' },
      { id: '3-4', name: '3-4岁', months: '36-48个月' },
      { id: '4-5', name: '4-5岁', months: '48-60个月' },
      { id: '5-6', name: '5-6岁', months: '60-72个月' }
    ],
    dimensions: [
      { id: 'gross_motor', name: '大运动', icon: '🏃', color: '#4A90D9', description: '跑、跳、攀爬等大肌肉活动能力' },
      { id: 'fine_motor', name: '精细动作', icon: '✋', color: '#E89A4C', description: '抓握、捏取、涂鸦等小肌肉活动能力' },
      { id: 'language', name: '语言能力', icon: '💬', color: '#5DBA8B', description: '听、说、理解等语言沟通能力' },
      { id: 'cognitive', name: '认知发展', icon: '🧠', color: '#9B7ED9', description: '思维、记忆、解决问题等认知能力' },
      { id: 'social', name: '社交能力', icon: '🤝', color: '#E8737A', description: '与他人互动、表达情感等社交能力' },
      { id: 'self_care', name: '自理能力', icon: '👶', color: '#4ECDC4', description: '穿衣、吃饭、如厕等日常生活能力' }
    ],
    currentIndicators: [],
    currentQuestionIndex: 0,
    currentIndicator: null,
    currentDimension: null,
    answers: {},
    overallPercentage: 0,
    dimensionResults: [],
    suggestions: [],
    progressPercent: 0
  },

  onLoad(options) {
    // 如果从parenting页面传入age参数，直接开始评估
    if (options.age) {
      this.setData({ selectedAge: options.age });
      this.startAssessment();
    }
  },

  selectAge(e) {
    this.setData({ selectedAge: e.currentTarget.dataset.id });
  },

  startAssessment() {
    if (!this.data.selectedAge) {
      wx.showToast({ title: '请先选择年龄段', icon: 'none' });
      return;
    }

    // 获取评估指标
    this.loadIndicators();
  },

  loadIndicators() {
    wx.showLoading({ title: '加载中...' });
    
    request({
      url: `/parenting/milestone/indicators/${this.data.selectedAge}`,
      method: 'GET'
    }).then(res => {
      wx.hideLoading();
      if (res.success && res.data) {
        this.setData({
          currentIndicators: res.data,
          currentQuestionIndex: 0,
          answers: {},
          step: 'assess'
        });
        this.updateQuestion();
      } else {
        wx.showToast({ title: '加载指标失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('加载指标失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  updateQuestion() {
    const { currentIndicators, currentQuestionIndex, dimensions } = this.data;
    const indicator = currentIndicators[currentQuestionIndex];
    if (!indicator) return;

    const dimension = dimensions.find(d => d.id === indicator.dimension);
    const progressPercent = Math.round(((currentQuestionIndex + 1) / currentIndicators.length) * 100);

    this.setData({
      currentIndicator: indicator,
      currentDimension: dimension,
      progressPercent
    });
  },

  answerYes() {
    this.setAnswer(true);
  },

  answerNo() {
    this.setAnswer(false);
  },

  setAnswer(value) {
    const { currentIndicator, answers } = this.data;
    if (!currentIndicator) return;

    this.setData({
      [`answers.${currentIndicator.id}`]: value
    });
  },

  nextQuestion() {
    const { currentQuestionIndex, currentIndicators } = this.data;
    if (currentQuestionIndex < currentIndicators.length - 1) {
      this.setData({ currentQuestionIndex: currentQuestionIndex + 1 });
      this.updateQuestion();
    }
  },

  prevQuestion() {
    const { currentQuestionIndex } = this.data;
    if (currentQuestionIndex > 0) {
      this.setData({ currentQuestionIndex: currentQuestionIndex - 1 });
      this.updateQuestion();
    }
  },

  submitAssessment() {
    const { answers, currentIndicators, selectedAge } = this.data;
    
    // 检查是否所有问题都已回答
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < currentIndicators.length) {
      wx.showToast({ title: `还有${currentIndicators.length - answeredCount}题未回答`, icon: 'none' });
      return;
    }

    // 准备提交数据
    const results = currentIndicators.map(indicator => ({
      indicatorId: indicator.id,
      value: answers[indicator.id] || false
    }));

    wx.showLoading({ title: '提交中...' });

    request({
      url: '/parenting/milestone/assess',
      method: 'POST',
      data: { ageRange: selectedAge, results }
    }).then(res => {
      wx.hideLoading();
      if (res.success && res.data) {
        this.showResults(res.data);
      } else {
        wx.showToast({ title: '提交失败', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('提交评估失败:', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    });
  },

  showResults(data) {
    const { dimensions } = this.data;
    const dimensionResults = data.dimensionResults.map(item => {
      const dim = dimensions.find(d => d.id === item.id);
      return { ...item, ...dim };
    });

    // 生成建议
    const suggestions = this.generateSuggestions(dimensionResults);

    this.setData({
      step: 'result',
      overallPercentage: data.overallPercentage,
      dimensionResults,
      suggestions
    });
  },

  generateSuggestions(dimensionResults) {
    const suggestions = [];
    
    dimensionResults.forEach(dim => {
      if (dim.percentage < 60) {
        suggestions.push({
          icon: '⚠️',
          text: `${dim.name}方面需要加强，建议多进行相关训练。`
        });
      } else if (dim.percentage < 80) {
        suggestions.push({
          icon: '💡',
          text: `${dim.name}发展良好，继续保持并适当挑战更高难度。`
        });
      } else {
        suggestions.push({
          icon: '🎉',
          text: `${dim.name}发展优秀！可以适当拓展相关能力。`
        });
      }
    });

    return suggestions;
  },

  restartAssessment() {
    this.setData({
      step: 'age',
      selectedAge: null,
      currentIndicators: [],
      currentQuestionIndex: 0,
      currentIndicator: null,
      currentDimension: null,
      answers: {},
      overallPercentage: 0,
      dimensionResults: [],
      suggestions: []
    });
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/parenting/milestone-result/milestone-result'
    });
  }
});
