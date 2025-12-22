
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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

exports.updateEmailPassword = async (req, res) => {
  const userId = req.params.id;
  const { email, password } = req.body;

  // 🔒 only admin or same user
  if (req.user.type !== 'admin' && req.user._id.toString() !== userId.toString()) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    // 📧 Email update (unique check)
    if (email && email !== user.email) {
      const exists = await User.findOne({ email }).session(session);
      if (exists) throw new Error('Email already in use');
      user.email = email;
    }

    // 🔑 Password update
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Email / Password updated successfully'
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message || 'Update failed' });
  }
};

