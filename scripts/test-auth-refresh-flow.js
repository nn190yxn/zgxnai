const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function testProductionRefreshHandler() {
  const source = read('backend/src/mysql-production/server.js');
  assert.match(source, /function signRefreshToken\(payload\)/);
  assert.match(source, /JWT_REFRESH_EXPIRES_IN \|\| '30d'/);
  assert.match(source, /catch \(err\) \{\s*res\.status\(401\)\.json\(\{ success: false, code: 'REFRESH_TOKEN_EXPIRED'/);
  assert.match(source, /decoded\.tokenType !== 'refresh'/);
  assert.match(source, /refresh_token: signRefreshToken\(payload\)/);
}

function testMiniprogramStoresRotatedRefreshToken() {
  const source = read('miniprogram/app.js');
  assert.match(source, /if \(data\.refresh_token\) \{\s*wx\.setStorageSync\('refreshToken', data\.refresh_token\);\s*that\.globalData\.refreshToken = data\.refresh_token;/);
}

testProductionRefreshHandler();
testMiniprogramStoresRotatedRefreshToken();

console.log('Auth refresh flow tests passed.');
