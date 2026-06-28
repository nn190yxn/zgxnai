# 高频场景内容生产同步记录 2026-06-28

## 背景

本次重写了 `backend/examples/high-frequency-scene-content-batch-c*-2026-06-19.json` 中的高频场景文章，覆盖 25 个文件、300 篇文章。

## 同步原则

1. 不能直接使用 `import-knowledge-base.js` 导入这批文件。
2. 该导入脚本按 `articles.title` 做 upsert，本次大量标题发生变化，直接导入会把改名文章插成新文章。
3. 生产同步采用旧标题到新内容的原地更新策略。
4. 对生产库里已经改过标题的 6 篇“顶嘴升级”文章，使用生产 `articles.id` 做精确映射更新。

## 生产备份

```bash
# 备份生产 articles 表
mysqldump --no-tablespaces -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" articles > backups/articles-before-content-rewrite-20260628.sql
```

备份路径：`/home/ubuntu/niuniu-parenting/backups/articles-before-content-rewrite-20260628.sql`

## 同步结果

精确更新脚本 dry-run 结果：

```json
{
  "total": 300,
  "matchedOld": 294,
  "matchedNew": 0,
  "updated": 300,
  "wouldInsert": 0,
  "missing": 0
}
```

应用结果同 dry-run，300 篇文章全部原地更新，未插入新文章。

## 精确校验

生产库逐条对比仓库内容：

```json
{
  "total": 300,
  "matched": 300,
  "exact": 300,
  "mismatch": 0,
  "missing": 0,
  "duplicateTitles": 0,
  "residual": 0
}
```

接口抽样：

1. `GET https://api.woyai.cn/api/v1/parenting/articles?keyword=孩子一提醒就顶嘴&page=1&pageSize=5`
2. `GET https://api.woyai.cn/api/v1/parenting/articles/2764`

两项均返回新文案：`孩子一提醒就顶嘴，把话说短`。

## 后续注意

批量改育儿锦囊文章标题时，先判断是否需要保留原文章 `id`。若标题变化较多，应按旧标题或生产 `id` 原地更新，避免通过标题 upsert 造成重复文章。
