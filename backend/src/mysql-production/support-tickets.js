const STATUSES = Object.freeze(['pending', 'processing', 'pending_callback', 'closed']);
const PRIORITIES = Object.freeze(['urgent', 'high', 'normal', 'low']);
const TRANSITIONS = Object.freeze({ pending: ['processing', 'closed'], processing: ['pending_callback', 'closed'], pending_callback: ['processing', 'closed'], closed: [] });

function assertStatusTransition(from, to) {
  if (!TRANSITIONS[from] || !TRANSITIONS[from].includes(to)) {
    const error = new Error('工单状态流转不合法');
    error.code = 'TICKET_INVALID_TRANSITION';
    error.statusCode = 409;
    throw error;
  }
}

function maskContact(value) {
  const text = String(value || '');
  if (text.length <= 4) return text ? '***' : '';
  if (/^\d+$/.test(text)) return `${text.slice(0, 3)}****${text.slice(-4)}`;
  return `${text.slice(0, 1)}***${text.slice(-1)}`;
}

function publicTicket(row) {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    status: row.status,
    public_progress: row.public_progress || '',
    callback_requested: row.channel === 'callback_request',
    created_at: row.created_at
  };
}

function normalizeDeviceInfo(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const text = (input, length) => String(input || '').slice(0, length);
  return {
    platform: text(source.platform, 32),
    system: text(source.system, 64),
    version: text(source.version, 32),
    model: text(source.model, 64),
    brand: text(source.brand, 32),
    SDKVersion: text(source.SDKVersion, 32),
    screenWidth: Number(source.screenWidth) || 0,
    screenHeight: Number(source.screenHeight) || 0
  };
}

module.exports = { STATUSES, PRIORITIES, TRANSITIONS, assertStatusTransition, maskContact, publicTicket, normalizeDeviceInfo };
