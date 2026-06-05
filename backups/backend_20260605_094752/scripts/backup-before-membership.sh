#!/bin/bash
# 备份脚本 - 会员制度上线前备份
# 执行：bash scripts/backup-before-membership.sh

set -e

BACKUP_DIR="/workspace/backup/$(date +%Y%m%d_%H%M%S)"
DB_PATH="/workspace/backend/data/app.db"

echo "=== 开始备份 ==="
echo "备份目录: $BACKUP_DIR"

# 创建备份目录
mkdir -p "$BACKUP_DIR/db"
mkdir -p "$BACKUP_DIR/code"
mkdir -p "$BACKUP_DIR/logs"

# 1. 数据库备份
if [ -f "$DB_PATH" ]; then
    echo "备份数据库..."
    cp "$DB_PATH" "$BACKUP_DIR/db/app.db"
    sqlite3 "$DB_PATH" ".dump" > "$BACKUP_DIR/db/app.sql"
    echo "数据库备份完成"
else
    echo "警告：数据库文件不存在: $DB_PATH"
fi

# 2. 代码备份
echo "备份代码..."
rsync -av --exclude='node_modules' --exclude='.git' /workspace/backend/src "$BACKUP_DIR/code/"
rsync -av --exclude='node_modules' --exclude='.git' /workspace/miniprogram "$BACKUP_DIR/code/"

# 3. 备份配置文件
cp /workspace/backend/package.json "$BACKUP_DIR/" 2>/dev/null || true
cp /workspace/miniprogram/app.js "$BACKUP_DIR/" 2>/dev/null || true

# 4. 记录备份信息
cat > "$BACKUP_DIR/backup-info.txt" <<EOF
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
备份内容: 会员制度上线前完整备份
数据库: $DB_PATH
代码: backend/src, miniprogram
备注: 如回滚需恢复数据库和代码
EOF

echo "=== 备份完成 ==="
echo "备份路径: $BACKUP_DIR"
echo ""
echo "回滚命令:"
echo "  cp $BACKUP_DIR/db/app.db $DB_PATH"
echo "  rsync -av $BACKUP_DIR/code/ /workspace/"
