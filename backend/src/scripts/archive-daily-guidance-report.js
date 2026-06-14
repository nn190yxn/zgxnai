'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const OUTPUT_DIR = String(process.env.DAILY_GUIDANCE_ARCHIVE_DIR || '').trim() || path.join(os.tmpdir(), 'daily-guidance-regression');
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const SUITE_FILE = process.env.DAILY_GUIDANCE_OUTPUT_FILE || path.join(OUTPUT_DIR, `suite-${RUN_ID}.json`);
const REPORT_FILE = process.env.DAILY_GUIDANCE_REPORT_FILE || path.join(OUTPUT_DIR, `report-${RUN_ID}.md`);

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function runNodeScript(scriptPath, extraEnv) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    env: Object.assign({}, process.env, extraEnv),
    encoding: 'utf8'
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || 'script failed\n');
    process.exit(result.status || 1);
  }
  return (result.stdout || '').trim();
}

function main() {
  ensureDir(SUITE_FILE);
  ensureDir(REPORT_FILE);

  runNodeScript('src/scripts/verify-daily-guidance-suite.js', {
    DAILY_GUIDANCE_OUTPUT_FILE: SUITE_FILE
  });

  const markdown = runNodeScript('src/scripts/build-daily-guidance-report.js', {
    DAILY_GUIDANCE_SUITE_FILE: SUITE_FILE,
    DAILY_GUIDANCE_REPORT_FILE: REPORT_FILE
  });

  const output = {
    ok: true,
    suiteFile: SUITE_FILE,
    reportFile: REPORT_FILE,
    archiveDir: OUTPUT_DIR,
    markdownPreview: markdown.split('\n').slice(0, 12)
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main();
