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
    steps: '先看封面颜色和人物\n请孩子指出主角\n说一说主角可能要做什么\n读完后回头验证猜想',
    parent_prompt: '你觉得故事里谁会出现？它可能会去哪里？',
    content: '这节任务帮助低龄孩子先从画面里找线索，再带着期待进入故事。家长的重点是陪孩子看见“谁、在哪里、要做什么”，不用急着解释文字。',
    tips: '孩子只说一个词也可以，先接住再帮他补成短句。',
    example_answer: '我看到一只小兔子，它可能要去找朋友。'
  },
  {
    task_code: 'logic_34_pair',
    title: '配对观察：一样的放一起',
    subject_code: 'logical_thinking',
    age_range: '3-4岁',
    difficulty: 1,
    duration: 8,
    material: '准备3组相同或相近的图片卡片。',
    objective: '建立相同和不同的初步分类意识。',
    steps: '先摆出两张相同卡片\n请孩子找出一样的那张\n再说它们哪里一样\n最后把不同的单独放一边',
    parent_prompt: '你为什么把它们放在一起？',
    content: '这节任务训练孩子最基础的比较和配对能力。先从颜色或形状最明显的材料开始，帮助孩子建立“相同的放一起”的规则意识。',
    tips: '先做两选一，再逐步增加到三选一。',
    example_answer: '这两个都是红苹果，所以可以放一起。'
  },
  {
    task_code: 'expr_34_name',
    title: '指一指再说：把看到的说出来',
    subject_code: 'expression_communication',
    age_range: '3-4岁',
    difficulty: 1,
    duration: 8,
    material: '选择一页人物和物品较少的绘本画面。',
    objective: '把指认和口头表达连起来。',
    steps: '先请孩子指一指看到的东西\n家长说出名称示范\n再请孩子跟着说\n最后让孩子自己说一遍完整短句',
    parent_prompt: '你看到谁了？你想告诉妈妈什么？',
    content: '这节任务适合表达起步阶段。家长先跟着孩子的手势走，再把手势翻译成语言，让孩子感受到“我指到的东西可以说出来”。',
    tips: '优先说孩子最熟悉的生活词汇。',
    example_answer: '我看到小猫在睡觉。'
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
    steps: '家长读一页\n请孩子说人物和地点\n再说正在发生什么\n最后用一句话连起来',
    parent_prompt: '画面里是谁？他在做什么？',
    content: '这节任务帮助孩子从画面中提取基础事实。先稳定回答“谁、哪里、做什么”，后续理解才会更顺。',
    tips: '孩子只说词语也可以，家长帮助补成完整句。',
    example_answer: '小熊在公园里放风筝。'
  },
  {
    task_code: 'logic_45_rule',
    title: '找规律：下一张会是什么',
    subject_code: 'logical_thinking',
    age_range: '4-5岁',
    difficulty: 1,
    duration: 10,
    material: '准备红蓝红蓝或大中大中的简单规律卡。',
    objective: '发现重复规律并预测下一项。',
    steps: '先摆出前三张卡片\n请孩子说发现了什么规律\n猜下一张应该是什么\n再自己摆出新的规律',
    parent_prompt: '后面为什么会接这张？',
    content: '规律任务能让孩子从“看见一样”走向“发现顺序”。家长重点是引导孩子说出规则，而不只是猜对答案。',
    tips: '先做ABAB型，再过渡到AAB型。',
    example_answer: '前面是红蓝红蓝，下一张应该还是红色。'
  },
  {
    task_code: 'expr_45_sequence',
    title: '说步骤：先做什么再做什么',
    subject_code: 'expression_communication',
    age_range: '4-5岁',
    difficulty: 1,
    duration: 10,
    material: '选一件孩子熟悉的生活小事，如洗手或穿鞋。',
    objective: '用顺序词讲清楚一个简单过程。',
    steps: '先让孩子回忆一件小事\n家长示范“先、再、最后”\n孩子照着说步骤\n一起检查有没有漏掉',
    parent_prompt: '你能告诉我先做什么，再做什么吗？',
    content: '顺序表达能帮助孩子把生活经验组织成语言。任务不求复杂，只要能把一件熟悉小事说清楚就已经有效。',
    tips: '生活事件比抽象故事更容易开口。',
    example_answer: '先卷袖子，再打肥皂，最后把手冲干净。'
  },
  {
    task_code: 'read_56_compare',
    title: '角色比较：他们哪里不一样',
    subject_code: 'reading_comprehension',
    age_range: '5-6岁',
    difficulty: 2,
    duration: 10,
    material: '选择有两个主要角色的绘本。',
    objective: '比较人物的做法或心情差异。',
    steps: '找出两个主要角色\n分别说他们做了什么\n比较哪里不一样\n说一说你更喜欢谁的做法',
    parent_prompt: '这两个人有什么不一样？',
    content: '这节任务让孩子从单一事实回答走向简单比较。家长可以先帮孩子分别描述，再引导他说出不同点。',
    tips: '先比较动作，再比较心情，难度更低。',
    example_answer: '一个先帮助别人，一个先顾着自己，所以我更喜欢先帮助别人的那个。'
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
    steps: '回忆故事开头\n说出发生了什么变化\n补充结果\n用一句话复述',
    parent_prompt: '如果只用一句话讲给别人听，你会怎么说？',
    content: '这节任务训练孩子把读到的内容压缩成一句完整表达。表达公式可以从“谁 + 做了什么 + 结果怎样”开始。',
    tips: '先抓住谁和发生了什么，再补结果。',
    example_answer: '小兔子找到回家的路了。'
  },
  {
    task_code: 'learn_56_plan',
    title: '学习准备：开始前先说计划',
    subject_code: 'learning_metacognition',
    age_range: '5-6岁',
    difficulty: 2,
    duration: 10,
    material: '一项10分钟内能完成的阅读或手工任务。',
    objective: '建立开始前先想步骤的习惯。',
    steps: '开始前先看任务\n请孩子说第一步做什么\n再说第二步和完成标准\n做完后回头检查计划有没有做到',
    parent_prompt: '你准备先做什么？做完怎样知道自己完成了？',
    content: '元认知训练在低龄阶段先从“做之前先想一想”开始。家长帮助孩子把模糊的开始动作说具体，任务启动会明显顺很多。',
    tips: '每次只计划两到三步，保持可执行。',
    example_answer: '我先把书翻到这一页，再看图，最后告诉妈妈我看到了什么。'
  },
  {
    task_code: 'creative_56_guess',
    title: '大胆猜：故事后面可能会怎样',
    subject_code: 'inquiry_creativity',
    age_range: '5-6岁',
    difficulty: 2,
    duration: 10,
    material: '选到情节中间暂停的绘本或故事。',
    objective: '基于线索进行想象和预测。',
    steps: '读到关键停顿处暂停\n请孩子猜后面会发生什么\n说一说为什么这样猜\n读下去验证',
    parent_prompt: '你猜后面会怎样？为什么？',
    content: '这节任务把阅读理解和创造性表达连起来。孩子的猜想只要能说出依据，就是一次有价值的探究。',
    tips: '先接纳大胆猜想，再带着孩子回到线索。',
    example_answer: '我觉得主角会去找妈妈，因为它现在看起来有点害怕。'
  },
  {
    task_code: 'logic_56_compare',
    title: '分类比较：按用途分一分',
    subject_code: 'logical_thinking',
    age_range: '5-6岁',
    difficulty: 2,
    duration: 10,
    material: '准备餐具、玩具、文具等生活物品图片。',
    objective: '按用途进行分类并说出理由。',
    steps: '先观察所有图片\n按用途分成两到三类\n说每一类有什么共同点\n最后检查有没有放错的',
    parent_prompt: '你为什么把这些放在一组？',
    content: '从颜色和形状分类进阶到按用途分类，能帮助孩子建立更抽象的规则意识。',
    tips: '孩子卡住时，可以先问“这些东西平时都在哪用”。',
    example_answer: '勺子和碗放一起，因为它们都在吃饭的时候用。'
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
    steps: '先观察三张图\n按顺序排好\n说明为什么这样排\n再用先后顺序讲一遍',
    parent_prompt: '你为什么把这张放在前面？',
    content: '顺序任务训练孩子把观察、推理和表达连在一起。说清“为什么这样排”比单纯排对更重要。',
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
    steps: '阅读短文\n圈出关键词\n说出因和果\n用一句完整话回答',
    parent_prompt: '因为发生了什么，所以结果怎样？',
    content: '这节任务把孩子从“看懂表面内容”推进到“看懂前后关系”。关键词圈画能降低作答压力。',
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
    steps: '先说你的选择\n再说一个理由\n补充一个例子\n最后重述完整观点',
    parent_prompt: '你为什么这样想？',
    content: '有理由地表达是这一阶段的重要能力。孩子先能说出一个理由，再慢慢过渡到两个理由和一个例子。',
    tips: '家长可以先示范“我觉得...因为...”。',
    example_answer: '我喜欢这一页，因为主角学会了主动帮助别人。'
  },
  {
    task_code: 'learn_69_checklist',
    title: '学习检查：做完后自己对一对',
    subject_code: 'learning_metacognition',
    age_range: '6-9岁',
    difficulty: 2,
    duration: 12,
    material: '一张短练习或一段阅读任务。',
    objective: '形成完成后自查的基本习惯。',
    steps: '做题前先看要求\n做完后检查有没有漏题\n再检查答案有没有回到题目\n最后给自己打一颗星',
    parent_prompt: '你准备从哪一步开始检查？',
    content: '这节任务重点是让孩子意识到“完成”和“检查”是两件事。先有简单检查单，后续学习质量会更稳定。',
    tips: '把检查点固定成两项最容易坚持。',
    example_answer: '我先看有没有漏掉问题，再看答案有没有写完整。'
  },
  {
    task_code: 'creative_69_question',
    title: '延伸提问：再问一个为什么',
    subject_code: 'inquiry_creativity',
    age_range: '6-9岁',
    difficulty: 3,
    duration: 12,
    material: '读完一段故事或科普短文。',
    objective: '从读懂内容进阶到主动提出问题。',
    steps: '先说你读懂了什么\n找一个最想继续追问的点\n提出一个为什么问题\n说说你可以去哪里找答案',
    parent_prompt: '如果还能再问一个问题，你最想问什么？',
    content: '探究能力的起点是敢追问。家长不急着给答案，先让孩子体验“我可以提出一个好问题”。',
    tips: '让问题贴近当前材料，孩子更容易继续思考。',
    example_answer: '我想知道蝴蝶为什么总会停在开花的地方。'
  },
  {
    task_code: 'read_912_theme',
    title: '主旨提炼：这段话最想说什么',
    subject_code: 'reading_comprehension',
    age_range: '9-12岁',
    difficulty: 3,
    duration: 15,
    material: '一段120到200字说明文或故事片段。',
    objective: '从细节中提炼段落主旨。',
    steps: '先通读全文\n划出重复出现的关键词\n说每句在讲什么\n最后合成一句主旨',
    parent_prompt: '如果只能留下一句话，你会留哪一句？',
    content: '主旨提炼训练孩子从信息堆里抓重点。先分句理解，再回到全文合并，难度会明显下降。',
    tips: '主旨句要能覆盖多数细节，不只挑一个例子。',
    example_answer: '这段话主要在讲规律作息能帮助孩子更稳定地进入学习状态。'
  },
  {
    task_code: 'logic_912_argument',
    title: '逻辑判断：哪条理由更充分',
    subject_code: 'logical_thinking',
    age_range: '9-12岁',
    difficulty: 3,
    duration: 15,
    material: '准备两个针对同一问题的不同理由。',
    objective: '比较理由是否具体、相关、充分。',
    steps: '先读两个理由\n找出它们分别在证明什么\n比较哪个更具体\n说出你的判断依据',
    parent_prompt: '你觉得哪一个理由更站得住？为什么？',
    content: '逻辑判断能力在高年级阶段非常关键。孩子需要开始区分“有观点”和“有依据的观点”。',
    tips: '优先比较是否贴题、是否有事实支撑。',
    example_answer: '第二个理由更充分，因为它说了具体场景和结果，不只是泛泛地说好。'
  },
  {
    task_code: 'expr_912_report',
    title: '口头汇报：两分钟讲清楚重点',
    subject_code: 'expression_communication',
    age_range: '9-12岁',
    difficulty: 3,
    duration: 15,
    material: '一段刚读完的文章、一个小实验或一件校园经历。',
    objective: '组织一段有开头、重点和结尾的口头汇报。',
    steps: '先写下三个关键词\n按开头-重点-结尾组织\n先自己说一遍\n再根据录音调整',
    parent_prompt: '如果给同学讲两分钟，你最想让别人记住什么？',
    content: '这节任务让孩子把阅读理解、信息提炼和口头表达整合起来。结构化表达会明显提升表达清晰度。',
    tips: '每段只保留一个重点，避免信息过满。',
    example_answer: '今天我要分享的是怎样做一个稳定的睡前流程。先固定顺序，再控制时长，最后每天坚持执行。'
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
    steps: '先通读全文\n圈出关键词\n回到题目定位句子\n按问题组织答案',
    parent_prompt: '哪几个词最能说明重点？',
    content: '关键词策略能帮助孩子避免“读完就忘”和“答非所问”。先定位，再组织，能显著减少无效作答。',
    tips: '先找名词和动词，再看关系。',
    example_answer: '我先圈出主题词，再回到问题定位句子。'
  },
  {
    task_code: 'learn_912_reflect',
    title: '学习复盘：这次哪里做得好',
    subject_code: 'learning_metacognition',
    age_range: '9-12岁',
    difficulty: 4,
    duration: 12,
    material: '完成后的阅读练习、作业或讲述任务。',
    objective: '形成结果后的自我复盘意识。',
    steps: '回看刚完成的任务\n说一件做得好的地方\n说一件下次想改进的地方\n写下一个下次要继续用的策略',
    parent_prompt: '这次最有效的做法是什么？下次你还想继续用吗？',
    content: '复盘让孩子从“完成一个任务”走向“总结一种方法”。这类训练能慢慢形成稳定的自我监控能力。',
    tips: '先说做得好的地方，孩子更愿意进入复盘。',
    example_answer: '我先圈关键词再答题，所以这次没有漏掉重点。下次我还想继续用这个方法。'
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
    steps: '读完材料\n提出一个新问题\n说说你想怎么找答案\n判断这个问题值不值得继续追',
    parent_prompt: '如果继续追问，你最想问什么？',
    content: '高年级探究任务重点在于提出一个具体、可继续追下去的问题，并开始思考获取答案的路径。',
    tips: '问题越具体，越容易展开思考。',
    example_answer: '我想知道主角后来有没有把这个方法继续用下去。'
  },
  {
    task_code: 'creative_912_solution',
    title: '方案设计：如果换你来解决',
    subject_code: 'inquiry_creativity',
    age_range: '9-12岁',
    difficulty: 4,
    duration: 15,
    material: '选择一个故事冲突或生活中的小问题。',
    objective: '提出一个可执行的解决方案并说明理由。',
    steps: '先说清问题是什么\n提出一个解决办法\n说明为什么这样做\n补充如果失败还能怎么调整',
    parent_prompt: '如果换成你，你会怎样解决这个问题？',
    content: '这节任务把探究、逻辑和表达整合在一起。孩子需要从“有想法”走向“提出一个能落地的方案”。',
    tips: '方案越具体越容易评价是否可行。',
    example_answer: '如果我是主角，我会先和同伴约好轮流时间，再把规则写下来提醒大家。'
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
