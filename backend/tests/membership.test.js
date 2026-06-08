// 会员制度测试用例
const request = require('supertest');
const app = require('../src/app');
const { generateToken } = require('../src/middleware/auth');
const { db } = require('../src/config/database');

const testToken = generateToken({ userId: 1, username: 'test' });

describe('会员制度测试', () => {
  // 获取会员信息
  describe('GET /api/v1/membership/info', () => {
    it('应该返回会员信息（已认证）', async () => {
      const res = await request(app)
        .get('/api/v1/membership/info')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.status).toBeDefined();
      expect(res.body.data.membership_type).toBeDefined();
      expect(res.body.data.plans).toBeDefined();
      expect(Array.isArray(res.body.data.plans)).toBe(true);
    });

    it('未认证应返回401', async () => {
      const res = await request(app).get('/api/v1/membership/info');
      expect(res.status).toBe(401);
    });
  });

  // 激活试用
  describe('POST /api/v1/membership/trial/activate', () => {
    beforeEach(() => {
      // 清除试用记录
      db.prepare("DELETE FROM user_memberships WHERE user_id = 1").run();
      db.prepare("DELETE FROM subscriptions WHERE user_id = 1 AND plan_code = 'trial'").run();
    });

    it('首次激活应成功', async () => {
      const res = await request(app)
        .post('/api/v1/membership/trial/activate')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trial_end_date).toBeDefined();
    });

    it('重复激活应提示已使用', async () => {
      // 先激活一次
      await request(app)
        .post('/api/v1/membership/trial/activate')
        .set('Authorization', 'Bearer ' + testToken);

      // 再次激活
      const res = await request(app)
        .post('/api/v1/membership/trial/activate')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.data.activated).toBe(false);
    });
  });

  // 取消自动续费
  describe('POST /api/v1/membership/auto-renew/cancel', () => {
    it('应成功取消自动续费', async () => {
      const res = await request(app)
        .post('/api/v1/membership/auto-renew/cancel')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 兑换码兑换
  describe('POST /api/v1/membership/promo/redeem', () => {
    it('无效兑换码应返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/membership/promo/redeem')
        .set('Authorization', 'Bearer ' + testToken)
        .send({ code: 'INVALID-CODE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('兑换码');
    });
  });

  // 支付订单
  describe('POST /api/v1/payment/create', () => {
    beforeEach(() => {
      db.prepare("DELETE FROM payment_orders WHERE user_id = 1").run();
    });

    it('微信支付配置缺失时应拒绝创建订单', async () => {
      const res = await request(app)
        .post('/api/v1/payment/create')
        .set('Authorization', 'Bearer ' + testToken)
        .send({ plan_code: 'month', auto_renew: true });

      const orderCount = db.prepare('SELECT COUNT(*) as count FROM payment_orders WHERE user_id = 1').get();
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('WECHAT_PAY_NOT_CONFIGURED');
      expect(res.body.message).toContain('微信支付配置中');
      expect(orderCount.count).toBe(0);
    });

    it('缺少套餐应返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/payment/create')
        .set('Authorization', 'Bearer ' + testToken)
        .send({});

      expect(res.status).toBe(400);
    });

    it('微信支付统一下单配置缺失时应返回业务错误', async () => {
      const res = await request(app)
        .post('/api/v1/payment/unified-order')
        .set('Authorization', 'Bearer ' + testToken)
        .send({ order_no: 'NN_TEST_ORDER', openid: 'openid_test' });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('WECHAT_PAY_NOT_CONFIGURED');
    });
  });

  // 裂变
  describe('GET /api/v1/referral/code', () => {
    it('应返回邀请码', async () => {
      const res = await request(app)
        .get('/api/v1/referral/code')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invite_code).toBeDefined();
    });
  });

  describe('GET /api/v1/referral/stats', () => {
    it('应返回邀请统计', async () => {
      const res = await request(app)
        .get('/api/v1/referral/stats')
        .set('Authorization', 'Bearer ' + testToken);

      expect(res.status).toBe(200);
      expect(res.body.data.total_invites).toBeDefined();
      expect(res.body.data.monthly_max_days).toBe(60);
    });
  });
});

// 关闭数据库连接
afterAll(() => {
  if (db && db.close) {
    db.close();
  }
});
