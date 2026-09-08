const TRANSITIONS = Object.freeze({
  draft: ['pending_review'],
  pending_review: ['approved', 'rejected'],
  rejected: ['draft'],
  approved: ['scheduled', 'published'],
  scheduled: ['published'],
  published: ['offline'],
  offline: ['draft']
});

function canTransition(from, to) {
  return Boolean(TRANSITIONS[String(from || '')] && TRANSITIONS[from].includes(to));
}

function assertTransition(from, to) {
  if (!canTransition(from, to)) {
    const error = new Error(`内容状态不能从 ${from} 变更为 ${to}`);
    error.code = 'CONTENT_INVALID_TRANSITION';
    error.statusCode = 409;
    throw error;
  }
}

function isPublicVersion(row, now = new Date()) {
  if (!row || row.review_status !== 'approved' || row.publish_status !== 'published') return false;
  if (row.published_at && new Date(row.published_at) > now) return false;
  return true;
}

function nextVersion(rows) {
  return rows.reduce((max, row) => Math.max(max, Number(row.version) || 0), 0) + 1;
}

async function publishVersion(connection, versionId, now = new Date()) {
  const [rows] = await connection.execute('SELECT * FROM content_versions WHERE id = ? FOR UPDATE', [versionId]);
  const row = rows[0];
  if (!row || row.review_status !== 'approved' || !['approved', 'scheduled'].includes(row.publish_status)) return false;
  const [newer] = await connection.execute(
    'SELECT id FROM content_versions WHERE content_type = ? AND content_id = ? AND version > ? AND published_at IS NOT NULL LIMIT 1 FOR UPDATE',
    [row.content_type, row.content_id, row.version]
  );
  if (newer.length) return false;
  const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
  if (row.content_type === 'task' || row.content_type === 'recipe') {
    const { sourceItems, normalizeEdit, TASK_FIELDS } = require('./managed-editing');
    const sources = await sourceItems(connection, row.content_type, row.content_id);
    if (!sources.length) throw new Error('Managed content source no longer exists');
    const normalized = normalizeEdit(row.content_type, sources[0], payload);
    if (row.content_type === 'task') await connection.execute(`UPDATE reading_tasks SET ${TASK_FIELDS.map((field) => `${field} = ?`).join(', ')} WHERE task_code = ?`, TASK_FIELDS.map((field) => normalized[field] ?? null).concat(row.content_id));
  }
  if (row.content_type === 'article') {
    const { ARTICLE_FIELDS } = require('./platform-contract');
    const fields = ARTICLE_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
    await connection.execute(`UPDATE articles SET ${fields.map((field) => `${field} = ?, `).join('')}is_published = 1 WHERE id = ?`, fields.map((field) => payload[field]).concat(row.content_id));
  }
  await connection.execute("UPDATE content_versions SET publish_status = 'offline' WHERE content_type = ? AND content_id = ? AND id <> ? AND publish_status = 'published'", [row.content_type, row.content_id, row.id]);
  await connection.execute("UPDATE content_versions SET publish_status = 'published', published_at = ? WHERE id = ?", [now, row.id]);
  return true;
}

async function publishDue(connection, now = new Date()) {
  const [jobs] = await connection.execute(
    `SELECT id, content_type, content_id, version_id FROM content_publish_jobs
     WHERE status = 'pending' AND scheduled_at <= ? ORDER BY id ASC FOR UPDATE`, [now]
  );
  let published = 0;
  for (const job of jobs) {
    if (await publishVersion(connection, job.version_id, now)) {
      await connection.execute(`UPDATE content_publish_jobs SET status = 'completed', completed_at = ?, attempt_count = attempt_count + 1 WHERE id = ? AND status = 'pending'`, [now, job.id]);
      published += 1;
    } else {
      await connection.execute(`UPDATE content_publish_jobs SET status = 'failed', failed_at = ?, failure_code = 'CONTENT_VERSION_NOT_PUBLISHABLE', attempt_count = attempt_count + 1 WHERE id = ? AND status = 'pending'`, [now, job.id]);
    }
  }
  return published;
}

module.exports = { TRANSITIONS, canTransition, assertTransition, isPublicVersion, nextVersion, publishVersion, publishDue };
