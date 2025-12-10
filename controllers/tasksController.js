
const mongoose = require('mongoose');
const Task = require('../models/Task');
const UserTask = require('../models/UserTask');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getAllTasks = async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, tasks });
};

exports.list = async (req, res) => {
  const tasks = await Task.find({ active: true }).lean();
  res.json({ success: true, tasks });
};

exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      rewardAmount,
      type,
      maxDailyPerUser,
      action,        // 🔥 NEW
      targetUrl,     // 🔥 NEW
      targetId       // 🔥 optional
    } = req.body;

    // 🔥 If task is social, require action + targetUrl
    if (type === "social") {
      if (!action) {
        return res.status(400).json({
          success: false,
          message: "Action is required for social tasks"
        });
      }

      if (!targetUrl) {
        return res.status(400).json({
          success: false,
          message: "Target URL is required for social tasks"
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      rewardAmount,
      type,
      maxDailyPerUser,
      action: type === "social" ? action : null,
      targetUrl: type === "social" ? targetUrl : null,
      targetId: type === "social" ? targetId : null
    });

    res.json({ success: true, task });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};


exports.toggleActive = async (req, res) => {
  const { id } = req.params;
  const task = await Task.findById(id);
  task.active = !task.active;
  await task.save();
  res.json({ success: true, status: task.active });
};

exports.updateTask = async (req, res) => {
  const { id } = req.params;
  await Task.updateOne({ _id: id }, req.body);
  res.json({ success: true });
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params
    const deleteTask = await Task.findByIdAndDelete(id)
    res.status(200).json({
      success: true,
      message: "Task Deleted Successfully...",
      data: deleteTask
    })
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    })
  }
}

exports.completeTask = async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user._id;

  try {
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Check if user already completed
    if (task.usersCompleted.includes(userId)) {
      return res.status(400).json({ error: "Task already completed" });
    }

    // Add user to usersCompleted
    task.usersCompleted.push(userId);
    await task.save();

    res.json({ success: true, reward: task.rewardAmount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

async function countUserTaskToday(userId, taskId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return UserTask.countDocuments({ userId, taskId, completedAt: { $gte: start, $lte: end } });
}

exports.complete = async (req, res) => {
  const user = req.user;
  const { taskId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const task = await Task.findById(taskId).session(session);
    if (!task || !task.active) throw new Error('Task not found');

    const doneToday = await countUserTaskToday(user._id, task._id);
    if (doneToday >= task.maxDailyPerUser) throw new Error('Daily limit reached for this task');

    await UserTask.create([{
      userId: user._id,
      taskId: task._id,
      rewardAmount: task.rewardAmount,
      meta: { ip: req.ip, ua: req.headers['user-agent'] }
    }], { session });

    await User.updateOne({ _id: user._id }, { $inc: { taskWallet: task.rewardAmount, totalEarning: task.rewardAmount } }, { session });
    await Transaction.create([{
      userId: user._id,
      amount: task.rewardAmount,
      type: 'task',
      source: `task:${task._id}`
    }], { session });

    await session.commitTransaction();
    session.endSession();
    res.json({ success: true, reward: task.rewardAmount });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: err.message || 'Task completion failed' });
  }
};
