const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '..');
const releaseRoots = [
  'backend/src/mysql-production/server.js',
  'backend/src/mysql-production/knowledge-content.js',
  'backend/src/mysql-production/migration-runner.js',
  'backend/src/mysql-production/migrations/index.js',
  'backend/src/mysql-production/growth-timeline.js',
  'backend/src/mysql-production/ability-training.js',
  'backend/src/mysql-production/stage-report.js',
  'backend/src/mysql-production/report-membership.js',
  'backend/src/mysql-production/event-protocol.js',
  'backend/src/mysql-production/analytics-quality.js',
  'backend/src/mysql-production/api-response.js',
  'backend/src/shared/business-dimensions.js',
  'shared/business-dimensions.json',
  'backend/examples/knowledgebase-sample.json',
  'backend/src/scripts/publish-due-content.js',
  'backend/package.json'
];

function collectReleaseFiles(root, entries) {
  const files = new Set();
  function visit(relativePath) {
    const normalized = relativePath.split(path.sep).join('/');
    if (files.has(normalized)) return;
    const absolute = path.resolve(root, relativePath);
    assert(absolute.startsWith(path.resolve(root) + path.sep), `发布依赖超出项目目录: ${relativePath}`);
    assert(['.js', '.json', '.html', '.css', '.svg', '.png', '.webp', '.ico'].includes(path.extname(absolute)), `不支持的发布文件类型: ${relativePath}`);
    const content = fs.readFileSync(absolute);
    files.add(normalized);
    if (path.extname(absolute) !== '.js') return;
    for (const match of content.toString('utf8').matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
      const dependency = require.resolve(path.resolve(path.dirname(absolute), match[1]));
      visit(path.relative(root, dependency));
    }
  }
  entries.forEach(visit);
  const portal = path.join(root, 'admin-portal');
  function visitPortal(directory) {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) visitPortal(filename);
      else if (/\.(js|json|html|css|svg|png|webp|ico)$/.test(entry.name)) visit(path.relative(root, filename));
    }
  }
  visitPortal(portal);
  return [...files].sort();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readReleaseFile(relativePath) {
  const absolutePath = path.join(workspaceRoot, relativePath);
  assert(fs.existsSync(absolutePath), `缺少发布文件: ${relativePath}`);
  const stat = fs.statSync(absolutePath);
  assert(stat.isFile(), `发布路径必须是文件: ${relativePath}`);
  return fs.readFileSync(absolutePath);
}

function verifyContracts() {
  const serverSource = readReleaseFile('backend/src/mysql-production/server.js').toString('utf8');
  assert(
    /await runStartupStep\('migrations', \(\) => runMigrations\(pool\), \{ critical: true \}\);/.test(serverSource),
    '生产入口缺少关键迁移执行'
  );
  assert(
    /await runStartupStep\('legacy_schema', \(\) => ensureProductionTables\(\), \{ critical: true \}\);/.test(serverSource),
    '生产入口缺少关键历史表初始化'
  );
  assert(serverSource.includes('process.exit(1);'), '生产入口缺少启动失败退出保护');
  assert(!serverSource.includes('MySQL init skipped'), '生产入口仍允许跳过数据库初始化');
  assert(serverSource.includes('/knowledge/contents`'), '生产入口缺少知识内容路由');
  assert(serverSource.includes('/knowledge/ability-content`'), '生产入口缺少知识兼容路由');

  const migrations = require(path.join(workspaceRoot, 'backend/src/mysql-production/migrations'));
  assert(Array.isArray(migrations) && migrations.length > 0, '迁移定义不能为空');
  const versions = migrations.map((migration) => migration.version);
  assert(new Set(versions).size === versions.length, '迁移版本必须唯一');
  migrations.forEach((migration) => {
    assert(migration.version && migration.name, '迁移必须包含版本和名称');
    assert(Array.isArray(migration.statements) && migration.statements.length > 0, `迁移语句不能为空: ${migration.version}`);
  });

  const dimensions = JSON.parse(readReleaseFile('shared/business-dimensions.json').toString('utf8'));
  assert(Array.isArray(dimensions.ageSegments) && dimensions.ageSegments.length > 0, '业务字典缺少年龄段');
  assert(Array.isArray(dimensions.abilities) && dimensions.abilities.length > 0, '业务字典缺少能力维度');
  assert(Array.isArray(dimensions.sceneCategories) && dimensions.sceneCategories.length > 0, '业务字典缺少场景分类');

  const knowledgeItems = JSON.parse(readReleaseFile('backend/examples/knowledgebase-sample.json').toString('utf8'));
  assert(Array.isArray(knowledgeItems) && knowledgeItems.length > 0, '知识降级数据不能为空');
}

function buildManifest() {
  return collectReleaseFiles(workspaceRoot, releaseRoots).map((relativePath) => {
    const content = readReleaseFile(relativePath);
    return {
      path: relativePath,
      bytes: content.length,
      sha256: crypto.createHash('sha256').update(content).digest('hex')
    };
  });
}

if (require.main === module) {
  verifyContracts();
  const manifest = buildManifest();
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, files: manifest }, null, 2)}\n`);
  } else {
    manifest.forEach((entry) => console.log(`${entry.sha256}  ${entry.path}  ${entry.bytes} bytes`));
    console.log(`Production release verification passed for ${manifest.length} files.`);
  }
}

module.exports = { collectReleaseFiles, buildManifest, verifyContracts };
