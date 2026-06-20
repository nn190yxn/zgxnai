# 知识库驱动型 AI 问答落地方案

## 文档目的

本方案用于把小牛育儿 AI 问答明确收口为“知识库驱动的专业育儿问答服务”，并给出一套可实施、可回归、可持续扩库的规则与开发计划。

本文件为新增独立方案文档，不覆盖现有规划文件：

1. [知识库与 AI 问答链路规划](/workspace/.monkeycode/docs/knowledgebase-ai-chain-plan.md:1)
2. [知识库导入字段说明](/workspace/.monkeycode/docs/knowledgebase-import-fields.md:1)

这份文档可作为后续调整前的方案基线，后续迭代时可在此基础上保留版本并继续调整。

## 产品定义

小牛育儿 AI 问答的目标不是通用聊天，而是基于自有专业育儿知识库、结合孩子年龄档案、输出结构化家庭建议的专业问答服务。

系统分工定义如下：

1. 知识库负责内容专业性、方法一致性、年龄边界和场景覆盖。
2. 检索规则负责识别用户问题，并召回最相关的知识条目。
3. 大模型负责对召回结果做归纳、整合、结构化表达和语言润色。
4. 安全规则负责控制边界提示、风险升级和不可回答场景。

## 当前链路与现状

当前生产主链路在 [server.js](/workspace/backend/src/mysql-production/server.js:1357) 的 `chatHandler`。

当前已具备：

1. 孩子年龄前置：优先读 `child_profile`、`child_id`、默认孩子档案，缺年龄时返回追问型回答。
2. 问题意图识别：`nutrition`、`reading`、`emotion`、`focus`、`assessment`、`general`。
3. 统一召回入口：`collectChatReferences()`。
4. 正式内容召回：`articles`、`reading_tasks`、`parenting_scene_*`。
5. 回退回答：当 `AI_API_KEY` 或 `AI_BASE_URL` 未配置时，走知识库回退回答。

当前已存在的关键函数：

1. [getChatSystemPrompt](/workspace/backend/src/mysql-production/server.js:1601)
2. [buildChatPrompt](/workspace/backend/src/mysql-production/server.js:1615)
3. [analyzeChatIntent](/workspace/backend/src/mysql-production/server.js:1640)
4. [extractChatKeywords](/workspace/backend/src/mysql-production/server.js:1660)
5. [collectArticleReferences](/workspace/backend/src/mysql-production/server.js:1779)
6. [collectReadingTaskReferences](/workspace/backend/src/mysql-production/server.js:1809)
7. [collectSceneReferences](/workspace/backend/src/mysql-production/server.js:1839)
8. [collectChatReferences](/workspace/backend/src/mysql-production/server.js:1871)
9. [buildChatAnswer](/workspace/backend/src/mysql-production/server.js:1934)

## 目标架构

后续稳定架构建议固定为六层：

1. 内容定义层
2. 问题理解层
3. 召回排序层
4. 回答编排层
5. 边界控制层
6. 观测回测层

### 1. 内容定义层

知识库内容继续统一为三类主类型：

1. `article`
2. `task`
3. `scene`

每类内容都需要围绕“家长真实提问”补足可检索字段。

#### article 结构要求

必备信息：

1. 主题
2. 年龄段
3. 家庭场景
4. 核心问题
5. 处理原则
6. 家长做法
7. 不适用边界
8. 来源

推荐补充字段：

1. `question_aliases`
2. `scene_tags`
3. `risk_flags`
4. `contraindications`
5. `summary_for_ai`

#### task 结构要求

必备信息：

1. 目标能力
2. 适用年龄
3. 适用场景
4. 操作步骤
5. 家长提示语
6. 执行时长
7. 难度
8. 停止条件或升级提示

推荐补充字段：

1. `common_questions`
2. `expected_change`
3. `when_not_to_use`

#### scene 结构要求

必备信息：

1. 场景主标题
2. 场景别名
3. 处理原则
4. 推荐动作
5. 关联文章
6. 关联任务
7. 适用年龄

推荐补充字段：

1. `trigger_words`
2. `parent_goal`
3. `avoid_actions`

## 问题理解规则

问题理解层的目标是把用户一句自然语言拆成可检索结构，而不是只做简单关键词匹配。

建议固定提取以下维度：

1. `age_group`
2. `child_name`
3. `intent`
4. `scene`
5. `topic`
6. `risk_level`
7. `expected_answer_type`

### 年龄规则

年龄优先级固定为：

1. `req.body.child_profile`
2. `req.body.child_id` 或 `req.body.childId`
3. 当前用户默认孩子档案
4. 用户在问题文本中显式描述的年龄
5. 缺失时返回追问年龄

年龄规则要求：

1. 年龄相关问题必须先有年龄段。
2. 没有年龄时不输出强年龄绑定建议。
3. 年龄与内容标签冲突时，优先服从年龄边界。

### 意图规则

当前意图已具备基础分类，后续建议升级为双层结构：

1. 一级意图：`nutrition`、`reading`、`emotion`、`focus`、`assessment`、`general`
2. 二级意图：如 `作业启动`、`睡前洗漱`、`上课坐不住`、`亲子共读复述`、`挑食`、`哭闹`

建议做法：

1. 保留当前 `analyzeChatIntent()` 作为一级分类。
2. 新增 `analyzeChatSubIntent()`，输出更细的场景型标签。
3. 场景型标签直接参与 `scene` 召回加权。

### 场景规则

场景识别优先级固定为：

1. 明确家庭场景词
2. 明确行为表现词
3. 明确家长期待词

优先识别场景词建议覆盖：

1. `写作业`
2. `亲子共读`
3. `吃饭`
4. `睡前洗漱`
5. `出门上课`
6. `上课`
7. `拖拉`
8. `发脾气`
9. `哭闹`
10. `坐不住`

## 召回与排序规则

召回层的目标不是只找一篇文章，而是找到一组可组合回答的知识片段。

### 召回入口

统一继续走 `collectChatReferences()`，所有新增知识类型都通过新增子检索器接入。

### 召回顺序

2026-06-18 已落地的排序收紧动作：

1. `extractChatKeywords()` 已补充清理独立问句壳词，如 `怎么`、`如何`、`什么`、`怎样`，减少弱相关内容误召回。
2. `getChatReferenceScore()` 已增加 `title / tags / aliases / summary` 的分层加权，标题命中优先级高于正文偶发命中。
3. `general` 问句下，若候选内容在 `title / tags / aliases` 完全无命中，排序会明显降权。
4. `collectArticleReferences()` 的候选池已从 `read_count DESC LIMIT 12` 调整为 `updated_at DESC, created_at DESC, read_count DESC LIMIT 36`，避免细粒度新导入块在入围前被老热门内容截断。
5. 调整后本地回测已确认 `怎么让孩子多运动` 首条命中回到 `66 生命在于运动（片段1）`，新增原始 TXT 问句继续稳定命中相应书稿片段。
6. `collectReadingTaskReferences()` 已从“仅 reading 场景查询”扩展到 `general / emotion / focus / 有 subIntent` 的问句，以便第六批结构化任务进入统一召回。
7. 关键词提取已补充 `流程图`、`手语`、`冷处理`、`转盘`、`角色扮演`、`说出情绪`、`说出`、`表达`、`运动` 等任务型词汇优先片段，已验证 `睡前流程图`、`宝宝手语`、`替孩子说出情绪` 三类问句可命中 `task`。
8. 已滤除滑动窗口生成的 2 字噪音碎片（`绪崩`、`溃时` 等），关键词上限从 8 提到 12 确保长问句后半截被采样。
9. `finalizeChatReferences()` 已改为 top 8 + 多样性保证，不再纯按分数截断导致高频先验内容挤掉新入库的 task/scene。
10. `task` 源权重已提升至 `emotion/focus: 22`、`general: 18`；`task` 的 `steps` 奖励分从 6 提升到 15。

建议统一排序顺序如下：

1. 年龄强匹配 + 场景强匹配的 `scene`
2. 年龄强匹配 + 问题强匹配的 `article`
3. 年龄强匹配 + 动作可执行的 `task`
4. 年龄通用 + 场景匹配的 `scene`
5. 年龄通用 + 主题匹配的 `article`
6. 通用兜底内容

### 排序权重建议

每条召回结果建议计算统一分值：

`总分 = 年龄分 + 场景分 + 主题分 + 问题词分 + 内容质量分 + 来源权重分`

建议权重示例：

1. 年龄完全匹配：`+40`
2. 场景完全匹配：`+30`
3. 核心问题词命中：`+20`
4. 高质量来源：`+10`
5. 任务具备明确操作步骤：`+8`
6. 内容存在边界提示：`+5`

### 多来源整合规则

一个问题允许同时命中多篇文章和多个任务。整合顺序建议固定为：

1. 先取 1 条主结论内容
2. 再取 1 条场景原则内容
3. 再取 1 条任务型执行内容
4. 最后取 1 条边界或风险提示内容

单次回答建议最多整合 3 到 5 条知识片段，避免内容过载。

## 回答编排规则

大模型接入后，角色应固定为“知识整合与表达层”，而不是独立知识源。

### 回答生成原则

1. 只能基于召回到的知识片段作答。
2. 回答必须体现年龄段限制。
3. 回答必须包含家庭可执行动作。
4. 回答必须避免空泛说教。
5. 回答必须在高风险问题时给出专业转介提示。

### 标准回答模板

建议默认模板固定为四段：

1. 先判断问题当前更像什么
2. 再解释原因或处理原则
3. 再给家庭可执行步骤
4. 最后给观察点和边界提示

示例模板：

1. `先判断`：这类表现更像是场景切换难、任务启动难或情绪对抗。
2. `再解释`：这个年龄段常见原因是……
3. `再执行`：你今晚可以先这样做……
4. `再边界`：如果持续多久或影响哪些功能，建议……

### 多文章命中时的模型职责

当同一问题命中多篇文章时，模型主要做三件事：

1. 合并重复观点
2. 区分不同角度
3. 生成统一结构

示例：

1. 一篇文章讲原因
2. 一篇文章讲家长回应
3. 一篇任务讲具体训练

最终回答要把三者整合成一条可直接执行的答复，而不是把三篇文章并排罗列。

## 大模型与知识库的关系

未来接入大模型后，建议固定成 RAG 风格链路：

1. 用户提问
2. 获取孩子年龄和场景上下文
3. 知识库召回
4. 形成结构化知识片段集
5. 大模型基于片段集生成回答
6. 输出答案和参考来源

### 大模型负责

1. 归纳多条知识
2. 输出更自然的话术
3. 按年龄与场景重组内容顺序
4. 把答案整理成家长更容易执行的结构

### 大模型不负责

1. 自由发散创造事实
2. 替代知识库定义专业口径
3. 覆盖年龄边界
4. 跳过知识库直接给出通用育儿建议

### 降级规则

当大模型不可用时：

1. 优先返回知识库回退回答
2. 回答模板由代码侧 `buildChatAnswer()` 保底
3. 保留 `sources`、`matched_types`、`age_group_used`、`fallback_reason`

当知识命中过弱时：

1. 优先明确告知需要更多场景信息
2. 优先追问年龄、行为表现、触发场景
3. 降低模型通用发挥空间

## 开发规则

### 规则 1：新增知识优先补标签，不先补提示词

知识库问答质量提升优先顺序建议固定为：

1. 补内容结构
2. 补标签和别名
3. 补检索规则
4. 补回答模板
5. 最后再微调提示词

### 规则 2：召回规则与回答规则分层

1. 召回逻辑负责找到内容。
2. 回答逻辑负责组织内容。
3. 提示词只负责约束表达方式。

### 规则 3：所有新增能力必须可观测

建议在 `/chat` 响应中持续保留或新增：

1. `matched_types`
2. `age_group_used`
3. `child_context_source`
4. `fallback_reason`
5. `recall_debug` 或等价调试字段

### 规则 4：高风险问题优先走边界模板

高风险问题建议新增固定识别：

1. 发育倒退
2. 严重睡眠问题
3. 长期拒食
4. 持续暴烈情绪
5. 自伤或伤人倾向

这类问题优先给出边界提示和线下专业建议。

## 分阶段开发计划

### 阶段 0：基线保留

目标：保留当前方案和实现基线，便于后续调整对比。

任务：

1. 保留现有方案文档。
2. 记录当前 `/chat` 字段、召回顺序、回答模板。
3. 保存当前真实问句样本与返回结果。

交付物：

1. 本文档
2. 当前回测样本集

### 阶段 1：问题理解升级

目标：从“粗意图分类”升级到“意图 + 子场景 + 风险”的结构化理解。

任务：

1. 新增 `sub_intent` 分析。
2. 新增场景词与家长期待词词表。
3. 新增风险分级识别。

建议代码点：

1. `analyzeChatIntent()`
2. `extractChatKeywords()`
3. 新增 `analyzeChatScene()`
4. 新增 `analyzeChatRiskLevel()`

### 阶段 2：召回排序升级

目标：让同一问题能稳定取到“主结论 + 场景原则 + 执行任务”。

任务：

1. 给 `scene`、`article`、`task` 统一打分。
2. 新增去重与多条整合策略。
3. 提高年龄和场景匹配权重。

建议代码点：

1. `collectArticleReferences()`
2. `collectReadingTaskReferences()`
3. `collectSceneReferences()`
4. `collectChatReferences()`

### 阶段 3：回答模板升级

目标：让回退回答和大模型回答都固定成“判断 + 原因 + 做法 + 边界”。

任务：

1. 重构 `buildChatAnswer()` 的输出结构。
2. 重构 `buildChatPrompt()` 的输入格式。
3. 根据 intent 和 sub_intent 选择模板。

### 阶段 4：大模型接入收口

目标：把模型能力限制在知识整合层。

任务：

1. 接入 `AI_API_KEY` 和 `AI_BASE_URL`。
2. 在 prompt 中显式要求“仅基于参考资料回答”。
3. 无召回或弱召回时限制模型自由生成。

### 阶段 5：知识库治理持续化

目标：以后每次补库都能稳定进入这条链路。

任务：

1. 内容导入前补齐标签规范。
2. 建立问题别名和场景词库。
3. 对新知识做回测抽样。

## 深度回测计划

用户已明确要求：每次知识库问答规则或代码调整后，都要做一轮完整深度回测。

### 回测范围

必须覆盖：

1. 年龄前置
2. 意图识别
3. 场景识别
4. 多来源召回
5. 多篇文章整合
6. 任务型内容引用
7. 大模型可用与不可用两条路径
8. 高风险边界提示
9. 无知识命中时的降级路径

### 回测样例类别

建议至少覆盖以下场景：

1. `写作业拖拉`
2. `亲子共读后不会复述`
3. `吃饭挑食`
4. `睡前洗漱磨蹭`
5. `上课坐不住`
6. `总发脾气`
7. `怀疑感统或注意力问题`
8. `没有孩子档案`
9. `有档案但缺年龄`
10. `同一问题命中多篇文章`

### 回测方法

1. 单元级：函数输入输出验证。
2. 接口级：直接请求 `/api/v1/chat`。
3. 真实问句级：用家长自然问法复测。
4. 差异对比级：调整前后对同一批问句做答案对比。

### 通过标准

1. 年龄相关问题必须命中年龄段或触发追问。
2. 回答必须包含可执行内容。
3. 多篇命中回答不能出现明显互相冲突。
4. 弱命中场景必须优先追问，不给空泛结论。
5. 高风险场景必须有明确边界提示。

### 2026-06-18 实际回测记录

本轮已直接请求生产链路 `/api/v1/chat`，在 `AI_API_KEY` 与 `AI_BASE_URL` 缺失、系统走知识库回退路径的前提下，已验证以下样例：

执行命令：`cd /workspace/backend && npm run verify:chat`

1. `孩子上课坐不住怎么办` + 默认孩子档案有生日：命中 `sub_intent=classroom_focus`，`risk_level=low`，召回 `article + scene`
2. `孩子上课坐不住怎么办` + 有档案缺年龄：返回 `age_clarification`，年龄追问链路正常
3. `孩子上课坐不住怎么办` + 无孩子档案：返回 `age_clarification`，`child_context_source=missing_child_profile`
4. `亲子共读后怎么让孩子复述`：命中 `sub_intent=shared_reading_retell`，召回 `article + task`，多来源整合正常
5. `孩子挑食吃饭怎么办`：命中 `sub_intent=meal_refusal`，召回 `article + scene`，饮食场景模板正常
6. `孩子总说不想活还会打自己怎么办`：命中 `risk_level=high`，回答已带专业支持边界提示
7. `孩子睡前洗漱特别磨蹭怎么办`：命中 `sub_intent=bedtime_routine`，召回 `article + scene`
8. `孩子总发脾气哭闹怎么办`：命中 `sub_intent=emotional_outburst`，召回 `article + scene`
9. `怀疑孩子多动和发育迟缓要不要看医生`：补规则后命中 `intent=assessment`、`risk_level=medium`，召回 `assessment`

本轮尚未覆盖：

1. AI 可用路径

## 建议的近期执行顺序

建议下一轮开发按以下顺序推进：

1. 先保留当前 `/chat` 基线样本。
2. 再做 `sub_intent` 和 `scene` 识别升级。
3. 再做统一打分和多来源整合。
4. 再重构 `buildChatAnswer()` 模板。
5. 最后接入正式大模型配置并做深度回测。

## 结论

小牛育儿 AI 问答的长期正确方向是：知识库定义专业内容，规则控制识别与召回，大模型负责整合与结构化表达。

只要把这三层职责稳定分开，后续知识库越扩越大，回答会越专业、越一致、越可控。
