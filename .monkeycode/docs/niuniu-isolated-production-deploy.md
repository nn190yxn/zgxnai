# 小牛育儿独立生产部署方案

## 目标

将小牛育儿小程序后端独立部署到服务器，使用独立 PM2 进程、独立端口、独立数据库和独立 `/api/v1` 反向代理路径，保持我赢AI现有 `/api` 服务、数据库和 PM2 进程不变。

## 隔离边界

- 我赢AI现有目录：`/home/ubuntu/woying-ai`
- 我赢AI现有 PM2：`woying-backend`
- 我赢AI现有数据库：`woying_ai`
- 小牛育儿建议目录：`/home/ubuntu/niuniu-parenting`
- 小牛育儿建议 PM2：`niuniu-backend`
- 小牛育儿建议端口：`3010`
- 小牛育儿建议数据库：`niuniu_parenting`
- 小牛育儿 API 路径：`https://api.woyai.cn/api/v1/*`

## 当前发布门禁

- 生产服务启动后先确认 `runMigrations(pool)` 完成，再确认历史业务表初始化和管理员初始化结果。
- 数据库迁移、历史表初始化或管理员初始化失败时，`niuniu-backend` 必须退出并由 PM2 标记为异常；服务不得在缺表状态监听端口。
- 会员套餐使用 `/api/v1/payment/virtual-order` 与微信小程序虚拟支付；普通 `/payment/create` 和 `/payment/unified-order` 仅保留兼容接口并拒绝虚拟会员套餐。
- 生产环境必须配置虚拟支付 offer、正式 app key、商品 ID 和消息推送 token。消息推送 token 缺失时服务拒绝消息推送请求。
- 生产验收顺序：数据库备份 → 迁移状态 → `/api/v1/health` → `/api/v1/runtime/config` → 登录与孩子档案 → 能力观察与训练 → 报告与会员 → 虚拟支付订单查询 → 小程序真机回归。
- 每次迁移和服务同步前继续执行备份；备份、迁移、PM2 重启和线上写入需要明确生产操作授权。
- 2026-08-21 公网只读验收确认 `/api/v1/knowledge/contents` 与 `/api/v1/knowledge/ability-content` 在线上返回 404；当前工作区已注册这两个接口。部署前必须读取生产 `server.js` 并核对同目录 `knowledge-content.js`、迁移执行器和迁移定义，按依赖闭包生成同步清单。
- `/api/v1/education/knowledge/chapters` 在线上匿名访问返回 401，说明教材知识路由与认证中间件已生效；小程序教材页面继续使用 `/education/knowledge/chapters` 和 `/education/knowledge/detail`。

## 推荐实施步骤

1. 在服务器创建小牛育儿独立目录 `/home/ubuntu/niuniu-parenting`。
2. 将当前仓库后端代码部署到 `/home/ubuntu/niuniu-parenting/backend`。
3. 创建独立 MySQL 数据库 `niuniu_parenting`，执行 `backend/migrations/mysql/001_init_niuniu_parenting.sql`。
4. 为小牛育儿后端配置独立 `.env`，使用单独的数据库连接、JWT 密钥和微信支付配置。
5. 用 PM2 启动 `niuniu-backend`，监听 `127.0.0.1:3010`。
6. 在 Nginx 中只新增 `/api/v1/` location，转发到 `http://127.0.0.1:3010/api/v1/`。
7. 保持现有 `/api/` location 指向 `woying-backend`。
8. 验证 `https://api.woyai.cn/api/v1/health`、`/api/v1/runtime/config`、`/api/v1/payment/virtual-order` 和 `/api/v1/payment/query/:order_no`。
9. 验证 `/api/v1/knowledge/contents` 与 `/api/v1/knowledge/ability-content` 返回 200，并确认响应 `meta.schema_version` 为 `1`。

## 当前最小同步闭包

生产 `server.js` 会在进程启动时加载下列模块和数据文件。同步入口文件时必须将它们作为同一发布单元处理：

- `backend/src/mysql-production/server.js`
- `backend/src/mysql-production/knowledge-content.js`
- `backend/src/mysql-production/migration-runner.js`
- `backend/src/mysql-production/migrations/index.js`
- `backend/src/mysql-production/growth-timeline.js`
- `backend/src/mysql-production/ability-training.js`
- `backend/src/mysql-production/stage-report.js`
- `backend/src/mysql-production/report-membership.js`
- `backend/src/mysql-production/event-protocol.js`
- `backend/src/mysql-production/analytics-quality.js`
- `backend/src/mysql-production/api-response.js`
- `backend/src/shared/business-dimensions.js`
- `shared/business-dimensions.json`
- `backend/examples/knowledgebase-sample.json`

同步前在生产目录逐项确认现有文件、计算校验值并创建时间戳备份。数据库备份完成后再重启 `niuniu-backend`，让迁移执行器持锁应用未执行版本。任何初始化失败都会阻止服务监听端口。

发布前执行 `npm run verify:production-release`，保存输出的 14 个 SHA-256。文件同步后在生产目录对同一清单重新计算校验值，全部一致后再重启服务。

当前线上版本核验使用 `npm run verify:production-baseline`，该模式允许两个已知知识接口返回 404。完成文件同步、迁移和 PM2 重启后执行 `npm run verify:production-public`，发布模式要求全部 10 个公网检查点通过，两个知识接口必须返回 200 且携带 `meta.schema_version: 1`。

## 回滚策略

- PM2 回滚：停止并移除 `niuniu-backend`，不操作 `woying-backend`。
- Nginx 回滚：删除新增的 `/api/v1/` location，保留原有 `/api/` location。
- 数据库回滚：保留或备份 `niuniu_parenting`，不操作 `woying_ai`。
- 文件回滚：移动 `/home/ubuntu/niuniu-parenting` 到带时间戳的备份目录。

## 上线前检查

```bash
# 查看我赢AI进程，确认运行正常
pm2 describe woying-backend

# 查看小牛育儿进程，确认独立运行
pm2 describe niuniu-backend

# 验证我赢AI健康接口
curl -s https://api.woyai.cn/api/health

# 验证小牛育儿健康接口
curl -s https://api.woyai.cn/api/v1/health
```

## 风险控制

- 不复用 `woying_ai` 数据库。
- 不修改 `woying-backend` PM2 配置。
- 不覆盖 `/home/ubuntu/woying-ai` 目录中的业务代码。
- Nginx 只新增更具体的 `/api/v1/` 路径，保留现有 `/api/` 路径。
