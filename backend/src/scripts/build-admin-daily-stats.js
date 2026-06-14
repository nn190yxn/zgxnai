const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

async function main() {
  const statDate = String(process.argv[2] || '').trim() || formatDate(new Date(Date.now() - 86400000));
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0
  });

  try {
    await upsertDailyUserStats(pool, statDate);
    await upsertDailyRevenueStats(pool, statDate);
    await rebuildDailyFeatureStats(pool, statDate);
    await rebuildDailyContentStats(pool, statDate);
    console.log(`Admin daily stats updated for ${statDate}`);
  } finally {
    await pool.end();
  }
}

async function upsertDailyUserStats(pool, statDate) {
  const [userRows] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE DATE(created_at) = ?) AS new_users,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE DATE(created_at) = ?) AS active_users,
       (SELECT COUNT(DISTINCT et.user_id)
          FROM event_tracks et
          INNER JOIN user_memberships um ON um.user_id = et.user_id
         WHERE DATE(et.created_at) = ?
           AND um.current_end_date IS NOT NULL
           AND um.current_end_date >= NOW()) AS paid_active_users,
       (SELECT COUNT(*) FROM user_memberships WHERE is_trial_used = 1 AND DATE(updated_at) = ?) AS trial_users,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE DATE(created_at) = ? AND event_type IN ('ai_chat_submit', 'ai_chat_response_success', 'ai_chat_response_fallback')) AS ai_users,
       (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE DATE(created_at) = ? AND event_type IN ('article_detail_view', 'knowledge_detail_view', 'recipe_detail_view', 'task_start', 'task_complete')) AS content_users`,
    [statDate, statDate, statDate, statDate, statDate, statDate]
  );

  const stats = userRows[0] || {};
  await pool.execute(
    `INSERT INTO admin_daily_user_stats
       (stat_date, new_users, active_users, paid_active_users, trial_users, ai_users, content_users)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       new_users = VALUES(new_users),
       active_users = VALUES(active_users),
       paid_active_users = VALUES(paid_active_users),
       trial_users = VALUES(trial_users),
       ai_users = VALUES(ai_users),
       content_users = VALUES(content_users)`,
    [statDate, stats.new_users || 0, stats.active_users || 0, stats.paid_active_users || 0, stats.trial_users || 0, stats.ai_users || 0, stats.content_users || 0]
  );
}

async function upsertDailyRevenueStats(pool, statDate) {
  const [revenueRows] = await pool.execute(
    `SELECT
       COUNT(DISTINCT CASE WHEN status = 'paid' THEN user_id END) AS paid_users,
       COUNT(*) AS order_count,
       SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_order_count,
       COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS revenue_amount,
       SUM(CASE WHEN status = 'paid' AND plan_code = 'month' THEN 1 ELSE 0 END) AS month_membership_count,
       SUM(CASE WHEN status = 'paid' AND plan_code = 'quarter' THEN 1 ELSE 0 END) AS quarter_membership_count,
       SUM(CASE WHEN status = 'paid' AND plan_code = 'year' THEN 1 ELSE 0 END) AS year_membership_count
     FROM payment_orders
     WHERE DATE(COALESCE(paid_at, created_at)) = ?`,
    [statDate]
  );

  const [newPaidRows] = await pool.execute(
    `SELECT COUNT(*) AS new_paid_users
       FROM (
         SELECT user_id, MIN(DATE(COALESCE(paid_at, created_at))) AS first_paid_date
           FROM payment_orders
          WHERE status = 'paid'
          GROUP BY user_id
       ) t
      WHERE first_paid_date = ?`,
    [statDate]
  );

  const stats = revenueRows[0] || {};
  const newPaidUsers = (newPaidRows[0] && newPaidRows[0].new_paid_users) || 0;
  await pool.execute(
    `INSERT INTO admin_daily_revenue_stats
       (stat_date, paid_users, new_paid_users, order_count, paid_order_count, revenue_amount, month_membership_count, quarter_membership_count, year_membership_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       paid_users = VALUES(paid_users),
       new_paid_users = VALUES(new_paid_users),
       order_count = VALUES(order_count),
       paid_order_count = VALUES(paid_order_count),
       revenue_amount = VALUES(revenue_amount),
       month_membership_count = VALUES(month_membership_count),
       quarter_membership_count = VALUES(quarter_membership_count),
       year_membership_count = VALUES(year_membership_count)`,
    [
      statDate,
      stats.paid_users || 0,
      newPaidUsers,
      stats.order_count || 0,
      stats.paid_order_count || 0,
      stats.revenue_amount || 0,
      stats.month_membership_count || 0,
      stats.quarter_membership_count || 0,
      stats.year_membership_count || 0
    ]
  );
}

async function rebuildDailyFeatureStats(pool, statDate) {
  await pool.execute('DELETE FROM admin_daily_feature_stats WHERE stat_date = ?', [statDate]);
  await pool.execute(
    `INSERT INTO admin_daily_feature_stats
       (stat_date, feature_key, view_count, click_count, start_count, complete_count, paywall_visit_count, membership_conversion_count)
     SELECT ?,
            feature_key,
            SUM(view_count),
            SUM(click_count),
            SUM(start_count),
            SUM(complete_count),
            SUM(paywall_visit_count),
            SUM(membership_conversion_count)
       FROM (
         SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.module_key')), 'unknown') AS feature_key,
                CASE WHEN event_type LIKE '%_view' OR event_type IN ('task_exposure', 'share_preview') THEN 1 ELSE 0 END AS view_count,
                CASE WHEN event_type LIKE '%_click' OR event_type IN ('share_entry', 'share_copy') THEN 1 ELSE 0 END AS click_count,
                CASE WHEN event_type LIKE '%_start' OR event_type = 'task_start' THEN 1 ELSE 0 END AS start_count,
                CASE WHEN event_type LIKE '%_complete' OR event_type IN ('task_complete', 'retell_complete', 'path_day_complete') THEN 1 ELSE 0 END AS complete_count,
                CASE WHEN event_type = 'membership_page_view' THEN 1 ELSE 0 END AS paywall_visit_count,
                CASE WHEN event_type = 'payment_order_success' THEN 1 ELSE 0 END AS membership_conversion_count
           FROM event_tracks
          WHERE DATE(created_at) = ?
       ) t
      GROUP BY feature_key`,
    [statDate, statDate]
  );
}

async function rebuildDailyContentStats(pool, statDate) {
  await pool.execute('DELETE FROM admin_daily_content_stats WHERE stat_date = ?', [statDate]);
  await pool.execute(
    `INSERT INTO admin_daily_content_stats
       (stat_date, content_type, content_id, title, view_count, favorite_count, like_count, comment_count, completion_count)
     SELECT ?,
            source.content_type,
            source.content_id,
            MAX(source.title) AS title,
            SUM(source.view_count) AS view_count,
            SUM(source.favorite_count) AS favorite_count,
            SUM(source.like_count) AS like_count,
            SUM(source.comment_count) AS comment_count,
            SUM(source.completion_count) AS completion_count
       FROM (
         SELECT COALESCE(JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_type')), '') AS content_type,
                COALESCE(JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_id')), '') AS content_id,
                CASE
                  WHEN JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_type')) = 'article' THEN a.title
                  WHEN JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_type')) = 'reading_task' THEN rt.title
                  ELSE COALESCE(JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.event_meta.title')), '')
                END AS title,
                CASE WHEN et.event_type LIKE '%_view' OR et.event_type = 'knowledge_detail_view' THEN 1 ELSE 0 END AS view_count,
                CASE WHEN et.event_type LIKE '%favorite%' THEN 1 ELSE 0 END AS favorite_count,
                CASE WHEN et.event_type LIKE '%like%' THEN 1 ELSE 0 END AS like_count,
                CASE WHEN et.event_type LIKE '%comment%' THEN 1 ELSE 0 END AS comment_count,
                CASE WHEN et.event_type LIKE '%_complete' OR et.event_type IN ('task_complete', 'retell_complete') THEN 1 ELSE 0 END AS completion_count
           FROM event_tracks et
           LEFT JOIN articles a
             ON JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_type')) = 'article'
            AND CAST(JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_id')) AS UNSIGNED) = a.id
           LEFT JOIN reading_tasks rt
             ON JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_type')) = 'reading_task'
            AND CAST(JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.content_id')) AS UNSIGNED) = rt.id
          WHERE DATE(et.created_at) = ?
       ) source
      WHERE source.content_type <> '' AND source.content_id <> ''
      GROUP BY source.content_type, source.content_id`,
    [statDate, statDate]
  );
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const index = line.indexOf('=');
    if (index === -1) {
      continue;
    }
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

main().catch((error) => {
  console.error('[build-admin-daily-stats]', error.message);
  process.exit(1);
});
