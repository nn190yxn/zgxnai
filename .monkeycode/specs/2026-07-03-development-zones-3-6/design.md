# 3-6 岁八大发展专区技术设计

## 1. 设计目标

新增 3-6 岁发展专区聚合层，复用现有首页、成长观察、每日练习、育儿锦囊、成长记录和小牛问答能力。第一阶段先用小程序本地配置驱动专区入口和详情，后续再接后端 API 和内容库。

## 2. 范围边界

- 小程序端新增专区配置工具和专区页面。
- 首页新增“3-6 岁发展专区”模块。
- 后端后续新增专区列表和详情接口。
- 不改变现有 tab 结构。
- 不改变现有支付、会员和登录链路。
- 不把缺失年龄默认映射为 `6-9岁`。

## 3. 数据模型

### 3.1 专区配置

`miniprogram/utils/development-zones.js` 导出专区配置和查询函数：

```javascript
{
  code: 'language',
  title: '语言发育',
  subtitle: '从会说，到说清楚、说完整',
  ageGroups: ['3-4岁', '4-5岁', '5-6岁'],
  theme: { color: '#FF6B35', tint: '#FFF3EC' },
  scenarios: [],
  todayPractice: {},
  sevenDayPlan: []
}
```

对应需求：R1.1-R1.3、R2.1-R2.3。

### 3.2 场景结构

每个场景包含：

- `code`
- `title`
- `symptomText`
- `ageGroups`
- `parentCheck`
- `todayAction`
- `durationMinutes`
- `parentScript`
- `observeSignal`
- `chatQuestion`

对应需求：R5.1-R5.4。

### 3.3 年龄段

专区首期只支持：

- `3-4岁`
- `4-5岁`
- `5-6岁`

从孩子生日推断年龄段时，超出 3-6 岁返回空字符串，由页面展示手动选择或补档案提示。

对应需求：R4.2-R4.5。

## 4. 小程序页面设计

### 4.1 首页专区模块

在 `miniprogram/pages/index/index.wxml` 的“从这里开始”前插入“3-6 岁发展专区”：

- 标题：`3-6 岁发展专区`
- 副标题：`语言、感统、专注力、大运动、情绪社交，每天一个小动作。`
- 2 列卡片展示 8 个专区。

对应需求：R3.1-R3.5。

### 4.2 专区详情页

新增 `miniprogram/pages/development/detail/detail`：

- 顶部展示专区标题和副标题。
- 年龄段切换使用当前小程序常规标签样式。
- 表现选择展示当前年龄段可用场景。
- 今日练习卡展示动作、时长、话术和观察指标。
- 底部入口连接小牛问答和成长记录。

对应需求：R4.1-R4.6。

### 4.3 场景详情页

新增 `miniprogram/pages/development/scene/scene`：

- 展示孩子表现和家长判断点。
- 展示一个今日练习。
- “问小牛”写入 `pendingChatQuestion` 后跳转聊天页。
- “记录变化”跳转成长记录页并携带来源参数。

对应需求：R5.1-R5.5。

## 5. 后端设计

后端第二阶段新增：

- `GET /api/v1/development-zones`
- `GET /api/v1/development-zones/:code`

首期可先由小程序本地配置驱动 UI，后端接口保持后续任务。

对应需求：R6.1-R6.3。

## 6. 验证策略

- 使用 `node --check` 校验新增 JS。
- 使用 `npm run lint` 校验后端和小程序语法。
- 使用 `npm test` 跑现有测试。
- 新增可选测试覆盖专区配置完整性和年龄段合法性。
