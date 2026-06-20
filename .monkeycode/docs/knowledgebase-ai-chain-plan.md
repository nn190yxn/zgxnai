# 知识库与 AI 问答链路规划

## 目标

本规划用于统一小牛育儿后续知识库扩充、导入、检索、回答生成和调试观测链路。

目标有四个：

1. 后续新增知识库时，导入结构稳定，避免每次补库都改主链路。
2. AI 问答只走一个统一召回入口，避免页面、脚本、历史逻辑各自接库。
3. 个性化内容严格依赖登录态、孩子档案和年龄信息。
4. 回答结果可观测、可排查、可验证。

## 当前现状

### 已接入 AI 问答统一召回的内容源

当前生产问答主入口在 [server.js](/workspace/backend/src/mysql-production/server.js:1620) 的 `collectChatReferences()`。

当前已接入：

1. `articles`
2. `reading_tasks`
3. `parenting_scene_tags`
4. `parenting_scene_aliases`
5. `parenting_scene_recommendations`
6. `nutrition-recipes.json` 生成的 `NUTRITION_RECIPES`
7. `ASSESSMENT_META`

### 已有落库与种子链路

当前正式内容表与种子初始化主要在 [server.js](/workspace/backend/src/mysql-production/server.js:4989) 和 [server.js](/workspace/backend/src/mysql-production/server.js:5309)。

现有正式内容表：

1. `articles`
2. `reading_tasks`
3. `parenting_scene_tags`
4. `parenting_scene_aliases`
5. `parenting_scene_recommendations`

现有种子来源：

1. `PARENTING_ARTICLES`
2. `READING_TASKS`
3. `NUTRITION_RECIPES`
4. `ASSESSMENT_META`

### 当前链路短板

1. 正式内容、种子内容、本地题库、历史逻辑并存，边界需要持续收口。
2. AI 模型能力依赖 `AI_API_KEY` 和 `AI_BASE_URL`，缺失时走知识库回退链路。
3. 当前仓库里仍有历史内容逻辑与旧聊天链路，后续扩库时需要避免直接复用旧入口。
4. 当前缺少专门的知识库管理后台，内容治理仍以种子和脚本为主。

## 总体架构

后续统一采用五层链路：

1. 内容定义层
2. 导入映射层
3. 正式内容存储层
4. 统一召回层
5. 回答生成与观测层

### 1. 内容定义层

后续知识库内容统一收敛为以下内容类型：

1. `article`
2. `task`
3. `scene`
4. `recipe`
5. `assessment`

其中前三类作为长期稳定主类型：

1. `article` 负责原理解释、方法文章、育儿知识正文。
2. `task` 负责家庭可执行动作、训练步骤、共读活动、家长提示语。
3. `scene` 负责家庭场景问题、触发词、策略原则和推荐动作。

后两类作为补充能力类型：

1. `recipe` 负责营养与食谱。
2. `assessment` 负责测评元数据、解读、训练建议。

### 2. 导入映射层

后续新增知识库统一使用 JSON 顶层数组导入。

推荐结构：

```json
[
  {
    "type": "article",
    "title": "...",
    "summary": "...",
    "content": "...",
    "category": "...",
    "sub_category": "...",
    "age_group": "3-4岁",
    "tags": ["...", "..."],
    "author": "...",
    "evidence_level": "..."
  },
  {
    "type": "task",
    "task_code": "...",
    "title": "...",
    "subject_code": "reading",
    "age_range": "3-4岁",
    "objective": "...",
    "steps": ["...", "..."],
    "parent_prompt": "...",
    "content": "...",
    "tips": "..."
  },
  {
    "type": "scene",
    "scene_key": "...",
    "scene_title": "...",
    "scene_category": "...",
    "aliases": ["...", "..."],
    "principle_text": "...",
    "suggested_action": "...",
    "recommendations": [
      {
        "result_type": "parenting_article",
        "title": "...",
        "summary": "...",
        "target_type": "parenting_article",
        "target_id": "...",
        "target_path": "...",
        "age_group": "3-4岁"
      }
    ]
  }
]
```

导入映射规则固定如下：

1. `article -> articles`
2. `task -> reading_tasks`
3. `scene -> parenting_scene_tags + parenting_scene_aliases + parenting_scene_recommendations`
4. `recipe -> 先进入统一 recipe 导入结构，当前可继续兼容 nutrition-recipes.json`
5. `assessment -> assessment 元数据 / 题目 / 解读 / 建议结构`

## 存储约束

### 正式内容表

长期作为 AI 问答正式库的表：

1. `articles`
2. `reading_tasks`
3. `parenting_scene_tags`
4. `parenting_scene_aliases`
5. `parenting_scene_recommendations`

### 临时或过渡内容源

当前仍可使用，但应视为过渡源：

1. `NUTRITION_RECIPES`
2. `ASSESSMENT_META`
3. `PARENTING_ARTICLES` 种子常量
4. `READING_TASKS` 种子常量

后续方向：

1. 优先让新增内容直接进入正式表。
2. 种子常量只保留初始化作用。
3. AI 问答优先读正式表，再读必要兜底源。

## 统一召回规则

AI 问答只允许通过 `collectChatReferences()` 这一聚合入口做内容召回。

后续所有知识扩充都按“新增子检索器 + 接入聚合层”的方式处理。

### 子检索器职责

1. `collectArticleReferences()` 只查 `articles`
2. `collectReadingTaskReferences()` 只查 `reading_tasks`
3. `collectSceneReferences()` 只查场景三表
4. `collectRecipeReferences()` 后续独立化
5. `collectAssessmentReferences()` 后续独立化

### 召回顺序

统一优先级固定为：

1. 强关键词命中且年龄匹配的正式内容
2. 强关键词命中且年龄为空的正式通用内容
3. 场景库命中内容
4. 任务库命中内容
5. 文章库命中内容
6. 食谱或测评补充内容
7. 种子兜底内容

### 年龄约束

依赖孩子年龄的能力统一使用：

1. `child_profile.ageGroup`
2. `child_profile.age_range`
3. 服务端通过孩子生日推断的标准年龄段

统一年龄段建议保持为：

1. `0-1岁`
2. `1-2岁`
3. `2-3岁`
4. `3-4岁`
5. `4-5岁`
6. `5-6岁`
7. `6-9岁`
8. `9-12岁`

## 前置条件守卫

凡是依赖个性化内容、年龄判断、孩子阶段判断的接口和页面，统一走以下前置条件：

1. 已登录
2. 已有用户资料
3. 已有孩子档案
4. 已确定 `currentChild`
5. 已确定 `ageGroup`

任何一个条件缺失时，应返回明确引导，而不是继续请求个性化内容。

统一原则：

1. 首页建议类能力缺孩子档案时展示引导卡。
2. 测评、成长记录、周总结缺孩子档案时跳建档流程。
3. AI 问答在缺孩子资料时可以继续回答，但年龄相关建议应降级为通用建议，并显式说明缺少年龄信息。

## 回退与降级策略

### 回答来源分层

`answer_source` 统一使用以下值：

1. `ai`
2. `knowledge_fallback`
3. `seed_knowledge`

含义：

1. `ai`：模型可用，且已基于参考内容生成回答。
2. `knowledge_fallback`：模型不可用，但命中了正式知识库内容。
3. `seed_knowledge`：模型不可用，且只使用种子或元数据兜底。

### 降级顺序

1. `AI + 正式库参考`
2. `正式库回退答案`
3. `种子回退答案`
4. `最小安全通用建议`

### 当前必须保持的降级纪律

1. 服务端失败时，前端本地题库必须立即接管低龄测评题目。
2. 没有孩子档案时，个性化建议不继续请求。
3. 没有年龄信息时，不生成强年龄绑定建议。

## 可观测性要求

后续 AI 问答返回建议统一包含这些观测字段：

1. `answer_source`
2. `sources`
3. `intent`
4. `fallback_reason`
5. `ai_status`

下一步建议扩展：

1. `matched_types`
2. `age_group_used`
3. `reference_count`
4. `retrieval_path`

这样可以快速区分：

1. 命中了什么内容类型
2. 使用了哪个年龄段
3. 走了正式库还是种子兜底
4. 回答差是召回问题还是模型问题

## 后续开发规则

后续补知识库时，执行规则固定如下：

1. 先确认内容属于 `article`、`task`、`scene`、`recipe`、`assessment` 哪一类。
2. 先做导入结构映射，再做入库。
3. 新内容只通过统一召回层接入 AI 问答。
4. 页面层不直接拼接新的知识来源。
5. 每次补库后至少验证一条命中样例和一条降级样例。

## 当前盘点结论

### 已接入

1. `articles`
2. `reading_tasks`
3. `scene` 三表
4. 食谱种子
5. 测评元数据

### 待继续规范化接入

1. `recipe` 独立正式表或统一导入器
2. `assessment` 的题目、结果解读、建议检索结构
3. 知识库导入脚本
4. 后台内容治理入口

### 禁止继续扩散的接入方式

1. 页面层直接拼接新知识源
2. 新增单独的聊天检索入口
3. 同类内容同时维护多套优先级未定义的数据源
4. 缺少年龄和孩子信息时继续请求个性化接口

## 建议的下一步实现顺序

1. 补一份知识库 JSON 导入格式样例文件。
2. 实现统一导入脚本，支持 `article`、`task`、`scene`。
3. 在 AI 问答响应中增加 `matched_types` 与 `age_group_used`。
4. 为每类内容补 1 组回归测试。
5. 逐步把 `recipe` 和 `assessment` 从种子态推进到更标准的正式库结构。
