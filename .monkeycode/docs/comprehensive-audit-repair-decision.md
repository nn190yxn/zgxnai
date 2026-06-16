# 小牛育儿全面审计 — 修复决策单

**审计日期**: 2026-06-15
**决策原则**: 依据 `comprehensive-audit-execution-standard.md` 第十五节"修复决策规则"

## 执行进展更新（2026-06-15）

- 已完成并验证: `FIX-01` `FIX-02` `FIX-03` `FIX-04` `FIX-05` `FIX-06` `FIX-07` `FIX-08` `FIX-09` `FIX-10` `FIX-11` `FIX-12` `FIX-13` `FIX-14` `FIX-15` `FIX-16` `FIX-17` `FIX-18` `FIX-19` `FIX-20` `FIX-21` `FIX-22` `FIX-23`
- 已完成: `FIX-10` 首页 mock 回退清理，已覆盖周总结区块、今日建议区块、会员触点、分享卡片以及分享草稿回灌链路的失败态/登录态/演示态修正
- 补充修复: `P3-04` 章节列表参数守卫已完成并通过语法校验
- 补充修复: `P3-05` 后端 JSON 安全解析已完成并通过语法校验
- 补充修复: `P3-01` 根目录 `lint` 聚合脚本已完成并通过 `npm run lint` 验证
- 补充修复: `P3-07` 主链路页面定时器清理已完成并通过语法校验
- 新增需求进展: 游客注册赠送 `7` 天成长服务已接入首次注册链路，可与邀请码奖励叠加
- 补充修复: `P1-06` 旧任务码 `r0_1`、`r0_2` 已接入 canonical 任务码映射，并修复任务完成接口按任务主键落库
- 补充修复: `P1-08` 营养食谱年龄段筛选已统一为 `age_group`，后端兼容旧 `age` 与拼音别名，mock/fallback 与真实接口口径一致
- 补充修复: `P2-07` mock 详情数据已补齐结构化字段，能力成长与营养食谱在 mock/fallback 下的页面结构已与真实接口主结构对齐
- 补充修复: `P2-03` 营养食谱 `images` 已由后端统一归一化输出，原字段缺失问题已收敛
- 补充收敛: `P3-06` 已确认批量结构问题主要为图片缺失，服务端已补食谱图片兜底与 `images` 归一化
- 补充修复: `P3-08` 后端旧任务码解析已统一走 canonical helper，更新进度接口不再保留独立旧码回退实现
- 补充纠偏: `P3-09` 原审计项已确认引用错误，当前里程碑功能属于 `parenting/milestone` 纯前端本地模块，当前代码库中不存在 assessment 侧后端缺口
- 补充纠偏: `P2-11` 原审计项已确认误报，首页不存在 `onReachBottom` 或任何滚动到底加载入口，无需进入修复队列
- 补充纠偏: `P3-02` `textbook` 页中的 mock 分支属于可达离线/演示回退路径，原“死分支”结论不成立
- 观察项更新: `P2-08` 主链路页面已覆盖刷新防重，剩余为少量非主链路页面观察
- 补充修复: `FIX-23` 已完成周总结高级字段展示增强与文章详情专业标签展示，`P2-04`、`P2-05` 已从观察项收口
- 观察项更新: `P2-01` `P2-02` 当前更接近展示策略和字段利用率问题，暂无主链路修复必要
- 观察项更新: `P3-03` 当前仅剩旧任务码别名归一化入口，前后端状态路径已统一，问题已基本收敛

---

## 决策总览

| 决策分类 | 数量 | 说明 |
|----------|------|------|
| 立即修复 | 15 | 稳定复现 + 影响主路径 + 风险可控 |
| 延后修复 | 4 | 依赖外部条件 / 低优先级代码异味 |
| 观察 | 6 | 不能稳定复现但证据明确 / 环境阻塞 |
| 非本轮 | 若干 | 未覆盖模块 + 待外部验证项 |

---

## 一、立即修复

### 修复队列 (按优先级排序)

---

#### FIX-01: 首页 Promise.allSettled 兼容性替换

- 关联问题: P0-06
- 优先级: 最高
- 修复方案: 将 `Promise.allSettled` 替换为手动包装的 `Promise.all` + `.catch(() => null)` 模式，确保在微信小程序 JS 引擎中兼容运行
- 影响文件: `miniprogram/pages/index/index.js`, `miniprogram/utils/request.js`
- 回归范围: 首页所有并发数据加载区域; 全局 request 工具发出的所有并发请求
- 验证方法: 开发者工具 / 真机打开首页，确认计划卡、热门食谱、育儿文章正常渲染
- 风险: 低。仅替换 API 调用方式，不改变业务逻辑

---

#### FIX-02: 周总结 + 成长记录 — app.json 页面注册

- 关联问题: P0-05
- 优先级: 最高
- 修复方案: 在 `miniprogram/app.json` 的 `pages` 数组中添加成长记录和周总结页面路径
- 影响文件: `miniprogram/app.json`
- 回归范围: 小程序编译通过; 两个页面可以正常 navigateTo 访问
- 验证方法: 编译后检查对应页面是否可以访问
- 风险: 极低。仅添加配置项

---

#### FIX-03: 育儿文章详情 + 营养食谱详情 — id 参数空值守卫

- 关联问题: P0-04
- 优先级: 最高
- 修复方案: 在 onLoad 方法中增加对 `options.id` 的空值检查，若不存在则展示错误提示或返回上一页
- 影响文件: `miniprogram/pages/parenting/article-detail/article-detail.js`, `miniprogram/pages/nutrition/recipe-detail/recipe-detail.js`
- 回归范围: 正常进入详情页的流程不受影响; 无参进入时正确展示错误态
- 验证方法: 构造无 id 参数的跳转，确认显示错误提示或自动返回
- 风险: 低。纯防御性守卫

---

#### FIX-04: 育儿文章详情 — toggleLike 防重守卫

- 关联问题: P0-01
- 优先级: 高
- 修复方案: 在 toggleLike 方法中增加 `isLiking` 标志位，请求前锁定、请求后释放，锁定期间屏蔽后续点击
- 影响文件: `miniprogram/pages/parenting/article-detail/article-detail.js`
- 回归范围: 正常收藏/取消收藏流程; 防重锁定期间按钮禁用状态
- 验证方法: 快速连续点击收藏按钮 3 次，确认只发送 1 次请求且最终状态正确
- 风险: 低。纯前端 UI 锁

---

#### FIX-05: 育儿文章列表 — 分页静默失败处理

- 关联问题: P0-02
- 优先级: 高
- 修复方案: 在 loadMore 方法中对空结果和错误返回做显式处理：空结果展示"已加载全部"; 错误展示"加载失败，点击重试"
- 影响文件: `miniprogram/pages/parenting/article-list/article-list.js`, 对应 wxml
- 回归范围: 列表页正常分页、空结果、错误三种状态
- 验证方法: 模拟后端返回空列表，确认展示"已加载全部"提示
- 风险: 低。新增 UI 状态展示

---

#### FIX-06: 营养食谱列表 — 分页静默失败 + loadHotRecipes 防重

- 关联问题: P0-03
- 优先级: 高
- 修复方案: 同上修分页空结果/错误处理; 在 loadHotRecipes 中增加 `isLoadingHot` 防重标志位
- 影响文件: `miniprogram/pages/nutrition/recipe-list/recipe-list.js`, 对应 wxml
- 回归范围: 食谱列表分页、热门食谱加载、防重锁
- 验证方法: 列表分页空结果提示; 快速下拉刷新 2 次确认不重复
- 风险: 低

---

#### FIX-07: 育儿文章搜索 — 补充 age_group / category 参数

- 关联问题: P1-01
- 优先级: 高
- 修复方案: 在搜索方法构建请求参数时，将用户选择的 age_group 和 category 值纳入请求参数
- 影响文件: `miniprogram/pages/parenting/search/search.js`
- 回归范围: 搜索功能的所有筛选项组合
- 验证方法: 选择年龄和分类后搜索，检查请求参数是否包含筛选字段
- 风险: 低。仅补充传递已有参数

---

#### FIX-08: 后端 — 参数校验 (parentingArticlesHandler + subjectCode)

- 关联问题: P1-02, P1-03
- 优先级: 高
- 修复方案:
  - parentingArticlesHandler: 增加 age_group 范围校验 (0-6)、page 正整数校验
  - educationKnowledgeDetailHandler: subjectCode 不存在时返回 404 而非哨兵值
- 影响文件: `backend/src/mysql-production/server.js`
- 回归范围: 所有育儿文章列表/搜索接口; 知识点详情接口
- 验证方法: 发送非法参数验证返回 400; 不存在的 subjectCode 返回 404
- 风险: 中。后端改动需验证已有正常路径不被误伤

---

#### FIX-09: 全局 — CURRENT_ENV 硬编码修复

- 关联问题: P1-04
- 优先级: 高
- 修复方案: 引入环境检测逻辑（如通过小程序账号 AppID 判断），至少区分 production 和 development 两套 API 基址
- 影响文件: `miniprogram/config/env.js`
- 回归范围: 所有依赖 env.js 获取 API 地址的模块
- 验证方法: 检查不同环境下的 API 地址是否正确
- 风险: 中。全局配置改动，需全量回归

---

#### FIX-10: 首页 — mock 回退路径清理

- 关联问题: P1-05
- 优先级: 高
- 修复方案: 将首页数据加载的失败回退路径中的 mock 假数据替换为真实错误态展示；保留离线演示模式独立的入口判断
- 影响文件: `miniprogram/pages/index/index.js`
- 回归范围: 首页正常加载、接口失败、离线演示三种状态
- 验证方法: 模拟接口失败，确认展示真实错误态而非假数据
- 风险: 中。需确认离线演示模式的入口条件

---

#### FIX-11: 育儿文章详情 — submitComment 防重守卫

- 关联问题: P1-09
- 优先级: 高
- 修复方案: 在 submitComment 方法中增加 `isSubmitting` 标志位
- 影响文件: `miniprogram/pages/parenting/article-detail/article-detail.js`
- 回归范围: 评论提交流程
- 验证方法: 快速连续点击发送，确认只提交一次
- 风险: 低

---

#### FIX-12: 全局 — token 过期刷新递归锁

- 关联问题: P1-10
- 优先级: 高
- 修复方案: 在 request 拦截器中增加全局 token 刷新锁，同时只允许一个刷新请求，其他请求在队列中等待刷新完成
- 影响文件: `miniprogram/utils/request.js`
- 回归范围: 所有需要登录态的接口调用
- 验证方法: 模拟 token 过期，并发发起多个请求，确认只触发一次刷新
- 风险: 中。全局 request 改动，需充分回归

---

#### FIX-13: 后端 — 分页元数据补全 (total / hasMore)

- 关联问题: P2-09
- 优先级: 中
- 修复方案: 所有列表接口统一返回 `total`（总数）、`hasMore`（是否有更多）分页元数据
- 影响文件: `backend/src/mysql-production/server.js`
- 回归范围: 所有列表接口的分页行为
- 验证方法: 调用列表接口，检查返回是否包含分页元数据字段
- 风险: 低。仅补充响应字段

---

#### FIX-14: 后端 — 聚合求和 NaN 防护

- 关联问题: P2-10
- 优先级: 中
- 修复方案: 对所有 SQL 聚合函数的返回值做 null -> 0 的兜底处理
- 影响文件: `backend/src/mysql-production/server.js`
- 回归范围: 所有涉及 SUM/AVG 聚合的接口
- 验证方法: 对空数据集查询，确认聚合结果为 0
- 风险: 低

---

#### FIX-15: 全局 — 白名单清理 (移除 localhost 和 supercalf.com)

- 关联问题: P2-12
- 优先级: 中
- 修复方案: 从 request 合法域名配置中移除 `localhost` 和 `supercalf.com`
- 影响文件: `miniprogram/app.js`
- 回归范围: 生产环境网络请求
- 验证方法: 确认白名单仅包含 `api.woyai.cn`
- 风险: 低

---

#### FIX-16: 全局 — 根目录 lint 聚合入口补齐

- 关联问题: P3-01
- 优先级: 中
- 修复方案: 在仓库根目录新增 `scripts/lint.js`，串行执行 `backend` 现有 `lint` 与 `miniprogram` 全量 `node --check` 语法校验，并在根 `package.json` 暴露 `npm run lint`
- 影响文件: `package.json`, `scripts/lint.js`
- 回归范围: 根目录工程检查入口; `backend` 与 `miniprogram` 的语法级静态校验
- 验证方法: 执行 `npm run lint`，确认后端与小程序文件均通过
- 风险: 低。仅补齐校验入口，不改变业务逻辑

---

#### FIX-17: 全局 — 页面定时器清理收敛

- 关联问题: P3-07
- 优先级: 中
- 修复方案: 将首页、会员页、成长观察结果页、孩子档案编辑页中的延迟回调改为实例级定时器句柄，在 `onUnload` 时统一清理，避免页面卸载后继续触发 `setData`、`navigateBack` 或 `showModal`
- 影响文件: `miniprogram/pages/index/index.js`, `miniprogram/pages/membership/index.js`, `miniprogram/pages/assessment/result/result.js`, `miniprogram/pages/profile/child-edit/child-edit.js`
- 回归范围: 页面首次进入、成功保存后返回、兑换码成功提示、无效参数自动返回、离开页面后无延迟副作用
- 验证方法: `node --check` 校验相关文件；手动快速进入再退出页面，确认无延迟跳转或弹窗残留
- 风险: 低。仅收敛异步清理逻辑

---

#### FIX-18: 能力成长 — 旧任务码 canonical 映射补齐

- 关联问题: P1-06
- 优先级: 高
- 修复方案: 将历史任务码 `r0_1`、`r0_2` 统一映射到 canonical 阅读任务码；后端详情接口、进度接口、完成接口统一按 canonical 解析；前端跳转参数和本地完成态统一使用 canonical 键
- 影响文件: `backend/src/mysql-production/server.js`, `miniprogram/pages/textbook/textbook.js`, `miniprogram/pages/textbook/knowledge-detail/knowledge-detail.js`
- 回归范围: 旧分享链接打开知识点详情、旧任务码写入学习进度、本地完成态展示、今日任务完成打卡
- 验证方法: `node --check` 校验相关文件；`npm run lint` 全量通过；使用旧码 `r0_1`、`r0_2` 访问详情时可正常落到 canonical 任务
- 风险: 低。兼容性补丁，仅收敛旧码入口

---

#### FIX-19: 营养食谱 — 年龄段筛选口径统一

- 关联问题: P1-08
- 优先级: 高
- 修复方案: 前端列表页统一传 `age_group`；后端查询优先读取 `age_group` 并兼容旧 `age`、拼音别名；本地 fallback 过滤逻辑同步使用同一年龄段规则
- 影响文件: `backend/src/mysql-production/server.js`, `miniprogram/pages/nutrition/recipe-list/recipe-list.js`
- 回归范围: 营养食谱列表年龄段筛选、带年龄参数的页面直达、mock/fallback 结果一致性
- 验证方法: `node --check` 校验相关文件；`npm run lint` 全量通过；带 `age_group`、旧 `age`、拼音别名的请求都能命中相同年龄段结果
- 风险: 低。参数归一化与本地筛选一致性修复

---

#### FIX-20: mock 详情数据 — 结构化字段补齐

- 关联问题: P2-07
- 优先级: 中
- 修复方案: 为能力成长 mock 详情统一补齐 `reading_sections`、`practice_material` 等结构字段；为营养食谱本地详情补齐图片、微量营养素、营养组合和每日营养占比，保证 mock/fallback 与真实接口主结构一致
- 影响文件: `miniprogram/pages/textbook/knowledge-detail/knowledge-detail.js`, `miniprogram/pages/nutrition/recipe-detail/recipe-detail.js`
- 回归范围: mock 模式或本地 fallback 打开知识点详情、营养食谱详情时的页面布局与字段渲染
- 验证方法: `node --check` 校验相关文件；`npm run lint` 全量通过
- 风险: 低。仅补结构字段，不改变正常在线接口链路

---

#### FIX-21: 营养食谱数据 — 图片兜底与 `images` 归一化

- 关联问题: P3-06
- 优先级: 低
- 修复方案: 在食谱归一化出口统一补分类图片兜底，并生成 `images` 数组，减少数据源缺图导致的列表和详情结构缺口
- 影响文件: `backend/src/mysql-production/server.js`
- 回归范围: 营养推荐、食谱列表、食谱详情的图片字段完整性
- 验证方法: `node --check` 校验相关文件；`npm run lint` 全量通过
- 风险: 低。仅增加展示兜底，不改变食谱筛选与业务逻辑

---

#### FIX-22: 后端旧任务码解析 — canonical helper 收口

- 关联问题: P3-08
- 优先级: 低
- 修复方案: 将学习进度更新接口中剩余的手写旧码映射替换为统一 `resolveCanonicalReadingTaskCode(...)`，并回传 canonical `knowledge_point_id`
- 影响文件: `backend/src/mysql-production/server.js`
- 回归范围: 旧任务码更新学习进度、详情读取、完成打卡三条链路的一致性
- 验证方法: `node --check` 校验相关文件；`npm run lint` 全量通过
- 风险: 低。逻辑仅收口，不扩大兼容范围

---

#### FIX-23: 周总结与育儿文章详情 — 高级字段展示收口

- 关联问题: P2-04, P2-05
- 优先级: 中
- 修复方案: 周总结页补充 `ageGroup`、`weakestDimensionLabel`、`dimensionScores` 展示；育儿文章详情页补充 `sub_category` 与 `evidence_level` 标签展示
- 影响文件: `miniprogram/pages/weekly-summary/index.js`, `miniprogram/pages/weekly-summary/index.wxml`, `miniprogram/pages/weekly-summary/index.wxss`, `miniprogram/pages/parenting/article-detail/article-detail.js`, `miniprogram/pages/parenting/article-detail/article-detail.wxml`, `miniprogram/pages/parenting/article-detail/article-detail.wxss`
- 回归范围: 周总结主卡片、维度区块、文章详情标签区
- 验证方法: `node --check` 校验相关文件；`npm run lint` 全量通过
- 风险: 低。仅消费现有接口字段，不改变接口结构和正文内容链路

---

## 二、延后修复

---

#### DEFER-01: 阅读任务库内容差异化

- 关联问题: P1-07
- 延后原因: 已量化确认当前实现存在年龄画像注入，`content`、`difficulty`、`duration` 已随年龄变化；主要剩余问题集中在任务模板骨架复用，属于内容策略与教研编排层面，不属于本轮应急代码缺陷
- 当前结论: `90` 个模板在五个年龄段上共生成 `450` 条任务；跨年龄完全共用的字段为 `title`、`material`、`objective`、`steps`、`parent_prompt`、`tips`、`example_answer`
- 建议时机: 产品确认内容策略后执行

#### DEFER-02: 育儿文章内容差异化

- 关联问题: P2-06
- 延后原因: 已量化确认当前实现具备年龄表达层注入，但内容主体仍是 `50` 个主题模板乘 `5` 个年龄段生成的 `250` 篇派生文章；剩余问题集中在主题案例、观察重点和误区主体复用，属于内容策略与教研编排层面
- 当前结论: 跨年龄真正变化的主要是年龄标签和 `development` / `actionHint` / `summarySuffix` 注入内容，`scene`、`goal`、`why`、`example`、`observe`、`pitfalls`、`tip`、`referral`、`evidenceFocus` 在同主题下保持不变
- 建议时机: 产品决策后

#### DEFER-03: 里程碑功能产品化改造

- 关联问题: 历史里程碑模块治理
- 延后原因: 当前代码中的里程碑为 `parenting/milestone` 纯前端本地实现；是否接入后端属于后续产品化范围
- 建议时机: 明确是否需要跨端同步、账号级历史记录和服务端分析后再立项

#### DEFER-04: mock 回退整体移除计划

- 关联问题: 历史 mock 治理
- 延后原因: 已有计划逐步移除 mock，不需要单独修复单点
- 建议时机: 整体 mock 清理时一并执行

#### DEFER-05: 营养食谱数据质量逐条修订

- 关联问题: P3-06
- 延后原因: 属于内容数据治理，逐条核验成本高
- 建议时机: 内容数据专项整理时推进

---

## 三、观察 / 待核实

---

#### OBSERVE-01: token 过期递归 — 真机验证

- 关联问题: P1-10
- 观察原因: 本地环境无法完全模拟真实 token 过期场景
- 观察方法: 生产环境观察 token 刷新行为; 检查是否有请求堆积日志

#### OBSERVE-02: 各页面下拉刷新加载锁 — 全局确认

- 关联问题: P2-08
- 观察原因: 修复首页和列表页后，需确认其他页面是否受同一问题影响
- 观察方法: 逐页测试快速下拉刷新行为

#### OBSERVE-03: JSON 解析静默错误 — 线上日志

- 关联问题: P3-05
- 观察原因: 需要线上错误日志确认实际发生频率
- 观察方法: 监控生产日志中 JSON 解析异常记录

#### OBSERVE-04: 成长观察年级偏差 — 边界复现

- 关联问题: P3-10
- 观察原因: 边界值偏差程度需真机测试确认
- 观察方法: 设置边界年龄后验证年级显示

#### OBSERVE-05: 营养食谱数据质量 — 逐条审核

- 关联问题: P3-06
- 观察原因: 内容数据问题，逐条修复工作量大
- 观察方法: 逐条审核 nutrition-recipes.json 后确定修复范围

#### OBSERVE-06: 能力成长 dead code 清理 — 判断可否安全删除

- 关联问题: P3-02, P3-03, P3-08
- 观察原因: 确认旧编码路径在生产环境完全不会被触发后才安全删除
- 观察方法: 生产日志中搜索旧编码请求，确认零调用后清理

---

## 四、修复执行顺序

为保证修复的可控性和回归安全性，建议按以下批次推进：

### 第 1 批 (高危 — 立即执行)
1. FIX-02: 页面注册 (配置项，零风险)
2. FIX-01: Promise.allSettled 兼容 (首页不可用)
3. FIX-03: 详情页 id 空值守卫 (详情页不可用)
4. FIX-04: toggleLike 防重
5. FIX-06: 营养食谱分页 + loadHotRecipes 防重
6. FIX-05: 育儿文章分页静默失败

### 第 2 批 (中危 — 紧接着)
7. FIX-10: 首页 mock 回退清理
8. FIX-11: submitComment 防重
9. FIX-07: 搜索筛选参数补全
10. FIX-12: token 过期刷新锁

### 第 3 批 (后端 + 配置 — 逐一验证)
11. FIX-08: 后端参数校验
12. FIX-09: CURRENT_ENV 环境切换
13. FIX-13: 分页元数据补全
14. FIX-14: 聚合 NaN 防护
15. FIX-15: 白名单清理

---

## 五、修复验证要求

每次修复提交前必须满足：

1. 修改文件通过语法检查 (`node --check`)
2. 相关路径有手动验证记录
3. 提交信息包含关联的问题编号 (如 `fix: P0-06`)
4. 每次最多修改 3 个文件，降低回归风险
5. 每批修复完成后统一推送，不要逐文件推送
