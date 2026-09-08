const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildManifest, verifyContracts } = require('./verify-production-release');

test('release manifest includes transitive publication dependencies and admin assets', () => {
  verifyContracts();
  const manifest = buildManifest();
  const files = new Set(manifest.map((entry) => entry.path));
  for (const file of [
    'backend/src/mysql-production/managed-editing.js',
    'backend/src/mysql-production/recipe-content.js',
    'backend/src/mysql-production/platform-routes.js',
    'backend/src/mysql-production/content-publishing.js',
    'backend/src/scripts/publish-due-content.js',
    'backend/src/nutrition-recipes.json',
    'admin-portal/index.html',
    'admin-portal/modules/operations.js'
  ]) assert.ok(files.has(file), `Missing release dependency: ${file}`);
  assert.equal(files.size, manifest.length);
  assert.ok(manifest.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256) && entry.bytes > 0));
  assert.ok(manifest.every((entry) => !entry.path.includes('.env') && !entry.path.endsWith('.pem')));
});
