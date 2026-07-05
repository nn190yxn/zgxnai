# 公众号推广截图素材说明

本文件夹用于公众号每日推广推荐。截图来源为 `宣传计划/pages/` 下的 HTML 预览页，使用移动端视口 `390x844`、`2x` 像素密度截取整页长图。

## 文件结构

- `screenshots/`：20 张页面截图 PNG
- `manifest.json`：截图文件、页面标题、源 HTML 对照表
- `capture-screenshots.js`：批量截图脚本
- `README.md`：本说明文档

## 截图清单

| 序号 | 图片 | 页面 | 推荐公众号用途 |
| --- | --- | --- | --- |
| 01 | `screenshots/01-home.png` | 首页总览 | 产品总介绍、首篇品牌稿封面配图 |
| 02 | `screenshots/02-ai-chat.png` | 小牛问答页 | “孩子有状况，马上问小牛”主题文章 |
| 03 | `screenshots/03-assessment.png` | 成长观察页 | 测评/观察工具介绍 |
| 04 | `screenshots/04-daily-training.png` | 每日训练页 | 每天三分钟练习主题 |
| 05 | `screenshots/05-nutrition.png` | 营养中心页 | 吃饭、挑食、食谱推荐主题 |
| 06 | `screenshots/06-parenting.png` | 育儿知识页 | 育儿锦囊、家庭场景文章推荐 |
| 07 | `screenshots/07-growth-record.png` | 成长记录页 | 记录孩子进步、成长档案主题 |
| 08 | `screenshots/08-weekly-summary.png` | 周总结页 | 每周复盘、成长变化主题 |
| 09 | `screenshots/09-membership.png` | 会员页 | 会员权益和转化说明 |
| 10 | `screenshots/10-profile.png` | 个人中心页 | 孩子档案、家庭管理入口说明 |
| 11 | `screenshots/11-quick-tips.png` | 快问快答提示页 | 轻量问答、家长临场救急主题 |
| 12 | `screenshots/12-weekly-report.png` | 周报详情页 | 周报案例、复盘页局部展示 |
| 13 | `screenshots/13-ai-chat-demo.png` | 小牛问答演示页 | 问答对话案例展示 |
| 14 | `screenshots/14-parenting-article.png` | 育儿文章详情页 | 专业内容和文章阅读体验展示 |
| 15 | `screenshots/15-daily-quote.png` | 每日金句页 | 每日陪伴、朋友圈风格配图 |
| 16 | `screenshots/16-assessment-result.png` | 观察结果页 | 观察结果解读和下一步建议展示 |
| 17 | `screenshots/17-growth-trend.png` | 成长趋势页 | 趋势变化、长期记录价值展示 |
| 18 | `screenshots/18-meal-recipe.png` | 食谱详情页 | 家常食谱和营养建议主题 |
| 19 | `screenshots/19-training-exercise.png` | 训练练习页 | 亲子练习、能力发展专区主题 |
| 20 | `screenshots/20-social-cover.png` | 社交传播封面页 | 公众号封面、朋友圈海报备选 |

## 使用建议

1. 公众号首图优先使用 `01-home.png`、`20-social-cover.png`。
2. 功能介绍类文章可按主题配对应页面截图。
3. 公众号正文中建议每篇使用 2 到 4 张截图：首屏图、功能细节图、结果或记录图。
4. 如需适配公众号封面，可从长图中裁剪顶部视觉区域。

## 复现截图

```bash
# 启动静态预览服务
python3 -m http.server 8000 --bind 127.0.0.1

# 批量生成截图
NODE_PATH=/usr/local/lib/node_modules node "宣传计划/公众号推广截图素材/capture-screenshots.js"
```
