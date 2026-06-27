# 孩子档案个性化上下文技术设计

## 1. 设计目标

通过统一孩子档案上下文，让育儿锦囊推荐和 AI 问答都能基于当前孩子的年龄、性格标签和关注点工作。核心目标是消除无上下文默认问题和泛化年龄段误导，让用户清楚感知推荐和回答来自当前孩子档案。

## 2. 范围边界

- 小程序端复用 `app.getCurrentChild()` 和 `app.normalizeChild()`，新增或扩展轻量上下文构建函数。
- 后端复用 `resolveChatChildContext()`、`buildChatChildContext()`、`normalizeChatAgeGroup()` 和现有聊天接口。
- 育儿锦囊继续使用 `/parenting/articles` 的 `age_group` 参数。
- 不新增数据库表，不改变文章数据结构，不改变历史聊天消息结构。

## 3. 数据与接口设计

### 3.1 小程序孩子上下文

在 `miniprogram/app.js` 中扩展统一上下文函数，建议返回：

```javascript
{
  id,
  name,
  birthday,
  age_group,
  tags,
  concerns,
  source
}
```

- `tags` 来自现有孩子档案标签字段。
- `concerns` 从孩子档案中已有关注点、偏好或同义字段归一化为字符串数组。
- `age_group` 通过生日或显式年龄段推断，缺失时返回空字符串。

对应需求：R3.1、R4.1、R4.3。

### 3.2 AI 聊天请求

`app.chat(message)` 保持接口地址不变，把 `child_profile` 替换为统一上下文输出，避免把未归一化字段直接交给后端。

对应需求：R3.1。

### 3.3 后端聊天上下文

扩展 `buildChatChildContext(childProfile, source)` 返回：

```javascript
{
  ageGroup,
  childName,
  tags,
  concerns,
  source,
  profileMissing
}
```

Prompt 拼接时增加一段简短档案说明：

- 有姓名时说明当前孩子姓名。
- 有年龄段时说明年龄段。
- 有性格标签时说明孩子特点。
- 有关注点时说明家长当前关注主题。

对应需求：R3.2、R3.3、R3.5。

### 3.4 年龄缺失处理

保持 `buildChatAgeClarificationAnswer()` 作为缺失年龄的兜底回答入口。调整年龄段选择链路，确保：

1. 用户消息中显式年龄优先。
2. 档案年龄段其次。
3. 两者都缺失时触发年龄补充提示。
4. 不把缺失年龄映射为 `6-9岁`。

对应需求：R3.4、R4.1、R4.2、R4.3。

## 4. 小程序页面设计

### 4.1 首页入口

当前首页已移除无上下文 `pendingChatQuestion` 注入，下一步保留该方向：

- 主入口跳转育儿锦囊。
- 孩子档案缺少年龄时，引导补全档案。
- 仅文章、测评、用户输入等明确上下文可预填 AI 问题。

对应需求：R1.1-R1.4。

### 4.2 育儿锦囊首页

`parenting.js` 已有 `inferChildAgeRange(child)`，应抽到公共工具或复用到文章列表页。页面数据增加推荐提示：

- `recommendationLabel`: 如 `按牛牛 4-5岁推荐`。
- `recommendationFallback`: 如 `补充孩子生日后，会优先推荐对应年龄内容`。

请求 `/parenting/articles` 时仅在得到合法育儿年龄段时传 `age_group`。

对应需求：R2.1、R2.4、R2.5、R4.4。

### 4.3 文章列表页

`article-list.js` 在 `onLoad` 时根据入口参数和当前孩子决定初始筛选：

- URL 已传 `age_group` 或 `ageGroup` 时，使用传入值。
- 用户从筛选条手动选择后，更新 `currentAge` 并保持该选择。
- 普通入口进入且当前孩子有合法年龄段时，默认设置 `currentAge`。

对应需求：R2.2、R2.3、R2.5。

## 5. 后端设计

### 5.1 上下文字段归一化

新增轻量数组归一化函数，支持以下输入：

- 数组字段。
- JSON 字符串数组。
- 逗号或顿号分隔字符串。

字段兼容候选：

- 标签：`tags`、`personality_tags`、`trait_tags`。
- 关注点：`concerns`、`focus_points`、`parenting_concerns`、`goals`。

对应需求：R3.2、R3.3。

### 5.2 Prompt 注入

在聊天 Prompt 构建处加入档案上下文描述。描述应简短并位于用户问题前，避免压缩回答空间。

示例：

```text
孩子档案：牛牛，4-5岁；特点：敏感、慢热；家长关注：睡前拖延、情绪表达。
```

对应需求：R3.3、R3.5。

### 5.3 年龄合法范围

后端聊天可支持更宽年龄段；育儿锦囊请求只传 `VALID_PARENTING_AGE_GROUPS` 中的值。前端列表页也按同一集合做映射，无法映射时不传年龄筛选。

对应需求：R4.4。

## 6. 验证策略

- 使用 `node --check` 校验修改的 JS 文件。
- 使用根目录 `npm test` 覆盖新增纯函数和既有鼓励弹窗测试。
- 使用根目录 `npm run lint` 做后端和小程序语法检查。
- 可选属性测试覆盖年龄输入映射，确保缺失年龄不会产生合法年龄段。

## 7. 渐进实现顺序

1. 先抽取或补齐孩子上下文工具，统一年龄段和数组字段归一化。
2. 接入 `app.chat()` 和后端 `buildChatChildContext()`。
3. 接入育儿锦囊首页和文章列表页默认年龄推荐提示。
4. 补轻量测试和 lint 校验。
