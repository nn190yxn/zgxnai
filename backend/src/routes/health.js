// 健康检查路由
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { getResponseTimeStats } = require('../middleware/monitoring');

// GET /api/v1/health
router.get('/', (req, res) => {
  // 检查数据库连接
  let dbStatus = 'ok';
  try {
    db.prepare('SELECT 1').get();
  } catch (err) {
    dbStatus = 'error';
    console.error('[Health] 数据库连接异常:', err);
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: dbStatus
    },
    uptime: process.uptime()
  });
});

// GET /api/v1/health/metrics - 监控指标
router.get('/metrics', (req, res) => {
  const stats = getResponseTimeStats();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    },
    responseTimeStats: stats
  });
});

module.exports = router;
