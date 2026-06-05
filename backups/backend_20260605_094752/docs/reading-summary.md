# 阅读部分后端改进总结

## 已完成的后端改进

### 1. 数据库扩展
`reading_tasks` 表新增7个字段：
- `image_url` - 任务配图
- `icon_url` - 任务图标
- `cover_image` - 封面大图
- `audio_url` - 音频朗读
- `video_url` - 视频讲解
- `tips` - 家长提示
- `example_answer` - 示例回答

### 2. API 扩展
`/api/v1/education/tasks/today` 现在返回完整字段，包括：
- material, objective, steps, parent_prompt
- image_url, icon_url, cover_image
- audio_url, video_url
- tips, example_answer

### 3. 数据扩充
从2条扩充到6条阅读任务，覆盖3-6岁不同年龄段：
1. 绘本封面观察（3-4岁）
2. 画面找一找（3-4岁）
3. 故事顺序排序（4-5岁）
4. 角色表情猜一猜（4-5岁）
5. 因果关系推理（5-6岁）
6. 故事复述（5-6岁）

## 关键问题

**前端目前完全硬编码，没有调用后端 API。**

这意味着：
- 后端再多的数据，前端也看不到
- 需要前端修改 `loadReadingTasks` 函数，改为调用后端 API

## 图片需求清单

### 阅读任务（必须）
- 每个任务需要1张封面配图
- 每个步骤需要1张步骤配图

### 图标（建议）
- 6个任务各需要1个图标

### 绘本推荐（建议）
- 每本推荐绘本1张封面图

### 食谱（建议）
- 每道食谱1张成品图

## 下一步

1. 准备图片资源（任务配图、步骤图、图标）
2. 前端修改 `loadReadingTasks` 调用后端 API
3. 前端 WXML 添加图片展示
