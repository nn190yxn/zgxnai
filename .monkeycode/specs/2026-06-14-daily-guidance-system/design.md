# 小牛育儿日常陪伴闭环技术设计

**文档日期**: 2026-06-14  
**对应需求**: `.monkeycode/specs/2026-06-14-daily-guidance-system/requirements.md`  
**需求代号**: `daily-guidance-system`

## 一、设计目标

本设计围绕“每日建议、场景搜索、成长记录、周总结”四条主线展开，目标是：

1. 在现有小牛育儿代码基础上，以最小正确改动建立可用闭环。
2. 复用现有内容库、会员体系、测评结果和埋点基础，降低首期建设成本。
3. 保持服务端改动只影响小牛育儿，不影响 `我赢AI`。
4. 每一阶段都具备可回测、可回滚、可观测能力。

## 二、整体架构

### 2.1 系统组成

本期继续基于现有小程序与 Node + MySQL 服务扩展，采用以下结构：

1. 小程序前端页面层
2. 小程序 API 聚合层
3. 推荐与总结规则服务层
4. MySQL 业务数据层

### 2.2 入口与边界

- 小程序业务 API: `https://api.woyai.cn/api/v1`
- 当前生产进程: `niuniu-backend`
- 当前生产部署根目录: `/home/ubuntu/niuniu-parenting`

边界要求：

- 所有新增接口继续挂载在小牛育儿现有 API 下。
- 数据表只写入小牛育儿现有 MySQL。
- 不新增任何与 `woying-backend` 共用的配置、路由或运行进程。

### 2.3 模块拆分建议

当前 `backend/src/mysql-production/server.js` 已较大，本期建议按功能抽离模块，保留主文件注册路由。

建议新增目录：

- `backend/src/mysql-production/daily-guidance/`
  - `daily-plan-service.js`
  - `scene-search-service.js`
  - `growth-record-service.js`
  - `weekly-summary-service.js`
  - `recommendation-rules.js`
  - `scene-taxonomy.js`

如果首期进度优先，可先在 `server.js` 注册接口，再把纯逻辑逐步抽到以上模块。

## 三、前端设计

### 3.1 页面改动范围

建议改动以下页面和入口：

- 首页 `miniprogram/pages/index` 或当前首页聚合页
- 搜索页 `miniprogram/pages/parenting/search`
- 新增成长记录页
- 新增成长记录历史页
- 新增周总结页
- 会员中心承接页

### 3.2 首页今日计划卡

首页首屏新增 `今日育儿计划` 区块，展示 `3` 张卡片。

卡片字段：

- `id`
- `type`
- `title`
- `reason`
- `actionText`
- `durationMinutes`
- `targetType`
- `targetId`
- `completed`

交互要求：

- 首屏先渲染骨架态。
- 接口失败时展示默认新手计划。
- 完成计划后局部刷新，不强制整页重载。

### 3.3 搜索页场景化升级

搜索页新增以下区域：

- 常见问题快捷入口
- 场景分类入口
- 方案卡结果区
- 其他结果区

结果排序：

1. `solution_card`
2. `task_card`
3. `article_card`
4. `nutrition_card`

### 3.4 成长记录页

成长记录页采用快填模式。

组件建议：

- 孩子切换器
- 当日状态选项组
- 备注输入框
- 提交按钮

维度建议：

- `meal_status`
- `sleep_status`
- `emotion_status`
- `task_completion_status`
- `stool_status`
- `parent_note`

### 3.5 周总结页

周总结页建议分五块：

- 本周一句话概览
- 做得好的地方
- 需要关注的地方
- 下周建议
- 推荐内容

普通用户和会员用户用同一页面结构，通过字段控制内容深度。

## 四、后端设计

### 4.1 接口清单

#### 今日育儿计划

- `GET /api/v1/daily-plan?childId=1&date=2026-06-14`
- `POST /api/v1/daily-plan/complete`

#### 场景化搜索

- `GET /api/v1/search/scenes`
- `GET /api/v1/search/solutions?keyword=不吃饭&childId=1&ageGroup=3-4岁`

#### 成长记录

- `GET /api/v1/growth-records?childId=1&date=2026-06-14`
- `POST /api/v1/growth-records`
- `GET /api/v1/growth-records/history?childId=1&page=1&pageSize=14`
- `GET /api/v1/growth-records/summary?childId=1&period=7d`

#### 每周成长总结

- `GET /api/v1/weekly-summary?childId=1&weekStart=2026-06-08`

### 4.2 接口返回约定

继续沿用现有返回结构：

```json
{
  "success": true,
  "data": {}
}
```

错误返回继续保持：

```json
{
  "success": false,
  "message": "错误说明"
}
```

### 4.3 今日育儿计划服务

#### 输入数据

- 用户信息
- 孩子资料
- 最近测评结果
- 最近 7 天行为事件
- 现有育儿文章
- 现有能力成长任务
- 营养建议内容

#### 推荐流程

建议分四步：

1. 建立候选池
2. 根据年龄段过滤
3. 根据测评短板和最近行为打分
4. 按类型约束输出前三项

#### 评分建议

- 年龄匹配: `+40`
- 低分维度关联: `+30`
- 近 7 天未触达模块补足: `+20`
- 最近已完成同类动作降权: `-25`
- 会员专属增强项: `+10`

#### 完成逻辑

`POST /daily-plan/complete` 记录用户完成情况，同时写埋点事件，并用于周总结统计。

### 4.4 场景化搜索服务

#### 核心数据结构

搜索服务需要三层词表：

1. 标准场景标签
2. 别名词表
3. 结果推荐关系

示例：

- 标准场景: `feeding_refuse_meal`
- 别名词: `不吃饭`、`挑食`、`喂饭难`
- 推荐关系: 文章、任务、营养建议、处理原则

#### 命中策略

首期建议采用规则匹配：

1. 精确别名命中
2. 关键词包含命中
3. 场景分类内模糊匹配
4. 兜底回退到现有文章搜索

#### 输出结构

`search/solutions` 返回：

- `sceneKey`
- `sceneTitle`
- `principle`
- `suggestedAction`
- `ageGroup`
- `results`

### 4.5 成长记录服务

#### 单日记录模型

每个孩子每天保留一条主记录，支持覆盖更新。

更新策略：

- 若当天不存在记录，则插入。
- 若当天存在记录，则更新。
- 保留 `created_at` 与 `updated_at`，便于趋势和操作审计。

#### 历史读取

历史读取按日期倒序分页，支持最近 7 天和最近 30 天快速读取。

#### 趋势摘要

`growth-records/summary` 输出规则化趋势，例如：

- 睡眠连续 `5` 天稳定
- 情绪波动较上周下降
- 本周任务完成率 `57%`

### 4.6 每周成长总结服务

#### 输入来源

- 成长记录周汇总
- 今日计划完成汇总
- 最近任务完成记录
- 最近内容消费记录
- 最近测评结果

#### 生成流程

建议分五步：

1. 读取周维度基础数据
2. 计算各维度状态标签
3. 根据规则模板生成结论
4. 生成下周建议
5. 生成推荐内容列表

#### 文案模板要求

- 文案需要温和、具体、可执行。
- 文案必须与数据条件一一对应。
- 文案首句优先输出结论。

#### 缓存策略

周总结建议按 `child_id + week_start` 做缓存。

缓存刷新时机：

- 新增或修改当周成长记录
- 完成今日计划
- 重新进入周总结页且缓存过期

## 五、数据库设计

### 5.1 新增表

#### `daily_plan_records`

用途：保存每日生成结果，避免每次首页重复计算。

字段建议：

- `id`
- `user_id`
- `child_id`
- `plan_date`
- `plan_type`
- `title`
- `reason_text`
- `action_text`
- `duration_minutes`
- `target_type`
- `target_id`
- `score`
- `status`
- `created_at`
- `updated_at`

索引建议：

- `uniq_child_date_target (child_id, plan_date, target_type, target_id)`
- `idx_user_date (user_id, plan_date)`

#### `daily_plan_completions`

用途：保存用户完成动作。

字段建议：

- `id`
- `daily_plan_record_id`
- `user_id`
- `child_id`
- `completed_at`
- `created_at`

#### `search_scene_tags`

用途：保存标准场景标签。

字段建议：

- `id`
- `scene_key`
- `scene_title`
- `scene_category`
- `principle_text`
- `suggested_action`
- `status`
- `sort_order`
- `created_at`
- `updated_at`

#### `search_scene_aliases`

用途：保存搜索别名。

字段建议：

- `id`
- `scene_key`
- `alias_text`
- `match_type`
- `created_at`

#### `search_scene_recommendations`

用途：保存场景与结果关联。

字段建议：

- `id`
- `scene_key`
- `result_type`
- `target_id`
- `target_title`
- `age_group`
- `sort_order`
- `created_at`
- `updated_at`

#### `growth_daily_records`

用途：保存单日成长记录主表。

字段建议：

- `id`
- `user_id`
- `child_id`
- `record_date`
- `meal_status`
- `sleep_status`
- `emotion_status`
- `task_completion_status`
- `stool_status`
- `parent_note`
- `created_at`
- `updated_at`

索引建议：

- `uniq_child_date (child_id, record_date)`
- `idx_user_child (user_id, child_id)`

#### `weekly_growth_summaries`

用途：缓存周总结结果。

字段建议：

- `id`
- `user_id`
- `child_id`
- `week_start`
- `week_end`
- `summary_payload`
- `summary_version`
- `created_at`
- `updated_at`

索引建议：

- `uniq_child_week (child_id, week_start)`

### 5.2 迁移策略

建议新增独立 SQL 文件，例如：

- `backend/sql/2026-06-14-daily-guidance-system.sql`

执行要求：

- 生产执行前先备份相关表结构。
- 先建表，再发版接口。
- 建表脚本必须可重复执行，优先使用 `IF NOT EXISTS`。

## 六、推荐规则设计

### 6.1 候选源

候选源按优先级分为：

1. 能力成长任务
2. 育儿文章
3. 营养建议
4. 习惯提醒模板

### 6.2 年龄映射

继续沿用现有年龄段：

- `2-3岁`
- `3-4岁`
- `4-5岁`
- `5-6岁`
- `6-9岁`

### 6.3 计划类型约束

每日计划输出建议：

- 至少 `1` 条能力或互动建议
- 至少 `1` 条生活或营养建议
- 第 `3` 条由短板和行为决定

## 七、埋点设计

### 7.1 新增事件

- `daily_plan_view`
- `daily_plan_click`
- `daily_plan_complete`
- `scene_search_exposure`
- `scene_search_submit`
- `scene_solution_click`
- `growth_record_open`
- `growth_record_submit`
- `weekly_summary_view`
- `weekly_summary_action_click`

### 7.2 事件字段

所有新增事件建议统一透传：

- `module_key`
- `content_type`
- `content_id`
- `child_id`
- `membership_type`
- `scene_key`
- `plan_type`
- `record_date`
- `week_start`

### 7.3 后台联动

这些埋点需要进入后续后台分析，用于观察：

- 今日计划曝光和完成漏斗
- 场景搜索热词和命中率
- 成长记录活跃度
- 周总结查看率和后续动作率

## 八、失败兜底设计

### 8.1 今日计划兜底

- 接口失败时返回本地默认计划卡。
- 无孩子资料时提示先完善资料。

### 8.2 搜索兜底

- 场景未命中时回退到现有文章搜索。
- 结果过少时补充相关分类热门内容。

### 8.3 成长记录兜底

- 提交失败时保留页面选择状态。
- 再次提交前提示用户网络状态。

### 8.4 周总结兜底

- 无足够数据时返回轻量版总结。
- 规则服务异常时展示基础趋势和推荐入口。

## 九、发布与回滚设计

### 9.1 开发顺序

建议按以下顺序交付：

1. 数据表与接口骨架
2. 今日计划首页能力
3. 成长记录能力
4. 周总结能力
5. 场景化搜索能力
6. 会员承接优化

### 9.2 发布前动作

每轮发版前必须完成：

- Git 检查点
- 数据表结构备份
- 目标服务文件备份
- 接口与页面回测
- 埋点字段核对

### 9.3 回滚策略

回滚按三层执行：

1. 代码回滚到上一个稳定提交
2. 服务端恢复备份文件并重启 `niuniu-backend`
3. 新增表保留，功能通过开关停用或路由下线

### 9.4 功能开关建议

首期建议增加以下运行时开关：

- `enable_daily_plan`
- `enable_scene_search`
- `enable_growth_record`
- `enable_weekly_summary`

发布策略：

- 开发环境先全开
- 生产环境先灰度给内部测试账号
- 回测通过后再全量打开

## 十、回测设计

### 10.1 回测原则

每个模块都要执行接口层、前端页面层和生产验证层三层回测。

每次回测记录至少包含：

- 提交号
- 回测账号类型
- 孩子年龄段
- 操作路径
- 结果截图或结果摘要
- 结论

### 10.2 分模块回测矩阵

#### 今日计划

接口回测：

- 有孩子且有测评数据
- 有孩子但无测评数据
- 无孩子档案
- 会员用户与普通用户

页面回测：

- 首页加载
- 卡片点击跳转
- 完成后状态刷新
- 弱网和空数据兜底

生产回测：

- 至少 `3` 个年龄段账号
- 至少 `1` 个新用户账号

#### 场景化搜索

接口回测：

- 精确别名词命中
- 模糊口语词命中
- 未命中兜底回退

页面回测：

- 分类点击
- 搜索提交
- 方案卡点击
- 其他结果点击

生产回测：

- 高频问题词至少 `30` 个

#### 成长记录

接口回测：

- 新增记录
- 覆盖更新
- 历史读取
- 趋势摘要读取

页面回测：

- 孩子切换
- 快捷选项填写
- 备注填写
- 提交成功回显

生产回测：

- 连续 `7` 天样本链路验证

#### 周总结

接口回测：

- 有完整记录用户
- 只有部分记录用户
- 无记录用户

页面回测：

- 普通用户展示
- 会员用户展示
- 推荐内容跳转

生产回测：

- 对照原始记录逐条核验结论准确性

### 10.3 上线卡点

满足以下条件后才允许进入上线：

1. 所有新增接口已通过本地语法和逻辑自测。
2. 小程序页面在开发者工具中完成完整链路回测。
3. 至少一轮真机回测完成。
4. 埋点在生产日志或后台统计中可见。
5. 服务端发版和回滚路径已演练。

## 十一、实施建议

建议后续执行时同步产出以下补充文档：

- `tasklist.md`: 拆分开发任务、负责人和阶段回测点
- `api-contract.md`: 接口字段与示例
- `event-catalog.md`: 埋点补充清单

本设计优先保证首期上线可用，再迭代规则复杂度和个性化深度。
