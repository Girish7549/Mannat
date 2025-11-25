
const User = require('../models/User');
const Company = require('../models/Company');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');
const UserTask = require('../models/UserTask');
const PaymentProof = require('../models/PaymentProof');
const WithdrawalRequest = require('../models/WithdrawalRequest');

exports.getAdminDashboardStats = async (req, res) => {
  try {
    const isAdmin = req.user.type === "admin"
    if (!isAdmin) {
      return res.status(401).json({
        success: false,
        message: "You have no permission to access"
      })
    }
    // -----------------------------
    // USER STATS
    // -----------------------------
    const totalUsers = await User.countDocuments();
    const paidUsers = await User.countDocuments({ hasPaid: true });
    const pendingKyc = await User.countDocuments({ kycStatus: "pending" });
    const verifiedKyc = await User.countDocuments({ kycStatus: "verified" });

    const totalReferralsAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$totalReferrals" } } }
    ]);
    const totalReferrals = totalReferralsAgg[0]?.total || 0;

    // DAILY USERS (LAST 30 DAYS)
    const dailyUsers = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // -----------------------------
    // FINANCIAL STATS
    // -----------------------------
    const transactionAgg = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let referralEarnings = 0;
    let taskEarnings = 0;

    transactionAgg.forEach(t => {
      if (t._id === "referral") referralEarnings = t.total;
      if (t._id === "task") taskEarnings = t.total;
    });

    const totalNetworkVolume = referralEarnings + taskEarnings;

    // DAILY REVENUE FROM TRANSACTIONS (type = "purchase")
    const dailyRevenue = await Transaction.aggregate([
      {
        $match: { type: "purchase" }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // TOTAL PURCHASE COUNT (NUMBER OF TRANSACTIONS OF TYPE purchase)
    const totalPurchases = await Transaction.countDocuments({ type: "purchase" });

    // -----------------------------
    // TASK COMPLETIONS
    // -----------------------------
    const dailyTaskCompletions = await UserTask.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completedAt" } },
          tasks: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalTasksCompleted = await UserTask.countDocuments();

    const totalRewardAgg = await UserTask.aggregate([
      { $group: { _id: null, total: { $sum: "$rewardAmount" } } }
    ]);
    const totalTaskRewards = totalRewardAgg[0]?.total || 0;

    // -----------------------------
    // PAYMENT PROOFS & WITHDRAWALS
    // -----------------------------
    const pendingPayments = await PaymentProof.countDocuments({ status: "pending" });
    const pendingWithdrawals = await WithdrawalRequest.countDocuments({ status: "pending" });

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------
    return res.json({
      success: true,
      stats: {
        users: {
          totalUsers,
          paidUsers,
          pendingKyc,
          verifiedKyc,
          totalReferrals
        },
        financial: {
          totalNetworkVolume,
          referralEarnings,
          taskEarnings,
          totalPurchases
        },
        tasks: {
          totalTasksCompleted,
          totalTaskRewards
        },
        pendingApprovals: {
          paymentProofs: pendingPayments,
          withdrawals: pendingWithdrawals
        }
      },
      charts: {
        dailyUsers,
        dailyRevenue,
        dailyTaskCompletions
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error loading admin dashboard data",
      error: err.message
    });
  }
};


exports.listUsers = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(401).json({
        success: false,
        message: "You have no permission to access"
      });
    }

    const users = await User.find({ type: "user" })
      .populate("parentId", "name")   // shows parent name
      .lean();

    const formatted = users.map(u => ({
      id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatar: u.avatar || "",
      referralCode: u.referralCode,
      joinDate: u.createdAt?.toISOString().slice(0, 10),
      status: u.active,           // active, inactive, frozen
      kycStatus: u.kycStatus,     // pending, approved, rejected
      isPaid: u.hasPaid,
      walletBalance: u.referralWallet || 0,
      level: u.level || 1,
      parentName: u.parentId?.name || "Root User",
      directReferrals: u.totalReferrals || 0,
      totalNetwork: u.totalNetwork || 0,
      earningsTask: u.earningsTask || 0,
      earningsReferral: u.earningsReferral || 0,
    }));

    return res.json({
      success: true,
      users: formatted
    });

  } catch (err) {
    console.error("User list error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.listKycUsers = async (req, res) => {
  try {
    if (req.user.type !== "admin") {
      return res.status(401).json({
        success: false,
        message: "You have no permission to access"
      });
    }

    const users = await User.find({
      kycStatus: { $ne: "not_submitted" },  // get submitted KYC only
    }).select("name kycStatus kycFiles createdAt");

    res.json({ success: true, users });
  } catch (error) {
    console.error("Error fetching KYC users:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// controllers/admin.controller.js

exports.approveKyc = async (req, res) => {
  try {
    const { userId, notes } = req.body;

    await User.findByIdAndUpdate(userId, {
      kycStatus: "verified",
      isKycVerified: true
    });

    res.json({ success: true, message: "KYC Approved" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.rejectKyc = async (req, res) => {
  try {
    const { userId, notes } = req.body;

    await User.findByIdAndUpdate(userId, {
      kycStatus: "rejected",
      isKycVerified: false
    });

    res.json({ success: true, message: "KYC Rejected" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.companyStats = async (req, res) => {
  const isAdmin = req.user.type === "admin"
  if (!isAdmin) {
    return res.status(401).json({
      success: false,
      message: "You have no permission to access"
    })
  }
  const c = await Company.findOne().lean();
  res.json({ company: c || {} });
};
