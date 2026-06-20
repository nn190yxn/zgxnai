# 育儿锦囊结构化改造开发计划

## 目标

三项改造合并执行：
1. 锦囊内容从"扁平文本"升级为"结构化卡片"（action 型 + insight 型两种标准），AI 问答输出结构化 JSON，前端分层渲染
2. 育儿知识板块内部加一层"理论/方法"分类，家长可按需筛选
3. 优化"育儿知识"与"能力成长训练"两个板块的命名和入口文案，让家长一眼看懂区别

## 两种锦囊，两种"标配"

育儿锦囊天然有两类，不应该用同一把尺子量：

| 类型 | 数量 | 作用 | 成熟产品标配 |
|------|------|------|-------------|
| **action 型**（可执行） | ~2990 | 告诉家长"怎么做" | 动作句 + 一句为什么 + 展开看详情 |
| **insight 型**（认知提升） | ~4015 | 让家长"懂得为什么" | 吸引人的标题 + 柔和化的理论解释 + 展开看原文 |

action 型对标你之前说的"串一条妈妈手链"。insight 型对标"孩子的安全感从哪里来"——它的价值不是给动作，是让家长理解原理后自己生出判断力。

## 现状与差距

| 层 | 当前 | 目标 |
|----|------|------|
| 锦囊内容 | `content` 文本字段，动作和解释混在一起 | `display_title` + `display_text` + `deep_link`，新旧字段共存 |
| AI 回答 | `answer` 扁平 Markdown 字符串 | 结构化 JSON：`judgment` / `tips[]`（含 action 型和 insight 型） |
| 前端渲染 | `<rich-text>` 一次性渲染全部 | 两种卡片：action 卡片（why 可展开）+ insight 卡片（标题吸引点击） |
| 追问机制 | 无 | 每个回答底部生成快捷追问按钮 |

## 开发原则（防结构失稳）

### 1. 向后兼容铁律

**每层改造必须保留旧路径的完整功能。** 规则：

- 后端新增字段 → 旧的 `content` 字段不删、不改、不迁移
- AI 响应新增字段 → `answer` 保持原样输出，新字段为**追加字段**
- 前端新增渲染 → `<rich-text>` 保留为兜底路径，新组件按响应字段是否存在决定用哪套渲染
- 任何改造不允许删除现有一行生产代码 → 只允许新增或在现有函数末尾追加逻辑

### 2. 渐进上线策略

| 阶段 | 后端 | 前端 | 验收标准 |
|------|------|------|---------|
| Phase 1 | 表结构 + 分类脚本 | **不动** | `verify:tips-structure` 全部通过 |
| Phase 2 | API 响应 + 字段 | **不动** | 旧前端调用新 API 行为完全不变 |
| Phase 3 | **不动** | 两种卡片组件 + 渲染分支 | 新字段存在则走新渲染，否则走 old rich-text |
| Phase 4 | insight 型标题改写与文本柔和化 | **不动** | insight 型锦囊 display_title 改写率 > 80% |
| Phase 5 | 追问生成 | 追问按钮 | 追问后不丢上下文 |

**每个 Phase 独立上线，出问题只回滚当 Phase，不影响全局。**

### 3. 验证标准

每 Phase 完成后必须通过：

- `npm run lint` — 语法检查（已有）
- `npm run verify:tips-structure` — 锦囊结构检查（新增）
- `npm run verify:chat-response` — AI 响应格式检查（新增）
- `npm run verify:scene-keywords-db` — 场景关键词 44/44（已有）
- `npm run verify:scene-density` — 密度审计（已有）
- 手动验收：小程序聊天页旧版行为无退化

### 4. 零破坏性变更承诺

- 不删除 `articles` 表现有字段（新增 `content_form` 字段，不影响旧查询）
- 不修改 `parenting_tips` 现有字段类型
- 不删除任何 API 响应已有的字段
- 不删除前端已有的任何页面或组件
- 不修改小程序页面路由或底部 tab 结构
- 所有新字段名前缀为 `structured_` 或使用独立命名空间，避免与未来字段冲突

### 5. 移动端排版铁律

手机上 375px 宽，信息密度和可读性必须同时保证。以下规则贯穿所有 Phase 的前端实现：

**字体层级（不可超出 4 级）**：

| 层级 | 字号 | 字重 | 用途 | 最多字数 |
|------|------|------|------|---------|
| L1 主标题 | 32rpx | 600 | action 卡片标题、insight 卡片标题、tab 名称 | 15 字 |
| L2 正文 | 28rpx | 400 | 卡片正文、judgment 判断句 | 120 字 |
| L3 辅助 | 24rpx | 400 | 来源标注、"阅读全文"链接、追问按钮 | 20 字 |
| L4 标签 | 22rpx | 500 | 类型标签（学方法/学理论）、分类标签 | 4 字 |

**间距标准**：

| 元素 | 间距 |
|------|------|
| 卡片之间 | 24rpx |
| 卡片内边距 | 24rpx（四面一致） |
| 标题与正文之间 | 12rpx |
| 正文与底部链接之间 | 16rpx |
| Tab 之间 | 0（紧贴），选中加底部 4rpx 色条 |
| 按钮最小点击区域 | 88rpx × 44rpx |

**重点突出规则**：

- **action 卡片**：主标题（动作句）使用 `var(--text)`（#1B2A1B）加粗，正文使用 `var(--text-secondary)`（#7A6660），"为什么有效"展开区用 `var(--primary-bg)`（#FFF3ED）浅底 + 左边 `var(--primary)`（#FF6B35）4rpx 色条区分
- **insight 卡片**：标题用吸引式问句加粗 `var(--text)`，正文使用 `var(--text-secondary)`，底部"阅读全文"使用 `var(--primary)`（#FF6B35）
- **judgment 判断句**：顶部独立一行，左边 `var(--primary)` 4rpx 色条，字号 30rpx，颜色 `var(--text)`（#1B2A1B）
- **追问按钮**：浅底 `var(--primary-bg)` + `var(--text)` 深色文字，不抢主色 CTA 的视觉权重，圆角 8rpx，最多一行放 2 个

**文本截断**：

- 卡片标题超过 15 字 → 省略号截断，不换行
- 卡片正文超过 3 行 → 省略号截断 + "展开"按钮
- insight 正文不走截断，但控制在 120 字内从源头保证不撑破卡片

**颜色规范（复用现有 CSS 变量，不新增色值）**：

| 用途 | CSS 变量 | 色值 | 说明 |
|------|---------|------|------|
| 主文字 | `var(--text)` | #1B2A1B | 标题、判断句 |
| 次要文字 | `var(--text-secondary)` | #7A6660 | insight 正文、展开区正文 |
| 辅助文字 | `var(--text-muted)` | #A08C86 | 来源标注、时间 |
| 品牌/链接 | `var(--primary)` | #FF6B35 | 阅读全文、追问文字、强调色条、选中态 |
| 浅背景 | `var(--primary-bg)` | #FFF3ED | 展开区背景、标签背景 |
| 卡片底 | `var(--white)` | #FFFFFF | 卡片底色 |
| 边框 | `var(--border)` | #E9D7CF | 卡片分割线 |
| 页面底 | `var(--bg)` | #FAF6F3 | 卡片列表底色（继承全局） |

---

## 板块命名与入口优化

### 当前问题

首页育儿功能入口有两个板块，家长区分困难：

| 入口标题 | 副标题 | 本质 |
|---------|--------|------|
| 能力成长训练 | 在家开展练习 | 带娃动手做任务的工具 |
| 育儿知识内容 | 查看场景方法 | 家长看文章学知识的平台 |

问题在于：
- "能力成长训练"太抽象——什么能力？什么成长？
- "育儿知识内容"是冗余词组——"知识"和"内容"重复
- 两个都以"育儿/能力"开头，看起来像同一件事的不同叫法

### 新命名方案

| 旧 | 新 | 新副标题 | 区分逻辑 |
|----|-----|---------|---------|
| 能力成长训练 | **每日训练** | 今天带娃练什么 | 动词"练"=家长带孩子做 |
| 育儿知识内容 | **育儿锦囊** | 遇到问题来这里找方法 | 名词"锦囊"=家长自己查和学 |

改动范围：
- `index.wxml` 第 53-69 行：修改 `.module-name` 和 `.module-desc` 文本
- `index.js` 第 316-317 行：修改 `getPlanTypeLabel` 映射
- `index.js` 第 24-25 行、第 189-194 行：修改 `currentFocus` 和 `todaySuggestion` 文案
- `index.js` 第 728、741 行：修改 `ensureFeatureEnabled` 提示文案

**不新增文件、不改路由、不改页面路径**。

### 改造时间

与 Phase 3（前端渲染改造）同步上线，不单独占一个 Phase。

---

## 育儿知识内部：理论 / 方法拆分

### 为什么要在育儿知识内部拆

育儿知识板块目前按**话题**分了 5 类（情绪管理/行为习惯/认知发展/社交能力/营养健康），但没有区分"讲道理"还是"教做法"。

家长进来看一篇文章，可能是"儿童大脑前额叶发育到几岁才成熟"（纯理论），也可能是"怎么训练孩子独立吃饭"（纯方法）。混在一起，找起来累。

拆成"理论 / 方法"两层后：

```
育儿锦囊（入口）
├── 学理论          ← 新 tab
│   ├── 情绪管理
│   ├── 认知发展
│   └── ...
└── 学方法          ← 新 tab
    ├── 行为习惯
    ├── 社交能力
    └── ...
```

### articles 表变更

在 `articles` 表追加一个字段：

```sql
ALTER TABLE articles
  ADD COLUMN content_form VARCHAR(10) DEFAULT NULL AFTER category,
  ADD INDEX idx_content_form (is_published, content_form);
```

| 值 | 含义 | 判定规则 |
|----|------|---------|
| `'theory'` | 纯理论/原理/认知类文章 | 正文以解释机制为主，无操作步骤 |
| `'method'` | 可执行/方法/技巧类文章 | 正文包含操作步骤、话术、具体做法 |
| `'both'` | 理论+方法都有 | 先讲原理后给方法 |
| `NULL` | 未分类 | 初始默认，走旧全量列表 |

### 自动分类脚本

新增 `src/scripts/classify-articles-form.js`，与 Phase 1 的 `structure-parenting-tips.js` 一起执行。

**判定逻辑**：

```
输入: title + summary + content

Step 1: 理论特征检测
  匹配 2 个以上 THEORY_PATTERNS:
    - "研究表明|数据表明|发现|发育|成熟|阶段|规律|机制"
    - "是指|指的是|概念|定义|理论|框架"
    - "前额叶|大脑|神经|皮层|激素|基因"
    - "EEG|fMRI|实验|测量|统计|样本"
    → theoryScore += 1

Step 2: 方法特征检测
  匹配 2 个以上 METHOD_PATTERNS:
    - "第一步|第二步|可以试着|让孩子|每天做|先做|然后再"
    - "准备|材料|工具|时间|场地|前提"
    - "注意|避免|不要|当心|小心"
    - "比如|例如|示范|话术|这么说"
    → methodScore += 1

Step 3: 判定
  if theoryScore >= 2 && methodScore == 0 → content_form = 'theory'
  if methodScore >= 2 && theoryScore == 0 → content_form = 'method'
  if theoryScore >= 2 && methodScore >= 2 → content_form = 'both'
  else → content_form = NULL
```

### 前端改造

育儿锦囊列表页追加一层 tab 切换：

```xml
<!-- 育儿锦囊列表页顶部 -->
<view class="form-tabs">
  <view class="form-tab {{currentForm === 'all' ? 'active' : ''}}" bindtap="switchForm" data-form="all">全部</view>
  <view class="form-tab {{currentForm === 'method' ? 'active' : ''}}" bindtap="switchForm" data-form="method">学方法</view>
  <view class="form-tab {{currentForm === 'theory' ? 'active' : ''}}" bindtap="switchForm" data-form="theory">学理论</view>
</view>

<!-- 下面保持现有的 5 个话题分类不变 -->
<view class="category-tabs">...</view>
```

API 追加参数：`GET /parenting/articles?content_form=theory&category=情绪管理`

### 与锦囊结构化改造的关系

- `articles.content_form` 与 `parenting_tips.display_type`（action / insight）是**独立的两个维度**
- 方法型文章（content_form='method'）对应的锦囊大概率是 action 型（display_type='action'）
- 理论型文章（content_form='theory'）对应的锦囊大概率是 insight 型（display_type='insight'）
- 但互不绑定——可能存在 method 型文章拆出 insight 型锦囊（比如"先理解儿童撒谎心理，再给话术"），各走各的判定
- Phase 1 两个分类脚本一起跑，两条不交叉

### 影响范围

| 文件 | 操作 | 风险 |
|------|------|------|
| `articles` 表 | 新增 `content_form` 字段 | 低 |
| `src/scripts/classify-articles-form.js` | 新增 | 低 |
| `src/mysql-production/server.js` | `/parenting/articles` 路由追加 `content_form` 筛选参数 | 低（可选参数，不传则无影响） |
| `miniprogram/pages/parenting/parenting.wxml` | 追加 form-tabs | 低 |
| `miniprogram/pages/parenting/parenting.js` | 追加 `switchForm` 方法 | 低 |

---

## Phase 1：锦囊表结构 + articles 理论/方法分类 + 自动分类脚本

### 1.1 新增字段

在 `parenting_tips` 表追加字段（不删不改现有字段）：

```sql
ALTER TABLE parenting_tips
  ADD COLUMN display_title VARCHAR(200) DEFAULT NULL AFTER content,
  ADD COLUMN display_text VARCHAR(400) DEFAULT NULL AFTER display_title,
  ADD COLUMN display_type VARCHAR(20) NOT NULL DEFAULT 'raw' AFTER display_text,
  ADD COLUMN display_source_type VARCHAR(20) DEFAULT NULL AFTER display_type,
  ADD COLUMN display_source_id INT DEFAULT NULL AFTER display_source_type,
  ADD COLUMN display_priority INT NOT NULL DEFAULT 0 AFTER display_source_id,
  ADD INDEX idx_display_type (is_active, display_type);
```

字段说明：

| 字段 | 含义 | action 型值 | insight 型值 |
|------|------|------------|-------------|
| `display_type` | 展示类型 | `'action'` | `'insight'` |
| `display_title` | 前端展示用的标题 | 动作摘要句（40字内） | 吸引人的问题/陈述式标题 |
| `display_text` | 前端展示用的正文 | 动作 + 一句 why（120字内） | 柔和化的理论解释（140-200字） |
| `display_source_type` | 深度链接类型 | `'article'` / `'task'` / `'recipe'` |
| `display_source_id` | 深度链接 ID | 对应的 source_article_id |
| `display_priority` | 排序权重 | 高温场景相关的高分 | 高质量理论内容的居中分 |

`display_type` 取值：
- `'raw'`：未处理，初始默认值，走旧渲染
- `'action'`：已完成拆分的 action 型锦囊，走 action 卡片渲染
- `'insight'`：已完成标题改写和文本柔和化的 insight 型锦囊，走 insight 卡片渲染

### 1.2 自动分类脚本

新增 `src/scripts/structure-parenting-tips.js`，一次性执行，幂等。

**Step 1：判断类型**

```
输入: content 文本 + content_type

if content_type === 'actionable' || content_type === 'stepwise'
  && content 匹配至少 3 个 ACTION_PATTERNS:
    → display_type = 'action'

else if content_type === 'knowledge' || content_type === 'caution'
  && content 匹配至少 2 个 NEGATIVE_PATTERNS (但是/然而/指的是/什么是):
    → display_type = 'insight'

else:
    → display_type = 'raw' (待人工判定)
```

**Step 2：action 型填充**

```
对 display_type = 'action' 的条目：

- display_title = 提取第一个动作句，截断到 40 字
  - 匹配: "可以试着|让孩子|先做|每天|把手|用手指|第一步"

- display_text = 动作句 + "——" + 因果句
  - 因果句匹配: "因为|原因是|这能帮|这能让|目的是"

- 保留 source_article_id 作为 display_source_id
```

**Step 3：insight 型占位**

```
对 display_type = 'insight' 的条目：

- display_title = NULL（待 Phase 4 人工/AI 批量改写）
- display_text = NULL（待 Phase 4 柔和化）
- display_source_id = source_article_id
```

**Step 4：raw 型标记**

```
对 display_type = 'raw' 的条目：

display_title = NULL, display_text = NULL
→ 前端走旧 rich-text 降级渲染
```

### 1.3 验收

```
npm run verify:tips-structure
```

输出：
- `display_type` 分布统计：action / insight / raw 各多少条
- action 型 `display_title` 非空率 >= 95%
- action 型 `display_text` 长度 <= 200
- 旧字段（content/title/category）完全不变
- `display_type = 'raw'` 占比 < 15%

### 1.4 执行

```bash
node src/migrations/add-tips-display-fields.js
node src/migrations/add-articles-content-form.js
node src/scripts/structure-parenting-tips.js
node src/scripts/classify-articles-form.js
npm run verify:tips-structure
npm run verify:articles-form
npm run verify:scene-keywords-db
npm run lint
```

---

## Phase 2：AI 回答结构化

### 2.1 响应格式追加

`chatHandler` 返回的 JSON 在现有字段外**追加**新字段。旧字段一个不动。

```json
{
  "success": true,
  "data": {
    "answer": "现有的纯文本 Markdown（保留不变）",

    "structured": {
      "available": true,
      "judgment": "这是入园分离焦虑的一种典型表现",
      "actions": [
        "每天入园前和孩子一起把妈妈手链戴在手腕上",
        "在门口做一个秘密手势，老师帮助孩子回给你"
      ],
      "tips": [
        {
          "id": 1234,
          "type": "action",
          "title": "串一条妈妈手链给孩子戴着入园",
          "text": "每天入园前把一颗扣子穿进手链，亲一下扣子——触觉提醒物能让孩子在想念时获得安全感",
          "source_type": "article",
          "source_id": 567,
          "source_title": "入园分离焦虑的5个实用技巧"
        },
        {
          "id": 2831,
          "type": "insight",
          "title": "孩子的安全感，从妈妈离开后还能回来开始",
          "text": "一岁前宝宝的大脑还没有建立'看不见也还存在'的概念。你离开房间他就以为你消失了，所以会哭闹。这个能力要到八到十个月才慢慢建立——每次你离开又回来，都是在帮他搭建这道心理基石",
          "source_type": "article",
          "source_id": 912,
          "source_title": "依恋理论：为什么分离会让幼儿焦虑"
        }
      ],
      "why_text": "学龄前儿童的客体永存概念还在发展中...",
      "followups": [
        "为什么这样做有效？",
        "有没有更简单的做法？"
      ]
    }
  }
}
```

### 2.2 构建逻辑

新增 `buildStructuredResponse()` 函数（追加在 `buildChatAnswer` 之后）：

```
输入: answer (旧 Markdown), references[], matched_types[]

Step 1: 从 references 中提取 parenting_tips
  - 按 sourceType === 'tip' 筛选
  - 取 display_priority 最高的 3 条

Step 2: 从 answer 中提取 judgment
  - 匹配第一个 ### 标题或第一段的前 50 字作为判断句

Step 3: 生成 followups
  - 按意图类型模板生成：通用 "为什么有效？" + "还有更简单的做法吗？"
  - 情绪类追加 "孩子多大的时候会好转？"

Step 4: 构建 structured 对象
  - 字段缺失时用 null，不抛异常
  - structured.available 只在至少有一条 tip 时为 true
```

### 2.3 安全措施

```javascript
// 关键：structured 构建必须包裹在 try-catch 内
// 失败不影响 answer 字段的正常返回
try {
  result.data.structured = buildStructuredResponse(answer, references);
} catch (err) {
  console.error('[chat] structured build failed', err.message);
  result.data.structured = { available: false };
}
```

### 2.4 验证

```
npm run verify:chat-response
```

验收项：
- 旧格式字段（answer/sources/matched_types）值与改造前一致
- structured.available 为 true 时 tips 数组非空
- structured 构建失败时 answer 仍然正常返回
- 无新字段导致的 JSON 解析异常

---

## Phase 3：前端分层渲染 + 板块命名上线 + 理论/方法 Tab

本 Phase 三件事并行上线：聊天页结构化渲染、首页板块改名、育儿锦囊列表页理论/方法 tab。

### 3.1 新增 tip-card 组件

`miniprogram/components/tip-card/` 四文件：

```
tip-card.wxml  —  卡片模板
tip-card.wxss  —  卡片样式
tip-card.js    —  展开/收起逻辑 + 跳转
tip-card.json  —  { "component": true }
```

**组件属性**：

```javascript
properties: {
  type: String,         // "action" | "insight"
  title: String,        // 卡片标题
  text: String,         // 卡片正文
  sourceType: String,   // "article"
  sourceId: Number,
  sourceTitle: String,
  expanded: Boolean     // 初始是否展开，默认 false
}
```

**两种卡片的差异**（以下标注均对应移动端排版规范）：

action 型卡片 — 重点在"动作句"，一行扫完就知道做什么：
```
┌──────────────────────────────────┐  ← 24rpx 内边距
│  串一条妈妈手链给孩子戴着入园    │  ← L1 32rpx var(--text) #1B2A1B 加粗
│                                  │  ← 12rpx 间距
│  每天入园前把一颗扣子穿进手链，  │  ← L2 28rpx var(--text-secondary) #7A6660
│  亲一下扣子——触觉提醒物能在     │     最多3行
│  孩子想念时提供安全感...         │
│                                  │  ← 16rpx 间距
│  ▼ 为什么这样有效？             │  ← L3 24rpx var(--primary) #FF6B35 点击展开
│  ┌─ 展开区 var(--primary-bg) ─┐  │     #FFF3ED 背景
│  │ 触觉+嗅觉的双重锚定让       │  │  ← L2 var(--text-secondary) #7A6660
│  │ 孩子在陌生环境也能找到      │  │     左边 4rpx var(--primary) 色条
│  │ 家的感觉                    │  │
│  └──────────────────────────┘  │
│  查看全文：入园分离焦虑的5个技巧  │  ← L3 24rpx var(--primary) #FF6B35
└──────────────────────────────────┘
```

insight 型卡片 — 重点在"标题吸引点进去"，正文让人愿意读完：
```
┌──────────────────────────────────┐  ← 24rpx 内边距
│  宝宝以为你走了就消失了——关于   │  ← L1 32rpx var(--text) #1B2A1B 加粗
│  安全感的第一个真相              │     最多15字
│                                  │  ← 12rpx 间距
│  不到一岁的宝宝，大脑还没学会   │  ← L2 28rpx var(--text-secondary) #7A6660
│  一件事——看不见的东西，其实还   │     走满120字，不截断
│  在。你走出房间，在他的世界里   │
│  你就真的消失了。所以他会哭、   │
│  会抓着你不放。这不是黏人，是   │
│  他的大脑还没长出"物体不会消失" │
│  这根弦...                      │
│                                  │  ← 16rpx 间距
│  阅读全文：依恋理论为什么分离   │  ← L3 24rpx var(--primary) #FF6B35
│  会让幼儿焦虑                    │
└──────────────────────────────────┘
```

insight 卡片**没有展开按钮**——它本身就是"解释"，不需要再嵌套一层。如果想深入了解，直接点"阅读全文"跳原文。

### 3.2 聊天页改造

**不删不改** `parseMarkdownToNodes()` 和现有的 `<rich-text>` 逻辑。

改造方式：在 `chat.js` 的消息处理函数末尾追加分支判断。

```javascript
// chat.js — 在现有 sendMessage 回调末尾追加
if (result.structured && result.structured.available) {
  // 新渲染路径
  const structuredNodes = buildStructuredNodes(result.structured);
  this.setData({
    'botMessage.structured': structuredNodes,
    'botMessage.renderMode': 'structured'
  });
} else {
  // 旧渲染路径（保持不变）
  this.setData({
    'botMessage.markdownNodes': parseMarkdownToNodes(result.answer),
    'botMessage.renderMode': 'legacy'
  });
}
```

`chat.wxml` 追加渲染分支：

```xml
<!-- 旧渲染路径（保留不变） -->
<rich-text wx:if="{{item.renderMode === 'legacy'}}" nodes="{{item.markdownNodes}}"></rich-text>

<!-- 新渲染路径（新增） -->
<view wx:if="{{item.renderMode === 'structured'}}" class="structured-answer">
  <view class="judgment-text">{{item.structured.judgment}}</view>
  <tip-card wx:for="{{item.structured.tips}}" wx:key="id"
    action="{{item.action}}" rationale="{{item.rationale}}"
    sourceType="{{item.sourceType}}" sourceId="{{item.sourceId}}"
    sourceTitle="{{item.sourceTitle}}" />
  <view class="followup-buttons">
    <button wx:for="{{item.structured.followups}}" wx:key="*this"
      bindtap="onFollowupTap">{{item}}</button>
  </view>
</view>
```

### 3.3 回退机制

如果 `structured.available === false` 或新组件渲染异常 → 自动回退 old rich-text 路径。回退对用户透明，不弹错误提示。

### 3.3b 移动端排版验收

Phase 3 所有前端改动合并前，必须逐项通过以下目视检查（在微信开发者工具 375px 模拟器上完成）：

- [ ] 卡片标题在 375px 宽度下不换行（15 字以内截断省略号）
- [ ] 卡片正文在 iOS 和 Android 真机上均不过度撑高（3 行 + 省略号）
- [ ] 展开/收起的动画无跳动、无闪烁
- [ ] 追问按钮每行 2 个，间距均匀，不会单个按钮独占一行
- [ ] 理论/方法 tab 与话题分类 tab 两层不混淆——form-tabs 底部有 4rpx 色条选中态，category-tabs 保持原有样式
- [ ] 卡片底色为 `var(--white)`（#FFFFFF），在深色模式小程序里不反色
- [ ] 首页板块卡片标题改动后在 375px 宽度下不换行（"育儿锦囊""每日训练"均为 4 字，安全）
- [ ] 旧 rich-text 渲染路径无退化——换行、加粗、列表均正常
- [ ] 所有新增颜色均使用现有 CSS 变量（`var(--primary)`、`var(--primary-bg)`、`var(--text)`、`var(--text-secondary)`、`var(--text-muted)`、`var(--white)`、`var(--border)`），**不引入新色值**

### 3.4 首页板块命名上线

修改 `miniprogram/pages/index/index.wxml`：

```xml
<!-- 旧 -->
<text class="module-name">能力成长训练</text>
<text class="module-desc">在家开展练习</text>

<!-- 新 -->
<text class="module-name">每日训练</text>
<text class="module-desc">今天带娃练什么</text>

<!-- 旧 -->
<text class="module-name">育儿知识内容</text>
<text class="module-desc">查看场景方法</text>

<!-- 新 -->
<text class="module-name">育儿锦囊</text>
<text class="module-desc">遇到问题来这里找方法</text>
```

修改 `miniprogram/pages/index/index.js`：

```javascript
// getPlanTypeLabel 映射更新
ability_task: '每日训练',
parenting_article: '育儿锦囊',

// currentFocus / todaySuggestion 文案更新
currentFocus: '围绕成长观察、每日训练和成长记录安排今天的育儿重点',
todaySuggestion: '从成长观察、每日训练或成长记录中选择一个开始',

// ensureFeatureEnabled 提示更新
'每日训练暂未开放'
'育儿锦囊暂未开放'
```

### 3.5 育儿锦囊列表页：理论/方法 Tab

修改 `miniprogram/pages/parenting/parenting.wxml`，在现有 category-tabs 上方追加：

```xml
<view class="form-tabs">
  <view class="form-tab {{currentForm === 'all' ? 'active' : ''}}"
    bindtap="switchForm" data-form="all">全部</view>
  <view class="form-tab {{currentForm === 'method' ? 'active' : ''}}"
    bindtap="switchForm" data-form="method">学方法</view>
  <view class="form-tab {{currentForm === 'theory' ? 'active' : ''}}"
    bindtap="switchForm" data-form="theory">学理论</view>
</view>
```

修改 `miniprogram/pages/parenting/parenting.js`：

```javascript
// data 新增
currentForm: 'all',

// 新增方法
switchForm: function(e) {
  const form = e.currentTarget.dataset.form;
  this.setData({ currentForm: form, articles: [], page: 1 });
  this.loadArticles();
},

// loadArticles 追加参数
data: {
  content_form: this.data.currentForm === 'all' ? '' : this.data.currentForm,
  // ... 现有参数不变
}
```

---

## Phase 4：insight 型标题改写 + 文本柔和化

### 4.1 问题

Phase 1 自动分类后，insight 型锦囊（~3000-4000 条）的 `display_title` 和 `display_text` 为 NULL。它们的内容是纯理论表述，标题是机器生成的截断句：

```
title: "蒙台梭利建议为孩子准备一个小花园或种植角"
content: "客体永存性是皮亚杰提出的核心概念..."
```

这类内容有价值但当前形态劝退家长——标题像教科书章节目录，正文像论文摘要。

### 4.2 改写目标

不补动作句。改写只做两件事：

| 改写项 | 改前 | 改后 |
|--------|------|------|
| 标题 | 截断的原文首句 | 一个问题/陈述/对比，让家长想点进去 |
| 正文 | 论文风格原文 | 把"研究发现/表明/证实"换成日常语气，120-200 字 |

**改写前**：
> title: "蒙台梭利建议为孩子准备一个小花园或种植角"
> text: "客体永存性是皮亚杰提出的核心概念，指儿童在8-12个月时才逐渐理解物体即使看不见也仍然存在。这一认知发展里程碑对分离焦虑有直接影响..."

**改写后**：
> title: "宝宝以为你走了就消失了——关于安全感的第一个真相"
> text: "不到一岁的宝宝，大脑还没学会一件事——看不见的东西，其实还在。你走出房间，在他的世界里你就真的消失了。所以他会哭、会抓着你不放。这不是黏人，是他的大脑还没长出'物体不会消失'这根弦。每次你离开又回来，都是在帮他慢慢搭起这根弦"

### 4.3 改写方法

**不依赖 AI 大模型（仍不可用）**。走两段式处理：

**第一段：脚本自动生成 title 候选**

新增 `src/scripts/rewrite-insight-titles.js`：

```
输入: content 文本 + category + concise_domain

Step 1: 提取主题词
  - 匹配 "是...概念|指的是...|...是指|所谓...就是" → 提取核心名词
  - 从 category 和 concise_domain 取板块标签

Step 2: 套用标题模板
  模板库按 domain 分类：
    认知学习 → "为什么你家宝宝{X}？"
    情绪心理 → "当孩子{Y}时，他的大脑其实在..."
    学校适应 → "{Z}的背后，藏着孩子没说出口的话"
    行为管理 → "别急着纠正——先看懂{X}在告诉什么"
    身体健康 → "关于{Y}，老一辈说的对还是错？"

Step 3: 从 content 中提取可填入 {X}{Y}{Z} 的关键词
  - 高频名词: 安全感、注意力、分离、哭闹、抗拒、拖延...
  - 优先选 content 中出现 2 次以上的词

输出: 3 个候选 title，标记 best candidate
```

**第二段：人工 + 规则柔和化正文**

新增 `src/scripts/soften-insight-texts.js`：

```
输入: content 文本

Step 1: 去学术化替换（规则匹配）
  - "研究表明" → "很多爸妈发现"
  - "数据证实" → "实际上"
  - "皮亚杰/蒙台梭利/维果茨基指出" → "有研究发现"
  - "认知发展里程碑" → "大脑发育的一个关键节点"
  - "客体永存性" → "物体不会消失的概念"
  - "过渡性客体" → "能让他安心的东西"
  - "依恋理论" → "孩子跟你的连接方式"
  - "执行功能" → "大脑的自我控制能力"

Step 2: 句式改写
  - 倒装句 → 正装句
  - "在...过程中" → 删掉或改成"当...的时候"
  - 连续两个"的" → 拆成两句

Step 3: 加一句家长视角的"翻译"
  - 在文末追加: "简单说就是：{一句话总结}"
  - 从 content 中提取非学术的核心含义

输出: display_text（120-200 字）
```

### 4.4 验收

```
npm run verify:insight-rewrite
```

输出：
- insight 型锦囊 `display_title` 非空率 >= 80%
- insight 型锦囊 `display_text` 非空率 >= 80%
- 改写后的 title 平均长度 12-25 字（确保可读）
- 改写后的 text 中"研究表明/指出/证实"出现率下降 > 70%
- `display_type = 'insight'` 且有 `display_title` 和 `display_text` 的条目 = 前端可渲染

### 4.5 渐进覆盖

优先改写 `cognitive_learning`（认知学习，673 条）和 `emotion_psychology`（情绪心理，674 条）板块——这两个板块 insight 占比最高、家长最需要"看懂理论"。

每改写一个板块就跑一次验收，验证覆盖率上升。

---

## Phase 5：追问机制

### 5.1 快捷追问按钮

Phase 2 已在 `structured.followups` 中返回追问候选。Phase 5 实现点击后自动发送。

```javascript
// chat.js
onFollowupTap(e) {
  const question = e.currentTarget.dataset.question;
  this.sendMessage(question);  // 复用现有发送逻辑
}
```

追问文本携带上下文：

```
POST /api/v1/chat
{
  "message": "为什么这样做有效？",
  "session_id": "上一轮的 session_id",
  "followup_to": "上一轮的 message_id"
}
```

### 5.2 追问上下文保持

后端在 `chatHandler` 中检测 `followup_to` 字段：
- 存在 → 把上一轮回答的 `references` 和 `structured.tips` 注入本轮 prompt
- AI 基于上一轮的同一批知识片段回答追问，不重新检索

---

## 影响范围总表

| 文件 | Phase | 操作 | 风险 |
|------|-------|------|------|
| `parenting_tips` 表 | 1 | ADD COLUMN（6 字段） | 低 |
| `articles` 表 | 1 | ADD COLUMN `content_form` | 低 |
| `src/migrations/add-tips-display-fields.js` | 1 | 新增 | 低 |
| `src/migrations/add-articles-content-form.js` | 1 | 新增 | 低 |
| `src/scripts/structure-parenting-tips.js` | 1 | 新增，幂等脚本 | 低 |
| `src/scripts/classify-articles-form.js` | 1 | 新增，幂等脚本 | 低 |
| `src/scripts/rewrite-insight-titles.js` | 4 | 新增 | 低 |
| `src/scripts/soften-insight-texts.js` | 4 | 新增 | 低 |
| `src/scripts/verify-tips-structure.js` | 1 | 新增验证 | 无 |
| `src/scripts/verify-articles-form.js` | 1 | 新增验证 | 无 |
| `src/scripts/verify-insight-rewrite.js` | 4 | 新增验证 | 无 |
| `src/mysql-production/server.js` | 1,2,5 | 追加 `/parenting/articles` 筛选 + `buildStructuredResponse()` + 追问处理 | **中** |
| `src/scripts/verify-chat-response.js` | 2 | 新增验证 | 无 |
| `miniprogram/components/tip-card/*` | 3 | 新增组件（支持两种 type） | 低 |
| `miniprogram/pages/chat/chat.wxml` | 3 | 追加渲染分支 | **中** |
| `miniprogram/pages/chat/chat.js` | 3,5 | 追加结构化渲染 + `onFollowupTap()` | **中** |
| `miniprogram/pages/chat/chat.wxss` | 3 | 追加卡片样式 | 低 |
| `miniprogram/pages/parenting/parenting.wxml` | 3 | 追加 form-tabs（理论/方法） | 低 |
| `miniprogram/pages/parenting/parenting.js` | 3 | 追加 `switchForm` 方法 | 低 |
| `miniprogram/pages/index/index.wxml` | 3 | 修改板块标题与副标题文案 | 低 |
| `miniprogram/pages/index/index.js` | 3 | 修改 `getPlanTypeLabel` 映射和提示文案 | 低 |
| 以上未列出的文件 | — | **不改** | 无 |

## 时间线

| Phase | 工作量 | 依赖 |
|-------|--------|------|
| Phase 1 | 1-2 天 | 无 |
| Phase 2 | 2-3 天 | Phase 1 完成 |
| Phase 3 | 2-3 天 | Phase 2 完成 |
| Phase 4 | 3-5 天 | Phase 1 完成 |
| Phase 5 | 1-2 天 | Phase 2 完成 |
| **总计** | **约 9-15 天** | — |

Phase 4 和 Phase 5 可并行。板块命名优化随 Phase 3 一起上线。

## 不做的

- 不重写现有的 7458 条 `content` 字段内容——只写入新增的 `display_*` 字段
- 不删除 `articles` 表或 `parenting_tips` 表现有任何字段
- 不引入新的前端框架或依赖
- 不修改 tab bar 结构或页面路由
- 不新增小程序页面
- 不修改 `/pages/textbook/textbook`（每日训练）的任何现有代码——只改首页入口文案
- 不给 insight 型锦囊强行追加动作句——它们是认知提升内容，保持纯解释定位
- 不在本轮引入 AI 大模型自动改写（Phase 4 用规则 + 模板）
