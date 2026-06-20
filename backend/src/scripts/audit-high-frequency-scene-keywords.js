'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = String(process.env.SCENE_KEYWORD_AUDIT_OUTPUT_FILE || '').trim();

const CASES = [
  { sceneKey: 'kindergarten_separation_anxiety', keywords: ['上幼儿园就哭', '送园大哭'] },
  { sceneKey: 'screen_time_boundary', keywords: ['总想看手机', '玩平板停不下来'] },
  { sceneKey: 'night_waking_repeat', keywords: ['半夜总醒', '夜里反复醒'] },
  { sceneKey: 'backtalk_defiance', keywords: ['孩子总顶嘴', '一说就顶嘴'] },
  { sceneKey: 'turn_taking_boundary', keywords: ['轮到别人就生气', '不会轮流'] },
  { sceneKey: 'sore_loser_meltdown', keywords: ['一输就哭', '输了就不玩了'] },
  { sceneKey: 'peer_exclusion_support', keywords: ['没人一起玩', '交不到朋友'] },
  { sceneKey: 'reward_system_fatigue', keywords: ['奖励一停就不做', '贴纸奖励没用'] },
  { sceneKey: 'repeated_rule_ignoring', keywords: ['反复提醒还是没用', '说很多遍都不听'] },
  { sceneKey: 'homework_start_resistance', keywords: ['拖到最后才写作业', '写作业前一直磨蹭'] },
  { sceneKey: 'task_freeze_at_first_question', keywords: ['看题就说不会', '不会做就立刻放弃'] },
  { sceneKey: 'prolonged_mealtime_delay', keywords: ['一顿饭吃很长时间', '吃饭特别慢'] },
  { sceneKey: 'leave_table_after_two_bites', keywords: ['吃两口就跑', '刚吃几口就下桌'] },
  { sceneKey: 'sleep_resist', keywords: ['睡前拖拖拉拉', '睡前流程走不动'] },
  { sceneKey: 'morning_rush', keywords: ['上学前磨蹭', '临出门还在磨蹭'] },
  { sceneKey: 'fall_asleep_delay', keywords: ['躺下很久睡不着', '关灯后很久不睡'] },
  { sceneKey: 'rejected_request_meltdown', keywords: ['不答应就大哭', '拒绝他就立刻炸'] },
  { sceneKey: 'chasing_feed_loop', keywords: ['不追着喂就不吃', '满屋追着喂'] },
  { sceneKey: 'wakeup_activation_delay', keywords: ['叫很多次还不动', '起床叫不动'] },
  { sceneKey: 'peer_join_hesitation', keywords: ['站在旁边不敢加入', '不会主动加入小朋友'] },
  { sceneKey: 'boundary_breaks_in_the_moment', keywords: ['一到现场守不住', '到了商场规则全没了'] },
  { sceneKey: 'slow_emotional_recovery_after_no', keywords: ['被拒绝后缓不过来', '哭很久停不下来'] }
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

async function matchKeyword(connection, keyword) {
  const searchTerm = `%${keyword}%`;
  const [rows] = await connection.execute(
    `SELECT t.scene_key, t.scene_title
     FROM parenting_scene_tags t
     LEFT JOIN parenting_scene_aliases a ON a.scene_key = t.scene_key AND a.status = 'active'
     WHERE t.status = 'active'
       AND (t.scene_title LIKE ? OR a.alias_text LIKE ?)
     ORDER BY t.sort_order ASC, a.sort_order ASC, t.id ASC
     LIMIT 1`,
    [searchTerm, searchTerm]
  );
  return rows[0] || null;
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
      for (const keyword of item.keywords) {
        const matched = await matchKeyword(connection, keyword);
        rows.push({
          keyword,
          expectedSceneKey: item.sceneKey,
          matchedSceneKey: matched ? matched.scene_key : '',
          matchedSceneTitle: matched ? matched.scene_title : '',
          passed: !!matched && matched.scene_key === item.sceneKey
        });
      }
    }

    const failedRows = rows.filter((item) => !item.passed);
    const summary = {
      total: rows.length,
      passed: rows.length - failedRows.length,
      failed: failedRows.length,
      rows
    };

    const text = `${JSON.stringify(summary, null, 2)}\n`;
    process.stdout.write(text);
    if (OUTPUT_FILE) {
      fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
    }
    if (failedRows.length) {
      process.exit(1);
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
