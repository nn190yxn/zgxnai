const recipes = require('../nutrition-recipes.json');

const TASK_FIELDS = ['title', 'subject_code', 'age_range', 'difficulty', 'duration', 'material', 'objective', 'steps', 'parent_prompt', 'content', 'image_url', 'icon_url', 'cover_image', 'audio_url', 'video_url', 'tips', 'example_answer'];
const RECIPE_FIELDS = ['title', 'name', 'description', 'category', 'tags', 'ageRange', 'cookTime', 'calories', 'difficulty', 'ingredients', 'steps', 'nutrition', 'tips', 'dailyNutritionPercent', 'nutrientCombination'];

async function sourceItems(connection, type, id) {
  if (type === 'recipe') return recipes.filter((recipe) => recipe.ageRange !== '0-1岁' && (!id || String(recipe.id) === String(id)));
  if (type !== 'task') throw Object.assign(new Error('内容类型无效'), { statusCode: 400 });
  const [rows] = await connection.execute(`SELECT * FROM reading_tasks${id ? ' WHERE task_code = ?' : ''} ORDER BY id DESC${id ? ' LIMIT 1 FOR UPDATE' : ''}`, id ? [id] : []);
  return rows;
}

function normalizeEdit(type, source, input) {
  const result = { ...source };
  const fields = type === 'task' ? TASK_FIELDS : RECIPE_FIELDS;
  fields.forEach((field) => { if (Object.prototype.hasOwnProperty.call(input, field)) result[field] = input[field]; });
  if (!String(result.title || '').trim()) throw Object.assign(new Error('标题不能为空'), { statusCode: 400 });
  if (type === 'recipe') {
    if (!Array.isArray(result.ingredients) || !result.ingredients.length || !Array.isArray(result.steps) || !result.steps.length || !Array.isArray(result.tags) && result.tags != null || !String(result.ageRange || '').trim() || ['0-1岁', '6-12月', 'ling-yi-sui'].includes(result.ageRange)) throw Object.assign(new Error('请填写适龄范围、食材和制作步骤，标签应为数组'), { statusCode: 400 });
    result.name = result.title;
  } else {
    if (!Number.isInteger(Number(result.duration)) || Number(result.duration) <= 0 || !String(result.subject_code || '').trim() || !result.steps || (result.difficulty != null && !Number.isInteger(Number(result.difficulty)))) throw Object.assign(new Error('请填写训练分类、时长、整数难度和步骤'), { statusCode: 400 });
    result.duration = Number(result.duration);
    TASK_FIELDS.forEach((field) => { if (result[field] && typeof result[field] === 'object') result[field] = JSON.stringify(result[field]); });
  }
  return result;
}

module.exports = { sourceItems, normalizeEdit, TASK_FIELDS, RECIPE_FIELDS };
