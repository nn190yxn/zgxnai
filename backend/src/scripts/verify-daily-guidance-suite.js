'use strict';

const fs = require('fs');
const { spawnSync } = require('child_process');

const OUTPUT_FILE = String(process.env.DAILY_GUIDANCE_OUTPUT_FILE || '').trim();

const steps = [
  {
    name: 'daily_guidance',
    script: 'src/scripts/verify-daily-guidance.js'
  },
  {
    name: 'scene_keywords',
    script: 'src/scripts/verify-scene-keywords.js'
  }
];

function runStep(step) {
  const result = spawnSync(process.execPath, [step.script], {
    cwd: process.cwd(),
    env: process.env,
    encoding: 'utf8'
  });

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  let parsed = null;

  if (stdout) {
    try {
      parsed = JSON.parse(stdout);
    } catch (err) {
      parsed = { raw: stdout };
    }
  } else if (stderr) {
    try {
      parsed = JSON.parse(stderr);
    } catch (err) {
      parsed = { raw: stderr };
    }
  }

  return {
    name: step.name,
    ok: result.status === 0,
    status: result.status,
    output: parsed,
    stderr: stderr || null
  };
}

function main() {
  const summary = {
    ok: true,
    executedAt: new Date().toISOString(),
    steps: []
  };

  for (const step of steps) {
    const result = runStep(step);
    summary.steps.push(result);
    if (!result.ok) {
      summary.ok = false;
      break;
    }
  }

  const text = `${JSON.stringify(summary, null, 2)}\n`;
  process.stdout.write(text);
  if (OUTPUT_FILE) {
    fs.writeFileSync(OUTPUT_FILE, text, 'utf8');
  }
  if (!summary.ok) {
    process.exit(1);
  }
}

main();
