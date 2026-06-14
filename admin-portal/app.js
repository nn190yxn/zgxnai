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

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
