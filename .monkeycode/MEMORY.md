# 用户指令记忆

本文件记录用户指令、偏好和项目知识，供后续会话快速接续。

## 格式

### 用户指令条目
[用户指令摘要]
- Date: [YYYY-MM-DD]
- Context: [场景]
- Instructions:
  - [内容]

### 项目知识条目
[项目知识摘要]
- Date: [YYYY-MM-DD]
- Context: Agent 在执行 [任务] 时发现
- Category: [运维部署|构建方法|测试方法|排错调试|工作流协作|环境配置]
- Instructions:
  - [内容]

## 去重策略
- 添加前检查是否已有相同条目，有则合并
- 合并时更新日期和上下文

## 条目

[生产 API 域名与小程序配置]
- Date: 2026-06-09
- Category: 环境配置
- Instructions:
  - 生产 API 域名 `https://api.woyai.cn`，基址 `https://api.woyai.cn/api/v1`
  - 小程序 AppID `wxb22908624ec860fe`，miniprogramRoot 指向 `miniprogram/`

[小牛育儿生产服务器完整配置]
- Date: 2026-07-01 (更新)
- Category: 运维部署
- Instructions:
  - 服务器 `ubuntu@124.223.3.175`，SSH 密钥 `/workspace/WOYING.pem`（与 `.monkeycode-tmp-files/33e5da7c-WOYING-1.pem` 相同）
  - 部署目录 `/home/ubuntu/niuniu-parenting`，PM2 进程名 `niuniu-backend`
  - 后端入口 `/home/ubuntu/niuniu-parenting/backend/src/mysql-production/server.js`
  - 业务环境变量从 `/home/ubuntu/niuniu-parenting/.env` 加载
  - 生产目录不是 Git 工作树，热修复采用 SCP 单文件同步 → pm2 restart
  - 每次同步前先备份到 `/home/ubuntu/niuniu-parenting/backups/`
  - 后台运营统计由 ubuntu 用户 crontab 定时跑 `/home/ubuntu/niuniu-parenting/backend/src/scripts/build-admin-daily-stats.js`：每天 01:15 汇总昨天，每小时 20 分汇总当天，日志在 `/home/ubuntu/niuniu-parenting/logs/admin-daily-stats.log`
  - 修改 RUNTIME_* 环境变量后需 `pm2 restart niuniu-backend --update-env`
  - 运行时配置验收信号：`GET /api/v1/runtime/config` 返回 `config_loaded: true` 及 `ai_provider`、`ai_model`
  - 部署时不影响 `woying-backend` 进程和我赢AI任何配置

[修复与开发工作流约束]
- Date: 2026-06-15 (整合)
- Category: 工作流协作
- Instructions:
  - 每一步修复前建立可追溯备份点或 Git 检查点
  - 每一步修复后执行定向回测，记录测试命令、结果和影响范围
  - 修复方案必须基于全局依赖评估，避免修一点引入其他地方回归
  - 共享工作区完成改动后提交推送到 GitHub，不要把"工作区已改但未推送"当成本机已生效
  - 进入该项目后优先读取 `.monkeycode/MEMORY.md` 和已有部署文档
  - 所有服务器操作只允许落在小牛育儿目录和 `niuniu-backend` 进程范围内

[后台建设分步开发与回测要求]
- Date: 2026-06-13
- Category: 工作流协作
- Instructions:
  - 后台开发必须形成完整方案和开发方案后再进入实现
  - 每一步开发必须具备可回测能力，明确验证范围、验证方法和回滚点
  - 后台域名、Nginx 路由、PM2 进程、数据库表和部署目录必须与现有我赢AI后台隔离

[前端改动先验证再推送]
- Date: 2026-06-16
- Instructions:
  - 涉及前端适配或页面扩充的改动，先完成定向验证再执行代码推送

[根目录 lint 联合校验范围]
- Date: 2026-06-16
- Category: 构建方法
- Instructions:
  - 仓库根目录执行 `npm run lint` 同时跑后端和小程序语法检查
  - 通过标记：`Syntax check passed for XX file(s)` 与 `Miniprogram syntax check passed for XX file(s)`

[根目录测试命令]
- Date: 2026-06-27
- Context: Agent 在执行鼓励弹窗、文章注解、孩子档案个性化上下文测试补齐时发现
- Category: 测试方法
- Instructions:
  - 仓库根目录执行 `npm test` 会依次运行 `scripts/test-encouragement.js`、`scripts/test-child-context.js`、`scripts/test-chat-context.js`
  - 当前覆盖鼓励弹窗等级、首页鼓励触发状态、文章阅读注解阈值和每日频率规则、孩子档案上下文、育儿年龄推荐、文章列表年龄筛选优先级、后端 Prompt 档案行拼接

[本地后端启动需显式带 NODE_PATH]
- Date: 2026-06-20
- Category: 环境配置
- Instructions:
  - 本地启动生产 MySQL 后端命令：`NODE_PATH=/workspace/backend/node_modules:/usr/local/lib/node_modules node src/mysql-production/server.js`

[营养内容专业口径]
- Date: 2026-06-16
- Instructions:
  - 0-1岁食谱与相关营养输出全部下线，不对外提供该年龄段食谱内容
  - 其他年龄段食谱继续收口，补充更专业的阶段性建议和执行提示

[营销文案要具体到家庭场景]
- Date: 2026-06-17
- Instructions:
  - 优先使用具体家庭场景词（写作业、亲子共读、吃饭、睡前洗漱、出门上课）
  - 少用抽象词（任务、方法、问题、训练、方向），改写成家长可直接代入的表达

[产品主链路优先于推广物料]
- Date: 2026-06-17
- Category: 工作流协作
- Instructions:
  - 当注册、登录、支付、核心功能入口等主链路存在缺失时，优先处理主链路
  - 推广文档和营销物料顺延到主链路修复完成后推进

[知识库变更与验证要求]
- Date: 2026-06-18 (整合)
- Category: 工作流协作
- Instructions:
  - 补充知识库前先做统一链路规划（内容类型、导入映射、召回顺序、降级顺序）
  - AI 问答相关知识源统一通过聚合召回入口接入，避免新增分散链路
  - 知识库问答调整前先保留基线，调整后执行完整深度回测
  - 深度回测至少覆盖：知识命中、年龄段过滤、多来源整合、降级回答、边界提示、真实场景问法

[性能优化优先零破坏我赢AI]
- Date: 2026-06-18
- Category: 工作流协作
- Instructions:
  - 涉及性能优化优先采用零破坏小步改动
  - 不修改我赢AI现有系统配置、运行进程、数据库实例和路由
  - 优先做应用层优化：超时、幂等、缓存、限流、日志、可回退参数调整

[支付配置排查要点]
- Date: 2026-06-21
- Category: 排错调试
- Instructions:
  - 微信支付私钥已配置且文件存在，平台证书路径 `WECHAT_PAY_PLATFORM_CERT_PATH` 当前为空
  - 排查线上支付回调验签时优先检查 `.env` 与平台证书是否补齐
  - 绑定手机号路由验收信号：`POST /api/v1/auth/bind-phone` 无令牌时返回 `{"success":false,"message":"未提供访问令牌"}`

[AI 问答回复风格]
- Date: 2026-06-22
- Instructions:
  - 回复优先采用自然对话式短句
  - 先直接回应用户问题，再补理论说明，再给实操建议
  - 实操建议可包含一个有助于继续判断的追问
  - 避免说明书式长段落和固定标题结构

[AI 回答系统配置 — 推理框架与模型接入] (2026-06-24 本轮新增)
- Date: 2026-06-24
- Category: 环境配置 / 运维部署
- Context: 本轮完成 AI 回答深度优化全链路改造
- Instructions:
  - AI Provider：stepfun，模型 step-3.7-flash，API Base `https://api.stepfun.com/step_plan/v1`
  - AI 超时 60 秒（生产 .env `AI_TIMEOUT_MS=60000`）
  - step-3.7-flash 先产生 `reasoning_content`（推理链）再产生 `content`（最终回答），ai.js 已实现 reasoning fallback：content 为空时自动取 `reasoning_content`
  - max_tokens 需同时覆盖推理+内容两段，生产配置 4000
  - System Prompt 已重写：删除"控制在4到6句"约束，替换为 5 步推理框架（判断→归因→方案→预期→底线），6 个意图（营养/阅读/情绪/专注/评估/通用）各有独立回答结构模板和深度标杆 few-shot 示例
  - 知识片段裁剪从 260 字符扩容到 1000 字符
  - `.env` 路径 bug 已修复：loadEnv 中 `../../..` → `../../`

[小程序端 AI 相关修复] (2026-06-24 本轮新增)
- Date: 2026-06-24
- Category: 排错调试
- Context: 本轮修复了小程序端多个与 AI 推理模型适配相关的体验问题
- Instructions:
  - `miniprogram/app.js` 中 `chat()` 请求 timeout 设为 60000ms（原默认 15s 不足以覆盖推理模型 14-21s 响应时间），其他请求保持 15s 默认
  - `miniprogram/utils/request.js` 默认超时 15s
  - 年龄解析 `extractChatAgeGroupFromMessage` 已支持一岁~十二岁/半岁中文数字匹配，防止解析失败时 fallback 到错误档案年龄
  - 聊天页自动滚动：`scroll-into-view` + `scroll-top: 999999` 双保险方案，三处滚动点统一使用 `getScrollToBottomPayload()`
  - 加载气泡下方有"AI 正在深度思考，预计需要 20-30 秒"提示文字（`.loading-hint` 样式）
  - 后端测试脚本 `backend/test-prompt.js` 未提交到仓库

[GitHub 仓库信息]
- Date: 2026-06-24 (更新)
- Category: 工作流协作
- Instructions:
  - GitHub 仓库：`nn190yxn/zgxnai`
  - 当前 HEAD `d0a7f3b`（宣传指挥台AI文案生成器），已推送，远端一致
  - 生产 server.js MD5：`e472a677572392da5aefb77ad8bbc6ef`
  - 生产 ai.js MD5：`42c805dc1806249b1fbaeeef8ae3bc03`

[宣传指挥台 — AI 文案生成器与营销接口] (2026-06-24 本轮新增)
- Date: 2026-06-24
- Category: 运维部署 / 环境配置
- Context: 本轮为宣传指挥台新增 AI 文案生成能力和会员群引爆策略
- Instructions:
  - 后端新增 `/api/v1/marketing/generate` 接口（`marketingGenerateHandler`），无需认证，支持 6 种平台类型：xhs/douyin/gzh/wechat/cover/headline
  - 营销 System Prompt 包含核心受众画像、品牌定位、写作铁律、平台规范（`MARKETING_SYSTEM_PROMPT_BASE` + `getMarketingSystemPrompt`）
  - 推理模型 marketing 生成 maxTokens 配置 4000（覆盖 reasoning + content），temperature 0.8
  - 生产 server.js 已新增 `/marketing` 路由，serve `宣传计划/` 目录下的 HTML 和 MD
  - 宣传指挥台访问地址：`https://api.woyai.cn/marketing`
  - HTML 右侧面板已含 AI 文案生成器：输入主题 → 选平台 → 生成 → 复制，调用 `/api/v1/marketing/generate`
  - MD 新增 `9.9 会员群引爆策略`（前三板斧+运营节奏表）和 `9.10 运动馆场景专属话术`
  - 宣传计划 MD/HTML 文件部署路径：`/home/ubuntu/niuniu-parenting/宣传计划/`

[生产数据库备份参数]
- Date: 2026-06-26
- Context: Agent 在执行小牛育儿知识库恢复时发现
- Category: 运维部署
- Instructions:
  - 生产 MySQL 账号执行 `mysqldump` 备份业务表时需加 `--no-tablespaces`，避免缺少 `PROCESS` 权限导致 tablespaces 导出报错。
