# 阅读部分改进报告

## 一、现状诊断

### 1.1 数据流问题
当前小程序的**阅读任务数据完全硬编码在前端** (`textbook.js` 的 `loadReadingTasks` 函数)，**没有调用后端 API**。这意味着：
- 后端数据库即使有再多阅读任务数据，前端也看不到
- 所有任务都是写死的4个，无法动态扩展
- 年龄分级逻辑是前端判断的，不够灵活

### 1.2 文字结构问题
现有阅读任务的 `steps` 字段是纯文本字符串，如：
```
1. 先看封面，猜一猜主角是谁
2. 读一页后停下来，请孩子指一指画面
3. 读到关键变化时问：后来怎么了
4. 最后请孩子用一句话说出故事变化
```

**问题：**
- 前端将其按 `\n` 分割为数组，但展示时是纯文本列表
- 缺少步骤配图/示意图
- 缺少示例回答（家长不知道孩子应该达到什么水平）
- 缺少家长提示（tips）

### 1.3 前端展示问题
查看 `textbook.wxml`，阅读任务卡片目前只有：
- emoji 图标（📖、🌱、💬、⭐）
- 纯文本：标题、材料、目标、步骤、家长提问
- 缺少：任务配图、步骤图解、示例回答、音频朗读

---

## 二、后端已完成的改进

### 2.1 数据库表结构扩展
`reading_tasks` 表新增字段：

| 字段名 | 说明 | 示例值 |
|--------|------|--------|
| `image_url` | 任务配图 | `https://example.com/images/reading/r1_cover.png` |
| `icon_url` | 任务图标 | `https://example.com/images/icons/book.png` |
| `cover_image` | 封面大图 | `https://example.com/images/reading/r1_cover.png` |
| `audio_url` | 音频朗读 | `https://example.com/audio/r1_sample.mp3` |
| `video_url` | 视频讲解 | `https://example.com/video/r1_guide.mp4` |
| `tips` | 家长提示 | "3-4岁孩子注意力短，每次只看1-2页即可" |
| `example_answer` | 示例回答 | "我看到了一只毛毛虫，它好像很饿" |

### 2.2 API 返回字段扩展
`/api/v1/education/tasks/today` 现在返回完整字段：
```json
{
  "id": 1,
  "task_code": "r1",
  "title": "绘本封面观察：猜一猜主角",
  "material": "选择一本画面清楚、主角突出的绘本...",
  "objective": "通过观察封面，预测故事内容",
  "steps": ["1. 和孩子一起看封面...", "2. 指着主角问..."],
  "parent_prompt": "封面上画了什么？",
  "image_url": "https://example.com/images/reading/r1_cover.png",
  "icon_url": "https://example.com/images/icons/book.png",
  "cover_image": "https://example.com/images/reading/r1_cover.png",
  "audio_url": "",
  "video_url": "",
  "tips": "3-4岁孩子注意力短，每次只看1-2页即可...",
  "example_answer": "我看到了一只毛毛虫，它好像很饿，正在吃苹果。"
}
```

### 2.3 阅读任务数据扩充
从原来的2条扩充到**6条**，覆盖不同年龄段和能力维度：

| 任务 | 年龄段 | 能力维度 | 难度 |
|------|--------|----------|------|
| 绘本封面观察 | 3-4岁 | 观察预测 | 入门 |
| 画面找一找 | 3-4岁 | 信息提取 | 入门 |
| 故事顺序排序 | 4-5岁 | 逻辑排序 | 标准 |
| 角色表情猜一猜 | 4-5岁 | 情绪理解 | 标准 |
| 因果关系推理 | 5-6岁 | 逻辑推理 | 提升 |
| 故事复述 | 5-6岁 | 概括表达 | 提升 |

---

## 三、哪些地方需要添加图片

### 3.1 阅读任务卡片（必须）
**当前问题：** 只有 emoji 图标（📖、🌱、💬、⭐），视觉吸引力差

**需要添加：**
- **任务配图 (cover_image)**：每个任务一张代表性插图
  - 例如"封面观察"任务配一张绘本封面的示意图
  - "画面找一找"任务配一张有多个元素的插画
- **步骤图解**：每个步骤配一张小图
  - 步骤1：看封面 → 配一张孩子看封面的图
  - 步骤2：指一指 → 配一张手指指向画面的图

### 3.2 步骤说明（强烈建议）
**当前问题：** 步骤是纯文本，家长和孩子难以理解

**需要添加：**
- **步骤配图**：每个步骤配一张示意图
- **示例画面**：展示"正确做法"的示例图
- **对比图**：展示"错误做法 vs 正确做法"的对比

### 3.3 示例回答（建议）
**当前问题：** 没有示例回答，家长不知道孩子应该达到什么水平

**需要添加：**
- **示例回答配图**：展示一个"好的回答"示例
- **评分标准图**：用星级或颜色表示回答质量

### 3.4 家长提示（建议）
**当前问题：** tips 是纯文本，不够直观

**需要添加：**
- **提示图标**：用图标代替文字提示
- **常见问题图解**：展示常见问题的解决方法

### 3.5 知识库内容（建议）
**当前问题：** 知识库中的内容（如食谱、绘本推荐）都是纯文本

**需要添加：**
- **绘本封面图**：每本推荐绘本配一张封面图
- **食谱成品图**：每道食谱配一张成品图
- **步骤图**：食谱的步骤配分解图
- **食材图**：食谱的食材配实物图

---

## 四、图片资源规划

### 4.1 阅读任务图片
```
/images/reading/
  r1_cover.png        # 封面观察任务图
  r1_step1.png        # 步骤1：看封面
  r1_step2.png        # 步骤2：指主角
  r1_step3.png        # 步骤3：翻第一页
  r1_step4.png        # 步骤4：手指着讲
  r2_find.png         # 画面找一找任务图
  r2_step1.png        # 步骤1：看画面
  r2_step2.png        # 步骤2：问地点
  ...
```

### 4.2 图标资源
```
/images/icons/
  book.png            # 阅读任务图标
  search.png          # 查找任务图标
  order.png           # 排序任务图标
  face.png            # 表情任务图标
  think.png           # 推理任务图标
  speak.png           # 表达任务图标
```

### 4.3 绘本推荐图片
```
/images/books/
  emotion_monster.png     # 《我的情绪小怪兽》封面
  fifi_angry.png          # 《菲菲生气了》封面
  hungry_caterpillar.png  # 《好饿的毛毛虫》封面
  ...
```

### 4.4 食谱图片
```
/images/recipes/
  breakfast_porridge.png  # 早餐粥
  lunch_fish.png          # 清蒸鱼
  dinner_vegetable.png    # 清淡晚餐
  snack_fruit.png         # 健康零食
  ...
```

---

## 五、前端使用建议（供前端开发参考）

### 5.1 修改 `loadReadingTasks` 函数
当前前端是硬编码的，建议改为调用后端 API：

```javascript
loadReadingTasks: function() {
  var that = this;
  wx.request({
    url: 'https://api.supercalf.com/api/v1/education/tasks/today',
    data: {
      childId: that.data.currentChild?.id,
      grade: that.data.gradeList[that.data.currentGrade - 1].name
    },
    success: function(res) {
      if (res.data.success) {
        var tasks = res.data.data.list.map(function(task) {
          return {
            id: task.id,
            title: task.title,
            // 使用后端返回的 cover_image 或 icon_url
            coverImage: task.cover_image || task.icon_url,
            // 使用后端返回的步骤数组
            steps: task.steps,
            // 使用后端返回的示例回答
            exampleAnswer: task.example_answer,
            // 使用后端返回的家长提示
            tips: task.tips,
            // ... 其他字段
          };
        });
        that.setData({ readingTasks: tasks });
      }
    }
  });
}
```

### 5.2 在 WXML 中添加图片展示

**任务卡片封面图：**
```xml
<view class="reading-task-card">
  <image class="reading-task-cover" src="{{item.coverImage}}" mode="aspectFill" />
  <view class="reading-task-main">
    <!-- ... -->
  </view>
</view>
```

**步骤配图：**
```xml
<view class="reading-task-step" wx:for="{{item.steps}}" wx:for-item="step" wx:for-index="stepIndex">
  <image class="step-image" src="{{step.imageUrl}}" mode="aspectFit" />
  <text class="step-text">{{stepIndex + 1}}. {{step.text}}</text>
</view>
```

**示例回答展示：**
```xml
<view class="example-answer-section" wx:if="{{item.exampleAnswer}}">
  <text class="example-answer-title">示例回答</text>
  <view class="example-answer-bubble">
    <text>{{item.exampleAnswer}}</text>
  </view>
</view>
```

---

## 六、总结

### 已完成（后端）
- ✅ 扩展 `reading_tasks` 表结构，添加图片相关字段
- ✅ 扩充 API 返回完整字段
- ✅ 添加6条结构化阅读任务数据
- ✅ 添加示例回答和家长提示

### 待完成（需要前端配合）
- 🔲 前端 `loadReadingTasks` 改为调用后端 API
- 🔲 添加任务配图展示
- 🔲 添加步骤配图展示
- 🔲 添加示例回答展示
- 🔲 添加家长提示展示
- 🔲 准备图片资源（任务配图、步骤图、图标等）

### 优先级建议
1. **高优先级**：任务配图（提升视觉吸引力）
2. **中优先级**：步骤配图（提升可操作性）
3. **低优先级**：示例回答配图、提示图标
