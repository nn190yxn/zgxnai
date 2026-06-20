# Chat 基线记录 2026-06-18

## 目的

本文件用于记录知识库问答本轮调整前的 `/chat` 基线行为，便于后续做前后对比和深度回测。

## 当前主链路

当前生产问答主入口：

1. [chatHandler](/workspace/backend/src/mysql-production/server.js:1357)

当前主链路顺序：

1. 提取 `message`
2. 解析孩子年龄上下文
3. 缺年龄时直接返回 `age_clarification`
4. 识别一级 `intent`
5. 调用 `collectChatReferences()` 做统一召回
6. 先构造 `buildChatAnswer()` 回退答案
7. 如果 AI 可用，则调用 `generateAIAnswer()`
8. 如果 AI 不可用，则返回 `knowledge_fallback` 或 `seed_knowledge`

## 当前问题理解能力

当前仅有一级意图：

1. `nutrition`
2. `reading`
3. `emotion`
4. `focus`
5. `assessment`
6. `general`

当前没有：

1. `sub_intent`
2. `risk_level`
3. 场景型结构字段

## 当前召回入口

当前统一召回入口：

1. [collectChatReferences](/workspace/backend/src/mysql-production/server.js:1871)

当前已接入内容源：

1. `articles`
2. `reading_tasks`
3. `parenting_scene_*`
4. `NUTRITION_RECIPES`
5. `ASSESSMENT_META`

## 当前返回字段

当前 `/chat` 响应关键字段：

1. `answer`
2. `sources`
3. `matched_types`
4. `age_group_used`
5. `answer_source`
6. `ai_status`
7. `fallback_reason`
8. `needs_child_age`
9. `child_context_source`
10. `child_profile_missing`

## 当前基线样例

### 样例 1：有默认孩子档案且有生日

输入：

1. `孩子上课坐不住怎么办`

当前结果特征：

1. `needs_child_age=false`
2. `child_context_source=default_child_profile`
3. `answer_source=knowledge_fallback`
4. `matched_types` 包含 `article`、`scene`
5. `age_group_used=4-5岁`

### 样例 2：有孩子档案但无年龄

输入：

1. `孩子上课坐不住怎么办`

当前结果特征：

1. `answer_source=age_clarification`
2. `fallback_reason=AGE_REQUIRED`
3. `needs_child_age=true`
4. `child_context_source=default_child_profile`

### 样例 3：没有孩子档案

输入：

1. `孩子上课坐不住怎么办`

当前结果特征：

1. `answer_source=age_clarification`
2. `fallback_reason=AGE_REQUIRED`
3. `needs_child_age=true`
4. `child_context_source=missing_child_profile`
5. `child_profile_missing=true`

## 本轮调整重点

本轮计划重点调整：

1. 增加 `sub_intent`
2. 增加 `risk_level`
3. 增加统一排序和多来源整合规则
4. 收紧 prompt 和 fallback answer 的知识库驱动边界
5. 补深度回测样例

## 本轮已完成状态

截至 2026-06-18 本轮已完成：

1. `chatHandler` 已输出 `sub_intent`、`risk_level`
2. `collectChatReferences()` 已接入统一排序和年龄兼容加权
3. `buildChatAnswer()` 已收口为结构化段落，统一输出 `先判断原则`、`家庭做法`、`观察点` 或 `边界提醒`
4. `getChatSystemPrompt()` 与 `buildChatPrompt()` 已收紧为“只能基于召回知识片段作答”

## 本轮真实回测结果

2026-06-18 已完成一轮真实 `/api/v1/chat` 回测，当前结果如下：

1. `孩子上课坐不住怎么办` + 有默认孩子档案：`sub_intent=classroom_focus`、`risk_level=low`、`matched_types=[article,scene]`、`age_group_used=4-5岁`
2. `孩子上课坐不住怎么办` + 有档案缺年龄：`answer_source=age_clarification`、`sub_intent=classroom_focus`
3. `孩子上课坐不住怎么办` + 无孩子档案：`answer_source=age_clarification`、`child_context_source=missing_child_profile`
4. `亲子共读后怎么让孩子复述`：`sub_intent=shared_reading_retell`、`matched_types=[article,task]`、`answer_source=knowledge_fallback`
5. `孩子挑食吃饭怎么办`：`sub_intent=meal_refusal`、`matched_types=[article,scene]`、`answer_source=knowledge_fallback`
6. `孩子总说不想活还会打自己怎么办`：`risk_level=high`、`answer_source=seed_knowledge`，回答已带专业支持边界提示
7. `孩子睡前洗漱特别磨蹭怎么办`：`sub_intent=bedtime_routine`、`matched_types=[article,scene]`、`answer_source=knowledge_fallback`
8. `孩子总发脾气哭闹怎么办`：`sub_intent=emotional_outburst`、`matched_types=[article,scene]`、`answer_source=knowledge_fallback`
9. `怀疑孩子多动和发育迟缓要不要看医生`：修正后 `intent=assessment`、`risk_level=medium`、`matched_types=[assessment]`

## 2026-06-18 原始 TXT 导入后专项回测

原始 TXT 细粒度导入 `345 article` 并正式入库后，已补做一轮 `/chat` 专项回测，结果如下：

1. `孕期每天锻炼30分钟有什么好处`：`matched_types=[article]`，`sources` 已命中 `4 每天锻炼30分钟（片段1）`、`4 每天锻炼30分钟（片段2）`
2. `情感忽视需要治疗吗`：`matched_types=[scene,article]`，`sources` 已命中 `第9章 给治疗师 治疗（片段4）` 到 `（片段7）`
3. `怎么打造不老大脑`：`matched_types=[article]`，`sources` 已命中 `第十二章 打造不老大脑的成功案例（片段1-5）`
4. `怎么和孩子一起做睡前流程图`：`matched_types=[article,task,scene]`，`sources` 已命中 `和孩子一起画就寝流程图，2-3周养成自主睡前习惯` 和 `和孩子制作就寝流程图`
5. `宝宝不会说话前能学手语吗`：`matched_types=[article,task]`，`sources` 已命中 `宝宝手语入门训练`
6. `孩子情绪崩溃时怎么替他说出情绪`：`matched_types=[scene,article,task]`，`sources` 已命中 `替孩子说出情绪练习`

## 当前回测备注

1. `亲子共读后怎么让孩子复述` 当前稳定命中 `article`，回答结构仍走 `reading` 专用模板，保留 `家庭步骤` 段落
2. 新导入原始 TXT 已确认进入生产 `/chat` 召回链路，但部分泛问句仍会被既有结构化知识优先命中，后续可继续优化召回排序
3. 第六批《0到5岁》结构化 `task` 已确认进入生产 `/chat` 召回链路，当前已稳定验证 `睡前流程图`、`宝宝手语`、`替孩子说出情绪` 三类问句
4. 关键词提取已做三轮优化：滑动窗口最小长度 2→3 滤除无意义碎片字，补 `说出情绪` `说出` `表达` 等家长高频用语进优先片段，关键词上限从 8 提到 12 确保长问句后半截也被采样
5. `task` 源权重已提升：`emotion/focus` 下从 8→22，`general` 下从 10→18；`task` 的 `steps` 奖励分从 6→15
6. `finalizeChatReferences()` 已增加多样性保证：top 8 结果中至少包含每种可用的 `sourceType` 各一条

## 2026-06-18 第七批导入

第七批共导入 3 份知识源：

1. `神经认知套装`（JSON 结构化）：45 article + 13 task，来源包括《运动改造大脑》《注意力》《大脑的故事》等
2. `崔玉涛自然养育法（完整版）`（TXT）：184 article，完整书籍正文细粒度切分
3. `儿童教育心理学（阿德勒）`（TXT）：103 article

导入后知识库总量：articles=1448、tasks=625、scenes=37

新增通用章节解析器 `generic` parser 于 `prepare-raw-text-knowledge.js`，支持 `01 标题` + `第X章 标题` 两类书籍格式。

## 2026-06-18 第八批导入

第八批共导入 3 份知识源：

1. `儿童性格心理学`（TXT）：108 article，李群锋著，使用 `generic` 解析器（`第一章` 格式）
2. `儿童专注力培养方法`（TXT）：50 article，林成之著，使用 `generic` 解析器（`第1章` 阿拉伯数字格式）
3. `儿童自然法则`（TXT）：296 article，塞利娜·阿尔瓦雷斯著，使用新增 `continuous` 解析器

导入后知识库总量：articles=1902、tasks=625、scenes=37

本轮工具链改进：
- `generic` 解析器新增 `第\d+章`（阿拉伯数字章节）匹配支持
- 新增 `continuous` 解析器，适用于无章节结构的连续叙述型文本，按 20 段一组切分
- `isGenericSectionHeader` 扩展识别 `序章`/`代后记`/`前言`/`导言`
- `findContentStart` 正则同步支持 `第\d+章` 格式

## 2026-06-18 育儿锦囊自动提炼

从已导入的 1902 篇文章中自动提炼育儿锦囊：

- 新建 `parenting_tips` 表，存储短小精悍的可操作育儿建议
- 编写 `extract-parenting-tips.js` 提炼脚本：heuristic 规则评分（可操作性关键词 + 句子长度 + 场景标签检测 + Jaccard 去重）
- 提炼结果：6580 候选 → 4661 去重后入库
- 分类分布：家庭教育 3778、情绪养育 358、行为习惯 158、情绪管理 94 等
- 场景标签覆盖：情绪 213、生活习惯 193、写作业 191、出门 188、健康 147、亲子互动 125 等
- 接入 `/chat` 检索链路：新增 `collectParentingTipReferences`，sourceType=`tip`，general 权重 10
- 全量回归 15/15 通过，`tip` 出现在 11/15 检查点的 `matchedTypes` 中

已验证新内容可被 `/chat` 正常召回：
- `运动为什么能让孩子更聪明` → 命中 Neuro JSON article + task
- `BDNF是什么对大脑有什么作用` → 命中 Neuro JSON `BDNF：运动是大脑的优质肥料`
- `孩子便血了怎么办` → 命中崔玉涛 TXT 对应章节
- `早产儿出院后要注意什么` → 命中崔玉涛 TXT + task
- `孩子自卑怎么办` → 命中阿德勒 TXT 自卑感章节
