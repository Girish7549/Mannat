
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// exports.me = async (req, res) => {
//   const user = await User.findById(req.user._id)
//     .populate("parentId")
//     .lean();
//   // console.log(user)
//   res.json({ user });
// };
exports.me = async (req, res) => {
  try {
    // Get logged-in user
    const user = await User.findById(req.user._id)
      .populate("parentId")
      .lean();

    if (!user) return res.status(404).json({ message: "User not found" });

    // Count all users referred by this user
    const totalReferrals = await User.countDocuments({ parentId: user._id });

    // Count only users who have paid
    const totalReferralsPaid = await User.countDocuments({ parentId: user._id, hasPaid: true });

    // Add these counts to user object
    user.totalReferrals = totalReferrals;        // all referred users
    user.totalReferralsPaid = totalReferralsPaid; // only paid users

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.leaderboard = async (req, res) => {
  // top referrals leaderboard
  const top = await User.find().sort({ totalReferrals: -1 }).limit(10).lean();
  res.json({ leaderboard: top });
};
