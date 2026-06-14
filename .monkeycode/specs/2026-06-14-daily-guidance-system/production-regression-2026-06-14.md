# 日常陪伴闭环生产回测记录

## 基本信息

- 回测时间：2026-06-14T14:46:09.272Z
- 提交号：21de79d
- 回测环境：生产
- 回测账号类型：普通用户
- 回测孩子 ID：6
- 执行人：OpenCode

## 接口脚本结果

- `npm run verify:daily-guidance`：通过
- `npm run verify:scene-keywords`：通过
- `npm run verify:daily-guidance-archive`：通过
- `npm run verify:daily-guidance-deliverable`：通过
- JSON 结果文件：`/tmp/daily-guidance-regression/suite-2026-06-14T14-46-09-248Z.json`
- Markdown 摘要文件：`/tmp/daily-guidance-regression/report-2026-06-14T14-46-09-248Z.md`
- 回测记录草稿：`/tmp/daily-guidance-regression/regression-record.md`

## 关键输出摘要

- 总结果：通过
- `membership_info`：`isActive=false`，`membershipType="free"`，`promoEnabled=true`
- `daily_plan`：`cardCount=3`，`firstCardType="ability_task"`
- `growth_record_upsert`：`recordDate="2026-06-14"`，`moodStatus="steady"`
- `growth_record_daily`：`noteLength=22`
- `growth_record_history`：`listCount=1`
- `growth_record_summary`：`completedDays=1`，`overallLabel="本周有波动，适合继续观察"`
- `weekly_summary`：`premiumUnlocked=false`，`concernCount=1`，`nextActionCount=2`，`recommendedCount=1`
- `scene_search`：`sceneCount=6`，`matched=true`，`solutionCount=4`，`fallbackArticleCount=5`
- `scene_keywords`：`matched=30`，`fallback=0`，`empty=0`

## 页面回测结果

### 首页计划与周成长

- 结果：待执行
- 备注：需你本机 `git pull` 后在微信开发者工具验证。

### 成长记录

- 结果：待执行
- 备注：需你本机在小程序端验证当天记录、历史页和保存链路。

### 每周成长总结

- 结果：待执行
- 备注：需你本机验证普通用户基础版、会员版和无档案空态。

### 场景化搜索

- 结果：待执行
- 备注：需你本机验证命中词、别名词和文章回退词的前端展示。

### 会员承接

- 结果：待执行
- 备注：需你本机验证权益状态、兑换后刷新和埋点上报。

## 本轮修复点

- 修复 `growthRecordHistoryHandler` 在生产 MySQL 上的分页执行错误。
- 补充场景搜索别名：`孩子发脾气`、`公共场合哭闹`。
- 修复 `build-daily-guidance-record.js` 的模板路径解析，支持从 `backend/` 目录直接执行。
- 修复成长记录和计划返回日期的时区漂移风险，数据库 `DATE` 字段已改为本地日历日格式化。
- 修复分页和 `days` 参数的 `NaN` 风险，非法参数现会回落到安全默认值。
- 修复周总结最弱维度到推荐内容的映射错误，情绪、进食、睡眠、活动、社交现按正确类别推荐。

## 审计后补充验证

- `verify:daily-guidance-deliverable` 二次执行通过。
- `/growth-records/history?childId=6&page=foo&pageSize=bar` 返回 `200`，分页回落为 `page=1,pageSize=14`。
- `/growth-records/summary?childId=6&days=oops` 返回 `200`，周期回落为 `periodDays=7`。
- `/parenting/search?keyword=补铁&page=nope&page_size=bad` 返回 `200`。
- 当天成长记录写入后，历史接口返回 `recordDate="2026-06-14"`，日期口径已与写入值一致。
- 本地脚本语法校验补充通过：`miniprogram/app.js`、`miniprogram/pages/profile/profile.js`、`miniprogram/utils/app-config.js`、`miniprogram/utils/request.js`。

## 结论

- 是否可进入下一阶段：可以进入小程序前端实机回测阶段。
- 阻塞项：前端页面验证依赖你本机微信开发者工具重新编译、上传、发布。
- 下一步动作：推送代码后，由你本机完成小程序页面回测并补最终结果。
