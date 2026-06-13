# 小牛育儿生产事故全量审计与发布修复方案

**文档日期**: 2026-06-13  
**审计范围**: `miniprogram/`、`backend/src/`、生产后端 `backend/src/mysql-production/server.js`、小程序打包配置  
**目标**: 形成可执行、可验收、可长期稳定运行的生产修复方案，并将整个小程序恢复到可发布状态。

---

## 一、执行摘要

本次事故已经达到生产发布事故级别，影响范围覆盖小程序主包上传、登录态续期、内容板块展示、会员能力和多组页面数据加载。

当前生产状态可以分成两层：

1. **已接通能力**
   - 登录与刷新令牌
   - 会员信息、试用、兑换码
   - 邀请码与邀请统计
   - 微信支付相关接口
   - 营养推荐、食谱列表、食谱详情、食谱收藏

2. **未接通或未完成生产迁移能力**
   - 育儿知识 `parenting/articles*`
   - 孩子档案 `children*`
   - 阅读力/教材 `education/*`
   - 成长观察/逻辑思维 `assessments*`
   - AI 问答 `chat*`
   - 推荐系统 `recommendations*`

当前故障的核心矛盾是：**前端页面能力面大于生产后端实际能力面**。叠加令牌过期语义不一致、主包资源超限和发布门禁缺失，最终形成大面积不可用。

截至当前仓库状态，以下止血项已经落地到代码中：

- 生产环境已关闭 `AI问答`
- 生产环境已关闭 `成长观察`、`阅读力提升`、`育儿知识` 的首页开放入口
- 首页对未开放能力显示“暂未开放”状态
- 前端请求层已兼容 `401` 与 `TOKEN_EXPIRED/访问令牌无效或已过期` 的续期重试
- 生产后端无效 token 已统一返回 `401 + TOKEN_EXPIRED`

---

## 二、事故现象与证据

### 2.1 已确认的线上现象

- 自动真机调试报错 `80051, source size 5275KB exceed max limit 2MB`
- 会员页请求失败，返回 `访问令牌无效或已过期`
- 多个板块进入后无内容或直接报 `接口不存在`
- 育儿知识、阅读力、成长观察、逻辑思维、AI 问答等页面无法形成生产闭环

### 2.2 代码证据

#### 生产后端当前开放能力

生产后端路由注册见 [backend/src/mysql-production/server.js](/workspace/backend/src/mysql-production/server.js:59)：

- 已开放：`auth`、`membership`、`referral`、`payment`、`nutrition`
- 占位拦截：`assessments`、`chat`、`education`、`recommendations`
- 未注册：`parenting`、`children`、`knowledge`

#### 原完整主服务能力

旧主服务路由注册见 [backend/src/app.js](/workspace/backend/src/app.js:95)：

- `assessments`
- `chat`
- `education`
- `parenting`
- `knowledge`
- `kb/events`
- `recommendations`
- `membership`
- `payment`
- `referral`
- `children`
- `nutrition`

#### 前端仍然依赖完整能力面

- 育儿知识入口见 [miniprogram/pages/parenting/parenting.js](/workspace/miniprogram/pages/parenting/parenting.js:136)
- 阅读力入口见 [miniprogram/pages/textbook/textbook.js](/workspace/miniprogram/pages/textbook/textbook.js:221)
- 成长观察题目加载见 [miniprogram/pages/assessment/do/do.js](/workspace/miniprogram/pages/assessment/do/do.js:272)
- 孩子档案列表见 [miniprogram/pages/profile/children/children.js](/workspace/miniprogram/pages/profile/children/children.js:51)

#### 令牌续期语义不一致

- 后端无效或过期 token 返回 `403`，见 [backend/src/mysql-production/server.js](/workspace/backend/src/mysql-production/server.js:128)
- 前端只在 `401` 时自动刷新 token，见 [miniprogram/utils/request.js](/workspace/miniprogram/utils/request.js:151)

#### 生产环境仍暴露未完成能力

生产环境配置见 [miniprogram/config/env.js](/workspace/miniprogram/config/env.js:25)：

- `enableAiChat: true`
- `showMembership: true`
- `allowMockFallback: false`
- `apiStrictMode: true`

#### 主包超限证据

本轮审计前，`miniprogram/images/` 中存在 5 张接近 1MB 的大图，累计约 4.7MB，直接推动主包接近 `5275KB`。当前代码已将其移出主包并提交到远端，相关修复提交为 `952c8ec`。

---

## 三、事故根因分析

### 3.1 P0 根因：生产后端迁移不完整即切流

生产环境当前使用隔离服务 `niuniu-backend`，这套服务只迁移了会员、支付、邀请、营养等少量能力。前端仍按完整产品能力面发布，导致页面访问的接口集合与生产后端开放接口集合严重不匹配。

### 3.2 P0 根因：发布门禁缺失

本次发布前缺少以下硬门禁：

- 前端页面依赖接口清单与生产开放接口清单比对
- 主包体积上限检查
- 真机全链路回归
- 生产功能开关与后端能力面一致性检查

### 3.3 P1 根因：认证契约不一致

前后端对“令牌过期”的状态码处理不一致，造成登录态在过期后无法平滑恢复，放大了会员页和档案页的故障感知。

### 3.4 P1 根因：生产配置暴露超出后端能力面的功能

生产配置仍然开启了 AI 问答等功能入口，给用户呈现了“页面可进、内容为空、接口 404”的事故体验。

### 3.5 P1 根因：历史文档与当前生产实际状态脱节

当前仓库中的部分历史审计文档，例如 [API_CONTRACT_CHECKLIST.md](/workspace/.monkeycode/API_CONTRACT_CHECKLIST.md:186)，记录了阶段性“已补齐”的结论；当前真实生产服务 `mysql-production/server.js` 并不具备对应覆盖面。这说明文档结论、代码分支与生产发布路径之间缺少同步机制。

---

## 四、按模块的生产可用性审计

| 模块 | 前端入口 | 依赖接口 | 当前生产状态 | 结论 |
|------|----------|----------|--------------|------|
| 登录/启动 | `app.js` | `auth/*` | 已开放 | 可用 |
| 会员中心 | `pages/membership` | `membership/*`, `referral/*`, `payment/*` | 已开放，token 续期有缺陷 | 部分可用 |
| 营养食谱 | `pages/nutrition` | `nutrition/*` | 已开放，本轮已瘦身 | 可用 |
| 育儿知识 | `pages/parenting` | `parenting/articles*` | 未注册 | 不可用 |
| 孩子档案 | `pages/profile/children` | `children*` | 未注册 | 不可用 |
| 阅读力/教材 | `pages/textbook` | `education/*`, `children*` | `education` 占位、`children` 未注册 | 不可用 |
| 成长观察 | `pages/assessment` | `assessments*` | 占位 404 | 不可用 |
| 逻辑思维 | `pages/textbook` / `pages/assessment` | `education/*`, `assessments*` | 未接通 | 不可用 |
| AI 问答 | `pages/chat` | `chat*` | 占位 404 | 不可用 |
| 知识埋点 | 多页面 | `kb/events/*` | 旧主服务有，隔离生产服务缺失 | 风险存在 |

---

## 五、修复目标定义

发布状态的定义如下：

1. 小程序可正常上传、自动真机调试、体验版预览。
2. 首页所有可见入口都能进入可用页面。
3. 任何生产可见页面都能进入“真实内容”或“明确暂未开放提示”两种之一。
4. 任何生产可见页面都不再出现 `接口不存在`。
5. 登录态过期后可自动刷新或平滑引导重登。
6. 支付、会员、邀请、营养链路持续可用。
7. 育儿知识、阅读力、成长观察、孩子档案在生产完成真实接口闭环。
8. 发布前具备统一的接口覆盖率、包体积、真机回归门禁。

---

## 六、专业修复方案

### 阶段A：立即止血

**目标**: 在最短时间内消除真机上传阻塞和生产级错误暴露。

#### A1. 锁定主包体积

- 保持提交 `952c8ec` 中的主包减重方案。
- 禁止任何单张资源超过 `300KB` 进入主包。
- 为首页、营养、育儿、成长评估保留占位图样式方案。

#### A2. 收紧生产功能入口

- `enableAiChat` 调整为 `false`，直到 `chat/*` 完成生产闭环。
- 对未接通板块增加统一“建设中/暂未开放”展示层，避免直接进入 404。
- 首页入口按后端能力面动态展示。

#### A3. 修正 token 过期语义

二选一，推荐同时做：

- 后端无效/过期 token 统一返回 `401`
- 前端将 `403 + 访问令牌无效或已过期` 也纳入刷新 token 逻辑

#### A4. 建立事故冻结窗口

- 停止继续向生产注入新功能改动
- 只允许执行“接口恢复、认证修复、包体积治理、发布门禁建设”相关变更

### 阶段B：恢复生产基础数据闭环

**目标**: 先恢复所有其他模块的底座依赖。

#### B1. 恢复 `children*`

原因：`children` 是阅读力、成长观察、营养分龄、档案管理的共同依赖。

应实现：

- `GET /api/v1/children`
- `POST /api/v1/children`
- `GET /api/v1/children/:id`
- `PUT /api/v1/children/:id`
- `DELETE /api/v1/children/:id`
- `PUT /api/v1/children/:id/set-default`

#### B2. 恢复 `parenting/articles*`

应实现：

- `GET /api/v1/parenting/articles`
- `GET /api/v1/parenting/articles/:id`
- `GET /api/v1/parenting/articles/:id/related`
- `POST /api/v1/parenting/articles/:id/favorite`
- `GET /api/v1/parenting/hot-keywords`
- `GET /api/v1/parenting/search`

#### B3. 恢复 `education/*`

应实现：

- `GET /api/v1/education/tasks/today`
- `POST /api/v1/education/tasks/:id/complete`
- `GET /api/v1/education/progress/overview`
- `GET /api/v1/education/knowledge/chapters`
- `GET /api/v1/education/knowledge/detail`
- `POST /api/v1/education/progress`

### 阶段C：恢复生产核心能力闭环

**目标**: 完成用户可感知核心板块的生产能力。

#### C1. 恢复 `assessments*`

- `GET /api/v1/assessments`
- `GET /api/v1/assessments/:code/questions`
- `POST /api/v1/assessments/:code/submit`
- `GET /api/v1/assessments/results/:id`
- `GET /api/v1/assessments/history`
- `GET /api/v1/assessments/history/count`
- `DELETE /api/v1/assessments/records/:id`

#### C2. 恢复 `chat*`

建议采用两段式：

- 第一段：生产明确展示“服务准备中”，后端返回结构化占位消息
- 第二段：接入真实 AI 服务或合规审查版本

### 阶段D：统一生产路由体系

**目标**: 结束“双后端能力面不一致”状态。

推荐两种路径，择一执行：

#### 方案一：将 `mysql-production/server.js` 补齐到与 `backend/src/app.js` 同等能力面

适合条件：继续保留隔离部署架构。

要求：

- 将旧主服务的路由能力逐个迁移到生产 MySQL 服务
- 建立同名 route/service 目录，而不是长期在单文件 `server.js` 中追加逻辑

#### 方案二：统一回归主服务架构，并将小牛能力纳入模块化路由

适合条件：希望降低双服务维护成本。

要求：

- 将生产隔离需求改为数据库、业务命名空间和 Nginx 路径隔离
- 保留单套后端路由体系

**长期稳定性建议**：优先采用“模块化迁移到单一代码结构、保留运行隔离”的方案。代码结构统一，运行实例隔离，长期维护成本最低。

### 阶段E：建立长期发布门禁

#### E1. 接口覆盖率门禁

新增自动检查脚本，输出：

- 前端所有 `app.request` 路径
- 生产后端已注册路由
- 差集清单

发布前要求差集为 `0` 或全部有明确的“隐藏入口/暂未开放”策略。

#### E2. 小程序包体积门禁

发布前自动计算：

- 主包总大小
- 单图资源大小排行
- 单文件大小排行

门禁建议：

- 主包 `< 1.5MB`
- 任一图片 `< 300KB`
- 任一静态资源 `< 500KB`

#### E3. 真机回归门禁

发布前固定跑以下链路：

1. 启动与登录
2. 会员信息与邀请
3. 支付发单
4. 营养首页、列表、详情、收藏
5. 育儿知识列表、详情、搜索、收藏
6. 孩子档案新增、编辑、默认切换
7. 阅读力首页、任务详情、完成状态
8. 成长观察开始答题、提交结果、历史记录
9. AI问答入口与降级策略

#### E4. 配置一致性门禁

发布前校验：

- `env.js` 的生产开关
- 后端实际开放接口
- 首页入口显示逻辑

### 阶段F：文档与运维治理

#### F1. 更新所有历史审计文档

对以下文档做“当前有效 / 历史阶段性结论”标记：

- `.monkeycode/API_CONTRACT_CHECKLIST.md`
- `.monkeycode/REPAIR_PLAN.md`
- 各阶段修复报告

#### F2. 建立生产发布说明

应固定记录：

- 当前生产入口域名
- 当前生产后端实例
- 当前开放能力面
- 当前关闭能力面
- 最近一次发布 commit

---

## 七、推荐实施顺序

### 第1批：24小时内完成

1. 生产开关收口
2. token 续期修复
3. 主包体积治理确认
4. 首页未开放入口策略统一

### 第2批：48小时内完成

1. `children*`
2. `parenting/articles*`
3. 统一错误码和错误消息结构

### 第3批：72小时内完成

1. `education/*`
2. `assessments*`
3. 首页与各板块联调

### 第4批：提审前完成

1. `chat*` 合规策略定版
2. 真机全链路回归
3. 关闭临时诊断开关
4. 形成发布版检查清单和回滚方案

---

## 八、验收标准

### 8.1 功能验收

- 所有首页入口均可进入有效页面
- 所有生产可见页面均无 `接口不存在`
- 会员页、档案页在 token 过期后可自动恢复或明确引导重登
- 阅读力、育儿知识、成长观察均能加载真实数据

### 8.2 稳定性验收

- 小程序上传通过
- 自动真机调试通过
- 正式版构建通过
- 生产接口错误率显著下降

### 8.3 发布验收

- 前端依赖接口与生产开放接口完全对齐
- 主包体积达标
- 回归清单全部通过
- 生产配置、路由和入口策略一致

---

## 九、长期稳定化建议

1. 将 `mysql-production/server.js` 拆分为 `routes/`、`services/`、`middleware/` 结构，避免继续在单文件中扩展生产逻辑。
2. 建立“功能发布矩阵”，每个页面标记依赖接口、认证要求、会员要求、生产是否开放。
3. 建立发布冻结与灰度机制，禁止在生产迁移期间同时叠加大规模前端资源和业务变更。
4. 统一错误码语义：`401` 处理认证，`403` 处理权限，`404` 处理真实缺失路由。
5. 每次提审前生成一次自动审计报告，覆盖接口、包体积、配置、真机回归结果。

---

## 十、最终结论

当前代码基础经过系统修复后，完全可以恢复到可发布状态。达成条件是：

- 先补齐生产后端核心缺口
- 再统一认证和配置语义
- 最后用接口覆盖率、主包体积和真机回归三道门禁锁住发布质量

按本方案执行完成后，小程序可以进入长期稳定、可持续发布的状态。
