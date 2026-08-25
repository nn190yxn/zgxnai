var PRIORITY = [
  'no_observation',
  'unfinished_training',
  'pending_feedback',
  'report_available',
  'membership_expired'
];

var ACTIONS = {
  no_observation: {
    title: '先做一次能力观察',
    desc: '从孩子可观察的表现开始，获得今天能做的一步。',
    cta: '开始一次能力观察',
    targetPath: '',
    targetType: 'assessment'
  },
  unfinished_training: {
    title: '继续今天的训练',
    desc: '沿着当前训练方向完成一个短练习，记录孩子的表现。',
    cta: '继续今天的训练',
    targetPath: '',
    targetType: 'daily_plan'
  },
  pending_feedback: {
    title: '补充今天的表现反馈',
    desc: '告诉我们孩子刚才的反应，方便调整下一次训练方向。',
    cta: '填写表现反馈',
    targetPath: '',
    targetType: 'training_feedback'
  },
  report_available: {
    title: '查看最近阶段报告',
    desc: '回看孩子的表现变化、当前支持重点和下一步训练方向。',
    cta: '查看阶段报告',
    targetPath: '/pages/weekly-summary/index',
    targetType: 'stage_report'
  },
  membership_expired: {
    title: '恢复成长支持服务',
    desc: '会员服务已到期，可查看可用权益并继续安排训练。',
    cta: '查看会员服务',
    targetPath: '/pages/membership/index',
    targetType: 'membership'
  },
  ready: {
    title: '继续观察孩子的表现',
    desc: '围绕当前训练方向记录一个具体变化。',
    cta: '开始今天的一步',
    targetPath: '',
    targetType: 'assessment'
  }
};

function hasUnfinishedTraining(state) {
  if (state.unfinishedTraining === true || state.continueTask) {
    return true;
  }
  return Array.isArray(state.dailyPlanCards) && state.dailyPlanCards.some(function(card) {
    return card && !card.completed;
  });
}

function hasPendingFeedback(state) {
  return state.pendingFeedback === true || state.feedbackRequired === true;
}

function hasReport(state) {
  return state.reportAvailable === true || state.hasReport === true || !!state.report;
}

function isMembershipExpired(state) {
  var membership = state.membershipState || {};
  return state.membershipExpired === true || membership.status === 'expired' || (
    membership.is_active === false && membership.membership_type === 'expired'
  );
}

function hasObservation(state) {
  return state.hasObservation === true || !!state.observation || !!state.abilityProfile || !!state.recentAction;
}

function getStatus(state) {
  var source = state || {};
  if (!hasObservation(source)) {
    return 'no_observation';
  }
  if (hasUnfinishedTraining(source)) {
    return 'unfinished_training';
  }
  if (hasPendingFeedback(source)) {
    return 'pending_feedback';
  }
  if (hasReport(source)) {
    return 'report_available';
  }
  if (isMembershipExpired(source)) {
    return 'membership_expired';
  }
  return 'ready';
}

function getPrimaryAction(state) {
  var source = state || {};
  var status = getStatus(source);
  var action = ACTIONS[status] || ACTIONS.ready;
  return Object.assign({
    primaryCardType: status,
    reason: status,
    status: status,
    targetPayload: {},
    source: source.source || 'local'
  }, action);
}

function mergeRemoteState(localState, remoteState) {
  var local = localState || {};
  var remote = remoteState || {};
  var merged = Object.assign({}, local);
  Object.keys(remote).forEach(function(key) {
    if (remote[key] !== null && remote[key] !== undefined) {
      merged[key] = remote[key];
    }
  });
  if (!remoteState) {
    merged.source = 'local';
    merged.recovered = true;
  } else {
    merged.source = 'remote';
    merged.recovered = false;
  }
  return merged;
}

module.exports = {
  PRIORITY: PRIORITY,
  getStatus: getStatus,
  getPrimaryAction: getPrimaryAction,
  mergeRemoteState: mergeRemoteState,
  hasUnfinishedTraining: hasUnfinishedTraining
};
