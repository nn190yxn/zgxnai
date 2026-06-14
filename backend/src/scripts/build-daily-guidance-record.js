'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_TEMPLATE_FILE = path.resolve(__dirname, '../../../.monkeycode/specs/2026-06-14-daily-guidance-system/regression-report-template.md');
const TEMPLATE_FILE = String(process.env.DAILY_GUIDANCE_TEMPLATE_FILE || '').trim() || DEFAULT_TEMPLATE_FILE;
const SUMMARY_FILE = String(process.env.DAILY_GUIDANCE_SUMMARY_FILE || '').trim();
const OUTPUT_FILE = String(process.env.DAILY_GUIDANCE_RECORD_FILE || '').trim();
const COMMIT_SHA = String(process.env.DAILY_GUIDANCE_COMMIT_SHA || '').trim();
const ENV_NAME = String(process.env.DAILY_GUIDANCE_ENV_NAME || '').trim() || '生产';
const ACCOUNT_TYPE = String(process.env.DAILY_GUIDANCE_ACCOUNT_TYPE || '').trim();
const CHILD_ID = String(process.env.DAILY_GUIDANCE_CHILD_ID || '').trim();
const EXECUTOR = String(process.env.DAILY_GUIDANCE_EXECUTOR || '').trim();

function readText(filePath) {
  if (!filePath) {
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

function replaceLine(content, prefix, nextValue) {
  const pattern = new RegExp(`^${prefix}.*$`, 'm');
  return content.replace(pattern, `${prefix}${nextValue}`);
}

function injectSummary(content, summaryText) {
  const marker = '- 关键输出摘要：';
  const index = content.indexOf(marker);
  if (index === -1 || !summaryText.trim()) {
    return content;
  }
  const before = content.slice(0, index + marker.length);
  const after = content.slice(index + marker.length);
  const nextSectionIndex = after.indexOf('\n## ');
  const tail = nextSectionIndex >= 0 ? after.slice(nextSectionIndex) : '';
  return `${before}\n\n${summaryText.trim()}\n${tail}`;
}

function main() {
  if (!SUMMARY_FILE) {
    throw new Error('缺少 DAILY_GUIDANCE_SUMMARY_FILE');
  }
  if (!OUTPUT_FILE) {
    throw new Error('缺少 DAILY_GUIDANCE_RECORD_FILE');
  }

  let content = readText(TEMPLATE_FILE);
  const summaryText = readText(SUMMARY_FILE);
  const now = new Date().toISOString();

  content = replaceLine(content, '- 回测时间：', now);
  content = replaceLine(content, '- 提交号：', COMMIT_SHA);
  content = replaceLine(content, '- 回测环境：', ENV_NAME);
  content = replaceLine(content, '- 回测账号类型：', ACCOUNT_TYPE);
  content = replaceLine(content, '- 回测孩子 ID：', CHILD_ID);
  content = replaceLine(content, '- 执行人：', EXECUTOR);
  content = replaceLine(content, '- Markdown 摘要文件：', SUMMARY_FILE);
  content = injectSummary(content, summaryText);

  fs.writeFileSync(OUTPUT_FILE, content, 'utf8');
  process.stdout.write(`${JSON.stringify({ ok: true, outputFile: OUTPUT_FILE, templateFile: TEMPLATE_FILE, summaryFile: SUMMARY_FILE }, null, 2)}\n`);
}

main();
