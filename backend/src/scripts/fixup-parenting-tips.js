#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

loadEnv(path.resolve(__dirname, '../../../.env'));
loadEnv('/home/ubuntu/niuniu-parenting/.env');

const EXPANDED_SCENE_KEYWORDS = {
  '吃饭': ['吃饭', '挑食', '喂饭', '辅食', '餐桌', '零食', '营养', '饮食', '进食', '饭菜', '胃口', '偏食', '咀嚼', '吞咽', '食谱', '食材', '用餐', '三餐', '餐前', '餐后', '饱', '饿', '喂养', '奶粉', '母乳', '断奶', '奶瓶', '勺子', '碗筷'],
  '睡觉': ['睡觉', '入睡', '睡眠', '睡前', '起床', '午睡', '夜醒', '哄睡', '熬夜', '就寝', '睡得', '睡着', '早睡', '晚睡', '犯困', '休息', '困了', '噩梦', '尿床'],
  '写作业': ['作业', '学习', '写字', '读书', '功课', '复习', '预习', '考试', '成绩', '注意力', '专注', '记忆', '数数', '识字', '阅读', '绘本', '画画', '涂鸦', '拼图', '书写', '计算', '背诵', '题目', '课本'],
  '出门': ['出门', '外出', '上学', '幼儿园', '学校', '社交', '朋友', '玩耍', '户外', '公园', '操场', '同伴', '同学', '集体', '适应', '分离', '离别', '送园', '接园'],
  '情绪': ['情绪', '发脾气', '哭闹', '生气', '焦虑', '害怕', '紧张', '沮丧', '委屈', '伤心', '烦躁', '愤怒', '失控', '安抚', '平静', '冷静', '耐心', '接纳', '倾诉', '眼泪', '吼叫', '打人', '咬人', '扔东西'],
  '亲子互动': ['陪伴', '游戏', '亲子', '玩耍', '聊天', '沟通', '对话', '拥抱', '共读', '互动', '回应', '交流', '倾听', '表达', '询问', '讲故事', '一起', '陪', '带孩'],
  '生活习惯': ['洗手', '刷牙', '穿衣', '整理', '收拾', '规矩', '习惯', '自理', '独立', '家务', '打扫', '叠', '穿衣', '系鞋带', '扣扣子', '如厕', '便盆', '洗澡', '洗头'],
  '电子产品': ['手机', '电视', '屏幕', 'iPad', '平板', '电子', '游戏机', '视频', '动画', '看手机', '看电视', '刷视频'],
  '健康': ['发烧', '感冒', '咳嗽', '生病', '疫苗', '体检', '发育', '身高', '体重', '运动', '锻炼', '跑步', '跳跃', '爬行', '走路', '便便', '排便', '大便', '小便', '流鼻涕', '腹泻', '过敏', '湿疹']
};

// Second pass: broader scene detection using source article info
const CATEGORY_TO_SCENES = {
  '营养健康': ['吃饭', '健康'],
  '睡眠管理': ['睡觉'],
  '运动发展': ['健康', '出门'],
  '语言发展': ['写作业', '亲子互动'],
  '社交能力': ['出门', '亲子互动'],
  '情绪养育': ['情绪', '亲子互动'],
  '情绪管理': ['情绪'],
  '行为习惯': ['生活习惯', '写作业'],
  '亲子关系': ['亲子互动', '情绪'],
  '生活技能': ['生活习惯']
};

function detectScenesV2(content, category) {
  const scenes = [];
  for (const [scene, keywords] of Object.entries(EXPANDED_SCENE_KEYWORDS)) {
    if (keywords.some(kw => content.includes(kw))) {
      scenes.push(scene);
    }
  }
  if (!scenes.length && category) {
    const inferred = CATEGORY_TO_SCENES[category];
    if (inferred) scenes.push(...inferred);
  }
  return Array.from(new Set(scenes));
}

const ACTIONABLE_KEYWORDS = [
  '可以', '建议', '试试', '不妨', '最好',
  '让孩', '帮孩', '给孩', '教孩', '和孩子',
  '父母可以', '家长可以', '每天', '每次',
  '不要', '别让', '避免', '注意',
  '试试看', '先做', '第一步', '从...开始'
];

function loadEnv(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0 || line.startsWith('#')) continue;
    const key = line.slice(0, eqIdx).trim();
    if (!process.env[key]) process.env[key] = line.slice(eqIdx + 1).trim();
  }
}

function requireMysqlPromise() {
  try { return require('mysql2/promise'); } catch (err) {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(path.join(globalRoot, 'mysql2/promise'));
  }
}

function detectScenes(content) {
  const scenes = [];
  for (const [scene, keywords] of Object.entries(EXPANDED_SCENE_KEYWORDS)) {
    if (keywords.some(kw => content.includes(kw))) {
      scenes.push(scene);
    }
  }
  return scenes;
}

function isNonActionable(tip) {
  const text = String(tip.content || '');
  const hasAction = ACTIONABLE_KEYWORDS.some(kw => text.includes(kw));
  if (hasAction) return false;

  const isTooLong = text.length > 200;
  let scenes = [];
  try { scenes = JSON.parse(tip.scene_tags || '[]'); } catch (e) { /**/ }
  const hasScene = scenes.length > 0;

  return isTooLong && !hasScene;
}

function classifyContentType(text) {
  const t = String(text || '');
  if (/第[一二三四五]步|第一步|第二步|第三步|步骤一|步骤二|步骤三|首先.*然后|首先.*其次|先.*再.*最后/.test(t)) return 'stepwise';
  if (/研究发现|研究表明|实验表明|数据表明|科学.*证明|研究.*发现|循证/.test(t)) return 'evidence';
  if (/不要|别让|少给|少让|防止|避免|注意避免|严格禁止/.test(t)) return 'caution';
  if (/可以|建议|试试|不妨|最好|推荐|让孩|帮孩|给孩|教孩|和孩子|每天|每次|从.*开始/.test(t)) return 'actionable';
  return 'knowledge';
}

function classifyDomain(category, content) {
  const domainMap = {
    '营养健康': '身体健康', '睡眠管理': '身体健康', '运动发展': '身体健康', '健康': '身体健康',
    '情绪养育': '情绪心理', '情绪管理': '情绪心理', '心理发展': '情绪心理', '性格形成': '情绪心理',
    '行为习惯': '行为管理', '生活技能': '行为管理', '纪律管理': '行为管理', '行为偏差': '行为管理',
    '认知发展': '认知学习', '语言发展': '认知学习', '智力开发': '认知学习', '大脑发育': '认知学习', '注意力': '认知学习',
    '社交能力': '社交关系', '亲子关系': '社交关系', '社会性发展': '社交关系',
    '教育方法': '教育方法', '环境创设': '教育方法'
  };
  const base = domainMap[category] || '家庭教育';
  if (base !== '教育方法' && base !== '家庭教育') return base;

  const text = String(content || '');
  if (/陪伴|拥抱|聊天|亲子|一起玩|共读|共处|亲子关系/.test(text)) return '亲子关系';
  if (/作业|学习|功课|复习|预习|考试|成绩|阅读|书写|识字|数数/.test(text)) return '学习辅导';
  if (/规矩|纪律|惩罚|奖励|后果|规则|界限|底线/.test(text)) return '规则纪律';
  if (/家务|自理|独立|整理|收拾|穿衣|刷牙|洗澡|吃饭|睡觉/.test(text)) return '生活自理';
  if (/家人|家庭|氛围|环境|创设|布置|空间/.test(text)) return '家庭环境';
  if (/幼儿园|学校|入学|适应|老师|同学|同伴/.test(text)) return '学校适应';
  if (/隔代|爷爷|奶奶|外公|外婆|老人/.test(text)) return '隔代教育';
  return '教育理念';
}

function inferAgeGroup(content) {
  const text = String(content || '');
  if (/新生儿|满月|月子|初生|哺乳|襁褓|月龄|百天/.test(text)) return '0-1岁';
  if (/婴儿|周岁|一岁|1岁|刚会走|学步|蹒跚|出牙|断奶/.test(text)) return '0-1岁';
  if (/两岁|2岁|刚会跑|第一个叛逆|terrible|可怕的两岁/.test(text)) return '1-2岁';
  if (/三岁|3岁|入园|入托|托班|小班/.test(text)) return '2-3岁';
  if (/四岁|4岁|中班/.test(text)) return '3-4岁';
  if (/五岁|5岁|大班|学前/.test(text)) return '4-5岁';
  if (/六岁|6岁|小学|一年级|上学|幼小衔接/.test(text)) return '5-6岁';
  if (/七八岁|八九岁|小学|二年级|三年级/.test(text)) return '6-9岁';
  return '';
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const mysql = requireMysqlPromise();
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 4,
    queueLimit: 0
  });

  try {
    // Step 1: scene tag backfill
    console.log('[tip-fixup] Step 1: scene tag backfill...');
    const [nullTags] = await pool.query(
      'SELECT id, content, category FROM parenting_tips WHERE scene_tags IS NULL AND is_active = 1'
    );
    console.log(`[tip-fixup] tips_without_scenes=${nullTags.length}`);

    let backfilled = 0;
    for (const tip of nullTags) {
      const scenes = detectScenesV2(String(tip.content || ''), tip.category);
      if (scenes.length) {
        if (!dryRun) {
          await pool.query('UPDATE parenting_tips SET scene_tags = ? WHERE id = ?', [JSON.stringify(scenes), tip.id]);
        }
        backfilled++;
      }
    }
    console.log(`[tip-fixup] scene_backfilled=${backfilled}${dryRun ? ' (dry-run)' : ''}`);

    // Step 2: conservative non-actionable filter
    console.log('[tip-fixup] Step 2: conservative actionable filter...');
    const [allTips] = await pool.query(
      'SELECT id, title, content, category, scene_tags FROM parenting_tips WHERE is_active = 1 ORDER BY id'
    );

    let deactivated = 0;
    const samples = [];
    for (const tip of allTips) {
      if (isNonActionable(tip)) {
        if (samples.length < 10) samples.push(tip);
        if (!dryRun) {
          await pool.query('UPDATE parenting_tips SET is_active = 0 WHERE id = ?', [tip.id]);
        }
        deactivated++;
      }
    }
    console.log(`[tip-fixup] deactivated=${deactivated}${dryRun ? ' (dry-run)' : ''}`);
    if (samples.length) {
      console.log('[tip-fixup] sample deactivations:');
      samples.forEach(t => console.log('  [' + t.category + '] ' + t.title.slice(0,60)));
    }

    // Step 3: age group assignment
    console.log('[tip-fixup] Step 3: age group inference...');
    const [noAgeTips] = await pool.query(
      'SELECT id, content FROM parenting_tips WHERE (age_group = "" OR age_group IS NULL) AND is_active = 1'
    );
    console.log(`[tip-fixup] tips_without_age=${noAgeTips.length}`);

    let ageAssigned = 0;
    for (const tip of noAgeTips) {
      const ageGroup = inferAgeGroup(String(tip.content || ''));
      if (ageGroup) {
        if (!dryRun) {
          await pool.query('UPDATE parenting_tips SET age_group = ? WHERE id = ?', [ageGroup, tip.id]);
        }
        ageAssigned++;
      }
    }
    console.log(`[tip-fixup] age_assigned=${ageAssigned}${dryRun ? ' (dry-run)' : ''}`);

    // Step 4: content_type classification
    console.log('[tip-fixup] Step 4: content_type classification...');
    const [allTips2] = await pool.query(
      'SELECT id, content FROM parenting_tips WHERE is_active = 1 AND (content_type IS NULL OR content_type = "")'
    );
    console.log(`[tip-fixup] tips_without_content_type=${allTips2.length}`);

    let ctAssigned = 0;
    for (const tip of allTips2) {
      const ct = classifyContentType(String(tip.content || ''));
      if (!dryRun) {
        await pool.query('UPDATE parenting_tips SET content_type = ? WHERE id = ?', [ct, tip.id]);
      }
      ctAssigned++;
    }
    const [ctDist] = await pool.query(
      'SELECT content_type, COUNT(*) as cnt FROM parenting_tips WHERE is_active = 1 GROUP BY content_type ORDER BY cnt DESC'
    );
    console.log('[tip-fixup] content_type_distribution:');
    ctDist.forEach(r => console.log(`  ${r.content_type}: ${r.cnt}`));
    console.log(`[tip-fixup] content_type_assigned=${ctAssigned}${dryRun ? ' (dry-run)' : ''}`);

    // Step 5: concise domain classification
    console.log('[tip-fixup] Step 5: concise_domain classification...');
    const [allTips3] = await pool.query(
      'SELECT id, category, content FROM parenting_tips WHERE is_active = 1 AND (concise_domain IS NULL OR concise_domain = "")'
    );
    console.log(`[tip-fixup] tips_without_domain=${allTips3.length}`);

    let domainAssigned = 0;
    for (const tip of allTips3) {
      const domain = classifyDomain(tip.category, String(tip.content || ''));
      if (!dryRun) {
        await pool.query('UPDATE parenting_tips SET concise_domain = ? WHERE id = ?', [domain, tip.id]);
      }
      domainAssigned++;
    }
    const [domDist] = await pool.query(
      'SELECT concise_domain, COUNT(*) as cnt FROM parenting_tips WHERE is_active = 1 GROUP BY concise_domain ORDER BY cnt DESC'
    );
    console.log('[tip-fixup] domain_distribution:');
    domDist.forEach(r => console.log(`  ${r.concise_domain}: ${r.cnt}`));
    console.log(`[tip-fixup] domain_assigned=${domainAssigned}${dryRun ? ' (dry-run)' : ''}`);

    // Final summary
    const [summary] = await pool.query(
      'SELECT is_active, COUNT(*) as cnt FROM parenting_tips GROUP BY is_active'
    );
    console.log('[tip-fixup] summary:');
    summary.forEach(r => console.log(`  is_active=${r.is_active}: ${r.cnt}`));

    const [ageSum] = await pool.query(
      "SELECT age_group, COUNT(*) as cnt FROM parenting_tips WHERE age_group != '' GROUP BY age_group ORDER BY cnt DESC"
    );
    if (ageSum.length) {
      console.log('[tip-fixup] age_distribution:');
      ageSum.forEach(r => console.log(`  ${r.age_group}: ${r.cnt}`));
    }

    const [sceneRate] = await pool.query(
      'SELECT SUM(CASE WHEN scene_tags IS NOT NULL THEN 1 ELSE 0 END) as with_scene, COUNT(*) as total FROM parenting_tips'
    );
    console.log(`[tip-fixup] scene_coverage: ${sceneRate[0].with_scene}/${sceneRate[0].total} (${Math.round(sceneRate[0].with_scene/sceneRate[0].total*100)}%)`);

    if (dryRun) {
      console.log('[tip-fixup] mode=dry-run (no changes applied)');
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('[tip-fixup]', error.message);
  process.exit(1);
});
