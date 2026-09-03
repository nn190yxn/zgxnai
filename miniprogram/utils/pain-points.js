var coreActionScenes = require('./core-action-scenes.js');
var ageCatalog = require('./core-action-age-catalog.js');
var appConfig = require('./app-config.js');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getLocalPainPoints(segmentKey) {
  var segments = coreActionScenes.getAgeFirstSegments ? coreActionScenes.getAgeFirstSegments() : [];
  var segment = (segments || []).find(function(item) { return !segmentKey || item.key === segmentKey; }) || segments[0];
  if (!segment) return [];
  var catalog = ageCatalog.buildAgeFirstSegmentCatalog([segment])[0];
  return clone(catalog && catalog.painPoints || []);
}

function normalize(item) {
  item = item || {};
  var todayAction = item.today_action || item.todayAction || {};
  return Object.assign({}, item, {
    key: String(item.pain_point_key || item.painPointKey || item.key || '').trim(),
    title: item.short_title || item.shortTitle || item.title || '成长小问题',
    description: item.description || item.symptomText || '从一个具体表现开始观察。',
    observableSigns: item.observable_signs || item.observableSigns || [],
    possibleReasons: item.possible_reasons || item.possibleReasons || [],
    todayAction: todayAction,
    parentPrompt: item.parent_prompt || item.parentPrompt || '',
    observeSignals: item.observe_signals || item.observeSignals || [],
    media: item.media || item.media_assets || []
  });
}

function normalizeList(payload) {
  var list = payload && (payload.list || payload.items || payload.data) || payload;
  return Array.isArray(list) ? list.map(normalize) : [];
}

function readList(app, query) {
  var local = getLocalPainPoints(query && query.segmentKey);
  if (!appConfig.isFeatureEnabled(app, 'miniprogramRemoteContent')) {
    return Promise.resolve({ list: local, source: 'local_fallback', fallback: true, disabled: true });
  }
  var request = app && typeof app.request === 'function'
    ? app.request({ url: '/pain-points', method: 'GET', data: query || {} })
    : Promise.reject(new Error('request unavailable'));
  return request.then(function(payload) {
    var list = normalizeList(payload);
    return { list: list.length ? list : local, source: list.length ? 'server' : 'local_fallback', fallback: !list.length };
  }).catch(function(error) {
    return { list: local, source: 'local_fallback', fallback: true, error: error };
  });
}

function readDetail(app, key, segmentKey) {
  var local = getLocalPainPoints(segmentKey).find(function(item) { return item.key === key; });
  if (!appConfig.isFeatureEnabled(app, 'miniprogramRemoteContent')) {
    return Promise.resolve({ item: local || null, source: 'local_fallback', fallback: true, disabled: true });
  }
  var request = app && typeof app.request === 'function'
    ? app.request({ url: '/pain-points/' + encodeURIComponent(key), method: 'GET' })
    : Promise.reject(new Error('request unavailable'));
  return request.then(function(payload) {
    var item = normalize(payload && (payload.data || payload));
    return { item: item.key ? item : local, source: item.key ? 'server' : 'local_fallback', fallback: !item.key };
  }).catch(function(error) {
    return { item: local || null, source: 'local_fallback', fallback: true, error: error };
  });
}

module.exports = { getLocalPainPoints: getLocalPainPoints, normalize: normalize, normalizeList: normalizeList, readList: readList, readDetail: readDetail };
