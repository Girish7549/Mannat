const User = require("../models/User");

// Recursively build tree
async function buildTree(userId, level = 0) {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    // Get children (users referred by THIS user)
    const children = await User.find({ referredBy: user.referralCode }).lean();

    const childNodes = [];
    let totalNetwork = 0;
    let totalEarnings = user.referralWallet || 0;

    for (const child of children) {
        const childTree = await buildTree(child._id, level + 1);

        if (childTree) {
            totalNetwork += 1 + childTree.totalNetwork;
            totalEarnings += childTree.totalEarnings;
            childNodes.push(childTree.tree);
        }
    }

    // Build correct node data
    const tree = {
        id: user._id,
        name: user.name,                  // ✅ Correct user name
        directReferrals: children.length, // ✅ Correct count
        earnings: user.referralWallet,    // ✅ Each user's earnings
        level,
        children: childNodes
    };

    return { tree, totalNetwork, totalEarnings };
}


// MAIN CONTROLLER
exports.getReferralNetwork = async (req, res) => {
    try {
        const userId = req.user._id;

        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const result = await buildTree(userId);

        return res.json({
            success: true,
            tree: result.tree,
            totalNetwork: result.totalNetwork,
            totalEarnings: result.totalEarnings,
        });

    } catch (error) {
        console.error("Referral Network Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
