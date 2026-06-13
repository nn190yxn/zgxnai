const HOT_KEYWORDS = ['情绪管理', '专注力培养', '孩子哭闹', '挑食', '阅读习惯', '社交冲突', '睡前流程'];

const PARENTING_ARTICLES = [
  {
    title: '孩子发脾气时，家长先做这4步',
    summary: '先接住情绪，再建立边界，帮助孩子从爆发走向表达。',
    category: '情绪管理',
    sub_category: '情绪表达',
    age_group: '3-6岁',
    tags: '情绪管理,亲子沟通,哭闹',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '当孩子情绪爆发时，家长先稳定自己的语气和表情。\n\n第一步，用一句短话命名情绪，例如“你现在很生气”。\n第二步，允许情绪存在，同时守住行为边界，例如“可以生气，不能打人”。\n第三步，等孩子平稳后再聊原因。\n第四步，和孩子一起复盘下一次可以怎样表达。\n\n家庭使用时，家长的节奏比技巧更重要。孩子越激动，家长的话越要短。'
  },
  {
    title: '建立睡前流程，让入睡更顺',
    summary: '固定的睡前顺序能降低磨蹭和对抗，提高入睡稳定性。',
    category: '行为习惯',
    sub_category: '睡眠习惯',
    age_group: '3-6岁',
    tags: '睡眠,作息,习惯',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '睡前流程的重点是固定顺序和固定时长。\n\n建议把洗澡、换睡衣、刷牙、关灯前共读安排成同一套顺序，每天重复。\n流程越清楚，孩子越容易知道接下来会发生什么，抵触感会下降。\n如果孩子拖延，可以在流程开始前给出一次预告，例如“十分钟后开始睡前流程”。\n\n家长可以把流程控制在30分钟以内，避免越拖越兴奋。'
  },
  {
    title: '孩子总说“不”，其实在练边界',
    summary: '把对抗看成边界练习，家长更容易找到有效回应。',
    category: '行为习惯',
    sub_category: '边界建立',
    age_group: '2-5岁',
    tags: '边界,对抗期,规则',
    author: '小牛育儿编辑部',
    evidence_level: 'B',
    content: '“不”是孩子表达自主感的重要方式。\n\n家长可以把大方向定好，把小选择交给孩子，例如“现在要收玩具，你想先收积木还是先收绘本”。\n这种说法保留了规则，也给了孩子参与感。\n如果孩子持续拖延，家长可以重复规则并减少解释。\n\n规则稳定，孩子的安全感会更强。'
  },
  {
    title: '提升专注力，先改家庭环境',
    summary: '专注力训练先从减少干扰开始，再逐步延长有效专注时间。',
    category: '认知发展',
    sub_category: '专注训练',
    age_group: '4-8岁',
    tags: '专注力,学习环境,执行力',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '专注力训练从环境开始最有效。\n\n训练时尽量关掉电视和背景视频，把桌面只留下当前任务需要的材料。\n任务拆小后，孩子更容易进入状态。\n家长可以从5分钟专注开始，逐步增加到8分钟、10分钟。\n\n专注训练看连续性，短时间高频率比一次做很久更有效。'
  },
  {
    title: '孩子不愿表达时，家长这样追问更有效',
    summary: '用描述式提问替代判断式提问，孩子会更愿意开口。',
    category: '认知发展',
    sub_category: '表达沟通',
    age_group: '3-7岁',
    tags: '表达,沟通,提问',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '很多孩子沉默，是因为问题太大或太抽象。\n\n与其问“今天开心吗”，更适合问“今天你和谁一起玩了”“你最记得哪件事”。\n孩子先说出事实，再说感受会更容易。\n如果孩子只回答一个词，家长可以帮他扩成完整句。\n\n表达能力在高质量对话里一点点长出来。'
  },
  {
    title: '同伴冲突发生后，家长怎样做翻译官',
    summary: '把孩子背后的需求说出来，帮助他们从争抢走向协商。',
    category: '社交能力',
    sub_category: '冲突处理',
    age_group: '3-8岁',
    tags: '社交,冲突,沟通',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '同伴冲突里，家长的工作是先翻译需求，再帮助协商。\n\n可以先分别描述双方的想法，例如“你想继续玩积木，他也想试一下”。\n等孩子情绪下降后，再引导轮流、交换或一起玩。\n家长的语气越中立，孩子越容易学会处理冲突。\n\n社交能力在具体冲突里练出来。'
  },
  {
    title: '挑食孩子的餐桌策略',
    summary: '减少对抗，增加可预测性，让孩子逐步接受新食物。',
    category: '营养健康',
    sub_category: '饮食习惯',
    age_group: '2-8岁',
    tags: '挑食,喂养,营养',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '挑食管理靠稳定策略，不靠一次说服。\n\n每餐可以保留一种孩子愿意吃的安全食物，同时放一种新食物。\n家长负责提供，孩子负责决定吃多少。\n新食物需要多次暴露，家长只要保证看见、闻到、碰到，接受度就会慢慢提升。\n\n餐桌氛围轻松，孩子更愿意尝试。'
  },
  {
    title: '换季时这样照顾孩子肠胃和作息',
    summary: '饮食清淡、睡眠稳定和户外活动三项一起做，换季更平稳。',
    category: '营养健康',
    sub_category: '季节护理',
    age_group: '3-10岁',
    tags: '换季,肠胃,作息',
    author: '小牛育儿编辑部',
    evidence_level: 'B',
    content: '换季阶段，孩子常见的波动是食欲变化、作息乱和轻度不适。\n\n家长可以先保证三件事：规律睡眠、充足饮水和不过量零食。\n餐食以熟软、温和、清淡为主，避免频繁更换高刺激食物。\n每天保留一定户外活动，帮助睡眠和食欲回到稳定节奏。\n\n家庭照护越稳定，孩子越容易平稳过渡。'
  },
  {
    title: '孩子总拖拉，家长先分清不会还是不想',
    summary: '把拖拉拆成能力问题和动机问题，处理会更精准。',
    category: '行为习惯',
    sub_category: '执行功能',
    age_group: '5-10岁',
    tags: '拖拉,执行力,任务管理',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '拖拉常常来自两类原因：任务不会做，或任务不想做。\n\n如果孩子不会做，家长要把任务拆得更小。\n如果孩子不想做，家长要减少拉扯，增加开始动作的清晰度，例如“现在先把书包拉链打开”。\n任务启动比反复催促更关键。\n\n看清原因，处理才会有效。'
  },
  {
    title: '亲子共读最有价值的3个提问点',
    summary: '看图、讲变化、联系生活，三类提问最容易带动理解和表达。',
    category: '认知发展',
    sub_category: '阅读引导',
    age_group: '3-8岁',
    tags: '阅读,共读,表达',
    author: '小牛育儿编辑部',
    evidence_level: 'A',
    content: '亲子共读的关键是让孩子在图和故事之间建立连接。\n\n第一类问题看图找线索，例如“你看到谁了”。\n第二类问题讲变化，例如“后来发生了什么”。\n第三类问题联系生活，例如“你有没有遇到过类似的事”。\n这三类问题配合使用，最容易带动理解和表达。\n\n共读贵在互动，不在读得多快。'
  }
];

const READING_TASKS = [
  {
    task_code: 'read_34_cover',
    title: '封面观察：猜一猜故事主角',
    subject_code: 'reading_comprehension',
    age_range: '3-4岁',
    difficulty: 1,
    duration: 8,
    material: '选择一本画面清楚、主角突出的绘本。',
    objective: '通过观察封面建立阅读预期。',
    steps: '先看封面\n请孩子说看到谁\n再猜故事可能发生什么',
    parent_prompt: '你觉得故事里谁会出现？',
    content: '训练孩子通过画面找信息。',
    tips: '先让孩子自由说，再补充追问。',
    example_answer: '我看到一只小兔子，它可能要去找朋友。'
  },
  {
    task_code: 'read_45_fact',
    title: '看图回答：谁在哪里做什么',
    subject_code: 'reading_comprehension',
    age_range: '4-5岁',
    difficulty: 1,
    duration: 10,
    material: '一页有明显人物和动作的绘本画面。',
    objective: '能回答图画中的基本事实信息。',
    steps: '家长读一页\n请孩子说人物和地点\n再说正在发生什么',
    parent_prompt: '画面里是谁？他在做什么？',
    content: '帮助孩子从画面中提取核心信息。',
    tips: '孩子只说词语也可以，家长帮助补成完整句。',
    example_answer: '小熊在公园里放风筝。'
  },
  {
    task_code: 'read_56_retell',
    title: '一句话复述故事变化',
    subject_code: 'expression_communication',
    age_range: '5-6岁',
    difficulty: 2,
    duration: 10,
    material: '选择情节简单、转折清楚的绘本。',
    objective: '提炼主角和变化进行复述。',
    steps: '回忆故事开头\n说出发生了什么变化\n用一句话复述',
    parent_prompt: '如果只用一句话讲给别人听，你会怎么说？',
    content: '训练概括表达和口头复述。',
    tips: '先抓住谁和发生了什么，再补结果。',
    example_answer: '小兔子找到回家的路了。'
  },
  {
    task_code: 'logic_69_sort',
    title: '顺序整理：先发生什么',
    subject_code: 'logical_thinking',
    age_range: '6-9岁',
    difficulty: 2,
    duration: 12,
    material: '准备3张有先后关系的图片。',
    objective: '根据事件顺序组织表达。',
    steps: '先观察三张图\n按顺序排好\n说明为什么这样排',
    parent_prompt: '你为什么把这张放在前面？',
    content: '训练因果和顺序思维。',
    tips: '孩子说不清时，让他先说“先、再、最后”。',
    example_answer: '先穿鞋，再出门，最后到公园。'
  },
  {
    task_code: 'read_69_reason',
    title: '短文理解：找出原因和结果',
    subject_code: 'reading_comprehension',
    age_range: '6-9岁',
    difficulty: 2,
    duration: 12,
    material: '选择80到120字短文。',
    objective: '识别文中的因果关系。',
    steps: '阅读短文\n圈出关键词\n说出因和果',
    parent_prompt: '因为发生了什么，所以结果怎样？',
    content: '训练基础阅读理解。',
    tips: '可以用“因为...所以...”句式辅助。',
    example_answer: '因为下雨了，所以他们把活动改到室内。'
  },
  {
    task_code: 'expr_69_share',
    title: '表达训练：说出你的理由',
    subject_code: 'expression_communication',
    age_range: '6-9岁',
    difficulty: 3,
    duration: 10,
    material: '从当天阅读材料中选一个观点。',
    objective: '表达个人观点并给出理由。',
    steps: '先说你的选择\n再说一个理由\n补充一个例子',
    parent_prompt: '你为什么这样想？',
    content: '训练有理由地表达。',
    tips: '家长可以先示范“我觉得...因为...”。',
    example_answer: '我喜欢这一页，因为主角学会了主动帮助别人。'
  },
  {
    task_code: 'learn_912_strategy',
    title: '学习策略：圈关键词再答题',
    subject_code: 'learning_metacognition',
    age_range: '9-12岁',
    difficulty: 3,
    duration: 15,
    material: '一段说明文或短文。',
    objective: '学会先找关键词再组织答案。',
    steps: '先通读全文\n圈出关键词\n按问题组织答案',
    parent_prompt: '哪几个词最能说明重点？',
    content: '训练学习中的信息提取策略。',
    tips: '先找名词和动词，再看关系。',
    example_answer: '我先圈出主题词，再回到问题定位句子。'
  },
  {
    task_code: 'creative_912_question',
    title: '探究表达：给故事再提一个问题',
    subject_code: 'inquiry_creativity',
    age_range: '9-12岁',
    difficulty: 4,
    duration: 15,
    material: '读完一篇故事或短文。',
    objective: '形成追问和自主思考。',
    steps: '读完材料\n提出一个新问题\n说说你想怎么找答案',
    parent_prompt: '如果继续追问，你最想问什么？',
    content: '训练主动思考和提问。',
    tips: '问题越具体，越容易展开思考。',
    example_answer: '我想知道主角后来有没有把这个方法继续用下去。'
  }
];

const ASSESSMENT_META = {
  sensory: { name: '儿童感觉统合能力发展评定量表', total_questions: 58, duration: 15, age_groups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁'] },
  focus: { name: '专注力观察', total_questions: 25, duration: 12, age_groups: ['3-4岁', '4-5岁', '5-6岁', '6-9岁', '9-12岁'] },
  adhd: { name: 'ADHD风险观察筛查', total_questions: 18, duration: 10, age_groups: ['4-6岁', '6-9岁', '9-12岁'] },
  multi_intelligence: { name: '多元智能观察', total_questions: 40, duration: 20, age_groups: ['3-6岁', '6-9岁', '9-12岁'] },
  emotion: { name: '情绪能力观察', total_questions: 22, duration: 12, age_groups: ['3-6岁', '6-9岁', '9-12岁'] },
  learning: { name: '学习适应观察', total_questions: 35, duration: 18, age_groups: ['6-9岁', '9-12岁'] }
};

const ASSESSMENT_DIMENSIONS = {
  sensory: ['前庭觉', '触觉', '本体感', '动作计划'],
  focus: ['集中注意', '持续注意', '抗干扰'],
  adhd: ['注意控制', '行为抑制', '活动水平'],
  multi_intelligence: ['语言智能', '逻辑智能', '空间智能', '人际智能'],
  emotion: ['情绪识别', '情绪表达', '情绪调节'],
  learning: ['任务启动', '学习坚持', '学习策略', '自我管理']
};

const ASSESSMENT_PROMPTS = {
  sensory: '孩子在日常活动中对身体感觉刺激的反应如何？',
  focus: '孩子在完成任务时的专注表现如何？',
  adhd: '孩子在冲动和活动控制上的表现如何？',
  multi_intelligence: '孩子在不同智能领域中的表现如何？',
  emotion: '孩子在情绪识别与调节中的表现如何？',
  learning: '孩子在学习适应和任务管理中的表现如何？'
};

function buildAssessmentQuestions(code) {
  const meta = ASSESSMENT_META[code];
  const dimensions = ASSESSMENT_DIMENSIONS[code] || ['general'];
  const prompt = ASSESSMENT_PROMPTS[code] || '孩子的表现如何？';
  if (!meta) {
    return [];
  }
  const questions = [];
  for (let i = 0; i < meta.total_questions; i++) {
    const dimension = dimensions[i % dimensions.length];
    questions.push({
      id: i + 1,
      dimension,
      text: `${i + 1}. ${prompt}`,
      options: [
        { value: 0, label: '很少出现' },
        { value: 1, label: '偶尔出现' },
        { value: 2, label: '经常出现' },
        { value: 3, label: '持续稳定' }
      ]
    });
  }
  return questions;
}

module.exports = {
  HOT_KEYWORDS,
  PARENTING_ARTICLES,
  READING_TASKS,
  ASSESSMENT_META,
  buildAssessmentQuestions
};
