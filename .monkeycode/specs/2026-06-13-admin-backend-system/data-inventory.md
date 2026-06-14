# 阶段1数据资产清单

**文档日期**: 2026-06-13  
**用途**: 作为小牛育儿后台阶段1的数据底座清单，用于统计设计、埋点设计、回测抽样和回滚评估。

## 一、原则

- 本清单优先以当前生产 MySQL 服务真实读写口径为准。
- SQLite 中的同名表只作为历史实现参考，不作为生产统计主口径。
- 与后台建设有关的新增管理表统一使用 `admin_` 前缀。
- 与我赢AI后台相关的管理表、后台路由和后台进程不在本清单复用范围内。

## 二、现有业务表

### 2.1 `users`

用途：用户注册主体。

核心字段：

- `id`
- `openid`
- `nickname`
- `avatar_url`
- `created_at`
- `updated_at`

后台用途：

- 累计注册用户数
- 新增注册趋势
- 新用户来源分析的用户主体关联

回测抽样：

- 抽样核对某日 `created_at` 落入区间的用户数
- 核对同一用户是否在后台统计中只计一次

### 2.2 `children`

用途：孩子档案。

核心字段：

- `id`
- `user_id`
- `name`
- `nickname`
- `gender`
- `birthday`
- `is_default`
- `created_at`

后台用途：

- 有孩子档案用户占比
- 多孩家庭分布
- 用户分群基础字段

### 2.3 `user_memberships`

用途：用户会员状态快照。

已确认读写口径：

- 当前会员计划
- 当前会员到期时间
- 会员类型
- 状态
- 是否试用过

核心字段：

- `user_id`
- `is_trial_used`
- `trial_end_date`
- `current_plan`
- `current_end_date`
- `membership_type`
- `status`
- `auto_renew`
- `updated_at`

后台用途：

- 当前有效会员数
- 试用用户数
- 套餐结构分布
- 试用转付费转化

风险说明：

- 会员状态需以 `status` 和 `current_end_date` 双重判定。
- 后台统计时需要定义“有效会员”严格口径，避免历史状态误计。

### 2.4 `payment_orders`

用途：支付订单主体。

已确认读写口径：

- 创建订单时写入 `pending`
- 支付成功后更新为 `paid`
- 支付失败或回调失败时更新为 `failed`

核心字段：

- `id`
- `user_id`
- `plan_code`
- `order_no`
- `amount`
- `status`
- `wx_prepay_id`
- `wx_transaction_id`
- `auto_renew`
- `paid_at`
- `created_at`

后台用途：

- 订单数
- 支付成功率
- 收入趋势
- 套餐销量结构
- 新增付费用户识别

风险说明：

- 订单金额单位需在阶段1确认生产库是否与现有服务返回值一致。
- 支付成功口径应以 `status = 'paid'` 为准，收入时间优先以 `paid_at` 为准。

### 2.5 `referrals`

用途：邀请裂变关系和奖励记录。

核心字段：

- `id`
- `inviter_id`
- `invitee_id`
- `invitee_order_id`
- `reward_days`
- `status`
- `created_at`

后台用途：

- 邀请带来的注册数
- 邀请带来的付费数
- 裂变转化率

### 2.6 `articles`

用途：育儿文章内容主体。

核心字段：

- `id`
- `title`
- `summary`
- `content`
- `category`
- `sub_category`
- `age_group`
- `tags`
- `author`
- `evidence_level`
- `read_count`
- `is_published`
- `created_at`
- `updated_at`

后台用途：

- 文章排行
- 分类表现
- 上下线管理

风险说明：

- `read_count` 当前不能直接视为唯一主口径，需要与事件访问量交叉验证。

### 2.7 `reading_tasks`

用途：能力成长内容主体。

核心字段：

- `id`
- `task_code`
- `title`
- `subject_code`
- `age_range`
- `difficulty`
- `duration`
- `material`
- `objective`
- `steps`
- `parent_prompt`
- `content`
- `tips`
- `example_answer`
- `created_at`
- `updated_at`

后台用途：

- 能力成长内容管理
- 主题、年龄段、方向分布统计
- 单任务访问和完成表现分析

### 2.8 `task_progress`

用途：孩子任务进度。

核心字段：

- `id`
- `child_id`
- `task_id`
- `status`
- `progress`
- `completed_at`
- `created_at`
- `updated_at`

后台用途：

- 任务完成量
- 任务完成率
- 能力成长模块完成漏斗

### 2.9 `assessment_records`

用途：成长观察记录。

核心字段：

- `id`
- `child_id`
- `assessment_code`
- `assessment_name`
- `age_group`
- `total_score`
- `max_score`
- `percentage`
- `overall_level`
- `elapsed_time`
- `completed_at`
- `created_at`

后台用途：

- 成长观察发起量
- 完成量
- 量表使用分布

### 2.10 `event_tracks`

用途：行为埋点总表。

核心字段：

- `id`
- `user_id`
- `event_type`
- `event_data`
- `session_id`
- `created_at`

当前 `event_data` 已确认字段：

- `child_id`
- `task_id`
- `path_id`
- `share_source`
- `day_index`
- `score`
- `duration_sec`
- `has_recording`
- `event_meta`

后台用途：

- 活跃用户统计
- 页面访问和功能使用统计
- 内容表现统计
- 关键漏斗统计

风险说明：

- 当前事件结构偏通用，缺少 `module_key`、`page_key`、`content_type` 等统一字段。
- 阶段1需要补一个标准事件模型，并兼容历史事件。

## 三、待新增后台表

阶段1建议新增：

- `admin_users`
- `admin_audit_logs`
- `admin_runtime_configs`
- `admin_daily_user_stats`
- `admin_daily_revenue_stats`
- `admin_daily_content_stats`
- `admin_daily_feature_stats`
- `admin_daily_funnel_stats`

## 四、现有数据缺口

当前后台统计仍存在以下缺口：

- 缺少管理员和后台审计表
- 缺少按日聚合表
- 缺少统一内容访问事件
- 缺少首页模块点击的标准字段
- 缺少 AI 问答与会员页、支付页之间的标准漏斗事件

## 五、阶段1开发建议

1. 先补齐事件标准和聚合表，再做后台统计 API。
2. 所有新增统计表都使用 `admin_` 前缀。
3. 所有后台统计口径都提供对应原始表抽样 SQL。
4. 与我赢AI后台彻底隔离，不共享管理表和后台配置表。
