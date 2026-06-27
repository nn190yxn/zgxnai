// 成长观察结果页
var app = getApp();
var assessmentUtils = require('../../../utils/assessment.js');
var normalizeAssessmentCode = assessmentUtils.normalizeAssessmentCode;

Page({
  data: {
    // 结果数据
    recordId: '',
    isLocal: false,
    
    // 结果信息
    assessmentCode: '',
    assessmentName: '',
    childName: '',
    completedAt: '',
    
    // 评分
    totalScore: 0,
    maxScore: 0,
    percentage: 0,
    level: '',
    levelColor: '#FF6B35',
    
    // 维度得分
    dimensions: [],
    
    // 详细解读
    interpretation: '',
    
    // 建议
    suggestions: [],
    
    // 家庭支持建议
    trainingPlans: [],

    // 免责声明
    disclaimerText: '本结果仅用于家庭观察和教育参考，不作为医学诊断、心理诊断或治疗依据。如孩子出现持续异常表现，请及时咨询专业医生或发育行为相关专业人士。',
    
    // 用时
    elapsedTime: 0,
    timeText: '',
    
    // 加载状态
    loading: true,
    showMembershipPrompt: false
  },

  onUnload: function() {
    this.clearPendingTimers();
  },

  clearPendingTimers: function() {
    if (this._navigateBackTimer) {
      clearTimeout(this._navigateBackTimer);
      this._navigateBackTimer = null;
    }
    if (this._saveReportTimer) {
      clearTimeout(this._saveReportTimer);
      this._saveReportTimer = null;
    }
  },

  scheduleNavigateBack: function(delay) {
    var that = this;
    if (that._navigateBackTimer) {
      clearTimeout(that._navigateBackTimer);
    }
    that._navigateBackTimer = setTimeout(function() {
      that._navigateBackTimer = null;
      wx.navigateBack();
    }, delay || 1500);
  },

  onLoad: function(options) {
    var that = this;
    that.clearPendingTimers();
    var recordId = options.recordId;
    var isLocal = options.local === '1';
    
    if (!recordId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      that.scheduleNavigateBack(1500);
      return;
    }
    
    that.setData({
      recordId: recordId,
      isLocal: isLocal
    });
    
    // 加载结果数据
    that.loadResult(recordId, isLocal);
  },

  // 加载结果数据
  loadResult: function(recordId, isLocal) {
    var that = this;
    
    if (isLocal) {
      that.loadLocalResult(recordId);
    } else {
      that.loadServerResult(recordId);
    }
    that.checkMembershipStatus();
  },

  // 从本地加载结果
  loadLocalResult: function(recordId) {
    var that = this;
    var records = wx.getStorageSync('assessmentRecords') || wx.getStorageSync('assessmentHistory') || [];
    var record = records.find(function(r) {
      return r.recordId === recordId;
    });
    
    if (record) {
      that.processResult(record);
    } else {
      wx.showToast({
        title: '未找到记录',
        icon: 'none'
      });
      that.scheduleNavigateBack(1500);
    }
  },

  // 从服务器加载结果
  loadServerResult: function(recordId) {
    var that = this;

    if (app.shouldUseMockFallback()) {
      that.loadLocalResult(recordId);
      return;
    }
    
    app.request({
      url: '/assessments/results/' + recordId,
      method: 'GET'
    }).then(function(res) {
      that.processResult(that.normalizeServerResult(res));
    }).catch(function(err) {
      // 从服务器加载失败，尝试本地
      that.loadLocalResult(recordId);
    });
  },

  normalizeServerResult: function(record) {
    var dimensionScores = record.dimension_scores || {};
    var dimensions = [];
    var totalScore = Number(record.overall_score);
    if (isNaN(totalScore)) {
      totalScore = 0;
    }
    var assessmentCode = normalizeAssessmentCode(record.assessment_type);

    if (Array.isArray(dimensionScores)) {
      dimensions = dimensionScores;
    } else {
      for (var key in dimensionScores) {
        if (Object.prototype.hasOwnProperty.call(dimensionScores, key)) {
          dimensions.push(dimensionScores[key]);
        }
      }
    }

    for (var i = 0; i < dimensions.length; i++) {
      var item = dimensions[i] || {};
      item.name = item.dimension_name || item.name || item.dimension_id || '维度';
      item.score = item.score_rate !== undefined ? item.score_rate : item.score;
      item.displayScore = item.standard_score !== null && item.standard_score !== undefined
        ? item.standard_score + '标准分'
        : item.score + '分';
      dimensions[i] = item;
    }

    var maxScore = Number(record.max_score);
    if (isNaN(maxScore) || maxScore <= 0) {
      maxScore = assessmentCode === 'sensory' ? 50 : Math.max(3, dimensions.length * 3);
    }
    var percentage = Number(record.percentage);
    if (isNaN(percentage)) {
      percentage = Math.round((totalScore / maxScore) * 100);
    }

    return {
      recordId: record.id || record.record_id,
      assessmentCode: assessmentCode,
      assessmentName: record.assessment_name,
      childId: record.child_id,
      childName: record.child_name || '未知',
      totalScore: totalScore,
      maxScore: maxScore,
      percentage: percentage,
      level: this.normalizeLevel(record.overall_level),
      completedAt: record.completed_at,
      dimensions: dimensions,
      elapsedTime: record.elapsed_time || 0,
      reportData: this.normalizeReportData(record)
    };
  },

  normalizeLevel: function(level) {
    if (level === 'excellent') return '优秀';
    if (level === 'good') return '良好';
    if (level === 'medium') return '正常';
    if (level === 'attention') return '轻度失调';
    if (level === 'intervention') return '中度失调';
    if (level === '中等') return '正常';
    if (level === '需关注') return '轻度失调';
    if (level === '需干预') return '中度失调';
    return level || '';
  },

  normalizeReportData: function(record) {
    var reportData = record && record.report_data && typeof record.report_data === 'object' ? record.report_data : {};
    var interpretations = Array.isArray(reportData.interpretations) ? reportData.interpretations : (Array.isArray(record && record.interpretations) ? record.interpretations : []);
    var suggestions = Array.isArray(reportData.suggestions) ? reportData.suggestions : (Array.isArray(record && record.suggestions) ? record.suggestions : []);
    var summary = reportData.summary || '';
    if (!summary && interpretations.length > 0) {
      var primaryInterpretation = interpretations[0] || {};
      summary = primaryInterpretation.interpretation || primaryInterpretation.summary || primaryInterpretation.behavior_description || primaryInterpretation.scene_advice || primaryInterpretation.expected_goal || '';
    }
    var suggestionCards = [];
    if (Array.isArray(reportData.suggestionCards) && reportData.suggestionCards.length > 0) {
      suggestionCards = reportData.suggestionCards.map(function(item) {
        return {
          title: item.title || '',
          desc: item.steps || item.description || '',
          duration: item.duration || '',
          frequency: item.frequency || ''
        };
      }).filter(function(item) {
        return item.desc;
      });
    }
    if (!suggestionCards.length && Array.isArray(reportData.recommendations) && reportData.recommendations.length > 0) {
      suggestionCards = reportData.recommendations.map(function(item, index) {
        if (typeof item === 'string') {
          return { title: '建议' + (index + 1), desc: item };
        }
        return {
          title: item.title || ('建议' + (index + 1)),
          desc: item.desc || item.description || item.steps || ''
        };
      }).filter(function(item) {
        return item.desc;
      });
    }
    if (!suggestionCards.length && suggestions.length > 0) {
      suggestionCards = suggestions.map(function(item, index) {
        return {
          title: item.title || item.dimension_name || ('建议' + (index + 1)),
          desc: item.description || item.desc || item.steps || ''
        };
      }).filter(function(item) {
        return item.desc;
      });
    }
    return {
      summary: summary,
      recommendations: reportData.recommendations || [],
      suggestionCards: suggestionCards,
      interpretations: interpretations,
      suggestions: suggestions,
      ageContext: reportData.ageContext || null,
      ageNote: (reportData.ageContext && reportData.ageContext.ageNote) || '',
      expectedByAge: (reportData.ageContext && reportData.ageContext.expectedByAge) || '',
      priorityFocus: (reportData.ageContext && reportData.ageContext.priorityFocus) || ''
    };
  },

  // 处理结果数据
  processResult: function(record) {
    var that = this;
    
    // 格式化时间
    var timeText = that.formatTime(record.elapsedTime);
    var completedAt = that.formatDate(record.completedAt);
    
    // 获取评级颜色
    var levelColor = that.getLevelColor(record.level);
    
    // 生成解读文字
    var interpretation = that.generateInterpretation(record);
    
    // 生成建议
    var suggestions = that.generateSuggestions(record);
    
    // 生成训练方案
    var trainingPlans = that.generateTrainingPlans(record);
    
    var reportData = record.reportData || {};
    that.setData({
      assessmentCode: normalizeAssessmentCode(record.assessmentCode),
      assessmentName: record.assessmentName,
      childName: record.childName,
      completedAt: completedAt,
      totalScore: record.totalScore,
      maxScore: record.maxScore,
      percentage: record.percentage,
      level: record.level,
      levelColor: levelColor,
      dimensions: record.dimensions || [],
      interpretation: interpretation,
      suggestions: suggestions,
      trainingPlans: trainingPlans,
      disclaimerText: that.getDisclaimerText(record.assessmentCode),
      elapsedTime: record.elapsedTime,
      timeText: timeText,
      ageNote: reportData.ageNote || '',
      expectedByAge: reportData.expectedByAge || '',
      priorityFocus: reportData.priorityFocus || '',
      loading: false
    });
  },

  getDisclaimerText: function(assessmentCode) {
    var code = normalizeAssessmentCode(assessmentCode);
    var notices = {
      sensory: '本量表用于家长观察和感统风险筛查，不等同医学诊断或治疗方案。6岁以内儿童可参考原始分到标准分换算；6岁以上结果仅作同题筛查参考。如结果提示中重度风险或日常功能明显受影响，建议进行线下专业评估。',
      adhd: '本工具仅用于家庭观察和风险提示，不能替代专业诊断。如结果提示风险或日常功能明显受影响，建议咨询发育行为儿科、儿童心理或相关专业人员。',
      focus: '本结果仅供家庭观察参考，不能替代注意力相关专业评估或诊断。如孩子的专注力问题持续影响学习和生活，建议咨询专业人士。',
      multi_intelligence: '本结果用于了解儿童多元智能发展线索，仅供家庭教育参考，不代表固定能力标签，也不等同专业诊断。',
      emotion: '本结果用于观察儿童情绪能力发展，仅供参考，不替代专业心理评估或诊断。',
      learning: '本结果用于了解孩子学习适应情况，仅供教育参考，不能替代医学或心理专业评估。',
      gross_motor: '本观察仅用于发育筛查参考，不等同发育商评估、康复评估或医学诊断。如大运动里程碑明显落后或已有日常功能受限，建议咨询儿童保健、康复或发育行为相关专业人员。',
      fine_motor: '本观察仅用于发育筛查参考，不等同发育商评估、作业治疗评估或医学诊断。如精细动作持续影响进食、操作和日常活动，建议咨询儿童保健、康复或相关专业人员。',
      language_dev: '本观察仅用于语言发展筛查参考，不等同语言评估、听力评估或医学诊断。如语言理解、表达或互动长期落后，建议尽快咨询儿童保健、听力或语言治疗相关专业人员。',
      social_emotion: '本观察仅用于社交情绪发展筛查参考，不等同心理评估、发育评估或医学诊断。如互动回应、依恋或情绪调节持续异常，建议咨询儿童心理、发育行为或相关专业人员。'
    };
    return notices[code] || this.data.disclaimerText;
  },

  // 格式化时间
  formatTime: function(seconds) {
    if (!seconds) return '0分钟';
    var minutes = Math.floor(seconds / 60);
    var secs = seconds % 60;
    if (minutes > 0) {
      return minutes + '分' + (secs > 0 ? secs + '秒' : '');
    }
    return secs + '秒';
  },

  // 格式化日期
  formatDate: function(timestamp) {
    if (!timestamp) return '';
    var date = new Date(timestamp);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    
    return year + '-' + (month < 10 ? '0' : '') + month + '-' + (day < 10 ? '0' : '') + day + ' ' + 
           (hour < 10 ? '0' : '') + hour + ':' + (minute < 10 ? '0' : '') + minute;
  },

  // 获取评级颜色
  getLevelColor: function(level) {
    var colors = {
      '优秀': '#FF6B35',
      '良好': '#FF7E4B',
      '中等': '#FFA000',
      '正常': '#FFA000',
      '需关注': '#FF5722',
      '轻度失调': '#FF5722',
      '需干预': '#D32F2F',
      '中度失调': '#D32F2F'
    };
    return colors[level] || '#FF6B35';
  },

  // 生成解读文字
  generateInterpretation: function(record) {
    var code = record.assessmentCode;
    var percentage = record.percentage;
    var level = record.level;
    if (record.reportData && record.reportData.summary) {
      return record.reportData.summary;
    }
    
    var interpretations = {
      sensory: {
        excellent: '孩子的感觉统合能力发展优秀，各项感官功能协调良好，能够很好地适应各种环境和活动。建议继续保持，可以尝试更具挑战性的感统活动。',
        good: '孩子的感觉统合能力发展良好，大部分感官功能协调正常。建议在日常活动中增加平衡、触觉和户外探索类游戏。',
        medium: '孩子的感觉统合能力处于中等水平，部分感官表现需要更多观察。建议结合日常游戏进行支持，并持续记录变化。',
        attention: '孩子的感觉统合表现需要关注，建议增加日常观察和家庭支持；如已影响生活或学习，可咨询线下专业人员。',
        intervention: '孩子的感觉统合表现提示较高关注度，建议结合家庭记录咨询线下专业人员，进一步了解孩子的实际情况。'
      },
      focus: {
        excellent: '孩子的专注力发展优秀，能够长时间集中注意力完成任务。建议继续保持良好的学习习惯，可以尝试更复杂的学习任务。',
        good: '孩子的专注力发展良好，基本能够满足日常学习和生活需求。建议通过游戏和活动进一步提升专注力。',
        medium: '孩子的专注力处于中等水平，有时会出现注意力分散的情况。建议通过短时任务、规律作息和减少干扰来支持。',
        attention: '孩子的专注力表现需要关注，建议持续观察具体场景；如持续影响学习和生活，可咨询相关专业人员。',
        intervention: '孩子的专注力表现提示较高关注度，建议整理日常观察记录后咨询相关专业人员。'
      },
      adhd: {
        excellent: '筛查结果显示孩子多动冲动行为较少，注意力表现良好。建议继续保持良好的行为习惯。',
        good: '筛查结果显示孩子存在轻微的多动冲动倾向，但总体表现良好。建议关注孩子的行为表现，适时引导。',
        medium: '筛查结果显示孩子存在一定的多动冲动表现，需要家长关注。建议记录出现频率、场景和持续时间，并进行温和引导。',
        attention: '筛查结果提示需要关注注意力或多动冲动表现。该结果不能诊断 ADHD，如持续影响生活学习，建议咨询发育行为儿科或儿童心理相关专业人员。',
        intervention: '筛查结果提示较高关注度。该结果不能诊断 ADHD，建议带着日常观察记录咨询发育行为儿科或儿童心理相关专业人员。'
      },
      multi_intelligence: {
        excellent: '孩子在多个智能领域表现出色，具有很好的发展潜力。建议全面发展各项智能，发掘孩子的天赋。',
        good: '孩子在多个智能领域表现良好，具有一定的优势领域。建议重点培养优势智能，同时发展其他领域。',
        medium: '孩子在部分智能领域表现一般，需要加强培养。建议根据孩子的兴趣和特点，有针对性地进行培养。',
        attention: '孩子在多个能力领域需要更多支持，建议结合兴趣提供多样化体验，避免用单次结果给孩子贴标签。',
        intervention: '孩子在部分能力领域需要更多支持，建议结合日常观察和兴趣特点，必要时咨询教育相关专业人员。'
      },
      emotion: {
        excellent: '孩子的情绪管理能力优秀，能够很好地识别、表达和调节自己的情绪。建议继续保持，培养更高的情商。',
        good: '孩子的情绪管理能力良好，基本能够应对日常情绪问题。建议通过游戏和活动进一步提升情绪智力。',
        medium: '孩子的情绪管理能力处于中等水平，有时会出现情绪波动。建议进行情绪管理训练，学习情绪调节技巧。',
        attention: '孩子的情绪管理表现需要关注，建议通过情绪命名、倾听和稳定作息提供支持，必要时咨询专业人员。',
        intervention: '孩子的情绪管理表现提示较高关注度，建议记录具体场景和持续时间，并咨询儿童心理相关专业人员。'
      },
      learning: {
        excellent: '孩子的学习适应性优秀，能够很好地适应学习环境和任务。建议继续保持良好的学习习惯，追求更高目标。',
        good: '孩子的学习适应性良好，基本能够完成学习任务。建议培养更好的学习习惯和方法。',
        medium: '孩子的学习适应性处于中等水平，有时会遇到学习困难。建议进行学习方法训练，提高学习效率。',
        attention: '孩子的学习适应性需要关注，可能存在学习困难。建议进行能力支持和适应性训练。',
        intervention: '孩子的学习适应性表现提示较高关注度，建议结合学校反馈和家庭观察，咨询教育相关专业人员。'
      },
      gross_motor: {
        excellent: '孩子的大运动发展表现扎实，头颈、躯干与下肢协同较好，当前里程碑达成度较高。建议继续通过爬行、跑跳和障碍游戏丰富身体经验。',
        good: '孩子的大运动发展整体良好，大多数里程碑已经建立。建议继续增加户外活动、上下坡和球类游戏，巩固平衡与协调。',
        medium: '孩子的大运动发展基本在可观察范围内，个别动作还需要更多练习。建议结合日常游戏强化翻身、坐爬、走跑或双脚跳等关键动作。',
        attention: '孩子的大运动发展有若干表现值得持续关注。建议记录未稳定出现的动作场景和频率，并在家庭活动中针对性练习。',
        intervention: '孩子的大运动发展提示较高关注度。建议尽快整理里程碑记录，咨询儿童保健、康复或发育行为相关专业人员。'
      },
      fine_motor: {
        excellent: '孩子的精细动作发展表现突出，抓握、捏取和双手配合较为成熟。建议继续提供搭积木、涂鸦、翻书和简单工具操作机会。',
        good: '孩子的精细动作发展整体良好，多数手部操作已经较稳定。建议通过串珠、贴纸和勺叉练习提升手眼协调。',
        medium: '孩子的精细动作发展基本符合家庭观察预期，部分操作仍需更多机会练习。建议把握日常进食、游戏和操作环节持续支持。',
        attention: '孩子的精细动作表现有一些需要关注的地方。建议重点观察抓握方式、双手配合和工具使用是否持续受限。',
        intervention: '孩子的精细动作发展提示较高关注度。建议结合进食、穿脱和玩具操作表现，尽快咨询儿童保健或康复相关专业人员。'
      },
      language_dev: {
        excellent: '孩子的语言发展表现积极，理解与表达都较为顺畅。建议继续保持高质量对话、共读和命名互动。',
        good: '孩子的语言发展整体良好，能够在日常互动中逐步表达需求和理解指令。建议增加共读、重复句式和轮流对话。',
        medium: '孩子的语言发展处于持续建立阶段，部分理解或表达能力还需要更多支持。建议多做跟读、指认和生活化命名练习。',
        attention: '孩子的语言发展存在若干需要持续观察的信号。建议重点记录回应名字、理解简单指令和主动表达需求的表现。',
        intervention: '孩子的语言发展提示较高关注度。建议结合听觉反应和家庭互动记录，尽快咨询儿童保健、听力或语言相关专业人员。'
      },
      social_emotion: {
        excellent: '孩子的社交情绪发展表现稳定，能够积极回应、表达情绪并与照护者建立良好互动。建议继续通过共情回应和模仿游戏强化优势。',
        good: '孩子的社交情绪发展整体良好，在回应、依恋和互动中已有较多积极表现。建议继续增加轮流互动、情绪命名和同伴体验。',
        medium: '孩子的社交情绪发展处于持续建立过程中，部分表现还需要更多观察和支持。建议在稳定陪伴中练习回应、模仿和情绪表达。',
        attention: '孩子的社交情绪发展有一些值得关注的信号。建议重点记录目光对视、回应呼唤、依恋表现和情绪安抚方式。',
        intervention: '孩子的社交情绪发展提示较高关注度。建议整理家庭观察记录，尽快咨询儿童心理、发育行为或相关专业人员。'
      }
    };
    
    var levelKey = 'medium';
    if (percentage >= 85) levelKey = 'excellent';
    else if (percentage >= 70) levelKey = 'good';
    else if (percentage >= 55) levelKey = 'medium';
    else if (percentage >= 40) levelKey = 'attention';
    else levelKey = 'intervention';
    
    var codeInterpretations = interpretations[code] || interpretations.sensory;
    return codeInterpretations[levelKey] || codeInterpretations.medium;
  },

  // 生成建议
  generateSuggestions: function(record) {
    var code = record.assessmentCode;
    var percentage = record.percentage;
    if (record.reportData && Array.isArray(record.reportData.suggestionCards) && record.reportData.suggestionCards.length > 0) {
      return record.reportData.suggestionCards;
    }
    
    var allSuggestions = {
      sensory: [
        { title: '增加户外活动', desc: '每天保证1-2小时户外活动时间，接触自然环境' },
        { title: '感统游戏', desc: '进行平衡木、荡秋千、玩沙子等感统游戏' },
        { title: '触觉训练', desc: '通过玩橡皮泥、触摸不同材质物品进行触觉训练' },
        { title: '前庭训练', desc: '进行旋转、跳跃、翻滚等前庭觉训练活动' }
      ],
      focus: [
        { title: '规律作息', desc: '保持规律的作息时间，保证充足睡眠' },
        { title: '专注力游戏', desc: '进行拼图、找不同、记忆游戏等专注力训练' },
        { title: '减少干扰', desc: '学习时减少环境干扰，创造安静的学习空间' },
        { title: '番茄工作法', desc: '使用番茄工作法，25分钟专注+5分钟休息' }
      ],
      adhd: [
        { title: '行为管理', desc: '建立明确的行为规则和奖励机制' },
        { title: '运动释放', desc: '通过体育运动释放多余精力' },
        { title: '任务分解', desc: '将大任务分解成小步骤，逐步完成' },
        { title: '专业评估', desc: '如症状明显，建议到专业机构进行评估' }
      ],
      multi_intelligence: [
        { title: '多元体验', desc: '提供丰富多样的活动体验，发现孩子兴趣' },
        { title: '优势培养', desc: '重点培养孩子的优势智能领域' },
        { title: '全面发展', desc: '在发展优势的同时，不忽视其他智能领域' },
        { title: '个性化教育', desc: '根据孩子的智能特点进行个性化教育' }
      ],
      emotion: [
        { title: '情绪识别', desc: '教孩子识别和命名不同的情绪' },
        { title: '情绪表达', desc: '鼓励孩子用语言表达情绪，而不是行为' },
        { title: '情绪调节', desc: '教孩子深呼吸、数数等情绪调节方法' },
        { title: '同理心培养', desc: '通过角色扮演等活动培养同理心' }
      ],
      learning: [
        { title: '学习习惯', desc: '培养固定的学习时间和地点' },
        { title: '学习方法', desc: '教授有效的学习方法和记忆技巧' },
        { title: '目标设定', desc: '帮助孩子设定合理的学习目标' },
        { title: '正向激励', desc: '及时表扬和鼓励孩子的学习进步' }
      ],
      gross_motor: [
        { title: '增加地面活动', desc: '每天安排趴玩、爬行、跨越和上下台阶等活动，帮助核心力量和协调建立。' },
        { title: '做里程碑记录', desc: '记录翻身、坐、爬、站、走、跳等动作出现频率，便于观察变化。' },
        { title: '多做平衡游戏', desc: '通过球类、追逐、障碍物和踮脚游戏增加全身协调经验。' },
        { title: '必要时做专业评估', desc: '如关键动作长期未出现或姿势明显异常，尽快咨询专业人员。' }
      ],
      fine_motor: [
        { title: '强化抓握练习', desc: '用积木、贴纸、夹子和小勺等活动练习抓握和捏取。' },
        { title: '增加双手配合', desc: '通过套圈、开盒、翻书和对敲玩具练习双手协调。' },
        { title: '融入日常生活', desc: '把进食、穿脱和整理玩具变成手部操作练习场景。' },
        { title: '关注工具使用', desc: '持续观察勺叉、蜡笔、杯子等使用情况，发现受限及时记录。' }
      ],
      language_dev: [
        { title: '增加高频对话', desc: '在吃饭、洗澡、出门等情境里多做命名、描述和轮流对话。' },
        { title: '坚持亲子共读', desc: '用重复句式、指图提问和等待回应帮助理解与表达。' },
        { title: '鼓励主动表达', desc: '先等待孩子用眼神、手势或语言表达需求，再给予支持。' },
        { title: '记录关键反应', desc: '记录对名字反应、理解指令和主动词汇增长，便于连续观察。' }
      ],
      social_emotion: [
        { title: '强化回应互动', desc: '多做看脸、模仿、躲猫猫和轮流游戏，增加社交回应经验。' },
        { title: '帮助命名情绪', desc: '在日常中示范“开心、难过、生气”等情绪词，帮助孩子建立理解。' },
        { title: '建立稳定安抚', desc: '保持稳定作息和固定安抚方式，帮助孩子逐步学会调节。' },
        { title: '记录互动线索', desc: '持续记录对视、回应呼唤、依恋和分离反应，便于判断变化。' }
      ]
    };
    
    var suggestions = allSuggestions[code] || allSuggestions.sensory;
    
    // 根据得分返回不同数量的建议
    if (percentage >= 70) {
      return suggestions.slice(0, 2);
    } else if (percentage >= 55) {
      return suggestions.slice(0, 3);
    }
    return suggestions;
  },

  // 生成家庭支持建议
  generateTrainingPlans: function(record) {
    var code = record.assessmentCode;
    var percentage = record.percentage;
    
    // 只有得分较低时才推荐进一步支持建议
    if (percentage >= 70) {
      return [];
    }
    
    var plans = {
      sensory: [
        { name: '日常感统游戏支持', duration: '持续观察', desc: '通过平衡、触觉、户外活动增加身体经验' },
        { name: '线下专业咨询准备', duration: '按需进行', desc: '整理家庭观察记录，便于专业人员了解情况' }
      ],
      focus: [
        { name: '家庭专注环境优化', duration: '持续观察', desc: '减少干扰、拆小任务、建立稳定作息' },
        { name: '学习场景记录', duration: '按需进行', desc: '记录分心场景和持续时间，便于后续判断' }
      ],
      adhd: [
        { name: '行为观察记录', duration: '持续观察', desc: '记录注意力、多动冲动表现的频率和场景' }
      ],
      multi_intelligence: [
        { name: '多样活动体验', duration: '持续观察', desc: '通过阅读、运动、音乐、合作游戏发现兴趣线索' }
      ],
      emotion: [
        { name: '情绪表达支持', duration: '持续观察', desc: '帮助孩子命名情绪、表达需求并练习冷静方法' }
      ],
      learning: [
        { name: '学习习惯支持', duration: '持续观察', desc: '建立固定学习时间、目标拆分和正向反馈' }
      ],
      gross_motor: [
        { name: '大运动里程碑支持', duration: '持续观察', desc: '围绕翻身、坐爬、行走和跳跃设计低门槛家庭练习。' },
        { name: '线下发育咨询准备', duration: '按需进行', desc: '整理未出现的关键动作和视频记录，便于专业人员判断。' }
      ],
      fine_motor: [
        { name: '手部操作支持', duration: '持续观察', desc: '把抓握、捏取、双手配合训练融入进食和游戏。' }
      ],
      language_dev: [
        { name: '高频语言输入支持', duration: '持续观察', desc: '通过命名、共读和轮流对话增加理解与表达机会。' },
        { name: '关键语言线索记录', duration: '按需进行', desc: '记录回应名字、理解指令和主动表达，便于持续跟进。' }
      ],
      social_emotion: [
        { name: '亲子互动支持', duration: '持续观察', desc: '通过模仿、轮流和情绪回应建立稳定互动经验。' }
      ]
    };
    
    return plans[code] || [];
  },

  // 分享报告
  shareReport: function() {
    var that = this;
    // 小程序分享功能
  },

  // 保存到相册
  saveToAlbum: function() {
    var that = this;
    
    wx.showLoading({
      title: '生成中...',
      mask: true
    });
    
    // 创建canvas绘制报告
    that.createReportImage();
  },

  // 创建报告图片
  createReportImage: function() {
    var that = this;
    
    // 实际项目中需要使用canvas绘制
    // 这里简化处理
    if (that._saveReportTimer) {
      clearTimeout(that._saveReportTimer);
    }
    that._saveReportTimer = setTimeout(function() {
      that._saveReportTimer = null;
      wx.hideLoading();
      wx.showToast({
        title: '报告已保存',
        icon: 'success'
      });
    }, 1500);
  },

  // 查看历史记录
  goToHistory: function() {
    wx.navigateTo({
      url: '/pages/assessment/history/history',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  checkMembershipStatus: function() {
    var that = this;
    if (!app.globalData.isLoggedIn && !wx.getStorageSync('token')) {
      return;
    }
    app.ensureLogin().then(function() {
      return app.request({
        url: '/retention/status',
        method: 'GET'
      });
    }).then(function(res) {
      var data = (res && res.data) ? res.data : res;
      if (data && !data.is_active && data.is_active_unpaid) {
        that.setData({ showMembershipPrompt: true });
      }
    }).catch(function() {});
  },

  saveAssessmentToGrowthRecord: function() {
    var that = this;
    var currentChild = app.getCurrentChild ? app.getCurrentChild() : null;
    if (!currentChild || !currentChild.id) {
      wx.showToast({ title: '请先在首页完善孩子档案', icon: 'none' });
      return;
    }
    var title = that.data.assessmentName + ' - ' + that.data.level;
    var summary = [
      that.data.assessmentName,
      '得分：' + that.data.percentage + '分（' + that.data.level + '）',
      that.data.interpretation || '',
      that.data.interpretation ? '' : '孩子：' + that.data.childName
    ].filter(Boolean).join('；');
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        return;
      }
      return app.request({
        url: '/growth-records/entry',
        method: 'POST',
        data: {
          childId: currentChild.id,
          entry_type: 'assessment_result',
          title: title,
          summary: summary,
          source_id: 'assessment_' + (that.data.recordId || that.data.assessmentCode)
        }
      });
    }).then(function() {
      wx.showToast({ title: '已保存到成长记录', icon: 'success' });
      if (app.trackKbEvent) {
        app.trackKbEvent({
          event_type: 'growth_record_save',
          module_key: 'growth_record',
          page_key: 'assessment_result',
          event_meta: { entry_type: 'assessment_result', assessmentCode: that.data.assessmentCode }
        });
      }
    }).catch(function() {
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    });
  },

  goToMembershipFromResult: function() {
    wx.navigateTo({
      url: '/pages/membership/index?source=assessment_result',
      fail: function() {
        wx.showToast({ title: '页面跳转失败', icon: 'none' });
      }
    });
  },

  // 返回成长观察页
  goBack: function() {
    wx.navigateBack();
  },

  // 重新作答
  redoAssessment: function() {
    var that = this;
    
    wx.showModal({
      title: '重新开始',
      content: '确定要重新进行' + that.data.assessmentName + '吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: function(res) {
        if (res.confirm) {
          wx.redirectTo({
            url: '/pages/assessment/do/do?code=' + that.data.assessmentCode,
            fail: function() {
              wx.showToast({ title: '页面跳转失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  // 分享
  onShareAppMessage: function() {
    var that = this;
    return {
      title: app.buildShareTitle('assessment_result', {
        assessmentName: that.data.assessmentName
      }),
      path: '/pages/assessment/assessment'
    };
  }
});
