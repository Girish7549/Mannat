const Transaction = require("../models/Transaction");
const User = require("../models/User");

exports.getAllTransactions = async (req, res) => {
    try {
        const { search = "", type = "all", status = "all" } = req.query;

        let filter = {};

        if (type !== "all") filter.type = type;
        if (status !== "all") filter.status = status;

        // If search is provided search user name or description
        if (search) {
            const users = await User.find({
                name: { $regex: search, $options: "i" }
            }).select("_id");

            filter.$or = [
                { userId: { $in: users.map(u => u._id) } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const transactions = await Transaction.find(filter)
            .populate("userId", "name email")
            .sort({ createdAt: -1 });

        res.json({ success: true, transactions });
    } catch (err) {
        console.error("Get Transactions Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};
