const assert = require('assert');
const encouragement = require('../miniprogram/utils/encouragement.js');

function testLevelClass() {
  assert.strictEqual(encouragement.getEncouragementLevelClass(1), 'level-1');
  assert.strictEqual(encouragement.getEncouragementLevelClass(5), 'level-5');
  assert.strictEqual(encouragement.getEncouragementLevelClass(0), 'level-1');
  assert.strictEqual(encouragement.getEncouragementLevelClass(8), 'level-5');
  assert.strictEqual(encouragement.getEncouragementLevelClass('3'), 'level-3');
}

function testHomeEncouragementState() {
  assert.deepStrictEqual(encouragement.buildHomeEncouragementState(null), {
    visible: false,
    message: '',
    level: 1
  });
  assert.deepStrictEqual(encouragement.buildHomeEncouragementState({ show_encouragement: false, encouragement_message: 'x' }), {
    visible: false,
    message: '',
    level: 1
  });
  assert.deepStrictEqual(encouragement.buildHomeEncouragementState({ show_encouragement: true }), {
    visible: false,
    message: '',
    level: 1
  });
  assert.deepStrictEqual(encouragement.buildHomeEncouragementState({
    show_encouragement: true,
    encouragement_message: '你是很棒的家长',
    encouragement_level: 4
  }), {
    visible: true,
    message: '你是很棒的家长',
    level: 4
  });
  assert.deepStrictEqual(encouragement.buildHomeEncouragementState({
    show_encouragement: true,
    encouragement_message: '继续保持',
    encouragement_level: 9
  }), {
    visible: true,
    message: '继续保持',
    level: 5
  });
}

function testReadingAnnotation() {
  assert.strictEqual(encouragement.hasReadEnough(0, 800, 2000), false);
  assert.strictEqual(encouragement.hasReadEnough(400, 800, 2000), false);
  assert.strictEqual(encouragement.hasReadEnough(600, 800, 2000), true);
  assert.strictEqual(encouragement.hasReadEnough(900, 800, 2400), true);
  assert.strictEqual(encouragement.hasReadEnough(900, 0, 2400), false);
  assert.strictEqual(encouragement.shouldShowReadingAnnotation({ alreadyShown: true, todayCount: 0, randomValue: 0 }), false);
  assert.strictEqual(encouragement.shouldShowReadingAnnotation({ alreadyShown: false, todayCount: 2, randomValue: 0 }), false);
  assert.strictEqual(encouragement.shouldShowReadingAnnotation({ alreadyShown: false, todayCount: 1, randomValue: 0.29 }), true);
  assert.strictEqual(encouragement.shouldShowReadingAnnotation({ alreadyShown: false, todayCount: 1, randomValue: 0.3 }), false);
  assert.strictEqual(encouragement.shouldShowReadingAnnotation({ alreadyShown: false, todayCount: 1, randomValue: 0.99 }), false);
}

testLevelClass();
testHomeEncouragementState();
testReadingAnnotation();

console.log('Encouragement tests passed.');
