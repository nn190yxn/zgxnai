const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const SRC_DIR = path.join(__dirname, '..');

function collectJavaScriptFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJavaScriptFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = collectJavaScriptFiles(SRC_DIR);
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

console.log(`Syntax check passed for ${files.length} file(s).`);
