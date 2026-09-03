const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { contentAction } = require('../backend/src/mysql-production/platform-routes');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const access = read('backend/src/mysql-production/admin-access.js');
const routes = read('backend/src/mysql-production/platform-routes.js');
const operations = read('admin-portal/modules/operations.js');
const home = read('miniprogram/pages/index/index.js');
const wxml = read('miniprogram/pages/index/index.wxml');

assert.ok(access.includes("banner:read") && access.includes("banner:write"), '角色权限应包含 Banner 读写');
['app.get', 'app.post', 'app.put', '/banners', 'home_banner', 'content_reviews', 'admin_audit_logs'].forEach((text) => assert.ok(routes.includes(text), `后端 Banner 流程应包含 ${text}`));
['review_status = \'approved\'', 'publish_status = \'published\'', 'published_at', 'sort_order', 'enabled', 'start_at', 'end_at'].forEach((text) => assert.ok(routes.includes(text), `公开 Banner 应包含发布过滤 ${text}`));
['banners', 'banner:read', 'banner:write', 'image_url', 'mobile_image_url', 'scheduled_at', 'submit-review', 'restore', "key === 'banners' ? form.elements.banner_id : form.elements.content_id", '请先保存 Banner 草稿', '请输入有效的历史版本号', 'Banner 预览', "existingId ? 'PUT' : 'POST'", "existingId ? `/banners/${encodeURIComponent(existingId)}` : '/banners'"].forEach((text) => assert.ok(operations.includes(text), `后台 Banner 模块应包含 ${text}`));
['requestedVersion', '历史版本号无效', '历史版本不存在', 'source.id', "contentType = req.params.type", "'home_banner'", 'restored_from'].forEach((text) => assert.ok(routes.includes(text), `后端版本恢复应包含 ${text}`));
['/home/banners', 'bannerList', 'mobile_image_url', 'image_url', 'bannerLoading'].forEach((text) => assert.ok(home.includes(text), `首页应包含 Banner 远程能力 ${text}`));
['onBannerImageError', 'item.image_url', 'onTapBannerCta'].forEach((text) => assert.ok(wxml.includes(text), `首页模板应包含 ${text}`));
async function testBannerRestore() {
  let connectionRequested = false;
  const invalidResponse = createResponse();
  await contentAction({ getConnection: async () => { connectionRequested = true; } }, 'draft')({ params: { id: 'welcome' }, path: '/content/home_banner/welcome/restore', body: {}, admin: { adminUserId: 7 }, ip: '127.0.0.1' }, invalidResponse, fail);
  assert.strictEqual(invalidResponse.statusCode, 400, '缺少历史版本号应返回 400');
  assert.strictEqual(connectionRequested, false, '非法恢复请求不应占用数据库连接');

  const calls = [];
  const connection = {
    beginTransaction: async () => calls.push(['begin']),
    execute: async (sql, params) => {
      calls.push([sql, params]);
      if (sql.includes('ORDER BY version DESC')) return [[{ id: 22, version: 2, publish_status: 'published' }]];
      if (sql.includes('AND version = ?')) return [[{ id: 11, version: 1, payload: '{"title":"旧版本"}' }]];
      if (sql.startsWith('INSERT INTO content_versions')) return [{ affectedRows: 1, insertId: 33 }];
      return [{ affectedRows: 1 }];
    },
    commit: async () => calls.push(['commit']),
    rollback: async () => calls.push(['rollback']),
    release: () => calls.push(['release'])
  };
  const response = createResponse();
  await contentAction({ getConnection: async () => connection }, 'draft')({ params: { id: 'welcome' }, path: '/content/home_banner/welcome/restore', body: { version: 1 }, admin: { adminUserId: 7 }, ip: '127.0.0.1' }, response, fail);

  const latestQuery = calls.find(([sql]) => String(sql).includes('ORDER BY version DESC'));
  const sourceQuery = calls.find(([sql]) => String(sql).includes('AND version = ?'));
  const insertQuery = calls.find(([sql]) => String(sql).startsWith('INSERT INTO content_versions'));
  const auditQuery = calls.find(([sql]) => String(sql).startsWith('INSERT INTO admin_audit_logs'));
  assert.deepStrictEqual(latestQuery[1], ['home_banner', 'welcome'], 'Banner 专用路由应解析为 home_banner 类型');
  assert.deepStrictEqual(sourceQuery[1], ['home_banner', 'welcome', 1], '恢复应查询指定历史版本');
  assert.deepStrictEqual(insertQuery[1], [3, 7, 11], '恢复应基于历史版本创建递增草稿版本');
  assert.strictEqual(auditQuery[1][1], 'content.restore', '恢复审计应使用明确动作名');
  assert.deepStrictEqual(response.body.data, { id: 33, status: 'draft', version: 3, restored_from: 1 });
}

function createResponse() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function fail(error) { throw error; }

testBannerRestore().then(() => console.log('Home banner management structure tests passed.')).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
