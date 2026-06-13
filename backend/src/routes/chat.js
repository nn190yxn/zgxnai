// AI问答服务 - 智能提示词与多轮对话
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { getAIStatus, generateAIAnswer } = require('../services/ai');

// 系统提示词配置
const SYSTEM_PROMPTS = {
  // 通用育儿专家角色
  expert: `你是"小牛育儿AI助理"，一位拥有10年经验的儿童教育专家。
你的回答风格：专业、温和、可执行（actionable）。

回答结构：
1. 先共情：理解家长的焦虑和困惑
2. 给判断：基于儿童发展规律给出判断
3. 给方案：提供具体、可操作的步骤（不超过3步）
4. 给预期：告诉家长坚持多久能看到效果
5. 给底线：什么情况需要就医或咨询专业人士

回答原则：
- 不制造焦虑，也不轻描淡写
- 每个建议都要有理论依据（可引用发展心理学理论）
- 涉及医疗问题时，必须建议咨询专业医生`,

  // 评估解读专家
  assessment: `你是儿童发展评估专家，擅长解读各类儿童发展评估量表。
你的回答风格：严谨、专业、有温度。

解读结构：
1. 结果概述：简明扼要说明评估结果
2. 维度分析：逐维度解读得分含义
3. 行为表现：描述在日常生活中可能的表现
4. 家庭建议：提供具体可操作的训练方案
5. 专业建议：什么情况下需要寻求专业帮助

解读原则：
- 避免贴标签，强调发展性
- 每个建议都要有理论依据
- 强调家庭观察的重要性`,

  // 能力成长支持专家
  reading: `你是儿童能力成长支持专家，擅长0-12岁儿童在阅读理解、表达沟通、逻辑思维与学习习惯方面的家庭支持方案设计。
你的回答风格：专业、系统、可操作。

方案结构：
1. 能力诊断：分析当前能力发展状态
2. 目标设定：设定合理的阶段性目标
3. 训练计划：提供具体的训练步骤
4. 评估方法：如何评估训练效果
5. 进阶路径：下一步如何提升

方案原则：
- 循序渐进，不揠苗助长
- 强调亲子共读的重要性
- 结合年龄特点设计活动
- 同时关注家庭场景中的表达、专注、思考和复盘`,

  // 情绪管理专家
  emotion: `你是儿童情绪管理专家，擅长帮助家长引导孩子情绪健康发展。
你的回答风格：温和、理解、可操作。

指导结构：
1. 情绪识别：帮助孩子认识情绪
2. 情绪表达：引导孩子健康表达情绪
3. 情绪调节：教孩子调节情绪的方法
4. 家庭支持：家长如何提供支持
5. 专业建议：什么情况下需要专业帮助

指导原则：
- 接纳所有情绪，引导健康表达
- 以身作则，家长先管理好自己的情绪
- 强调安全感和依恋关系的重要性`
};

// 获取用户会话上下文
function getSessionContext(sessionId) {
  const messages = db.prepare(`
    SELECT * FROM chat_messages 
    WHERE session_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(sessionId);
  
  return messages.reverse();
}

// 分析用户意图
function analyzeIntent(message) {
  const lowerMsg = message.toLowerCase();
  
  // 评估相关
  if (lowerMsg.includes('评估') || lowerMsg.includes('测评') || lowerMsg.includes('测试')) {
    return { intent: 'assessment', confidence: 0.9 };
  }
  
  // 能力成长中的阅读相关
  if (lowerMsg.includes('阅读') || lowerMsg.includes('绘本') || lowerMsg.includes('识字')) {
    return { intent: 'reading', confidence: 0.85 };
  }
  
  // 情绪相关
  if (lowerMsg.includes('情绪') || lowerMsg.includes('脾气') || lowerMsg.includes('哭闹')) {
    return { intent: 'emotion', confidence: 0.9 };
  }
  
  // 专注力相关
  if (lowerMsg.includes('专注') || lowerMsg.includes('注意力') || lowerMsg.includes('走神')) {
    return { intent: 'focus', confidence: 0.85 };
  }
  
  // 感统相关
  if (lowerMsg.includes('感统') || lowerMsg.includes('感觉统合') || lowerMsg.includes('前庭')) {
    return { intent: 'sensory', confidence: 0.9 };
  }
  
  // 营养相关
  if (lowerMsg.includes('营养') || lowerMsg.includes('吃饭') || lowerMsg.includes('挑食')) {
    return { intent: 'nutrition', confidence: 0.8 };
  }
  
  // 食谱相关
  if (lowerMsg.includes('食谱') || lowerMsg.includes('菜谱') || lowerMsg.includes('做什么吃') || lowerMsg.includes('吃什么') || lowerMsg.includes('早餐') || lowerMsg.includes('午餐') || lowerMsg.includes('晚餐') || lowerMsg.includes('零食')) {
    return { intent: 'recipes', confidence: 0.85 };
  }
  
  // 绘本相关
  if (lowerMsg.includes('绘本') || lowerMsg.includes('故事书') || lowerMsg.includes('童书') || lowerMsg.includes('图画书')) {
    return { intent: 'books', confidence: 0.85 };
  }
  
  // 精细运动相关
  if (lowerMsg.includes('精细运动') || lowerMsg.includes('手眼协调') || lowerMsg.includes('握笔') || lowerMsg.includes('剪纸') || lowerMsg.includes('串珠')) {
    return { intent: 'motor', confidence: 0.85 };
  }
  
  // 认知相关
  if (lowerMsg.includes('认知') || lowerMsg.includes('颜色') || lowerMsg.includes('形状') || lowerMsg.includes('分类') || lowerMsg.includes('排序')) {
    return { intent: 'cognition', confidence: 0.85 };
  }
  
  // 数学相关
  if (lowerMsg.includes('数学') || lowerMsg.includes('数数') || lowerMsg.includes('计算') || lowerMsg.includes('加减') || lowerMsg.includes('数字')) {
    return { intent: 'math', confidence: 0.85 };
  }
  
  // 科学相关
  if (lowerMsg.includes('科学') || lowerMsg.includes('实验') || lowerMsg.includes('自然') || lowerMsg.includes('探索') || lowerMsg.includes('观察')) {
    return { intent: 'science', confidence: 0.85 };
  }
  
  // 艺术相关
  if (lowerMsg.includes('艺术') || lowerMsg.includes('音乐') || lowerMsg.includes('画画') || lowerMsg.includes('手工') || lowerMsg.includes('舞蹈')) {
    return { intent: 'art', confidence: 0.85 };
  }
  
  // 如厕相关
  if (lowerMsg.includes('如厕') || lowerMsg.includes('尿不湿') || lowerMsg.includes('尿床') || lowerMsg.includes('大小便') || lowerMsg.includes('马桶')) {
    return { intent: 'potty', confidence: 0.85 };
  }
  
  // 分离焦虑相关
  if (lowerMsg.includes('分离') || lowerMsg.includes('入园') || lowerMsg.includes('上学') || lowerMsg.includes('适应') || lowerMsg.includes('离不开')) {
    return { intent: 'separation', confidence: 0.8 };
  }
  
  // 安全相关
  if (lowerMsg.includes('安全') || lowerMsg.includes('危险') || lowerMsg.includes('防护') || lowerMsg.includes('意外')) {
    return { intent: 'safety', confidence: 0.85 };
  }
  
  // 游戏相关
  if (lowerMsg.includes('游戏') || lowerMsg.includes('玩') || lowerMsg.includes('活动')) {
    return { intent: 'games', confidence: 0.7 };
  }
  
  return { intent: 'general', confidence: 0.6 };
}

// 基于意图选择提示词
function selectPrompt(intent) {
  switch (intent) {
    case 'assessment':
      return SYSTEM_PROMPTS.assessment;
    case 'reading':
      return SYSTEM_PROMPTS.reading;
    case 'emotion':
      return SYSTEM_PROMPTS.emotion;
    case 'focus':
    case 'sensory':
      return SYSTEM_PROMPTS.assessment;
    default:
      return SYSTEM_PROMPTS.expert;
  }
}

// 检索知识库（增强版）
function searchKnowledgeBase(query, intent) {
  const keywords = query.split(/\s+/).filter(w => w.length > 1);
  const searchTerm = `%${keywords.join('%')}%`;
  
  // 根据意图优化搜索
  let categoryFilter = '';
  switch (intent) {
    case 'assessment':
      categoryFilter = "AND (category LIKE '%assessment%' OR category LIKE '%milestone%')";
      break;
    case 'reading':
      categoryFilter = "AND (category LIKE '%reading%' OR category LIKE '%literacy%')";
      break;
    case 'emotion':
      categoryFilter = "AND (category LIKE '%emotion%' OR category LIKE '%social%')";
      break;
    case 'focus':
      categoryFilter = "AND (category LIKE '%attention%' OR category LIKE '%executive%')";
      break;
    case 'sensory':
      categoryFilter = "AND (category LIKE '%sensory%' OR category LIKE '%motor%')";
      break;
    case 'nutrition':
      categoryFilter = "AND (category LIKE '%nutrition%' OR category LIKE '%feeding%')";
      break;
    case 'recipes':
      categoryFilter = "AND category LIKE '%recipes%'";
      break;
    case 'books':
      categoryFilter = "AND (category LIKE '%books%' OR category LIKE '%reading%')";
      break;
    case 'motor':
      categoryFilter = "AND (category LIKE '%motor%' OR category LIKE '%sensory%')";
      break;
    case 'cognition':
      categoryFilter = "AND (category LIKE '%cognition%' OR category LIKE '%attention%')";
      break;
    case 'math':
      categoryFilter = "AND (category LIKE '%math%' OR category LIKE '%cognition%')";
      break;
    case 'science':
      categoryFilter = "AND (category LIKE '%science%' OR category LIKE '%nature%')";
      break;
    case 'art':
      categoryFilter = "AND (category LIKE '%art%' OR category LIKE '%music%')";
      break;
    case 'potty':
      categoryFilter = "AND (category LIKE '%potty%' OR category LIKE '%training%')";
      break;
    case 'separation':
      categoryFilter = "AND (category LIKE '%separation%' OR category LIKE '%anxiety%')";
      break;
    case 'safety':
      categoryFilter = "AND category LIKE '%safety%'";
      break;
    case 'games':
      categoryFilter = "AND category LIKE '%games%'";
      break;
  }
  
  const results = db.prepare(`
    SELECT * FROM knowledge_base 
    WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)
    ${categoryFilter}
    ORDER BY 
      CASE 
        WHEN title LIKE ? THEN 1 
        WHEN content LIKE ? THEN 2 
        ELSE 3 
      END
    LIMIT 5
  `).all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  
  return results;
}

function buildPrompt(message, intent, knowledgeItems, context) {
  // 构建上下文
  let contextStr = '';
  if (context && context.length > 0) {
    contextStr = '之前的对话：\n';
    context.forEach(msg => {
      const role = msg.role === 'user' ? '家长' : '专家';
      contextStr += `${role}: ${msg.content}\n`;
    });
    contextStr += '\n';
  }
  
  // 构建知识库引用
  let knowledgeStr = '';
  if (knowledgeItems.length > 0) {
    knowledgeStr = '参考知识库：\n';
    knowledgeItems.forEach((item, index) => {
      knowledgeStr += `${index + 1}. ${item.title}\n${item.content.substring(0, 200)}...\n\n`;
    });
  }
  
  // 获取提示词
  const prompt = selectPrompt(intent);
  
  return `${prompt}

${contextStr}${knowledgeStr}

当前问题：${message}

请基于以上信息和你的专业知识，给出专业、具体、可操作的回答。`;
}

// 生成专业回答
async function generateProfessionalAnswer(message, intent, knowledgeItems, context) {
  const fullPrompt = buildPrompt(message, intent, knowledgeItems, context);
  const aiResult = await generateAIAnswer(fullPrompt, { message, intent, knowledgeItems, context });

  if (aiResult.success) {
    return {
      answer: aiResult.answer,
      answer_source: 'ai',
      ai_status: getAIStatus()
    };
  }

  return {
    answer: generateMockAnswer(message, intent, knowledgeItems),
    answer_source: 'knowledge_fallback',
    ai_status: getAIStatus(),
    fallback_reason: aiResult.code
  };
}

// 模拟回答生成（实际应替换为真实AI服务）
function generateMockAnswer(message, intent, knowledgeItems) {
  const lowerMsg = message.toLowerCase();
  
  // 根据意图和关键词生成回答
  if (lowerMsg.includes('前庭觉') || lowerMsg.includes('感统')) {
    return `感谢您的提问！关于前庭觉训练，我为您提供以下专业建议：

**一、前庭觉发展特点**
前庭觉是人体最重要的感觉系统之一，主要负责平衡、空间定向和运动感知。3-6岁是前庭觉发展的关键期。

**二、家庭训练方案**
1. **秋千游戏**：每天10-15分钟，前后摆动，逐渐加速
2. **平衡木训练**：在地面贴胶带模拟平衡木，从走直线开始
3. **旋转游戏**：原地旋转5圈，停下后保持平衡
4. **蹦床活动**：在小蹦床上跳跃，增强前庭刺激

**三、注意事项**
- 饭后1小时内避免剧烈前庭刺激
- 从低强度开始，逐步增加难度
- 观察孩子的反应，如有不适立即停止

**四、预期效果**
坚持4-6周，孩子的平衡能力、空间感知能力会有明显提升。

**五、专业建议**
如果孩子出现严重的平衡障碍、频繁跌倒或对新环境极度敏感，建议咨询儿童保健科或康复治疗师。`;
  }
  
  if (lowerMsg.includes('专注') || lowerMsg.includes('注意力')) {
    return `感谢您的提问！关于孩子专注力问题，我为您提供以下专业建议：

**一、专注力发展规律**
3-4岁孩子专注力持续时间约5-10分钟，5-6岁约10-15分钟。不同年龄有不同的专注力标准。

**二、家庭训练方案**
1. **番茄工作法（儿童版）**：从5分钟开始，逐步延长到15分钟
2. **减少干扰**：学习环境简洁，玩具收起来，电视关掉
3. **任务分解**：大任务拆成小步骤，每完成一步给予鼓励
4. **兴趣引导**：从孩子感兴趣的活动开始培养专注力

**三、日常习惯培养**
- 固定作息时间，建立生物钟
- 一次只做一件事，培养单任务习惯
- 避免过度刺激，控制电子屏幕时间

**四、预期效果**
坚持2-3个月，孩子的专注力会有明显改善。

**五、专业建议**
如果孩子专注力问题严重影响学习和生活，建议咨询儿童心理科或发育行为科。`;
  }
  
  if (lowerMsg.includes('早餐') || lowerMsg.includes('午餐') || lowerMsg.includes('晚餐') || lowerMsg.includes('食谱') || lowerMsg.includes('吃什么')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、营养搭配原则**
1. 蛋白质+碳水化合物+蔬菜+水果
2. 粗细粮搭配，营养更均衡
3. 色彩丰富，增加食欲
4. 易于消化，不油腻

**二、推荐食谱**
1. **鸡蛋蔬菜粥**：大米+鸡蛋+胡萝卜+青菜
   - 做法：大米煮粥，加入打散的鸡蛋，最后放入切碎的胡萝卜和青菜
   - 营养：蛋白质+碳水化合物+维生素

2. **全麦面包+牛奶+香蕉**
   - 全麦面包提供优质碳水化合物
   - 牛奶补充钙质和蛋白质
   - 香蕉提供钾和维生素

3. **鸡蛋饼+豆浆+苹果**
   - 鸡蛋饼：面粉+鸡蛋+葱花
   - 豆浆：优质植物蛋白
   - 苹果：维生素C和膳食纤维

**三、注意事项**
- 早餐时间：7:00-8:00最佳
- 进食时间：15-20分钟
- 避免过甜、过咸、油腻
- 每天变换花样，保持新鲜感

**四、专业建议**
如需更详细的食谱推荐，请提供孩子的年龄、口味偏好、过敏情况等信息。`;
  }
  
  if (lowerMsg.includes('绘本') || lowerMsg.includes('故事书') || lowerMsg.includes('童书')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下推荐：

**一、情绪管理类绘本**
1. 《我的情绪小怪兽》
   - 适合年龄：2-5岁
   - 内容：用颜色代表不同情绪
   - 教育价值：帮助孩子认识、区分情绪

2. 《菲菲生气了》
   - 适合年龄：3-6岁
   - 内容：小女孩菲菲从生气到平静的过程
   - 教育价值：理解愤怒情绪，学习情绪调节

3. 《生气汤》
   - 适合年龄：3-6岁
   - 内容：妈妈用煮"生气汤"帮助孩子释放情绪
   - 教育价值：用有趣的方式处理愤怒

**二、社交能力类绘本**
1. 《分享》
   - 适合年龄：3-5岁
   - 内容：小动物们学会分享的故事
   - 教育价值：理解分享的意义

2. 《大家一起玩》
   - 适合年龄：3-6岁
   - 内容：孩子们合作完成游戏
   - 教育价值：学习团队合作

**三、科普认知类绘本**
1. 《好饿的毛毛虫》
   - 适合年龄：2-5岁
   - 内容：毛毛虫变蝴蝶的故事
   - 教育价值：生命周期、数字认知、食物认知

2. 《猜猜我是谁》系列
   - 适合年龄：1-4岁
   - 内容：洞洞书，认识动物
   - 教育价值：动物特征、观察力

**四、亲子共读建议**
- 选择适合孩子年龄的绘本
- 结合孩子当前的情绪状态
- 读完讨论："你觉得他为什么生气？"
- 延伸活动：画情绪脸谱`;
  }
  
  if (lowerMsg.includes('情绪') || lowerMsg.includes('脾气')) {
    return `感谢您的提问！关于孩子情绪管理，我为您提供以下专业建议：

**一、情绪发展规律**
3-6岁是孩子情绪发展的关键期，这个阶段孩子正在学习识别、表达和调节情绪。

**二、家庭引导方案**
1. **命名情绪**：帮助孩子认识"生气""难过""开心"等基本情绪
2. **接纳感受**：告诉孩子"生气是可以的，但打人不行"
3. **提供替代方案**：教孩子在情绪激动时深呼吸、数数或去冷静角
4. **情绪日记**：鼓励孩子画出今天的情绪变化

**三、家长自我调整**
- 以身作则，家长先管理好自己的情绪
- 保持耐心，情绪管理是一个长期过程
- 建立安全依恋关系，让孩子感受到无条件的爱

**四、预期效果**
坚持1-2个月，孩子的情绪表达会更加健康，情绪调节能力会明显提升。

**五、专业建议**
如果孩子情绪问题持续严重，影响日常生活和社交，建议咨询儿童心理科。`;
  }

  if (lowerMsg.includes('精细运动') || lowerMsg.includes('手眼协调') || lowerMsg.includes('握笔') || lowerMsg.includes('剪纸')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、精细运动发展规律**
3-4岁：能握笔画直线、圆形，能使用剪刀剪直线，能穿大珠子
4-5岁：能握笔画复杂图形，能使用剪刀剪曲线，能系扣子、拉拉链
5-6岁：能写简单汉字，能系鞋带，能使用工具

**二、训练方法**
1. **涂鸦绘画**：蜡笔、水彩笔、手指画颜料，自由涂鸦、描红、涂色
2. **剪纸手工**：安全剪刀、彩纸，剪直线、曲线、形状
3. **串珠活动**：大珠子、线、穿线板，穿珠子、穿线板
4. **搭积木**：乐高、积木、磁力片，搭建、创意拼搭
5. **日常生活技能**：系扣子、拉拉链、系鞋带、使用筷子

**三、注意事项**
- 从易到难，循序渐进
- 每次15-20分钟
- 结合兴趣，保持趣味性
- 避免过早进行精细书写训练`;
  }

  if (lowerMsg.includes('数学') || lowerMsg.includes('数数') || lowerMsg.includes('计算')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、数学启蒙原则**
- 重在理解，而非记忆
- 从具体到抽象
- 允许试错，鼓励思考
- 不超前学习，循序渐进

**二、启蒙方法**
1. **生活化数学**
   - 数楼梯、数水果
   - 分餐具、分糖果
   - 比较大小、多少
   - 认识时间、日历

2. **游戏化数学**
   - 数学桌游
   - 积木、拼图
   - 数学绘本
   - 数学儿歌

3. **动手操作**
   - 数数棒、计数器
   - 几何积木
   - 天平、尺子
   - 钟表模型

**三、注意事项**
- 不强迫，不比较
- 结合兴趣，游戏化
- 每天15-20分钟
- 重在过程，不追求结果`;
  }

  if (lowerMsg.includes('科学') || lowerMsg.includes('实验') || lowerMsg.includes('自然')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、科学启蒙原则**
- 安全第一，成人监督
- 鼓励提问："你觉得为什么？"
- 记录观察日记
- 失败也是学习

**二、实验活动**
1. **植物观察**
   - 种子发芽实验
   - 植物生长记录
   - 叶子分类（形状、颜色）
   - 季节变化观察

2. **物理现象**
   - 浮沉实验
   - 磁性实验
   - 光影实验
   - 声音实验

3. **化学变化**
   - 溶解实验
   - 发酵实验
   - 变色实验

**三、注意事项**
- 安全第一，成人监督
- 鼓励提问
- 记录观察日记
- 失败也是学习`;
  }

  if (lowerMsg.includes('艺术') || lowerMsg.includes('音乐') || lowerMsg.includes('画画')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、艺术启蒙原则**
- 鼓励自由表达
- 不追求完美
- 过程重于结果
- 尊重孩子的创意

**二、活动建议**
1. **音乐启蒙**
   - 听音乐、唱歌
   - 节奏游戏
   - 简单乐器
   - 音乐剧表演

2. **美术启蒙**
   - 涂鸦、绘画
   - 手工制作
   - 拼贴艺术
   - 立体创作

3. **舞蹈律动**
   - 随音乐律动
   - 模仿动作
   - 创编舞蹈
   - 角色扮演

**三、注意事项**
- 不强迫，不比较
- 提供丰富材料
- 尊重孩子的创意
- 重在过程，不追求结果`;
  }

  if (lowerMsg.includes('如厕') || lowerMsg.includes('尿不湿') || lowerMsg.includes('大小便')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、准备信号**
- 尿布能保持2小时以上干燥
- 排便时间规律
- 能表达排便需求
- 对马桶感兴趣

**二、训练方法**
1. **选择合适时机**
   - 天气温暖时
   - 孩子情绪稳定时
   - 避免重大变化期

2. **准备如厕工具**
   - 儿童专用马桶或马桶圈
   - 踩脚凳
   - 有趣的绘本或玩具

3. **建立如厕 routine**
   - 定时提醒（每2小时）
   - 饭后、起床后、睡前提醒
   - 观察信号，及时提醒

4. **正向激励**
   - 及时表扬成功
   - 奖励贴纸、小零食
   - 不批评失败

**三、注意事项**
- 不强迫，不批评
- 每个孩子的节奏不同
- 夜间训练比白天晚
- 如有异常，咨询医生`;
  }

  if (lowerMsg.includes('分离') || lowerMsg.includes('入园') || lowerMsg.includes('适应')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、焦虑表现**
- 哭闹、粘人
- 拒绝上学、分离
- 睡眠问题（入睡困难、夜醒）
- 食欲下降

**二、应对策略**
1. **建立安全感**
   - 高质量的亲子陪伴
   - 建立规律的作息
   - 创造安全的家庭环境
   - 建立稳定的依恋关系

2. **告别仪式**
   - 固定的告别方式（拥抱、亲吻、说再见）
   - 简短明确的告别
   - 不偷偷溜走
   - 遵守承诺，按时回来

3. **渐进分离**
   - 从短时间分离开始
   - 逐渐增加分离时间
   - 让孩子知道你会回来
   - 用"再见"代替"不离开"

**三、入园适应**
- 提前参观幼儿园
- 认识老师、同学
- 准备入园物品
- 调整作息时间

**四、注意事项**
- 分离焦虑是正常的
- 大多数孩子在2-4周内适应
- 如持续严重，需咨询专业人士
- 家长的焦虑会影响孩子`;
  }

  if (lowerMsg.includes('安全') || lowerMsg.includes('危险')) {
    return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、居家安全**
1. **厨房安全**
   - 燃气灶、电水壶远离孩子
   - 热锅、热水远离桌边
   - 刀具放在高处或锁柜

2. **浴室安全**
   - 浴室防滑垫
   - 浴缸水及时排空
   - 马桶盖随时盖上

3. **卧室安全**
   - 安装床围栏
   - 小物件远离孩子
   - 插座安装保护盖

**二、交通安全**
- 走斑马线、人行横道
- 红灯停、绿灯行
- 使用儿童安全座椅
- 不在马路上玩耍

**三、安全教育建议**
- 从小建立安全意识
- 用故事、游戏教育
- 模拟安全场景
- 家长以身作则
- 定期检查安全隐患`;
  }
  
  // 根据意图生成专业回答
  if (knowledgeItems.length > 0) {
    const mainKnowledge = knowledgeItems[0];
    
    // 根据意图生成更专业的回答
    switch (intent) {
      case 'recipes':
        return generateRecipesAnswer(message, mainKnowledge);
      case 'books':
        return generateBooksAnswer(message, mainKnowledge);
      case 'motor':
        return generateMotorAnswer(message, mainKnowledge);
      case 'cognition':
        return generateCognitionAnswer(message, mainKnowledge);
      case 'math':
        return generateMathAnswer(message, mainKnowledge);
      case 'science':
        return generateScienceAnswer(message, mainKnowledge);
      case 'art':
        return generateArtAnswer(message, mainKnowledge);
      case 'potty':
        return generatePottyAnswer(message, mainKnowledge);
      case 'separation':
        return generateSeparationAnswer(message, mainKnowledge);
      case 'safety':
        return generateSafetyAnswer(message, mainKnowledge);
      case 'games':
        return generateGamesAnswer(message, mainKnowledge);
      default:
        return generateGenericAnswer(message, mainKnowledge, knowledgeItems);
    }
  }
  
  return `感谢您的提问！关于"${message}"，这是一个很好的育儿问题。

根据儿童发展心理学研究，建议您：
1. 观察孩子的具体表现，记录行为发生的频率和场景
2. 如有持续担忧，建议咨询专业医生
3. 可以参考我们的知识库获取更多信息

如需更详细的解答，请提供更多背景信息，如孩子年龄、具体表现等。`;
}

// 生成食谱类回答
function generateRecipesAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、营养搭配原则**
${knowledge.content.split('\n').slice(0, 5).join('\n')}

**二、推荐食谱**
${knowledge.content.split('\n').slice(5, 15).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(15, 20).join('\n')}

**四、专业建议**
如需更详细的食谱推荐，请提供孩子的年龄、口味偏好、过敏情况等信息。`;
}

// 生成绘本类回答
function generateBooksAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下推荐：

**一、推荐绘本**
${knowledge.content.split('\n').slice(0, 10).join('\n')}

**二、教育价值**
${knowledge.content.split('\n').slice(10, 15).join('\n')}

**三、亲子共读建议**
${knowledge.content.split('\n').slice(15, 20).join('\n')}

**四、专业建议**
如需更多绘本推荐，请提供孩子的年龄、兴趣方向等信息。`;
}

// 生成精细运动类回答
function generateMotorAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、发展规律**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、训练方法**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的训练方案，请提供孩子的年龄、当前能力水平等信息。`;
}

// 生成认知类回答
function generateCognitionAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、认知发展规律**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、训练方法**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的训练方案，请提供孩子的年龄、当前能力水平等信息。`;
}

// 生成数学类回答
function generateMathAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、数学启蒙原则**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、启蒙方法**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的启蒙方案，请提供孩子的年龄、当前水平等信息。`;
}

// 生成科学类回答
function generateScienceAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、科学启蒙原则**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、实验活动**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的实验方案，请提供孩子的年龄、兴趣方向等信息。`;
}

// 生成艺术类回答
function generateArtAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、艺术启蒙原则**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、活动建议**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的艺术启蒙方案，请提供孩子的年龄、兴趣方向等信息。`;
}

// 生成如厕类回答
function generatePottyAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、准备信号**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、训练方法**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、常见问题**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的训练方案，请提供孩子的年龄、当前情况等信息。`;
}

// 生成分离焦虑类回答
function generateSeparationAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、焦虑表现**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、应对策略**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、入园适应**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的应对方案，请提供孩子的年龄、当前情况等信息。`;
}

// 生成安全类回答
function generateSafetyAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、安全防护**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、具体措施**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更详细的安全指南，请提供孩子的年龄、家庭环境等信息。`;
}

// 生成游戏类回答
function generateGamesAnswer(message, knowledge) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下专业建议：

**一、游戏推荐**
${knowledge.content.split('\n').slice(0, 8).join('\n')}

**二、活动设计**
${knowledge.content.split('\n').slice(8, 18).join('\n')}

**三、注意事项**
${knowledge.content.split('\n').slice(18, 25).join('\n')}

**四、专业建议**
如需更多游戏推荐，请提供孩子的年龄、兴趣方向等信息。`;
}

// 生成通用回答
function generateGenericAnswer(message, mainKnowledge, knowledgeItems) {
  return `感谢您的提问！关于"${message}"，根据我们的知识库，为您提供以下解答：

**一、核心概念**
${mainKnowledge.content.substring(0, 300)}...

**二、具体建议**
${knowledgeItems.length > 1 ? knowledgeItems[1].content.substring(0, 200) + '...' : '建议结合孩子实际情况，制定个性化方案。'}

**三、专业建议**
如需更详细的解答，请提供更多背景信息，如孩子年龄、具体表现等。`;
}

// 发送消息（增强版）
router.post('/', async (req, res) => {
  try {
    const { message, child_profile, session_id } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    const sessionId = session_id || `session_${Date.now()}`;
    
    // 保存用户消息
    db.prepare(`
      INSERT INTO chat_messages (user_id, session_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(1, sessionId, message);

    // 分析用户意图
    const intent = analyzeIntent(message);
    
    // 获取会话上下文
    const context = getSessionContext(sessionId);
    
    // 检索知识库
    const knowledgeItems = searchKnowledgeBase(message, intent.intent);
    
    // 生成专业回答
    const answerResult = await generateProfessionalAnswer(message, intent.intent, knowledgeItems, context);
    const answer = answerResult.answer;

    // 保存AI回复
    db.prepare(`
      INSERT INTO chat_messages (user_id, session_id, role, content)
      VALUES (?, ?, 'bot', ?)
    `).run(1, sessionId, answer);

    res.json({
      success: true,
      data: {
        answer: answer,
        sources: knowledgeItems.map(item => item.title),
        session_id: sessionId,
        intent: intent.intent,
        confidence: intent.confidence,
        answer_source: answerResult.answer_source,
        ai_status: answerResult.ai_status,
        fallback_reason: answerResult.fallback_reason || null
      }
    });
  } catch (err) {
    console.error('[Chat] 发送消息失败:', err);
    res.status(500).json({
      success: false,
      message: '发送消息失败'
    });
  }
});

// 获取会话历史
router.get('/history', (req, res) => {
  try {
    const { session_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT * FROM chat_messages 
      WHERE user_id = ?
    `;
    let params = [1];
    
    if (session_id) {
      query += ' AND session_id = ?';
      params.push(session_id);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const messages = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('[Chat] 获取历史记录失败:', err);
    res.status(500).json({
      success: false,
      message: '获取历史记录失败'
    });
  }
});

// 获取知识库搜索结果
router.get('/knowledge', (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词不能为空'
      });
    }

    const intent = analyzeIntent(q);
    const results = searchKnowledgeBase(q, intent.intent);

    res.json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('[Chat] 搜索知识库失败:', err);
    res.status(500).json({
      success: false,
      message: '搜索知识库失败'
    });
  }
});

module.exports = router;
