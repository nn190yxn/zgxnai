const assert = require('assert');
const dailyPlanText = require('../backend/src/mysql-production/daily-plan-text');

function testLegacyTextNormalization() {
  assert.deepStrictEqual(dailyPlanText.normalizeLegacyDailyPlanText(
    'parenting_article',
    '再读一篇：孩子一提醒就顶嘴，先把话说短',
    '情绪管理相关问题更适合今天顺手补一篇方法文。',
    '围绕情绪管理再读一篇方法文'
  ), {
    title: '这篇也许用得上：孩子一提醒就顶嘴，先把话说短',
    reason: '情绪管理这类情况，今天可以先看一篇。',
    summary: '围绕情绪管理再看一篇方法文'
  });

  assert.deepStrictEqual(dailyPlanText.normalizeLegacyDailyPlanText(
    'parenting_article',
    '这篇也许用得上：孩子一提醒就顶嘴，先把话说短',
    '你最近已经在看内容，这一篇更适合直接转成家庭做法。',
    '今天可以照着试'
  ), {
    title: '这篇也许用得上：孩子一提醒就顶嘴，先把话说短',
    reason: '你最近常看这类，今天可以照着试一小步。',
    summary: '今天可以照着试'
  });
}

function testMissingAgeCards() {
  const cards = dailyPlanText.buildMissingAgeDailyPlanCards({ id: 12, name: '牛牛' }, '2026-06-27');
  assert.strictEqual(cards.length, 3);
  assert.strictEqual(cards[0].title, '先补孩子生日，再看今日建议');
  assert.strictEqual(cards[0].childId, 12);
  assert.strictEqual(cards[0].sourceKey, 'missing_child_age');
  assert.ok(cards.every(function(card) {
    return !String(card.title + card.reasonText + card.summaryText).includes('6-9岁');
  }));
  assert.ok(cards.every(function(card) {
    return !String(card.title + card.reasonText + card.summaryText).includes('再读一篇');
  }));
}

testLegacyTextNormalization();
testMissingAgeCards();

console.log('Daily plan text tests passed.');
