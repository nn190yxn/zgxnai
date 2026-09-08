const assert = require('node:assert/strict');
const publishing = require('../src/mysql-production/content-publishing');
const { registerPlatformRoutes, registerPublicRoutes, contentAction } = require('../src/mysql-production/platform-routes');

function response() { return { status() { return this; }, json(value) { this.body = value; } }; }
function routes(pool, publicOnly = false) {
  const handlers = {};
  const app = { use() {}, get(path, ...args) { handlers[`GET ${path}`] = args.at(-1); }, post(path, ...args) { handlers[`POST ${path}`] = args.at(-1); }, put(path, ...args) { handlers[`PUT ${path}`] = args.at(-1); } };
  (publicOnly ? registerPublicRoutes : registerPlatformRoutes)(app, { prefix: '/test', pool, uploadRoot: '/tmp/opencode', releaseFlags: { serverContentRead: true, adminContentWrite: true } });
  return handlers;
}

test('saving an existing article preserves live fields and retains omitted metadata', async () => {
  const calls = [];
  const connection = {
    beginTransaction: async () => {}, commit: async () => {}, rollback: async () => {}, release() {},
    async execute(sql, params) {
      calls.push({ sql, params });
      if (sql.startsWith('SELECT * FROM articles')) return [[{ id: 10, title: 'Live', content: 'Live body', age_group: '3-6岁', is_published: 1 }]];
      if (sql.startsWith('SELECT payload')) return [[{ payload: '{"title":"Prior draft","category":"reading"}' }]];
      if (sql.includes('max_version')) return [[{ max_version: 2 }]];
      return [{ affectedRows: 1 }];
    }
  };
  const handler = routes({ getConnection: async () => connection })['PUT /test/articles/:id'];
  const res = response();
  await handler({ body: { title: 'New draft', content: 'Draft body' }, params: { id: '10' }, admin: { adminUserId: 1 } }, res, (error) => { throw error; });
  assert.equal(res.body.meta.status, 'draft');
  assert.equal(calls.some(({ sql }) => sql.startsWith('UPDATE articles')), false);
  const inserted = calls.find(({ sql }) => sql.startsWith('INSERT INTO content_versions'));
  const payload = JSON.parse(inserted.params[3]);
  assert.equal(payload.age_group, '3-6岁');
  assert.equal(payload.category, 'reading');
  assert.equal(payload.title, 'New draft');
});

test('scheduled publication projects the selected snapshot before completing the job', async () => {
  const calls = [];
  const connection = { async execute(sql, params) {
    calls.push({ sql, params });
    if (sql.includes('SELECT id, content_type')) return [[{ id: 1, version_id: 2 }]];
    if (sql.startsWith('SELECT *')) return [[{ id: 2, content_type: 'article', content_id: '10', review_status: 'approved', publish_status: 'scheduled', payload: '{"title":"Restored","content":"Old snapshot"}' }]];
    return [{ affectedRows: 1 }];
  } };
  assert.equal(await publishing.publishDue(connection), 1);
  const projection = calls.find(({ sql }) => sql.startsWith('UPDATE articles'));
  assert.deepEqual(projection.params, ['Restored', 'Old snapshot', '10']);
  assert.ok(calls.some(({ sql }) => sql.includes("publish_status = 'offline'")));
  assert.ok(calls.at(-1).sql.includes("status = 'completed'"));
});

test('public pain point reads published payload rather than editable master data', async () => {
  const pool = { async execute(sql) {
    assert.ok(sql.includes('SELECT payload FROM content_versions'));
    return [[{ payload: JSON.stringify({ pain_point_key: 'sleep', short_title: 'Published', observable_signs: ['Old sign'] }) }]];
  } };
  const res = response();
  await routes(pool, true)['GET /test/pain-points/:key']({ params: { key: 'sleep' } }, res, (error) => { throw error; });
  assert.equal(res.body.data.short_title, 'Published');
  assert.deepEqual(res.body.data.observable_signs, ['Old sign']);
});

test('failed publication commit returns an error and rolls back', async () => {
  let rolledBack = false;
  const connection = { beginTransaction: async () => {}, commit: async () => { throw new Error('commit failed'); }, rollback: async () => { rolledBack = true; }, release() {}, execute: async (sql) => sql.startsWith('SELECT') ? [[{ id: 2, content_type: 'article', content_id: '10', review_status: 'approved', publish_status: 'approved', payload: '{}' }]] : [{ affectedRows: 1 }] };
  let caught;
  const res = response();
  await contentAction({ getConnection: async () => connection }, 'published')({ params: { type: 'article', id: '10' }, path: '/content/article/10/publish', admin: { adminUserId: 1 }, body: {} }, res, (error) => { caught = error; });
  assert.equal(caught.message, 'commit failed');
  assert.equal(rolledBack, true);
  assert.equal(res.body, undefined);
});
