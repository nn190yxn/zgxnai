#!/bin/bash
# 回滚脚本 - 会员制度回滚
# 使用方式: bash scripts/rollback-membership.sh <备份路径>

set -e

if [ -z "$1" ]; then
    echo "错误: 请指定备份路径"
    echo "用法: bash scripts/rollback-membership.sh <备份路径>"
    echo "示例: bash scripts/rollback-membership.sh /workspace/backup/20250527_123456"
    exit 1
fi

BACKUP_DIR="$1"
DB_PATH="/workspace/backend/data/app.db"

if [ ! -d "$BACKUP_DIR" ]; then
    echo "错误: 备份目录不存在: $BACKUP_DIR"
    exit 1
fi

echo "=== 开始回滚 ==="
echo "备份目录: $BACKUP_DIR"

# 确认
read -p "确认回滚? 这将覆盖当前数据 [y/N]: " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

# 1. 备份当前数据库（以防万一）
if [ -f "$DB_PATH" ]; then
    echo "备份当前数据库..."
    cp "$DB_PATH" "$DB_PATH.pre-rollback.$(date +%H%M%S)"
fi

# 2. 恢复数据库
if [ -f "$BACKUP_DIR/db/app.db" ]; then
    echo "恢复数据库..."
    cp "$BACKUP_DIR/db/app.db" "$DB_PATH"
    echo "数据库恢复完成"
else
    echo "警告: 备份中无数据库文件"
fi

# 3. 恢复代码
if [ -d "$BACKUP_DIR/code" ]; then
    echo "恢复代码..."
    rsync -av "$BACKUP_DIR/code/backend/src/" /workspace/backend/src/
    rsync -av "$BACKUP_DIR/code/miniprogram/" /workspace/miniprogram/
    echo "代码恢复完成"
fi

echo "=== 回滚完成 ==="
