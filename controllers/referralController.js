// const User = require("../models/User");

// const COMMISSIONS = [300, 100, 50, 10, 5];

// async function buildTree(userId, level = 0) {
//     const user = await User.findById(userId).lean();
//     if (!user) return null;

//     const children = await User.find({ referredBy: user.referralCode }).lean();

//     let totalNetwork = 0;
//     let totalEarnings = 0;
//     const childNodes = [];

//     for (const child of children) {
//         const nextLevel = level + 1;

//         // Assign commission only for levels 1–5
//         const commission =
//             nextLevel <= 5 ? COMMISSIONS[nextLevel - 1] : 0;

//         totalEarnings += commission;

//         // Build subtree
//         const childTree = await buildTree(child._id, nextLevel);

//         // Create child node
//         const nodeObj = {
//             id: child._id,
//             name: child.name,
//             level: nextLevel,
//             isPaid: child.hasPaid,
//             commission,
//             children: childTree ? childTree.tree.children : []
//         };

//         // Update totals based on childTree
//         if (childTree) {
//             totalNetwork += 1 + childTree.totalNetwork;
//             totalEarnings += childTree.totalEarnings;
//         } else {
//             totalNetwork += 1;
//         }

//         // PUSH ONLY ONCE (IMPORTANT FIX)
//         childNodes.push(nodeObj);
//     }

//     const tree = {
//         id: user._id,
//         name: user.name,
//         level,
//         isPaid: user.hasPaid,
//         commission: 0,       // root user has no commission
//         children: childNodes
//     };

//     return { tree, totalNetwork, totalEarnings };
// }

const User = require("../models/User");

const COMMISSIONS = [300, 100, 50, 10, 5];

async function buildTree(userId, level = 0) {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const children = await User.find({ referredBy: user.referralCode }).lean();

    let totalNetwork = 0;
    let totalEarnings = 0;
    const childNodes = [];

    for (const child of children) {
        const nextLevel = level + 1;

        // Base commission by level (1–5)
        let commission = nextLevel <= 5 ? COMMISSIONS[nextLevel - 1] : 0;

        // ❌ Do NOT count earnings if NOT paid
        if (!child.hasPaid) {
            commission = 0;
        }

        // Add commission only if paid
        totalEarnings += commission;

        // Build subtree
        const childTree = await buildTree(child._id, nextLevel);

        // Count network only if child hasPaid
        if (child.hasPaid) {
            totalNetwork += 1;
        }

        // Add children's paid network too
        if (childTree) {
            totalNetwork += childTree.totalNetwork;
            totalEarnings += childTree.totalEarnings;
        }

        // Build node
        const nodeObj = {
            id: child._id,
            name: child.name,
            level: nextLevel,
            isPaid: child.hasPaid,
            commission, // 0 if unpaid
            children: childTree ? childTree.tree.children : []
        };

        childNodes.push(nodeObj);
    }

    const tree = {
        id: user._id,
        name: user.name,
        level,
        isPaid: user.hasPaid,
        commission: 0, // root
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

// Recursive function to build tree
async function buildUserTree(userId) {
    const user = await User.findById(userId).lean();

    if (!user) return null;

    // Find all direct children (referrals)
    const children = await User.find({ parentId: userId }).lean();

    // Recursively build subtree for each child
    const childTrees = await Promise.all(
        children.map(child => buildUserTree(child._id))
    );

    return {
        ...user,
        children: childTrees
    };
}

// Controller: Get full referral tree of user
exports.getUserTree = async (req, res) => {
    try {
        const userId = req.params.userId;

        const tree = await buildUserTree(userId);

        if (!tree) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            tree
        });
    } catch (error) {
        console.error("Tree Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error
        });
    }
};

