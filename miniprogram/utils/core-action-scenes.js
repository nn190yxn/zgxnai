var CORE_ACTION_AGE_GROUPS = [
  { key: '3-4', label: '3-4岁' },
  { key: '4-5', label: '4-5岁' },
  { key: '5-6', label: '5-6岁' },
  { key: '6-plus', label: '6岁以上' }
];

var ageFirstCatalog = require('./core-action-age-catalog');

var AGE_FIRST_SEGMENTS = [
  {
    key: 'age_2_3',
    label: '2-3岁',
    title: '先建立大运动和表达基础',
    subtitle: '看孩子能不能稳稳走跑跳、愿不愿意开口表达。',
    focusAreas: ['大运动模式', '语言表达', '安全感', '模仿能力'],
    parentSummary: '这个阶段家长最常担心孩子动作不稳、开口少、换环境哭和不愿模仿。',
    painPoints: [
      {
        key: 'gross_motor_unstable',
        categoryKey: 'motor_fitness',
        title: '走跑跳总是不稳',
        description: '走路跑步容易摔，不敢跳，不敢上下台阶。',
        observableSigns: ['容易摔倒', '不敢双脚跳', '上下台阶要抱'],
        abilityTags: ['大运动模式', '前庭觉', '本体觉'],
        sceneKey: 'gross_motor_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看身体稳定和动作信心', text: '孩子可能还没有建立稳定的走跑跳模式，先用安全的小动作建立身体信心。' },
        defaultAction: { title: '今晚先做 3 次垫脚拿玩具', steps: ['把玩具放在孩子够得到的稍高位置。', '让孩子垫脚拿 3 次。', '拿到后马上结束，不追加要求。'] }
      },
      {
        key: 'language_expression_less',
        categoryKey: 'social_expression',
        title: '不太开口说话',
        description: '常用指、拉大人或哭来表达需求。',
        observableSigns: ['主动词少', '只用手指', '急了就哭'],
        abilityTags: ['语言表达', '需求表达', '模仿能力'],
        sceneKey: 'language_expression_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看孩子有没有开口机会', text: '孩子可能知道自己想要什么，但还没有形成用词表达的习惯。' },
        defaultAction: { title: '今晚只等孩子说一个词', steps: ['拿孩子想要的东西。', '大人先说一次名称。', '等孩子发出一个词或近似音后再给。'] }
      },
      {
        key: 'imitation_resistant',
        categoryKey: 'social_expression',
        title: '不愿模仿大人动作',
        description: '跟做拍手、蹲起、挥手等动作时兴趣弱。',
        observableSigns: ['不跟做动作', '看一眼就跑', '只想自己玩'],
        abilityTags: ['模仿能力', '动作计划', '亲子互动'],
        sceneKey: 'imitation_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看模仿动作是否太复杂', text: '模仿需要观察、理解和身体执行同时配合，先从一个动作开始更容易。' },
        defaultAction: { title: '今晚只玩 3 次拍手模仿', steps: ['大人拍手一次。', '等孩子跟一次。', '完成 3 次就结束。'] }
      },
      {
        key: 'new_environment_cries',
        categoryKey: 'emotion_rules',
        title: '一换环境就哭',
        description: '到新地方紧张、抱人、不愿下来探索。',
        observableSigns: ['进门就抱紧大人', '不愿下地', '看见陌生人哭'],
        abilityTags: ['安全感', '环境适应', '情绪调节'],
        sceneKey: 'environment_adaptation',
        symptoms: [],
        defaultBottleneck: { title: '先看安全感是否跟得上环境变化', text: '孩子面对新环境时需要先确认安全，再慢慢开始探索。' },
        defaultAction: { title: '今晚练一个固定安心动作', steps: ['进入新空间前先抱 10 秒。', '告诉孩子：我们先看一看。', '只要求孩子指出一个看到的东西。'] }
      },
      {
        key: 'separation_hard',
        categoryKey: 'emotion_rules',
        title: '亲子分离很难',
        description: '大人离开时哭闹，反复确认大人在哪里。',
        observableSigns: ['大人一走就哭', '反复找妈妈', '不愿独自玩一会'],
        abilityTags: ['安全感', '分离适应', '独立游戏'],
        sceneKey: 'separation_adaptation',
        symptoms: [],
        defaultBottleneck: { title: '先建立短时间可预测分离', text: '孩子需要知道大人会回来，分离才会慢慢变得可承受。' },
        defaultAction: { title: '今晚先离开 10 秒再回来', steps: ['告诉孩子：我去拿水，马上回来。', '离开 10 秒。', '回来后说：我回来了。'] }
      },
      {
        key: 'age_2_3_attention_start_delay',
        categoryKey: 'attention_learning',
        title: '开始玩之前磨很久',
        description: '看到积木、拼插或绘本时想靠近，但迟迟不开始。',
        observableSigns: ['站在旁边看', '摸一下又走开', '等大人先示范'],
        abilityTags: ['学习启动', '模仿能力', '安全感'],
        sceneKey: 'age_2_3_attention_start_support',
        symptoms: [],
        defaultBottleneck: { title: '先看开始动作是否太大', text: '2-3岁孩子进入活动前需要很小的示范和安全感，先把开始缩成一个动作。' },
        defaultAction: { title: '今晚只让孩子放第一个积木', steps: ['大人先放一个积木。', '把第二个递给孩子。', '孩子放上去就结束这一轮。'] }
      },
      {
        key: 'age_2_3_attention_shift_fast',
        categoryKey: 'attention_learning',
        title: '玩一会儿马上换东西',
        description: '玩具刚拿起来就换，活动很难停留超过一小会儿。',
        observableSigns: ['每样只碰一下', '不断换玩具', '大人引导后又跑开'],
        abilityTags: ['注意停留', '兴趣稳定', '身体调节'],
        sceneKey: 'age_2_3_attention_stay_support',
        symptoms: [],
        defaultBottleneck: { title: '先看活动是否太久太杂', text: '这个年龄段先练短暂停留，比要求完整玩完更容易成功。' },
        defaultAction: { title: '今晚只停留 30 秒', steps: ['只拿出一个玩具。', '陪孩子玩 30 秒。', '时间到让孩子自己收一下。'] }
      },
      {
        key: 'age_2_3_one_step_instruction_hard',
        categoryKey: 'attention_learning',
        title: '一个简单指令也常漏掉',
        description: '让孩子拿、放、给时，经常像没听见或做错。',
        observableSigns: ['叫名字反应慢', '拿错东西', '做到一半停住'],
        abilityTags: ['听觉注意', '简单指令', '动作执行'],
        sceneKey: 'age_2_3_one_step_instruction_support',
        symptoms: [],
        defaultBottleneck: { title: '先把话缩到一个词和一个动作', text: '2-3岁执行指令需要听懂词、看见物品、身体动起来同时配合。' },
        defaultAction: { title: '今晚只练拿杯子', steps: ['看着孩子说杯子。', '指一下杯子。', '孩子拿到或碰到就马上肯定。'] }
      },
      {
        key: 'age_2_3_short_task_half_done',
        categoryKey: 'attention_learning',
        title: '小任务做到一半就停',
        description: '收一个玩具、放一本书这类小事也容易断掉。',
        observableSigns: ['拿起来又放下', '半路去玩别的', '需要大人一直带'],
        abilityTags: ['短任务完成', '动作计划', '完成感'],
        sceneKey: 'age_2_3_short_task_finish_support',
        symptoms: [],
        defaultBottleneck: { title: '先给孩子一个看得见的结束点', text: '短任务没有清楚结束点时，孩子容易在中间断掉。' },
        defaultAction: { title: '今晚只收一个玩具进盒子', steps: ['把盒子放在孩子面前。', '只递一个玩具。', '放进去后说完成了。'] }
      },
      {
        key: 'age_2_3_picture_book_attention_short',
        categoryKey: 'attention_learning',
        title: '绘本看一页就跑开',
        description: '刚翻开书还能看，很快就离开或只想乱翻。',
        observableSigns: ['翻很快', '看一眼就走', '不等大人说完'],
        abilityTags: ['绘本注意', '视觉停留', '亲子共读'],
        sceneKey: 'age_2_3_picture_book_attention_support',
        symptoms: [],
        defaultBottleneck: { title: '先把共读缩到一页一个东西', text: '2-3岁共读先让孩子愿意看一页，再慢慢增加互动。' },
        defaultAction: { title: '今晚只找一页里的小动物', steps: ['让孩子选一页。', '大人问小动物在哪里。', '孩子指出来就合上书。'] }
      },
      {
        key: 'age_2_3_attention_transition_hard',
        categoryKey: 'attention_learning',
        title: '从一个活动换到另一个很难',
        description: '从玩具换到洗手、吃饭或出门时容易卡住。',
        observableSigns: ['不愿放下玩具', '听到要换就哭', '抱着东西不走'],
        abilityTags: ['注意转移', '流程意识', '情绪调节'],
        sceneKey: 'age_2_3_attention_transition_support',
        symptoms: [],
        defaultBottleneck: { title: '先给注意转移一个过渡动作', text: '孩子从喜欢的活动里出来需要看得见的结束信号。' },
        defaultAction: { title: '今晚用拜拜玩具结束', steps: ['提前说再玩一次就拜拜。', '让孩子对玩具挥手。', '挥手后把玩具放到固定位置。'] }
      },
      {
        key: 'age_2_3_attention_imitation_task_hard',
        categoryKey: 'attention_learning',
        title: '跟着做一个动作都难',
        description: '大人示范拍手、放进盒子、翻页时，孩子不太跟。',
        observableSigns: ['看大人但不动', '动作慢半拍', '做一次就停'],
        abilityTags: ['模仿学习', '动作观察', '共同注意'],
        sceneKey: 'age_2_3_imitation_task_support',
        symptoms: [],
        defaultBottleneck: { title: '先看模仿动作是否足够简单', text: '模仿学习要从孩子已经会的动作开始，成功一次就够。' },
        defaultAction: { title: '今晚只模仿一次拍桌子', steps: ['大人轻拍桌子一次。', '等孩子拍一次。', '拍到就笑着结束。'] }
      },
      {
        key: 'age_2_3_attention_sorting_resist',
        categoryKey: 'attention_learning',
        title: '简单分类也不愿意做',
        description: '把球放一起、把积木放盒子这类活动很快抗拒。',
        observableSigns: ['不看分类物品', '随手乱放', '一要求就走开'],
        abilityTags: ['简单分类', '视觉配对', '任务参与'],
        sceneKey: 'age_2_3_sorting_participation_support',
        symptoms: [],
        defaultBottleneck: { title: '先把分类变成一个配对动作', text: '2-3岁先做看得见的相同配对，再谈规则分类。' },
        defaultAction: { title: '今晚只配一对同颜色积木', steps: ['拿出两块同颜色积木。', '大人放一块。', '让孩子把另一块放旁边。'] }
      },
      {
        key: 'age_2_3_attention_wait_for_help',
        categoryKey: 'attention_learning',
        title: '遇到不会就等大人全做',
        description: '玩具卡住或任务难一点时，马上把东西递给大人。',
        observableSigns: ['马上递给大人', '不愿再试一下', '看着大人等帮忙'],
        abilityTags: ['尝试意识', '问题解决', '学习信心'],
        sceneKey: 'age_2_3_try_again_support',
        symptoms: [],
        defaultBottleneck: { title: '先把再试一次缩得足够小', text: '孩子还没形成自己试一下的经验，需要大人把难度降到能成功。' },
        defaultAction: { title: '今晚只让孩子再推一下', steps: ['玩具卡住时先不接走。', '说再推一下。', '孩子推一下后大人再帮忙。'] }
      },
      {
        key: 'age_2_3_attention_finish_signal_weak',
        categoryKey: 'attention_learning',
        title: '不知道活动什么时候结束',
        description: '一会儿想继续，一会儿又跑开，结束时也容易闹。',
        observableSigns: ['结束时哭闹', '不愿收尾', '听到好了还继续拿'],
        abilityTags: ['结束信号', '流程意识', '规则萌芽'],
        sceneKey: 'age_2_3_finish_signal_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立固定结束信号', text: '孩子知道什么时候结束，注意力才更容易从活动里收回来。' },
        defaultAction: { title: '今晚用最后一次收尾', steps: ['开始前说玩三次。', '第三次时说最后一次。', '结束后一起把东西放回去。'] }
      },
      {
        key: 'age_2_3_wait_tiny_turn_hard',
        categoryKey: 'emotion_rules',
        title: '等一小会儿都很难',
        description: '想要东西时马上要，等几秒就哭或抢。',
        observableSigns: ['马上伸手抢', '等几秒就哭', '大人说等等就急'],
        abilityTags: ['等待萌芽', '冲动控制', '情绪降温'],
        sceneKey: 'age_2_3_tiny_wait_support',
        symptoms: [],
        defaultBottleneck: { title: '先把等待缩到看得见的几秒', text: '2-3岁等待能力刚开始长出来，先让孩子体验很短的等到。' },
        defaultAction: { title: '今晚只等 3 秒再给', steps: ['拿着孩子想要的东西。', '说等一下并数 1、2、3。', '数完马上给孩子。'] }
      },
      {
        key: 'age_2_3_transition_crying',
        categoryKey: 'emotion_rules',
        title: '一换活动就哭闹',
        description: '从玩到吃饭、洗澡或出门时反应很大。',
        observableSigns: ['听到要换就哭', '抱着玩具不放', '躺地上不动'],
        abilityTags: ['流程切换', '情绪调节', '可预测感'],
        sceneKey: 'age_2_3_transition_emotion_support',
        symptoms: [],
        defaultBottleneck: { title: '先给切换一个预告和收尾动作', text: '孩子被突然带走时容易崩，提前看见结束会更稳。' },
        defaultAction: { title: '今晚用再玩一次预告', steps: ['提前说再玩一次就洗手。', '陪孩子做最后一次。', '结束后说玩具休息了。'] }
      },
      {
        key: 'age_2_3_toy_taken_meltdown',
        categoryKey: 'emotion_rules',
        title: '玩具被拿走就崩溃',
        description: '别人碰到或拿走玩具时哭闹很久。',
        observableSigns: ['大哭不让碰', '抱紧玩具', '推开靠近的人'],
        abilityTags: ['物权意识', '情绪恢复', '安全感'],
        sceneKey: 'age_2_3_toy_turn_support',
        symptoms: [],
        defaultBottleneck: { title: '先承认这是孩子很在意的东西', text: '2-3岁物权意识正在发展，先接住情绪，再做短轮流。' },
        defaultAction: { title: '今晚只练摸一下还回来', steps: ['大人问我摸一下可以吗。', '只摸 1 秒。', '马上还给孩子并说还给你了。'] }
      },
      {
        key: 'age_2_3_no_boundary_hits',
        categoryKey: 'emotion_rules',
        title: '不愿意就打人或推人',
        description: '被拦住、被拒绝或不想分享时用手推打。',
        observableSigns: ['伸手打人', '推开大人', '被阻止就拍桌'],
        abilityTags: ['规则萌芽', '身体边界', '冲动控制'],
        sceneKey: 'age_2_3_body_boundary_rule_support',
        symptoms: [],
        defaultBottleneck: { title: '先把不能打换成能做的动作', text: '孩子需要一个替代动作表达不愿意，才更容易停下手。' },
        defaultAction: { title: '今晚只练说不要加摆手', steps: ['大人轻轻挡住手。', '示范说不要并摆手。', '孩子摆手一次就马上停要求。'] }
      },
      {
        key: 'age_2_3_new_rule_refuse',
        categoryKey: 'emotion_rules',
        title: '新规则一出现就不接受',
        description: '听到先洗手、先排队、先收玩具时立刻抗拒。',
        observableSigns: ['摇头说不要', '转身跑开', '哭着坚持原来玩法'],
        abilityTags: ['规则萌芽', '流程意识', '情绪安全'],
        sceneKey: 'age_2_3_simple_rule_support',
        symptoms: [],
        defaultBottleneck: { title: '先把规则变成一个固定动作', text: '抽象规则对低龄孩子太难，先练一个看得见的动作。' },
        defaultAction: { title: '今晚只练玩前先洗手', steps: ['把玩具放在看得见的位置。', '说洗手后玩。', '洗完马上给玩具。'] }
      },
      {
        key: 'age_2_3_parent_busy_clings',
        categoryKey: 'emotion_rules',
        title: '大人一忙就黏着哭',
        description: '大人做饭、接电话或离开视线时马上着急。',
        observableSigns: ['拉着大人不放', '看不到就哭', '反复喊妈妈'],
        abilityTags: ['安全感', '独立等待', '情绪安定'],
        sceneKey: 'age_2_3_parent_busy_wait_support',
        symptoms: [],
        defaultBottleneck: { title: '先给孩子一个大人会回来的信号', text: '孩子需要知道大人短暂忙完会回应，才能慢慢等。' },
        defaultAction: { title: '今晚用一首歌等妈妈', steps: ['告诉孩子妈妈唱完歌就回来。', '大人离开视线 10 秒。', '回来后说我回来了。'] }
      },
      {
        key: 'age_2_3_calm_down_needs_body',
        categoryKey: 'emotion_rules',
        title: '哭起来很难自己停下',
        description: '情绪上来后越哭越急，需要很久才能恢复。',
        observableSigns: ['哭声越来越大', '推开安抚', '恢复后还抽泣'],
        abilityTags: ['情绪恢复', '身体安抚', '安全感'],
        sceneKey: 'age_2_3_calm_body_support',
        symptoms: [],
        defaultBottleneck: { title: '先用身体安抚帮情绪降下来', text: '低龄孩子情绪恢复先靠身体安全感，再慢慢听得进话。' },
        defaultAction: { title: '今晚只做 5 次慢拍背', steps: ['蹲下来抱住或靠近孩子。', '慢慢拍背 5 次。', '只说你很着急。'] }
      },
      {
        key: 'age_2_3_morning_evening_flow_messy',
        categoryKey: 'emotion_rules',
        title: '早晚流程总是闹',
        description: '起床、洗澡、刷牙、睡前经常哭闹拖住。',
        observableSigns: ['刷牙躲开', '洗澡前哭', '睡前反复要东西'],
        abilityTags: ['生活流程', '可预测感', '规则萌芽'],
        sceneKey: 'age_2_3_daily_flow_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定一个流程顺序', text: '早晚流程太多时，孩子需要先知道下一步是什么。' },
        defaultAction: { title: '今晚只固定刷牙后抱一下', steps: ['刷牙前说刷完抱一下。', '只完成刷牙这个动作。', '刷完马上抱 5 秒。'] }
      },
      {
        key: 'age_2_3_stairs_afraid',
        categoryKey: 'motor_fitness',
        title: '上下台阶总要抱',
        description: '遇到楼梯、路沿或小台阶时害怕迈步。',
        observableSigns: ['看到台阶就伸手要抱', '一只脚不敢迈下去', '下台阶身体后仰'],
        abilityTags: ['上下台阶', '平衡能力', '本体觉'],
        sceneKey: 'age_2_3_stairs_support',
        symptoms: [],
        defaultBottleneck: { title: '先看单脚承重和高度安全感', text: '台阶动作需要一只脚承重和身体重心转移，先从很低的高度练。' },
        defaultAction: { title: '今晚只练一步小台阶', steps: ['找一个很低的台阶或垫子。', '大人牵一只手。', '只上下一次就结束。'] }
      },
      {
        key: 'age_2_3_balance_wobbly',
        categoryKey: 'motor_fitness',
        title: '站着走着总晃',
        description: '走直线、转身或站定时身体容易摇晃。',
        observableSigns: ['转身会晃', '站不住几秒', '走路常偏方向'],
        abilityTags: ['平衡能力', '前庭觉', '身体控制'],
        sceneKey: 'age_2_3_balance_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立短时间站稳经验', text: '平衡能力先从安全站稳开始，再逐步增加走和转身。' },
        defaultAction: { title: '今晚只站小脚印 5 秒', steps: ['在地上贴两个脚印。', '让孩子站上去 5 秒。', '站稳后马上抱一下或击掌。'] }
      },
      {
        key: 'age_2_3_jump_lands_heavy',
        categoryKey: 'motor_fitness',
        title: '跳起来落地很重',
        description: '双脚跳不起来，或落地声音大、身体不稳。',
        observableSigns: ['不敢双脚离地', '落地蹲不住', '跳完容易摔'],
        abilityTags: ['跳跃基础', '下肢力量', '身体稳定'],
        sceneKey: 'age_2_3_jump_landing_support',
        symptoms: [],
        defaultBottleneck: { title: '先练轻轻弯膝和小跳', text: '跳跃对低龄孩子是复合动作，先从很小的离地和安全落地开始。' },
        defaultAction: { title: '今晚只跳过一条纸线', steps: ['在地上放一条纸线。', '牵着孩子双脚小跳过去。', '只跳 3 次就结束。'] }
      },
      {
        key: 'age_2_3_run_stop_hard',
        categoryKey: 'motor_fitness',
        title: '跑起来停不住',
        description: '一跑就冲出去，停下或转弯时容易撞到。',
        observableSigns: ['跑到墙边才停', '转弯摔倒', '叫停反应慢'],
        abilityTags: ['跑停控制', '身体刹车', '前庭觉'],
        sceneKey: 'age_2_3_run_stop_support',
        symptoms: [],
        defaultBottleneck: { title: '先练身体刹车信号', text: '孩子需要把听到停和身体停住连起来，先用短距离练。' },
        defaultAction: { title: '今晚只做 3 次跑停', steps: ['让孩子跑 3 步。', '大人说停。', '停住后马上说身体停住了。'] }
      },
      {
        key: 'age_2_3_climb_avoid',
        categoryKey: 'motor_fitness',
        title: '不敢爬上爬下',
        description: '面对软垫、沙发边或小坡时不愿尝试。',
        observableSigns: ['趴在边上不动', '伸手要大人抱', '脚不知道怎么放'],
        abilityTags: ['攀爬基础', '动作计划', '安全感'],
        sceneKey: 'age_2_3_climb_support',
        symptoms: [],
        defaultBottleneck: { title: '先看手脚顺序和安全感', text: '攀爬需要手脚轮流配合，先在软垫上练一个小动作。' },
        defaultAction: { title: '今晚只爬上一个软垫', steps: ['把软垫放在地上。', '大人示范手先放上去。', '孩子爬上去一次就结束。'] }
      },
      {
        key: 'age_2_3_ball_kick_miss',
        categoryKey: 'motor_fitness',
        title: '踢球总踢不到',
        description: '踢球、推球或追球时脚和眼睛配合不上。',
        observableSigns: ['脚从球边擦过', '追球容易摔', '只用手拿球'],
        abilityTags: ['手眼脚协调', '动作计划', '身体控制'],
        sceneKey: 'age_2_3_ball_kick_support',
        symptoms: [],
        defaultBottleneck: { title: '先把球固定住再踢', text: '球会滚时难度很高，先从固定球和慢动作开始。' },
        defaultAction: { title: '今晚只踢 3 次固定球', steps: ['把球放在墙边固定住。', '牵着孩子轻轻踢。', '踢 3 次就结束。'] }
      },
      {
        key: 'age_2_3_imitation_movement_hard',
        categoryKey: 'motor_fitness',
        title: '模仿身体动作很吃力',
        description: '拍手、蹲下、抬脚这类动作看了也跟不上。',
        observableSigns: ['看着不动', '动作慢很多', '做一个动作就跑'],
        abilityTags: ['模仿动作', '动作计划', '身体感知'],
        sceneKey: 'age_2_3_movement_imitation_support',
        symptoms: [],
        defaultBottleneck: { title: '先选孩子已经会的一个动作', text: '模仿身体动作要先成功一次，再慢慢换动作。' },
        defaultAction: { title: '今晚只模仿蹲一下', steps: ['大人慢慢蹲一下。', '扶着孩子蹲一下。', '完成一次就马上结束。'] }
      },
      {
        key: 'age_2_3_fine_motor_tired',
        categoryKey: 'motor_fitness',
        title: '手部小动作很快累',
        description: '捏、插、撕、翻页等动作做一会儿就放弃。',
        observableSigns: ['捏不住小物', '翻页一次翻很多张', '拼插很快烦'],
        abilityTags: ['精细动作', '手部力量', '手眼协调'],
        sceneKey: 'age_2_3_fine_motor_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低手部动作阻力', text: '低龄精细动作先从大一点、容易抓的材料开始。' },
        defaultAction: { title: '今晚只捏 3 次大纸团', steps: ['准备一张软纸。', '让孩子捏成团。', '捏 3 次就结束。'] }
      },
      {
        key: 'age_2_3_body_awareness_bumps',
        categoryKey: 'motor_fitness',
        title: '总撞到人或家具',
        description: '走跑玩耍时不太知道身体和周围的距离。',
        observableSigns: ['经过会撞到桌角', '靠人太近', '转身碰倒东西'],
        abilityTags: ['身体边界', '本体觉', '空间感'],
        sceneKey: 'age_2_3_body_awareness_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立身体外面的安全距离', text: '孩子需要通过可见距离理解身体边界。' },
        defaultAction: { title: '今晚只走枕头旁边小路', steps: ['用两个枕头摆一条小路。', '让孩子慢慢从中间走过。', '碰到枕头就重新走一次。'] }
      },
      {
        key: 'age_2_3_points_instead_words',
        categoryKey: 'social_expression',
        title: '想要东西只会用手指',
        description: '有需求时常指、拉大人，很少主动说出来。',
        observableSigns: ['指着东西嗯嗯', '拉大人过去', '不说物品名字'],
        abilityTags: ['需求表达', '语言表达', '共同注意'],
        sceneKey: 'age_2_3_point_to_word_support',
        symptoms: [],
        defaultBottleneck: { title: '先把手指动作接成一个词', text: '孩子已经会表达方向，下一步是让动作和一个词连起来。' },
        defaultAction: { title: '今晚只等一个物品词', steps: ['孩子指东西时先蹲下。', '大人说一次名称。', '等孩子发一个近似音再给。'] }
      },
      {
        key: 'age_2_3_cries_instead_request',
        categoryKey: 'social_expression',
        title: '着急就哭不说需求',
        description: '想要、不要或需要帮忙时很快哭起来。',
        observableSigns: ['先哭再拉人', '哭时说不出要什么', '被问就更急'],
        abilityTags: ['需求表达', '情绪表达', '语言组织'],
        sceneKey: 'age_2_3_cry_to_request_support',
        symptoms: [],
        defaultBottleneck: { title: '先替孩子说出一个需求词', text: '情绪上来后语言会断，先由大人把需求词递给孩子。' },
        defaultAction: { title: '今晚只提示帮忙这个词', steps: ['孩子哭时先说你要帮忙。', '停 3 秒。', '孩子点头或发音后再帮。'] }
      },
      {
        key: 'age_2_3_peer_join_watches',
        categoryKey: 'social_expression',
        title: '想和小朋友玩但只在旁边看',
        description: '看到同伴活动会靠近，但不知道怎么加入。',
        observableSigns: ['站旁边看', '跟着走但不开口', '要大人带过去'],
        abilityTags: ['同伴加入', '社交安全感', '表达萌芽'],
        sceneKey: 'age_2_3_peer_join_support',
        symptoms: [],
        defaultBottleneck: { title: '先给孩子一个很短的加入动作', text: '2-3岁加入同伴先从递一个东西、做一次动作开始。' },
        defaultAction: { title: '今晚只练递一个球', steps: ['大人扮演小朋友。', '让孩子把球递过去。', '对方接住后说谢谢。'] }
      },
      {
        key: 'age_2_3_refuse_without_words',
        categoryKey: 'social_expression',
        title: '不想要时只推开或哭',
        description: '被递东西、被邀请或被帮忙时，不会用话拒绝。',
        observableSigns: ['推开大人的手', '扭头躲开', '不愿意就哭'],
        abilityTags: ['拒绝表达', '身体边界', '情绪表达'],
        sceneKey: 'age_2_3_refuse_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先给拒绝一个安全句式', text: '孩子会推开，说明有边界感，需要把动作换成简单表达。' },
        defaultAction: { title: '今晚只练不要加摆手', steps: ['大人递一个不想要的东西。', '示范说不要并摆手。', '孩子摆手或说不要就收回。'] }
      },
      {
        key: 'age_2_3_parent_child_play_short',
        categoryKey: 'social_expression',
        title: '亲子互动很快断掉',
        description: '一起玩时很快自己走开，互动来回少。',
        observableSigns: ['玩一下就背过身', '不等大人回应', '很少轮流一次'],
        abilityTags: ['亲子互动', '轮流回应', '共同注意'],
        sceneKey: 'age_2_3_parent_child_turn_support',
        symptoms: [],
        defaultBottleneck: { title: '先把互动缩成一来一回', text: '低龄亲子互动先练一次轮到你、一次轮到我。' },
        defaultAction: { title: '今晚只滚球来回 3 次', steps: ['大人把球滚给孩子。', '等孩子滚回来。', '来回 3 次就结束。'] }
      },
      {
        key: 'age_2_3_name_response_weak',
        categoryKey: 'social_expression',
        title: '叫名字时回应少',
        description: '叫孩子名字时不看人，或需要叫很多遍才转头。',
        observableSigns: ['叫名字不回头', '看玩具不看人', '需要靠近才反应'],
        abilityTags: ['回应能力', '共同注意', '听说配合'],
        sceneKey: 'age_2_3_name_response_support',
        symptoms: [],
        defaultBottleneck: { title: '先让名字和愉快回应连起来', text: '名字回应要在轻松场景里练，减少命令感。' },
        defaultAction: { title: '今晚只叫名字递玩具 3 次', steps: ['拿孩子喜欢的玩具。', '轻声叫名字。', '孩子看过来就递给他。'] }
      },
      {
        key: 'age_2_3_follow_adult_gaze_hard',
        categoryKey: 'social_expression',
        title: '不太跟着大人看东西',
        description: '大人指向窗外、书页或玩具时，孩子很少跟着看。',
        observableSigns: ['看大人的手不看物品', '不顺着指向看', '需要把东西拿到眼前'],
        abilityTags: ['共同注意', '视觉跟随', '亲子互动'],
        sceneKey: 'age_2_3_joint_attention_support',
        symptoms: [],
        defaultBottleneck: { title: '先练从大人手指看到一个物品', text: '共同注意是语言和社交的基础，先从距离很近的指认开始。' },
        defaultAction: { title: '今晚只指一个小车', steps: ['把小车放在孩子旁边。', '大人指着说小车。', '孩子看一眼就让小车动起来。'] }
      },
      {
        key: 'age_2_3_simple_choice_no_words',
        categoryKey: 'social_expression',
        title: '二选一也很少开口',
        description: '问要苹果还是香蕉时，常沉默、哭或直接拿。',
        observableSigns: ['直接伸手拿', '不说选择', '被问多了就急'],
        abilityTags: ['选择表达', '需求表达', '语言启动'],
        sceneKey: 'age_2_3_choice_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先让选择变成可见的两个东西', text: '孩子看见实物时更容易从动作过渡到一个词。' },
        defaultAction: { title: '今晚只问苹果还是香蕉', steps: ['把两个东西放眼前。', '只问苹果还是香蕉。', '孩子说一个字或指一个后，大人重复完整词。'] }
      }
    ]
  },
  {
    key: 'age_3_4',
    label: '3-4岁',
    title: '先看感统、规则和专注萌芽',
    subtitle: '看孩子能不能听懂简单规则，并在课堂或游戏里停下来。',
    focusAreas: ['感统基础', '规则萌芽', '专注萌芽', '入园适应'],
    parentSummary: '这个阶段家长最常遇到坐不住、听不进指令、排队困难和情绪来得快。',
    painPoints: [
      {
        key: 'cannot_sit_still',
        categoryKey: 'attention_learning',
        title: '坐不住总想跑',
        description: '活动或课堂中很难停下来，几分钟就想离开。',
        observableSigns: ['坐下很快起身', '喜欢跑来跑去', '安静活动坚持短'],
        abilityTags: ['感统基础', '身体刹车', '专注萌芽'],
        sceneKey: 'sensory_regulation_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看身体刹车能力', text: '孩子可能还不会从动的状态切到停的状态，需要先给身体一个短出口。' },
        defaultAction: { title: '今晚先做 5 次停走游戏', steps: ['大人说走，孩子走 3 步。', '大人说停，孩子停住。', '完成 5 次就结束。'] }
      },
      {
        key: 'simple_instruction_missed',
        categoryKey: 'attention_learning',
        title: '听不进简单指令',
        description: '叫他收玩具、排队、坐好时常像没听见。',
        observableSigns: ['叫名字反应慢', '指令要重复多次', '做一半就忘'],
        abilityTags: ['规则理解', '听觉注意', '执行动作'],
        sceneKey: 'instruction_following',
        symptoms: [],
        defaultBottleneck: { title: '先把指令缩短到一个动作', text: '孩子可能听到了，但指令太长时不知道先做哪一步。' },
        defaultAction: { title: '今晚只给一个动作指令', steps: ['只说：把积木放盒子。', '等孩子完成。', '完成后再给第二个动作。'] }
      },
      {
        key: 'class_queue_uncooperative',
        categoryKey: 'emotion_rules',
        title: '排队课堂不配合',
        description: '排队、坐圈圈、等老师讲话时容易乱跑。',
        observableSigns: ['排队离开队伍', '坐圈圈乱动', '老师讲规则时跑开'],
        abilityTags: ['入园适应', '规则理解', '集体配合'],
        sceneKey: 'classroom_rule_adaptation',
        symptoms: [],
        defaultBottleneck: { title: '先看集体规则是否太抽象', text: '孩子需要把规则变成看得见的动作，才更容易跟上集体。' },
        defaultAction: { title: '今晚只练站在线后面', steps: ['在地上贴一条线。', '让孩子站在线后面 5 秒。', '做到后马上结束。'] }
      },
      {
        key: 'bumps_and_grabs',
        categoryKey: 'motor_fitness',
        title: '容易撞人抢东西',
        description: '靠近别人时力量大，想要玩具就直接拿。',
        observableSigns: ['靠近同伴会撞到', '直接拿别人玩具', '推人后不知道错'],
        abilityTags: ['身体边界', '冲动控制', '社交萌芽'],
        sceneKey: 'body_boundary_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先建立身体边界感', text: '孩子可能还不知道身体和别人之间需要留距离。' },
        defaultAction: { title: '今晚练一臂距离', steps: ['大人伸出一只手臂。', '让孩子站在手碰不到的位置。', '再练说：我想玩。'] }
      },
      {
        key: 'emotion_escalates_fast',
        categoryKey: 'emotion_rules',
        title: '情绪一上来就崩',
        description: '小事不顺就哭闹，停不下来。',
        observableSigns: ['一不如意就哭', '哭闹持续久', '安抚后还反复'],
        abilityTags: ['情绪调节', '安全感', '规则理解'],
        sceneKey: 'emotion_regulation_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先帮孩子把情绪降下来', text: '这个年龄段先需要大人协助降温，再谈规则和道理。' },
        defaultAction: { title: '今晚先用一句情绪命名', steps: ['孩子哭时先说：你很着急。', '停 5 秒。', '再给一个选择：抱一下还是喝水。'] }
      },
      {
        key: 'age_3_4_circle_time_wiggles',
        categoryKey: 'attention_learning',
        title: '坐圈圈总扭来扭去',
        description: '集体活动坐下后身体一直动，很难跟住老师或大人的节奏。',
        observableSigns: ['坐下后扭身体', '摸旁边小朋友', '老师讲时东张西望'],
        abilityTags: ['专注萌芽', '身体刹车', '集体注意'],
        sceneKey: 'age_3_4_circle_time_attention_support',
        symptoms: [],
        defaultBottleneck: { title: '先看身体有没有短暂停住的机会', text: '3-4岁坐圈圈需要身体先停下来，再慢慢听进去规则。' },
        defaultAction: { title: '今晚只练坐小垫子 30 秒', steps: ['放一个小垫子。', '让孩子坐上去听大人说两句话。', '30 秒到就马上结束。'] }
      },
      {
        key: 'age_3_4_activity_persistence_short',
        categoryKey: 'attention_learning',
        title: '短活动坚持不下来',
        description: '拼图、积木、涂色等活动刚开始就想换。',
        observableSigns: ['玩一分钟就换', '做到一半跑开', '需要大人一直陪'],
        abilityTags: ['短活动坚持', '持续注意', '任务完成'],
        sceneKey: 'age_3_4_short_activity_support',
        symptoms: [],
        defaultBottleneck: { title: '先把活动缩成能完成的一小段', text: '孩子可能能专注，但当前活动长度超过了他的坚持能力。' },
        defaultAction: { title: '今晚只完成 4 块拼图', steps: ['只拿出 4 块拼图。', '陪孩子完成这 4 块。', '完成后说这次结束了。'] }
      },
      {
        key: 'age_3_4_rule_game_confused',
        categoryKey: 'attention_learning',
        title: '游戏规则听了也不懂',
        description: '轮流、颜色分类、按指令做动作时容易乱。',
        observableSigns: ['听完就按自己想法玩', '轮到谁分不清', '规则说两遍还乱'],
        abilityTags: ['规则理解', '听觉注意', '游戏学习'],
        sceneKey: 'age_3_4_rule_game_attention_support',
        symptoms: [],
        defaultBottleneck: { title: '先把规则缩成一个动作', text: '规则多了孩子容易听散，先只练一个最关键动作。' },
        defaultAction: { title: '今晚只玩红色放盒子', steps: ['拿出两种颜色积木。', '只说红色放盒子。', '放对 3 个就结束。'] }
      },
      {
        key: 'age_3_4_story_listening_drifts',
        categoryKey: 'attention_learning',
        title: '听故事听着听着就跑神',
        description: '故事还没讲完，孩子已经看别处或开始玩别的。',
        observableSigns: ['眼睛离开书', '问内容答不上', '翻到别的页'],
        abilityTags: ['听觉注意', '绘本理解', '持续注意'],
        sceneKey: 'age_3_4_story_listening_support',
        symptoms: [],
        defaultBottleneck: { title: '先把故事信息缩到一页一问', text: '孩子听故事跑神时，先让他抓住一个角色或动作。' },
        defaultAction: { title: '今晚只听一页找主角', steps: ['只讲一页。', '问这里有谁。', '孩子指出或说出后就结束。'] }
      },
      {
        key: 'age_3_4_name_called_no_shift',
        categoryKey: 'attention_learning',
        title: '叫名字后很难转回任务',
        description: '玩得投入时叫名字，常常没有反应或反应很慢。',
        observableSigns: ['叫几遍才回头', '听到也继续玩', '回头后又忘了要做什么'],
        abilityTags: ['注意转移', '听觉注意', '任务切换'],
        sceneKey: 'age_3_4_name_shift_support',
        symptoms: [],
        defaultBottleneck: { title: '先练听到名字后看一眼', text: '注意转移要从当前活动切出来，先建立名字和看向大人的连接。' },
        defaultAction: { title: '今晚只练叫名看一眼', steps: ['孩子玩时轻声叫名字。', '孩子看过来就递一个小物。', '练 3 次就结束。'] }
      },
      {
        key: 'age_3_4_group_instruction_missed',
        categoryKey: 'attention_learning',
        title: '集体指令总跟不上',
        description: '老师或大人说大家一起做时，孩子常慢半拍。',
        observableSigns: ['别人开始了他还没动', '要单独提醒', '看别人做才跟'],
        abilityTags: ['入园适应', '集体注意', '听觉注意', '执行动作'],
        sceneKey: 'age_3_4_group_instruction_support',
        symptoms: [],
        defaultBottleneck: { title: '先把集体指令变成可见动作', text: '孩子在集体里容易漏听，需要用一个动作帮他跟上。' },
        defaultAction: { title: '今晚练听到拍手就站线后', steps: ['在地上贴一条线。', '大人拍手一次。', '孩子站到线后 5 秒。'] }
      },
      {
        key: 'age_3_4_table_task_fidgets',
        categoryKey: 'attention_learning',
        title: '桌面小任务小动作很多',
        description: '画画、贴纸、拼插时手脚不停，很难看住当前材料。',
        observableSigns: ['摸旁边东西', '坐着踢腿', '材料还没做完就乱翻'],
        abilityTags: ['桌面注意', '身体控制', '任务参与'],
        sceneKey: 'age_3_4_table_task_support',
        symptoms: [],
        defaultBottleneck: { title: '先减少桌面干扰和任务数量', text: '桌面材料太多会拉走注意力，先只留当前一步。' },
        defaultAction: { title: '今晚只贴 3 张贴纸', steps: ['桌上只放 3 张贴纸。', '每次只递 1 张。', '贴完 3 张就结束。'] }
      },
      {
        key: 'age_3_4_finish_last_step_hard',
        categoryKey: 'attention_learning',
        title: '最后一步总收不回来',
        description: '活动快结束时分心、乱跑或不愿做收尾动作。',
        observableSigns: ['最后一步跑开', '不愿收材料', '结束时还去拿新的'],
        abilityTags: ['任务收尾', '完成闭环', '规则理解'],
        sceneKey: 'age_3_4_finish_last_step_support',
        symptoms: [],
        defaultBottleneck: { title: '先让最后一步变得很清楚', text: '孩子知道最后一步是什么，才更容易完成活动闭环。' },
        defaultAction: { title: '今晚只做放回盒子这一步', steps: ['活动前准备一个盒子。', '结束时只让孩子放回 1 个材料。', '放好后说完成了。'] }
      },
      {
        key: 'age_3_4_wait_turn_cries',
        categoryKey: 'emotion_rules',
        title: '轮到别人就哭闹',
        description: '玩游戏、拿玩具或排队时，一等别人先来就急。',
        observableSigns: ['插到前面', '哭着说我要先', '别人拿到就抢'],
        abilityTags: ['等待轮流', '冲动控制', '规则理解'],
        sceneKey: 'age_3_4_turn_wait_support',
        symptoms: [],
        defaultBottleneck: { title: '先把等待缩到一个很短轮次', text: '3-4岁等待需要看得见的轮到自己，先从一次轮流开始。' },
        defaultAction: { title: '今晚只等大人玩一次', steps: ['大人先放一个积木。', '孩子等 5 秒。', '马上轮到孩子放一个。'] }
      },
      {
        key: 'age_3_4_activity_switch_meltdown',
        categoryKey: 'emotion_rules',
        title: '转换活动时情绪很大',
        description: '从玩到吃饭、洗澡、出门或上课时明显抗拒。',
        observableSigns: ['听到要换就躲', '抱着玩具不放', '哭闹拖很久'],
        abilityTags: ['转换活动', '流程意识', '情绪调节'],
        sceneKey: 'age_3_4_activity_switch_support',
        symptoms: [],
        defaultBottleneck: { title: '先给活动切换一个可见预告', text: '孩子被突然切换时容易失控，需要提前知道最后一步。' },
        defaultAction: { title: '今晚用最后一轮再换', steps: ['提前说最后一轮。', '陪孩子完成这一轮。', '结束后一起把材料放回盒子。'] }
      },
      {
        key: 'age_3_4_toy_grab_rule_hard',
        categoryKey: 'emotion_rules',
        title: '看到喜欢的玩具就直接抢',
        description: '想要同伴手里的东西时，很难先问或等。',
        observableSigns: ['直接伸手拿', '被挡住就哭', '拿到后不还'],
        abilityTags: ['规则理解', '冲动控制', '物权意识'],
        sceneKey: 'age_3_4_toy_grab_rule_support',
        symptoms: [],
        defaultBottleneck: { title: '先把抢换成一句短请求', text: '孩子想要很强时，需要一个能马上用的替代表达。' },
        defaultAction: { title: '今晚只练我玩一下', steps: ['大人拿着玩具。', '孩子说我玩一下。', '大人给他玩 10 秒再收回。'] }
      },
      {
        key: 'age_3_4_rule_no_accept',
        categoryKey: 'emotion_rules',
        title: '规则一说就不要',
        description: '听到先收玩具、先排队、先洗手这类规则就反抗。',
        observableSigns: ['说我不要', '跑开不做', '越解释越哭'],
        abilityTags: ['规则理解', '边界感', '情绪安全'],
        sceneKey: 'age_3_4_simple_rule_accept_support',
        symptoms: [],
        defaultBottleneck: { title: '先让规则变成可选择的两个动作', text: '孩子直接抗拒规则时，二选一能降低对抗。' },
        defaultAction: { title: '今晚只给两个规则选项', steps: ['说先收车还是先收积木。', '孩子选一个。', '只完成这一个动作。'] }
      },
      {
        key: 'age_3_4_losing_game_upset',
        categoryKey: 'emotion_rules',
        title: '小游戏输了就不玩',
        description: '轮流游戏、比赛或猜拳输了就哭、改规则或退出。',
        observableSigns: ['输了就走开', '说不算', '哭着要求重来'],
        abilityTags: ['挫折承受', '规则理解', '情绪恢复'],
        sceneKey: 'age_3_4_losing_game_support',
        symptoms: [],
        defaultBottleneck: { title: '先练很小的输了也能继续', text: '输赢情绪需要从可承受的小失败开始。' },
        defaultAction: { title: '今晚让大人先输一次', steps: ['大人先输一次。', '说输了也可以再来。', '再让孩子玩一轮。'] }
      },
      {
        key: 'age_3_4_new_place_freezes',
        categoryKey: 'emotion_rules',
        title: '到新地方就放不开',
        description: '新教室、新老师、新活动前紧张，抱着大人不动。',
        observableSigns: ['躲在大人身后', '不愿进门', '不敢回应老师'],
        abilityTags: ['入园适应', '环境适应', '安全感'],
        sceneKey: 'age_3_4_new_place_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立进入新环境的固定动作', text: '孩子先确认安全，才更容易探索新空间。' },
        defaultAction: { title: '今晚练进门先看三样东西', steps: ['进门前抱一下。', '一起找灯、门、椅子。', '找到三样就先停要求。'] }
      },
      {
        key: 'age_3_4_reminded_feels_wronged',
        categoryKey: 'emotion_rules',
        title: '一被提醒就委屈',
        description: '普通提醒也容易哭、低头或说你不喜欢我。',
        observableSigns: ['被提醒马上哭', '低头不说话', '拒绝继续做'],
        abilityTags: ['情绪安全', '规则接受', '自尊感'],
        sceneKey: 'age_3_4_reminder_safety_support',
        symptoms: [],
        defaultBottleneck: { title: '先把提醒改成下一步动作', text: '孩子把提醒理解成批评时，需要听见具体下一步。' },
        defaultAction: { title: '今晚只提醒下一步', steps: ['不说你又错了。', '只说下一步放盒子。', '完成后说你做到这一步了。'] }
      },
      {
        key: 'age_3_4_morning_queue_flow_chaos',
        categoryKey: 'emotion_rules',
        title: '早上出门流程总乱',
        description: '穿衣、洗漱、拿包、出门一步步都要催，情绪容易上来。',
        observableSigns: ['每一步都拖', '漏拿东西', '越催越哭'],
        abilityTags: ['生活流程', '规则理解', '情绪调节'],
        sceneKey: 'age_3_4_morning_flow_support',
        symptoms: [],
        defaultBottleneck: { title: '先把早晨流程变成三步', text: '流程太散会让孩子和家长都急，先只固定前三步。' },
        defaultAction: { title: '今晚排好明早三步', steps: ['写下穿衣、洗脸、拿包。', '让孩子选第一步贴星星。', '明早只从第一步开始。'] }
      },
      {
        key: 'age_3_4_balance_beam_wobbly',
        categoryKey: 'motor_fitness',
        title: '走窄路身体晃',
        description: '走直线、走路沿或小平衡木时身体不稳。',
        observableSigns: ['走线容易踩出去', '转身会晃', '需要牵手才敢走'],
        abilityTags: ['平衡能力', '前庭觉', '身体控制'],
        sceneKey: 'age_3_4_balance_beam_support',
        symptoms: [],
        defaultBottleneck: { title: '先看慢速平衡能不能稳住', text: '3-4岁平衡要从低高度、短距离开始，先让身体找到中线。' },
        defaultAction: { title: '今晚走 5 次地贴线', steps: ['在地上贴一条直线。', '孩子慢慢走 5 步。', '完成 5 次就结束。'] }
      },
      {
        key: 'age_3_4_two_foot_jump_heavy',
        categoryKey: 'motor_fitness',
        title: '双脚跳落地很重',
        description: '跳起和落地时控制弱，声音大或容易蹲坐。',
        observableSigns: ['落地砰一声', '双脚不同步', '跳完坐到地上'],
        abilityTags: ['跳跃力量', '下肢控制', '本体觉'],
        sceneKey: 'age_3_4_two_foot_jump_support',
        symptoms: [],
        defaultBottleneck: { title: '先练小高度软落地', text: '跳跃控制需要下肢力量和身体感觉一起参与，先把高度降下来。' },
        defaultAction: { title: '今晚只跳过一条毛巾', steps: ['把毛巾卷成低线。', '孩子双脚跳过去。', '提醒落地像小猫一样轻。'] }
      },
      {
        key: 'age_3_4_run_stop_crashes',
        categoryKey: 'motor_fitness',
        title: '跑起来停不住',
        description: '追逐、跑步或游戏中刹车慢，常撞到人或家具。',
        observableSigns: ['停下时冲过头', '转弯撞到', '越跑越兴奋'],
        abilityTags: ['跑停控制', '身体刹车', '前庭觉'],
        sceneKey: 'age_3_4_run_stop_support',
        symptoms: [],
        defaultBottleneck: { title: '先把跑停变成短距离信号', text: '孩子需要练习身体从动到停的切换，距离越短越容易成功。' },
        defaultAction: { title: '今晚玩 3 步红绿灯', steps: ['孩子只跑 3 步。', '大人说红灯就停。', '停住 2 秒再继续。'] }
      },
      {
        key: 'age_3_4_stairs_alternating_hard',
        categoryKey: 'motor_fitness',
        title: '上下台阶总要并步',
        description: '上下楼梯习惯一脚上一阶后另一脚跟上，交替脚困难。',
        observableSigns: ['抓扶手很紧', '只用同一只脚先上', '下楼特别慢'],
        abilityTags: ['上下台阶', '下肢力量', '动作计划'],
        sceneKey: 'age_3_4_stairs_alternating_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一阶交替脚', text: '交替脚需要力量和平衡配合，先在安全低台阶上练一阶。' },
        defaultAction: { title: '今晚只练一阶换脚', steps: ['站在低台阶前。', '大人示范左脚上、右脚上。', '孩子练 3 次就结束。'] }
      },
      {
        key: 'age_3_4_ball_catch_avoid',
        categoryKey: 'motor_fitness',
        title: '接球时会躲开',
        description: '球滚来或抛来时，孩子害怕、闭眼或用身体躲。',
        observableSigns: ['球来就退后', '闭眼伸手', '接不到就不玩'],
        abilityTags: ['手眼协调', '球类基础', '运动信心'],
        sceneKey: 'age_3_4_ball_catch_support',
        symptoms: [],
        defaultBottleneck: { title: '先用滚接降低害怕', text: '球类先从地面滚接开始，让眼睛和手慢慢配合。' },
        defaultAction: { title: '今晚只滚接大球 5 次', steps: ['两人坐地面对面。', '大人慢慢滚球。', '孩子用两手抱住球。'] }
      },
      {
        key: 'age_3_4_climb_ladder_unsure',
        categoryKey: 'motor_fitness',
        title: '攀爬架上手脚乱',
        description: '爬梯子、攀爬架或软垫坡时不知道手脚怎么配合。',
        observableSigns: ['脚找不到位置', '手抓住不敢动', '需要大人托着'],
        abilityTags: ['攀爬协调', '动作计划', '身体控制'],
        sceneKey: 'age_3_4_climb_ladder_support',
        symptoms: [],
        defaultBottleneck: { title: '先让手脚顺序变慢', text: '攀爬难常在手脚顺序乱，先降低速度和高度。' },
        defaultAction: { title: '今晚练沙发垫小爬坡', steps: ['把软垫靠在沙发边。', '孩子手先放上去再迈脚。', '爬 3 次就结束。'] }
      },
      {
        key: 'age_3_4_core_sitting_slumps',
        categoryKey: 'motor_fitness',
        title: '坐着很快趴下',
        description: '画画、吃饭或听故事时身体撑不住，容易趴桌或靠人。',
        observableSigns: ['坐一会就趴', '身体歪到一边', '需要靠着椅背'],
        abilityTags: ['核心稳定', '坐姿控制', '体态基础'],
        sceneKey: 'age_3_4_core_sitting_support',
        symptoms: [],
        defaultBottleneck: { title: '先看核心能不能短时间撑住', text: '坐姿塌常和核心稳定有关，先练短时间身体支撑。' },
        defaultAction: { title: '今晚做 3 次小飞机趴', steps: ['孩子趴在垫子上。', '双手向前抬 3 秒。', '休息后再做 2 次。'] }
      },
      {
        key: 'age_3_4_fine_motor_pinches_tired',
        categoryKey: 'motor_fitness',
        title: '捏贴纸扣扣子很费劲',
        description: '贴纸、夹子、扣子、穿珠等小动作容易累或放弃。',
        observableSigns: ['撕贴纸撕破', '夹子夹不开', '穿珠很快不玩'],
        abilityTags: ['精细动作', '手部力量', '手眼协调'],
        sceneKey: 'age_3_4_fine_motor_pinch_support',
        symptoms: [],
        defaultBottleneck: { title: '先练两指捏和放', text: '精细动作需要手指力量和眼手配合，先从大材料开始。' },
        defaultAction: { title: '今晚夹 5 个大绒球', steps: ['准备夹子和大绒球。', '孩子夹起放进碗里。', '完成 5 个就结束。'] }
      },
      {
        key: 'age_3_4_after_running_cannot_settle',
        categoryKey: 'motor_fitness',
        title: '跑完很久静不下来',
        description: '运动或疯跑后兴奋很久，难回到吃饭、洗漱或睡前状态。',
        observableSigns: ['跑完还尖叫', '停下后还跳', '越累越兴奋'],
        abilityTags: ['体能恢复', '身体觉察', '情绪调节'],
        sceneKey: 'age_3_4_movement_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先给身体一个降速动作', text: '运动后恢复慢时，需要从快动作过渡到慢动作。' },
        defaultAction: { title: '今晚跑后做 5 次慢推墙', steps: ['孩子双手推墙。', '慢慢用力 3 秒。', '做 5 次后喝水坐下。'] }
      },
      {
        key: 'age_3_4_need_words_missing',
        categoryKey: 'social_expression',
        title: '想要东西说不出来',
        description: '有需求时常拉大人、指东西或哭，很难说出自己想要什么。',
        observableSigns: ['拉着大人走', '用手指不说', '说不出就急哭'],
        abilityTags: ['需求表达', '语言组织', '情绪表达'],
        sceneKey: 'age_3_4_need_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先给孩子一句能直接用的话', text: '3-4岁表达需求时，需要一个短句模板帮他把想法说出来。' },
        defaultAction: { title: '今晚只练我要这个', steps: ['孩子想拿东西时先停 2 秒。', '大人示范说我要这个。', '孩子跟说或补一个词后再给。'] }
      },
      {
        key: 'age_3_4_story_sequence_messy',
        categoryKey: 'social_expression',
        title: '讲事情前后乱',
        description: '说幼儿园、玩耍或冲突经历时顺序混乱，大人很难听懂。',
        observableSigns: ['说半句换话题', '先后顺序颠倒', '需要大人一直猜'],
        abilityTags: ['叙事表达', '事件顺序', '语言组织'],
        sceneKey: 'age_3_4_story_sequence_support',
        symptoms: [],
        defaultBottleneck: { title: '先用两张图帮孩子排顺序', text: '孩子讲事情乱时，先用看得见的先后顺序降低表达难度。' },
        defaultAction: { title: '今晚只讲先后两步', steps: ['拿两张日常照片。', '问先做哪一个。', '让孩子用先、再说一句。'] }
      },
      {
        key: 'age_3_4_peer_join_silent',
        categoryKey: 'social_expression',
        title: '想加入同伴只会站旁边',
        description: '看到别人玩很想参与，却不开口或只跟着跑。',
        observableSigns: ['站旁边看很久', '跟着跑但不说', '等大人帮忙开口'],
        abilityTags: ['同伴加入', '社交安全感', '表达信心'],
        sceneKey: 'age_3_4_peer_join_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句加入游戏的话', text: '孩子想加入但不知道怎么开口时，需要先练固定入口句。' },
        defaultAction: { title: '今晚只练我可以一起玩吗', steps: ['大人扮演小朋友。', '孩子说我可以一起玩吗。', '大人回答可以后一起玩 1 分钟。'] }
      },
      {
        key: 'age_3_4_conflict_cries_instead_words',
        categoryKey: 'social_expression',
        title: '发生冲突只会哭',
        description: '玩具被拿、被碰到或不愿意时，孩子常哭着找大人。',
        observableSigns: ['被抢就哭', '告状说不清', '不知道说不要'],
        abilityTags: ['冲突表达', '拒绝表达', '情绪调节'],
        sceneKey: 'age_3_4_conflict_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先把哭换成一句边界话', text: '冲突时孩子需要一条短句保护自己，再慢慢学会协商。' },
        defaultAction: { title: '今晚只练我还在玩', steps: ['大人假装要拿玩具。', '孩子说我还在玩。', '大人停手并说我等一下。'] }
      },
      {
        key: 'age_3_4_group_answer_whispers',
        categoryKey: 'social_expression',
        title: '集体里轮到他说就小声',
        description: '老师点名或集体提问时，孩子声音很小或低头不答。',
        observableSigns: ['低头不看人', '声音很小', '让大人代说'],
        abilityTags: ['集体表达', '表达信心', '入园适应'],
        sceneKey: 'age_3_4_group_answer_support',
        symptoms: [],
        defaultBottleneck: { title: '先从熟悉大人面前回应开始', text: '集体表达需要安全感和声音练习，先降低人数和压力。' },
        defaultAction: { title: '今晚只回答一个名字问题', steps: ['大人问你叫什么名字。', '孩子用正常声音回答。', '完成 3 次就结束。'] }
      },
      {
        key: 'age_3_4_adult_question_no_reply',
        categoryKey: 'social_expression',
        title: '大人问话常不回应',
        description: '别人问吃什么、玩什么、叫什么时，经常沉默或转开。',
        observableSigns: ['看别处不答', '只点头摇头', '躲到大人身后'],
        abilityTags: ['回应能力', '听说配合', '社交安全感'],
        sceneKey: 'age_3_4_adult_reply_support',
        symptoms: [],
        defaultBottleneck: { title: '先把问题变成二选一', text: '开放问题太难时，二选一能帮孩子更快回应。' },
        defaultAction: { title: '今晚只问苹果还是香蕉', steps: ['拿出两个真实物品。', '问要苹果还是香蕉。', '孩子指或说一个就结束。'] }
      },
      {
        key: 'age_3_4_emotion_words_few',
        categoryKey: 'social_expression',
        title: '不会说自己怎么了',
        description: '生气、害怕、委屈或累时，只用哭闹和行为表达。',
        observableSigns: ['只哭不说原因', '推开大人', '问怎么了说不知道'],
        abilityTags: ['情绪表达', '感受词', '自我觉察'],
        sceneKey: 'age_3_4_emotion_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先给情绪一个名字', text: '孩子说不出感受时，大人先提供词，再让孩子选择。' },
        defaultAction: { title: '今晚只选一个情绪词', steps: ['孩子不舒服时说你是生气还是害怕。', '孩子选一个。', '大人复述你现在很生气。'] }
      },
      {
        key: 'age_3_4_cooperation_play_breaks',
        categoryKey: 'social_expression',
        title: '合作游戏很快散掉',
        description: '一起搭积木、过家家或规则游戏时，各玩各的或争主导。',
        observableSigns: ['只按自己想法玩', '不听同伴建议', '一起玩很快吵'],
        abilityTags: ['合作游戏', '轮流表达', '规则理解'],
        sceneKey: 'age_3_4_cooperation_play_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一人一步的合作', text: '合作要从很短的轮流动作开始，先建立你一步我一步。' },
        defaultAction: { title: '今晚轮流搭 6 块积木', steps: ['大人放一块。', '孩子放一块。', '轮流到 6 块就结束。'] }
      },
      {
        key: 'age_3_4_family_chat_one_word',
        categoryKey: 'social_expression',
        title: '回家聊天只说一个字',
        description: '问幼儿园玩了什么、吃了什么，孩子常只说嗯、没有、不知道。',
        observableSigns: ['问一句答一个字', '很快转移话题', '需要大人猜内容'],
        abilityTags: ['亲子沟通', '经验回忆', '叙事表达'],
        sceneKey: 'age_3_4_family_chat_support',
        symptoms: [],
        defaultBottleneck: { title: '先用具体场景打开话题', text: '泛泛地问一天怎么样太抽象，具体到吃饭或游戏更容易说。' },
        defaultAction: { title: '今晚只问一个吃饭问题', steps: ['问今天吃饭有汤还是水果。', '孩子说一个。', '大人接一句我知道了。'] }
      },
      {
        key: 'age_3_4_new_person_hides',
        categoryKey: 'social_expression',
        title: '见新老师新朋友就躲',
        description: '面对陌生老师、亲戚或小朋友时躲在大人身后。',
        observableSigns: ['不看对方', '抓着大人衣服', '让大人替他说'],
        abilityTags: ['社交安全感', '表达信心', '环境适应'],
        sceneKey: 'age_3_4_new_person_support',
        symptoms: [],
        defaultBottleneck: { title: '先允许孩子用一个小动作回应', text: '面对新人时先用动作建立安全，再逐步过渡到语言。' },
        defaultAction: { title: '今晚只练挥手打招呼', steps: ['大人扮演新老师。', '孩子只需要挥手。', '挥手后马上回到大人身边。'] }
      }
    ]
  },
  {
    key: 'age_4_5',
    label: '4-5岁',
    title: '重点看专注力和身体控制',
    subtitle: '看孩子能不能跟住规则、控制身体，并把想法说清楚。',
    focusAreas: ['专注力', '身体控制', '表达配合', '情绪调节'],
    parentSummary: '这个阶段家长最常担心孩子坚持时间短、动作协调差、表达不清和遇到输赢就急。',
    painPoints: [
      {
        key: 'short_attention_play',
        categoryKey: 'attention_learning',
        title: '玩什么都坚持不了多久',
        description: '玩具、游戏、任务很快换，难以持续完成。',
        observableSigns: ['玩一会就换', '任务做到一半跑开', '需要大人一直提醒'],
        abilityTags: ['专注力', '任务持续', '身体控制'],
        sceneKey: 'focus_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看任务长度是否超过当前专注', text: '孩子可能能专注，只是当前活动持续时间太长。' },
        defaultAction: { title: '今晚只做 3 分钟完成游戏', steps: ['选一个简单拼图或积木任务。', '计时 3 分钟。', '时间到就结束并肯定完成。'] }
      },
      {
        key: 'coordination_clumsy',
        categoryKey: 'motor_fitness',
        title: '动作协调差',
        description: '跑跳、接球、绕障碍时显得笨拙。',
        observableSigns: ['接球容易漏', '跑动容易撞', '跨越障碍不稳'],
        abilityTags: ['身体控制', '动作计划', '协调能力'],
        sceneKey: 'coordination_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看动作计划和身体协调', text: '协调差常见于身体还没学会按顺序完成动作。' },
        defaultAction: { title: '今晚走 5 次枕头小路', steps: ['把两个枕头放成小路。', '孩子慢慢走过去。', '完成 5 次就结束。'] }
      },
      {
        key: 'rule_game_breakdown',
        categoryKey: 'attention_learning',
        title: '规则游戏玩不下去',
        description: '一有规则就乱，轮流、等待和输赢都难。',
        observableSigns: ['不等轮到自己', '随意改规则', '输了就不玩'],
        abilityTags: ['规则理解', '等待轮流', '挫折承受'],
        sceneKey: 'rule_game_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先把规则缩到一个动作', text: '复杂规则对孩子来说太多，先只练一个最关键动作。' },
        defaultAction: { title: '今晚只玩一轮轮流游戏', steps: ['大人放一个积木。', '孩子放一个积木。', '轮流 3 次就结束。'] }
      },
      {
        key: 'expression_unclear',
        categoryKey: 'social_expression',
        title: '想说但说不清',
        description: '有想法但表达断断续续，别人听不明白。',
        observableSigns: ['说半句就急', '词不达意', '需要大人猜'],
        abilityTags: ['表达配合', '语言组织', '情绪调节'],
        sceneKey: 'expression_organization',
        symptoms: [],
        defaultBottleneck: { title: '先给表达一个句子框架', text: '孩子想表达但组织不出来时，需要一个简单句式帮他接住想法。' },
        defaultAction: { title: '今晚只练我想要一句话', steps: ['大人先说：我想要。', '让孩子补一个东西。', '补出来后大人复述完整句。'] }
      },
      {
        key: 'losing_triggers_tantrum',
        categoryKey: 'emotion_rules',
        title: '一输就哭或发脾气',
        description: '游戏输了、做错了就急，不愿继续。',
        observableSigns: ['输了哭', '做错扔东西', '不愿再试'],
        abilityTags: ['情绪调节', '挫折承受', '规则理解'],
        sceneKey: 'frustration_tolerance',
        symptoms: [],
        defaultBottleneck: { title: '先练小失败后的恢复', text: '孩子需要体验可承受的小失败，再慢慢学会继续。' },
        defaultAction: { title: '今晚玩一次故意输小游戏', steps: ['大人先输一次。', '说：输了也可以再来。', '让孩子只再试一次。'] }
      },
      {
        key: 'age_4_5_picture_book_drifts',
        categoryKey: 'attention_learning',
        title: '绘本看几页就跑神',
        description: '亲子阅读或听故事时，刚开始能看，很快开始翻页、看别处或离开。',
        observableSigns: ['看两页就走开', '问题答不上来', '不停翻到后面'],
        abilityTags: ['绘本阅读', '持续注意', '视觉追踪'],
        sceneKey: 'age_4_5_picture_book_attention_support',
        symptoms: [],
        defaultBottleneck: { title: '先把阅读目标缩到一页一件事', text: '4-5岁阅读专注先看能不能抓住一页里的角色或动作。' },
        defaultAction: { title: '今晚只读一页找动作', steps: ['只打开一页绘本。', '问这个人在做什么。', '孩子指出或说出后就结束。'] }
      },
      {
        key: 'age_4_5_drawing_task_half_done',
        categoryKey: 'attention_learning',
        title: '画画拼搭做到一半停',
        description: '画画、拼搭、贴纸等桌面任务能开始，但很难完成到最后。',
        observableSigns: ['画一半换别的', '拼搭没收尾', '材料摊着不管'],
        abilityTags: ['任务持续', '桌面注意', '动作计划'],
        sceneKey: 'age_4_5_drawing_task_support',
        symptoms: [],
        defaultBottleneck: { title: '先让任务有清楚终点', text: '孩子能开始但难收尾时，需要看得见的完成标准。' },
        defaultAction: { title: '今晚只画完 3 个圆', steps: ['纸上先画 3 个小圆。', '让孩子给 3 个圆涂色。', '涂完就说任务完成。'] }
      },
      {
        key: 'age_4_5_multi_step_craft_confused',
        categoryKey: 'attention_learning',
        title: '手工步骤一多就乱',
        description: '剪、贴、摆、收等步骤超过两个时，孩子容易漏做或顺序错。',
        observableSigns: ['跳过步骤', '拿错材料', '一直问下一步'],
        abilityTags: ['多步骤任务', '动作计划', '工作记忆'],
        sceneKey: 'age_4_5_multi_step_craft_support',
        symptoms: [],
        defaultBottleneck: { title: '先把多步骤拆成两张卡', text: '步骤多会占用记忆，先把顺序变成可见提示。' },
        defaultAction: { title: '今晚只做贴再收两步', steps: ['先贴一张贴纸。', '再把剩下贴纸放回盒子。', '只练这两步。'] }
      },
      {
        key: 'age_4_5_table_materials_distract',
        categoryKey: 'attention_learning',
        title: '桌上东西一多就分心',
        description: '桌面材料多时，孩子摸这个拿那个，很难看住当前任务。',
        observableSigns: ['翻材料盒', '拿无关玩具', '当前步骤忘了做'],
        abilityTags: ['选择性注意', '桌面管理', '任务参与'],
        sceneKey: 'age_4_5_table_materials_support',
        symptoms: [],
        defaultBottleneck: { title: '先减少桌面选择', text: '材料太多会不断拉走注意力，先让桌上只出现当前一步。' },
        defaultAction: { title: '今晚桌上只放 2 样材料', steps: ['桌上只留纸和笔。', '完成当前一步后再给贴纸。', '任务结束后一起收回。'] }
      },
      {
        key: 'age_4_5_start_after_prompt_slow',
        categoryKey: 'attention_learning',
        title: '提醒后还是启动慢',
        description: '已经说了开始画、开始收、开始搭，孩子还在磨蹭或发呆。',
        observableSigns: ['坐着不动', '反复问要做什么', '要催很多次才开始'],
        abilityTags: ['学习启动', '执行启动', '任务意识'],
        sceneKey: 'age_4_5_task_start_support',
        symptoms: [],
        defaultBottleneck: { title: '先把开始动作具体化', text: '孩子听到开始仍然慢时，可能不知道第一个动作是什么。' },
        defaultAction: { title: '今晚只说先拿起笔', steps: ['把纸和笔放好。', '只说先拿起笔。', '拿起后再说画一个圆。'] }
      },
      {
        key: 'age_4_5_cleanup_last_step_missed',
        categoryKey: 'attention_learning',
        title: '任务最后一步总漏掉',
        description: '活动快完成时，最后收材料、盖盖子、放回原位经常忘。',
        observableSigns: ['做完就跑', '材料留在桌上', '最后一步要大人补'],
        abilityTags: ['短任务收尾', '完成闭环', '自我检查'],
        sceneKey: 'age_4_5_cleanup_last_step_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立完成前的固定收尾', text: '最后一步漏掉时，需要把收尾变成任务的一部分。' },
        defaultAction: { title: '今晚只练盖盖子再结束', steps: ['活动结束前提醒最后一步。', '孩子盖上材料盒盖。', '盖好后说完成了。'] }
      },
      {
        key: 'age_4_5_instruction_two_steps_forget',
        categoryKey: 'attention_learning',
        title: '两步指令听完漏一步',
        description: '听到先拿书再坐下、先收笔再洗手时，常只做其中一步。',
        observableSigns: ['只做第一步', '第二步忘了', '需要重复提醒'],
        abilityTags: ['听觉注意', '工作记忆', '执行顺序'],
        sceneKey: 'age_4_5_two_step_instruction_support',
        symptoms: [],
        defaultBottleneck: { title: '先确认两步有没有被孩子复述', text: '两步指令要先进入孩子的工作记忆，再进入动作。' },
        defaultAction: { title: '今晚只练复述两步', steps: ['说先拿杯子再坐下。', '让孩子复述一遍。', '再开始做动作。'] }
      },
      {
        key: 'age_4_5_rule_listening_needs_demo',
        categoryKey: 'attention_learning',
        title: '规则要示范才听得懂',
        description: '只用嘴说游戏规则时孩子容易乱，看大人做一遍后才跟得上。',
        observableSigns: ['口头讲完就乱玩', '看别人做才明白', '规则换了就卡住'],
        abilityTags: ['规则游戏', '听觉注意', '动作示范'],
        sceneKey: 'age_4_5_rule_demo_support',
        symptoms: [],
        defaultBottleneck: { title: '先把规则变成一个示范动作', text: '这个阶段规则理解还需要动作示范承接，先少讲多做。' },
        defaultAction: { title: '今晚只示范一条规则', steps: ['大人先做一次规则动作。', '孩子跟做一次。', '连续成功 3 次就结束。'] }
      },
      {
        key: 'age_4_5_rule_change_argues',
        categoryKey: 'emotion_rules',
        title: '规则一变就争辩',
        description: '游戏、出门或家庭规则稍微调整，就坚持原来的做法。',
        observableSigns: ['反复说不是这样', '要求按原来来', '越解释越急'],
        abilityTags: ['规则变化', '情绪调节', '认知弹性'],
        sceneKey: 'age_4_5_rule_change_support',
        symptoms: [],
        defaultBottleneck: { title: '先给变化一个可预期提示', text: '孩子对规则变化敏感时，需要先知道哪里变、哪里没变。' },
        defaultAction: { title: '今晚只改一条小游戏规则', steps: ['先按旧规则玩一轮。', '说明这次只改一个地方。', '玩完一轮就结束。'] }
      },
      {
        key: 'age_4_5_reminder_tears',
        categoryKey: 'emotion_rules',
        title: '一被提醒就掉眼泪',
        description: '被提醒坐好、收拾、重做时，孩子马上委屈或哭。',
        observableSigns: ['听提醒就低头', '说我不会了', '哭着不继续'],
        abilityTags: ['被提醒委屈', '情绪安全', '规则接受'],
        sceneKey: 'age_4_5_reminder_emotion_support',
        symptoms: [],
        defaultBottleneck: { title: '先把提醒改成可完成动作', text: '提醒像批评时，孩子会先防御，需要听到下一步具体动作。' },
        defaultAction: { title: '今晚只提醒下一步', steps: ['不评价做得好坏。', '只说下一步把笔放盒子。', '完成后说这一步完成了。'] }
      },
      {
        key: 'age_4_5_activity_switch_bargains',
        categoryKey: 'emotion_rules',
        title: '活动切换总讨价还价',
        description: '从玩到吃饭、洗澡、睡觉时总说再玩一下，拖很久。',
        observableSigns: ['反复要求再一局', '听到结束就躲', '收玩具时情绪上来'],
        abilityTags: ['活动切换', '流程意识', '自我管理'],
        sceneKey: 'age_4_5_activity_switch_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定最后一轮', text: '切换困难时，孩子需要一个清楚的结束信号。' },
        defaultAction: { title: '今晚用最后一轮卡片', steps: ['提前说这是最后一轮。', '把最后一轮卡片放桌上。', '结束后一起把卡片收起。'] }
      },
      {
        key: 'age_4_5_waiting_line_impulsive',
        categoryKey: 'emotion_rules',
        title: '排队等待时插到前面',
        description: '等玩具、滑梯或游戏轮次时，孩子很难站住等别人。',
        observableSigns: ['往前挤', '催别人快点', '没轮到就开始'],
        abilityTags: ['等待轮流', '冲动控制', '规则理解'],
        sceneKey: 'age_4_5_waiting_line_support',
        symptoms: [],
        defaultBottleneck: { title: '先把等待变成可数的轮次', text: '等待抽象时孩子更急，用一轮一轮来帮他看见轮到自己。' },
        defaultAction: { title: '今晚只等大人一次', steps: ['大人先玩 10 秒。', '孩子拿等待卡。', '大人结束后马上轮到孩子。'] }
      },
      {
        key: 'age_4_5_mistake_says_cannot',
        categoryKey: 'emotion_rules',
        title: '做错一次就说不会',
        description: '拼图、画画、游戏或练习中出错后，马上退缩不肯继续。',
        observableSigns: ['说我不会', '把材料推开', '不愿再试一次'],
        abilityTags: ['挫折承受', '错误恢复', '学习自信'],
        sceneKey: 'age_4_5_mistake_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先练错了还能补一步', text: '孩子需要体验错误后还有一个很小的修正动作。' },
        defaultAction: { title: '今晚只补一个小错误', steps: ['大人故意放错一块。', '说错了可以换一块。', '让孩子换一次就结束。'] }
      },
      {
        key: 'age_4_5_boundary_testing_repeats',
        categoryKey: 'emotion_rules',
        title: '说过的边界反复试探',
        description: '已经约定不能扔、不能抢、不能跑，孩子仍反复看大人反应。',
        observableSigns: ['边看大人边做', '提醒后又做一次', '被拦住就笑或哭'],
        abilityTags: ['边界感', '规则稳定', '冲动控制'],
        sceneKey: 'age_4_5_boundary_testing_support',
        symptoms: [],
        defaultBottleneck: { title: '先让边界回应保持一致', text: '孩子反复试探时，需要看到同一个规则每次都一样。' },
        defaultAction: { title: '今晚只守一个边界', steps: ['只选一个边界：积木不扔。', '扔了就平静收起 30 秒。', '每次都用同一句话。'] }
      },
      {
        key: 'age_4_5_new_class_resists',
        categoryKey: 'emotion_rules',
        title: '新课新老师前抗拒',
        description: '面对新兴趣班、新老师或新活动时，进门前明显紧张和抗拒。',
        observableSigns: ['不肯进门', '抱着大人不放', '说我不想上'],
        abilityTags: ['环境适应', '安全感', '情绪调节'],
        sceneKey: 'age_4_5_new_class_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立进门前的安全流程', text: '新环境需要先降低不确定感，再进入参与。' },
        defaultAction: { title: '今晚预演进门三步', steps: ['在家演一次到门口。', '说你好老师。', '把包放到固定位置。'] }
      },
      {
        key: 'age_4_5_morning_flow_battles',
        categoryKey: 'emotion_rules',
        title: '早晚流程总拉扯',
        description: '起床、刷牙、穿衣、睡前收尾经常拖延，亲子冲突变多。',
        observableSigns: ['每步都要催', '边做边玩', '越催越慢'],
        abilityTags: ['生活规则', '流程意识', '自我管理'],
        sceneKey: 'age_4_5_daily_flow_support',
        symptoms: [],
        defaultBottleneck: { title: '先把流程缩成固定三步', text: '流程太长时，孩子和家长都会更急，先固定最关键三步。' },
        defaultAction: { title: '今晚画明早三步', steps: ['画刷牙、穿衣、拿包。', '让孩子选贴纸贴第一步。', '明早只从第一步开始。'] }
      },
      {
        key: 'age_4_5_calm_down_needs_long',
        categoryKey: 'emotion_rules',
        title: '哭完很久缓不过来',
        description: '情绪爆发后，即使事情过去了，仍反复哭或提起刚才。',
        observableSigns: ['安抚后还抽泣', '反复说刚才不对', '很久不愿互动'],
        abilityTags: ['情绪恢复', '安全感', '自我调节'],
        sceneKey: 'age_4_5_calm_down_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立固定恢复动作', text: '情绪下来慢时，固定动作比讲道理更容易帮助恢复。' },
        defaultAction: { title: '今晚做 3 次呼气吹纸', steps: ['拿一小片纸巾。', '孩子慢慢吹动纸巾。', '吹 3 次后喝一口水。'] }
      },
      {
        key: 'age_4_5_ball_catch_misses',
        categoryKey: 'motor_fitness',
        title: '接球总是接不住',
        description: '抛接球、滚球和拍球时，眼睛和手配合慢半拍。',
        observableSigns: ['球到面前才伸手', '接球常漏掉', '拍球不连续'],
        abilityTags: ['手眼协调', '球类基础', '动作计划'],
        sceneKey: 'age_4_5_ball_catch_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低球速和距离', text: '接球难通常先卡在眼睛追踪和双手准备，先用慢滚球建立配合。' },
        defaultAction: { title: '今晚滚接球 8 次', steps: ['两人坐地面对面。', '大人慢慢滚球。', '孩子双手抱住后再滚回。'] }
      },
      {
        key: 'age_4_5_obstacle_step_over_wobbly',
        categoryKey: 'motor_fitness',
        title: '跨障碍时身体不稳',
        description: '跨枕头、跨小栏或绕障碍时容易碰倒、踩到或停住。',
        observableSigns: ['抬脚不够高', '跨过去会晃', '绕障碍撞到'],
        abilityTags: ['跨越障碍', '平衡能力', '身体控制'],
        sceneKey: 'age_4_5_obstacle_step_support',
        symptoms: [],
        defaultBottleneck: { title: '先练慢速跨一步', text: '跨越障碍需要单脚支撑和身体重心转移，先把障碍降到安全高度。' },
        defaultAction: { title: '今晚跨 5 次毛巾卷', steps: ['把毛巾卷成低障碍。', '孩子慢慢跨过去。', '每次跨完停 2 秒。'] }
      },
      {
        key: 'age_4_5_core_balance_slumps',
        categoryKey: 'motor_fitness',
        title: '坐站姿势容易塌',
        description: '坐着画画、站着排队或运动等待时，身体容易歪、靠、趴。',
        observableSigns: ['坐着趴桌', '站着靠人', '运动等待时身体晃'],
        abilityTags: ['核心稳定', '体态控制', '身体控制'],
        sceneKey: 'age_4_5_core_balance_support',
        symptoms: [],
        defaultBottleneck: { title: '先练短时间身体支撑', text: '核心稳定不足会影响桌面任务和运动控制，先从几秒支撑开始。' },
        defaultAction: { title: '今晚做 3 次小桌子', steps: ['孩子手脚撑地做小桌子。', '保持 3 秒。', '休息后再做 2 次。'] }
      },
      {
        key: 'age_4_5_rhythm_actions_offbeat',
        categoryKey: 'motor_fitness',
        title: '跟节奏动作慢半拍',
        description: '拍手、踏步、律动或模仿操时，很难跟上节奏和顺序。',
        observableSigns: ['拍手总慢一点', '动作顺序乱', '看别人做才跟'],
        abilityTags: ['节奏动作', '动作模仿', '协调能力'],
        sceneKey: 'age_4_5_rhythm_action_support',
        symptoms: [],
        defaultBottleneck: { title: '先把节奏降成两个动作', text: '节奏动作复杂时，孩子需要先抓住固定拍点。' },
        defaultAction: { title: '今晚只练拍手跺脚', steps: ['大人说拍手、跺脚。', '孩子跟做 5 轮。', '速度保持很慢。'] }
      },
      {
        key: 'age_4_5_run_jump_tires_fast',
        categoryKey: 'motor_fitness',
        title: '跑跳一会儿就喊累',
        description: '追逐、跳跃、户外游戏持续时间短，很快停下或坐地上。',
        observableSigns: ['跑几分钟就停', '跳几次就不跳', '喜欢坐旁边看'],
        abilityTags: ['基础耐力', '跑跳体能', '运动信心'],
        sceneKey: 'age_4_5_run_jump_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先用短循环积累体能', text: '耐力不足时，短跑短休比一次跑很久更容易成功。' },
        defaultAction: { title: '今晚跑 10 秒休 20 秒', steps: ['孩子慢跑 10 秒。', '停下喝一口水或走路 20 秒。', '重复 3 轮。'] }
      },
      {
        key: 'age_4_5_fine_motor_cut_paste_tired',
        categoryKey: 'motor_fitness',
        title: '剪贴涂画手很快累',
        description: '剪纸、涂色、贴纸、拼插时手部耐受短，很快说累或放弃。',
        observableSigns: ['握得很紧', '涂一会喊累', '剪几下就停'],
        abilityTags: ['精细动作耐受', '手部力量', '手眼协调'],
        sceneKey: 'age_4_5_fine_motor_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低手部任务量', text: '手部耐受需要慢慢积累，先用少量重复让孩子完成。' },
        defaultAction: { title: '今晚只剪 3 条短线', steps: ['纸上画 3 条短线。', '孩子沿线剪完。', '剪完马上收剪刀。'] }
      },
      {
        key: 'age_4_5_balance_one_foot_hard',
        categoryKey: 'motor_fitness',
        title: '单脚站很难稳住',
        description: '穿裤子、跳格子、单脚站游戏时，身体很快晃或落脚。',
        observableSigns: ['单脚不到 2 秒', '手乱挥找平衡', '需要扶着大人'],
        abilityTags: ['单脚平衡', '前庭觉', '下肢控制'],
        sceneKey: 'age_4_5_one_foot_balance_support',
        symptoms: [],
        defaultBottleneck: { title: '先用扶墙建立单脚稳定', text: '单脚平衡需要核心和下肢一起工作，先允许轻扶降低难度。' },
        defaultAction: { title: '今晚扶墙单脚 3 秒', steps: ['孩子一手轻扶墙。', '单脚站 3 秒。', '左右脚各做 3 次。'] }
      },
      {
        key: 'age_4_5_body_boundary_bumps',
        categoryKey: 'motor_fitness',
        title: '跑动游戏容易撞人',
        description: '追逐、排队、集体游戏中不太会控制距离和力量。',
        observableSigns: ['转身撞到同伴', '排队贴太近', '用力过大推到人'],
        abilityTags: ['身体边界', '本体觉', '空间距离'],
        sceneKey: 'age_4_5_body_boundary_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立一臂距离感', text: '身体边界弱时，孩子需要用身体动作感受距离。' },
        defaultAction: { title: '今晚练一臂距离走路', steps: ['大人伸出一只手臂。', '孩子站在碰不到的位置。', '一起走 5 步保持距离。'] }
      },
      {
        key: 'age_4_5_movement_sequence_forgets',
        categoryKey: 'motor_fitness',
        title: '连续动作顺序记不住',
        description: '钻、爬、跳、投等组合动作中，孩子容易漏步骤或顺序乱。',
        observableSigns: ['只做第一个动作', '漏掉中间步骤', '做到一半看大人'],
        abilityTags: ['动作计划', '动作顺序', '协调能力'],
        sceneKey: 'age_4_5_movement_sequence_support',
        symptoms: [],
        defaultBottleneck: { title: '先把连续动作缩成两步', text: '组合动作需要动作记忆，先让孩子掌握两步顺序。' },
        defaultAction: { title: '今晚只练钻再跳', steps: ['从椅子旁边钻过去。', '再跳过一条毛巾。', '完成 3 轮就结束。'] }
      },
      {
        key: 'age_4_5_conflict_reason_unclear',
        categoryKey: 'social_expression',
        title: '冲突后说不清原因',
        description: '和同伴争抢、推挤或告状后，很难说清刚才发生了什么。',
        observableSigns: ['只说他弄我', '前后顺序乱', '越说越急'],
        abilityTags: ['冲突表达', '事件顺序', '情绪调节'],
        sceneKey: 'age_4_5_conflict_reason_support',
        symptoms: [],
        defaultBottleneck: { title: '先用三句话还原冲突', text: '孩子有情绪时叙述会乱，需要固定句式帮助他说清事实。' },
        defaultAction: { title: '今晚只练先后来', steps: ['大人问先发生什么。', '再问后来谁做了什么。', '最后问你想怎么办。'] }
      },
      {
        key: 'age_4_5_cooperation_game_dominates',
        categoryKey: 'social_expression',
        title: '合作游戏总想自己说了算',
        description: '一起搭建、过家家或规则游戏时，常坚持自己的玩法。',
        observableSigns: ['不听别人建议', '抢着安排角色', '别人不同意就生气'],
        abilityTags: ['合作游戏', '轮流表达', '规则理解'],
        sceneKey: 'age_4_5_cooperation_game_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一人一个主意', text: '合作需要孩子体验自己的想法和别人的想法都能被放进去。' },
        defaultAction: { title: '今晚轮流放一个主意', steps: ['大人说一个搭法。', '孩子说一个搭法。', '两种搭法各做一次。'] }
      },
      {
        key: 'age_4_5_group_speech_freezes',
        categoryKey: 'social_expression',
        title: '集体发言轮到他就卡住',
        description: '课堂、兴趣班或亲友面前发言时，孩子突然沉默或声音很小。',
        observableSigns: ['低头不说', '声音很小', '说不知道'],
        abilityTags: ['集体发言', '表达信心', '社交安全感'],
        sceneKey: 'age_4_5_group_speech_support',
        symptoms: [],
        defaultBottleneck: { title: '先把发言缩成一句完整话', text: '集体表达压力大时，先准备一句能说出来的话。' },
        defaultAction: { title: '今晚练一句我喜欢', steps: ['大人问你喜欢什么玩具。', '孩子说我喜欢加一个物品。', '说完就结束。'] }
      },
      {
        key: 'age_4_5_emotion_feeling_words_missing',
        categoryKey: 'social_expression',
        title: '有感受但说不出词',
        description: '生气、害怕、失望、开心时，常用哭闹或动作表达。',
        observableSigns: ['问感受说不知道', '只哭不解释', '用推开代替表达'],
        abilityTags: ['感受表达', '情绪词', '自我觉察'],
        sceneKey: 'age_4_5_feeling_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先提供两个感受词让孩子选', text: '孩子说不出感受时，选择题比开放题更容易。' },
        defaultAction: { title: '今晚只选开心还是生气', steps: ['大人说你是开心还是生气。', '孩子选一个词。', '大人复述你现在很生气。'] }
      },
      {
        key: 'age_4_5_reject_words_too_hard',
        categoryKey: 'social_expression',
        title: '不想玩时不会好好拒绝',
        description: '不想分享、不想加入或想停下来时，常直接跑开、推开或发火。',
        observableSigns: ['推开别人', '转身跑走', '说不清自己不想要'],
        abilityTags: ['拒绝表达', '边界表达', '冲突表达'],
        sceneKey: 'age_4_5_reject_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句温和拒绝', text: '孩子需要一句既能保护边界又容易说出口的话。' },
        defaultAction: { title: '今晚只练我先不玩', steps: ['大人邀请孩子玩。', '孩子说我先不玩。', '大人回应好，等你想玩再来。'] }
      },
      {
        key: 'age_4_5_peer_join_phrase_missing',
        categoryKey: 'social_expression',
        title: '想加入游戏找不到话',
        description: '看到同伴玩得热闹，孩子想加入却在旁边看或突然插进去。',
        observableSigns: ['站旁边很久', '直接拿别人材料', '等大人帮他说'],
        abilityTags: ['同伴加入', '社交表达', '表达信心'],
        sceneKey: 'age_4_5_peer_join_phrase_support',
        symptoms: [],
        defaultBottleneck: { title: '先练加入游戏的入口句', text: '孩子想加入时需要一句固定话，降低开口难度。' },
        defaultAction: { title: '今晚练我可以加入吗', steps: ['大人扮演正在玩的人。', '孩子说我可以加入吗。', '大人给一个角色让他加入。'] }
      },
      {
        key: 'age_4_5_story_retell_jumps',
        categoryKey: 'social_expression',
        title: '复述故事总跳来跳去',
        description: '讲绘本、动画或幼儿园事情时，能说片段，但顺序和重点不清。',
        observableSigns: ['只说最兴奋的片段', '漏掉人物原因', '讲到一半换主题'],
        abilityTags: ['叙事表达', '故事复述', '语言组织'],
        sceneKey: 'age_4_5_story_retell_support',
        symptoms: [],
        defaultBottleneck: { title: '先用开头中间结尾框架', text: '4-5岁复述需要简单结构，先抓三段。' },
        defaultAction: { title: '今晚只讲三张图', steps: ['选绘本里连续三张图。', '分别问先、然后、最后。', '孩子每张图说一句。'] }
      },
      {
        key: 'age_4_5_adult_request_unclear',
        categoryKey: 'social_expression',
        title: '向大人求助说不清',
        description: '遇到不会、够不到、打不开时，孩子着急但说不清需要什么帮助。',
        observableSigns: ['只喊妈妈', '拿着东西哭', '说这个这个却不说明'],
        abilityTags: ['求助表达', '需求表达', '语言组织'],
        sceneKey: 'age_4_5_adult_request_support',
        symptoms: [],
        defaultBottleneck: { title: '先把求助句补完整', text: '孩子着急时表达会变短，需要一个固定求助句。' },
        defaultAction: { title: '今晚练请帮我打开', steps: ['准备一个孩子打不开的盒子。', '孩子说请帮我打开。', '大人帮一半，让孩子完成最后一步。'] }
      },
      {
        key: 'age_4_5_family_short_dialogue',
        categoryKey: 'social_expression',
        title: '亲子对话接不下去',
        description: '在家聊天经常问一句答一句，很难继续往下说。',
        observableSigns: ['只答嗯或没有', '不追问大人', '聊两句就跑开'],
        abilityTags: ['短对话', '亲子沟通', '回应能力'],
        sceneKey: 'age_4_5_family_dialogue_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一问一答再反问', text: '对话接不下去时，先让孩子体验轮到自己问一句。' },
        defaultAction: { title: '今晚只练你呢', steps: ['大人说我今天吃了苹果。', '问孩子你吃了什么。', '孩子回答后再说你呢。'] }
      }
    ]
  },
  {
    key: 'age_5_6',
    label: '5-6岁',
    title: '提前建立社交能力和任务意识',
    subtitle: '看孩子能不能等待轮流、完成小任务，并适应幼小衔接。',
    focusAreas: ['社交能力', '任务意识', '等待轮流', '幼小衔接'],
    parentSummary: '这个阶段家长最常关注同伴冲突、不会轮流、集体活动不合群和任务坚持差。',
    painPoints: [
      {
        key: 'peer_conflicts_often',
        categoryKey: 'social_expression',
        title: '和小朋友总起冲突',
        description: '一起玩时容易争抢、告状或动手。',
        observableSigns: ['抢玩具', '容易告状', '推搡同伴'],
        abilityTags: ['同伴冲突', '社交能力', '情绪调节', '规则理解'],
        sceneKey: 'peer_conflict_support',
        symptoms: [],
        defaultBottleneck: { title: '先看孩子会不会表达需求', text: '冲突常发生在想要、拒绝、轮流时说不清。' },
        defaultAction: { title: '今晚只练一句我也想玩', steps: ['大人拿一个玩具。', '让孩子说：我也想玩。', '说完后再给他轮到一次。'] }
      },
      {
        key: 'cannot_wait_turn',
        categoryKey: 'emotion_rules',
        title: '不会等待和轮流',
        description: '等别人时着急，轮不到自己就插队。',
        observableSigns: ['插队', '抢先开始', '等几秒就急'],
        abilityTags: ['等待轮流', '轮流等待', '冲动控制', '任务意识'],
        sceneKey: 'turn_taking_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先把等待时间缩短', text: '等待对孩子来说是能力训练，先从很短的可成功时间开始。' },
        defaultAction: { title: '今晚先等 5 秒轮到自己', steps: ['大人先玩一次。', '孩子等 5 秒。', '马上轮到孩子玩一次。'] }
      },
      {
        key: 'group_activity_withdrawn',
        categoryKey: 'social_expression',
        title: '集体活动不合群',
        description: '集体游戏或课堂中不主动加入，常在旁边看。',
        observableSigns: ['不加入游戏', '站在旁边看', '需要老师拉着参与'],
        abilityTags: ['社交能力', '集体适应', '安全感'],
        sceneKey: 'group_participation',
        symptoms: [],
        defaultBottleneck: { title: '先看加入集体的入口是否太难', text: '孩子可能不是不想参与，而是不知道怎样开始加入。' },
        defaultAction: { title: '今晚只练一句我可以一起玩吗', steps: ['大人扮演小朋友。', '孩子说：我可以一起玩吗？', '说完就让他加入游戏。'] }
      },
      {
        key: 'small_task_persistence_low',
        categoryKey: 'attention_learning',
        title: '小任务坚持不下来',
        description: '收拾、画画、练习等小任务容易半途放弃。',
        observableSigns: ['做一半停下', '嫌麻烦', '需要反复催'],
        abilityTags: ['任务意识', '持续专注', '自我管理'],
        sceneKey: 'task_persistence',
        symptoms: [],
        defaultBottleneck: { title: '先把任务拆到可完成', text: '孩子需要先体验完成一个小闭环，再慢慢延长任务。' },
        defaultAction: { title: '今晚只完成一个收尾动作', steps: ['选一个快结束的小任务。', '只让孩子做最后一步。', '完成后说：这个任务结束了。'] }
      },
      {
        key: 'school_transition_anxiety',
        categoryKey: 'attention_learning',
        title: '幼小衔接有点焦虑',
        description: '提到上学、课堂、作业时紧张或抗拒。',
        observableSigns: ['说不想上学', '提到课堂就烦', '怕老师批评'],
        abilityTags: ['幼小衔接', '课堂适应', '情绪调节'],
        sceneKey: 'school_transition_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低上学想象里的压力', text: '孩子对未知课堂有压力时，先把课堂变成可预期的小动作。' },
        defaultAction: { title: '今晚玩 3 分钟小课堂', steps: ['大人当老师说一个简单指令。', '孩子完成一个动作。', '完成后马上下课。'] }
      },
      {
        key: 'age_5_6_classroom_sitting_preparedness',
        categoryKey: 'attention_learning',
        title: '小课堂里坐不住',
        description: '模拟课堂、兴趣班或幼儿园集体活动中，很难坐好听完一小段。',
        observableSigns: ['坐一会就扭', '摸旁边东西', '老师讲时看别处'],
        abilityTags: ['课堂准备', '身体控制', '持续注意'],
        sceneKey: 'age_5_6_classroom_sitting_support',
        symptoms: [],
        defaultBottleneck: { title: '先练短时间坐着听', text: '幼小衔接期先建立身体坐住和眼睛看向说话人的小习惯。' },
        defaultAction: { title: '今晚练 2 分钟小课堂', steps: ['大人讲两句话。', '孩子坐着看大人。', '说出听到的一个词。'] }
      },
      {
        key: 'age_5_6_pre_writing_grip_tired',
        categoryKey: 'attention_learning',
        title: '前书写练一会就累',
        description: '描线、涂色、写数字或控笔练习时，手累、坐不住或抗拒。',
        observableSigns: ['握笔很紧', '描几行就停', '说手酸不想写'],
        abilityTags: ['前书写', '手部耐受', '任务持续'],
        sceneKey: 'age_5_6_pre_writing_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低前书写量', text: '写前能力需要手部耐受和注意力配合，先用少量完成保护信心。' },
        defaultAction: { title: '今晚只描 3 条短线', steps: ['纸上准备 3 条短线。', '孩子慢慢描完。', '描完马上收笔。'] }
      },
      {
        key: 'age_5_6_homework_awareness_weak',
        categoryKey: 'attention_learning',
        title: '没有作业意识',
        description: '对练习、打卡、带材料等小任务缺少主动记住和完成意识。',
        observableSigns: ['要大人全程提醒', '忘记带东西', '不知道今天要做什么'],
        abilityTags: ['作业意识', '任务意识', '执行启动'],
        sceneKey: 'age_5_6_homework_awareness_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立一个今日任务入口', text: '作业意识要从知道今天有一件小事开始。' },
        defaultAction: { title: '今晚只贴一张任务卡', steps: ['写下明天要带水杯。', '让孩子贴在门口。', '明早出门前自己看一眼。'] }
      },
      {
        key: 'age_5_6_task_order_confused',
        categoryKey: 'attention_learning',
        title: '小任务顺序总搞乱',
        description: '收书包、整理文具、完成小练习时，步骤顺序容易乱或漏。',
        observableSigns: ['先后顺序错', '漏掉关键步骤', '一直问下一步'],
        abilityTags: ['任务顺序', '执行计划', '工作记忆'],
        sceneKey: 'age_5_6_task_order_support',
        symptoms: [],
        defaultBottleneck: { title: '先把顺序变成三步图', text: '5-6岁开始需要任务顺序，但仍需要可见提示。' },
        defaultAction: { title: '今晚只排三步书包卡', steps: ['画书、本子、水杯三张卡。', '孩子按顺序摆好。', '照着放进书包。'] }
      },
      {
        key: 'age_5_6_reading_readiness_short',
        categoryKey: 'attention_learning',
        title: '看书听故事耐心短',
        description: '绘本、识字或讲故事时，能开始但很快分心。',
        observableSigns: ['读几页跑开', '问题答不上来', '眼睛离开书'],
        abilityTags: ['阅读准备', '持续注意', '视觉追踪'],
        sceneKey: 'age_5_6_reading_readiness_support',
        symptoms: [],
        defaultBottleneck: { title: '先看阅读耐受时间', text: '入学前阅读准备要先从短时间听懂和看住一页开始。' },
        defaultAction: { title: '今晚只读一页找关键词', steps: ['只读一页。', '让孩子找一个人物或物品。', '找到后说一句这是谁。'] }
      },
      {
        key: 'age_5_6_finish_without_checking',
        categoryKey: 'attention_learning',
        title: '做完就跑不会检查',
        description: '画完、写完、收完后马上离开，不会回头看有没有漏。',
        observableSigns: ['漏东西没发现', '写完马上走', '不愿回看一遍'],
        abilityTags: ['自我检查', '学习习惯', '任务完成'],
        sceneKey: 'age_5_6_finish_check_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一个检查动作', text: '检查习惯从固定一个回看动作开始。' },
        defaultAction: { title: '今晚只检查有没有写名字', steps: ['完成纸面任务后停 3 秒。', '问名字写了吗。', '确认后再离开。'] }
      },
      {
        key: 'age_5_6_instruction_three_steps_hard',
        categoryKey: 'attention_learning',
        title: '三步指令听完就漏',
        description: '老师或家长说拿书、坐好、翻页这类连续指令时，孩子常漏一步。',
        observableSigns: ['只完成前两步', '回头问要做什么', '看别人做才跟'],
        abilityTags: ['听觉注意', '工作记忆', '课堂适应'],
        sceneKey: 'age_5_6_three_step_instruction_support',
        symptoms: [],
        defaultBottleneck: { title: '先练复述再执行', text: '连续指令需要进入工作记忆，先让孩子说一遍再做。' },
        defaultAction: { title: '今晚只练三步复述', steps: ['说拿杯子、坐下、喝水。', '让孩子复述一遍。', '再开始执行。'] }
      },
      {
        key: 'age_5_6_learning_block_resists',
        categoryKey: 'attention_learning',
        title: '一说练习就抗拒',
        description: '识字、控笔、数学启蒙或打卡练习一开始就说不要。',
        observableSigns: ['说我不想练', '拖着不坐下', '拿别的玩具转移'],
        abilityTags: ['学习启动', '练习耐受', '情绪调节'],
        sceneKey: 'age_5_6_learning_block_support',
        symptoms: [],
        defaultBottleneck: { title: '先把练习缩成可结束的小块', text: '练习抗拒常来自看不到结束，先用短学习块建立可承受感。' },
        defaultAction: { title: '今晚只做 5 分钟练习块', steps: ['设 5 分钟计时。', '只做一页里的 3 小题。', '时间到马上结束。'] }
      },
      {
        key: 'age_5_6_rule_game_loses_meltdown',
        categoryKey: 'emotion_rules',
        title: '规则游戏输了就崩',
        description: '桌游、运动游戏或课堂小游戏里，一输就哭、改规则或退出。',
        observableSigns: ['输了马上哭', '说不算重来', '拒绝继续下一轮'],
        abilityTags: ['规则游戏', '输赢恢复', '挫折承受'],
        sceneKey: 'age_5_6_rule_game_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先练输后还能完成一轮', text: '幼小衔接期需要把输赢和继续参与分开。' },
        defaultAction: { title: '今晚只练输后再来一轮', steps: ['大人先输一轮示范。', '说输了也做下一轮。', '孩子输后只再玩一轮。'] }
      },
      {
        key: 'age_5_6_school_worry_morning',
        categoryKey: 'emotion_rules',
        title: '想到上学就早上发愁',
        description: '早上出门前提到老师、课堂、作业或分离时，明显紧张和抗拒。',
        observableSigns: ['说肚子不舒服', '不愿穿衣出门', '反复问会不会被批评'],
        abilityTags: ['上学焦虑', '安全感', '环境适应'],
        sceneKey: 'age_5_6_school_worry_support',
        symptoms: [],
        defaultBottleneck: { title: '先让上学流程可预测', text: '焦虑常来自不知道会发生什么，先把第一段流程说清楚。' },
        defaultAction: { title: '今晚画明早上学三步', steps: ['画穿衣、背包、到门口。', '孩子选第一步贴星星。', '明早只先完成第一步。'] }
      },
      {
        key: 'age_5_6_daily_flow_negotiates',
        categoryKey: 'emotion_rules',
        title: '日常流程总讨价还价',
        description: '起床、洗漱、收书包、睡前收尾时，经常拖延和反复商量。',
        observableSigns: ['每一步都说等一下', '越催越慢', '收尾时情绪变大'],
        abilityTags: ['流程管理', '生活规则', '自我管理'],
        sceneKey: 'age_5_6_daily_flow_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定流程里的一个锚点', text: '流程拉扯多时，先让一个动作每天稳定发生。' },
        defaultAction: { title: '今晚只固定睡前放书包', steps: ['睡前把书包放门口。', '孩子自己拉好拉链。', '完成后贴一颗星。'] }
      },
      {
        key: 'age_5_6_short_task_quits_when_hard',
        categoryKey: 'emotion_rules',
        title: '小任务一难就放弃',
        description: '拼图、控笔、整理或小练习遇到一点难度就说不会。',
        observableSigns: ['推开材料', '说太难了', '要大人直接帮做'],
        abilityTags: ['短任务闭环', '挫折承受', '学习自信'],
        sceneKey: 'age_5_6_short_task_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先保留一个能完成的下一步', text: '遇难退缩时，孩子需要看到还有一步能自己完成。' },
        defaultAction: { title: '今晚只补一个小步骤', steps: ['把难任务拆到最后一步。', '孩子只完成这一步。', '大人说你把这一小步做完了。'] }
      },
      {
        key: 'age_5_6_reminded_argues_back',
        categoryKey: 'emotion_rules',
        title: '被提醒就顶嘴反驳',
        description: '提醒排队、坐好、收拾或练习时，孩子马上解释、顶嘴或不服气。',
        observableSigns: ['说我知道了', '反复解释不是我', '越提醒越不做'],
        abilityTags: ['规则接受', '情绪调节', '边界感'],
        sceneKey: 'age_5_6_reminder_accept_support',
        symptoms: [],
        defaultBottleneck: { title: '先把提醒改成下一步选择', text: '提醒引发对抗时，孩子需要听到可执行的下一步。' },
        defaultAction: { title: '今晚只给两个下一步', steps: ['说先收笔还是先收本。', '孩子选一个。', '只完成被选的动作。'] }
      },
      {
        key: 'age_5_6_transition_from_play_to_practice',
        categoryKey: 'emotion_rules',
        title: '从玩切到练习很难',
        description: '从游戏、动画、户外玩耍切到识字、控笔或睡前流程时明显抗拒。',
        observableSigns: ['说再玩五分钟', '躲开练习桌', '收玩具时情绪爆发'],
        abilityTags: ['活动切换', '练习耐受', '自我管理'],
        sceneKey: 'age_5_6_play_to_practice_support',
        symptoms: [],
        defaultBottleneck: { title: '先设一个看得见的切换桥', text: '从玩到练习跨度大，需要中间有固定过渡动作。' },
        defaultAction: { title: '今晚用收一个玩具再练', steps: ['提前说收一个玩具后练 3 分钟。', '孩子收一个玩具。', '只练 3 分钟就结束。'] }
      },
      {
        key: 'age_5_6_new_rule_group_game_resists',
        categoryKey: 'emotion_rules',
        title: '集体游戏新规则不接受',
        description: '老师或同伴换玩法、换顺序、换角色时，孩子很难接受。',
        observableSigns: ['坚持原来规则', '不愿换角色', '说这样不公平'],
        abilityTags: ['规则弹性', '集体适应', '情绪调节'],
        sceneKey: 'age_5_6_new_rule_group_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一次小变化', text: '规则弹性要从很小、可预告的变化开始。' },
        defaultAction: { title: '今晚只换一次角色', steps: ['先按原角色玩一轮。', '第二轮只交换一个角色。', '交换后玩 1 分钟就结束。'] }
      },
      {
        key: 'age_5_6_waiting_for_help_anxious',
        categoryKey: 'emotion_rules',
        title: '等大人帮忙时很急',
        description: '遇到不会打开、不会写、不会整理时，等待大人帮忙很难。',
        observableSigns: ['一直喊大人', '自己先乱弄', '等几秒就哭'],
        abilityTags: ['等待帮助', '冲动控制', '情绪调节'],
        sceneKey: 'age_5_6_wait_help_support',
        symptoms: [],
        defaultBottleneck: { title: '先把等待时间变短且可见', text: '等帮助时孩子焦虑，需要一个明确的等待信号。' },
        defaultAction: { title: '今晚练等沙漏 20 秒', steps: ['放一个 20 秒计时。', '孩子拿着需要帮忙的东西等。', '时间到大人马上帮第一步。'] }
      },
      {
        key: 'age_5_6_calm_after_conflict_slow',
        categoryKey: 'emotion_rules',
        title: '冲突后很久缓不过来',
        description: '和同伴或大人发生冲突后，情绪恢复慢，影响后续活动。',
        observableSigns: ['反复提刚才的事', '不愿回到游戏', '安抚后还委屈'],
        abilityTags: ['情绪恢复', '冲突恢复', '安全感'],
        sceneKey: 'age_5_6_conflict_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先用固定恢复步骤收尾', text: '情绪恢复慢时，先用动作帮助孩子从冲突里出来。' },
        defaultAction: { title: '今晚练喝水再说一句', steps: ['先喝一口水。', '说我刚才很生气。', '再说我现在可以回来了。'] }
      },
      {
        key: 'age_5_6_rope_jump_ready_hard',
        categoryKey: 'motor_fitness',
        title: '跳绳预备动作跟不上',
        description: '甩手、起跳、落地和节奏很难配合，练几次就乱。',
        observableSigns: ['甩手和跳不同步', '落地很重', '连续跳容易断'],
        abilityTags: ['跳绳预备', '节奏感', '下肢控制'],
        sceneKey: 'age_5_6_rope_jump_ready_support',
        symptoms: [],
        defaultBottleneck: { title: '先拆开手和脚的节奏', text: '跳绳是复合动作，先把无绳跳和甩手分开练更稳。' },
        defaultAction: { title: '今晚只练无绳跳 10 下', steps: ['双脚并拢站好。', '听口令连续跳 10 下。', '休息后再模仿甩手 10 下。'] }
      },
      {
        key: 'age_5_6_ball_dribble_unsteady',
        categoryKey: 'motor_fitness',
        title: '拍球接球总不稳',
        description: '拍球、接球、滚球时手眼配合慢，球容易跑掉。',
        observableSigns: ['拍球不连续', '接球漏掉', '球滚来反应慢'],
        abilityTags: ['球类协调', '手眼协调', '动作计划'],
        sceneKey: 'age_5_6_ball_coordination_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低球的速度和次数', text: '球类协调要先建立眼睛追球和双手准备。' },
        defaultAction: { title: '今晚只拍球 5 下', steps: ['选择一个大一点的球。', '孩子连续拍 5 下。', '断了就重新从 1 开始。'] }
      },
      {
        key: 'age_5_6_core_posture_slumps',
        categoryKey: 'motor_fitness',
        title: '坐姿站姿撑不住',
        description: '画画、控笔、排队或运动等待时，身体容易塌、歪或靠。',
        observableSigns: ['坐着趴桌', '站着靠人', '排队身体晃'],
        abilityTags: ['核心稳定', '体态控制', '身体控制'],
        sceneKey: 'age_5_6_core_posture_support',
        symptoms: [],
        defaultBottleneck: { title: '先练短时间核心支撑', text: '核心稳定会影响桌面学习和运动动作，先从短支撑开始。' },
        defaultAction: { title: '今晚做 3 次小桌子', steps: ['手脚撑地做小桌子。', '保持 5 秒。', '休息后再做 2 次。'] }
      },
      {
        key: 'age_5_6_run_jump_endurance_low',
        categoryKey: 'motor_fitness',
        title: '跑跳耐力明显不够',
        description: '户外游戏、跑步、跳跃活动持续时间短，很快喊累或坐下。',
        observableSigns: ['跑一会就停', '跳几下就累', '喜欢站旁边看'],
        abilityTags: ['跑跳耐力', '基础体能', '运动信心'],
        sceneKey: 'age_5_6_run_jump_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先用短循环累积耐力', text: '体能不足时，短运动短休息比一次练很久更容易坚持。' },
        defaultAction: { title: '今晚跑 15 秒休 30 秒', steps: ['慢跑 15 秒。', '走路休息 30 秒。', '重复 3 轮。'] }
      },
      {
        key: 'age_5_6_fine_motor_writing_tired',
        categoryKey: 'motor_fitness',
        title: '控笔剪贴手很快累',
        description: '控笔、剪纸、涂色、拼插等精细任务很快手酸或抗拒。',
        observableSigns: ['握笔太紧', '剪几下就停', '涂色容易出格'],
        abilityTags: ['精细动作耐受', '手部力量', '手眼协调'],
        sceneKey: 'age_5_6_fine_motor_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先把手部任务降到少量完成', text: '精细动作耐受需要慢慢累积，先让孩子完成少量清楚任务。' },
        defaultAction: { title: '今晚只夹 8 个小球', steps: ['准备夹子和小绒球。', '孩子夹进碗里 8 个。', '完成后马上收起。'] }
      },
      {
        key: 'age_5_6_balance_hop_grid_hard',
        categoryKey: 'motor_fitness',
        title: '跳格子单脚不稳',
        description: '跳房子、单脚站、跨格子时身体晃，容易踩线或落脚。',
        observableSigns: ['单脚站不住', '跳格子踩线', '落地歪到一边'],
        abilityTags: ['单脚平衡', '下肢控制', '前庭觉'],
        sceneKey: 'age_5_6_hop_grid_balance_support',
        symptoms: [],
        defaultBottleneck: { title: '先练低难度单脚稳定', text: '跳格子需要平衡和下肢控制，先练原地单脚。' },
        defaultAction: { title: '今晚单脚站 5 秒', steps: ['孩子轻扶墙。', '单脚站 5 秒。', '左右脚各做 3 次。'] }
      },
      {
        key: 'age_5_6_cross_body_actions_confused',
        categoryKey: 'motor_fitness',
        title: '左右交叉动作容易乱',
        description: '拍肩、交叉爬、左右方向游戏中，手脚顺序容易混乱。',
        observableSigns: ['左右分不清', '交叉动作做成同侧', '看别人做才跟'],
        abilityTags: ['双侧协调', '动作计划', '身体控制'],
        sceneKey: 'age_5_6_cross_body_support',
        symptoms: [],
        defaultBottleneck: { title: '先把交叉动作降成慢节奏', text: '双侧协调需要左右身体一起配合，先慢下来建立顺序。' },
        defaultAction: { title: '今晚做 6 次交叉拍肩', steps: ['右手拍左肩。', '左手拍右肩。', '左右交替 6 次。'] }
      },
      {
        key: 'age_5_6_obstacle_course_sequence_hard',
        categoryKey: 'motor_fitness',
        title: '障碍路线顺序总漏',
        description: '钻、跨、跳、投连续路线中，孩子容易漏步骤或停住看大人。',
        observableSigns: ['只做前两个动作', '漏掉投球步骤', '做到一半问下一步'],
        abilityTags: ['动作顺序', '动作计划', '协调能力'],
        sceneKey: 'age_5_6_obstacle_sequence_support',
        symptoms: [],
        defaultBottleneck: { title: '先把路线缩成三步', text: '连续动作路线需要记忆和计划，先固定三步。' },
        defaultAction: { title: '今晚只做钻跨投三步', steps: ['钻过椅子。', '跨过毛巾。', '把球投进篮子。'] }
      },
      {
        key: 'age_5_6_movement_confidence_low',
        categoryKey: 'motor_fitness',
        title: '新运动一试就退缩',
        description: '看到跳绳、球类、攀爬或新游戏时，先说不会或不敢试。',
        observableSigns: ['站在旁边看', '说我不会', '失败一次就不玩'],
        abilityTags: ['运动信心', '挫折承受', '身体经验'],
        sceneKey: 'age_5_6_movement_confidence_support',
        symptoms: [],
        defaultBottleneck: { title: '先给孩子一个肯定能完成的版本', text: '运动退缩时，需要先体验身体能做到。' },
        defaultAction: { title: '今晚只做最简单版本', steps: ['把动作降到最简单。', '孩子完成 1 次。', '大人说你完成了第一步。'] }
      },
      {
        key: 'age_5_6_after_activity_overexcited',
        categoryKey: 'motor_fitness',
        title: '运动后兴奋收不回来',
        description: '跑跳、追逐或球类活动后，身体和情绪很久难降下来。',
        observableSigns: ['停下还跳', '声音很大', '回到桌面任务困难'],
        abilityTags: ['体能恢复', '身体觉察', '自我调节'],
        sceneKey: 'age_5_6_activity_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先用慢动作帮助身体降速', text: '运动后切回安静任务，需要一个从快到慢的过渡。' },
        defaultAction: { title: '今晚运动后慢推墙 6 次', steps: ['双手推墙。', '慢慢用力 5 秒。', '重复 6 次后喝水坐下。'] }
      },
      {
        key: 'age_5_6_turn_talk_conflict_hard',
        categoryKey: 'social_expression',
        title: '轮流商量时说不清',
        description: '分玩具、排角色、轮流玩时，孩子容易急着抢或告状。',
        observableSigns: ['说不清想怎么轮', '一急就抢', '只会找大人评理'],
        abilityTags: ['轮流协商', '冲突表达', '规则理解'],
        sceneKey: 'age_5_6_turn_talk_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一句轮到谁', text: '轮流协商需要先把顺序说出来，再处理公平感。' },
        defaultAction: { title: '今晚只练先你后我', steps: ['大人拿一个玩具。', '孩子说先你后我。', '大人玩 10 秒后轮到孩子。'] }
      },
      {
        key: 'age_5_6_cooperation_role_confused',
        categoryKey: 'social_expression',
        title: '合作分工总乱',
        description: '搭积木、过家家、集体任务中，不知道自己负责什么。',
        observableSigns: ['抢别人角色', '做到一半换任务', '需要大人分配'],
        abilityTags: ['合作分工', '集体参与', '任务意识'],
        sceneKey: 'age_5_6_cooperation_role_support',
        symptoms: [],
        defaultBottleneck: { title: '先把角色固定成一个动作', text: '合作分工难时，孩子需要知道自己只负责哪一步。' },
        defaultAction: { title: '今晚只当递材料的人', steps: ['大人负责搭。', '孩子每次递 1 块积木。', '递完 6 块就结束。'] }
      },
      {
        key: 'age_5_6_reject_peer_request_hard',
        categoryKey: 'social_expression',
        title: '不想答应同伴时不会拒绝',
        description: '不想交换、不想分享、不想加入时，常跑开、发火或沉默。',
        observableSigns: ['推开别人', '不说原因就走', '被追问就哭'],
        abilityTags: ['表达拒绝', '边界表达', '社交安全感'],
        sceneKey: 'age_5_6_reject_peer_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句清楚拒绝', text: '拒绝同伴需要既表达边界又保留关系，先用固定句式。' },
        defaultAction: { title: '今晚练我现在不换', steps: ['大人提出交换玩具。', '孩子说我现在不换。', '大人回应好，我等一会。'] }
      },
      {
        key: 'age_5_6_ask_teacher_help_stuck',
        categoryKey: 'social_expression',
        title: '遇到不会不敢问老师',
        description: '课堂、兴趣班或集体任务中卡住时，不会主动向老师求助。',
        observableSigns: ['坐着等老师发现', '看同伴怎么做', '回家才说不会'],
        abilityTags: ['向老师求助', '课堂适应', '表达信心'],
        sceneKey: 'age_5_6_teacher_help_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一句具体求助', text: '求助需要孩子说清卡在哪一步，先准备可复制句式。' },
        defaultAction: { title: '今晚练老师请帮我看这一步', steps: ['大人扮演老师。', '孩子指着材料说请帮我看这一步。', '大人只提示第一步。'] }
      },
      {
        key: 'age_5_6_group_share_voice_low',
        categoryKey: 'social_expression',
        title: '集体分享声音很小',
        description: '轮到介绍作品、回答问题或讲经历时，声音小、低头或说不知道。',
        observableSigns: ['低头看地', '声音小到听不清', '让大人代说'],
        abilityTags: ['集体表达', '表达信心', '课堂准备'],
        sceneKey: 'age_5_6_group_share_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句可完成分享', text: '集体分享压力大时，先让孩子说一句固定结构。' },
        defaultAction: { title: '今晚只说我的作品是', steps: ['拿一幅画。', '孩子说我的作品是加名称。', '大人听完复述一次。'] }
      },
      {
        key: 'age_5_6_conflict_story_missing_steps',
        categoryKey: 'social_expression',
        title: '讲冲突经过漏步骤',
        description: '和同伴发生争执后，能说结果，但漏掉前因和自己的动作。',
        observableSigns: ['只说他抢我', '说不清自己做了什么', '前后顺序乱'],
        abilityTags: ['冲突说明', '事件顺序', '情绪表达'],
        sceneKey: 'age_5_6_conflict_story_support',
        symptoms: [],
        defaultBottleneck: { title: '先用三步复盘冲突', text: '冲突复盘要先把事实顺序说清，再谈对错。' },
        defaultAction: { title: '今晚只问三句', steps: ['先发生什么。', '你做了什么。', '你希望下次怎么说。'] }
      },
      {
        key: 'age_5_6_family_review_short',
        categoryKey: 'social_expression',
        title: '回家复盘只说不知道',
        description: '问幼儿园、课堂或同伴互动时，常回答不知道、没有、忘了。',
        observableSigns: ['问一句答不知道', '不愿展开说', '需要大人猜场景'],
        abilityTags: ['家庭复盘', '叙事表达', '亲子沟通'],
        sceneKey: 'age_5_6_family_review_support',
        symptoms: [],
        defaultBottleneck: { title: '先用具体场景打开记忆', text: '泛泛复盘太抽象，具体到人、地点或一个活动更容易说。' },
        defaultAction: { title: '今晚只问一个同伴名字', steps: ['问今天和谁坐在一起。', '孩子说一个名字。', '大人接一句你记住他了。'] }
      },
      {
        key: 'age_5_6_need_request_too_vague',
        categoryKey: 'social_expression',
        title: '需要帮助时说得太笼统',
        description: '遇到打不开、不会做、找不到时，只说帮我或我不会。',
        observableSigns: ['只喊帮我', '不指出哪里卡住', '越急越说不清'],
        abilityTags: ['需求表达', '求助表达', '语言组织'],
        sceneKey: 'age_5_6_need_request_support',
        symptoms: [],
        defaultBottleneck: { title: '先把求助补成完整句', text: '求助太笼统时，需要孩子指出对象和动作。' },
        defaultAction: { title: '今晚练请帮我打开盒子', steps: ['准备一个盒子。', '孩子说请帮我打开盒子。', '大人打开一半让孩子完成。'] }
      }
    ]
  },
  {
    key: 'age_6_8',
    label: '6-8岁',
    title: '打好学习状态和基础体能',
    subtitle: '看孩子能不能坐得住、读得进去，并建立跳绳球类等协调基础。',
    focusAreas: ['基础学习状态', '阅读坐得住', '协调体能', '课堂专注'],
    parentSummary: '这个阶段家长最常遇到写作业启动难、阅读坐不住、跳绳学不会和上课走神。',
    painPoints: [
      {
        key: 'homework_start_hard',
        categoryKey: 'attention_learning',
        title: '写作业启动难',
        description: '会做但不开始，坐到桌前也磨很久。',
        observableSigns: ['坐下还发呆', '反复找借口', '第一题迟迟不开动'],
        abilityTags: ['学习启动', '课堂专注', '任务意识'],
        sceneKey: 'homework_restless',
        symptoms: [],
        defaultBottleneck: { title: '先看启动动作是否太大', text: '孩子可能会做，但从零开始太难，先缩到第一小步。' },
        defaultAction: { title: '今晚只做第一题第一步', steps: ['大人读第一题。', '孩子说这题要做什么。', '只写第一步就暂停。'] }
      },
      {
        key: 'reading_cannot_sit',
        categoryKey: 'attention_learning',
        title: '阅读坐不住',
        description: '看书两页就跑，读着读着分心。',
        observableSigns: ['读两页跑开', '眼睛离开书', '听故事坐不住'],
        abilityTags: ['阅读坐得住', '视觉追踪', '专注力'],
        sceneKey: 'picture_book_runs',
        symptoms: [],
        defaultBottleneck: { title: '先看阅读耐受时间', text: '阅读需要眼睛、身体和注意力一起工作，先从短时间完成开始。' },
        defaultAction: { title: '今晚只读一页并找一个字', steps: ['选一页。', '让孩子找一个认识的字或图。', '找到后就结束。'] }
      },
      {
        key: 'rope_skipping_hard',
        categoryKey: 'motor_fitness',
        title: '跳绳总学不会',
        description: '甩绳、起跳和落地配合不上。',
        observableSigns: ['绳子甩不过去', '跳早或跳晚', '连续跳不起来'],
        abilityTags: ['协调体能', '节奏感', '下肢力量'],
        sceneKey: 'rope_skipping_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先拆开甩绳和起跳', text: '跳绳是复合动作，先把节奏和起跳分开练更稳。' },
        defaultAction: { title: '今晚只练无绳跳 10 下', steps: ['双脚并拢。', '听大人口令跳 10 下。', '跳完后再模仿甩手 10 下。'] }
      },
      {
        key: 'class_attention_scattered',
        categoryKey: 'attention_learning',
        title: '上课容易走神',
        description: '课堂听着听着发呆，小动作多。',
        observableSigns: ['看窗外', '玩文具', '老师提醒才回神'],
        abilityTags: ['课堂走神', '课堂专注', '听觉注意', '身体控制'],
        sceneKey: 'class_attention_support',
        symptoms: [],
        defaultBottleneck: { title: '先看课堂注意是否缺抓手', text: '孩子需要知道听课时身体和眼睛先做什么。' },
        defaultAction: { title: '今晚练 2 分钟眼睛看说话人', steps: ['大人讲 2 句话。', '孩子眼睛看大人。', '说出听到的一个词。'] }
      },
      {
        key: 'confidence_low_when_hard',
        categoryKey: 'emotion_rules',
        title: '一难就说不会',
        description: '遇到难题或新动作就退缩，不愿试。',
        observableSigns: ['先说我不会', '不敢尝试', '失败一次就放弃'],
        abilityTags: ['自信建立', '挫折承受', '任务启动'],
        sceneKey: 'confidence_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先让孩子体验小成功', text: '孩子遇难退缩时，需要先把任务缩到肯定能完成的一步。' },
        defaultAction: { title: '今晚只做一个最简单版本', steps: ['把任务降到最简单。', '孩子完成一次。', '大人说：你完成了第一步。'] }
      },
      {
        key: 'age_6_8_first_problem_stuck',
        categoryKey: 'attention_learning',
        title: '第一题总卡着不动',
        description: '作业刚开始时盯着第一题发呆，会做也迟迟不下笔。',
        observableSigns: ['第一题看很久', '反复问怎么做', '笔拿着不写'],
        abilityTags: ['第一题启动', '学习启动', '任务意识'],
        sceneKey: 'age_6_8_first_problem_start_support',
        symptoms: [],
        defaultBottleneck: { title: '先把第一题拆成第一步', text: '启动难通常卡在从看题到动笔的第一小步。' },
        defaultAction: { title: '今晚只写第一题第一步', steps: ['大人读题。', '孩子说这题问什么。', '只写第一步或圈关键词。'] }
      },
      {
        key: 'age_6_8_homework_breaks_many',
        categoryKey: 'attention_learning',
        title: '写一会儿就找借口离开',
        description: '写作业中途频繁喝水、上厕所、找东西，学习块很难连续。',
        observableSigns: ['几分钟离开一次', '总说要拿东西', '回来后忘了写到哪'],
        abilityTags: ['基础学习状态', '持续注意', '学习耐受'],
        sceneKey: 'age_6_8_homework_block_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立短学习块', text: '连续写太久会拉高难度，先从短而完整的一段开始。' },
        defaultAction: { title: '今晚只写 8 分钟学习块', steps: ['开始前喝水上厕所。', '设 8 分钟计时。', '时间内只做当前一项作业。'] }
      },
      {
        key: 'age_6_8_reading_line_loses_place',
        categoryKey: 'attention_learning',
        title: '阅读容易串行漏字',
        description: '读课文或绘本时，眼睛容易跳行、漏字，读完也说不清。',
        observableSigns: ['读着读着跳行', '漏读词语', '复述内容很散'],
        abilityTags: ['阅读坐得住', '视觉追踪', '阅读耐受'],
        sceneKey: 'age_6_8_reading_tracking_support',
        symptoms: [],
        defaultBottleneck: { title: '先让眼睛稳定跟一行', text: '阅读坐不住有时卡在视觉追踪和持续注意。' },
        defaultAction: { title: '今晚用手指跟读 3 行', steps: ['选一小段文字。', '用手指沿着字走。', '只读 3 行后停下复述一句。'] }
      },
      {
        key: 'age_6_8_class_note_misses_key',
        categoryKey: 'attention_learning',
        title: '课堂重点总听漏',
        description: '老师讲规则、作业要求或重点时，孩子听到一半漏掉关键信息。',
        observableSigns: ['不知道作业要求', '回来问同学做什么', '老师提醒才记录'],
        abilityTags: ['课堂专注', '听觉注意', '信息抓取'],
        sceneKey: 'age_6_8_class_key_info_support',
        symptoms: [],
        defaultBottleneck: { title: '先练抓一个关键词', text: '课堂信息多时，先让孩子听出一个关键词再扩展。' },
        defaultAction: { title: '今晚听两句话抓关键词', steps: ['大人说两句要求。', '孩子说出一个关键词。', '再复述要做的一件事。'] }
      },
      {
        key: 'age_6_8_finish_no_check',
        categoryKey: 'attention_learning',
        title: '写完不会检查',
        description: '作业完成后马上收起，漏题、错字、单位和题号很少主动发现。',
        observableSigns: ['漏题没发现', '写完立刻收本', '不愿回看'],
        abilityTags: ['检查习惯', '自我监控', '学习习惯'],
        sceneKey: 'age_6_8_finish_check_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立一个固定检查项', text: '检查习惯要从一个容易执行的回看动作开始。' },
        defaultAction: { title: '今晚只检查题号有没有漏', steps: ['写完后停 30 秒。', '只看题号是否都做了。', '确认后再收本。'] }
      },
      {
        key: 'age_6_8_multi_step_homework_order_messy',
        categoryKey: 'attention_learning',
        title: '多项作业顺序总乱',
        description: '语文、数学、阅读、打卡混在一起时，不知道先做什么。',
        observableSigns: ['先做喜欢的再拖难的', '做到一半换科目', '临睡前发现漏项'],
        abilityTags: ['作业顺序', '执行计划', '自我管理'],
        sceneKey: 'age_6_8_homework_order_support',
        symptoms: [],
        defaultBottleneck: { title: '先把作业外化成三项清单', text: '顺序乱时，孩子需要看见任务并选定起点。' },
        defaultAction: { title: '今晚只排前三项作业', steps: ['把作业写成三张纸条。', '孩子选择先后顺序。', '只开始第一项 8 分钟。'] }
      },
      {
        key: 'age_6_8_careless_mistakes_repeat',
        categoryKey: 'attention_learning',
        title: '会做但粗心错反复有',
        description: '题目理解了，但常因为看漏、抄错、算漏一步而出错。',
        observableSigns: ['会讲但写错', '抄题漏字', '单位或符号看错'],
        abilityTags: ['学习习惯', '视觉注意', '自我检查'],
        sceneKey: 'age_6_8_careless_mistake_support',
        symptoms: [],
        defaultBottleneck: { title: '先区分不会和看漏', text: '粗心反复出现时，先建立读题和回看的小动作。' },
        defaultAction: { title: '今晚只圈题目关键词', steps: ['做题前圈一个关键词。', '写完后对照关键词。', '只练 3 题。'] }
      },
      {
        key: 'age_6_8_homework_refusal_evening',
        categoryKey: 'emotion_rules',
        title: '一到写作业就抗拒',
        description: '晚上开始写作业前，孩子拖延、抱怨或情绪变大。',
        observableSigns: ['说不想写', '磨蹭很久不坐下', '一提醒就烦'],
        abilityTags: ['作业抗拒', '学习启动', '情绪调节'],
        sceneKey: 'age_6_8_homework_refusal_support',
        symptoms: [],
        defaultBottleneck: { title: '先降低作业开始的心理门槛', text: '作业抗拒常卡在开始前的压力感，先只进入第一小段。' },
        defaultAction: { title: '今晚只启动 6 分钟', steps: ['把作业摆好。', '设 6 分钟计时。', '只做最容易的一小题。'] }
      },
      {
        key: 'age_6_8_reminded_breaks_down',
        categoryKey: 'emotion_rules',
        title: '被提醒就崩溃',
        description: '写作业、阅读或收拾时被提醒，孩子容易哭、顶嘴或说不写了。',
        observableSigns: ['提醒后哭', '说你别管我', '把本子推开'],
        abilityTags: ['被提醒崩溃', '情绪调节', '规则接受'],
        sceneKey: 'age_6_8_reminder_breakdown_support',
        symptoms: [],
        defaultBottleneck: { title: '先把提醒改成一个可选动作', text: '提醒让孩子感觉被否定时，先给下一步选择。' },
        defaultAction: { title: '今晚只给两个选择', steps: ['说先改第一题还是先读题。', '孩子选一个。', '只完成被选的动作。'] }
      },
      {
        key: 'age_6_8_hard_problem_withdraws',
        categoryKey: 'emotion_rules',
        title: '遇到难题就退缩',
        description: '题目稍难或读不懂时，孩子马上说不会，拒绝继续尝试。',
        observableSigns: ['先说太难了', '空着不写', '要求大人直接讲答案'],
        abilityTags: ['难题退缩', '挫折承受', '学习自信'],
        sceneKey: 'age_6_8_hard_problem_support',
        symptoms: [],
        defaultBottleneck: { title: '先保留一道题里的可做部分', text: '难题不是一次解决，先找孩子能完成的一小步。' },
        defaultAction: { title: '今晚只圈出已知条件', steps: ['遇到难题先读一遍。', '只圈出知道的信息。', '圈完就先停。'] }
      },
      {
        key: 'age_6_8_evening_flow_drags',
        categoryKey: 'emotion_rules',
        title: '晚上流程越拖越晚',
        description: '作业、洗漱、阅读、睡觉顺序拖乱，越晚情绪越大。',
        observableSigns: ['作业拖到睡前', '洗漱反复催', '临睡还没收书包'],
        abilityTags: ['流程拖延', '自我管理', '生活规则'],
        sceneKey: 'age_6_8_evening_flow_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定一个晚上锚点', text: '流程拖延时，先让一个关键动作稳定出现。' },
        defaultAction: { title: '今晚固定作业后收书包', steps: ['写完当前一项。', '马上把本子放进书包。', '拉上拉链再去洗漱。'] }
      },
      {
        key: 'age_6_8_learning_interruption_recover_slow',
        categoryKey: 'emotion_rules',
        title: '学习中断后回不来',
        description: '喝水、上厕所、被打断后，孩子很难回到原来的题目或阅读。',
        observableSigns: ['回来后忘了写哪', '继续玩别的', '要重新催开始'],
        abilityTags: ['学习中断恢复', '任务切换', '自我管理'],
        sceneKey: 'age_6_8_learning_reentry_support',
        symptoms: [],
        defaultBottleneck: { title: '先给中断前留一个回位标记', text: '中断恢复难时，要让孩子知道回来从哪里继续。' },
        defaultAction: { title: '今晚用铅笔点标记回位', steps: ['离开前在下一题旁点一点。', '回来先找铅笔点。', '只继续这一题。'] }
      },
      {
        key: 'age_6_8_mistake_shame_angry',
        categoryKey: 'emotion_rules',
        title: '错了就羞恼不让看',
        description: '发现作业错了时，孩子遮住本子、发火或不让大人讲。',
        observableSigns: ['挡住本子', '说别看了', '擦很多次还生气'],
        abilityTags: ['错误恢复', '学习自信', '情绪安全'],
        sceneKey: 'age_6_8_mistake_shame_support',
        symptoms: [],
        defaultBottleneck: { title: '先把错题变成可修正动作', text: '孩子害怕错误时，需要体验错了还能改。' },
        defaultAction: { title: '今晚只改一个小错误', steps: ['选一个最小错误。', '说我们只改这一处。', '改完马上合上本子。'] }
      },
      {
        key: 'age_6_8_rule_change_in_homework_upset',
        categoryKey: 'emotion_rules',
        title: '学习规则一变就不接受',
        description: '作业顺序、检查方式或学习时间调整时，孩子很难接受。',
        observableSigns: ['坚持原来做法', '说不公平', '不愿换顺序'],
        abilityTags: ['规则弹性', '学习规则', '情绪调节'],
        sceneKey: 'age_6_8_homework_rule_change_support',
        symptoms: [],
        defaultBottleneck: { title: '先只改变一个小规则', text: '学习规则变化太多会引发对抗，先改一个很小的点。' },
        defaultAction: { title: '今晚只调整一项顺序', steps: ['保留原来流程。', '只把阅读提前到作业前。', '执行一次就结束。'] }
      },
      {
        key: 'age_6_8_transition_screen_to_homework_hard',
        categoryKey: 'emotion_rules',
        title: '从屏幕切到作业很难',
        description: '动画、游戏或平板结束后，很难进入作业和阅读状态。',
        observableSigns: ['关屏后发脾气', '继续谈刚才内容', '坐下也心不在焉'],
        abilityTags: ['活动切换', '作业抗拒', '自我管理'],
        sceneKey: 'age_6_8_screen_to_homework_support',
        symptoms: [],
        defaultBottleneck: { title: '先加一个过渡动作', text: '从强刺激切到学习，需要身体和注意力慢慢降速。' },
        defaultAction: { title: '今晚关屏后先倒水', steps: ['关屏后不马上写。', '孩子去倒一杯水。', '喝完水再打开作业本。'] }
      },
      {
        key: 'age_6_8_parent_sits_near_tension',
        categoryKey: 'emotion_rules',
        title: '大人一坐旁边就紧张',
        description: '家长陪写时，孩子容易紧绷、急躁或频繁问对不对。',
        observableSigns: ['一直看家长表情', '写一题问一次', '家长提醒就急'],
        abilityTags: ['学习安全感', '自主学习', '情绪调节'],
        sceneKey: 'age_6_8_parent_near_tension_support',
        symptoms: [],
        defaultBottleneck: { title: '先把陪写距离拉开一点', text: '孩子对监督敏感时，需要降低被盯着的感觉。' },
        defaultAction: { title: '今晚家长坐远一点', steps: ['孩子写题时家长坐一米外。', '约定写完两题再看。', '只反馈一个具体做对的地方。'] }
      },
      {
        key: 'age_6_8_running_tires_quickly',
        categoryKey: 'motor_fitness',
        title: '跑步一会儿就累',
        description: '体育课、课间跑跳或户外活动中，很快喘、停下或不愿继续。',
        observableSigns: ['跑几分钟就停', '呼吸很乱', '总落在队伍后面'],
        abilityTags: ['跑步耐力', '基础体能', '心肺基础'],
        sceneKey: 'age_6_8_running_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先用跑走交替建立耐受', text: '跑步累时不要一开始硬撑，先让身体习惯短循环。' },
        defaultAction: { title: '今晚跑 30 秒走 30 秒', steps: ['慢跑 30 秒。', '走路 30 秒。', '重复 4 轮。'] }
      },
      {
        key: 'age_6_8_core_plank_weak',
        categoryKey: 'motor_fitness',
        title: '核心弱动作撑不住',
        description: '仰卧起坐、平板、坐姿写字和跳跃落地时，身体稳定性不足。',
        observableSigns: ['平板很快塌腰', '写字趴桌', '跳完身体晃'],
        abilityTags: ['核心稳定', '体态控制', '身体控制'],
        sceneKey: 'age_6_8_core_strength_support',
        symptoms: [],
        defaultBottleneck: { title: '先练短时间核心支撑', text: '核心弱会同时影响学习姿势和运动动作，先从短支撑开始。' },
        defaultAction: { title: '今晚做 3 组 10 秒平板', steps: ['手肘撑地。', '保持 10 秒。', '休息后重复 3 组。'] }
      },
      {
        key: 'age_6_8_ball_games_uncoordinated',
        categoryKey: 'motor_fitness',
        title: '球类游戏跟不上',
        description: '篮球、足球、接抛球时反应慢，手脚和眼睛配合不稳。',
        observableSigns: ['接球漏掉', '拍球不连续', '踢球方向偏'],
        abilityTags: ['球类协调', '手眼协调', '动作计划'],
        sceneKey: 'age_6_8_ball_game_support',
        symptoms: [],
        defaultBottleneck: { title: '先把球类动作拆成单项', text: '球类协调需要视觉追踪和动作计划，先练一个动作。' },
        defaultAction: { title: '今晚只做墙面抛接 10 次', steps: ['对墙轻轻抛球。', '双手接住。', '累计 10 次就结束。'] }
      },
      {
        key: 'age_6_8_exercise_habit_start_hard',
        categoryKey: 'motor_fitness',
        title: '运动习惯刚开始就断',
        description: '计划每天运动，但常因为作业、天气或没兴趣停掉。',
        observableSigns: ['前两天练后面停', '没有固定时间', '需要家长催才动'],
        abilityTags: ['运动习惯起步', '长期坚持', '自我管理'],
        sceneKey: 'age_6_8_exercise_habit_start_support',
        symptoms: [],
        defaultBottleneck: { title: '先把运动固定到一个低门槛时段', text: '习惯起步靠稳定出现，不靠一次练很多。' },
        defaultAction: { title: '今晚固定 3 分钟运动', steps: ['选饭后或洗澡前。', '只运动 3 分钟。', '做完在日历打勾。'] }
      },
      {
        key: 'age_6_8_jump_rope_rhythm_breaks',
        categoryKey: 'motor_fitness',
        title: '跳绳节奏总断',
        description: '能跳几下，但甩绳和起跳节奏不稳定，连续性差。',
        observableSigns: ['跳几下绳就绊住', '手脚不同步', '速度一快就乱'],
        abilityTags: ['跳绳节奏', '协调体能', '下肢力量'],
        sceneKey: 'age_6_8_rope_rhythm_support',
        symptoms: [],
        defaultBottleneck: { title: '先稳定无绳节奏', text: '连续跳绳要先让脚步节奏稳定，再加绳。' },
        defaultAction: { title: '今晚无绳跳 20 下', steps: ['双脚并拢。', '按口令慢跳 20 下。', '只模仿甩绳不拿绳。'] }
      },
      {
        key: 'age_6_8_agility_direction_slow',
        categoryKey: 'motor_fitness',
        title: '变向跑反应慢',
        description: '追逐、折返跑、躲避游戏中，转身和变向慢半拍。',
        observableSigns: ['转身慢', '容易撞到人', '听到方向后反应慢'],
        abilityTags: ['敏捷变向', '身体控制', '前庭觉'],
        sceneKey: 'age_6_8_agility_direction_support',
        symptoms: [],
        defaultBottleneck: { title: '先练低速方向切换', text: '变向慢需要身体刹车和方向判断一起练。' },
        defaultAction: { title: '今晚做 6 次左右点地', steps: ['地上放左右两个标记。', '听口令摸左或右。', '累计 6 次就结束。'] }
      },
      {
        key: 'age_6_8_fine_motor_writing_fatigue',
        categoryKey: 'motor_fitness',
        title: '写字时间长手累',
        description: '写字、抄写、画图时间稍长就手酸、字变形或坐姿塌。',
        observableSigns: ['握笔很紧', '越写越歪', '写一会甩手'],
        abilityTags: ['精细动作耐受', '手部力量', '体态控制'],
        sceneKey: 'age_6_8_writing_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先拆开手部耐受和书写量', text: '写字疲劳需要手部力量和坐姿支持，先短量完成。' },
        defaultAction: { title: '今晚只写 3 行后放松手', steps: ['只写 3 行。', '写完做 5 次握拳张开。', '再决定是否继续。'] }
      },
      {
        key: 'age_6_8_posture_slouch_homework',
        categoryKey: 'motor_fitness',
        title: '写作业坐姿总塌',
        description: '学习时趴桌、歪坐、腿晃，写一会姿势就撑不住。',
        observableSigns: ['胸口贴桌', '头越低越近', '身体歪到一边'],
        abilityTags: ['体态控制', '核心稳定', '学习姿势'],
        sceneKey: 'age_6_8_homework_posture_support',
        symptoms: [],
        defaultBottleneck: { title: '先调整桌椅和短时间姿势', text: '坐姿塌和核心稳定、桌椅高度都有关系，先短时间维持。' },
        defaultAction: { title: '今晚只维持 5 分钟坐姿', steps: ['脚踩地。', '本子放正。', '计时 5 分钟后起身活动。'] }
      },
      {
        key: 'age_6_8_recovery_after_pe_slow',
        categoryKey: 'motor_fitness',
        title: '体育后很久缓不过来',
        description: '体育课或户外运动后，疲劳、烦躁或兴奋持续很久。',
        observableSigns: ['运动后很累', '回家更烦躁', '坐下也安静不下来'],
        abilityTags: ['体能恢复', '身体觉察', '自我调节'],
        sceneKey: 'age_6_8_pe_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立运动后恢复流程', text: '体能恢复慢时，需要喝水、慢走和呼吸把身体带下来。' },
        defaultAction: { title: '今晚运动后 3 分钟恢复', steps: ['慢走 1 分钟。', '喝水。', '做 5 次慢呼气。'] }
      },
      {
        key: 'age_6_8_peer_conflict_cannot_explain',
        categoryKey: 'social_expression',
        title: '和同学冲突说不清',
        description: '发生争抢、推挤或误会后，孩子只能说对方不好，很难讲清经过。',
        observableSigns: ['只说别人先弄我', '讲不清先后', '越解释越急'],
        abilityTags: ['冲突表达', '事件顺序', '同伴关系'],
        sceneKey: 'age_6_8_peer_conflict_explain_support',
        symptoms: [],
        defaultBottleneck: { title: '先把冲突讲成三句话', text: '同伴冲突后，孩子需要先按先后说清发生了什么。' },
        defaultAction: { title: '今晚只练三句话复盘', steps: ['先说我做了什么。', '再说对方做了什么。', '最后说我希望怎样。'] }
      },
      {
        key: 'age_6_8_group_join_hesitates',
        categoryKey: 'social_expression',
        title: '想加入小组但开不了口',
        description: '看到同学一起玩或合作任务时，想加入却站在旁边等。',
        observableSigns: ['在旁边看很久', '等别人邀请', '突然插入被拒绝'],
        abilityTags: ['同伴加入', '表达信心', '社交安全感'],
        sceneKey: 'age_6_8_group_join_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句加入话', text: '孩子想加入时，最难的是第一句话和靠近方式。' },
        defaultAction: { title: '今晚只练一句加入请求', steps: ['大人扮演同学。', '孩子说我可以一起玩吗。', '说完后一起玩 1 分钟。'] }
      },
      {
        key: 'age_6_8_class_speaking_voice_small',
        categoryKey: 'social_expression',
        title: '课堂发言声音很小',
        description: '知道答案但不敢举手，或发言声音小到老师同学听不清。',
        observableSigns: ['会答案也低头', '说话很轻', '被点名就紧张'],
        abilityTags: ['课堂表达', '表达信心', '声音控制'],
        sceneKey: 'age_6_8_class_speaking_support',
        symptoms: [],
        defaultBottleneck: { title: '先把发言缩成一句短答', text: '课堂表达需要安全感和声音练习，先准备一句能说清的话。' },
        defaultAction: { title: '今晚只练 3 次短答', steps: ['大人问一个简单问题。', '孩子用完整一句回答。', '声音让一米外听见。'] }
      },
      {
        key: 'age_6_8_teamwork_role_unclear',
        categoryKey: 'social_expression',
        title: '小组合作不知道做什么',
        description: '小组任务、运动游戏或班级活动里，不知道自己该承担哪一步。',
        observableSigns: ['等别人安排', '抢着做同一件事', '做着做着退出'],
        abilityTags: ['小组合作', '角色意识', '同伴沟通'],
        sceneKey: 'age_6_8_teamwork_role_support',
        symptoms: [],
        defaultBottleneck: { title: '先让孩子选一个清楚角色', text: '小组合作混乱时，孩子需要知道自己负责哪一件小事。' },
        defaultAction: { title: '今晚家庭任务只选一个角色', steps: ['准备一个两人任务。', '孩子选递东西或记录。', '只完成这个角色。'] }
      },
      {
        key: 'age_6_8_friendship_rejection_sensitive',
        categoryKey: 'social_expression',
        title: '被同学拒绝就很受伤',
        description: '邀请同学玩被拒绝后，很久都难过或认定别人不喜欢自己。',
        observableSigns: ['被拒后不再尝试', '回家反复说没人理我', '第二天怕见同学'],
        abilityTags: ['同伴关系', '拒绝应对', '情绪表达'],
        sceneKey: 'age_6_8_friend_rejection_support',
        symptoms: [],
        defaultBottleneck: { title: '先把拒绝解释成一种情况', text: '孩子容易把一次拒绝理解成关系否定，需要练习更具体的解释。' },
        defaultAction: { title: '今晚练两种可能原因', steps: ['说出被拒绝的场景。', '一起想两个可能原因。', '准备明天一句新邀请。'] }
      },
      {
        key: 'age_6_8_share_turns_conflict',
        categoryKey: 'social_expression',
        title: '分享轮流时容易争起来',
        description: '玩具、器材、图书或座位需要轮流时，孩子容易抢先或急着争辩。',
        observableSigns: ['不愿等轮到自己', '别人拿走就急', '说好了也反悔'],
        abilityTags: ['轮流分享', '规则表达', '同伴合作'],
        sceneKey: 'age_6_8_share_turn_support',
        symptoms: [],
        defaultBottleneck: { title: '先让轮流规则看得见', text: '轮流冲突常来自等待不确定，先用清楚顺序降低拉扯。' },
        defaultAction: { title: '今晚用两张纸条轮流', steps: ['写下我先你后。', '每人玩 1 分钟。', '换人时移动纸条。'] }
      },
      {
        key: 'age_6_8_need_help_cannot_ask',
        categoryKey: 'social_expression',
        title: '需要帮助却不会开口',
        description: '学习、运动或同伴活动卡住时，孩子等别人发现，或直接放弃。',
        observableSigns: ['卡住后沉默', '不问老师同学', '等大人主动帮'],
        abilityTags: ['求助表达', '问题说明', '表达信心'],
        sceneKey: 'age_6_8_help_request_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句具体求助话', text: '求助难的孩子需要把问题说到一个具体位置。' },
        defaultAction: { title: '今晚只练我卡在这里', steps: ['拿一道简单题。', '孩子指出卡住的位置。', '说我卡在这里，请帮我看第一步。'] }
      },
      {
        key: 'age_6_8_tell_school_day_scattered',
        categoryKey: 'social_expression',
        title: '放学讲事情很散',
        description: '想说学校发生了什么，但前后跳、人物不清，家长很难听懂。',
        observableSigns: ['说到一半换话题', '人物时间混在一起', '问细节答不上来'],
        abilityTags: ['叙事表达', '事件顺序', '亲子沟通'],
        sceneKey: 'age_6_8_school_day_story_support',
        symptoms: [],
        defaultBottleneck: { title: '先用时间顺序接住表达', text: '讲事情散时，先用早上、中午、下午帮孩子排序。' },
        defaultAction: { title: '今晚只讲一件学校小事', steps: ['问今天一件有意思的事。', '孩子说谁在哪里。', '再补一句后来怎样。'] }
      },
      {
        key: 'age_6_8_joke_teasing_boundary_unclear',
        categoryKey: 'social_expression',
        title: '玩笑和冒犯分不清',
        description: '同学开玩笑或起外号时，孩子分不清是玩还是被冒犯，也难表达边界。',
        observableSigns: ['别人笑就跟着笑', '回家才委屈', '生气时直接推人'],
        abilityTags: ['边界表达', '同伴关系', '感受表达'],
        sceneKey: 'age_6_8_teasing_boundary_support',
        symptoms: [],
        defaultBottleneck: { title: '先分辨身体和心里的不舒服', text: '边界表达要从感觉到不舒服开始，再说出停止请求。' },
        defaultAction: { title: '今晚练一句停止话', steps: ['说一个玩笑场景。', '孩子判断舒服或不舒服。', '练习说请别这样叫我。'] }
      },
      {
        key: 'age_6_8_apology_repair_hard',
        categoryKey: 'social_expression',
        title: '做错后不会修复关系',
        description: '弄疼别人、说错话或抢东西后，孩子尴尬、逃开或只说一句对不起就结束。',
        observableSigns: ['道歉很小声', '说完马上走', '不知道怎么补救'],
        abilityTags: ['关系修复', '道歉表达', '同理心'],
        sceneKey: 'age_6_8_apology_repair_support',
        symptoms: [],
        defaultBottleneck: { title: '先把道歉接到一个补救动作', text: '关系修复需要表达歉意，也需要一个具体补救动作。' },
        defaultAction: { title: '今晚练道歉加补救', steps: ['说一句对不起，我刚才弄疼你了。', '问你需要我怎么做。', '做一个小补救动作。'] }
      }
    ]
  },
  {
    key: 'age_8_9',
    label: '8-9岁',
    title: '开始支持学习能力和执行力',
    subtitle: '看孩子阅读、计划、执行和运动习惯能不能稳定起来。',
    focusAreas: ['学习能力底层支持', '执行力', '阅读效率', '体测准备起步'],
    parentSummary: '这个阶段家长最常担心阅读慢、学习一会儿就烦、作业拖延和体测开始吃力。',
    painPoints: [
      {
        key: 'reading_slow_forgets',
        categoryKey: 'attention_learning',
        title: '阅读慢又记不住',
        description: '读完一段很快忘，不知道重点在哪里。',
        observableSigns: ['读得慢', '复述困难', '抓不住重点'],
        abilityTags: ['阅读效率', '学习能力底层支持', '持续注意'],
        sceneKey: 'reading_efficiency_support',
        symptoms: [],
        defaultBottleneck: { title: '先看阅读耐力和信息抓取', text: '阅读慢可能和视觉追踪、持续注意和信息组织有关。' },
        defaultAction: { title: '今晚只读一小段并圈一个关键词', steps: ['选 3 句话。', '读完圈一个关键词。', '用这个词说一句内容。'] }
      },
      {
        key: 'study_patience_low',
        categoryKey: 'attention_learning',
        title: '学习一会儿就烦',
        description: '学习刚开始还能做，很快烦躁或逃避。',
        observableSigns: ['做一会儿叹气', '说太烦了', '想马上停'],
        abilityTags: ['学习能力底层支持', '情绪调节', '学习耐心'],
        sceneKey: 'study_patience_support',
        symptoms: [],
        defaultBottleneck: { title: '先看学习耐受时间', text: '孩子可能不是不想学，而是当前耐受时间短，需要先保护开始。' },
        defaultAction: { title: '今晚只做 6 分钟学习块', steps: ['设 6 分钟计时。', '只做一个小任务。', '时间到先休息 2 分钟。'] }
      },
      {
        key: 'homework_planning_weak',
        categoryKey: 'attention_learning',
        title: '作业总拖到最后',
        description: '知道要写，但不会安排顺序和时间。',
        observableSigns: ['先玩再急', '不知道先写什么', '临睡前赶作业'],
        abilityTags: ['执行力', '计划能力', '自我管理'],
        sceneKey: 'homework_planning_support',
        symptoms: [],
        defaultBottleneck: { title: '先把任务排序变清楚', text: '拖延常见于不知道先做哪一项，先把顺序外化出来。' },
        defaultAction: { title: '今晚只排前三个作业顺序', steps: ['把作业写成 3 项。', '让孩子选先做哪一项。', '只开始第一项前 5 分钟。'] }
      },
      {
        key: 'age_8_9_key_point_weak',
        categoryKey: 'attention_learning',
        title: '读完抓不住重点',
        description: '课文、题干或阅读材料能读完，但说不出最关键的信息。',
        observableSigns: ['复述很多细节', '不知道哪句重要', '回答总偏题'],
        abilityTags: ['抓重点弱', '阅读效率', '信息组织'],
        sceneKey: 'age_8_9_key_point_support',
        symptoms: [],
        defaultBottleneck: { title: '先练一段只抓一个重点', text: '抓重点弱时，不急着概括全文，先从一小段里选一句最重要的话。' },
        defaultAction: { title: '今晚只圈一句重点', steps: ['读一小段。', '圈一句最重要的话。', '用这句话说出这段讲什么。'] }
      },
      {
        key: 'age_8_9_wrong_question_review_missing',
        categoryKey: 'attention_learning',
        title: '错题看过就算了',
        description: '错题订正后很快忘，下一次遇到类似题仍然错。',
        observableSigns: ['只改答案', '不说错因', '同类题反复错'],
        abilityTags: ['错题复盘', '学习能力底层支持', '自我监控'],
        sceneKey: 'age_8_9_wrong_question_review_support',
        symptoms: [],
        defaultBottleneck: { title: '先把错因说成一句话', text: '错题复盘要从知道错在哪里开始，再谈同类迁移。' },
        defaultAction: { title: '今晚只复盘一道错题', steps: ['选一道刚错的题。', '说出错在看漏、算错还是不会。', '写一句下次先看什么。'] }
      },
      {
        key: 'age_8_9_multi_subject_switch_messy',
        categoryKey: 'attention_learning',
        title: '多科作业切换很乱',
        description: '语文、数学、英语、阅读混在一起时，孩子频繁换来换去。',
        observableSigns: ['一会写语文一会写数学', '漏掉打卡任务', '桌面材料堆满'],
        abilityTags: ['作业规划', '执行力', '任务切换'],
        sceneKey: 'age_8_9_multi_subject_switch_support',
        symptoms: [],
        defaultBottleneck: { title: '先把科目切换次数降下来', text: '多科作业乱时，先固定一个顺序和一个收尾动作。' },
        defaultAction: { title: '今晚只排三科顺序', steps: ['写下今晚三项作业。', '标 1、2、3。', '完成一项再拿下一项。'] }
      },
      {
        key: 'age_8_9_long_text_summary_hard',
        categoryKey: 'attention_learning',
        title: '长一点内容就概括不了',
        description: '阅读、听课或看说明时，一长就只记零散点，很难合成一句话。',
        observableSigns: ['只记住开头', '概括变成照读', '说不出主要意思'],
        abilityTags: ['概括能力', '阅读效率', '信息组织'],
        sceneKey: 'age_8_9_summary_support',
        symptoms: [],
        defaultBottleneck: { title: '先用谁做了什么来概括', text: '概括困难时，用固定句式帮助孩子把信息合起来。' },
        defaultAction: { title: '今晚用一句话概括 5 行', steps: ['读 5 行文字。', '回答谁做了什么。', '把答案写成一句话。'] }
      },
      {
        key: 'age_8_9_independent_start_needs_prompt',
        categoryKey: 'attention_learning',
        title: '独立开始总要提醒',
        description: '知道作业内容，也有时间，但需要家长多次提醒才开始。',
        observableSigns: ['到点还没动', '问了才拿书', '家长离开就停'],
        abilityTags: ['独立启动', '执行力', '自我管理'],
        sceneKey: 'age_8_9_independent_start_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立到点自动第一步', text: '独立开始需要固定触发动作，减少家长反复催促。' },
        defaultAction: { title: '今晚到点只做第一步', steps: ['约定开始时间。', '到点自己拿出第一本作业。', '只写日期或题号。'] }
      },
      {
        key: 'age_8_9_time_estimation_weak',
        categoryKey: 'attention_learning',
        title: '总估不准要花多久',
        description: '孩子常以为很快能完成，结果拖到很晚或中途着急。',
        observableSigns: ['说马上就好', '实际用时翻倍', '临睡前赶进度'],
        abilityTags: ['时间估计', '作业规划', '执行力'],
        sceneKey: 'age_8_9_time_estimation_support',
        symptoms: [],
        defaultBottleneck: { title: '先记录一项真实用时', text: '时间估计弱时，先让孩子看到一项作业实际花了多久。' },
        defaultAction: { title: '今晚只计时一项作业', steps: ['开始前猜要几分钟。', '实际计时完成。', '对比猜测和真实用时。'] }
      },
      {
        key: 'age_8_9_homework_quality_unstable',
        categoryKey: 'attention_learning',
        title: '作业质量时好时坏',
        description: '有时写得认真，有时漏题、字乱、步骤少，状态波动明显。',
        observableSigns: ['前面认真后面乱', '简单题也漏', '检查标准不固定'],
        abilityTags: ['作业质量', '自我监控', '学习习惯'],
        sceneKey: 'age_8_9_homework_quality_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定一个质量检查标准', text: '质量波动时，先把检查从感觉改成一个可见标准。' },
        defaultAction: { title: '今晚只检查一个标准', steps: ['写完后只看有没有漏题。', '确认后再看字迹。', '只选一个地方改好。'] }
      },
      {
        key: 'age_8_9_study_frustration_fast',
        categoryKey: 'emotion_rules',
        title: '学习一烦就想停',
        description: '作业、阅读或背诵稍微不顺，孩子很快烦躁并要求休息。',
        observableSigns: ['叹气变多', '说太烦了', '推开书本'],
        abilityTags: ['学习烦躁', '情绪调节', '学习耐受'],
        sceneKey: 'age_8_9_study_frustration_support',
        symptoms: [],
        defaultBottleneck: { title: '先把烦躁前的学习块缩短', text: '学习烦躁常在耐受用完后爆发，先用短计划保住完成感。' },
        defaultAction: { title: '今晚只做 8 分钟学习块', steps: ['设 8 分钟计时。', '只做当前一项。', '时间到休息 2 分钟再决定是否继续。'] }
      },
      {
        key: 'age_8_9_deadline_last_minute_panic',
        categoryKey: 'emotion_rules',
        title: '拖到最后就慌',
        description: '知道任务要完成，但总拖到临近截止才紧张、发火或赶工。',
        observableSigns: ['临睡前突然着急', '赶作业时哭闹', '抱怨时间不够'],
        abilityTags: ['拖到最后', '时间管理', '情绪调节'],
        sceneKey: 'age_8_9_last_minute_support',
        symptoms: [],
        defaultBottleneck: { title: '先把截止前移到一个小节点', text: '拖到最后时，孩子需要更早看到第一个完成节点。' },
        defaultAction: { title: '今晚先定第一个小截止', steps: ['写下最晚完成时间。', '往前挪 20 分钟做第一项。', '完成第一项就打勾。'] }
      },
      {
        key: 'age_8_9_failure_withdraws_quickly',
        categoryKey: 'emotion_rules',
        title: '失败一次就不想再试',
        description: '题做错、背不出或运动没做好后，很快说自己不行。',
        observableSigns: ['说我就是不会', '拒绝再来一次', '把错误当成丢脸'],
        abilityTags: ['失败退缩', '挫折承受', '学习自信'],
        sceneKey: 'age_8_9_failure_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先让失败后还有一个可做动作', text: '失败退缩时，需要把再试一次缩成可承受的小动作。' },
        defaultAction: { title: '今晚只做一次改小重试', steps: ['选刚失败的一小步。', '降低难度再做一次。', '完成后说出刚才哪一步变好了。'] }
      },
      {
        key: 'age_8_9_plan_change_upset',
        categoryKey: 'emotion_rules',
        title: '计划一变就不接受',
        description: '原定学习、运动或休息安排变化时，孩子容易生气或卡住。',
        observableSigns: ['坚持原计划', '说你说话不算数', '变化后不肯动'],
        abilityTags: ['计划变化', '规则弹性', '情绪调节'],
        sceneKey: 'age_8_9_plan_change_support',
        symptoms: [],
        defaultBottleneck: { title: '先保留计划里的一个确定项', text: '计划变化会带来失控感，先保留一个确定动作帮助过渡。' },
        defaultAction: { title: '今晚变化时保留一项', steps: ['说明哪一项变了。', '保留一个原计划动作。', '让孩子选先做保留项还是新安排。'] }
      },
      {
        key: 'age_8_9_parent_study_talk_conflict',
        categoryKey: 'emotion_rules',
        title: '一聊学习就顶嘴',
        description: '家长询问作业、成绩或阅读情况时，孩子很快防御、顶嘴或沉默。',
        observableSigns: ['说你别管', '问两句就吵', '不愿说学习情况'],
        abilityTags: ['家庭沟通冲突', '学习压力表达', '亲子沟通'],
        sceneKey: 'age_8_9_study_talk_conflict_support',
        symptoms: [],
        defaultBottleneck: { title: '先把学习沟通改成一个事实问题', text: '学习沟通容易变成评价，先问事实能降低防御。' },
        defaultAction: { title: '今晚只问一个事实问题', steps: ['问今天哪项作业最先完成。', '听完只复述。', '暂时不评价对错快慢。'] }
      },
      {
        key: 'age_8_9_perfectionism_erases_many_times',
        categoryKey: 'emotion_rules',
        title: '写不好就反复擦',
        description: '写字、画图、做题步骤不满意时，孩子反复擦改导致时间很久。',
        observableSigns: ['一行擦很多次', '嫌自己写得丑', '越改越急'],
        abilityTags: ['完美倾向', '学习自信', '情绪调节'],
        sceneKey: 'age_8_9_perfectionism_support',
        symptoms: [],
        defaultBottleneck: { title: '先定义够好标准', text: '反复擦改常来自标准模糊，先定一个够好即可的标准。' },
        defaultAction: { title: '今晚只允许每题改一次', steps: ['开始前说每题只改一次。', '选最需要改的一处。', '改完就进入下一题。'] }
      },
      {
        key: 'age_8_9_compares_with_classmates',
        categoryKey: 'emotion_rules',
        title: '总和同学比到难过',
        description: '看到同学成绩、阅读速度或运动表现更好后，孩子情绪低落。',
        observableSigns: ['说别人都比我强', '不愿展示作业', '听到排名就紧张'],
        abilityTags: ['同伴比较', '学习自信', '情绪表达'],
        sceneKey: 'age_8_9_classmate_compare_support',
        symptoms: [],
        defaultBottleneck: { title: '先把比较转成自己的一个进步点', text: '比较带来压力时，需要回到孩子自己可改变的小指标。' },
        defaultAction: { title: '今晚只找一个自己进步点', steps: ['说出今天一个做得比昨天好的地方。', '写在纸上。', '明天只继续这个点。'] }
      },
      {
        key: 'age_8_9_break_time_return_conflict',
        categoryKey: 'emotion_rules',
        title: '休息后很难回到学习',
        description: '学习中间休息后，孩子不愿回来，容易讨价还价或发脾气。',
        observableSigns: ['休息越拖越长', '回桌前开始烦', '说再玩一会'],
        abilityTags: ['休息返回', '规则执行', '自我管理'],
        sceneKey: 'age_8_9_break_return_support',
        symptoms: [],
        defaultBottleneck: { title: '先让休息有清楚结束信号', text: '休息回不来时，问题常在结束信号和返回动作不清楚。' },
        defaultAction: { title: '今晚休息前定返回动作', steps: ['休息前放好下一题。', '设 3 分钟计时。', '铃响先坐回椅子。'] }
      },
      {
        key: 'age_8_9_morning_school_rush_irritable',
        categoryKey: 'emotion_rules',
        title: '早上上学前容易急躁',
        description: '起床、洗漱、整理书包和出门环节挤在一起，孩子容易烦躁。',
        observableSigns: ['找东西找不到', '催促后发火', '出门前哭丧脸'],
        abilityTags: ['晨间流程', '时间管理', '情绪调节'],
        sceneKey: 'age_8_9_morning_flow_support',
        symptoms: [],
        defaultBottleneck: { title: '先把早晨压力前移到前一晚', text: '早晨急躁常来自准备项太多，先减少早上决策。' },
        defaultAction: { title: '今晚先整理明早三件物品', steps: ['睡前放好校服或衣服。', '检查书包。', '把水杯放到门口。'] }
      },
      {
        key: 'age_8_9_self_blame_after_mistake',
        categoryKey: 'emotion_rules',
        title: '出错后一直怪自己',
        description: '考试、作业或活动出错后，孩子反复自责，很难回到下一步。',
        observableSigns: ['一直说我做不好', '盯着错题不动', '后面任务也受影响'],
        abilityTags: ['错误恢复', '自我评价', '情绪调节'],
        sceneKey: 'age_8_9_self_blame_support',
        symptoms: [],
        defaultBottleneck: { title: '先把自责改成下一步动作', text: '出错后的自责会消耗精力，先把注意力转回一个可执行动作。' },
        defaultAction: { title: '今晚用一句错因加下一步', steps: ['说我错在什么。', '再说下一题先做什么。', '只执行下一题第一步。'] }
      },
      {
        key: 'fitness_test_getting_hard',
        categoryKey: 'motor_fitness',
        title: '体测项目开始吃力',
        description: '跑步、跳绳、仰卧起坐等项目感觉跟不上。',
        observableSigns: ['跑步喘得快', '跳绳断得多', '核心动作做不动'],
        abilityTags: ['体测准备起步', '基础耐力', '动作效率'],
        sceneKey: 'fitness_test_foundation',
        symptoms: [],
        defaultBottleneck: { title: '先看基础耐力和动作效率', text: '体测吃力通常需要提前从小强度稳定练起。' },
        defaultAction: { title: '今晚只做 4 分钟轻体能', steps: ['原地慢跑 1 分钟。', '休息 30 秒。', '重复 2 轮。'] }
      },
      {
        key: 'exercise_habit_unstable',
        categoryKey: 'motor_fitness',
        title: '运动习惯坚持不了',
        description: '开始几天有热情，很快断掉。',
        observableSigns: ['三天后不想练', '没有固定时间', '需要家长催'],
        abilityTags: ['习惯建立', '执行力', '长期坚持'],
        sceneKey: 'exercise_habit_support',
        symptoms: [],
        defaultBottleneck: { title: '先把运动固定到一个时间点', text: '习惯不是靠一次练很多，而是每天稳定出现一个小动作。' },
        defaultAction: { title: '今晚固定一个 3 分钟运动时间', steps: ['选晚饭后或洗澡前。', '只做 3 分钟。', '做完打一个勾。'] }
      },
      {
        key: 'age_8_9_rope_jump_stability_weak',
        categoryKey: 'motor_fitness',
        title: '跳绳总不稳定',
        description: '能跳起来，但速度、连续性和节奏忽快忽慢。',
        observableSigns: ['连续跳容易断', '一快就绊绳', '手脚节奏乱'],
        abilityTags: ['跳绳稳定', '体测准备起步', '动作节奏'],
        sceneKey: 'age_8_9_rope_jump_stability_support',
        symptoms: [],
        defaultBottleneck: { title: '先稳住连续节奏', text: '跳绳稳定比追速度更基础，先让孩子找到固定节拍。' },
        defaultAction: { title: '今晚只跳 3 组 20 秒', steps: ['设 20 秒计时。', '慢速连续跳。', '休息 30 秒后重复 3 组。'] }
      },
      {
        key: 'age_8_9_running_pace_unsteady',
        categoryKey: 'motor_fitness',
        title: '跑步配速总乱',
        description: '一开始冲太快，后面很快累，跑步节奏不稳定。',
        observableSigns: ['前面跑很快', '中途喘得厉害', '后半段走走停停'],
        abilityTags: ['跑步耐力', '配速意识', '体测准备起步'],
        sceneKey: 'age_8_9_running_pace_support',
        symptoms: [],
        defaultBottleneck: { title: '先练能说话的慢跑速度', text: '耐力起步要先学会慢下来，让身体能持续。' },
        defaultAction: { title: '今晚慢跑 2 分钟', steps: ['用能说话的速度跑。', '跑 2 分钟。', '结束后说一句身体感觉。'] }
      },
      {
        key: 'age_8_9_core_situp_weak',
        categoryKey: 'motor_fitness',
        title: '仰卧起坐核心弱',
        description: '仰卧起坐、卷腹或平板支撑时，核心发力困难。',
        observableSigns: ['起身靠甩手', '腰容易塌', '做几下就停'],
        abilityTags: ['核心力量', '体测准备起步', '身体控制'],
        sceneKey: 'age_8_9_core_situp_support',
        symptoms: [],
        defaultBottleneck: { title: '先练短距离卷腹发力', text: '核心弱时，先找到腹部发力感觉，再增加次数。' },
        defaultAction: { title: '今晚只做 3 组 5 次小卷腹', steps: ['膝盖弯曲躺好。', '只抬肩一点点。', '每组 5 次，做 3 组。'] }
      },
      {
        key: 'age_8_9_ball_coordination_lags',
        categoryKey: 'motor_fitness',
        title: '球类配合慢半拍',
        description: '拍球、传接球、踢球时，视觉判断和手脚动作连接慢。',
        observableSigns: ['接球反应慢', '拍球容易丢', '传球方向偏'],
        abilityTags: ['球类协调', '手眼协调', '动作计划'],
        sceneKey: 'age_8_9_ball_coordination_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定一种球类节奏', text: '球类协调需要视线追踪和身体反应同步，先练简单重复。' },
        defaultAction: { title: '今晚只做原地拍球 30 下', steps: ['选一个球。', '原地慢拍。', '累计 30 下，断了接着数。'] }
      },
      {
        key: 'age_8_9_posture_endurance_low',
        categoryKey: 'motor_fitness',
        title: '坐姿和站姿撑不久',
        description: '学习或运动准备时，坐姿塌、站姿歪，维持时间短。',
        observableSigns: ['写一会就趴桌', '站着身体晃', '肩背总塌'],
        abilityTags: ['体态控制', '核心力量', '学习状态'],
        sceneKey: 'age_8_9_posture_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先用短时间体态练习打底', text: '体态耐力会影响学习和运动，先练短而稳的保持。' },
        defaultAction: { title: '今晚靠墙站 40 秒', steps: ['后背靠墙。', '脚踩稳。', '保持 40 秒后放松。'] }
      },
      {
        key: 'age_8_9_agility_ladder_confused',
        categoryKey: 'motor_fitness',
        title: '敏捷步伐容易乱',
        description: '折返跑、跳格子或敏捷梯类动作里，脚步顺序容易混乱。',
        observableSigns: ['左右脚顺序错', '转身后停住', '越快越乱'],
        abilityTags: ['敏捷步伐', '协调体能', '动作计划'],
        sceneKey: 'age_8_9_agility_ladder_support',
        symptoms: [],
        defaultBottleneck: { title: '先把脚步顺序放慢', text: '敏捷动作要先练清楚路径，再加速度。' },
        defaultAction: { title: '今晚只练 6 格慢速步伐', steps: ['在地上画 6 格。', '一格一步慢走。', '走清楚后再做第二遍。'] }
      },
      {
        key: 'age_8_9_flexibility_stiff',
        categoryKey: 'motor_fitness',
        title: '身体僵硬活动不开',
        description: '跑跳前后身体紧，弯腰、下蹲、伸展动作不舒服。',
        observableSigns: ['弯腰够不到脚', '下蹲脚跟抬起', '运动后说腿紧'],
        abilityTags: ['柔韧性', '运动恢复', '身体觉察'],
        sceneKey: 'age_8_9_flexibility_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立运动前后拉伸习惯', text: '身体紧会影响动作效率，先用短时间拉伸让身体打开。' },
        defaultAction: { title: '今晚做 3 个 15 秒拉伸', steps: ['小腿拉伸 15 秒。', '大腿前侧拉伸 15 秒。', '肩背伸展 15 秒。'] }
      },
      {
        key: 'age_8_9_training_recovery_missing',
        categoryKey: 'motor_fitness',
        title: '练完不会恢复',
        description: '运动后马上坐下、喝水少、第二天酸痛明显或情绪烦躁。',
        observableSigns: ['运动后直接躺下', '第二天喊腿疼', '练完很兴奋或很烦'],
        abilityTags: ['运动恢复', '体测准备起步', '自我管理'],
        sceneKey: 'age_8_9_training_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先固定运动后恢复三步', text: '恢复能力会影响持续训练，先让身体从运动状态下来。' },
        defaultAction: { title: '今晚运动后做恢复三步', steps: ['慢走 1 分钟。', '喝几口水。', '做 3 次慢呼气。'] }
      },
      {
        key: 'age_8_9_learning_help_request_vague',
        categoryKey: 'social_expression',
        title: '学习卡住不会问清楚',
        description: '作业、订正或阅读卡住时，孩子只说不会，很难说清需要哪种帮助。',
        observableSigns: ['只说我不会', '不指出卡点', '等大人直接讲答案'],
        abilityTags: ['学习求助', '问题说明', '表达清晰度'],
        sceneKey: 'age_8_9_learning_help_request_support',
        symptoms: [],
        defaultBottleneck: { title: '先把求助说到具体位置', text: '学习求助要从我不会变成我卡在这里。' },
        defaultAction: { title: '今晚只练一句具体求助', steps: ['指一道卡住的题。', '说我卡在第几步。', '再说请帮我看这一处。'] }
      },
      {
        key: 'age_8_9_peer_project_role_conflict',
        categoryKey: 'social_expression',
        title: '同伴合作分工容易乱',
        description: '小组作业、活动或游戏中，孩子和同伴对谁做什么容易争起来。',
        observableSigns: ['抢着做同一项', '觉得别人不配合', '分工后又反悔'],
        abilityTags: ['同伴合作', '角色协商', '执行力'],
        sceneKey: 'age_8_9_peer_project_role_support',
        symptoms: [],
        defaultBottleneck: { title: '先把分工说成一人一件事', text: '合作混乱时，需要让每个人的职责清楚可见。' },
        defaultAction: { title: '今晚家庭任务练一人一件', steps: ['选一个两人任务。', '孩子说我负责什么。', '大人说自己负责什么。'] }
      },
      {
        key: 'age_8_9_opinion_expression_short',
        categoryKey: 'social_expression',
        title: '有观点但说不完整',
        description: '讨论阅读、课堂问题或家庭安排时，孩子有想法但只说一句很短的话。',
        observableSigns: ['只说好或不好', '理由说不出来', '被追问就急'],
        abilityTags: ['表达观点', '语言组织', '逻辑表达'],
        sceneKey: 'age_8_9_opinion_expression_support',
        symptoms: [],
        defaultBottleneck: { title: '先用观点加理由句式', text: '表达观点需要一个结构，先让孩子把想法和理由连起来。' },
        defaultAction: { title: '今晚只说观点加一个理由', steps: ['选一个简单问题。', '孩子说我认为。', '再补一句因为。'] }
      },
      {
        key: 'age_8_9_conflict_review_blames_only',
        categoryKey: 'social_expression',
        title: '复盘冲突只会怪别人',
        description: '和同学争执后，孩子很难看到双方行为，只强调对方的问题。',
        observableSigns: ['一直说都是他', '跳过自己的动作', '听不进别的角度'],
        abilityTags: ['复盘冲突', '同理心', '事件顺序'],
        sceneKey: 'age_8_9_conflict_review_support',
        symptoms: [],
        defaultBottleneck: { title: '先复盘双方各做了一件事', text: '冲突复盘要从事实开始，先看到双方行为。' },
        defaultAction: { title: '今晚只说双方各一件事', steps: ['说我做了什么。', '说对方做了什么。', '最后说下次我想怎么说。'] }
      },
      {
        key: 'age_8_9_family_study_update_resists',
        categoryKey: 'social_expression',
        title: '不愿和家长说学习进度',
        description: '家长问作业、错题或阅读进度时，孩子嫌烦或说不清。',
        observableSigns: ['说你别问了', '只说做完了', '进度和实际不一致'],
        abilityTags: ['家庭学习沟通', '进度表达', '自我管理'],
        sceneKey: 'age_8_9_family_study_update_support',
        symptoms: [],
        defaultBottleneck: { title: '先把沟通改成进度播报', text: '学习沟通容易变成追问，先用固定格式说进度。' },
        defaultAction: { title: '今晚只报三项进度', steps: ['说已完成一项。', '说正在做一项。', '说还剩一项。'] }
      },
      {
        key: 'age_8_9_teacher_feedback_cannot_relay',
        categoryKey: 'social_expression',
        title: '老师反馈带不回来',
        description: '老师说的订正、材料、课堂提醒，孩子回家后讲不完整。',
        observableSigns: ['忘了老师说什么', '只记得要改', '不知道具体要求'],
        abilityTags: ['信息转述', '课堂沟通', '执行力'],
        sceneKey: 'age_8_9_teacher_feedback_relay_support',
        symptoms: [],
        defaultBottleneck: { title: '先练带回一个关键信息', text: '转述老师反馈要先抓住谁、什么事、什么时候。' },
        defaultAction: { title: '今晚练三要素转述', steps: ['说老师提醒了什么。', '说要什么时候做。', '说需要准备什么。'] }
      },
      {
        key: 'age_8_9_group_discussion_quiet',
        categoryKey: 'social_expression',
        title: '小组讨论总沉默',
        description: '课堂讨论、合作学习或活动分组时，孩子很少主动说想法。',
        observableSigns: ['等别人先说', '点到才回答', '说完马上低头'],
        abilityTags: ['小组讨论', '表达信心', '表达观点'],
        sceneKey: 'age_8_9_group_discussion_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句可发言内容', text: '小组讨论沉默时，先让孩子有一句确定能说的话。' },
        defaultAction: { title: '今晚准备一句讨论发言', steps: ['选一个课堂话题。', '写一句我觉得。', '对家长说一遍。'] }
      },
      {
        key: 'age_8_9_refuse_request_too_hard',
        categoryKey: 'social_expression',
        title: '拒绝别人时太生硬',
        description: '同学借东西、邀请玩或提出要求时，孩子拒绝得很冲或完全不敢拒绝。',
        observableSigns: ['直接说不行', '怕对方生气就答应', '拒绝后关系尴尬'],
        abilityTags: ['拒绝表达', '边界表达', '同伴关系'],
        sceneKey: 'age_8_9_refuse_request_support',
        symptoms: [],
        defaultBottleneck: { title: '先练温和拒绝句式', text: '拒绝表达需要既保护边界，也保留关系。' },
        defaultAction: { title: '今晚练一句温和拒绝', steps: ['大人提出一个请求。', '孩子说我现在不方便。', '再补一句可以换个时间。'] }
      },
      {
        key: 'age_8_9_emotion_need_words_missing',
        categoryKey: 'social_expression',
        title: '有情绪但说不出需要',
        description: '生气、委屈、着急时，孩子能说情绪，却说不清希望别人怎么做。',
        observableSigns: ['说我很烦', '说不出想要什么', '用沉默代替请求'],
        abilityTags: ['需求表达', '情绪表达', '亲子沟通'],
        sceneKey: 'age_8_9_emotion_need_support',
        symptoms: [],
        defaultBottleneck: { title: '先把情绪接到一个需求', text: '表达清楚需要，别人才能知道怎么支持。' },
        defaultAction: { title: '今晚练我感到加我需要', steps: ['说我现在感到。', '再说我需要。', '最后说请你怎么做。'] }
      },
      {
        key: 'age_8_9_after_activity_review_thin',
        categoryKey: 'social_expression',
        title: '活动后复盘说得很空',
        description: '比赛、社团、课堂展示后，孩子只说还行、不好玩，很难具体复盘。',
        observableSigns: ['只说一般', '说不出哪里好', '不知道下次改什么'],
        abilityTags: ['活动复盘', '表达清晰度', '自我监控'],
        sceneKey: 'age_8_9_activity_review_support',
        symptoms: [],
        defaultBottleneck: { title: '先复盘一个亮点和一个调整点', text: '复盘空泛时，用两个固定问题帮助孩子具体化。' },
        defaultAction: { title: '今晚只说一好一改', steps: ['说今天做得好的一个点。', '说下次想改的一个点。', '每点只说一句。'] }
      }
    ]
  },
  {
    key: 'age_9_12',
    label: '9-12岁',
    title: '建立学习耐力和体训准备',
    subtitle: '看孩子能不能长期坚持，并为体测和专项能力提前打基础。',
    focusAreas: ['学习耐力', '中考体训准备', '专项体能', '体态核心'],
    parentSummary: '这个阶段家长最常关注学习时间变长后状态撑不住、耐力差、跳绳爆发力弱和体态核心不足。',
    painPoints: [
      {
        key: 'long_study_stamina_low',
        categoryKey: 'attention_learning',
        title: '学习时间一长就散',
        description: '学习时间变长后效率明显下降，后半段坐不住。',
        observableSigns: ['后半段发呆', '越写越慢', '错误增多'],
        abilityTags: ['学习耐力', '持续注意', '自我管理'],
        sceneKey: 'study_stamina_support',
        symptoms: [],
        defaultBottleneck: { title: '先看学习耐力分段', text: '长时间学习需要分段恢复，先建立稳定节奏。' },
        defaultAction: { title: '今晚用 15 分钟学习块', steps: ['学习 15 分钟。', '起身活动 2 分钟。', '再开始下一段。'] }
      },
      {
        key: 'age_9_12_efficiency_drops_later',
        categoryKey: 'attention_learning',
        title: '后半段学习效率明显下降',
        description: '前半小时还能学，后半段开始发呆、拖慢或错误变多。',
        observableSigns: ['后半段越写越慢', '简单题也错', '频繁看时间'],
        abilityTags: ['学习效率下降', '学习耐力', '持续注意'],
        sceneKey: 'age_9_12_efficiency_drop_support',
        symptoms: [],
        defaultBottleneck: { title: '先把长学习拆成两段', text: '效率下降通常不是不会学，而是学习块过长后注意力和身体状态都掉下来了。' },
        defaultAction: { title: '今晚用 18 分钟加 3 分钟恢复', steps: ['学习 18 分钟。', '站起来活动 3 分钟。', '回到桌前只继续下一小项。'] }
      },
      {
        key: 'age_9_12_wrong_book_not_used',
        categoryKey: 'attention_learning',
        title: '错题本记了但不用',
        description: '错题整理做了，但复习时很少回看，同类错误反复出现。',
        observableSigns: ['只抄题不复盘', '错因写得很空', '考前翻不出重点错题'],
        abilityTags: ['错题整理', '复习节奏', '自我监控'],
        sceneKey: 'age_9_12_wrong_book_use_support',
        symptoms: [],
        defaultBottleneck: { title: '先让错题本变成可复习工具', text: '错题整理的关键是能再用，先给每道错题一个回看动作。' },
        defaultAction: { title: '今晚只复盘 2 道错题', steps: ['选最近 2 道错题。', '各写一句错因。', '各写一句下次先看什么。'] }
      },
      {
        key: 'age_9_12_plan_execution_breaks',
        categoryKey: 'attention_learning',
        title: '计划写了但执行断掉',
        description: '会列学习计划，但实际执行中途跳项、漏项或临时改来改去。',
        observableSigns: ['计划表很好看但没完成', '做到一半换任务', '晚上一查漏很多'],
        abilityTags: ['计划执行', '自我管理', '执行力'],
        sceneKey: 'age_9_12_plan_execution_support',
        symptoms: [],
        defaultBottleneck: { title: '先让计划只保留三个可执行项', text: '计划太满时执行成本高，先把今天最关键的三项固定下来。' },
        defaultAction: { title: '今晚只排三项必做', steps: ['写下今晚所有任务。', '圈出最重要 3 项。', '只按 1、2、3 顺序执行。'] }
      },
      {
        key: 'age_9_12_review_rhythm_messy',
        categoryKey: 'attention_learning',
        title: '复习节奏总是临时抱佛脚',
        description: '平时很少回顾，考试前集中赶复习，压力和遗漏都变多。',
        observableSigns: ['考前才翻书', '不知道从哪复习', '复习越晚越焦虑'],
        abilityTags: ['复习节奏', '长期坚持', '自我管理'],
        sceneKey: 'age_9_12_review_rhythm_support',
        symptoms: [],
        defaultBottleneck: { title: '先把复习固定成小频率', text: '复习节奏需要平时低成本重复，而不是考前一次补齐。' },
        defaultAction: { title: '今晚只做 10 分钟回顾', steps: ['选一个科目。', '回看今天 3 个重点。', '写下一个还不熟的点。'] }
      },
      {
        key: 'age_9_12_notes_no_structure',
        categoryKey: 'attention_learning',
        title: '笔记很多但没结构',
        description: '课堂和复习笔记写了不少，但重点、例题、易错点混在一起。',
        observableSigns: ['整页都是字', '找不到重点', '复习时重新看一遍仍不清楚'],
        abilityTags: ['笔记结构', '信息组织', '学习效率'],
        sceneKey: 'age_9_12_note_structure_support',
        symptoms: [],
        defaultBottleneck: { title: '先把笔记分成三栏', text: '笔记没有结构时，复习会变成重读，先让信息有位置。' },
        defaultAction: { title: '今晚只整理一页三栏笔记', steps: ['把一页分成重点、例题、易错。', '每栏只写 1 条。', '整理完合上。'] }
      },
      {
        key: 'age_9_12_homework_priority_unclear',
        categoryKey: 'attention_learning',
        title: '作业优先级排不清',
        description: '任务多时，不知道先做难的、急的还是轻松的，经常安排失衡。',
        observableSigns: ['先做喜欢的任务', '难题拖到很晚', '重要任务被挤掉'],
        abilityTags: ['优先级判断', '计划执行', '自我管理'],
        sceneKey: 'age_9_12_homework_priority_support',
        symptoms: [],
        defaultBottleneck: { title: '先按急和难做二维排序', text: '优先级不是凭感觉，先让孩子看见任务的时间压力和难度。' },
        defaultAction: { title: '今晚只排急和难', steps: ['给每项任务标急或不急。', '再标难或不难。', '先做又急又难的一小步。'] }
      },
      {
        key: 'age_9_12_self_check_skips_steps',
        categoryKey: 'attention_learning',
        title: '自查总跳步骤',
        description: '做完作业或试卷后知道要检查，但常只看答案，不看过程。',
        observableSigns: ['检查很快结束', '漏看单位和步骤', '同样格式错误反复出现'],
        abilityTags: ['自我检查', '学习习惯', '自我监控'],
        sceneKey: 'age_9_12_self_check_support',
        symptoms: [],
        defaultBottleneck: { title: '先把检查固定成三项清单', text: '自查跳步骤时，要给孩子一个固定检查顺序。' },
        defaultAction: { title: '今晚只查三项', steps: ['先查题号是否漏。', '再查单位或标点。', '最后查一道最容易错的题。'] }
      },
      {
        key: 'age_9_12_distraction_phone_or_chat',
        categoryKey: 'attention_learning',
        title: '学习时容易被手机聊天带走',
        description: '学习过程中被消息、短视频、聊天或桌面杂物打断，回到任务很慢。',
        observableSigns: ['看一眼消息就停很久', '边写边聊', '桌面东西越摆越多'],
        abilityTags: ['干扰管理', '持续注意', '自我管理'],
        sceneKey: 'age_9_12_distraction_management_support',
        symptoms: [],
        defaultBottleneck: { title: '先把干扰移出一个学习块', text: '高龄孩子需要练习管理干扰，而不是只靠家长没收。' },
        defaultAction: { title: '今晚做一个无干扰学习块', steps: ['手机放到两米外。', '桌面只留当前科目。', '学习 15 分钟后再查看。'] }
      },
      {
        key: 'age_9_12_test_review_no_strategy',
        categoryKey: 'attention_learning',
        title: '考后只看分数不复盘',
        description: '考试或测验后，孩子关注分数和排名，较少整理可改进的策略。',
        observableSigns: ['只问考了多少', '错题分类不清', '下次计划很笼统'],
        abilityTags: ['考后复盘', '错题整理', '复习节奏'],
        sceneKey: 'age_9_12_test_review_support',
        symptoms: [],
        defaultBottleneck: { title: '先把考后复盘变成两类错误', text: '考后复盘要从分数转向可改的错误类型。' },
        defaultAction: { title: '今晚只分两类错题', steps: ['把错题分成会但错和不会。', '各选 1 题。', '写下下次先做什么。'] }
      },
      {
        key: 'age_9_12_study_pressure_tense',
        categoryKey: 'emotion_rules',
        title: '一提学习压力就紧绷',
        description: '作业、测验、排名或升学话题一出现，孩子明显紧张或烦躁。',
        observableSigns: ['说压力太大', '一聊成绩就沉默', '学习前先焦虑'],
        abilityTags: ['学习压力', '情绪调节', '压力表达'],
        sceneKey: 'age_9_12_study_pressure_support',
        symptoms: [],
        defaultBottleneck: { title: '先把压力拆成一个具体来源', text: '压力很大时，孩子需要先说清是哪一项最压人。' },
        defaultAction: { title: '今晚只写一个压力来源', steps: ['写下最有压力的一项。', '圈出能先做的一小步。', '只完成这一小步。'] }
      },
      {
        key: 'age_9_12_criticism_sensitive',
        categoryKey: 'emotion_rules',
        title: '被批评后很久缓不过来',
        description: '家长或老师指出问题后，孩子低落、防御或影响后续学习。',
        observableSigns: ['被说后不想写', '反复解释自己没错', '后面任务效率下降'],
        abilityTags: ['被批评敏感', '情绪恢复', '学习自信'],
        sceneKey: 'age_9_12_criticism_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先把批评翻译成可改动作', text: '被批评敏感时，需要从被否定的感受回到具体可调整的动作。' },
        defaultAction: { title: '今晚只提一个可改动作', steps: ['说出这次被提醒的事。', '把它改成一个动作。', '只做这个动作 5 分钟。'] }
      },
      {
        key: 'age_9_12_self_expectation_too_high',
        categoryKey: 'emotion_rules',
        title: '自我要求高到很累',
        description: '孩子希望每次都做好，一旦达不到就自责、焦虑或不敢开始。',
        observableSigns: ['说必须满分', '不满意就重做', '开始前担心做不好'],
        abilityTags: ['自我要求高', '完美倾向', '情绪调节'],
        sceneKey: 'age_9_12_high_expectation_support',
        symptoms: [],
        defaultBottleneck: { title: '先定义本次够好标准', text: '自我要求过高时，需要把目标从完美降到本次可完成。' },
        defaultAction: { title: '今晚写下够好标准', steps: ['选一项任务。', '写下完成标准。', '达到标准后停止修改。'] }
      },
      {
        key: 'age_9_12_plan_interrupted_upset',
        categoryKey: 'emotion_rules',
        title: '计划被打断就烦躁',
        description: '学习计划被临时活动、家庭安排或突发任务打断后，很难恢复节奏。',
        observableSigns: ['被打断后发火', '回不去原计划', '后面任务全乱'],
        abilityTags: ['计划中断', '节奏管理', '情绪调节'],
        sceneKey: 'age_9_12_plan_interruption_support',
        symptoms: [],
        defaultBottleneck: { title: '先给计划中断一个重启点', text: '计划中断后，孩子需要知道回来从哪里接上。' },
        defaultAction: { title: '今晚为计划写重启点', steps: ['在计划旁写暂停位置。', '中断后先看暂停位置。', '只接着做下一小步。'] }
      },
      {
        key: 'age_9_12_parent_child_study_conflict',
        categoryKey: 'emotion_rules',
        title: '亲子一聊学习就冲突',
        description: '家长想了解进度或提醒调整，孩子很快顶嘴、回避或爆发。',
        observableSigns: ['说你别管我', '聊三句就吵', '拒绝展示作业'],
        abilityTags: ['亲子冲突', '学习沟通', '自主性'],
        sceneKey: 'age_9_12_parent_child_study_support',
        symptoms: [],
        defaultBottleneck: { title: '先把沟通改成协商一个边界', text: '高龄孩子需要被尊重的自主空间，学习沟通先从边界协商开始。' },
        defaultAction: { title: '今晚只协商检查时间', steps: ['孩子说希望什么时候给家长看。', '家长说需要看到什么。', '双方定一个 5 分钟检查点。'] }
      },
      {
        key: 'age_9_12_exam_before_sleep_hard',
        categoryKey: 'emotion_rules',
        title: '考前晚上很难放松',
        description: '考试或测验前一晚，孩子反复想复习内容，睡前仍紧张。',
        observableSigns: ['睡前还翻书', '担心明天考不好', '入睡变慢'],
        abilityTags: ['考前焦虑', '睡前放松', '节奏管理'],
        sceneKey: 'age_9_12_exam_sleep_support',
        symptoms: [],
        defaultBottleneck: { title: '先给复习和睡前做切换', text: '考前紧张时，需要一个明确动作把复习状态收起来。' },
        defaultAction: { title: '今晚用睡前收尾清单', steps: ['写下明天要带的物品。', '合上书本。', '做 5 次慢呼气。'] }
      },
      {
        key: 'age_9_12_result_fluctuation_mood_swings',
        categoryKey: 'emotion_rules',
        title: '成绩波动带动情绪大起大落',
        description: '一次考好就放松，一次考差就低落，对分数变化很敏感。',
        observableSigns: ['考差后不想学', '考好后觉得不用复习', '情绪跟分数走'],
        abilityTags: ['成绩波动', '自我评价', '情绪调节'],
        sceneKey: 'age_9_12_result_fluctuation_support',
        symptoms: [],
        defaultBottleneck: { title: '先把分数转成一个稳定指标', text: '成绩波动时，需要用过程指标帮助孩子稳定判断。' },
        defaultAction: { title: '今晚只看一个过程指标', steps: ['选一个科目。', '看这次订正完成率。', '写下下次保持的一件事。'] }
      },
      {
        key: 'age_9_12_task_too_many_overwhelmed',
        categoryKey: 'emotion_rules',
        title: '任务一多就觉得撑不住',
        description: '多个科目、作业、运动和兴趣安排叠在一起时，孩子容易 overwhelmed。',
        observableSigns: ['说太多了做不完', '不知道从哪开始', '越催越乱'],
        abilityTags: ['任务过载', '节奏管理', '自我管理'],
        sceneKey: 'age_9_12_task_overload_support',
        symptoms: [],
        defaultBottleneck: { title: '先从全部任务里拿出下一步', text: '任务过载时，大脑需要先看到一个可执行入口。' },
        defaultAction: { title: '今晚只抽出下一步', steps: ['把任务全部写下来。', '只圈下一步。', '完成后再圈第二步。'] }
      },
      {
        key: 'age_9_12_peer_compare_pressure',
        categoryKey: 'emotion_rules',
        title: '同伴比较带来压力',
        description: '听到同学成绩、排名、训练表现或竞赛信息后，孩子压力明显上升。',
        observableSigns: ['反复问别人多少分', '说自己追不上', '对竞赛和排名敏感'],
        abilityTags: ['同伴比较', '学习压力', '自我评价'],
        sceneKey: 'age_9_12_peer_compare_pressure_support',
        symptoms: [],
        defaultBottleneck: { title: '先回到自己的一个可控指标', text: '同伴比较会放大压力，先把注意力拉回自己可控的一项。' },
        defaultAction: { title: '今晚只定一个个人指标', steps: ['选一个自己能控制的指标。', '写下今天做到多少。', '明天只提高一点点。'] }
      },
      {
        key: 'age_9_12_recovery_after_bad_day_slow',
        categoryKey: 'emotion_rules',
        title: '状态差一天后很难恢复',
        description: '某天没学好、没练好或被批评后，第二天仍受影响。',
        observableSigns: ['第二天还低落', '说反正已经搞砸', '不愿重新开始'],
        abilityTags: ['状态恢复', '情绪恢复', '长期坚持'],
        sceneKey: 'age_9_12_bad_day_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立第二天重启动作', text: '状态差不代表整段计划失效，关键是第二天能接上一个小动作。' },
        defaultAction: { title: '今晚写明天重启动作', steps: ['写下今天卡住的一点。', '写下明天第一步。', '明天只先做这一步。'] }
      },
      {
        key: 'middle_exam_training_prepare',
        categoryKey: 'motor_fitness',
        title: '中考体育提前准备',
        description: '家长开始担心体育分提高，想提前打基础。',
        observableSigns: ['体测项目不了解', '跑跳基础弱', '缺训练节奏'],
        abilityTags: ['中考体训准备', '专项体能', '长期坚持'],
        sceneKey: 'middle_school_training_prepare',
        symptoms: [],
        defaultBottleneck: { title: '先建立体训基础节奏', text: '中考体训需要提前把耐力、跳绳、核心和恢复节奏做起来。' },
        defaultAction: { title: '今晚先做 6 分钟基础循环', steps: ['开合跳 30 秒。', '休息 30 秒。', '平板支撑 20 秒，循环 3 轮。'] }
      },
      {
        key: 'running_endurance_weak',
        categoryKey: 'motor_fitness',
        title: '跑步耐力差',
        description: '跑一会儿就喘，速度和坚持都弱。',
        observableSigns: ['跑几分钟就停', '呼吸很乱', '不愿跑步'],
        abilityTags: ['耐力', '心肺基础', '长期坚持'],
        sceneKey: 'running_endurance_support',
        symptoms: [],
        defaultBottleneck: { title: '先看心肺基础和配速', text: '耐力差要先从可持续的小跑开始，避免一开始就冲太快。' },
        defaultAction: { title: '今晚只做 1 分钟跑走交替', steps: ['慢跑 30 秒。', '走 30 秒。', '重复 4 轮。'] }
      },
      {
        key: 'jump_power_weak',
        categoryKey: 'motor_fitness',
        title: '跳绳和爆发力弱',
        description: '跳绳连续性差，起跳无力，速度上不去。',
        observableSigns: ['跳绳常断', '起跳低', '动作节奏乱'],
        abilityTags: ['爆发力', '跳绳专项', '动作节奏'],
        sceneKey: 'jump_power_support',
        symptoms: [],
        defaultBottleneck: { title: '先拆起跳节奏和下肢力量', text: '跳绳和爆发力需要节奏、脚踝弹性和核心稳定一起配合。' },
        defaultAction: { title: '今晚只做 20 次小弹跳', steps: ['双脚并拢轻轻弹跳 10 次。', '休息 20 秒。', '再做 10 次。'] }
      },
      {
        key: 'posture_core_weak',
        categoryKey: 'motor_fitness',
        title: '体态和核心力量差',
        description: '含胸驼背、坐姿塌、运动时身体不稳。',
        observableSigns: ['坐姿塌', '跑步身体晃', '平板支撑坚持短'],
        abilityTags: ['体态核心', '核心稳定', '身体控制'],
        sceneKey: 'posture_core_support',
        symptoms: [],
        defaultBottleneck: { title: '先看核心稳定和日常姿态', text: '体态和核心影响运动效率，也会影响长时间学习状态。' },
        defaultAction: { title: '今晚只做 20 秒靠墙站', steps: ['后背靠墙站好。', '保持 20 秒。', '结束后感受肩背有没有打开。'] }
      },
      {
        key: 'age_9_12_special_training_rhythm_missing',
        categoryKey: 'motor_fitness',
        title: '专项体能练得没节奏',
        description: '跑步、跳绳、核心等项目想到才练，强度和休息没有稳定安排。',
        observableSigns: ['练几天停几天', '一次练很多很累', '不知道每周练什么'],
        abilityTags: ['专项体能节奏', '中考体训准备', '长期坚持'],
        sceneKey: 'age_9_12_special_training_rhythm_support',
        symptoms: [],
        defaultBottleneck: { title: '先建立一周两次基础节奏', text: '专项体能要稳定推进，先固定低强度频率。' },
        defaultAction: { title: '今晚排一周两次训练', steps: ['选本周两个晚上。', '每次只练 8 分钟。', '写下跑、跳、核心各一项。'] }
      },
      {
        key: 'age_9_12_rope_speed_plateau',
        categoryKey: 'motor_fitness',
        title: '跳绳速度上不去',
        description: '跳绳能连续完成，但速度提升慢，冲速度就容易断。',
        observableSigns: ['慢速可以快了就断', '手腕甩不快', '脚落地很重'],
        abilityTags: ['跳绳爆发力', '动作节奏', '体测准备'],
        sceneKey: 'age_9_12_rope_speed_support',
        symptoms: [],
        defaultBottleneck: { title: '先拆手腕速度和脚踝弹性', text: '跳绳提速要先让手和脚各自稳定，再合在一起。' },
        defaultAction: { title: '今晚练 3 组 15 秒快节奏', steps: ['无绳快甩手 15 秒。', '小弹跳 15 秒。', '合起来慢速跳 20 秒。'] }
      },
      {
        key: 'age_9_12_running_breathing_messy',
        categoryKey: 'motor_fitness',
        title: '跑步呼吸节奏乱',
        description: '跑步时很快喘乱，配速难稳定，后半段掉速明显。',
        observableSigns: ['跑几分钟喘急', '忽快忽慢', '后半段迈不开'],
        abilityTags: ['跑步耐力', '呼吸节奏', '心肺基础'],
        sceneKey: 'age_9_12_running_breathing_support',
        symptoms: [],
        defaultBottleneck: { title: '先用低速跑找呼吸节奏', text: '呼吸乱时，先把速度降到能维持节奏的范围。' },
        defaultAction: { title: '今晚跑走 6 分钟', steps: ['慢跑 1 分钟。', '走 1 分钟。', '重复 3 轮，保持能说短句。'] }
      },
      {
        key: 'age_9_12_posture_round_shoulders',
        categoryKey: 'motor_fitness',
        title: '含胸圆肩越来越明显',
        description: '学习时间变长后，肩背前扣、头前伸，运动姿态也受影响。',
        observableSigns: ['写字头很低', '肩膀向前扣', '站姿不打开'],
        abilityTags: ['体态核心', '肩背稳定', '学习姿势'],
        sceneKey: 'age_9_12_round_shoulders_support',
        symptoms: [],
        defaultBottleneck: { title: '先让肩背每天打开一次', text: '体态改变需要日常小频率，不靠一次大强度。' },
        defaultAction: { title: '今晚做 2 分钟肩背打开', steps: ['靠墙站 30 秒。', '肩胛后夹 10 次。', '胸前打开拉伸 30 秒。'] }
      },
      {
        key: 'age_9_12_leg_power_low',
        categoryKey: 'motor_fitness',
        title: '下肢力量和爆发力弱',
        description: '跑跳、折返、跳远或跳绳提速时，腿部力量和弹性不足。',
        observableSigns: ['起跳低', '落地重', '折返跑蹬地慢'],
        abilityTags: ['下肢爆发力', '专项体能', '动作效率'],
        sceneKey: 'age_9_12_leg_power_support',
        symptoms: [],
        defaultBottleneck: { title: '先练低量弹跳质量', text: '下肢爆发力需要动作质量和恢复，先小量稳定。' },
        defaultAction: { title: '今晚做 3 组 8 次小弹跳', steps: ['双脚轻弹 8 次。', '休息 30 秒。', '重复 3 组，落地保持轻。'] }
      },
      {
        key: 'age_9_12_training_recovery_soreness',
        categoryKey: 'motor_fitness',
        title: '训练后酸痛影响坚持',
        description: '运动后恢复不足，第二天酸痛或疲劳，导致后续训练断掉。',
        observableSigns: ['第二天腿很酸', '练完不拉伸', '因为累停好几天'],
        abilityTags: ['运动恢复', '长期坚持', '专项体能节奏'],
        sceneKey: 'age_9_12_training_recovery_support',
        symptoms: [],
        defaultBottleneck: { title: '先把恢复纳入训练的一部分', text: '持续训练需要恢复动作，酸痛少了才更能坚持。' },
        defaultAction: { title: '今晚训练后做 4 分钟恢复', steps: ['慢走 1 分钟。', '小腿拉伸 1 分钟。', '大腿拉伸 1 分钟。', '慢呼吸 1 分钟。'] }
      },
      {
        key: 'age_9_12_peer_relationship_tension',
        categoryKey: 'social_expression',
        title: '同伴关系紧张说不清',
        description: '和同学疏远、误会或小团体变化时，孩子知道难受但讲不清原因。',
        observableSigns: ['说他们不带我', '不愿讲细节', '回避某些同学'],
        abilityTags: ['同伴关系', '感受表达', '事件复盘'],
        sceneKey: 'age_9_12_peer_relationship_support',
        symptoms: [],
        defaultBottleneck: { title: '先把关系问题拆成事实和感受', text: '同伴关系紧张时，先分清发生了什么和自己什么感受。' },
        defaultAction: { title: '今晚只写事实加感受', steps: ['写下一件发生的事。', '写下当时的感受。', '暂时不评价谁对谁错。'] }
      },
      {
        key: 'age_9_12_opinion_with_evidence_hard',
        categoryKey: 'social_expression',
        title: '表达观点缺少依据',
        description: '讨论文章、课堂问题或家庭安排时，孩子能表态但理由薄弱。',
        observableSigns: ['只说我觉得', '理由重复', '被追问就卡住'],
        abilityTags: ['表达观点', '证据表达', '逻辑表达'],
        sceneKey: 'age_9_12_opinion_evidence_support',
        symptoms: [],
        defaultBottleneck: { title: '先用观点加一个证据', text: '高龄表达需要从态度走向依据，先练一个证据即可。' },
        defaultAction: { title: '今晚练观点加证据', steps: ['说一句我认为。', '从文本或经历里找一个证据。', '用因为连接起来。'] }
      },
      {
        key: 'age_9_12_seek_help_late',
        categoryKey: 'social_expression',
        title: '问题拖很久才求助',
        description: '学习、训练或同伴问题卡了很久，孩子直到很严重才开口。',
        observableSigns: ['自己憋很久', '错过求助时机', '开口时已经很急'],
        abilityTags: ['寻求帮助', '自我觉察', '问题说明'],
        sceneKey: 'age_9_12_seek_help_support',
        symptoms: [],
        defaultBottleneck: { title: '先设定求助触发线', text: '高龄孩子需要知道什么时候该自己扛，什么时候该求助。' },
        defaultAction: { title: '今晚定一个求助触发线', steps: ['选一个常卡的问题。', '约定卡 10 分钟就求助。', '写好一句求助话。'] }
      },
      {
        key: 'age_9_12_parent_negotiation_hard',
        categoryKey: 'social_expression',
        title: '和家长协商总变争吵',
        description: '手机、学习时间、训练安排或休息安排协商时，容易变成互相否定。',
        observableSigns: ['只讲自己想要', '听到限制就急', '协商很快变吵架'],
        abilityTags: ['亲子协商', '边界表达', '自主性'],
        sceneKey: 'age_9_12_parent_negotiation_support',
        symptoms: [],
        defaultBottleneck: { title: '先把协商变成各说一个条件', text: '协商要同时表达需求和边界，先让双方各说一条。' },
        defaultAction: { title: '今晚只协商一个条件', steps: ['孩子说自己的需求。', '家长说自己的底线。', '一起写一个可执行条件。'] }
      },
      {
        key: 'age_9_12_study_pressure_words_missing',
        categoryKey: 'social_expression',
        title: '学习压力说不出口',
        description: '孩子明明压力大，却只说没事、烦或不想说，很难具体表达。',
        observableSigns: ['说没什么', '不愿讲压力来源', '情绪变大才爆发'],
        abilityTags: ['学习压力表达', '情绪表达', '亲子沟通'],
        sceneKey: 'age_9_12_pressure_words_support',
        symptoms: [],
        defaultBottleneck: { title: '先给压力一个具体词', text: '压力说不出口时，先从选择词开始会更容易。' },
        defaultAction: { title: '今晚从三个压力词里选', steps: ['给出担心、累、怕来不及三个词。', '孩子选一个。', '再说它和哪件事有关。'] }
      },
      {
        key: 'age_9_12_group_work_leadership_conflict',
        categoryKey: 'social_expression',
        title: '小组合作中主导和配合失衡',
        description: '小组任务里，孩子可能过度主导、完全沉默或和组员分工冲突。',
        observableSigns: ['嫌别人做得慢', '自己不敢提意见', '分工后互相抱怨'],
        abilityTags: ['小组合作', '角色协商', '表达观点'],
        sceneKey: 'age_9_12_group_work_support',
        symptoms: [],
        defaultBottleneck: { title: '先明确自己在小组里的角色', text: '合作冲突常来自角色不清，先把主导、执行、检查分开。' },
        defaultAction: { title: '今晚练角色表达', steps: ['选一个小组场景。', '说我适合负责什么。', '再说我需要别人配合什么。'] }
      },
      {
        key: 'age_9_12_boundary_with_friends_unclear',
        categoryKey: 'social_expression',
        title: '朋友之间边界说不清',
        description: '借东西、玩笑、聊天频率或一起行动时，孩子难表达自己的边界。',
        observableSigns: ['不想答应但说不出', '被玩笑冒犯后憋着', '关系里常委屈'],
        abilityTags: ['边界表达', '同伴关系', '拒绝表达'],
        sceneKey: 'age_9_12_friend_boundary_support',
        symptoms: [],
        defaultBottleneck: { title: '先用我可以和我不方便表达边界', text: '边界表达要既清楚又保留关系，先准备固定句式。' },
        defaultAction: { title: '今晚练一句边界表达', steps: ['说我可以做到什么。', '再说我不方便什么。', '最后说可以怎么替代。'] }
      },
      {
        key: 'age_9_12_feedback_to_teacher_hard',
        categoryKey: 'social_expression',
        title: '想和老师反馈但不敢说',
        description: '听不懂、跟不上、被误会或需要调整时，孩子不敢主动找老师说。',
        observableSigns: ['等家长去说', '课后不敢问', '担心老师觉得麻烦'],
        abilityTags: ['向老师沟通', '寻求帮助', '表达信心'],
        sceneKey: 'age_9_12_teacher_feedback_support',
        symptoms: [],
        defaultBottleneck: { title: '先准备一句简短反馈', text: '和老师沟通需要具体、简短、有问题点。' },
        defaultAction: { title: '今晚写一句给老师的话', steps: ['写下我哪里没听懂。', '写下希望老师帮我看哪一步。', '明天课后说这一句。'] }
      },
      {
        key: 'age_9_12_after_conflict_repair_plan_missing',
        categoryKey: 'social_expression',
        title: '冲突后不知道怎么修复',
        description: '和同学、家长或老师冲突后，孩子知道不舒服，但不知道如何重新沟通。',
        observableSigns: ['冷战很久', '只等对方先开口', '道歉后仍尴尬'],
        abilityTags: ['关系修复', '冲突复盘', '沟通策略'],
        sceneKey: 'age_9_12_conflict_repair_support',
        symptoms: [],
        defaultBottleneck: { title: '先写一句修复开场', text: '关系修复需要一个低压力开场，让对话能重新开始。' },
        defaultAction: { title: '今晚准备一句修复话', steps: ['写下我刚才有点急。', '再写我想重新说一遍。', '选一个合适时间说。'] }
      },
      {
        key: 'age_9_12_self_advocacy_weak',
        categoryKey: 'social_expression',
        title: '需要为自己说明时容易退缩',
        description: '被误会、被安排不合适任务或需要说明真实情况时，孩子不太敢表达。',
        observableSigns: ['明明委屈也不说', '怕表达后关系变差', '事后反复想该怎么说'],
        abilityTags: ['自我表达', '自主性', '沟通策略'],
        sceneKey: 'age_9_12_self_advocacy_support',
        symptoms: [],
        defaultBottleneck: { title: '先用事实加请求说明自己', text: '为自己说明不是争辩，而是把事实和请求说清。' },
        defaultAction: { title: '今晚练事实加请求', steps: ['说出一个事实。', '说自己的感受。', '提出一个具体请求。'] }
      }
    ]
  }
];

var CORE_ACTION_SCENES = [
  {
    key: 'homework_restless',
    label: '写作业坐不住',
    shortLabel: '写作业',
    familyLanguage: '一到写作业就坐不住、拖很久，家长越催越累。',
    question: '更像下面哪一种？',
    ageGroups: CORE_ACTION_AGE_GROUPS,
    symptoms: [
      {
        key: 'runs_away',
        label: '一坐下就跑开',
        bottleneckTitle: '更像是身体还没准备好安静下来',
        bottleneckText: '孩子可能不是故意不配合，而是身体还处在想动的状态。先让身体有一个短出口，再回到桌前更容易开始。',
        actionTitle: '今晚先做 3 分钟身体预备',
        actionSteps: ['写作业前先推墙 10 下。', '回到桌前只坐 3 分钟。', '只完成拿笔和看第一题这一步。'],
        nextActions: {
          started_smoothly: { title: '明晚继续用身体预备开头', desc: '身体先安静下来后更容易坐住，先把这个开头固定两晚。', steps: ['写作业前继续推墙 10 下。', '坐下后只看第一题。', '能坐住 3 分钟后再加 1 分钟。'] },
          still_resisted: { title: '明晚把桌前时间缩到 1 分钟', desc: '抗拒说明桌前要求仍然偏大，先让孩子愿意回到桌边。', steps: ['推墙后只回桌边站 10 秒。', '坐下只摸一下铅笔。', '结束后记录有没有少跑开一次。'] },
          slow_but_started: { title: '明晚保留预备动作，减少催促', desc: '已经开始就是有效信号，先把催促换成清楚的下一步。', steps: ['推墙后坐下。', '大人只说：看第一题。', '慢也先等 30 秒再提醒。'] },
          not_tried: { title: '明晚先安排固定开始时间', desc: '没来得及试时，先把动作放进一个确定时间点。', steps: ['晚饭后先约定写作业开始时间。', '到点只做推墙 10 下。', '完成后再决定是否坐到桌前。'] }
        }
      },
      {
        key: 'hard_then_angry',
        label: '题目一难就发脾气',
        bottleneckTitle: '更像是遇到困难后不会求助',
        bottleneckText: '孩子卡住后很快用情绪表达挫败。今晚先把目标改成说出哪里不会，降低直接完成题目的压力。',
        actionTitle: '今晚只练说出卡在哪里',
        actionSteps: ['先读第一题。', '问孩子：你觉得哪一步最难？', '孩子说出难点后，大人只帮第一小步。'],
        nextActions: {
          started_smoothly: { title: '明晚继续练说出难点', desc: '孩子能说出卡点后，情绪会更容易降下来。', steps: ['先读一道题。', '让孩子指出最难的一个词或一步。', '大人只帮这一小步。'] },
          still_resisted: { title: '明晚改成二选一求助', desc: '直接说哪里不会可能仍然难，用二选一降低开口压力。', steps: ['问：是看不懂题，还是不会算？', '孩子选一个就算完成。', '大人复述他的选择。'] },
          slow_but_started: { title: '明晚只帮第一小步', desc: '能开始但慢时，先保护孩子的求助动作。', steps: ['孩子说出难点。', '大人示范第一小步。', '后面一步让孩子自己试 30 秒。'] },
          not_tried: { title: '明晚先准备一句求助话', desc: '先把求助句放在前面，孩子遇到困难时更容易说出口。', steps: ['开写前教一句：我卡在这里。', '只练说这句话。', '说出来就先停一下。'] }
        }
      },
      {
        key: 'can_do_but_slow',
        label: '会做但拖很久',
        bottleneckTitle: '更像是启动困难',
        bottleneckText: '孩子可能会做，但开始第一步太费劲。今晚先把目标缩小到开始，而不是催完整作业。',
        actionTitle: '今晚先做 3 分钟开头陪跑',
        actionSteps: ['先把第一题读给孩子听。', '问一句：这题要我们做什么？', '孩子说出来后，只要求先写第一步。', '完成第一步后再决定是否继续。'],
        nextActions: {
          started_smoothly: { title: '明晚把开头陪跑延长到 5 分钟', desc: '启动已经变顺，下一步只加一点点时长。', steps: ['仍然先读第一题。', '完成第一步后继续陪 2 分钟。', '到 5 分钟就允许停。'] },
          still_resisted: { title: '明晚只做拿笔和读题', desc: '如果仍抗拒，先把完成作业目标放小到开始动作。', steps: ['只要求拿笔。', '大人读第一题。', '孩子不用写，先说题目要做什么。'] },
          slow_but_started: { title: '明晚用计时器保护开始', desc: '慢但能开始时，用短时间边界减少拉扯。', steps: ['设 3 分钟计时。', '只做第一题第一步。', '时间到先肯定开始动作。'] },
          not_tried: { title: '明晚先把第一题放到桌面', desc: '没试成时，从准备环境开始也算进入链路。', steps: ['提前把第一题放桌面。', '只让孩子坐下看一眼。', '看完就结束这一步。'] }
        }
      },
      {
        key: 'cannot_understand',
        label: '听不懂题目要求',
        bottleneckTitle: '更像是题目理解卡住了',
        bottleneckText: '孩子卡在读懂要求，直接让他写会更难。先帮孩子把题目翻译成一句简单动作。',
        actionTitle: '今晚先翻译第一题',
        actionSteps: ['大人读一遍题目。', '把题目改成一句话：这题要我们做什么？', '孩子复述后再写第一步。'],
        nextActions: {
          started_smoothly: { title: '明晚让孩子自己复述题目动作', desc: '题目被翻译清楚后，下一步练孩子说出要做什么。', steps: ['大人读题。', '孩子说：这题要我做什么。', '说对后再写第一步。'] },
          still_resisted: { title: '明晚先圈出题目关键词', desc: '抗拒可能来自看不懂，先减少整句压力。', steps: ['只圈一个关键词。', '大人把关键词变成动作。', '孩子点头或复述都算完成。'] },
          slow_but_started: { title: '明晚一题只翻译一次', desc: '能开始但慢时，先让孩子依赖更少一点提示。', steps: ['大人翻译第一题。', '孩子写第一步。', '第二题只提醒看关键词。'] },
          not_tried: { title: '明晚只选最短的一题翻译', desc: '没试成时，从最短题开始降低进入难度。', steps: ['挑最短的一题。', '大人读一遍。', '只问孩子这题让我们圈、连、写还是算。'] }
        }
      },
      {
        key: 'needs_prompting',
        label: '需要大人一直催',
        bottleneckTitle: '更像是缺少清楚的下一步',
        bottleneckText: '孩子可能知道要写作业，但不知道先做哪一个动作。今晚用一个明确动作替代反复催促。',
        actionTitle: '今晚只给一个动作指令',
        actionSteps: ['不说快点写。', '只说：先拿铅笔。', '完成后再说第二步：看第一题。'],
        nextActions: {
          started_smoothly: { title: '明晚继续一次只给一个指令', desc: '单一动作能减少混乱，先把这个沟通方式固定下来。', steps: ['只说第一个动作。', '完成后停 3 秒。', '再给第二个动作。'] },
          still_resisted: { title: '明晚把指令改成二选一', desc: '孩子仍抗拒时，给一点选择感会更容易动起来。', steps: ['问：先拿铅笔还是先翻本子？', '孩子选一个。', '只完成这个选择。'] },
          slow_but_started: { title: '明晚用动作卡替代催促', desc: '慢但能开始时，减少语言催促更稳。', steps: ['写下拿笔、看题、写一步。', '一次只指一个动作。', '完成后划掉一个。'] },
          not_tried: { title: '明晚先准备第一句指令', desc: '没试成时，先让家长准备好第一句，现场更容易开口。', steps: ['提前写好：先拿铅笔。', '到点只说这一句。', '孩子拿笔后就先停。'] }
        }
      }
    ],
    defaultBottleneck: {
      title: '先判断是听不懂、太难，还是启动困难',
      text: '写作业坐不住背后常见卡点不同。先缩小到第一步，孩子更容易进入状态。'
    },
    defaultAction: {
      title: '今晚先做 3 分钟开头陪跑',
      steps: ['先把第一题读给孩子听。', '只要求孩子说出题目要做什么。', '完成第一步后再进入正式练习。']
    }
  },
  {
    key: 'picture_book_runs',
    label: '绘本读两页就跑',
    shortLabel: '亲子共读',
    familyLanguage: '绘本刚翻两页就跑开，家长不知道是没兴趣还是听不懂。',
    question: '更像下面哪一种？',
    ageGroups: CORE_ACTION_AGE_GROUPS,
    symptoms: [
      {
        key: 'resists_reading',
        label: '一拿绘本就抗拒',
        bottleneckTitle: '更像是绘本被孩子理解成任务',
        bottleneckText: '孩子看到绘本就抗拒时，先把读书从任务感里拿出来。今晚只让孩子靠近一本书，不追完整阅读。',
        actionTitle: '今晚只选一本书放到身边',
        actionSteps: ['让孩子在两本书里选一本。', '只把书放到身边，不要求马上读。', '孩子愿意翻封面就结束。'],
        nextActions: {
          started_smoothly: { title: '明晚继续先让孩子选书', desc: '孩子愿意靠近书后，先固定选择感。', steps: ['只拿两本书给孩子选。', '孩子选完后翻封面。', '大人只说一句封面上有什么。'] },
          still_resisted: { title: '明晚先把绘本放到游戏里', desc: '抗拒仍在时，先减少读书任务感。', steps: ['把书当成小房子或小路。', '只让玩具走到封面上。', '不要求翻页和回答。'] },
          slow_but_started: { title: '明晚只读标题一句', desc: '愿意开始但很慢时，先把开口压到最短。', steps: ['孩子选书。', '大人只读标题。', '问一句：你想翻开看看吗？'] },
          not_tried: { title: '明晚先把绘本放到固定位置', desc: '没试成时，先让书出现在睡前或亲子时间里。', steps: ['提前把两本书放在沙发边。', '只问孩子想选哪本。', '选完就算完成。'] }
        }
      },
      {
        key: 'cannot_sit_still',
        label: '读两页就跑开',
        bottleneckTitle: '更像是共读时间超过了孩子当前耐受',
        bottleneckText: '孩子跑开不一定是不喜欢书，可能是连续坐着听太久。今晚先把目标缩到一页，让他有完成感。',
        actionTitle: '今晚只读一页也算完成',
        actionSteps: ['让孩子自己挑一页。', '只问这一页有谁。', '说出来后就结束，不追完整故事。'],
        nextActions: {
          started_smoothly: { title: '明晚从一页增加到两页', desc: '一页能完成后，只小幅增加阅读量。', steps: ['孩子先选第一页。', '读完后问还要一页吗。', '最多读两页就结束。'] },
          still_resisted: { title: '明晚改成站着看一页', desc: '坐不住时，先允许身体有一点自由。', steps: ['孩子可以站着看。', '只看一页图。', '说出一个东西就结束。'] },
          slow_but_started: { title: '明晚保留一页目标，减少提问', desc: '愿意开始但慢时，问题少一点更容易留下来。', steps: ['只翻一页。', '大人说一句画面内容。', '不追问细节。'] },
          not_tried: { title: '明晚先约定只读 1 分钟', desc: '没试成时，用时间边界降低压力。', steps: ['告诉孩子只看 1 分钟。', '到点就结束。', '结束时让孩子合上书。'] }
        }
      },
      {
        key: 'does_not_understand',
        label: '听不懂故事在讲什么',
        bottleneckTitle: '更像是故事信息太多',
        bottleneckText: '孩子听不懂时，先别急着讲完整情节。把一页画面拆成谁、在哪里、做什么，孩子更容易跟上。',
        actionTitle: '今晚只看一页里的一个角色',
        actionSteps: ['选一页图。', '指一个角色问：这是谁？', '再说一句：他在做什么。'],
        nextActions: {
          started_smoothly: { title: '明晚增加一个地点问题', desc: '能说出角色后，再加在哪里。', steps: ['先问这里有谁。', '再问他在哪里。', '大人合成一句完整话。'] },
          still_resisted: { title: '明晚只让孩子指一指', desc: '回答困难时，先用指认替代表达。', steps: ['大人说一个角色。', '孩子只要指到。', '大人说完整句。'] },
          slow_but_started: { title: '明晚保留角色问题，等 5 秒', desc: '慢但能开始时，给孩子更长反应时间。', steps: ['只问一个角色。', '安静等 5 秒。', '孩子说一个词就接完整句。'] },
          not_tried: { title: '明晚先选画面最清楚的一页', desc: '没试成时，从信息最少的一页开始。', steps: ['找只有一个主角的页。', '只问这是谁。', '说出或指出都算完成。'] }
        }
      },
      {
        key: 'only_flips',
        label: '只想自己翻图',
        bottleneckTitle: '更像是想掌控共读节奏',
        bottleneckText: '孩子只翻图说明他愿意接触书，只是想自己控制节奏。今晚先让孩子当翻页人，大人只跟着说一句。',
        actionTitle: '今晚让孩子当翻页人',
        actionSteps: ['孩子翻到哪页就停在哪页。', '大人只说一句画面内容。', '让孩子补一个词或动作。'],
        nextActions: {
          started_smoothly: { title: '明晚继续让孩子翻页，大人加一句问题', desc: '掌控感保留下来后，再加一点互动。', steps: ['孩子翻页。', '大人说一句画面。', '再问一个二选一问题。'] },
          still_resisted: { title: '明晚大人只跟随，不抢节奏', desc: '抗拒时先减少大人控制。', steps: ['孩子翻到哪页就看哪页。', '大人只说一个词。', '孩子翻走也不拉回。'] },
          slow_but_started: { title: '明晚只停留孩子喜欢的一页', desc: '愿意开始但慢时，停在孩子最感兴趣的地方。', steps: ['让孩子选一页。', '只看这一页。', '说完一个词就结束。'] },
          not_tried: { title: '明晚先让孩子只负责翻封面', desc: '没试成时，把参与动作缩到最小。', steps: ['孩子翻开封面。', '大人说书名。', '孩子想合上也可以。'] }
        }
      },
      {
        key: 'cannot_retell',
        label: '听完讲不出来',
        bottleneckTitle: '更像是复述结构不清楚',
        bottleneckText: '孩子可能记得画面，但不知道从哪里说。先只练谁在做什么，别要求完整复述。',
        actionTitle: '今晚只说谁在做什么',
        actionSteps: ['选一页图。', '问：这里有谁？', '再问：他在做什么？', '合成一句话就结束。'],
        nextActions: {
          started_smoothly: { title: '明晚加一句发生了什么', desc: '谁在做什么能说出来后，再补一个动作结果。', steps: ['先说谁在做什么。', '再问后来发生了什么。', '大人帮孩子连成两句话。'] },
          still_resisted: { title: '明晚只让孩子补最后一个词', desc: '复述抗拒时，先让孩子参与一个词。', steps: ['大人说：小兔在。', '孩子补一个动作词。', '大人重复完整句。'] },
          slow_but_started: { title: '明晚用三格顺序帮助复述', desc: '慢但能说时，用先、然后、最后给结构。', steps: ['大人说先。', '孩子说然后里一个动作。', '最后由大人补完。'] },
          not_tried: { title: '明晚先只复述一张图', desc: '没试成时，只拿一页当练习。', steps: ['选一页。', '说谁。', '说做什么。'] }
        }
      }
    ],
    defaultBottleneck: {
      title: '先判断是时间太长、听不懂，还是不知道怎么开口',
      text: '亲子共读不用先追求读完整本，先让孩子愿意停在一页上互动。'
    },
    defaultAction: {
      title: '今晚只读一页也算完成',
      steps: ['让孩子自己挑一页。', '只问这一页有谁。', '孩子说出一个词后就结束。']
    }
  },
  {
    key: 'meal_dawdling',
    label: '吃饭拖拉',
    shortLabel: '吃饭',
    familyLanguage: '吃饭慢、离桌、挑来挑去，一顿饭拖到全家都烦。',
    question: '更像下面哪一种？',
    ageGroups: CORE_ACTION_AGE_GROUPS,
    symptoms: [
      {
        key: 'leaves_table',
        label: '吃两口就离桌',
        bottleneckTitle: '更像是饭桌规则不够清楚',
        bottleneckText: '孩子可能还没形成坐在饭桌完成一小段的规则。先把目标定成短时间坐住。',
        actionTitle: '今晚先坐满 5 分钟',
        actionSteps: ['开饭前说清楚：先坐 5 分钟。', '5 分钟内只提醒一次。', '时间到后再决定是否继续吃。'],
        nextActions: {
          started_smoothly: { title: '明晚继续坐满 5 分钟', desc: '能坐住后先稳定饭桌规则，再慢慢增加进食量。', steps: ['开饭前先说 5 分钟规则。', '时间内只提醒一次。', '坐满后让孩子选再吃一口还是先停。'] },
          still_resisted: { title: '明晚把目标缩到坐 2 分钟', desc: '离桌仍多时，先把坐住时间降到孩子更容易完成。', steps: ['只要求坐 2 分钟。', '桌上只留当前食物。', '坐满就先肯定规则完成。'] },
          slow_but_started: { title: '明晚坐住后只吃三口', desc: '能坐住但吃得慢时，把吃饭目标变清楚。', steps: ['先坐满 5 分钟。', '只选三口最容易吃的。', '三口完成后再决定是否继续。'] },
          not_tried: { title: '明晚先约定离桌规则', desc: '没来得及试时，先在开饭前讲清楚饭桌边界。', steps: ['开饭前说：先坐 2 分钟。', '把计时器放桌上。', '时间到再允许离开。'] }
        }
      },
      {
        key: 'eats_too_slow',
        label: '一顿饭拖很久',
        bottleneckTitle: '更像是吃饭目标太模糊',
        bottleneckText: '孩子不知道这顿饭怎样才算完成时，容易边吃边拖。今晚先用一个小目标替代反复催促。',
        actionTitle: '今晚先完成三口小目标',
        actionSteps: ['开饭前选三口最容易吃的。', '三口中间少催促。', '完成三口后给一个选择。'],
        nextActions: {
          started_smoothly: { title: '明晚从三口增加到五口', desc: '小目标有效后，只小幅增加，不把整顿饭变成新压力。', steps: ['开饭前先选五口。', '吃完五口就先认可完成。', '再问要不要继续吃。'] },
          still_resisted: { title: '明晚把三口改成一口', desc: '抗拒明显时，先让孩子体验能完成。', steps: ['只选一口最容易吃的。', '吃完就算完成第一步。', '后面由孩子选继续或暂停。'] },
          slow_but_started: { title: '明晚用 10 分钟边界保护节奏', desc: '能开始但拖很久时，用短边界减少拉扯。', steps: ['设 10 分钟计时。', '时间里只完成三口。', '时间到先停催促。'] },
          not_tried: { title: '明晚先让孩子自己选三口', desc: '没试成时，把第一步改成选择目标。', steps: ['开饭前让孩子指三口。', '大人只负责夹到小碗里。', '先完成选择这一步。'] }
        }
      },
      {
        key: 'picky_food',
        label: '只挑喜欢的吃',
        bottleneckTitle: '更像是新食物接受度低',
        bottleneckText: '孩子抗拒新食物时，先降低到看一看、闻一闻，比要求吃下去更容易。',
        actionTitle: '今晚只靠近一种新食物',
        actionSteps: ['选一种新食物放在盘边。', '只要求看一看或闻一下。', '愿意碰一下就算完成。'],
        nextActions: {
          started_smoothly: { title: '明晚从看一看到碰一下', desc: '新食物接受要慢慢靠近，先增加一个很小接触。', steps: ['仍放同一种新食物。', '先看一看或闻一下。', '愿意的话用筷子碰一下。'] },
          still_resisted: { title: '明晚只把新食物放远一点', desc: '抗拒明显时，距离太近也会有压力。', steps: ['把新食物放在盘子边缘。', '不用吃也不用碰。', '只说出它的颜色。'] },
          slow_but_started: { title: '明晚让孩子决定靠近方式', desc: '能开始但慢时，给孩子一点掌控感。', steps: ['问：你想看、闻，还是碰一下？', '只做孩子选的方式。', '完成后不追加吃一口。'] },
          not_tried: { title: '明晚先选一种不太陌生的食物', desc: '没试成时，从最接近孩子喜欢口味的食物开始。', steps: ['选一种和常吃食物相近的。', '只放一点点在盘边。', '先说出它像什么。'] }
        }
      },
      {
        key: 'mealtime_conflict',
        label: '饭桌上总对抗',
        bottleneckTitle: '更像是吃饭变成了权力拉扯',
        bottleneckText: '饭桌对抗时，孩子关注的常常是赢过大人。今晚先减少命令，把选择限制在两个可接受选项里。',
        actionTitle: '今晚只给一个二选一',
        actionSteps: ['不说必须吃完。', '只问：先吃米饭还是先吃菜？', '孩子选一个后只完成这一口。'],
        nextActions: {
          started_smoothly: { title: '明晚继续用二选一开饭', desc: '选择感能降低对抗，先把饭桌开头稳定下来。', steps: ['只给两个可接受选项。', '孩子选一个。', '先完成一口再聊别的。'] },
          still_resisted: { title: '明晚先暂停说教 1 分钟', desc: '对抗仍强时，先降低语言刺激。', steps: ['孩子顶嘴时先停 1 分钟。', '大人只重复两个选项。', '选完就只做一口。'] },
          slow_but_started: { title: '明晚把选择写在桌边', desc: '能开始但慢时，让规则更可见。', steps: ['写下米饭或菜两个选项。', '孩子指一个。', '完成一口后划掉。'] },
          not_tried: { title: '明晚先准备两个选项', desc: '没试成时，先让大人提前想好可接受选择。', steps: ['开饭前写好两个选项。', '饭桌上只说这两个。', '不临时增加新要求。'] }
        }
      },
      {
        key: 'snacks_only',
        label: '只吃零食不吃饭',
        bottleneckTitle: '更像是正餐前饱腹和期待被零食占了',
        bottleneckText: '孩子只等零食时，正餐很难有吸引力。今晚先把零食放到正餐后，用可预期规则减少拉扯。',
        actionTitle: '今晚先把零食放到饭后',
        actionSteps: ['开饭前说：先吃三口饭，再决定零食。', '零食不放在饭桌上。', '三口完成后再给一个小选择。'],
        nextActions: {
          started_smoothly: { title: '明晚继续饭后三口规则', desc: '零食顺序稳定后，正餐入口会更清楚。', steps: ['开饭前重复三口规则。', '零食放在看不见的位置。', '三口后再讨论零食。'] },
          still_resisted: { title: '明晚把三口改成一口饭', desc: '抗拒强时，先建立正餐在零食前的顺序。', steps: ['只要求一口饭。', '吃完再给很小份零食。', '不边吃饭边吃零食。'] },
          slow_but_started: { title: '明晚让孩子选正餐第一口', desc: '能开始但慢时，先让第一口更容易。', steps: ['从饭菜里选一口。', '完成这一口后停一下。', '再决定是否继续三口。'] },
          not_tried: { title: '明晚先调整零食出现时间', desc: '没试成时，先改变零食的可见性。', steps: ['饭前不拿出零食。', '开饭前只说饭后再看零食。', '饭桌上只放正餐。'] }
        }
      }
    ],
    defaultBottleneck: {
      title: '先判断是规则不清楚、注意力跑掉，还是自主吃饭难',
      text: '吃饭拖拉先从一个小目标开始，减少饭桌拉扯。'
    },
    defaultAction: {
      title: '今晚先完成三口小目标',
      steps: ['开饭前说清楚今天先吃三口。', '三口中间少催促。', '完成后给孩子一个选择。']
    }
  },
  {
    key: 'bedtime_meltdown',
    label: '睡前崩溃',
    shortLabel: '睡前',
    familyLanguage: '一到洗漱、关灯、上床就哭闹，睡前变成每天最累的时候。',
    question: '更像下面哪一种？',
    ageGroups: CORE_ACTION_AGE_GROUPS,
    symptoms: [
      {
        key: 'resists_washing',
        label: '洗漱就抗拒',
        bottleneckTitle: '更像是转换太突然',
        bottleneckText: '孩子可能还没准备好从玩切换到洗漱。睡前先给一个可预期的过渡动作。',
        actionTitle: '今晚先做洗漱倒计时',
        actionSteps: ['洗漱前 5 分钟提醒一次。', '让孩子选先刷牙还是先洗脸。', '只要求完成第一步。'],
        nextActions: {
          started_smoothly: { title: '明晚继续用 5 分钟倒计时', desc: '倒计时有效时，先固定这段过渡，让孩子知道玩到洗漱怎么切换。', steps: ['睡前 5 分钟提醒。', '让孩子二选一决定先刷牙还是先洗脸。', '第一步完成后再进入下一步。'] },
          still_resisted: { title: '明晚把洗漱拆成一个动作', desc: '抗拒仍然明显时，先把整套洗漱缩小成一个可完成动作。', steps: ['先只走到洗手台。', '只碰一下牙刷或毛巾。', '完成后暂停 30 秒再继续。'] },
          slow_but_started: { title: '明晚保留选择，少催一次', desc: '能开始但慢时，先保护孩子愿意进入洗漱的动作。', steps: ['仍让孩子选先做哪步。', '大人只提醒一次当前动作。', '做完第一步就肯定开始了。'] },
          not_tried: { title: '明晚先提前摆好洗漱用品', desc: '没来得及试时，先把环境准备好，让第一步更容易发生。', steps: ['睡前把牙刷杯子放好。', '到点只提醒看牙刷。', '孩子走到洗手台就算完成第一步。'] }
        }
      },
      {
        key: 'delays_bed',
        label: '上床一直拖延',
        bottleneckTitle: '更像是睡前边界不清楚',
        bottleneckText: '孩子拖延时，家长容易不断让步。今晚先把最后一个动作说清楚。',
        actionTitle: '今晚固定最后一件事',
        actionSteps: ['提前说：读完这一页就关灯。', '读完后重复同一句。', '不再增加新项目。'],
        nextActions: {
          started_smoothly: { title: '明晚继续固定最后一件事', desc: '边界清楚后拖延会减少，先保持同一句结束语。', steps: ['睡前提前说明最后一件事。', '做完后重复同一句结束语。', '不新增喝水、玩具和故事。'] },
          still_resisted: { title: '明晚把最后一件事换成更小的动作', desc: '如果还抗拒，说明最后一件事仍然偏大。', steps: ['把一页书改成三句话。', '说完三句话就关灯。', '孩子要求增加时只重复约定。'] },
          slow_but_started: { title: '明晚用计时器保护结束', desc: '慢但能上床时，用时间边界减少反复谈判。', steps: ['设 3 分钟睡前计时。', '时间里完成最后一件事。', '响铃后只说结束语。'] },
          not_tried: { title: '明晚先和孩子约定最后一件事', desc: '没试成时，先在情绪平稳时把规则说清楚。', steps: ['白天先问孩子今晚最后做什么。', '只在两个选项里选一个。', '睡前按这个约定执行。'] }
        }
      },
      {
        key: 'cries_lights_off',
        label: '一关灯就哭',
        bottleneckTitle: '更像是分离和黑暗不安',
        bottleneckText: '孩子不是单纯不睡，而是关灯后不安全感上来。今晚先保留一个稳定陪伴信号。',
        actionTitle: '今晚用 3 句话固定告别',
        actionSteps: ['关灯前抱一下。', '说：妈妈在门口，5 分钟后来看你。', '5 分钟后按约定回来一次。'],
        nextActions: {
          started_smoothly: { title: '明晚继续用固定告别话', desc: '固定话术能让孩子知道大人会回来，安全感会更稳定。', steps: ['关灯前抱一下。', '重复同一句告别话。', '按约定时间回来一次。'] },
          still_resisted: { title: '明晚先把离开时间缩短', desc: '哭闹仍明显时，离开时间需要更短、更可预期。', steps: ['关灯后先离开 1 分钟。', '1 分钟后回来轻声确认。', '再离开 1 分钟。'] },
          slow_but_started: { title: '明晚把回来次数说清楚', desc: '能接受一部分关灯时，下一步是让陪伴更有边界。', steps: ['睡前说好会回来 2 次。', '每次只停 20 秒。', '第二次后只在门口回应。'] },
          not_tried: { title: '明晚先准备一句安全话', desc: '没试成时，先把孩子熟悉的安全信号准备好。', steps: ['白天一起选一句安全话。', '关灯前先练一遍。', '晚上只重复这句话。'] }
        }
      },
      {
        key: 'asks_parent_stay',
        label: '反复要大人陪',
        bottleneckTitle: '更像是陪伴退出太快',
        bottleneckText: '孩子需要从完全陪睡慢慢过渡到短暂离开。今晚先练一个很短的离开。',
        actionTitle: '今晚只离开 1 分钟',
        actionSteps: ['先陪孩子躺好。', '说：我去喝口水，1 分钟回来。', '按时回来，让孩子知道离开是可预期的。'],
        nextActions: {
          started_smoothly: { title: '明晚把离开延长到 2 分钟', desc: '1 分钟能接受后，只小幅延长，避免一下退出太快。', steps: ['先陪孩子躺好。', '说清楚离开 2 分钟。', '按时回来并保持简短。'] },
          still_resisted: { title: '明晚改成站到门口 30 秒', desc: '孩子还很需要陪伴时，先从位置变化开始。', steps: ['先坐在床边。', '再站到门口 30 秒。', '回来轻声说：我回来了。'] },
          slow_but_started: { title: '明晚减少一次床边互动', desc: '能接受短暂离开时，减少反复说话会更稳。', steps: ['离开前只说一句。', '回来后只轻拍一下。', '不重新讲故事或聊天。'] },
          not_tried: { title: '明晚先约定回来时间', desc: '没试成时，先让孩子知道大人离开后会回来。', steps: ['睡前说：我离开后会回来。', '先约定 1 分钟。', '用计时器让时间看得见。'] }
        }
      },
      {
        key: 'wakes_at_night',
        label: '夜里醒来又哭',
        bottleneckTitle: '更像是夜醒后不会自己重新安定',
        bottleneckText: '孩子夜里醒来后需要一个固定安抚信号。先保持回应简短稳定，减少重新进入玩耍或聊天。',
        actionTitle: '今晚先固定夜醒回应',
        actionSteps: ['孩子醒来时先轻声说同一句话。', '只轻拍 30 秒。', '不打开大灯，不重新讲故事。'],
        nextActions: {
          started_smoothly: { title: '明晚继续同一句夜醒回应', desc: '回应稳定后，孩子更容易把夜醒和重新入睡连起来。', steps: ['夜醒时重复同一句话。', '轻拍 30 秒。', '保持暗光和低声。'] },
          still_resisted: { title: '明晚先缩短互动内容', desc: '夜醒哭闹仍强时，先减少额外刺激，让环境保持睡眠信号。', steps: ['不开大灯。', '不抱出房间。', '只重复同一句安抚话。'] },
          slow_but_started: { title: '明晚把安抚次数说清楚', desc: '能慢慢安定时，给孩子稳定但有限的回应。', steps: ['先轻拍 30 秒。', '停 30 秒观察。', '还哭再重复一次。'] },
          not_tried: { title: '今晚先准备夜醒安抚句', desc: '没来得及试时，先把夜里要说的话提前定好。', steps: ['睡前和家人统一一句话。', '夜醒时只说这句。', '记录孩子多久安静下来。'] }
        }
      }
    ],
    defaultBottleneck: {
      title: '先判断是转换太突然、边界不清楚，还是不安全感上来',
      text: '睡前崩溃先用固定流程降低不确定感，不急着要求孩子马上安静。'
    },
    defaultAction: {
      title: '今晚先固定一个睡前结束动作',
      steps: ['提前 5 分钟提醒要洗漱。', '让孩子二选一决定先做哪步。', '完成最后一件事后用同一句话结束。']
    }
  },
  {
    key: 'class_departure_dawdling',
    label: '出门上课磨蹭',
    shortLabel: '出门上课',
    familyLanguage: '早上出门、上课、入园前磨蹭哭闹，家长赶时间很崩溃。',
    question: '更像下面哪一种？',
    ageGroups: CORE_ACTION_AGE_GROUPS,
    symptoms: [
      {
        key: 'slow_dressing',
        label: '穿衣服很慢',
        bottleneckTitle: '更像是第一步不清楚',
        bottleneckText: '出门前任务多，孩子容易不知道先做什么。今晚先把明早第一步准备好。',
        actionTitle: '今晚先摆好明天第一件衣服',
        actionSteps: ['睡前和孩子一起选衣服。', '把第一件要穿的放在床边。', '明早只提示：先穿这件。'],
        nextActions: {
          started_smoothly: { title: '明晚继续摆好第一件衣服', desc: '第一步清楚后，明早更容易启动。', steps: ['睡前一起选第一件衣服。', '放在孩子一眼能看到的位置。', '明早只提示先穿这件。'] },
          still_resisted: { title: '明晚把穿衣改成先碰一下衣服', desc: '换衣抗拒仍在时，先降低到靠近衣服。', steps: ['把衣服放床边。', '明早只让孩子摸一下衣服。', '再问先穿上衣还是裤子。'] },
          slow_but_started: { title: '明晚按顺序摆两件衣服', desc: '能开始但慢时，用顺序减少现场犹豫。', steps: ['把第一件和第二件按顺序摆好。', '穿完第一件再提示第二件。', '中间少催促。'] },
          not_tried: { title: '今晚先只选明早第一件衣服', desc: '没试成时，先完成准备动作。', steps: ['睡前拿出两件让孩子选。', '选一件放床边。', '明早不再重新选择。'] }
        }
      },
      {
        key: 'refuses_leave',
        label: '到门口不肯走',
        bottleneckTitle: '更像是转换到外出有压力',
        bottleneckText: '孩子在门口卡住，可能是不想离开熟悉环境。先给一个可带走的小连接。',
        actionTitle: '今晚准备一个出门小物',
        actionSteps: ['让孩子选一个小贴纸或小卡片。', '告诉他明天带着它一起出门。', '到门口时提醒小物先出发。'],
        nextActions: {
          started_smoothly: { title: '明早继续让小物先出发', desc: '可带走的小连接有效时，先固定这个过渡。', steps: ['出门前拿好小物。', '到门口说小物先出发。', '孩子跟着一起迈出门。'] },
          still_resisted: { title: '明早先走到门口停 10 秒', desc: '出门哭闹仍强时，先把离开家缩成靠近门。', steps: ['先拿着小物走到门口。', '停 10 秒。', '再决定先穿鞋还是先开门。'] },
          slow_but_started: { title: '明早把出门拆成三步', desc: '能开始但慢时，步骤更清楚会减少拉扯。', steps: ['拿小物。', '穿鞋。', '小物先出门。'] },
          not_tried: { title: '今晚先让孩子选出门小物', desc: '没试成时，先准备明早能带走的连接。', steps: ['让孩子选贴纸或小卡片。', '放进包里。', '告诉孩子明早它一起出门。'] }
        }
      },
      {
        key: 'cries_before_class',
        label: '上课前哭闹',
        bottleneckTitle: '更像是分离前不确定',
        bottleneckText: '孩子哭闹常发生在分别前。先把告别流程固定下来，减少拉扯。',
        actionTitle: '今晚约定明天告别三步',
        actionSteps: ['说好明天到门口抱一下。', '说一句固定告别话。', '大人离开后不反复回头。'],
        nextActions: {
          started_smoothly: { title: '明天继续固定告别三步', desc: '分离流程稳定后，孩子更容易预期大人怎么离开。', steps: ['到门口抱一下。', '说同一句告别话。', '大人按约定离开。'] },
          still_resisted: { title: '明天把告别前预告提前', desc: '分离哭闹仍强时，孩子需要更早知道会发生什么。', steps: ['出门前先说今天怎么告别。', '到门口只做三步。', '不临时增加解释。'] },
          slow_but_started: { title: '明天减少门口停留时间', desc: '能分离但慢时，门口停留越久越容易反复。', steps: ['抱一下。', '说固定话。', '10 秒内离开。'] },
          not_tried: { title: '今晚先练一遍告别话', desc: '没试成时，先让孩子熟悉告别流程。', steps: ['睡前演练抱一下。', '说固定告别话。', '让孩子也说一句回来见。'] }
        }
      },
      {
        key: 'forgets_items',
        label: '总忘带东西',
        bottleneckTitle: '更像是出门流程太散',
        bottleneckText: '忘东西不是态度问题，常是流程没有视觉化。今晚先做一个小清单。',
        actionTitle: '今晚只准备三样东西',
        actionSteps: ['把书包、水杯、外套放一起。', '让孩子自己点一遍。', '明早按这三样检查。'],
        nextActions: {
          started_smoothly: { title: '今晚继续准备三样东西', desc: '三样清单有效时，先固定这个出门流程。', steps: ['睡前放好书包、水杯、外套。', '让孩子点一遍。', '明早按同一顺序检查。'] },
          still_resisted: { title: '今晚把三样缩成一样', desc: '抗拒收拾时，先让孩子负责一个物品。', steps: ['只让孩子负责水杯。', '放到门口固定位置。', '明早只检查这一样。'] },
          slow_but_started: { title: '今晚用图片顺序收拾', desc: '能开始但慢时，视觉顺序更容易跟上。', steps: ['画三个小图标。', '孩子收一样划掉一样。', '完成后把清单放门口。'] },
          not_tried: { title: '今晚先定一个固定放置点', desc: '没试成时，先让物品有固定位置。', steps: ['选门口一个位置。', '先只放书包。', '明早从这里拿。'] }
        }
      },
      {
        key: 'morning_dawdling',
        label: '早晨一直拖延',
        bottleneckTitle: '更像是早晨流程没有可见顺序',
        bottleneckText: '早晨任务一多，孩子容易拖在每一步。今晚先把明早前三步排出来，让孩子知道接下来做什么。',
        actionTitle: '今晚排好明早前三步',
        actionSteps: ['睡前写下穿衣、洗漱、拿包三步。', '让孩子选第一步贴星星。', '明早只从第一步开始。'],
        nextActions: {
          started_smoothly: { title: '今晚继续用前三步清单', desc: '顺序清楚后，早晨催促会减少。', steps: ['睡前排好前三步。', '明早完成一步划掉一步。', '三步后再处理其他事。'] },
          still_resisted: { title: '明早只执行第一步', desc: '拖延仍明显时，先把目标缩到开始。', steps: ['只看第一步。', '完成第一步就先停催促。', '再问下一步要不要现在做。'] },
          slow_but_started: { title: '明早用计时器守住第一步', desc: '能开始但慢时，用短边界帮孩子进入节奏。', steps: ['给第一步设 3 分钟。', '时间里只做这一件。', '结束后划掉第一步。'] },
          not_tried: { title: '今晚先写出明早第一步', desc: '没试成时，先把第一步变清楚。', steps: ['只写一个动作：先穿上衣。', '贴在床边。', '明早只提醒这一句。'] }
        }
      }
    ],
    defaultBottleneck: {
      title: '先判断是第一步不清楚、分离有压力，还是流程太散',
      text: '出门磨蹭先减少临场选择，把明早第一步提前准备好。'
    },
    defaultAction: {
      title: '今晚先准备明早第一步',
      steps: ['睡前选好明天第一件要做的事。', '把对应物品放到看得见的位置。', '明早只提醒这一件事。']
    }
  },
  {
    key: 'weak_expression',
    label: '说话表达弱',
    shortLabel: '表达',
    familyLanguage: '孩子说得少、说不清，或者遇到事情只哭不说。',
    question: '更像下面哪一种？',
    ageGroups: CORE_ACTION_AGE_GROUPS,
    symptoms: [
      {
        key: 'speaks_little',
        label: '平时开口少',
        bottleneckTitle: '更像是开口机会太难',
        bottleneckText: '孩子开口少时，先从一个词开始，不急着要求完整表达。',
        actionTitle: '今晚只等一个词',
        actionSteps: ['拿孩子想要的东西。', '停 5 秒。', '提示他说一个词，例如水或车。'],
        nextActions: {
          started_smoothly: { title: '明晚继续等一个词', desc: '孩子愿意开口后，先稳定这个成功经验。', steps: ['拿孩子想要的东西。', '停 5 秒等一个词。', '大人把词接成一句完整话。'] },
          still_resisted: { title: '明晚改成让孩子指一指再说', desc: '开口抗拒时，先用动作降低难度。', steps: ['把两个东西放面前。', '让孩子先指一个。', '大人说出词，再等孩子跟一个字。'] },
          slow_but_started: { title: '明晚把等待延长到 8 秒', desc: '孩子慢慢能开口时，多给一点反应时间。', steps: ['先不急着替他说。', '安静等 8 秒。', '听到一个词就接成完整句。'] },
          not_tried: { title: '明晚先选一个最想要的东西', desc: '没试成时，先把开口场景变得自然。', steps: ['选孩子最常要的东西。', '递出前停 3 秒。', '只提示一个最简单的词。'] }
        }
      },
      {
        key: 'unclear_words',
        label: '说不清楚',
        bottleneckTitle: '更像是语速和发音控制弱',
        bottleneckText: '说不清时，先慢下来比纠正很多音更容易。今晚只练一句常用话。',
        actionTitle: '今晚慢慢说一句',
        actionSteps: ['选一句常用话。', '大人慢慢说一遍。', '孩子跟着慢慢说一遍，不要求完美。'],
        nextActions: {
          started_smoothly: { title: '明晚继续慢慢说同一句', desc: '发音练习先靠重复同一句建立稳定感。', steps: ['仍选同一句常用话。', '大人慢慢说一遍。', '孩子慢慢跟一遍。'] },
          still_resisted: { title: '明晚只练最后两个字', desc: '整句压力大时，先从短尾音开始。', steps: ['大人说完整句。', '孩子只跟最后两个字。', '说完就结束练习。'] },
          slow_but_started: { title: '明晚加一个拍手节奏', desc: '能跟说但含糊时，用节奏帮孩子慢下来。', steps: ['一句话分成两段。', '每段拍一下手。', '孩子跟着节奏慢慢说。'] },
          not_tried: { title: '明晚先选一句最常用的话', desc: '没试成时，先选高频短句。', steps: ['选我还要或帮帮我。', '大人慢慢示范。', '孩子愿意跟一个字也算完成。'] }
        }
      },
      {
        key: 'cannot_tell_event',
        label: '说不清发生了什么',
        bottleneckTitle: '更像是事件顺序不会组织',
        bottleneckText: '孩子可能经历了事情，但不知道怎么说。先只问一个人和一个动作。',
        actionTitle: '今晚只说谁做了什么',
        actionSteps: ['问：今天和谁玩了？', '再问：你们做了什么？', '帮孩子合成一句话。'],
        nextActions: {
          started_smoothly: { title: '明晚继续说谁做了什么', desc: '先稳定两段式表达，再慢慢加细节。', steps: ['问今天和谁在一起。', '问做了一件什么事。', '大人合成一句完整话。'] },
          still_resisted: { title: '明晚改成看照片说一句', desc: '讲经历困难时，照片能给孩子线索。', steps: ['拿一张当天照片。', '问照片里有谁。', '再问他在做什么。'] },
          slow_but_started: { title: '明晚加一个地点词', desc: '孩子能说两段后，可以加一个很短的地点信息。', steps: ['先说谁。', '再说在哪里。', '最后说做了什么。'] },
          not_tried: { title: '明晚先问一个人名', desc: '没试成时，把讲经历缩到一个答案。', steps: ['只问今天见到谁。', '孩子说出名字后大人接一句。', '先不追问更多细节。'] }
        }
      },
      {
        key: 'nods_only',
        label: '只点头摇头',
        bottleneckTitle: '更像是回答难度太高',
        bottleneckText: '开放式问题太难，孩子就用动作回答。今晚先用二选一让他开口。',
        actionTitle: '今晚只问二选一',
        actionSteps: ['问：你要苹果还是香蕉？', '等孩子说出一个词。', '大人重复成完整句。'],
        nextActions: {
          started_smoothly: { title: '明晚继续用二选一开口', desc: '二选一能让孩子更容易从动作转成语言。', steps: ['给两个真实选项。', '等孩子说出一个词。', '大人重复完整句。'] },
          still_resisted: { title: '明晚先允许指完再说', desc: '孩子仍只点头摇头时，先让动作和词连接起来。', steps: ['让孩子先指选项。', '大人说出这个词。', '等孩子跟一个字或一个词。'] },
          slow_but_started: { title: '明晚把选项减少语言干扰', desc: '能开口但慢时，问题越短越容易回答。', steps: ['只说苹果还是香蕉。', '停 5 秒。', '孩子说一个词后马上回应。'] },
          not_tried: { title: '明晚先准备两个可见选项', desc: '没试成时，先把选项放到孩子面前。', steps: ['拿出两个食物或玩具。', '只问要哪个。', '等一个词。'] }
        }
      },
      {
        key: 'cries_instead_words',
        label: '着急就哭不说',
        bottleneckTitle: '更像是情绪上来后说不出来',
        bottleneckText: '孩子着急时语言会更难出来。先帮他说出一个感受词，再处理事情。',
        actionTitle: '今晚先替孩子说一个感受词',
        actionSteps: ['孩子着急时先蹲下来。', '说：你现在很急。', '再问：你要帮忙还是自己来？'],
        nextActions: {
          started_smoothly: { title: '明晚继续先说感受词', desc: '情绪里能听见感受词后，再引导孩子说需求。', steps: ['先蹲下来。', '说一个感受词。', '再问帮忙还是自己来。'] },
          still_resisted: { title: '明晚先只共情不追问', desc: '哭闹仍强时，追问会增加表达压力。', steps: ['先说你很急。', '停 10 秒陪着。', '等哭声降一点再给二选一。'] },
          slow_but_started: { title: '明晚加一个需求词', desc: '孩子能缓一点后，再帮他把感受接到需求。', steps: ['先说你很急。', '再提示帮忙这个词。', '孩子说或点头后再处理事情。'] },
          not_tried: { title: '明晚先准备两个常用感受词', desc: '没试成时，先让大人有固定说法。', steps: ['选着急和生气两个词。', '孩子哭时只说其中一个。', '说完停一下再行动。'] }
        }
      }
    ],
    defaultBottleneck: {
      title: '先判断是不会开口、说不清，还是情绪上来后表达断掉',
      text: '表达弱先从一个词、一句话开始，让孩子有更容易成功的开口机会。'
    },
    defaultAction: {
      title: '今晚先练一个词到一句话',
      steps: ['选一个孩子常用场景。', '先等 5 秒让孩子说一个词。', '大人把这个词接成一句完整话。']
    }
  }
];

var AGE_FIRST_CATEGORY_DEFINITIONS = [
  {
    key: 'attention_learning',
    label: '专注学习',
    description: '学习启动、课堂注意、阅读和任务完成相关情况。',
    sceneKeyPrefix: 'age_attention',
    abilityTags: ['专注力', '学习启动', '任务意识'],
    observableSigns: ['启动慢', '容易分心', '需要反复提醒'],
    templates: [
      { key: 'start_delay', title: '开始前磨很久', desc: '知道要做，但迟迟进入不了状态。', signs: ['反复找借口', '坐下还发呆', '要大人催很多次'], tags: ['学习启动', '执行力'] },
      { key: 'attention_short', title: '专注时间很短', desc: '刚开始还行，很快就离开任务。', signs: ['几分钟就换事', '做到一半跑开', '小动作变多'], tags: ['专注力', '持续注意'] },
      { key: 'instruction_forget', title: '听完就忘要做什么', desc: '听到要求后很快忘记步骤。', signs: ['问完又问', '做错顺序', '漏掉关键动作'], tags: ['听觉注意', '工作记忆'] },
      { key: 'task_half_done', title: '任务总是半途停下', desc: '能开始，但很难把一件事收尾。', signs: ['做到一半停', '转去玩别的', '最后一步要催'], tags: ['任务意识', '完成闭环'] },
      { key: 'reading_drift', title: '阅读时眼神飘走', desc: '看书或听故事时注意力容易断。', signs: ['看窗外', '跳行漏字', '复述困难'], tags: ['阅读注意', '视觉追踪'] },
      { key: 'homework_slow', title: '会做但做得很慢', desc: '题目会做，但速度拖得很长。', signs: ['一题写很久', '边写边停', '越写越慢'], tags: ['学习效率', '动作计划'] },
      { key: 'multi_step_hard', title: '多步骤任务容易乱', desc: '两个以上步骤就不知道先后。', signs: ['顺序混乱', '漏步骤', '要大人分解'], tags: ['计划能力', '执行顺序'] },
      { key: 'review_resist', title: '复习练习很抗拒', desc: '一提复习或重复练习就烦。', signs: ['说太烦了', '不愿再做', '只想跳过'], tags: ['学习耐心', '情绪调节'] },
      { key: 'mistake_panic', title: '一错就慌', desc: '做错后马上急，影响继续尝试。', signs: ['说我不会', '擦很多次', '不肯再试'], tags: ['挫折承受', '学习自信'] },
      { key: 'finish_check_weak', title: '做完不会检查', desc: '完成后马上走，不会回看结果。', signs: ['漏题没发现', '写完就跑', '不愿回看'], tags: ['自我检查', '学习习惯'] }
    ]
  },
  {
    key: 'emotion_rules',
    label: '情绪规则',
    description: '情绪调节、等待轮流、规则理解和环境适应相关情况。',
    sceneKeyPrefix: 'age_emotion',
    abilityTags: ['情绪调节', '规则理解', '等待轮流'],
    observableSigns: ['容易急', '不愿等', '规则一变就崩'],
    templates: [
      { key: 'small_frustration_big', title: '小事不顺就爆发', desc: '很小的变化也会引起哭闹或发脾气。', signs: ['哭闹来得快', '安抚时间长', '反复纠结'], tags: ['情绪调节', '挫折承受'] },
      { key: 'wait_hard', title: '等一会儿都很难', desc: '排队、轮流或等待时很快着急。', signs: ['插队', '催别人', '抢先开始'], tags: ['等待轮流', '冲动控制'] },
      { key: 'rule_change_hard', title: '规则一变就不接受', desc: '规则调整或计划变化时反应很大。', signs: ['坚持原计划', '不听解释', '马上生气'], tags: ['规则弹性', '情绪调节'] },
      { key: 'lose_reaction_big', title: '输了就不玩', desc: '游戏或比赛结果不如意就退出。', signs: ['输了哭', '改规则', '拒绝继续'], tags: ['挫折承受', '规则理解'] },
      { key: 'transition_hard', title: '活动切换很困难', desc: '从玩到吃饭、洗澡或学习时阻力大。', signs: ['拖延切换', '讨价还价', '情绪变大'], tags: ['转换能力', '自我管理'] },
      { key: 'boundary_push', title: '反复试探边界', desc: '已经说过的规则还会反复挑战。', signs: ['明知还做', '看大人反应', '越提醒越做'], tags: ['规则理解', '边界感'] },
      { key: 'new_place_tense', title: '新环境放不开', desc: '面对新地方或新老师时明显紧张。', signs: ['躲在大人身后', '不愿开口', '不愿参与'], tags: ['环境适应', '安全感'] },
      { key: 'criticism_sensitive', title: '一被提醒就委屈', desc: '普通提醒也容易理解成批评。', signs: ['低头不说话', '马上哭', '说你不喜欢我'], tags: ['情绪安全', '自尊感'] },
      { key: 'morning_evening_chaos', title: '早晚流程总混乱', desc: '起床、睡前或出门流程经常拖乱。', signs: ['反复催促', '漏掉步骤', '时间越拖越急'], tags: ['生活规则', '流程意识'] },
      { key: 'calm_down_slow', title: '情绪下来很慢', desc: '哭闹后很久才能恢复正常互动。', signs: ['反复哭', '不接受安抚', '恢复后还提旧事'], tags: ['情绪恢复', '安全感'] }
    ]
  },
  {
    key: 'motor_fitness',
    label: '运动体能',
    description: '大运动、协调、体能、体态和专项运动基础相关情况。',
    sceneKeyPrefix: 'age_motor',
    abilityTags: ['身体控制', '协调体能', '动作计划'],
    observableSigns: ['动作不稳', '容易累', '协调跟不上'],
    templates: [
      { key: 'balance_unstable', title: '身体平衡不稳', desc: '走跑跳或站立动作容易晃。', signs: ['容易摔', '单脚站困难', '转身不稳'], tags: ['平衡能力', '前庭觉'] },
      { key: 'coordination_slow', title: '动作配合慢半拍', desc: '手脚配合、节奏和方向容易乱。', signs: ['接球漏', '节奏跟不上', '左右分不清'], tags: ['协调能力', '动作计划'] },
      { key: 'jump_weak', title: '跳跃力量弱', desc: '跳起、落地或连续跳都吃力。', signs: ['跳不高', '落地重', '连续跳断'], tags: ['下肢力量', '爆发力'] },
      { key: 'run_tired_fast', title: '跑一会儿就累', desc: '跑步、追逐或活动持续时间短。', signs: ['喘得快', '很快停下', '不愿跑'], tags: ['基础耐力', '心肺基础'] },
      { key: 'core_slump', title: '坐姿站姿容易塌', desc: '坐着写画或运动时身体撑不住。', signs: ['趴桌子', '含胸', '身体晃'], tags: ['核心稳定', '体态控制'] },
      { key: 'rope_ball_hard', title: '跳绳球类学得慢', desc: '跳绳、拍球、接球等项目推进慢。', signs: ['绳子常断', '拍球不连续', '接球害怕'], tags: ['节奏感', '手眼协调'] },
      { key: 'fine_motor_tired', title: '手部小动作容易累', desc: '画画、剪纸、写字或拼搭时手很快累。', signs: ['握笔紧', '手酸', '不愿精细操作'], tags: ['精细动作', '手部力量'] },
      { key: 'body_boundary_weak', title: '身体边界感弱', desc: '靠近别人或使用力量时掌握不好距离。', signs: ['撞到别人', '力气过大', '排队贴太近'], tags: ['身体边界', '本体觉'] },
      { key: 'movement_avoid', title: '不太愿意运动', desc: '看到运动任务就躲，缺少主动尝试。', signs: ['说太累', '站旁边看', '只选静态活动'], tags: ['运动信心', '身体经验'] },
      { key: 'recovery_slow', title: '运动后恢复慢', desc: '活动后情绪或身体状态很久缓不过来。', signs: ['大汗后烦躁', '休息很久', '不愿继续'], tags: ['体能恢复', '自我感知'] }
    ]
  },
  {
    key: 'social_expression',
    label: '社交表达',
    description: '语言表达、同伴互动、集体参与和亲子沟通相关情况。',
    sceneKeyPrefix: 'age_social',
    abilityTags: ['语言表达', '社交能力', '亲子互动'],
    observableSigns: ['说不清', '不敢加入', '容易冲突'],
    templates: [
      { key: 'need_words_hard', title: '想要什么说不清', desc: '有需求时常靠哭、拉人或发脾气表达。', signs: ['用手指', '拉大人', '着急就哭'], tags: ['需求表达', '语言组织'] },
      { key: 'story_unclear', title: '讲不清发生了什么', desc: '经历过的事很难按顺序说出来。', signs: ['说半句', '前后乱', '要大人猜'], tags: ['叙事表达', '事件顺序'] },
      { key: 'peer_join_hard', title: '不知道怎么加入同伴', desc: '想一起玩，但不知道开口或进入游戏。', signs: ['站旁边看', '跟着跑但不说', '需要老师带'], tags: ['社交加入', '安全感'] },
      { key: 'conflict_words_less', title: '冲突时不会好好说', desc: '被抢、想拒绝或想加入时容易急。', signs: ['直接抢', '推人', '告状后说不清'], tags: ['冲突表达', '情绪调节'] },
      { key: 'turn_talk_less', title: '轮到自己说就卡住', desc: '集体或课堂表达时明显退缩。', signs: ['低头', '声音很小', '说不知道'], tags: ['表达信心', '集体适应'] },
      { key: 'adult_instruction_reply', title: '大人问话不回应', desc: '被问问题时经常沉默或只点头。', signs: ['不回答', '只点头', '转移话题'], tags: ['回应能力', '听说配合'] },
      { key: 'emotion_words_less', title: '不会说自己的感受', desc: '难受、生气、害怕时说不出感受词。', signs: ['只哭不说', '说不出来', '用行为表达'], tags: ['情绪表达', '自我觉察'] },
      { key: 'cooperation_hard', title: '合作游戏配合难', desc: '需要分工或一起完成时容易乱。', signs: ['只按自己想法', '不听同伴', '合作很快散'], tags: ['合作能力', '规则理解'] },
      { key: 'family_talk_short', title: '亲子聊天很短', desc: '家里聊天经常问一句答一句。', signs: ['只说嗯', '不展开', '很快结束'], tags: ['亲子沟通', '表达兴趣'] },
      { key: 'new_person_shy', title: '见新朋友很慢热', desc: '面对陌生同伴或老师时不敢说话。', signs: ['躲起来', '不看对方', '要大人代说'], tags: ['社交安全感', '表达信心'] }
    ]
  }
];

function inferAgeFirstCategoryKey(painPoint) {
  var text = JSON.stringify(painPoint || {});
  if (/大运动|运动|体|协调|跳|跑|核心|耐力|爆发|体态|前庭|本体|精细动作/.test(text)) {
    return 'motor_fitness';
  }
  if (/社交|表达|语言|同伴|集体|模仿|开口|说/.test(text)) {
    return 'social_expression';
  }
  if (/情绪|规则|安全感|适应|等待|轮流|冲动|挫折|分离|边界/.test(text)) {
    return 'emotion_rules';
  }
  return 'attention_learning';
}

function buildGeneratedAgePainPoint(segment, category, template, index) {
  var label = segment.label || '';
  return {
    key: [segment.key, category.key, template.key].join('_'),
    categoryKey: category.key,
    categoryLabel: category.label,
    title: template.title,
    description: label + '常见情况：' + template.desc,
    observableSigns: clone(template.signs || category.observableSigns),
    abilityTags: clone((template.tags || []).concat(category.abilityTags)).slice(0, 4),
    sceneKey: [category.sceneKeyPrefix, segment.key, template.key].join('_'),
    symptoms: [],
    priority: index + 1,
    defaultBottleneck: {
      title: '先看' + category.label + '里的最小卡点',
      text: label + '出现“' + template.title + '”时，先把要求缩小到一个可完成动作，再观察孩子能不能进入状态。'
    },
    defaultAction: {
      title: '今晚先做一个 3 分钟小练习',
      steps: ['只选一个最小动作开始。', '控制在 3 分钟以内。', '结束后记录孩子最明显的一个反应。']
    }
  };
}

function buildAgeFirstSegmentCatalog(segments) {
  return (segments || []).map(function(segment) {
    var legacyPainPoints = (segment.painPoints || []).map(function(painPoint, index) {
      var categoryKey = painPoint.categoryKey || inferAgeFirstCategoryKey(painPoint);
      var category = AGE_FIRST_CATEGORY_DEFINITIONS.find(function(item) { return item.key === categoryKey; }) || AGE_FIRST_CATEGORY_DEFINITIONS[0];
      return Object.assign({}, painPoint, {
        categoryKey: category.key,
        categoryLabel: category.label,
        priority: index + 1
      });
    });
    var categories = AGE_FIRST_CATEGORY_DEFINITIONS.map(function(category) {
      var existing = legacyPainPoints.filter(function(painPoint) {
        return painPoint.categoryKey === category.key;
      });
      var existingKeys = existing.reduce(function(map, painPoint) {
        map[painPoint.key] = true;
        return map;
      }, {});
      var generated = category.templates.map(function(template, index) {
        return buildGeneratedAgePainPoint(segment, category, template, index);
      }).filter(function(painPoint) {
        return !existingKeys[painPoint.key];
      });
      var painPoints = existing.concat(generated).slice(0, 10).map(function(painPoint, index) {
        return Object.assign({}, painPoint, {
          categoryKey: category.key,
          categoryLabel: category.label,
          priority: index + 1
        });
      });
      return {
        key: category.key,
        label: category.label,
        description: category.description,
        painPoints: painPoints
      };
    });
    var flattened = [];
    categories.forEach(function(category) {
      flattened = flattened.concat(category.painPoints || []);
    });
    var featuredKeys = legacyPainPoints.slice(0, 5).map(function(painPoint) {
      return painPoint.key;
    });
    return Object.assign({}, segment, {
      painCategories: categories,
      painPoints: flattened,
      featuredPainPointKeys: featuredKeys
    });
  });
}

AGE_FIRST_SEGMENTS = ageFirstCatalog.buildAgeFirstSegmentCatalog(AGE_FIRST_SEGMENTS);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getCoreActionAgeGroups() {
  return clone(CORE_ACTION_AGE_GROUPS);
}

function getCoreActionScenes() {
  return clone(CORE_ACTION_SCENES);
}

function getCoreActionScene(sceneKey) {
  var key = String(sceneKey || '').trim();
  var scene = CORE_ACTION_SCENES.find(function(item) {
    return item.key === key;
  });
  return scene ? clone(scene) : null;
}

function getAgeFirstSegments() {
  return clone(AGE_FIRST_SEGMENTS);
}

function getAgeFirstSegmentByKey(segmentKey) {
  var segment = findAgeFirstSegment(segmentKey);
  return segment ? clone(segment) : null;
}

function getPainPointsByAgeSegment(segmentKey) {
  var segment = findAgeFirstSegment(segmentKey);
  return segment ? clone(segment.painPoints || []) : [];
}

function findAgeFirstSegment(segmentKey) {
  var key = String(segmentKey || '').trim();
  if (!key) {
    return null;
  }
  return AGE_FIRST_SEGMENTS.find(function(item) {
    return item.key === key || item.label === key;
  }) || null;
}

function findAgeFirstPainPoint(segment, painPointKey) {
  var key = String(painPointKey || '').trim();
  if (!segment || !key) {
    return null;
  }
  return (segment.painPoints || []).find(function(item) {
    return item.key === key || item.title === key || item.sceneKey === key;
  }) || null;
}

function findScene(sceneKey) {
  var key = String(sceneKey || '').trim();
  return CORE_ACTION_SCENES.find(function(item) {
    return item.key === key;
  }) || CORE_ACTION_SCENES[0];
}

function findSymptom(scene, symptomKey) {
  var key = String(symptomKey || '').trim();
  return (scene.symptoms || []).find(function(item) {
    return item.key === key;
  }) || null;
}

function normalizeAgeGroup(ageGroup) {
  var text = String(ageGroup || '').trim();
  if (!text) {
    return '';
  }
  var matched = CORE_ACTION_AGE_GROUPS.find(function(item) {
    return item.key === text || item.label === text;
  });
  return matched ? matched.label : text;
}

function buildLocalResultId(sceneKey, symptomKey, createdAt) {
  return [
    'core_action',
    sceneKey || 'scene',
    symptomKey || 'default',
    createdAt || Date.now()
  ].join('_');
}

function buildFirstActionResult(options) {
  options = options || {};
  var requestedSceneKey = String(options.sceneKey || '').trim();
  var requestedSymptomKey = String(options.symptomKey || '').trim();
  var scene = findScene(requestedSceneKey);
  var symptom = findSymptom(scene, requestedSymptomKey);
  var ageGroup = normalizeAgeGroup(options.ageGroup);
  var createdAt = Number(options.createdAt) || Date.now();
  var fallbackReason = '';

  if (!requestedSceneKey) {
    fallbackReason = 'missing_scene';
  } else if (requestedSceneKey !== scene.key) {
    fallbackReason = 'unknown_scene';
  } else if (!ageGroup) {
    fallbackReason = 'missing_age_group';
  } else if (requestedSymptomKey && !symptom) {
    fallbackReason = 'unknown_symptom';
  } else if (!requestedSymptomKey) {
    fallbackReason = 'missing_symptom';
  }

  var bottleneckTitle = symptom ? symptom.bottleneckTitle : scene.defaultBottleneck.title;
  var bottleneckText = symptom ? symptom.bottleneckText : scene.defaultBottleneck.text;
  var actionTitle = symptom ? symptom.actionTitle : scene.defaultAction.title;
  var actionSteps = symptom ? symptom.actionSteps : scene.defaultAction.steps;
  var resultSymptomKey = symptom ? symptom.key : '';

  return {
    id: String(options.id || buildLocalResultId(scene.key, resultSymptomKey, createdAt)),
    childId: options.childId || options.child_id || 0,
    ageGroup: ageGroup || '待确认年龄',
    sceneKey: scene.key,
    sceneLabel: scene.label,
    symptomKey: resultSymptomKey,
    symptomLabel: symptom ? symptom.label : '先用默认判断',
    bottleneckTitle: bottleneckTitle,
    bottleneckText: bottleneckText,
    actionTitle: actionTitle,
    actionSteps: clone(actionSteps || []),
    nextActions: clone((symptom && symptom.nextActions) || {}),
    sourceType: 'scene_recommendation',
    fallbackReason: fallbackReason,
    createdAt: createdAt,
    saved: !!options.saved,
    completed: !!options.completed
  };
}

function buildAgeFirstActionResult(options) {
  options = options || {};
  var requestedSegmentKey = String(options.ageSegmentKey || options.age_segment_key || options.ageGroup || '').trim();
  var requestedPainPointKey = String(options.painPointKey || options.pain_point_key || options.sceneKey || '').trim();
  var segment = findAgeFirstSegment(requestedSegmentKey) || AGE_FIRST_SEGMENTS[0];
  var painPoint = findAgeFirstPainPoint(segment, requestedPainPointKey);
  var createdAt = Number(options.createdAt) || Date.now();
  var fallbackReason = '';

  if (!requestedSegmentKey) {
    fallbackReason = 'missing_age_segment';
  } else if (requestedSegmentKey !== segment.key && requestedSegmentKey !== segment.label) {
    fallbackReason = 'unknown_age_segment';
  } else if (!requestedPainPointKey) {
    fallbackReason = 'missing_pain_point';
  } else if (!painPoint) {
    fallbackReason = 'unknown_pain_point';
  }

  if (!painPoint) {
    painPoint = (segment.painPoints && segment.painPoints[0]) || null;
  }

  var bottleneck = (painPoint && painPoint.defaultBottleneck) || {
    title: segment.title,
    text: segment.parentSummary
  };
  var action = (painPoint && painPoint.defaultAction) || {
    title: '今晚先做一个最小行动',
    steps: ['先选择一个最像孩子现状的问题。', '只做一个 3 分钟以内的小动作。', '明天再记录孩子反应。']
  };
  var painPointKey = painPoint ? painPoint.key : '';
  var sceneKey = painPoint ? painPoint.sceneKey : 'age_first_default';

  return {
    id: String(options.id || buildLocalResultId(sceneKey, painPointKey, createdAt)),
    childId: options.childId || options.child_id || 0,
    ageGroup: segment.label,
    ageSegmentKey: segment.key,
    ageSegmentLabel: segment.label,
    ageSegmentTitle: segment.title,
    focusAreas: clone(segment.focusAreas || []),
    parentSummary: segment.parentSummary || '',
    sceneKey: sceneKey,
    sceneLabel: painPoint ? painPoint.title : segment.title,
    painPointKey: painPointKey,
    painPointTitle: painPoint ? painPoint.title : '',
    painPointDescription: painPoint ? painPoint.description : '',
    categoryKey: painPoint ? painPoint.categoryKey || '' : '',
    categoryLabel: painPoint ? painPoint.categoryLabel || '' : '',
    observableSigns: clone((painPoint && painPoint.observableSigns) || []),
    abilityTags: clone((painPoint && painPoint.abilityTags) || []),
    symptomKey: '',
    symptomLabel: painPoint ? painPoint.title : '先用年龄段默认判断',
    bottleneckTitle: bottleneck.title,
    bottleneckText: bottleneck.text,
    actionTitle: action.title,
    actionSteps: clone(action.steps || []),
    nextActions: clone((painPoint && painPoint.nextActions) || {}),
    sourceType: 'age_first_scene_recommendation',
    fallbackReason: fallbackReason,
    createdAt: createdAt,
    saved: !!options.saved,
    completed: !!options.completed
  };
}

module.exports = {
  CORE_ACTION_AGE_GROUPS: CORE_ACTION_AGE_GROUPS,
  AGE_FIRST_SEGMENTS: AGE_FIRST_SEGMENTS,
  CORE_ACTION_SCENES: CORE_ACTION_SCENES,
  buildAgeFirstActionResult: buildAgeFirstActionResult,
  buildFirstActionResult: buildFirstActionResult,
  getAgeFirstSegments: getAgeFirstSegments,
  getAgeFirstSegmentByKey: getAgeFirstSegmentByKey,
  getCoreActionAgeGroups: getCoreActionAgeGroups,
  getCoreActionScenes: getCoreActionScenes,
  getCoreActionScene: getCoreActionScene,
  getPainPointsByAgeSegment: getPainPointsByAgeSegment
};
