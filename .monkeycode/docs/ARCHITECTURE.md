# 小牛育儿项目架构

## 概述

项目由 Express/MySQL 后端、微信小程序和静态运营后台组成，为家长提供孩子档案、能力观察、训练计划、成长记录、阶段报告、发展专区、知识内容和会员服务。

后端以 `backend/src/mysql-production/server.js` 作为生产 API 入口，负责路由注册、JWT 认证、孩子归属校验和 MySQL 访问。领域规则分别收口在业务字典、迁移执行器、成长时间线、能力训练、知识内容、阶段报告、事件协议和分析质量模块中。

## 技术栈

- Node.js、Express
- 微信小程序 JavaScript、WXML、WXSS
- 静态 HTML、CSS、JavaScript 运营后台
- MySQL、`mysql2`
- Jest、Supertest、Node.js `assert` 验证脚本
- JWT、微信登录和微信支付相关服务

## 项目结构

```text
shared/                           跨端业务字典 JSON
backend/src/shared/               后端业务字典和统一字段归一化
backend/src/mysql-production/     生产 API、领域服务、迁移和分析模块
backend/src/scripts/              数据导入、统计和内容审计脚本
backend/tests/                    后端单元、契约、接口和属性测试
miniprogram/                      微信小程序页面与本地状态工具
admin-portal/                     运营后台静态页面
scripts/                          根项目跨端结构与流程测试
.monkeycode/docs/                 项目文档
```

## 统一业务字典

业务字典的唯一数据源是 `shared/business-dimensions.json`，后端通过 `backend/src/shared/business-dimensions.js` 读取，小程序使用 `miniprogram/utils/business-dimensions.js`。当前字典版本为 1。

- 年龄段：`age_0_1`、`age_1_2`、`age_2_3`、`age_3_4`、`age_4_5`、`age_5_6`、`age_6_9`、`age_9_12`。
- 能力：专注力、感觉运动、语言表达、大运动、情绪调节、社交沟通、自信与适应、生活习惯、生长与身高、身体安全。
- 场景：学习与专注、感觉与运动、情绪与规则、语言与社交、生长与健康、身体安全、生活场景。
- 内容形态：知识文章、家庭训练、家庭场景、营养食谱、能力观察。
- 兼容年龄映射：`4-6岁` 展开为 `age_4_5` 和 `age_5_6`，`6+` 展开为 `age_6_9` 和 `age_9_12`。

`backend/src/shared/business-fields.js` 统一接收 camelCase 与 snake_case 字段，校验 `childId`、年龄代码、能力代码、业务来源、发生时间和数据版本。业务来源包含能力观察、测评、训练、发展专区、AI、每日状态、核心动作、手工记录、知识导入和分析。

## 数据库迁移

`backend/src/mysql-production/migration-runner.js` 在服务启动时由 `bootstrap()` 调用。执行器创建 `schema_migrations`，使用 MySQL 命名锁串行执行迁移，校验 SHA-256 checksum，并记录 `running`、`applied`、`failed` 状态以及失败和回滚时间。已应用且 checksum 一致的迁移会跳过；checksum 不一致会中止该次迁移。

当前迁移定义位于 `backend/src/mysql-production/migrations/index.js`：

| 版本 | 主要对象 |
| --- | --- |
| `20260821_001_child_development_foundation` | 能力画像、训练反馈、成长时间线、知识元数据、分析日聚合 |
| `20260821_002_growth_api_compatibility` | 旧字段使用统计 `api_compatibility_stats` |
| `20260821_003_ability_training_loop` | 观察提交、训练计划、训练任务、训练完成及相关补充字段 |

服务在迁移后继续执行原有 `ensureProductionTables()`，因此新迁移体系与历史建表逻辑并存。数据库初始化异常会写日志，当前 `bootstrap()` 仍会继续启动 HTTP 服务。

## 成长时间线

`backend/src/mysql-production/growth-timeline.js` 是观察、训练、每日计划、每日状态、发展专区、AI 回答、用户记录和核心动作的统一追溯层。

允许的条目类型为 `ai_answer`、`assessment_result`、`training_complete`、`training_feedback`、`daily_plan_complete`、`daily_status`、`user_note`、`development_zone`、`core_action`。每条记录包含孩子、来源、能力代码、发生时间、摘要、维度、元数据和幂等标识。

显式 `idempotencyKey` 缺失时，模块根据稳定字段生成哈希；数据库同时约束 `entry_id` 和孩子维度的幂等键。旧字段会被归一化，并在 `api_compatibility_stats` 中按接口和字段累计使用次数。

## 能力观察与训练闭环

`backend/src/mysql-production/ability-training.js` 提供 3-6 岁观察配置，当前能力域是 `attention` 和 `sensory_motor`。六道观察题使用 0-3 分，聚合为 0-100 分的维度画像，并将最低分能力设为主要关注方向。输出明确包含家庭观察边界提示。

训练计划支持 3、7、30 天。任务包含目标、时长、步骤、家长提示、观察信号、安全提醒、内容版本和孩子/计划/能力归属。完成任务与提交反馈均使用幂等键并写入成长时间线。小程序 `miniprogram/utils/training-sync.js` 按孩子隔离失败队列，重试完成记录和反馈。

## 知识库

`backend/src/mysql-production/knowledge-content.js` 负责知识规范化、校验、查询和降级：

- 内容类型只接受 `article`、`task`、`scene`、`assessment`。
- 正式内容必须具备稳定内容 ID、标准年龄/能力/场景代码、内容形态、来源、证据等级、内容版本、审核状态和发布状态。
- 训练内容还必须具备训练目标、正整数时长、步骤、家长提示、观察信号和安全提醒。
- 默认只查询 `approved` 且已发布的 `knowledge_contents`。
- 正式库为空时降级到 `backend/examples/knowledgebase-sample.json`；数据库查询失败时使用同一本地降级源，并通过响应元数据说明原因。

`backend/src/scripts/import-knowledge-base.js` 使用内容哈希实现可重复导入，结果区分插入、跳过和失败。

## 阶段报告与会员

`backend/src/mysql-production/stage-report.js` 以纯函数聚合周期内成长时间线：训练完成数来自 `training_complete`，反馈趋势来自 `training_feedback.metadata.feedbackKey`，能力分数来自 `assessment_result.dimensions` 的平均值。异常分数被限制在 0-100。

服务端将报告缓存到 `weekly_growth_summaries`，缓存缺少完整关注项、完整建议或发展专区摘要时重新生成。`dataStatus` 取值为：无可追溯条目时 `insufficient_data`；记录天数达到 4 天或训练完成达到 3 次时 `complete`；其余为 `partial`。

`backend/src/mysql-production/report-membership.js` 在响应前执行会员裁剪：有效会员获得完整关注点、完整建议和完整推荐；基础用户获得关注点首项、建议前两项、推荐首项、趋势首项和亮点首项，并删除常见会员专属字段。小程序页面同时支持报告历史、会员入口和分享草稿。

会员套餐通过微信小程序虚拟支付购买。订单号由时间戳和密码学随机值组成，并受数据库唯一约束保护；发货通知在事务中锁定订单，只有未支付订单会开通一次会员。生产环境缺少消息推送 token 时拒绝虚拟支付消息，标准微信支付回调通过平台证书验签并按 AES-GCM 规范解密。

## 埋点与分析

小程序统一通过 `miniprogram/app.js` 的 `trackKbEvent()` 上报，后端由 `event-protocol.js` 归一化。事件协议生成或沿用 `event_id`，支持客户端重试幂等，单批最多 100 条，事件元数据最大 8192 字节。

协议会移除授权头、访问令牌、刷新令牌、密码、Cookie、私钥、API Key 和会话令牌等敏感键。公共维度覆盖孩子、年龄、能力、计划、来源模块、来源页面、内容、会员状态、会员入口、发生时间和 schema 版本。

`analytics-quality.js` 聚合字段覆盖率、未知字典值、重复事件、迟到事件、缺少孩子标识和知识内容覆盖缺口。`build-admin-daily-stats.js` 按自然日重建用户、收入、功能、内容、漏斗和统一分析聚合。

## 运营后台

`admin-portal/` 由生产服务挂载在 `/admin-console`，API 默认前缀为 `/admin-api/v1`。后台需要管理员认证，包含概览、用户与收入趋势、功能与内容排行、核心动作漏斗、周洞察、用户分层、内容运营和 AI 问答分析。

本轮新增的分析视图为成长闭环、年龄能力、知识覆盖、会员转化和事件质量。前端统一支持日期、年龄、能力和会员状态筛选，各模块独立显示加载、空态、错误和重试状态。

生产后端保留 `/recommendations` 兼容接口，按当前用户的孩子归属读取最近评估建议和适龄任务，并补充已发布热门文章。该接口在通配付费占位路由前注册，避免历史客户端收到占位响应。

## 首页状态

`miniprogram/utils/home-state.js` 保证首页只选择一个主动作，优先级为：

1. `no_observation`：先做能力观察。
2. `unfinished_training`：继续未完成训练。
3. `pending_feedback`：补充表现反馈。
4. `report_available`：查看阶段报告。
5. `membership_expired`：查看会员服务。
6. `ready`：继续记录一个具体变化。

`miniprogram/pages/index/index.js` 合并最近核心动作、继续任务、每日计划、观察状态、反馈状态、报告状态和会员状态。首页快照按孩子保存在本地；远端加载失败时恢复本地状态并标记 `source: local`、`recovered: true`。周进展并行读取阶段报告和近 7 天成长摘要，会员状态优先刷新远端并在失败时使用缓存。

## 核心链路

```text
业务字典 -> 能力观察 -> 能力画像 -> 训练计划 -> 任务完成与反馈
                                      |                 |
                                      +-> 成长时间线 <-+
                                                |
                                                +-> 阶段报告 -> 会员字段裁剪
                                                |
                                                +-> 埋点与日聚合 -> 运营后台
```
