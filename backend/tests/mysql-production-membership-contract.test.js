const fs = require('fs');
const path = require('path');

const serverSource = fs.readFileSync(
  path.join(__dirname, '../src/mysql-production/server.js'),
  'utf8'
);

describe('生产会员与推荐接口契约', () => {
  it('在通配占位路由前注册受认证保护的推荐接口', () => {
    const routeIndex = serverSource.indexOf("app.get(`${prefix}/recommendations`, authenticateToken, asyncHandler(recommendationsHandler));");
    const fallbackIndex = serverSource.indexOf("app.all(`${prefix}/recommendations*`, authenticateToken, requireActiveMembership, paidFeaturePlaceholderHandler);");

    expect(routeIndex).toBeGreaterThan(-1);
    expect(fallbackIndex).toBeGreaterThan(routeIndex);
    expect(serverSource).toContain('async function recommendationsHandler(req, res)');
  });

  it('推荐结果覆盖评估建议、年龄任务和热门文章', () => {
    expect(serverSource).toContain('type: \'assessment_based\'');
    expect(serverSource).toContain('type: \'age_based\'');
    expect(serverSource).toContain('type: \'popular\'');
    expect(serverSource).toContain('无权查看该孩子的推荐内容');
  });

  it('兑换码链路保留环境配置、事务和重复兑换保护', () => {
    expect(serverSource).toContain("process.env.MEMBERSHIP_PROMO_CODE || process.env.UNIFIED_MEMBERSHIP_PROMO_CODE || 'zgxn'");
    expect(serverSource).toContain('promo_code_redemptions');
    expect(serverSource).toContain('当前账号已兑换过该礼包');
    expect(serverSource).toContain('await connection.commit()');
  });

  it('注册公开知识治理查询及兼容接口', () => {
    expect(serverSource).toContain("app.get(`${prefix}/knowledge/contents`, optionalAuthenticateToken, asyncHandler(knowledgeContentsHandler));");
    expect(serverSource).toContain("app.get(`${prefix}/knowledge/ability-content`, optionalAuthenticateToken, asyncHandler(knowledgeContentsHandler));");
    expect(serverSource).toContain('async function knowledgeContentsHandler(req, res)');
  });

  it('教材知识接口保持会员鉴权保护', () => {
    expect(serverSource).toContain("app.get(`${prefix}/education/knowledge/chapters`, authenticateToken, requireActiveMembership, asyncHandler(educationKnowledgeChaptersHandler));");
    expect(serverSource).toContain("app.get(`${prefix}/education/knowledge/detail`, authenticateToken, requireActiveMembership, asyncHandler(educationKnowledgeDetailHandler));");
  });

  it('数据库初始化失败时进入安全模式并保留核心服务', () => {
    const bootstrapStart = serverSource.indexOf('async function bootstrap()');
    const bootstrapEnd = serverSource.indexOf('async function ensureAdminBootstrapUser()', bootstrapStart);
    const bootstrapSource = serverSource.slice(bootstrapStart, bootstrapEnd);

    expect(bootstrapSource).toContain("await runStartupStep('migrations', () => runMigrations(pool));");
    expect(bootstrapSource).toContain("await runStartupStep('legacy_schema', () => ensureProductionTables());");
    expect(bootstrapSource).toContain("await runStartupStep('admin_bootstrap', () => ensureAdminBootstrapUser());");
    expect(bootstrapSource).toContain('safe_mode=${startupState.safeMode}');
    expect(bootstrapSource).not.toContain('MySQL init skipped');
    expect(serverSource).toContain('bootstrap().catch(async (err) => {');
    expect(serverSource).toContain("event: 'startup_unhandled_failure'");
  });

  it('事件埋点表使用 MySQL 8.0 兼容的幂等列与索引初始化', () => {
    expect(serverSource).toContain("await ensureColumnExists('event_tracks', 'event_id', 'VARCHAR(128) DEFAULT NULL');");
    expect(serverSource).toContain("await ensureIndexExists('event_tracks', 'uniq_event_tracks_event_id', 'UNIQUE INDEX uniq_event_tracks_event_id (event_id)');");
    expect(serverSource).not.toContain('ADD COLUMN IF NOT EXISTS');
  });
});
