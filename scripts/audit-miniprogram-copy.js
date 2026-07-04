const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const USER_FACING_EXTENSIONS = new Set(['.js', '.json', '.wxml']);
const PROHIBITED_COPY = [
  { name: 'user_facing_ai_label', pattern: /AI\s*问答|AI问答保存|AI聊天|AI助理/ },
  { name: 'negative_competence_label', pattern: /输不起|胆小鬼|问题孩子|不正常|笨蛋|真笨|太笨|很笨|懒孩子|不乖/ },
  { name: 'medicalized_zone_name', pattern: /感统失调专区|胆量专区/ },
  { name: 'unsafe_parenting_action', pattern: /强迫长时间专注|不要强迫宝宝专注|按住孩子|禁止哭|不许哭/ },
  { name: 'absolute_promise', pattern: /保证.*(见效|改善|解决)|立刻见效|彻底解决|永久解决/ }
];

const AUDIT_DIRECTORIES = [
  'miniprogram',
  'backend/src/mysql-production/server.js'
];

function listFiles(directory) {
  const absolutePath = path.join(ROOT, directory);
  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return USER_FACING_EXTENSIONS.has(path.extname(directory)) ? [directory] : [];
  }
  return fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true }).flatMap(function(entry) {
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listFiles(relativePath);
    }
    return entry.isFile() && USER_FACING_EXTENSIONS.has(path.extname(entry.name)) ? [relativePath] : [];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function stripComments(source) {
  return source
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\n)\s*\/\/[^\n]*/g, '$1');
}

function auditMiniprogramCopy() {
  const hits = [];
  AUDIT_DIRECTORIES.flatMap(listFiles).forEach(function(relativePath) {
    const source = stripComments(read(relativePath));
    PROHIBITED_COPY.forEach(function(rule) {
      const match = source.match(rule.pattern);
      if (match) {
        hits.push(relativePath + ' ' + rule.name + ': ' + match[0]);
      }
    });
  });
  assert.deepStrictEqual(hits, []);
}

auditMiniprogramCopy();

console.log('Miniprogram copy audit passed.');
