
const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.me = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("parentId")
    .lean();
  // console.log(user)
  res.json({ user });
};

exports.leaderboard = async (req, res) => {
  // top referrals leaderboard
  const top = await User.find().sort({ totalReferrals: -1 }).limit(10).lean();
  res.json({ leaderboard: top });
};
