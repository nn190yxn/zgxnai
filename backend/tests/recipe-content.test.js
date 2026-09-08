const assert = require('assert');
const { listRecipes } = require('../src/mysql-production/recipe-content');

test('published recipe overlay preserves source data and respects offline state', async () => {
  const legacy = [{ id: 'a', title: '旧', ageRange: '3-6岁', nested: { keep: true } }, { id: 'b', title: '保留' }];
  let sql = '';
  const pool = { execute: async (query) => { sql = query; return [[
    { content_id: 'a', version: 1, publish_status: 'published', payload: JSON.stringify({ title: '公开' }) },
    { content_id: 'b', version: 4, publish_status: 'offline', payload: JSON.stringify({ title: '下线' }) }
  ]]; } };
  const result = await listRecipes(pool, legacy);
  assert.match(sql, /publish_status = 'published' AND review_status = 'approved'/);
  assert.match(sql, /published_at <= NOW\(\)/);
  assert.match(sql, /publish_status = 'offline' AND published_at IS NOT NULL/);
  assert.deepStrictEqual(result.map((item) => item.id), ['a']);
  assert.strictEqual(result[0].title, '公开');
  assert.strictEqual(legacy[0].title, '旧');
  assert.strictEqual(result[0].nested.keep, true);
  await assert.rejects(() => listRecipes({ execute: async () => [[{ content_id: 'a', version: 1, publish_status: 'published', payload: '{bad' }]] }, legacy));
});
