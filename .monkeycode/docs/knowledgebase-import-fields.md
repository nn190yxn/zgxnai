# 知识库导入字段说明

本文件用于约束后续知识库 JSON 的字段写法，避免每次补库都重新对字段。

当前统一导入脚本位置：

- [import-knowledge-base.js](/workspace/backend/src/scripts/import-knowledge-base.js:1)

当前样例文件位置：

- [knowledgebase-sample.json](/workspace/backend/examples/knowledgebase-sample.json:1)

## 通用规则

1. 顶层必须是 JSON 数组。
2. 每条记录必须有 `type`。
3. 当前支持 `article`、`task`、`scene`。
4. 文本字段优先传纯文本，避免 HTML。
5. 年龄段统一使用项目标准写法。

## 标准年龄段

统一使用：

1. `0-1岁`
2. `1-2岁`
3. `2-3岁`
4. `3-4岁`
5. `4-5岁`
6. `5-6岁`
7. `6-9岁`
8. `9-12岁`

## article

### 必填字段

1. `type`
2. `title`

### 推荐字段

1. `summary`
2. `content`
3. `category`
4. `sub_category`
5. `age_group`
6. `tags`
7. `author`
8. `evidence_level`
9. `is_published`

### 字段说明

1. `title`: 文章唯一标题，当前导入按标题做幂等更新。
2. `summary`: 用于卡片摘要、AI 问答短摘要。
3. `content`: 正文内容，建议完整可读。
4. `category`: 一级分类，如 `行为习惯`、`情绪管理`、`认知发展`。
5. `sub_category`: 二级分类，如 `作业启动`、`睡前节奏`。
6. `age_group`: 年龄段。
7. `tags`: 可传数组或逗号分隔字符串。
8. `evidence_level`: 证据等级，如 `A`、`B`。
9. `is_published`: 省略时默认 `1`。

### 示例

```json
{
  "type": "article",
  "title": "孩子总在写作业前拖拉，家里怎么先把开始动作立起来",
  "summary": "先缩短开始动作，再固定一句提示语，让孩子更容易进入作业状态。",
  "content": "很多孩子拖拉，卡住的不是能力，而是开始动作太大。",
  "category": "行为习惯",
  "sub_category": "作业启动",
  "age_group": "6-9岁",
  "tags": ["写作业", "拖拉", "开始动作"],
  "author": "小牛育儿内容组",
  "evidence_level": "A"
}
```

## task

### 必填字段

1. `type`
2. `task_code`
3. `title`
4. `subject_code`

### 推荐字段

1. `age_range`
2. `difficulty`
3. `duration`
4. `material`
5. `objective`
6. `steps`
7. `parent_prompt`
8. `content`
9. `tips`
10. `example_answer`

### 字段说明

1. `task_code`: 任务唯一编码，当前导入按它幂等更新。
2. `subject_code`: 当前建议优先用 `reading`、`expression`、`logic`。
3. `age_range`: 年龄段。
4. `difficulty`: 正整数。
5. `duration`: 分钟数，正整数。
6. `steps`: 可传数组，导入时会拼成换行文本。
7. `tips`: 可传数组，导入时会拼成换行文本。

### 示例

```json
{
  "type": "task",
  "task_code": "read_69_dinner_retell",
  "title": "晚饭后复述三句话",
  "subject_code": "reading",
  "age_range": "6-9岁",
  "difficulty": 1,
  "duration": 10,
  "material": "当天共读的绘本或课文",
  "objective": "帮助孩子把看过的内容用自己的话说出来。",
  "steps": [
    "先让孩子说出今天读了谁、在哪里、做了什么。",
    "家长追问一题：最重要的一件事是什么。",
    "最后让孩子用三句话重新讲一遍。"
  ],
  "parent_prompt": "你先说第一句，我帮你接第二句。",
  "content": "这个任务适合晚饭后做，时间短，容易坚持。",
  "tips": ["孩子卡住时先提示人物或场景。", "先求说出来，再求说完整。"]
}
```

## scene

### 必填字段

1. `type`
2. `scene_key`
3. `scene_title`
4. `scene_category`

### 推荐字段

1. `aliases`
2. `principle_text`
3. `suggested_action`
4. `recommendations`

### 字段说明

1. `scene_key`: 场景唯一键，当前导入按它幂等更新主场景。
2. `aliases`: 场景别名数组，用于检索召回。
3. `principle_text`: 该场景下的处理原则。
4. `suggested_action`: 家长下一步可执行动作。
5. `recommendations`: 推荐结果数组。

### recommendations 子字段

1. `result_type`
2. `title`
3. `summary`
4. `target_type`
5. `target_id`
6. `target_path`
7. `age_group`

当前导入幂等键为：

1. `scene_key`
2. `result_type`
3. `title`

### 示例

```json
{
  "type": "scene",
  "scene_key": "bedtime_wash_resistance",
  "scene_title": "睡前洗漱磨蹭",
  "scene_category": "作息习惯",
  "aliases": ["睡前洗漱拖拉", "刷牙磨蹭", "晚上不肯洗漱"],
  "principle_text": "先缩短指令，再把睡前流程固定成孩子能预期的顺序。",
  "suggested_action": "把睡前流程固定成洗脸、刷牙、上床三步。",
  "recommendations": [
    {
      "result_type": "parenting_article",
      "title": "睡前总拖拉时，先把提醒句子缩短",
      "summary": "家长先减少长篇提醒，孩子更容易动起来。",
      "target_type": "parenting_article",
      "target_id": "",
      "target_path": "",
      "age_group": "3-6岁"
    }
  ]
}
```

## 导入命令

### 仅校验结构

```bash
node src/scripts/import-knowledge-base.js backend/examples/knowledgebase-sample.json --validate-only
```

### 连库干跑

```bash
node src/scripts/import-knowledge-base.js <your-file>.json --dry-run
```

### 实际导入

```bash
node src/scripts/import-knowledge-base.js <your-file>.json
```

## 当前限制

1. 当前导入脚本只支持 `article`、`task`、`scene`。
2. `recipe` 和 `assessment` 还没有进入统一导入器。
3. `article` 当前按 `title` 做幂等更新，所以标题应保持稳定。
4. `scene` 当前会新增或更新主表、别名表、推荐表，默认不清理旧别名和旧推荐。
