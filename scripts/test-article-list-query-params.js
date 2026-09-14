'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,
  '../miniprogram/pages/parenting/article-list/article-list.js'), 'utf8');
const childContext = require(path.join(__dirname, '../miniprogram/utils/child-context.js'));

function createPage() {
  const requests = [];
  const titles = [];
  let page;
  vm.runInNewContext(source, {
    getApp: () => ({
      buildParentingRecommendation: () => ({ ageGroup: '', label: '', fallback: '' }),
      shouldUseMockFallback: () => false,
      request: options => {
        requests.push({ params: options.data });
        return new Promise(() => {});
      },
      trackKbEvent: () => {}
    }),
    require: () => childContext,
    Page: definition => { page = definition; },
    wx: {
      setNavigationBarTitle: options => titles.push(options.title),
      showToast: () => {},
      navigateTo: () => {},
      stopPullDownRefresh: () => {}
    },
    Object, Promise, Array, String, Number, parseInt, decodeURIComponent
  }, { filename: 'article-list.js' });
  page.data = JSON.parse(JSON.stringify(page.data));
  page.setData = patch => Object.assign(page.data, patch);
  return { page, requests, titles };
}

// 合法分类：生效并作为筛选参数下发
{
  const { page, requests } = createPage();
  page.onLoad({ categoryId: '2' });
  assert.equal(page.data.currentCategory, 2, 'known categoryId should apply');
  assert.equal(requests[0].params.category, '\u884c\u4e3a\u4e60\u60ef',
    'known category should reach the filter');
}

// 越界分类：退回“全部”，不下发筛选
{
  const { page, requests } = createPage();
  page.onLoad({ categoryId: '99' });
  assert.equal(page.data.currentCategory, 0, 'out-of-range categoryId should fall back to all');
  assert.equal(requests[0].params.category, undefined, 'invalid category should not filter');
}

// 非数字与 0：退回“全部”
['abc', '0', '-1'].forEach(value => {
  const { page, requests } = createPage();
  page.onLoad({ categoryId: value });
  assert.equal(page.data.currentCategory, 0, `categoryId ${value} should fall back to all`);
  assert.equal(requests[0].params.category, undefined, `categoryId ${value} should not filter`);
});

// 合法关键词：解码后下发
{
  const { page, requests } = createPage();
  page.onLoad({ keyword: encodeURIComponent('\u7761\u7720') });
  assert.equal(page.data.keyword, '\u7761\u7720', 'encoded keyword should decode');
  assert.equal(requests[0].params.keyword, '\u7761\u7720', 'keyword should reach the filter');
}

// 畸形 query：不抛错，原样保留
{
  const { page, titles } = createPage();
  page.onLoad({ keyword: '%' });
  assert.equal(page.data.keyword, '%', 'malformed keyword should stay raw without throwing');

  const second = createPage();
  second.page.onLoad({ categoryName: '%' });
  assert.deepEqual(second.titles, ['%'], 'malformed categoryName should stay raw without throwing');
}

// 合法年龄：生效并下发
{
  const { page, requests } = createPage();
  page.onLoad({ age_group: encodeURIComponent('4-5\u5c81') });
  assert.equal(page.data.currentAge, 3, 'known age_group should apply');
  assert.equal(requests[0].params.age_group, '4-5\u5c81', 'age filter should reach the query');
}

// 畸形年龄：退回“全部”
{
  const { page } = createPage();
  page.onLoad({ age_group: '%' });
  assert.equal(page.data.currentAge, 0, 'malformed age_group should fall back to all');
}

console.log('Article list query param handling passed.');
