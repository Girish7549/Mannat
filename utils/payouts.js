
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const PAYOUTS = [300, 100, 50, 10, 5];
const JOINING_FEE = 1555;
const TOTAL_PAYOUT = PAYOUTS.reduce((a, b) => a + b, 0);
const COMPANY_KEEP = JOINING_FEE - TOTAL_PAYOUT;

async function creditWallet(session, userId, amount, type, source) {
  if (!amount || amount <= 0) return;
  await User.updateOne({ _id: userId }, { $inc: { referralWallet: amount, totalEarning: amount } }, { session });
  await Transaction.create([{
    userId,
    amount,
    type,
    source
  }], { session });
}

async function processReferralPayouts(session, newUserDoc, parentDoc) {
  let current = parentDoc;
  for (let level = 0; level < PAYOUTS.length && current; level++) {
    const amt = PAYOUTS[level];
    await creditWallet(session, current._id, amt, 'referral', `join:${newUserDoc._id}`);
    if (!current.parentId) break;
    current = await User.findById(current.parentId).session(session);
  }
}

module.exports = {
  PAYOUTS, JOINING_FEE, TOTAL_PAYOUT, COMPANY_KEEP,
  creditWallet, processReferralPayouts
};
