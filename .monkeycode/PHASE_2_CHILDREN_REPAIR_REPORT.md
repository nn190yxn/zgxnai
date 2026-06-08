# 阶段2孩子档案闭环修复报告

**完成日期**: 2026-06-08  
**基线标签**: `repair-baseline-phase-2-20260608-1405`  
**修复范围**: `/api/v1/children` 孩子档案接口与 children 表兼容字段。

---

## 一、修复内容

### 新增接口

| 接口 | Method | 说明 |
|------|--------|------|
| `/api/v1/children` | GET | 获取当前用户孩子档案列表 |
| `/api/v1/children` | POST | 新增孩子档案 |
| `/api/v1/children/:id` | GET | 获取单个孩子档案 |
| `/api/v1/children/:id` | PUT | 更新孩子档案 |
| `/api/v1/children/:id/set-default` | PUT | 设置默认孩子 |
| `/api/v1/children/:id` | DELETE | 删除孩子档案 |

### 修改文件

- `backend/src/routes/children.js`: 新增孩子档案 CRUD 路由。
- `backend/src/app.js`: 注册 `/api/v1/children`。
- `backend/src/config/database.js`: 为 children 表增加兼容字段迁移。
- `backend/tests/children.test.js`: 新增孩子档案接口测试。

---

## 二、全局兼容性设计

- 所有 children 接口均要求认证，并按 `user_id` 校验归属关系。
- 响应同时返回 `is_default` 和 `isDefault`，兼容后端数据库字段与前端页面字段。
- 响应同时返回 `birthday` 和 `birth_date`，兼容不同前端页面读取方式。
- 保留 `height/current_height`、`weight/current_weight` 双字段映射，降低前端改动风险。
- 删除默认孩子后自动迁移默认状态到剩余第一个孩子。
- 删除孩子时同步清理该孩子的评估记录和维度记录。

---

## 三、回测结果

执行命令:

```bash
cd backend && npm test
```

结果:

- Test Suites: 4 passed, 4 total
- Tests: 49 passed, 49 total
- Coverage Lines: 61.43%

### 重点回归结论

- 孩子档案新增、列表、详情、更新、设置默认、删除均通过测试。
- 认证测试继续通过。
- 既有评估、会员、支付、邀请测试继续通过。
- children 表兼容字段迁移未破坏既有数据初始化。

---

## 四、阶段2结论

阶段2修复完成。P0中的 `/children`、`/children/:id`、`/children/:id/set-default` 已具备后端实现和回归测试。下一阶段可以进入营养模块闭环修复。
