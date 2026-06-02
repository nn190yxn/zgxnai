// JWT身份认证中间件
const jwt = require('jsonwebtoken');

// 密钥配置（生产环境应从环境变量获取）
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成JWT令牌
 * @param {Object} payload - 要编码的数据
 * @returns {string} JWT令牌
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证JWT令牌
 * @param {string} token - JWT令牌
 * @returns {Object|null} 解码后的数据或null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * 身份认证中间件
 * 保护需要登录的API路由
 */
function authenticateToken(req, res, next) {
  // 获取请求头中的Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未提供访问令牌'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: '访问令牌无效或已过期'
    });
  }

  // 将用户信息附加到请求对象
  req.user = decoded;
  next();
}

/**
 * 可选身份认证中间件
 * 不强制要求登录，但如果有token会解析用户信息
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
