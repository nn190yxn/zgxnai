const assert = require('assert');
const fs = require('fs');
const path = require('path');

const miniprogramZones = require('../miniprogram/utils/development-zones.js');
const backendZones = require('../backend/src/mysql-production/development-zones.js');

const PROFESSIONAL_AUDIT_RULES = [
  {
    name: 'diagnosis_terms',
    pattern: /感统失调|发育迟缓|多动症|自闭|孤独症|障碍|异常|缺陷|诊断|治疗|矫正|康复|症状/
  },
  {
    name: 'negative_labels',
    pattern: /胆量专区|胆小鬼|输不起|笨|懒|不乖|不正常|坏习惯|磨人|问题孩子/
  },
  {
    name: 'absolute_promises',
    pattern: /一定会|保证|立刻见效|彻底|根治|治好|永久|永远不会/
  },
  {
    name: 'unsafe_parenting_actions',
    pattern: /惩罚|打骂|吓唬|威胁|冷处理|关起来|强迫|硬拉|按住|禁止哭|不许哭/
  },
  {
    name: 'medical_or_ai_framing',
    pattern: /AI|人工智能|测评报告|医学建议|临床|处方|药物|医生判断/
  }
];

const REQUIRED_FIELDS = [
  'title',
  'symptomText',
  'parentCheck',
  'todayAction',
  'parentScript',
  'observeSignal',
  'chatQuestion',
  'developmentalFocus',
  'safetyBoundary'
];

const EXPECTED_AGE_GROUPS = ['3-4岁', '4-5岁', '5-6岁'];

function flattenText(value, prefix, output) {
  if (typeof value === 'string') {
    output.push({ path: prefix, text: value });
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach(function(item, index) {
      flattenText(item, prefix + '[' + index + ']', output);
    });
    return output;
  }
  if (value && typeof value === 'object') {
    Object.keys(value).forEach(function(key) {
      flattenText(value[key], prefix ? prefix + '.' + key : key, output);
    });
  }
  return output;
}

function assertNoRiskTerms(label, payload) {
  const texts = flattenText(payload, label, []);
  PROFESSIONAL_AUDIT_RULES.forEach(function(rule) {
    const hit = texts.find(function(item) {
      return rule.pattern.test(item.text);
    });
    assert.strictEqual(hit, undefined, rule.name + ' hit at ' + (hit && hit.path) + ': ' + (hit && hit.text));
  });
}

function assertScenarioProfessional(zone, scenario) {
  REQUIRED_FIELDS.forEach(function(field) {
    assert.ok(String(scenario[field] || '').trim(), zone.code + '.' + scenario.code + ' missing ' + field);
  });
  assert.ok(scenario.durationMinutes >= 3, zone.code + '.' + scenario.code + ' duration too short');
  assert.ok(scenario.durationMinutes <= 15, zone.code + '.' + scenario.code + ' duration too long');
  assert.ok(/先|只|用|让|做|设|玩|问|说|练|画|离开|出门|在家|距离|沿|选|把/.test(scenario.todayAction), zone.code + '.' + scenario.code + ' action should be concrete');
  assert.ok(/看孩子|记录/.test(scenario.observeSignal), zone.code + '.' + scenario.code + ' observeSignal should be observable');
  assert.ok(/孩子/.test(scenario.chatQuestion), zone.code + '.' + scenario.code + ' chatQuestion should include child context');
  assert.ok(/。|？/.test(scenario.parentScript), zone.code + '.' + scenario.code + ' parentScript should be a natural sentence');
  assert.ok(scenario.developmentalFocus.length >= 24, zone.code + '.' + scenario.code + ' developmentalFocus should explain the reason');
  assert.ok(Array.isArray(scenario.ageGuidance), zone.code + '.' + scenario.code + ' ageGuidance missing');
  assert.deepStrictEqual(scenario.ageGuidance.map(function(item) { return item.ageGroup; }), EXPECTED_AGE_GROUPS, zone.code + '.' + scenario.code + ' ageGuidance should cover all three age groups');
  scenario.ageGuidance.forEach(function(item) {
    assert.ok(item.guidance.length >= 20, zone.code + '.' + scenario.code + ' age guidance too thin: ' + item.ageGroup);
  });
  assert.ok(Array.isArray(scenario.difficultySteps), zone.code + '.' + scenario.code + ' difficultySteps missing');
  assert.strictEqual(scenario.difficultySteps.length, 3, zone.code + '.' + scenario.code + ' difficultySteps should have three levels');
  assert.ok(/降低难度/.test(scenario.difficultySteps[0]), zone.code + '.' + scenario.code + ' difficultySteps should include fallback');
  assert.ok(/进阶/.test(scenario.difficultySteps[2]), zone.code + '.' + scenario.code + ' difficultySteps should include stretch');
  assert.ok(scenario.playGame, zone.code + '.' + scenario.code + ' playGame missing');
  assert.ok(scenario.playGame.name.length >= 4, zone.code + '.' + scenario.code + ' playGame name too thin');
  assert.ok(/准备/.test(scenario.playGame.setup) || /空间|材料/.test(scenario.playGame.setup), zone.code + '.' + scenario.code + ' playGame setup should be usable');
  assert.ok(/游戏|动作|练习|任务|今天/.test(scenario.playGame.howToPlay), zone.code + '.' + scenario.code + ' playGame howToPlay should be concrete');
  assert.ok(/家长|孩子|先/.test(scenario.playGame.parentTip), zone.code + '.' + scenario.code + ' playGame parentTip should guide parent');
  assert.ok(/熟练后|增加|换/.test(scenario.playGame.variation), zone.code + '.' + scenario.code + ' playGame variation should include progression');
  assert.ok(Array.isArray(scenario.progressSignals), zone.code + '.' + scenario.code + ' progressSignals missing');
  assert.ok(scenario.progressSignals.length >= 3, zone.code + '.' + scenario.code + ' progressSignals should include tracking signals');
  assert.ok(Array.isArray(scenario.commonPitfalls), zone.code + '.' + scenario.code + ' commonPitfalls missing');
  assert.ok(scenario.commonPitfalls.length >= 2, zone.code + '.' + scenario.code + ' commonPitfalls should include parent mistakes');
  assert.ok(scenario.safetyBoundary.length >= 20, zone.code + '.' + scenario.code + ' safetyBoundary too thin');
}

function assertZoneProfessional(zone) {
  assert.ok(zone.subtitle.length <= 32, zone.code + ' subtitle too long');
  assert.ok(zone.actionText.length <= 18, zone.code + ' actionText too long');
  assert.ok(zone.scenarios.length >= 32, zone.code + ' should have at least thirty two scenarios');
  assert.strictEqual(zone.sevenDayPlan.length, 7, zone.code + ' should have seven day plan');
  assert.ok(zone.todayPractice.durationMinutes >= 3, zone.code + ' practice duration too short');
  assert.ok(zone.todayPractice.durationMinutes <= 15, zone.code + ' practice duration too long');
  zone.scenarios.forEach(function(scenario) {
    assertScenarioProfessional(zone, scenario);
  });
}

function assertAgeDifferentiation(zones, label) {
  const ageCounts = EXPECTED_AGE_GROUPS.map(function(ageGroup) {
    return zones.reduce(function(total, zone) {
      return total + zone.scenarios.filter(function(scenario) {
        return scenario.ageGroups.indexOf(ageGroup) >= 0;
      }).length;
    }, 0);
  });
  ageCounts.forEach(function(count, index) {
    assert.ok(count >= 144, label + ' should have enough scenarios for ' + EXPECTED_AGE_GROUPS[index]);
  });
  const differentiatedCount = zones.reduce(function(total, zone) {
    return total + zone.scenarios.filter(function(scenario) {
      return JSON.stringify(scenario.ageGroups) !== JSON.stringify(EXPECTED_AGE_GROUPS);
    }).length;
  }, 0);
  assert.ok(differentiatedCount >= 128, label + ' should include age-specific scenarios');
}

function testProfessionalCopyAudit() {
  const zones = miniprogramZones.getDevelopmentZones();
  zones.forEach(assertZoneProfessional);
  assertAgeDifferentiation(zones, 'miniprogramZones');
  assertNoRiskTerms('miniprogramZones', zones);
}

function testBackendCopyAudit() {
  const data = backendZones.loadDevelopmentZonesData();
  data.zones.forEach(assertZoneProfessional);
  assertAgeDifferentiation(data.zones, 'backendZones');
  assertNoRiskTerms('backendZones', data);
}

function testSeedAndRuntimeCopyMatch() {
  const seed = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../backend/examples/development-zones-3-6.json'), 'utf8'));
  const runtime = backendZones.loadDevelopmentZonesData();
  assert.deepStrictEqual(seed, runtime);
  assert.deepStrictEqual(miniprogramZones.getDevelopmentZones().map(function(zone) {
    return {
      code: zone.code,
      title: zone.title,
      subtitle: zone.subtitle,
      sevenDayPlan: zone.sevenDayPlan
    };
  }), runtime.zones.map(function(zone) {
    return {
      code: zone.code,
      title: zone.title,
      subtitle: zone.subtitle,
      sevenDayPlan: zone.sevenDayPlan
    };
  }));
}

testProfessionalCopyAudit();
testBackendCopyAudit();
testSeedAndRuntimeCopyMatch();

console.log('Development zones professionalism audit passed.');
