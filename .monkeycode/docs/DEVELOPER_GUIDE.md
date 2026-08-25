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

根测试脚本会按顺序覆盖鼓励与档案上下文、聊天和每日计划、认证刷新、发展专区、会员分享、核心动作场景与存储、孩子隔离、首页主流程、运营分析、知识内容、观察训练闭环、小程序核心结构、虚拟支付合规、内容专业性、布局、排版和文案审计。任一脚本失败会终止后续脚本。

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
