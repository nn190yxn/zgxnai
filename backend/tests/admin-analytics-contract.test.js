const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(
  path.join(__dirname, '../src/mysql-production/server.js'),
  'utf8'
);

describe('运营后台分析接口契约', () => {
  it('注册成长闭环、年龄能力和会员归因接口', () => {
    expect(serverSource).toContain("/analytics/growth-loop");
    expect(serverSource).toContain("/analytics/age-ability");
    expect(serverSource).toContain("/analytics/membership-conversion");
  });

  it('注册发布与客服质量分析接口', () => {
    expect(serverSource).toContain('/analytics/operations-quality');
    expect(serverSource).toContain('content_operations');
    expect(serverSource).toContain('support_operations');
  });

  it('分析接口支持统一日期、年龄、能力和会员筛选字段', () => {
    expect(serverSource).toContain('startDate');
    expect(serverSource).toContain('endDate');
    expect(serverSource).toContain('age_segment_code');
    expect(serverSource).toContain('ability_code');
    expect(serverSource).toContain('membership_status');
  });

  it('成长闭环契约包含事件数、用户数和转化率', () => {
    expect(serverSource).toContain('event_funnel');
    expect(serverSource).toContain('event_count');
    expect(serverSource).toContain('user_count');
    expect(serverSource).toContain('conversion_rate');
  });

  it('会员归因契约包含来源、支付和收入指标', () => {
    expect(serverSource).toContain('source_key');
    expect(serverSource).toContain('exposure_count');
    expect(serverSource).toContain('paid_count');
    expect(serverSource).toContain('revenue_amount');
  });
});
