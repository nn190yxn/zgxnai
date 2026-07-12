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

function parseRuntimeNumberEnv(name, fallbackValue) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

function parseRuntimeListEnv(name) {
  return String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

router.get('/config', (req, res) => {
  res.json({
    env_name: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV !== 'production',
    ai_chat_enabled: parseRuntimeBooleanEnv('RUNTIME_AI_CHAT_ENABLED', false),
    assessments_enabled: parseRuntimeBooleanEnv('RUNTIME_ASSESSMENTS_ENABLED', true),
    education_enabled: parseRuntimeBooleanEnv('RUNTIME_EDUCATION_ENABLED', true),
    parenting_enabled: parseRuntimeBooleanEnv('RUNTIME_PARENTING_ENABLED', true),
    daily_plan_enabled: parseRuntimeBooleanEnv('RUNTIME_DAILY_PLAN_ENABLED', true),
    growth_record_enabled: parseRuntimeBooleanEnv('RUNTIME_GROWTH_RECORD_ENABLED', true),
    weekly_summary_enabled: parseRuntimeBooleanEnv('RUNTIME_WEEKLY_SUMMARY_ENABLED', true),
    scene_search_enabled: parseRuntimeBooleanEnv('RUNTIME_SCENE_SEARCH_ENABLED', true),
    core_refactor_enabled: parseRuntimeBooleanEnv('RUNTIME_CORE_REFACTOR_ENABLED', false),
    age_first_core_enabled: parseRuntimeBooleanEnv('RUNTIME_AGE_FIRST_CORE_ENABLED', false),
    core_refactor_rollout_percent: Math.max(0, Math.min(100, parseRuntimeNumberEnv('RUNTIME_CORE_REFACTOR_ROLLOUT_PERCENT', 0))),
    core_refactor_user_whitelist: parseRuntimeListEnv('RUNTIME_CORE_REFACTOR_USER_WHITELIST'),
    multimodal_enabled: parseRuntimeBooleanEnv('RUNTIME_MULTIMODAL_ENABLED', false),
    payment_enabled: parseRuntimeBooleanEnv('RUNTIME_PAYMENT_ENABLED', false),
    ai_mock_fallback: parseRuntimeBooleanEnv('RUNTIME_AI_MOCK_FALLBACK', process.env.NODE_ENV !== 'production'),
    ai_service_ready: false,
    config_loaded: true
  });
});

module.exports = router;
