function normalizeLimit(value, fallback = 20) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.min(100, Math.max(1, parsed)) : fallback;
}

function membershipStatus(row, now = Date.now()) {
  const end = row && row.current_end_date ? new Date(row.current_end_date).getTime() : 0;
  if (row && row.membership_type === 'trial' && end > now) return 'trial';
  if (end > now && row && row.membership_type && row.membership_type !== 'free') return 'active';
  if (row && row.membership_type && row.membership_type !== 'free' && end > 0) return 'expired';
  return 'free';
}

function activityStatus(lastActiveAt, now = Date.now()) {
  if (!lastActiveAt) return 'silent';
  const age = now - new Date(lastActiveAt).getTime();
  if (age <= 7 * 86400000) return 'active_7d';
  if (age <= 30 * 86400000) return 'active_30d';
  return 'inactive';
}

function formatUser(row, includeContact) {
  return {
    id: row.id,
    nickname: row.nickname || `用户${row.id}`,
    phone: includeContact ? row.phone_number || '' : row.phone_number ? '已授权可查看' : '',
    membership_status: membershipStatus(row),
    membership_type: row.membership_type || 'free',
    current_plan: row.current_plan || 'free',
    current_end_date: row.current_end_date || null,
    activity_status: activityStatus(row.last_active_at),
    last_active_at: row.last_active_at || null,
    active_event_count_14d: Number(row.active_event_count_14d || 0),
    service_record_count: Number(row.service_record_count || 0),
    created_at: row.created_at || null
  };
}

async function listUsers(pool, query, includeContact) {
  const limit = normalizeLimit(query && query.limit);
  const offset = Math.max(0, Number(query && query.offset || 0));
  const [rows] = await pool.execute(`SELECT u.id, u.nickname, u.phone_number, u.created_at,
      memberships.membership_type, memberships.current_plan, memberships.current_end_date,
      activity.last_active_at, COALESCE(activity.active_event_count_14d, 0) AS active_event_count_14d,
      (SELECT COUNT(*) FROM support_tickets tickets WHERE tickets.user_id = u.id) AS service_record_count
    FROM users u
    LEFT JOIN user_memberships memberships ON memberships.user_id = u.id
    LEFT JOIN (SELECT user_id, MAX(created_at) AS last_active_at, COUNT(*) AS active_event_count_14d
      FROM event_tracks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 14 DAY) GROUP BY user_id) activity
      ON activity.user_id = u.id
    ORDER BY COALESCE(activity.last_active_at, u.created_at) DESC, u.id DESC LIMIT ${limit} OFFSET ${offset}`);
  return { items: rows.map((row) => formatUser(row, includeContact)), limit, offset };
}

async function listServiceRecords(pool, userId) {
  const [tickets] = await pool.execute('SELECT id, type, content, status, public_progress, created_at, updated_at FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 50', [userId]);
  return tickets.map((item) => ({ ...item, record_type: 'support_ticket' }));
}

module.exports = { normalizeLimit, membershipStatus, activityStatus, formatUser, listUsers, listServiceRecords };
