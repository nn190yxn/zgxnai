const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const MINIPROGRAM_DIR = path.join(ROOT_DIR, 'miniprogram');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

function collectJavaScriptFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') {
        continue;
      }
      files.push(...collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

function runNodeCheck(files) {
  const failures = [];

  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], {
      encoding: 'utf8'
    });

    if (result.status !== 0) {
      failures.push({
        file,
        output: [result.stdout, result.stderr].filter(Boolean).join('\n').trim()
      });
    }
  }

  if (failures.length > 0) {
    console.error(`Syntax check failed for ${failures.length} file(s).`);
    for (const failure of failures) {
      console.error(`\n${failure.file}`);
      if (failure.output) {
        console.error(failure.output);
      }
    }
    process.exit(1);
  }

  console.log(`Miniprogram syntax check passed for ${files.length} file(s).`);
}

function runBackendLint() {
  const result = spawnSync('npm', ['run', 'lint', '--prefix', BACKEND_DIR], {
    cwd: ROOT_DIR,
    encoding: 'utf8'
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

runBackendLint();
runNodeCheck(collectJavaScriptFiles(MINIPROGRAM_DIR));
