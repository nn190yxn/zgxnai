// 小牛育儿 30天宣传指挥台 启动脚本
// 用法: node start.js

const { execSync, spawn } = require('child_process');
const path = require('path');
const http = require('http');

const SCRIPT_DIR = __dirname;
const BACKEND_DIR = path.resolve(SCRIPT_DIR, '..', 'backend');
const PORT = 3002;
const URL = `http://127.0.0.1:${PORT}/marketing/`;

function log(msg) { console.log(`  ${msg}`); }
function info(msg) { console.log(`[INFO] ${msg}`); }
function error(msg) { console.log(`[ERROR] ${msg}`); }

async function main() {
  console.log('');
  console.log('  ======================================');
  console.log('    Niuniu 30-Day Marketing Console');
  console.log('  ======================================');
  console.log('');

  // 1. Check .env
  const envPath = path.join(BACKEND_DIR, '.env');
  if (!require('fs').existsSync(envPath)) {
    error(`Missing ${envPath}`);
    process.exit(1);
  }
  info('.env OK');

  // 2. Check/install npm packages
  const expressPath = path.join(BACKEND_DIR, 'node_modules', 'express');
  if (!require('fs').existsSync(expressPath)) {
    info('Installing npm packages...');
    execSync('npm install --ignore-scripts --registry=https://registry.npmmirror.com', {
      cwd: BACKEND_DIR,
      stdio: 'inherit'
    });
    info('npm install done.');
  } else {
    info('node_modules OK.');
  }

  // 3. Kill old backend
  info('Checking port 3002...');
  try {
    if (process.platform === 'win32') {
      execSync('netstat -ano | findstr ":3002" | findstr "LISTENING"', { stdio: 'pipe' });
      const out = execSync('netstat -ano | findstr ":3002" | findstr "LISTENING"', { encoding: 'utf8' });
      const lines = out.trim().split(/\r?\n/);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid) {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
        }
      }
    } else {
      execSync("lsof -ti:3002 | xargs -r kill -9", { stdio: 'pipe' });
    }
  } catch (e) { /* port not in use */ }
  info('Port clear.');

  // 4. Start backend
  info('Starting backend...');
  const child = spawn('node', ['src/mysql-production/server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, NODE_PATH: path.join(BACKEND_DIR, 'node_modules') },
    stdio: 'pipe',
    detached: false
  });
  child.on('error', (e) => { error(`Backend start failed: ${e.message}`); });

  // Monitor backend stderr for startup errors
  let startupOutput = '';
  child.stderr.on('data', (data) => {
    startupOutput += data.toString();
    process.stderr.write(data);
  });
  child.stdout.on('data', (data) => {
    startupOutput += data.toString();
    process.stdout.write(data);
  });

  // 5. Wait for backend to be ready
  info('Waiting for backend ready...');
  const ready = await waitForHealth(PORT, 30000);
  if (!ready) {
    error('Backend failed to start within 30s.');
    child.kill();
    process.exit(1);
  }
  info('Backend ready.');

  // 6. Open browser
  info('Opening browser...');
  try {
    const cmd = process.platform === 'win32'
      ? `start "" "${URL}"`
      : process.platform === 'darwin'
        ? `open "${URL}"`
        : `xdg-open "${URL}"`;
    execSync(cmd, { stdio: 'ignore' });
  } catch (e) {
    log(`Please open: ${URL}`);
  }

  console.log('');
  console.log('  === READY ===');
  console.log(`  ${URL}`);
  console.log('  Press Ctrl+C to stop.');
  console.log('');
}

function waitForHealth(port, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    function check() {
      if (Date.now() - start > timeoutMs) {
        resolve(false);
        return;
      }
      const req = http.get(`http://127.0.0.1:${port}/health`, (res) => {
        if (res.statusCode === 200) {
          res.resume();
          resolve(true);
        } else {
          setTimeout(check, 500);
        }
      });
      req.on('error', () => setTimeout(check, 500));
      req.setTimeout(2000, () => { req.destroy(); setTimeout(check, 500); });
    }
    check();
  });
}

main().catch((e) => {
  error(e.message);
  process.exit(1);
});
