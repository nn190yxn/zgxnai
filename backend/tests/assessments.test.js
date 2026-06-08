const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');
const { db } = require('../src/config/database');

const TEST_USER_ID = 102;
const userToken = generateToken({ userId: TEST_USER_ID, username: 'assessment-test' });
const OTHER_USER_ID = 103;
const otherUserToken = generateToken({ userId: OTHER_USER_ID, username: 'assessment-other-test' });

describe('评估接口兼容性测试', () => {
  beforeEach(() => {
    db.prepare(`
      INSERT OR IGNORE INTO users (id, openid, nickname)
      VALUES (?, ?, ?)
    `).run(TEST_USER_ID, 'assessment-test-user', '评估测试用户');
    db.prepare(`
      INSERT OR IGNORE INTO users (id, openid, nickname)
      VALUES (?, ?, ?)
    `).run(OTHER_USER_ID, 'assessment-other-test-user', '评估其他用户');
    db.prepare('DELETE FROM assessment_dimensions WHERE record_id IN (SELECT id FROM assessment_records WHERE child_id IN (SELECT id FROM children WHERE user_id = ?))').run(OTHER_USER_ID);
    db.prepare('DELETE FROM assessment_records WHERE child_id IN (SELECT id FROM children WHERE user_id = ?)').run(OTHER_USER_ID);
    db.prepare('DELETE FROM children WHERE user_id = ?').run(OTHER_USER_ID);
    db.prepare('DELETE FROM assessment_dimensions WHERE record_id IN (SELECT id FROM assessment_records WHERE child_id IN (SELECT id FROM children WHERE user_id = ?))').run(TEST_USER_ID);
    db.prepare('DELETE FROM assessment_records WHERE child_id IN (SELECT id FROM children WHERE user_id = ?)').run(TEST_USER_ID);
    db.prepare('DELETE FROM children WHERE user_id = ?').run(TEST_USER_ID);
  });

  async function createChild() {
    const res = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + userToken)
      .send({ name: '评估宝宝', gender: 'female', birthday: '2020-01-01' });

    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  async function createOtherChild() {
    const res = await request(app)
      .post('/api/v1/children')
      .set('Authorization', 'Bearer ' + otherUserToken)
      .send({ name: '其他宝宝', gender: 'female', birthday: '2020-01-01' });

    expect(res.status).toBe(201);
    return res.body.data.id;
  }

  async function submitAssessment(childId) {
    const res = await request(app)
      .post('/api/v1/assessments/sensory/submit')
      .set('Authorization', 'Bearer ' + userToken)
      .send({
        child_id: childId,
        age_group: '3-4岁',
        answers: [
          { question_id: 1, value: 2 },
          { question_id: 2, value: 3 }
        ]
      });

    expect(res.status).toBe(200);
    return res.body.data;
  }

  it('应返回前端可直接渲染的评估题目结构', async () => {
    const res = await request(app)
      .get('/api/v1/assessments/sensory/questions?age_group=3-4%E5%B2%81')
      .set('Authorization', 'Bearer ' + userToken);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.assessment_code).toBe('sensory');
    expect(Array.isArray(res.body.data.questions)).toBe(true);
    expect(res.body.data.questions[0]).toEqual(expect.objectContaining({
      id: expect.any(Number),
      dimension: expect.any(String),
      text: expect.any(String)
    }));
    expect(res.body.data.questions[0].options[0]).toEqual(expect.objectContaining({
      value: expect.any(Number),
      label: expect.any(String)
    }));
  });

  it('应提交评估并返回前端结果页需要的字段', async () => {
    const childId = await createChild();
    const data = await submitAssessment(childId);

    expect(data.id).toBeDefined();
    expect(data.record_id).toBe(data.id);
    expect(data.assessment_type).toBe('sensory');
    expect(data.assessment_name).toBeDefined();
    expect(data.overall_score).toBe(data.total_score);
    expect(Array.isArray(data.dimension_scores)).toBe(true);
    expect(data.report_data).toEqual(expect.objectContaining({
      interpretations: expect.any(Array),
      suggestions: expect.any(Array)
    }));
  });

  it('应返回历史数量并支持按孩子筛选', async () => {
    const childId = await createChild();
    await submitAssessment(childId);

    const allRes = await request(app)
      .get('/api/v1/assessments/history/count')
      .set('Authorization', 'Bearer ' + userToken);
    const childRes = await request(app)
      .get('/api/v1/assessments/history/count?child_id=' + childId)
      .set('Authorization', 'Bearer ' + userToken);

    expect(allRes.status).toBe(200);
    expect(allRes.body.data.count).toBeGreaterThanOrEqual(1);
    expect(childRes.status).toBe(200);
    expect(childRes.body.data.count).toBe(1);
  });

  it('应返回兼容字段的历史和详情并支持删除记录', async () => {
    const childId = await createChild();
    const submitted = await submitAssessment(childId);

    const historyRes = await request(app)
      .get('/api/v1/assessments/history')
      .set('Authorization', 'Bearer ' + userToken);
    const detailRes = await request(app)
      .get('/api/v1/assessments/results/' + submitted.record_id)
      .set('Authorization', 'Bearer ' + userToken);
    const deleteRes = await request(app)
      .delete('/api/v1/assessments/records/' + submitted.record_id)
      .set('Authorization', 'Bearer ' + userToken);
    const countRes = await request(app)
      .get('/api/v1/assessments/history/count?child_id=' + childId)
      .set('Authorization', 'Bearer ' + userToken);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data[0]).toEqual(expect.objectContaining({
      assessment_type: 'sensory',
      child_name: '评估宝宝',
      overall_score: expect.any(Number),
      report_data: expect.any(Object)
    }));
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data).toEqual(expect.objectContaining({
      assessment_type: 'sensory',
      dimension_scores: expect.any(Array),
      report_data: expect.any(Object)
    }));
    expect(deleteRes.status).toBe(200);
    expect(countRes.body.data.count).toBe(0);
  });

  it('不能提交或读取其他用户孩子的评估记录', async () => {
    const otherChildId = await createOtherChild();

    const submitRes = await request(app)
      .post('/api/v1/assessments/sensory/submit')
      .set('Authorization', 'Bearer ' + userToken)
      .send({
        child_id: otherChildId,
        age_group: '3-4岁',
        answers: [{ question_id: 1, value: 2 }]
      });

    const historyRes = await request(app)
      .get('/api/v1/assessments/history')
      .set('Authorization', 'Bearer ' + userToken);

    expect(submitRes.status).toBe(403);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data).toEqual([]);
  });
});
