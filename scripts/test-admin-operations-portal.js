const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = (file) => fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
const html = read('admin-portal/index.html');
const app = read('admin-portal/app.js');
const moduleSource = read('admin-portal/modules/operations.js');

['operationsNav', 'operationsModules'].forEach((id) => assert.ok(html.includes(id), `后台 DOM 应包含 ${id}`));
['media', 'articles', 'pain-points', 'training', 'nutrition', 'membership', 'users', 'support'].forEach((id) => assert.ok(moduleSource.includes(id), `后台模块应包含 ${id}`));
assert.ok(html.includes('./modules/operations.js'), '后台应加载模块化运营脚本');
assert.ok(app.includes("window.AdminPortal = { request, escapeHtml"), '模块应复用现有 request 鉴权模式');
['/media', '/articles', '/pain-points', '/content/', '/membership/config', '/users/operations', '/support/tickets'].forEach((route) => assert.ok(moduleSource.includes(route), `运营模块应包含请求路径 ${route}`));
['正在加载', '暂无数据', '加载失败', '重试', '未保存', '无权访问', '页面预览', '内容预览', '审核意见', 'scheduled_at', 'restore'].forEach((text) => assert.ok(moduleSource.includes(text), `运营模块应包含状态或流程 ${text}`));
['media:read', 'article:read', 'pain_point:read', 'membership:read', 'user:read', 'ticket:read'].forEach((permission) => assert.ok(moduleSource.includes(permission), `运营模块应显示权限 ${permission}`));
console.log('Admin operations portal structure tests passed.');
