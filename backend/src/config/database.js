// 数据库配置与初始化
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/app.db');

// 确保数据目录存在
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(DB_PATH);

// 启用外键约束
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 数据库初始化
function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE NOT NULL,
      nickname TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 孩子档案表
  db.exec(`
    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'unknown')),
      birthday TEXT,
      avatar TEXT,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  const childColumns = db.prepare('PRAGMA table_info(children)').all().map(column => column.name);
  const childColumnMigrations = [
    ['nickname', 'TEXT'],
    ['current_height', 'REAL'],
    ['current_weight', 'REAL'],
    ['allergies', 'TEXT'],
    ['special_notes', 'TEXT'],
    ['tags', 'TEXT']
  ];
  for (const [columnName, columnType] of childColumnMigrations) {
    if (!childColumns.includes(columnName)) {
      db.exec(`ALTER TABLE children ADD COLUMN ${columnName} ${columnType}`);
    }
  }

  // 评估记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS assessment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      assessment_code TEXT NOT NULL,
      assessment_name TEXT,
      age_group TEXT,
      total_score REAL,
      max_score REAL,
      percentage REAL,
      overall_level TEXT,
      elapsed_time INTEGER,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id)
    )
  `);

  // 评估维度得分表
  db.exec(`
    CREATE TABLE IF NOT EXISTS assessment_dimensions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      dimension_name TEXT NOT NULL,
      score REAL,
      score_rate REAL,
      standard_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES assessment_records(id) ON DELETE CASCADE
    )
  `);

  // 评估解读知识库
  db.exec(`
    CREATE TABLE IF NOT EXISTS assessment_interpretations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_code TEXT NOT NULL,
      dimension_name TEXT,
      score_min REAL,
      score_max REAL,
      level TEXT,
      interpretation TEXT NOT NULL,
      behavior_description TEXT,
      scene_advice TEXT,
      expected_goal TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 评估建议知识库
  db.exec(`
    CREATE TABLE IF NOT EXISTS assessment_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_code TEXT NOT NULL,
      dimension_name TEXT,
      level TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      steps TEXT,
      duration TEXT,
      frequency TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 聊天消息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      role TEXT CHECK(role IN ('user', 'bot')) NOT NULL,
      content TEXT NOT NULL,
      sources TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 知识库表（RAG）
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      sub_category TEXT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      age_range TEXT,
      source TEXT,
      evidence_level TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 阅读任务表
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_code TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subject_code TEXT NOT NULL,
      age_range TEXT,
      difficulty INTEGER DEFAULT 1,
      duration INTEGER,
      material TEXT,
      objective TEXT,
      steps TEXT,
      parent_prompt TEXT,
      content TEXT,
      image_url TEXT,
      icon_url TEXT,
      cover_image TEXT,
      audio_url TEXT,
      video_url TEXT,
      tips TEXT,
      example_answer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 为 reading_tasks 表添加新列（兼容旧数据库）
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN image_url TEXT`);
  } catch (e) { /* 列已存在 */ }
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN icon_url TEXT`);
  } catch (e) { /* 列已存在 */ }
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN cover_image TEXT`);
  } catch (e) { /* 列已存在 */ }
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN audio_url TEXT`);
  } catch (e) { /* 列已存在 */ }
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN video_url TEXT`);
  } catch (e) { /* 列已存在 */ }
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN tips TEXT`);
  } catch (e) { /* 列已存在 */ }
  try {
    db.exec(`ALTER TABLE reading_tasks ADD COLUMN example_answer TEXT`);
  } catch (e) { /* 列已存在 */ }

  // 任务进度表
  db.exec(`
    CREATE TABLE IF NOT EXISTS task_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER NOT NULL,
      task_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id),
      FOREIGN KEY (task_id) REFERENCES reading_tasks(id)
    )
  `);

  // 育儿文章表
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      category TEXT,
      sub_category TEXT,
      age_group TEXT,
      tags TEXT,
      author TEXT,
      evidence_level TEXT,
      read_count INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const articleColumns = db.prepare('PRAGMA table_info(articles)').all().map(column => column.name);
  if (!articleColumns.includes('cover')) {
    db.exec(`ALTER TABLE articles ADD COLUMN cover TEXT`);
  }
  if (!articleColumns.includes('cover_image')) {
    db.exec(`ALTER TABLE articles ADD COLUMN cover_image TEXT`);
  }
  if (!articleColumns.includes('icon_url')) {
    db.exec(`ALTER TABLE articles ADD COLUMN icon_url TEXT`);
  }

  // 用户收藏表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_type, item_id)
    )
  `);

  // 埋点事件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS event_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      event_type TEXT NOT NULL,
      event_data TEXT,
      session_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 会员套餐表
  db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      price_yuan INTEGER NOT NULL,
      original_price INTEGER,
      description TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 订阅表
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_code TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      start_date DATETIME,
      end_date DATETIME,
      auto_renew INTEGER DEFAULT 0,
      wx_agreement_id TEXT,
      pay_method TEXT,
      order_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 用户会员快照表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_memberships (
      user_id INTEGER PRIMARY KEY,
      is_trial_used INTEGER DEFAULT 0,
      trial_end_date DATETIME,
      current_plan TEXT,
      current_end_date DATETIME,
      auto_renew INTEGER DEFAULT 1,
      membership_type TEXT DEFAULT 'free',
      status TEXT DEFAULT 'free',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 兑换码批次表
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_code TEXT NOT NULL UNIQUE,
      description TEXT,
      duration_days INTEGER NOT NULL,
      total_count INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      valid_from DATETIME,
      valid_to DATETIME,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 兑换码表
  db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER,
      code TEXT NOT NULL UNIQUE,
      status TEXT DEFAULT 'unused',
      user_id INTEGER,
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 支付订单表
  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_code TEXT NOT NULL,
      order_no TEXT NOT NULL UNIQUE,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      wx_prepay_id TEXT,
      wx_transaction_id TEXT,
      auto_renew INTEGER DEFAULT 1,
      wx_agreement_id TEXT,
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 裂变记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      invitee_id INTEGER,
      invitee_order_id INTEGER,
      reward_days INTEGER DEFAULT 7,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_records_child ON assessment_records(child_id);
    CREATE INDEX IF NOT EXISTS idx_records_code ON assessment_records(assessment_code);
    CREATE INDEX IF NOT EXISTS idx_dimensions_record ON assessment_dimensions(record_id);
    CREATE INDEX IF NOT EXISTS idx_interpretations_code ON assessment_interpretations(assessment_code);
    CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
    CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_base(category);
    CREATE INDEX IF NOT EXISTS idx_kb_title ON knowledge_base(title);
    CREATE INDEX IF NOT EXISTS idx_kb_tags ON knowledge_base(tags);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);
    CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles(tags);
    CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_favorites_item ON user_favorites(item_type, item_id);
    CREATE INDEX IF NOT EXISTS idx_events_type ON event_tracks(event_type);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
    CREATE INDEX IF NOT EXISTS idx_promo_codes_batch ON promo_codes(batch_id);
    CREATE INDEX IF NOT EXISTS idx_promo_codes_status ON promo_codes(status);
    CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_id);
    CREATE INDEX IF NOT EXISTS idx_referrals_invitee ON referrals(invitee_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_orders_order_no ON payment_orders(order_no);
  `);

  console.log('[Database] 初始化完成');
}

// 初始化数据
function seedData() {
  // 检查是否已有评估数据
  const count = db.prepare('SELECT COUNT(*) as count FROM assessment_interpretations').get();
  const hasAssessmentData = count.count > 0;

  console.log('[Database] 开始填充种子数据...');

  // 插入默认用户
  db.prepare(`
    INSERT OR IGNORE INTO users (id, openid, nickname)
    VALUES (1, 'test_openid', '测试用户')
  `).run();

  if (hasAssessmentData) {
    console.log('[Database] 评估数据已存在，跳过评估种子数据');
  }

  // 评估解读种子数据
  const interpretations = [
    {
      assessment_code: 'sensory',
      dimension_name: '前庭觉',
      score_min: 0, score_max: 40, level: 'intervention',
      interpretation: '孩子的前庭觉表现提示需要关注。具体表现为：对旋转、跳跃等活动的反应可能较敏感或迟钝，平衡能力可能有波动。',
      behavior_description: '在家庭中可能表现为：害怕荡秋千、拒绝旋转游戏、上下楼梯不稳、容易晕车。',
      scene_advice: '家庭场景建议：①每天进行10分钟秋千或平衡木活动；②避免在饭后1小时内进行剧烈旋转游戏；③观察孩子在黑暗环境中的平衡表现，持续记录2周。',
      expected_goal: '坚持2周后，孩子对旋转活动的接受度会有所提升，平衡能力逐步改善。'
    },
    {
      assessment_code: 'sensory',
      dimension_name: '前庭觉',
      score_min: 40, score_max: 55, level: 'attention',
      interpretation: '孩子的前庭觉处于中等水平，部分场景需要更多观察和支持。',
      behavior_description: '在家庭中可能表现为：偶尔抗拒旋转活动，但在鼓励下能参与；平衡能力一般，复杂地形需要辅助。',
      scene_advice: '家庭场景建议：①每周3次感统游戏（秋千、平衡木、蹦床）；②从低强度活动开始，逐步提升难度；③记录孩子的进步，给予正向强化。',
      expected_goal: '持续4周后，孩子对前庭刺激的反应会更加积极，平衡能力明显提升。'
    },
    {
      assessment_code: 'sensory',
      dimension_name: '前庭觉',
      score_min: 55, score_max: 70, level: 'medium',
      interpretation: '孩子的前庭觉发展良好，能够适应大多数前庭刺激。',
      behavior_description: '在家庭中可能表现为：喜欢荡秋千、旋转游戏，平衡能力较好，能适应各种地形。',
      scene_advice: '家庭场景建议：①保持每周2-3次感统活动；②可以尝试更复杂的平衡游戏（如单脚站立、走平衡线）；③结合其他感官活动，全面发展。',
      expected_goal: '继续保持，前庭觉能力会稳步提升，为运动发展奠定基础。'
    },
    {
      assessment_code: 'sensory',
      dimension_name: '前庭觉',
      score_min: 70, score_max: 85, level: 'good',
      interpretation: '孩子的前庭觉发展优秀，能够很好地处理和整合前庭信息。',
      behavior_description: '在家庭中可能表现为：喜欢各种运动，身体协调性好，对新活动接受度高。',
      scene_advice: '家庭场景建议：①继续保持多样化的运动活动；②可以尝试更具挑战性的运动项目；③鼓励孩子参与团队运动，发展社交能力。',
      expected_goal: '前庭觉能力优秀，可继续发展更高级的运动技能。'
    },
    {
      assessment_code: 'sensory',
      dimension_name: '前庭觉',
      score_min: 85, score_max: 100, level: 'excellent',
      interpretation: '孩子的前庭觉发展非常优秀，各项前庭功能协调良好。',
      behavior_description: '在家庭中可能表现为：运动能力强，身体协调性优秀，喜欢各种挑战性活动。',
      scene_advice: '家庭场景建议：①可以挑战更高难度的运动项目；②鼓励参与竞技性运动；③注意全面发展其他感官能力。',
      expected_goal: '前庭觉能力已发展成熟，继续保持即可。'
    },
    {
      assessment_code: 'focus',
      dimension_name: '集中注意',
      score_min: 0, score_max: 40, level: 'intervention',
      interpretation: '孩子的专注力表现提示需要关注。具体表现为：难以持续专注于任务，容易分心，需要频繁提醒。',
      behavior_description: '在家庭中可能表现为：玩玩具时频繁更换，难以完成一个简单任务，听故事时注意力不集中。',
      scene_advice: '家庭场景建议：①创造安静、整洁的学习环境；②使用番茄工作法，从5分钟开始逐步延长；③每次只布置一个简单任务。',
      expected_goal: '坚持2周后，孩子专注时间可从5分钟逐步提升至10分钟。'
    },
    {
      assessment_code: 'focus',
      dimension_name: '集中注意',
      score_min: 40, score_max: 55, level: 'attention',
      interpretation: '孩子的专注力处于中等水平，部分场景需要更多支持。',
      behavior_description: '在家庭中可能表现为：对感兴趣的活动能专注，对不感兴趣的活动容易分心。',
      scene_advice: '家庭场景建议：①从孩子感兴趣的活动开始培养专注力；②逐步增加任务难度和时长；③给予正向强化。',
      expected_goal: '持续4周后，孩子的专注力会有明显提升。'
    },
    {
      assessment_code: 'emotion',
      dimension_name: '情绪识别',
      score_min: 0, score_max: 40, level: 'intervention',
      interpretation: '孩子的情绪识别能力提示需要关注。具体表现为：难以识别自己和他人的情绪。',
      behavior_description: '在家庭中可能表现为：情绪爆发时无法表达，对他人的情绪反应迟钝。',
      scene_advice: '家庭场景建议：①使用情绪卡片教孩子识别基本情绪；②在日常生活中引导孩子命名情绪；③建立情绪日记。',
      expected_goal: '坚持2周后，孩子能识别并命名基本情绪。'
    },
    {
      assessment_code: 'learning',
      dimension_name: '学习适应',
      score_min: 0, score_max: 40, level: 'intervention',
      interpretation: '孩子的学习适应能力提示需要关注。具体表现为：难以适应学习环境，缺乏基本学习习惯。',
      behavior_description: '在家庭中可能表现为：抗拒学习任务，难以坚持完成简单的学习任务。',
      scene_advice: '家庭场景建议：①建立固定的学习时间和空间；②从最简单的任务开始；③使用游戏化学习方式。',
      expected_goal: '坚持4周后，孩子能建立基本的学习习惯和适应能力。'
    }
  ];

  const insertInterpretation = db.prepare(`
    INSERT INTO assessment_interpretations 
    (assessment_code, dimension_name, score_min, score_max, level, interpretation, behavior_description, scene_advice, expected_goal)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of interpretations) {
    insertInterpretation.run(
      item.assessment_code, item.dimension_name, item.score_min, item.score_max,
      item.level, item.interpretation, item.behavior_description, item.scene_advice, item.expected_goal
    );
  }

  // 评估建议种子数据
  const suggestions = [
    {
      assessment_code: 'sensory',
      dimension_name: '前庭觉',
      level: 'intervention',
      title: '家庭感统游戏支持',
      description: '通过平衡、触觉、户外活动增加身体经验',
      steps: '第1步：每天进行10分钟秋千或平衡木活动\n第2步：避免在饭后1小时内进行剧烈旋转游戏\n第3步：观察孩子在黑暗环境中的平衡表现，持续记录2周',
      duration: '持续进行',
      frequency: '每天10分钟'
    },
    {
      assessment_code: 'focus',
      dimension_name: '集中注意',
      level: 'intervention',
      title: '家庭专注环境优化',
      description: '减少干扰、拆小任务、建立稳定作息',
      steps: '第1步：学习环境减少干扰（关闭电视、手机静音）\n第2步：任务分解为小步骤，逐步完成\n第3步：建立稳定的作息时间表',
      duration: '持续进行',
      frequency: '每天'
    },
    {
      assessment_code: 'focus',
      dimension_name: '集中注意',
      level: 'good',
      title: '专注力进阶训练',
      description: '在已有基础上提升专注力持久度',
      steps: '第1步：逐步延长专注时间（每次增加2-3分钟）\n第2步：引入更复杂的任务\n第3步：培养自主专注力',
      duration: '持续进行',
      frequency: '每天15分钟'
    },
    {
      assessment_code: 'emotion',
      dimension_name: '情绪识别',
      level: 'intervention',
      title: '情绪识别基础训练',
      description: '帮助孩子认识和命名基本情绪',
      steps: '第1步：通过表情卡片教孩子识别基本情绪\n第2步：在日常生活中引导孩子表达情绪\n第3步：建立情绪日记，记录每天的情绪变化',
      duration: '4周',
      frequency: '每天5分钟'
    },
    {
      assessment_code: 'learning',
      dimension_name: '学习适应',
      level: 'attention',
      title: '学习适应力提升',
      description: '改善学习习惯和环境适应能力',
      steps: '第1步：建立固定的学习时间和空间\n第2步：使用视觉化工具辅助学习\n第3步：逐步增加学习任务的复杂度',
      duration: '6周',
      frequency: '每天20分钟'
    }
  ];

  const insertSuggestion = db.prepare(`
    INSERT INTO assessment_suggestions 
    (assessment_code, dimension_name, level, title, description, steps, duration, frequency)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of suggestions) {
    insertSuggestion.run(
      item.assessment_code, item.dimension_name, item.level, item.title,
      item.description, item.steps, item.duration, item.frequency
    );
  }

  // 阅读任务种子数据 - 扩充版
  const tasks = [
    {
      task_code: 'r0_1',
      title: '宝宝视觉追踪：看看玩具在哪里',
      subject_code: 'reading_comprehension',
      age_range: '0-1岁',
      difficulty: 1,
      duration: 5,
      material: '颜色鲜艳的玩具或绘本封面',
      objective: '训练宝宝视觉追踪能力',
      steps: `1. 在宝宝视线范围内缓慢移动玩具
2. 观察宝宝眼睛是否跟随
3. 在不同方向重复练习`,
      parent_prompt: '引导宝宝视线跟随玩具移动',
      content: '0-1岁宝宝视觉发育关键期训练',
      image_url: '',
      icon_url: 'https://example.com/images/icons/eye.png',
      cover_image: '',
      audio_url: '',
      video_url: '',
      tips: '每次练习时间不宜过长，5-10分钟为宜',
      example_answer: '宝宝眼睛能跟随玩具移动'
    },
    {
      task_code: 'r0_2',
      title: '亲子朗读：听听绘本的声音',
      subject_code: 'reading_comprehension',
      age_range: '1-2岁',
      difficulty: 1,
      duration: 10,
      material: '简单的绘本或卡片',
      objective: '通过朗读培养宝宝语言感知',
      steps: `1. 选择简单的绘本或卡片
2. 用温柔的声音朗读或讲解
3. 让宝宝触摸画面
4. 观察宝宝反应`,
      parent_prompt: '用温柔的声音为宝宝读书',
      content: '1-2岁宝宝语言启蒙训练',
      image_url: '',
      icon_url: 'https://example.com/images/icons/speak.png',
      cover_image: '',
      audio_url: '',
      video_url: '',
      tips: '语速要慢，音调要温和，重复朗读效果更好',
      example_answer: '宝宝能专注听5-10分钟'
    },
    {
      task_code: 'r1',
      title: '绘本封面观察：猜一猜主角',
      subject_code: 'reading_comprehension',
      age_range: '3-4岁',
      difficulty: 1,
      duration: 8,
      material: '选择一本画面清楚、主角突出的绘本（如《好饿的毛毛虫》）',
      objective: '通过观察封面，预测故事内容',
      steps: `1. 和孩子一起看封面，问"你看到了什么？"
2. 指着主角问"这是谁？它在做什么？"
3. 翻到第一页，对比孩子的预测
4. 鼓励孩子用手指着画面讲一讲`,
      parent_prompt: '封面上画了什么？你觉得这个故事讲的是什么？',
      content: '通过观察封面培养孩子预测能力和观察力',
      image_url: 'https://example.com/images/reading/r1_cover.png',
      icon_url: 'https://example.com/images/icons/book.png',
      cover_image: 'https://example.com/images/reading/r1_cover.png',
      audio_url: '',
      video_url: '',
      tips: '3-4岁孩子注意力短，每次只看1-2页即可。重点培养孩子"看图"的习惯。',
      example_answer: '我看到了一只毛毛虫，它好像很饿，正在吃苹果。'
    },
    {
      task_code: 'r2',
      title: '画面找一找：谁在哪里做什么',
      subject_code: 'reading_comprehension',
      age_range: '3-4岁',
      difficulty: 1,
      duration: 10,
      material: '选择画面丰富、人物动作清晰的绘本',
      objective: '能指出画面中的人物、地点和动作',
      steps: `1. 打开绘本，让孩子先看画面
2. 问"这是在哪里？"（地点）
3. 问"谁在这里？"（人物）
4. 问"它在做什么？"（动作）
5. 请孩子用完整句子说一遍`,
      parent_prompt: '你看到了谁？它在什么地方？正在做什么？',
      content: '训练孩子提取画面信息的能力，建立"谁-在哪里-做什么"的基本认知框架',
      image_url: 'https://example.com/images/reading/r2_find.png',
      icon_url: 'https://example.com/images/icons/search.png',
      cover_image: 'https://example.com/images/reading/r2_find.png',
      audio_url: '',
      video_url: '',
      tips: '如果孩子答不上来，用手指着画面引导。先从明显的人物开始，逐步加入背景元素。',
      example_answer: '小熊在公园里玩滑梯。'
    },
    {
      task_code: 'r3',
      title: '故事顺序排序：接下来发生了什么',
      subject_code: 'reading_comprehension',
      age_range: '4-5岁',
      difficulty: 2,
      duration: 10,
      material: '选择情节有先后顺序的绘本（如《三只小猪》）',
      objective: '理解故事的发展顺序',
      steps: `1. 读完故事后，和孩子回顾主要情节
2. 拿出3张关键画面的图片卡片
3. 让孩子按故事顺序排列
4. 请孩子用"先...然后...最后..."讲述故事`,
      parent_prompt: '故事是怎么开始的？接下来发生了什么？最后怎么样了？',
      content: '培养孩子理解故事发展顺序的能力，学习使用时间顺序词',
      image_url: 'https://example.com/images/reading/r3_sequence.png',
      icon_url: 'https://example.com/images/icons/order.png',
      cover_image: 'https://example.com/images/reading/r3_sequence.png',
      audio_url: '',
      video_url: '',
      tips: '如果孩子排序有困难，可以提示"故事一开始发生了什么？"，引导孩子回忆开头。',
      example_answer: '先盖草房子，然后大灰狼来了吹倒了草房子，最后小猪跑到砖房子里，大灰狼进不来。'
    },
    {
      task_code: 'r4',
      title: '角色表情猜一猜：它现在什么心情',
      subject_code: 'reading_comprehension',
      age_range: '4-5岁',
      difficulty: 2,
      duration: 8,
      material: '选择角色表情丰富的绘本（如《菲菲生气了》）',
      objective: '通过观察角色表情，推断情绪',
      steps: `1. 翻到角色表情明显的页面
2. 问孩子"你看它的表情，它现在是什么心情？"
3. 引导孩子说出理由"你怎么知道的？"
4. 讨论"如果你是它，你会怎么做？"`,
      parent_prompt: '你看这个角色脸上的表情，它是高兴还是难过？你怎么知道的？',
      content: '培养孩子观察角色表情、理解情绪的能力',
      image_url: 'https://example.com/images/reading/r4_emotion.png',
      icon_url: 'https://example.com/images/icons/face.png',
      cover_image: 'https://example.com/images/reading/r4_emotion.png',
      audio_url: '',
      video_url: '',
      tips: '可以和孩子一起模仿角色表情，增强理解和记忆。',
      example_answer: '它皱着眉头，嘴巴向下撇，看起来很生气。'
    },
    {
      task_code: 'r5',
      title: '因果关系推理：为什么会这样',
      subject_code: 'reading_comprehension',
      age_range: '5-6岁',
      difficulty: 3,
      duration: 12,
      material: '选择情节有因果关系的绘本（如《乌鸦喝水》）',
      objective: '理解故事中的因果关系',
      steps: `1. 读完故事后，问"故事里发生了什么问题？"
2. 引导孩子找出原因"为什么会这样？"
3. 问"它是怎么解决的？"
4. 请孩子用自己的话解释因果关系`,
      parent_prompt: '故事里出现了什么问题？它是怎么解决的？为什么这个方法有用？',
      content: '训练孩子理解故事中因果关系的能力',
      image_url: 'https://example.com/images/reading/r5_cause.png',
      icon_url: 'https://example.com/images/icons/think.png',
      cover_image: 'https://example.com/images/reading/r5_cause.png',
      audio_url: '',
      video_url: '',
      tips: '如果孩子说不出因果关系，可以用"因为...所以..."的句式引导。',
      example_answer: '因为乌鸦够不到水，所以它往瓶子里放石头，水位升高了，就能喝到水了。'
    },
    {
      task_code: 'r6',
      title: '故事复述：用一句话讲给别人听',
      subject_code: 'reading_comprehension',
      age_range: '5-6岁',
      difficulty: 3,
      duration: 10,
      material: '选择情节简单的绘本',
      objective: '能用简洁的语言复述故事主要内容',
      steps: `1. 读完故事后，让孩子先回忆主要情节
2. 引导孩子说出"谁""做了什么""结果怎样"
3. 鼓励孩子用一句话概括
4. 家长补充或纠正，再让孩子说一遍`,
      parent_prompt: '如果让你用一句话把这个故事讲给朋友听，你会怎么说？',
      content: '训练孩子提炼信息、概括表达的能力',
      image_url: 'https://example.com/images/reading/r6_retell.png',
      icon_url: 'https://example.com/images/icons/speak.png',
      cover_image: 'https://example.com/images/reading/r6_retell.png',
      audio_url: '',
      video_url: '',
      tips: '一开始孩子可能说很长，要鼓励他说"最重要的一句话"。',
      example_answer: '小兔子找到了回家的路。'
    }
  ];

  const insertTask = db.prepare(`
    INSERT INTO reading_tasks 
    (task_code, title, subject_code, age_range, difficulty, duration, material, objective, steps, parent_prompt, content, image_url, icon_url, cover_image, audio_url, video_url, tips, example_answer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (hasAssessmentData) {
    console.log('[Database] 评估数据已存在，跳过评估种子数据');
  } else {

  for (const task of tasks) {
    insertTask.run(
      task.task_code, task.title, task.subject_code, task.age_range, task.difficulty,
      task.duration, task.material, task.objective, task.steps, task.parent_prompt, task.content,
      task.image_url, task.icon_url, task.cover_image, task.audio_url, task.video_url, task.tips, task.example_answer
    );
  }

  // 育儿文章种子数据
  const articles = [
    {
      title: '3-6岁孩子情绪表达的4个引导技巧',
      summary: '通过命名情绪、接纳感受和行为边界，帮助孩子稳定表达情绪。',
      content: `情绪表达是儿童发展的重要能力...

【技巧一：命名情绪】
当孩子哭闹时，不要急着制止，而是帮助他认识："你现在是感到生气吗？"

【技巧二：接纳感受】
告诉孩子："生气是可以的，但打人不行。"

【技巧三：提供替代方案】
"你可以用语言说出来，或者画出来。"

【技巧四：建立冷静角】
在家中设置一个安静的角落，让孩子可以在情绪激动时自我调节。`,
      category: '情绪管理',
      sub_category: '情绪表达',
      age_group: '3-6岁',
      tags: '情绪,表达,引导',
      author: '小牛育儿专家团',
      evidence_level: 'A',
      cover: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=400&h=300&fit=crop'
    },
    {
      title: '建立睡前流程：让孩子更快入睡',
      summary: '固定节奏和低刺激环境可以显著降低入睡阻力。',
      content: `良好的睡眠习惯对孩子的成长至关重要...

【步骤一：固定时间】
每天晚上在同一时间开始睡前流程。

【步骤二：降低刺激】
睡前1小时避免电子屏幕，调暗灯光。

【步骤三：建立仪式】
洗澡→换睡衣→讲故事→睡觉，形成固定流程。

【步骤四：保持一致】
即使周末也要保持相同的作息时间。`,
      category: '行为习惯',
      sub_category: '睡眠习惯',
      age_group: '0-6岁',
      tags: '睡眠,习惯,流程',
      author: '小牛育儿专家团',
      evidence_level: 'A',
      cover: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05a55?w=400&h=300&fit=crop'
    }
  ];

  const insertArticle = db.prepare(`
    INSERT INTO articles (title, summary, content, category, sub_category, age_group, tags, author, evidence_level, cover)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const article of articles) {
    insertArticle.run(
      article.title, article.summary, article.content, article.category,
      article.sub_category, article.age_group, article.tags, article.author, article.evidence_level,
      article.cover || null
    );
  }

  // RAG知识库种子数据
  const knowledgeItems = [
    {
      category: 'development_milestones',
      sub_category: 'motor',
      title: '3-4岁大运动发展里程碑',
      content: `3-4岁儿童大运动发展里程碑：
1. 能双脚跳起（离地约5cm）
2. 能单脚站立2-3秒
3. 能上下楼梯交替迈步
4. 能骑三轮车
5. 能扔球时身体转体

如果孩子在这些方面有明显落后，建议进行专业评估。`,
      tags: '大运动,里程碑,3-4岁',
      age_range: '3-4岁',
      source: 'WHO儿童发育标准',
      evidence_level: 'A'
    },
    {
      category: 'sensory_integration',
      sub_category: 'vestibular',
      title: '前庭觉训练游戏',
      content: `前庭觉训练游戏：
1. 荡秋千：前后摆动，逐渐增加幅度
2. 旋转游戏：原地旋转5圈，停下后保持平衡
3. 平衡木：在低矮的平衡木上行走
4. 蹦床：在小蹦床上跳跃

注意：饭后1小时内避免剧烈前庭刺激。`,
      tags: '前庭觉,感统,训练',
      age_range: '3-6岁',
      source: 'Ayres感觉统合理论',
      evidence_level: 'B'
    },
    {
      category: 'nutrition',
      sub_category: 'feeding',
      title: '3-6岁儿童营养需求指南',
      content: `3-6岁儿童每日营养需求：
1. 热量：1300-1600千卡/天
2. 蛋白质：25-30克/天
3. 钙：600-800毫克/天
4. 铁：10毫克/天
5. 维生素D：400-600国际单位/天

饮食建议：
- 每天保证3餐2点
- 奶量300-500毫升
- 蔬菜水果各占一半
- 限制添加糖（<25克/天）

常见问题：
- 挑食：提供多样化选择，不强迫进食
- 零食过多：控制零食时间和种类
- 进食速度：培养细嚼慢咽习惯`,
      tags: '营养,喂养,3-6岁',
      age_range: '3-6岁',
      source: '中国居民膳食指南',
      evidence_level: 'A'
    },
    {
      category: 'nutrition',
      sub_category: ' picky_eating',
      title: '孩子挑食怎么办',
      content: `孩子挑食的应对策略：
1. 不强迫进食：强迫会加剧抗拒
2. 提供选择：让孩子在两样健康食物中选
3. 以身作则：家长展示良好的饮食习惯
4. 创意呈现：把食物做成有趣的形状
5. 反复尝试：新食物需要接触10-15次

注意事项：
- 避免用食物作为奖励或惩罚
- 控制餐前零食摄入
- 营造愉快的进餐氛围
- 记录孩子的饮食偏好，逐步扩展`,
      tags: '挑食,营养,饮食',
      age_range: '3-6岁',
      source: '儿童喂养心理学',
      evidence_level: 'B'
    },
    {
      category: 'sleep',
      sub_category: 'sleep_habits',
      title: '3-6岁儿童睡眠指南',
      content: `3-6岁儿童睡眠需求：
1. 每日睡眠时间：10-13小时
2. 夜间睡眠：9-11小时
3. 午睡：1-2小时
4. 入睡时间：晚上8:00-9:00
5. 起床时间：早上6:30-7:30

建立良好睡眠习惯：
1. 固定作息时间
2. 睡前1小时避免电子屏幕
3. 建立睡前仪式（洗澡→换睡衣→讲故事→睡觉）
4. 保持卧室安静、黑暗、适宜温度
5. 避免睡前剧烈运动

常见问题处理：
- 入睡困难：建立固定的睡前仪式
- 夜醒：保持安静，避免互动，让孩子自行入睡
- 噩梦：给予安抚，建立安全感`,
      tags: '睡眠,习惯,作息',
      age_range: '3-6岁',
      source: '美国睡眠医学会指南',
      evidence_level: 'A'
    },
    {
      category: 'language',
      sub_category: 'speech_development',
      title: '3-6岁语言发展里程碑',
      content: `3-6岁儿童语言发展里程碑：

3-4岁：
- 能说出完整的句子
- 能听懂简单指令
- 能讲故事（简单情节）
- 词汇量约1000个

4-5岁：
- 能使用复杂句式
- 能清晰表达需求
- 能回答"为什么"问题
- 词汇量约1500个

5-6岁：
- 能进行完整对话
- 能讲述经历（有逻辑）
- 能理解抽象概念
- 词汇量约2000个

促进语言发展的方法：
1. 多与孩子交流，描述日常活动
2. 阅读绘本，指着文字读
3. 鼓励孩子表达，不代替说话
4. 玩语言游戏（押韵、猜谜等）`,
      tags: '语言,发展,里程碑',
      age_range: '3-6岁',
      source: '儿童语言发展学',
      evidence_level: 'A'
    },
    {
      category: 'social_emotional',
      sub_category: 'social_skills',
      title: '3-6岁社交能力发展',
      content: `3-6岁儿童社交能力发展：

3-4岁：
- 开始平行游戏（和其他孩子一起玩但不互动）
- 能分享玩具（在提示下）
- 能理解轮流规则
- 开始出现"好朋友"概念

4-5岁：
- 开始合作游戏
- 能主动分享和轮流
- 能理解简单的社交规则
- 开始理解他人感受

5-6岁：
- 能进行团队游戏
- 能理解复杂的社交规则
- 能处理同伴冲突
- 能建立稳定的友谊

培养社交能力的方法：
1. 提供社交机会（ playground、兴趣班）
2. 角色扮演游戏
3. 学习解决冲突的方法
4. 培养同理心
5. 家长以身作则`,
      tags: '社交,情感,能力',
      age_range: '3-6岁',
      source: '儿童社会心理学',
      evidence_level: 'A'
    },
    {
      category: 'attention',
      sub_category: 'focus_training',
      title: '3-6岁儿童专注力训练',
      content: `3-6岁儿童专注力发展规律：

3-4岁：
- 专注时间：5-10分钟
- 能完成简单任务
- 容易分心

4-5岁：
- 专注时间：10-15分钟
- 能完成多步骤任务
- 能忽略部分干扰

5-6岁：
- 专注时间：15-20分钟
- 能完成复杂任务
- 能主动排除干扰

专注力训练方法：
1. 番茄工作法（儿童版）：从5分钟开始，逐步延长
2. 减少干扰：学习环境简洁，玩具收起来
3. 任务分解：大任务拆成小步骤
4. 兴趣引导：从孩子感兴趣的活动开始
5. 正向强化：完成任务后给予鼓励

日常习惯培养：
- 固定作息时间
- 一次只做一件事
- 控制电子屏幕时间（<1小时/天）`,
      tags: '专注,注意力,训练',
      age_range: '3-6岁',
      source: '儿童发展心理学',
      evidence_level: 'A'
    },
    {
      category: 'assessment',
      sub_category: 'assessment_interpretation',
      title: '感统评估报告解读',
      content: `感统评估报告解读指南：

评估维度：
1. 前庭觉：平衡感、空间定向、运动协调
2. 本体觉：身体意识、姿势控制、动作计划
3. 触觉：触觉敏感、触觉防御
4. 视觉：视觉追踪、视觉辨别
5. 听觉：听觉注意、听觉记忆

分数解读：
- 标准分<40：需要专业干预
- 40-55：需要关注，加强家庭训练
- >55：发展良好，继续保持

常见误区：
1. 不要过度解读单一维度
2. 结合孩子实际情况综合判断
3. 评估结果只是参考，不是诊断
4. 建议定期复测，观察发展趋势`,
      tags: '评估,感统,解读',
      age_range: '3-6岁',
      source: '儿童康复评估标准',
      evidence_level: 'B'
    },
    {
      category: 'assessment',
      sub_category: 'assessment_interpretation',
      title: '专注力评估报告解读',
      content: `专注力评估报告解读指南：

评估维度：
1. 注意力集中：持续专注能力
2. 注意力分配：多任务处理能力
3. 注意力转移：任务切换能力
4. 注意力维持：长时间专注能力
5. 选择性注意：排除干扰能力

分数解读：
- 标准分<40：注意力明显不足，建议专业评估
- 40-55：注意力中等，需要关注和支持
- >55：注意力良好

影响因素：
1. 年龄：不同年龄段标准不同
2. 兴趣：兴趣影响专注力表现
3. 环境：环境干扰影响评估结果
4. 情绪：情绪状态影响专注力

家庭训练建议：
1. 建立规律的作息时间
2. 减少环境中的干扰因素
3. 使用游戏化方式训练专注力
4. 给予正向反馈和鼓励`,
      tags: '评估,专注,解读',
      age_range: '3-6岁',
      source: '儿童发展评估标准',
      evidence_level: 'B'
    }
  ];

  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_base (category, sub_category, title, content, tags, age_range, source, evidence_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of knowledgeItems) {
    insertKnowledge.run(
      item.category, item.sub_category, item.title, item.content,
      item.tags, item.age_range, item.source, item.evidence_level
    );
  }

  }

  // 加载外部补充数据文件
  loadExternalSeedData();

  // 插入默认套餐数据
  const existingPlans = db.prepare('SELECT COUNT(*) as count FROM plans').get();
  if (existingPlans.count === 0) {
    db.exec(`
      INSERT INTO plans (code, name, duration_days, price_yuan, original_price, description, sort_order) VALUES
      ('trial', '免费试用', 15, 0, 0, '新用户15天全功能试用', 0),
      ('month', '月卡', 30, 1990, 2990, '每天不到1元，畅享会员权益', 1),
      ('quarter', '季卡', 90, 4990, 6990, '省30%，更划算', 2),
      ('year', '年卡', 365, 9900, 11990, '省60%，最超值', 3)
    `);
    console.log('[Database] 默认套餐数据已插入');
  }

  // 插入老用户兑换码批次
  const existingBatches = db.prepare('SELECT COUNT(*) as count FROM promo_batches').get();
  if (existingBatches.count === 0) {
    db.exec(`
      INSERT INTO promo_batches (batch_code, description, duration_days, total_count, valid_from, valid_to)
      VALUES ('LEGACY_2025', '老用户免费3个月', 90, 999999, '2025-01-01', '2025-12-31')
    `);
    console.log('[Database] 默认兑换码批次已插入');
  }

  console.log('[Database] 种子数据填充完成');
}

// 加载外部补充评估数据
function loadExternalSeedData() {
  try {
    const dataDir = path.join(__dirname, '../data');
    
    // 评估解读数据文件
    const interpretationFiles = [
      'assessment-seed-interpretations.js',
      'assessment-seed-interpretations-focus.js',
      'assessment-seed-interpretations-adhd.js',
      'assessment-seed-interpretations-emotion.js',
      'assessment-seed-interpretations-multi.js',
      'assessment-seed-interpretations-learning.js'
    ];
    
    const insertInterpretation = db.prepare(`
      INSERT INTO assessment_interpretations 
      (assessment_code, dimension_name, score_min, score_max, level, interpretation, behavior_description, scene_advice, expected_goal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const file of interpretationFiles) {
      const filePath = path.join(dataDir, file);
      if (fs.existsSync(filePath)) {
        const data = require(filePath);
        if (data.interpretations && data.interpretations.length > 0) {
          for (const item of data.interpretations) {
            try {
              insertInterpretation.run(
                item.assessment_code, item.dimension_name, item.score_min, item.score_max,
                item.level, item.interpretation, item.behavior_description, item.scene_advice, item.expected_goal
              );
            } catch (e) {
              // 可能是重复数据，忽略
            }
          }
          console.log(`[Database] 已加载 ${file} 的 ${data.interpretations.length} 条解读数据`);
        }
      }
    }
    
    // 评估建议数据文件
    const suggestionFile = path.join(dataDir, 'assessment-seed-suggestions.js');
    if (fs.existsSync(suggestionFile)) {
      const suggestionData = require(suggestionFile);
      if (suggestionData.suggestions && suggestionData.suggestions.length > 0) {
        const insertSuggestion = db.prepare(`
          INSERT INTO assessment_suggestions 
          (assessment_code, dimension_name, level, title, description, steps, duration, frequency)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const item of suggestionData.suggestions) {
          try {
            insertSuggestion.run(
              item.assessment_code, item.dimension_name, item.level, item.title,
              item.description, item.steps, item.duration, item.frequency
            );
          } catch (e) {
            // 可能是重复数据，忽略
          }
        }
        console.log(`[Database] 已加载 assessment-seed-suggestions.js 的 ${suggestionData.suggestions.length} 条建议数据`);
      }
    }
    
    console.log('[Database] 外部补充数据加载完成');
  } catch (err) {
    console.error('[Database] 加载外部补充数据失败:', err.message);
  }
}

module.exports = {
  db,
  initDatabase,
  seedData
};

// 进程退出时关闭数据库连接
process.on('SIGINT', () => {
  console.log('[Database] 关闭数据库连接');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[Database] 关闭数据库连接');
  db.close();
  process.exit(0);
});
