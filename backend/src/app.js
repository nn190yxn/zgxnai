// Express 应用入口
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { db, initDatabase, seedData } = require('./config/database');

// 创建Express应用
const app = express();

// 安全中间件
// 生产环境启用完整CSP，开发环境简化
const isProduction = process.env.NODE_ENV === 'production';
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// 跨域配置 - 使用白名单，生产环境严格限制
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['https://api.woyai.cn', 'https://woyai.cn', 'https://www.woyai.cn', 'https://supercalf.com', 'https://www.supercalf.com', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // 生产环境严格限制
    if (!origin) {
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('[Security] Origin required in production'), false);
      }
      // 仅开发环境允许无origin请求（如移动端、Postman）
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 预检请求缓存24小时
}));

// 日志
app.use(morgan('dev'));

// JSON解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 初始化数据库
initDatabase();
seedData();

// 监控中间件
const { detailedLogger, errorHandler, dbHealthCheck, responseTimeStats, rateLimit } = require('./middleware/monitoring');
const { authenticateToken, optionalAuth } = require('./middleware/auth');

// 请求日志和性能统计
app.use(detailedLogger);
app.use(responseTimeStats);

// 速率限制
app.use(rateLimit);

// 数据库健康检查
app.use(dbHealthCheck);
const healthRoutes = require('./routes/health');
const runtimeRoutes = require('./routes/runtime');
const assessmentRoutes = require('./routes/assessments');
const chatRoutes = require('./routes/chat');
const educationRoutes = require('./routes/education');
const parentingRoutes = require('./routes/parenting');
const milestoneRoutes = require('./routes/milestone');
const knowledgeRoutes = require('./routes/knowledge');
const eventsRoutes = require('./routes/events');
const recommendationRoutes = require('./routes/recommendations');
const membershipRoutes = require('./routes/membership');
const paymentRoutes = require('./routes/payment');
const referralRoutes = require('./routes/referral');
const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const nutritionRoutes = require('./routes/nutrition');

// 公开路由（无需认证）
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/runtime', runtimeRoutes);
app.use('/api/v1/auth', authRoutes);

// 需要认证的路由
app.use('/api/v1/assessments', authenticateToken, assessmentRoutes);
app.use('/api/v1/chat', authenticateToken, chatRoutes);
app.use('/api/v1/education', authenticateToken, educationRoutes);
app.use('/api/v1/parenting', optionalAuth, parentingRoutes); // 育儿文章可公开浏览
app.use('/api/v1/parenting/milestone', optionalAuth, milestoneRoutes); // 里程碑评估
app.use('/api/v1/knowledge', optionalAuth, knowledgeRoutes); // 知识库可公开搜索
app.use('/api/v1/kb/events', authenticateToken, eventsRoutes);
app.use('/api/v1/recommendations', authenticateToken, recommendationRoutes);
app.use('/api/v1/membership', authenticateToken, membershipRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/referral', authenticateToken, referralRoutes);
app.use('/api/v1/children', childrenRoutes);
app.use('/api/v1/nutrition', optionalAuth, nutritionRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
    path: req.path
  });
});

// 全局错误处理中间件
app.use(errorHandler);

module.exports = app;
