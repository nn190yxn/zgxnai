const STATUSES = Object.freeze(['pending', 'processing', 'pending_callback', 'closed']);
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
  return { id: row.id, type: row.type, content: row.content, status: row.status, public_progress: row.public_progress || '', created_at: row.created_at };
}

module.exports = { STATUSES, TRANSITIONS, assertStatusTransition, maskContact, publicTicket };
