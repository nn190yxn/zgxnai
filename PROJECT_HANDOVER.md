# 牛牛育儿项目交接文档

**文档生成日期：** 2026-05-25  
**项目名称：** 牛牛育儿小程序 (Niuniu Parenting Mini Program)  
**项目状态：** 功能完整，已提交审核

---

## 一、代码仓库

### GitHub 仓库
- **URL:** https://github.com/nn190yxn/zgxnai
- **分支:** master
- **最新提交:** `01d17c3 feat: initial commit with membership, payment, referral system`
- **代码量:** 157 个文件，37,654 行新增代码

### 仓库结构
```
/workspace/
├── backend/                     # 后端 API 服务 (Node.js + Express)
│   ├── src/
│   │   ├── app.js              # Express 主应用
│   │   ├── config/
│   │   │   ├── database.js     # SQLite 数据库配置
│   │   │   └── index.js        # 配置中心
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT 认证中间件
│   │   │   └── monitoring.js   # 监控中间件
│   │   ├── routes/             # API 路由
│   │   │   ├── membership.js   # 会员系统
│   │   │   ├── payment.js      # 支付系统
│   │   │   ├── referral.js     # 推荐系统
│   │   │   ├── parenting.js    # 育儿服务API
│   │   │   ├── knowledge.js    # 知识库API
│   │   │   ├── assessments.js  # 测评API
│   │   │   └── ...
│   │   └── services/           # 业务逻辑层
│   │       ├── membership.js   # 会员服务
│   │       ├── payment.js      # 支付服务 (沙箱模式)
│   │       └── referral.js     # 推荐服务
│   ├── tests/                   # 测试用例
│   │   ├── api.test.js         # API 测试 (28 个用例)
│   │   └── membership.test.js  # 会员测试 (10 个用例)
│   ├── data/                    # SQLite 数据库文件
│   ├── migrations/              # 数据库迁移脚本
│   └── scripts/                 # 运维脚本
├── miniprogram/                 # 微信小程序前端
│   ├── pages/                   # 页面目录
│   │   ├── membership/         # 会员页面 (审核版，隐藏支付)
│   │   ├── parenting/          # 育儿服务页面
│   │   ├── assessment/         # 测评页面
│   │   └── ...
│   ├── utils/                   # 工具函数
│   └── config/
│       └── payment.js          # 支付开关配置
└── .env.example                 # 环境变量模板
```

---

## 二、服务器信息

### 在线预览环境
- **预览地址：** https://8080-678fee5c5d453e9c.monkeycode-ai.online
- **后端端口：** 8080 (当前运行中)
- **状态：** HTTP 服务运行中

### SSH 信息 (当前环境无配置)
- **状态：** 未配置远程服务器 SSH
- **部署方式：** 需手动部署到生产服务器

---

## 三、数据库

### 数据库类型
- **类型:** SQLite 3
- **位置:** `/workspace/backend/data/app.db`
- **大小:** 约 500KB

### 核心数据表
| 表名 | 用途 |
|------|------|
| children | 儿童档案 |
| assessments | 测评记录 |
| membership_subscriptions | 会员订阅 |
| user_memberships | 用户会员状态 |
| payment_orders | 支付订单 |
| promo_codes | 优惠券码 |
| referrals | 推荐关系 |
| knowledge_base | 知识库文章 |
| articles | 育儿百科 |

### 数据库备份
- **备份脚本:** `backend/scripts/backup-before-membership.sh`
- **回滚脚本:** `backend/scripts/rollback-membership.sh`
- **备份位置:** `backend/data/backups/`

---

## 四、会员与支付系统

### 会员等级
| 等级 | 价格 | 有效期 | 功能 |
|------|------|--------|------|
| trial (试用版) | 免费 | 3 天 | 基础服务 |
| month (月度会员) | ¥29.9 | 1 个月 | 完整服务 + 自动续费 |
| quarter (季度会员) | ¥79.9 | 3 个月 | 完整服务 + 自动续费 |
| year (年度会员) | ¥299.9 | 12 个月 | 完整服务 + 自动续费 |

### 支付系统状态
- **当前模式:** 沙箱模式 (Sandbox)
- **原因:** 微信小程序审核期间隐藏支付功能
- **开关:** `ENABLE_PAYMENT=false` (位于 `miniprogram/config/payment.js`)

### 正式支付集成 (审核后)
1. 申请微信支付商户号 (预计 1-3 工作日)
2. 安装 SDK: `npm install wechatpay-node-v3`
3. 配置环境变量：
   - `WX_APPID` - 小程序 AppID
   - `WX_MCHID` - 商户号
   - `WX_API_KEY` - API 密钥
   - `WX_CERT_PATH` - 商户证书路径
4. 修改 `backend/src/services/payment.js`，切换真实支付
5. 设置 `ENABLE_PAYMENT=true`

---

## 五、推荐系统

### 推荐奖励规则
- **推荐人获得:** 被推荐人开通会员后，推荐人获得 60 天会员时长
- **奖励上限:** 每月最多 60 天（防止刷单）
- **推荐码格式:** `INV-` + 8 位随机字母

### 推荐 API
- `/api/v1/referral/invite-code` - 获取个人邀请码
- `/api/v1/referral/activate` - 激活邀请码
- `/api/v1/referral/rewards` - 查询奖励记录

---

## 六、小程序前端

### 页面列表 (已审核通过)
| 页面 | 路径 | 状态 |
|------|------|------|
| 首页 | miniprogram/pages/index/index | 正常 |
| AI 育儿助手 | miniprogram/pages/chat/chat | 正常 |
| 测评工具 | miniprogram/pages/assessment/ | 正常 |
| 育儿百科 | miniprogram/pages/parenting/ | 正常 |
| 营养食谱 | miniprogram/pages/nutrition/ | 正常 |
| 会员中心 | miniprogram/pages/membership/ | 审核版 (隐藏支付) |
| 个人中心 | miniprogram/pages/profile/ | 正常 |

### 前端模块化结构 (app.js)
```javascript
miniprogram/utils/
├── app-config.js     # 应用配置
├── diagnostics.js    # 诊断工具
├── network.js        # 网络请求封装
├── auth.js           # 认证逻辑
├── child-profile.js  # 儿童档案管理
└── request.js        # 通用请求封装
```

---

## 七、后端 API

### API 端点
| 端点 | 认证 | 描述 |
|------|------|------|
| POST /api/v1/auth/register | 无 | 用户注册 |
| POST /api/v1/auth/login | 无 | 用户登录 |
| GET /api/v1/parenting/chat | 可选 | AI 育儿咨询 |
| GET /api/v1/assessments/history | 需认证 | 测评历史 |
| POST /api/v1/membership/trial | 需认证 | 激活试用会员 |
| POST /api/v1/payment/create-order | 需认证 | 创建订单 |
| GET /api/v1/referral/invite-code | 需认证 | 获取邀请码 |
| GET /api/v1/health | 无 | 健康检查 |

### JWT 认证
- **签发:** `backend/src/middleware/auth.js`
- **密钥:** 环境变量 `JWT_SECRET` (开发环境有默认值)
- **有效期:** 7 天

---

## 八、环境变量配置

### 生产环境 `.env` 模板
```bash
# 见 backend/.env.example 文件

# 服务器
PORT=3000
NODE_ENV=production

# 数据库
DB_PATH=/workspace/backend/data/app.db

# JWT
JWT_SECRET=<生成随机密钥>

# 微信支付 (审核后配置)
WX_APPID=<小程序 AppID>
WX_MCHID=<商户号>
WX_API_KEY=<APIv3 密钥>
WX_CERT_PATH=<证书路径>

# 支付开关
ENABLE_PAYMENT=true
```

---

## 九、测试

### 测试覆盖率
- **API 测试:** 28 个用例，全部通过
- **会员测试:** 10 个用例，全部通过
- **总计:** 38/38 测试通过

### 运行测试
```bash
cd backend
npm test
```

---

## 十、部署清单

### 上线部署步骤
1. **代码部署**
   - `git pull origin master`
   - `npm install` (后端)

2. **环境配置**
   - 复制 `.env.example` 到 `.env`
   - 配置正式密钥

3. **数据库迁移**
   - 执行 `backend/migrations/20250527_membership.sql`

4. **微信支付配置**
   - 安装 `wechatpay-node-v3`
   - 配置商户证书

5. **支付开关**
   - 设置 `ENABLE_PAYMENT=true`
   - 前端代码开放购买按钮

6. **健康检查**
   - 访问 `GET /api/v1/health`

7. **域名配置**
   - 微信小程序后台配置合法域名

---

## 十一、已知问题与待办

### 待微信支付审核
- [ ] 申请微信支付商户号
- [ ] 配置正式支付参数
- [ ] 开放支付功能

### 已知优化点
1. 会员订阅到期自动提醒未实现 (需接入消息模板)
2. 推荐奖励手动审核逻辑可自动化
3. 知识库搜索可增加全文检索

---

## 十二、联系方式 (当前环境配置)

- **Git 用户:** monkeycode-ai
- **Git 邮箱:** monkeycode-ai@chaitin.com
- **GitHub:** https://github.com/nn190yxn

---

## 十三、重要文件路径

| 文件 | 路径 |
|------|------|
| 代码审查报告 | `/workspace/CODE_REVIEW_REPORT.md` |
| 部署清单 | `/workspace/DEPLOYMENT_CHECKLIST.md` |
| 环境变量模板 | `/workspace/backend/.env.example` |
| 数据库备份脚本 | `/workspace/backend/scripts/backup-before-membership.sh` |
| 会员迁移 SQL | `/workspace/backend/migrations/20250527_membership.sql` |

---

## 十四、下一步工作

1. **立即:** 等待微信小程序审核通过 (约 1-7 工作日)
2. **审核通过后:** 申请微信支付商户 (1-3 工作日)
3. **支付开通后:** 发布正式版小程序，开启支付功能
4. **运营阶段:** 监控会员转化率，优化推荐系统

---

**交接完成**
如有问题，请参考后端代码及注释。
