const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function listFiles(directory, extension) {
  return fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true }).flatMap(function(entry) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listFiles(relativePath, extension);
    }
    return entry.isFile() && relativePath.endsWith(extension) ? [relativePath] : [];
  });
}

function getRules(source, selector) {
  const rules = [];
  const cleanSource = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match = pattern.exec(cleanSource);
  while (match) {
    const selectors = match[1].split(',').map(function(item) { return item.trim(); });
    if (selectors.indexOf(selector) >= 0) {
      rules.push(match[2]);
    }
    match = pattern.exec(cleanSource);
  }
  assert.ok(rules.length > 0, selector + ' rule missing');
  return rules;
}

function assertRuleHas(source, selector, property, expected) {
  const pattern = new RegExp(property + '\\s*:\\s*' + expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*;');
  assert.ok(getRules(source, selector).some(function(rule) { return pattern.test(rule); }), selector + ' should include ' + property + ': ' + expected);
}

function assertRuleHasNumberAtLeast(source, selector, property, minValue) {
  const pattern = new RegExp(property + '\\s*:\\s*([0-9.]+)');
  const match = getRules(source, selector).map(function(rule) {
    return rule.match(pattern);
  }).find(function(item) { return !!item; });
  assert.ok(match, selector + ' should include ' + property);
  assert.ok(Number(match[1]) >= minValue, selector + ' ' + property + ' should be at least ' + minValue);
}

function assertTypographyRules(relativePath, checks) {
  const source = read(relativePath);
  checks.forEach(function(check) {
    assertRuleHasNumberAtLeast(source, check.selector, 'line-height', check.minLineHeight);
  });
}

function testNoRegressedLineHeight() {
  const allowedTightLineHeights = [
    'miniprogram/pages/membership/index.wxss:.price-current',
    'miniprogram/pages/membership/index.wxss:.stat-value',
    'miniprogram/pages/parenting/milestone-result/milestone-result.wxss:.score-value',
    'miniprogram/pages/textbook/textbook.wxss:.progress-num'
  ];

  listFiles('miniprogram', '.wxss').forEach(function(relativePath) {
    const source = read(relativePath).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(!/line-height\s*:\s*normal\s*;/.test(source), relativePath + ' should not use line-height: normal');
    assert.ok(!/line-height\s*:\s*1\.4\s*;/.test(source), relativePath + ' should use at least 1.45 for compact text');
    assert.ok(!/-webkit-line-clamp\s*:\s*1\s*;/.test(source), relativePath + ' should not clamp readable text to one line');

    const pattern = /([^{}]+)\{([^{}]*)\}/g;
    let match = pattern.exec(source);
    while (match) {
      const selectors = match[1].split(',').map(function(item) { return item.trim(); });
      const hasTightLineHeight = /line-height\s*:\s*1\.(2|3)\s*;/.test(match[2]);
      if (hasTightLineHeight) {
        const isAllowed = selectors.some(function(selector) {
          return allowedTightLineHeights.indexOf(relativePath + ':' + selector) >= 0;
        });
        assert.ok(isAllowed, relativePath + ' tight line-height should only be used for numeric counters: ' + selectors.join(', '));
      }
      match = pattern.exec(source);
    }
  });
}

function testNoRegressedNoWrapText() {
  const allowedNoWrap = [
    'miniprogram/pages/assessment/assessment.wxss:.age-scroll',
    'miniprogram/pages/nutrition/nutrition.wxss:.age-switch-scroll',
    'miniprogram/pages/nutrition/nutrition.wxss:.category-scroll',
    'miniprogram/pages/nutrition/recipe-list/recipe-list.wxss:.filter-scroll',
    'miniprogram/pages/parenting/article-list/article-list.wxss:.filter-scroll',
    'miniprogram/pages/textbook/knowledge-detail/knowledge-detail.wxss:.coach-toolkit-duration',
    'miniprogram/pages/textbook/knowledge-detail/knowledge-detail.wxss:.step-checklist-progress',
    'miniprogram/pages/textbook/textbook.wxss:.progress-rate'
  ];

  listFiles('miniprogram', '.wxss').forEach(function(relativePath) {
    const source = read(relativePath).replace(/\/\*[\s\S]*?\*\//g, '');
    const pattern = /([^{}]+)\{([^{}]*)\}/g;
    let match = pattern.exec(source);
    while (match) {
      const selectors = match[1].split(',').map(function(item) { return item.trim(); });
      const hasNoWrap = /white-space\s*:\s*nowrap\s*;/.test(match[2]);
      if (hasNoWrap) {
        const isAllowed = selectors.some(function(selector) {
          return allowedNoWrap.indexOf(relativePath + ':' + selector) >= 0;
        });
        assert.ok(isAllowed, relativePath + ' nowrap should only be used for horizontal filters or compact badges: ' + selectors.join(', '));
      }
      match = pattern.exec(source);
    }
  });
}

function testGlobalTypographyBaseline() {
  const source = read('miniprogram/app.wxss');
  assertRuleHasNumberAtLeast(source, 'page', 'line-height', 1.6);
  assertRuleHas(source, 'text', 'line-height', 'inherit');
  assertRuleHas(source, 'text', 'letter-spacing', '0');
  assertRuleHas(source, 'text', 'overflow-wrap', 'break-word');
  assertRuleHasNumberAtLeast(source, '.btn', 'line-height', 1.45);
  assertRuleHasNumberAtLeast(source, '.title', 'line-height', 1.45);
  assertRuleHasNumberAtLeast(source, '.subtitle', 'line-height', 1.65);
  assertRuleHasNumberAtLeast(source, '.tag', 'line-height', 1.45);
}

function testPageTypography() {
  assertTypographyRules('miniprogram/pages/index/index.wxss', [
    { selector: '.hero-title', minLineHeight: 1.42 },
    { selector: '.hero-btn', minLineHeight: 1.45 },
    { selector: '.module-name', minLineHeight: 1.45 },
    { selector: '.module-desc', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/chat/chat.wxss', [
    { selector: '.bubble', minLineHeight: 1.75 },
    { selector: '.bubble text', minLineHeight: 1.8 },
    { selector: '.input', minLineHeight: 1.6 },
    { selector: '.followup-btn', minLineHeight: 1.5 },
    { selector: '.judgment-text', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/assessment/do/do.wxss', [
    { selector: '.question-text', minLineHeight: 1.6 },
    { selector: '.question-desc', minLineHeight: 1.65 },
    { selector: '.option-text', minLineHeight: 1.6 },
    { selector: '.option-desc', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/article-detail/article-detail.wxss', [
    { selector: '.article-title', minLineHeight: 1.45 },
    { selector: '.content-paragraph', minLineHeight: 1.9 },
    { selector: '.content-heading', minLineHeight: 1.45 },
    { selector: '.tip-title', minLineHeight: 1.55 },
    { selector: '.list-text', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/textbook/knowledge-detail/knowledge-detail.wxss', [
    { selector: '.point-title', minLineHeight: 1.45 },
    { selector: '.detail-visual-desc', minLineHeight: 1.65 },
    { selector: '.explain-text', minLineHeight: 1.8 },
    { selector: '.key-text', minLineHeight: 1.7 },
    { selector: '.question-text', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/growth-record/index.wxss', [
    { selector: '.section-title', minLineHeight: 1.45 },
    { selector: '.helper-copy', minLineHeight: 1.7 },
    { selector: '.primary-btn', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/weekly-summary/index.wxss', [
    { selector: '.section-title', minLineHeight: 1.45 },
    { selector: '.content-summary', minLineHeight: 1.7 },
    { selector: '.practice-item', minLineHeight: 1.65 }
  ]);
  assertTypographyRules('miniprogram/components/tip-card/tip-card.wxss', [
    { selector: '.tip-card-title', minLineHeight: 1.5 },
    { selector: '.tip-card-text', minLineHeight: 1.7 },
    { selector: '.tip-card-rationale text', minLineHeight: 1.7 },
    { selector: '.tip-card-source text', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/article-list/article-list.wxss', [
    { selector: '.article-title', minLineHeight: 1.45 },
    { selector: '.article-summary', minLineHeight: 1.7 },
    { selector: '.empty-text', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/nutrition/nutrition.wxss', [
    { selector: '.page-title', minLineHeight: 1.35 },
    { selector: '.section-title', minLineHeight: 1.4 },
    { selector: '.category-name', minLineHeight: 1.4 },
    { selector: '.recipe-name', minLineHeight: 1.45 },
    { selector: '.recipe-desc', minLineHeight: 1.65 },
    { selector: '.empty-text', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/nutrition/recipe-list/recipe-list.wxss', [
    { selector: '.recipe-name', minLineHeight: 1.45 },
    { selector: '.recipe-desc', minLineHeight: 1.65 },
    { selector: '.empty-text', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/nutrition/recipe-detail/recipe-detail.wxss', [
    { selector: '.recipe-name', minLineHeight: 1.35 },
    { selector: '.recipe-desc', minLineHeight: 1.65 },
    { selector: '.section-title', minLineHeight: 1.4 },
    { selector: '.empty-text', minLineHeight: 1.6 },
    { selector: '.ingredient-name', minLineHeight: 1.6 },
    { selector: '.ingredient-amount', minLineHeight: 1.6 },
    { selector: '.bar-text', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/assessment/assessment.wxss', [
    { selector: '.page-title', minLineHeight: 1.35 },
    { selector: '.age-filter-subtitle', minLineHeight: 1.55 },
    { selector: '.card-name', minLineHeight: 1.4 },
    { selector: '.card-desc', minLineHeight: 1.65 },
    { selector: '.tips-item', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/assessment/history/history.wxss', [
    { selector: '.record-name', minLineHeight: 1.4 },
    { selector: '.record-time', minLineHeight: 1.5 },
    { selector: '.empty-hint', minLineHeight: 1.6 },
    { selector: '.legend-text', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/milestone/milestone.wxss', [
    { selector: '.question-text', minLineHeight: 1.5 },
    { selector: '.question-hint', minLineHeight: 1.6 },
    { selector: '.report-desc', minLineHeight: 1.75 },
    { selector: '.suggestion-text', minLineHeight: 1.75 },
    { selector: '.practice-text', minLineHeight: 1.75 }
  ]);
  assertTypographyRules('miniprogram/pages/textbook/knowledge-list/knowledge-list.wxss', [
    { selector: '.chapter-name', minLineHeight: 1.4 },
    { selector: '.point-name', minLineHeight: 1.45 },
    { selector: '.test-desc', minLineHeight: 1.6 },
    { selector: '.tips-item', minLineHeight: 1.8 }
  ]);
  assertTypographyRules('miniprogram/pages/textbook/textbook.wxss', [
    { selector: '.page-title', minLineHeight: 1.35 },
    { selector: '.reading-task-title', minLineHeight: 1.45 },
    { selector: '.reading-task-material', minLineHeight: 1.75 },
    { selector: '.reading-task-step', minLineHeight: 1.7 },
    { selector: '.task-title', minLineHeight: 1.45 },
    { selector: '.card-desc', minLineHeight: 1.65 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/search/search.wxss', [
    { selector: '.article-title', minLineHeight: 1.5 },
    { selector: '.article-summary', minLineHeight: 1.7 },
    { selector: '.load-more', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/parenting.wxss', [
    { selector: '.swiper-title', minLineHeight: 1.45 },
    { selector: '.article-title', minLineHeight: 1.5 },
    { selector: '.article-summary', minLineHeight: 1.7 },
    { selector: '.empty-text', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/article-detail/article-detail.wxss', [
    { selector: '.related-title', minLineHeight: 1.5 },
    { selector: '.related-summary', minLineHeight: 1.65 },
    { selector: '.practice-title', minLineHeight: 1.45 },
    { selector: '.practice-desc', minLineHeight: 1.7 },
    { selector: '.practice-btn', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/profile/child-edit/child-edit.wxss', [
    { selector: '.error-tip', minLineHeight: 1.6 },
    { selector: '.tag-item', minLineHeight: 1.45 },
    { selector: '.tag-text', minLineHeight: 1.45 },
    { selector: '.btn', minLineHeight: 1.45 },
    { selector: '.btn-delete', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/profile/feedback/feedback.wxss', [
    { selector: '.form-title', minLineHeight: 1.4 },
    { selector: '.form-desc', minLineHeight: 1.65 },
    { selector: '.content-input', minLineHeight: 1.6 },
    { selector: '.submit-btn', minLineHeight: 1.45 },
    { selector: '.history-content', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/share/preview/preview.wxss', [
    { selector: '.chip-value', minLineHeight: 1.35 },
    { selector: '.chip-label', minLineHeight: 1.45 },
    { selector: '.copy-text', minLineHeight: 1.68 },
    { selector: '.btn', minLineHeight: 1.45 },
    { selector: '.tip', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/components/encouragement-popup/encouragement-popup.wxss', [
    { selector: '.modal-message', minLineHeight: 1.6 },
    { selector: '.confirm-btn', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/profile/children/children.wxss', [
    { selector: '.tip-text', minLineHeight: 1.6 },
    { selector: '.child-name', minLineHeight: 1.4 },
    { selector: '.empty-desc', minLineHeight: 1.7 },
    { selector: '.add-btn', minLineHeight: 1.45 },
    { selector: '.count-tip', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/profile/account-deletion/account-deletion.wxss', [
    { selector: '.warning-text', minLineHeight: 1.65 },
    { selector: '.info-text', minLineHeight: 1.6 },
    { selector: '.notice-text', minLineHeight: 1.6 },
    { selector: '.checkbox-text', minLineHeight: 1.7 },
    { selector: '.delete-btn', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/assessment/result/result.wxss', [
    { selector: '.btn-secondary', minLineHeight: 1.45 },
    { selector: '.btn-primary', minLineHeight: 1.45 },
    { selector: '.age-context-text', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/textbook/knowledge-detail/knowledge-detail.wxss', [
    { selector: '.fill-input', minLineHeight: 1.6 },
    { selector: '.submit-btn text', minLineHeight: 1.45 },
    { selector: '.note-input', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/membership/index.wxss', [
    { selector: '.membership-tip', minLineHeight: 1.65 },
    { selector: '.plan-desc', minLineHeight: 1.65 },
    { selector: '.benefit-desc', minLineHeight: 1.65 },
    { selector: '.btn-pay', minLineHeight: 1.45 },
    { selector: '.recall-desc', minLineHeight: 1.6 }
  ]);
  assertTypographyRules('miniprogram/pages/parenting/milestone-result/milestone-result.wxss', [
    { selector: '.subtitle', minLineHeight: 1.6 },
    { selector: '.history-age', minLineHeight: 1.4 },
    { selector: '.detail-text', minLineHeight: 1.5 },
    { selector: '.empty-hint', minLineHeight: 1.65 },
    { selector: '.btn-primary', minLineHeight: 1.45 }
  ]);
  assertTypographyRules('miniprogram/pages/growth-record/history/index.wxss', [
    { selector: '.history-date', minLineHeight: 1.4 },
    { selector: '.history-line', minLineHeight: 1.7 }
  ]);
  assertTypographyRules('miniprogram/pages/profile/privacy/privacy.wxss', [
    { selector: '.title', minLineHeight: 1.35 },
    { selector: '.section-title', minLineHeight: 1.45 },
    { selector: '.section-text', minLineHeight: 1.8 },
    { selector: '.list-item', minLineHeight: 1.8 }
  ]);
  assertTypographyRules('miniprogram/pages/profile/agreement/agreement.wxss', [
    { selector: '.title', minLineHeight: 1.35 },
    { selector: '.section-title', minLineHeight: 1.45 },
    { selector: '.section-text', minLineHeight: 1.8 },
    { selector: '.list-item', minLineHeight: 1.8 }
  ]);
}

testGlobalTypographyBaseline();
testPageTypography();
testNoRegressedLineHeight();
testNoRegressedNoWrapText();

console.log('Miniprogram typography audit passed.');
