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

async function publishDue(connection, now = new Date()) {
  const [jobs] = await connection.execute(
    `SELECT id, content_type, content_id, version_id FROM content_publish_jobs
     WHERE status = 'pending' AND scheduled_at <= ? ORDER BY id ASC FOR UPDATE`, [now]
  );
  let published = 0;
  for (const job of jobs) {
    const [result] = await connection.execute(
      `UPDATE content_versions SET publish_status = 'published', published_at = ?
       WHERE id = ? AND review_status = 'approved' AND publish_status IN ('approved', 'scheduled')`, [now, job.version_id]
    );
    await connection.execute(`UPDATE content_publish_jobs SET status = 'completed', completed_at = ? WHERE id = ? AND status = 'pending'`, [now, job.id]);
    published += Number(result.affectedRows || 0);
  }
  return published;
}

module.exports = { TRANSITIONS, canTransition, assertTransition, isPublicVersion, nextVersion, publishDue };
