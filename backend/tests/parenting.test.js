const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');
const { db } = require('../src/config/database');

const userToken = generateToken({ userId: 1, username: 'test' });

describe('育儿内容接口测试', () => {
  beforeEach(() => {
    db.prepare("DELETE FROM user_favorites WHERE user_id = 1 AND item_type = 'parenting_article'").run();
  });

  it('文章列表应返回收藏字段', async () => {
    const res = await request(app).get('/api/v1/parenting/articles?page=1&page_size=2');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].isFavorite).toBe(false);
    expect(res.body.pagination.page_size).toBe(2);
  });

  it('应支持前端使用的搜索别名接口', async () => {
    const res = await request(app).get('/api/v1/parenting/search?keyword=情绪&page=1&page_size=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('应返回文章详情和相关文章', async () => {
    const listRes = await request(app).get('/api/v1/parenting/articles?page_size=1');
    const articleId = listRes.body.data[0].id;

    const detailRes = await request(app).get('/api/v1/parenting/articles/' + articleId);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);
    expect(detailRes.body.data.id).toBe(articleId);

    const relatedRes = await request(app).get('/api/v1/parenting/articles/' + articleId + '/related');
    expect(relatedRes.status).toBe(200);
    expect(relatedRes.body.success).toBe(true);
    expect(Array.isArray(relatedRes.body.data)).toBe(true);
  });

  it('应支持登录用户收藏和取消收藏文章', async () => {
    const listRes = await request(app).get('/api/v1/parenting/articles?page_size=1');
    const articleId = listRes.body.data[0].id;

    const favoriteRes = await request(app)
      .post('/api/v1/parenting/articles/' + articleId + '/favorite')
      .set('Authorization', 'Bearer ' + userToken);

    expect(favoriteRes.status).toBe(200);
    expect(favoriteRes.body.data.isFavorite).toBe(true);

    const detailRes = await request(app)
      .get('/api/v1/parenting/articles/' + articleId)
      .set('Authorization', 'Bearer ' + userToken);
    expect(detailRes.body.data.isFavorite).toBe(true);

    const unfavoriteRes = await request(app)
      .post('/api/v1/parenting/articles/' + articleId + '/favorite')
      .set('Authorization', 'Bearer ' + userToken);

    expect(unfavoriteRes.status).toBe(200);
    expect(unfavoriteRes.body.data.isFavorite).toBe(false);
  });

  it('未登录收藏文章应返回401', async () => {
    const listRes = await request(app).get('/api/v1/parenting/articles?page_size=1');
    const articleId = listRes.body.data[0].id;

    const res = await request(app).post('/api/v1/parenting/articles/' + articleId + '/favorite');

    expect(res.status).toBe(401);
  });
});
