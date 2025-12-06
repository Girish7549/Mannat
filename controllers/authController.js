
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateReferralCode() {
  return uuidv4().slice(0, 8).toUpperCase();
}

exports.register = async (req, res) => {
  const { name, email, phone, password, referralCode } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!phone && !email && !name) throw new Error('phone or email required');
    const exists = await User.findOne({ $or: [{ email }, { phone }] }).session(session);
    if (exists) throw new Error('User exists');

    const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
    let parent = null;
    let parentId = null;
    let referredBy = null;
    if (referralCode) {
      parent = await User.findOne({ referralCode }).session(session);
      if (!parent) {
        throw new Error("Invalid referral code");
      }

      parentId = parent._id;
      referredBy = parent.referralCode;
    }

    const code = generateReferralCode();
    const newArr = await User.create([{
      name, email, phone, password: passwordHash, referralCode: code, referredBy, parentId, level: 0
    }], { session });
    const newUser = newArr[0];

    // if (parent) {
    //   await User.updateOne({ _id: parent._id }, { $inc: { totalReferrals: 1 } }, { session });
    // }

    // await Purchase.create([{
    //   userId: newUser._id,
    //   bundle: 'joining',
    //   amount: JOINING_FEE
    // }], { session });

    // await processReferralPayouts(session, newUser, parent);

    // await Company.updateOne({}, { $inc: { totalRevenue: COMPANY_KEEP, totalPayouts: 0 } }, { upsert: true, session });

    await session.commitTransaction();
    session.endSession();

    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ user: { id: newUser._id, referralCode: newUser.referralCode, name: newUser.name }, token });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { emailOrPhone, password } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    if (user.password) {
      const ok = await bcrypt.compare(password || '', user.password);
      if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ user: { id: user._id, referralCode: user.referralCode, name: user.name, hasPaid: user.hasPaid }, token });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
};
