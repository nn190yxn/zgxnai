'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,
  '../miniprogram/pages/parenting/article-list/article-list.js'), 'utf8');

function createPage() {
  const requests = [];
  const effects = { writes: 0, toasts: [], stops: 0 };
  let page;
  vm.runInNewContext(source, {
    getApp: () => ({
      shouldUseMockFallback: () => false,
      request: options => new Promise((resolve, reject) => {
        requests.push({ params: options.data, resolve, reject });
      })
    }),
    require: name => {
      assert.equal(name, '../../../utils/child-context.js');
      return { resolveArticleListInitialAgeFilter: () => ({}) };
    },
    Page: definition => { page = definition; },
    wx: {
      showToast: options => effects.toasts.push(options.title),
      stopPullDownRefresh: () => { effects.stops += 1; }
    }
  }, { filename: 'article-list.js' });
  page.setData = patch => {
    effects.writes += 1;
    Object.assign(page.data, patch);
  };
  page.onLoad({});
  return { page, requests, effects };
}

async function settle(request, outcome, id = 'result', hasMore = true) {
  if (outcome === 'failure') {
    request.reject(new Error('Controlled request failure'));
  } else {
    request.resolve({ list: [{ id }], pagination: { hasMore } });
  }
  // Drain then/catch/finally, including Promise adoption jobs.
  await new Promise(resolve => setImmediate(resolve));
}

function snapshot(context) {
  return JSON.stringify({ data: context.page.data, effects: context.effects });
}

const event = id => ({ currentTarget: { dataset: { id } } });
const replacements = [
  ['category', page => page.onCategoryChange(event(1)), params => {
    assert.equal(params.category, '\u60c5\u7eea\u7ba1\u7406');
  }],
  ['age', page => page.onAgeChange(event(3)), params => {
    assert.equal(params.age_group, '4-5\u5c81');
  }],
  ['form', page => page.onFormChange(event('method')), params => {
    assert.equal(params.content_form, 'method');
  }],
  ['search', page => {
    page.onSearchInput({ detail: { value: 'sleep' } });
    page.onSearchConfirm();
  }, params => assert.equal(params.keyword, 'sleep')],
  ['clear', page => {
    page.onSearchInput({ detail: { value: 'sleep' } });
    page.onClearSearch();
  }, params => assert.equal(params.keyword, undefined)],
  ['refresh', page => page.onPullDownRefresh(), () => {}]
];

async function main() {
  let cases = 0;
  for (const [name, replace, checkParams] of replacements) {
    for (const oldOutcome of ['success', 'failure']) {
      for (const newOutcome of ['success', 'failure']) {
        for (const oldFirst of [true, false]) {
          const context = createPage();
          const { page, requests, effects } = context;
          replace(page);
          assert.equal(requests.length, 2, `${name}: replacement starts while loading`);
          assert.equal(requests[1].params.page, 1);
          checkParams(requests[1].params);
          if (oldFirst) {
            const before = snapshot(context);
            await settle(requests[0], oldOutcome, 'old');
            assert.equal(snapshot(context), before, `${name}: stale callbacks are inert`);
            assert.equal(page.data.loading, true);
          }
          await settle(requests[1], newOutcome, 'new', false);
          assert.equal(page.data.loading, false);
          assert.equal(page.data.hasMore, false);
          assert.equal(page.data.page, 2);
          assert.equal(page.data.articleList[0].id,
            newOutcome === 'success' ? 'new' : 'local_parenting_001');
          assert.equal(effects.stops, name === 'refresh' ? 1 : 0);
          assert.equal(effects.toasts.length, 0);
          if (!oldFirst) {
            const before = snapshot(context);
            await settle(requests[0], oldOutcome, 'old');
            assert.equal(snapshot(context), before, `${name}: late stale callbacks are inert`);
          }
          cases += 1;
        }
      }
    }
  }

  for (const outcome of ['success', 'failure']) {
    for (const oldFirst of [true, false]) {
      const context = createPage();
      const { page, requests, effects } = context;
      await settle(requests[0], 'success', 'first');
      page.onReachBottom();
      page.onReachBottom();
      assert.equal(requests.length, 2, 'pagination keeps its loading lock');
      assert.equal(requests[1].params.page, 2);
      page.onPullDownRefresh();
      assert.equal(requests.length, 3, 'refresh supersedes pending pagination');
      assert.equal(requests[2].params.page, 1);
      if (oldFirst) {
        const before = snapshot(context);
        await settle(requests[1], outcome, 'stale-page', false);
        assert.equal(snapshot(context), before);
      }
      await settle(requests[2], 'success', 'refreshed', false);
      assert.equal(page.data.articleList.length, 1);
      assert.equal(page.data.articleList[0].id, 'refreshed');
      assert.equal(effects.stops, 1);
      assert.equal(effects.toasts.length, 0);
      if (!oldFirst) {
        const before = snapshot(context);
        await settle(requests[1], outcome, 'stale-page', false);
        assert.equal(snapshot(context), before);
      }
      page.onReachBottom();
      assert.equal(requests.length, 3, 'hasMore blocks exhausted pagination');
      page.onSearchConfirm();
      assert.equal(requests.length, 4, 'new query can restart an exhausted list');
      await settle(requests[3], 'success');
      cases += 1;
    }
  }

  {
    const { page, requests, effects } = createPage();
    await settle(requests[0], 'success', 'first');
    page.onReachBottom();
    await settle(requests[1], 'failure');
    assert.equal(page.data.page, 2, 'failed pagination is retryable');
    assert.equal(page.data.loading, false);
    assert.equal(page.data.articleList[0].id, 'first');
    assert.equal(effects.toasts.length, 1);
    page.onReachBottom();
    await settle(requests[2], 'success', 'second', false);
    assert.equal(page.data.articleList.map(item => item.id).join(','), 'first,second');
    assert.equal(page.data.page, 3);
    assert.equal(page.data.hasMore, false);
    cases += 1;
  }

  for (const outcome of ['success', 'failure']) {
    const context = createPage();
    const { page, requests, effects } = context;
    page.onPullDownRefresh();
    page.onPullDownRefresh();
    page.onFormChange(event('theory'));
    assert.equal(requests.length, 4);
    const before = snapshot(context);
    await settle(requests[2], outcome);
    await settle(requests[1], outcome);
    await settle(requests[0], outcome);
    assert.equal(snapshot(context), before, 'replaced refresh cannot stop the spinner');
    await settle(requests[3], outcome);
    assert.equal(effects.stops, 1, 'latest query cleans up the pending refresh');
    assert.equal(page.data.loading, false);
    cases += 1;
  }

  for (const outcome of ['success', 'failure']) {
    const context = createPage();
    const { page, requests } = context;
    page.onPullDownRefresh();
    page.onUnload();
    const before = snapshot(context);
    await settle(requests[1], outcome);
    await settle(requests[0], outcome);
    page.onReachBottom();
    assert.equal(snapshot(context), before, 'unloaded page ignores all request callbacks');
    assert.equal(requests.length, 2);
    cases += 1;
  }

  console.log(`Article list request flow: ${cases} cases passed`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
