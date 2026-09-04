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
| `20260902_001_content_operations_platform` | 管理员权限、审计、媒体资产、内容版本、审核发布、成长痛点和客服工单 |

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

## 内容运营与客服

`admin-portal/` 由生产服务挂载在 `/admin-console`，API 默认前缀为 `/admin-api/v1`。后台请求先经过管理员 JWT 认证，再经过角色权限检查。敏感联系方式按照权限脱敏，媒体、内容、痛点和工单写操作记录到 `admin_audit_logs`。

本轮新增运营领域包含：

- `admin-access.js`：管理员角色能力、字段权限、联系方式脱敏和审计事务。
- `media-service.js`：Base64 媒体校验、大小和 MIME 限制、路径安全、存储适配器及引用关系。
- `content-publishing.js`：草稿、审核、定时发布、发布、下线和历史版本恢复状态机。
- `pain-points.js`：成长痛点字段归一化、稳定 `pain_point_key` 和内容哈希。
- `support-tickets.js`：反馈工单状态、优先级、公开进展和回访记录。
- `membership-operations.js`：会员入口、权益和套餐展示配置的归一化、排序和版本载荷。
- `user-operations.js`：用户活跃状态、会员状态、服务记录和联系方式脱敏。

内容版本存储在 `content_versions`，审核记录存储在 `content_reviews`，定时任务存储在 `content_publish_jobs`。公共内容接口只返回审核通过、已发布且已到发布时间的版本。生产对象存储可通过媒体存储适配器接入，当前默认适配器写入本地 `uploads/media`。

客服首期采用反馈工单回访：小程序创建反馈后，后台可以分配、更新状态、填写公开进展和记录回访；小程序通过历史接口查看公开状态与进展，联系方式只在具备 `ticket:contact` 权限时展示完整值。反馈页支持显式申请回访，申请回访时联系方式必填，工单使用 `callback_request` channel 标识；提交时保存白名单设备上下文。反馈历史缓存按用户 ID 隔离，未登录页面不读取历史缓存。后台更新工单前锁定并读取数据库当前状态，回访记录会写入事件、审计日志，并同步工单状态与公开进展。

会员展示配置以 `membership_config/default` 作为内容版本实体，会员信息接口只读取审核通过且已发布的版本。配置变更不会修改支付订单、微信回调或权益计算逻辑；这些逻辑继续使用现有会员服务。用户运营视图从用户、会员、事件和工单数据聚合活跃状态、会员状态、近 14 日行为数和服务记录数。

## 运营后台

后台包含概览、用户与收入趋势、功能与内容排行、核心动作漏斗、周洞察、用户分层、内容运营和 AI 问答分析，并新增媒体、文章、成长痛点、内容发布和客服工单能力。

本轮新增的分析视图为成长闭环、年龄能力、知识覆盖、会员转化和事件质量。前端统一支持日期、年龄、能力和会员状态筛选，各模块独立显示加载、空态、错误和重试状态。

`operations-analytics.js` 和 `build-admin-daily-stats.js` 追加内容发布质量、媒体失败、版本恢复和客服工单处理指标，分别写入 `operations_quality`、`support_quality` 日聚合。`/analytics/operations-quality` 对聚合结果执行安全字段过滤，空区间返回零值结构。

`release-protection.js` 提供服务端内容读取、小程序远程内容和后台内容写入三个独立开关。启动迁移或配置失败时保留核心服务并进入安全模式；内容读取支持本地快照/旧接口降级；定时发布任务使用待处理状态更新和失败告警记录，重复执行保持幂等。

生产后端保留 `/recommendations` 兼容接口，按当前用户的孩子归属读取最近评估建议和适龄任务，并补充已发布热门文章。该接口在通配付费占位路由前注册，避免历史客户端收到占位响应。

## 首页状态

`miniprogram/utils/home-state.js` 保证首页只选择一个主动作，优先级为：

1. `no_observation`：先做能力观察。
2. `unfinished_training`：继续未完成训练。
3. `pending_feedback`：补充表现反馈。
4. `report_available`：查看阶段报告。
5. `membership_expired`：查看会员服务。
6. `ready`：继续记录一个具体变化。

`miniprogram/pages/index/index.js` 合并最近核心动作、继续任务、每日计划、观察状态、反馈状态、报告状态和会员状态。当前首页可见信息架构为轮播 Banner、常用功能图标和重点专题，原有核心行动模型继续作为兼容状态层。Banner 优先读取 `/home/banners` 的有效发布版本，远端不可用或结果为空时保留本地 Banner，图片加载失败时展示完整文字内容。

四个一级页面的职责为：首页承载品牌、专题和常用功能导航；功能页按写作业、吃饭、睡前、出门和亲子共读等家庭场景进入具体表现；成长页集中行动进度、观察记录、周总结和阶段变化；我的页面集中孩子档案、会员、反馈与账号服务。一级页面之间使用 `wx.switchTab`，详情页面使用 `wx.navigateTo`，跨页面成长记录上下文通过按孩子隔离的本地存储传递。

首页可见层按 `孩子信息 → Banner → 今日核心行动 → 快捷功能 → 重点专题 → 成长服务` 组织。今日核心行动直接绑定 `homePrimaryCard` 和 `onHomePrimaryActionTap`；快捷功能从入口数据读取 `iconPath`；Banner 同时保留图片和文字层，图片失败时仍显示完整文案；成长记录入口使用 `growth_record` 动作进入成长 Tab。四个原生 Tab 均配置图标资源，保持首页、功能、成长和我的的入口结构；专用成长图标资源后续按视觉资产计划补齐。旧发展专区入口保留业务跳转实现并从首页可见层隐藏，避免和重点专题重复展示。

成长痛点链路从首页进入“功能”一级页，再由具体表现打开 `development/detail`。详情页使用 `painPointKey` 区分成长痛点模式与固定发展专区模式：痛点模式在同一页面展示判断依据、可能原因、今日行动步骤、家长话术和观察信号；固定专区模式继续进入 `development/scene` 查看完整专题。痛点内容同时兼容远端 `todayAction`、`possibleReasons`、`observeSignals` 字段和本地 `defaultAction`、`defaultBottleneck`、`observableSigns` 降级字段。

痛点详情完成今日行动后，通过按孩子隔离的 `pendingGrowthRecordSource` 和 `pendingGrowthRecordNote` 将痛点、行动和观察提示传给“成长”一级页，并使用 `wx.switchTab` 返回成长 Tab。成长页在每次 `onShow` 时消费新上下文，展示待记录或已记录状态；孩子归属变化时清除旧孩子的页面内行动上下文。

保存痛点行动时，成长页先调用 `/growth-records` 更新当天观察，再调用 `/growth-records/entry` 写成长时间线。前端上下文类型 `development_pain_point` 映射到既有 `core_action` 条目和来源类型，`metadata` 保留 `painPointKey`、`painPointTitle` 和 `practiceAction`。幂等键采用 `pain_point:<childId>:<recordDate>:<painPointKey>`，同一页面后续保存只更新每日记录。

痛点详情的“问小牛”入口通过按孩子隔离的 `pendingChatQuestion` 传递结构化问题。问题包含当前孩子名称和年龄、痛点类别、家庭场景、具体表现、可观察信号、背后能力、卡点判断与今日行动；聊天页在 `onLoad` 或 `onShow` 时消费问题并填入输入框。发送时 `app.chat()` 继续通过 `child_profile` 附带当前孩子档案，服务端沿用现有消息年龄解析和核心行动上下文提取逻辑。

文章、训练、营养和会员详情页统一突出一个主行动，并通过 `miniprogram/utils/detail-navigation.js` 共享返回策略：页面栈存在入口页时调用 `wx.navigateBack`，分享或其他直达场景则使用 `wx.switchTab` 返回所属主链路。文章和营养的“使用这个方法”通过按孩子隔离的 `pendingGrowthRecordNote` 进入成长记录；训练继续使用原任务完成接口与离线同步队列；会员根据基础、试用、有效和到期状态，将主行动分流到领取试用、查看权益或选择方案。文章与营养直达时返回功能 Tab，训练返回成长 Tab，会员返回我的 Tab。

## 小程序页面状态与恢复

`miniprogram/app.json` 注册的 36 个用户可见页面纳入统一状态验收矩阵。存在异步数据或用户上下文依赖的页面根据业务需要显式呈现加载中、未登录、无孩子档案、空数据和请求失败状态；失败状态提供重试，未登录状态提供登录恢复，依赖孩子的操作在缺少档案时引导完善档案。通用内容在无孩子档案时仍可浏览，训练计划、周总结等依赖孩子上下文的操作保持不可用。

页面通过 `app.getApiErrorMessage()` 生成统一错误文案，通过 `app.requireLoginForAction()` 保护登录后操作。训练详情、知识内容、观察历史和周总结等页面在 `onShow` 重新读取登录与当前孩子上下文，支持从登录、会员和孩子档案页面返回后继续加载。周总结使用请求序号隔离过期响应，孩子切换后的新请求保持最终页面状态一致；会员页可使用当前用户的本地会员缓存降级展示，并明确标记缓存状态。

`scripts/test-miniprogram-page-states.js` 以页面注册表为基准检查 36 个页面的验收覆盖、WXML 事件处理器和重点状态字段、文案及恢复入口。该契约测试由根目录 `npm test` 自动执行。

## 小程序长内容与键盘避让

文章详情的富文本容器、食谱详情的食材与步骤、训练详情的标题与行动说明统一限制在可视区域内，并对连续字符启用断词。文章阅读提示避开固定底部行动栏，食谱详情在数据归一化后渲染字符串或对象形式的步骤，详情页底部间距包含设备安全区。

聊天页关闭输入框系统自动顶起，通过 `wx.onKeyboardHeightChange` 维护键盘高度，并测量固定输入区 `.bottom-dock` 的实际高度。消息滚动区底部留白由输入区高度、键盘高度和滚动余量动态计算，消息发送与输入区高度变化后滚动到稳定的 `chat-bottom` 锚点；页面隐藏或卸载时清理键盘监听和延迟测量任务。用户消息加入列表后立即写入按孩子隔离的本地消息存储，保留请求期间的页面恢复能力。

`scripts/test-miniprogram-long-content-keyboard.js` 检查上述长内容样式、食谱步骤结构、键盘监听生命周期、动态留白、滚动锚点和消息即时持久化契约，并由根目录 `npm test` 自动执行。

## 小程序视觉系统

小程序在 `miniprogram/app.wxss` 维护正式视觉基线：页面背景为 `#FAF8F5`，内容卡片为 `#FFFFFF`，边框为 `#ECEFEB`，主品牌色为 `#6AAE98`，品牌深色为 `#397A68`，行动强调色为 `#F28C72`。主文字、正文和辅助文字分别使用 `#2F3432`、`#626A66`、`#929995`；五类成长痛点使用 `#F5E8BC`、`#E7DDF2`、`#DDEBF3`、`#F3DFE3`、`#DDEDE5` 浅底表达。

普通卡片、列表、输入框和次要按钮通过可见边框建立层级，主行动卡和悬浮卡可使用 `0 8rpx 32rpx rgba(106, 174, 152, 0.12)` 轻阴影。装饰渐变不进入正式页面，测评圆形进度保留功能性 `conic-gradient`。奶白导航栏使用黑色标题文字，页面字体栈统一为苹方、冬青黑体、微软雅黑和 Noto Sans CJK SC。

`scripts/audit-miniprogram-visual-system.js` 检查全局令牌、旧主题色、装饰渐变、非规范阴影、一级页面卡片边框、导航栏文字对比度和首页关键文本对比度，并由根目录 `npm test` 自动执行。

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
