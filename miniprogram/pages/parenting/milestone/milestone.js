const app = getApp();
const milestoneData = require('./milestoneData');

Page({
  data: {
    step: 'age',
    selectedAge: null,
    ageRanges: milestoneData.ageRanges,
    dimensions: milestoneData.dimensions,
    currentIndicators: [],
    currentQuestionIndex: 0,
    currentIndicator: null,
    currentDimension: null,
    answers: {},
    overallPercentage: 0,
    dimensionResults: [],
    resultLevel: null,
    strengths: [],
    focusAreas: [],
    practiceSuggestions: [],
    professionalNotes: [],
    suggestions: [],
    progressPercent: 0
  },

  onLoad(options) {
    if (options.historyId) {
      this.loadHistoryDetail(options.historyId);
      return;
    }

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

    this.loadIndicators();
  },

  loadIndicators() {
    wx.showLoading({ title: '加载中...' });
    
    // 纯前端实现：直接从本地数据获取
    const indicators = milestoneData.getIndicators(this.data.selectedAge);
    
    if (indicators && indicators.length > 0) {
      this.setData({
        currentIndicators: indicators,
        currentQuestionIndex: 0,
        answers: {},
        step: 'assess'
      });
      this.updateQuestion();
    } else {
      wx.showToast({ title: '该年龄段暂无评估指标', icon: 'none' });
    }
    
    wx.hideLoading();
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
    const { currentIndicator } = this.data;
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
      wx.showToast({ 
        title: `还有${currentIndicators.length - answeredCount}题未回答`, 
        icon: 'none' 
      });
      return;
    }

    wx.showLoading({ title: '计算中...' });

    // 纯前端计算评估结果
    const results = milestoneData.calculateResults(selectedAge, answers);
    const report = milestoneData.generateReport(results);
    
    // 生成建议
    const suggestions = this.generateSuggestions(results.dimensionResults);

    // 保存到本地存储
    const assessmentRecord = {
      ageRange: selectedAge,
      overallPercentage: results.overallPercentage,
      totalScore: results.totalScore,
      totalItems: results.totalItems,
      dimensionResults: results.dimensionResults,
      resultLevel: report.resultLevel,
      strengths: report.strengths,
      focusAreas: report.focusAreas,
      practiceSuggestions: report.practiceSuggestions,
      professionalNotes: report.professionalNotes,
      createdAt: new Date().toISOString()
    };
    
    milestoneData.saveHistory(assessmentRecord);

    wx.hideLoading();

    // 显示结果
    this.setData({
      step: 'result',
      overallPercentage: results.overallPercentage,
      dimensionResults: results.dimensionResults,
      resultLevel: report.resultLevel,
      strengths: report.strengths,
      focusAreas: report.focusAreas,
      practiceSuggestions: report.practiceSuggestions,
      professionalNotes: report.professionalNotes,
      suggestions
    });
  },

  loadHistoryDetail(historyId) {
    const history = milestoneData.getHistory();
    const record = history.find(item => String(item.id) === String(historyId));

    if (!record) {
      wx.showToast({ title: '未找到评估记录', icon: 'none' });
      return;
    }

    const report = record.resultLevel ? record : milestoneData.generateReport({
      overallPercentage: record.overallPercentage,
      dimensionResults: record.dimensionResults || []
    });

    this.setData({
      step: 'result',
      selectedAge: record.ageRange,
      overallPercentage: record.overallPercentage,
      dimensionResults: record.dimensionResults || [],
      resultLevel: report.resultLevel,
      strengths: report.strengths || [],
      focusAreas: report.focusAreas || [],
      practiceSuggestions: report.practiceSuggestions || [],
      professionalNotes: report.professionalNotes || milestoneData.getProfessionalNotes(),
      suggestions: this.generateSuggestions(record.dimensionResults || [])
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
      resultLevel: null,
      strengths: [],
      focusAreas: [],
      practiceSuggestions: [],
      professionalNotes: [],
      suggestions: []
    });
  },

  goToHistory() {
    wx.navigateTo({
      url: '/pages/parenting/milestone-result/milestone-result'
    });
  }
});
