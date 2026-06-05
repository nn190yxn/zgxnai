#!/usr/bin/env node
// 数据库恢复脚本

const fs = require('fs');
const path = require('path');

// 配置
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'app.db');
const BACKUP_DIR = path.join(__dirname, '..', '..', 'data', 'backups');

// 列出所有备份
function listBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      console.log('[Restore] 备份目录不存在');
      return [];
    }

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup_') && file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        stats: fs.statSync(path.join(BACKUP_DIR, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);

    return files;
  } catch (err) {
    console.error('[Restore] 列出备份失败:', err);
    return [];
  }
}

// 恢复指定备份
function restore(backupName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupName);

    // 检查备份文件是否存在
    if (!fs.existsSync(backupPath)) {
      console.error('[Restore] 备份文件不存在:', backupPath);
      process.exit(1);
    }

    // 检查当前数据库是否存在
    if (fs.existsSync(DB_PATH)) {
      // 创建当前数据库的临时备份
      const tempBackup = `${DB_PATH}.tmp`;
      fs.copyFileSync(DB_PATH, tempBackup);
      console.log('[Restore] 已创建当前数据库临时备份');
    }

    // 恢复备份
    fs.copyFileSync(backupPath, DB_PATH);
    console.log(`[Restore] 恢复成功: ${backupName}`);
    console.log(`[Restore] 数据库路径: ${DB_PATH}`);

    return true;
  } catch (err) {
    console.error('[Restore] 恢复失败:', err);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // 列出所有备份
    const backups = listBackups();
    if (backups.length === 0) {
      console.log('[Restore] 没有可用的备份');
      process.exit(0);
    }

    console.log('[Restore] 可用备份列表:');
    backups.forEach((backup, index) => {
      const size = (backup.stats.size / 1024).toFixed(2);
      const date = backup.stats.mtime.toISOString();
      console.log(`  ${index + 1}. ${backup.name} (${size} KB) - ${date}`);
    });

    console.log('\n[Restore] 使用方法: node restore.js <备份文件名>');
  } else {
    const backupName = args[0];
    restore(backupName);
  }
}

module.exports = { listBackups, restore };
