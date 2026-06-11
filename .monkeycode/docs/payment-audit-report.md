# 微信支付全链路代码审计报告

**审计日期**: 2026-06-11
**审计范围**: 后端支付服务、小程序支付交互、数据库、服务器隔离、安全边界
**审计维度**: 功能性、安全性、健壮性、可维护性、隔离性

---

## 一、严重级别问题 (CRITICAL) - 必须修复

### 1. [CRITICAL] 支付回调幂等性缺陷

**位置**: `backend/src/services/payment.js:handlePaymentNotify` 及 `backend/src/mysql-production/server.js`

**问题描述**: 支付回调处理没有数据库事务保护。在高并发场景下，微信可能多次发送同一订单的回调通知，当前代码的 `if (order.status === 'paid')` 检查与状态更新之间不存在原子操作，存在竞态窗口。

**影响**: 同一订单可能被重复处理，导致会员时间被重复叠加。

**修复方案**:
```javascript
// 使用数据库事务包裹回调处理
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  const [orders] = await connection.execute(
    'SELECT * FROM payment_orders WHERE order_no = ? FOR UPDATE',
    [out_trade_no]
  );
  if (orders.length === 0) {
    await connection.rollback();
    return { success: false, message: '订单不存在' };
  }
  const order = orders[0];
  if (order.status === 'paid') {
    await connection.commit();
    return { success: true, message: '订单已处理' };
  }
  // ... 更新订单和开通会员
  await connection.commit();
} catch (err) {
  await connection.rollback();
  throw err;
} finally {
  connection.release();
}
```

### 2. [CRITICAL] AES-GCM 解密实现可能有误

**位置**: `backend/src/services/payment.js:decryptWechatResource`

**问题描述**: 微信支付v3回调的 `ciphertext` 字段格式是 `base64(ciphertext + auth_tag)`，即密文和认证标签拼接后一起base64编码。当前代码试图从 `ciphertext.length - 16` 处分割，但微信的 `ciphertext` 字段在解密前就是完整的base64字符串，需要先解码再分割。

**影响**: 回调解密可能失败，导致支付成功但无法开通会员。

**修复方案**: 正确实现应为：
```javascript
function decryptWechatResource(resource) {
  const { ciphertext, associated_data, nonce } = resource;
  const encryptedData = Buffer.from(ciphertext, 'base64');
  // AES-GCM: 最后16字节是auth_tag
  const authTag = encryptedData.subarray(encryptedData.length - 16);
  const encrypted = encryptedData.subarray(0, encryptedData.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', apiKey, Buffer.from(nonce));
  decipher.setAuthTag(authTag);
  if (associated_data) {
    decipher.setAAD(Buffer.from(associated_data));
  }
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
}
```

### 3. [CRITICAL] 回调签名验签默认跳过

**位置**: `backend/src/services/payment.js:verifyWechatNotifySignature`

**问题描述**: 当 `platformCertPath` 未配置时直接返回 `true`，这在生产环境是危险的。微信回调的签名验证是防止伪造回调的最后一道防线。

**影响**: 未配置平台证书时，任何人都可以伪造回调通知，触发会员开通。

**修复方案**: 生产环境必须配置平台证书，或至少记录警告日志。

### 4. [CRITICAL] 支付回调响应格式不符合微信要求

**位置**: `backend/src/routes/payment.js:router.post('/notify')`

**问题描述**: 微信支付回调要求返回特定的HTTP状态码（200）和响应体格式。当前代码在某些错误路径返回400，可能导致微信重试通知。

**影响**: 微信可能持续重试回调，造成不必要的压力和日志噪音。

**修复方案**:
```javascript
// 无论成功失败，都返回200和正确格式
res.status(200).json({ code: 'SUCCESS', message: 'OK' });
// 错误处理通过日志记录
```

---

## 二、高风险级别问题 (HIGH) - 强烈建议修复

### 5. [HIGH] 订单号生成器冲突风险

**位置**: `backend/src/services/payment.js:generateOrderNo`

**问题描述**: 使用 `Date.now() + Math.random()` 生成订单号，在并发请求下可能重复。

**影响**: 订单号重复会导致支付混乱。

**修复方案**: 使用 UUID 或基于数据库自增ID的订单号生成策略。

### 6. [HIGH] 缺少支付回调来源IP校验

**位置**: `backend/src/routes/payment.js`

**问题描述**: 没有校验回调请求的IP是否在允许的微信IP段内。

**影响**: 增加被伪造回调的风险。

**修复方案**: 添加IP白名单校验。

### 7. [HIGH] 支付接口缺少请求限流

**位置**: `backend/src/routes/payment.js`

**问题描述**: 支付创建和下单接口没有针对单个用户的请求频率限制。

**影响**: 可能被恶意用户滥用，产生大量无效订单。

**修复方案**: 添加基于Redis的速率限制，如每个用户每分钟最多5次下单。

### 8. [HIGH] 回调通知URL路径匹配不严谨

**位置**: `backend/src/app.js`

**问题描述**: `req.originalUrl === '/api/v1/payment/notify'` 使用精确匹配，如果Nginx做了路径重写或添加query参数，这个判断会失败。

**影响**: rawBody可能无法正确保存，导致回调验签失败。

**修复方案**: 使用 `req.path` 或 `req.url.includes('/payment/notify')` 替代。

### 9. [HIGH] 小程序支付按钮缺少防重复提交

**位置**: `miniprogram/pages/membership/index.js:paySelectedPlan`

**问题描述**: 虽然有 `isPaying` 标志，但如果在 `ensureLogin` 阶段快速多次点击，仍可能触发多次请求。

**影响**: 可能创建多个订单。

**修复方案**: 在进入支付流程前立即设置 `isPaying`。

---

## 三、中风险级别问题 (MEDIUM) - 建议修复

### 10. [MEDIUM] 缺少支付状态主动查询

**位置**: `miniprogram/pages/membership/index.js`

**问题描述**: 支付完成后仅依赖前端回调，没有主动轮询订单状态。

**影响**: 如果用户支付成功但回调丢失或延迟，前端无法及时更新会员状态。

**修复方案**: 支付成功后启动轮询，查询订单状态直到确认。

### 11. [MEDIUM] 支付回调缺少日志记录

**位置**: `backend/src/services/payment.js:handlePaymentNotify`

**问题描述**: 回调处理的关键节点缺少结构化日志，不利于排查问题。

**影响**: 支付问题难以追踪。

**修复方案**: 添加结构化日志，记录订单号、交易号、处理结果等。

### 12. [MEDIUM] JWT密钥在生产环境可能过弱

**位置**: `backend/src/middleware/auth.js`

**问题描述**: `JWT_SECRET_FINAL` 在没有配置时回退到固定字符串，如果生产环境忘记设置则存在安全风险。

**影响**: JWT签名被破解。

**修复方案**: 生产环境强制要求JWT_SECRET，否则启动失败。

### 13. [MEDIUM] 证书文件权限检查缺失

**位置**: 服务器部署

**问题描述**: 证书文件的权限没有在启动时校验。

**影响**: 证书文件可能被非授权用户读取。

**修复方案**: 启动时校验证书文件权限，确保只有当前用户可读。

---

## 四、服务器隔离审计

### 隔离措施 (已正确实施)

| 隔离维度 | 状态 | 说明 |
|---------|------|------|
| 独立目录 | PASS | `/home/ubuntu/niuniu-parenting` 与 `/home/ubuntu/woying-ai` 分离 |
| 独立PM2 | PASS | `niuniu-backend` 与 `woying-backend` 独立进程 |
| 独立端口 | PASS | 3002 vs 3000 |
| 独立数据库 | PASS | `niuniu_parenting` vs `woying_ai` |
| 独立Redis | PASS | DB 2 vs DB 0 |
| 独立JWT密钥 | PASS | 不同密钥 |
| Nginx分流 | PASS | `/api/v1/` → 3002, `/api/` → 3000 |
| 证书隔离 | PASS | 证书复制到独立目录 |

### 隔离建议

1. **监控告警**: 为 `niuniu-backend` 添加独立的监控告警（内存、CPU、响应时间）
2. **日志隔离**: 确保两个服务的日志文件分开存储，便于问题定位
3. **备份策略**: 为 `niuniu_parenting` 数据库配置独立备份

---

## 五、修复优先级排序

| 优先级 | 问题 | 影响 | 修复复杂度 |
|--------|------|------|-----------|
| P0 | 回调幂等性缺陷 | 重复开通会员 | 中 |
| P0 | AES-GCM解密实现 | 回调无法处理 | 低 |
| P0 | 回调签名默认跳过 | 安全风险 | 低 |
| P0 | 回调响应格式 | 微信重试 | 低 |
| P1 | 订单号生成冲突 | 订单混乱 | 中 |
| P1 | 缺少IP校验 | 伪造回调 | 中 |
| P1 | 缺少请求限流 | 接口滥用 | 中 |
| P2 | 支付按钮防重 | 重复订单 | 低 |
| P2 | 缺少主动查询 | 状态同步延迟 | 中 |
| P2 | 缺少日志记录 | 难以排查 | 低 |

---

## 六、代码审查建议

### 后端代码质量
1. **错误处理**: 统一错误处理中间件，避免各处重复写错误响应
2. **日志记录**: 使用结构化日志（JSON格式），便于日志分析和告警
3. **输入校验**: 使用Joi或class-validator进行请求参数校验
4. **数据库事务**: 涉及资金的操作必须使用事务

### 前端代码质量
1. **支付流程**: 添加支付流程状态机（idle → creating → paying → success/fail）
2. **错误提示**: 支付失败时给出更具体的错误原因
3. **重试机制**: 支付接口调用失败时自动重试

### 运维建议
1. **监控**: 添加支付成功率、支付延迟、回调处理延迟等指标监控
2. **告警**: 支付成功率低于阈值时告警
3. **日志聚合**: 将支付相关日志聚合到独立索引
4. **灰度发布**: 支付功能上线后先灰度测试

---

## 七、验证清单

修复后需要进行以下验证：

1. [ ] 回调幂等性测试：模拟同一回调多次发送，验证只处理一次
2. [ ] 回调解密测试：使用真实微信回调数据测试解密逻辑
3. [ ] 订单号唯一性测试：并发创建100个订单，验证无重复
4. [ ] 限流测试：超过限流阈值后验证被正确拒绝
5. [ ] 支付流程端到端测试：从选择套餐到支付成功到会员开通
6. [ ] 隔离性测试：验证我赢AI服务不受影响
7. [ ] 性能测试：模拟高并发支付请求
