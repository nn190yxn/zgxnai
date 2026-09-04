# 开发者指南

## 环境与入口

- Node.js 和 MySQL。
- 根目录负责跨端静态检查与集成验证，`backend/` 负责 Jest 测试和后端脚本。
- 生产后端入口为 `backend/src/mysql-production/server.js`。
- 小程序页面注册位于 `miniprogram/app.json`。
- 运营后台是 `admin-portal/` 下的静态应用，由生产后端挂载。

后端环境变量由部署环境提供。代码和文档仅引用变量名或占位值，密钥、密码、令牌、证书内容和私钥不得进入仓库文档。

## 常用命令

在仓库根目录运行全部跨端验证：

```bash
npm test
```

根测试脚本会按顺序覆盖鼓励与档案上下文、聊天和每日计划、认证刷新、发展专区、首页到成长痛点详情、今日行动、记录变化和成长页反馈、详情页主行动与返回、会员分享、核心动作场景与存储、孩子隔离、首页主流程、运营分析、知识内容、观察训练闭环、小程序核心结构与一级页面导航、36 个注册页面的状态契约、长内容与聊天键盘避让、Banner 管理、虚拟支付合规、内容专业性、布局、排版、文案和正式视觉系统审计。任一脚本失败会终止后续脚本。

反馈客服闭环由 `scripts/test-feedback-support-flow.js` 覆盖：反馈内容校验、回访联系方式要求、中文工单状态、用户隔离缓存、设备信息白名单、公开工单映射、状态机和回访接口字段。反馈页的提交与历史加载必须保留登录校验、失败恢复和重复提交保护；扩展工单状态时同步更新 `support-tickets.js`、运营后台状态文案和该契约测试。

单独运行小程序页面状态契约测试：

```bash
node scripts/test-miniprogram-page-states.js
```

该脚本要求 `miniprogram/app.json` 中的每个注册页面进入验收矩阵，检查 WXML 中 `bindtap`、`catchtap` 对应的页面处理器，并固定训练、成长记录、孩子档案、知识内容、搜索、观察、会员和周总结页面的状态字段、提示文案及恢复入口。新增页面时同步补充矩阵；修改异步页面时覆盖加载、空数据、请求失败、重试、登录恢复和孩子上下文恢复等适用状态。

单独运行长内容与聊天键盘避让契约测试：

```bash
node scripts/test-miniprogram-long-content-keyboard.js
```

修改文章、食谱或训练详情时，应保持内容容器宽度约束、连续文本断词、固定行动区避让和安全区间距。修改聊天输入区时，应同步维护键盘高度监听的注册与清理、`.bottom-dock` 动态测量、`chat-bottom` 滚动锚点、输入框 `adjust-position` 配置和用户消息即时持久化，并在微信开发者工具及 iOS/Android 真机环境复核多行输入、语音提示和键盘收起场景。

iOS/Android 模拟器、真机及不同孩子档案状态的验收过程记录在 `miniprogram-device-acceptance.md`。设备验收必须填写实际环境、结果和问题证据，模拟器矩阵全部通过后完成任务 18.3，真机补充矩阵全部通过后进入提交与推送阶段。

首页视觉调整必须保持孩子信息栏、`home-primary-card`、图标入口、Banner 文字降级和成长服务区可见，功能入口使用 `iconPath`，Banner 的成长记录动作使用 `growth_record`，四个 TabBar 保持完整图标配置。`test-miniprogram-core-ui-structure.js` 会固定这些首页设计契约。重点专题与旧发展专区保持单一可见展示，避免重复曝光。

单独运行小程序正式视觉系统审计：

```bash
node scripts/audit-miniprogram-visual-system.js
```

审计覆盖正式色彩令牌、字体栈、旧主题色、装饰渐变、阴影范围、代表性卡片边框、奶白导航栏标题对比度和首页关键内容对比度。新增页面或视觉样式时，应同步扩展审计规则以固定新的公共契约。

运行根目录联合静态检查：

```bash
npm run lint
```

运行全部后端 Jest 测试：

```bash
cd backend
npm test -- --runInBand
```

运行本轮核心后端测试：

```bash
cd backend
npm test -- --runInBand mysql-migrations.test.js business-dimensions.test.js business-fields.property.test.js growth-timeline.test.js ability-training.test.js training-assignment.property.test.js stage-report.test.js report-properties.test.js report-membership.test.js event-protocol.test.js admin-daily-stats.test.js admin-analytics-contract.test.js api-response.test.js membership.test.js
```

运行根目录重点流程脚本：

```bash
node scripts/test-home-state.js
node scripts/test-home-core-flow.js
node scripts/test-development-pain-point-flow.js
node scripts/test-detail-primary-navigation.js
node scripts/test-miniprogram-core-ui-structure.js
node scripts/test-knowledge-content.js
node scripts/test-ability-training-loop.js
node scripts/test-training-loop-integration.js
node scripts/test-admin-core-action-analytics.js
node scripts/test-membership-growth-share.js
node scripts/test-child-data-isolation.js
```

执行格式与空白检查：

```bash
git diff --check -- .monkeycode/docs
```

## 业务字典约定

`shared/business-dimensions.json` 是年龄、能力、场景和内容形态的跨端数据源。变更字典时同步验证：

1. 后端 `backend/src/shared/business-dimensions.js` 的解析结果。
2. 小程序 `miniprogram/utils/business-dimensions.js` 的读取结果。
3. `backend/src/shared/business-fields.js` 对 camelCase、snake_case、别名和非法值的行为。
4. `business-dimensions.test.js` 和 `business-fields.property.test.js`。

持久化和分析字段使用标准 code。展示层通过字典转换 label。兼容映射集中保留在字典或归一化模块中。

## 迁移约定

迁移定义位于 `backend/src/mysql-production/migrations/index.js`，执行逻辑位于 `migration-runner.js`。新增迁移时：

1. 使用单调且唯一的版本号，保持已应用迁移内容稳定。
2. 为每批语句提供明确名称；执行器会将版本、名称和 SQL 计算为 checksum。
3. 优先使用可重复执行的 DDL，例如 `CREATE TABLE IF NOT EXISTS` 和项目当前 MySQL 版本支持的 `ADD COLUMN IF NOT EXISTS`。
4. 通过 `mysql-migrations.test.js` 验证首次应用、重复跳过、checksum 和失败回滚状态。
5. 关注 MySQL DDL 的事务语义；执行器会调用事务和回滚并记录状态，实际回滚能力仍由数据库与具体 DDL 决定。

迁移测试还需覆盖命名锁等待超时后的连接释放，以及已应用迁移 checksum 变化时中止执行并释放已持有的锁。

服务启动时依次运行 `runMigrations(pool)`、历史 `ensureProductionTables()` 和管理员初始化。当前启动逻辑会记录数据库初始化异常并继续监听端口，因此部署验收需要单独确认迁移状态和业务表可用性。

## 成长时间线约定

新增观察、训练或成长动作时，优先写入 `growth_timeline_entries`，并遵守以下规则：

1. 请求先校验 JWT 和孩子归属。
2. 使用 `growth-timeline.js` 的 `normalizeEntry()` 与 `saveTimelineEntry()`。
3. 提供跨重试稳定的 `idempotencyKey`，避免把随机时间放入业务幂等键。
4. 使用标准条目类型、来源类型和能力代码。
5. 兼容旧字段时保留使用统计，便于后续移除兼容入口。
6. 使用 `growth-timeline.test.js` 验证旧字段归一化、重复写入和孩子分页隔离。

成长痛点完成上下文在小程序内使用 `development_pain_point`，写入服务端时复用 `core_action` 条目和来源类型，并在 `metadata` 中保留稳定痛点键、标题和行动内容。幂等键固定为 `pain_point:<childId>:<recordDate>:<painPointKey>`；成长 Tab 每次显示时消费当前孩子的跨页上下文，切换孩子后清除页面内旧上下文。`scripts/test-development-pain-point-flow.js` 覆盖 Tab 复用、每日记录与时间线写入、重复保存去重、保存状态反馈和跨孩子清理。

成长痛点进入 AI 问答时，详情页应将当前孩子名称和年龄、类别、家庭场景、痛点、表现、观察信号、能力、卡点与行动组成结构化问题，并通过当前孩子对应的 `pendingChatQuestion` 信封传递。字段标签沿用后端 `buildCoreActionChatContext()` 可识别的“年龄、类别、类别Key、场景、痛点、表现、可观察表现、背后能力、卡点判断、今晚第一步、具体步骤”；`app.chat()` 同时保留 `child_profile` 请求字段。修改该链路时运行 `scripts/test-development-pain-point-flow.js`、`scripts/test-chat-context.js` 和 `scripts/test-miniprogram-core-ui-structure.js`。

文章、训练、营养和会员详情页使用 `detail-navigation.js` 处理返回：优先回到页面栈中的入口页，直达时回到该业务所属 Tab。每个详情页保留一个与页面职责一致的主行动；文章和营养进入成长记录时使用 `cross-page-storage.js` 保存当前孩子的 `pendingGrowthRecordNote`，训练继续调用完成任务接口，会员根据状态定位试用、权益、套餐或邀请入口。修改这些页面时运行 `node scripts/test-detail-primary-navigation.js`，同时执行孩子隔离测试和完整根测试。

## 知识库约定

知识导入和查询必须通过 `knowledge-content.js` 的规范化与校验。正式可召回内容需要审核通过且已发布；训练内容必须包含目标、时长、步骤、家长提示、观察信号和安全提醒。

导入命令由 `backend/package.json` 提供：

```bash
cd backend
npm run import:knowledge
```

导入脚本支持内容哈希幂等，结果区分 `inserted`、`skipped`、`failed`。执行正式导入前使用脚本自身的 dry-run 能力和样本校验流程；测试入口是 `node scripts/test-knowledge-content.js`。

查询接口默认审核状态为 `approved` 且只返回已发布内容。正式库无结果或查询异常时会回退本地样本，调用方应读取 `meta.source`、`meta.fallback` 和 `meta.gap_reason`，保留降级可观测性。

## 能力观察与训练约定

观察题、年龄范围、能力域、训练素材和反馈键集中在 `ability-training.js`。当前观察只覆盖 3-6 岁，训练方向只覆盖专注力和感觉运动。

观察提交、训练计划生成、任务完成和反馈均校验孩子归属。观察提交、计划生成、完成和反馈都提供稳定幂等键；完成与反馈成功后写成长时间线。训练计划只接受 3、7、30 天，完成任务前校验计划状态和有效期。

小程序网络失败时由 `training-sync.js` 按孩子保存待同步记录。重试只处理当前孩子，使用幂等键折叠重复记录。相关验证入口是 `ability-training.test.js`、`training-assignment.property.test.js`、`test-ability-training-loop.js` 和 `test-training-loop-integration.js`。

## 阶段报告与会员约定

`stage-report.js` 保持纯函数且无数据库副作用。训练次数来自 `training_complete`，反馈趋势来自 `training_feedback.metadata.feedbackKey`，能力变化来自 `assessment_result.dimensions`。聚合维度分数必须限制在 0-100。

服务端按孩子和周期读取成长时间线，生成后缓存到 `weekly_growth_summaries`。修改报告结构时同步处理缓存失效判断、历史摘要和 `dataStatus`。

会员裁剪统一通过 `formatWeeklySummaryForMembership()` 完成。基础响应只保留预览，并主动删除完整关注点、完整建议、完整趋势和会员内容字段。测试至少覆盖基础用户、有效会员和常见专属字段泄漏。

阶段报告页面使用统一埋点入口记录查看、生成成功、生成失败、内容点击、完整阅读、会员点击和分享。事件需携带 `child_id`、数据状态、会员解锁状态及必要来源信息。

会员兼容链路包含试用、兑换码和邀请奖励。兑换码处理必须先校验当前用户的重复兑换记录，再在同一数据库事务中延长会员、写入兑换记录并提交；失败时回滚全部变更。推荐兼容接口必须先校验指定孩子归属，再查询评估建议和年龄任务。

## 埋点与分析约定

小程序事件统一调用 `app.trackKbEvent()`。服务端通过 `event-protocol.js` 生成公共字段、映射旧事件、限制批量大小与元数据大小，并过滤敏感键。

新增事件时优先提供：

- 稳定且可重试的 `event_id` 和业务 `action_id`。
- `child_id`、`age_segment_code`、`ability_codes` 和 `plan_id`。
- `source_module`、`source_page`、内容类型与内容 ID。
- `membership_status` 与 `membership_entry_source`。
- `occurred_at` 和 `schema_version`。

`analytics-quality.js` 使用统一字典识别未知年龄、能力和内容形态。`build-admin-daily-stats.js` 以自然日事务重建统计；可通过以下命令指定日期，省略日期时默认统计昨天：

```bash
cd backend
npm run admin:stats -- 2026-08-21
```

修改事件协议或分析 SQL 后运行 `event-protocol.test.js`、`admin-daily-stats.test.js`、`admin-analytics-contract.test.js` 和根目录 `test-admin-core-action-analytics.js`。

## 运营后台约定

后台 API 使用 `/admin-api/v1`，静态入口使用 `/admin-console`。所有分析路由保持管理员认证。日期筛选使用 `YYYY-MM-DD`，分析天数范围为 1-90。

`admin-portal/app.js` 将主要面板和五个新增分析模块分开加载。新增模块需要提供加载态、数据态、空态、错误态和重试入口；单个模块失败应保留其他模块结果。当前五个模块是成长闭环、年龄能力、知识覆盖、会员转化和事件质量。

## 首页状态约定

首页主动作必须经 `miniprogram/utils/home-state.js` 计算。当前优先级是未观察、未完成训练、待反馈、报告可看、会员到期、就绪。每个合法状态只产生一个 `status` 和一个主 CTA。

远端状态与本地快照通过 `mergeRemoteState()` 合并。接口失败时保留当前孩子的本地每日计划、观察、反馈、报告和会员状态，并设置恢复标记。修改首页状态时运行 `test-home-state.js` 的优先级、组合属性和失败恢复用例，以及 `test-home-core-flow.js` 的核心动作流程验证。

## 修改检查表

1. 确认统一业务字段、孩子归属和会员边界。
2. 为写操作设计稳定幂等键，并在成功路径写成长时间线。
3. 为纯逻辑补单元或属性测试，为接口和跨端行为补契约或集成测试。
4. 验证空输入、非法字典值、跨孩子访问、重复请求、过期计划、无数据和远端失败。
5. 检查事件元数据中不含密钥、令牌、密码、Cookie、证书或私钥。
6. 运行定向测试、根验证、后端 Jest、静态检查和 `git diff --check`。
