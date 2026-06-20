#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DEFAULT_SOURCES = [
  {
    file: '/workspace/.monkeycode-tmp-files/55fb277a-0到5岁：大脑发育关键期的70条养育法则（亲子图书明星译者玉冰继《正面管教》《你的N岁孩子》之后又一译作） (特雷西·卡其娄)-1.txt',
    label: '0到5岁大脑发育的黄金法则',
    title: '0到5岁：大脑发育关键期的70条养育法则',
    author: '特雷西·卡其娄',
    parser: 'zero_to_five',
    category: '大脑发育',
    subCategory: '0-5岁育儿法则',
    tags: ['0-5岁', '大脑发育', '育儿法则']
  },
  {
    file: '/workspace/.monkeycode-tmp-files/d7319f7d-被忽视的孩子如何克服童年的情感忽视 ( etc-2.txt',
    label: '被忽视的孩子',
    title: '被忽视的孩子：如何克服童年的情感忽视',
    author: '乔尼丝·韦布',
    parser: 'emotional_neglect',
    category: '情绪养育',
    subCategory: '情感忽视',
    tags: ['情感忽视', '自我修复', '家庭关系']
  },
  {
    file: '/workspace/.monkeycode-tmp-files/8398ef77-不老大脑：保持大脑年轻敏锐的科学方法 (东尼·博赞, 雷蒙德·基恩)-3.txt',
    label: '不老大脑',
    title: '不老大脑：保持大脑年轻敏锐的科学方法',
    author: '东尼·博赞',
    parser: 'ageless_brain',
    category: '认知健康',
    subCategory: '脑力训练',
    tags: ['认知健康', '脑力训练', '终身成长']
  },
  {
    file: '/workspace/.monkeycode-tmp-files/40c42c57-松弛养育：不控制的妈妈，不内耗的孩子 (沙法丽·萨巴瑞)-4.txt',
    label: '松弛养育',
    title: '松弛养育：不控制的妈妈，不内耗的孩子',
    author: '沙法丽·萨巴瑞',
    parser: 'guided_steps',
    category: '家庭教育',
    subCategory: '觉醒式养育',
    tags: ['松弛养育', '觉醒式养育', '亲子关系']
  },
  {
    file: '/workspace/.monkeycode-tmp-files/0afbd4c3-蒙台梭利教育精华：让孩子自信又独立 (夏洛特·普桑)-1.txt',
    label: '蒙台梭利教育精华',
    title: '蒙台梭利教育精华：让孩子自信又独立',
    author: '夏洛特·普桑',
    parser: 'generic',
    category: '家庭教育',
    subCategory: '蒙台梭利教育',
    tags: ['蒙台梭利', '独立成长', '家庭教育']
  },
  {
    file: '/workspace/.monkeycode-tmp-files/ee1a7ec4-游戏是孩子的功课：幻想游戏的重要性（幼儿园老师必备！中国教育报2018年度教师喜爱的图书 游戏是儿童生活得一部分。儿童通过游戏预言.txt',
    label: '游戏是孩子的功课',
    title: '游戏是孩子的功课：幻想游戏的重要性',
    author: '薇薇安·嘉辛·佩利',
    parser: 'generic',
    category: '家庭教育',
    subCategory: '游戏教育',
    tags: ['幻想游戏', '游戏教育', '幼儿发展']
  },
  {
    file: '/workspace/.monkeycode-tmp-files/9a85bac7-运动改造大脑 (约翰•瑞迪 (John Ratey), 埃里克•哈格曼 (Eric Hagerman))-3.txt',
    label: '运动改造大脑',
    title: '运动改造大脑',
    author: '约翰·瑞迪',
    parser: 'generic',
    category: '认知发展',
    subCategory: '运动与大脑',
    tags: ['运动改造大脑', '大脑发育', '运动认知']
  }
];

main();

function main() {
  const args = process.argv.slice(2);
  const outputArgIndex = args.findIndex((arg) => arg === '--output');
  const outputPath = outputArgIndex >= 0 && args[outputArgIndex + 1]
    ? path.resolve(process.cwd(), args[outputArgIndex + 1])
    : path.resolve(process.cwd(), 'examples/raw-text-knowledge-import.json');
  const sources = parseSourcesFromArgs(args);

  const result = buildImportPayload(sources);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(result.items, null, 2) + '\n', 'utf8');

  console.log(`[raw-text-prepare] output=${outputPath}`);
  console.log(`[raw-text-prepare] source_files=${sources.length}`);
  for (const item of result.perSource) {
    console.log(`[raw-text-prepare] source=${item.label} parser=${item.parser} articles=${item.articles}`);
  }
  console.log(`[raw-text-prepare] total_articles=${result.items.length}`);
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
    const [filePart, labelPart, parserPart, titlePart] = String(spec).split('::');
    const fallback = DEFAULT_SOURCES.find((item) => item.file === filePart || path.basename(item.file) === path.basename(filePart));
    if (!filePart) {
      throw new Error(`无效 source 参数: ${spec}`);
    }
    return Object.assign({}, fallback || {}, {
      file: path.resolve(process.cwd(), filePart),
      label: String(labelPart || fallback && fallback.label || path.basename(filePart, path.extname(filePart))).trim(),
      parser: String(parserPart || fallback && fallback.parser || 'zero_to_five').trim(),
      title: String(titlePart || fallback && fallback.title || '').trim() || String(labelPart || '').trim(),
      author: String(fallback && fallback.author || '').trim(),
      category: String(fallback && fallback.category || '家庭教育').trim(),
      subCategory: String(fallback && fallback.subCategory || '原始书稿导入').trim(),
      tags: Array.isArray(fallback && fallback.tags) ? fallback.tags.slice() : []
    });
  });
}

function buildImportPayload(sources) {
  const items = [];
  const perSource = [];
  const titleCounts = new Map();

  for (const source of sources) {
    const lines = readUsefulLines(source.file);
    const parsedArticles = parseSourceArticles(lines, source);
    perSource.push({
      label: source.label,
      parser: source.parser,
      articles: parsedArticles.length
    });

    for (const article of parsedArticles) {
      items.push(makeUniqueArticle(article, source, titleCounts));
    }
  }

  return { items, perSource };
}

function readUsefulLines(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
    .replace(/\r/g, '')
    .replace(/现在就赶紧做\s*[!！]/g, '现在就赶紧做!');
  return raw
    .split('\n')
    .map((line) => normalizeLine(line))
    .filter((line) => !isNoiseLine(line));
}

function parseSourceArticles(lines, source) {
  if (source.parser === 'zero_to_five') {
    return parseZeroToFive(lines, source);
  }
  if (source.parser === 'emotional_neglect') {
    return parseEmotionalNeglect(lines, source);
  }
  if (source.parser === 'ageless_brain') {
    return parseAgelessBrain(lines, source);
  }
  if (source.parser === 'generic') {
    return parseGeneric(lines, source);
  }
  if (source.parser === 'continuous') {
    return parseContinuous(lines, source);
  }
  if (source.parser === 'guided_steps') {
    return parseGuidedSteps(lines, source);
  }
  throw new Error(`未知 parser: ${source.parser}`);
}

function parseZeroToFive(lines, source) {
  const startIndex = findSecondNumberStart(lines, 1);
  const articles = [];
  let currentChapter = '';
  let pendingChapterOnly = '';
  let current = null;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    const chapterMatch = line.match(/^第(.{1,3})章\s*(.*)$/);
    if (chapterMatch) {
      currentChapter = cleanHeadingText(line);
      pendingChapterOnly = /第.{1,3}章$/.test(currentChapter) ? currentChapter : '';
      continue;
    }

    if (pendingChapterOnly && line.length <= 18 && !matchZeroToFiveRule(line)) {
      currentChapter = `${pendingChapterOnly} ${line}`.trim();
      pendingChapterOnly = '';
      continue;
    }
    pendingChapterOnly = '';

    const ruleMatch = matchZeroToFiveRule(line);
    if (ruleMatch) {
      pushArticle(articles, current, source);
      current = createArticleState({
        title: `${ruleMatch[1]} ${cleanHeadingText(ruleMatch[2])}`,
        chapter: currentChapter,
        tags: [ruleMatch[1], currentChapter]
      });
      continue;
    }

    appendContentLine(current, line);
  }

  pushArticle(articles, current, source);
  return articles;
}

function parseEmotionalNeglect(lines, source) {
  const startIndex = findSecondHeadingStart(lines, /^第\d+章\s*/);
  const articles = [];
  let currentPart = '';
  let currentChapter = '';
  let current = null;
  let expectedSubpointNumber = null;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    if (/^第[一二三四五六七八九十0-9]+部分/.test(line)) {
      currentPart = cleanHeadingText(line);
      continue;
    }

    if (/^第\d+章\s*/.test(line)) {
      pushArticle(articles, current, source);
      currentChapter = cleanHeadingText(line);
      expectedSubpointNumber = getExpectedSubpointStart(currentChapter);
      current = createArticleState({
        title: currentChapter,
        chapter: currentPart,
        tags: [currentPart]
      });
      continue;
    }

    if (/^类型\d+[：:].*/.test(line) || /^类型\d+$/.test(line)) {
      pushArticle(articles, current, source);
      expectedSubpointNumber = null;
      current = createArticleState({
        title: `${currentChapter} ${cleanHeadingText(line)}`.trim(),
        chapter: currentPart,
        tags: [currentChapter, currentPart]
      });
      continue;
    }

    if (isEmotionalNeglectSubheading(line, currentChapter, expectedSubpointNumber) || /^自我关怀第[一二三四五六七八九十]+部分/.test(line) || /^阻碍成功改变的因素$/.test(line) || /^研究$/.test(line) || /^治疗$/.test(line) || /^给治疗师的建议$/.test(line) || /^总结$/.test(line)) {
      pushArticle(articles, current, source);
      const numericMatch = line.match(/^(\d+)\./);
      if (numericMatch) {
        expectedSubpointNumber = Number(numericMatch[1]) + 1;
      }
      current = createArticleState({
        title: `${currentChapter} ${cleanHeadingText(line)}`.trim(),
        chapter: currentPart,
        tags: [currentChapter, currentPart]
      });
      continue;
    }

    appendContentLine(current, line);
  }

  pushArticle(articles, current, source);
  return articles;
}

function parseAgelessBrain(lines, source) {
  const startIndex = findFirstHeadingStart(lines, /^第一章$/);
  const articles = [];
  let current = null;
  let pendingChapter = '';

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line) {
      continue;
    }

    if (/^第[一二三四五六七八九十0-9]+章$/.test(line)) {
      pushArticle(articles, current, source);
      pendingChapter = line;
      current = null;
      continue;
    }

    if (pendingChapter && isShortHeading(line)) {
      current = createArticleState({
        title: `${pendingChapter} ${cleanHeadingText(line)}`.trim(),
        chapter: pendingChapter,
        tags: [pendingChapter]
      });
      pendingChapter = '';
      continue;
    }

    if (/^认识大脑｜/.test(line)) {
      pushArticle(articles, current, source);
      current = createArticleState({
        title: cleanHeadingText(line),
        chapter: pendingChapter || current && current.chapter || '',
        tags: [pendingChapter]
      });
      continue;
    }

    if (!current && pendingChapter) {
      current = createArticleState({
        title: pendingChapter,
        chapter: pendingChapter,
        tags: [pendingChapter]
      });
      pendingChapter = '';
    }

    appendContentLine(current, line);
  }

  pushArticle(articles, current, source);
  return articles;
}

function parseGeneric(lines, source) {
  const articles = [];
  let currentPart = "";
  let currentChapter = "";
  let current = null;

  const START_INDEX = findContentStart(lines);

  for (let index = START_INDEX; index < lines.length; index += 1) {
    const line = normalizeLine(lines[index]);
    if (!line || isNoiseLine(line)) {
      continue;
    }

    if (looksLikeTableOfContentsHeading(lines, index)) {
      continue;
    }

    const partMatch = line.match(/^第[一二三四五六七八九十百]+部分\s*(.*)$/);
    if (partMatch && line.length <= 30) {
      currentPart = cleanHeadingText(line);
      continue;
    }

    const numberedChapter = line.match(/^([1-9]|0[1-9]|[1-5]\d)\s+(.+)$/);
    const digitChapter = line.match(/^第(\d+)章\s*(.*)$/);
    const chineseChapter = line.match(/^第[一二三四五六七八九十百]+章\s*(.*)$/);

    if (numberedChapter && line.length <= 50) {
      pushArticle(articles, current, source);
      currentChapter = cleanHeadingText(line);
      current = createArticleState({
        title: currentChapter,
        chapter: currentPart ? currentPart + " / " + currentChapter : currentChapter,
        tags: [currentPart, currentChapter, numberedChapter[1]]
      });
      continue;
    }

    if (digitChapter && line.length <= 50) {
      pushArticle(articles, current, source);
      currentChapter = cleanHeadingText(line);
      current = createArticleState({
        title: currentChapter,
        chapter: currentPart ? currentPart + " / " + currentChapter : currentChapter,
        tags: [currentPart, currentChapter]
      });
      continue;
    }

    if (chineseChapter && line.length <= 40) {
      pushArticle(articles, current, source);
      currentChapter = cleanHeadingText(line);
      current = createArticleState({
        title: currentChapter,
        chapter: currentChapter,
        tags: [currentChapter]
      });
      continue;
    }

    if (isGenericSectionHeader(line, currentChapter)) {
      pushArticle(articles, current, source);
      currentChapter = cleanHeadingText(line);
      current = createArticleState({
        title: currentChapter,
        chapter: currentPart ? currentPart + " / " + currentChapter : currentChapter,
        tags: [currentChapter]
      });
      continue;
    }

    appendContentLine(current, line);
  }

  pushArticle(articles, current, source);
  return articles;
}

function parseContinuous(lines, source) {
  const articles = [];
  const START_INDEX = findContinuousContentStart(lines);
  const PARAGRAPHS_PER_ARTICLE = 20;
  const rawParagraphs = [];

  for (let i = START_INDEX; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) {
      continue;
    }
    rawParagraphs.push(line);
  }

  const totalGroups = Math.ceil(rawParagraphs.length / PARAGRAPHS_PER_ARTICLE);
  for (let group = 0; group < totalGroups; group += 1) {
    const groupStart = group * PARAGRAPHS_PER_ARTICLE;
    const groupEnd = Math.min(groupStart + PARAGRAPHS_PER_ARTICLE, rawParagraphs.length);
    const groupLines = rawParagraphs.slice(groupStart, groupEnd);
    if (!groupLines.length) {
      continue;
    }

    const firstMeaningful = groupLines.find((l) => l && l.length >= 4) || groupLines[0];
    const titleBase = firstMeaningful.length <= 40
      ? firstMeaningful
      : firstMeaningful.slice(0, 40).replace(/[，。！？；,\.]$/, '');

    const chapterLabel = totalGroups > 1 ? `第${group + 1}部分 / ${totalGroups}` : '';

    const current = createArticleState({
      title: titleBase,
      chapter: chapterLabel,
      tags: []
    });
    for (const line of groupLines) {
      appendContentLine(current, line);
    }
    pushArticle(articles, current, source);
  }

  return articles;
}

function parseGuidedSteps(lines, source) {
  const articles = [];
  const startIndex = findFirstHeadingStart(lines, /^(前言|引言)$/);
  let currentStage = '';
  let pendingHeading = null;
  let current = null;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = normalizeLine(lines[index]);
    if (!line || isNoiseLine(line)) {
      continue;
    }

    if (pendingHeading && isRelaxedParentingSubheading(line)) {
      const title = `${pendingHeading} ${cleanHeadingText(line)}`.trim();
      pendingHeading = null;
      if (current) {
        current.title = title;
        current.chapter = currentStage ? `${currentStage} / ${title}` : title;
        current.tags = Array.from(new Set([...(current.tags || []), currentStage, title].filter(Boolean)));
      }
      continue;
    }
    pendingHeading = null;

    if (/^(前言|引言|结语|后记|附录)$/.test(line)) {
      pushArticle(articles, current, source);
      current = createArticleState({
        title: cleanHeadingText(line),
        chapter: cleanHeadingText(line),
        tags: [line]
      });
      if (line !== '前言' && line !== '引言') {
        currentStage = '';
      }
      pendingHeading = line;
      continue;
    }

    if (/^第[一二三四五六七八九十]+阶段$/.test(line)) {
      pushArticle(articles, current, source);
      currentStage = cleanHeadingText(line);
      current = createArticleState({
        title: currentStage,
        chapter: currentStage,
        tags: [currentStage]
      });
      pendingHeading = currentStage;
      continue;
    }

    const stepInline = line.match(/^(第\d+步)[：: ]?(.+)?$/);
    if (stepInline) {
      pushArticle(articles, current, source);
      const step = cleanHeadingText(stepInline[1]);
      const subtitle = cleanHeadingText(stepInline[2] || '');
      const title = subtitle ? `${step} ${subtitle}` : step;
      current = createArticleState({
        title,
        chapter: currentStage ? `${currentStage} / ${title}` : title,
        tags: [currentStage, step, subtitle]
      });
      if (!subtitle) {
        pendingHeading = step;
      }
      continue;
    }

    appendContentLine(current, line);
  }

  pushArticle(articles, current, source);
  return articles;
}

function findContinuousContentStart(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    const line = normalizeLine(String(lines[i] || ''));
    if (line && line.length > 60 &&
        !/^(ISBN|图书在版|版权|出版|定价|印张|字数|开本|版次|印次|书号|策划编辑|责任编辑|装帧设计|责任|服务热线|销售热线|地址邮编|网址|http|E-mail|COPYRIGHT|致谢|书名|作者|译者|出版社)/.test(line)) {
      return i;
    }
  }
  return 0;
}

function findContentStart(lines) {
  for (let i = 0; i < lines.length; i += 1) {
    const line = normalizeLine(lines[i]);
    if (!isPotentialContentStartHeading(line)) {
      continue;
    }
    if (looksLikeActualSectionStart(lines, i)) {
      return i;
    }
  }

  let tocEnd = 0;
  let chapterCount = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = normalizeLine(lines[i]);
    if (/^第[一二三四五六七八九十百\d]+章/.test(line) ||
        /^第[一二三四五六七八九十百]+部分/.test(line) ||
        /^([1-9]|0[1-9]|[1-5]\d)\s+\S/.test(line)) {
      chapterCount += 1;
      tocEnd = i;
    }
    if (chapterCount >= 2 && i > tocEnd + 10 && line && line.length > 30) {
      return tocEnd;
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = normalizeLine(lines[i]);
    if (line && line.length > 60 && !/^(ISBN|图书在版|版权|出版|定价|印张|字数|开本|版次|印次|书号|策划编辑|责任编辑|装帧设计|责任|服务热线|销售热线|地址邮编|网址|http|E-mail)/.test(line)) {
      return i;
    }
  }

  return 0;
}

function isPotentialContentStartHeading(line) {
  if (!line) {
    return false;
  }
  return /^第[一二三四五六七八九十百\d]+章/.test(line) ||
    /^第[一二三四五六七八九十百]+部分/.test(line) ||
    /^([1-9]|0[1-9]|[1-5]\d)\s+\S/.test(line) ||
    /^(总序|推荐序[一二三四五六七八九十]?|中文版序|序章|前言|引言|导言|结语|后记|代后记|附录)/.test(line);
}

function looksLikeActualSectionStart(lines, startIndex) {
  let paragraphLikeCount = 0;
  let headingLikeCount = 0;
  for (let i = startIndex + 1; i < Math.min(lines.length, startIndex + 18); i += 1) {
    const line = normalizeLine(lines[i]);
    if (!line) {
      continue;
    }
    if (isPotentialContentStartHeading(line) || /^Contents$/i.test(line)) {
      headingLikeCount += 1;
      continue;
    }
    if (line.length >= 18) {
      paragraphLikeCount += 1;
    }
  }
  return paragraphLikeCount >= 4 && headingLikeCount <= 3;
}

function looksLikeTableOfContentsHeading(lines, startIndex) {
  const startLine = normalizeLine(lines[startIndex]);
  if (!isPotentialContentStartHeading(startLine)) {
    return false;
  }

  let headingLikeCount = 0;
  let paragraphLikeCount = 0;
  for (let i = startIndex; i < Math.min(lines.length, startIndex + 14); i += 1) {
    const line = normalizeLine(lines[i]);
    if (!line) {
      continue;
    }
    if (isPotentialContentStartHeading(line) || /^Contents$/i.test(line)) {
      headingLikeCount += 1;
      continue;
    }
    if (line.length >= 18) {
      paragraphLikeCount += 1;
    }
  }

  return headingLikeCount >= 4 && paragraphLikeCount <= 2;
}

function isGenericSectionHeader(line, currentChapter) {
  if (!line || line.length > 40) return false;
  if (/[。！？，、；：""（）《》]/.test(line)) return false;
  if (currentChapter && line === currentChapter) return false;
  if (/^([1-9]|0[1-9]|[1-5]\d)\s+\S/.test(line)) return false;
  if (/^第[一二三四五六七八九十百]+[章节部分]/.test(line)) return false;
  if (/^(总序|推荐序[一二三四五六七八九十]?|中文版序|序章|前言|引言|导言|结语|后记|代后记|附录)/.test(line)) return true;
  return false;
}

function isRelaxedParentingSubheading(line) {
  if (!line) {
    return false;
  }
  if (line.length > 26) {
    return false;
  }
  if (/[。！？；：]/.test(line)) {
    return false;
  }
  if (/^(第\d+步|第[一二三四五六七八九十]+阶段|前言|引言|结语|后记|附录)$/.test(line)) {
    return false;
  }
  return true;
}

function createArticleState(meta) {
  return {
    title: String(meta.title || '').trim(),
    chapter: String(meta.chapter || '').trim(),
    tags: Array.isArray(meta.tags) ? meta.tags.slice() : [],
    lines: []
  };
}

function appendContentLine(article, line) {
  if (!article) {
    return;
  }
  const cleaned = cleanContentLine(line);
  if (!cleaned) {
    return;
  }
  article.lines.push(cleaned);
}

function pushArticle(target, article, source) {
  if (!article || !article.title) {
    return;
  }
  const chunks = chunkArticle(article, source);
  for (const chunk of chunks) {
    target.push({
      type: 'article',
      title: chunk.title,
      summary: buildSummary(chunk.content),
      content: appendMetaBlock(chunk.content, source, article),
      category: source.category,
      sub_category: article.chapter || source.subCategory,
      age_group: '',
      tags: buildTags(source, article),
      author: source.author || source.label,
      evidence_level: 'expert'
    });
  }
}

function chunkArticle(article, source) {
  const chunkLimit = getChunkLimit(source.parser);
  const paragraphs = splitIntoParagraphs(article.lines, source.parser);
  const chunks = [];
  let buffer = [];
  let bufferLength = 0;

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      continue;
    }

    if (paragraph.length > chunkLimit) {
      flushChunk(chunks, article.title, buffer, source.parser);
      buffer = [];
      bufferLength = 0;
      const oversizedParts = splitOversizedParagraph(paragraph, chunkLimit);
      for (const part of oversizedParts) {
        chunks.push(part.trim());
      }
      continue;
    }

    if (buffer.length && bufferLength + paragraph.length > chunkLimit) {
      flushChunk(chunks, article.title, buffer, source.parser);
      buffer = [];
      bufferLength = 0;
    }

    buffer.push(paragraph);
    bufferLength += paragraph.length;
  }

  flushChunk(chunks, article.title, buffer, source.parser);

  if (!chunks.length) {
    const fallback = finalizeContent(article.lines);
    return fallback && fallback.length >= 80 ? [{ title: article.title, content: fallback }] : [];
  }

  return chunks
    .map((content, index) => ({
      title: buildChunkTitle(article.title, content, index, chunks.length),
      content: String(content || '').trim()
    }))
    .filter((item) => item.content.length >= 80);
}

function flushChunk(chunks, baseTitle, buffer) {
  if (!buffer.length) {
    return;
  }
  const content = buffer.join('\n\n').trim();
  if (content) {
    chunks.push(content);
  }
}

function splitIntoParagraphs(lines, parser) {
  const paragraphs = [];
  let buffer = [];

  for (const originalLine of lines) {
    const splitLines = splitLineByMarkers(originalLine, parser);
    for (const line of splitLines) {
      const text = String(line || '').trim();
      if (!text) {
        continue;
      }

      if (isStandaloneMarker(text, parser)) {
        flushParagraph(paragraphs, buffer);
        paragraphs.push(text);
        continue;
      }

      buffer.push(text);
      if (/[。！？；]$/.test(text)) {
        flushParagraph(paragraphs, buffer);
      }
    }
  }

  flushParagraph(paragraphs, buffer);
  return paragraphs.filter(Boolean);
}

function flushParagraph(paragraphs, buffer) {
  if (!buffer.length) {
    return;
  }
  const paragraph = buffer.join('').trim();
  if (paragraph) {
    paragraphs.push(paragraph);
  }
  buffer.length = 0;
}

function splitLineByMarkers(line, parser) {
  const markers = getSplitMarkers(parser);
  if (!markers.length) {
    return [line];
  }
  let parts = [String(line || '')];
  for (const marker of markers) {
    const next = [];
    for (const part of parts) {
      if (isStandaloneMarker(part, parser)) {
        next.push(part);
        continue;
      }
      next.push(...splitTextByMarker(part, marker));
    }
    parts = next;
  }
  return parts.map((item) => item.trim()).filter(Boolean);
}

function splitTextByMarker(text, marker) {
  const value = String(text || '');
  const result = [];
  let start = 0;
  let index = value.indexOf(marker, start);
  while (index >= 0) {
    if (index > start) {
      result.push(value.slice(start, index));
    }
    result.push(marker);
    start = index + marker.length;
    index = value.indexOf(marker, start);
  }
  if (start < value.length) {
    result.push(value.slice(start));
  }
  return result.length ? result : [value];
}

function isStandaloneMarker(text, parser) {
  return getStandaloneMarkers(parser).includes(text);
}

function getSplitMarkers(parser) {
  if (parser === 'zero_to_five') {
    return ['现在就赶紧做!', '研究报告这么说', '现在就赶紧做', '请你试试看', '该如何做好防备', '何时应该寻求帮助', '认真想一想', '三班倒:早班、中班和晚班', '家务分摊表'];
  }
  if (parser === 'emotional_neglect') {
    return ['标志和信号', '传统健康父母的行为', '给治疗师的建议', '自我关怀第一部分', '自我关怀第二部分', '自我关怀第三部分', '自我关怀第四部分'];
  }
  if (parser === 'ageless_brain') {
    return ['我该怎么做?', '掌控自己的寿命、身体和认知健康', '实现心智技能的飞跃'];
  }
  return [];
}

function getStandaloneMarkers(parser) {
  return getSplitMarkers(parser);
}

function splitOversizedParagraph(paragraph, chunkLimit) {
  const sentences = splitIntoSentences(paragraph);
  const chunks = [];
  let buffer = '';

  for (const sentence of sentences) {
    if (!sentence) {
      continue;
    }

    if (sentence.length > chunkLimit) {
      if (buffer) {
        chunks.push(buffer.trim());
        buffer = '';
      }
      chunks.push(...splitLongSentence(sentence, chunkLimit));
      continue;
    }

    if (buffer && buffer.length + sentence.length > chunkLimit) {
      chunks.push(buffer.trim());
      buffer = sentence;
      continue;
    }

    buffer += sentence;
  }

  if (buffer) {
    chunks.push(buffer.trim());
  }

  return chunks.filter(Boolean);
}

function splitIntoSentences(text) {
  return String(text || '')
    .split(/(?<=[。！？；])/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitLongSentence(sentence, chunkLimit) {
  const parts = [];
  let start = 0;
  while (start < sentence.length) {
    parts.push(sentence.slice(start, start + chunkLimit));
    start += chunkLimit;
  }
  return parts;
}

function getChunkLimit(parser) {
  if (parser === 'zero_to_five') {
    return 1100;
  }
  if (parser === 'emotional_neglect') {
    return 1300;
  }
  if (parser === 'ageless_brain') {
    return 1500;
  }
  if (parser === 'continuous') {
    return 1200;
  }
  if (parser === 'guided_steps') {
    return 1000;
  }
  return 1200;
}

function buildChunkTitle(baseTitle, content, index, total) {
  if (total <= 1) {
    return baseTitle;
  }
  const firstLine = String(content || '').split('\n')[0].trim();
  if (firstLine && firstLine.length <= 18 && !/[。！？]/.test(firstLine)) {
    return `${baseTitle} - ${firstLine}`;
  }
  const firstSentence = String(content || '')
    .split(/[。！？；]/)[0]
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 18)
    .replace(/[，,：:、]$/, '');
  if (firstSentence && firstSentence !== baseTitle) {
    return `${baseTitle} - ${firstSentence}`;
  }
  return `${baseTitle}（片段${index + 1}）`;
}

function appendMetaBlock(content, source, article) {
  const lines = [`来源：${source.label}`];
  if (article.chapter) {
    lines.push(`章节：${article.chapter}`);
  }
  return `${content}\n\n${lines.join('\n')}`;
}

function buildTags(source, article) {
  const tags = [];
  pushIfPresent(tags, source.label);
  pushIfPresent(tags, source.title);
  for (const value of source.tags || []) {
    pushIfPresent(tags, value);
  }
  for (const value of article.tags || []) {
    pushIfPresent(tags, value);
  }
  return Array.from(new Set(tags));
}

function pushIfPresent(target, value) {
  const text = String(value || '').trim();
  if (text) {
    target.push(text);
  }
}

function finalizeContent(lines) {
  return lines
    .join('')
    .replace(/([。！？；：])(?=[^\n])/g, '$1\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildSummary(content) {
  const flattened = content.replace(/\s+/g, ' ').trim();
  if (flattened.length <= 80) {
    return flattened;
  }
  return `${flattened.slice(0, 80)}...`;
}

function matchZeroToFiveRule(line) {
  return line.match(/^(\d{1,2})\s+(.+)$/);
}

function isEmotionalNeglectSubheading(line, currentChapter, expectedSubpointNumber) {
  const numericMatch = line.match(/^(\d+)\./);
  if (!numericMatch) {
    return false;
  }
  if (expectedSubpointNumber == null) {
    return false;
  }
  if (line.length > 40) {
    return false;
  }
  return Number(numericMatch[1]) === expectedSubpointNumber;
}

function getExpectedSubpointStart(currentChapter) {
  if (/^第3章 /.test(currentChapter)) {
    return 1;
  }
  if (/^第6章 /.test(currentChapter)) {
    return 1;
  }
  if (/^第8章 /.test(currentChapter)) {
    return 1;
  }
  return null;
}

function findSecondNumberStart(lines, targetNumber) {
  let seen = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = matchZeroToFiveRule(lines[index]);
    if (!match) {
      continue;
    }
    if (Number(match[1]) === targetNumber) {
      seen += 1;
      if (seen === 2) {
        return index;
      }
    }
  }
  return lines.findIndex((line) => matchZeroToFiveRule(line));
}

function findSecondHeadingStart(lines, pattern) {
  let seen = 0;
  for (let index = 0; index < lines.length; index += 1) {
    if (!pattern.test(lines[index])) {
      continue;
    }
    seen += 1;
    if (seen === 2) {
      return index;
    }
  }
  return findFirstHeadingStart(lines, pattern);
}

function findFirstHeadingStart(lines, pattern) {
  const index = lines.findIndex((line) => pattern.test(line));
  return index >= 0 ? index : 0;
}

function isShortHeading(line) {
  return line.length <= 24 && !/[。！？]/.test(line) && !/^认识大脑｜/.test(line);
}

function cleanHeadingText(text) {
  return String(text || '')
    .replace(/[°•◌]+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanContentLine(text) {
  return String(text || '')
    .replace(/[°◌]+/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/(?:目录\s*Contents|Table of Contents|目录$).*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLine(text) {
  return String(text || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function isNoiseLine(line) {
  if (!line) {
    return false;
  }
  return [
    /欢迎\+V[:：]?songshutaoshu/i,
    /进信息精选付费群/,
    /^ISBN[:：]?/i,
    /^客服热线[:：]?/,
    /^客服信箱[:：]?/,
    /^官方网址[:：]?/,
    /^版权所有/,
    /^版权信息$/,
    /^COPYRIGHT$/,
    /^纠错热线[:：]?/,
    /^中国版本图书馆CIP/,
    /^北京市版权局/,
    /^本书纸版由/,
    /^电子版由/,
    /^字数[:：]?/,
    /^出版社[:：]?/,
    /^出版时间[:：]?/,
    /^作 者$/,
    /^译 者$/
  ].some((pattern) => pattern.test(line));
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
