# API 契约清单与阶段0基线报告

**生成日期**: 2026-06-08  
**基线标签**: `repair-baseline-phase-0-20260608-1358`  
**基线提交**: `3c8f62a docs: add staged repair plan with backup and regression gates`  
**范围**: `miniprogram/` 前端请求路径与 `backend/src/` 后端路由。

---

## 一、阶段0基线结果

### 1. Git 基线

- 工作区状态: 干净。
- 基线 tag: `repair-baseline-phase-0-20260608-1358`。
- 后续每个修复阶段必须基于单独 commit 进行回测和提交。

### 2. 后端测试基线

执行命令:

```bash
cd backend && npm test
```

测试结果:

- Test Suites: 2 passed, 2 total
- Tests: 38 passed, 38 total
- Coverage Lines: 57.82%

### 3. 基线观察

- 测试通过，但运行中存在大量后端日志输出。
- `JWT_SECRET` 在开发环境使用临时密钥并输出警告，生产环境仍需真实配置。
- 原审计报告中的 `/kb/events/track` 缺失判断已在本轮复核中修正，后端实际存在 `/api/v1/kb/events/track`。

---

## 二、接口状态总览

| 分类 | 数量 | 说明 |
|------|------|------|
| 已匹配 | 18 | 前端调用与后端路由存在明确对应关系 |
| 缺失 | 19 | 前端已有调用，后端未提供对应路由 |
| 路径或能力需验证 | 6 | 可能存在路由但请求参数、响应结构或业务闭环需进一步确认 |
| 高优先级缺口 | 9 | 影响登录、孩子档案、营养、评估和内容收藏 |

---

## 三、已匹配接口

| 前端调用路径 | 后端路由 | Method | 认证 | 覆盖模块 |
|-------------|----------|--------|------|----------|
| `/chat` | `/api/v1/chat` | POST | required | AI聊天 |
| `/assessments` | `/api/v1/assessments` | GET | required | 评估列表 |
| `/assessments/:code/questions` | `/api/v1/assessments/:code/questions` | GET | required | 评估题目 |
| `/assessments/:code/submit` | `/api/v1/assessments/:code/submit` | POST | required | 评估提交 |
| `/assessments/results/:id` | `/api/v1/assessments/results/:id` | GET | required | 评估结果 |
| `/assessments/history` | `/api/v1/assessments/history` | GET | required | 评估历史 |
| `/parenting/articles` | `/api/v1/parenting/articles` | GET | optional | 育儿文章列表 |
| `/parenting/articles/:id` | `/api/v1/parenting/articles/:id` | GET | optional | 育儿文章详情 |
| `/education/tasks/today` | `/api/v1/education/tasks/today` | GET | required | 教育任务 |
| `/education/tasks/:id/complete` | `/api/v1/education/tasks/:id/complete` | POST | required | 任务完成 |
| `/education/progress/overview` | `/api/v1/education/progress/overview` | GET | required | 教育进度 |
| `/membership/info` | `/api/v1/membership/info` | GET | required | 会员信息 |
| `/membership/trial/activate` | `/api/v1/membership/trial/activate` | POST | required | 试用激活 |
| `/membership/promo/redeem` | `/api/v1/membership/promo/redeem` | POST | required | 兑换码 |
| `/payment/create` | `/api/v1/payment/create` | POST | route-level auth | 支付创建 |
| `/payment/unified-order` | `/api/v1/payment/unified-order` | POST | route-level auth | 统一下单 |
| `/referral/code` | `/api/v1/referral/code` | GET | required | 邀请码 |
| `/referral/stats` | `/api/v1/referral/stats` | GET | required | 邀请统计 |
| `/kb/events/track` | `/api/v1/kb/events/track` | POST | required | 知识库埋点 |

---

## 四、缺失接口清单

### 4.1 P0 级缺失

| 前端调用路径 | 调用位置 | 缺失影响 | 修复阶段 |
|-------------|----------|----------|----------|
| `/auth/login` | `miniprogram/app.js` | 用户无法完成登录 | 阶段1 |
| `/auth/refresh` | `miniprogram/app.js` | Token无法刷新 | 阶段1 |
| `/auth/me` | `miniprogram/app.js` | 个人中心无法获取用户信息 | 阶段1 |
| `/auth/account-deletion` | `pages/profile/account-deletion/account-deletion.js` | 账号注销无法执行 | 阶段1 |
| `/children` | `pages/profile/children/children.js`, `pages/textbook/textbook.js` | 孩子档案列表缺失 | 阶段2 |
| `/children/:id` | `pages/profile/child-edit/child-edit.js` | 孩子档案详情、编辑、删除缺失 | 阶段2 |
| `/children/:id/set-default` | `pages/profile/children/children.js` | 默认孩子切换缺失 | 阶段2 |
| `/nutrition/recommendations` | `pages/nutrition/nutrition.js`, `recipe-list.js` | 营养推荐无法使用 | 阶段3 |

### 4.2 P1 级缺失

| 前端调用路径 | 调用位置 | 缺失影响 | 修复阶段 |
|-------------|----------|----------|----------|
| `/nutrition/recipes` | `pages/nutrition/recipe-list/recipe-list.js` | 食谱列表缺失 | 阶段3 |
| `/nutrition/recipes/:id` | `pages/nutrition/recipe-detail/recipe-detail.js` | 食谱详情缺失 | 阶段3 |
| `/nutrition/recipes/:id/favorite` | `nutrition.js`, `recipe-list.js`, `recipe-detail.js` | 食谱收藏缺失 | 阶段3 |
| `/parenting/articles/:id/favorite` | `parenting.js`, `article-list.js`, `article-detail.js`, `search.js` | 育儿文章收藏缺失 | 阶段4 |
| `/parenting/articles/:id/related` | `article-detail.js` | 相关文章缺失 | 阶段4 |
| `/parenting/hot-keywords` | `parenting/search/search.js` | 热门搜索词缺失 | 阶段4 |
| `/parenting/search` | `parenting/search/search.js` | 独立搜索接口缺失，现有后端为 `/parenting/articles/search` | 阶段4 |
| `/assessments/history/count` | `assessment/assessment.js` | 评估历史数量缺失 | 阶段5 |
| `/assessments/records/:id` | `assessment/history/history.js` | 删除或管理评估记录缺失 | 阶段5 |

### 4.3 教育知识点相关缺失

| 前端调用路径 | 调用位置 | 缺失影响 | 修复阶段 |
|-------------|----------|----------|----------|
| `/education/knowledge/detail` | `textbook/knowledge-detail/knowledge-detail.js` | 知识点详情缺失 | 阶段5后或阶段4扩展 |
| `/education/knowledge/chapters` | `textbook/knowledge-list/knowledge-list.js` | 知识章节列表缺失 | 阶段5后或阶段4扩展 |
| `/education/progress` | `textbook/knowledge-detail/knowledge-detail.js` | 知识点进度更新缺失 | 阶段5后或阶段4扩展 |

---

## 五、需验证接口

| 接口 | 风险点 | 验证方式 | 修复阶段 |
|------|--------|----------|----------|
| `/payment/create` | 当前可能返回模拟支付成功，真实支付能力需与开关一致 | 增加配置缺失测试和订单状态测试 | 阶段6 |
| `/payment/unified-order` | 真实微信支付SDK、商户号和回调验签未确认 | 增加支付配置门禁 | 阶段6 |
| `/membership/trial/activate` | 前端判断字段与后端返回字段需复核 | membership 测试补充字段断言 | 阶段6 |
| `/referral/code` | 仅弹窗展示邀请码，分享闭环较弱 | 手动验收分享链路 | 阶段6后 |
| `/chat` | 后端仍以模拟AI为主 | AI mock测试和真实配置门禁 | 阶段7 |
| `/assessments/:code/questions` | 后端硬编码题目数量不足 | 补齐题库和数量断言 | 阶段5 |

---

## 六、后端路由注册基线

当前 `backend/src/app.js` 已注册:

| 注册前缀 | 路由文件 | 认证策略 |
|----------|----------|----------|
| `/api/v1/health` | `routes/health.js` | public |
| `/api/v1/assessments` | `routes/assessments.js` | authenticateToken |
| `/api/v1/chat` | `routes/chat.js` | authenticateToken |
| `/api/v1/education` | `routes/education.js` | authenticateToken |
| `/api/v1/parenting` | `routes/parenting.js` | optionalAuth |
| `/api/v1/knowledge` | `routes/knowledge.js` | optionalAuth |
| `/api/v1/kb/events` | `routes/events.js` | authenticateToken |
| `/api/v1/recommendations` | `routes/recommendations.js` | authenticateToken |
| `/api/v1/membership` | `routes/membership.js` | authenticateToken |
| `/api/v1/payment` | `routes/payment.js` | route-level auth |
| `/api/v1/referral` | `routes/referral.js` | authenticateToken |

缺失注册前缀:

- `/api/v1/auth`
- `/api/v1/children`
- `/api/v1/nutrition`

---

## 七、阶段1进入条件

阶段1开始前必须满足:

- 当前工作区干净。
- 阶段0文档已提交。
- 后端测试基线通过。
- 明确认证 token payload 不破坏 membership 和 referral 现有测试。

阶段1完成后必须验证:

- `/auth/login`
- `/auth/refresh`
- `/auth/me`
- `/auth/account-deletion`
- 既有 `membership.test.js` 仍通过。

---

## 八、阶段0结论

阶段0确认项目具备可测试基线，但核心接口缺口比原审计摘要更具体。后续修复应先完成 `/auth` 和 `/children`，再进入营养、内容收藏、评估和支付门禁，避免下游功能在身份体系未稳定前反复返工。
