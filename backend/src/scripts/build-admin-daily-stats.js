const fs = require('fs');
const path = require('path');
let mysql = null;
const { aggregateContentCoverage, aggregateEventQuality } = require('../mysql-production/analytics-quality');
const { aggregateOperationsMetrics, aggregateSupportMetrics } = require('../mysql-production/operations-analytics');

async function main() {
  loadEnv(path.resolve(__dirname, '../../../.env'));
  loadEnv('/home/ubuntu/niuniu-parenting/.env');
  mysql = mysql || require('mysql2/promise');
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await upsertDailyUserStats(connection, statDate);
    await upsertDailyRevenueStats(connection, statDate);
    await rebuildDailyFeatureStats(connection, statDate);
    await rebuildDailyContentStats(connection, statDate);
    await rebuildDailyFunnelStats(connection, statDate);
    await rebuildAnalyticsAggregates(connection, statDate);
    await rebuildOperationsQualityStats(connection, statDate);
    await connection.commit();
    console.log(`Admin daily stats updated for ${statDate}`);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

async function rebuildOperationsQualityStats(pool, statDate) {
  const [versions] = await pool.execute('SELECT created_at, publish_status, published_at FROM content_versions WHERE created_at < DATE_ADD(?, INTERVAL 1 DAY)', [statDate]);
  const [reviews] = await pool.execute('SELECT r.created_at, r.decision, v.created_at AS submitted_at, r.created_at AS reviewed_at FROM content_reviews r LEFT JOIN content_versions v ON v.id = r.content_version_id WHERE r.created_at >= ? AND r.created_at < DATE_ADD(?, INTERVAL 1 DAY)', [statDate, statDate]);
  const [media] = await pool.execute('SELECT status, created_at, updated_at FROM media_assets WHERE updated_at >= ? AND updated_at < DATE_ADD(?, INTERVAL 1 DAY)', [statDate, statDate]);
  const [usage] = await pool.execute(`SELECT created_at, event_type FROM event_tracks WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) AND (event_type LIKE '%content%' OR event_type LIKE 'article_%' OR event_type LIKE 'knowledge_%' OR event_type LIKE 'task_%' OR event_type LIKE 'recipe_%')`, [statDate, statDate]);
  const [restores] = await pool.execute(`SELECT created_at FROM admin_audit_logs WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) AND action_type LIKE '%restore%'`, [statDate, statDate]);
  const [tickets] = await pool.execute('SELECT status, created_at, updated_at FROM support_tickets WHERE created_at < DATE_ADD(?, INTERVAL 1 DAY)', [statDate]);
  const [ticketEvents] = await pool.execute('SELECT event_type, callback_method, callback_result, created_at FROM support_ticket_events WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)', [statDate, statDate]);
  const aggregates = [
    ['operations_quality', aggregateOperationsMetrics({ versions, reviews, media, usage, restores }, { startDate: statDate, endDate: statDate })],
    ['support_quality', aggregateSupportMetrics({ tickets, events: ticketEvents }, { startDate: statDate, endDate: statDate })]
  ];
  for (const [aggregateType, metrics] of aggregates) {
    await pool.execute(`INSERT INTO analytics_daily_aggregates (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key, metrics, aggregate_version) VALUES (?, ?, '', '', '', '', ?, 1) ON DUPLICATE KEY UPDATE metrics = VALUES(metrics), aggregate_version = VALUES(aggregate_version)`, [statDate, aggregateType, JSON.stringify(metrics)]);
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
          WHERE et.created_at >= ? AND et.created_at < DATE_ADD(?, INTERVAL 1 DAY)
            AND um.status = 'active'
            AND um.current_end_date IS NOT NULL
            AND um.current_end_date >= DATE_ADD(?, INTERVAL 1 DAY)) AS paid_active_users,
        (SELECT COUNT(*) FROM user_memberships
          WHERE is_trial_used = 1 AND updated_at >= ? AND updated_at < DATE_ADD(?, INTERVAL 1 DAY)) AS trial_users,
        (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) AND (event_type IN ('ai_chat_submit', 'ai_chat_response_success', 'ai_chat_response_fallback', 'ai_chat_reply', 'article_ai_followup') OR event_type LIKE 'ai_chat_%')) AS ai_users,
        (SELECT COUNT(DISTINCT user_id) FROM event_tracks WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY) AND event_type IN ('article_detail_view', 'knowledge_detail_view', 'recipe_detail_view', 'task_start', 'task_complete', 'training_task_complete')) AS content_users`,
     [statDate, statDate, statDate, statDate, statDate, statDate, statDate, statDate, statDate, statDate, statDate, statDate]
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
      WHERE COALESCE(paid_at, created_at) >= ? AND COALESCE(paid_at, created_at) < DATE_ADD(?, INTERVAL 1 DAY)`,
     [statDate, statDate]
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
         SELECT ${buildFeatureKeySql('event_data', 'event_type')} AS feature_key,
                CASE WHEN event_type LIKE '%_view' OR event_type IN ('task_exposure', 'share_preview', 'membership_touchpoint_exposure', 'scene_search_exposure', 'growth_record_open', 'weekly_summary_view') THEN 1 ELSE 0 END AS view_count,
                CASE WHEN event_type LIKE '%_click' OR event_type IN ('share_entry', 'share_copy', 'membership_plan_select', 'daily_plan_click', 'article_entry_click', 'recipe_entry_click', 'weekly_summary_action_click') THEN 1 ELSE 0 END AS click_count,
                CASE WHEN event_type LIKE '%_start' OR event_type = 'task_start' THEN 1 ELSE 0 END AS start_count,
                CASE WHEN event_type LIKE '%_complete' OR event_type IN ('task_complete', 'retell_complete', 'path_day_complete', 'output_submit', 'growth_record_submit', 'membership_payment_success', 'tonight_action_save', 'action_effect_submit') THEN 1 ELSE 0 END AS complete_count,
                CASE WHEN event_type IN ('membership_page_view', 'membership_center_view', 'membership_touchpoint_exposure') THEN 1 ELSE 0 END AS paywall_visit_count,
                CASE WHEN event_type IN ('payment_order_success', 'membership_payment_success') THEN 1 ELSE 0 END AS membership_conversion_count
           FROM event_tracks
           WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
       ) t
      WHERE feature_key <> 'unclassified'
      GROUP BY feature_key`,
     [statDate, statDate, statDate]
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
          SELECT ${buildContentTypeSql('et.event_data', 'et.event_type')} AS content_type,
                 ${buildContentIdSql('et.event_data')} AS content_id,
                 CASE
                   WHEN ${buildContentTypeSql('et.event_data', 'et.event_type')} = 'article' THEN COALESCE(a.title, JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.event_meta.title')), '')
                   WHEN ${buildContentTypeSql('et.event_data', 'et.event_type')} = 'reading_task' THEN COALESCE(rt.title, JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.event_meta.title')), '')
                   WHEN JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.event_meta.title')) IS NOT NULL THEN JSON_UNQUOTE(JSON_EXTRACT(et.event_data, '$.event_meta.title'))
                   ELSE ${buildContentFallbackTitleSql('et.event_data', 'et.event_type')}
                 END AS title,
                CASE WHEN et.event_type LIKE '%_view' OR et.event_type = 'knowledge_detail_view' THEN 1 ELSE 0 END AS view_count,
                 CASE WHEN et.event_type REGEXP '(^|_)favorite$' THEN 1 ELSE 0 END AS favorite_count,
                CASE WHEN et.event_type LIKE '%like%' THEN 1 ELSE 0 END AS like_count,
                CASE WHEN et.event_type LIKE '%comment%' THEN 1 ELSE 0 END AS comment_count,
                CASE WHEN et.event_type LIKE '%_complete' OR et.event_type IN ('task_complete', 'retell_complete', 'output_submit') THEN 1 ELSE 0 END AS completion_count
           FROM event_tracks et
            LEFT JOIN articles a
              ON ${buildContentTypeSql('et.event_data', 'et.event_type')} = 'article'
             AND ${buildNumericContentIdSql('et.event_data')} = a.id
            LEFT JOIN reading_tasks rt
              ON ${buildContentTypeSql('et.event_data', 'et.event_type')} = 'reading_task'
             AND ${buildNumericContentIdSql('et.event_data')} = rt.id
           WHERE et.created_at >= ? AND et.created_at < DATE_ADD(?, INTERVAL 1 DAY)
       ) source
      WHERE source.content_type <> '' AND source.content_id <> ''
      GROUP BY source.content_type, source.content_id`,
     [statDate, statDate, statDate]
  );
}

const GROWTH_FUNNEL_STEPS = Object.freeze([
  ['observation', ['ability_observation_exposure', 'assessment_start']],
  ['profile', ['ability_profile_view', 'ability_observation_complete', 'assessment_complete']],
  ['training', ['training_task_view', 'training_task_complete', 'task_complete']],
  ['feedback', ['training_feedback_submit', 'training_feedback']],
  ['report', ['stage_report_view', 'weekly_summary_view']],
  ['membership', ['membership_touchpoint_exposure', 'membership_page_view']],
  ['payment', ['payment_order_success', 'payment_success']]
]);

async function rebuildDailyFunnelStats(pool, statDate) {
  await pool.execute('DELETE FROM admin_daily_funnel_stats WHERE stat_date = ?', [statDate]);
  for (const [stepKey, eventTypes] of GROWTH_FUNNEL_STEPS) {
    const placeholders = eventTypes.map(() => '?').join(', ');
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS event_count, COUNT(DISTINCT user_id) AS user_count
         FROM event_tracks
        WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
          AND event_type IN (${placeholders})`,
      [statDate, statDate].concat(eventTypes)
    );
    const row = rows[0] || {};
    await pool.execute(
      `INSERT INTO admin_daily_funnel_stats
        (stat_date, funnel_key, step_key, user_count, event_count, conversion_rate)
       VALUES (?, 'growth_loop', ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_count = VALUES(user_count), event_count = VALUES(event_count), conversion_rate = VALUES(conversion_rate)`,
      [statDate, stepKey, Number(row.user_count || 0), Number(row.event_count || 0), 0]
    );
  }
  const [funnelRows] = await pool.execute(
    `SELECT id, user_count
       FROM admin_daily_funnel_stats
      WHERE stat_date = ? AND funnel_key = 'growth_loop'
      ORDER BY FIELD(step_key, 'observation', 'profile', 'training', 'feedback', 'report', 'membership', 'payment')`,
    [statDate]
  );
  const base = Number(funnelRows[0] && funnelRows[0].user_count || 0);
  for (const row of funnelRows) {
    await pool.execute('UPDATE admin_daily_funnel_stats SET conversion_rate = ? WHERE id = ?', [base ? Number(((Number(row.user_count || 0) / base) * 100).toFixed(4)) : 0, row.id]);
  }
}

async function rebuildAnalyticsAggregates(pool, statDate) {
  await pool.execute('DELETE FROM analytics_daily_aggregates WHERE stat_date = ?', [statDate]);
  await pool.execute(
    `INSERT INTO analytics_daily_aggregates
      (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key, metrics, aggregate_version)
     SELECT ?, 'growth_dimension',
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.age_segment_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.age_segment_key')), ''), 'unknown'),
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.ability_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.ability_codes')), ''), 'unknown'),
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.membership_status')), ''), 'free'),
       event_type,
       JSON_OBJECT('event_count', COUNT(*), 'user_count', COUNT(DISTINCT user_id), 'child_count', COUNT(DISTINCT NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.child_id')), '')), 'complete_count', SUM(CASE WHEN event_type LIKE '%_complete' OR event_type IN ('payment_order_success', 'payment_success') THEN 1 ELSE 0 END)),
       1
       FROM event_tracks
      WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY age_segment_code, ability_code, membership_status, source_key`,
    [statDate, statDate, statDate]
  );
  await pool.execute(
    `INSERT INTO analytics_daily_aggregates
      (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key, metrics, aggregate_version)
     SELECT ?, 'membership_attribution',
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.age_segment_code')), ''), 'unknown'),
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.ability_code')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.ability_codes')), ''), 'unknown'),
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.membership_status')), ''), 'free'),
       COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.membership_entry_source')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(event_data, '$.source_module')), ''), 'unknown'),
       JSON_OBJECT('exposure_count', SUM(CASE WHEN event_type IN ('membership_touchpoint_exposure', 'membership_page_view') THEN 1 ELSE 0 END), 'click_count', SUM(CASE WHEN event_type IN ('membership_touchpoint_click', 'membership_plan_select') THEN 1 ELSE 0 END), 'order_count', SUM(CASE WHEN event_type IN ('payment_order_create', 'payment_create') THEN 1 ELSE 0 END), 'paid_count', SUM(CASE WHEN event_type IN ('payment_order_success', 'payment_success') THEN 1 ELSE 0 END), 'revenue_amount', 0),
       1
       FROM event_tracks
      WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
      GROUP BY age_segment_code, ability_code, membership_status, source_key`,
    [statDate, statDate, statDate]
  );
  await pool.execute(
    `INSERT INTO analytics_daily_aggregates
      (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key, metrics, aggregate_version)
     SELECT ?, 'content_quality', '', '', review_status,
       content_type,
       JSON_OBJECT('content_count', COUNT(*), 'metadata_complete_count', SUM(CASE WHEN JSON_LENGTH(age_segment_codes) > 0 AND JSON_LENGTH(ability_codes) > 0 AND source_name <> '' THEN 1 ELSE 0 END), 'published_count', SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END)),
       1
       FROM knowledge_contents
      GROUP BY review_status, content_type`,
     [statDate]
  );

  const [eventRows] = await pool.execute(
    `SELECT event_id, event_type, event_data, session_id, created_at
       FROM event_tracks
      WHERE created_at >= ? AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
    [statDate, statDate]
  );
  const eventQuality = aggregateEventQuality(eventRows);
  await pool.execute(
    `INSERT INTO analytics_daily_aggregates
      (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key, metrics, aggregate_version)
     VALUES (?, 'event_quality', '', '', '', '', ?, 1)
     ON DUPLICATE KEY UPDATE metrics = VALUES(metrics), aggregate_version = VALUES(aggregate_version)`,
    [statDate, JSON.stringify(eventQuality)]
  );

  const [contentRows] = await pool.execute(
    `SELECT age_segment_codes, ability_codes, scene_codes, content_form, is_published
       FROM knowledge_contents
      WHERE updated_at < DATE_ADD(?, INTERVAL 1 DAY)`,
    [statDate]
  );
  const contentCoverage = aggregateContentCoverage(contentRows);
  await pool.execute(
    `INSERT INTO analytics_daily_aggregates
      (stat_date, aggregate_type, age_segment_code, ability_code, membership_status, source_key, metrics, aggregate_version)
     VALUES (?, 'content_coverage', '', '', '', '', ?, 1)
     ON DUPLICATE KEY UPDATE metrics = VALUES(metrics), aggregate_version = VALUES(aggregate_version)`,
    [statDate, JSON.stringify(contentCoverage)]
  );
}

function buildFeatureKeySql(eventDataExpr, eventTypeExpr) {
  return `CASE
    WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.module_key')), '') IN ('membership_center', 'membership_touchpoint') THEN 'membership'
    WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.module_key')), '') IN ('daily_guidance') THEN 'daily_guidance'
    WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.module_key')), '') IN ('scene_search') THEN 'scene_search'
    WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.module_key')), '') IS NOT NULL THEN JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.module_key'))
    WHEN ${eventTypeExpr} LIKE 'task_%' OR ${eventTypeExpr} IN ('retell_complete', 'path_day_complete', 'path_dropout') THEN 'reading_tasks'
    WHEN ${eventTypeExpr} LIKE 'ai_chat_%' OR ${eventTypeExpr} = 'article_ai_followup' THEN 'ai_chat'
    WHEN ${eventTypeExpr} LIKE 'assessment_%' OR ${eventTypeExpr} = 'output_submit' THEN 'assessment'
    WHEN ${eventTypeExpr} LIKE 'recipe_%' THEN 'nutrition_recipe'
    WHEN ${eventTypeExpr} LIKE 'article_%' OR ${eventTypeExpr} LIKE 'knowledge_%' THEN 'knowledge'
    WHEN ${eventTypeExpr} LIKE 'membership_%' OR ${eventTypeExpr} LIKE 'payment_%' THEN 'membership'
    WHEN ${eventTypeExpr} LIKE 'share_%' THEN 'share'
    WHEN ${eventTypeExpr} LIKE 'daily_plan_%' THEN 'daily_guidance'
    WHEN ${eventTypeExpr} LIKE 'scene_search_%' THEN 'scene_search'
    WHEN ${eventTypeExpr} LIKE 'growth_record_%' THEN 'growth_record'
    WHEN ${eventTypeExpr} LIKE 'weekly_summary_%' THEN 'weekly_summary'
    ELSE 'unclassified'
  END`;
}

function buildContentTypeSql(eventDataExpr, eventTypeExpr) {
  return `CASE
    WHEN NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.content_type')), '') IS NOT NULL THEN JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.content_type'))
    WHEN ${eventTypeExpr} LIKE 'recipe_%' THEN 'recipe'
    WHEN ${eventTypeExpr} LIKE 'article_%' THEN 'article'
    WHEN ${eventTypeExpr} LIKE 'knowledge_%' THEN 'knowledge_point'
    WHEN ${eventTypeExpr} LIKE 'task_%' OR ${eventTypeExpr} IN ('retell_complete', 'path_day_complete') THEN 'reading_task'
    WHEN ${eventTypeExpr} LIKE 'daily_plan_%' THEN 'daily_plan'
    ELSE ''
  END`;
}

function buildContentIdSql(eventDataExpr) {
  return `COALESCE(
    NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.content_id')), ''), 'null'),
    NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.task_id')), ''), 'null'),
    NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.path_id')), ''), 'null'),
    NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.event_meta.id')), ''), 'null'),
    NULLIF(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.event_meta.code')), ''), 'null'),
    ''
  )`;
}

function buildNumericContentIdSql(eventDataExpr) {
  const contentId = buildContentIdSql(eventDataExpr);
  return `CASE WHEN ${contentId} REGEXP '^[0-9]+$' THEN CAST(${contentId} AS UNSIGNED) ELSE NULL END`;
}

function buildContentFallbackTitleSql(eventDataExpr, eventTypeExpr) {
  return `CASE
    WHEN ${eventTypeExpr} LIKE 'recipe_%' THEN CONCAT('营养食谱 ', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.content_id')), ''), ''))
    WHEN ${eventTypeExpr} LIKE 'knowledge_%' THEN CONCAT('知识卡片 ', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.content_id')), ''), ''))
    WHEN ${eventTypeExpr} LIKE 'task_%' OR ${eventTypeExpr} IN ('retell_complete', 'path_day_complete') THEN CONCAT('阅读任务 ', COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.content_id')), ''), NULLIF(JSON_UNQUOTE(JSON_EXTRACT(${eventDataExpr}, '$.task_id')), ''), ''))
    WHEN ${eventTypeExpr} LIKE 'daily_plan_%' THEN '每日指导计划'
    ELSE ''
  END`;
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

if (require.main === module) {
  main().catch((error) => {
    console.error('[build-admin-daily-stats]', error.message);
    process.exit(1);
  });
}

module.exports = {
  buildContentFallbackTitleSql,
  buildContentIdSql,
  buildContentTypeSql,
  buildFeatureKeySql,
  buildNumericContentIdSql,
  formatDate,
  rebuildOperationsQualityStats
};
