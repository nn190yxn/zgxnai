# 知识库生产恢复记录 2026-06-26

## 恢复目标

- 恢复小牛育儿生产知识库中被回滚或丢失的文章、阅读任务、场景标签和短锦囊内容。
- 保持非破坏式导入策略，导入前先完成生产数据备份。

## 生产备份

- 备份目录：`/home/ubuntu/niuniu-parenting/backups/knowledge-restore-20260626/`
- 备份文件：`knowledge_tables_before_restore.sql`
- 备份表：`articles`、`reading_tasks`、`parenting_scene_tags`、`parenting_scene_aliases`、`parenting_scene_recommendations`、`parenting_tips`
- 备份命令需使用 `mysqldump --no-tablespaces`，生产 MySQL 账号缺少 `PROCESS` 权限时 tablespaces 导出会报错。

## 恢复前计数

- `articles`: 260
- `reading_tasks`: 472
- `parenting_scene_tags`: 6
- `parenting_tips`: 0

## 恢复后计数

- `articles`: 2800
- `published_articles`: 2800
- `reading_tasks`: 649
- `parenting_scene_tags`: 58
- `parenting_tips`: 7466
- `active_tips`: 7466

## 文章形态分布

- `both`: 1304
- `method`: 839
- `theory`: 297
- `NULL`: 360

## 短锦囊结构化结果

- `display_type=action`: 3040
- `display_type=insight`: 4426
- `display_type=raw`: 0
- `verify-tips-structure`: `OVERALL PASS`

## 关键脚本修复

- `backend/src/scripts/extract-parenting-tips.js`: 移除无条件 `TRUNCATE TABLE parenting_tips`，表非空时停止写入。
- `backend/src/scripts/structure-parenting-tips.js`: 将分页查询从 `LIMIT ? OFFSET ?` 改为安全整数内联，兼容生产 mysql2 预处理分页限制。

## 验证结果

- `npm run lint` 通过，后端和小程序语法检查通过。
- `https://api.woyai.cn/api/v1/parenting/articles?age_group=3-4岁&page=1&page_size=3` 返回成功。
- `https://api.woyai.cn/api/v1/runtime/config` 返回 `config_loaded: true`，`ai_service_ready: true`。
- PM2 验证：`niuniu-backend` online，`woying-backend` online。
