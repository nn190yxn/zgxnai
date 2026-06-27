const API_BASE = window.__ADMIN_API_BASE__ || '/admin-api/v1';
const AUTH_STORAGE_KEY = 'niuniu-admin-token';

const state = {
  token: localStorage.getItem(AUTH_STORAGE_KEY) || '',
  admin: null,
  activeSegmentKey: '',
  activeSegmentMeta: null,
  currentSegmentUsers: [],
  segmentUsersByKey: {},
  segmentFilters: {
    expiringOnly: false,
    highActivityOnly: false
  }
};

const authStateText = document.getElementById('authStateText');
const apiBaseText = document.getElementById('apiBaseText');
const loginHint = document.getElementById('loginHint');
const loginForm = document.getElementById('loginForm');
const refreshButton = document.getElementById('refreshButton');
const demoButton = document.getElementById('demoButton');
const changePasswordButton = document.getElementById('changePasswordButton');
const passwordModal = document.getElementById('passwordModal');
const closePasswordModalButton = document.getElementById('closePasswordModalButton');
const passwordForm = document.getElementById('passwordForm');
const passwordHint = document.getElementById('passwordHint');

const demoSnapshot = {
  me: {
    id: 1,
    username: 'demo_admin',
    display_name: '演示账号',
    role: 'super_admin'
  },
  overview: {
    users: {
      total_users: 18642,
      today_new_users: 182,
      dau: 2316,
      wau: 8012,
      mau: 15428
    },
    memberships: {
      active_memberships: 3240,
      trial_memberships: 426,
      month_memberships: 1748,
      quarter_memberships: 702,
      year_memberships: 364
    },
    revenue: {
      total_revenue: 428630.5,
      today_revenue: 3900,
      today_paid_order_count: 37
    },
    family: {
      total_children: 9426,
      families_with_children: 8218,
      avg_children_per_family: 1.15,
      child_profile_penetration: 44.08
    },
    operations: {
      active_membership_rate: 17.38,
      paid_user_penetration: 28.64,
      arppu: 131.12,
      average_order_value: 104.71
    }
  },
  membershipStructure: [
    { key: 'month', label: '月会员', count: 1748, percentage: 53.95 },
    { key: 'quarter', label: '季会员', count: 702, percentage: 21.67 },
    { key: 'year', label: '年会员', count: 364, percentage: 11.23 },
    { key: 'trial', label: '试用会员', count: 426, percentage: 13.15 }
  ],
  childAgeDistribution: [
    { key: '0-1', label: '0-1岁', count: 1368, percentage: 14.51 },
    { key: '1-2', label: '1-2岁', count: 1942, percentage: 20.60 },
    { key: '2-3', label: '2-3岁', count: 1766, percentage: 18.74 },
    { key: '3-4', label: '3-4岁', count: 1620, percentage: 17.19 },
    { key: '4-6', label: '4-6岁', count: 2018, percentage: 21.41 },
    { key: '6+', label: '6岁以上', count: 564, percentage: 5.98 },
    { key: 'unknown', label: '年龄待补充', count: 148, percentage: 1.57 }
  ],
  childGenderDistribution: [
    { key: 'male', label: '男孩', count: 4862, percentage: 51.58 },
    { key: 'female', label: '女孩', count: 4290, percentage: 45.51 },
    { key: 'unknown', label: '性别待补充', count: 274, percentage: 2.91 }
  ],
  conversionFunnel: [
    { key: 'registered', label: '注册用户', count: 18642, conversion_rate: 100, total_rate: 100 },
    { key: 'active30d', label: '近30天活跃', count: 15428, conversion_rate: 82.76, total_rate: 82.76 },
    { key: 'order30d', label: '近30天下单', count: 612, conversion_rate: 3.97, total_rate: 3.28 },
    { key: 'paid30d', label: '近30天支付', count: 428, conversion_rate: 69.93, total_rate: 2.30 }
  ],
  membershipLifecycle: {
    expiring_in_7_days: 186,
    expiring_in_30_days: 642,
    auto_renew_on: 2418,
    auto_renew_off: 822,
    active_trials: 426,
    expiring_trials: 96,
    auto_renew_on_rate: 74.63,
    expiring_7_days_rate: 5.74
  },
  ageFeaturePreferences: [
    {
      age_key: '1-2',
      age_label: '1-2岁',
      items: [
        { feature_key: 'nutrition_recipe', feature_label: '营养食谱', user_count: 824, event_count: 1860 },
        { feature_key: 'ai_chat', feature_label: 'AI 问答', user_count: 612, event_count: 1204 },
        { feature_key: 'membership', feature_label: '会员页', user_count: 284, event_count: 522 }
      ]
    },
    {
      age_key: '3-4',
      age_label: '3-4岁',
      items: [
        { feature_key: 'assessment', feature_label: '成长测评', user_count: 902, event_count: 1744 },
        { feature_key: 'reading_tasks', feature_label: '阅读任务', user_count: 648, event_count: 1318 },
        { feature_key: 'ai_chat', feature_label: 'AI 问答', user_count: 406, event_count: 822 }
      ]
    },
    {
      age_key: '4-6',
      age_label: '4-6岁',
      items: [
        { feature_key: 'reading_tasks', feature_label: '阅读任务', user_count: 1186, event_count: 2460 },
        { feature_key: 'assessment', feature_label: '成长测评', user_count: 932, event_count: 1894 },
        { feature_key: 'membership', feature_label: '会员页', user_count: 366, event_count: 706 }
      ]
    }
  ],
  featureConversion: [
    { feature_key: 'membership', feature_users: 812, paid_users: 214, conversion_rate: 26.35 },
    { feature_key: 'assessment', feature_users: 1326, paid_users: 248, conversion_rate: 18.70 },
    { feature_key: 'ai_chat', feature_users: 1194, paid_users: 186, conversion_rate: 15.58 },
    { feature_key: 'reading_tasks', feature_users: 986, paid_users: 132, conversion_rate: 13.39 }
  ],
  weeklyInsights: {
    cards: [
      {
        key: 'feature_low_conversion',
        title: '高流量低转化功能',
        priority: 'high',
        summary: 'AI 问答近一周浏览 4124 次，会员转化 186 次。',
        metric: '4.51%',
        metric_label: '浏览转会员转化率',
        recommendation: '优先检查 AI 问答到会员页之间的承接文案、按钮位置和权益说明。',
        evidence: '统计区间 2026-06-08 至 2026-06-14'
      },
      {
        key: 'content_low_completion',
        title: '高浏览低完成内容',
        priority: 'medium',
        summary: '近一周有 928 位内容用户，内容相关事件 1586 次，其中 1218 次带有可分析明细。',
        metric: '76.80%',
        metric_label: '内容埋点明细覆盖率',
        recommendation: '优先补齐内容浏览与完成埋点中的 content_type 和 content_id，随后继续观察具体内容完成率。',
        evidence: '当前仍有 368 次内容事件缺少明细。缺失最多的是 task_complete(196)、knowledge_detail_view(118)、retell_complete(54)。'
      },
      {
        key: 'membership_recall',
        title: '会员到期召回提醒',
        priority: 'high',
        summary: '未来 7 天内有 186 位有效会员即将到期且未开启自动续费，另有 96 位试用用户临近结束。',
        metric: '5.74%',
        metric_label: '近到期会员占比',
        recommendation: '优先触达到期前 3 天的用户，突出续费权益和已解锁能力内容。',
        evidence: '当前有效会员 3240 位'
      }
    ]
  },
  userSegments: [
    { key: 'high_value_paid', label: '高价值付费用户', description: '累计支付金额较高或已支付 2 单及以上，适合重点维系和转介绍。', count: 268, percentage: 1.44 },
    { key: 'churn_risk', label: '即将流失会员', description: '7 天内到期且未开启自动续费，适合重点召回。', count: 132, percentage: 0.71 },
    { key: 'paid_low_activity', label: '低活跃付费用户', description: '已经付费，但近 14 天没有活跃行为，适合做使用唤醒。', count: 314, percentage: 1.68 },
    { key: 'active_unpaid', label: '高活跃未付费用户', description: '近 14 天活跃但还没有付费，适合做转化承接。', count: 1628, percentage: 8.73 },
    { key: 'active_trial', label: '活跃试用用户', description: '当前试用中且近 7 天活跃，适合做试用转付费。', count: 208, percentage: 1.12 }
  ],
  segmentUsersByKey: {
    active_unpaid: {
      segment: { key: 'active_unpaid', label: '高活跃未付费用户', description: '近 14 天活跃但还没有付费，适合做转化承接。' },
      items: [
        { id: 1001, nickname: '贵阳妈妈A', child_name: '小满', child_age_label: '3-4岁', membership_type: 'free', current_plan: 'free', current_end_date: null, auto_renew: false, total_paid_amount: 0, paid_order_count: 0, last_active_at: '2026-06-14 20:18:00', active_event_count_14d: 18, created_at: '2026-05-20 10:12:00', suggested_action: '优先推荐试用转会员权益，承接高意向用户。', action_priority: 'high' },
        { id: 1028, nickname: '云岩爸爸B', child_name: '安安', child_age_label: '4-6岁', membership_type: 'free', current_plan: 'free', current_end_date: null, auto_renew: false, total_paid_amount: 0, paid_order_count: 0, last_active_at: '2026-06-14 18:36:00', active_event_count_14d: 15, created_at: '2026-05-25 14:08:00', suggested_action: '优先推荐试用转会员权益，承接高意向用户。', action_priority: 'high' },
        { id: 1086, nickname: '花溪家长C', child_name: '果果', child_age_label: '1-2岁', membership_type: 'free', current_plan: 'free', current_end_date: null, auto_renew: false, total_paid_amount: 0, paid_order_count: 0, last_active_at: '2026-06-13 21:42:00', active_event_count_14d: 13, created_at: '2026-06-01 09:22:00', suggested_action: '结合最近活跃模块推送限时会员权益。', action_priority: 'medium' }
      ]
    },
    high_value_paid: {
      segment: { key: 'high_value_paid', label: '高价值付费用户', description: '累计支付金额较高或已支付 2 单及以上，适合重点维系和转介绍。' },
      items: [
        { id: 821, nickname: '南明妈妈D', child_name: '沐沐', child_age_label: '4-6岁', membership_type: 'year', current_plan: 'year', current_end_date: '2027-03-21 23:59:59', auto_renew: true, total_paid_amount: 698, paid_order_count: 3, last_active_at: '2026-06-14 17:04:00', active_event_count_14d: 12, created_at: '2026-01-18 11:00:00', suggested_action: '安排高价值会员回访，优先引导转介绍或续费升级。', action_priority: 'high' },
        { id: 906, nickname: '观山湖爸爸E', child_name: '糖糖', child_age_label: '2-3岁', membership_type: 'quarter', current_plan: 'quarter', current_end_date: '2026-08-30 23:59:59', auto_renew: false, total_paid_amount: 258, paid_order_count: 2, last_active_at: '2026-06-13 19:26:00', active_event_count_14d: 9, created_at: '2026-02-06 08:45:00', suggested_action: '推送专属陪跑内容，强化会员价值感知。', action_priority: 'medium' }
      ]
    }
  },
  userTrends: {
    items: [
      { stat_date: '2026-06-01', new_users: 108, active_users: 1822, paid_active_users: 352, ai_users: 468 },
      { stat_date: '2026-06-02', new_users: 126, active_users: 1916, paid_active_users: 368, ai_users: 492 },
      { stat_date: '2026-06-03', new_users: 132, active_users: 1887, paid_active_users: 379, ai_users: 505 },
      { stat_date: '2026-06-04', new_users: 141, active_users: 1962, paid_active_users: 381, ai_users: 521 },
      { stat_date: '2026-06-05', new_users: 149, active_users: 2058, paid_active_users: 394, ai_users: 566 },
      { stat_date: '2026-06-06', new_users: 164, active_users: 2160, paid_active_users: 421, ai_users: 612 },
      { stat_date: '2026-06-07', new_users: 158, active_users: 2124, paid_active_users: 413, ai_users: 598 },
      { stat_date: '2026-06-08', new_users: 152, active_users: 2080, paid_active_users: 405, ai_users: 574 },
      { stat_date: '2026-06-09', new_users: 166, active_users: 2218, paid_active_users: 436, ai_users: 629 },
      { stat_date: '2026-06-10', new_users: 171, active_users: 2276, paid_active_users: 448, ai_users: 648 },
      { stat_date: '2026-06-11', new_users: 176, active_users: 2298, paid_active_users: 456, ai_users: 661 },
      { stat_date: '2026-06-12', new_users: 180, active_users: 2336, paid_active_users: 471, ai_users: 684 },
      { stat_date: '2026-06-13', new_users: 184, active_users: 2362, paid_active_users: 479, ai_users: 702 },
      { stat_date: '2026-06-14', new_users: 182, active_users: 2316, paid_active_users: 468, ai_users: 691 }
    ]
  },
  revenueTrends: {
    items: [
      { stat_date: '2026-06-01', revenue_amount: 9860, paid_order_count: 18, paid_users: 16, new_paid_users: 6 },
      { stat_date: '2026-06-02', revenue_amount: 11240, paid_order_count: 21, paid_users: 19, new_paid_users: 8 },
      { stat_date: '2026-06-03', revenue_amount: 10820, paid_order_count: 20, paid_users: 18, new_paid_users: 7 },
      { stat_date: '2026-06-04', revenue_amount: 12360, paid_order_count: 24, paid_users: 21, new_paid_users: 9 },
      { stat_date: '2026-06-05', revenue_amount: 13680, paid_order_count: 27, paid_users: 24, new_paid_users: 10 },
      { stat_date: '2026-06-06', revenue_amount: 14920, paid_order_count: 29, paid_users: 26, new_paid_users: 12 },
      { stat_date: '2026-06-07', revenue_amount: 14160, paid_order_count: 28, paid_users: 25, new_paid_users: 9 },
      { stat_date: '2026-06-08', revenue_amount: 13240, paid_order_count: 25, paid_users: 23, new_paid_users: 8 },
      { stat_date: '2026-06-09', revenue_amount: 15220, paid_order_count: 31, paid_users: 28, new_paid_users: 11 },
      { stat_date: '2026-06-10', revenue_amount: 15980, paid_order_count: 33, paid_users: 29, new_paid_users: 12 },
      { stat_date: '2026-06-11', revenue_amount: 16240, paid_order_count: 34, paid_users: 31, new_paid_users: 13 },
      { stat_date: '2026-06-12', revenue_amount: 17060, paid_order_count: 36, paid_users: 32, new_paid_users: 14 },
      { stat_date: '2026-06-13', revenue_amount: 17680, paid_order_count: 39, paid_users: 34, new_paid_users: 15 },
      { stat_date: '2026-06-14', revenue_amount: 16840, paid_order_count: 37, paid_users: 32, new_paid_users: 13 }
    ]
  },
  featureRanking: {
    items: [
      { feature_key: 'assessment', view_count: 4820, click_count: 3372, start_count: 2716, membership_conversion_count: 214 },
      { feature_key: 'nutrition_recipe', view_count: 4386, click_count: 2980, start_count: 0, membership_conversion_count: 132 },
      { feature_key: 'ai_chat', view_count: 4124, click_count: 2848, start_count: 2410, membership_conversion_count: 186 },
      { feature_key: 'knowledge', view_count: 3668, click_count: 2562, start_count: 0, membership_conversion_count: 108 },
      { feature_key: 'membership', view_count: 2916, click_count: 2194, start_count: 0, membership_conversion_count: 264 },
      { feature_key: 'reading_tasks', view_count: 2480, click_count: 1826, start_count: 1432, membership_conversion_count: 86 }
    ]
  },
  contentRanking: {
    items: [
      { title: '夏季健脾祛湿辅食搭配', content_type: 'article', content_id: 'A102', view_count: 1860, completion_count: 920, favorite_count: 246 },
      { title: '贵阳家常口味一周营养建议', content_type: 'recipe_topic', content_id: 'R208', view_count: 1734, completion_count: 0, favorite_count: 218 },
      { title: '3岁专注力家庭观察评估', content_type: 'assessment', content_id: 'AS03', view_count: 1622, completion_count: 884, favorite_count: 175 },
      { title: '夏季午休与晚睡调整指南', content_type: 'article', content_id: 'A088', view_count: 1586, completion_count: 744, favorite_count: 168 },
      { title: '发育迟缓营养补充要点', content_type: 'knowledge', content_id: 'K067', view_count: 1492, completion_count: 602, favorite_count: 152 },
      { title: '高原地区儿童补铁建议', content_type: 'knowledge', content_id: 'K071', view_count: 1418, completion_count: 584, favorite_count: 146 }
    ]
  },
  contentOpsOverview: {
    tips: {
      total_active: 7458,
      action_count: 3032,
      insight_count: 4424,
      raw_count: 2,
      structured_ready_count: 7456,
      missing_display_title_count: 18,
      missing_display_text_count: 7,
      structured_ready_rate: 99.97,
      latest_updated_at: '2026-06-20 11:20:00'
    },
    articles: {
      total_published: 2789,
      theory_count: 294,
      method_count: 831,
      both_count: 1305,
      unclassified_count: 359,
      high_read_count: 612,
      classified_rate: 87.13,
      latest_updated_at: '2026-06-20 10:40:00'
    }
  },
  tipsOps: {
    items: [
      { id: 1, title: '先稳住饭前节奏', raw_title: '孩子不爱吃饭怎么办', text: '正餐前1小时收掉零食和甜饮，让孩子带着一点饥饿感回到餐桌。', display_type: 'action', display_priority: 98, category: '营养健康', age_group: '2-3岁', source_article_title: '孩子挑食的家庭应对', updated_at: '2026-06-20 11:20:00' },
      { id: 2, title: '挑食先看前置因素', raw_title: '孩子总是不吃晚饭', text: '很多孩子的晚饭问题和前一小时的零食、疲劳、活动量有关，先看前置节奏更容易找到原因。', display_type: 'insight', display_priority: 95, category: '营养健康', age_group: '3-4岁', source_article_title: '晚饭难题的常见原因', updated_at: '2026-06-20 11:10:00' },
      { id: 3, title: '先接住情绪再讲规则', raw_title: '孩子发脾气时家长怎么做', text: '孩子情绪冲上来时，先用一句短话接住感受，等情绪落一点再讲规则会更容易配合。', display_type: 'action', display_priority: 94, category: '情绪管理', age_group: '3-6岁', source_article_title: '发脾气场景下的家庭节奏', updated_at: '2026-06-20 11:05:00' }
    ]
  },
  articleForms: {
    items: [
      { id: 101, title: '孩子挑食背后的常见原因', summary: '从疲劳、零食、注意力分散三个角度解释孩子挑食。', category: '营养健康', age_group: '2-3岁', content_form: 'both', read_count: 1286, updated_at: '2026-06-20 10:40:00' },
      { id: 102, title: '晚睡前为什么更容易情绪爆发', summary: '解释学龄前孩子在疲劳状态下更容易和家长发生冲突。', category: '情绪管理', age_group: '3-4岁', content_form: 'theory', read_count: 942, updated_at: '2026-06-20 10:32:00' },
      { id: 103, title: '晚饭磨蹭时家长的三步做法', summary: '给出饭前、饭中、饭后三个时段的家庭做法。', category: '营养健康', age_group: '3-6岁', content_form: 'method', read_count: 1168, updated_at: '2026-06-20 10:21:00' }
    ]
  },
  aiChatOverview: {
    range: { startDate: '2026-06-07', endDate: '2026-06-20', days: 14 },
    summary: {
      total_replies: 1482,
      ai_reply_count: 412,
      knowledge_fallback_count: 924,
      age_clarification_count: 146,
      zero_reference_count: 188,
      weak_reference_count: 326,
      structured_count: 998,
      ai_not_configured_count: 924,
      ai_reply_rate: 27.80,
      structured_rate: 67.34,
      zero_reference_rate: 12.69,
      avg_duration_sec: 1.84
    }
  },
  aiFallbackQueries: {
    items: [
      { query_text: '小朋友3岁了，特别不爱吃晚饭，好几天了', ask_count: 32, zero_reference_count: 6, weak_reference_count: 11, fallback_count: 28, structured_count: 18 },
      { query_text: '孩子最近总躺地上哭怎么办', ask_count: 24, zero_reference_count: 4, weak_reference_count: 9, fallback_count: 20, structured_count: 15 },
      { query_text: '晚上总不肯睡觉还一直闹', ask_count: 19, zero_reference_count: 3, weak_reference_count: 7, fallback_count: 15, structured_count: 12 }
    ]
  },
  aiRecent: {
    items: [
      { created_at: '2026-06-20 11:36:00', query_text: '孩子晚饭老是吃两口就跑', answer_summary: '可以先固定晚饭流程，把饭量拆小，减少追喂和临时加餐。', intent: 'nutrition', sub_intent: 'nutrition_picky_eating', answer_source: 'knowledge_fallback', fallback_reason: 'AI_NOT_CONFIGURED', matched_type_text: 'article,tip', structured_available: true, reference_count: 3 },
      { created_at: '2026-06-20 11:28:00', query_text: '最近总是睡前哭闹不肯洗漱', answer_summary: '先把洗漱变成固定顺序，用预告和选择降低睡前对抗。', intent: 'parenting', sub_intent: 'sleep_bedtime', answer_source: 'knowledge_fallback', fallback_reason: 'AI_NOT_CONFIGURED', matched_type_text: 'scene,tip', structured_available: true, reference_count: 2 },
      { created_at: '2026-06-20 11:20:00', query_text: '我家孩子怎么总是不吃青菜', answer_summary: '先保留孩子愿意吃的熟悉食物，再少量加入一种蔬菜连续尝试。', intent: 'nutrition', sub_intent: 'nutrition_picky_eating', answer_source: 'ai', fallback_reason: '', matched_type_text: 'article,tip', structured_available: true, reference_count: 4 }
    ]
  }
};

apiBaseText.textContent = API_BASE;
updateAuthState();
syncSegmentFilterButtons();

document.getElementById('segmentExpiringFilter').addEventListener('click', () => {
  state.segmentFilters.expiringOnly = !state.segmentFilters.expiringOnly;
  syncSegmentFilterButtons();
  reloadActiveSegmentUsers();
});

document.getElementById('segmentHighActivityFilter').addEventListener('click', () => {
  state.segmentFilters.highActivityOnly = !state.segmentFilters.highActivityOnly;
  syncSegmentFilterButtons();
  reloadActiveSegmentUsers();
});

document.getElementById('segmentExportButton').addEventListener('click', () => {
  exportCurrentSegmentUsers();
});

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  setHint('正在登录并拉取后台数据...', '');
  toggleLoading(true);
  try {
    const result = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        username: String(formData.get('username') || '').trim(),
        password: String(formData.get('password') || '').trim()
      })
    });
    state.token = result.token;
    state.admin = result.admin;
    localStorage.setItem(AUTH_STORAGE_KEY, state.token);
    updateAuthState();
    setHint(`已登录：${result.admin.display_name || result.admin.username}`, 'status-success');
    await loadDashboard();
  } catch (error) {
    state.token = '';
    state.admin = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateAuthState();
    setHint(error.message || '登录失败', 'status-error');
  } finally {
    toggleLoading(false);
  }
});

changePasswordButton.addEventListener('click', () => {
  if (!state.token) {
    setHint('请先完成后台登录，再修改密码。', 'status-error');
    return;
  }
  openPasswordModal();
});

closePasswordModalButton.addEventListener('click', () => {
  closePasswordModal();
});

passwordModal.addEventListener('click', (event) => {
  if (event.target === passwordModal) {
    closePasswordModal();
  }
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!state.token) {
    setPasswordHint('请先登录后台。', 'status-error');
    return;
  }

  const formData = new FormData(passwordForm);
  const oldPassword = String(formData.get('oldPassword') || '').trim();
  const newPassword = String(formData.get('newPassword') || '').trim();
  const confirmPassword = String(formData.get('confirmPassword') || '').trim();

  if (newPassword.length < 6) {
    setPasswordHint('新密码至少 6 位。', 'status-error');
    return;
  }
  if (newPassword !== confirmPassword) {
    setPasswordHint('两次输入的新密码不一致。', 'status-error');
    return;
  }

  setPasswordHint('正在保存新密码...', '');
  toggleLoading(true);
  try {
    await request('/auth/password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword
      })
    });
    closePasswordModal();
    passwordForm.reset();
    setHint('后台密码已更新。', 'status-success');
  } catch (error) {
    setPasswordHint(error.message || '密码修改失败', 'status-error');
  } finally {
    toggleLoading(false);
  }
});

refreshButton.addEventListener('click', async () => {
  if (!state.token) {
    setHint('请先完成后台登录。', 'status-error');
    return;
  }
  toggleLoading(true);
  setHint('正在刷新后台数据...', '');
  try {
    await loadDashboard();
    setHint('后台数据已刷新。', 'status-success');
  } catch (error) {
    setHint(error.message || '刷新失败', 'status-error');
  } finally {
    toggleLoading(false);
  }
});

demoButton.addEventListener('click', () => {
  renderDashboard(demoSnapshot);
  state.admin = demoSnapshot.me;
  updateAuthState();
  setHint('当前为演示数据模式，页面结构和图表已可回看。', 'status-success');
});

if (state.token) {
  updateAuthState();
  loadDashboard().then(() => {
    setHint('已恢复登录态，后台数据已加载。', 'status-success');
  }).catch((error) => {
    updateAuthState();
    setHint(error.message || '后台数据加载失败，请刷新重试。', 'status-error');
  });
}

async function loadDashboard() {
  let me;
  try {
    me = await request('/auth/me');
  } catch (error) {
    if (isAuthError(error)) {
      clearAuthState();
    }
    throw error;
  }

  const [overview, userTrends, revenueTrends, featureRanking, contentRanking, weeklyInsights, contentOpsOverview, tipsOps, articleForms, aiChatOverview, aiFallbackQueries, aiRecent] = await Promise.all([
    safeRequest('/dashboard/overview', { users: {}, memberships: {}, revenue: {}, family: {}, operations: {}, membership_structure: [], child_age_distribution: [], child_gender_distribution: [], conversion_funnel: [], membership_lifecycle: {}, age_feature_preferences: [], feature_conversion: [], user_segments: [] }),
    safeRequest('/analytics/users/trends?days=14', { items: [] }),
    safeRequest('/analytics/revenue/trends?days=14', { items: [] }),
    safeRequest('/analytics/features/ranking?days=14&limit=8', { items: [] }),
    safeRequest('/analytics/content/ranking?days=14&limit=8', { items: [] }),
    safeRequest('/insights/weekly?days=7', { cards: [] }),
    safeRequest('/content/ops/overview', {}),
    safeRequest('/content/ops/tips?limit=8', { items: [] }),
    safeRequest('/content/ops/articles?limit=8', { items: [] }),
    safeRequest('/analytics/ai-chat/overview?days=14', {}),
    safeRequest('/analytics/ai-chat/fallback-queries?days=14&limit=8', { items: [] }),
    safeRequest('/analytics/ai-chat/recent?days=7', { items: [] })
  ]);

  renderDashboard({ me, overview, userTrends, revenueTrends, featureRanking, contentRanking, weeklyInsights, contentOpsOverview, tipsOps, articleForms, aiChatOverview, aiFallbackQueries, aiRecent });
}

function renderDashboard(snapshot) {
  state.admin = snapshot.me;
  state.segmentUsersByKey = snapshot.segmentUsersByKey || {};
  updateAuthState();
  renderOverview(snapshot.overview);
  renderOperationPriorities(snapshot.overview || {}, snapshot.aiChatOverview || {});
  renderRetentionDiagnosis(snapshot.overview || {});
  renderMembershipStructure(snapshot.membershipStructure || snapshot.overview.membership_structure || [], snapshot.overview);
  renderChildDemographics(
    snapshot.childAgeDistribution || snapshot.overview.child_age_distribution || [],
    snapshot.childGenderDistribution || snapshot.overview.child_gender_distribution || [],
    snapshot.overview
  );
  renderConversionFunnel(snapshot.conversionFunnel || snapshot.overview.conversion_funnel || []);
  renderMembershipLifecycle(snapshot.membershipLifecycle || snapshot.overview.membership_lifecycle || {});
  renderAgeFeaturePreferences(snapshot.ageFeaturePreferences || snapshot.overview.age_feature_preferences || []);
  renderFeatureConversion(snapshot.featureConversion || snapshot.overview.feature_conversion || []);
  renderWeeklyInsights((snapshot.weeklyInsights && snapshot.weeklyInsights.cards) || []);
  renderUserSegments(snapshot.userSegments || snapshot.overview.user_segments || []);
  renderContentOpsOverview(snapshot.contentOpsOverview || {});
  renderTipsOps(snapshot.tipsOps || {});
  renderArticleForms(snapshot.articleForms || {});
  renderAiChatOverview(snapshot.aiChatOverview || {});
  renderAiFallbackQueries(snapshot.aiFallbackQueries || {});
  renderAiRecent(snapshot.aiRecent || {});
  renderTrendLine('userTrendChart', snapshot.userTrends.items, 'active_users', 'users');
  renderTrendLine('revenueTrendChart', snapshot.revenueTrends.items, 'revenue_amount', 'revenue');
  renderTrendTable('userTrendTable', snapshot.userTrends.items, [
    ['日期', 'stat_date'],
    ['新增', 'new_users'],
    ['活跃', 'active_users'],
    ['付费活跃', 'paid_active_users'],
    ['AI 用户', 'ai_users']
  ]);
  renderTrendTable('revenueTrendTable', snapshot.revenueTrends.items, [
    ['日期', 'stat_date'],
    ['收入', 'revenue_amount'],
    ['支付单', 'paid_order_count'],
    ['付费用户', 'paid_users'],
    ['新付费', 'new_paid_users']
  ]);
  renderRanking('featureRanking', snapshot.featureRanking.items, (item) => ({
    title: item.feature_label || formatFeatureLabel(item.feature_key),
    score: formatNumber(item.view_count),
    meta: `浏览 ${formatNumber(item.view_count)} / 点击 ${formatNumber(item.click_count)} / 开始 ${formatNumber(item.start_count)} / 转化 ${formatNumber(item.membership_conversion_count)}`
  }));
  renderRanking('contentRanking', snapshot.contentRanking.items, (item) => ({
    title: item.display_title || item.title || buildContentTitle(item),
    score: formatNumber(item.view_count),
    meta: `${item.content_type_label || formatContentTypeLabel(item.content_type)} / 完成 ${formatNumber(item.completion_count)} / 收藏 ${formatNumber(item.favorite_count)}`
  }));
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    const error = new Error(payload.message || `请求失败：${response.status}`);
    error.status = response.status;
    error.code = payload.code || '';
    throw error;
  }
  return payload.data;
}

async function safeRequest(path, fallback) {
  try {
    return await request(path);
  } catch (error) {
    if (isAuthError(error)) {
      throw error;
    }
    return fallback;
  }
}

function isAuthError(error) {
  return error && (error.status === 401 || error.status === 403 || error.code === 'ADMIN_TOKEN_EXPIRED');
}

function clearAuthState() {
  state.token = '';
  state.admin = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  updateAuthState();
}

function renderOverview(overview) {
  setText('totalUsersValue', formatNumber(overview.users.total_users));
  setText('todayUsersValue', `今日新增 ${formatNumber(overview.users.today_new_users)}`);
  setText('dauValue', formatNumber(overview.users.dau));
  setText('mauValue', `MAU ${formatNumber(overview.users.mau)} / WAU ${formatNumber(overview.users.wau)}`);
  setText('revenueValue', formatCurrency(overview.revenue.total_revenue));
  setText('paidOrdersValue', `今日支付金额 ${formatCurrency(overview.revenue.today_revenue || 0)}`);
  setText('membershipValue', formatNumber(overview.memberships.active_memberships));
  setText(
    'membershipMixValue',
    `试用 ${formatNumber(overview.memberships.trial_memberships)} / 月 ${formatNumber(overview.memberships.month_memberships)} / 季 ${formatNumber(overview.memberships.quarter_memberships)} / 年 ${formatNumber(overview.memberships.year_memberships)}`
  );
}

function renderOperationPriorities(overview, aiChatOverview) {
  const container = document.getElementById('operationPriorities');
  if (!container) {
    return;
  }
  const users = overview.users || {};
  const family = overview.family || {};
  const lifecycle = overview.membership_lifecycle || {};
  const segments = overview.user_segments || [];
  const aiSummary = (aiChatOverview && aiChatOverview.summary) || {};
  const churnRisk = findSegmentCount(segments, 'churn_risk');
  const activeUnpaid = findSegmentCount(segments, 'active_unpaid');
  const profileGap = Math.max(0, Number(users.total_users || 0) - Number(family.families_with_children || 0));
  const zeroReferenceRate = Number(aiSummary.zero_reference_rate || 0);
  const cards = [
    {
      tone: 'danger',
      label: '会员召回',
      value: formatNumber(churnRisk || lifecycle.expiring_in_7_days),
      title: '优先触达即将流失会员',
      meta: `7 天内到期 ${formatNumber(lifecycle.expiring_in_7_days)} 位，自动续费关闭 ${formatNumber(lifecycle.auto_renew_off)} 位`,
      action: '今天先跟进到期 1-3 天且有手机号的用户，突出已解锁权益和续费价值。'
    },
    {
      tone: 'growth',
      label: '转化承接',
      value: formatNumber(activeUnpaid),
      title: '高活跃未付费用户值得承接',
      meta: `近 30 天活跃 ${formatNumber(users.mau)} 位，累计付费渗透 ${formatPercent((overview.operations || {}).paid_user_penetration)}`,
      action: '在每日指导和营养食谱高频入口强化会员权益，缩短从体验到支付的路径。'
    },
    {
      tone: 'profile',
      label: '档案补全',
      value: formatNumber(profileGap),
      title: '孩子档案仍是推荐精度瓶颈',
      meta: `档案渗透 ${formatPercent(family.child_profile_penetration)}，有档案家庭 ${formatNumber(family.families_with_children)}`,
      action: '把补生日和孩子年龄放到首屏任务前，告诉家长补完后能获得更准的每日建议。'
    },
    {
      tone: 'ai',
      label: 'AI 质检',
      value: formatPercent(zeroReferenceRate),
      title: 'AI 零引用率需要继续压低',
      meta: `14 天回复 ${formatNumber(aiSummary.total_replies)} 次，AI 直答率 ${formatPercent(aiSummary.ai_reply_rate)}`,
      action: '优先补充高频问题知识库，让问答更多命中育儿锦囊、食谱和场景建议。'
    }
  ];
  container.innerHTML = cards.map((card) => `
    <article class="priority-card ${escapeHtml(card.tone)}">
      <div class="priority-topline">
        <span>${escapeHtml(card.label)}</span>
        <strong>${escapeHtml(card.value)}</strong>
      </div>
      <h4>${escapeHtml(card.title)}</h4>
      <p>${escapeHtml(card.meta)}</p>
      <small>${escapeHtml(card.action)}</small>
    </article>
  `).join('');
}

function findSegmentCount(segments, key) {
  const match = (segments || []).find((item) => item.key === key);
  return Number((match && match.count) || 0);
}

function renderRetentionDiagnosis(overview) {
  const container = document.getElementById('retentionDiagnosis');
  if (!container) {
    return;
  }
  const users = overview.users || {};
  const funnel = overview.conversion_funnel || [];
  const active30d = findFunnelCount(funnel, 'active30d');
  const order30d = findFunnelCount(funnel, 'order30d');
  const paid30d = findFunnelCount(funnel, 'paid30d');
  const dauMau = calculatePercentage(users.dau, users.mau);
  const wauMau = calculatePercentage(users.wau, users.mau);
  const activeToOrder = calculatePercentage(order30d, active30d);
  const orderToPaid = calculatePercentage(paid30d, order30d);
  const cards = [
    {
      label: '日常粘性',
      value: formatPercent(dauMau),
      detail: `DAU ${formatNumber(users.dau)} / MAU ${formatNumber(users.mau)}`,
      insight: buildRetentionInsight(dauMau, 'daily')
    },
    {
      label: '周留存面',
      value: formatPercent(wauMau),
      detail: `WAU ${formatNumber(users.wau)} / MAU ${formatNumber(users.mau)}`,
      insight: buildRetentionInsight(wauMau, 'weekly')
    },
    {
      label: '活跃到下单',
      value: formatPercent(activeToOrder),
      detail: `下单 ${formatNumber(order30d)} / 活跃 ${formatNumber(active30d)}`,
      insight: activeToOrder >= 20 ? '体验到下单承接较顺，继续放大高频入口。' : '高活跃用户转订单偏弱，优先优化权益露出和支付入口。'
    },
    {
      label: '下单到支付',
      value: formatPercent(orderToPaid),
      detail: `支付 ${formatNumber(paid30d)} / 下单 ${formatNumber(order30d)}`,
      insight: orderToPaid >= 50 ? '支付链路完成度较好，重点扩大下单人数。' : '下单后支付流失明显，优先排查支付信任、价格解释和支付链路。'
    }
  ];
  container.innerHTML = cards.map((card) => `
    <article class="retention-card">
      <span>${escapeHtml(card.label)}</span>
      <strong>${escapeHtml(card.value)}</strong>
      <p>${escapeHtml(card.detail)}</p>
      <small>${escapeHtml(card.insight)}</small>
    </article>
  `).join('');
}

function findFunnelCount(funnel, key) {
  const match = (funnel || []).find((item) => item.key === key);
  return Number((match && match.count) || 0);
}

function calculatePercentage(part, total) {
  const denominator = Number(total || 0);
  if (!denominator) {
    return 0;
  }
  return Number(((Number(part || 0) / denominator) * 100).toFixed(2));
}

function buildRetentionInsight(value, type) {
  if (type === 'weekly') {
    return value >= 60 ? '近一周触达面较好，重点提升日常打开频次。' : '周活用户覆盖偏低，需要增加订阅提醒和固定使用场景。';
  }
  return value >= 20 ? '日常打开频次健康，继续强化每日计划习惯。' : '日常打开偏低，优先做每日计划提醒和首页任务牵引。';
}

function renderMembershipStructure(items, overview) {
  const operations = overview.operations || {};
  const memberships = overview.memberships || {};
  renderMiniStats('membershipHealth', [
    {
      label: '有效会员渗透',
      value: formatPercent(operations.active_membership_rate),
      meta: `${formatNumber(memberships.active_memberships)} 位当前有效会员`
    },
    {
      label: '付费用户渗透',
      value: formatPercent(operations.paid_user_penetration),
      meta: '累计付费用户占总注册用户'
    },
    {
      label: 'ARPPU',
      value: formatCurrency(operations.arppu),
      meta: '累计收入 / 累计付费用户'
    },
    {
      label: '客单价',
      value: formatCurrency(operations.average_order_value),
      meta: '累计收入 / 支付成功订单'
    }
  ]);
  renderDistribution('membershipStructure', items, '当前暂无会员结构数据');
}

function renderChildDemographics(ageItems, genderItems, overview) {
  const family = overview.family || {};
  renderMiniStats('familyHealth', [
    {
      label: '有档案家庭',
      value: formatNumber(family.families_with_children),
      meta: `档案渗透 ${formatPercent(family.child_profile_penetration)}`
    },
    {
      label: '孩子档案数',
      value: formatNumber(family.total_children),
      meta: `户均 ${formatDecimal(family.avg_children_per_family)} 个孩子`
    }
  ]);
  renderDistribution('childAgeDistribution', ageItems, '当前暂无孩子年龄分布数据');
  renderDistribution('childGenderDistribution', genderItems, '当前暂无孩子性别分布数据');
}

function renderConversionFunnel(items) {
  const container = document.getElementById('conversionFunnel');
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前暂无转化漏斗数据。</div>';
    return;
  }
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'funnel-item';
    const width = Math.max(8, Math.min(100, Number(item.total_rate || 0)));
    node.innerHTML = `
      <div class="distribution-topline">
        <span class="distribution-name">${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(formatNumber(item.count))}</strong>
      </div>
      <div class="distribution-track"><div class="distribution-fill funnel" style="width:${width}%"></div></div>
      <span class="distribution-meta">总转化 ${escapeHtml(formatPercent(item.total_rate))} / 步进转化 ${escapeHtml(formatPercent(item.conversion_rate))}</span>
    `;
    container.appendChild(node);
  });
}

function renderMembershipLifecycle(lifecycle) {
  renderMiniStats('membershipLifecycle', [
    {
      label: '7天内到期',
      value: formatNumber(lifecycle.expiring_in_7_days),
      meta: `占当前有效会员 ${formatPercent(lifecycle.expiring_7_days_rate)}`
    },
    {
      label: '30天内到期',
      value: formatNumber(lifecycle.expiring_in_30_days),
      meta: '用于续费召回排期'
    },
    {
      label: '自动续费开启',
      value: formatNumber(lifecycle.auto_renew_on),
      meta: `开启率 ${formatPercent(lifecycle.auto_renew_on_rate)}`
    },
    {
      label: '自动续费关闭',
      value: formatNumber(lifecycle.auto_renew_off),
      meta: '适合重点召回提醒'
    },
    {
      label: '试用中用户',
      value: formatNumber(lifecycle.active_trials),
      meta: '当前处于试用状态'
    },
    {
      label: '即将到期试用',
      value: formatNumber(lifecycle.expiring_trials),
      meta: '适合做试用转付费触达'
    }
  ]);
}

function renderAgeFeaturePreferences(groups) {
  const container = document.getElementById('ageFeaturePreferences');
  container.innerHTML = '';
  if (!groups || !groups.length) {
    container.innerHTML = '<div class="empty-state">当前暂无年龄段功能偏好数据。</div>';
    return;
  }
  groups.forEach((group) => {
    const node = document.createElement('div');
    node.className = 'age-feature-card';
    const items = (group.items || []).map((item) => `
      <div class="age-feature-item">
        <div class="distribution-topline">
          <span class="distribution-name">${escapeHtml(item.feature_label || item.feature_key || '-')}</span>
          <strong>${escapeHtml(formatNumber(item.user_count))}</strong>
        </div>
        <span class="distribution-meta">事件 ${escapeHtml(formatNumber(item.event_count))}</span>
      </div>
    `).join('');
    node.innerHTML = `
      <div class="panel-header compact">
        <div>
          <h4>${escapeHtml(group.age_label || group.age_key || '-')}</h4>
        </div>
      </div>
      <div class="distribution-list">${items}</div>
    `;
    container.appendChild(node);
  });
}

function renderFeatureConversion(items) {
  renderRanking('featureConversion', items, (item) => ({
    title: item.feature_key || '未命名功能',
    score: formatPercent(item.conversion_rate),
    meta: `触达 ${formatNumber(item.feature_users)} / 支付 ${formatNumber(item.paid_users)}`
  }));
}

function renderWeeklyInsights(items) {
  const container = document.getElementById('weeklyInsights');
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前暂无每周经营建议。</div>';
    return;
  }
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = `weekly-insight-card${item.priority === 'high' ? ' priority-high' : ''}`;
    node.innerHTML = `
      <div class="distribution-topline">
        <span class="distribution-name">${escapeHtml(item.title || '-')}</span>
        <span class="segment-user-tag ${item.priority === 'high' ? 'priority-high' : ''}">${escapeHtml(formatActionPriority(item.priority))}</span>
      </div>
      <p>${escapeHtml(item.summary || '')}</p>
      <div class="weekly-insight-metric">
        <span class="distribution-meta">${escapeHtml(item.metric_label || '核心指标')}</span>
        <strong>${escapeHtml(item.metric || '-')}</strong>
      </div>
      <p class="weekly-insight-recommendation">建议动作：${escapeHtml(item.recommendation || '')}</p>
      <p>${escapeHtml(item.evidence || '')}</p>
    `;
    container.appendChild(node);
  });
}

function renderUserSegments(items) {
  const container = document.getElementById('userSegments');
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前暂无用户分层数据。</div>';
    renderSegmentUsersPanel(null, [], '当前暂无可展示的分层明细。');
    return;
  }
  const defaultSegmentKey = state.activeSegmentKey && items.some((item) => item.key === state.activeSegmentKey)
    ? state.activeSegmentKey
    : (items.find((item) => Number(item.count || 0) > 0) || items[0]).key;
  items.forEach((item) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `segment-card${item.key === defaultSegmentKey ? ' is-active' : ''}`;
    node.innerHTML = `
      <div class="distribution-topline">
        <span class="distribution-name">${escapeHtml(item.label || item.key || '-')}</span>
        <strong>${escapeHtml(formatNumber(item.count))}</strong>
      </div>
      <span class="distribution-meta">占总用户 ${escapeHtml(formatPercent(item.percentage))}</span>
      <p class="segment-copy">${escapeHtml(item.description || '')}</p>
    `;
    node.addEventListener('click', () => {
      container.querySelectorAll('.segment-card').forEach((card) => card.classList.remove('is-active'));
      node.classList.add('is-active');
      loadSegmentUsers(item);
    });
    container.appendChild(node);
  });
  loadSegmentUsers(items.find((item) => item.key === defaultSegmentKey) || items[0]);
}

async function loadSegmentUsers(segment) {
  state.activeSegmentKey = segment.key;
  state.activeSegmentMeta = segment;
  const cacheKey = buildSegmentUsersCacheKey(segment.key);
  const cached = state.segmentUsersByKey[cacheKey] || (isDefaultSegmentFilterState() ? state.segmentUsersByKey[segment.key] : null);
  if (cached) {
    renderSegmentUsersPanel(cached.segment || segment, cached.items || []);
    return;
  }
  if (!state.token) {
    renderSegmentUsersPanel(segment, [], '当前为演示外的未登录状态，登录后可查看真实分层名单。');
    return;
  }
  renderSegmentUsersPanel(segment, [], '正在加载分层用户名单...');
  try {
    const query = new URLSearchParams({ limit: '20' });
    if (state.segmentFilters.expiringOnly) {
      query.set('expiring_only', '1');
    }
    if (state.segmentFilters.highActivityOnly) {
      query.set('high_activity_only', '1');
    }
    const data = await request(`/segments/${segment.key}/users?${query.toString()}`);
    state.segmentUsersByKey[cacheKey] = data;
    renderSegmentUsersPanel(data.segment || segment, data.items || []);
  } catch (error) {
    renderSegmentUsersPanel(segment, [], error.message || '分层名单加载失败');
  }
}

function reloadActiveSegmentUsers() {
  if (!state.activeSegmentKey) {
    return;
  }
  const segment = state.activeSegmentMeta || { key: state.activeSegmentKey, label: '', description: '' };
  loadSegmentUsers(segment);
}

function buildSegmentUsersCacheKey(segmentKey) {
  return [
    segmentKey,
    state.segmentFilters.expiringOnly ? 'expiring' : 'all',
    state.segmentFilters.highActivityOnly ? 'high' : 'normal'
  ].join(':');
}

function isDefaultSegmentFilterState() {
  return !state.segmentFilters.expiringOnly && !state.segmentFilters.highActivityOnly;
}

function syncSegmentFilterButtons() {
  document.getElementById('segmentExpiringFilter').classList.toggle('is-active', state.segmentFilters.expiringOnly);
  document.getElementById('segmentHighActivityFilter').classList.toggle('is-active', state.segmentFilters.highActivityOnly);
}

function exportCurrentSegmentUsers() {
  if (!state.activeSegmentMeta || !state.currentSegmentUsers.length) {
    setHint('当前没有可导出的分层名单。', 'status-error');
    return;
  }
  const rows = [
    ['分层', '昵称', '手机号', '孩子', '年龄段', '会员类型', '累计支付', '支付单数', '最近活跃', '近14天活跃事件', '会员到期', '自动续费', '触达优先级', '建议动作']
  ];
  state.currentSegmentUsers.forEach((item) => {
    rows.push([
      state.activeSegmentMeta.label || state.activeSegmentMeta.key || '',
      item.nickname || `用户${item.id}`,
      item.phone || '',
      item.child_name || '',
      item.child_age_label || '',
      formatMembershipLabel(item.membership_type, item.current_plan),
      String(Number(item.total_paid_amount || 0)),
      String(Number(item.paid_order_count || 0)),
      formatDateTime(item.last_active_at),
      String(Number(item.active_event_count_14d || 0)),
      formatDateTime(item.current_end_date),
      item.auto_renew ? '已开启' : '未开启',
      formatActionPriority(item.action_priority),
      item.suggested_action || ''
    ]);
  });
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = buildSegmentExportFileName();
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setHint('当前分层名单已导出为 CSV。', 'status-success');
}

function buildSegmentExportFileName() {
  const parts = [state.activeSegmentMeta.key || 'segment'];
  if (state.segmentFilters.expiringOnly) {
    parts.push('expiring');
  }
  if (state.segmentFilters.highActivityOnly) {
    parts.push('high-activity');
  }
  parts.push(formatDateForFileName(new Date()));
  return `niuniu-${parts.join('-')}.csv`;
}

function escapeCsvCell(value) {
  const text = String(value || '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatDateForFileName(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function renderSegmentUsersPanel(segment, items, emptyMessage) {
  const title = document.getElementById('segmentUsersTitle');
  const meta = document.getElementById('segmentUsersMeta');
  const container = document.getElementById('segmentUsersList');
  state.currentSegmentUsers = Array.isArray(items) ? items : [];
  title.textContent = segment ? `${segment.label || segment.key}名单` : '分层用户名单';

  // 汇总统计
  const totalCount = state.currentSegmentUsers.length;
  const totalAmount = state.currentSegmentUsers.reduce((sum, u) => sum + (Number(u.total_paid_amount) || 0), 0);
  const highCount = state.currentSegmentUsers.filter((u) => u.action_priority === 'high').length;
  const withPhoneCount = state.currentSegmentUsers.filter((u) => u.phone).length;
  meta.innerHTML = segment
    ? `<span>${escapeHtml(segment.description || '')}</span>`
    : '选择一个分层查看最近 20 个用户';
  meta.innerHTML += totalCount > 0
    ? `<span class="segment-summary-stats">当前 ${totalCount} 人 | 累计支付 ¥${formatNumber(totalAmount)} | 高优先 ${highCount} 人 | 有手机号 ${withPhoneCount} 人</span>`
    : '';

  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(emptyMessage || '当前分层暂无用户样本。')}</div>`;
    return;
  }

  const tableWrap = document.createElement('div');
  tableWrap.className = 'segment-user-table-wrap';
  const table = document.createElement('table');
  table.className = 'segment-user-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>用户</th>
        <th>手机号</th>
        <th>孩子</th>
        <th>会员</th>
        <th>到期时间</th>
        <th>累计支付</th>
        <th>最近活跃</th>
        <th>优先</th>
        <th>动作</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  items.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="cell-name">${escapeHtml(item.nickname || `用户${item.id}`)}</td>
      <td class="cell-phone">${escapeHtml(item.phone ? maskPhone(item.phone) : '-')}</td>
      <td>${escapeHtml(item.child_name ? `${item.child_name} / ${item.child_age_label || '?'}` : (item.child_age_label || '-'))}</td>
      <td>${escapeHtml(formatMembershipLabel(item.membership_type, item.current_plan))}</td>
      <td class="cell-date">${item.current_end_date ? formatShortDate(item.current_end_date) : '-'}</td>
      <td class="cell-amount">¥${escapeHtml(formatNumber(item.total_paid_amount || 0))}</td>
      <td class="cell-date">${item.last_active_at ? formatShortDate(item.last_active_at) : '-'}</td>
      <td class="cell-priority ${item.action_priority === 'high' ? 'priority-high-tag' : ''}">${escapeHtml(formatActionPriority(item.action_priority))}</td>
      <td class="cell-action">${escapeHtml(item.suggested_action || '-')}</td>
    `;
    tbody.appendChild(row);
  });
  tableWrap.appendChild(table);
  container.appendChild(tableWrap);

  // 加载更多按钮
  if (totalCount >= 20) {
    const moreBtn = document.createElement('button');
    moreBtn.className = 'ghost filter-chip segment-load-more';
    moreBtn.textContent = '加载更多 (每次 20 条)';
    moreBtn.addEventListener('click', async () => {
      moreBtn.textContent = '加载中...';
      moreBtn.disabled = true;
      try {
        const query = new URLSearchParams({ limit: '20', offset: String(totalCount) });
        if (state.segmentFilters.expiringOnly) query.set('expiring_only', '1');
        if (state.segmentFilters.highActivityOnly) query.set('high_activity_only', '1');
        const data = await request(`/segments/${state.activeSegmentKey}/users?${query.toString()}`);
        if (data && data.items && data.items.length) {
          state.currentSegmentUsers = state.currentSegmentUsers.concat(data.items);
          state.segmentUsersByKey[buildSegmentUsersCacheKey(state.activeSegmentKey)] = null; // invalidate cache
          renderSegmentUsersPanel(state.activeSegmentMeta, state.currentSegmentUsers);
        } else {
          moreBtn.textContent = '没有更多了';
          moreBtn.disabled = true;
        }
      } catch (err) {
        moreBtn.textContent = '加载失败，点击重试';
        moreBtn.disabled = false;
      }
    });
    container.appendChild(moreBtn);
  }
}

function maskPhone(phone) {
  const text = String(phone).trim();
  if (text.length >= 11) {
    return text.slice(0, 3) + '****' + text.slice(-4);
  }
  if (text.length >= 7) {
    return text.slice(0, 3) + '****' + text.slice(-2);
  }
  return text;
}

function formatShortDate(value) {
  if (!value) return '';
  const text = String(value).trim();
  // Handle ISO format: 2026-07-15T00:00:00.000Z or 2026-07-15 23:59:59
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${Number(match[2])}/${Number(match[3])}`;
  }
  return text;
}

function truncateText(text, maxLen) {
  const str = String(text || '');
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + '…';
}

function renderTrendLine(containerId, items, valueKey, tone) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前区间暂无聚合数据。请稍后刷新或重新生成运营统计。</div>';
    return;
  }
  const values = items.map((item) => Number(item[valueKey] || 0));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const width = 520;
  const height = 180;
  const padding = 28;
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;
  const range = Math.max(1, maxValue - minValue);
  const points = items.map((item, index) => {
    const x = padding + (items.length === 1 ? drawableWidth / 2 : (index / (items.length - 1)) * drawableWidth);
    const y = padding + drawableHeight - ((Number(item[valueKey] || 0) - minValue) / range) * drawableHeight;
    return { x, y, value: Number(item[valueKey] || 0), label: formatTrendDate(item.stat_date) };
  });
  const polyline = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  const labelStep = Math.max(1, Math.ceil(points.length / 3));
  const pointNodes = points.map((point, index) => {
    const showLabel = index === 0 || index === points.length - 1 || index % labelStep === 0;
    return `
      <g>
        <circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4" class="line-dot ${tone}"></circle>
        ${showLabel ? `<text x="${point.x.toFixed(1)}" y="${height - 6}" text-anchor="middle" class="line-label">${escapeHtml(point.label)}</text>` : ''}
      </g>
    `;
  }).join('');
  container.innerHTML = `
    <svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img">
      <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" class="line-axis"></line>
      <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" class="line-axis"></line>
      <polyline points="${polyline}" class="line-path ${tone}"></polyline>
      ${pointNodes}
    </svg>
    <div class="line-summary">
      <span>最高 ${formatCompact(maxValue)}</span>
      <span>最低 ${formatCompact(minValue)}</span>
      <span>最新 ${formatCompact(values[values.length - 1] || 0)}</span>
    </div>
  `;
}

function formatTrendDate(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(?:\d{4}-)?(\d{2}-\d{2})/);
  if (match) {
    return match[1];
  }
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) {
    return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  return text.slice(0, 5);
}

function renderTrendTable(containerId, items, columns) {
  const container = document.getElementById(containerId);
  if (!items || !items.length) {
    container.innerHTML = '';
    return;
  }
  const header = columns.map(([label]) => `<th>${label}</th>`).join('');
  const body = items
    .map((item) => `<tr>${columns.map(([, key]) => `<td>${escapeHtml(String(formatTrendCell(item, key)))}</td>`).join('')}</tr>`)
    .join('');
  container.innerHTML = `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

function formatTrendCell(item, key) {
  if (key === 'stat_date') {
    return formatTrendDate(item[key]);
  }
  return item[key] ?? '-';
}

function renderRanking(containerId, items, mapper) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前区间暂无可展示排行。系统会按已采集的浏览、点击、完成和支付事件自动生成。</div>';
    return;
  }
  items.forEach((item, index) => {
    const viewModel = mapper(item, index);
    const node = document.createElement('div');
    node.className = 'ranking-item';
    node.innerHTML = `
      <div class="ranking-topline">
        <span class="ranking-name">#${index + 1} ${escapeHtml(viewModel.title)}</span>
        <strong>${escapeHtml(String(viewModel.score))}</strong>
      </div>
      <span class="ranking-meta">${escapeHtml(viewModel.meta)}</span>
    `;
    container.appendChild(node);
  });
}

function renderMiniStats(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'mini-stat';
    node.innerHTML = `
      <span>${escapeHtml(item.label)}</span>
      <strong>${escapeHtml(String(item.value))}</strong>
      <small>${escapeHtml(item.meta || '')}</small>
    `;
    container.appendChild(node);
  });
}

function renderDistribution(containerId, items, emptyMessage) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = `<div class="empty-state">${escapeHtml(emptyMessage)}</div>`;
    return;
  }
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'distribution-item';
    const width = Math.max(4, Math.min(100, Number(item.percentage || 0)));
    node.innerHTML = `
      <div class="distribution-topline">
        <span class="distribution-name">${escapeHtml(item.label || item.key || '-')}</span>
        <strong>${escapeHtml(formatNumber(item.count))}</strong>
      </div>
      <div class="distribution-track"><div class="distribution-fill" style="width:${width}%"></div></div>
      <span class="distribution-meta">占比 ${escapeHtml(formatPercent(item.percentage))}</span>
    `;
    container.appendChild(node);
  });
}

function renderContentOpsOverview(data) {
  var tips = data.tips || {};
  var articles = data.articles || {};
  var readyTips = Number(tips.structured_ready_count || 0);
  var totalTips = Number(tips.total_active || 0);
  var pendingTips = Math.max(0, totalTips - readyTips);
  var coreReadyTips = Number(tips.core_ready_count || 0);
  var coreTotalTips = Number(tips.core_total || 0);
  var corePendingTips = Number(tips.core_pending_count || Math.max(0, coreTotalTips - coreReadyTips));
  renderMiniStats('contentOpsHealth', [
    {
      label: '核心场景覆盖率',
      value: formatPercent(tips.core_ready_rate || tips.structured_ready_rate),
      meta: coreTotalTips > 0
        ? `${formatNumber(coreReadyTips)} / ${formatNumber(coreTotalTips)} 条核心锦囊可用于小程序推荐和 AI 回答。`
        : `${formatNumber(readyTips)} 条可用锦囊，建议先补齐核心主题和主要年龄段。`
    },
    {
      label: '高价值待整理',
      value: formatNumber(corePendingTips || pendingTips),
      meta: (corePendingTips || pendingTips) > 0
        ? '下一版先把这部分做到 70%-80%，优先覆盖高频问题和会员常用场景。'
        : `核心场景已覆盖，全量待整理 ${formatNumber(pendingTips)} 条。`
    },
    {
      label: '全量整理率',
      value: formatPercent(tips.structured_ready_rate),
      meta: `${formatNumber(readyTips)} / ${formatNumber(totalTips)} 条已整理好，作为长期内容治理指标。`
    },
    {
      label: '文章分类进度',
      value: formatPercent(articles.classified_rate),
      meta: `${formatNumber(articles.unclassified_count)} 篇待分类，分类后更容易进入专题推荐和 AI 引用。`
    },
    {
      label: '阅读表现',
      value: formatNumber(articles.high_read_count),
      meta: Number(articles.high_read_count || 0) > 0
        ? `已识别高阅读文章，数据更新于 ${formatDateTime(articles.latest_updated_at)}。`
        : `当前没有识别出高阅读文章，建议检查阅读埋点或高阅读阈值。更新于 ${formatDateTime(articles.latest_updated_at)}。`
    }
  ]);
}

function renderTipsOps(data) {
  renderRanking('tipsOpsList', data.items || [], function(item) {
    return {
      title: `${formatDisplayType(item.display_type)} · ${item.title || item.raw_title || '未命名锦囊'}`,
      score: `P${formatNumber(item.display_priority || 0)}`,
      meta: `${item.category || '未分类'} / ${item.age_group || '年龄待补充'} / ${item.source_article_title || '无来源文章'} / ${formatDateTime(item.updated_at)}`
    };
  });
}

function renderArticleForms(data) {
  renderRanking('articleFormList', data.items || [], function(item) {
    return {
      title: `${formatContentForm(item.content_form)} · ${item.title || '未命名文章'}`,
      score: formatNumber(item.read_count || 0),
      meta: `${item.category || '未分类'} / ${item.age_group || '年龄待补充'} / 更新 ${formatDateTime(item.updated_at)}`
    };
  });
}

function renderAiChatOverview(data) {
  var summary = data.summary || {};
  renderMiniStats('aiChatHealth', [
    {
      label: 'Structured 覆盖率',
      value: formatPercent(summary.structured_rate),
      meta: `${formatNumber(summary.structured_count)} / ${formatNumber(summary.total_replies)} 次回复`
    },
    {
      label: '零引用率',
      value: formatPercent(summary.zero_reference_rate),
      meta: `零引用 ${formatNumber(summary.zero_reference_count)} 次，弱引用 ${formatNumber(summary.weak_reference_count)} 次`
    },
    {
      label: 'AI 直答率',
      value: formatPercent(summary.ai_reply_rate),
      meta: `AI 直答 ${formatNumber(summary.ai_reply_count)} 次`
    },
    {
      label: 'AI 未配置回退',
      value: formatNumber(summary.ai_not_configured_count),
      meta: `平均耗时 ${formatDecimal(summary.avg_duration_sec || 0)} 秒`
    }
  ]);
}

function renderAiFallbackQueries(data) {
  renderRanking('aiFallbackQueries', data.items || [], function(item) {
    return {
      title: item.query_text || '未记录问题',
      score: formatNumber(item.ask_count || 0),
      meta: `零引用 ${formatNumber(item.zero_reference_count)} / 弱引用 ${formatNumber(item.weak_reference_count)} / 回退 ${formatNumber(item.fallback_count)} / structured ${formatNumber(item.structured_count)}`
    };
  });
}

function renderAiRecent(data) {
  var items = (data.items || []).map(function(item) {
    return Object.assign({}, item, {
      reply_status: formatAiReplyStatus(item),
      knowledge_hit_label: formatAiKnowledgeHit(item),
      age_required_label: item.fallback_reason === 'AGE_REQUIRED' ? '需要补年龄' : '不需要',
      operation_conclusion: formatAiOperationConclusion(item),
      answer_summary_label: item.answer_summary || '历史记录未保存摘要'
    });
  });
  renderTrendTable('aiRecentTable', items, [
    ['时间', 'created_at'],
    ['问题', 'query_text'],
    ['是否已回复', 'reply_status'],
    ['是否命中知识库', 'knowledge_hit_label'],
    ['是否需补年龄', 'age_required_label'],
    ['AI 回复摘要', 'answer_summary_label'],
    ['运营结论', 'operation_conclusion']
  ]);
}

function formatAiReplyStatus(item) {
  if (item.answer_source === 'age_clarification') {
    return '已回复：请家长补充年龄';
  }
  if (item.answer_source === 'ai') {
    return '已回复：AI 直答';
  }
  if (item.answer_source === 'knowledge_fallback') {
    return '已回复：知识库兜底';
  }
  if (item.answer_source) {
    return `已回复：${item.answer_source}`;
  }
  return '已回复';
}

function formatAiKnowledgeHit(item) {
  var count = Number(item.reference_count || 0);
  if (count > 0) {
    return `命中 ${count} 条资料`;
  }
  return '未命中';
}

function formatAiOperationConclusion(item) {
  if (item.fallback_reason === 'AGE_REQUIRED') {
    return '泛问题或缺少孩子年龄，可引导完善孩子档案。';
  }
  var count = Number(item.reference_count || 0);
  if (count === 0) {
    return '知识库未覆盖，建议补充该类问答素材。';
  }
  if (item.structured_available) {
    return '回复已结构化，可作为优质样例复用。';
  }
  return '已命中资料，但结构化未生效，可优化卡片化回复。';
}

function updateAuthState() {
  authStateText.textContent = state.admin ? `${state.admin.display_name || state.admin.username}` : state.token ? '登录态待校验' : '未登录';
  changePasswordButton.disabled = !state.token;
}

function toggleLoading(loading) {
  document.getElementById('loginButton').disabled = loading;
  refreshButton.disabled = loading;
}

function setHint(message, className) {
  loginHint.textContent = message;
  loginHint.className = `hint ${className || ''}`.trim();
}

function setPasswordHint(message, className) {
  passwordHint.textContent = message;
  passwordHint.className = `hint ${className || ''}`.trim();
}

function openPasswordModal() {
  passwordModal.classList.add('open');
  passwordModal.setAttribute('aria-hidden', 'false');
  setPasswordHint('密码至少 6 位。', '');
  passwordForm.reset();
  document.getElementById('oldPasswordInput').focus();
}

function closePasswordModal() {
  passwordModal.classList.remove('open');
  passwordModal.setAttribute('aria-hidden', 'true');
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('zh-CN');
}

function formatCurrency(value) {
  return `¥${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(value) {
  const number = Number(value || 0);
  if (number >= 10000) {
    return `${(number / 10000).toFixed(1)}w`;
  }
  return formatNumber(number);
}

function formatPercent(value) {
  return `${Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function formatDecimal(value) {
  return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateTime(value) {
  if (!value) {
    return '-';
  }
  return String(value).replace('T', ' ').slice(0, 16);
}

function formatMembershipLabel(membershipType, currentPlan) {
  const plan = String(currentPlan || membershipType || 'free');
  const map = {
    free: '免费用户',
    trial: '试用会员',
    month: '月会员',
    quarter: '季会员',
    year: '年会员'
  };
  return map[plan] || plan;
}

function formatActionPriority(value) {
  const map = {
    high: '优先触达',
    medium: '持续跟进',
    low: '观察名单'
  };
  return map[String(value || 'medium')] || '持续跟进';
}

function formatDisplayType(value) {
  var map = {
    action: '行动卡',
    insight: '判断卡',
    raw: '原始卡'
  };
  return map[String(value || 'raw')] || '原始卡';
}

function formatContentForm(value) {
  var map = {
    theory: '学理论',
    method: '学方法',
    both: '理论+方法'
  };
  return map[String(value || '')] || '待分类';
}

function formatFeatureLabel(value) {
  var map = {
    assessment: '成长测评',
    ai_chat: 'AI 问答',
    membership: '会员中心',
    nutrition_recipe: '营养食谱',
    nutrition: '营养模块',
    parenting: '家长知识',
    knowledge: '知识内容',
    reading_tasks: '阅读任务',
    education: '能力成长',
    share: '分享传播',
    daily_guidance: '每日指导',
    scene_search: '场景搜索',
    growth_record: '成长记录',
    weekly_summary: '周报总结',
    unknown: '未归类功能'
  };
  return map[String(value || '')] || String(value || '未归类功能');
}

function formatContentTypeLabel(value) {
  var map = {
    article: '家长文章',
    recipe: '营养食谱',
    reading_task: '阅读任务',
    knowledge_point: '知识卡片',
    daily_plan: '每日指导'
  };
  return map[String(value || '')] || '未归类内容';
}

function buildContentTitle(item) {
  var label = formatContentTypeLabel(item.content_type);
  return item.content_id ? `${label} ${item.content_id}` : label;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
