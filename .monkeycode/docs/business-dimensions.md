# 统一业务维度

当前项目的年龄段、能力方向、家庭场景分类和内容形态由 `shared/business-dimensions.json` 统一定义。

## 读取方式

- 后端读取模块：`backend/src/shared/business-dimensions.js`
- 小程序读取模块：`miniprogram/utils/business-dimensions.js`

两个读取模块都提供年龄段、月龄推断、旧年龄值映射、能力别名解析、场景分类和内容形态查询能力。

## 规则

- 标准年龄段使用 `0-1岁`、`1-2岁`、`2-3岁`、`3-4岁`、`4-5岁`、`5-6岁`、`6-9岁`、`9-12岁`。
- `4-6岁` 和 `6岁以上` 等历史宽年龄值会映射为多个标准年龄代码，调用方需要支持多值结果。
- 能力方向使用稳定 code，展示名称和历史别名由共享 JSON 管理。
- 正式知识内容使用 `article`、`task`、`scene`、`recipe`、`assessment` 五种内容形态。
- 业务模块逐步使用标准 code，旧文本只通过映射函数兼容。
