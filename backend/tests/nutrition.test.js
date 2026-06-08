const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');
const { db } = require('../src/config/database');

const userToken = generateToken({ userId: 1, username: 'test' });

describe('营养食谱接口测试', () => {
  beforeEach(() => {
    db.prepare("DELETE FROM user_favorites WHERE user_id = 1 AND item_type = 'nutrition_recipe'").run();
  });

  it('应返回营养推荐列表', async () => {
    const res = await request(app).get('/api/v1/nutrition/recommendations');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].name).toBeDefined();
    expect(res.body.data[0].isFavorite).toBe(false);
  });

  it('应分页返回食谱列表并支持关键词筛选', async () => {
    const res = await request(app).get('/api/v1/nutrition/recipes?page=1&page_size=1&keyword=营养');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.recipes)).toBe(true);
    expect(res.body.data.recipes.length).toBe(1);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.total).toBeGreaterThan(0);
  });

  it('应返回食谱详情', async () => {
    const listRes = await request(app).get('/api/v1/nutrition/recipes?page_size=1');
    const recipeId = listRes.body.data.recipes[0].id;

    const detailRes = await request(app).get('/api/v1/nutrition/recipes/' + recipeId);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.id).toBe(recipeId);
    expect(detailRes.body.data.content).toBeDefined();
  });

  it('应支持登录用户收藏和取消收藏食谱', async () => {
    const listRes = await request(app).get('/api/v1/nutrition/recipes?page_size=1');
    const recipeId = listRes.body.data.recipes[0].id;

    const favoriteRes = await request(app)
      .post('/api/v1/nutrition/recipes/' + recipeId + '/favorite')
      .set('Authorization', 'Bearer ' + userToken);

    expect(favoriteRes.status).toBe(200);
    expect(favoriteRes.body.data.isFavorite).toBe(true);

    const detailRes = await request(app)
      .get('/api/v1/nutrition/recipes/' + recipeId)
      .set('Authorization', 'Bearer ' + userToken);
    expect(detailRes.body.data.isFavorite).toBe(true);

    const unfavoriteRes = await request(app)
      .post('/api/v1/nutrition/recipes/' + recipeId + '/favorite')
      .set('Authorization', 'Bearer ' + userToken);

    expect(unfavoriteRes.status).toBe(200);
    expect(unfavoriteRes.body.data.isFavorite).toBe(false);
  });

  it('未登录收藏应返回401', async () => {
    const listRes = await request(app).get('/api/v1/nutrition/recipes?page_size=1');
    const recipeId = listRes.body.data.recipes[0].id;

    const res = await request(app).post('/api/v1/nutrition/recipes/' + recipeId + '/favorite');

    expect(res.status).toBe(401);
  });
});
