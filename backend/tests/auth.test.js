const request = require('supertest');
const app = require('../src/app');
const { db } = require('../src/config/database');

describe('认证接口测试', () => {
  it('微信登录应创建用户并返回token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ code: 'test-login-code' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.id).toBeDefined();
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refresh_token).toBeDefined();
  });

  it('缺少code应返回400', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('应支持获取当前用户信息和刷新token', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ code: 'test-refresh-code' });

    const { token, refresh_token } = loginRes.body.data;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + token);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.openid).toBe('dev_test-refresh-code');

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.token).toBeDefined();
    expect(refreshRes.body.data.refresh_token).toBeDefined();
  });

  it('应支持更新当前用户信息', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ code: 'test-update-code' });

    const res = await request(app)
      .put('/api/v1/auth/me')
      .set('Authorization', 'Bearer ' + loginRes.body.data.token)
      .send({ nickname: '更新昵称', avatar_url: 'https://example.com/avatar.png' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.nickname).toBe('更新昵称');
    expect(res.body.data.avatar_url).toBe('https://example.com/avatar.png');
  });

  it('应支持账号注销并清理用户', async () => {
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ code: 'test-delete-code' });

    const userId = loginRes.body.data.user.id;
    db.prepare('INSERT INTO children (user_id, name, gender, birthday) VALUES (?, ?, ?, ?)')
      .run(userId, '测试孩子', 'unknown', '2020-01-01');

    const res = await request(app)
      .post('/api/v1/auth/account-deletion')
      .set('Authorization', 'Bearer ' + loginRes.body.data.token);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const children = db.prepare('SELECT * FROM children WHERE user_id = ?').all(userId);
    expect(user).toBeUndefined();
    expect(children.length).toBe(0);
  });

  it('无效refresh_token应返回403', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refresh_token: 'invalid-token' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
