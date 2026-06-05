#!/usr/bin/env node
// 数据库备份脚本

const fs = require('fs');
const path = require('path');

// 配置
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'app.db');
const BACKUP_DIR = path.join(__dirname, '..', '..', 'data', 'backups');
const MAX_BACKUPS = 7; // 保留最近7个备份

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// 生成备份文件名
function getBackupFileName() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .replace('Z', '');
  return `backup_${timestamp}.db`;
}

// 清理旧备份
function cleanOldBackups() {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.path);
          console.log(`[Backup] 删除旧备份: ${file.name}`);
        } catch (err) {
          console.error(`[Backup] 删除旧备份失败: ${file.name}`, err);
        }
      });
    }
  } catch (err) {
    console.error('[Backup] 清理旧备份失败:', err);
  }
}

// 执行备份
function backup() {
  try {
    // 检查数据库文件是否存在
    if (!fs.existsSync(DB_PATH)) {
      console.error('[Backup] 数据库文件不存在:', DB_PATH);
      process.exit(1);
    }

    const backupFileName = getBackupFileName();
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    // 复制数据库文件
    fs.copyFileSync(DB_PATH, backupPath);

    console.log(`[Backup] 备份成功: ${backupFileName}`);
    console.log(`[Backup] 备份路径: ${backupPath}`);
    console.log(`[Backup] 数据库大小: ${(fs.statSync(DB_PATH).size / 1024).toFixed(2)} KB`);

    // 清理旧备份
    cleanOldBackups();

    return backupPath;
  } catch (err) {
    console.error('[Backup] 备份失败:', err);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const backupPath = backup();
  console.log('[Backup] 备份完成');
}

module.exports = { backup, cleanOldBackups };
