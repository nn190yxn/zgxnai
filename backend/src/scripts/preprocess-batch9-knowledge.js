#!/usr/bin/env node
// Preprocess batch-9 JSON files to be compatible with import-knowledge-base.js
// - Convert qa items to articles (question→title, answer→content)
// - Add task_code/subject_code to tasks that lack them

const fs = require('fs');
const path = require('path');

const TMP = '/workspace/.monkeycode-tmp-files';
const OUT = '/workspace/backend/examples';

const FILES = [
  'efa5aaa5-book4_童年的秘密-1.json',
  '586c1424-book5_发现孩子-2.json',
  'e5468a3d-book6_有吸收力的心灵-3.json',
  '04d6d98f-真希望我父母读过这本书_结构化知识库-1.json',
  '0aa337a0-book_neuroscience_set-1.json'
];

const NAMES = {
  'efa5aaa5-book4_童年的秘密-1.json': 'raw-text-knowledge-import-montessori-4',
  '586c1424-book5_发现孩子-2.json': 'raw-text-knowledge-import-montessori-5',
  'e5468a3d-book6_有吸收力的心灵-3.json': 'raw-text-knowledge-import-montessori-6',
  '04d6d98f-真希望我父母读过这本书_结构化知识库-1.json': 'raw-text-knowledge-import-hope-parents',
  '0aa337a0-book_neuroscience_set-1.json': 'raw-text-knowledge-import-neuroscience'
};

function normalizeItem(item, idx) {
  if (!item || !item.type) return null;

  if (item.type === 'qa') {
    return {
      type: 'article',
      id: item.id,
      title: String(item.question || '').trim(),
      summary: '',
      content: String(item.answer || '').trim(),
      category: item.category || '家庭教育',
      sub_category: item.sub_category || '',
      age_group: (item.age_groups || []).join(','),
      tags: item.tags || [],
      author: '',
      evidence_level: item.evidence_level || 'expert',
      is_published: 1
    };
  }

  if (item.type === 'task') {
    const taskCode = item.task_code || item.id || `TASK_${String(idx + 1).padStart(4, '0')}`;
    const subjectCode = item.subject_code || 'general' ;
    return Object.assign({}, item, {
      task_code: taskCode,
      subject_code: subjectCode
    });
  }

  return item;
}

for (const file of FILES) {
  const srcPath = path.join(TMP, file);
  if (!fs.existsSync(srcPath)) {
    console.log(`[preprocess] SKIP (missing): ${file}`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
  const normalized = [];
  for (let i = 0; i < data.length; i++) {
    const item = normalizeItem(data[i], i);
    if (item) normalized.push(item);
  }

  const outName = NAMES[file];
  const outPath = path.join(OUT, `${outName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(normalized, null, 2), 'utf8');

  const types = {};
  normalized.forEach(a => { types[a.type] = (types[a.type] || 0) + 1; });
  console.log(`[preprocess] ${outName}: ${normalized.length} items, types=${JSON.stringify(types)} → ${outPath}`);
}
