const assert = require('assert');
const fs = require('fs');
const path = require('path');

function read(file) {
  return fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
}

const feedbackFlow = require('../miniprogram/utils/feedback-flow.js');
const supportTickets = require('../backend/src/mysql-production/support-tickets.js');

assert.strictEqual(feedbackFlow.canSubmitFeedback('内容不足', false, ''), false, '反馈内容至少需要 5 个字');
assert.strictEqual(feedbackFlow.canSubmitFeedback('这里出现了一个问题', false, ''), true, '普通反馈可以不填联系方式');
assert.strictEqual(feedbackFlow.canSubmitFeedback('这里出现了一个问题', true, ''), false, '申请回访时必须填写联系方式');
assert.strictEqual(feedbackFlow.canSubmitFeedback('这里出现了一个问题', true, 'parent_wechat'), true, '申请回访并填写联系方式后可以提交');

const history = feedbackFlow.normalizeHistory([
  { id: 1, status: 'pending', channel: 'callback_request' },
  { id: 2, status: 'processing', channel: 'feedback' },
  { id: 3, status: 'pending_callback' },
  { id: 4, status: 'closed' }
]);
assert.deepStrictEqual(history.map((item) => item.status_text), ['已收到', '处理中', '等待回访', '已完成']);
assert.strictEqual(history[0].callback_requested, true, '回访请求应在历史记录中可见');
assert.strictEqual(history[1].callback_requested, false, '普通反馈不应标记为回访请求');

const deviceInfo = supportTickets.normalizeDeviceInfo({
  platform: 'ios',
  system: 'iOS 18.0',
  model: 'phone-model',
  unexpected: 'discarded'
});
assert.strictEqual(deviceInfo.platform, 'ios');
assert.strictEqual(deviceInfo.unexpected, undefined, '设备信息只保留允许字段');

const publicTicket = supportTickets.publicTicket({
  id: 12,
  type: '体验建议',
  content: '希望客服帮忙看一下',
  status: 'pending_callback',
  channel: 'callback_request',
  public_progress: '客服将在今天联系你'
});
assert.strictEqual(publicTicket.callback_requested, true);
assert.strictEqual(publicTicket.public_progress, '客服将在今天联系你');

assert.doesNotThrow(() => supportTickets.assertStatusTransition('pending', 'processing'));
assert.doesNotThrow(() => supportTickets.assertStatusTransition('processing', 'pending_callback'));
assert.doesNotThrow(() => supportTickets.assertStatusTransition('pending_callback', 'closed'));
assert.throws(() => supportTickets.assertStatusTransition('closed', 'processing'), /状态流转不合法/);

const page = read('miniprogram/pages/profile/feedback/feedback.js');
const template = read('miniprogram/pages/profile/feedback/feedback.wxml');
const server = read('backend/src/mysql-production/server.js');
const routes = read('backend/src/mysql-production/platform-routes.js');
const migrations = read('backend/src/mysql-production/migrations/index.js');
const admin = read('admin-portal/modules/operations.js');

['callback_request', 'device_info', "app.requireLoginForAction('请先完成微信登录，再提交反馈')", "'feedbackHistory:' + userInfo.id", 'historyError'].forEach((text) => assert.ok(page.includes(text), `反馈页应包含 ${text}`));
['希望客服回访', '已申请回访', 'status_text', 'retryHistory'].forEach((text) => assert.ok(template.includes(text), `反馈页面应展示 ${text}`));
assert.ok(server.includes('device_info)'), '反馈建单应保存设备信息');
assert.ok(routes.includes('SELECT id, status FROM support_tickets WHERE id = ? FOR UPDATE'), '工单状态流转应读取数据库当前状态');
assert.ok(routes.includes("body.status || 'closed'"), '回访记录应支持关闭工单');
assert.ok(routes.includes('UPDATE support_tickets SET status = ?, public_progress = ?'), '回访后应同步公开进展');
assert.ok(routes.includes('channel, public_progress'), '反馈历史应返回回访请求标识');
assert.ok(migrations.includes('20260903_001_feedback_device_context'), '设备信息字段应通过迁移新增');
['负责人 ID', '内部处理备注', '回访方式', '记录回访并完成'].forEach((text) => assert.ok(admin.includes(text), `客服后台应包含 ${text}`));

console.log('Feedback and support callback flow tests passed.');
