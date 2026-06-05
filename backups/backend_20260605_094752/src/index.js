// 服务入口
const app = require('./app');

const PORT = process.env.PORT || 8010;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`[Server] 服务已启动: http://${HOST}:${PORT}`);
  console.log(`[Server] 环境: ${process.env.NODE_ENV || 'development'}`);
});
