# 日常陪伴闭环回测清单

## 一、接口脚本回测

执行前准备：

- 生产或预发可用 `token`
- 可访问的 `childId`
- 目标域名，默认 `https://api.woyai.cn/api/v1`

命令：

```bash
# 非会员账号回测
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_EXPECT_MEMBER="inactive" npm run verify:daily-guidance

# 已激活会员账号回测
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_EXPECT_MEMBER="active" npm run verify:daily-guidance

# 需要覆盖统一兑换码链路时追加兑换码参数
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_PROMO_CODE="zgxn" npm run verify:daily-guidance

# 批量验证 30 个场景高频词
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" npm run verify:scene-keywords

# 串行执行完整接口回测套件
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" npm run verify:daily-guidance-suite
```

预期：

- `membership_info` 返回会员状态
- 若设置 `DAILY_GUIDANCE_EXPECT_MEMBER`，脚本会校验会员状态与预期一致
- 若设置 `DAILY_GUIDANCE_PROMO_CODE`，脚本会验证兑换后会员权益是否即时生效
- `daily_plan` 返回 `3` 张卡或符合当前逻辑的计划卡数量
- `growth_record_upsert`、`growth_record_daily`、`growth_record_history`、`growth_record_summary` 全部成功
- `weekly_summary` 返回基础版或会员完整版字段
- `scene_search` 至少命中一个场景并返回方案卡，同时验证未命中时仍有文章回退结果
- `verify:scene-keywords` 会输出 30 个高频词的命中、回退和空结果统计，出现空结果时直接失败
- `verify:daily-guidance-suite` 会按顺序执行核心链路脚本和高频场景词脚本，并输出统一汇总结果

## 二、页面联调回测

### 1. 首页计划与周成长

- 已登录且有孩子时：首页能拉到今日计划
- 标记完成后首页完成数即时更新
- 本周成长卡显示真实周总结文案
- 非会员用户能看到会员承接卡

### 2. 成长记录

- 打开成长记录页成功回显当天数据
- 修改状态后保存成功
- 历史页可以看到最近记录
- 无孩子档案时展示引导空态

### 3. 每周成长总结

- 有记录用户可看到本周概况
- 普通用户只看到基础版 `重点观察` 和预览版推荐内容
- 会员用户看到完整 `重点观察`、完整 `下周重点` 和完整推荐内容
- 会员入口按钮可正常跳转会员中心

### 4. 场景化搜索

- 高频场景标签能触发方案卡
- 输入 `睡前拖延`、`孩子发脾气`、`挑食`、`坐不住` 至少命中一个场景
- 方案卡、文章卡跳转正常
- 未命中时仍能回退到文章搜索结果

建议按以下高频词至少回测 `30` 个样本：

- `孩子发脾气`
- `爱发脾气`
- `公共场合哭闹`
- `商场哭闹`
- `出门闹脾气`
- `睡前拖延`
- `不肯睡觉`
- `哄睡困难`
- `入睡困难`
- `晚上兴奋`
- `挑食`
- `不肯吃饭`
- `边吃边玩`
- `不爱吃菜`
- `只吃主食`
- `坐不住`
- `写作业分心`
- `学习拖拉`
- `容易走神`
- `专注力差`
- `抢玩具`
- `和小朋友打架`
- `不会分享`
- `同伴冲突`
- `和同学吵架`
- `早上磨蹭`
- `出门慢`
- `上学拖延`
- `起床拖拉`
- `晨起磨蹭`

### 5. 会员承接

- 首页会员承接卡在非会员下展示
- 会员中心权益卡能显示 `已解锁` / `待解锁`
- 统一兑换码兑换后权益状态刷新
- 兑换后周总结切换到 `会员完整版本`

## 三、重点边界

- 游客访问首页：计划卡走游客兜底
- 已登录无孩子：成长记录与周总结应给档案引导
- 普通会员与正式会员：周总结口径都按 `is_active=true` 走完整版权限
- 周总结缓存命中老结构时应自动重建，不返回旧口径字段

## 四、结果留档模板

回测记录建议直接写入：

- `.monkeycode/specs/2026-06-14-daily-guidance-system/regression-report-template.md`
- `.monkeycode/specs/2026-06-14-daily-guidance-system/production-regression-runbook.md`

- 回测时间：
- 提交号：
- 回测账号类型：游客 / 普通用户 / 试用会员 / 正式会员
- 回测孩子 ID：
- 接口脚本结果：通过 / 失败
- 页面回测结果：通过 / 失败
- 失败项与复现步骤：
