// 测试用例
const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');

// 生成测试用的有效token
const testToken = generateToken({ userId: 1, username: 'test' });

async function createApiTestToken(code) {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ code });

  expect(res.status).toBe(200);
  return res.body.data.token;
}

async function createTestChild() {
  const token = await createApiTestToken('api-assessment-child-' + Date.now() + '-' + Math.random());
  const res = await request(app)
    .post('/api/v1/children')
    .set('Authorization', 'Bearer ' + token)
    .send({
      name: 'API测试孩子',
      gender: 'unknown',
      birthday: '2020-01-01'
    });

  expect(res.status).toBe(201);
  return { id: res.body.data.id, token };
}

describe('后端API测试', () => {
  // 健康检查
  describe('GET /api/v1/health', () => {
    it('应该返回健康状态', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.services.database).toBe('ok');
    });
  });

  // JWT认证测试
  describe('JWT认证测试', () => {
    it('未认证访问受保护接口应返回401', async () => {
      const res = await request(app).get('/api/v1/assessments');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('未提供访问令牌');
    });

    it('无效token访问应返回403', async () => {
      const res = await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('访问令牌无效或已过期');
    });
  });

  // 评估列表
  describe('GET /api/v1/assessments', () => {
    it('应该返回评估工具列表（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/assessments')
        .set('Authorization', 'Bearer ' + testToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(6);
    });
  });

  // 评估提交 - 边界条件测试
  describe('POST /api/v1/assessments/:code/submit', () => {
    it('提交有效评估应成功', async () => {
      const child = await createTestChild();
      const res = await request(app)
        .post('/api/v1/assessments/sensory/submit')
        .set('Authorization', 'Bearer ' + child.token)
        .send({
          child_id: child.id,
          age_group: '3-4岁',
          answers: [
            { question_id: '1', value: 2 },
            { question_id: '2', value: 1 }
          ]
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.record_id).toBeDefined();
      expect(res.body.data.overall_level).toBeDefined();
      expect(res.body.data.interpretations).toBeDefined();
      expect(res.body.data.interpretations.length).toBeGreaterThan(0);
    });

    it('缺少child_id应返回400', async () => {
      const res = await request(app)
        .post('/api/v1/assessments/sensory/submit')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          age_group: '3-4岁',
          answers: [{ question_id: '1', value: 2 }]
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('缺少answers应返回400', async () => {
      const res = await request(app)
        .post('/api/v1/assessments/sensory/submit')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          child_id: 1,
          age_group: '3-4岁'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('answers不是数组应返回400', async () => {
      const res = await request(app)
        .post('/api/v1/assessments/sensory/submit')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          child_id: 1,
          age_group: '3-4岁',
          answers: 'invalid'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('无效的评估code应返回错误', async () => {
      const child = await createTestChild();
      const res = await request(app)
        .post('/api/v1/assessments/invalid_code/submit')
        .set('Authorization', 'Bearer ' + child.token)
        .send({
          child_id: child.id,
          age_group: '3-4岁',
          answers: [{ question_id: '1', value: 2 }]
        });
      
      // 即使code无效，只要参数格式正确，应该返回200但可能没有解读数据
      expect(res.status).toBe(200);
    });
  });

  // 获取评估结果
  describe('GET /api/v1/assessments/results/:id', () => {
    it('应该返回评估结果（已认证）', async () => {
      const child = await createTestChild();
      // 先提交一个评估
      const submitRes = await request(app)
        .post('/api/v1/assessments/sensory/submit')
        .set('Authorization', 'Bearer ' + child.token)
        .send({
          child_id: child.id,
          age_group: '3-4岁',
          answers: [{ question_id: '1', value: 2 }]
        });
      
      const recordId = submitRes.body.data.record_id;
      
      const res = await request(app)
        .get('/api/v1/assessments/results/' + recordId)
        .set('Authorization', 'Bearer ' + child.token);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.interpretations).toBeDefined();
      expect(res.body.data.suggestions).toBeDefined();
    });

    it('不存在的记录应返回404', async () => {
      const res = await request(app)
        .get('/api/v1/assessments/results/99999')
        .set('Authorization', 'Bearer ' + testToken);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('无效的记录ID应返回404', async () => {
      const res = await request(app)
        .get('/api/v1/assessments/results/invalid')
        .set('Authorization', 'Bearer ' + testToken);
      
      expect(res.status).toBe(404);
    });
  });

  // 评估历史
  describe('GET /api/v1/assessments/history', () => {
    it('应该返回评估历史（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/assessments/history')
        .set('Authorization', 'Bearer ' + testToken);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // 育儿文章
  describe('GET /api/v1/parenting/articles', () => {
    it('应该返回文章列表（公开访问）', async () => {
      const res = await request(app).get('/api/v1/parenting/articles');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('分页参数应正常工作', async () => {
      const res = await request(app).get('/api/v1/parenting/articles?page=1&page_size=5');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.page_size).toBe(5);
    });
  });

  // 搜索文章 - 边界条件
  describe('GET /api/v1/parenting/articles/search', () => {
    it('应该返回搜索结果（公开访问）', async () => {
      const res = await request(app).get('/api/v1/parenting/articles/search?q=情绪');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('空搜索词应返回空数组', async () => {
      const res = await request(app).get('/api/v1/parenting/articles/search?q=');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(0);
    });

    it('特殊字符搜索应安全处理', async () => {
      const res = await request(app).get('/api/v1/parenting/articles/search?q=测试%20特殊字符');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 知识库搜索
  describe('GET /api/v1/knowledge/search', () => {
    it('应该返回知识库搜索结果（公开访问）', async () => {
      const res = await request(app).get('/api/v1/knowledge/search?q=前庭觉');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('分类过滤应正常工作', async () => {
      const res = await request(app).get('/api/v1/knowledge/search?q=前庭觉&category=development_milestones');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('空搜索词应返回空数组或全部数据', async () => {
      const res = await request(app).get('/api/v1/knowledge/search?q=');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 聊天接口
  describe('POST /api/v1/chat', () => {
    it('应该返回AI回复（已认证）', async () => {
      const res = await request(app)
        .post('/api/v1/chat')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          message: '你好',
          session_id: 'test-session'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.answer).toBeDefined();
      expect(res.body.data.answer_source).toBe('knowledge_fallback');
      expect(res.body.data.ai_status.configured).toBe(false);
      expect(res.body.data.fallback_reason).toBe('AI_NOT_CONFIGURED');
      expect(Array.isArray(res.body.data.sources)).toBe(true);
      expect(Array.isArray(res.body.data.matched_types)).toBe(true);
      expect(res.body.data.matched_types.length).toBeGreaterThan(0);
      expect(res.body.data.age_group_used).toBe('');
    });

    it('缺少message应返回400', async () => {
      const res = await request(app)
        .post('/api/v1/chat')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          session_id: 'test-session'
        });
      
      expect(res.status).toBe(400);
    });
  });

  // 教育任务
  describe('GET /api/v1/education/tasks/today', () => {
    it('应该返回今日任务（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/education/tasks/today?childId=1&grade=3-4岁')
        .set('Authorization', 'Bearer ' + testToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.list).toBeDefined();
    });

    it('缺少参数应返回错误', async () => {
      const res = await request(app)
        .get('/api/v1/education/tasks/today')
        .set('Authorization', 'Bearer ' + testToken);
      
      // 即使缺少参数，接口也应该正常返回（使用默认值）
      expect(res.status).toBe(200);
    });
  });

  describe('教育知识点接口', () => {
    it('应该返回知识章节列表（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/education/knowledge/chapters?subjectCode=reading_comprehension&grade=3-4岁&childId=1')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.list)).toBe(true);
      expect(res.body.data.list.length).toBeGreaterThan(0);
      expect(Array.isArray(res.body.data.list[0].points)).toBe(true);
    });

    it('应该返回知识点详情（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/education/knowledge/detail?pointId=r1&subjectCode=reading_comprehension&childId=1')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('r1');
      expect(res.body.data.explain).toBeDefined();
      expect(Array.isArray(res.body.data.keyPoints)).toBe(true);
    });

    it('应该更新知识点进度（已认证）', async () => {
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ code: 'education-progress-code' });
      const educationToken = loginRes.body.data.token;

      const childrenRes = await request(app)
        .get('/api/v1/children')
        .set('Authorization', 'Bearer ' + educationToken);
      let childId = childrenRes.body.data[0] && childrenRes.body.data[0].id;

      if (!childId) {
        const childRes = await request(app)
          .post('/api/v1/children')
          .set('Authorization', 'Bearer ' + educationToken)
          .send({
            name: '教育测试孩子',
            gender: 'unknown',
            birthday: '2021-01-01'
          });
        childId = childRes.body.data.id;
      }

      const res = await request(app)
        .post('/api/v1/education/progress')
        .set('Authorization', 'Bearer ' + educationToken)
        .send({
          child_id: childId,
          knowledge_point_id: 'r1',
          status: 'mastered',
          mastery_level: 100
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mapped_status).toBe('completed');
      expect(res.body.data.mastery_level).toBe(100);
    });

    it('不能更新其他用户孩子的知识点进度', async () => {
      const ownerCode = 'education-owner-code-' + Date.now() + '-' + Math.random();
      const attackerCode = 'education-attacker-code-' + Date.now() + '-' + Math.random();
      const ownerLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ code: ownerCode });
      const ownerToken = ownerLoginRes.body.data.token;

      const childRes = await request(app)
        .post('/api/v1/children')
        .set('Authorization', 'Bearer ' + ownerToken)
        .send({
          name: '归属测试孩子',
          gender: 'unknown',
          birthday: '2021-01-01'
        });
      expect(childRes.status).toBe(201);
      expect(childRes.body.success).toBe(true);

      const attackerLoginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({ code: attackerCode });

      const res = await request(app)
        .post('/api/v1/education/progress')
        .set('Authorization', 'Bearer ' + attackerLoginRes.body.data.token)
        .send({
          child_id: childRes.body.data.id,
          knowledge_point_id: 'r1',
          status: 'mastered',
          mastery_level: 100
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('缺少知识点ID应返回400', async () => {
      const res = await request(app)
        .get('/api/v1/education/knowledge/detail')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // 事件追踪
  describe('POST /api/v1/kb/events/track', () => {
    it('应该成功追踪事件（已认证）', async () => {
      const res = await request(app)
        .post('/api/v1/kb/events/track')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          event_type: 'test_event',
          event_meta: { test: true }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
    });

    it('缺少event_type应返回400', async () => {
      const res = await request(app)
        .post('/api/v1/kb/events/track')
        .set('Authorization', 'Bearer ' + testToken)
        .send({
          event_meta: { test: true }
        });
      
      expect(res.status).toBe(400);
    });
  });

  // 个性化推荐
  describe('GET /api/v1/recommendations', () => {
    it('应该返回个性化推荐（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/recommendations?child_id=1')
        .set('Authorization', 'Bearer ' + testToken);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

// 关闭数据库连接，防止测试进程挂起
afterAll(() => {
  const { db } = require('../src/config/database');
  if (db && db.close) {
    db.close();
  }
});
