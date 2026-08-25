const https = require('https');

const hostname = 'api.woyai.cn';
const allowKnownDrift = process.argv.includes('--allow-known-drift');

const checks = [
  { path: '/api/v1/health', statuses: [200], validate: (body) => body.status === 'ok' && body.service === 'niuniu-backend' },
  { path: '/api/v1/runtime/config', statuses: [200], validate: (body) => body.env_name === 'production' && body.config_loaded === true },
  { path: '/api/v1/children', statuses: [401] },
  { path: '/api/v1/recommendations', statuses: [401] },
  { path: '/api/v1/payment/virtual-order', method: 'POST', statuses: [401] },
  { path: '/api/v1/wechat/message-push', statuses: [403], json: false, validate: (body) => body.trim() === 'signature invalid' },
  { path: '/api/v1/development-zones', statuses: [200], validate: (body) => body.success === true && Array.isArray(body.data && body.data.list) },
  { path: '/api/v1/education/knowledge/chapters', statuses: [401] },
  { path: '/api/v1/knowledge/contents', statuses: allowKnownDrift ? [200, 404] : [200], validate: validateKnowledgeResponse },
  { path: '/api/v1/knowledge/ability-content', statuses: allowKnownDrift ? [200, 404] : [200], validate: validateKnowledgeResponse }
];

function validateKnowledgeResponse(body, statusCode) {
  if (allowKnownDrift && statusCode === 404) return body.success === false;
  return body.success === true && Array.isArray(body.data) && body.meta && body.meta.schema_version === 1;
}

function request(check) {
  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: check.path, method: check.method || 'GET', timeout: 15000 }, (res) => {
      let rawBody = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawBody += chunk; });
      res.on('end', () => {
        let body = rawBody;
        if (check.json !== false) {
          try {
            body = JSON.parse(rawBody);
          } catch (error) {
            reject(new Error(`${check.path} 返回了无效 JSON`));
            return;
          }
        }
        const statusValid = check.statuses.includes(res.statusCode);
        const bodyValid = !check.validate || check.validate(body, res.statusCode);
        resolve({ path: check.path, statusCode: res.statusCode, passed: statusValid && bodyValid });
      });
    });
    req.on('timeout', () => req.destroy(new Error(`${check.path} 请求超时`)));
    req.on('error', reject);
    req.end();
  });
}

Promise.all(checks.map(request)).then((results) => {
  results.forEach((result) => {
    console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.statusCode} ${result.path}`);
  });
  const failures = results.filter((result) => !result.passed);
  if (failures.length) {
    throw new Error(`Production public verification failed for ${failures.length} endpoint(s).`);
  }
  console.log(`Production public verification passed for ${results.length} endpoints.`);
}).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
