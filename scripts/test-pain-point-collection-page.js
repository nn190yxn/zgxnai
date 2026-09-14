'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,
  '../miniprogram/pages/parenting/pain-point-collection/index.js'), 'utf8');

const TAGS = [
  { key: 'called_no_response', label: '叫了几次像没听见', category: '做事与学习' },
  { key: 'distracted_during_task', label: '做事容易分心', category: '做事与学习' },
  { key: 'cries_when_switching', label: '换活动就哭闹', category: '情绪与配合' }
];

function createPage(options) {
  const requests = [];
  const events = { toasts: [], navigations: [], stops: 0, tracks: [] };
  let page;
  const app = {
    request: requestOptions => new Promise((resolve, reject) => {
      requests.push({ url: requestOptions.url, params: requestOptions.data || {}, resolve, reject });
    }),
    trackKbEvent: payload => events.tracks.push(payload),
    getApiErrorMessage: (error, fallback) => (error && error.message) || fallback,
    buildShareTitle: () => '家长痛点合集'
  };
  vm.runInNewContext(source, {
    getApp: () => app,
    require: name => {
      assert.equal(name, '../../../utils/app-config.js');
      return { isFeatureEnabled: () => options && options.enabled === false ? false : true };
    },
    Page: definition => { page = definition; },
    wx: {
      showToast: toastOptions => events.toasts.push(toastOptions.title),
      stopPullDownRefresh: () => { events.stops += 1; },
      navigateTo: navOptions => events.navigations.push(navOptions.url)
    },
    Object,
    Promise,
    Array,
    String,
    Number
  }, { filename: 'pain-point-collection.js' });
  page.data = JSON.parse(JSON.stringify(page.data));
  page.setData = patch => Object.assign(page.data, patch);
  page.onLoad((options && options.query) || {});
  return { page, requests, events };
}

async function settle(request, outcome, payload) {
  if (outcome === 'failure') {
    request.reject(new Error('Controlled failure'));
  } else {
    request.resolve(payload || {});
  }
  await new Promise(resolve => setImmediate(resolve));
}

async function loadFirstPage(context, options) {
  await settle(context.requests[0], 'success', { list: TAGS });
  await settle(context.requests[1], 'success', Object.assign({
    list: [{ id: 1, title: 'first', category: '行为习惯' }],
    pagination: { page: 1, page_size: 10, hasMore: true }
  }, (options && options.articles) || {}));
}

async function main() {
  {
    const context = createPage();
    const { page, requests } = context;
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, '/pain-point-tags');
    await settle(requests[0], 'success', { list: TAGS });
    assert.equal(requests.length, 2);
    assert.equal(requests[1].url, '/parenting/articles');
    assert.equal(requests[1].params.pain_point_key, 'called_no_response');
    assert.equal(requests[1].params.page, 1);
    await settle(requests[1], 'success', {
      list: [{ id: 1 }, { id: 2 }],
      pagination: { page: 1, hasMore: true }
    });
    assert.equal(page.data.activeTagKey, 'called_no_response');
    assert.equal(page.data.activeTagLabel, '叫了几次像没听见');
    assert.equal(page.data.articles.length, 2);
    assert.equal(page.data.loadState, 'ready');
    assert.equal(page.data.page, 2);
    assert.equal(page.data.hasMore, true);
    assert.ok(context.events.tracks.some(item => item.event_type === 'pain_point_collection_view'));
  }

  {
    const context = createPage({ query: { painPointKey: 'cries_when_switching' } });
    await settle(context.requests[0], 'success', { list: TAGS });
    assert.equal(context.requests[1].params.pain_point_key, 'cries_when_switching');
    assert.equal(context.page.data.activeTagKey, 'cries_when_switching');
    await settle(context.requests[1], 'success', { list: [], pagination: { page: 1, hasMore: false } });
    assert.equal(context.page.data.loadState, 'empty');
    assert.equal(context.page.data.hasMore, false);
  }

  {
    const context = createPage({ query: { painPointKey: 'unknown_tag' } });
    await settle(context.requests[0], 'success', { list: TAGS });
    assert.equal(context.requests[1].params.pain_point_key, 'called_no_response', 'invalid tag falls back to the first tag');
    await settle(context.requests[1], 'success', { list: [{ id: 1 }], pagination: { hasMore: true } });
    context.page.onTagTap({ currentTarget: { dataset: { key: 'distracted_during_task' } } });
    assert.equal(context.requests.length, 3);
    assert.equal(context.requests[2].params.pain_point_key, 'distracted_during_task');
    assert.equal(context.requests[2].params.page, 1, 'switching tag resets pagination');
    assert.equal(context.page.data.articles.length, 0);
    await settle(context.requests[2], 'success', { list: [{ id: 9 }], pagination: { hasMore: true } });
    assert.equal(context.page.data.articles[0].id, 9);
    assert.ok(context.events.tracks.some(item => item.event_type === 'pain_point_tag_click'));
  }

  {
    const context = createPage();
    await loadFirstPage(context);
    context.page.onReachBottom();
    assert.equal(context.requests.length, 3);
    assert.equal(context.requests[2].params.page, 2);
    await settle(context.requests[2], 'success', { list: [{ id: 2 }], pagination: { hasMore: false } });
    assert.equal(context.page.data.articles.map(item => item.id).join(','), '1,2');
    assert.equal(context.page.data.hasMore, false);
    context.page.onReachBottom();
    assert.equal(context.requests.length, 3, 'exhausted list ignores further pagination');
  }

  {
    const context = createPage();
    await settle(context.requests[0], 'failure');
    assert.equal(context.page.data.loadState, 'catalog_error');
    context.page.retryLoadCatalog();
    assert.equal(context.requests.length, 2);
    await settle(context.requests[1], 'success', { list: TAGS });
    await settle(context.requests[2], 'success', { list: [{ id: 1 }], pagination: { hasMore: false } });
    assert.equal(context.page.data.loadState, 'ready');
  }

  {
    const context = createPage();
    await settle(context.requests[0], 'success', { list: TAGS });
    await settle(context.requests[1], 'failure');
    assert.equal(context.page.data.loadState, 'error');
    assert.equal(context.page.data.activeTagKey, 'called_no_response');
    context.page.retryLoadArticles();
    assert.equal(context.requests.length, 3);
    assert.equal(context.requests[2].params.page, 1);
    await settle(context.requests[2], 'success', { list: [{ id: 5 }], pagination: { hasMore: false } });
    assert.equal(context.page.data.loadState, 'ready');
    assert.equal(context.page.data.articles[0].id, 5);
  }

  {
    const context = createPage({ query: { painPointKey: 'called_no_response' } });
    await loadFirstPage(context);
    context.page.onPullDownRefresh();
    assert.equal(context.requests.length, 3);
    assert.equal(context.requests[2].url, '/pain-point-tags');
    await settle(context.requests[2], 'success', { list: TAGS });
    assert.equal(context.requests[3].params.pain_point_key, 'called_no_response');
    await settle(context.requests[3], 'success', { list: [{ id: 7 }], pagination: { hasMore: false } });
    assert.equal(context.events.stops, 1);
    assert.equal(context.page.data.articles[0].id, 7);
  }

  {
    const context = createPage();
    await loadFirstPage(context);
    context.page.onArticleTap({ currentTarget: { dataset: { id: 1, index: 0 } } });
    assert.equal(context.events.navigations.length, 1);
    assert.ok(context.events.navigations[0].indexOf('/pages/parenting/article-detail/article-detail?id=1') === 0);
    assert.ok(context.events.tracks.some(item => item.event_type === 'pain_point_article_click'));
  }

  {
    const context = createPage({ enabled: false });
    assert.equal(context.requests.length, 0);
    assert.equal(context.page.data.loadState, 'disabled');
  }

  console.log('Pain point collection page: all cases passed');
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
