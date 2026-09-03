var appConfig = require('./app-config.js');

function readPublished(app, type, id, fallback) {
  if (!appConfig.isFeatureEnabled(app, 'miniprogramRemoteContent')) {
    return Promise.resolve({ item: fallback, source: 'local_fallback', fallback: true, disabled: true });
  }
  var request = app && typeof app.request === 'function'
    ? app.request({ url: '/content/' + encodeURIComponent(type) + '/' + encodeURIComponent(id), method: 'GET' })
    : Promise.reject(new Error('request unavailable'));
  return request.then(function(payload) {
    var item = payload && (payload.data || payload);
    return { item: item || fallback, source: item ? 'server' : 'local_fallback', fallback: !item };
  }).catch(function(error) {
    return { item: fallback, source: 'local_fallback', fallback: true, error: error };
  });
}

function readPublishedOrLegacy(app, type, id, legacyPath, fallback) {
  return readPublished(app, type, id, null).then(function(result) {
    if (result.item) return result;
    if (!app || typeof app.request !== 'function') return { item: fallback, source: 'local_fallback', fallback: true };
    return app.request({ url: legacyPath, method: 'GET' }).then(function(item) {
      return { item: item, source: 'legacy', fallback: false };
    }).catch(function(error) {
      return { item: fallback, source: 'local_fallback', fallback: true, error: error };
    });
  });
}

module.exports = { readPublished: readPublished, readPublishedOrLegacy: readPublishedOrLegacy };
