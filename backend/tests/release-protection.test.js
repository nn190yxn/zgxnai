const assert = require('assert');
const protection = require('../src/mysql-production/release-protection');
const { contentWriteGate } = require('../src/mysql-production/platform-routes');
const publishing = require('../src/mysql-production/content-publishing');
const contentSource = require('../../miniprogram/utils/content-source');

describe('渐进式发布保护', () => {
  test('新开关默认关闭且可独立配置', () => {
    assert.deepStrictEqual(protection.getReleaseFlags({}), {
      serverContentRead: false,
      miniprogramRemoteContent: false,
      adminContentWrite: false
    });
    assert.deepStrictEqual(protection.getReleaseFlags({
      RUNTIME_SERVER_CONTENT_READ_ENABLED: 'true',
      RUNTIME_MINIPROGRAM_REMOTE_CONTENT_ENABLED: '0',
      RUNTIME_ADMIN_CONTENT_WRITE_ENABLED: 'on'
    }), {
      serverContentRead: true,
      miniprogramRemoteContent: false,
      adminContentWrite: true
    });
  });

  test('告警记录只保留事件元数据，不泄露错误详情', async () => {
    const logs = [];
    const entry = await protection.recordAlert({ event: 'publish_failed', code: 'ER_DB', secret: 'token' }, {
      logger: { error: (message) => logs.push(message) }
    });
    assert.equal(entry.code, 'ER_DB');
    assert.equal(logs[0].includes('token'), false);
    assert.equal(logs[0].includes('publish_failed'), true);
  });

  test('后台写模块关闭时拒绝写入并保留读取', () => {
    const gate = contentWriteGate({ adminContentWrite: false });
    const denied = { statusCode: 0, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
    gate({ method: 'POST' }, denied, () => { throw new Error('unexpected'); });
    assert.equal(denied.statusCode, 503);
    let passed = false;
    gate({ method: 'GET' }, {}, () => { passed = true; });
    assert.equal(passed, true);
  });

  test('定时发布重复执行只产生一次发布', async () => {
    let run = 0;
    const connection = {
      async execute(sql) {
        if (sql.includes('SELECT id, content_type')) return [run++ === 0 ? [{ id: 1, version_id: 2 }] : []];
        if (sql.includes('UPDATE content_versions')) return [{ affectedRows: 1 }];
        return [{ affectedRows: 1 }];
      }
    };
    assert.equal(await publishing.publishDue(connection, new Date()), 1);
    assert.equal(await publishing.publishDue(connection, new Date()), 0);
  });

  test('远程内容开关关闭或接口失败时仍走旧接口和本地内容', async () => {
    const calls = [];
    const app = {
      globalData: { runtimeConfig: { miniprogramRemoteContentEnabled: false } },
      request: async (request) => {
        calls.push(request.url);
        if (request.url === '/legacy/article') return { id: 'legacy_article' };
        throw new Error('remote unavailable');
      }
    };
    const legacy = await contentSource.readPublishedOrLegacy(app, 'article', '1', '/legacy/article', { id: 'local_article' });
    assert.equal(legacy.item.id, 'legacy_article');
    assert.deepStrictEqual(calls, ['/legacy/article']);
    const local = await contentSource.readPublished(app, 'article', '2', { id: 'local_article' });
    assert.equal(local.item.id, 'local_article');
  });
});
