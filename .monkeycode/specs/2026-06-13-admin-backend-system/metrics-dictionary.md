# 阶段1指标口径字典

**文档日期**: 2026-06-13  
**用途**: 统一后台核心经营指标的计算方法、数据来源、抽样验证方式。

## 一、用户指标

### 1.1 累计注册用户数

- 定义：`users` 表累计去重用户数
- 主数据源：`users`
- 统计口径：`COUNT(*)`
- 回测：抽样核对指定时间前后的总量变化

### 1.2 今日注册用户数

- 定义：当天 `users.created_at` 落入统计区间的用户数
- 主数据源：`users`
- 统计口径：按自然日切分
- 回测：抽样对比用户明细列表与聚合结果

### 1.3 DAU

- 定义：当天在 `event_tracks` 中至少有一条行为事件的去重用户数
- 主数据源：`event_tracks`
- 统计口径：`COUNT(DISTINCT user_id)`
- 回测：抽样核对 10 个用户事件明细

### 1.4 WAU

- 定义：近 7 天内在 `event_tracks` 中有行为事件的去重用户数
- 主数据源：`event_tracks`
- 统计口径：滚动 7 日

### 1.5 MAU

- 定义：近 30 天内在 `event_tracks` 中有行为事件的去重用户数
- 主数据源：`event_tracks`
- 统计口径：滚动 30 日

### 1.6 有孩子档案用户数

- 定义：至少存在一条 `children.user_id` 记录的去重用户数
- 主数据源：`children`

## 二、会员与收入指标

### 2.1 当前有效会员数

- 定义：`user_memberships` 中 `status` 表示有效，且 `current_end_date` 晚于当前时间的去重用户数
- 主数据源：`user_memberships`
- 说明：阶段1需固化有效状态枚举
- 回测：抽样核对 20 个会员样本

### 2.2 累计付费用户数

- 定义：在 `payment_orders` 中存在至少一笔 `paid` 订单的去重用户数
- 主数据源：`payment_orders`
- 说明：按用户去重，不按订单累加

### 2.3 今日支付成功订单数

- 定义：当天 `paid_at` 落入统计区间且 `status = 'paid'` 的订单数
- 主数据源：`payment_orders`

### 2.4 今日收入

- 定义：当天支付成功订单的 `amount` 汇总
- 主数据源：`payment_orders`
- 说明：阶段1需要确认生产库 `amount` 的单位
- 回测：抽样核对订单明细金额求和

### 2.5 套餐销量结构

- 定义：按 `plan_code` 汇总支付成功订单数和收入
- 主数据源：`payment_orders`
- 维度：`month`、`quarter`、`year`

### 2.6 试用用户数

- 定义：`user_memberships.is_trial_used = 1` 的去重用户数
- 主数据源：`user_memberships`

### 2.7 试用转付费转化率

- 定义：使用过试用且后续有 `paid` 订单的用户数 / 使用过试用的用户数
- 主数据源：`user_memberships` + `payment_orders`
- 回测：抽样核对试用样本用户名单

## 三、内容与功能指标

### 3.1 文章浏览量

- 定义：文章详情访问事件总数
- 主数据源：`event_tracks`
- 当前状态：阶段1需新增标准事件 `article_detail_view`
- 过渡方案：可结合 `articles.read_count` 与行为事件做双口径核验

### 3.2 文章收藏量

- 定义：文章收藏成功事件数或 `user_favorites` 中 `item_type = 'article'` 的记录数
- 主数据源：`user_favorites`
- 当前状态：需在阶段1确认文章收藏写入策略

### 3.3 能力成长任务访问量

- 定义：能力点详情访问次数
- 主数据源：`event_tracks`
- 当前状态：阶段1需新增标准事件 `knowledge_detail_view`

### 3.4 能力成长任务完成量

- 定义：任务完成事件数，或 `task_progress.status = 'completed'` 的记录数
- 主数据源：`task_progress` + `event_tracks`

### 3.5 能力成长完成率

- 定义：任务完成量 / 任务开始量
- 主数据源：`event_tracks`
- 当前已存在事件：`task_start`、`task_complete`

### 3.6 成长观察完成率

- 定义：成长观察提交成功数 / 成长观察开始数
- 主数据源：`assessment_records` + `event_tracks`
- 当前状态：阶段1需新增标准事件 `assessment_start`、`assessment_complete`

### 3.7 AI 问答次数

- 定义：AI 问答提交成功次数
- 主数据源：`event_tracks`
- 当前状态：阶段1需新增标准事件 `ai_chat_submit`

## 四、漏斗指标

### 4.1 首页到会员页转化率

- 定义：进入会员页用户数 / 点击首页模块用户数
- 主数据源：`event_tracks`
- 前提：阶段1需补 `home_module_click` 和 `membership_page_view`

### 4.2 AI 到付费转化率

- 定义：使用 AI 问答后在指定窗口期内支付成功的用户数 / 使用 AI 问答用户数
- 主数据源：`event_tracks` + `payment_orders`

### 4.3 能力成长到付费转化率

- 定义：访问能力成长后在指定窗口期内支付成功的用户数 / 访问能力成长用户数
- 主数据源：`event_tracks` + `payment_orders`

## 五、回测规则

每个指标上线前必须完成：

1. 原始表抽样验证
2. 空区间验证
3. 边界时间验证
4. 去重逻辑验证
5. 与历史数据兼容验证

## 六、阶段1需先确认的事项

1. `payment_orders.amount` 的生产单位是元还是分。
2. `user_memberships.status` 的有效状态枚举。
3. 文章收藏是否统一写入 `user_favorites`。
4. AI 问答行为事件的标准上报方式。
