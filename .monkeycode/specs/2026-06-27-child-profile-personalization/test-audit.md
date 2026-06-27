# 孩子档案个性化上下文测试审计

## 审计范围

- 小程序孩子上下文纯函数：`miniprogram/utils/child-context.js`
- 小程序 AI 请求上下文：`miniprogram/app.js`
- 首页无上下文入口：`miniprogram/pages/index/index.js`、`miniprogram/pages/index/index.wxml`
- 育儿锦囊推荐入口：`miniprogram/pages/parenting/parenting.js`、`miniprogram/pages/parenting/article-list/article-list.js`
- 后端 AI Prompt 上下文：`backend/src/mysql-production/server.js`
- 自动测试：`scripts/test-child-context.js`、`scripts/test-encouragement.js`

## 自动化测试覆盖

- R1.1-R1.2：通过代码审计确认首页 `askAiForToday()` 不再写入 `pendingChatQuestion`，卡片主入口改为育儿锦囊。
- R2.1、R2.4：`scripts/test-child-context.js` 覆盖合法育儿年龄段和超范围年龄段过滤。
- R2.5：`scripts/test-child-context.js` 覆盖推荐提示文案生成。
- R3.1：`scripts/test-child-context.js` 覆盖 `buildChildChatContext()` 输出姓名、生日、年龄段、标签、关注点和来源。
- R4.1-R4.3：`scripts/test-child-context.js` 覆盖年龄缺失、无效生日、6-8 岁映射 `6-9岁`、9 岁以上不进入育儿锦囊过滤。
- R5.2-R5.3：`npm test` 和 `npm run lint` 均通过。

## 当前校验结果

```bash
npm test
```

结果：通过，输出 `Encouragement tests passed.` 与 `Child context tests passed.`。

```bash
npm run lint
```

结果：通过，输出 `Syntax check passed for 57 file(s).` 与 `Miniprogram syntax check passed for 45 file(s).`。

## 风险与补强建议

- 后端 `buildChatChildContext()` 和 Prompt 档案行已抽到 `backend/src/mysql-production/chat-context.js`，并由 `scripts/test-chat-context.js` 覆盖标签、关注点和显式年龄覆盖档案年龄。
- 文章列表页初始筛选决策已抽到 `resolveArticleListInitialAgeFilter()`，并由 `scripts/test-child-context.js` 覆盖默认推荐、URL 参数优先级和超范围年龄兜底。
- 首页缺少孩子年龄时的提示目前主要落在育儿锦囊页推荐兜底文案，后续可在首页卡片上增加更显性的档案补全提示。

## 审计结论

本次变更的核心年龄映射、档案上下文归一化、推荐提示生成、后端 Prompt 档案行拼接、文章列表初始年龄筛选优先级均已有自动化测试覆盖，项目级测试和语法校验通过。剩余风险主要是微信开发者工具中的真实页面渲染和跳转体验，需要在小程序预览环境做人工验收。
