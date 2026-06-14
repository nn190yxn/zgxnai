# 日常陪伴闭环生产回测执行手册

## 一、执行目标

在生产环境完成以下四类回测：

- 核心接口链路回测
- 高频场景词批量回测
- 会员兑换码与周总结权限回测
- 小程序页面联调留档

## 二、执行前准备

- 生产可用账号 `token`
- 可访问的 `childId`
- 如需验证会员兑换，准备统一兑换码
- 当前代码已同步到目标执行环境

## 三、推荐执行顺序

### 1. 基础链路回测

```bash
# 非会员账号执行核心链路回测
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_EXPECT_MEMBER="inactive" npm run verify:daily-guidance
```

### 2. 高频场景词批量回测

```bash
# 批量验证 30 个高频场景词
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" npm run verify:scene-keywords
```

### 3. 兑换码与会员权限回测

```bash
# 使用统一兑换码后再次验证会员口径
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_PROMO_CODE="zgxn" npm run verify:daily-guidance
```

### 4. 完整套件串行回测

```bash
# 在前面单项通过后执行整套脚本
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" npm run verify:daily-guidance-suite

# 如需同时落 JSON 结果文件，追加输出路径
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_OUTPUT_FILE="/tmp/daily-guidance-suite.json" npm run verify:daily-guidance-suite
```

### 5. 生成可留档摘要

```bash
# 把 JSON 结果转成 Markdown 摘要
DAILY_GUIDANCE_SUITE_FILE="/tmp/daily-guidance-suite.json" npm run verify:daily-guidance-report

# 如需直接落成摘要文件，补 report 输出路径
DAILY_GUIDANCE_SUITE_FILE="/tmp/daily-guidance-suite.json" DAILY_GUIDANCE_REPORT_FILE="/tmp/daily-guidance-report.md" npm run verify:daily-guidance-report
```

### 6. 一条命令完成归档

```bash
# 直接生成 JSON 和 Markdown 两份结果文件
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" npm run verify:daily-guidance-archive

# 如需指定归档目录
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_ARCHIVE_DIR="/tmp/daily-guidance-regression" npm run verify:daily-guidance-archive
```

### 7. 生成回测记录草稿

```bash
# 将 Markdown 摘要写入回测记录模板，生成可交付草稿
DAILY_GUIDANCE_SUMMARY_FILE="/tmp/daily-guidance-regression/report-<time>.md" DAILY_GUIDANCE_RECORD_FILE="/tmp/daily-guidance-regression/regression-record.md" DAILY_GUIDANCE_COMMIT_SHA="<commit>" DAILY_GUIDANCE_ACCOUNT_TYPE="普通用户" DAILY_GUIDANCE_CHILD_ID="<child-id>" npm run verify:daily-guidance-record
```

### 8. 一条命令生成交付物

```bash
# 直接生成 JSON、Markdown 摘要和回测记录草稿
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_COMMIT_SHA="<commit>" DAILY_GUIDANCE_ACCOUNT_TYPE="普通用户" npm run verify:daily-guidance-deliverable

# 如需指定归档目录和执行人
DAILY_GUIDANCE_TOKEN="<token>" DAILY_GUIDANCE_CHILD_ID="<child-id>" DAILY_GUIDANCE_COMMIT_SHA="<commit>" DAILY_GUIDANCE_ACCOUNT_TYPE="普通用户" DAILY_GUIDANCE_EXECUTOR="<name>" DAILY_GUIDANCE_ARCHIVE_DIR="/tmp/daily-guidance-regression" npm run verify:daily-guidance-deliverable
```

## 四、页面联调建议顺序

### 1. 首页

- 查看今日计划是否正常展示
- 标记一项完成，确认完成数即时变化
- 确认周成长卡和会员承接卡展示正确

### 2. 成长记录

- 打开当天记录
- 修改一项状态并保存
- 进入历史页确认最新记录存在

### 3. 周总结

- 非会员账号确认显示基础版
- 会员账号确认显示会员完整版本
- 无孩子档案账号确认显示档案引导空态

### 4. 场景化搜索

- 测试命中词：`睡前拖延`
- 测试别名词：`哄睡困难`
- 测试文章回退词：`补铁`

### 5. 会员中心

- 查看权益卡是否显示 `已解锁` / `待解锁`
- 兑换后重新进入确认权益状态已刷新

## 五、失败处理顺序

当脚本或页面回测失败时，按以下顺序排查：

1. 先确认 `token` 和 `childId` 是否有效。
2. 再确认当前执行环境代码版本是否包含最新改动。
3. 再检查接口返回是否仍是旧缓存或旧进程。
4. 最后把失败结果写入回测记录模板，进入修复流程。

## 六、结果留档

回测完成后，把结果写入：

- `.monkeycode/specs/2026-06-14-daily-guidance-system/regression-report-template.md`

如已设置 `DAILY_GUIDANCE_OUTPUT_FILE`，可把生成的 JSON 结果摘要同步写入回测记录。

如已生成 Markdown 摘要，可直接复制到回测记录模板的“接口脚本结果”部分。

如已执行 `verify:daily-guidance-archive`，可直接使用返回的 `suiteFile` 和 `reportFile` 路径留档。

如需生成完整回测记录草稿，可继续执行 `verify:daily-guidance-record`。

如需一次生成全部交付物，直接执行 `verify:daily-guidance-deliverable`。
