var DEVELOPMENT_AGE_GROUPS = ['3-4岁', '4-5岁', '5-6岁'];

var DEVELOPMENT_ZONES = [
  {
    code: 'language',
    title: '语言发育',
    subtitle: '从会说，到说清楚、说完整',
    actionText: '今晚练一句完整表达',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#FF6B35', tint: '#FFF3EC' },
    scenarios: [
      {
        code: 'unclear_speech',
        title: '说得急，说不清',
        symptomText: '孩子一着急就含糊，家长要猜半天。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先听孩子是单个音不清，还是整句话太快。',
        todayAction: '选一个常用句，慢慢说三遍，再让孩子跟一遍。',
        durationMinutes: 5,
        parentScript: '妈妈先慢慢说一遍，你跟着说，不急。',
        observeSignal: '看孩子能不能把句子放慢并说完。',
        chatQuestion: '孩子说话着急就说不清，在家怎么练？'
      },
      {
        code: 'story_retell',
        title: '听完故事讲不出来',
        symptomText: '读完绘本后，孩子只说不知道。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先看孩子是不记得内容，还是不知道怎么开口。',
        todayAction: '让孩子只说一页里“谁在做什么”。',
        durationMinutes: 8,
        parentScript: '这一页有谁？他在做什么？说一句就行。',
        observeSignal: '看孩子能不能说出人物和动作。',
        chatQuestion: '孩子听完故事不会复述，怎么从一句话开始练？'
      },
      {
        code: 'request_words',
        title: '想要东西只拉大人',
        symptomText: '孩子想拿玩具或零食时，常拉着家长过去。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先看孩子会不会用一个词说出想要什么。',
        todayAction: '把喜欢的东西放近一点，先等 5 秒，再提示孩子说“我要”。',
        durationMinutes: 5,
        parentScript: '你想要这个，可以说：我要小车。',
        observeSignal: '看孩子能否从拉大人变成说一个词或一句话。',
        chatQuestion: '孩子想要东西只拉大人，怎么引导他说出来？'
      },
      {
        code: 'short_sentences',
        title: '句子短，只说几个词',
        symptomText: '孩子能说词语，但说完整句子比较少。',
        ageGroups: ['3-4岁', '4-5岁', '5-6岁'],
        parentCheck: '先把孩子说的词接成一句短句。',
        todayAction: '孩子说“车”，家长补成“红色的车在跑”，再让孩子跟一句。',
        durationMinutes: 6,
        parentScript: '你说车，我帮你变长一点：红色的车在跑。',
        observeSignal: '看孩子能否在原来的词后多加一个信息。',
        chatQuestion: '孩子句子短，只说几个词，怎么慢慢说完整？'
      },
      {
        code: 'answer_questions',
        title: '回答问题只点头摇头',
        symptomText: '家长问问题时，孩子常用动作回答。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先把问题改成二选一，降低开口难度。',
        todayAction: '问“你要苹果还是香蕉”，等 5 秒后提示孩子说一个词。',
        durationMinutes: 5,
        parentScript: '你可以说苹果，也可以说香蕉。',
        observeSignal: '看孩子能否从动作回应变成说出一个选择。',
        chatQuestion: '孩子回答问题只点头摇头，怎么引导他说出来？'
      },
      {
        code: 'tell_daily_event',
        title: '说不清白天发生了什么',
        symptomText: '放学后问今天做了什么，孩子说不清。',
        ageGroups: ['3-4岁', '4-5岁', '5-6岁'],
        parentCheck: '先从一个固定问题开始，不追问太多细节。',
        todayAction: '只问“今天和谁玩了”，孩子回答后家长补一句完整话。',
        durationMinutes: 6,
        parentScript: '你和乐乐玩了。我们把这句话说完整。',
        observeSignal: '看孩子能否说出一个人物和一件事。',
        chatQuestion: '孩子说不清白天发生了什么，回家怎么聊？'
      }
    ],
    todayPractice: {
      title: '看图讲一句话',
      durationMinutes: 5,
      action: '拿一本绘本，让孩子挑一页，说出“谁在做什么”。'
    },
    sevenDayPlan: ['看图说一句', '补一个形容词', '说先后顺序', '讲最喜欢的一页', '复述一个小片段', '说自己的想法', '完整讲一页']
  },
  {
    code: 'sensory',
    title: '感统支持',
    subtitle: '坐不住、怕吵、跑跳不稳，先从身体小游戏开始',
    actionText: '今天做一个身体小游戏',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#3E9B8A', tint: '#EAF7F4' },
    scenarios: [
      {
        code: 'always_moving',
        title: '坐一会儿就动来动去',
        symptomText: '孩子坐不稳，总想摸东西、站起来或转来转去。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先看孩子是事情太难，还是身体还没准备好安静下来。',
        todayAction: '做 3 分钟推墙，再回到桌前坐 5 分钟。',
        durationMinutes: 8,
        parentScript: '先把身体的劲用掉一点，再回来做事。',
        observeSignal: '看孩子回到桌前后能否多坐 2-3 分钟。',
        chatQuestion: '孩子总坐不住，在家可以做哪些身体小游戏？'
      },
      {
        code: 'noise_sensitive',
        title: '怕吵，容易捂耳朵',
        symptomText: '听到吹风机、商场声音或小朋友喊叫就紧张。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先记录哪些声音会触发孩子紧张。',
        todayAction: '用很小音量播放同类声音 30 秒，再做深呼吸。',
        durationMinutes: 5,
        parentScript: '声音小小的，我们听一下，不舒服就停。',
        observeSignal: '看孩子能否接受更短、更轻的声音接触。',
        chatQuestion: '孩子怕吵捂耳朵，家里怎么做声音适应？'
      },
      {
        code: 'group_sitting',
        title: '集体活动坐不住',
        symptomText: '听故事或排队时，孩子很快想站起来动一动。',
        ageGroups: ['3-4岁', '4-5岁', '5-6岁'],
        parentCheck: '先给身体一个短动作，再进入安静活动。',
        todayAction: '活动前做 10 下抱枕搬运，再坐下听 3 分钟故事。',
        durationMinutes: 6,
        parentScript: '先搬抱枕，把身体准备好，再坐下来听。',
        observeSignal: '看孩子能否多坐一小段时间。',
        chatQuestion: '孩子集体活动坐不住，在家怎么提前练？'
      },
      {
        code: 'hair_wash_nails',
        title: '洗头剪指甲很抗拒',
        symptomText: '洗头、剪指甲或擦脸时，孩子躲开或哭闹。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先找出孩子最不舒服的是水声、触碰还是等待。',
        todayAction: '只练碰一下手指 3 秒，结束后马上停。',
        durationMinutes: 3,
        parentScript: '今天只碰一下，数到三就停。',
        observeSignal: '看孩子能否接受更短、更可预期的触碰。',
        chatQuestion: '孩子洗头剪指甲很抗拒，家里怎么一步步适应？'
      },
      {
        code: 'clumsy_bumping',
        title: '走路容易碰到东西',
        symptomText: '孩子走动时常碰到桌角、椅子或门框。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先把路线变简单，让孩子练看路和停下。',
        todayAction: '用两个抱枕摆一条小路，慢慢走 3 趟。',
        durationMinutes: 6,
        parentScript: '眼睛看前面，走到抱枕前先停一下。',
        observeSignal: '看孩子能否在转弯前停住身体。',
        chatQuestion: '孩子走路容易碰到东西，家里怎么练身体控制？'
      },
      {
        code: 'messy_body_force',
        title: '动作力度不好拿捏',
        symptomText: '抱人、推门或拿东西时，孩子常用力太大。',
        ageGroups: ['3-4岁', '4-5岁', '5-6岁'],
        parentCheck: '先让孩子感受轻轻和用力的差别。',
        todayAction: '用纸杯练“轻轻拿、慢慢放”10 次。',
        durationMinutes: 5,
        parentScript: '这次用轻轻的手，杯子不倒就完成。',
        observeSignal: '看孩子能否把动作放轻一点。',
        chatQuestion: '孩子动作力度不好拿捏，怎么在家练轻重？'
      }
    ],
    todayPractice: {
      title: '推墙找身体力量',
      durationMinutes: 3,
      action: '双手推墙 10 下，休息一下，再推 10 下。'
    },
    sevenDayPlan: ['推墙', '抱枕搬运', '地垫爬行', '单脚站', '绕物走', '轻声适应', '亲子拉力']
  },
  {
    code: 'focus',
    title: '专注力',
    subtitle: '听得进、坐得住、做得完',
    actionText: '今天练 5 分钟完成一件事',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#4A6FE3', tint: '#EEF2FF' },
    scenarios: [
      {
        code: 'task_start',
        title: '喊很多遍才开始',
        symptomText: '家长提醒很多次，孩子还是拖着不动。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先把任务拆到孩子一眼知道第一步。',
        todayAction: '只给一个动作指令，比如“先拿铅笔”。',
        durationMinutes: 5,
        parentScript: '现在只做第一步，拿铅笔就算开始。',
        observeSignal: '看孩子从听到指令到行动要多久。',
        chatQuestion: '孩子做事总启动慢，怎么让他先开始？'
      },
      {
        code: 'easy_distracted',
        title: '做一会儿就走神',
        symptomText: '玩具、声音、桌面小东西都能把孩子带跑。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先清掉桌面干扰，只留当前要用的东西。',
        todayAction: '设一个 5 分钟小任务，完成后马上结束。',
        durationMinutes: 5,
        parentScript: '这 5 分钟只做这一件，时间到就停。',
        observeSignal: '看孩子能否在短时间里少离开任务。',
        chatQuestion: '孩子很容易走神，家庭练习怎么设计？'
      },
      {
        code: 'two_step_instruction',
        title: '两步指令听不全',
        symptomText: '家长说两件事，孩子常只做第一件。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先确认孩子能听懂每一步，再把两步合在一起。',
        todayAction: '只练“拿杯子，再放桌上”这一个两步指令，重复 3 次。',
        durationMinutes: 5,
        parentScript: '先拿杯子，再放到桌上。我们一起做一遍。',
        observeSignal: '看孩子能否按顺序完成两步。',
        chatQuestion: '孩子两步指令听不全，怎么在家练？'
      },
      {
        code: 'switch_toys_fast',
        title: '玩一会儿就换玩具',
        symptomText: '每个玩具只玩一下，很快又想换新的。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先把可选玩具减少到两个。',
        todayAction: '选一个玩具玩 3 分钟，时间到再换。',
        durationMinutes: 5,
        parentScript: '这 3 分钟先玩小车，铃声响了再换。',
        observeSignal: '看孩子能否在一个玩具上多停留一点。',
        chatQuestion: '孩子玩一会儿就换玩具，怎么延长专注时间？'
      },
      {
        code: 'skip_last_step',
        title: '做到最后一步就放弃',
        symptomText: '拼图、画画快完成时，孩子突然不想继续。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先把最后一步变得非常明确。',
        todayAction: '只留最后 1 块拼图，让孩子放上去后马上结束。',
        durationMinutes: 5,
        parentScript: '只差最后一块，放上去就完成。',
        observeSignal: '看孩子能否完成一个清楚的收尾动作。',
        chatQuestion: '孩子做到最后一步就放弃，怎么练做完？'
      },
      {
        code: 'needs_repeated_reminders',
        title: '做事总要反复提醒',
        symptomText: '同一件小事，家长提醒好几遍才继续。',
        ageGroups: ['5-6岁'],
        parentCheck: '先把提醒换成可见的小标记。',
        todayAction: '画一个“完成打勾”小框，做完一步就打一个勾。',
        durationMinutes: 6,
        parentScript: '看这个小框，做完一步就打勾。',
        observeSignal: '看孩子能否少听一次口头提醒。',
        chatQuestion: '孩子做事总要反复提醒，怎么用小标记帮他完成？'
      }
    ],
    todayPractice: {
      title: '5 分钟只做一件事',
      durationMinutes: 5,
      action: '选一个小任务，清空桌面，计时 5 分钟。'
    },
    sevenDayPlan: ['拿到第一步', '5分钟任务', '清桌面', '听两步指令', '完成后打勾', '减少一次提醒', '复盘做到了什么']
  },
  {
    code: 'gross_motor',
    title: '大运动练习',
    subtitle: '跑跳爬投，练协调和力量',
    actionText: '今天练一个跑跳动作',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#F59E0B', tint: '#FFF7E6' },
    scenarios: [
      {
        code: 'balance_weak',
        title: '跑跳容易摔',
        symptomText: '跑起来不稳，跳跃落地容易歪。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先看孩子是走稳比较难，还是腿部用力还不够。',
        todayAction: '沿地砖线走 3 趟，再双脚跳 10 下。',
        durationMinutes: 8,
        parentScript: '脚踩在线上，慢慢走，走稳比走快重要。',
        observeSignal: '看孩子能否减少踩线外和落地晃动。',
        chatQuestion: '孩子跑跳不稳，大运动在家怎么练？'
      },
      {
        code: 'throw_catch',
        title: '接球投球不协调',
        symptomText: '球来了接不住，投出去方向也不稳。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先用大球慢速练，不急着换小球。',
        todayAction: '距离 1 米互相滚球 10 次，再轻抛 5 次。',
        durationMinutes: 8,
        parentScript: '眼睛看球，手像小篮子一样接住。',
        observeSignal: '看孩子能否提前看球并伸手准备。',
        chatQuestion: '孩子接球投球不协调，怎么循序渐进练？'
      },
      {
        code: 'stairs_unsteady',
        title: '上下楼梯不太稳',
        symptomText: '上下台阶时，孩子常抓很紧或一步一停。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先看孩子是怕高，还是脚步交替比较难。',
        todayAction: '找一个低台阶，扶栏上下 5 次，慢慢做。',
        durationMinutes: 6,
        parentScript: '脚踩稳，再换另一只脚，不急。',
        observeSignal: '看孩子能否少停顿一次完成上下台阶。',
        chatQuestion: '孩子上下楼梯不太稳，在家怎么安全练？'
      },
      {
        code: 'jump_off_ground',
        title: '跳起来很小心',
        symptomText: '孩子想跳，但脚离地少，落地时很紧张。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先从原地小跳开始，确认地面安全。',
        todayAction: '在地垫上做 8 次小兔跳，每次落地站稳。',
        durationMinutes: 6,
        parentScript: '轻轻跳，脚落地以后先站稳。',
        observeSignal: '看孩子能否双脚同时离地并站稳。',
        chatQuestion: '孩子跳起来很小心，怎么从小跳开始练？'
      },
      {
        code: 'single_foot_balance',
        title: '单脚站站不久',
        symptomText: '穿裤子、跨东西时，孩子一只脚站不稳。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先允许孩子扶墙，练站稳的感觉。',
        todayAction: '扶墙单脚站 5 秒，左右脚各做 3 次。',
        durationMinutes: 5,
        parentScript: '手扶墙，脚站稳，我们数到五。',
        observeSignal: '看孩子能否少晃动一点站满 5 秒。',
        chatQuestion: '孩子单脚站站不久，怎么安全练平衡？'
      },
      {
        code: 'crawl_tunnel',
        title: '钻爬动作不熟练',
        symptomText: '钻桌子、爬垫子时，孩子动作慢或容易卡住。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先把通道变宽，让孩子有空间完成动作。',
        todayAction: '用两把椅子搭宽通道，钻爬 3 趟。',
        durationMinutes: 6,
        parentScript: '慢慢爬，先让手过去，再让脚过去。',
        observeSignal: '看孩子能否更顺地完成一次钻爬。',
        chatQuestion: '孩子钻爬动作不熟练，在家怎么练？'
      }
    ],
    todayPractice: {
      title: '沿线走和双脚跳',
      durationMinutes: 8,
      action: '沿一条线慢走 3 趟，再双脚原地跳 10 下。'
    },
    sevenDayPlan: ['沿线走', '双脚跳', '钻爬', '滚接球', '单脚站', '跨小物', '亲子接力']
  },
  {
    code: 'emotion',
    title: '情绪管理',
    subtitle: '哭闹、发脾气、一输就难过，有步骤地回应',
    actionText: '今天练一次说出情绪',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#E85D75', tint: '#FFF0F3' },
    scenarios: [
      {
        code: 'tantrum',
        title: '一不顺心就爆发',
        symptomText: '孩子哭喊、跺脚，越讲道理越激动。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先确认孩子是累了、饿了，还是需求被打断。',
        todayAction: '先说出情绪，再给两个可选动作。',
        durationMinutes: 5,
        parentScript: '你很生气，想继续玩。现在可以抱一下，或者坐一会儿。',
        observeSignal: '看孩子从哭闹到能选择需要多久。',
        chatQuestion: '孩子一不顺心就发脾气，家长当下怎么接？'
      },
      {
        code: 'lose_game',
        title: '输了就哭或生气',
        symptomText: '游戏一输就哭或生气，很难继续玩。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先把输赢做得很轻，练习从小小不顺利里恢复。',
        todayAction: '玩一局很短的游戏，结束后说“输了也能再来”。',
        durationMinutes: 6,
        parentScript: '这次输了，身体有点难受，我们休息一下再来。',
        observeSignal: '看孩子能否从拒绝继续变成愿意再试一次。',
        chatQuestion: '孩子一输就哭，怎么练情绪恢复？'
      },
      {
        code: 'after_no',
        title: '被拒绝后很难缓过来',
        symptomText: '家长说现在不可以，孩子会哭很久。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先接住情绪，再给一个可以做的替代选择。',
        todayAction: '练一次“现在不行，等饭后可以选一个”的替代说法。',
        durationMinutes: 5,
        parentScript: '你很想要，现在不行。饭后可以选贴纸或积木。',
        observeSignal: '看孩子能否从哭闹转向看两个选择。',
        chatQuestion: '孩子被拒绝后哭很久，家长怎么回应？'
      },
      {
        code: 'transition_home',
        title: '从外面回家难收场',
        symptomText: '玩得正开心时要离开，孩子很难接受。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先提前给结束提示，让孩子知道还剩几步。',
        todayAction: '离开前做 2 次提醒：再玩 5 分钟、再滑 1 次就走。',
        durationMinutes: 5,
        parentScript: '再滑一次，我们和滑梯说再见，然后回家。',
        observeSignal: '看孩子能否在提醒后减少拉扯。',
        chatQuestion: '孩子从外面回家难收场，怎么提前过渡？'
      },
      {
        code: 'waiting_impatient',
        title: '等一会儿就很急',
        symptomText: '排队、等饭或等家长说完时，孩子很快着急。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先把等待时间缩短到孩子能做到的长度。',
        todayAction: '练 30 秒等待，手里拿一个小任务，比如找 3 个红色物品。',
        durationMinutes: 4,
        parentScript: '我们等 30 秒，一起找三个红色的东西。',
        observeSignal: '看孩子能否带着小任务等完 30 秒。',
        chatQuestion: '孩子等一会儿就很急，怎么练等待？'
      },
      {
        code: 'after_mistake',
        title: '做错了就不想继续',
        symptomText: '画错、搭倒或说错后，孩子马上说不玩了。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先帮孩子把做错和重新来分开。',
        todayAction: '故意画一条歪线，再示范“我改一下”。',
        durationMinutes: 5,
        parentScript: '画歪了可以改一下，不用全部重来。',
        observeSignal: '看孩子能否尝试一次修正。',
        chatQuestion: '孩子做错了就不想继续，怎么练重新尝试？'
      }
    ],
    todayPractice: {
      title: '给情绪起名字',
      durationMinutes: 3,
      action: '孩子有情绪时，先帮他说出“生气、失望、着急”。'
    },
    sevenDayPlan: ['说情绪名', '选安抚动作', '等30秒', '输赢小游戏', '画情绪脸', '说一句修复关系', '复盘一次情绪']
  },
  {
    code: 'social',
    title: '社交能力',
    subtitle: '会表达、会轮流、会加入游戏',
    actionText: '今天练一句加入游戏的话',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#8B5CF6', tint: '#F3EEFF' },
    scenarios: [
      {
        code: 'join_play',
        title: '想玩但不会加入',
        symptomText: '孩子站在旁边看，不知道怎么开口。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先给孩子准备一句低压力开场白。',
        todayAction: '在家演练“我可以一起玩吗”。',
        durationMinutes: 5,
        parentScript: '你可以先问一句：我可以一起玩吗？',
        observeSignal: '看孩子能否在演练中主动说出这句话。',
        chatQuestion: '孩子想和小朋友玩但不会加入，怎么教他开口？'
      },
      {
        code: 'taking_turns',
        title: '轮流等待很难',
        symptomText: '想要马上轮到自己，等一会儿就急。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先把等待时间缩短到孩子能承受的长度。',
        todayAction: '用积木轮流搭，每人只搭一块。',
        durationMinutes: 6,
        parentScript: '现在轮到妈妈，下一块就轮到你。',
        observeSignal: '看孩子能否等待一个短轮次。',
        chatQuestion: '孩子不会轮流等待，家里怎么练轮到你、轮到我？'
      },
      {
        code: 'toy_taken',
        title: '玩具被拿走不会说',
        symptomText: '玩具被拿走时，孩子只哭或直接抢回来。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先教一句短句，让孩子有话可说。',
        todayAction: '在家演练“这是我的，我还没玩完”。',
        durationMinutes: 5,
        parentScript: '你可以说：这是我的，我还没玩完。',
        observeSignal: '看孩子能否先说一句再行动。',
        chatQuestion: '孩子玩具被拿走不会说，怎么教他表达？'
      },
      {
        code: 'repair_conflict',
        title: '小冲突后不会修复',
        symptomText: '和小朋友闹别扭后，孩子不知道怎么继续玩。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先帮孩子分清道歉、解释和邀请继续玩。',
        todayAction: '练一句“刚才我着急了，我们还能一起玩吗”。',
        durationMinutes: 6,
        parentScript: '你可以说：刚才我着急了，我们还能一起玩吗？',
        observeSignal: '看孩子能否说出一句修复关系的话。',
        chatQuestion: '孩子和小朋友有小冲突后，怎么练修复关系？'
      },
      {
        code: 'refuse_politely',
        title: '不想玩时只躲开',
        symptomText: '不想加入游戏时，孩子躲开或推开别人。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先教孩子用一句话表达不想玩。',
        todayAction: '练“我现在想自己玩一会儿”这句话 3 次。',
        durationMinutes: 4,
        parentScript: '你可以说：我现在想自己玩一会儿。',
        observeSignal: '看孩子能否用话表达拒绝。',
        chatQuestion: '孩子不想玩时只躲开，怎么教他好好表达？'
      },
      {
        code: 'share_attention',
        title: '只顾自己说不看别人',
        symptomText: '聊天或游戏时，孩子只说自己的，不太回应别人。',
        ageGroups: ['5-6岁'],
        parentCheck: '先练一次看对方和回应一句。',
        todayAction: '亲子聊天 3 轮，每轮先看对方，再说“我听到了”。',
        durationMinutes: 5,
        parentScript: '先看着我，听完说一句我听到了。',
        observeSignal: '看孩子能否完成一轮看、听、回应。',
        chatQuestion: '孩子聊天只顾自己说，怎么练回应别人？'
      }
    ],
    todayPractice: {
      title: '练一句加入游戏的话',
      durationMinutes: 5,
      action: '家长扮演小朋友，让孩子练“我可以一起玩吗”。'
    },
    sevenDayPlan: ['开口加入', '轮流搭积木', '说我想要', '说不喜欢', '交换玩具', '处理被拒绝', '复盘一次同伴互动']
  },
  {
    code: 'confidence',
    title: '自信与适应',
    subtitle: '怕生、不敢试，慢慢建立安全感',
    actionText: '今天练一个小尝试',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#10B981', tint: '#ECFDF5' },
    scenarios: [
      {
        code: 'shy_greeting',
        title: '见人不敢打招呼',
        symptomText: '遇到熟人也躲在家长身后。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先允许孩子用点头、挥手代替开口。',
        todayAction: '出门前约定一个最低难度的打招呼动作。',
        durationMinutes: 3,
        parentScript: '今天你可以挥挥手，不一定要说话。',
        observeSignal: '看孩子能否完成一个低压力回应。',
        chatQuestion: '孩子怕生不敢打招呼，怎么慢慢练自信？'
      },
      {
        code: 'try_new',
        title: '新活动不敢尝试',
        symptomText: '看到新游戏、新环境，孩子先拒绝。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先把新活动拆成看一看、摸一摸、试一下。',
        todayAction: '只要求孩子靠近看 30 秒。',
        durationMinutes: 3,
        parentScript: '今天只看一看，不用马上玩。',
        observeSignal: '看孩子是否愿意从远处观察变成靠近一点。',
        chatQuestion: '孩子不敢尝试新活动，怎么一步步适应？'
      },
      {
        code: 'show_and_tell',
        title: '展示自己会紧张',
        symptomText: '需要唱歌、发言或展示作品时，孩子想躲开。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先把展示对象缩小到一个熟悉的人。',
        todayAction: '让孩子只给家长展示 30 秒作品，再说一句“我做完了”。',
        durationMinutes: 5,
        parentScript: '先给妈妈看 30 秒，说一句我做完了就可以。',
        observeSignal: '看孩子能否完成一个很小的展示。',
        chatQuestion: '孩子展示自己会紧张，怎么慢慢建立信心？'
      },
      {
        code: 'cling_new_place',
        title: '到新地方黏着家长',
        symptomText: '进新教室或新场地时，孩子一直抓着家长。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先给孩子一个固定的观察位置。',
        todayAction: '到新地方先站在门口看 1 分钟，再往里走 3 步。',
        durationMinutes: 4,
        parentScript: '我们先在这里看一会儿，再一起往前走三步。',
        observeSignal: '看孩子能否从抓紧家长变成愿意往前走一点。',
        chatQuestion: '孩子到新地方黏着家长，怎么帮他适应？'
      },
      {
        code: 'avoid_small_challenge',
        title: '遇到小挑战先说不会',
        symptomText: '穿衣、拼图或搭积木稍微难一点，孩子就说不会。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先把挑战缩小到孩子能完成的一步。',
        todayAction: '只让孩子完成最后一步，比如扣最后一个扣子。',
        durationMinutes: 5,
        parentScript: '我们只做最后一步，做完就算成功。',
        observeSignal: '看孩子能否从说不会变成试一下。',
        chatQuestion: '孩子遇到小挑战先说不会，怎么帮他开始？'
      },
      {
        code: 'separate_briefly',
        title: '短暂分开也紧张',
        symptomText: '家长离开视线一小会儿，孩子就找人。',
        ageGroups: ['3-4岁', '4-5岁'],
        parentCheck: '先让分开变得短、清楚、可预期。',
        todayAction: '家长离开 20 秒，回来后说“我回来了”。',
        durationMinutes: 3,
        parentScript: '我去拿水，数到二十就回来。',
        observeSignal: '看孩子能否等待一个很短的分开。',
        chatQuestion: '孩子短暂分开也紧张，怎么慢慢练适应？'
      }
    ],
    todayPractice: {
      title: '最低难度打招呼',
      durationMinutes: 3,
      action: '出门前约定：今天只要挥手或点头就算完成。'
    },
    sevenDayPlan: ['挥手打招呼', '靠近看一看', '说一个字', '试一下新动作', '表达我不想', '完成小挑战', '回顾我做到了']
  },
  {
    code: 'habits',
    title: '生活习惯',
    subtitle: '吃饭睡觉出门磨蹭，拆成小步骤',
    actionText: '今天固定一个生活小流程',
    ageGroups: DEVELOPMENT_AGE_GROUPS,
    theme: { color: '#A16207', tint: '#FFF8E1' },
    scenarios: [
      {
        code: 'bedtime_delay',
        title: '睡前一直拖',
        symptomText: '刷牙、洗脸、上床，每一步都要催。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先把睡前流程固定成 3 步。',
        todayAction: '只练“刷牙、上厕所、上床”三个动作。',
        durationMinutes: 10,
        parentScript: '睡前只有三步，做完就讲故事。',
        observeSignal: '看孩子能否少一次催促完成第一步。',
        chatQuestion: '孩子睡前总拖拉，怎么建立固定流程？'
      },
      {
        code: 'mealtime_slow',
        title: '吃饭慢，边吃边玩',
        symptomText: '一顿饭吃很久，常常离开座位。',
        ageGroups: DEVELOPMENT_AGE_GROUPS,
        parentCheck: '先减少桌面玩具和边吃边聊的干扰。',
        todayAction: '设 15 分钟吃饭时间，只要求坐好前 5 分钟。',
        durationMinutes: 15,
        parentScript: '前 5 分钟我们坐在椅子上吃，时间到休息一下。',
        observeSignal: '看孩子能否稳定坐满前 5 分钟。',
        chatQuestion: '孩子吃饭慢还爱玩，怎么先建立吃饭习惯？'
      },
      {
        code: 'leaving_home_slow',
        title: '出门前一直拖',
        symptomText: '穿鞋、拿包、关门，每一步都要催。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先把出门流程变成孩子能看懂的三步。',
        todayAction: '只练“穿鞋、拿水杯、站门口”三步，完成后出门。',
        durationMinutes: 8,
        parentScript: '出门三步：穿鞋，拿水杯，站门口。',
        observeSignal: '看孩子能否少一次提醒完成其中一步。',
        chatQuestion: '孩子出门前一直拖，怎么建立出门流程？'
      },
      {
        code: 'toy_cleanup',
        title: '玩具收拾很难开始',
        symptomText: '玩完以后，孩子看着一地玩具不知道从哪儿收。',
        ageGroups: ['3-4岁', '4-5岁', '5-6岁'],
        parentCheck: '先把收拾范围缩小到一个盒子。',
        todayAction: '只收 5 个积木进同一个盒子，收完就结束。',
        durationMinutes: 5,
        parentScript: '今天只收 5 个积木，放进这个盒子就完成。',
        observeSignal: '看孩子能否从一个小范围开始收拾。',
        chatQuestion: '孩子玩具收拾很难开始，怎么拆成小步骤？'
      },
      {
        code: 'morning_routine',
        title: '早上起床流程乱',
        symptomText: '穿衣、洗漱、吃早饭常常顺序乱。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先固定早上前三步。',
        todayAction: '只练“穿衣、刷牙、吃早饭”三步，用图片或手势提示。',
        durationMinutes: 10,
        parentScript: '早上三步，先穿衣，再刷牙，最后吃早饭。',
        observeSignal: '看孩子能否记住下一步是什么。',
        chatQuestion: '孩子早上起床流程乱，怎么建立固定顺序？'
      },
      {
        code: 'screen_stop',
        title: '看屏幕到点难停',
        symptomText: '动画或小游戏结束时，孩子还想继续看。',
        ageGroups: ['4-5岁', '5-6岁'],
        parentCheck: '先提前约定结束信号和下一个动作。',
        todayAction: '开始前说好“看完这一集，关掉后去喝水”。',
        durationMinutes: 5,
        parentScript: '这一集结束就关掉，然后我们去喝水。',
        observeSignal: '看孩子能否在结束信号后转到下一个动作。',
        chatQuestion: '孩子看屏幕到点难停，怎么提前约定？'
      }
    ],
    todayPractice: {
      title: '固定睡前三步',
      durationMinutes: 10,
      action: '把睡前流程固定成刷牙、上厕所、上床三个动作。'
    },
    sevenDayPlan: ['睡前三步', '吃饭前5分钟', '出门清单', '玩具归位', '刷牙打卡', '自己穿一件', '复盘一个习惯']
  }
];

var EXTRA_DEVELOPMENT_SCENARIOS = {
  language: [
    {
      code: 'why_questions',
      title: '总问为什么却接不上聊',
      symptomText: '孩子会连续问为什么，但大人回答后很快换话题。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把回答变短，再邀请孩子说自己的猜想。',
      todayAction: '问孩子“你觉得为什么”，等他说一句再补充。',
      durationMinutes: 5,
      parentScript: '你先猜一个原因，我再说我的想法。',
      observeSignal: '看孩子能否接着大人的话说一句自己的想法。',
      chatQuestion: '孩子总问为什么但聊不下去，怎么陪他把对话接住？'
    },
    {
      code: 'pronoun_mix',
      title: '你我他容易说混',
      symptomText: '孩子讲事情时，你、我、他常常替换错。',
      ageGroups: ['3-4岁', '4-5岁'],
      parentCheck: '先用身边人和动作练，不在长句里纠正。',
      todayAction: '拿两个玩偶，说“我拿球，你拍手，他睡觉”。',
      durationMinutes: 5,
      parentScript: '我做这个，你做这个，他在旁边看。',
      observeSignal: '看孩子能否在游戏里用对一个称呼。',
      chatQuestion: '孩子你我他说混，怎么在游戏里自然练？'
    },
    {
      code: 'describe_picture_detail',
      title: '看图只说一个东西',
      symptomText: '看图时只说“车”“狗”，很少说动作和细节。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先从谁、在哪里、做什么三个点扩展。',
      todayAction: '选一张图，问“谁在做什么”，只等一句完整回答。',
      durationMinutes: 6,
      parentScript: '我们看这张图，说一句：谁在做什么。',
      observeSignal: '看孩子能否从一个词扩展成一句话。',
      chatQuestion: '孩子看图只说一个词，怎么带他说得更完整？'
    },
    {
      code: 'express_feeling_words',
      title: '不舒服只会哭或哼',
      symptomText: '孩子有需要时，很难说出饿、累、疼或不想。',
      ageGroups: ['3-4岁', '4-5岁'],
      parentCheck: '先给两个可选词，让孩子选一个表达。',
      todayAction: '问“你是累了，还是不想玩了”，让孩子选一个词。',
      durationMinutes: 4,
      parentScript: '你可以说累了，也可以说不想玩了。',
      observeSignal: '看孩子能否用一个感受词代替哭闹。',
      chatQuestion: '孩子不舒服说不出来，怎么教他用感受词表达？'
    },
    {
      code: 'sequence_words',
      title: '讲事情没有先后顺序',
      symptomText: '孩子讲经历时前后跳，听的人很难明白。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先只练先、再、最后三个连接词。',
      todayAction: '让孩子用“先、再、最后”说一件刚发生的小事。',
      durationMinutes: 6,
      parentScript: '我们只说三步，先发生什么，再发生什么，最后怎样。',
      observeSignal: '看孩子能否按三步说完一件小事。',
      chatQuestion: '孩子讲事情没有顺序，怎么练先后表达？'
    },
    {
      code: 'ask_for_help_words',
      title: '需要帮忙时只着急',
      symptomText: '打不开、拿不到、不会做时，孩子容易急着喊或哭。',
      ageGroups: ['3-4岁', '4-5岁'],
      parentCheck: '先固定一句求助话，让孩子能马上用。',
      todayAction: '遇到小困难时，练说“请帮我一下”。',
      durationMinutes: 3,
      parentScript: '你可以说，请帮我一下，我就知道怎么帮你。',
      observeSignal: '看孩子能否在着急前说出一句求助话。',
      chatQuestion: '孩子需要帮忙时只着急，怎么教他说求助话？'
    }
  ],
  sensory: [
    {
      code: 'clothes_texture',
      title: '穿衣服挑面料',
      symptomText: '孩子对领口、袖口、标签或袜缝特别在意。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先找出最影响孩子的一处触感，再做可选方案。',
      todayAction: '让孩子选两件舒服衣服，先穿 3 分钟再决定。',
      durationMinutes: 5,
      parentScript: '你选一件更舒服的，我们先试 3 分钟。',
      observeSignal: '看孩子能否在有选择时完成短时间试穿。',
      chatQuestion: '孩子穿衣服很挑触感，怎么减少每天拉扯？'
    },
    {
      code: 'crowded_place',
      title: '人多地方容易烦躁',
      symptomText: '商场、活动现场或排队时，孩子很快变得烦躁。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个短目标和离开信号。',
      todayAction: '进人多地方前说“买完牛奶就出来”，并选一个安静角落。',
      durationMinutes: 5,
      parentScript: '我们只完成一件事，觉得太吵就来这里休息。',
      observeSignal: '看孩子能否在人多场景里坚持一个短目标。',
      chatQuestion: '孩子在人多地方容易烦躁，怎么提前做准备？'
    },
    {
      code: 'messy_play',
      title: '不愿碰黏黏湿湿的东西',
      symptomText: '玩橡皮泥、沙、水或颜料时，孩子很快想洗手。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先允许工具参与，再逐步增加手指接触。',
      todayAction: '先用勺子碰黏土，再用一根手指按 3 下。',
      durationMinutes: 5,
      parentScript: '先用勺子玩，再用一个手指试一下。',
      observeSignal: '看孩子能否接受一种新的触感 10 秒。',
      chatQuestion: '孩子不愿碰黏黏湿湿的东西，怎么温和尝试？'
    },
    {
      code: 'body_space',
      title: '排队总贴别人太近',
      symptomText: '孩子排队或走路时，经常靠别人很近。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用脚印或地砖帮助孩子看见距离。',
      todayAction: '在地上选一格距离，练“站在自己的格子里”。',
      durationMinutes: 4,
      parentScript: '这是你的格子，我们让身体站在格子里。',
      observeSignal: '看孩子能否用地面标记保持一点距离。',
      chatQuestion: '孩子排队总贴别人太近，怎么练身体距离？'
    },
    {
      code: 'movement_craving',
      title: '总想爬高跳下',
      symptomText: '孩子在家里不断爬沙发、跳床或从高处下来。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给安全的身体任务，替代随处爬跳。',
      todayAction: '设一个垫子区，只在垫子上做 5 次蹲起和跳落。',
      durationMinutes: 6,
      parentScript: '想跳可以来垫子区，身体在这里练最安全。',
      observeSignal: '看孩子能否把爬跳转到约定区域。',
      chatQuestion: '孩子总想爬高跳下，怎么安排安全的身体活动？'
    },
    {
      code: 'hand_force',
      title: '画画按得太重或太轻',
      symptomText: '孩子拿笔、贴贴纸或开盒子时力度不太稳定。',
      ageGroups: ['3-4岁', '4-5岁'],
      parentCheck: '先用轻重对比游戏让孩子感受手上的力度。',
      todayAction: '画三条线：轻轻画、正常画、用力画，再选最舒服的一条。',
      durationMinutes: 5,
      parentScript: '手可以轻一点，也可以重一点，我们找刚刚好的力气。',
      observeSignal: '看孩子能否分辨轻、重和刚刚好。',
      chatQuestion: '孩子手上力度不稳定，怎么用游戏练控制？'
    }
  ],
  focus: [
    {
      code: 'listen_in_group',
      title: '集体指令容易漏听',
      symptomText: '老师或家长一说大家一起做，孩子常常慢半拍。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练听关键词，再做第一个动作。',
      todayAction: '说一句集体指令，让孩子只找关键词并做第一步。',
      durationMinutes: 5,
      parentScript: '你先听关键词，听到以后做第一步就好。',
      observeSignal: '看孩子能否抓住关键词并开始动作。',
      chatQuestion: '孩子集体指令容易漏听，怎么在家练听重点？'
    },
    {
      code: 'table_activity',
      title: '桌面活动坐不住',
      symptomText: '拼图、涂色或手工开始没多久就离开桌子。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把桌面任务缩到可完成的一小块。',
      todayAction: '只拼 4 块拼图或涂一个小区域，完成就收。',
      durationMinutes: 5,
      parentScript: '今天只完成这一小块，做完就可以换活动。',
      observeSignal: '看孩子能否坐到完成一个小目标。',
      chatQuestion: '孩子桌面活动坐不住，怎么从短任务开始？'
    },
    {
      code: 'cleanup_attention',
      title: '收拾时边玩边忘',
      symptomText: '开始收玩具后，又被玩具吸引，忘了原本任务。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把收拾目标变成数量任务。',
      todayAction: '说“先放 6 个积木进盒子”，边放边数。',
      durationMinutes: 5,
      parentScript: '我们只做 6 个，数到 6 就完成。',
      observeSignal: '看孩子能否跟着数量完成收拾任务。',
      chatQuestion: '孩子收拾时边玩边忘，怎么帮他保持任务？'
    },
    {
      code: 'story_listening',
      title: '听故事坐不完整本',
      symptomText: '故事还没讲完，孩子就翻页、插话或走开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先降低故事长度，并给孩子一个听的任务。',
      todayAction: '读 3 页故事，让孩子找一个重复出现的角色。',
      durationMinutes: 6,
      parentScript: '我们只读 3 页，你帮我找小兔在哪里。',
      observeSignal: '看孩子能否带着一个任务听完 3 页。',
      chatQuestion: '孩子听故事坐不完整本，怎么提高参与感？'
    },
    {
      code: 'wait_turn_focus',
      title: '等轮到自己时走开',
      symptomText: '轮流游戏里，只要不是自己操作就开始分心。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先给等待时的小任务，帮助孩子留在游戏里。',
      todayAction: '轮到别人时，让孩子帮忙数 1 到 5，再轮到自己。',
      durationMinutes: 6,
      parentScript: '别人玩的时候，你来当计数员。',
      observeSignal: '看孩子能否在等待时留在同一个游戏里。',
      chatQuestion: '孩子等轮到自己时走开，怎么练等待中的专注？'
    },
    {
      code: 'morning_focus',
      title: '早上容易被小东西带走',
      symptomText: '穿衣洗漱时，孩子常被玩具、声音或聊天吸引。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把早上流程放进一张短清单。',
      todayAction: '只看三步清单：穿衣、刷牙、拿包，做完一项划一项。',
      durationMinutes: 8,
      parentScript: '看清单，只做下一步。做完我们划掉。',
      observeSignal: '看孩子能否被提醒后回到清单下一步。',
      chatQuestion: '孩子早上容易被小东西带走，怎么用清单帮他回到任务？'
    }
  ],
  gross_motor: [
    {
      code: 'pedal_scooter',
      title: '滑板车蹬不顺',
      symptomText: '孩子滑行时左右不协调，蹬几下就停。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练一脚站稳和另一脚轻蹬。',
      todayAction: '扶车把站稳，用一只脚轻蹬 5 次。',
      durationMinutes: 8,
      parentScript: '先站稳，再轻轻蹬一下，不急着滑远。',
      observeSignal: '看孩子能否保持身体稳定后再蹬地。',
      chatQuestion: '孩子滑板车蹬不顺，怎么分步骤练协调？'
    },
    {
      code: 'hopscotch',
      title: '跳格子容易乱脚',
      symptomText: '单脚、双脚切换时，孩子常踩线或停住。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先减少格子数量，只练双脚到单脚。',
      todayAction: '画 3 个格子，练“双脚、单脚、双脚”各 3 次。',
      durationMinutes: 8,
      parentScript: '我们只跳三格，先双脚，再单脚，再双脚。',
      observeSignal: '看孩子能否按顺序切换脚步。',
      chatQuestion: '孩子跳格子容易乱脚，怎么练脚步切换？'
    },
    {
      code: 'run_stop',
      title: '跑起来不容易停住',
      symptomText: '孩子跑动时兴奋，听到停也要冲几步。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先在短距离里练启动和停止。',
      todayAction: '玩红灯绿灯，跑 3 步听到红灯就停。',
      durationMinutes: 6,
      parentScript: '绿灯跑三步，红灯身体停住。',
      observeSignal: '看孩子能否在短距离内控制停下。',
      chatQuestion: '孩子跑起来不容易停住，怎么练身体刹车？'
    },
    {
      code: 'kick_ball',
      title: '踢球方向控制不好',
      symptomText: '孩子踢球时容易踢偏，身体也跟着晃。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用近距离大目标练脚和眼配合。',
      todayAction: '离纸箱 1 米，练踢球进箱子旁边的区域 5 次。',
      durationMinutes: 7,
      parentScript: '眼睛看目标，脚轻轻踢过去。',
      observeSignal: '看孩子能否把球踢向指定区域。',
      chatQuestion: '孩子踢球方向控制不好，怎么从近距离练？'
    },
    {
      code: 'climb_steps',
      title: '攀爬时手脚配合慢',
      symptomText: '爬梯、爬架或爬坡时，孩子不知道下一只手脚放哪里。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用低高度练手脚轮流移动。',
      todayAction: '在低台阶旁练“手放稳、脚跟上”5 次。',
      durationMinutes: 8,
      parentScript: '手先放稳，脚再跟上，一步一步来。',
      observeSignal: '看孩子能否按手脚顺序移动。',
      chatQuestion: '孩子攀爬时手脚配合慢，怎么安全练顺序？'
    },
    {
      code: 'animal_walk',
      title: '四肢支撑力量不够稳',
      symptomText: '做小熊爬、螃蟹走时，孩子很快趴下或手脚乱。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先缩短距离，只看身体能不能撑住。',
      todayAction: '做小熊走 3 步，停一下，再做 3 步。',
      durationMinutes: 5,
      parentScript: '我们走三步就休息，手脚一起帮忙。',
      observeSignal: '看孩子能否撑住身体完成短距离移动。',
      chatQuestion: '孩子四肢支撑不稳，怎么用动物走练力量？'
    }
  ],
  emotion: [
    {
      code: 'morning_grumpy',
      title: '早上醒来情绪低',
      symptomText: '刚起床就不想动、不想说话，容易哭闹。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先降低早上语言量，用固定动作启动。',
      todayAction: '起床后只做“抱一下、喝水、拉窗帘”三步。',
      durationMinutes: 5,
      parentScript: '早上先不急，我们做三步让身体醒过来。',
      observeSignal: '看孩子能否在固定三步后更容易开始。',
      chatQuestion: '孩子早上醒来情绪低，怎么温和启动一天？'
    },
    {
      code: 'jealous_sibling',
      title: '看到大人照顾别人就难过',
      symptomText: '家长抱别的孩子或忙别人时，孩子明显不开心。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个可预期的专属回应。',
      todayAction: '说“我先帮他 1 分钟，然后抱你 1 分钟”。',
      durationMinutes: 4,
      parentScript: '我看见你也想要我，等一分钟就轮到你。',
      observeSignal: '看孩子能否在知道会轮到自己后等待更久。',
      chatQuestion: '孩子看到大人照顾别人就难过，怎么回应他的需要？'
    },
    {
      code: 'scared_new_activity',
      title: '新活动前说我不要',
      symptomText: '遇到没做过的活动，孩子先拒绝或躲到大人身后。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先允许看一看，再选择最低参与方式。',
      todayAction: '让孩子先看 1 分钟，再选“靠近、摸一下、试一次”。',
      durationMinutes: 6,
      parentScript: '你可以先看，看完选一个最容易的方式。',
      observeSignal: '看孩子能否从观察过渡到一个小尝试。',
      chatQuestion: '孩子新活动前说不要，怎么降低第一次尝试的压力？'
    },
    {
      code: 'angry_body',
      title: '生气时身体动作很大',
      symptomText: '孩子生气时跺脚、挥手或推开东西。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给身体一个可以用力的安全动作。',
      todayAction: '生气时用力推墙 5 下，再说“我很生气”。',
      durationMinutes: 4,
      parentScript: '身体有力气，我们推墙，把话说出来。',
      observeSignal: '看孩子能否把大动作转成安全动作。',
      chatQuestion: '孩子生气时身体动作很大，怎么给安全出口？'
    },
    {
      code: 'sad_after_goodbye',
      title: '告别后很久缓不过来',
      symptomText: '和朋友、亲人或喜欢的地方分开后，孩子一直难过。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先给告别一个仪式，再安排下一个小动作。',
      todayAction: '离开前挥手说再见，离开后画一个小记号。',
      durationMinutes: 6,
      parentScript: '我们认真说再见，然后把今天记在纸上。',
      observeSignal: '看孩子能否用仪式完成告别。',
      chatQuestion: '孩子告别后很久缓不过来，怎么做告别仪式？'
    },
    {
      code: 'proud_overexcited',
      title: '太兴奋时停不下来',
      symptomText: '开心或得意时，孩子声音很大、动作很多，很难回到平稳。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先承认开心，再练一个收尾动作。',
      todayAction: '开心后做 3 次深呼吸，再用一句话说“我完成了”。',
      durationMinutes: 4,
      parentScript: '你很开心，我们让身体慢慢收回来。',
      observeSignal: '看孩子能否在兴奋后做一个收尾动作。',
      chatQuestion: '孩子太兴奋时停不下来，怎么练情绪收尾？'
    }
  ],
  social: [
    {
      code: 'invite_friend',
      title: '想邀请别人但开不了口',
      symptomText: '孩子想和同伴玩，却只站在旁边看。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先准备一句邀请话和一个具体玩法。',
      todayAction: '练说“你要不要一起搭高楼”，只说一次就完成。',
      durationMinutes: 4,
      parentScript: '你可以说这一句，别人答不答应都算你完成。',
      observeSignal: '看孩子能否说出一句具体邀请。',
      chatQuestion: '孩子想邀请别人但开不了口，怎么先练一句话？'
    },
    {
      code: 'group_rule_change',
      title: '别人改规则就不玩了',
      symptomText: '同伴改变玩法时，孩子马上退出或生气。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练一句确认规则的话。',
      todayAction: '玩游戏前练说“现在规则是什么”，听完再决定。',
      durationMinutes: 6,
      parentScript: '你可以先问清楚，再选择要不要继续。',
      observeSignal: '看孩子能否用提问代替马上退出。',
      chatQuestion: '孩子别人改规则就不玩了，怎么练确认和选择？'
    },
    {
      code: 'comfort_friend',
      title: '别人难过时不知道怎么办',
      symptomText: '同伴哭了或不开心，孩子想靠近但不知道说什么。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先给孩子一句关心话和一个安静动作。',
      todayAction: '练说“你还好吗”，再递一张纸巾或站旁边。',
      durationMinutes: 4,
      parentScript: '关心别人可以很简单，说一句，陪一下。',
      observeSignal: '看孩子能否用一句话表达关心。',
      chatQuestion: '孩子看到别人难过不知道怎么办，怎么教关心表达？'
    },
    {
      code: 'personal_space',
      title: '喜欢别人就靠得太近',
      symptomText: '孩子兴奋时会贴近、拉手或抱别人。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先教孩子用语言表达喜欢，再等对方回应。',
      todayAction: '练说“我想和你玩”，并站在一臂距离外。',
      durationMinutes: 5,
      parentScript: '喜欢别人可以先说出来，身体站在这里等一等。',
      observeSignal: '看孩子能否用话表达靠近意愿。',
      chatQuestion: '孩子喜欢别人就靠太近，怎么练合适距离？'
    },
    {
      code: 'borrow_return',
      title: '借东西忘了还',
      symptomText: '孩子借到玩具后玩很久，很难主动归还。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把借用时间和归还动作说清楚。',
      todayAction: '借玩具前说“我玩 3 分钟就还你”，时间到递回去。',
      durationMinutes: 6,
      parentScript: '借东西有开始，也有还回去。',
      observeSignal: '看孩子能否在提醒后完成归还。',
      chatQuestion: '孩子借东西忘了还，怎么练归还意识？'
    },
    {
      code: 'lead_game',
      title: '总想当游戏主导',
      symptomText: '孩子玩游戏时总希望别人按自己的想法来。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练一人提一个办法，再轮流选择。',
      todayAction: '家里玩游戏时说“你提一个，我提一个，再选一个”。',
      durationMinutes: 8,
      parentScript: '每个人都有一个办法，我们轮流听。',
      observeSignal: '看孩子能否听完别人的一个办法。',
      chatQuestion: '孩子总想当游戏主导，怎么练轮流决定？'
    }
  ],
  confidence: [
    {
      code: 'perform_in_front',
      title: '在人前展示就退缩',
      symptomText: '唱歌、回答或展示作品时，孩子马上变小声。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把展示对象缩小到一个熟悉的人。',
      todayAction: '只给一个家人展示 10 秒，展示完说“我完成了”。',
      durationMinutes: 4,
      parentScript: '今天只给一个人看，完成就是成功。',
      observeSignal: '看孩子能否完成最低难度展示。',
      chatQuestion: '孩子在人前展示就退缩，怎么从低压力展示开始？'
    },
    {
      code: 'try_food',
      title: '新食物一口都不想试',
      symptomText: '看到没吃过的食物，孩子马上摇头或躲开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把尝试定义成看一看、闻一闻或碰一下。',
      todayAction: '让孩子选“看、闻、碰”一种方式认识新食物。',
      durationMinutes: 3,
      parentScript: '今天先认识它，不一定要吃。你选一种方式。',
      observeSignal: '看孩子能否用一种低压力方式接近新食物。',
      chatQuestion: '孩子新食物一口都不想试，怎么降低尝试压力？'
    },
    {
      code: 'new_teacher',
      title: '面对新老师很拘谨',
      symptomText: '见到不熟悉的大人时，孩子躲在家长后面。',
      ageGroups: ['3-4岁', '4-5岁'],
      parentCheck: '先允许非语言回应，再慢慢过渡到一句话。',
      todayAction: '练三个回应等级：点头、挥手、说老师好。',
      durationMinutes: 4,
      parentScript: '你可以先挥手，准备好了再说一句。',
      observeSignal: '看孩子能否选择一种方式回应新大人。',
      chatQuestion: '孩子面对新老师拘谨，怎么从低难度回应开始？'
    },
    {
      code: 'first_class',
      title: '第一次上新课紧张',
      symptomText: '进入新教室、新课程前，孩子反复说不想去。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把未知变成三个可预期信息。',
      todayAction: '出发前说清“去哪、做多久、谁来接”三件事。',
      durationMinutes: 5,
      parentScript: '你会去这里，上一小段课，结束我来接你。',
      observeSignal: '看孩子知道流程后能否更愿意进入。',
      chatQuestion: '孩子第一次上新课紧张，怎么提前建立可预期感？'
    },
    {
      code: 'failed_craft',
      title: '作品做不好就放弃',
      symptomText: '画画、剪纸或搭建不如预期时，孩子不愿继续。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把作品目标改成试一种办法。',
      todayAction: '做不好时说“换一种办法试一次”，只试一次。',
      durationMinutes: 5,
      parentScript: '作品可以改，今天我们只试一个新办法。',
      observeSignal: '看孩子能否在不满意后再尝试一次。',
      chatQuestion: '孩子作品做不好就放弃，怎么保护继续尝试的动力？'
    },
    {
      code: 'choose_clothes',
      title: '自己做选择时犹豫很久',
      symptomText: '选衣服、玩具或活动时，孩子反复改主意。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把选择限制在两个都可以的选项里。',
      todayAction: '给两个选项，让孩子选一个并说“我选这个”。',
      durationMinutes: 3,
      parentScript: '这两个都可以，你选一个，我们就按这个来。',
      observeSignal: '看孩子能否在两个选项中做出决定。',
      chatQuestion: '孩子自己做选择时犹豫很久，怎么练小决定？'
    }
  ],
  habits: [
    {
      code: 'toilet_transition',
      title: '玩着玩着不愿去厕所',
      symptomText: '提醒上厕所时，孩子常说等一下，然后继续玩。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把厕所提醒和游戏暂停动作连起来。',
      todayAction: '提醒前说“玩具暂停在这里”，再去厕所。',
      durationMinutes: 5,
      parentScript: '玩具停在这里等你，我们去完厕所再回来。',
      observeSignal: '看孩子能否接受游戏暂停后离开一会儿。',
      chatQuestion: '孩子玩着不愿去厕所，怎么做暂停过渡？'
    },
    {
      code: 'brush_teeth_refuse',
      title: '刷牙总想躲',
      symptomText: '到刷牙时间，孩子拖延、闭嘴或跑开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先降低刷牙时长，固定开始动作。',
      todayAction: '只练张嘴 10 秒和刷前面 5 下。',
      durationMinutes: 4,
      parentScript: '今天先刷 5 下，完成就停。',
      observeSignal: '看孩子能否接受一个很短的刷牙开始。',
      chatQuestion: '孩子刷牙总想躲，怎么从最短步骤开始？'
    },
    {
      code: 'dress_self',
      title: '穿衣服总等大人帮',
      symptomText: '孩子会穿一部分，但习惯等家长全部完成。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先固定孩子自己完成一小步。',
      todayAction: '只让孩子自己拉上裤腰或套进一只袖子。',
      durationMinutes: 5,
      parentScript: '这一小步你来做，我帮你后面的。',
      observeSignal: '看孩子能否主动完成一个穿衣小步骤。',
      chatQuestion: '孩子穿衣总等大人帮，怎么建立自己做一步？'
    },
    {
      code: 'wash_hands_rush',
      title: '洗手很快糊弄完',
      symptomText: '孩子碰一下水就说洗好了，手心手背没洗到。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把洗手动作变成固定顺序。',
      todayAction: '练“手心、手背、冲水”三步，每步数到 5。',
      durationMinutes: 3,
      parentScript: '手心五下，手背五下，再冲水。',
      observeSignal: '看孩子能否按三步完成洗手。',
      chatQuestion: '孩子洗手很快糊弄完，怎么建立固定步骤？'
    },
    {
      code: 'after_school_bag',
      title: '回家书包到处放',
      symptomText: '进门后鞋、包、水杯随手放，后面找东西很费劲。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先给进门物品固定位置。',
      todayAction: '进门只做“鞋放好、包挂好、水杯放桌上”三步。',
      durationMinutes: 5,
      parentScript: '进门三件事，做完就可以玩。',
      observeSignal: '看孩子能否进门后完成一个固定归位动作。',
      chatQuestion: '孩子回家书包到处放，怎么建立进门归位流程？'
    },
    {
      code: 'bath_transition',
      title: '洗澡前后都拖拉',
      symptomText: '开始洗澡难，洗完出来也难进入下一步。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先固定洗澡前后各一个动作。',
      todayAction: '洗澡前拿睡衣，洗澡后把毛巾放回挂钩。',
      durationMinutes: 6,
      parentScript: '洗澡有开始动作，也有结束动作。',
      observeSignal: '看孩子能否用固定动作完成过渡。',
      chatQuestion: '孩子洗澡前后都拖拉，怎么设计开始和结束动作？'
    }
  ]
};

var ADVANCED_DEVELOPMENT_SCENARIOS = {
  language: [
    {
      code: 'explain_choice',
      title: '选了以后说不出原因',
      symptomText: '孩子能做选择，但很难说明为什么这样选。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先让孩子在两个简单原因里选一个。',
      todayAction: '问“你选这个，是因为颜色，还是因为好玩”。',
      durationMinutes: 5,
      parentScript: '你可以选一个原因，说出来就算完成。',
      observeSignal: '看孩子能否为一个选择说出简单原因。',
      chatQuestion: '孩子选了以后说不出原因，怎么练解释自己的选择？'
    },
    {
      code: 'tell_rule',
      title: '会玩但讲不清规则',
      symptomText: '孩子熟悉游戏，却很难把玩法讲给别人听。',
      ageGroups: ['5-6岁'],
      parentCheck: '先让孩子只说开始、轮流、结束三个点。',
      todayAction: '让孩子用三句话讲一个小游戏规则。',
      durationMinutes: 6,
      parentScript: '你只讲三句：先做什么，轮到谁，什么时候结束。',
      observeSignal: '看孩子能否按三个点说清一个规则。',
      chatQuestion: '孩子会玩但讲不清规则，怎么练说明能力？'
    },
    {
      code: 'repair_words',
      title: '说错话后不会补一句',
      symptomText: '孩子发现别人不开心后，不知道怎么把话补回来。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备一句温和修复话。',
      todayAction: '练说“我刚才说得不好，我重新说一次”。',
      durationMinutes: 4,
      parentScript: '说错了可以补一句，关系还可以继续。',
      observeSignal: '看孩子能否在提示后说出一句修复话。',
      chatQuestion: '孩子说错话后不会补一句，怎么练语言修复？'
    },
    {
      code: 'compare_words',
      title: '不会说两个东西哪里不同',
      symptomText: '比较图片、玩具或食物时，孩子只会说一样或不一样。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先从颜色、大小、用途三个维度比较。',
      todayAction: '拿两个物品，让孩子说一个相同点和一个不同点。',
      durationMinutes: 6,
      parentScript: '我们找一处一样，再找一处不一样。',
      observeSignal: '看孩子能否说出一个具体比较点。',
      chatQuestion: '孩子不会比较两个东西，怎么练描述差异？'
    }
  ],
  sensory: [
    {
      code: 'smell_sensitive',
      title: '闻到味道就躲开',
      symptomText: '饭菜、清洁用品或公共空间味道明显时，孩子想离开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先承认味道明显，再给孩子一个可做的小动作。',
      todayAction: '让孩子退后一步，用手扇一扇，再说“我想离远一点”。',
      durationMinutes: 4,
      parentScript: '你闻到了，我们可以离远一点，再慢慢决定。',
      observeSignal: '看孩子能否用退后和表达代替马上躲开。',
      chatQuestion: '孩子闻到味道就躲开，怎么帮助他表达和调整？'
    },
    {
      code: 'visual_busy',
      title: '东西太多就找不到目标',
      symptomText: '桌面、书包或玩具筐里东西多时，孩子很难找到要拿的。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先减少视野里的物品数量。',
      todayAction: '只摆 5 个物品，让孩子按颜色找出其中 1 个。',
      durationMinutes: 5,
      parentScript: '东西少一点，眼睛先找红色这个。',
      observeSignal: '看孩子能否在简化环境里找到目标。',
      chatQuestion: '孩子东西太多就找不到目标，怎么简化视觉环境？'
    },
    {
      code: 'seat_posture',
      title: '坐着时身体东倒西歪',
      symptomText: '吃饭、画画或听故事时，孩子身体靠来靠去。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先检查脚有没有踩稳，身体有没有支撑。',
      todayAction: '让孩子脚踩地或小凳，背靠椅子坐 2 分钟。',
      durationMinutes: 4,
      parentScript: '脚有地方踩，身体会更容易坐稳。',
      observeSignal: '看孩子坐稳时是否更容易完成桌面活动。',
      chatQuestion: '孩子坐着时东倒西歪，怎么先调整身体支撑？'
    },
    {
      code: 'touch_others_items',
      title: '看到新东西就上手摸',
      symptomText: '孩子看到别人的物品或新材料，很快伸手去摸。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练看、问、等三个步骤。',
      todayAction: '看到新东西时，练说“我可以摸一下吗”，等回应。',
      durationMinutes: 4,
      parentScript: '想摸可以先问，等别人说可以再摸。',
      observeSignal: '看孩子能否在伸手前先问一句。',
      chatQuestion: '孩子看到新东西就上手摸，怎么练等待和询问？'
    }
  ],
  focus: [
    {
      code: 'finish_drawing',
      title: '画到一半就换纸',
      symptomText: '孩子画画或涂色没完成，就想重新开始。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先定义一个很小的完成标准。',
      todayAction: '只要求给画面加 3 个点或涂完一个角落。',
      durationMinutes: 5,
      parentScript: '不用画完整，完成这一小块就结束。',
      observeSignal: '看孩子能否按小标准完成后再换活动。',
      chatQuestion: '孩子画到一半就换纸，怎么练完成一个小目标？'
    },
    {
      code: 'follow_music_stop',
      title: '听到停止信号还继续',
      symptomText: '音乐、口令或铃声停了，孩子动作还在继续。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用明显信号练听到就停。',
      todayAction: '让孩子跟着音乐走路，音乐一停就抱住自己。',
      durationMinutes: 5,
      parentScript: '音乐停，身体也停，抱住自己。',
      observeSignal: '看孩子能否根据声音信号停止动作。',
      chatQuestion: '孩子听到停止信号还继续，怎么练听觉控制？'
    },
    {
      code: 'remember_item',
      title: '转身就忘要拿什么',
      symptomText: '刚说去拿水杯或袜子，孩子走两步就忘了。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先让孩子复述关键词再行动。',
      todayAction: '出发前让孩子说一遍“拿水杯”，再去拿。',
      durationMinutes: 4,
      parentScript: '先把要拿的东西说出来，嘴巴帮脑袋记一下。',
      observeSignal: '看孩子复述后能否更顺利完成拿取。',
      chatQuestion: '孩子转身就忘要拿什么，怎么练短时记住任务？'
    },
    {
      code: 'quiet_activity',
      title: '安静活动很难降下来',
      symptomText: '从跑跳转到阅读、拼图或吃饭时，孩子还很兴奋。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先安排一个身体收尾动作。',
      todayAction: '安静活动前做 3 次慢慢蹲起，再坐下开始。',
      durationMinutes: 4,
      parentScript: '身体先慢下来，再开始安静的事。',
      observeSignal: '看孩子做完收尾动作后能否坐下开始。',
      chatQuestion: '孩子安静活动前降不下来，怎么做过渡？'
    }
  ],
  gross_motor: [
    {
      code: 'side_step',
      title: '侧身移动不熟练',
      symptomText: '孩子绕过桌椅、排队让路时，身体转向不灵活。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先在短线里练侧着走。',
      todayAction: '沿着地上一条线，侧身走 5 步再回来。',
      durationMinutes: 5,
      parentScript: '身体侧过来，脚一步一步走在线上。',
      observeSignal: '看孩子能否保持身体方向完成侧步。',
      chatQuestion: '孩子侧身移动不熟练，怎么在家练身体转向？'
    },
    {
      code: 'overhead_throw',
      title: '向上投掷没有方向',
      symptomText: '孩子往上或往前扔软球时，方向和力度都不稳定。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用软球和近距离大目标。',
      todayAction: '站在 1 米外，把软球投进大篮子 5 次。',
      durationMinutes: 7,
      parentScript: '眼睛看篮子，手从后往前送出去。',
      observeSignal: '看孩子能否把软球投向大目标。',
      chatQuestion: '孩子向上投掷没有方向，怎么安全练投掷？'
    },
    {
      code: 'core_roll',
      title: '翻滚和起身不连贯',
      symptomText: '孩子在垫子上翻身、滚动或起身时动作断开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用软垫练慢动作滚动。',
      todayAction: '在垫子上做 3 次慢慢滚，再坐起来。',
      durationMinutes: 5,
      parentScript: '身体慢慢滚过去，再用手帮忙坐起来。',
      observeSignal: '看孩子能否从滚动顺利接到坐起。',
      chatQuestion: '孩子翻滚和起身不连贯，怎么用垫子练身体控制？'
    },
    {
      code: 'tiptoe_walk',
      title: '踮脚走容易晃',
      symptomText: '孩子模仿小猫走、轻轻走时，很快身体晃动。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先缩短距离，扶墙也可以。',
      todayAction: '让孩子扶墙踮脚走 5 步，再正常走回来。',
      durationMinutes: 5,
      parentScript: '脚跟抬一点，身体慢慢往前走。',
      observeSignal: '看孩子能否保持踮脚完成短距离。',
      chatQuestion: '孩子踮脚走容易晃，怎么练平衡和脚部控制？'
    }
  ],
  emotion: [
    {
      code: 'cannot_win_first',
      title: '不能第一个就难过',
      symptomText: '排队、游戏或发东西时，孩子不是第一个就明显低落。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练第二个也有明确任务。',
      todayAction: '轮流时让孩子说“我第二个，我先看一看”。',
      durationMinutes: 5,
      parentScript: '第二个也有任务，你先看，再轮到你。',
      observeSignal: '看孩子能否在不是第一个时等待一轮。',
      chatQuestion: '孩子不能第一个就难过，怎么练等待和轮到自己？'
    },
    {
      code: 'small_pain_big_cry',
      title: '轻微碰到也哭很久',
      symptomText: '孩子轻轻碰到或摔一下后，很久停不下来。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先确认安全，再帮孩子说出身体感觉。',
      todayAction: '问“是疼一点，还是吓一跳”，让孩子选一个。',
      durationMinutes: 4,
      parentScript: '我看看你安全了，现在说说身体是什么感觉。',
      observeSignal: '看孩子能否用一个词描述身体感受。',
      chatQuestion: '孩子轻微碰到也哭很久，怎么接住感受再恢复？'
    },
    {
      code: 'party_over',
      title: '好玩的活动结束就失落',
      symptomText: '生日会、游乐场或朋友来玩结束后，孩子很难收心。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先做结束预告，再保留一个回忆动作。',
      todayAction: '结束前 5 分钟提醒，结束后说一件最喜欢的事。',
      durationMinutes: 5,
      parentScript: '好玩的事结束了，我们把喜欢的地方说出来。',
      observeSignal: '看孩子能否用回忆动作完成结束。',
      chatQuestion: '孩子好玩的活动结束就失落，怎么帮他收尾？'
    },
    {
      code: 'apology_hard',
      title: '知道错了但说不出口',
      symptomText: '孩子知道刚才不合适，却低头沉默或走开。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先给孩子一个低压力修复方式。',
      todayAction: '练三选一：说一句、递回物品、帮忙整理。',
      durationMinutes: 5,
      parentScript: '修复有很多方式，你选一个最容易的。',
      observeSignal: '看孩子能否选择一种方式完成修复。',
      chatQuestion: '孩子知道错了但说不出口，怎么练低压力修复？'
    }
  ],
  social: [
    {
      code: 'enter_group_game',
      title: '多人游戏不知道站哪里',
      symptomText: '孩子进入多人游戏时，不知道靠近谁、站哪里、做什么。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先观察游戏里的角色，再选一个小位置。',
      todayAction: '先看 30 秒，再说“我可以当送货员吗”。',
      durationMinutes: 5,
      parentScript: '先看他们怎么玩，再找一个小角色加入。',
      observeSignal: '看孩子能否观察后提出一个角色。',
      chatQuestion: '孩子多人游戏不知道站哪里，怎么教他观察后加入？'
    },
    {
      code: 'handle_teasing',
      title: '被开玩笑后不知道回应',
      symptomText: '别人开玩笑或说不中听的话，孩子愣住或很生气。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备一句简短边界话。',
      todayAction: '练说“我不喜欢这样说，请停一下”。',
      durationMinutes: 4,
      parentScript: '不舒服时可以说清楚，让别人知道你的边界。',
      observeSignal: '看孩子能否说出一句边界话。',
      chatQuestion: '孩子被开玩笑后不知道回应，怎么练边界表达？'
    },
    {
      code: 'share_story',
      title: '想分享但讲得太长',
      symptomText: '孩子兴奋分享时一直讲，别人插不上话。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练讲重点和看对方反应。',
      todayAction: '让孩子用三句话分享一件开心事，然后问别人一句。',
      durationMinutes: 6,
      parentScript: '讲三句，再问别人一句，对话会更好接。',
      observeSignal: '看孩子能否分享后留出别人回应的机会。',
      chatQuestion: '孩子分享时讲得太长，怎么练对话轮流？'
    },
    {
      code: 'different_opinion',
      title: '别人不同意就着急',
      symptomText: '同伴不接受他的想法时，孩子马上提高声音。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练听到不同意见后的第一句话。',
      todayAction: '练说“你想这样，我想那样，我们选一个办法”。',
      durationMinutes: 6,
      parentScript: '想法不一样时，先把两边想法说出来。',
      observeSignal: '看孩子能否先说出两边想法。',
      chatQuestion: '孩子别人不同意就着急，怎么练协商开头？'
    }
  ],
  confidence: [
    {
      code: 'ask_teacher_help',
      title: '在幼儿园不敢求助',
      symptomText: '遇到不会做、找不到东西时，孩子不敢找老师。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先在家演练一句求助话。',
      todayAction: '练说“老师，请帮我一下，我找不到”。',
      durationMinutes: 4,
      parentScript: '遇到困难可以找老师，说清一件事就可以。',
      observeSignal: '看孩子能否完整说出一句求助话。',
      chatQuestion: '孩子在幼儿园不敢求助，怎么提前演练？'
    },
    {
      code: 'choose_activity',
      title: '自由活动时不知道选什么',
      symptomText: '可选活动很多时，孩子站着看很久。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把选择范围缩小到两个。',
      todayAction: '给两个活动，让孩子选一个玩 3 分钟。',
      durationMinutes: 5,
      parentScript: '这两个都可以，你选一个先玩一小会儿。',
      observeSignal: '看孩子能否做出选择并开始。',
      chatQuestion: '孩子自由活动时不知道选什么，怎么练主动选择？'
    },
    {
      code: 'show_work',
      title: '作品完成了也不愿给人看',
      symptomText: '孩子画好、搭好以后，不想让别人评价或靠近。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先让孩子决定展示方式。',
      todayAction: '让孩子选“放桌上给人看”或“自己拿着讲一句”。',
      durationMinutes: 4,
      parentScript: '你的作品你来决定怎么展示。',
      observeSignal: '看孩子能否选择一种展示方式。',
      chatQuestion: '孩子作品完成后不愿给人看，怎么保护他的掌控感？'
    },
    {
      code: 'join_after_absence',
      title: '请假回来不敢融入',
      symptomText: '几天没去幼儿园或课程后，孩子回来时明显拘谨。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备一个重新加入的小动作。',
      todayAction: '回去前练说“我回来了，可以一起玩吗”。',
      durationMinutes: 4,
      parentScript: '重新加入可以从一句简单的话开始。',
      observeSignal: '看孩子能否用一句话重新靠近同伴。',
      chatQuestion: '孩子请假回来不敢融入，怎么帮他重新加入？'
    }
  ],
  habits: [
    {
      code: 'snack_transition',
      title: '零食吃完还想继续要',
      symptomText: '约定的零食吃完后，孩子还反复要。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先在开始前说清数量和结束动作。',
      todayAction: '开始前数好数量，吃完后把袋子放进垃圾桶。',
      durationMinutes: 4,
      parentScript: '这些吃完就结束，袋子放好代表完成。',
      observeSignal: '看孩子能否用结束动作完成零食收尾。',
      chatQuestion: '孩子零食吃完还想继续要，怎么建立结束动作？'
    },
    {
      code: 'put_on_shoes',
      title: '穿鞋左右总弄乱',
      symptomText: '孩子出门穿鞋时，常常左右不分或穿一半停住。',
      ageGroups: ['3-4岁', '4-5岁'],
      parentCheck: '先用标记帮孩子判断左右。',
      todayAction: '在鞋里贴左右标记，让孩子先找同样标记。',
      durationMinutes: 5,
      parentScript: '先找标记，标记对上再把脚放进去。',
      observeSignal: '看孩子能否根据标记完成穿鞋第一步。',
      chatQuestion: '孩子穿鞋左右总弄乱，怎么用标记帮他学会？'
    },
    {
      code: 'drink_water',
      title: '玩起来忘记喝水',
      symptomText: '孩子玩很久也不主动喝水，提醒后又忘。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把喝水和固定场景连接起来。',
      todayAction: '每次收玩具后喝两口水，再开始下一件事。',
      durationMinutes: 3,
      parentScript: '收完玩具喝两口水，身体补一下。',
      observeSignal: '看孩子能否在固定场景后喝水。',
      chatQuestion: '孩子玩起来忘记喝水，怎么建立场景提醒？'
    },
    {
      code: 'prepare_next_day',
      title: '第二天用品总是临时找',
      symptomText: '第二天要带的衣物、书包或材料，常到出门前才想起。',
      ageGroups: ['5-6岁'],
      parentCheck: '先建立睡前一个准备点。',
      todayAction: '睡前只准备一件明天要带的东西，放到门口。',
      durationMinutes: 5,
      parentScript: '明天要用的东西，今晚先放到门口。',
      observeSignal: '看孩子能否提前准备一件明天用品。',
      chatQuestion: '孩子第二天用品总是临时找，怎么练提前准备？'
    }
  ]
};

var EXPERT_DEVELOPMENT_SCENARIOS = {
  language: [
    {
      code: 'tell_need_to_teacher',
      title: '在老师面前说不清需求',
      symptomText: '想上厕所、想喝水或遇到困难时，孩子在老师面前说得很少。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把园所常用需求固定成短句。',
      todayAction: '练说“老师，我想喝水”和“老师，请帮我一下”。',
      durationMinutes: 5,
      parentScript: '在外面也可以用这句话，大人就知道怎么帮你。',
      observeSignal: '看孩子能否在角色扮演里说出一句需求。',
      chatQuestion: '孩子在老师面前说不清需求，怎么提前练园所表达？'
    },
    {
      code: 'explain_change',
      title: '计划变化时讲不出哪里变了',
      symptomText: '原本安排改变后，孩子只能说不一样，很难说具体变化。',
      ageGroups: ['5-6岁'],
      parentCheck: '先帮孩子比较原来和现在。',
      todayAction: '用“原来是，现在是”说一次计划变化。',
      durationMinutes: 5,
      parentScript: '原来我们先去公园，现在先去买东西。这样说就清楚了。',
      observeSignal: '看孩子能否用原来和现在表达变化。',
      chatQuestion: '孩子计划变化时说不清，怎么练变化表达？'
    },
    {
      code: 'tell_preference',
      title: '喜欢不喜欢说得很模糊',
      symptomText: '孩子常说还行、都可以，很少说出具体偏好。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个具体维度，比如味道、颜色或玩法。',
      todayAction: '问“你喜欢它的颜色，还是喜欢它的玩法”。',
      durationMinutes: 4,
      parentScript: '喜欢可以说具体一点，我更能懂你。',
      observeSignal: '看孩子能否说出一个具体喜欢点。',
      chatQuestion: '孩子喜欢不喜欢说得很模糊，怎么练具体表达？'
    },
    {
      code: 'ask_back_question',
      title: '别人说完不会追问',
      symptomText: '对话中别人讲完一件事，孩子很少接着问。',
      ageGroups: ['5-6岁'],
      parentCheck: '先固定一个万能追问句。',
      todayAction: '听完别人说话后，练问“后来呢”或“你怎么做的”。',
      durationMinutes: 5,
      parentScript: '对话可以接一句问题，让别人继续说。',
      observeSignal: '看孩子能否在听完后问出一个追问。',
      chatQuestion: '孩子别人说完不会追问，怎么练对话延展？'
    }
  ],
  sensory: [
    {
      code: 'cafeteria_noise',
      title: '餐厅声音多就吃不好',
      symptomText: '在嘈杂餐厅或幼儿园吃饭时，孩子明显分心或烦躁。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先让孩子坐在刺激少的位置，并给一个吃饭小目标。',
      todayAction: '选择靠边座位，只要求先吃 5 口或坐满 5 分钟。',
      durationMinutes: 8,
      parentScript: '这里安静一点，我们先完成一个小目标。',
      observeSignal: '看孩子在声音多的地方能否完成一个短目标。',
      chatQuestion: '孩子餐厅声音多就吃不好，怎么降低环境影响？'
    },
    {
      code: 'line_bumping',
      title: '排队时容易碰到前后人',
      symptomText: '排队、集合或等电梯时，孩子常碰到别人。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把距离变成可看见的脚步数。',
      todayAction: '练站在别人后面一小步，双脚停在同一块地砖里。',
      durationMinutes: 4,
      parentScript: '身体站在自己的地砖里，和前面留一小步。',
      observeSignal: '看孩子能否用地砖保持排队距离。',
      chatQuestion: '孩子排队时容易碰到别人，怎么练身体边界？'
    },
    {
      code: 'fast_slow_body',
      title: '身体速度切换很难',
      symptomText: '从快跑切到慢走，或从兴奋切到安静时，孩子很难调整。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用明确口令练快慢切换。',
      todayAction: '玩快走 5 步、慢走 5 步、停住 3 秒。',
      durationMinutes: 6,
      parentScript: '身体有三种速度，快、慢、停。我们听口令换。',
      observeSignal: '看孩子能否根据口令切换身体速度。',
      chatQuestion: '孩子身体速度切换很难，怎么练快慢和停止？'
    },
    {
      code: 'personal_calming_tool',
      title: '不舒服时不知道怎么让自己舒服点',
      symptomText: '孩子被声音、触感或人多影响后，只会躲开或哭。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先和孩子一起选一个安抚小工具或小动作。',
      todayAction: '选一个安抚动作：抱抱枕、喝水、去安静角坐 1 分钟。',
      durationMinutes: 5,
      parentScript: '不舒服时可以用这个办法帮身体舒服一点。',
      observeSignal: '看孩子能否在提示后选择一个安抚办法。',
      chatQuestion: '孩子不舒服时不知道怎么调整，怎么建立安抚工具？'
    }
  ],
  focus: [
    {
      code: 'plan_then_do',
      title: '想到什么就做什么',
      symptomText: '孩子做手工、搭建或收拾时，很少先想步骤。',
      ageGroups: ['5-6岁'],
      parentCheck: '先用两步计划帮助孩子停一下再开始。',
      todayAction: '开始前说“先做什么，再做什么”，再动手。',
      durationMinutes: 5,
      parentScript: '手先等等，嘴巴先说两步计划。',
      observeSignal: '看孩子能否先说步骤再开始行动。',
      chatQuestion: '孩子想到什么就做什么，怎么练先计划再行动？'
    },
    {
      code: 'ignore_small_noise',
      title: '一点小声音就看过去',
      symptomText: '写画、拼图或吃饭时，旁边一点声音就把孩子带走。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用短时间练回到任务。',
      todayAction: '让孩子听到小声音后，看回手里的任务 10 秒。',
      durationMinutes: 5,
      parentScript: '听到了，然后眼睛回到这里。先做 10 秒。',
      observeSignal: '看孩子能否被提醒后回到当前任务。',
      chatQuestion: '孩子一点小声音就看过去，怎么练回到任务？'
    },
    {
      code: 'multi_item_memory',
      title: '两样东西只能记住一样',
      symptomText: '让孩子拿水杯和外套时，常只拿回来一个。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用手指和复述帮助孩子记两项。',
      todayAction: '出发前伸出两根手指，说“水杯、外套”再去拿。',
      durationMinutes: 4,
      parentScript: '两个任务，用两根手指帮你记。',
      observeSignal: '看孩子能否拿回两个指定物品。',
      chatQuestion: '孩子两样东西只能记住一样，怎么练两项任务记忆？'
    },
    {
      code: 'finish_before_new',
      title: '新想法一来就放下手头事',
      symptomText: '正在做一件事时，孩子想到别的就马上转走。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给当前任务一个结束点。',
      todayAction: '说“做完这一步，再去做新想法”，并指给孩子看这一步。',
      durationMinutes: 5,
      parentScript: '新想法先等一下，我们把这一步收尾。',
      observeSignal: '看孩子能否完成一个小收尾再切换。',
      chatQuestion: '孩子新想法一来就放下手头事，怎么练先收尾？'
    }
  ],
  gross_motor: [
    {
      code: 'carry_without_spill',
      title: '端东西容易洒',
      symptomText: '端水、端碗或拿托盘时，孩子容易晃或洒。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用少量水和短距离练身体稳定。',
      todayAction: '让孩子双手端半杯水走 5 步，放到桌上。',
      durationMinutes: 5,
      parentScript: '眼睛看前面，脚慢一点，手稳一点。',
      observeSignal: '看孩子能否慢速端物走完短距离。',
      chatQuestion: '孩子端东西容易洒，怎么练身体稳定和手部控制？'
    },
    {
      code: 'change_direction_run',
      title: '跑动转弯容易失控',
      symptomText: '孩子跑步转弯时容易冲过头或撞到边上。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用慢跑和大弯练方向改变。',
      todayAction: '绕两个椅子慢跑一圈，转弯前先放慢。',
      durationMinutes: 7,
      parentScript: '转弯前身体慢下来，眼睛看下一个点。',
      observeSignal: '看孩子能否转弯前主动放慢。',
      chatQuestion: '孩子跑动转弯容易失控，怎么练变向控制？'
    },
    {
      code: 'cross_midline',
      title: '左右交叉动作不顺',
      symptomText: '拍身体、跳舞或做操时，跨过身体中线的动作不顺。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用慢速交叉拍肩练左右配合。',
      todayAction: '右手拍左肩，左手拍右肩，各做 5 次。',
      durationMinutes: 5,
      parentScript: '手去找对面的肩膀，慢慢来。',
      observeSignal: '看孩子能否完成左右交叉动作。',
      chatQuestion: '孩子左右交叉动作不顺，怎么用游戏练协调？'
    },
    {
      code: 'rhythm_clap_jump',
      title: '跟节奏拍手跳跃很难',
      symptomText: '音乐律动或做操时，孩子很难跟上拍子。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把节奏放慢，只做拍手和跳一下。',
      todayAction: '按“拍手、跳一下、停住”的顺序做 5 轮。',
      durationMinutes: 6,
      parentScript: '拍手，跳一下，停住。我们慢慢跟。',
      observeSignal: '看孩子能否跟着简单节奏完成动作。',
      chatQuestion: '孩子跟节奏动作很难，怎么从简单拍子练起？'
    }
  ],
  emotion: [
    {
      code: 'name_body_signal',
      title: '情绪来之前察觉不到身体信号',
      symptomText: '孩子常常一下子就爆发，很难提前说出自己快不舒服了。',
      ageGroups: ['5-6岁'],
      parentCheck: '先帮孩子找一个身体信号，比如手紧、脸热或声音变大。',
      todayAction: '情绪后复盘一句“刚才身体哪里先有感觉”。',
      durationMinutes: 5,
      parentScript: '我们找找，情绪来之前身体先告诉你什么。',
      observeSignal: '看孩子能否说出一个身体信号。',
      chatQuestion: '孩子情绪来之前察觉不到身体信号，怎么练提前发现？'
    },
    {
      code: 'accept_small_change',
      title: '一点安排变化就很难接受',
      symptomText: '路线、座位或顺序有小变化时，孩子明显不开心。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把变化说成原计划和新计划。',
      todayAction: '用“原来、现在、下一步”说一次小变化。',
      durationMinutes: 5,
      parentScript: '原来这样，现在变成这样，下一步我们做这个。',
      observeSignal: '看孩子能否在知道下一步后平稳一点。',
      chatQuestion: '孩子一点安排变化就难接受，怎么帮他理解变化？'
    },
    {
      code: 'calm_after_argument',
      title: '争执后很久不愿靠近',
      symptomText: '和家人或同伴争执后，孩子长时间不说话或躲开。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先给孩子一个不需要马上说很多话的修复入口。',
      todayAction: '争执后先递水或坐近一点，再说一句“我准备好了”。',
      durationMinutes: 5,
      parentScript: '关系可以慢慢回来，先做一个小动作。',
      observeSignal: '看孩子能否用一个小动作重新靠近。',
      chatQuestion: '孩子争执后很久不愿靠近，怎么做低压力修复？'
    },
    {
      code: 'worry_before_event',
      title: '活动开始前反复担心',
      symptomText: '出发前孩子反复问会不会难、会不会有人笑。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把担心变成可准备的一件小事。',
      todayAction: '问“你最担心哪一件”，再一起准备一个办法。',
      durationMinutes: 6,
      parentScript: '担心可以告诉我们，它会帮我们准备。',
      observeSignal: '看孩子能否说出一个担心点和一个准备办法。',
      chatQuestion: '孩子活动开始前反复担心，怎么把担心变成准备？'
    }
  ],
  social: [
    {
      code: 'join_existing_pair',
      title: '两个人已经在玩时插不进去',
      symptomText: '看到两个同伴玩得正好，孩子想加入却很生硬。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练观察他们正在缺什么角色。',
      todayAction: '练说“你们需要一个送东西的人吗”。',
      durationMinutes: 5,
      parentScript: '加入别人游戏，可以先找一个小角色。',
      observeSignal: '看孩子能否用角色方式加入。',
      chatQuestion: '孩子两个人已经在玩时插不进去，怎么练加入方式？'
    },
    {
      code: 'say_no_to_friend',
      title: '朋友要求不想做也答应',
      symptomText: '同伴提出要求时，孩子明明不想也说好。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练温和拒绝和替代建议。',
      todayAction: '练说“我不想这样，我想换一个玩法”。',
      durationMinutes: 5,
      parentScript: '朋友的想法可以听，你的想法也可以说。',
      observeSignal: '看孩子能否说出一个温和拒绝。',
      chatQuestion: '孩子朋友要求不想做也答应，怎么练表达自己的边界？'
    },
    {
      code: 'group_cleanup_role',
      title: '集体收拾时不知道做什么',
      symptomText: '大家一起收玩具或材料时，孩子站着看或乱拿。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个明确角色。',
      todayAction: '练说“我负责收红色积木”，只完成一个类别。',
      durationMinutes: 5,
      parentScript: '大家一起做时，你可以负责一个小任务。',
      observeSignal: '看孩子能否在集体任务里完成一个角色。',
      chatQuestion: '孩子集体收拾时不知道做什么，怎么给他明确角色？'
    },
    {
      code: 'repair_after_pushing',
      title: '碰到别人后不会处理',
      symptomText: '不小心碰到、挤到别人后，孩子愣住或走开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练一句确认和一个修复动作。',
      todayAction: '练说“你还好吗”，再退后一步让出空间。',
      durationMinutes: 4,
      parentScript: '碰到了先停下来，看一看别人怎么样。',
      observeSignal: '看孩子能否停下并说一句确认话。',
      chatQuestion: '孩子碰到别人后不会处理，怎么练确认和修复？'
    }
  ],
  confidence: [
    {
      code: 'try_after_watch',
      title: '看很久也不敢试',
      symptomText: '孩子看别人玩或做活动很久，轮到自己还是退开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把尝试缩小成一个动作。',
      todayAction: '看完后只做第一步，比如摸一下、站上去或说一句。',
      durationMinutes: 4,
      parentScript: '看完以后做一个最小动作，就算你试过了。',
      observeSignal: '看孩子能否从观察过渡到一个小动作。',
      chatQuestion: '孩子看很久也不敢试，怎么把尝试拆到最小？'
    },
    {
      code: 'recover_after_laugh',
      title: '被别人笑一下就不敢继续',
      symptomText: '有人笑或看他时，孩子马上停下不做。',
      ageGroups: ['5-6岁'],
      parentCheck: '先帮孩子区分别人笑和自己能继续。',
      todayAction: '练说“我还可以继续做一次”，再完成一个小动作。',
      durationMinutes: 5,
      parentScript: '别人笑了，你还是可以选择继续。我们做一个小步骤。',
      observeSignal: '看孩子能否在被关注后继续一个小动作。',
      chatQuestion: '孩子被别人笑一下就不敢继续，怎么保护尝试感？'
    },
    {
      code: 'speak_in_circle',
      title: '围坐分享时声音很小',
      symptomText: '轮到孩子在小组里说话时，声音小或只摇头。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先在家练一句固定分享话。',
      todayAction: '练说“我今天最喜欢的是”，音量只要家人听见。',
      durationMinutes: 4,
      parentScript: '你不用说很多，一句就可以被大家听见。',
      observeSignal: '看孩子能否用可听见的声音说一句。',
      chatQuestion: '孩子围坐分享时声音很小，怎么练低压力表达？'
    },
    {
      code: 'choose_without_parent',
      title: '没有家长确认就不敢选',
      symptomText: '孩子选玩具、座位或活动时，总反复看家长。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先约定一件孩子自己能决定的小事。',
      todayAction: '让孩子独立选一个小选项，家长只说“你决定”。',
      durationMinutes: 3,
      parentScript: '这件小事由你决定，我会尊重你的选择。',
      observeSignal: '看孩子能否不用再次确认做一个小决定。',
      chatQuestion: '孩子没有家长确认就不敢选，怎么练自主决定？'
    }
  ],
  habits: [
    {
      code: 'self_check_before_leave',
      title: '出门前总漏东西',
      symptomText: '帽子、水杯、书包或外套经常到门口才发现没拿。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把检查压缩成三个固定问题。',
      todayAction: '出门前问自己“水杯、包、鞋子”三项。',
      durationMinutes: 4,
      parentScript: '出门前身体停一下，检查三件事。',
      observeSignal: '看孩子能否按三项清单检查。',
      chatQuestion: '孩子出门前总漏东西，怎么练自我检查？'
    },
    {
      code: 'sleep_after_story',
      title: '故事讲完还想继续聊',
      symptomText: '睡前故事结束后，孩子又提出很多话题。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先设置故事后的固定收尾句。',
      todayAction: '故事后只说一句“今天最喜欢哪里”，然后关灯。',
      durationMinutes: 5,
      parentScript: '故事结束后说一句喜欢的地方，身体就准备睡觉。',
      observeSignal: '看孩子能否用一句话完成睡前收尾。',
      chatQuestion: '孩子故事讲完还想继续聊，怎么建立睡前收尾？'
    },
    {
      code: 'meal_start',
      title: '坐到餐桌后迟迟不开吃',
      symptomText: '孩子坐下后摸餐具、聊天或看旁边，很久才吃第一口。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先建立开饭第一口动作。',
      todayAction: '坐好后先吃第一口，再开始聊天。',
      durationMinutes: 4,
      parentScript: '身体坐好，先吃第一口，饭就开始了。',
      observeSignal: '看孩子能否坐下后更快开始第一口。',
      chatQuestion: '孩子坐到餐桌后迟迟不开吃，怎么建立开饭动作？'
    },
    {
      code: 'organize_small_area',
      title: '自己的小区域总乱',
      symptomText: '书桌、床边或玩具角常常堆很多东西，孩子不知道怎么整理。',
      ageGroups: ['5-6岁'],
      parentCheck: '先只整理一个小区域和两个类别。',
      todayAction: '把桌面分成“要用”和“放回去”两堆。',
      durationMinutes: 8,
      parentScript: '我们不整理全部，只分这两堆。',
      observeSignal: '看孩子能否按两个类别整理小区域。',
      chatQuestion: '孩子自己的小区域总乱，怎么教他分类整理？'
    }
  ]
};

var MASTER_DEVELOPMENT_SCENARIOS = {
  language: [
    {
      code: 'tell_past_future',
      title: '昨天和明天容易说混',
      symptomText: '孩子讲昨天、今天、明天时，时间词经常混在一起。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用真实日程帮孩子区分已经发生和还没发生。',
      todayAction: '让孩子说“昨天做了什么，明天要做什么”各一句。',
      durationMinutes: 5,
      parentScript: '昨天是已经做过的，明天是还没开始的。',
      observeSignal: '看孩子能否用一个例子区分昨天和明天。',
      chatQuestion: '孩子昨天和明天容易说混，怎么用日常安排练时间词？'
    },
    {
      code: 'use_because',
      title: '不会用因为说明原因',
      symptomText: '孩子能表达想法，但很少用因为说明原因。',
      ageGroups: ['5-6岁'],
      parentCheck: '先用一句固定句式帮孩子连接想法和原因。',
      todayAction: '练说“我想这样，因为……”补一个简单原因。',
      durationMinutes: 5,
      parentScript: '你先说想法，再用因为说一个原因。',
      observeSignal: '看孩子能否用因为补出一个原因。',
      chatQuestion: '孩子不会用因为说明原因，怎么练因果表达？'
    },
    {
      code: 'describe_location',
      title: '找东西说不清位置',
      symptomText: '孩子找不到东西时，只会说在那里，位置描述不清。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练上面、下面、旁边、里面这类位置词。',
      todayAction: '藏一个小物品，让孩子用位置词说出在哪里。',
      durationMinutes: 5,
      parentScript: '你说清楚位置，我就知道去哪里找。',
      observeSignal: '看孩子能否用一个位置词描述目标。',
      chatQuestion: '孩子找东西说不清位置，怎么练位置表达？'
    },
    {
      code: 'end_conversation',
      title: '对话结束不会收尾',
      symptomText: '聊天结束、别人要走或活动结束时，孩子不知道怎么说最后一句。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先准备一句自然收尾话。',
      todayAction: '练说“下次再聊”或“我说完了，谢谢你听”。',
      durationMinutes: 4,
      parentScript: '对话结束时，说一句收尾话就很完整。',
      observeSignal: '看孩子能否在提示后说出一句收尾话。',
      chatQuestion: '孩子对话结束不会收尾，怎么练自然结束？'
    }
  ],
  sensory: [
    {
      code: 'temperature_change',
      title: '冷热变化反应很大',
      symptomText: '洗澡、出门、换衣时，孩子对冷热变化反应明显。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先提前告知变化，再给孩子一个身体准备动作。',
      todayAction: '变化前让孩子搓手 10 秒，再接触水或衣服。',
      durationMinutes: 4,
      parentScript: '身体先准备一下，等会儿会有一点凉或热。',
      observeSignal: '看孩子提前准备后能否更平稳地接触变化。',
      chatQuestion: '孩子冷热变化反应很大，怎么提前帮助身体适应？'
    },
    {
      code: 'crowded_elevator',
      title: '电梯人多时很紧张',
      symptomText: '电梯里人多、距离近时，孩子想躲或抱紧大人。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子固定站位和出口预期。',
      todayAction: '让孩子进电梯后站在角落，数到 5 等门开。',
      durationMinutes: 3,
      parentScript: '我们站这里，数到五，门开就出去。',
      observeSignal: '看孩子能否在固定站位里等待短时间。',
      chatQuestion: '孩子电梯人多时紧张，怎么给他安全感和预期？'
    },
    {
      code: 'new_shoes',
      title: '新鞋新袜穿不习惯',
      symptomText: '换新鞋或新袜后，孩子一直说不舒服或想脱掉。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先在家短时间试穿，再带到外面。',
      todayAction: '让孩子在家穿新鞋走 2 分钟，再换回熟悉鞋。',
      durationMinutes: 4,
      parentScript: '新鞋先在家认识一下，时间很短。',
      observeSignal: '看孩子能否接受短时间试穿。',
      chatQuestion: '孩子新鞋新袜穿不习惯，怎么分步适应？'
    },
    {
      code: 'messy_table',
      title: '桌面乱时动作更乱',
      symptomText: '桌上东西多时，孩子拿错、碰倒或忘记当前动作。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把桌面只留下当前要用的两样东西。',
      todayAction: '开始前让孩子把不用的东西放到旁边盒子里。',
      durationMinutes: 5,
      parentScript: '桌上只留现在要用的，身体会更好做事。',
      observeSignal: '看孩子清桌后动作是否更稳定。',
      chatQuestion: '孩子桌面乱时动作更乱，怎么调整环境？'
    }
  ],
  focus: [
    {
      code: 'check_work',
      title: '做完不检查就走',
      symptomText: '拼图、涂色、收拾或穿衣完成后，孩子很快离开。',
      ageGroups: ['5-6岁'],
      parentCheck: '先建立一个很短的检查动作。',
      todayAction: '做完后用手指点一遍，说“我检查好了”。',
      durationMinutes: 4,
      parentScript: '结束前多一个检查动作，事情会更完整。',
      observeSignal: '看孩子能否在完成后停下检查一次。',
      chatQuestion: '孩子做完不检查就走，怎么练结束前检查？'
    },
    {
      code: 'wait_for_instruction',
      title: '指令没听完就开始做',
      symptomText: '大人话还没说完，孩子已经开始行动，后面容易做错。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练听完一句再动手。',
      todayAction: '给指令前说“听完再开始”，孩子复述后再做。',
      durationMinutes: 5,
      parentScript: '耳朵听完整，嘴巴说一遍，手再开始。',
      observeSignal: '看孩子能否等指令结束后再行动。',
      chatQuestion: '孩子指令没听完就开始做，怎么练听完再动？'
    },
    {
      code: 'return_after_break',
      title: '休息后回不到任务',
      symptomText: '中途喝水、上厕所或休息后，孩子很难回到原本任务。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给任务留一个明显标记。',
      todayAction: '休息前把小卡片放在任务上，回来后从卡片处继续。',
      durationMinutes: 6,
      parentScript: '卡片帮我们记住回来从哪里继续。',
      observeSignal: '看孩子休息后能否根据标记回到任务。',
      chatQuestion: '孩子休息后回不到任务，怎么设置返回提示？'
    },
    {
      code: 'choose_priority',
      title: '事情多时不知道先做哪件',
      symptomText: '面前有几件小事时，孩子站着不动或随便开始。',
      ageGroups: ['5-6岁'],
      parentCheck: '先教孩子选一件最先要做的事。',
      todayAction: '列两件事，让孩子选“先做哪一个”，完成后再做下一个。',
      durationMinutes: 6,
      parentScript: '事情多时，先选第一件。做完再看下一件。',
      observeSignal: '看孩子能否从两件事里选出第一件。',
      chatQuestion: '孩子事情多时不知道先做哪件，怎么练优先顺序？'
    }
  ],
  gross_motor: [
    {
      code: 'step_over_objects',
      title: '跨过小物品时很犹豫',
      symptomText: '地上有小枕头、积木或台阶时，孩子跨过去很慢。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用低矮柔软物品练跨步。',
      todayAction: '让孩子跨过一个软枕头 5 次，每次先站稳。',
      durationMinutes: 6,
      parentScript: '先站稳，一只脚跨过去，再换另一只脚。',
      observeSignal: '看孩子能否稳定跨过低矮物品。',
      chatQuestion: '孩子跨过小物品时犹豫，怎么安全练跨步？'
    },
    {
      code: 'backward_walk',
      title: '倒着走不稳',
      symptomText: '做游戏倒退、排队后退时，孩子很容易晃。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先在安全直线上练短距离倒走。',
      todayAction: '沿地上一条线倒着走 3 步，再向前走回来。',
      durationMinutes: 5,
      parentScript: '眼睛看前面，脚慢慢往后找地面。',
      observeSignal: '看孩子能否倒走 3 步保持稳定。',
      chatQuestion: '孩子倒着走不稳，怎么练方向感和平衡？'
    },
    {
      code: 'two_hand_coordination',
      title: '两只手配合不顺',
      symptomText: '拧瓶盖、撕纸、穿珠或扣扣子时，两只手配合慢。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练一只手固定、一只手操作。',
      todayAction: '一只手固定纸，另一只手撕 5 条短纸条。',
      durationMinutes: 6,
      parentScript: '一只手帮忙稳住，另一只手来做动作。',
      observeSignal: '看孩子能否让两只手分工完成动作。',
      chatQuestion: '孩子两只手配合不顺，怎么练双手分工？'
    },
    {
      code: 'low_jump_landing',
      title: '小跳落地声音很大',
      symptomText: '从低处跳下或原地跳时，孩子落地很重。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练膝盖弯一点和轻轻落地。',
      todayAction: '让孩子从地垫上小跳 5 次，落地时膝盖弯一点。',
      durationMinutes: 5,
      parentScript: '像小猫一样轻轻落地，膝盖帮身体缓一下。',
      observeSignal: '看孩子落地声音是否变轻。',
      chatQuestion: '孩子小跳落地声音很大，怎么练身体控制？'
    }
  ],
  emotion: [
    {
      code: 'recover_after_scold',
      title: '被提醒后很久不开心',
      symptomText: '大人提醒一句后，孩子沉默、低头或不愿继续。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把提醒和孩子这个人分开说清楚。',
      todayAction: '提醒后补一句“我是在说这件事，也喜欢你”。',
      durationMinutes: 4,
      parentScript: '这件事需要调整，你还是你，我们一起改。',
      observeSignal: '看孩子能否在被提醒后更快回到事情里。',
      chatQuestion: '孩子被提醒后很久不开心，怎么帮助他恢复？'
    },
    {
      code: 'mixed_feelings',
      title: '又想去又害怕说不清',
      symptomText: '面对新活动时，孩子既期待又紧张，但只说不要。',
      ageGroups: ['5-6岁'],
      parentCheck: '先帮孩子同时说出两种感受。',
      todayAction: '练说“我有点想去，也有点担心”。',
      durationMinutes: 5,
      parentScript: '两种感觉可以同时存在，说出来会更清楚。',
      observeSignal: '看孩子能否说出两种并存的感受。',
      chatQuestion: '孩子又想去又害怕说不清，怎么练复杂感受表达？'
    },
    {
      code: 'calm_corner_use',
      title: '有安静角也不会用',
      symptomText: '家里有安静角或抱枕，但孩子情绪来时想不起来用。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先在平稳时练一次去安静角。',
      todayAction: '让孩子情绪平稳时走到安静角，抱抱枕坐 30 秒。',
      durationMinutes: 3,
      parentScript: '这个地方是帮身体慢下来的，我们先练会用。',
      observeSignal: '看孩子能否在提示后走向安静角。',
      chatQuestion: '孩子有安静角也不会用，怎么提前练会使用？'
    },
    {
      code: 'after_exciting_screen',
      title: '看完刺激内容后情绪高',
      symptomText: '看完动画或短视频后，孩子说话快、动作大，很难回到日常。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先安排屏幕后固定降速流程。',
      todayAction: '让孩子结束后喝水、走到窗边看远处 30 秒，再回到下一件事。',
      durationMinutes: 5,
      parentScript: '屏幕结束后，身体需要一小段时间慢下来。',
      observeSignal: '看孩子能否按流程从屏幕切回日常。',
      chatQuestion: '孩子看完刺激内容后情绪高，怎么设计降速流程？'
    }
  ],
  social: [
    {
      code: 'notice_bored_listener',
      title: '别人不想听了也没发现',
      symptomText: '孩子一直讲自己喜欢的内容，没有注意到别人已经转头或沉默。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练看对方一个信号。',
      todayAction: '分享 3 句后，看对方眼睛，问“你还想听吗”。',
      durationMinutes: 5,
      parentScript: '说话时也看看别人是不是还在听。',
      observeSignal: '看孩子能否分享后观察对方反应。',
      chatQuestion: '孩子别人不想听了也没发现，怎么练看回应？'
    },
    {
      code: 'wait_to_interrupt',
      title: '别人说话时总插话',
      symptomText: '家人或同伴说话时，孩子想到什么马上插进来。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个等待时能做的小动作。',
      todayAction: '想插话时先把手放胸口，等别人说完再说。',
      durationMinutes: 4,
      parentScript: '想说的话先放在心口，等轮到你再说。',
      observeSignal: '看孩子能否用动作等待一个说话轮次。',
      chatQuestion: '孩子别人说话时总插话，怎么练等待轮次？'
    },
    {
      code: 'make_group_choice',
      title: '小组选择时很难妥协',
      symptomText: '几个人选游戏或角色时，孩子很难接受共同决定。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练投票或轮流决定。',
      todayAction: '家里三个人各提一个选择，再用举手选一个。',
      durationMinutes: 7,
      parentScript: '大家一起选时，每个人都有机会，最后按规则决定。',
      observeSignal: '看孩子能否接受一次共同选择结果。',
      chatQuestion: '孩子小组选择时很难妥协，怎么练共同决定？'
    },
    {
      code: 'welcome_new_child',
      title: '新朋友加入时不知道怎么回应',
      symptomText: '班级、课程或游戏里来了新孩子，孩子想看又不知道怎么互动。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备一句欢迎话和一个介绍动作。',
      todayAction: '练说“你可以和我们一起玩”，再介绍一个玩法。',
      durationMinutes: 5,
      parentScript: '新朋友来了，可以用一句话帮他加入。',
      observeSignal: '看孩子能否说出一句欢迎或介绍话。',
      chatQuestion: '孩子新朋友加入时不知道怎么回应，怎么练欢迎表达？'
    }
  ],
  confidence: [
    {
      code: 'try_when_parent_far',
      title: '家长站远一点就不敢试',
      symptomText: '只要家长不在身边，孩子就不愿尝试新动作或新活动。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把距离拉开到孩子能接受的一小步。',
      todayAction: '家长后退一步，让孩子完成一个小动作后再回来击掌。',
      durationMinutes: 5,
      parentScript: '我就在这里看着你，完成一步我就回来。',
      observeSignal: '看孩子能否在家长稍远时完成小动作。',
      chatQuestion: '孩子家长站远一点就不敢试，怎么练安全距离？'
    },
    {
      code: 'recover_from_small_error',
      title: '小错误后一直记着',
      symptomText: '说错、画歪或拿错后，孩子反复提起自己刚才错了。',
      ageGroups: ['5-6岁'],
      parentCheck: '先给孩子一句重新开始的话。',
      todayAction: '练说“刚才错了，现在我重新来一次”。',
      durationMinutes: 4,
      parentScript: '小错误可以变成重新来一次的机会。',
      observeSignal: '看孩子能否从提错转到重新做。',
      chatQuestion: '孩子小错误后一直记着，怎么帮他恢复尝试？'
    },
    {
      code: 'enter_room_alone',
      title: '进新房间前一定拉着大人',
      symptomText: '进入教室、活动室或亲友家房间时，孩子紧紧拉着大人。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练大人在门口陪伴，孩子自己迈一步。',
      todayAction: '家长站门口，让孩子先进门一步再回头看。',
      durationMinutes: 4,
      parentScript: '我在门口，你先进一小步看看。',
      observeSignal: '看孩子能否自己迈出进入空间的第一步。',
      chatQuestion: '孩子进新房间前一定拉着大人，怎么练第一步适应？'
    },
    {
      code: 'say_own_idea',
      title: '有想法但总说随便',
      symptomText: '问孩子想玩什么、想怎么做时，他常说随便或都行。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先让孩子在两个想法中选一个并说出来。',
      todayAction: '问“你想先画画，还是先搭积木”，让孩子说完整选择。',
      durationMinutes: 3,
      parentScript: '你的想法值得被听见，说一个就好。',
      observeSignal: '看孩子能否说出一个自己的选择。',
      chatQuestion: '孩子有想法但总说随便，怎么鼓励他说出主意？'
    }
  ],
  habits: [
    {
      code: 'after_toilet_steps',
      title: '上完厕所后步骤漏掉',
      symptomText: '孩子上完厕所后，冲水、整理衣服或洗手容易漏一步。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先固定厕所后的三步顺序。',
      todayAction: '练“整理衣服、冲水、洗手”三步，每步做完说好了。',
      durationMinutes: 5,
      parentScript: '厕所后有三步，做完一步说好了。',
      observeSignal: '看孩子能否按顺序完成厕所后三步。',
      chatQuestion: '孩子上完厕所后步骤漏掉，怎么建立固定顺序？'
    },
    {
      code: 'pack_small_bag',
      title: '自己的小包不会整理',
      symptomText: '水杯、纸巾、小玩具放进包里后，经常找不到或漏带。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把包内物品限制为三样。',
      todayAction: '让孩子把水杯、纸巾、小外套放进包里，再逐项摸一遍。',
      durationMinutes: 6,
      parentScript: '包里三样东西，放好以后用手检查一遍。',
      observeSignal: '看孩子能否整理并检查三样物品。',
      chatQuestion: '孩子自己的小包不会整理，怎么练物品管理？'
    },
    {
      code: 'change_clothes_after_sweat',
      title: '出汗后不愿换衣服',
      symptomText: '运动或外出后衣服湿了，孩子还想继续玩。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把换衣服和舒服感连接起来。',
      todayAction: '出汗后摸摸衣服，说“湿了换干的”，只换上衣。',
      durationMinutes: 5,
      parentScript: '换干衣服，身体会更舒服，换一件就好。',
      observeSignal: '看孩子能否接受出汗后换一件衣服。',
      chatQuestion: '孩子出汗后不愿换衣服，怎么建立身体照顾习惯？'
    },
    {
      code: 'end_play_date',
      title: '朋友来玩结束时难收尾',
      symptomText: '朋友要离开时，孩子还想继续玩，收拾和告别都很难。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先设计结束仪式和一个收拾任务。',
      todayAction: '结束前说最后玩 3 分钟，然后一起收 5 个玩具再说再见。',
      durationMinutes: 6,
      parentScript: '最后三分钟，收五个玩具，说再见，今天就完整结束。',
      observeSignal: '看孩子能否按仪式完成朋友离开过渡。',
      chatQuestion: '孩子朋友来玩结束时难收尾，怎么设计结束流程？'
    }
  ]
};

var ELITE_DEVELOPMENT_SCENARIOS = {
  language: [
    {
      code: 'tell_hidden_reason',
      title: '只说结果不说原因',
      symptomText: '孩子说我不去、我不要，但很少说明背后的原因。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把原因范围缩小到害怕、累了、不知道怎么做。',
      todayAction: '让孩子从“害怕、累了、不会做”里选一个原因。',
      durationMinutes: 4,
      parentScript: '你说一个原因，我就更知道怎么帮你。',
      observeSignal: '看孩子能否从三个原因里选出一个。',
      chatQuestion: '孩子只说结果不说原因，怎么帮他表达背后的想法？'
    },
    {
      code: 'tell_step_problem',
      title: '卡在哪一步说不清',
      symptomText: '孩子遇到困难时，只说不会，很难说具体卡在哪里。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把任务拆成第一步、第二步、第三步。',
      todayAction: '问孩子“你卡在第一步、第二步，还是第三步”。',
      durationMinutes: 5,
      parentScript: '说出卡在哪一步，我们就只帮那一步。',
      observeSignal: '看孩子能否指出一个具体卡点。',
      chatQuestion: '孩子卡在哪一步说不清，怎么练问题描述？'
    },
    {
      code: 'tell_story_feeling',
      title: '讲故事只讲事情不讲感受',
      symptomText: '孩子复述经历时只说发生了什么，很少说当时感觉。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先在事件后补一个感受词。',
      todayAction: '让孩子说“发生了什么，我当时觉得……”。',
      durationMinutes: 6,
      parentScript: '事情和感受放在一起，别人会更懂你。',
      observeSignal: '看孩子能否在事件后补一个感受词。',
      chatQuestion: '孩子讲故事只讲事情不讲感受，怎么练完整表达？'
    },
    {
      code: 'confirm_understanding',
      title: '没听懂也不说',
      symptomText: '孩子听不懂规则或问题时，常点头但后面做错。',
      ageGroups: ['5-6岁'],
      parentCheck: '先给孩子一句确认听懂的话。',
      todayAction: '练说“我没听懂，请再说一遍”。',
      durationMinutes: 4,
      parentScript: '没听懂可以说出来，这样大家都能讲清楚。',
      observeSignal: '看孩子能否在不明白时说一句确认话。',
      chatQuestion: '孩子没听懂也不说，怎么练确认理解？'
    }
  ],
  sensory: [
    {
      code: 'birthday_party_noise',
      title: '生日会太热闹时躲开',
      symptomText: '唱生日歌、拍手或大家一起说话时，孩子想离开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先约定热闹时可以站到安静位置。',
      todayAction: '让孩子选一个安静位置，热闹时站过去休息 1 分钟。',
      durationMinutes: 4,
      parentScript: '热闹的时候，你可以去那里休息一下。',
      observeSignal: '看孩子能否用休息位置调节自己。',
      chatQuestion: '孩子生日会太热闹时躲开，怎么提前设置休息点？'
    },
    {
      code: 'wet_sleeves',
      title: '袖口湿了就很难受',
      symptomText: '洗手或玩水后袖口湿一点，孩子就一直关注。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先教孩子一个处理湿袖口的小流程。',
      todayAction: '让孩子把袖口卷起，洗手后用毛巾擦袖口。',
      durationMinutes: 4,
      parentScript: '湿了有办法，卷起来，擦一擦。',
      observeSignal: '看孩子能否用处理动作减少不舒服。',
      chatQuestion: '孩子袖口湿了就很难受，怎么给他处理办法？'
    },
    {
      code: 'floor_texture',
      title: '赤脚踩不同地面很抗拒',
      symptomText: '沙地、草地、地垫或瓷砖触感变化时，孩子不愿踩。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先允许穿袜子或只用脚尖碰一下。',
      todayAction: '让孩子先用脚尖碰地面 3 秒，再踩上去 1 步。',
      durationMinutes: 4,
      parentScript: '先碰一下，再决定要不要多踩一步。',
      observeSignal: '看孩子能否接受短时间脚底触感变化。',
      chatQuestion: '孩子赤脚踩不同地面抗拒，怎么温和适应触感？'
    },
    {
      code: 'after_spin_dizzy',
      title: '转圈后很久缓不过来',
      symptomText: '孩子转圈、荡秋千或旋转后，身体很久还很兴奋。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先设置旋转后的稳定动作。',
      todayAction: '让孩子转完后双脚站稳，双手抱肩数到 10。',
      durationMinutes: 4,
      parentScript: '转完以后身体要找回来，脚站稳，手抱住自己。',
      observeSignal: '看孩子能否用稳定动作让身体慢下来。',
      chatQuestion: '孩子转圈后很久缓不过来，怎么做身体稳定？'
    }
  ],
  focus: [
    {
      code: 'start_after_choice',
      title: '选好了也迟迟不开始',
      symptomText: '孩子已经选好活动或任务，但站在旁边不动。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个开始动作。',
      todayAction: '让孩子说“我开始了”，然后做第一小步。',
      durationMinutes: 4,
      parentScript: '选择好了，第一步就是开始信号。',
      observeSignal: '看孩子能否从选择过渡到第一步行动。',
      chatQuestion: '孩子选好了也迟迟不开始，怎么建立启动动作？'
    },
    {
      code: 'switch_back_after_help',
      title: '被帮了一下就不继续',
      symptomText: '大人帮孩子完成一步后，孩子把后面的也交给大人。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先明确大人只帮一步，孩子接回下一步。',
      todayAction: '大人帮一步后说“下一步你接回去”，让孩子做 1 步。',
      durationMinutes: 5,
      parentScript: '我帮这一点，后面一小步交回给你。',
      observeSignal: '看孩子能否在被帮助后接回任务。',
      chatQuestion: '孩子被帮了一下就不继续，怎么练接回任务？'
    },
    {
      code: 'keep_place_in_book',
      title: '看书翻着翻着找不到位置',
      symptomText: '孩子看绘本或找图时，翻页后忘了刚才看到哪里。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用手指或书签帮助孩子保持位置。',
      todayAction: '让孩子用手指点着要找的角色，翻页后继续找。',
      durationMinutes: 5,
      parentScript: '手指帮眼睛记住你在找谁。',
      observeSignal: '看孩子能否用手指提示继续寻找。',
      chatQuestion: '孩子看书找不到位置，怎么练视觉追踪？'
    },
    {
      code: 'finish_shared_task',
      title: '合作任务里只做自己想做的',
      symptomText: '一起做手工或收拾时，孩子只做喜欢的部分。',
      ageGroups: ['5-6岁'],
      parentCheck: '先分配一个明确但不一定最喜欢的小职责。',
      todayAction: '让孩子负责“递材料”或“贴最后一个贴纸”，坚持到结束。',
      durationMinutes: 7,
      parentScript: '合作任务里，每个人都有一个负责的小部分。',
      observeSignal: '看孩子能否完成被分配的一个职责。',
      chatQuestion: '孩子合作任务里只做自己想做的，怎么练任务责任？'
    }
  ],
  gross_motor: [
    {
      code: 'step_down_curb',
      title: '下小台阶时很慢',
      symptomText: '下路沿、门槛或小台阶时，孩子总要扶很久。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用低台阶练一脚下、一脚跟。',
      todayAction: '让孩子从低台阶下 5 次，每次先看脚下再迈。',
      durationMinutes: 6,
      parentScript: '眼睛先看脚下，一只脚下去，另一只脚跟上。',
      observeSignal: '看孩子能否更稳定地下低台阶。',
      chatQuestion: '孩子下小台阶时很慢，怎么安全练下台阶？'
    },
    {
      code: 'carry_big_object',
      title: '抱大物品走路容易撞',
      symptomText: '抱枕头、箱子或大玩具走路时，孩子容易撞到旁边。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练抱轻的大物品走短距离。',
      todayAction: '让孩子抱一个空纸箱走 5 步，放到指定位置。',
      durationMinutes: 5,
      parentScript: '抱着大东西时，身体慢一点，眼睛看前面。',
      observeSignal: '看孩子能否抱大物品走短距离。',
      chatQuestion: '孩子抱大物品走路容易撞，怎么练空间判断？'
    },
    {
      code: 'throw_to_partner',
      title: '给别人传球力度不稳',
      symptomText: '孩子把球传给别人时，不是太近就是太用力。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先缩短距离，用软球练轻轻送过去。',
      todayAction: '让孩子离家长 1 米，把软球轻轻滚过去 5 次。',
      durationMinutes: 6,
      parentScript: '球是送给对方的，轻轻滚到他那里。',
      observeSignal: '看孩子能否把球送到对方附近。',
      chatQuestion: '孩子传球力度不稳，怎么练给别人传球？'
    },
    {
      code: 'balance_on_cushion',
      title: '软垫上站不稳',
      symptomText: '在软垫、草地或不平地面上，孩子身体晃动明显。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先让孩子双脚站稳，再加一点小动作。',
      todayAction: '让孩子双脚站在软垫上，拍手 5 下。',
      durationMinutes: 5,
      parentScript: '脚踩稳，身体找平衡，再拍手。',
      observeSignal: '看孩子能否在软垫上保持站稳。',
      chatQuestion: '孩子软垫上站不稳，怎么练动态平衡？'
    }
  ],
  emotion: [
    {
      code: 'hard_to_accept_help',
      title: '别人帮忙时也生气',
      symptomText: '孩子明明做不下去，但别人伸手帮忙时也不开心。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先让孩子选择被帮助的方式。',
      todayAction: '问“你想我示范一下，还是只提醒一句”。',
      durationMinutes: 4,
      parentScript: '你可以选择我怎么帮，这件事还由你来做。',
      observeSignal: '看孩子能否选择一种帮助方式。',
      chatQuestion: '孩子别人帮忙时也生气，怎么保留掌控感？'
    },
    {
      code: 'excited_before_guest',
      title: '客人来前太兴奋',
      symptomText: '朋友或亲戚来之前，孩子跑来跑去、声音很大。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给等待客人的身体任务。',
      todayAction: '让孩子摆好 3 个杯子，再坐下等门铃。',
      durationMinutes: 5,
      parentScript: '你很期待，我们用准备动作等客人。',
      observeSignal: '看孩子能否把兴奋转成准备动作。',
      chatQuestion: '孩子客人来前太兴奋，怎么让期待有出口？'
    },
    {
      code: 'cry_after_surprise',
      title: '突然变化后容易哭',
      symptomText: '突然换路线、活动取消或别人提前离开时，孩子一下哭出来。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用简单话说清变化，再给一个下一步动作。',
      todayAction: '说“事情变了，下一步我们先喝水”，并马上做下一步。',
      durationMinutes: 4,
      parentScript: '事情变了，我们先做下一步，身体会慢慢跟上。',
      observeSignal: '看孩子能否在变化后跟随一个下一步动作。',
      chatQuestion: '孩子突然变化后容易哭，怎么先帮助他过渡？'
    },
    {
      code: 'review_after_calm',
      title: '平静后不愿复盘',
      symptomText: '情绪过去后，孩子不想再提刚才发生了什么。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把复盘缩成一个问题。',
      todayAction: '平静后只问“刚才最难的是哪一步”。',
      durationMinutes: 4,
      parentScript: '我们只说一个点，说完就结束。',
      observeSignal: '看孩子能否在平静后回答一个复盘问题。',
      chatQuestion: '孩子平静后不愿复盘，怎么低压力回看刚才？'
    }
  ],
  social: [
    {
      code: 'ask_to_join_materials',
      title: '想用别人材料不会开口',
      symptomText: '孩子想用同伴的笔、积木或工具时，直接拿或一直看。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练一句材料借用话。',
      todayAction: '练说“这个可以给我用一下吗，用完还你”。',
      durationMinutes: 4,
      parentScript: '想用别人的东西，先说清楚会还回去。',
      observeSignal: '看孩子能否先说一句再拿材料。',
      chatQuestion: '孩子想用别人材料不会开口，怎么练借用表达？'
    },
    {
      code: 'notice_friend_signal',
      title: '看不出朋友想停了',
      symptomText: '同伴已经后退、摇头或沉默，孩子还继续邀请。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练看一个身体信号。',
      todayAction: '角色扮演时，让孩子看到摇头就停下来问一句。',
      durationMinutes: 5,
      parentScript: '别人身体在告诉你想停，我们可以问一问。',
      observeSignal: '看孩子能否根据一个信号暂停邀请。',
      chatQuestion: '孩子看不出朋友想停了，怎么练观察同伴信号？'
    },
    {
      code: 'join_cleanup_without_prompt',
      title: '别人开始收拾了他还在玩',
      symptomText: '集体活动结束，大家开始收拾时，孩子还沉浸在原玩法里。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练看到别人动作就跟一个收尾动作。',
      todayAction: '看到别人收拾时，让孩子放回手里一个物品。',
      durationMinutes: 4,
      parentScript: '别人开始收，我们也先放回手里这个。',
      observeSignal: '看孩子能否根据集体动作开始收尾。',
      chatQuestion: '孩子别人收拾了还在玩，怎么练看集体信号？'
    },
    {
      code: 'share_win_moment',
      title: '自己赢了以后不会照顾别人',
      symptomText: '孩子赢了后很兴奋，容易忽略别人有点失落。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练赢了后的温和表达。',
      todayAction: '练说“这次我赢了，下次我们再玩一次”。',
      durationMinutes: 4,
      parentScript: '赢了也可以照顾别人感受，游戏会更好继续。',
      observeSignal: '看孩子赢后能否说一句照顾关系的话。',
      chatQuestion: '孩子自己赢了以后不会照顾别人，怎么练赢后的表达？'
    }
  ],
  confidence: [
    {
      code: 'practice_before_public',
      title: '公开前需要先预演',
      symptomText: '孩子一到公开场合就紧张，但在家能做得更好。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用家庭预演降低未知感。',
      todayAction: '在家预演一次公开场景，只做开头 10 秒。',
      durationMinutes: 5,
      parentScript: '我们先在家练开头，到了现场就熟一点。',
      observeSignal: '看孩子预演后是否更愿意进入现场。',
      chatQuestion: '孩子公开前需要预演，怎么设计低压力练习？'
    },
    {
      code: 'try_with_peer_watching',
      title: '同伴看着就不敢试',
      symptomText: '自己练习时可以，同伴一看就停下或躲开。',
      ageGroups: ['5-6岁'],
      parentCheck: '先从一个熟悉同伴旁观开始。',
      todayAction: '让一个熟悉同伴在旁边看 10 秒，孩子完成一个小动作。',
      durationMinutes: 5,
      parentScript: '有人看着也可以只做一小步。',
      observeSignal: '看孩子能否在同伴旁观时完成小动作。',
      chatQuestion: '孩子同伴看着就不敢试，怎么逐步适应被看见？'
    },
    {
      code: 'handle_being_last',
      title: '最后一个完成就很低落',
      symptomText: '排队、比赛或课堂任务里，孩子最后完成时很失落。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把注意力拉回完成了什么。',
      todayAction: '练说“我完成了哪一步”，只说一个具体完成点。',
      durationMinutes: 4,
      parentScript: '顺序有前后，完成点也值得被看见。',
      observeSignal: '看孩子能否说出一个完成点。',
      chatQuestion: '孩子最后一个完成就低落，怎么看见自己的完成？'
    },
    {
      code: 'enter_after_late_arrival',
      title: '迟到后不敢进场',
      symptomText: '活动已经开始后，孩子站在门口不愿进去。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备迟到进场的一句短话。',
      todayAction: '练说“我来了，我坐这里可以吗”，再走到座位。',
      durationMinutes: 4,
      parentScript: '晚一点到也可以用一句话加入。',
      observeSignal: '看孩子能否用一句话进入已经开始的场景。',
      chatQuestion: '孩子迟到后不敢进场，怎么练重新加入？'
    }
  ],
  habits: [
    {
      code: 'transition_from_car',
      title: '下车后迟迟不走',
      symptomText: '到达目的地后，孩子坐在车里或门口不想移动。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给下车后的第一个具体动作。',
      todayAction: '下车后让孩子先拿水杯，再走到门口。',
      durationMinutes: 4,
      parentScript: '下车第一步是拿水杯，然后走到门口。',
      observeSignal: '看孩子能否用第一步启动下车过渡。',
      chatQuestion: '孩子下车后迟迟不走，怎么建立过渡第一步？'
    },
    {
      code: 'wash_face',
      title: '洗脸总漏掉眼角嘴边',
      symptomText: '孩子洗脸时只碰一下水，脸上还留着明显痕迹。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把洗脸变成三个位置。',
      todayAction: '练“额头、眼角、嘴边”三个位置各擦一下。',
      durationMinutes: 3,
      parentScript: '脸上有三个小地方，我们一个一个擦。',
      observeSignal: '看孩子能否按三个位置完成洗脸。',
      chatQuestion: '孩子洗脸总漏地方，怎么拆成具体位置？'
    },
    {
      code: 'toy_rotation',
      title: '玩具太多每个都玩不久',
      symptomText: '孩子把很多玩具拿出来，每个都只玩一下。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把可见玩具减少到两个。',
      todayAction: '让孩子从两个玩具里选一个，玩满 5 分钟再换。',
      durationMinutes: 6,
      parentScript: '现在只选一个玩具，玩完这一小段再换。',
      observeSignal: '看孩子能否在减少选择后玩得更久。',
      chatQuestion: '孩子玩具太多每个都玩不久，怎么做玩具轮换？'
    },
    {
      code: 'after_bath_clothes',
      title: '洗完澡穿衣拖很久',
      symptomText: '洗澡后孩子玩毛巾、跑开或迟迟不穿睡衣。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把睡衣放在固定位置，减少洗后寻找。',
      todayAction: '洗澡前让孩子把睡衣放到浴室门口，洗完直接穿。',
      durationMinutes: 5,
      parentScript: '睡衣提前等在门口，洗完就接上下一步。',
      observeSignal: '看孩子能否洗完后更快接到穿衣步骤。',
      chatQuestion: '孩子洗完澡穿衣拖很久，怎么提前准备下一步？'
    }
  ]
};

var ULTIMATE_DEVELOPMENT_SCENARIOS = {
  language: [
    {
      code: 'tell_plan_to_peer',
      title: '想法说给同伴听不清楚',
      symptomText: '孩子有玩法或计划，但说给同伴听时别人听不明白。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把想法压缩成要玩什么、谁来做、怎么开始。',
      todayAction: '让孩子用三句说清“玩什么、谁来做、先做什么”。',
      durationMinutes: 6,
      parentScript: '把计划说清楚，别人就更容易一起玩。',
      observeSignal: '看孩子能否用三句话说明一个玩法。',
      chatQuestion: '孩子想法说给同伴听不清楚，怎么练计划表达？'
    },
    {
      code: 'retell_teacher_message',
      title: '转述老师的话说不完整',
      symptomText: '孩子回家后说老师说了什么，但常常只记一半。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练人物、事情、时间三个信息点。',
      todayAction: '让孩子用“谁说、说什么、什么时候做”转述一句。',
      durationMinutes: 5,
      parentScript: '转述一件事时，先说谁，再说事情，再说时间。',
      observeSignal: '看孩子能否带出三个信息点。',
      chatQuestion: '孩子转述老师的话不完整，怎么练信息转述？'
    },
    {
      code: 'explain_when_refusing',
      title: '拒绝别人时说得太硬',
      symptomText: '孩子不想参与时，常直接说不要，别人听起来不舒服。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先练拒绝加原因，再给一个替代选择。',
      todayAction: '练说“我现在不想玩这个，我想先看一会儿”。',
      durationMinutes: 4,
      parentScript: '拒绝也可以说得清楚又温和。',
      observeSignal: '看孩子能否用原因把拒绝说完整。',
      chatQuestion: '孩子拒绝别人时说得太硬，怎么练温和表达？'
    },
    {
      code: 'ask_clarifying_question',
      title: '不知道时不会问清楚',
      symptomText: '孩子遇到不确定规则或要求时，常停住或随便做。',
      ageGroups: ['5-6岁'],
      parentCheck: '先准备一句澄清问题。',
      todayAction: '练说“你是让我先做这个，还是先做那个”。',
      durationMinutes: 4,
      parentScript: '不确定时问清楚，是很好的办法。',
      observeSignal: '看孩子能否在不确定时问一个澄清问题。',
      chatQuestion: '孩子不知道时不会问清楚，怎么练澄清问题？'
    }
  ],
  sensory: [
    {
      code: 'playground_busy',
      title: '游乐区人多时玩不顺',
      symptomText: '滑梯、攀爬架或球池人多时，孩子动作变急或退开。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先选择一个低人流入口和一个短目标。',
      todayAction: '让孩子先完成一个短目标，比如滑一次或爬两格。',
      durationMinutes: 6,
      parentScript: '人多时我们只完成一个小目标，再决定下一步。',
      observeSignal: '看孩子能否在人多环境里完成一个短目标。',
      chatQuestion: '孩子游乐区人多时玩不顺，怎么设置短目标？'
    },
    {
      code: 'public_restroom',
      title: '公共洗手间不愿进去',
      symptomText: '外面的洗手间声音、气味或环境让孩子退缩。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子可预期步骤和快速离开的信号。',
      todayAction: '进去前说“三步：进去、完成、出来洗手”。',
      durationMinutes: 4,
      parentScript: '我们只做三步，很快出来。',
      observeSignal: '看孩子知道步骤后能否更愿意进入。',
      chatQuestion: '孩子公共洗手间不愿进去，怎么提前说明流程？'
    },
    {
      code: 'busy_classroom_wall',
      title: '教室墙面太花就分心',
      symptomText: '墙面材料、图画或人来人往很多时，孩子很难看向任务。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先帮孩子选一个视觉更简单的位置。',
      todayAction: '让孩子背对复杂墙面，先看桌面任务 1 分钟。',
      durationMinutes: 4,
      parentScript: '换个方向，眼睛会更容易看现在的事。',
      observeSignal: '看孩子换位置后能否更快回到任务。',
      chatQuestion: '孩子教室墙面太花就分心，怎么调整位置？'
    },
    {
      code: 'body_after_long_sit',
      title: '久坐后身体很难启动',
      symptomText: '坐车、听课或吃饭久了，孩子起身后动作慢或烦躁。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用两个大动作唤醒身体。',
      todayAction: '让孩子起身后做 5 次伸手和 5 次蹲起。',
      durationMinutes: 3,
      parentScript: '身体坐久了，先动一动再开始下一件事。',
      observeSignal: '看孩子做完大动作后是否更容易进入下一步。',
      chatQuestion: '孩子久坐后身体很难启动，怎么做过渡动作？'
    }
  ],
  focus: [
    {
      code: 'find_missing_step',
      title: '流程里漏一步自己发现不了',
      symptomText: '穿衣、收拾或手工漏掉一步后，孩子没有察觉。',
      ageGroups: ['5-6岁'],
      parentCheck: '先让孩子对照三步清单检查。',
      todayAction: '做完后让孩子看三步清单，指出哪一步完成了。',
      durationMinutes: 5,
      parentScript: '清单帮你看见有没有少一步。',
      observeSignal: '看孩子能否根据清单发现完成情况。',
      chatQuestion: '孩子流程里漏一步发现不了，怎么练自查？'
    },
    {
      code: 'stay_with_boring_part',
      title: '遇到无聊部分就想跳过',
      symptomText: '活动里有等待、整理或重复步骤时，孩子很快想换。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把无聊部分缩短，并给完成信号。',
      todayAction: '让孩子完成 30 秒无聊步骤，再贴一个完成标记。',
      durationMinutes: 4,
      parentScript: '无聊的部分很短，完成后我们做个标记。',
      observeSignal: '看孩子能否停留在不喜欢的步骤 30 秒。',
      chatQuestion: '孩子遇到无聊部分就想跳过，怎么练短暂停留？'
    },
    {
      code: 'shift_after_timer',
      title: '计时器响了也不切换',
      symptomText: '约定时间到了，孩子听见提示也继续原来的活动。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把计时器和下一个动作连接起来。',
      todayAction: '计时器响后，让孩子把手里物品放进固定盒子。',
      durationMinutes: 4,
      parentScript: '声音响了，手里的东西回盒子，身体就知道要换了。',
      observeSignal: '看孩子能否根据计时器做切换动作。',
      chatQuestion: '孩子计时器响了也不切换，怎么连接结束动作？'
    },
    {
      code: 'resume_after_mistake',
      title: '做错一步后忘了原目标',
      symptomText: '孩子纠正一个小错误后，忘了原本要完成什么。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先把原目标用一句话保留住。',
      todayAction: '出错后说“我们的目标是完成这一页”，再继续下一步。',
      durationMinutes: 5,
      parentScript: '错一步没关系，我们回到原来的目标。',
      observeSignal: '看孩子能否在纠正后回到原目标。',
      chatQuestion: '孩子做错一步后忘了原目标，怎么帮他回到任务？'
    }
  ],
  gross_motor: [
    {
      code: 'walk_with_tray',
      title: '托盘端物走路不稳',
      symptomText: '端点心、玩具或小托盘时，孩子容易晃动。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先用空托盘和短距离练稳定。',
      todayAction: '让孩子双手端空托盘走 5 步，放到桌上。',
      durationMinutes: 5,
      parentScript: '双手在两边，眼睛看前面，脚慢慢走。',
      observeSignal: '看孩子能否端托盘稳定走短距离。',
      chatQuestion: '孩子托盘端物走路不稳，怎么练稳定移动？'
    },
    {
      code: 'jump_turn',
      title: '跳起来转方向很难',
      symptomText: '孩子跳跃后转向或换方向时，身体容易乱。',
      ageGroups: ['5-6岁'],
      parentCheck: '先用小角度转向练落地稳定。',
      todayAction: '让孩子原地小跳后转向一边，落地站稳 3 秒。',
      durationMinutes: 6,
      parentScript: '跳得小一点，落地先站稳。',
      observeSignal: '看孩子转向后能否稳定落地。',
      chatQuestion: '孩子跳起来转方向很难，怎么练落地控制？'
    },
    {
      code: 'crawl_under_table',
      title: '低头钻过空间不熟练',
      symptomText: '钻桌下、穿过低矮空间时，孩子容易碰到头或停住。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用软垫和宽空间练低头前进。',
      todayAction: '让孩子低头钻过两把椅子之间，出来后站稳。',
      durationMinutes: 6,
      parentScript: '头低一点，手先往前，慢慢钻过去。',
      observeSignal: '看孩子能否调整身体高度通过空间。',
      chatQuestion: '孩子低头钻过空间不熟练，怎么练身体计划？'
    },
    {
      code: 'throw_underhand',
      title: '从下往上抛接不顺',
      symptomText: '孩子从下往上抛豆袋或软球时，方向和力度难控制。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先用豆袋和近距离目标。',
      todayAction: '让孩子把豆袋从下往上抛进近处篮子 5 次。',
      durationMinutes: 6,
      parentScript: '手从下面轻轻送出去，目标就在前面。',
      observeSignal: '看孩子能否把豆袋抛向近处目标。',
      chatQuestion: '孩子从下往上抛接不顺，怎么练力度和方向？'
    }
  ],
  emotion: [
    {
      code: 'calm_before_talking',
      title: '还没平静就急着解释',
      symptomText: '孩子情绪还高时，急着说理由，越说越乱。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把说话放到身体平稳之后。',
      todayAction: '让孩子先喝水或坐 30 秒，再说一句原因。',
      durationMinutes: 4,
      parentScript: '身体先慢一点，话会更容易说清楚。',
      observeSignal: '看孩子能否先平稳再说一句。',
      chatQuestion: '孩子还没平静就急着解释，怎么安排先后顺序？'
    },
    {
      code: 'feel_left_out',
      title: '觉得自己被落下时很难过',
      symptomText: '别人先走、先玩或先被叫到时，孩子觉得自己被忘了。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先确认孩子被看见，再说明轮到他的时间。',
      todayAction: '说“我看见你也想去，下一轮轮到你”，并指给他看等待点。',
      durationMinutes: 4,
      parentScript: '你没有被忘记，只是在等下一轮。',
      observeSignal: '看孩子知道轮到时间后能否等待更久。',
      chatQuestion: '孩子觉得自己被落下时很难过，怎么给可预期感？'
    },
    {
      code: 'name_disappointment',
      title: '失望时只说讨厌',
      symptomText: '想要的事情没有发生时，孩子只说讨厌或不好玩。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把讨厌背后的失望说出来。',
      todayAction: '练说“我有点失望，因为我本来想……”。',
      durationMinutes: 5,
      parentScript: '讨厌后面可能有失望，我们把它说清楚。',
      observeSignal: '看孩子能否用失望表达原本期待。',
      chatQuestion: '孩子失望时只说讨厌，怎么帮他说出期待？'
    },
    {
      code: 'choose_repair_after_angry',
      title: '生气后不知道怎么补救',
      symptomText: '孩子情绪过去后知道刚才不合适，但不知道下一步做什么。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备两个补救选择。',
      todayAction: '让孩子选“说一句”或“帮忙整理”作为补救动作。',
      durationMinutes: 5,
      parentScript: '情绪过去后，我们可以选一个办法修复。',
      observeSignal: '看孩子能否选择并完成一个补救动作。',
      chatQuestion: '孩子生气后不知道怎么补救，怎么给修复选择？'
    }
  ],
  social: [
    {
      code: 'enter_running_game',
      title: '别人已经跑起来时不会加入',
      symptomText: '追逐、接力或户外游戏已经开始，孩子不知道怎么加入。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先让孩子观察入口和安全位置。',
      todayAction: '练说“下一轮我可以加入吗”，然后站到等待点。',
      durationMinutes: 5,
      parentScript: '跑动游戏要先找下一轮，不直接冲进去。',
      observeSignal: '看孩子能否等待下一轮加入。',
      chatQuestion: '孩子别人已经跑起来时不会加入，怎么找安全入口？'
    },
    {
      code: 'share_limited_item',
      title: '只有一个物品时很难分配',
      symptomText: '只有一支笔、一个角色或一个玩具时，孩子很难和别人协商。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练时间轮流或任务轮流。',
      todayAction: '练说“你先 2 分钟，然后换我 2 分钟”。',
      durationMinutes: 6,
      parentScript: '一个东西也可以用时间来轮流。',
      observeSignal: '看孩子能否接受一次时间轮流。',
      chatQuestion: '孩子只有一个物品时很难分配，怎么练协商？'
    },
    {
      code: 'invite_quiet_child',
      title: '面对安静同伴不知道怎么邀请',
      symptomText: '同伴不太说话时，孩子不知道要不要继续邀请。',
      ageGroups: ['5-6岁'],
      parentCheck: '先练低压力邀请和给对方选择。',
      todayAction: '练说“你想看我们玩，还是一起玩一会儿”。',
      durationMinutes: 5,
      parentScript: '邀请别人时，也给别人一个选择。',
      observeSignal: '看孩子能否用选择式邀请。',
      chatQuestion: '孩子面对安静同伴不知道怎么邀请，怎么给对方选择？'
    },
    {
      code: 'leave_game_politely',
      title: '想离开游戏时直接走',
      symptomText: '孩子不想继续玩时，常直接离开，让别人不知道怎么回事。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先练一句离开说明。',
      todayAction: '练说“我先去休息一下，等会儿再来”。',
      durationMinutes: 4,
      parentScript: '离开前说一句，别人就知道你不是不理他。',
      observeSignal: '看孩子能否在离开前说一句说明。',
      chatQuestion: '孩子想离开游戏时直接走，怎么练礼貌退出？'
    }
  ],
  confidence: [
    {
      code: 'try_with_backup_plan',
      title: '有退路才愿意试',
      symptomText: '孩子面对新挑战时，需要知道做不到可以怎么办。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先给孩子一个退一步方案。',
      todayAction: '尝试前说“做不到可以停一下，再做一半”。',
      durationMinutes: 4,
      parentScript: '有退一步的办法，尝试会更容易开始。',
      observeSignal: '看孩子知道退路后是否更愿意尝试。',
      chatQuestion: '孩子有退路才愿意试，怎么设计备用方案？'
    },
    {
      code: 'ask_for_turn',
      title: '想轮到自己但不敢说',
      symptomText: '孩子想参与或想试一次，却只在旁边等。',
      ageGroups: ['4-5岁', '5-6岁'],
      parentCheck: '先准备一句轮到自己的请求。',
      todayAction: '练说“下一个可以轮到我吗”。',
      durationMinutes: 4,
      parentScript: '想试一次，可以用这句话说出来。',
      observeSignal: '看孩子能否主动请求一个轮次。',
      chatQuestion: '孩子想轮到自己但不敢说，怎么练主动请求？'
    },
    {
      code: 'keep_trying_when_slow',
      title: '发现自己慢就不想做',
      symptomText: '别人快一点时，孩子马上觉得自己不行。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把目标改成完成自己的下一步。',
      todayAction: '练说“我慢一点，也做下一步”。',
      durationMinutes: 4,
      parentScript: '速度不同，下一步还是可以继续做。',
      observeSignal: '看孩子能否在慢一点时继续下一步。',
      chatQuestion: '孩子发现自己慢就不想做，怎么保护持续尝试？'
    },
    {
      code: 'show_preference_to_adult',
      title: '面对大人不敢说偏好',
      symptomText: '别人问孩子想要哪个，他常看家长或说都行。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先让孩子说一个很小的偏好。',
      todayAction: '让孩子对大人说“我想要这个颜色”。',
      durationMinutes: 3,
      parentScript: '你的选择可以直接告诉大人。',
      observeSignal: '看孩子能否面对大人说出一个偏好。',
      chatQuestion: '孩子面对大人不敢说偏好，怎么练表达选择？'
    }
  ],
  habits: [
    {
      code: 'morning_put_on_coat',
      title: '早上外套总拖到最后',
      symptomText: '出门前外套、帽子或围巾总是最后才想起来。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把外套放进出门三步。',
      todayAction: '出门前让孩子按“外套、鞋子、水杯”三步走。',
      durationMinutes: 5,
      parentScript: '外套是出门第一步，穿好再看鞋子。',
      observeSignal: '看孩子能否把外套纳入出门流程。',
      chatQuestion: '孩子早上外套总拖到最后，怎么固定出门步骤？'
    },
    {
      code: 'snack_cleanup',
      title: '吃完点心包装到处放',
      symptomText: '孩子吃完后，包装纸、杯子或勺子常留在桌上。',
      ageGroups: DEVELOPMENT_AGE_GROUPS,
      parentCheck: '先把点心结束动作固定下来。',
      todayAction: '吃完后让孩子把包装放进垃圾桶，杯子放到水槽边。',
      durationMinutes: 4,
      parentScript: '点心结束有两个动作，放包装，放杯子。',
      observeSignal: '看孩子能否完成点心后的收尾动作。',
      chatQuestion: '孩子吃完点心包装到处放，怎么建立收尾习惯？'
    },
    {
      code: 'choose_weather_clothes',
      title: '不会根据天气选衣服',
      symptomText: '冷、热、下雨时，孩子仍想按喜欢选择衣服。',
      ageGroups: ['5-6岁'],
      parentCheck: '先把天气和一个衣物选择连接。',
      todayAction: '看天气后问“今天冷一点，要加哪一件”。',
      durationMinutes: 4,
      parentScript: '衣服要照顾身体，也可以选你喜欢的颜色。',
      observeSignal: '看孩子能否根据天气做一个衣物选择。',
      chatQuestion: '孩子不会根据天气选衣服，怎么练生活判断？'
    },
    {
      code: 'return_library_book',
      title: '借来的东西忘记归还',
      symptomText: '借书、借玩具或带回家的物品，孩子容易忘记还。',
      ageGroups: ['5-6岁'],
      parentCheck: '先建立借来物品的固定放置点。',
      todayAction: '让孩子把借来的东西放进“要归还”袋子里。',
      durationMinutes: 4,
      parentScript: '借来的东西有一个回家的位置，也有一个归还的位置。',
      observeSignal: '看孩子能否把借来物品放到归还位置。',
      chatQuestion: '孩子借来的东西忘记归还，怎么建立归还提示？'
    }
  ]
};

var DEVELOPMENT_DEPTH_GUIDE = {
  language: {
    focus: '语言发展先看孩子能不能把想法说出来，再逐步增加句子长度和清晰度。',
    safety: '练语言时先接住孩子想表达的意思，避免频繁纠音打断表达意愿。',
    pitfalls: ['一直要求孩子重复标准答案', '孩子没说完整时马上替他说完']
  },
  sensory: {
    focus: '身体感觉练习重点是让孩子更清楚自己的身体位置、力度和节奏。',
    safety: '所有身体小游戏都要在安全空间里做，孩子明显抗拒时先缩短时间。',
    pitfalls: ['把身体活动变成消耗体力', '孩子不舒服时继续加量']
  },
  focus: {
    focus: '专注力先从开始、停留和完成三个环节看，不急着要求长时间坚持。',
    safety: '练专注时任务要短、目标要清楚，避免用责备维持注意。',
    pitfalls: ['一次给太多指令', '只提醒快一点而没有给第一步']
  },
  gross_motor: {
    focus: '大运动练习关注平衡、协调、力量和身体控制，先稳再快。',
    safety: '跑跳爬投都要先确认地面、防滑和周围空间，避免追求高难度动作。',
    pitfalls: ['直接挑战太难的动作', '只看完成速度忽略动作是否稳定']
  },
  emotion: {
    focus: '情绪管理先帮助孩子识别身体感受和情绪名字，再练可替代动作。',
    safety: '孩子情绪很高时先降低刺激和语言量，等平稳后再复盘。',
    pitfalls: ['情绪高峰时讲很多道理', '只要求停止哭闹而没有给替代动作']
  },
  social: {
    focus: '社交能力先练一句能用的话，再逐步练等待、拒绝、协商和修复。',
    safety: '社交练习要从熟悉的人和低压力场景开始，避免公开纠正孩子。',
    pitfalls: ['要求孩子马上大方合群', '孩子被拒绝后继续催他加入']
  },
  confidence: {
    focus: '自信与适应来自小步成功和可预期体验，先让孩子有安全感。',
    safety: '新环境和新挑战都要保留退一步的选择，避免把尝试变成压力。',
    pitfalls: ['用比较激孩子尝试', '孩子退缩时马上贴标签']
  },
  habits: {
    focus: '生活习惯先固定流程、提示和环境线索，再慢慢减少提醒，让孩子形成可预期的行动顺序。',
    safety: '习惯练习要放在稳定时段，孩子累了饿了时先降低要求。',
    pitfalls: ['流程太多导致孩子记不住', '临出门或睡前才开始讲规则']
  }
};

var DEVELOPMENT_PLAY_GUIDE = {
  language: {
    name: '接一句小游戏',
    intro: '家长先说半句，孩子接一句完整话。',
    parentTip: '少纠音，多帮孩子把意思接完整。',
    variation: '熟练后让孩子多加一个原因或感受。'
  },
  sensory: {
    name: '身体侦探小游戏',
    intro: '把身体感觉变成寻找、停住、调整的小任务。',
    parentTip: '先短时间尝试，孩子不舒服时马上降难度。',
    variation: '熟练后换一个环境或增加一个身体动作。'
  },
  focus: {
    name: '任务闯关小游戏',
    intro: '把任务拆成一个小关卡，完成后贴一个完成标记。',
    parentTip: '一次只给一个目标，让孩子看见完成点。',
    variation: '熟练后增加第二个步骤或一次短等待。'
  },
  gross_motor: {
    name: '身体闯关小游戏',
    intro: '用家里的安全空间做走、跳、停、投的小关卡。',
    parentTip: '先稳再快，先低再高，先短再长。',
    variation: '熟练后改变方向、距离或节奏。'
  },
  emotion: {
    name: '情绪小剧场',
    intro: '用角色扮演把情绪、身体动作和替代说法演出来。',
    parentTip: '情绪高时先安抚，平稳后再玩复盘游戏。',
    variation: '熟练后让孩子自己选一个修复办法。'
  },
  social: {
    name: '轮流对话小游戏',
    intro: '家长和孩子轮流演同伴场景，各说一句可用的话。',
    parentTip: '先练一句能用的话，再练等待和回应。',
    variation: '熟练后加入第三个角色或换一个同伴场景。'
  },
  confidence: {
    name: '勇敢一小步',
    intro: '把新尝试拆成看一看、靠近一点、做一下的小台阶。',
    parentTip: '让孩子选择最低难度，完成一小步就收。',
    variation: '熟练后把观众、距离或时长增加一点点。'
  },
  habits: {
    name: '流程打卡小游戏',
    intro: '把生活流程拆成 2 到 3 个动作，完成一个就打一个勾。',
    parentTip: '家长先固定顺序和位置，比反复催促更有效。',
    variation: '熟练后让孩子自己检查下一步。'
  }
};

var DEVELOPMENT_PROFESSIONAL_GUIDE = {
  language: {
    mechanism: '语言表达需要先听懂意思，再把词语排成句子，最后在互动里说出来。',
    parentFocus: '家长重点看孩子能不能接住问题、说出关键词、把一句话补完整。',
    cue: '少追问，多示范一句孩子马上能跟上的说法。'
  },
  sensory: {
    mechanism: '身体感觉处理会影响孩子坐下、等待、用力和接受触碰的状态。',
    parentFocus: '家长重点看声音、触碰、空间变化或身体用力是不是让孩子更难配合。',
    cue: '先给身体一个短动作，再回到安静任务。'
  },
  focus: {
    mechanism: '专注力来自启动、保持、转换和完成几个能力一起配合。',
    parentFocus: '家长重点看孩子卡在开始、坚持、听指令，还是做完收尾。',
    cue: '一次只给一个动作，让孩子看见开始点和完成点。'
  },
  gross_motor: {
    mechanism: '大运动练习靠身体控制、平衡、节奏和空间判断慢慢建立。',
    parentFocus: '家长重点看孩子能不能稳住身体、看清路线、按节奏完成动作。',
    cue: '先稳再快，先近再远，先短再长。'
  },
  emotion: {
    mechanism: '情绪能力从认出感受开始，再学会用语言和动作表达需要。',
    parentFocus: '家长重点看孩子情绪升高前有什么身体信号，以及平稳后能不能复盘。',
    cue: '情绪高时先陪孩子降下来，平稳后再练说法。'
  },
  social: {
    mechanism: '社交能力需要看懂别人、表达自己、等待轮流和冲突后修复。',
    parentFocus: '家长重点看孩子是不知道怎么说，还是不知道怎么等、怎么回应。',
    cue: '先练一句可用的话，再放进真实互动。'
  },
  confidence: {
    mechanism: '自信来自可预期的小成功，孩子需要在安全感里多试一次。',
    parentFocus: '家长重点看孩子害怕的是环境、人、任务难度，还是失败后的感受。',
    cue: '把尝试拆成看一看、靠近一点、做一下。'
  },
  habits: {
    mechanism: '生活习惯靠固定顺序、环境线索和少量提醒慢慢形成。',
    parentFocus: '家长重点看孩子是不知道顺序、容易被打断，还是需要更多时间。',
    cue: '把流程放在固定位置，用 2 到 3 步让孩子能跟上。'
  }
};

function buildAgeGuidance(scenario) {
  var title = scenario.title || '这个练习';
  return [
    {
      ageGroup: '3-4岁',
      guidance: '动作更短、选择更少，先让孩子完成一个小回应。'
    },
    {
      ageGroup: '4-5岁',
      guidance: '加入一句简单表达，让孩子知道下一步要做什么。'
    },
    {
      ageGroup: '5-6岁',
      guidance: '增加复盘和自我提醒，让孩子参与说出自己的办法。'
    }
  ];
}

function buildDifficultySteps(scenario) {
  return [
    '降低难度：把练习缩到 30 秒到 3 分钟，只做最容易的一步。',
    '当前练习：' + (scenario.todayAction || '按今天的小动作做一次。'),
    '进阶一点：孩子能稳定完成后，再增加一次等待、表达或复盘。'
  ];
}

function buildPlayGame(zone, scenario) {
  var guide = DEVELOPMENT_PLAY_GUIDE[zone.code] || DEVELOPMENT_PLAY_GUIDE.habits;
  return {
    name: guide.name,
    setup: '准备一个安静安全的小空间，材料只保留当前练习需要的东西。',
    howToPlay: guide.intro + ' 今天用这个动作开始：' + (scenario.todayAction || '先做最小一步。'),
    parentTip: guide.parentTip,
    variation: guide.variation
  };
}

function buildParentInsight(zone, scenario) {
  var guide = DEVELOPMENT_PROFESSIONAL_GUIDE[zone.code] || DEVELOPMENT_PROFESSIONAL_GUIDE.habits;
  return [
    guide.mechanism,
    '放到“' + (scenario.title || '这个场景') + '”里，先不用急着纠正结果，先看孩子卡在哪一步。',
    guide.parentFocus
  ];
}

function buildPracticePrinciples(zone, scenario) {
  var guide = DEVELOPMENT_PROFESSIONAL_GUIDE[zone.code] || DEVELOPMENT_PROFESSIONAL_GUIDE.habits;
  return [
    '先降低要求：把练习缩小到孩子今天能完成的一小步。',
    '再给清楚提示：' + guide.cue,
    '最后保留成功感：完成后用一句话说出孩子刚才做到了什么。'
  ];
}

function buildAdjustmentSignals(scenario) {
  return [
    '继续当前做法：孩子愿意再试一次，或者提醒后能更快进入练习。',
    '降一档：孩子明显躲开、沉默很久、动作变乱时，把时间缩短，只保留最容易的一步。',
    '进一档：孩子连续两三次能完成当前动作，再增加一点等待、表达或选择。'
  ];
}

function enrichScenario(zone, scenario) {
  var guide = DEVELOPMENT_DEPTH_GUIDE[zone.code] || DEVELOPMENT_DEPTH_GUIDE.habits;
  var enriched = Object.assign({}, scenario);
  enriched.developmentalFocus = enriched.developmentalFocus || guide.focus;
  enriched.parentInsight = enriched.parentInsight || buildParentInsight(zone, enriched);
  enriched.practicePrinciples = enriched.practicePrinciples || buildPracticePrinciples(zone, enriched);
  enriched.ageGuidance = enriched.ageGuidance || buildAgeGuidance(enriched);
  enriched.difficultySteps = enriched.difficultySteps || buildDifficultySteps(enriched);
  enriched.playGame = enriched.playGame || buildPlayGame(zone, enriched);
  enriched.commonPitfalls = enriched.commonPitfalls || guide.pitfalls;
  enriched.safetyBoundary = enriched.safetyBoundary || guide.safety;
  enriched.adjustmentSignals = enriched.adjustmentSignals || buildAdjustmentSignals(enriched);
  enriched.progressSignals = enriched.progressSignals || [
    enriched.observeSignal,
    '同样场景下，孩子需要的提醒次数减少。',
    '孩子能在家长提示后更快回到练习或互动。'
  ].filter(function(item) { return !!item; });
  return enriched;
}

function enrichZone(zone) {
  var copy = Object.assign({}, zone);
  var scenarios = (zone.scenarios || [])
    .concat(EXTRA_DEVELOPMENT_SCENARIOS[zone.code] || [])
    .concat(ADVANCED_DEVELOPMENT_SCENARIOS[zone.code] || [])
    .concat(EXPERT_DEVELOPMENT_SCENARIOS[zone.code] || [])
    .concat(MASTER_DEVELOPMENT_SCENARIOS[zone.code] || [])
    .concat(ELITE_DEVELOPMENT_SCENARIOS[zone.code] || [])
    .concat(ULTIMATE_DEVELOPMENT_SCENARIOS[zone.code] || []);
  copy.scenarios = scenarios.map(function(scenario) {
    return enrichScenario(zone, scenario);
  });
  return copy;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDevelopmentZones() {
  return clone(DEVELOPMENT_ZONES.map(enrichZone));
}

function getDevelopmentZoneByCode(code) {
  var targetCode = String(code || '').trim();
  if (!targetCode) {
    return null;
  }
  var zone = DEVELOPMENT_ZONES.find(function(item) {
    return item.code === targetCode;
  });
  return zone ? clone(enrichZone(zone)) : null;
}

function getDevelopmentScenarios(zoneCode, ageGroup) {
  var zone = getDevelopmentZoneByCode(zoneCode);
  if (!zone) {
    return [];
  }
  var selectedAgeGroup = String(ageGroup || '').trim();
  if (!selectedAgeGroup) {
    return zone.scenarios || [];
  }
  return (zone.scenarios || []).filter(function(scenario) {
    return Array.isArray(scenario.ageGroups) && scenario.ageGroups.indexOf(selectedAgeGroup) >= 0;
  });
}

function getDevelopmentScenario(zoneCode, scenarioCode) {
  var targetScenarioCode = String(scenarioCode || '').trim();
  if (!targetScenarioCode) {
    return null;
  }
  var scenarios = getDevelopmentScenarios(zoneCode);
  var scenario = scenarios.find(function(item) {
    return item.code === targetScenarioCode;
  });
  return scenario ? clone(scenario) : null;
}

function inferDevelopmentAgeGroupFromBirthday(birthday, now) {
  var value = String(birthday || '').trim();
  if (!value) {
    return '';
  }
  var birthDate = new Date(value + 'T00:00:00');
  if (Number.isNaN(birthDate.getTime())) {
    return '';
  }
  var current = now instanceof Date ? now : new Date();
  var months = (current.getFullYear() - birthDate.getFullYear()) * 12 + current.getMonth() - birthDate.getMonth();
  if (current.getDate() < birthDate.getDate()) {
    months -= 1;
  }
  if (months >= 36 && months < 48) {
    return '3-4岁';
  }
  if (months >= 48 && months < 60) {
    return '4-5岁';
  }
  if (months >= 60 && months < 72) {
    return '5-6岁';
  }
  return '';
}

function isDevelopmentAgeGroup(ageGroup) {
  return DEVELOPMENT_AGE_GROUPS.indexOf(String(ageGroup || '').trim()) >= 0;
}

module.exports = {
  DEVELOPMENT_AGE_GROUPS: DEVELOPMENT_AGE_GROUPS,
  getDevelopmentZones: getDevelopmentZones,
  getDevelopmentZoneByCode: getDevelopmentZoneByCode,
  getDevelopmentScenarios: getDevelopmentScenarios,
  getDevelopmentScenario: getDevelopmentScenario,
  inferDevelopmentAgeGroupFromBirthday: inferDevelopmentAgeGroupFromBirthday,
  isDevelopmentAgeGroup: isDevelopmentAgeGroup
};
