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

## 推荐实施步骤

1. 在服务器创建小牛育儿独立目录 `/home/ubuntu/niuniu-parenting`。
2. 将当前仓库后端代码部署到 `/home/ubuntu/niuniu-parenting/backend`。
3. 创建独立 MySQL 数据库 `niuniu_parenting`，执行 `backend/migrations/mysql/001_init_niuniu_parenting.sql`。
4. 为小牛育儿后端配置独立 `.env`，使用单独的数据库连接、JWT 密钥和微信支付配置。
5. 用 PM2 启动 `niuniu-backend`，监听 `127.0.0.1:3010`。
6. 在 Nginx 中只新增 `/api/v1/` location，转发到 `http://127.0.0.1:3010/api/v1/`。
7. 保持现有 `/api/` location 指向 `woying-backend`。
8. 验证 `https://api.woyai.cn/api/v1/health`、`/api/v1/payment/create`、`/api/v1/payment/unified-order`。

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
