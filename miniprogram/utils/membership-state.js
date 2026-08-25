var CACHE_KEY = 'membershipState';
var DEFAULT_STATE = {
  status: 'free',
  membership_type: 'free',
  is_active: false,
  days_left: 0,
  is_trial_used: false,
  plans: [],
  entitlements: {},
  fallback_paths: ['trial', 'referral']
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeMembershipState(payload) {
  var source = payload || {};
  var state = Object.assign({}, DEFAULT_STATE, source);
  state.is_active = !!source.is_active;
  state.days_left = Math.max(0, Number(source.days_left || 0));
  state.is_trial_used = !!source.is_trial_used;
  state.plans = Array.isArray(source.plans) ? source.plans : [];
  state.entitlements = Object.assign({}, source.entitlements || {});
  state.fallback_paths = Array.isArray(source.fallback_paths) && source.fallback_paths.length
    ? source.fallback_paths.slice()
    : ['trial', 'referral'];
  return state;
}

function isExpired(state) {
  var membership = normalizeMembershipState(state);
  return membership.status === 'expired' || (
    membership.is_active === false && membership.membership_type === 'expired'
  );
}

function getCachedMembership(app) {
  var globalState = app && app.globalData && app.globalData.membershipState;
  if (globalState) {
    return normalizeMembershipState(globalState);
  }
  try {
    var stored = wx.getStorageSync(CACHE_KEY);
    return stored ? normalizeMembershipState(stored) : null;
  } catch (err) {
    return null;
  }
}

function setMembershipState(app, payload) {
  var state = normalizeMembershipState(payload);
  if (app && app.globalData) {
    app.globalData.membershipState = state;
    app.globalData.membershipStateUpdatedAt = Date.now();
  }
  try {
    wx.setStorageSync(CACHE_KEY, state);
  } catch (err) {
    // Storage failure should not block the current page.
  }
  return state;
}

function refreshMembership(app, options) {
  var opts = options || {};
  var cached = getCachedMembership(app);
  if (!opts.force && cached && app && app.globalData && app.globalData.membershipStateUpdatedAt) {
    return Promise.resolve(clone(cached));
  }
  if (app && app.globalData && app.globalData.membershipStatePromise) {
    return app.globalData.membershipStatePromise;
  }
  if (!app || typeof app.request !== 'function') {
    return Promise.resolve(clone(cached || DEFAULT_STATE));
  }
  var request = app.request({ url: '/membership/info', method: 'GET' })
    .then(function(data) {
      return clone(setMembershipState(app, data));
    })
    .catch(function(error) {
      if (cached) {
        return clone(cached);
      }
      throw error;
    })
    .finally(function() {
      if (app.globalData) {
        app.globalData.membershipStatePromise = null;
      }
    });
  if (app.globalData) {
    app.globalData.membershipStatePromise = request;
  }
  return request;
}

function hasEntitlement(state, key) {
  var membership = normalizeMembershipState(state);
  if (membership.is_active) {
    return true;
  }
  return !!(membership.entitlements && membership.entitlements[key]);
}

function buildMembershipEntryUrl(source, payload) {
  var params = payload || {};
  var query = [
    ['source', source || 'unknown'],
    ['ability', params.ability || params.abilityCode || ''],
    ['childId', params.childId || ''],
    ['planId', params.planId || ''],
    ['reportId', params.reportId || '']
  ].filter(function(item) { return item[1] !== ''; }).map(function(item) {
    return encodeURIComponent(item[0]) + '=' + encodeURIComponent(item[1]);
  }).join('&');
  return '/pages/membership/index' + (query ? '?' + query : '');
}

module.exports = {
  CACHE_KEY: CACHE_KEY,
  DEFAULT_STATE: DEFAULT_STATE,
  normalizeMembershipState: normalizeMembershipState,
  isExpired: isExpired,
  getCachedMembership: getCachedMembership,
  setMembershipState: setMembershipState,
  refreshMembership: refreshMembership,
  hasEntitlement: hasEntitlement,
  buildMembershipEntryUrl: buildMembershipEntryUrl
};
