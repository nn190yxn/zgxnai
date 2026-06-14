# 小牛育儿管理后台技术设计

**文档日期**: 2026-06-13  
**对应需求**: `.monkeycode/specs/2026-06-13-admin-backend-system/requirements.md`

## 一、设计目标

本设计以“专属后台网址 + 后台 API + 统计聚合层 + 配置中心”为核心结构，覆盖经营可见、运营可控、版本可回滚、阶段可回测四个目标。

## 二、整体架构

### 2.1 系统组成

建议采用四层架构：

1. 小程序前台
2. 管理后台前端
3. 后台 API 与聚合服务
4. MySQL 业务数据层

### 2.2 域名与入口

- 小程序业务 API: `https://api.woyai.cn/api/v1`
- 后台前端: `https://admin-niuniu.woyai.cn`
- 后台 API: `https://api.woyai.cn/admin-api/v1`

隔离设计要求：

- 后台前端使用独立子域名，避免与现有我赢AI后台冲突。
- 后台 API 使用独立路由前缀，例如 `/admin-api/v1` 或 `/niuniu-admin-api/v1`。
- 后台前端部署目录独立，例如 `/home/ubuntu/niuniu-parenting-admin`。
- 后台 PM2 进程独立，例如 `niuniu-admin-web`、`niuniu-admin-api`。
- 后台管理表采用独立前缀或独立表名，不写入我赢AI后台表。

### 2.3 部署建议

- 后台前端单独部署为静态站点或 Node Web 应用
- 后台 API 与当前 `niuniu-backend` 同仓库同服务部署，路径隔离
- 与小牛育儿现有生产服务复用 MySQL，但后台逻辑与小程序 API 路由分离
- 与我赢AI现有后台服务、管理站点和后台进程完全隔离

推荐部署边界：

- 小牛育儿业务后端目录: `/home/ubuntu/niuniu-parenting/backend`
- 小牛育儿后台前端目录: `/home/ubuntu/niuniu-parenting-admin/web`
- 小牛育儿后台 API 目录: `/home/ubuntu/niuniu-parenting-admin/api`
- 小牛育儿后台 Nginx server_name: `admin-niuniu.woyai.cn`
- 小牛育儿后台 PM2 进程名: `niuniu-admin-web`, `niuniu-admin-api`

## 三、技术方案

### 3.1 后台前端

建议技术栈：

- React + Vite
- 路由按模块拆分
- 图表库使用 ECharts
- 权限与会话管理使用 JWT + HttpOnly Cookie 或 Bearer Token

选择理由：

- 与现有 Node 服务协作成本低
- Vite 构建简单，后续维护成本低
- 页面类型以表格、表单、图表为主，React 足够胜任

### 3.2 后台 API

建议在现有 `backend/src/mysql-production/` 下新增后台模块，例如：

- `backend/src/mysql-production/admin/`
  - `auth.js`
  - `dashboard.js`
  - `users.js`
  - `memberships.js`
  - `content.js`
  - `analytics.js`
  - `config.js`
  - `audit-log.js`

也可首期直接在 `server.js` 中注册，再逐步拆模块。首期建议边实现边按模块抽离，避免继续堆大文件。

如果采用同仓库同服务方案，必须继续保证：

- 路由前缀独立
- 权限中间件独立
- 管理员会话独立
- 管理端配置表独立
- 管理端日志独立

### 3.3 统计聚合层

后台的统计类请求不应全部依赖前台原子表直接临时拼装。建议分为两层：

- 实时统计层: 近实时查询 `users`、`user_memberships`、`payment_orders`、`event_tracks`
- 聚合统计层: 生成按日汇总表，提高趋势图和排行榜效率

建议新增日聚合表：

- `admin_daily_user_stats`
- `admin_daily_revenue_stats`
- `admin_daily_content_stats`
- `admin_daily_feature_stats`
- `admin_daily_funnel_stats`

## 四、数据库设计

### 4.1 新增表

#### `admin_users`

字段建议：

- `id`
- `username`
- `password_hash`
- `display_name`
- `role`
- `status`
- `last_login_at`
- `created_at`
- `updated_at`

#### `admin_audit_logs`

字段建议：

- `id`
- `admin_user_id`
- `action_type`
- `target_type`
- `target_id`
- `before_payload`
- `after_payload`
- `ip_address`
- `created_at`

#### `admin_runtime_configs`

字段建议：

- `id`
- `config_key`
- `config_value`
- `version`
- `status`
- `updated_by`
- `created_at`
- `updated_at`

#### `admin_daily_user_stats`

字段建议：

- `stat_date`
- `new_users`
- `active_users`
- `paid_active_users`
- `trial_users`
- `ai_users`
- `content_users`
- `created_at`

#### `admin_daily_revenue_stats`

字段建议：

- `stat_date`
- `paid_users`
- `new_paid_users`
- `order_count`
- `paid_order_count`
- `revenue_amount`
- `month_membership_count`
- `quarter_membership_count`
- `year_membership_count`
- `created_at`

#### `admin_daily_content_stats`

字段建议：

- `stat_date`
- `content_type`
- `content_id`
- `title`
- `view_count`
- `favorite_count`
- `like_count`
- `comment_count`
- `completion_count`
- `created_at`

#### `admin_daily_feature_stats`

字段建议：

- `stat_date`
- `feature_key`
- `view_count`
- `click_count`
- `start_count`
- `complete_count`
- `paywall_visit_count`
- `membership_conversion_count`
- `created_at`

### 4.2 复用现有表

现有可复用数据表：

- `users`
- `user_memberships`
- `payment_orders`
- `event_tracks`
- `articles`
- `reading_tasks`
- `task_progress`
- `assessment_records`

隔离规则：

- 后台新增管理类表统一使用 `admin_` 前缀。
- 不向我赢AI后台已有管理表写数据。
- 小牛育儿后台配置、审计和管理员信息全部写入小牛育儿自己的管理表。

## 五、埋点设计

### 5.1 现状

当前生产已存在 `event_tracks` 和 `/kb/events/track`。这为后台分析提供了基础，但事件体系仍需标准化。

### 5.2 统一事件规范

建议统一字段：

- `event_type`
- `event_source`
- `page_key`
- `module_key`
- `content_id`
- `content_type`
- `child_id`
- `session_id`
- `event_meta`
- `created_at`

### 5.3 首期关键事件

- `app_launch`
- `home_module_click`
- `membership_page_view`
- `membership_trial_activate`
- `payment_order_create`
- `payment_success`
- `article_list_view`
- `article_detail_view`
- `article_favorite_click`
- `knowledge_chapter_view`
- `knowledge_detail_view`
- `knowledge_practice_start`
- `knowledge_practice_complete`
- `assessment_start`
- `assessment_complete`
- `nutrition_recipe_view`
- `nutrition_recipe_favorite`
- `ai_chat_submit`

### 5.4 漏斗模型

首期至少支持三类漏斗：

1. 首页入口 -> 详情页 -> 会员页 -> 支付成功
2. AI 问答 -> 会员页 -> 支付成功
3. 能力成长 -> 练习开始 -> 练习完成 -> 会员续费

## 六、后台 API 设计

### 6.1 认证与权限

- `POST /admin-api/v1/auth/login`
- `POST /admin-api/v1/auth/logout`
- `GET /admin-api/v1/auth/me`
- `GET /admin-api/v1/admin-users`

### 6.2 仪表盘

- `GET /admin-api/v1/dashboard/overview`
- `GET /admin-api/v1/dashboard/trends`
- `GET /admin-api/v1/dashboard/alerts`

### 6.3 用户分析

- `GET /admin-api/v1/analytics/users/summary`
- `GET /admin-api/v1/analytics/users/retention`
- `GET /admin-api/v1/analytics/users/segments`

### 6.4 会员与收入

- `GET /admin-api/v1/analytics/revenue/summary`
- `GET /admin-api/v1/analytics/revenue/trends`
- `GET /admin-api/v1/analytics/revenue/plans`
- `GET /admin-api/v1/analytics/revenue/conversion`

### 6.5 内容与板块

- `GET /admin-api/v1/analytics/content/ranking`
- `GET /admin-api/v1/analytics/content/detail/:id`
- `GET /admin-api/v1/analytics/features/summary`
- `GET /admin-api/v1/analytics/funnels/:key`

### 6.6 配置管理

- `GET /admin-api/v1/config/runtime`
- `PUT /admin-api/v1/config/runtime/:key`
- `POST /admin-api/v1/config/runtime/:key/rollback`
- `GET /admin-api/v1/config/home-modules`
- `PUT /admin-api/v1/config/home-modules`

### 6.7 内容管理

- `GET /admin-api/v1/content/articles`
- `PUT /admin-api/v1/content/articles/:id`
- `POST /admin-api/v1/content/articles/:id/publish`
- `POST /admin-api/v1/content/articles/:id/unpublish`

## 七、权限模型

角色建议：

- `super_admin`
- `operator`
- `content_editor`
- `analyst`

权限控制原则：

- 读写分离
- 模块分离
- 高风险配置单独限制
- 所有写操作写入审计日志

## 八、页面设计

### 8.1 一级导航

- 总览
- 用户分析
- 会员与收入
- 内容与板块
- AI 与互动
- 配置中心
- 审计日志

### 8.2 总览页

组件：

- 核心指标卡片
- 收入趋势图
- 活跃趋势图
- 板块访问排行
- 异常提醒卡片

### 8.3 用户分析页

组件：

- 注册趋势
- DAU/WAU/MAU 趋势
- 留存分析图
- 用户分群表

### 8.4 会员与收入页

组件：

- 有效会员数
- 套餐销售分布
- 支付转化漏斗
- 订单列表

### 8.5 内容与板块页

组件：

- 板块排行
- 内容排行
- 单内容表现详情
- 完成率排行

### 8.6 配置中心

组件：

- 首页板块开关与排序
- 功能开关表单
- 推荐位管理
- 配置发布与回滚记录

## 九、阶段开发方案

### 阶段A: 数据基础设施

目标：先把口径和数据链路稳定下来。

开发项：

- 标准化埋点事件结构
- 补齐关键前端事件上报
- 新增后台表结构
- 新增统计脚本或定时任务

回测重点：

- 埋点是否准确写入
- 聚合口径是否与原始表抽样一致

### 阶段B: 后台 API

目标：先开放后台数据能力。

开发项：

- 管理员登录
- 权限中间件
- 仪表盘 API
- 用户分析 API
- 收入分析 API
- 内容分析 API

回测重点：

- 权限隔离
- 指标准确性
- 大查询性能

### 阶段C: 后台前端

目标：交付可用的网址后台。

开发项：

- 登录页
- 仪表盘页
- 数据图表页
- 排行页
- 配置中心页

回测重点：

- 页面操作流程
- 筛选条件正确性
- 关键卡片与图表数据一致性

### 阶段D: 运营控制与建议中心

目标：从“能看”升级到“能调”。

开发项：

- 首页配置管理
- 功能开关管理
- 推荐位管理
- 建议规则引擎
- 审计日志与回滚

回测重点：

- 配置实时生效
- 配置回滚稳定
- 审计日志完整

## 十、回滚设计

### 10.1 代码回滚

- 每个阶段独立提交
- 每个阶段独立部署
- 每个阶段保留回滚标签

### 10.2 数据回滚

- 新增表结构采用增量迁移
- 配置变更写版本表
- 高风险配置变更保留 `before_payload`

### 10.3 功能回滚

- 后台入口可通过 Nginx 或前端开关关闭
- 后台 API 可按模块开关停用
- 配置中心支持回滚到上一个稳定版本

### 10.4 隔离回滚

- 小牛育儿后台发布失败时，只回滚 `admin-niuniu.woyai.cn` 对应站点与进程。
- 不触碰我赢AI现有后台 Nginx 配置块。
- 不重启我赢AI现有后台 PM2 进程。

## 十一、优化建议

### 11.1 收入增长方向

- 重点关注“高使用低转化”板块，优先优化会员承接页。
- 对 AI 问答、能力成长和成长观察建立付费漏斗。
- 对付费前关键行为建立识别规则，提炼高转化路径。

### 11.2 内容增长方向

- 建立文章、能力点、食谱三类排行。
- 对高浏览低收藏内容优化标题与结论结构。
- 对高访问低完成模块压缩任务长度，降低完成门槛。

### 11.3 运营增长方向

- 每周查看板块排行和会员转化排行。
- 每两周做一次首页排序实验。
- 每月复盘“访问 -> 试用 -> 付费 -> 续费”完整链路。
