# 阶段1埋点事件清单

**文档日期**: 2026-06-13  
**用途**: 统一后台经营分析所需事件模型，兼容现有事件，指导阶段1埋点补齐。

## 一、现有已发现事件

当前代码中已经出现的事件：

- `output_submit`
- `retell_complete`
- `task_exposure`
- `task_start`
- `task_complete`
- `path_day_complete`
- `share_entry`
- `share_preview`
- `share_copy`
- `path_dropout`

这些事件已经可以继续保留，但事件含义和事件字段仍需标准化。

## 二、统一事件字段

阶段1建议将 `event_tracks.event_data` 统一扩展为以下结构：

- `module_key`: 所属模块，例如 `membership`、`parenting`、`education`
- `page_key`: 所属页面，例如 `home`, `article_detail`, `knowledge_detail`
- `content_type`: 内容类型，例如 `article`, `reading_task`, `recipe`
- `content_id`: 内容 ID
- `child_id`
- `task_id`
- `path_id`
- `share_source`
- `day_index`
- `score`
- `duration_sec`
- `has_recording`
- `event_meta`

## 三、阶段1必须新增的标准事件

### 3.1 启动与入口

- `app_launch`
- `home_module_click`
- `membership_page_view`

### 3.2 育儿知识

- `article_list_view`
- `article_detail_view`
- `article_favorite_click`
- `article_like_click`
- `article_comment_submit`

### 3.3 能力成长

- `knowledge_chapter_view`
- `knowledge_detail_view`
- `knowledge_practice_start`
- `knowledge_practice_complete`

### 3.4 成长观察

- `assessment_start`
- `assessment_complete`
- `assessment_result_view`

### 3.5 营养模块

- `recipe_list_view`
- `recipe_detail_view`
- `recipe_favorite_click`

### 3.6 会员与支付

- `trial_activate`
- `payment_order_create`
- `payment_order_success`
- `payment_order_failed`

### 3.7 AI 问答

- `ai_chat_submit`
- `ai_chat_response_success`
- `ai_chat_response_fallback`

## 四、现有事件与目标事件映射

| 现有事件 | 建议保留 | 目标归类 | 说明 |
|---|---|---|---|
| `task_exposure` | 是 | `knowledge_detail_view` 的补充曝光事件 | 用于区分曝光和点击 |
| `task_start` | 是 | `knowledge_practice_start` | 继续沿用或做别名归一 |
| `task_complete` | 是 | `knowledge_practice_complete` | 继续沿用或做别名归一 |
| `retell_complete` | 是 | `knowledge_practice_complete` 子类型 | 放入 `event_meta.practice_type` |
| `output_submit` | 是 | 练习提交事件 | 放入知识点或测评子场景 |
| `path_day_complete` | 是 | 路径完成事件 | 用于阶段性完成分析 |
| `path_dropout` | 是 | 路径流失事件 | 用于流失分析 |
| `share_entry` | 是 | 分享入口点击 | 建议带 `share_source` |
| `share_preview` | 是 | 分享预览事件 | 用于分享漏斗 |
| `share_copy` | 是 | 分享复制事件 | 用于转发行为分析 |

## 五、模块级事件口径

### 5.1 活跃用户

活动事件包含：

- 页面进入类事件
- 练习开始/完成类事件
- AI 问答提交类事件
- 会员页访问类事件
- 支付行为类事件

### 5.2 访问量与完成量

- 访问量优先使用 `*_view`
- 开始量优先使用 `*_start`
- 完成量优先使用 `*_complete`
- 支付成功优先使用 `payment_order_success`

## 六、阶段1开发任务

1. 在小程序核心页面补齐标准事件。
2. 在 `trackKbEvent` 中支持统一字段透传。
3. 在后台聚合脚本中兼容历史事件与新标准事件。
4. 为关键漏斗定义固定事件集合。

## 七、回测要求

每个新增事件都必须完成：

1. 前端真实触发验证
2. 后端入库验证
3. 事件字段完整性验证
4. 聚合统计抽样验证
5. 不影响主流程验证
