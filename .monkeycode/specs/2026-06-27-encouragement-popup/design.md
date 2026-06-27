# 鼓励弹窗与情绪价值体系技术设计

## 1. 设计目标

以"情绪鼓励"替代"任务压力"作为用户回访动机。在不同活跃阶段和内容消费节点，通过弹窗和注解传递正向情绪价值，提高家长打开频率。

## 2. 范围边界

- 小程序端：`miniprogram/components/encouragement-popup/`（新增组件）、`miniprogram/pages/index/index.js`、`miniprogram/pages/parenting/article-detail/article-detail.js`
- 后端：`backend/src/mysql-production/server.js` 中扩展留存接口返回鼓励字段，新增鼓励确认接口
- 不修改现有 operationTouchpoint 逻辑、不改变每日计划/成长记录/AI 问答交互、不新增数据库表

## 3. 数据与接口设计

### 3.1 留存接口扩展鼓励字段

在 `GET /api/v1/retention/status` 的返回中追加字段：

```
show_encouragement: boolean
encouragement_level: 1-5
encouragement_message: string
encouragement_type: 'daily_visit' | 'streak_milestone'
```

**判断逻辑**：在 `getUserRetentionState()` 末尾，基于已计算的 `active_events_7d`、`active_events_14d` 和 `event_tracks` 中当日是否已有 `encouragement_shown` 事件，综合判定。

- `encouragement_level` 由连续活跃天数映射：
  - 1-2 天 → level 1
  - 3-4 天 → level 2
  - 5-6 天 → level 3
  - 7-13 天 → level 4
  - 14+ 天 → level 5
- `show_encouragement` 在以下条件满足时为 true：
  1. 用户已登录
  2. 有活跃记录（active_events_7d > 0）
  3. 当日 event_tracks 中无 `encouragement_shown` 事件
- `encouragement_message` 为对应级别的文案，后端返回字符串，前端直接展示。
- 未登录时 `show_encouragement` 为 false。

对应需求：E1.1、E1.2、E1.3、E1.6。

### 3.2 鼓励确认接口

新增 `POST /api/v1/encouragement/acknowledge`：

- 鉴权：`authenticateToken`
- 请求体：`{ level: 1-5, type: 'daily_visit' | 'streak_milestone' }`
- 行为：向 `event_tracks` 写入 `encouragement_shown` 事件，包含 `level`、`type` 等上下文
- 返回：`{ success: true }`

前端在弹窗关闭时调用此接口，确保当日不重复弹出。

对应需求：E1.3、E1.5。

### 3.3 鼓励文案常量

后端在 `getUserRetentionState()` 附近维护鼓励文案映射表：

```javascript
const ENCOURAGEMENT_MESSAGES = {
  1: '每天花几分钟关注孩子，你已经是很有心的家长了',
  2: '连续记录了几天，你的坚持正在变成孩子成长中最珍贵的东西',
  3: '能持续关注孩子成长的家长，本身就闪闪发光',
  4: '哇，连续一周都在记录成长，你是超级棒的家长！',
  5: '你一直在用心陪伴孩子成长，这是最长情的礼物'
};
```

对应需求：E1.2、E1.4。

## 4. 小程序组件设计

### 4.1 鼓励弹窗组件

新建 `miniprogram/components/encouragement-popup/`：

**文件**：
- `encouragement-popup.js` — 组件逻辑
- `encouragement-popup.wxml` — 模板
- `encouragement-popup.wxss` — 样式
- `encouragement-popup.json` — 组件配置

**属性**：
- `visible`: Boolean，控制显隐
- `message`: String，鼓励文案
- `level`: Number，1-5，影响视觉风格（颜色/动画梯度）

**外观**：
- 全屏半透明遮罩（`.modal-mask` 风格，与项目现有模态框一致）
- 居中白色圆角卡片
- 顶部大号鼓励图标/插图区（按 level 展示不同色彩）
- 中间鼓励文案，字体略大、配色温暖
- 底部"知道了"按钮，圆角主色调

**关闭行为**：
- 点击"知道了"按钮 → 触发 `onConfirm` 事件
- 点击遮罩 → 触发 `onCancel` 事件
- 两种关闭均设 `visible: false` 并通知父页面

对应需求：E1.4、E1.5。

### 4.2 首页集成

在 `miniprogram/pages/index/index.js` 的 `onShow` 中：

1. `loadRetentionState()` 成功后，检查 `data.show_encouragement`
2. 若为 true，设置鼓励弹窗数据并展示
3. 弹窗关闭后调用 `POST /api/v1/encouragement/acknowledge`

在 `miniprogram/pages/index/index.wxml` 中引入组件：
```xml
<encouragement-popup
  visible="{{showEncouragementPopup}}"
  message="{{encouragementMessage}}"
  level="{{encouragementLevel}}"
  bind:confirm="onEncouragementConfirm"
  bind:cancel="onEncouragementCancel"
/>
```

对应需求：E1.1、E1.3、E1.5、E1.7。

### 4.3 文章阅读注解

在 `miniprogram/pages/parenting/article-detail/article-detail.js` 中：

**阅读完成检测**：
- 监听页面滚动，当 `scrollTop + clientHeight >= scrollHeight * 0.7` 时标记为已读完
- 同时启动 60 秒计时器，超时也标记为已读完
- 两个条件任意满足即触发判定

**注解触发逻辑**：
```javascript
// 30% 概率 + 单日最多 2 次
var todayKey = 'encouragement_annotation_' + new Date().toISOString().slice(0, 10);
var todayCount = wx.getStorageSync(todayKey) || 0;
var shouldShow = todayCount < 2 && Math.random() < 0.3 && !this.data._annotationShown;
```

**注解样式**：
- 页面底部浮层，非模态（不遮挡内容）
- 白色半透明背景，圆角上边
- 简短文案 + 关闭图标
- 5 秒自动渐隐
- 点击任意位置关闭

**状态管理**：
- `this.data._annotationShown` 标记同一页面不重复弹出
- `wx.setStorageSync(todayKey, todayCount + 1)` 更新当日计数
- `onUnload` 自动清理

对应需求：E2.1-E2.6。

## 5. 后端设计

### 5.1 鼓励状态计算

在 `getUserRetentionState()` 末尾追加鼓励判断：

```
1. 若 !state.logged_in → show_encouragement = false
2. 若 state.is_active === false → show_encouragement = false
3. 查 event_tracks 当日是否已有 encouragement_shown → 有则 false
4. 按 active_events_7d 活跃天数映射 encouragement_level
5. 从 ENCOURAGEMENT_MESSAGES 取对应文案
```

### 5.2 鼓励确认路由

```
POST {prefix}/encouragement/acknowledge  →  authenticateToken  →  encouragementAcknowledgeHandler
```

handler 逻辑：
```
1. 读 level 和 type
2. INSERT INTO event_tracks (user_id, event_type, event_data, session_id)
   VALUES (?, 'encouragement_shown', JSON {level, type}, '')
3. 返回 { success: true }
```

### 5.3 事件类型规范

新增 event_type：`encouragement_shown`

event_data JSON 内容：
```json
{ "level": 3, "type": "daily_visit" }
```

## 6. 验证策略

- 使用 `node --check` 校验后端 JS 语法
- 使用 `npm run lint` 做后端和小程序语法检查
- 确认未登录用户不触发鼓励弹窗
- 确认同一用户当日只弹一次
- 确认安全模式下不触发

## 7. 渐进上线顺序

1. 后端扩展留存接口鼓励字段 + 新增确认接口
2. 前端新建鼓励弹窗组件
3. 首页集成鼓励弹窗触发展示
4. 文章详情页集成阅读注解
