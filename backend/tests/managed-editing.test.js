const assert = require('node:assert/strict');
const { normalizeEdit, sourceItems } = require('../src/mysql-production/managed-editing');
const { publishVersion } = require('../src/mysql-production/content-publishing');

test('task partial edits retain existing fields and stable identifiers', () => {
  const original = { id: 42, task_code: 'read_1', title: 'Original', subject_code: 'reading', duration: 10, steps: 'Step one', age_range: '3-6岁' };
  const result = normalizeEdit('task', original, { title: 'Edited', id: 99, task_code: 'changed', steps: ['One', 'Two'] });
  assert.equal(result.id, 42);
  assert.equal(result.task_code, 'read_1');
  assert.equal(result.age_range, original.age_range);
  assert.equal(result.steps, '["One","Two"]');
  assert.throws(() => normalizeEdit('task', original, { duration: 0 }));
});

test('recipe edits preserve structure and reject invalid ingredients', () => {
  const original = { id: 'nutrition_1', title: 'Recipe', ageRange: '3-6岁', ingredients: [{ name: 'Rice', amount: '50g' }], steps: ['Cook'], nutrition: { protein: '5g' } };
  const result = normalizeEdit('recipe', original, { title: 'New recipe', id: 'other' });
  assert.equal(result.id, original.id);
  assert.deepEqual(result.nutrition, original.nutrition);
  assert.throws(() => normalizeEdit('recipe', original, { ingredients: [] }));
  assert.throws(() => normalizeEdit('recipe', original, { ageRange: '0-1岁' }));
});

test('managed recipe source only permits existing eligible IDs', async () => {
  assert.deepEqual(await sourceItems({}, 'recipe', 'missing'), []);
  const recipes = await sourceItems({}, 'recipe');
  assert.ok(recipes.length);
  assert.ok(recipes.every((recipe) => recipe.ageRange !== '0-1岁'));
});

test('publishing task updates existing business row without creating a new task', async () => {
  const calls = [];
  const connection = { async execute(sql, params) {
    calls.push({ sql, params });
    if (sql.startsWith('SELECT * FROM content_versions')) return [[{ id: 1, content_type: 'task', content_id: 'read_1', review_status: 'approved', publish_status: 'approved', payload: '{"title":"Edited"}' }]];
    if (sql.startsWith('SELECT * FROM reading_tasks')) return [[{ id: 42, task_code: 'read_1', title: 'Old', duration: 10, subject_code: 'reading', steps: 'One', age_range: '3-6岁' }]];
    return [{ affectedRows: 1 }];
  } };
  assert.equal(await publishVersion(connection, 1), true);
  const update = calls.find(({ sql }) => sql.startsWith('UPDATE reading_tasks'));
  assert.equal(update.params[0], 'Edited');
  assert.equal(update.params.at(-1), 'read_1');
  assert.equal(calls.some(({ sql }) => sql.startsWith('INSERT INTO reading_tasks')), false);
});
