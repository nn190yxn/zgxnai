const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');
const { db } = require('../src/config/database');

const userToken = generateToken({ userId: 1, username: 'test' });

describe('孩子档案接口测试', () => {
  beforeEach(() => {
    db.prepare('DELETE FROM assessment_dimensions WHERE record_id IN (SELECT id FROM assessment_records WHERE child_id IN (SELECT id FROM children WHERE user_id = 1))').run();
    db.prepare('DELETE FROM assessment_records WHERE child_id IN (SELECT id FROM children WHERE user_id = 1)').run();
    db.prepare('DELETE FROM children WHERE user_id = 1').run();
  });

  it('应创建并返回孩子档案列表', async () => {
    const createRes = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({
        name: '小牛',
        nickname: '牛牛',
        gender: 'male',
        birthday: '2020-01-01',
        current_height: 105,
        current_weight: 18,
        allergies: ['花生'],
        special_notes: '睡眠较浅',
        tags: ['活泼好动']
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe('小牛');
    expect(createRes.body.data.isDefault).toBe(true);
    expect(createRes.body.data.allergies).toContain('花生');

    const listRes = await request(app)
      .get('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.length).toBe(1);
  });

  it('应支持读取、更新和设置默认孩子', async () => {
    const first = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '大宝', gender: 'female', birthday: '2019-01-01' });
    const second = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '二宝', gender: 'male', birthday: '2021-01-01' });

    const childId = second.body.data.id;
    const detailRes = await request(app)
      .get('/api/v1/children/' + childId)
      .set('Authorization', 'Bearer ' + userToken);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.name).toBe('二宝');

    const updateRes = await request(app)
      .put('/api/v1/children/' + childId)
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '二宝更新', current_height: 95 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('二宝更新');
    expect(updateRes.body.data.current_height).toBe(95);

    const defaultRes = await request(app)
      .put('/api/v1/children/' + childId + '/set-default')
      .set('Authorization', 'Bearer ' + userToken);

    expect(defaultRes.status).toBe(200);
    expect(defaultRes.body.data.isDefault).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken);

    const firstAfterDefault = listRes.body.data.find(child => child.id === first.body.data.id);
    expect(firstAfterDefault.isDefault).toBe(false);
  });

  it('应支持删除孩子档案并自动迁移默认孩子', async () => {
    const first = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '大宝', gender: 'female' });
    const second = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '二宝', gender: 'male' });

    const deleteRes = await request(app)
      .delete('/api/v1/children/' + first.body.data.id)
      .set('Authorization', 'Bearer ' + userToken);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken);

    expect(listRes.body.data.length).toBe(1);
    expect(listRes.body.data[0].id).toBe(second.body.data.id);
    expect(listRes.body.data[0].isDefault).toBe(true);
  });

  it('未认证访问应返回401', async () => {
    const res = await request(app).get('/api/v1/children');
    expect(res.status).toBe(401);
  });

  it('非法性别应返回400', async () => {
    const res = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '测试', gender: 'other' });

    expect(res.status).toBe(400);
  });
});
