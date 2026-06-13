// 知识点详情页面逻辑
var app = getApp();

Page({
  data: {
    // 知识点信息
    pointId: null,
    pointName: '',
    subjectCode: '',
    childId: 0,
    mode: 'learn', // learn 或 test

    // 知识点详情
    knowledgeDetail: null,

    // 当前标签页
    currentTab: 'explain', // explain, key, example, practice, note

    // 学习笔记
    noteContent: '',

    // 家长陪练步骤勾选
    stepChecklist: [],

    // 练习题列表
    practiceList: [],
    currentPracticeIndex: 0,

    // 练习答案
    practiceAnswers: {},

    // 练习结果
    showPracticeResult: false,
    practiceResult: null,

    // 掌握确认弹窗
    showMasterModal: false,

    // 加载状态
    loading: false
  },

  onLoad: function(options) {
    var that = this;
    
    // 获取页面参数
    if (options.pointId) {
      that.setData({
        pointId: decodeURIComponent(options.pointId)
      });
    }
    if (options.pointName) {
      that.setData({
        pointName: decodeURIComponent(options.pointName)
      });
    }
    if (options.subjectCode) {
      that.setData({
        subjectCode: options.subjectCode
      });
    }
    if (options.childId) {
      that.setData({
        childId: parseInt(options.childId, 10) || 0
      });
    }
    if (options.mode) {
      that.setData({
        mode: options.mode
      });
    }
    if (options.taskId) {
      that.setData({
        pointId: decodeURIComponent(options.taskId)
      });
    }

    // 设置页面标题
    wx.setNavigationBarTitle({
      title: that.data.pointName || '知识点详情'
    });

    // 加载知识点详情
    that.loadKnowledgeDetail();
  },

  // 加载知识点详情
  loadKnowledgeDetail: function(fromPullDown) {
    var that = this;
    
    that.setData({
      loading: true
    });

    if (app.shouldUseMockFallback()) {
      that.applyKnowledgeDetail(that.getMockDetail());
      that.setData({
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
      return;
    }

    app.request({
      url: '/education/knowledge/detail',
      method: 'GET',
      data: {
        pointId: that.data.pointId,
        subjectCode: that.data.subjectCode,
        childId: that.data.childId || ((app.getCurrentChild && app.getCurrentChild() && app.getCurrentChild().id) || 0)
      }
    }).then(function(res) {
      if (res) {
        that.applyKnowledgeDetail(res);
      }
    }).catch(function(err) {
      if (!app.shouldUseMockFallback()) {
        app.showApiError('知识点详情加载失败');
        that.setData({
          knowledgeDetail: null
        });
        return;
      }
      // 使用模拟数据
      that.applyKnowledgeDetail(that.getMockDetail());
    }).finally(function() {
      that.setData({
        loading: false
      });
      if (fromPullDown) {
        wx.stopPullDownRefresh();
      }
    });
  },

  applyKnowledgeDetail: function(detail) {
    var normalizedDetail = this.normalizeKnowledgeDetail(detail || {});
    var noteContent = this.loadSavedNote(this.data.pointId);
    var stepChecklist = this.buildStepChecklist(normalizedDetail);
    this.setData({
      knowledgeDetail: normalizedDetail,
      practiceList: normalizedDetail.practices || [],
      currentPracticeIndex: 0,
      practiceAnswers: {},
      showPracticeResult: false,
      practiceResult: null,
      noteContent: noteContent,
      stepChecklist: stepChecklist
    });
  },

  normalizeKnowledgeDetail: function(detail) {
    var normalized = Object.assign({}, detail || {});
    normalized.visual = normalized.visual || { icon: '📘', title: '能力成长', desc: '' };
    normalized.explain = normalized.explain || { title: normalized.title || normalized.name || '能力成长讲解', content: '' };
    normalized.keyPoints = Array.isArray(normalized.keyPoints) ? normalized.keyPoints : [];
    normalized.difficulties = Array.isArray(normalized.difficulties) ? normalized.difficulties : [];
    normalized.examples = Array.isArray(normalized.examples) ? normalized.examples : [];
    normalized.practices = Array.isArray(normalized.practices) ? normalized.practices : [];
    normalized.parent_prompt = normalized.parent_prompt || '';
    normalized.objective = normalized.objective || '';
    normalized.material = normalized.material || '';
    normalized.duration = normalized.duration || 10;
    return normalized;
  },

  loadSavedNote: function(pointId) {
    var notes = wx.getStorageSync('knowledgeNotes') || {};
    return (notes[pointId] && notes[pointId].content) || '';
  },

  buildStepChecklist: function(detail) {
    var checklistStore = wx.getStorageSync('knowledgeStepChecklist') || {};
    var savedMap = checklistStore[this.data.pointId] || {};
    var sourceList = (detail && detail.keyPoints && detail.keyPoints.length ? detail.keyPoints : []).slice(0, 6);
    return sourceList.map(function(item, index) {
      return {
        id: item.id || (index + 1),
        content: item.content || '',
        done: !!savedMap[index]
      };
    });
  },

  persistStepChecklist: function() {
    var checklistStore = wx.getStorageSync('knowledgeStepChecklist') || {};
    var pointId = this.data.pointId;
    checklistStore[pointId] = {};
    (this.data.stepChecklist || []).forEach(function(item, index) {
      checklistStore[pointId][index] = !!item.done;
    });
    wx.setStorageSync('knowledgeStepChecklist', checklistStore);
  },

  // 获取模拟详情数据（支持五大主题）
  getMockDetail: function() {
    var subjectCode = this.data.subjectCode;
    var pointId = this.data.pointId;
    var pointName = this.data.pointName || '';
    var readingDetails = {
      r1: {
        id: pointId,
        name: pointName || '绘本分镜阅读',
        status: 'learning',
        difficulty: 1,
        visual: {
          icon: '📖',
          title: '看图找线索',
          desc: '用3页画面完成一次轻量共读'
        },
        explain: {
          title: '亲子共读任务',
          content: '这节任务不是让孩子背故事，而是让孩子在画面里找到信息。\n\n【材料准备】\n- 选择一本画面清楚、情节简单的绘本\n- 每次只读3-5页，控制在10分钟内\n- 家长准备3个问题：谁、在哪里、发生了什么\n\n【陪读步骤】\n1. 先看封面，猜一猜主角是谁\n2. 读一页后停下来，请孩子指一指画面\n3. 读到关键变化时问：后来怎么了\n4. 最后请孩子用一句话说出故事变化\n\n【家长话术】\n你看到谁了？它在哪里？后来发生了什么？'
        },
        keyPoints: [
          { id: 1, content: '先看图，再读文字，降低孩子理解压力' },
          { id: 2, content: '每次只抓一个主角和一个变化' },
          { id: 3, content: '孩子说得不完整时，家长帮他补成完整句' }
        ],
        difficulties: [
          { id: 1, content: '不要连续追问太多，避免把共读变成考试' },
          { id: 2, content: '孩子只说词语也可以，先保护表达意愿' }
        ],
        examples: [
          {
            id: 1,
            title: '共读示例',
            question: '家长问：小种子一开始在哪里？后来发生了什么？',
            answer: '孩子答：在土里，后来发芽了。',
            analysis: '这个回答已经抓住了主角位置和关键变化，可以继续追问“你从哪一页看到的”。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '分镜阅读最适合先问哪类问题？',
            options: ['谁在画面里', '作者用了什么修辞', '全文中心思想', '背出全部句子'],
            answer: 0,
            analysis: '低龄和初学阶段先问画面事实，孩子更容易进入阅读。'
          },
          {
            id: 2,
            type: 'fill',
            question: '请用一句话记录孩子今天复述的内容。',
            answer: '',
            analysis: '能说出主角和变化，就是一次有效复述。'
          }
        ]
      },
      r2: {
        id: pointId,
        name: pointName || '短文理解',
        status: 'learning',
        difficulty: 2,
        visual: {
          icon: '🌱',
          title: '读短文答问题',
          desc: '围绕谁、在哪、为什么做理解'
        },
        explain: {
          title: '理解提问任务',
          content: '这节任务训练孩子读完后抓住关键信息。\n\n【阅读材料】\n春天来了，小草从泥土里钻出来。小朋友在公园里看见了蝴蝶，也看见了刚开的花。他们轻轻地走过去，怕碰坏小花。\n\n【训练目标】\n- 找出时间、地点、人物和动作\n- 能回答一个“为什么”问题\n- 用一句话复述这段内容\n\n【操作步骤】\n1. 家长读一遍，孩子听\n2. 让孩子说出看到了什么\n3. 问：小朋友为什么轻轻走过去\n4. 请孩子用一句话讲给家长听'
        },
        keyPoints: [
          { id: 1, content: '先问事实问题，再问原因问题' },
          { id: 2, content: '复述时允许孩子使用自己的话' },
          { id: 3, content: '从“说对关键词”逐步过渡到“说完整句”' }
        ],
        difficulties: [
          { id: 1, content: '孩子答不上来时，可回到原句重新读一遍' },
          { id: 2, content: '不要急着给标准答案，先让孩子找线索' }
        ],
        examples: [
          {
            id: 1,
            title: '理解示例',
            question: '小朋友为什么轻轻地走过去？',
            answer: '因为他们怕碰坏小花。',
            analysis: '答案可以从短文最后一句直接找到，这是基础理解题。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '这段短文主要写的是什么季节？',
            options: ['春天', '夏天', '秋天', '冬天'],
            answer: 0,
            analysis: '短文第一句直接说明“春天来了”。'
          },
          {
            id: 2,
            type: 'choice',
            question: '小朋友在哪里看见了蝴蝶和花？',
            options: ['公园里', '教室里', '车站里', '厨房里'],
            answer: 0,
            analysis: '地点信息在第二句。'
          }
        ]
      },
      r3: {
        id: pointId,
        name: pointName || '一句话讲重点',
        status: 'learning',
        difficulty: 2,
        visual: {
          icon: '💬',
          title: '一句话复述',
          desc: '谁 + 做了什么 + 结果怎么样'
        },
        explain: {
          title: '口头复述任务',
          content: '这节任务训练孩子把读到的内容变成自己的表达。\n\n【表达公式】\n谁 + 做了什么 + 结果怎么样。\n\n【示范】\n小种子落进土里，慢慢发芽，最后长成了花。\n\n【操作步骤】\n1. 家长先给一个示范句\n2. 孩子照着公式说一遍\n3. 如果孩子只说关键词，家长补成完整句\n4. 最后录音回放，让孩子听见自己的表达'
        },
        keyPoints: [
          { id: 1, content: '一句话复述不追求长，先追求完整' },
          { id: 2, content: '用“谁、做什么、结果”帮助孩子组织语言' },
          { id: 3, content: '录音回放可增强孩子表达成就感' }
        ],
        difficulties: [
          { id: 1, content: '孩子卡住时，先给半句提示' },
          { id: 2, content: '不要用成人化词汇替代孩子自己的表达' }
        ],
        examples: [
          {
            id: 1,
            title: '表达示例',
            question: '读完“春天来了”后，怎样一句话讲重点？',
            answer: '春天到了，小朋友在公园里看见了小草、蝴蝶和花。',
            analysis: '这句话包含时间、人物、地点和看到的内容。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'fill',
            question: '请用“谁 + 做了什么 + 结果怎么样”说一句话。',
            answer: '',
            analysis: '能说完整句即可，不要求和示范完全一致。'
          }
        ]
      },
      r4: {
        id: pointId,
        name: pointName || '联系生活说一说',
        status: 'learning',
        difficulty: 2,
        visual: {
          icon: '⭐',
          title: '说出喜欢和理由',
          desc: '把阅读内容变成自己的表达'
        },
        explain: {
          title: '阅读迁移任务',
          content: '这节任务帮助孩子把书里的内容和自己的生活联系起来。\n\n【任务目标】\n- 说出自己喜欢的画面或情节\n- 说出一个简单理由\n- 练习“我喜欢……因为……”的表达\n\n【操作步骤】\n1. 读完后让孩子选一页最喜欢的画面\n2. 家长问：你喜欢哪里\n3. 再问：为什么喜欢\n4. 帮孩子整理成一句完整表达'
        },
        keyPoints: [
          { id: 1, content: '让孩子先选，能提高参与感' },
          { id: 2, content: '理由可以很简单，比如颜色、人物、动作' },
          { id: 3, content: '把零散回答整理成完整表达' }
        ],
        difficulties: [
          { id: 1, content: '孩子说“不知道”时，可以给两个选项让他选' },
          { id: 2, content: '不要评价孩子喜欢得对不对，重点是愿意表达' }
        ],
        examples: [
          {
            id: 1,
            title: '迁移示例',
            question: '你最喜欢哪一页？为什么？',
            answer: '我喜欢小花开出来那一页，因为颜色很好看。',
            analysis: '这句话清楚表达了选择和理由。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '下面哪句话更像完整表达？',
            options: ['好看', '我喜欢这一页，因为颜色很好看', '花', '不知道'],
            answer: 1,
            analysis: '完整表达最好包含“喜欢什么”和“为什么”。'
          }
        ]
      }
    };
    
    // 五大主题模拟数据
    var topicMockDetails = {
      'logical_thinking': {
        id: pointId,
        name: '形状配对游戏',
        status: 'learning',
        difficulty: 1,
        explain: {
          title: '活动讲解',
          content: '形状配对是培养逻辑思维的经典活动。\n\n【活动目标】\n- 理解形状与空间的对应关系\n- 培养观察力和配对能力\n- 建立基本的逻辑推理意识\n\n【活动步骤】\n1. 准备不同形状的积木或卡片\n2. 准备对应的形状孔洞板\n3. 示范如何将形状放入对应孔洞\n4. 让宝宝尝试配对\n5. 及时给予鼓励和引导\n\n【难度递进】\n- 0-6个月：触摸不同形状\n- 6-9个月：尝试放入\n- 9-12个月：基本配对成功'
        },
        keyPoints: [
          { id: 1, content: '认识基本形状（圆形、方形、三角形）' },
          { id: 2, content: '理解形状与空间的对应关系' },
          { id: 3, content: '培养观察力和手眼协调能力' }
        ],
        difficulties: [
          { id: 1, content: '初期可能需要手把手引导' },
          { id: 2, content: '不要急于纠正，让宝宝自己探索' }
        ],
        examples: [
          {
            id: 1,
            title: '示范示例',
            question: '如何将圆形积木放入圆形孔洞？',
            answer: '拿起圆形积木，对准圆形孔洞，轻轻放入',
            analysis: '这个活动帮助宝宝理解形状的对应关系，是逻辑思维的启蒙。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '以下哪个形状是圆形？',
            options: ['○', '□', '△', '☆'],
            answer: 0,
            analysis: '圆形是没有角的封闭曲线。'
          }
        ]
      },
      'reading_comprehension': readingDetails[pointId] || {
        id: pointId,
        name: pointName || '绘本分镜阅读',
        status: 'learning',
        difficulty: 2,
        visual: {
          icon: '📖',
          title: '能力成长',
          desc: '图文理解、关键词提取和口头复述'
        },
        explain: {
          title: '能力成长讲解',
          content: '分镜阅读是能力成长中的核心训练方式之一。\n\n【成长目标】\n- 理解故事主线和关键变化\n- 培养图文结合的信息提取能力\n- 提升口头复述与重点概括能力\n\n【任务步骤】\n1. 选择适合的绘本或短文材料\n2. 逐页观察画面或段落信息\n3. 引导孩子关注关键情节变化\n4. 用具体提问帮助理解\n5. 鼓励孩子复述重点内容\n\n【难度递进】\n- 入门级：找出主角与关键变化\n- 标准级：完成理解题并口头复述\n- 提升级：用一句话说出主要意思'
        },
        keyPoints: [
          { id: 1, content: '理解故事主线和情节发展' },
          { id: 2, content: '能够从图文中提取关键信息' },
          { id: 3, content: '培养口头复述能力' }
        ],
        difficulties: [
          { id: 1, content: '初期需要家长引导提问' },
          { id: 2, content: '复述时可能遗漏关键信息' }
        ],
        examples: [
          {
            id: 1,
            title: '理解示例',
            question: '《小种子》中，种子经历了哪些变化？',
            answer: '从落地、发芽、生长到开花',
            analysis: '理解故事的关键是抓住主角的变化过程。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '阅读理解的第一步是什么？',
            options: ['找主角', '看结局', '背课文', '写笔记'],
            answer: 0,
            analysis: '找到故事主角是理解故事的基础。'
          }
        ]
      },
      'expression_communication': {
        id: pointId,
        name: '单词表达鼓励',
        status: 'learning',
        difficulty: 1,
        explain: {
          title: '表达训练讲解',
          content: '鼓励宝宝尝试发音和表达是语言发展的关键。\n\n【训练目标】\n- 鼓励宝宝尝试发音\n- 积极回应宝宝的表达尝试\n- 扩展成完整词汇\n\n【训练步骤】\n1. 倾听宝宝尝试发音\n2. 积极回应（"哦，宝宝要球"）\n3. 扩展成完整词（"这是球，红色的球"）\n4. 不纠正发音，保护表达自信\n\n【语言发展里程碑】\n- 12-15个月：有意识叫爸妈\n- 16-18个月：会说5-10个词\n- 19-21个月：词汇爆发期\n- 22-24个月：两词组合'
        },
        keyPoints: [
          { id: 1, content: '积极回应宝宝的发音尝试' },
          { id: 2, content: '扩展词汇时语速放慢' },
          { id: 3, content: '不纠正发音，保护表达自信' }
        ],
        difficulties: [
          { id: 1, content: '需要耐心倾听宝宝的发音' },
          { id: 2, content: '扩展时不要给宝宝压力' }
        ],
        examples: [
          {
            id: 1,
            title: '回应示例',
            question: '宝宝说"球"，如何回应？',
            answer: '"哦，宝宝要球！这是球，红色的球"',
            analysis: '先回应需求，再扩展词汇，不要纠正发音。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '宝宝发音错误时应该？',
            options: ['立即纠正', '重复正确发音', '鼓励表达', '忽视不管'],
            answer: 2,
            analysis: '保护表达自信比纠正发音更重要。'
          }
        ]
      },
      'learning_metacognition': {
        id: pointId,
        name: '注意力训练',
        status: 'learning',
        difficulty: 2,
        explain: {
          title: '注意力训练讲解',
          content: '注意力是学习的基础能力，需要从小培养。\n\n【训练目标】\n- 提升持续注意力时间\n- 培养选择性注意能力\n- 建立专注习惯\n\n【训练步骤】\n1. 从短时间开始（3-5分钟）\n2. 选择宝宝感兴趣的活动\n3. 逐步延长专注时间\n4. 减少干扰因素\n5. 及时给予正向反馈\n\n【注意力发展】\n- 1-2岁：专注时间2-3分钟\n- 3-4岁：专注时间5-10分钟\n- 5-6岁：专注时间10-15分钟'
        },
        keyPoints: [
          { id: 1, content: '从宝宝感兴趣的活动开始' },
          { id: 2, content: '逐步延长专注时间' },
          { id: 3, content: '创造无干扰的学习环境' }
        ],
        difficulties: [
          { id: 1, content: '不要强迫宝宝专注' },
          { id: 2, content: '注意力时间因人而异' }
        ],
        examples: [
          {
            id: 1,
            title: '训练示例',
            question: '如何提升宝宝专注时间？',
            answer: '从3分钟开始，逐步增加到5分钟、10分钟',
            analysis: '注意力训练需要循序渐进，不能急于求成。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '注意力训练应该？',
            options: ['强迫长时间专注', '逐步延长', '随意中断', '不给予反馈'],
            answer: 1,
            analysis: '注意力训练要循序渐进。'
          }
        ]
      },
      'inquiry_creativity': {
        id: pointId,
        name: '观察与发现',
        status: 'learning',
        difficulty: 1,
        explain: {
          title: '探究能力训练讲解',
          content: '观察是探究的基础，好奇心是创造力的源泉。\n\n【训练目标】\n- 培养细致观察能力\n- 激发好奇心和探索欲\n- 鼓励提出问题\n\n【训练步骤】\n1. 带宝宝观察自然（植物、昆虫等）\n2. 引导注意细节变化\n3. 鼓励提出问题（"为什么？"）\n4. 一起寻找答案\n5. 记录发现\n\n【探究能力发展】\n- 观察：发现事物特征\n- 提问：产生好奇心\n- 假设：尝试解释\n- 验证：通过实验确认'
        },
        keyPoints: [
          { id: 1, content: '培养细致观察习惯' },
          { id: 2, content: '鼓励提出"为什么"问题' },
          { id: 3, content: '保护好奇心，不急于给答案' }
        ],
        difficulties: [
          { id: 1, content: '需要家长耐心引导' },
          { id: 2, content: '不要否定宝宝的"奇怪"问题' }
        ],
        examples: [
          {
            id: 1,
            title: '观察示例',
            question: '树叶为什么秋天会变黄？',
            answer: '因为温度降低，叶绿素减少',
            analysis: '通过观察自然现象，培养科学探究思维。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '探究能力的第一步是什么？',
            options: ['做实验', '观察', '写报告', '背答案'],
            answer: 1,
            analysis: '观察是探究的基础。'
          }
        ]
      }
    };
    
    if (topicMockDetails[subjectCode]) {
      return topicMockDetails[subjectCode];
    }
    
    // 兼容旧版学科数据
    if (subjectCode === 'chinese') {
      return {
        id: pointId,
        name: '生字学习：春、夏、秋、冬',
        status: 'learning',
        difficulty: 1,
        explain: {
          title: '知识点讲解',
          content: '春、夏、秋、冬是一年四季的名称，每个字都代表着不同的季节特点。\n\n【春】chūn\n- 笔画：9画\n- 部首：日\n- 组词：春天、春风、春色\n- 造句：春天来了，小草发芽了。\n\n【夏】xià\n- 笔画：10画\n- 部首：夂\n- 组词：夏天、夏季、盛夏\n- 造句：夏天的太阳很热。\n\n【秋】qiū\n- 笔画：9画\n- 部首：禾\n- 组词：秋天、秋叶、金秋\n- 造句：秋天的树叶变黄了。\n\n【冬】dōng\n- 笔画：5画\n- 部首：夂\n- 组词：冬天、冬季、寒冬\n- 造句：冬天下雪了，好漂亮！'
        },
        keyPoints: [
          { id: 1, content: '认识"春、夏、秋、冬"四个生字，会读会写' },
          { id: 2, content: '了解每个字的笔画顺序和部首' },
          { id: 3, content: '能够用这四个字组词造句' },
          { id: 4, content: '理解四季的含义和特点' }
        ],
        difficulties: [
          { id: 1, content: '"春"字的撇捺要舒展，"日"部要写得紧凑' },
          { id: 2, content: '"夏"字下半部分容易写错，注意笔顺' },
          { id: 3, content: '"秋"字左边是"禾"，右边是"火"' }
        ],
        examples: [
          {
            id: 1,
            title: '例题1：看拼音写汉字',
            question: 'chūn tiān lái le，xiǎo cǎo fā yá le。',
            answer: '春天来了，小草发芽了。',
            analysis: '这道题考查"春"字的书写。注意"春"字上面是三横加一撇一捺，下面是"日"。'
          },
          {
            id: 2,
            title: '例题2：组词',
            question: '请用"秋"字组三个词。',
            answer: '秋天、秋叶、金秋（答案不唯一）',
            analysis: '"秋"字与秋季相关，可以组成很多词语，如秋天、秋叶、秋千、金秋等。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '"春"字的部首是什么？',
            options: ['日', '木', '禾', '夂'],
            answer: 0,
            analysis: '"春"字的部首是"日"，表示与太阳、时间有关。'
          },
          {
            id: 2,
            type: 'choice',
            question: '下列哪个词语是正确的？',
            options: ['夏天', '夏大', '夏太', '夏犬'],
            answer: 0,
            analysis: '"夏天"是正确的词语，表示夏季。'
          },
          {
            id: 3,
            type: 'fill',
            question: '秋天的树叶变___了。',
            answer: '黄',
            analysis: '秋天的树叶会变黄，这是秋季的特点。'
          },
          {
            id: 4,
            type: 'choice',
            question: '"冬"字一共有几画？',
            options: ['3画', '4画', '5画', '6画'],
            answer: 2,
            analysis: '"冬"字一共有5画：撇、横撇、捺、点、点。'
          },
          {
            id: 5,
            type: 'fill',
            question: '一年有春、夏、秋、___四个季节。',
            answer: '冬',
            analysis: '一年有四个季节：春、夏、秋、冬。'
          }
        ]
      };
    } else if (subjectCode === 'math') {
      return {
        id: pointId,
        name: '10以内加减法',
        status: 'mastered',
        difficulty: 2,
        explain: {
          title: '知识点讲解',
          content: '10以内加减法是数学学习的基础，需要熟练掌握。\n\n【加法】\n把两个数合在一起，求一共有多少，用加法计算。\n例如：3 + 2 = 5\n读作：三加二等于五\n\n【减法】\n从一个数里去掉一部分，求还剩多少，用减法计算。\n例如：5 - 2 = 3\n读作：五减二等于三\n\n【计算技巧】\n1. 数手指法：用手指帮助计算\n2. 凑十法：先凑成10再计算\n3. 破十法：用于减法计算'
        },
        keyPoints: [
          { id: 1, content: '理解加法和减法的含义' },
          { id: 2, content: '熟练掌握10以内加减法' },
          { id: 3, content: '能够解决简单的实际问题' }
        ],
        difficulties: [
          { id: 1, content: '理解加减法的逆运算关系' },
          { id: 2, content: '提高计算速度和准确率' }
        ],
        examples: [
          {
            id: 1,
            title: '例题1：计算',
            question: '3 + 5 = ?',
            answer: '3 + 5 = 8',
            analysis: '可以用数手指的方法：先伸出3个手指，再伸出5个手指，数一数一共有8个手指。'
          },
          {
            id: 2,
            title: '例题2：应用题',
            question: '小明有5个苹果，吃了2个，还剩几个？',
            answer: '5 - 2 = 3（个）',
            analysis: '这是一道减法题。原来有5个，吃了2个，求还剩多少，用减法计算。'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '4 + 3 = ?',
            options: ['6', '7', '8', '9'],
            answer: 1,
            analysis: '4 + 3 = 7，可以用数手指的方法计算。'
          },
          {
            id: 2,
            type: 'choice',
            question: '8 - 5 = ?',
            options: ['2', '3', '4', '5'],
            answer: 1,
            analysis: '8 - 5 = 3，从8里面去掉5，还剩3。'
          },
          {
            id: 3,
            type: 'fill',
            question: '6 + ___ = 10',
            answer: '4',
            analysis: '6 + 4 = 10，这是凑十法的应用。'
          },
          {
            id: 4,
            type: 'choice',
            question: '10 - 7 = ?',
            options: ['2', '3', '4', '5'],
            answer: 1,
            analysis: '10 - 7 = 3，可以用破十法计算。'
          },
          {
            id: 5,
            type: 'fill',
            question: '2 + 3 + 4 = ___',
            answer: '9',
            analysis: '2 + 3 + 4 = 9，可以分步计算：2 + 3 = 5，5 + 4 = 9。'
          }
        ]
      };
    } else {
      return {
        id: pointId,
        name: that.data.pointName || '知识点',
        status: 'learning',
        difficulty: 2,
        explain: {
          title: '知识点讲解',
          content: '这是知识点的详细讲解内容。'
        },
        keyPoints: [
          { id: 1, content: '重点内容1' },
          { id: 2, content: '重点内容2' }
        ],
        difficulties: [
          { id: 1, content: '难点内容1' }
        ],
        examples: [
          {
            id: 1,
            title: '例题1',
            question: '这是例题问题',
            answer: '这是答案',
            analysis: '这是解析'
          }
        ],
        practices: [
          {
            id: 1,
            type: 'choice',
            question: '这是选择题？',
            options: ['选项A', '选项B', '选项C', '选项D'],
            answer: 0,
            analysis: '这是解析'
          }
        ]
      };
    }
  },

  // 切换标签页
  switchTab: function(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({
      currentTab: tab
    });
  },

  toggleChecklistItem: function(e) {
    var index = Number(e.currentTarget.dataset.index || 0);
    var stepChecklist = (this.data.stepChecklist || []).slice();
    if (!stepChecklist[index]) {
      return;
    }
    stepChecklist[index].done = !stepChecklist[index].done;
    this.setData({
      stepChecklist: stepChecklist
    });
    this.persistStepChecklist();
  },

  copyParentPrompt: function() {
    var prompt = (this.data.knowledgeDetail && this.data.knowledgeDetail.parent_prompt) || '';
    if (!prompt) {
      wx.showToast({ title: '当前没有家长提问', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: prompt,
      success: function() {
        wx.showToast({ title: '提问话术已复制', icon: 'none' });
      }
    });
  },

  copySessionPlan: function() {
    var detail = this.data.knowledgeDetail || {};
    var lines = [
      '今日能力成长带练卡',
      `任务：${detail.title || detail.name || '能力成长任务'}`,
      `目标：${detail.objective || '带孩子完成一次短时互动'}`,
      `材料：${detail.material || '准备当日阅读或生活场景材料'}`,
      `提问：${detail.parent_prompt || '围绕谁、做什么、为什么追问'}`,
      `时长：约${detail.duration || 10}分钟`
    ];
    wx.setClipboardData({
      data: lines.join('\n'),
      success: function() {
        wx.showToast({ title: '带练卡已复制', icon: 'none' });
      }
    });
  },

  goPracticeTab: function() {
    this.setData({
      currentTab: 'practice'
    });
  },

  resetPractice: function() {
    this.setData({
      practiceAnswers: {},
      currentPracticeIndex: 0,
      showPracticeResult: false,
      practiceResult: null
    });
    wx.showToast({ title: '已重置练习', icon: 'none' });
  },

  // 笔记输入
  onNoteInput: function(e) {
    this.setData({
      noteContent: e.detail.value
    });
  },

  // 保存笔记
  saveNote: function() {
    var that = this;
    var noteContent = that.data.noteContent;
    
    if (!noteContent.trim()) {
      wx.showToast({
        title: '请输入笔记内容',
        icon: 'none'
      });
      return;
    }

    // 保存到本地
    var notes = wx.getStorageSync('knowledgeNotes') || {};
    notes[that.data.pointId] = {
      content: noteContent,
      updateTime: new Date().getTime()
    };
    wx.setStorageSync('knowledgeNotes', notes);

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
  },

  // 选择练习答案
  selectAnswer: function(e) {
    var that = this;
    var practiceIndex = that.data.currentPracticeIndex;
    var optionIndex = e.currentTarget.dataset.index;
    var practiceAnswers = that.data.practiceAnswers;
    
    practiceAnswers[practiceIndex] = optionIndex;
    
    that.setData({
      practiceAnswers: practiceAnswers
    });
  },

  // 填空题输入
  onFillInput: function(e) {
    var that = this;
    var practiceIndex = that.data.currentPracticeIndex;
    var value = e.detail.value;
    var practiceAnswers = that.data.practiceAnswers;
    
    practiceAnswers[practiceIndex] = value;
    
    that.setData({
      practiceAnswers: practiceAnswers
    });
  },

  // 上一题
  prevPractice: function() {
    var that = this;
    var currentIndex = that.data.currentPracticeIndex;
    
    if (currentIndex > 0) {
      that.setData({
        currentPracticeIndex: currentIndex - 1
      });
    }
  },

  // 下一题
  nextPractice: function() {
    var that = this;
    var currentIndex = that.data.currentPracticeIndex;
    var practices = that.data.knowledgeDetail.practices;
    
    if (currentIndex < practices.length - 1) {
      that.setData({
        currentPracticeIndex: currentIndex + 1
      });
    }
  },

  // 提交练习
  submitPractice: function() {
    var that = this;
    var practices = that.data.knowledgeDetail.practices;
    var answers = that.data.practiceAnswers;
    
    var correctCount = 0;
    var results = [];
    
    practices.forEach(function(practice, index) {
      var userAnswer = answers[index];
      var isCorrect = false;
      
      if (practice.type === 'choice') {
        isCorrect = userAnswer === practice.answer;
      } else if (practice.type === 'fill') {
        var expectedAnswer = String(practice.answer || '').trim();
        var actualAnswer = String(userAnswer || '').trim();
        isCorrect = expectedAnswer ? actualAnswer === expectedAnswer : !!actualAnswer;
      }
      
      if (isCorrect) {
        correctCount++;
      }
      
      results.push({
        questionIndex: index,
        isCorrect: isCorrect,
        userAnswer: userAnswer
      });
    });
    
    var score = Math.round((correctCount / practices.length) * 100);
    
    // 上报输出事件
    app.trackKbEvent({
      event_type: 'output_submit',
      task_id: that.data.pointId,
      score: score / 100,
      event_meta: {
        type: 'practice',
        total: practices.length,
        correct: correctCount
      }
    });

    that.setData({
      showPracticeResult: true,
      practiceResult: {
        total: practices.length,
        correct: correctCount,
        score: score,
        results: results
      }
    });
  },

  // 关闭练习结果
  closePracticeResult: function() {
    this.setData({
      showPracticeResult: false,
      practiceResult: null,
      practiceAnswers: {},
      currentPracticeIndex: 0
    });
  },

  // 显示掌握确认弹窗
  showMasterConfirm: function() {
    this.setData({
      showMasterModal: true
    });
  },

  // 隐藏掌握确认弹窗
  hideMasterModal: function() {
    this.setData({
      showMasterModal: false
    });
  },

  // 确认掌握
  confirmMaster: function() {
    var that = this;
    if (that._confirmMasterPending) {
      return;
    }
    var currentChild = app.getCurrentChild();

    if (!currentChild || !currentChild.id) {
      wx.showToast({
        title: '请先添加孩子档案',
        icon: 'none'
      });
      that.setData({
        showMasterModal: false
      });
      return;
    }
    that._confirmMasterPending = true;
    
    app.requireLoginForAction().then(function(canOperate) {
      if (!canOperate) {
        that.setData({
          showMasterModal: false
        });
        return;
      }

      return app.request({
      url: '/education/progress',
      method: 'POST',
      data: {
        child_id: currentChild.id,
        knowledge_point_id: String(that.data.pointId),
        status: 'mastered',
        mastery_level: 100
      }
    }).then(function(res) {
      wx.showToast({
        title: '已标记为掌握',
        icon: 'success'
      });
      
      // 更新状态
      var knowledgeDetail = that.data.knowledgeDetail;
      knowledgeDetail.status = 'mastered';
      that.setData({
        knowledgeDetail: knowledgeDetail,
        showMasterModal: false
      });
    }).catch(function(err) {
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
      that.setData({
        showMasterModal: false
      });
    });
    }).finally(function() {
      that._confirmMasterPending = false;
    });
  },

  // 阻止事件冒泡
  preventBubble: function() {
    // 空函数
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    var that = this;
    that.loadKnowledgeDetail(true);
  },

  // 分享
  onShareAppMessage: function() {
    var that = this;
    return {
      title: that.data.pointName + ' - 知识点学习',
      path: '/pages/textbook/knowledge-detail/knowledge-detail?pointId=' + that.data.pointId + '&subjectCode=' + that.data.subjectCode + '&pointName=' + encodeURIComponent(that.data.pointName)
    };
  }
});
