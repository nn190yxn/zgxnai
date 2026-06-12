const { isActiveMember } = require('../services/membership');

function requireActiveMembership(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    next();
    return;
  }

  const userId = req.user && req.user.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_REQUIRED',
      message: '请先登录'
    });
  }

  if (!isActiveMember(userId)) {
    return res.status(403).json({
      success: false,
      code: 'MEMBERSHIP_REQUIRED',
      message: '会员已到期或尚未开通，请先开通会员'
    });
  }

  next();
}

module.exports = { requireActiveMembership };
