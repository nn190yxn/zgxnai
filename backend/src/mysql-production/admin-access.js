const SENSITIVE_FIELDS = new Set(['password', 'password_hash', 'token', 'access_token', 'refresh_token', 'authorization', 'cookie', 'contact', 'phone', 'openid']);

const ROLE_ACTIONS = Object.freeze({
  super_admin: ['*'],
  content_editor: ['article:read', 'article:write', 'pain_point:read', 'pain_point:write', 'media:read', 'media:write', 'banner:read', 'banner:write', 'content:submit_review', 'membership:read', 'membership:write', 'membership:submit_review'],
  reviewer: ['article:read', 'pain_point:read', 'media:read', 'content:approve', 'content:publish', 'content:schedule', 'content:offline', 'content:restore', 'membership:read', 'membership:approve', 'membership:publish', 'membership:offline', 'membership:restore'],
  customer_service: ['ticket:read', 'ticket:write', 'ticket:callback', 'ticket:contact'],
  data_operator: ['article:read', 'pain_point:read', 'media:read', 'banner:read', 'ticket:read', 'membership:read', 'user:read', 'user:service'],
});

function can(role, action) {
  const allowed = ROLE_ACTIONS[String(role || '')] || [];
  return allowed.includes('*') || allowed.includes(action);
}

function assertPermission(admin, action) {
  if (!can(admin && admin.role, action)) {
    const error = new Error('当前角色无权执行此操作');
    error.code = 'ADMIN_PERMISSION_DENIED';
    error.statusCode = 403;
    throw error;
  }
}

function redact(value, key) {
  if (SENSITIVE_FIELDS.has(String(key || '').toLowerCase())) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((out, childKey) => {
      out[childKey] = redact(value[childKey], childKey);
      return out;
    }, {});
  }
  return value;
}

function auditPayload(input) {
  return {
    adminUserId: input.adminUserId,
    actionType: input.actionType,
    targetType: input.targetType,
    targetId: String(input.targetId || ''),
    before: redact(input.before || null),
    after: redact(input.after || null),
    ipAddress: String(input.ipAddress || '').slice(0, 64)
  };
}

async function withAudit(connection, input, operation) {
  await connection.beginTransaction();
  try {
    const result = await operation();
    const audit = auditPayload(input);
    await connection.execute(
      `INSERT INTO admin_audit_logs
       (admin_user_id, action_type, target_type, target_id, before_payload, after_payload, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [audit.adminUserId, audit.actionType, audit.targetType, audit.targetId, JSON.stringify(audit.before), JSON.stringify(audit.after), audit.ipAddress]
    );
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

module.exports = { ROLE_ACTIONS, can, assertPermission, redact, auditPayload, withAudit };
