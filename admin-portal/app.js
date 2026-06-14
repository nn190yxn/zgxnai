const API_BASE = window.__ADMIN_API_BASE__ || '/admin-api/v1';
const AUTH_STORAGE_KEY = 'niuniu-admin-token';

const state = {
  token: localStorage.getItem(AUTH_STORAGE_KEY) || '',
  admin: null
};

const authStateText = document.getElementById('authStateText');
const apiBaseText = document.getElementById('apiBaseText');
const loginHint = document.getElementById('loginHint');
const loginForm = document.getElementById('loginForm');
const refreshButton = document.getElementById('refreshButton');
const demoButton = document.getElementById('demoButton');

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
  userSegments: [
    { key: 'high_value_paid', label: '高价值付费用户', description: '累计支付金额较高或已支付 2 单及以上，适合重点维系和转介绍。', count: 268, percentage: 1.44 },
    { key: 'churn_risk', label: '即将流失会员', description: '7 天内到期且未开启自动续费，适合重点召回。', count: 132, percentage: 0.71 },
    { key: 'paid_low_activity', label: '低活跃付费用户', description: '已经付费，但近 14 天没有活跃行为，适合做使用唤醒。', count: 314, percentage: 1.68 },
    { key: 'active_unpaid', label: '高活跃未付费用户', description: '近 14 天活跃但还没有付费，适合做转化承接。', count: 1628, percentage: 8.73 },
    { key: 'active_trial', label: '活跃试用用户', description: '当前试用中且近 7 天活跃，适合做试用转付费。', count: 208, percentage: 1.12 }
  ],
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
  }
};

apiBaseText.textContent = API_BASE;
updateAuthState();

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
  loadDashboard().catch((error) => {
    state.token = '';
    state.admin = null;
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateAuthState();
    setHint(error.message || '登录态已失效，请重新登录。', 'status-error');
  });
}

async function loadDashboard() {
  const [me, overview, userTrends, revenueTrends, featureRanking, contentRanking] = await Promise.all([
    request('/auth/me'),
    request('/dashboard/overview'),
    request('/analytics/users/trends?days=14'),
    request('/analytics/revenue/trends?days=14'),
    request('/analytics/features/ranking?days=14&limit=8'),
    request('/analytics/content/ranking?days=14&limit=8')
  ]);

  renderDashboard({ me, overview, userTrends, revenueTrends, featureRanking, contentRanking });
}

function renderDashboard(snapshot) {
  state.admin = snapshot.me;
  updateAuthState();
  renderOverview(snapshot.overview);
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
  renderUserSegments(snapshot.userSegments || snapshot.overview.user_segments || []);
  renderTrendBars('userTrendChart', snapshot.userTrends.items, 'active_users', 'users');
  renderTrendBars('revenueTrendChart', snapshot.revenueTrends.items, 'revenue_amount', 'revenue');
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
    title: item.feature_key || '未命名功能',
    score: formatNumber(item.view_count),
    meta: `点击 ${formatNumber(item.click_count)} / 开始 ${formatNumber(item.start_count)} / 转化 ${formatNumber(item.membership_conversion_count)}`
  }));
  renderRanking('contentRanking', snapshot.contentRanking.items, (item) => ({
    title: item.title || `${item.content_type || 'content'}:${item.content_id || '-'}`,
    score: formatNumber(item.view_count),
    meta: `${item.content_type || 'unknown'} / 完成 ${formatNumber(item.completion_count)} / 收藏 ${formatNumber(item.favorite_count)}`
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
    throw new Error(payload.message || `请求失败：${response.status}`);
  }
  return payload.data;
}

function renderOverview(overview) {
  setText('totalUsersValue', formatNumber(overview.users.total_users));
  setText('todayUsersValue', `今日新增 ${formatNumber(overview.users.today_new_users)}`);
  setText('dauValue', formatNumber(overview.users.dau));
  setText('mauValue', `MAU ${formatNumber(overview.users.mau)} / WAU ${formatNumber(overview.users.wau)}`);
  setText('revenueValue', formatCurrency(overview.revenue.total_revenue));
  setText('paidOrdersValue', `今日支付单量 ${formatNumber(overview.revenue.today_paid_order_count)}`);
  setText('membershipValue', formatNumber(overview.memberships.active_memberships));
  setText(
    'membershipMixValue',
    `试用 ${formatNumber(overview.memberships.trial_memberships)} / 月 ${formatNumber(overview.memberships.month_memberships)} / 季 ${formatNumber(overview.memberships.quarter_memberships)} / 年 ${formatNumber(overview.memberships.year_memberships)}`
  );
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

function renderUserSegments(items) {
  const container = document.getElementById('userSegments');
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前暂无用户分层数据。</div>';
    return;
  }
  items.forEach((item) => {
    const node = document.createElement('div');
    node.className = 'segment-card';
    node.innerHTML = `
      <div class="distribution-topline">
        <span class="distribution-name">${escapeHtml(item.label || item.key || '-')}</span>
        <strong>${escapeHtml(formatNumber(item.count))}</strong>
      </div>
      <span class="distribution-meta">占总用户 ${escapeHtml(formatPercent(item.percentage))}</span>
      <p class="segment-copy">${escapeHtml(item.description || '')}</p>
    `;
    container.appendChild(node);
  });
}

function renderTrendBars(containerId, items, valueKey, tone) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前区间暂无聚合数据，请先执行 admin:stats。</div>';
    return;
  }
  const maxValue = items.reduce((max, item) => Math.max(max, Number(item[valueKey] || 0)), 0) || 1;
  items.forEach((item) => {
    const column = document.createElement('div');
    column.className = 'bar-column';
    const value = Number(item[valueKey] || 0);
    const height = Math.max(8, Math.round((value / maxValue) * 120));
    column.innerHTML = `
      <span class="bar-value">${formatCompact(value)}</span>
      <div class="bar-track">
        <div class="bar-fill ${tone}" style="height:${height}px"></div>
      </div>
      <span class="bar-label">${String(item.stat_date || '').slice(5)}</span>
    `;
    container.appendChild(column);
  });
}

function renderTrendTable(containerId, items, columns) {
  const container = document.getElementById(containerId);
  if (!items || !items.length) {
    container.innerHTML = '';
    return;
  }
  const header = columns.map(([label]) => `<th>${label}</th>`).join('');
  const body = items
    .map((item) => `<tr>${columns.map(([, key]) => `<td>${escapeHtml(String(item[key] ?? '-'))}</td>`).join('')}</tr>`)
    .join('');
  container.innerHTML = `<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`;
}

function renderRanking(containerId, items, mapper) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  if (!items || !items.length) {
    container.innerHTML = '<div class="empty-state">当前区间暂无排行数据，请补齐埋点并执行 admin:stats。</div>';
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

function updateAuthState() {
  authStateText.textContent = state.admin ? `${state.admin.display_name || state.admin.username}` : state.token ? '登录态待校验' : '未登录';
}

function toggleLoading(loading) {
  document.getElementById('loginButton').disabled = loading;
  refreshButton.disabled = loading;
}

function setHint(message, className) {
  loginHint.textContent = message;
  loginHint.className = `hint ${className || ''}`.trim();
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

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
