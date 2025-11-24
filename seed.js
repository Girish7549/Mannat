
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Task = require('./models/Task');
const User = require('./models/User');
const Company = require('./models/Company');

async function seed() {
  await connectDB(process.env.MONGO_URI);

  const tasks = [
    { title: 'Watch sponsor video', rewardAmount: 0.5, maxDailyPerUser: 5 },
    { title: 'Visit sponsor site', rewardAmount: 1, maxDailyPerUser: 3 },
    { title: 'Share post on social', rewardAmount: 2, maxDailyPerUser: 2 },
    { title: 'Daily quiz', rewardAmount: 0.25, maxDailyPerUser: 10 },
  ];
  await Task.deleteMany({});
  await Task.insertMany(tasks);
  console.log('Tasks seeded');

  await User.deleteMany({});
  const sample = new User({ name: 'Alice', phone: '9999999999', referralCode: 'ALICE001', hasPaid: true, level: 1 });
  await sample.save();
  console.log('Sample user created:', sample.referralCode);

  await Company.deleteMany({});
  const company = new Company({ totalRevenue: 0, totalPayouts: 0 });
  await company.save();
  console.log('Company record created');

  mongoose.connection.close();
}

seed().catch(err => { console.error(err); process.exit(1); });
