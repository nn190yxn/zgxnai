'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = String(process.env.SCENE_DENSITY_AUDIT_OUTPUT_FILE || '').trim();

const CASES = [
  { sceneKey: 'kindergarten_separation_anxiety', keywords: ['上幼儿园就哭', '送园大哭', '分离焦虑', '入园', '妈妈手链', '接园'] },
  { sceneKey: 'screen_time_boundary', keywords: ['总想看手机', '玩平板停不下来', '屏幕时间', '看屏幕'] },
  { sceneKey: 'night_waking_repeat', keywords: ['半夜总醒', '夜里反复醒', '夜醒'] },
  { sceneKey: 'backtalk_defiance', keywords: ['孩子总顶嘴', '一说就顶嘴', '顶嘴'] },
  { sceneKey: 'turn_taking_boundary', keywords: ['轮到别人就生气', '不会轮流', '轮流'] },
  { sceneKey: 'sore_loser_meltdown', keywords: ['一输就哭', '输了就不玩了', '输不起'] },
  { sceneKey: 'peer_exclusion_support', keywords: ['没人一起玩', '交不到朋友', '被排斥', '没人玩'] },
  { sceneKey: 'reward_system_fatigue', keywords: ['奖励一停就不做', '贴纸奖励没用', '奖励'] },
  { sceneKey: 'repeated_rule_ignoring', keywords: ['反复提醒还是没用', '说很多遍都不听', '规则'] },
  { sceneKey: 'homework_start_resistance', keywords: ['拖到最后才写作业', '写作业前一直磨蹭', '开工歌', '云同桌', '番茄钟', '放学先写'] },
  { sceneKey: 'task_freeze_at_first_question', keywords: ['看题就说不会', '不会做就立刻放弃', '念题目', '遮住难题', '当小老师'] },
  { sceneKey: 'prolonged_mealtime_delay', keywords: ['一顿饭吃很长时间', '吃饭特别慢', '整顿饭', '慢食', '勺子停车场'] },
  { sceneKey: 'leave_table_after_two_bites', keywords: ['吃两口就跑', '刚吃几口就下桌', '离桌'] },
  { sceneKey: 'sleep_resist', keywords: ['睡前拖拖拉拉', '睡前流程走不动', '睡前磨蹭', '通关文牒', '睡前暗号'] },
  { sceneKey: 'morning_rush', keywords: ['上学前磨蹭', '临出门还在磨蹭', '出门清单', '出门流程', '反催促', '自检镜', '出发箭头', '胜利照', '调快时钟'] },
  { sceneKey: 'fall_asleep_delay', keywords: ['躺下很久睡不着', '关灯后很久不睡', '入睡困难', '加重毯', '墨西哥卷饼', '重力拥抱', '打哈欠', '足底按摩'] },
  { sceneKey: 'rejected_request_meltdown', keywords: ['不答应就大哭', '拒绝他就立刻炸', '被拒绝就发脾气'] },
  { sceneKey: 'chasing_feed_loop', keywords: ['不追着喂就不吃', '满屋追着喂', '追着喂饭', '餐垫', '分隔盘', '定时定点'] },
  { sceneKey: 'wakeup_activation_delay', keywords: ['叫很多次还不动', '起床叫不动', '赖床不起', '香味唤醒', '起床挑战', '起床能量', '脚底', '闹钟寻宝'] },
  { sceneKey: 'peer_join_hesitation', keywords: ['站在旁边不敢加入', '不会主动加入小朋友', '加入同伴'] },
  { sceneKey: 'boundary_breaks_in_the_moment', keywords: ['一到现场守不住', '到了商场规则全没了', '临场失守', '场景切换', '规则检查', '冷静毯', '考核官', '半票', '双手放肚子'] },
  { sceneKey: 'slow_emotional_recovery_after_no', keywords: ['被拒绝后缓不过来', '哭很久停不下来', '恢复很慢'] }
];

function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function requireMysqlPromise() {
  try {
    return require('mysql2/promise');
  } catch (error) {
    const globalRoot = require('child_process').execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'mysql2/promise'));
  }
}

function buildArticleWhere(keywords) {
  return keywords.map(() => '(title LIKE ? OR summary LIKE ? OR content LIKE ? OR tags LIKE ?)').join(' OR ');
}

function buildArticleParams(keywords) {
  return keywords.flatMap((keyword) => {
    const search = `%${keyword}%`;
    return [search, search, search, search];
  });
}

function buildTipWhere(keywords) {
  return keywords.map(() => '(title LIKE ? OR content LIKE ? OR category LIKE ? OR source_article_title LIKE ?)').join(' OR ');
}

function buildTipParams(keywords) {
  return keywords.flatMap((keyword) => {
    const search = `%${keyword}%`;
    return [search, search, search, search];
  });
}

function getDensityLevel(articleCount, tipCount) {
  if (articleCount >= 20 && tipCount >= 10) return 'strong';
  if (articleCount >= 8 && tipCount >= 4) return 'medium';
  return 'thin';
}

function getPriority(articleCount, tipCount) {
  if (articleCount === 0 && tipCount === 0) return 'p0';
  if (articleCount <= 3 || tipCount <= 1) return 'p1';
  if (articleCount <= 8 || tipCount <= 3) return 'p2';
  return 'p3';
}

async function main() {
  loadEnv(path.resolve(__dirname, '../../../.env'));
  const mysql = requireMysqlPromise();
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const rows = [];
    for (const item of CASES) {
      const [articleRows] = await connection.execute(
        `SELECT COUNT(*) AS c FROM articles WHERE ${buildArticleWhere(item.keywords)}`,
        buildArticleParams(item.keywords)
      );
      const [tipRows] = await connection.execute(
        `SELECT COUNT(*) AS c FROM parenting_tips WHERE is_active = 1 AND (${buildTipWhere(item.keywords)})`,
        buildTipParams(item.keywords)
      );
      const [aliasRows] = await connection.execute(
        'SELECT COUNT(*) AS c FROM parenting_scene_aliases WHERE scene_key = ? AND status = ?',
        [item.sceneKey, 'active']
      );
      const [recommendationRows] = await connection.execute(
        'SELECT COUNT(*) AS c FROM parenting_scene_recommendations WHERE scene_key = ?',
        [item.sceneKey]
      );

      const articleCount = Number(articleRows[0].c || 0);
      const tipCount = Number(tipRows[0].c || 0);
      rows.push({
        sceneKey: item.sceneKey,
        articleCount,
        tipCount,
        aliasCount: Number(aliasRows[0].c || 0),
        recommendationCount: Number(recommendationRows[0].c || 0),
        densityLevel: getDensityLevel(articleCount, tipCount),
        priority: getPriority(articleCount, tipCount)
      });
    }

    rows.sort((a, b) => {
      const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (a.articleCount !== b.articleCount) {
        return a.articleCount - b.articleCount;
      }
      return a.tipCount - b.tipCount;
    });

    const summary = {
      total: rows.length,
      strongCount: rows.filter((item) => item.densityLevel === 'strong').length,
      mediumCount: rows.filter((item) => item.densityLevel === 'medium').length,
      thinCount: rows.filter((item) => item.densityLevel === 'thin').length,
      rows
    };

    const text = `${JSON.stringify(summary, null, 2)}\n`;
    process.stdout.write(text);
    if (OUTPUT_FILE) {
      fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
    }
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  const output = {
    ok: false,
    message: error && error.message ? error.message : String(error)
  };
  const text = `${JSON.stringify(output, null, 2)}\n`;
  process.stderr.write(text);
  if (OUTPUT_FILE) {
    fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
  }
  process.exit(1);
});
