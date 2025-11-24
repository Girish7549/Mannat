
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// exports.requestWithdraw = async (req, res) => {
//   const user = await User.findById(req.user._id);
//   const { amount } = req.body;
//   const MIN_WITHDRAW = 200;
//   if (!amount || amount < MIN_WITHDRAW) return res.status(400).json({ error: `Minimum withdraw ₹${MIN_WITHDRAW}` });
//   if (user.referralWallet < amount) return res.status(400).json({ error: 'Insufficient balance' });

//   user.referralWallet -= amount;
//   await user.save();
//   await Transaction.create({ userId: user._id, amount: -amount, type: 'withdraw', source: 'manual' });

//   res.json({ success: true, message: 'Withdrawal initiated' });
// };
exports.getAllWithdrawRequests = async (req, res) => {
  try {
    const list = await WithdrawalRequest.find()
      .populate("userId", "name upiId referralWallet")
      .sort({ createdAt: -1 });

    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


exports.requestWithdraw = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { amount } = req.body;

    const MIN_WITHDRAW = 1;

    if (!user.isKycVerified)
      return res.status(400).json({ error: "KYC not verified" });

    if (!amount || amount < MIN_WITHDRAW)
      return res.status(400).json({ error: `Minimum withdraw ₹${MIN_WITHDRAW}` });

    if (user.referralWallet < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    user.referralWallet -= amount;
    await user.save();

    const request = await WithdrawalRequest.create({
      userId: user._id,
      amount,
      status: "pending",
    });

    await Transaction.create({
      userId: user._id,
      amount: -amount,
      type: "withdrawal",
      source: "manual",
    });

    res.json({
      success: true,
      message: "Withdrawal request created",
      request,
    });
  } catch (err) {
    console.log("Withdraw error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getMyWithdrawRequests = async (req, res) => {
  try {
    const list = await WithdrawalRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, list });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateWithdrawStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, note } = req.body; // approved / rejected

    if (!["approved", "rejected"].includes(status))
      return res.status(400).json({ error: "Invalid status" });

    const request = await WithdrawalRequest.findById(requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    request.status = status;
    request.adminNote = note || "";
    await request.save();

    res.json({ success: true, message: "Request updated", request });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};


exports.getIncomeSummary = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();

    // Start of Today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Last 7 Days
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Last 30 Days
    const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch All User Transactions
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    console.log("ALL Transection :", transactions)

    let todayIncome = 0;
    let weeklyIncome = 0;
    let monthlyIncome = 0;
    let totalIncome = 0;

    for (const t of transactions) {
      if (t.amount > 0) {
        totalIncome += t.amount;

        if (t.createdAt >= startOfToday) todayIncome += t.amount;
        if (t.createdAt >= startOfWeek) weeklyIncome += t.amount;
        if (t.createdAt >= startOfMonth) monthlyIncome += t.amount;
      }
    }

    res.json({
      success: true,
      summary: {
        todayIncome,
        weeklyIncome,
        monthlyIncome,
        totalIncome,
      },
      transactions, // 👈 ALL transactions returned here
    });

  } catch (error) {
    console.error("Wallet Summary Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


