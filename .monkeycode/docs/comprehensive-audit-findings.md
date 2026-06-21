# 小牛育儿全面审计 — 全量问题清单

**审计日期**: 2026-06-15
**审计范围**: `miniprogram/`（11 前端模块） + `backend/`（主后端接口） + `.monkeycode/`
**审计文档**: 本清单依据 `comprehensive-audit-execution-standard.md` 执行

## 修复状态更新（2026-06-15）

- 已完成修复: `P0-01` `P0-02` `P0-03` `P0-04` `P0-05` `P0-06` `P1-01` `P1-02` `P1-03` `P1-04` `P1-05` `P1-06` `P1-08` `P1-09` `P1-10` `P2-07` `P2-09` `P2-10` `P2-12` `P3-01` `P3-04` `P3-05` `P3-07`
- 已完成: `P1-05` 首页 mock 回退链路已补周总结失败态、登录态提示，以及 `weeklyProgress`、`dailyPlan`、会员触点、分享卡片的演示态文案，并阻止演示卡片写入完成状态、阻止演示分享草稿反向污染首页状态
- 基本完成: `P2-08` 已为 `parenting`、`article-list`、`article-detail`、`nutrition`、`recipe-list`、`recipe-detail`、`knowledge-list`、`knowledge-detail`、`textbook`、`profile/children` 补充刷新互斥或等待机制，剩余仅保留少量非主链路页面观察
- 已完成: `P3-01` 根目录新增聚合 `lint` 入口，执行 `npm run lint` 将串行校验 `backend` 与 `miniprogram` 语法
- 已完成: `P3-07` 首页、会员页、成长观察结果页、孩子档案编辑页的延迟回调已改为可清理定时器，并在页面卸载时统一清理
- 已完成: `P1-06` 能力成长旧任务码 `r0_1`、`r0_2` 已统一映射到 canonical 任务码，覆盖后端详情/进度接口和前端本地完成态
- 已完成: `P1-08` 营养食谱列表已统一使用 `age_group` 参数，后端兼容旧 `age` 与拼音别名，本地 fallback 也按同一年龄段规则过滤
- 已完成: `P2-07` mock 详情数据已补齐结构化字段，覆盖能力成长 `reading_sections/practice_material` 和营养食谱图片、微量营养素、营养组合、每日营养占比等核心展示结构
- 已完成: `P2-03` 营养食谱详情的 `images` 字段已由后端统一归一化输出，前端本地 fallback 也同步补齐
- 已完成: `P2-04` 育儿文章详情已补充 `sub_category` 与 `evidence_level` 标签展示，字段已完成前端消费
- 已完成: `P2-05` 周总结页已补充 `ageGroup`、`weakestDimensionLabel` 和 `dimensionScores` 展示，高级分析字段已完成主展示收口
- 部分收敛: `P3-06` 已确认当前批量结构缺口主要集中在食谱图片缺失，服务端已补统一图片兜底与 `images` 数组归一化；其余逐条内容质量仍保留人工审核
- 已完成: `P3-08` 后端旧任务码解析已统一收口到 canonical helper，详情、完成、进度三条链路不再各自维护旧码回退分支
- 已纠偏: `P3-09` 原审计项指向错误，当前“里程碑”功能位于 `pages/parenting/milestone/*` 且为纯前端本地实现，不依赖 `pages/assessment/*` 或后端接口
- 已纠偏: `P2-11` 首页不存在 `onReachBottom` 或触底加载绑定，首轮审计误报已更正
- 文档说明: 下文原始问题条目保留审计证据，是否已修以上方状态更新为准

## 增量审计更新（2026-06-21）

- 新增高风险发现: 生产支付回调验签在 `WECHAT_PAY_PLATFORM_CERT_PATH` 为空时会直接放行，真实生产环境当前缺少该配置，回调验签实际未启用。
- 新增高风险发现: 默认启动脚本 `backend/package.json -> start` 与线上真实入口 `backend/src/mysql-production/server.js` 长期分叉，现已实际导致过手机号绑定接口漏部署。
- 新增中风险发现: `miniprogram/config/env.js` 的 development 与 production 都直连 `https://api.woyai.cn/api/v1`，开发联调会直接写生产数据。
- 已完成修复: 生产后端 `backend/src/mysql-production/server.js` 已改为在生产环境缺少 `WECHAT_PAY_PLATFORM_CERT_PATH` 时拒绝跳过微信支付回调验签。
- 已完成修复: `backend/package.json` 默认 `start` 已切换到 `src/mysql-production/server.js`，与线上真实运行入口对齐。
- 已完成修复: development 环境默认 API 地址已清空，并要求通过 storage 显式设置 `apiBaseUrl` / `baseUrl` 后才允许请求后端，避免开发联调直接写生产数据。

---

## P0 级问题

---

### P0-01: 育儿文章详情 — toggleLike 无防重守卫

- 模块: 育儿文章
- 页面/接口: `pages/parenting/article-detail/article-detail`
- 文件位置: `miniprogram/pages/parenting/article-detail/article-detail.js`（toggleLike 方法）
- 问题类型: 稳定性
- 严重级别: P0
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 进入育儿文章详情页
2. 在接口响应返回之前连续快速点击收藏按钮 3 次
3. 等待接口返回

#### 实际结果

连续点击触发 3 次请求，后端可能返回重复状态或数据错乱；前端状态因异步回写不可控，出现闪烁或收藏/取消交替。

#### 期望结果

首次单击后进入 loading 态，等待请求返回前屏蔽后续点击；请求结束后再允许下一次操作。

#### 根因判断

`toggleLike` 方法中缺少 `isLiking` 防重标志位和对应的 `wx.showLoading` 锁定。

#### 影响范围

- 育儿文章详情页收藏链路
- 同类问题的营养食谱详情页 `toggleLike` 需一并排查

---

### P0-02: 育儿文章列表 — 分页 page>1 静默失败

- 模块: 育儿文章
- 页面/接口: `pages/parenting/article-list/article-list`
- 文件位置: `miniprogram/pages/parenting/article-list/article-list.js`（loadMore 方法）
- 问题类型: 功能
- 严重级别: P0
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 进入育儿文章列表
2. 滑动到底部触发加载更多
3. 模拟后端分页接口返回空列表或失败

#### 实际结果

列表底部展示"加载中"后静默消失，用户看到部分文章但无任何提示说明后面没有更多或加载失败。

#### 期望结果

应明确展示"已加载全部文章"或"加载失败，点击重试"，不能静默吞掉空结果。

#### 根因判断

`loadMore` 中缺少对空结果和错误态的显式处理，分页结束标记未写入 UI。

#### 影响范围

- 育儿文章列表页
- 营养食谱列表页（同问题，见 P0-03）
- 所有使用分页的列表模块

---

### P0-03: 营养食谱列表 — 分页静默失败 + loadHotRecipes 无防重

- 模块: 营养食谱
- 页面/接口: `pages/nutrition/recipe-list/recipe-list`
- 文件位置: `miniprogram/pages/nutrition/recipe-list/recipe-list.js`（loadMore、loadHotRecipes 方法）
- 问题类型: 功能 / 稳定性
- 严重级别: P0
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 进入营养食谱列表
2. 滑动到底部触发加载更多，模拟空返回
3. 在 loadHotRecipes 请求未完成时再次下拉刷新

#### 实际结果

分页静默结束、无提示；loadHotRecipes 重复请求叠加，出现重复数据或状态冲突。

#### 期望结果

分页结束应明确提示，loadHotRecipes 应有 loading 防重。

#### 根因判断

与 P0-02 同类的分页结束标记缺失；loadHotRecipes 缺少 `isLoadingHot` 守卫。

#### 影响范围

- 营养食谱列表页
- 首页热门食谱卡片（可能受同一请求影响）

---

### P0-04: 文章详情/食谱详情 — 无 id 参数直接进入无限加载

- 模块: 育儿文章 / 营养食谱
- 页面/接口: `pages/parenting/article-detail/article-detail` / `pages/nutrition/recipe-detail/recipe-detail`
- 文件位置: 对应的 `onLoad` 方法
- 问题类型: 功能
- 严重级别: P0
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 构造不含 id 参数的页面跳转路径
2. 直接进入文章详情或食谱详情

#### 实际结果

页面进入后显示 loading 骨架屏，因缺少 id 永远无法发起有效请求，持续显示加载中。

#### 期望结果

应在 onLoad 中校验 id 是否存在，不存在则直接展示错误提示或返回上一页，不应进入永久 loading。

#### 根因判断

onLoad 中缺少对路由参数 `options.id` 的空值守卫。

#### 影响范围

- 文章详情页
- 食谱详情页
- 任何通过分享卡片、扫码等无参方式进入详情的场景

---

### P0-05: 周总结/成长记录 — 未在 app.json 注册

- 模块: 成长记录 / 周总结
- 页面/接口: `pages/growth-record/` / `pages/weekly-summary/`
- 文件位置: `miniprogram/app.json`（pages 数组）
- 问题类型: 深度 / 配置
- 严重级别: P0
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 检查 `miniprogram/app.json` 的 pages 配置
2. 搜索 `weekly-summary` 和 `growth-record` 条目

#### 实际结果

`weekly-summary` 和 `growth-record` 两个页面的页面文件存在于目录中，但未在 `app.json` 的 `pages` 数组中注册，导致小程序编译后无法通过 `wx.navigateTo` 访问。

#### 期望结果

所有存在的页面都应在 app.json 中注册。

#### 根因判断

页面文件被创建后未同步更新 app.json 的 pages 配置。

#### 影响范围

- 周总结功能完全不可用
- 成长记录功能完全不可用

---

### P0-06: 首页 — Promise.allSettled 在微信小程序中不可用

- 模块: 首页
- 页面/接口: `pages/index/index`
- 文件位置: `miniprogram/pages/index/index.js`（数据加载方法）
- 问题类型: 环境 / 稳定性
- 严重级别: P0
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 在微信开发者工具或真机中打开首页
2. 检查首页数据加载逻辑是否调用了 `Promise.allSettled`

#### 实际结果

`Promise.allSettled` 在微信小程序运行时中不可用（小程序的 JavaScript 引擎不支持该 ES2020 方法），导致首页数据并发加载失败，首页卡片区域白屏或一直 loading。

#### 期望结果

使用兼容的 Promise 实现（如手动包装的 `Promise.all` + `.catch` 模式或 polyfill）替代 `Promise.allSettled`。

#### 根因判断

开发时未考虑微信小程序 JavaScript 引擎的 ES 版本限制。

#### 影响范围

- 首页所有并发数据加载（计划卡、热门食谱、育儿文章等）
- `miniprogram/utils/request.js` 中如有同类用法，需全局排查

---

## P1 级问题

---

### P1-01: 育儿文章搜索 — 忽略 age_group 和 category 参数

- 模块: 育儿文章
- 页面/接口: `pages/parenting/search/search`
- 文件位置: `miniprogram/pages/parenting/search/search.js`（搜索方法）
- 问题类型: 逻辑
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 进入育儿文章搜索页，选择年龄段为"0-1 岁"、场景分类为"健康护理"
2. 输入关键词并搜索
3. 检查请求参数

#### 实际结果

前端页面虽允许选择年龄和分类，但搜索请求中未将 `age_group` 和 `category` 参数传递给后端，导致搜索结果未按选择的筛选项过滤。

#### 期望结果

搜索结果应受用户的年龄和分类筛选项约束。

#### 根因判断

搜索方法构建请求参数时遗漏了 `age_group` 和 `category` 字段。

#### 影响范围

- 场景搜索功能全部搜索结果不受筛选控制
- 用户以为在精准搜索但实际是全局搜索

---

### P1-02: 后端 — parentingArticlesHandler 参数缺少校验

- 模块: 后端接口
- 页面/接口: `GET /api/v1/parenting/articles`
- 文件位置: `backend/src/mysql-production/server.js`（parentingArticlesHandler）
- 问题类型: 代码 / 逻辑
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 向后端发送 `GET /api/v1/parenting/articles?age_group=999&page=abc`
2. 检查返回结果

#### 实际结果

后端未校验 `age_group` 取值是否合法（如超出 0-6 范围）、`page` 是否为合法正整数；传入非法值可能导致 SQL 查询异常或返回错误数据。

#### 期望结果

后端应对所有查询参数做类型、范围和合法性校验，非法参数返回 400 Bad Request。

#### 根因判断

handler 中参数解析后直接传入 SQL 查询，缺少中间校验层。

#### 影响范围

- 所有育儿文章相关的列表和搜索接口
- 其他 handler 中可能存在同类问题（需排查）

---

### P1-03: 后端 — educationKnowledgeDetailHandler 的 subjectCode 哨兵值

- 模块: 后端接口
- 页面/接口: `GET /api/v1/textbook/knowledge-detail`
- 文件位置: `backend/src/mysql-production/server.js`（educationKnowledgeDetailHandler）
- 问题类型: 代码
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 向后端请求知识点详情，传入不存在的 `subjectCode`
2. 检查返回结果

#### 实际结果

当 `subjectCode` 不存在时，后端使用哨兵值（如默认值或空值）继续查询，可能返回错误的知识点数据或空对象（状态码 200 但内容不正确）。

#### 期望结果

不存在的 subjectCode 应返回 404 Not Found 或空结果，不应使用哨兵值返回其他数据。

#### 根因判断

handler 中对查询结果为空的处理使用了默认值兜底逻辑，混淆了"不存在"和"缺省"的语义。

#### 影响范围

- 知识点详情页可能展示错误内容
- 用户通过旧编码或错误链接进入时可能看到不匹配的内容

---

### P1-04: 首页 — CURRENT_ENV 硬编码 production

- 模块: 首页 / 全局配置
- 页面/接口: `miniprogram/config/env.js`
- 文件位置: `miniprogram/config/env.js`（CURRENT_ENV 常量）
- 问题类型: 环境
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 检查 `miniprogram/config/env.js` 中的 `CURRENT_ENV` 定义
2. 尝试在本地开发环境中运行

#### 实际结果

`CURRENT_ENV` 被硬编码为 `'production'`，所有运行环境（本地、开发者工具、真机预览）都指向生产 API。本地开发时无法安全地指向本地/测试后端。

#### 期望结果

环境变量应支持多环境切换，至少区分 production 和 development。

#### 根因判断

配置文件未实现环境检测和切换逻辑。

#### 影响范围

- 所有通过 `env.js` 获取 API 地址的模块
- 本地开发和测试时可能与生产数据混淆

---

### P1-05: 全局 — 首页 mock 回退：游客路径返回假数据而非真实失败

- 模块: 首页
- 页面/接口: `pages/index/index`
- 文件位置: `miniprogram/pages/index/index.js`（数据加载回退逻辑）
- 问题类型: 代码 / 逻辑
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 以游客态进入首页
2. 模拟后端接口返回错误或超时
3. 检查首页卡片区域展示的内容

#### 实际结果

接口失败后回退到 mock 假数据，页面展示看起来"正常"的卡片内容，但数据来自本地硬编码而非真实后端。用户无法区分该内容是真实数据还是假数据。

#### 期望结果

接口失败后应展示真实的错误态或空态，不应以 mock 数据伪装成功。

#### 根因判断

数据加载的回退分支中保留了用于演示模式的 mock 数据，线上模式误用了该分支。

#### 影响范围

- 首页计划卡、热门食谱、育儿文章等区域
- 用户可能在无感知情况下看到不真实的内容

---

### P1-06: 能力成长 — 旧任务码 r0_1/r0_2 无别名映射

- 模块: 能力成长
- 页面/接口: `pages/textbook/`
- 文件位置: `miniprogram/pages/textbook/textbook.js` / `backend/src/mysql-production/server.js`
- 问题类型: 深度 / 旧码兼容
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 检查数据库中是否存在旧编码 `r0_1`、`r0_2` 的任务数据
2. 使用旧编码访问对应知识点

#### 实际结果

前端/后端仅识别新编码格式，旧编码 `r0_1`/`r0_2` 等无法匹配任何知识点，页面展示空或错误。虽然新创建的数据都使用新编码，但历史数据中的旧编码记录无法被正确消费。

#### 期望结果

应建立旧编码到新编码的映射表，或后端在接受旧编码时自动转换。

#### 根因判断

新旧编码体系切换时未做向后兼容处理。

#### 影响范围

- 历史任务数据
- 使用旧编码的跳转链接和分享卡片

---

### P1-07: 能力成长 — 阅读任务库按年龄段调节表达层，但任务模板骨架仍全量共用

- 模块: 能力成长
- 页面/接口: `backend/src/mysql-production/content-seeds.js`
- 文件位置: `backend/src/mysql-production/content-seeds.js`
- 问题类型: 深度 / 内容同质化
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 否，建议进入内容专项

#### 复现步骤

1. 使用不同年龄段的孩子档案分别进入能力成长
2. 对比两个年龄段看到的知识点内容

#### 实际结果

`content-seeds.js` 当前会为 `3-4岁`、`4-5岁`、`5-6岁`、`6-9岁`、`9-12岁` 五个年龄段各生成 `90` 条任务，共 `450` 条。年龄段之间并非整条内容完全相同：`content`、`difficulty`、`duration` 会随 `AGE_PROFILES` 变化；但 `title`、`material`、`objective`、`steps`、`parent_prompt`、`tips`、`example_answer` 在同一模板的五个年龄段里全部共用。

量化结果说明当前问题更准确地属于“任务模板骨架和素材字段高度复用”，而非“整条任务内容完全一致”。

#### 期望结果

不同年龄段的任务除了说明文案、时长和难度外，还应在素材选择、任务目标、步骤设计和家长提示上体现更明显的年龄梯度。

#### 根因判断

`content-seeds.js` 采用“全局模板库 + 年龄画像注入”的生成方式：

- `SUBJECT_TASK_LIBRARY` / `SUBJECT_TASK_EXPANSIONS` 维护统一任务模板库
- `buildReadingTasks()` 遍历 `AGE_PROFILES` 仅注入 `age_range`、`difficulty`、`duration`
- `buildTaskContent()` 主要把年龄差异写进引导文案，任务素材、目标和步骤骨架保持不变

这会让年龄差异停留在表达层，内容层和训练动作层的分层仍然偏弱。

#### 影响范围

- 能力成长模块全部 `90` 个任务模板在五个年龄段上的内容编排质量
- 产品核心内容分层感知
- 后续内容运营和教研迭代成本

---

### P1-08: 营养食谱 — 年龄段筛选仅支持拼音名匹配

- 模块: 营养食谱
- 页面/接口: `pages/nutrition/recipe-list/recipe-list`
- 文件位置: `miniprogram/pages/nutrition/recipe-list/recipe-list.js` / `backend/src/mysql-production/server.js`
- 问题类型: 逻辑
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 进入营养食谱列表
2. 选择不同的年龄段筛选条件
3. 检查请求参数和后端处理逻辑

#### 实际结果

年龄段筛选条件在前端使用中文标签（如"0-1 岁"），但在后端匹配时仅支持拼音名（如 `ling-yi-sui`），导致部分筛选条件在后端无法正确匹配，返回结果与筛选项不一致。

#### 期望结果

前后端应使用统一的年龄段标识体系（如 age_group 数字枚举），不依赖中文或拼音做筛选键。

#### 根因判断

年龄段筛选的标识体系在前后端之间未统一，前端用中文标签、后端用拼音别名。

#### 影响范围

- 营养食谱年龄段筛选功能

---

### P1-09: 首页 — submitComment 无防重守卫

- 模块: 评论功能
- 页面/接口: 育儿文章详情 / 营养食谱详情
- 文件位置: `miniprogram/pages/parenting/article-detail/article-detail.js`（submitComment 方法）
- 问题类型: 稳定性
- 严重级别: P1
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 进入文章详情，输入评论内容
2. 快速连续点击"发送"按钮 2-3 次

#### 实际结果

后端可能接收并存储多条重复评论；前端无 loading 锁定，按钮多次点击均可触发请求。

#### 期望结果

点击发送后立即锁定按钮，等待请求完成后才允许下一次提交。

#### 根因判断

`submitComment` 方法缺少 `isSubmitting` 防重标志位。

#### 影响范围

- 育儿文章评论
- 营养食谱评论

---

### P1-10: 全局 — token 过期重入可能触发递归循环

- 模块: 全局
- 页面/接口: `miniprogram/utils/request.js`
- 文件位置: `miniprogram/utils/request.js`（token 刷新逻辑）
- 问题类型: 稳定性
- 严重级别: P1
- 是否稳定复现: 否（需 token 恰好过期时触发）
- 是否建议立即修复: 是

#### 复现步骤

1. 模拟 token 过期场景
2. 发起业务请求，触发 token 刷新逻辑
3. 在 token 刷新过程中再次发起业务请求

#### 实际结果

token 刷新逻辑中没有对并发请求和重复刷新的控制，多次请求同时触发刷新可能形成递归调用链，导致请求堆积和栈溢出风险。

#### 期望结果

token 刷新应有全局锁，同时只允许一个刷新请求，其他请求在队列中等待刷新完成后重试。

#### 根因判断

request 拦截器中的 token 过期处理缺少全局刷新锁和请求队列机制。

#### 影响范围

- 所有需要登录态的接口调用
- token 过期时刻的首页、列表等有多个并发请求的场景

---

## P2 级问题

---

### P2-01: 育儿文章 — authorAvatar 后端未发送但前端渲染占位

- 模块: 育儿文章
- 页面/接口: 文章详情 / 文章列表卡片
- 文件位置: `miniprogram/pages/parenting/article-detail/article-detail.wxml` / `backend/src/mysql-production/server.js`
- 问题类型: 逻辑 / 字段映射
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否，属于展示策略优化

#### 复现步骤

1. 查看文章详情或列表中的作者头像位置
2. 检查后端接口返回的字段列表

#### 实际结果

当前详情页作者区使用 `article.authorAvatar || '/images/tab-profile.png'` 兜底，后端 `normalizeArticle(...)` 确实未发送 `authorAvatar`。页面会稳定展示默认头像，布局完整，属于“作者头像字段未利用”而不是“渲染断裂”。

#### 期望结果

前端应移除该占位，或后端补充发送 `authorAvatar` 字段。

#### 根因判断

当前是默认头像策略已生效，但未建立真实作者头像数据链路。

---

### P2-02: 育儿文章 — images 字段始终为空数组

- 模块: 育儿文章
- 页面/接口: 文章详情
- 文件位置: `miniprogram/pages/parenting/article-detail/article-detail.js` / `backend/src/mysql-production/server.js`
- 问题类型: 逻辑 / 字段映射
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否，当前页面未形成用户可见断裂

#### 复现步骤

1. 查看文章详情接口返回的 `images` 字段
2. 在前端页面检查图片展示区域

#### 实际结果

后端 `normalizeArticle(...)` 当前仍将文章 `images` 固定输出为空数组 `[]`。但现有文章详情页模板没有独立图片轮播区域，`images` 仅在 `onImagePreview` 中作为可选多图预览源；当前页面主路径没有因为该字段为空而出现空白图片区或渲染失败。

#### 期望结果

若后续计划引入文章插图或多图预览，可补齐该字段；当前阶段维持为空不会阻塞主链路。

---

### P2-03: 营养食谱 — recipe.images 前端读取但后端未发送

- 模块: 营养食谱
- 页面/接口: 食谱详情
- 文件位置: `miniprogram/pages/nutrition/recipe-detail/recipe-detail.js` / `backend/src/mysql-production/server.js`
- 问题类型: 逻辑 / 字段映射
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否，已完成

#### 复现步骤

1. 查看食谱详情接口返回数据
2. 检查前端对 `recipe.images` 的使用

#### 实际结果

该问题已被后续修复覆盖：后端 `normalizeNutritionRecipeImages(...)` 已统一输出 `images` 数组，前端 `recipe-detail` 也会在本地 fallback 中补齐 `images`，当前结论不再成立。

---

### P2-04: 育儿文章 — evidence_level / sub_category 后端已发但前端未消费

- 模块: 育儿文章
- 页面/接口: 文章详情
- 文件位置: `miniprogram/pages/parenting/article-detail/article-detail.wxml` / `backend/src/mysql-production/server.js`
- 问题类型: 逻辑 / 字段映射
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否，已完成

#### 复现步骤

1. 检查后端文章详情接口返回的字段列表（包含 `evidence_level`、`sub_category`）
2. 检查前端详情页是否展示了这些字段

#### 实际结果

该问题已被后续修复覆盖：文章详情页顶部标签区已消费 `sub_category` 与 `evidence_level`，用于补充内容分层和证据提示，原“前端未消费”结论已不再成立。

#### 期望结果

详情页应持续保持这些标签作为轻量级专业信息层，不改变正文内容链路。

---

### P2-05: 周总结 — 后端已发高级字段但前端未渲染

- 模块: 周总结
- 页面/接口: 周总结页
- 文件位置: `miniprogram/pages/weekly-summary/` / `backend/src/mysql-production/server.js`
- 问题类型: 逻辑 / 字段映射
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否，已完成

#### 复现步骤

1. 检查周总结接口返回的字段
2. 对比前端页面实际渲染的内容

#### 实际结果

该问题已被后续修复覆盖：周总结页已在主卡片和维度区块中消费 `ageGroup`、`weakestDimensionLabel` 和 `dimensionScores`，当前剩余未直出字段主要是服务端的 preview/full 分层原始字段，主展示链路已完整。

当前结论应更新为“周总结高级分析字段已完成主展示收口，剩余为服务端分层原始字段保留”。

---

### P2-06: 育儿文章 — 内容按年龄段模板填充，差异化有限

- 模块: 育儿文章
- 页面/接口: `backend/src/mysql-production/parenting-articles.js`
- 文件位置: `backend/src/mysql-production/parenting-articles.js`
- 问题类型: 深度 / 内容同质化
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否（内容策略层面，需产品决策）

#### 复现步骤

1. 检查育儿文章种子数据的组织结构
2. 对比不同年龄段看到的文章内容

#### 实际结果

`parenting-articles.js` 当前由 `CATEGORY_LIBRARY` 中的 `50` 个主题模板与 `AGE_VARIANTS` 中的 `5` 个年龄段批量生成 `250` 篇文章。量化检查显示：

- 同一主题跨年龄共用 `category`、`sub_category`、`author`、`evidence_level`、`sort_order`
- `title`、`summary`、`tags`、`content` 会变化，但变化来源主要是年龄标签和 `development` / `actionHint` / `summarySuffix` 三类年龄变体注入
- 主题本身的 `scene`、`goal`、`why`、`example`、`observe`、`pitfalls`、`tip`、`referral`、`evidenceFocus` 在五个年龄段里保持不变

当前实现已经提供年龄化表达层，但文章主题、案例场景、观察重点和误区主体仍以统一模板复用为主，深度差异主要停留在表达方式和执行提示层。

---

### P2-07: 本地 mock 缺少结构化字段

- 模块: 全局
- 页面/接口: 本地 mock 数据
- 文件位置: `miniprogram/` 中各处 mock 回退数据
- 问题类型: 深度
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 否（mock 回退已计划整体移除）

#### 复现步骤

1. 断网后进入各页面
2. 对比 mock 数据与真实接口返回的数据结构

#### 实际结果

本地 mock 数据缺少真实接口返回的结构化字段（如 `reading_sections`、`nutrition_values` 等），在 mock 模式下展示的页面结构与真实模式不一致。

---

### P2-08: 各列表页 — 下拉刷新触发时无 loading 状态锁定

- 模块: 全模块列表页
- 页面/接口: 各列表页的 `onPullDownRefresh`
- 问题类型: 稳定性
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 在列表页快速连续下拉刷新 2-3 次
2. 观察列表数据变化

#### 实际结果

快速连续下拉刷新触发多次并发请求，列表数据可能重复或出现短暂闪烁。

#### 期望结果

下拉刷新期间应有 loading 锁，阻止重复触发。

---

### P2-09: 后端 — 分页元数据缺失（total、hasMore）

- 模块: 后端接口（多个列表接口）
- 页面/接口: `GET /api/v1/parenting/articles`、`/api/v1/nutrition/recipes` 等
- 文件位置: `backend/src/mysql-production/server.js`
- 问题类型: 逻辑 / 代码
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 调用任意列表接口
2. 检查返回的分页元数据

#### 实际结果

部分列表接口未返回 `total`（总数）和 `hasMore`（是否有更多）字段，前端难以判断分页结束条件。

---

### P2-10: 后端 — 某些查询的求和聚合 NaN 问题

- 模块: 后端接口
- 页面/接口: 涉及数值聚合的接口
- 文件位置: `backend/src/mysql-production/server.js`
- 问题类型: 代码
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 对空数据集调用涉及 SUM/AVG 聚合的接口
2. 检查返回的聚合值

#### 实际结果

当数据集为空时，SQL 聚合函数返回 NULL，JavaScript 端未做 null -> 0 转换，导致 NaN 被序列化返回给前端。

#### 期望结果

空数据集的聚合结果应为 0，前端不应收到 NaN。

---

### P2-11: 首页 — onReachBottom 缺少防重守卫

- 模块: 首页
- 页面/接口: `pages/index/index`
- 文件位置: `miniprogram/pages/index/index.js`（onReachBottom）
- 问题类型: 稳定性
- 严重级别: P2
- 是否稳定复现: 否，当前代码库中未发现该入口
- 是否建议立即修复: 否，审计项已纠偏

#### 复现步骤

1. 在首页快速滑动到底部触发加载更多
2. 在内容加载完成前再次滑动触发

#### 实际结果

当前首页 `miniprogram/pages/index/index.js` 中不存在 `onReachBottom` 方法，`index.wxml` 也不存在 `scrolltolower`、`bindscrolltolower` 或任何分页加载绑定；`index.json` 也未配置相关滚动触底参数。首轮审计将首页其他异步加载问题误归因为“触底加载防重”，当前代码事实不支持该结论。

---

### P2-12: 全局 — 白名单包含 localhost 和遗留域名 supercalf.com

- 模块: 全局
- 页面/接口: `miniprogram/app.js` / `miniprogram/app.json`
- 文件位置: `miniprogram/app.js`（request 合法域名白名单）
- 问题类型: 环境
- 严重级别: P2
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 检查 request 合法域名配置
2. 搜索白名单中包含的域名

#### 实际结果

白名单中包含 `localhost`（仅开发工具可用、真机无效）和 `supercalf.com`（已废弃的遗留域名），这些域名的存在可能造成混淆。

#### 期望结果

清理废弃域名，仅保留当前生产 API 域名 `api.woyai.cn`。

---

## P3 级问题

---

### P3-01: 项目缺少 lint 脚本配置

- 模块: 全局
- 页面/接口: `miniprogram/package.json`
- 文件位置: `miniprogram/package.json`
- 问题类型: 代码
- 严重级别: P3
- 是否稳定复现: N/A
- 是否建议立即修复: 否（可后续统一配置）

#### 复现步骤

1. 检查 `package.json` 的 scripts 字段
2. 搜索 lint 相关命令

#### 实际结果

项目中未配置 `npm run lint` 脚本，无法通过统一命令执行静态代码分析。

---

### P3-02: 能力成长 — 教材首页 mock 回退死分支（3 处）

- 模块: 能力成长
- 页面/接口: `pages/textbook/textbook`
- 文件位置: `miniprogram/pages/textbook/textbook.js`（多处回退分支）
- 问题类型: 代码
- 严重级别: P3
- 是否稳定复现: 否，当前为可达离线/演示回退
- 是否建议立即修复: 否，当前审计项已纠偏

#### 复现步骤

1. 审查 `textbook.js` 中的条件分支
2. 标记不可达的 mock 回退路径

#### 实际结果

`textbook.js` 中与 mock 相关的分支当前主要通过 `app.shouldUseMockFallback()` 和请求失败后的 fallback 路径进入，覆盖 `refreshCurrentChildFromServer`、`loadProgressOverview`、`loadTodayTasks`、`loadReadingTasks` 等链路。它们属于可达的离线/演示回退路径，而不是不可达死分支。

---

### P3-03: 知识点详情 — 旧码状态拆分逻辑

- 模块: 能力成长
- 页面/接口: `pages/textbook/knowledge-detail/knowledge-detail`
- 文件位置: `miniprogram/pages/textbook/knowledge-detail/knowledge-detail.js`
- 问题类型: 代码
- 严重级别: P3
- 是否稳定复现: 否
- 是否建议立即修复: 否，当前已基本收敛

#### 复现步骤

1. 审查知识点详情页的状态管理代码
2. 检查旧编码和新编码的状态拆分逻辑

#### 实际结果

当前知识点详情页仅保留 `r0_1 -> r1`、`r0_2 -> r2` 的入口归一化映射，并以归一化后的 `pointId` 统一承接笔记、步骤勾选、掌握状态和接口请求。原先“多套旧码状态并行维护”的结论已不再成立，剩余兼容逻辑主要是低风险别名归一化。

---

### P3-04: 章节列表 — 参数校验缺失

- 模块: 能力成长
- 页面/接口: `pages/textbook/knowledge-list/knowledge-list`
- 文件位置: `miniprogram/pages/textbook/knowledge-list/knowledge-list.js`
- 问题类型: 代码
- 严重级别: P3
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 构造不含必要参数的页面跳转进入章节列表
2. 观察页面行为

#### 实际结果

章节列表页缺少对路由参数的校验，可能进入异常状态。

---

### P3-05: 后端 — JSON 解析静默错误

- 模块: 后端
- 页面/接口: 多处接口
- 文件位置: `backend/src/mysql-production/server.js`
- 问题类型: 代码
- 严重级别: P3
- 是否稳定复现: 是
- 是否建议立即修复: 是

#### 复现步骤

1. 检查后端对数据库 JSON 字段的解析代码
2. 构造格式异常的 JSON 数据

#### 实际结果

后端对数据库中 JSON 类型字段的解析未使用 try-catch 包裹，当数据格式异常时可能抛出未捕获异常导致接口 500。

---

### P3-06: 营养食谱 — 部分数据质量问题

- 模块: 营养食谱
- 页面/接口: `backend/src/nutrition-recipes.json`
- 文件位置: `backend/src/nutrition-recipes.json`
- 问题类型: 深度
- 严重级别: P3
- 是否稳定复现: 是
- 是否建议立即修复: 否（单点数据修正）

#### 复现步骤

1. 审查营养食谱数据文件
2. 逐条检查食谱的 ingredients、steps 等字段完整性

#### 实际结果

个别食谱的 ingredients（食材）或 steps（步骤）字段不完整或格式不一致。

---

### P3-07: 各模块 — setTimeout 使用缺少清理逻辑

- 模块: 全模块
- 页面/接口: 多处使用 setTimeout 的页面
- 问题类型: 稳定性
- 严重级别: P3
- 是否稳定复现: 是
- 是否建议立即修复: 否（集中收尾处理）

#### 复现步骤

1. 审查代码中所有的 setTimeout 使用
2. 检查 onHide/onUnload 中是否有对应的 clearTimeout

#### 实际结果

多处 setTimeout 未在页面销毁时调用 clearTimeout，在快速切换页面时可能产生内存泄漏和已销毁页面的回调执行。

---

### P3-08: 后端 — 旧码回退静默

- 模块: 后端
- 页面/接口: 多处 handler
- 文件位置: `backend/src/mysql-production/server.js`
- 问题类型: 代码
- 严重级别: P3
- 是否稳定复现: 否
- 是否建议立即修复: 否（低风险代码异味）

#### 复现步骤

1. 审查 handler 中对旧编码的处理逻辑
2. 检查旧编码路径是否可被触发

#### 实际结果

存在为兼容旧版小程序而保留的旧编码回退路径，当前线上版本不会触发这些路径。

---

### P3-09: 成长观察 — 里程碑数据无后端支持

- 模块: 成长观察
- 页面/接口: `pages/assessment/`
- 文件位置: `miniprogram/pages/assessment/` / `backend/src/mysql-production/server.js`
- 问题类型: 深度 / 功能
- 严重级别: P3
- 是否稳定复现: 是
- 是否建议立即修复: 否（新功能规划中）

#### 复现步骤

1. 在成长观察中尝试查看里程碑相关内容
2. 检查后端是否有对应接口

#### 实际结果

前端成长观察模块预留了里程碑展示区域，但后端尚未实现对应接口，暂不可用。

---

### P3-10: 成长观察 — 年级字段不匹配

- 模块: 成长观察
- 页面/接口: `pages/assessment/`
- 文件位置: 前后端年龄/年级映射逻辑
- 问题类型: 逻辑
- 严重级别: P3
- 是否稳定复现: 是
- 是否建议立即修复: 否

#### 复现步骤

1. 设置孩子年龄为某些边界值
2. 检查成长观察中展示的对应年级

#### 实际结果

年龄到年级的映射在某些边界年龄（如 6 岁整）存在 +1/-1 的偏差。

---

## 问题统计

| 级别 | 数量 | 占比 |
|------|------|------|
| P0 | 6 | 14% |
| P1 | 10 | 23% |
| P2 | 12 | 27% |
| P3 | 10 + 若干低优先级项 | 36% |

**关键发现**:
- P0 级问题集中的三大脉络：列表分页静默失败、详情页无参数守卫、环境兼容性（Promise.allSettled / 页面未注册）
- P1 级问题集中在：筛选口径不一致、字段映射断裂、防重守卫缺失
- P2 级问题集中在：字段映射冗余/缺失、分页元数据、内容差异化
- 全量共识别 **40+** 个独立问题条目

---

## 待外部验证项

以下审计项因当前环境限制无法直接验证，标记为"待外部验证"：

1. 微信小程序开发者工具环境完整回归
2. iOS / Android 真机验证
3. 真实登录态下的 token 过期重入测试
4. 弱网模拟下的分页叠加测试
5. 生产环境白名单实际放行情况
6. 小程序审核合规性检查
