const express = require('express');
const router = express.Router();

function parseRuntimeBooleanEnv(name, fallbackValue) {
  const rawValue = String(process.env[name] || '').trim().toLowerCase();
  if (!rawValue) {
    return fallbackValue;
  }
  if (['1', 'true', 'yes', 'on'].includes(rawValue)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(rawValue)) {
    return false;
  }
  return fallbackValue;
}

router.get('/config', (req, res) => {
  res.json({
    env_name: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV !== 'production',
    ai_chat_enabled: parseRuntimeBooleanEnv('RUNTIME_AI_CHAT_ENABLED', false),
    multimodal_enabled: parseRuntimeBooleanEnv('RUNTIME_MULTIMODAL_ENABLED', false),
    payment_enabled: parseRuntimeBooleanEnv('RUNTIME_PAYMENT_ENABLED', false),
    ai_mock_fallback: parseRuntimeBooleanEnv('RUNTIME_AI_MOCK_FALLBACK', process.env.NODE_ENV !== 'production'),
    ai_service_ready: false,
    config_loaded: true
  });
});

module.exports = router;
