const SENSITIVE_KEYS = /token|password|secret|api[_-]?key|cookie|authorization|private[_-]?key|contact|phone/i;

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function inRange(value, startDate, endDate) {
  const date = toDate(value);
  const start = toDate(`${startDate}T00:00:00Z`);
  const end = toDate(`${endDate}T23:59:59.999Z`);
  return Boolean(date && start && end && date >= start && date <= end);
}

function durationHours(start, end) {
  const from = toDate(start);
  const to = toDate(end);
  return from && to && to >= from ? (to - from) / 3600000 : 0;
}

function safeObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.keys(value).reduce((result, key) => {
    if (!SENSITIVE_KEYS.test(key)) {
      result[key] = value[key] && typeof value[key] === 'object' && !Array.isArray(value[key])
        ? safeObject(value[key])
        : value[key];
    }
    return result;
  }, {});
}

function aggregateOperationsMetrics(input = {}, range = {}) {
  const startDate = range.startDate || range.start_date;
  const endDate = range.endDate || range.end_date || startDate;
  const versions = (input.versions || []).filter((row) => inRange(row.created_at, startDate, endDate));
  const reviews = (input.reviews || []).filter((row) => inRange(row.created_at, startDate, endDate));
  const media = (input.media || []).filter((row) => inRange(row.updated_at || row.created_at, startDate, endDate));
  const usage = (input.usage || []).filter((row) => inRange(row.created_at || row.occurred_at, startDate, endDate));
  const restores = (input.restores || []).filter((row) => inRange(row.created_at, startDate, endDate));
  const reviewDurations = reviews.map((row) => durationHours(row.submitted_at || row.created_at, row.reviewed_at || row.decided_at)).filter((value) => value > 0);
  return {
    content_created_count: versions.length,
    review_submitted_count: reviews.filter((row) => row.decision === 'submitted' || row.event_type === 'submit_review').length,
    review_approved_count: reviews.filter((row) => row.decision === 'approved' || row.decision === 'approve').length,
    published_count: versions.filter((row) => row.publish_status === 'published' || row.published_at).length,
    average_review_hours: reviewDurations.length ? Number((reviewDurations.reduce((a, b) => a + b, 0) / reviewDurations.length).toFixed(2)) : 0,
    content_usage_count: usage.length,
    media_failure_count: media.filter((row) => row.status === 'failed' || row.event_type === 'media_failed').length,
    version_restore_count: restores.length
  };
}

function aggregateSupportMetrics(input = {}, range = {}) {
  const startDate = range.startDate || range.start_date;
  const endDate = range.endDate || range.end_date || startDate;
  const tickets = input.tickets || [];
  const events = (input.events || []).filter((row) => inRange(row.created_at, startDate, endDate));
  const callbacks = events.filter((row) => row.event_type === 'callback' || row.callback_method || row.callback_result);
  const closed = events.filter((row) => row.event_type === 'closed' || row.status === 'closed');
  const processingDurations = tickets.map((row) => durationHours(row.created_at, row.closed_at || row.updated_at)).filter(Boolean);
  const callbackResults = callbacks.filter((row) => String(row.callback_result || '').trim());
  const outcomes = callbackResults.reduce((result, row) => {
    const key = String(row.callback_result || 'unknown').trim().slice(0, 64);
    result[key] = (result[key] || 0) + 1;
    return result;
  }, {});
  return {
    pending_count: tickets.filter((row) => ['pending', 'processing', 'pending_callback'].includes(row.status)).length,
    processed_count: events.filter((row) => ['update', 'processing', 'closed'].includes(row.event_type)).length,
    average_processing_hours: processingDurations.length ? Number((processingDurations.reduce((a, b) => a + b, 0) / processingDurations.length).toFixed(2)) : 0,
    callback_count: callbacks.length,
    callback_completion_rate: callbacks.length ? Number((callbackResults.length / callbacks.length * 100).toFixed(2)) : 0,
    closed_count: closed.length,
    close_outcomes: outcomes
  };
}

module.exports = { aggregateOperationsMetrics, aggregateSupportMetrics, safeObject };
