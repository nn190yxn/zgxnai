// 监控与日志中间件
const { db } = require('../config/database');

// 请求日志记录（详细版）
function detailedLogger(req, res, next) {
  const start = Date.now();
  
  // 记录请求开始
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - 开始处理`);
  
  // 响应结束时记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress
    };
    
    if (res.statusCode >= 400) {
      console.error(`[ERROR] ${JSON.stringify(logData)}`);
    } else {
      console.log(`[SUCCESS] ${JSON.stringify(logData)}`);
    }
  });
  
  next();
}

// 错误处理中间件
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${new Date().toISOString()} - 未处理异常:`, err);
  
  // 不暴露内部错误信息
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? '服务器内部错误' : err.message;
  
  res.status(statusCode).json({
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  });
}

// 数据库健康检查
function dbHealthCheck(req, res, next) {
  try {
    // 简单查询验证数据库连接
    db.prepare('SELECT 1').get();
    next();
  } catch (err) {
    console.error('[DB] 数据库连接失败:', err);
    return res.status(503).json({
      success: false,
      message: '数据库服务不可用'
    });
  }
}

// API响应时间统计
const responseTimes = new Map();

function responseTimeStats(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const key = `${req.method} ${req.path}`;
    
    if (!responseTimes.has(key)) {
      responseTimes.set(key, []);
    }
    
    const times = responseTimes.get(key);
    times.push(duration);
    
    // 只保留最近100次记录
    if (times.length > 100) {
      times.shift();
    }
  });
  
  next();
}

// 获取响应时间统计
function getResponseTimeStats() {
  const stats = {};
  
  for (const [key, times] of responseTimes) {
    if (times.length === 0) continue;
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    stats[key] = {
      count: times.length,
      avg: Math.round(avg),
      min,
      max
    };
  }
  
  return stats;
}

// 请求速率限制（简单版）
const requestCounts = new Map();
const RATE_LIMIT = 100; // 每分钟请求数
const RATE_WINDOW = 60000; // 1分钟

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, []);
  }
  
  const requests = requestCounts.get(ip);
  
  // 清理过期记录
  const validRequests = requests.filter(time => now - time < RATE_WINDOW);
  requestCounts.set(ip, validRequests);
  
  if (validRequests.length >= RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试'
    });
  }
  
  validRequests.push(now);
  next();
}

// 清理过期的速率限制记录（每5分钟执行一次）
let cleanupInterval;
if (process.env.NODE_ENV !== 'test') {
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, requests] of requestCounts) {
      const validRequests = requests.filter(time => now - time < RATE_WINDOW);
      if (validRequests.length === 0) {
        requestCounts.delete(ip);
      } else {
        requestCounts.set(ip, validRequests);
      }
    }
  }, 300000);
}

module.exports = {
  detailedLogger,
  errorHandler,
  dbHealthCheck,
  responseTimeStats,
  getResponseTimeStats,
  rateLimit,
  cleanupInterval
};
