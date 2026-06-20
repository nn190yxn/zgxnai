# 测评模块全面增强计划

## 概述

当前测评模块存在四个结构性缺口，按优先级排列如下。全部完成后测评模块将从"可用"提升至"专业级"。

---

## 方向一：0-3岁测评扩增（优先级最高）

### 背景
当前最早测评从 3 岁开始，0-3 岁完全空白。育儿 APP 最核心的用户群体恰好在 0-3 岁阶段。

### 新增 4 种测评类型

| code | 名称 | 题目数 | 年龄段 | 维度 |
|------|------|--------|--------|------|
| `gross_motor` | 大运动发育观察 | 20 | 0-1岁,1-2岁,2-3岁 | 抬头/翻身/坐/爬行/站立/行走/跑跳 |
| `fine_motor` | 精细动作观察 | 18 | 0-1岁,1-2岁,2-3岁 | 抓握/捏取/涂鸦/搭积木/翻书/用勺 |
| `language_dev` | 语言发育观察 | 22 | 0-1岁,1-2岁,2-3岁 | 发音/词汇/短句/理解指令/表达需求 |
| `social_emotion` | 社交情绪观察 | 20 | 0-1岁,1-2岁,2-3岁 | 微笑/认生/分离焦虑/模仿/分享/情绪表达 |

### 实施步骤

**Step 1: 注册到 ASSESSMENT_META**
- 文件: `backend/src/mysql-production/content-seeds.js`
- 在现有 6 种测评后追加 4 种新测评元数据
- 包含 code, name, total_questions, duration, age_groups, description

**Step 2: 注册评估维度**
- 在 `ASSESSMENT_DIMENSIONS` 中添加 4 种测评的维度定义
- gross_motor: 头颈控制/躯干控制/下肢力量/全身协调
- fine_motor: 手掌抓握/指尖捏取/双手协调/工具使用
- language_dev: 语音产出/词汇理解/句式表达/语用交流
- social_emotion: 情绪识别/社交回应/依恋行为/自我意识

**Step 3: 编写年龄段专属题目**
- 每种测评按年龄段分叉题面
- 例如 gross_motor 的"抬头"类题目：
  - 0-1岁: "宝宝趴着时能否抬头并保持几秒？"
  - 1-2岁: "宝宝能否独立从躺到坐，再从坐到站？"
  - 2-3岁: "孩子能否双脚跳离地面并保持平衡？"

**Step 4: 种子数据**
- 为 4 种新测评添加 interpretation 种子（每类型 x 5 等级 = 20 行）
- 为 4 种新测评添加 suggestion 种子（每类型 x 3-5 等级 = ~16 行）
- 为 4 种新测评添加 ageContext（4 类型 x 3 年龄段 = 12 条）

**Step 5: 前端适配**
- `assessment.js` 列表页：确保 0-3 岁年龄段正常筛选出新测评
- `ageGroupMatches` 工具函数：确认 0-1/1-2/2-3 的匹配逻辑
- 结果页免责声明：添加"本观察仅用于发育筛查参考，不等同发育商评估"

---

## 方向二：年龄差异化题目

### 背景
当前 `buildAssessmentQuestions` 对所有年龄段返回相同题目。需要改为按年龄组分叉题目内容。

### 实施步骤

**Step 1: 重构题目生成函数**
- 修改 `buildAssessmentQuestions(code, ageGroup)` 接受 ageGroup 参数
- 在原 `assessmentQuestionsHandler` 中传递 `req.query.age_group`
- 每种测评定义多套题目，按年龄段键值映射

**Step 2: 题目分层结构**
```
ASSESSMENT_QUESTIONS = {
  sensory: {
    '3-4岁': [/* 适合 3-4 岁的题面 */],
    '4-5岁': [/* 适合 4-5 岁的题面 */],
    '5-6岁': [/* ... */],
    '6-9岁': [/* ... */],
    '9-12岁': [/* ... */]
  },
  // ... 其他测评同理
}
```

**Step 3: 选项评分差异化**
- 低龄段选项偏重"是否出现该行为"
- 高龄段选项偏重"频率和程度"
- 保持 0-3 分四档结构不变

**适用范围**：现有 6 种测评 + 新增 4 种测评 = 全部 10 种

---

## 方向三：长期趋势分析

### 背景
历史记录只有列表，缺少跨时间对比和进步轨迹分析。

### 新增 API 端点

**GET `/assessments/:code/trend?child_id=X`**
- 查询该孩子在此测评类型下的所有历史记录
- 计算趋势：improving / stable / declining
- 生成趋势解读文本
- 返回最近 N 次（默认 5 次）的分数序列

**返回结构**：
```json
{
  "trend": "improving",
  "trend_detail": "过去4次测评中，专注力从'需关注'逐步提升到'良好'，持续进步趋势明显。",
  "records": [
    { "date": "2026-05-01", "percentage": 42, "level": "attention" },
    { "date": "2026-05-15", "percentage": 55, "level": "medium" },
    { "date": "2026-06-01", "percentage": 68, "level": "medium" },
    { "date": "2026-06-15", "percentage": 73, "level": "good" }
  ],
  "chart_data": {
    "labels": ["5月1日", "5月15日", "6月1日", "6月15日"],
    "scores": [42, 55, 68, 73],
    "levels": ["attention", "medium", "medium", "good"]
  }
}
```

**实施**：
- 新增 `assessmentTrendHandler` 处理函数
- 新增 `buildAssessmentTrend(records)` 趋势计算
- 前端 history 页添加"查看趋势"入口，结果页添加"历史对比"入口

---

## 方向四：年龄常模评分

### 背景
当前所有年龄段共用同一套百分比→等级映射（85/70/55/40），没有年龄参照。

### 实施步骤

**Step 1: 定义年龄段专属评分区间**
每个测评 × 每个年龄段使用不同的百分比阈值：
```
ageNorms = {
  sensory: {
    '3-4岁': { excellent: 90, good: 80, medium: 65, attention: 50, intervention: 0 },
    '4-5岁': { excellent: 88, good: 78, medium: 63, attention: 48, intervention: 0 },
    '5-6岁': { excellent: 85, good: 75, medium: 60, attention: 45, intervention: 0 },
    '6-9岁': { excellent: 82, good: 72, medium: 58, attention: 42, intervention: 0 },
    '9-12岁': { excellent: 80, good: 70, medium: 55, attention: 40, intervention: 0 }
  }
  // ... 其他测评同理
}
```

**Step 2: 修改 normalizeAssessmentLevel**
- 接受 ageGroup 参数
- 先查年龄常模表，未匹配时回退到通用阈值

**Step 3: 同步所有评分入口**
- `assessmentSubmitHandler`：传递 ageGroup
- `buildAssessmentRecord`：从 record.age_group 传递
- 前端本地评分 `do.js` 同样适配

---

## 实施顺序与预估

| 阶段 | 内容 | 涉及文件 | 预估 |
|------|------|---------|------|
| 1 | 0-3岁 4 种新测评（元数据+题目+种子+前端） | content-seeds.js, server.js, assessment.js | 最大 |
| 2 | 年龄差异化题目（10 种测评分层） | content-seeds.js, server.js | 大 |
| 3 | 长期趋势分析（API+前端） | server.js, history.js, result.js | 中 |
| 4 | 年龄常模评分（10 种测评常模） | server.js, do.js | 中 |

---

## 验证标准

每阶段完成后：
1. `node --check server.js` 语法通过
2. `npm run lint` 通过
3. 验证所有测评组合的 interpretation + suggestion + ageContext 覆盖率
4. 验证前端列表页按年龄段正确筛选
