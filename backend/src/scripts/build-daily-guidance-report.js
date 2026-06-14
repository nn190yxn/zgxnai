'use strict';

const fs = require('fs');

const SUITE_FILE = String(process.env.DAILY_GUIDANCE_SUITE_FILE || '').trim();
const REPORT_FILE = String(process.env.DAILY_GUIDANCE_REPORT_FILE || '').trim();

function readJsonFile(filePath) {
  if (!filePath) {
    throw new Error('缺少 DAILY_GUIDANCE_SUITE_FILE');
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function formatStep(step) {
  if (!step) {
    return '- 未执行';
  }
  const status = step.ok ? '通过' : '失败';
  const parts = [`- ${step.name}：${status}`];
  if (step.output && step.output.checks && Array.isArray(step.output.checks)) {
    step.output.checks.forEach((check) => {
      const details = [];
      Object.keys(check || {}).forEach((key) => {
        if (key !== 'name' && key !== 'status' && check[key] !== undefined && check[key] !== null && check[key] !== '') {
          details.push(`${key}=${JSON.stringify(check[key])}`);
        }
      });
      parts.push(`  - ${check.name || 'unknown'}：${details.join('，') || check.status || 'ok'}`);
    });
  }
  if (step.output && step.output.rows && Array.isArray(step.output.rows)) {
    const matchedCount = Number(step.output.matchedCount || 0);
    const fallbackCount = Number(step.output.fallbackCount || 0);
    const emptyCount = Number(step.output.emptyCount || 0);
    parts.push(`  - 场景词统计：matched=${matchedCount}，fallback=${fallbackCount}，empty=${emptyCount}`);
  }
  if (!step.ok && step.stderr) {
    parts.push(`  - 错误：${step.stderr}`);
  }
  return parts.join('\n');
}

function buildMarkdown(summary) {
  const steps = Array.isArray(summary && summary.steps) ? summary.steps : [];
  const lines = [
    '## 接口脚本结果摘要',
    '',
    `- 总结果：${summary && summary.ok ? '通过' : '失败'}`,
    `- 执行时间：${summary && summary.executedAt ? summary.executedAt : ''}`,
    `- JSON 结果文件：${SUITE_FILE}`,
    '',
    '### 分步骤结果',
    ''
  ];
  steps.forEach((step) => {
    lines.push(formatStep(step));
    lines.push('');
  });
  return `${lines.join('\n').trim()}\n`;
}

function main() {
  const summary = readJsonFile(SUITE_FILE);
  const markdown = buildMarkdown(summary);
  process.stdout.write(markdown);
  if (REPORT_FILE) {
    fs.writeFileSync(REPORT_FILE, markdown, 'utf8');
  }
}

main();
