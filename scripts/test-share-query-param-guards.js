'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function readPage(relativePath) {
  return fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');
}

const childContext = require(path.join(__dirname, '../miniprogram/utils/child-context.js'));

function createArticleListPage() {
  const source = readPage('miniprogram/pages/parenting/article-list/article-list.js');
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

function testArticleList() {
  // 合法分类：生效并作为筛选参数下发
  {
    const { page, requests } = createArticleListPage();
    page.onLoad({ categoryId: '2' });
    assert.equal(page.data.currentCategory, 2, 'known categoryId should apply');
    assert.equal(requests[0].params.category, '\u884c\u4e3a\u4e60\u60ef',
      'known category should reach the filter');
  }

  // 越界分类：退回“全部”，不下发筛选
  {
    const { page, requests } = createArticleListPage();
    page.onLoad({ categoryId: '99' });
    assert.equal(page.data.currentCategory, 0, 'out-of-range categoryId should fall back to all');
    assert.equal(requests[0].params.category, undefined, 'invalid category should not filter');
  }

  // 非数字与 0：退回“全部”
  ['abc', '0', '-1'].forEach(value => {
    const { page, requests } = createArticleListPage();
    page.onLoad({ categoryId: value });
    assert.equal(page.data.currentCategory, 0, `categoryId ${value} should fall back to all`);
    assert.equal(requests[0].params.category, undefined, `categoryId ${value} should not filter`);
  });

  // 合法关键词：解码后下发
  {
    const { page, requests } = createArticleListPage();
    page.onLoad({ keyword: encodeURIComponent('\u7761\u7720') });
    assert.equal(page.data.keyword, '\u7761\u7720', 'encoded keyword should decode');
    assert.equal(requests[0].params.keyword, '\u7761\u7720', 'keyword should reach the filter');
  }

  // 畸形 query：不抛错，原样保留
  {
    const { page } = createArticleListPage();
    page.onLoad({ keyword: '%' });
    assert.equal(page.data.keyword, '%', 'malformed keyword should stay raw without throwing');

    const second = createArticleListPage();
    second.page.onLoad({ categoryName: '%' });
    assert.deepEqual(second.titles, ['%'], 'malformed categoryName should stay raw without throwing');
  }

  // 合法年龄：生效并下发
  {
    const { page, requests } = createArticleListPage();
    page.onLoad({ age_group: encodeURIComponent('4-5\u5c81') });
    assert.equal(page.data.currentAge, 3, 'known age_group should apply');
    assert.equal(requests[0].params.age_group, '4-5\u5c81', 'age filter should reach the query');
  }

  // 畸形年龄：退回“全部”
  {
    const { page } = createArticleListPage();
    page.onLoad({ age_group: '%' });
    assert.equal(page.data.currentAge, 0, 'malformed age_group should fall back to all');
  }
}

function createRecipeListPage() {
  const source = readPage('miniprogram/pages/nutrition/recipe-list/recipe-list.js');
  const requests = [];
  let page;
  vm.runInNewContext(source, {
    getApp: () => ({
      getCurrentChild: () => null,
      inferNutritionAgeGroup: () => '',
      shouldUseMockFallback: () => false,
      request: options => {
        requests.push({ params: options.data });
        return new Promise(() => {});
      },
      trackKbEvent: () => {}
    }),
    require: () => ({}),
    Page: definition => { page = definition; },
    wx: {
      setNavigationBarTitle: () => {},
      showToast: () => {},
      stopPullDownRefresh: () => {},
      getStorageSync: () => ''
    },
    Object, Promise, Array, String, Number, parseInt, decodeURIComponent
  }, { filename: 'recipe-list.js' });
  page.data = JSON.parse(JSON.stringify(page.data));
  page.setData = patch => Object.assign(page.data, patch);
  return { page, requests };
}

function testRecipeList() {
  // 合法分类：生效并下发
  {
    const { page, requests } = createRecipeListPage();
    page.onLoad({ categoryId: '2' });
    assert.equal(page.data.currentCategory, 2, 'known recipe categoryId should apply');
    assert.equal(requests[0].params.category, '\u5348\u9910',
      'known recipe category should reach the filter');
  }

  // 越界与非数字：退回“全部”
  ['99', 'abc'].forEach(value => {
    const { page, requests } = createRecipeListPage();
    page.onLoad({ categoryId: value });
    assert.equal(page.data.currentCategory, 0, `recipe categoryId ${value} should fall back to all`);
    assert.equal(requests[0].params.category, undefined, `recipe categoryId ${value} should not filter`);
  });

  // 合法关键词：解码后下发
  {
    const { page, requests } = createRecipeListPage();
    page.onLoad({ keyword: encodeURIComponent('\u65e9\u9910') });
    assert.equal(page.data.keyword, '\u65e9\u9910', 'encoded recipe keyword should decode');
    assert.equal(requests[0].params.keyword, '\u65e9\u9910', 'recipe keyword should reach the filter');
  }

  // 畸形 query：不抛错
  {
    const { page } = createRecipeListPage();
    page.onLoad({ keyword: '%' });
    assert.equal(page.data.keyword, '%', 'malformed recipe keyword should stay raw');
  }
  {
    const { page } = createRecipeListPage();
    page.onLoad({ age_group: '%' });
    assert.equal(page.data.currentAge, 0, 'malformed recipe age_group should fall back to all');
  }
}

function testDevelopmentDetail() {
  const modulePath = path.resolve(__dirname, '../miniprogram/pages/development/detail/detail.js');
  let detailPage = null;
  global.getApp = () => ({ getCurrentChild: () => null });
  global.Page = definition => { detailPage = definition; };
  global.wx = {
    navigateTo: () => {},
    setNavigationBarTitle: () => {},
    setStorageSync: () => {},
    showToast: () => {},
    switchTab: () => {}
  };
  delete require.cache[require.resolve(modulePath)];
  require(modulePath);
  detailPage.setData = patch => Object.assign(detailPage.data, patch);

  let captured = null;
  detailPage.loadPainPoint = key => { captured = key; };
  detailPage.onLoad({ painPointKey: encodeURIComponent('sleep_resistance') });
  assert.equal(captured, 'sleep_resistance', 'encoded pain point key should decode');

  captured = null;
  detailPage.onLoad({ painPointKey: '%' });
  assert.equal(captured, '%', 'malformed pain point key should stay raw without throwing');
}

testArticleList();
testRecipeList();
testDevelopmentDetail();

console.log('Share query param guards passed.');
