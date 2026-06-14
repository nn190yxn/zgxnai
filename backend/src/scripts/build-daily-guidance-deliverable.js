'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const ARCHIVE_DIR = String(process.env.DAILY_GUIDANCE_ARCHIVE_DIR || '').trim() || '/tmp/daily-guidance-regression';
const RECORD_FILE = String(process.env.DAILY_GUIDANCE_RECORD_FILE || '').trim() || path.join(ARCHIVE_DIR, 'regression-record.md');

function runNodeScript(scriptPath, extraEnv) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: process.cwd(),
    env: Object.assign({}, process.env, extraEnv),
    encoding: 'utf8'
  });
  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (result.status !== 0) {
    process.stderr.write(stderr || stdout || 'script failed\n');
    process.exit(result.status || 1);
  }
  return stdout ? JSON.parse(stdout) : {};
}

function main() {
  const archiveResult = runNodeScript('src/scripts/archive-daily-guidance-report.js', {
    DAILY_GUIDANCE_ARCHIVE_DIR: ARCHIVE_DIR
  });

  const recordResult = runNodeScript('src/scripts/build-daily-guidance-record.js', {
    DAILY_GUIDANCE_SUMMARY_FILE: archiveResult.reportFile,
    DAILY_GUIDANCE_RECORD_FILE: RECORD_FILE,
    DAILY_GUIDANCE_CHILD_ID: process.env.DAILY_GUIDANCE_CHILD_ID || '',
    DAILY_GUIDANCE_COMMIT_SHA: process.env.DAILY_GUIDANCE_COMMIT_SHA || '',
    DAILY_GUIDANCE_ACCOUNT_TYPE: process.env.DAILY_GUIDANCE_ACCOUNT_TYPE || '',
    DAILY_GUIDANCE_ENV_NAME: process.env.DAILY_GUIDANCE_ENV_NAME || '生产',
    DAILY_GUIDANCE_EXECUTOR: process.env.DAILY_GUIDANCE_EXECUTOR || ''
  });

  process.stdout.write(`${JSON.stringify({
    ok: true,
    archiveDir: ARCHIVE_DIR,
    suiteFile: archiveResult.suiteFile,
    reportFile: archiveResult.reportFile,
    recordFile: recordResult.outputFile
  }, null, 2)}\n`);
}

main();
