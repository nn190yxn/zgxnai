const express = require('express');
const router = express.Router();

router.get('/config', (req, res) => {
  res.json({
    env_name: process.env.NODE_ENV || 'development',
    debug: process.env.NODE_ENV !== 'production',
    ai_chat_enabled: true,
    multimodal_enabled: false,
    payment_enabled: false,
    ai_mock_fallback: process.env.NODE_ENV !== 'production',
    ai_service_ready: false,
    config_loaded: true
  });
});

module.exports = router;