const crypto = require('crypto');

const API_SCHEMA_VERSION = 1;

function getRequestId(req) {
  if (!req) return crypto.randomUUID();
  const requestId = String(req.headers && (req.headers['x-request-id'] || req.headers['x-request-id'.toLowerCase()]) || '').trim();
  return requestId.slice(0, 128) || crypto.randomUUID();
}

function responseMeta(req, extra = {}) {
  return Object.assign({
    requestId: getRequestId(req),
    schemaVersion: API_SCHEMA_VERSION,
    dataVersion: API_SCHEMA_VERSION
  }, extra);
}

function sendSuccess(res, req, data, extraMeta = {}) {
  return res.json({ success: true, data, meta: responseMeta(req, extraMeta) });
}

function sendPaginatedSuccess(res, req, data, pagination, extraMeta = {}) {
  return sendSuccess(res, req, data, Object.assign({ pagination }, extraMeta));
}

function sendError(res, req, status, code, message, details) {
  const body = { success: false, error: { code, message }, message, meta: responseMeta(req) };
  if (details !== undefined) body.error.details = details;
  return res.status(status).json(body);
}

module.exports = {
  API_SCHEMA_VERSION,
  responseMeta,
  sendSuccess,
  sendPaginatedSuccess,
  sendError
};
