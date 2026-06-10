// 儿童发展里程碑评估数据 - 纯前端版本
// 评估数据直接放在小程序本地，无需服务器

const milestoneData = {
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

  getIndicators(ageRange) {
    const indicators = {
      '0-1': [
        { id: 'gm_0_1_1', dimension: 'gross_motor', text: '能抬头并转头（俯卧位）', months: 2 },
        { id: 'gm_0_1_2', dimension: 'gross_motor', text: '能翻身（从仰卧到俯卧）', months: 4 },
        { id: 'gm_0_1_3', dimension: 'gross_motor', text: '能独立坐稳', months: 6 },
        { id: 'gm_0_1_4', dimension: 'gross_motor', text: '能爬行', months: 9 },
        { id: 'gm_0_1_5', dimension: 'gross_motor', text: '能扶着东西站立', months: 10 },
        { id: 'gm_0_1_6', dimension: 'gross_motor', text: '能独立站立片刻', months: 12 },
        { id: 'fm_0_1_1', dimension: 'fine_motor', text: '能握住放入手中的物品', months: 3 },
        { id: 'fm_0_1_2', dimension: 'fine_motor', text: '能主动伸手抓物', months: 5 },
        { id: 'fm_0_1_3', dimension: 'fine_motor', text: '能双手传递物品', months: 7 },
        { id: 'fm_0_1_4', dimension: 'fine_motor', text: '能用拇指和食指捏取小物品', months: 9 },
        { id: 'fm_0_1_5', dimension: 'fine_motor', text: '能用杯子喝水', months: 10 },
        { id: 'fm_0_1_6', dimension: 'fine_motor', text: '能翻书页', months: 12 },
        { id: 'lg_0_1_1', dimension: 'language', text: '能发出"咕咕""啊啊"等元音', months: 3 },
        { id: 'lg_0_1_2', dimension: 'language', text: '能发出"ba""ma"等辅音', months: 6 },
        { id: 'lg_0_1_3', dimension: 'language', text: '能理解"不""再见"等简单词语', months: 9 },
        { id: 'lg_0_1_4', dimension: 'language', text: '能说出第一个有意义的词', months: 12 },
        { id: 'lg_0_1_5', dimension: 'language', text: '能模仿简单的声音', months: 8 },
        { id: 'lg_0_1_6', dimension: 'language', text: '能听懂简单的指令（如"给我"）', months: 10 },
        { id: 'cg_0_1_1', dimension: 'cognitive', text: '能追踪移动的物品', months: 3 },
        { id: 'cg_0_1_2', dimension: 'cognitive', text: '能寻找被藏起来的玩具', months: 8 },
        { id: 'cg_0_1_3', dimension: 'cognitive', text: '能模仿简单的动作（如拍手）', months: 9 },
        { id: 'cg_0_1_4', dimension: 'cognitive', text: '能把东西放入容器中', months: 10 },
        { id: 'cg_0_1_5', dimension: 'cognitive', text: '能指认熟悉的物品', months: 11 },
        { id: 'cg_0_1_6', dimension: 'cognitive', text: '能尝试解决问题', months: 12 },
        { id: 'sc_0_1_1', dimension: 'social', text: '能对人微笑', months: 2 },
        { id: 'sc_0_1_2', dimension: 'social', text: '能认生（对陌生人表现出谨慎）', months: 6 },
        { id: 'sc_0_1_3', dimension: 'social', text: '能与人互动游戏（如躲猫猫）', months: 8 },
        { id: 'sc_0_1_4', dimension: 'social', text: '能挥手告别', months: 10 },
        { id: 'sc_0_1_5', dimension: 'social', text: '能主动寻求关注', months: 9 },
        { id: 'sc_0_1_6', dimension: 'social', text: '能表现出明显的依恋行为', months: 12 },
        { id: 'sl_0_1_1', dimension: 'self_care', text: '能把手指放入口中', months: 3 },
        { id: 'sl_0_1_2', dimension: 'self_care', text: '能自己吃饼干', months: 7 },
        { id: 'sl_0_1_3', dimension: 'self_care', text: '能自己拿着奶瓶喝水', months: 8 },
        { id: 'sl_0_1_4', dimension: 'self_care', text: '能配合穿衣（伸手、伸脚）', months: 10 },
        { id: 'sl_0_1_5', dimension: 'self_care', text: '能自己用勺子（虽然会洒）', months: 12 },
        { id: 'sl_0_1_6', dimension: 'self_care', text: '能自己脱袜子', months: 11 }
      ],

      '1-2': [
        { id: 'gm_1_2_1', dimension: 'gross_motor', text: '能独立行走稳健', months: 13 },
        { id: 'gm_1_2_2', dimension: 'gross_motor', text: '能弯腰捡东西不摔倒', months: 14 },
        { id: 'gm_1_2_3', dimension: 'gross_motor', text: '能上下楼梯（扶着栏杆）', months: 18 },
        { id: 'gm_1_2_4', dimension: 'gross_motor', text: '能踢球', months: 18 },
        { id: 'gm_1_2_5', dimension: 'gross_motor', text: '能双脚跳（原地）', months: 24 },
        { id: 'gm_1_2_6', dimension: 'gross_motor', text: '能骑三轮车（辅助）', months: 24 },
        { id: 'fm_1_2_1', dimension: 'fine_motor', text: '能用蜡笔涂鸦', months: 15 },
        { id: 'fm_1_2_2', dimension: 'fine_motor', text: '能搭积木（4-6块）', months: 18 },
        { id: 'fm_1_2_3', dimension: 'fine_motor', text: '能自己用勺子吃饭', months: 18 },
        { id: 'fm_1_2_4', dimension: 'fine_motor', text: '能翻书（一页一页）', months: 15 },
        { id: 'fm_1_2_5', dimension: 'fine_motor', text: '能旋开瓶盖', months: 20 },
        { id: 'fm_1_2_6', dimension: 'fine_motor', text: '能穿珠子', months: 24 },
        { id: 'lg_1_2_1', dimension: 'language', text: '能说10-20个词', months: 18 },
        { id: 'lg_1_2_2', dimension: 'language', text: '能听懂两步指令', months: 20 },
        { id: 'lg_1_2_3', dimension: 'language', text: '能说2-3个词的句子', months: 24 },
        { id: 'lg_1_2_4', dimension: 'language', text: '能指认身体部位', months: 18 },
        { id: 'lg_1_2_5', dimension: 'language', text: '能说出自己的名字', months: 22 },
        { id: 'lg_1_2_6', dimension: 'language', text: '能简单对话（问答）', months: 24 },
        { id: 'cg_1_2_1', dimension: 'cognitive', text: '能按颜色、形状分类', months: 20 },
        { id: 'cg_1_2_2', dimension: 'cognitive', text: '能理解"一个"和"许多"', months: 18 },
        { id: 'cg_1_2_3', dimension: 'cognitive', text: '能模仿大人的简单动作', months: 15 },
        { id: 'cg_1_2_4', dimension: 'cognitive', text: '能完成简单的拼图', months: 22 },
        { id: 'cg_1_2_5', dimension: 'cognitive', text: '能记住最近发生的事', months: 24 },
        { id: 'cg_1_2_6', dimension: 'cognitive', text: '能按大小排列物品', months: 24 },
        { id: 'sc_1_2_1', dimension: 'social', text: '能与其他孩子平行游戏', months: 18 },
        { id: 'sc_1_2_2', dimension: 'social', text: '能表现出分享行为（偶尔）', months: 20 },
        { id: 'sc_1_2_3', dimension: 'social', text: '能表达"mine"（我的）', months: 18 },
        { id: 'sc_1_2_4', dimension: 'social', text: '能模仿其他孩子的行为', months: 22 },
        { id: 'sc_1_2_5', dimension: 'social', text: '能主动寻求同伴玩耍', months: 24 },
        { id: 'sc_1_2_6', dimension: 'social', text: '能表达简单的情感（喜欢/不喜欢）', months: 20 },
        { id: 'sl_1_2_1', dimension: 'self_care', text: '能自己用勺子吃饭（较少洒出）', months: 18 },
        { id: 'sl_1_2_2', dimension: 'self_care', text: '能自己脱衣服（简单的）', months: 20 },
        { id: 'sl_1_2_3', dimension: 'self_care', text: '能自己洗手（需要帮忙擦干）', months: 22 },
        { id: 'sl_1_2_4', dimension: 'self_care', text: '能自己上厕所（需要提醒）', months: 24 },
        { id: 'sl_1_2_5', dimension: 'self_care', text: '能自己穿脱鞋子', months: 22 },
        { id: 'sl_1_2_6', dimension: 'self_care', text: '能自己刷牙（需要监督）', months: 24 }
      ],

      '2-3': [
        { id: 'gm_2_3_1', dimension: 'gross_motor', text: '能双脚连续跳', months: 30 },
        { id: 'gm_2_3_2', dimension: 'gross_motor', text: '能单脚站立2-3秒', months: 30 },
        { id: 'gm_2_3_3', dimension: 'gross_motor', text: '能骑三轮车（熟练）', months: 36 },
        { id: 'gm_2_3_4', dimension: 'gross_motor', text: '能上下楼梯交替迈步', months: 36 },
        { id: 'gm_2_3_5', dimension: 'gross_motor', text: '能扔球并接住', months: 32 },
        { id: 'gm_2_3_6', dimension: 'gross_motor', text: '能走平衡木', months: 36 },
        { id: 'fm_2_3_1', dimension: 'fine_motor', text: '能画简单的图形（圆形、十字）', months: 30 },
        { id: 'fm_2_3_2', dimension: 'fine_motor', text: '能使用剪刀（剪直线）', months: 36 },
        { id: 'fm_2_3_3', dimension: 'fine_motor', text: '能搭积木（8-10块）', months: 32 },
        { id: 'fm_2_3_4', dimension: 'fine_motor', text: '能系扣子', months: 36 },
        { id: 'fm_2_3_5', dimension: 'fine_motor', text: '能折纸（简单对折）', months: 34 },
        { id: 'fm_2_3_6', dimension: 'fine_motor', text: '能临摹简单图形', months: 36 },
        { id: 'lg_2_3_1', dimension: 'language', text: '能说完整的句子', months: 30 },
        { id: 'lg_2_3_2', dimension: 'language', text: '能听懂故事并回答简单问题', months: 32 },
        { id: 'lg_2_3_3', dimension: 'language', text: '能背诵儿歌', months: 36 },
        { id: 'lg_2_3_4', dimension: 'language', text: '能正确使用"你、我、他"', months: 30 },
        { id: 'lg_2_3_5', dimension: 'language', text: '能讲述简单的事情经过', months: 36 },
        { id: 'lg_2_3_6', dimension: 'language', text: '词汇量达到200-300个', months: 36 },
        { id: 'cg_2_3_1', dimension: 'cognitive', text: '能数1-10', months: 30 },
        { id: 'cg_2_3_2', dimension: 'cognitive', text: '能按大小、颜色分类', months: 32 },
        { id: 'cg_2_3_3', dimension: 'cognitive', text: '能理解"一样多""更多""更少"', months: 34 },
        { id: 'cg_2_3_4', dimension: 'cognitive', text: '能完成6-8块拼图', months: 36 },
        { id: 'cg_2_3_5', dimension: 'cognitive', text: '能按规律排序（ABAB模式）', months: 36 },
        { id: 'cg_2_3_6', dimension: 'cognitive', text: '能记住3-4个指令', months: 36 },
        { id: 'sc_2_3_1', dimension: 'social', text: '能与其他孩子一起玩（合作游戏）', months: 30 },
        { id: 'sc_2_3_2', dimension: 'social', text: '能轮流和等待', months: 32 },
        { id: 'sc_2_3_3', dimension: 'social', text: '能表达同情（安慰他人）', months: 34 },
        { id: 'sc_2_3_4', dimension: 'social', text: '能参与角色扮演游戏', months: 36 },
        { id: 'sc_2_3_5', dimension: 'social', text: '能理解简单的规则', months: 34 },
        { id: 'sc_2_3_6', dimension: 'social', text: '能主动帮助其他孩子', months: 36 },
        { id: 'sl_2_3_1', dimension: 'self_care', text: '能自己穿衣服（简单的）', months: 30 },
        { id: 'sl_2_3_2', dimension: 'self_care', text: '能自己上厕所（独立完成）', months: 36 },
        { id: 'sl_2_3_3', dimension: 'self_care', text: '能自己洗手并擦干', months: 32 },
        { id: 'sl_2_3_4', dimension: 'self_care', text: '能自己吃饭（不用帮忙）', months: 34 },
        { id: 'sl_2_3_5', dimension: 'self_care', text: '能自己穿脱鞋子', months: 30 },
        { id: 'sl_2_3_6', dimension: 'self_care', text: '能自己整理玩具', months: 36 }
      ],

      '3-4': [
        { id: 'gm_3_4_1', dimension: 'gross_motor', text: '能双脚连续跳10次以上', months: 42 },
        { id: 'gm_3_4_2', dimension: 'gross_motor', text: '能单脚站立5秒以上', months: 42 },
        { id: 'gm_3_4_3', dimension: 'gross_motor', text: '能骑三轮车（熟练转弯）', months: 48 },
        { id: 'gm_3_4_4', dimension: 'gross_motor', text: '能投掷并击中目标', months: 46 },
        { id: 'gm_3_4_5', dimension: 'gross_motor', text: '能沿着直线走', months: 48 },
        { id: 'gm_3_4_6', dimension: 'gross_motor', text: '能滑滑梯（独立上下）', months: 40 },
        { id: 'fm_3_4_1', dimension: 'fine_motor', text: '能画出简单的人像（头、身体、四肢）', months: 48 },
        { id: 'fm_3_4_2', dimension: 'fine_motor', text: '能使用剪刀剪曲线', months: 46 },
        { id: 'fm_3_4_3', dimension: 'fine_motor', text: '能写出自己的名字（模仿）', months: 48 },
        { id: 'fm_3_4_4', dimension: 'fine_motor', text: '能系鞋带（简单蝴蝶结）', months: 48 },
        { id: 'fm_3_4_5', dimension: 'fine_motor', text: '能临摹复杂图形', months: 44 },
        { id: 'fm_3_4_6', dimension: 'fine_motor', text: '能画封闭图形', months: 42 },
        { id: 'lg_3_4_1', dimension: 'language', text: '能讲述完整的故事（有开头、中间、结尾）', months: 48 },
        { id: 'lg_3_4_2', dimension: 'language', text: '能正确使用过去时和未来时', months: 44 },
        { id: 'lg_3_4_3', dimension: 'language', text: '能回答"为什么"的问题', months: 46 },
        { id: 'lg_3_4_4', dimension: 'language', text: '词汇量达到1000个以上', months: 48 },
        { id: 'lg_3_4_5', dimension: 'language', text: '能使用复杂的句子', months: 48 },
        { id: 'lg_3_4_6', dimension: 'language', text: '能理解并执行多步骤指令', months: 48 },
        { id: 'cg_3_4_1', dimension: 'cognitive', text: '能数1-20', months: 44 },
        { id: 'cg_3_4_2', dimension: 'cognitive', text: '能理解"第一""第二""最后"', months: 46 },
        { id: 'cg_3_4_3', dimension: 'cognitive', text: '能进行简单的分类（多标准）', months: 48 },
        { id: 'cg_3_4_4', dimension: 'cognitive', text: '能完成12-15块拼图', months: 48 },
        { id: 'cg_3_4_5', dimension: 'cognitive', text: '能进行简单的逻辑推理', months: 48 },
        { id: 'cg_3_4_6', dimension: 'cognitive', text: '能记住并复述3-4个物品', months: 44 },
        { id: 'sc_3_4_1', dimension: 'social', text: '能与朋友合作完成项目', months: 46 },
        { id: 'sc_3_4_2', dimension: 'social', text: '能解决简单的同伴冲突', months: 48 },
        { id: 'sc_3_4_3', dimension: 'social', text: '能表达自己的感受和需求', months: 44 },
        { id: 'sc_3_4_4', dimension: 'social', text: '能理解并遵守游戏规则', months: 48 },
        { id: 'sc_3_4_5', dimension: 'social', text: '能主动结交新朋友', months: 46 },
        { id: 'sc_3_4_6', dimension: 'social', text: '能站在他人角度思考问题', months: 48 },
        { id: 'sl_3_4_1', dimension: 'self_care', text: '能自己穿衣服（包括扣子、拉链）', months: 46 },
        { id: 'sl_3_4_2', dimension: 'self_care', text: '能自己刷牙（需要检查）', months: 44 },
        { id: 'sl_3_4_3', dimension: 'self_care', text: '能自己洗脸', months: 42 },
        { id: 'sl_3_4_4', dimension: 'self_care', text: '能自己整理床铺', months: 48 },
        { id: 'sl_3_4_5', dimension: 'self_care', text: '能帮忙摆放餐具', months: 44 },
        { id: 'sl_3_4_6', dimension: 'self_care', text: '能自己选择衣服并穿上', months: 48 }
      ],

      '4-5': [
        { id: 'gm_4_5_1', dimension: 'gross_motor', text: '能单脚跳3-5步', months: 54 },
        { id: 'gm_4_5_2', dimension: 'gross_motor', text: '能跳绳（初学）', months: 60 },
        { id: 'gm_4_5_3', dimension: 'gross_motor', text: '能准确投掷并击中目标', months: 58 },
        { id: 'gm_4_5_4', dimension: 'gross_motor', text: '能游泳（基本动作）', months: 60 },
        { id: 'gm_4_5_5', dimension: 'gross_motor', text: '能骑自行车（两轮）', months: 60 },
        { id: 'gm_4_5_6', dimension: 'gross_motor', text: '能连续跑200米以上', months: 56 },
        { id: 'fm_4_5_1', dimension: 'fine_motor', text: '能写出清晰的字母和数字', months: 58 },
        { id: 'fm_4_5_2', dimension: 'fine_motor', text: '能画出详细的图画（有背景）', months: 60 },
        { id: 'fm_4_5_3', dimension: 'fine_motor', text: '能使用工具（锤子、螺丝刀）', months: 56 },
        { id: 'fm_4_5_4', dimension: 'fine_motor', text: '能折纸（复杂形状）', months: 58 },
        { id: 'fm_4_5_5', dimension: 'fine_motor', text: '能穿针引线', months: 60 },
        { id: 'fm_4_5_6', dimension: 'fine_motor', text: '能使用电脑鼠标', months: 58 },
        { id: 'lg_4_5_1', dimension: 'language', text: '能清晰表达复杂的想法', months: 58 },
        { id: 'lg_4_5_2', dimension: 'language', text: '能使用比喻和类比', months: 60 },
        { id: 'lg_4_5_3', dimension: 'language', text: '能讲故事并吸引听众', months: 58 },
        { id: 'lg_4_5_4', dimension: 'language', text: '词汇量达到2000个以上', months: 60 },
        { id: 'lg_4_5_5', dimension: 'language', text: '能理解双关语和笑话', months: 60 },
        { id: 'lg_4_5_6', dimension: 'language', text: '能进行有深度的对话', months: 60 },
        { id: 'cg_4_5_1', dimension: 'cognitive', text: '能进行简单的加减法', months: 56 },
        { id: 'cg_4_5_2', dimension: 'cognitive', text: '能理解时间的概念（昨天、今天、明天）', months: 58 },
        { id: 'cg_4_5_3', dimension: 'cognitive', text: '能进行简单的科学实验', months: 60 },
        { id: 'cg_4_5_4', dimension: 'cognitive', text: '能进行分类和比较（多维度）', months: 58 },
        { id: 'cg_4_5_5', dimension: 'cognitive', text: '能解决问题（多步骤）', months: 60 },
        { id: 'cg_4_5_6', dimension: 'cognitive', text: '能记住并复述故事', months: 60 },
        { id: 'sc_4_5_1', dimension: 'social', text: '能领导游戏并分配角色', months: 58 },
        { id: 'sc_4_5_2', dimension: 'social', text: '能处理复杂的同伴关系', months: 60 },
        { id: 'sc_4_5_3', dimension: 'social', text: '能理解并遵守复杂的规则', months: 58 },
        { id: 'sc_4_5_4', dimension: 'social', text: '能表达不同意见（有礼貌）', months: 60 },
        { id: 'sc_4_5_5', dimension: 'social', text: '能合作完成复杂的项目', months: 60 },
        { id: 'sc_4_5_6', dimension: 'social', text: '能理解和尊重他人的感受', months: 60 },
        { id: 'sl_4_5_1', dimension: 'self_care', text: '能自己准备上学（整理书包）', months: 56 },
        { id: 'sl_4_5_2', dimension: 'self_care', text: '能自己洗澡（需要监督）', months: 58 },
        { id: 'sl_4_5_3', dimension: 'self_care', text: '能自己梳头发', months: 56 },
        { id: 'sl_4_5_4', dimension: 'self_care', text: '能自己铺床', months: 58 },
        { id: 'sl_4_5_5', dimension: 'self_care', text: '能帮家人做简单的家务', months: 60 },
        { id: 'sl_4_5_6', dimension: 'self_care', text: '能自己决定穿什么衣服', months: 58 }
      ],

      '5-6': [
        { id: 'gm_5_6_1', dimension: 'gross_motor', text: '能跳绳连续50次以上', months: 66 },
        { id: 'gm_5_6_2', dimension: 'gross_motor', text: '能游泳25米以上', months: 68 },
        { id: 'gm_5_6_3', dimension: 'gross_motor', text: '能准确投掷并击中移动目标', months: 70 },
        { id: 'gm_5_6_4', dimension: 'gross_motor', text: '能骑自行车（熟练）', months: 66 },
        { id: 'gm_5_6_5', dimension: 'gross_motor', text: '能进行简单的球类运动', months: 72 },
        { id: 'gm_5_6_6', dimension: 'gross_motor', text: '能长时间跑步（400米以上）', months: 72 },
        { id: 'fm_5_6_1', dimension: 'fine_motor', text: '能写出整齐的汉字', months: 70 },
        { id: 'fm_5_6_2', dimension: 'fine_motor', text: '能画出透视感的图画', months: 72 },
        { id: 'fm_5_6_3', dimension: 'fine_motor', text: '能使用多种工具', months: 68 },
        { id: 'fm_5_6_4', dimension: 'fine_motor', text: '能制作复杂的手工作品', months: 70 },
        { id: 'fm_5_6_5', dimension: 'fine_motor', text: '能使用键盘打字', months: 72 },
        { id: 'fm_5_6_6', dimension: 'fine_motor', text: '能进行精细的涂鸦和设计', months: 72 },
        { id: 'lg_5_6_1', dimension: 'language', text: '能流利阅读简单的故事书', months: 68 },
        { id: 'lg_5_6_2', dimension: 'language', text: '能写出简单的短文', months: 70 },
        { id: 'lg_5_6_3', dimension: 'language', text: '能使用丰富的词汇表达', months: 68 },
        { id: 'lg_5_6_4', dimension: 'language', text: '词汇量达到3000个以上', months: 72 },
        { id: 'lg_5_6_5', dimension: 'language', text: '能进行辩论（简单）', months: 72 },
        { id: 'lg_5_6_6', dimension: 'language', text: '能理解和使用成语', months: 72 },
        { id: 'cg_5_6_1', dimension: 'cognitive', text: '能进行100以内的加减法', months: 70 },
        { id: 'cg_5_6_2', dimension: 'cognitive', text: '能理解乘法和除法的概念', months: 72 },
        { id: 'cg_5_6_3', dimension: 'cognitive', text: '能进行逻辑推理', months: 70 },
        { id: 'cg_5_6_4', dimension: 'cognitive', text: '能进行科学探究', months: 72 },
        { id: 'cg_5_6_5', dimension: 'cognitive', text: '能进行抽象思维', months: 72 },
        { id: 'cg_5_6_6', dimension: 'cognitive', text: '能进行批判性思考', months: 72 },
        { id: 'sc_5_6_1', dimension: 'social', text: '能处理复杂的社交情境', months: 70 },
        { id: 'sc_5_6_2', dimension: 'social', text: '能进行团队合作（复杂项目）', months: 72 },
        { id: 'sc_5_6_3', dimension: 'social', text: '能理解和处理冲突', months: 70 },
        { id: 'sc_5_6_4', dimension: 'social', text: '能表达复杂的情感', months: 72 },
        { id: 'sc_5_6_5', dimension: 'social', text: '能进行有效的沟通', months: 72 },
        { id: 'sc_5_6_6', dimension: 'social', text: '能理解和尊重文化差异', months: 72 },
        { id: 'sl_5_6_1', dimension: 'self_care', text: '能独立上学（短距离）', months: 68 },
        { id: 'sl_5_6_2', dimension: 'self_care', text: '能自己洗澡并擦干', months: 70 },
        { id: 'sl_5_6_3', dimension: 'self_care', text: '能自己准备简单的食物', months: 70 },
        { id: 'sl_5_6_4', dimension: 'self_care', text: '能自己整理房间', months: 68 },
        { id: 'sl_5_6_5', dimension: 'self_care', text: '能自己管理时间', months: 72 },
        { id: 'sl_5_6_6', dimension: 'self_care', text: '能自己处理简单的日常事务', months: 72 }
      ]
    };

    return indicators[ageRange] || [];
  },

  calculateResults(ageRange, answers) {
    const indicators = this.getIndicators(ageRange);
    const dimensionMap = {};
    
    // 初始化维度得分
    this.dimensions.forEach(dim => {
      dimensionMap[dim.id] = { score: 0, total: 0 };
    });

    // 计算各维度得分
    indicators.forEach(indicator => {
      if (answers[indicator.id]) {
        dimensionMap[indicator.dimension].score++;
      }
      dimensionMap[indicator.dimension].total++;
    });

    // 计算百分比
    let totalScore = 0;
    let totalItems = 0;
    const dimensionResults = this.dimensions.map(dim => {
      const score = dimensionMap[dim.id].score;
      const total = dimensionMap[dim.id].total;
      totalScore += score;
      totalItems += total;
      
      return {
        ...dim,
        score,
        total,
        percentage: total > 0 ? Math.round((score / total) * 100) : 0
      };
    });

    const overallPercentage = totalItems > 0 ? Math.round((totalScore / totalItems) * 100) : 0;

    return {
      overallPercentage,
      totalScore,
      totalItems,
      dimensionResults
    };
  },

  getResultLevel(overallPercentage) {
    if (overallPercentage >= 85) {
      return {
        name: '发展表现突出',
        tone: 'strong',
        description: '多数能力已达到当前年龄段常见发展表现，可以在兴趣探索和综合任务中继续拓展。'
      };
    }

    if (overallPercentage >= 70) {
      return {
        name: '发展整体良好',
        tone: 'steady',
        description: '整体发展处于较稳定状态，建议结合孩子兴趣持续观察并加强薄弱维度。'
      };
    }

    if (overallPercentage >= 55) {
      return {
        name: '建议持续关注',
        tone: 'attention',
        description: '部分维度需要更多家庭支持，建议通过日常游戏和亲子互动逐步练习。'
      };
    }

    return {
      name: '建议重点关注',
      tone: 'focus',
      description: '多个维度需要进一步观察，建议结合日常表现记录，并咨询儿保医生或专业机构。'
    };
  },

  getDimensionSummary(dimensionResults) {
    const sortedByHigh = [...dimensionResults].sort((a, b) => b.percentage - a.percentage);
    const sortedByLow = [...dimensionResults].sort((a, b) => a.percentage - b.percentage);
    const strengths = sortedByHigh.filter(item => item.percentage >= 80).slice(0, 2);
    const focusAreas = sortedByLow.filter(item => item.percentage < 75).slice(0, 2);

    return {
      strengths: strengths.length > 0 ? strengths : sortedByHigh.slice(0, 1),
      focusAreas: focusAreas.length > 0 ? focusAreas : sortedByLow.slice(0, 1)
    };
  },

  getPracticeSuggestions(dimensionResults) {
    const adviceMap = {
      gross_motor: ['每天安排10分钟追逐、跳跃或平衡游戏', '在安全环境中练习上下台阶和跨越障碍', '用球类游戏练习投掷、接球和身体协调'],
      fine_motor: ['准备积木、穿珠、夹夹子等手部游戏', '鼓励孩子涂鸦、描线、撕贴和折纸', '让孩子参与扣扣子、拉拉链等生活动作'],
      language: ['每天固定亲子共读并请孩子复述画面', '用开放式问题引导孩子说完整句子', '在吃饭、洗澡、外出时多做物品命名和描述'],
      cognitive: ['用分类、配对、排序游戏训练观察和推理', '让孩子参与简单家务并说出步骤顺序', '通过拼图、找不同、数数游戏建立问题解决经验'],
      social: ['安排轮流、等待、合作类亲子游戏', '用角色扮演练习表达需求和解决冲突', '在真实场景中示范分享、道歉和感谢'],
      self_care: ['把穿衣、洗手、收玩具拆成小步骤练习', '给孩子固定的家庭小任务建立责任感', '用图示流程帮助孩子独立完成日常事务']
    };

    const targets = [...dimensionResults]
      .sort((a, b) => a.percentage - b.percentage)
      .filter(item => item.percentage < 85)
      .slice(0, 3);

    const selected = targets.length > 0 ? targets : [...dimensionResults].sort((a, b) => a.percentage - b.percentage).slice(0, 2);

    return selected.map(item => ({
      dimensionId: item.id,
      name: item.name,
      color: item.color,
      items: adviceMap[item.id] || []
    }));
  },

  getProfessionalNotes() {
    return [
      '本评估用于家庭日常观察参考，不能替代医学诊断或专业测评。',
      '如果孩子出现能力倒退、语言明显停滞、长期回避眼神交流等情况，建议及时咨询儿保医生。',
      '单次结果受状态、环境和家长观察角度影响，建议间隔4-8周后再次观察。'
    ];
  },

  generateReport(results) {
    const dimensionSummary = this.getDimensionSummary(results.dimensionResults);

    return {
      resultLevel: this.getResultLevel(results.overallPercentage),
      strengths: dimensionSummary.strengths,
      focusAreas: dimensionSummary.focusAreas,
      practiceSuggestions: this.getPracticeSuggestions(results.dimensionResults),
      professionalNotes: this.getProfessionalNotes()
    };
  },

  // 保存评估历史到本地存储
  saveHistory(assessment) {
    try {
      const history = wx.getStorageSync('milestone_history') || [];
      history.unshift({
        ...assessment,
        id: Date.now(),
        created_at: new Date().toISOString()
      });
      // 只保留最近20条
      if (history.length > 20) {
        history.length = 20;
      }
      wx.setStorageSync('milestone_history', history);
      return true;
    } catch (e) {
      console.error('保存评估历史失败:', e);
      return false;
    }
  },

  // 获取评估历史
  getHistory() {
    try {
      return wx.getStorageSync('milestone_history') || [];
    } catch (e) {
      console.error('获取评估历史失败:', e);
      return [];
    }
  }
};

module.exports = milestoneData;
