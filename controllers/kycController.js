
const mongoose = require('mongoose');
const User = require('../models/User');

exports.submit = async (req, res) => {
  try {
    const user = req.user;

    const { fullName, aadharNumber, panNumber, bankAccount, ifscCode } = req.body;

    const kycData = { fullName, aadharNumber, panNumber, bankAccount, ifscCode };

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          kycStatus: "pending",
          kycFiles: kycData
        }
      }
    );

    const updatedUser = await User.findById(user._id);

    res.json({
      success: true,
      user: updatedUser,
      message: "KYC submitted successfully"
    });

  } catch (err) {
    console.error("KYC SUBMIT ERROR", err);
    res.status(500).json({ success: false, error: "Server error" });
  }
};

exports.verify = async (req, res) => {
  const { userId } = req.params;
  const { verify } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.kycStatus = verify ? 'verified' : 'rejected';
  user.isKycVerified = !!verify;
  await user.save();
  res.json({ success: true, userId, kycStatus: user.kycStatus });
};
