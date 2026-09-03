const fs = require('fs/promises');

const DEFAULT_FLAGS = Object.freeze({
  serverContentRead: false,
  miniprogramRemoteContent: false,
  adminContentWrite: false
});

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

function getReleaseFlags(env = process.env) {
  return {
    serverContentRead: parseBoolean(env.RUNTIME_SERVER_CONTENT_READ_ENABLED, DEFAULT_FLAGS.serverContentRead),
    miniprogramRemoteContent: parseBoolean(env.RUNTIME_MINIPROGRAM_REMOTE_CONTENT_ENABLED, DEFAULT_FLAGS.miniprogramRemoteContent),
    adminContentWrite: parseBoolean(env.RUNTIME_ADMIN_CONTENT_WRITE_ENABLED, DEFAULT_FLAGS.adminContentWrite)
  };
}

function getPublicFlags(env = process.env) {
  const flags = getReleaseFlags(env);
  return {
    server_content_read_enabled: flags.serverContentRead,
    miniprogram_remote_content_enabled: flags.miniprogramRemoteContent,
    admin_content_write_enabled: flags.adminContentWrite
  };
}

function safeError(error) {
  return {
    code: String(error && (error.code || error.name) || 'RELEASE_PROTECTION_ERROR').slice(0, 64),
    message: '发布保护流程失败'
  };
}

async function recordAlert(alert, options = {}) {
  const entry = {
    event: String(alert && alert.event || 'release_protection_alert').slice(0, 64),
    severity: String(alert && alert.severity || 'error').slice(0, 16),
    code: String(alert && alert.code || '').slice(0, 64),
    at: new Date().toISOString()
  };
  const logger = options.logger || console;
  logger.error(`[release-protection] ${JSON.stringify(entry)}`);
  if (options.filePath) {
    await fs.appendFile(options.filePath, `${JSON.stringify(entry)}\n`, 'utf8');
  }
  return entry;
}

module.exports = { DEFAULT_FLAGS, parseBoolean, getReleaseFlags, getPublicFlags, safeError, recordAlert };
