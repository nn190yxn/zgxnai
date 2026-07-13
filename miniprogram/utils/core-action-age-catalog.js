var AGE_FIRST_CATEGORY_DEFINITIONS = [
  {
    key: 'attention_learning',
    label: '专注学习',
    description: '学习启动、课堂注意、阅读和任务完成相关情况。',
    sceneKeyPrefix: 'age_attention',
    abilityTags: ['专注力', '学习启动', '任务意识'],
    observableSigns: ['启动慢', '容易分心', '需要反复提醒'],
    templates: [
      { key: 'start_delay', title: '开始前磨很久', desc: '知道要做，但迟迟进入不了状态。', signs: ['反复找借口', '坐下还发呆', '要大人催很多次'], tags: ['学习启动', '执行力'] },
      { key: 'attention_short', title: '专注时间很短', desc: '刚开始还行，很快就离开任务。', signs: ['几分钟就换事', '做到一半跑开', '小动作变多'], tags: ['专注力', '持续注意'] },
      { key: 'instruction_forget', title: '听完就忘要做什么', desc: '听到要求后很快忘记步骤。', signs: ['问完又问', '做错顺序', '漏掉关键动作'], tags: ['听觉注意', '工作记忆'] },
      { key: 'task_half_done', title: '任务总是半途停下', desc: '能开始，但很难把一件事收尾。', signs: ['做到一半停', '转去玩别的', '最后一步要催'], tags: ['任务意识', '完成闭环'] },
      { key: 'reading_drift', title: '阅读时眼神飘走', desc: '看书或听故事时注意力容易断。', signs: ['看窗外', '跳行漏字', '复述困难'], tags: ['阅读注意', '视觉追踪'] },
      { key: 'homework_slow', title: '会做但做得很慢', desc: '题目会做，但速度拖得很长。', signs: ['一题写很久', '边写边停', '越写越慢'], tags: ['学习效率', '动作计划'] },
      { key: 'multi_step_hard', title: '多步骤任务容易乱', desc: '两个以上步骤就不知道先后。', signs: ['顺序混乱', '漏步骤', '要大人分解'], tags: ['计划能力', '执行顺序'] },
      { key: 'review_resist', title: '复习练习很抗拒', desc: '一提复习或重复练习就烦。', signs: ['说太烦了', '不愿再做', '只想跳过'], tags: ['学习耐心', '情绪调节'] },
      { key: 'mistake_panic', title: '一错就慌', desc: '做错后马上急，影响继续尝试。', signs: ['说我不会', '擦很多次', '不肯再试'], tags: ['挫折承受', '学习自信'] },
      { key: 'finish_check_weak', title: '做完不会检查', desc: '完成后马上走，不会回看结果。', signs: ['漏题没发现', '写完就跑', '不愿回看'], tags: ['自我检查', '学习习惯'] }
    ]
  },
  {
    key: 'emotion_rules',
    label: '情绪规则',
    description: '情绪调节、等待轮流、规则理解和环境适应相关情况。',
    sceneKeyPrefix: 'age_emotion',
    abilityTags: ['情绪调节', '规则理解', '等待轮流'],
    observableSigns: ['容易急', '不愿等', '规则一变就崩'],
    templates: [
      { key: 'small_frustration_big', title: '小事不顺就爆发', desc: '很小的变化也会引起哭闹或发脾气。', signs: ['哭闹来得快', '安抚时间长', '反复纠结'], tags: ['情绪调节', '挫折承受'] },
      { key: 'wait_hard', title: '等一会儿都很难', desc: '排队、轮流或等待时很快着急。', signs: ['插队', '催别人', '抢先开始'], tags: ['等待轮流', '冲动控制'] },
      { key: 'rule_change_hard', title: '规则一变就不接受', desc: '规则调整或计划变化时反应很大。', signs: ['坚持原计划', '不听解释', '马上生气'], tags: ['规则弹性', '情绪调节'] },
      { key: 'lose_reaction_big', title: '输了就不玩', desc: '游戏或比赛结果不如意就退出。', signs: ['输了哭', '改规则', '拒绝继续'], tags: ['挫折承受', '规则理解'] },
      { key: 'transition_hard', title: '活动切换很困难', desc: '从玩到吃饭、洗澡或学习时阻力大。', signs: ['拖延切换', '讨价还价', '情绪变大'], tags: ['转换能力', '自我管理'] },
      { key: 'boundary_push', title: '反复试探边界', desc: '已经说过的规则还会反复挑战。', signs: ['明知还做', '看大人反应', '越提醒越做'], tags: ['规则理解', '边界感'] },
      { key: 'new_place_tense', title: '新环境放不开', desc: '面对新地方或新老师时明显紧张。', signs: ['躲在大人身后', '不愿开口', '不愿参与'], tags: ['环境适应', '安全感'] },
      { key: 'criticism_sensitive', title: '一被提醒就委屈', desc: '普通提醒也容易理解成批评。', signs: ['低头不说话', '马上哭', '说你不喜欢我'], tags: ['情绪安全', '自尊感'] },
      { key: 'morning_evening_chaos', title: '早晚流程总混乱', desc: '起床、睡前或出门流程经常拖乱。', signs: ['反复催促', '漏掉步骤', '时间越拖越急'], tags: ['生活规则', '流程意识'] },
      { key: 'calm_down_slow', title: '情绪下来很慢', desc: '哭闹后很久才能恢复正常互动。', signs: ['反复哭', '不接受安抚', '恢复后还提旧事'], tags: ['情绪恢复', '安全感'] }
    ]
  },
  {
    key: 'motor_fitness',
    label: '运动体能',
    description: '大运动、协调、体能、体态和专项运动基础相关情况。',
    sceneKeyPrefix: 'age_motor',
    abilityTags: ['身体控制', '协调体能', '动作计划'],
    observableSigns: ['动作不稳', '容易累', '协调跟不上'],
    templates: [
      { key: 'balance_unstable', title: '身体平衡不稳', desc: '走跑跳或站立动作容易晃。', signs: ['容易摔', '单脚站困难', '转身不稳'], tags: ['平衡能力', '前庭觉'] },
      { key: 'coordination_slow', title: '动作配合慢半拍', desc: '手脚配合、节奏和方向容易乱。', signs: ['接球漏', '节奏跟不上', '左右分不清'], tags: ['协调能力', '动作计划'] },
      { key: 'jump_weak', title: '跳跃力量弱', desc: '跳起、落地或连续跳都吃力。', signs: ['跳不高', '落地重', '连续跳断'], tags: ['下肢力量', '爆发力'] },
      { key: 'run_tired_fast', title: '跑一会儿就累', desc: '跑步、追逐或活动持续时间短。', signs: ['喘得快', '很快停下', '不愿跑'], tags: ['基础耐力', '心肺基础'] },
      { key: 'core_slump', title: '坐姿站姿容易塌', desc: '坐着写画或运动时身体撑不住。', signs: ['趴桌子', '含胸', '身体晃'], tags: ['核心稳定', '体态控制'] },
      { key: 'rope_ball_hard', title: '跳绳球类学得慢', desc: '跳绳、拍球、接球等项目推进慢。', signs: ['绳子常断', '拍球不连续', '接球害怕'], tags: ['节奏感', '手眼协调'] },
      { key: 'fine_motor_tired', title: '手部小动作容易累', desc: '画画、剪纸、写字或拼搭时手很快累。', signs: ['握笔紧', '手酸', '不愿精细操作'], tags: ['精细动作', '手部力量'] },
      { key: 'body_boundary_weak', title: '身体边界感弱', desc: '靠近别人或使用力量时掌握不好距离。', signs: ['撞到别人', '力气过大', '排队贴太近'], tags: ['身体边界', '本体觉'] },
      { key: 'movement_avoid', title: '不太愿意运动', desc: '看到运动任务就躲，缺少主动尝试。', signs: ['说太累', '站旁边看', '只选静态活动'], tags: ['运动信心', '身体经验'] },
      { key: 'recovery_slow', title: '运动后恢复慢', desc: '活动后情绪或身体状态很久缓不过来。', signs: ['大汗后烦躁', '休息很久', '不愿继续'], tags: ['体能恢复', '自我感知'] }
    ]
  },
  {
    key: 'social_expression',
    label: '社交表达',
    description: '语言表达、同伴互动、集体参与和亲子沟通相关情况。',
    sceneKeyPrefix: 'age_social',
    abilityTags: ['语言表达', '社交能力', '亲子互动'],
    observableSigns: ['说不清', '不敢加入', '容易冲突'],
    templates: [
      { key: 'need_words_hard', title: '想要什么说不清', desc: '有需求时常靠哭、拉人或发脾气表达。', signs: ['用手指', '拉大人', '着急就哭'], tags: ['需求表达', '语言组织'] },
      { key: 'story_unclear', title: '讲不清发生了什么', desc: '经历过的事很难按顺序说出来。', signs: ['说半句', '前后乱', '要大人猜'], tags: ['叙事表达', '事件顺序'] },
      { key: 'peer_join_hard', title: '不知道怎么加入同伴', desc: '想一起玩，但不知道开口或进入游戏。', signs: ['站旁边看', '跟着跑但不说', '需要老师带'], tags: ['社交加入', '安全感'] },
      { key: 'conflict_words_less', title: '冲突时不会好好说', desc: '被抢、想拒绝或想加入时容易急。', signs: ['直接抢', '推人', '告状后说不清'], tags: ['冲突表达', '情绪调节'] },
      { key: 'turn_talk_less', title: '轮到自己说就卡住', desc: '集体或课堂表达时明显退缩。', signs: ['低头', '声音很小', '说不知道'], tags: ['表达信心', '集体适应'] },
      { key: 'adult_instruction_reply', title: '大人问话不回应', desc: '被问问题时经常沉默或只点头。', signs: ['不回答', '只点头', '转移话题'], tags: ['回应能力', '听说配合'] },
      { key: 'emotion_words_less', title: '不会说自己的感受', desc: '难受、生气、害怕时说不出感受词。', signs: ['只哭不说', '说不出来', '用行为表达'], tags: ['情绪表达', '自我觉察'] },
      { key: 'cooperation_hard', title: '合作游戏配合难', desc: '需要分工或一起完成时容易乱。', signs: ['只按自己想法', '不听同伴', '合作很快散'], tags: ['合作能力', '规则理解'] },
      { key: 'family_talk_short', title: '亲子聊天很短', desc: '家里聊天经常问一句答一句。', signs: ['只说嗯', '不展开', '很快结束'], tags: ['亲子沟通', '表达兴趣'] },
      { key: 'new_person_shy', title: '见新朋友很慢热', desc: '面对陌生同伴或老师时不敢说话。', signs: ['躲起来', '不看对方', '要大人代说'], tags: ['社交安全感', '表达信心'] }
    ]
  }
];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function inferAgeFirstCategoryKey(painPoint) {
  var text = JSON.stringify(painPoint || {});
  if (/大运动|运动|体|协调|跳|跑|核心|耐力|爆发|体态|前庭|本体|精细动作/.test(text)) {
    return 'motor_fitness';
  }
  if (/社交|表达|语言|同伴|集体|模仿|开口|说/.test(text)) {
    return 'social_expression';
  }
  if (/情绪|规则|安全感|适应|等待|轮流|冲动|挫折|分离|边界/.test(text)) {
    return 'emotion_rules';
  }
  return 'attention_learning';
}

function findAgeFirstCategory(categoryKey) {
  var key = String(categoryKey || '').trim();
  return AGE_FIRST_CATEGORY_DEFINITIONS.find(function(item) {
    return item.key === key;
  }) || AGE_FIRST_CATEGORY_DEFINITIONS[0];
}

function normalizeAgePainPoint(segment, category, painPoint, index) {
  var normalized = Object.assign({}, painPoint || {});
  var order = Number(index) || 0;
  var pointKey = String(normalized.key || [segment.key, category.key, 'pain', order + 1].join('_')).trim();
  var sceneKey = String(normalized.sceneKey || [category.sceneKeyPrefix, segment.key, pointKey].join('_')).trim();
  var observableSigns = normalized.observableSigns || category.observableSigns || [];
  var abilityTags = normalized.abilityTags || category.abilityTags || [];

  return Object.assign({}, normalized, {
    key: pointKey,
    categoryKey: category.key,
    categoryLabel: category.label,
    sceneKey: sceneKey,
    priority: Number(normalized.priority) || order + 1,
    sourceType: normalized.sourceType || 'curated',
    observableSigns: clone(observableSigns),
    abilityTags: clone(abilityTags).slice(0, 4),
    symptoms: clone(normalized.symptoms || []),
    defaultBottleneck: Object.assign({
      title: '先看' + category.label + '里的最小卡点',
      text: (segment.label || '') + '出现“' + (normalized.title || category.label) + '”时，先缩小到一个可完成动作。'
    }, normalized.defaultBottleneck || {}),
    defaultAction: Object.assign({
      title: '今晚先做一个 3 分钟小练习',
      steps: ['只选一个最小动作开始。', '控制在 3 分钟以内。', '结束后记录孩子最明显的一个反应。']
    }, normalized.defaultAction || {})
  });
}

function normalizeAgePainCategory(segment, category, painPoints) {
  var normalizedPainPoints = (painPoints || []).map(function(painPoint, index) {
    return Object.assign({}, normalizeAgePainPoint(segment, category, painPoint, index), {
      priority: index + 1
    });
  });
  if (normalizedPainPoints.length !== 10) {
    throw new Error(segment.key + '/' + category.key + ' must contain exactly 10 pain points');
  }
  return {
    key: category.key,
    label: category.label,
    description: category.description,
    painPoints: normalizedPainPoints
  };
}

function buildGeneratedAgePainPoint(segment, category, template, index) {
  var label = segment.label || '';
  return {
    key: [segment.key, category.key, template.key].join('_'),
    categoryKey: category.key,
    categoryLabel: category.label,
    title: template.title,
    description: label + '常见情况：' + template.desc,
    observableSigns: clone(template.signs || category.observableSigns),
    abilityTags: clone((template.tags || []).concat(category.abilityTags)).slice(0, 4),
    sceneKey: [category.sceneKeyPrefix, segment.key, template.key].join('_'),
    symptoms: [],
    priority: index + 1,
    sourceType: 'generated',
    defaultBottleneck: {
      title: '先看' + category.label + '里的最小卡点',
      text: label + '出现“' + template.title + '”时，先把要求缩小到一个可完成动作，再观察孩子能不能进入状态。'
    },
    defaultAction: {
      title: '今晚先做一个 3 分钟小练习',
      steps: ['只选一个最小动作开始。', '控制在 3 分钟以内。', '结束后记录孩子最明显的一个反应。']
    }
  };
}

function buildAgeFirstSegmentCatalog(segments) {
  return (segments || []).map(function(segment) {
    var legacyPainPoints = (segment.painPoints || []).map(function(painPoint, index) {
      var categoryKey = painPoint.categoryKey || inferAgeFirstCategoryKey(painPoint);
      return normalizeAgePainPoint(segment, findAgeFirstCategory(categoryKey), painPoint, index);
    });
    var categories = AGE_FIRST_CATEGORY_DEFINITIONS.map(function(category) {
      var existing = legacyPainPoints.filter(function(painPoint) {
        return painPoint.categoryKey === category.key;
      });
      var existingKeys = existing.reduce(function(map, painPoint) {
        map[painPoint.key] = true;
        return map;
      }, {});
      var generated = category.templates.map(function(template, index) {
        return buildGeneratedAgePainPoint(segment, category, template, index);
      }).filter(function(painPoint) {
        return !existingKeys[painPoint.key];
      });
      var painPoints = existing.concat(generated).slice(0, 10);
      return normalizeAgePainCategory(segment, category, painPoints);
    });
    var flattened = [];
    categories.forEach(function(category) {
      flattened = flattened.concat(category.painPoints || []);
    });
    var flattenedKeys = flattened.reduce(function(map, painPoint) {
      map[painPoint.key] = true;
      return map;
    }, {});
    var featuredKeys = legacyPainPoints.map(function(painPoint) {
      return painPoint.key;
    }).filter(function(key) {
      return flattenedKeys[key];
    }).slice(0, 5);

    if (featuredKeys.length < 5) {
      flattened.some(function(painPoint) {
        if (featuredKeys.indexOf(painPoint.key) === -1) {
          featuredKeys.push(painPoint.key);
        }
        return featuredKeys.length >= 5;
      });
    }
    return Object.assign({}, segment, {
      painCategories: categories,
      painPoints: flattened,
      featuredPainPointKeys: featuredKeys
    });
  });
}

module.exports = {
  AGE_FIRST_CATEGORY_DEFINITIONS: AGE_FIRST_CATEGORY_DEFINITIONS,
  buildAgeFirstSegmentCatalog: buildAgeFirstSegmentCatalog,
  inferAgeFirstCategoryKey: inferAgeFirstCategoryKey,
  normalizeAgePainCategory: normalizeAgePainCategory,
  normalizeAgePainPoint: normalizeAgePainPoint
};
