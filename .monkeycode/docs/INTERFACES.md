# 接口说明

## API 前缀与认证

生产 API 默认使用 `/api/v1`，实际前缀由 `API_PREFIX` 配置；服务同时注册 `/api/v1` 兼容前缀。运营后台 API 默认使用 `/admin-api/v1`。

本页列出的孩子、时间线、观察、训练、报告、埋点和会员接口均要求用户 JWT。知识查询与发展专区使用可选用户认证。运营后台接口要求管理员认证。

## 成长时间线

| 方法 | 路径 | 主要输入 | 行为 |
| --- | --- | --- | --- |
| POST | `/growth-records/entry` | `childId`、`entryType`、`title`，可选来源、能力、时间、维度、元数据和 `idempotencyKey` | 校验孩子归属，归一化并幂等写入时间线 |
| GET | `/growth-records/entries` | `childId`，可选 `entryType`、`page`、`pageSize` | 按发生时间和 ID 倒序分页，`pageSize` 最大 50 |
| GET | `/growth-records/daily` | 孩子和日期参数 | 获取每日成长记录 |
| POST | `/growth-records` | 每日状态字段 | 新增或更新每日成长记录 |
| GET | `/growth-records/history` | 孩子和分页参数 | 获取历史每日记录 |
| GET | `/growth-records/summary` | `childId`、可选 `days` | 聚合周期完成天数和状态均值 |

时间线条目类型为 `ai_answer`、`assessment_result`、`training_complete`、`training_feedback`、`daily_plan_complete`、`daily_status`、`user_note`、`development_zone`、`core_action`。来源类型为 `ability_observation`、`assessment`、`training`、`development_zone`、`ai`、`daily_status`、`core_action`、`manual`。

响应条目包含 `entryId`、`childId`、`entryType`、`sourceType`、`sourceId`、`abilityCodes`、`occurredAt`、`title`、`summary`、`dimensions`、`metadata` 和 `deduplicated`。兼容 snake_case 输入；服务会统计旧字段使用情况。

## 能力观察与训练

| 方法 | 路径 | 主要输入 | 主要输出或约束 |
| --- | --- | --- | --- |
| GET | `/ability-observations/config` | 可选 `ageGroup` | 观察版本、年龄段、能力域、问题和边界提示 |
| POST | `/ability-observations/submit` | `childId`、`ageGroup`、`answers`、可选幂等键 | 保存观察提交与能力画像，并写入时间线 |
| GET | `/ability-profiles` | `childId` | 最近 20 条能力画像 |
| GET | `/training-plans` | `childId` | 最近 10 个计划及任务 |
| POST | `/training-plans/generate` | `childId`、`durationDays`、可选幂等键 | 依据最近画像生成 3、7 或 30 天计划 |
| GET | `/training-tasks/:id` | 路径任务 ID | 返回任务详情并校验孩子归属 |
| POST | `/training-tasks/:id/complete` | 可选 `idempotencyKey` | 校验计划有效期，幂等完成任务并写入时间线 |
| POST | `/training-feedback` | `taskId`、`feedbackKey`、可选 `note` 和幂等键 | 保存反馈并返回下一步建议 |
| GET | `/training-plans/next` | `childId` | 返回当前有效计划中最早的未完成任务 |

观察仅接受 `3-4岁`、`4-5岁`、`5-6岁`，答案值为 0-3。反馈键为 `smooth`、`reminder_needed`、`left_early`、`resisted`、`incomplete`。生成计划前必须已有能力画像。

## 知识内容

| 方法 | 路径 | 查询字段 | 行为 |
| --- | --- | --- | --- |
| GET | `/knowledge/contents` | 年龄、能力、场景、内容类型、内容形态、审核状态、关键词、发布状态和分页 | 查询正式知识内容，空库或查询失败时返回本地降级内容 |
| GET | `/knowledge/ability-content` | 与 `/knowledge/contents` 相同 | 复用同一知识查询处理器 |

兼容字段包括 `age_segment_codes` / `ageSegmentCodes` / `age_group`、`ability_codes` / `abilityCodes`、`scene_codes` / `sceneCodes`、`content_type`、`content_form`、`review_status`、`keyword` / `q`。单页上限为 50。

知识响应的 `meta` 包含 `source`、`fallback`、`gap_reason` 和 `schema_version`。`source` 为 `formal` 或 `local_fallback`；降级原因当前为 `formal_content_missing` 或 `formal_content_query_failed`。

## 阶段报告与会员

| 方法 | 路径 | 主要输入 | 行为 |
| --- | --- | --- | --- |
| GET | `/membership/info` | 当前用户 | 获取会员状态、权益、方案和可用降级路径 |
| GET | `/weekly-summary` | `childId`，可选 `weekStart` 或 `date` | 获取或生成指定周期报告 |
| GET | `/weekly-summary/current` | 与 `/weekly-summary` 相同 | 复用当前周期报告处理器 |
| GET | `/weekly-summary/history` | `childId`、可选 `limit` | 返回最近报告摘要，`limit` 为 1-30，默认 12 |

报告包含孩子与周期、记录天数、训练完成、反馈趋势、观察次数、能力分数、发展专区摘要、亮点、关注点、下一步和推荐内容，并提供 `dataStatus`、`generationVersion`、`premiumUnlocked`。

`dataStatus` 为 `insufficient_data`、`partial` 或 `complete`。有效会员获得完整 `concerns`、`nextActions` 和 `recommendedContent`；基础用户获得裁剪后的预览数组，响应中不会保留 `concernsFull`、`nextActionsFull`、`recommendedContentPremium` 等会员专属字段。

兼容推荐接口：

| 方法 | 路径 | 主要输入 | 行为 |
| --- | --- | --- | --- |
| GET | `/recommendations` | 可选 `child_id` 或 `childId` | 返回评估建议、适龄任务和热门文章分组；指定孩子必须属于当前用户 |

兑换码接口由 `MEMBERSHIP_PROMO_CODE` 或 `UNIFIED_MEMBERSHIP_PROMO_CODE` 配置，未提供时使用项目默认礼包码。每个用户对同一兑换码只能成功兑换一次，兑换过程使用事务延长会员并写入 `promo_code_redemptions`。

## 埋点上报

| 方法 | 路径 | 输入 | 行为 |
| --- | --- | --- | --- |
| POST | `/kb/events/track` | 单个事件 | 归一化事件并按 `event_id` 幂等写入 |
| POST | `/kb/events/track/batch` | `events` 或 `items` 数组 | 事务写入 1-100 个事件，任一失败则回滚整批 |

核心字段包括 `event_type`、`event_id`、`client_session_id`、`action_id`、`child_id`、`age_segment_code`、`ability_codes`、`plan_id`、来源模块与页面、内容类型与 ID、场景/分类/痛点、会员状态与入口、`occurred_at`、`schema_version`、`event_meta`。

服务端会过滤事件元数据中的授权、令牌、密码、Cookie、私钥和 API Key 等敏感键。单个 `event_meta` 最大 8192 字节。旧事件名会映射到当前协议，例如 `payment_success` 映射为 `payment_order_success`。

阶段报告页面上报 `weekly_summary_view`、`stage_report_generated`、`stage_report_generation_failed`、`weekly_summary_action_click`、`stage_report_membership_click`、`stage_report_complete_read` 和 `stage_report_share`。观察和训练页面上报曝光、开始、提交、完成、查看、放弃、反馈及下一步建议事件。

## 运营后台

后台静态入口为 `/admin-console`，以下路径均位于 `/admin-api/v1` 且要求管理员认证。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/auth/login` | 管理员登录 |
| GET | `/auth/me` | 当前管理员信息 |
| POST | `/auth/password` | 修改管理员密码 |
| GET | `/dashboard/overview` | 用户、会员、收入、家庭和运营总览 |
| GET | `/analytics/users/trends` | 用户趋势 |
| GET | `/analytics/revenue/trends` | 收入趋势 |
| GET | `/analytics/features/ranking` | 功能排行 |
| GET | `/analytics/content/ranking` | 内容排行 |
| GET | `/analytics/core-action/funnel` | 首页核心动作及年龄、分类、痛点、能力漏斗 |
| GET | `/analytics/growth-loop` | 观察到支付的成长闭环事件与用户漏斗 |
| GET | `/analytics/age-ability` | 年龄、能力、会员和来源维度的完成与内容供给 |
| GET | `/analytics/membership-conversion` | 会员入口曝光、点击、订单、支付和收入归因 |
| GET | `/analytics/event-quality` | 字段覆盖、未知值、重复、迟到和缺孩子标识 |
| GET | `/analytics/content-coverage` | 年龄与能力内容覆盖矩阵和缺口 |
| GET | `/analytics/operations-quality` | 内容发布、媒体和客服工单质量指标 |
| GET | `/insights/weekly` | 周运营洞察 |
| GET | `/segments/:segmentKey/users` | 用户分层明细 |
| GET | `/content/ops/overview` | 内容运营概览 |
| GET | `/content/ops/pending-core-items` | 待补核心内容 |
| POST | `/content/ops/seed-core-tips` | 补充核心提示内容 |
| GET | `/content/ops/tips` | 提示内容运营列表 |
| GET | `/content/ops/articles` | 文章运营列表 |
| GET | `/analytics/ai-chat/overview` | AI 问答概览 |
| GET | `/analytics/ai-chat/fallback-queries` | AI 降级问题列表 |
| GET | `/analytics/ai-chat/recent` | 最近 AI 问答记录 |

### 内容与媒体

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/media` | 上传并登记 Base64 媒体资产 |
| GET | `/media` | 查询媒体资产列表 |
| GET | `/media/:id/references` | 查询媒体引用关系 |
| POST | `/media/:id/references` | 创建或更新媒体引用 |
| PUT | `/media/:id/status` | 更新媒体状态和替代文本 |
| POST | `/articles` | 创建文章草稿并生成内容版本 |
| PUT | `/articles/:id` | 更新文章草稿并生成新版本 |
| GET | `/articles` | 查询文章运营列表 |
| POST | `/pain-points` | 创建成长痛点主数据 |
| PUT | `/pain-points/:key` | 更新成长痛点并生成新版本 |

### 内容发布

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| POST | `/content/:type/:id/submit-review` | 提交当前版本审核 |
| POST | `/content/:type/:id/approve` | 审核通过当前版本 |
| POST | `/content/:type/:id/publish` | 立即发布审核通过版本 |
| POST | `/content/:type/:id/schedule` | 创建定时发布任务 |
| POST | `/content/:type/:id/offline` | 下线已发布版本 |
| POST | `/content/:type/:id/restore` | 从当前历史版本创建新的草稿版本 |

`type` 当前支持文章和成长痛点等内容类型。状态变更受发布状态机和角色权限共同约束；定时任务由 `backend/src/scripts/publish-due-content.js` 执行。

### 客服工单

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/support/tickets` | 查询工单列表，联系方式按权限脱敏 |
| PUT | `/support/tickets/:id` | 更新状态、优先级、负责人和公开进展 |
| POST | `/support/tickets/:id/callbacks` | 记录电话或其他方式的回访结果 |

小程序侧的 `GET /feedback/history` 使用用户 JWT，只返回当前用户工单的状态和公开进展。后台客服写操作会同步生成工单事件和管理员审计记录。

### 会员配置与用户运营

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/membership/config` | 查询当前会员展示配置版本 |
| GET | `/membership/config/versions` | 查询会员配置历史版本 |
| POST | `/membership/config/preview` | 归一化并预览会员配置 |
| POST | `/membership/config` | 保存会员配置草稿 |
| POST | `/membership/config/submit-review` | 提交会员配置审核 |
| POST | `/membership/config/approve` | 审核通过会员配置 |
| POST | `/membership/config/publish` | 发布会员配置 |
| POST | `/membership/config/offline` | 下线当前会员配置 |
| POST | `/membership/config/restore` | 从历史版本创建新的草稿 |
| GET | `/users/operations` | 查询用户活跃、会员和服务记录摘要 |
| GET | `/users/:id/service-records` | 查询指定用户的服务记录 |

会员配置实体固定为 `membership_config/default`，状态沿用通用内容版本状态机。配置展示只影响入口文案、权益和套餐排序；支付和权益业务接口保持既有契约。用户运营接口默认脱敏手机号，只有具备 `user:contact` 或 `ticket:contact` 字段权限的角色可以读取完整联系方式。

### 成长痛点公共接口

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/pain-points` | 按分类查询正式成长痛点 |
| GET | `/pain-points/:key` | 查询指定稳定键的成长痛点详情 |
| GET | `/content/:type/:id` | 查询指定内容已发布版本 |

成长痛点返回 `pain_point_key`、分类、短标题、描述、可观察表现、可能原因、今日行动、家长提示和观察信号。公共内容接口会过滤未审核、未发布或尚未到发布时间的版本。

新增分析接口统一支持 `start_date`、`end_date`、`age_segment_code`、`ability_code`、`membership_status`；日期格式为 `YYYY-MM-DD`。事件质量与内容覆盖接口还接受 `days`，范围为 1-90。会员转化接口额外接受 `source` 或 `entry_source`，内容覆盖额外接受 `content_form`。

`/analytics/operations-quality` 返回 `content_operations` 和 `support_operations` 两组聚合数据，包含发布数量、审核耗时、媒体失败、版本恢复、待处理工单、处理时长、回访完成率和关闭结果。没有统计数据的日期区间仍返回成功响应和零值字段。

## 响应结构

使用统一响应帮助器的成功响应包含 `success`、`data` 和 `meta`，错误响应包含稳定的 `error.code`、提示和请求元数据。部分历史接口仍直接返回 `{ success, data }` 或 `{ success, message }`，调用方应以各路由当前实现为准。
