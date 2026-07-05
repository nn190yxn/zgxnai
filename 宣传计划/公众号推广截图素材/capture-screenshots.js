const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..', '..');
const outputDir = path.join(root, '宣传计划', '公众号推广截图素材', 'screenshots');
const baseUrl = 'http://127.0.0.1:8000/';

const pages = [
  ['01-home', '首页总览', '宣传计划/pages/01-home.html'],
  ['02-ai-chat', '小牛问答页', '宣传计划/pages/02-ai-chat.html'],
  ['03-assessment', '成长观察页', '宣传计划/pages/03-assessment.html'],
  ['04-daily-training', '每日训练页', '宣传计划/pages/04-daily-training.html'],
  ['05-nutrition', '营养中心页', '宣传计划/pages/05-nutrition.html'],
  ['06-parenting', '育儿知识页', '宣传计划/pages/06-parenting.html'],
  ['07-growth-record', '成长记录页', '宣传计划/pages/07-growth-record.html'],
  ['08-weekly-summary', '周总结页', '宣传计划/pages/08-weekly-summary.html'],
  ['09-membership', '会员页', '宣传计划/pages/09-membership.html'],
  ['10-profile', '个人中心页', '宣传计划/pages/10-profile.html'],
  ['11-quick-tips', '快问快答提示页', '宣传计划/pages/quick-tips.html'],
  ['12-weekly-report', '周报详情页', '宣传计划/pages/weekly-report.html'],
  ['13-ai-chat-demo', '小牛问答演示页', '宣传计划/pages/ai-chat-demo.html'],
  ['14-parenting-article', '育儿文章详情页', '宣传计划/pages/parenting-article.html'],
  ['15-daily-quote', '每日金句页', '宣传计划/pages/daily-quote.html'],
  ['16-assessment-result', '观察结果页', '宣传计划/pages/assessment-result.html'],
  ['17-growth-trend', '成长趋势页', '宣传计划/pages/growth-trend.html'],
  ['18-meal-recipe', '食谱详情页', '宣传计划/pages/meal-recipe.html'],
  ['19-training-exercise', '训练练习页', '宣传计划/pages/training-exercise.html'],
  ['20-social-cover', '社交传播封面页', '宣传计划/pages/social-cover.html']
];

function pageUrl(relativePath) {
  return baseUrl + encodeURI(relativePath);
}

(async function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true
  });

  const manifest = [];
  for (const item of pages) {
    const [id, title, relativePath] = item;
    const outputName = id + '.png';
    const outputPath = path.join(outputDir, outputName);
    await page.goto(pageUrl(relativePath), { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: outputPath, fullPage: true });
    manifest.push({ id, title, source: relativePath, file: 'screenshots/' + outputName });
    console.log(outputName + ' ' + title);
  }

  await browser.close();
  fs.writeFileSync(
    path.join(root, '宣传计划', '公众号推广截图素材', 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
})();
