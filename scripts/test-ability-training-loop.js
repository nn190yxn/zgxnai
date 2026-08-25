const assert = require('assert');
const fs = require('fs');

function read(file) { return fs.readFileSync(file, 'utf8'); }

const appJson = read('miniprogram/app.json');
const result = read('miniprogram/pages/assessment/result/result.wxml');
const trainingIndex = read('miniprogram/pages/training/index/index.js');
const trainingDetail = read('miniprogram/pages/training/detail/detail.js');
const assessmentIndex = read('miniprogram/pages/assessment/assessment.js');
const assessmentDo = read('miniprogram/pages/assessment/do/do.js');
const assessmentResult = read('miniprogram/pages/assessment/result/result.js');
const app = read('miniprogram/app.js');
const server = read('backend/src/mysql-production/server.js');

assert.ok(appJson.includes('pages/training/index/index'), 'training index page should be registered');
assert.ok(appJson.includes('pages/training/detail/detail'), 'training detail page should be registered');
assert.ok(result.includes('startExperiencePlan'), 'assessment result should expose 3-day experience entry');
assert.ok(trainingIndex.includes('/training-plans/next'), 'training page should load next task');
assert.ok(trainingDetail.includes('/training-tasks/'), 'training detail should complete a task');
assert.ok(server.includes('trainingTaskHandler'), 'backend should load a task by id');
assert.ok(trainingDetail.includes('/training-feedback'), 'training detail should submit parent feedback');
assert.ok(server.includes('abilityObservationSubmitHandler'), 'backend should save formal ability profile');
assert.ok(server.includes('trainingPlanGenerateHandler'), 'backend should generate training plans');
assert.ok(server.includes('TRAINING_PLAN_EXPIRED'), 'backend should reject expired plans');
assert.ok(server.includes('DAILY_PLAN_DATE_INVALID'), 'daily plan completion should validate effective date');
assert.ok(server.includes('degradationReason'), 'daily plan response should expose degradation state');
assert.ok(app.includes('retryPendingTrainingRecords'), 'app should retry pending training records');
['ability_observation_exposure', 'ability_observation_start'].forEach((eventName) => assert.ok(assessmentIndex.includes(eventName), eventName + ' should be tracked'));
['ability_observation_submit', 'ability_observation_complete'].forEach((eventName) => assert.ok(assessmentDo.includes(eventName), eventName + ' should be tracked'));
['ability_profile_view', 'ability_suggestion_click', 'membership_touchpoint_exposure', 'membership_touchpoint_click'].forEach((eventName) => assert.ok(assessmentResult.includes(eventName), eventName + ' should be tracked'));
['training_task_start', 'training_task_view', 'training_task_complete', 'training_task_abandon', 'training_feedback_submit', 'training_next_suggestion_view'].forEach((eventName) => assert.ok(trainingDetail.includes(eventName), eventName + ' should be tracked'));

console.log('Ability training loop structure tests passed.');
