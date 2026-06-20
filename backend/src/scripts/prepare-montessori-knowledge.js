#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VALID_AGE_GROUPS = new Set([
  '0-1岁',
  '1-2岁',
  '2-3岁',
  '3-4岁',
  '4-5岁',
  '5-6岁',
  '6-9岁',
  '9-12岁'
]);

const DEFAULT_SOURCES = [
  {
    file: '/workspace/.monkeycode-tmp-files/17c305e7-book1_蒙台梭利早期教育法-1.json',
    label: '蒙台梭利早期教育法'
  },
  {
    file: '/workspace/.monkeycode-tmp-files/b341a519-book2_蒙台梭利儿童教育手册-2.json',
    label: '蒙台梭利儿童教育手册'
  },
  {
    file: '/workspace/.monkeycode-tmp-files/11a45250-book3_儿童的自发成长-3.json',
    label: '儿童的自发成长'
  }
];

main();

function main() {
  const args = process.argv.slice(2);
  const outputArgIndex = args.findIndex((arg) => arg === '--output');
  const outputPath = outputArgIndex >= 0 && args[outputArgIndex + 1]
    ? path.resolve(process.cwd(), args[outputArgIndex + 1])
    : path.resolve(process.cwd(), 'examples/montessori-knowledge-import.json');
  const sources = parseSourcesFromArgs(args);

  const result = buildImportPayload(sources);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result.items, null, 2) + '\n', 'utf8');

  console.log(`[montessori-prepare] output=${outputPath}`);
  console.log(`[montessori-prepare] source_files=${sources.length}`);
  console.log(`[montessori-prepare] source_total=${result.summary.sourceTotal}`);
  console.log(`[montessori-prepare] source_article=${result.summary.sourceArticle} source_task=${result.summary.sourceTask} source_qa=${result.summary.sourceQa} source_scene=${result.summary.sourceScene}`);
  console.log(`[montessori-prepare] output_article=${result.summary.outputArticle} output_task=${result.summary.outputTask} output_scene=${result.summary.outputScene} total=${result.items.length}`);
}

function parseSourcesFromArgs(args) {
  const sourceSpecs = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] !== '--source' || !args[index + 1]) {
      continue;
    }
    sourceSpecs.push(args[index + 1]);
    index += 1;
  }

  if (!sourceSpecs.length) {
    return DEFAULT_SOURCES;
  }

  return sourceSpecs.map((spec) => {
    const [filePart, labelPart] = String(spec).split('::');
    const file = path.resolve(process.cwd(), filePart);
    const label = String(labelPart || path.basename(filePart, path.extname(filePart))).trim();
    if (!filePart || !label) {
      throw new Error(`无效 source 参数: ${spec}`);
    }
    return { file, label };
  });
}

function buildImportPayload(sources) {
  const items = [];
  const titleCounts = new Map();
  const summary = {
    sourceTotal: 0,
    sourceArticle: 0,
    sourceTask: 0,
    sourceQa: 0,
    sourceScene: 0,
    outputArticle: 0,
    outputTask: 0,
    outputScene: 0
  };

  for (const source of sources) {
    const rawItems = parseLooseJsonFile(source.file);
    for (const rawItem of rawItems) {
      const type = String(rawItem && rawItem.type || '').trim();
      summary.sourceTotal += 1;

      if (type === 'article') {
        summary.sourceArticle += 1;
        items.push(makeUniqueArticle(mapArticle(rawItem, source), source, titleCounts));
        summary.outputArticle += 1;
        continue;
      }

      if (type === 'qa') {
        summary.sourceQa += 1;
        items.push(makeUniqueArticle(mapQaAsArticle(rawItem, source), source, titleCounts));
        summary.outputArticle += 1;
        continue;
      }

      if (type === 'task') {
        summary.sourceTask += 1;
        items.push(mapTask(rawItem, source));
        summary.outputTask += 1;
        continue;
      }

      if (type === 'scene') {
        summary.sourceScene += 1;
        items.push(mapScene(rawItem, source));
        summary.outputScene += 1;
      }
    }
  }

  return { items, summary };
}

function parseLooseJsonFile(filePath) {
  const rawText = fs.readFileSync(filePath, 'utf8');
  const sanitized = sanitizeLooseJsonText(rawText);
  try {
    const parsed = JSON.parse(sanitized);
    return extractEntryList(parsed, filePath);
  } catch (error) {
    const recovered = recoverEntriesFromTruncatedArray(sanitized);
    if (recovered.length) {
      console.warn(`[montessori-prepare] recovered_truncated_entries file=${filePath} count=${recovered.length}`);
      return recovered;
    }
    throw error;
  }
}

function extractEntryList(parsed, filePath) {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && Array.isArray(parsed.entries)) {
    return parsed.entries;
  }
  throw new Error(`知识库源文件既不是数组，也不包含 entries 数组: ${filePath}`);
}

function sanitizeLooseJsonText(text) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (!inString) {
      if (char === '"') {
        inString = true;
      }
      result += char;
      continue;
    }

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '"') {
      const nextToken = nextNonWhitespaceChar(text, index + 1);
      if (nextToken === ':' || nextToken === ',' || nextToken === '}' || nextToken === ']') {
        inString = false;
        result += char;
      } else {
        result += '\\"';
      }
      continue;
    }

    result += char;
  }

  return result;
}

function recoverEntriesFromTruncatedArray(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed.startsWith('[')) {
    return [];
  }

  const entries = [];
  let inString = false;
  let escaped = false;
  let bracketDepth = 0;
  let braceDepth = 0;
  let itemStart = -1;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === '\\') {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '[') {
      bracketDepth += 1;
      continue;
    }

    if (char === ']') {
      bracketDepth = Math.max(0, bracketDepth - 1);
      continue;
    }

    if (char === '{') {
      if (bracketDepth === 1 && braceDepth === 0) {
        itemStart = index;
      }
      braceDepth += 1;
      continue;
    }

    if (char === '}') {
      if (braceDepth > 0) {
        braceDepth -= 1;
      }
      if (bracketDepth === 1 && braceDepth === 0 && itemStart >= 0) {
        try {
          entries.push(JSON.parse(trimmed.slice(itemStart, index + 1)));
        } catch (error) {
          return entries;
        }
        itemStart = -1;
      }
    }
  }

  return entries;
}

function nextNonWhitespaceChar(text, startIndex) {
  for (let index = startIndex; index < text.length; index += 1) {
    const char = text[index];
    if (!/\s/.test(char)) {
      return char;
    }
  }
  return '';
}

function mapArticle(item, source) {
  const ageList = normalizeAgeList(item.age_groups || item.age_group || item.ageGroup);
  return {
    type: 'article',
    title: String(item.title || '').trim(),
    summary: withAgeHint(String(item.summary || '').trim(), ageList),
    content: appendMetaBlock(String(item.content || '').trim(), item, ageList),
    category: String(item.category || '').trim(),
    sub_category: String(item.sub_category || item.subCategory || '').trim(),
    age_group: normalizeArticleAgeGroup(ageList),
    tags: buildTagList(item, source, ageList),
    author: String(item.author || '蒙台梭利').trim(),
    evidence_level: String(item.evidence_level || item.evidenceLevel || 'expert').trim()
  };
}

function mapQaAsArticle(item, source) {
  const ageList = normalizeAgeList(item.age_groups || item.age_group || item.ageGroup);
  const question = String(item.question || '').trim();
  const answer = String(item.answer || '').trim();
  return {
    type: 'article',
    title: question,
    summary: withAgeHint(buildQaSummary(answer), ageList),
    content: appendMetaBlock(`问题：${question}\n\n回答：${answer}`, item, ageList),
    category: String(item.category || '').trim() || '育儿问答',
    sub_category: '蒙台梭利问答',
    age_group: normalizeArticleAgeGroup(ageList),
    tags: buildTagList(item, source, ageList, ['问答']),
    author: String(item.author || '蒙台梭利').trim(),
    evidence_level: String(item.evidence_level || item.evidenceLevel || 'expert').trim()
  };
}

function mapTask(item, source) {
  const ageList = normalizeAgeList(item.age_groups || item.age_group || item.ageGroup);
  const content = String(item.content || '').trim();
  const title = String(item.title || '').trim();
  return {
    type: 'task',
    task_code: String(item.id || title).trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_'),
    title,
    subject_code: inferSubjectCode(item),
    age_range: normalizeTaskAgeRange(ageList),
    difficulty: 1,
    duration: inferDuration(content),
    material: buildMaterial(item),
    objective: buildObjective(item),
    steps: splitTaskSteps(content),
    parent_prompt: buildParentPrompt(item),
    content: appendMetaBlock(content, item, ageList),
    tips: buildTaskTips(item, source, ageList),
    example_answer: ''
  };
}

function mapScene(item, source) {
  const ageList = normalizeAgeList(item.age_groups || item.age_group || item.ageGroup);
  const sceneKey = String(item.scene_key || item.sceneKey || item.id || item.title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_');
  const recommendationAgeGroup = normalizeArticleAgeGroup(ageList);
  return {
    type: 'scene',
    scene_key: sceneKey,
    scene_title: String(item.scene_title || item.sceneTitle || item.title || '').trim(),
    scene_category: String(item.scene_category || item.sceneCategory || item.category || '家庭场景').trim(),
    principle_text: String(item.principle_text || item.principleText || '').trim(),
    suggested_action: normalizeSceneSuggestedAction(item.suggested_action || item.suggestedAction),
    aliases: buildSceneAliases(item, source, ageList),
    recommendations: normalizeSceneRecommendations(item.recommendations, recommendationAgeGroup)
  };
}

function makeUniqueArticle(item, source, titleCounts) {
  const baseTitle = item.title;
  const count = titleCounts.get(baseTitle) || 0;
  if (count === 0) {
    titleCounts.set(baseTitle, 1);
    return item;
  }

  titleCounts.set(baseTitle, count + 1);
  return Object.assign({}, item, {
    title: `${baseTitle}（${source.label}）`
  });
}

function normalizeAgeList(value) {
  const list = Array.isArray(value) ? value : String(value || '').trim() ? [value] : [];
  return list.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeArticleAgeGroup(ageList) {
  return ageList.length === 1 && VALID_AGE_GROUPS.has(ageList[0]) ? ageList[0] : '';
}

function normalizeTaskAgeRange(ageList) {
  return ageList.length === 1 && VALID_AGE_GROUPS.has(ageList[0]) ? ageList[0] : '';
}

function withAgeHint(text, ageList) {
  const ageText = joinAgeList(ageList);
  if (!ageText) {
    return text;
  }
  return text ? `适用年龄：${ageText}。${text}` : `适用年龄：${ageText}。`;
}

function appendMetaBlock(content, item, ageList) {
  const parts = [content];
  const metaLines = [];
  const ageText = joinAgeList(ageList);
  if (ageText) {
    metaLines.push(`适用年龄：${ageText}`);
  }
  if (Array.isArray(item.scenes) && item.scenes.length) {
    metaLines.push(`适用场景：${item.scenes.join('、')}`);
  }
  if (item.source) {
    metaLines.push(`来源：${String(item.source).trim()}`);
  }
  if (metaLines.length) {
    parts.push(metaLines.join('\n'));
  }
  return parts.filter(Boolean).join('\n\n');
}

function buildTagList(item, source, ageList, extraTags) {
  const values = [];
  pushAll(values, item.tags);
  pushAll(values, item.scenes);
  pushAll(values, item.keywords);
  pushAll(values, ageList);
  pushAll(values, extraTags);
  values.push(source.label);
  return Array.from(new Set(values.map((entry) => String(entry || '').trim()).filter(Boolean)));
}

function buildQaSummary(answer) {
  const normalized = answer.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 64) {
    return normalized;
  }
  return normalized.slice(0, 64) + '...';
}

function inferSubjectCode(item) {
  const text = [item.category, item.sub_category, item.title, item.content, normalizeArrayText(item.tags), normalizeArrayText(item.keywords)]
    .filter(Boolean)
    .join(' ');

  if (/(语言|阅读|字母|书写|拼词|发音|词汇)/.test(text)) {
    return 'reading';
  }
  if (/(数学|数字|计数|加法|减法|逻辑|排序|认知)/.test(text)) {
    return 'logic';
  }
  return 'expression';
}

function inferDuration(content) {
  const match = String(content || '').match(/(\d+)\s*分钟/);
  if (!match) {
    return 10;
  }
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : 10;
}

function buildMaterial(item) {
  const category = String(item.category || '').trim();
  const scenes = Array.isArray(item.scenes) ? item.scenes.join('、') : '';
  return [category, scenes].filter(Boolean).join(' / ');
}

function buildObjective(item) {
  const category = String(item.category || '').trim();
  const title = String(item.title || '').trim();
  if (category && title) {
    return `围绕“${title}”完成一次${category}相关练习。`;
  }
  return title ? `围绕“${title}”完成一次可重复的家庭练习。` : '完成一次可重复的家庭练习。';
}

function splitTaskSteps(content) {
  const steps = String(content || '')
    .split(/(?:步骤：|操作步骤：|【步骤】)/)
    .pop()
    .split(/\d+\./)
    .map((item) => item.trim())
    .filter(Boolean);
  if (steps.length) {
    return steps;
  }
  return String(content || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function buildParentPrompt(item) {
  const scenes = Array.isArray(item.scenes) ? item.scenes.filter(Boolean) : [];
  if (scenes.length) {
    return `先在${scenes[0]}里陪孩子做第一步，再让孩子自己继续。`;
  }
  return '先陪孩子做第一步，等孩子进入状态后再退后观察。';
}

function buildTaskTips(item, source, ageList) {
  const tips = [];
  const ageText = joinAgeList(ageList);
  if (ageText) {
    tips.push(`原始适用年龄：${ageText}`);
  }
  if (item.source) {
    tips.push(`来源：${String(item.source).trim()}`);
  }
  tips.push(`知识库来源：${source.label}`);
  return tips;
}

function normalizeSceneSuggestedAction(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean).join('；');
  }
  return String(value || '').trim();
}

function buildSceneAliases(item, source, ageList) {
  const aliases = [];
  pushAll(aliases, item.aliases);
  pushAll(aliases, item.keywords);
  pushAll(aliases, ageList);
  aliases.push(source.label);
  return Array.from(new Set(aliases.map((entry) => String(entry || '').trim()).filter(Boolean))).slice(0, 20);
}

function normalizeSceneRecommendations(value, ageGroup) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((item) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      return {
        result_type: String(item.result_type || item.resultType || 'action').trim() || 'action',
        title: String(item.title || '').trim(),
        summary: String(item.summary || '').trim(),
        target_type: String(item.target_type || item.targetType || '').trim(),
        target_id: String(item.target_id || item.targetId || '').trim(),
        target_path: String(item.target_path || item.targetPath || '').trim(),
        age_group: String(item.age_group || item.ageGroup || ageGroup || '').trim()
      };
    }
    const title = String(item || '').trim();
    if (!title) {
      return null;
    }
    return {
      result_type: 'action',
      title,
      summary: '',
      target_type: '',
      target_id: '',
      target_path: '',
      age_group: ageGroup || ''
    };
  }).filter(Boolean);
}

function joinAgeList(ageList) {
  return Array.from(new Set(ageList)).join('、');
}

function normalizeArrayText(value) {
  if (!Array.isArray(value)) {
    return '';
  }
  return value.map((item) => String(item || '').trim()).filter(Boolean).join(' ');
}

function pushAll(target, value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      target.push(item);
    }
    return;
  }
  if (value) {
    target.push(value);
  }
}
