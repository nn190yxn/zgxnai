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

  state.admin = me;
  updateAuthState();
  renderOverview(overview);
  renderTrendBars('userTrendChart', userTrends.items, 'active_users', 'users');
  renderTrendBars('revenueTrendChart', revenueTrends.items, 'revenue_amount', 'revenue');
  renderTrendTable('userTrendTable', userTrends.items, [
    ['日期', 'stat_date'],
    ['新增', 'new_users'],
    ['活跃', 'active_users'],
    ['付费活跃', 'paid_active_users'],
    ['AI 用户', 'ai_users']
  ]);
  renderTrendTable('revenueTrendTable', revenueTrends.items, [
    ['日期', 'stat_date'],
    ['收入', 'revenue_amount'],
    ['支付单', 'paid_order_count'],
    ['付费用户', 'paid_users'],
    ['新付费', 'new_paid_users']
  ]);
  renderRanking('featureRanking', featureRanking.items, (item) => ({
    title: item.feature_key || '未命名功能',
    score: formatNumber(item.view_count),
    meta: `点击 ${formatNumber(item.click_count)} / 开始 ${formatNumber(item.start_count)} / 转化 ${formatNumber(item.membership_conversion_count)}`
  }));
  renderRanking('contentRanking', contentRanking.items, (item) => ({
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
