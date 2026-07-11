var CORE_ACTION_AGE_GROUPS = [
  { key: '3-4', label: '3-4岁' },
  { key: '4-5', label: '4-5岁' },
  { key: '5-6', label: '5-6岁' },
  { key: '6-plus', label: '6岁以上' }
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

module.exports = {
  CORE_ACTION_AGE_GROUPS: CORE_ACTION_AGE_GROUPS,
  CORE_ACTION_SCENES: CORE_ACTION_SCENES,
  buildFirstActionResult: buildFirstActionResult,
  getCoreActionAgeGroups: getCoreActionAgeGroups,
  getCoreActionScenes: getCoreActionScenes,
  getCoreActionScene: getCoreActionScene
};
