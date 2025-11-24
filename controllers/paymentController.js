const PaymentProof = require("../models/PaymentProof");
const PaymentMethod = require("../models/PaymentMethod");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const uploadBufferToCloudinary = require("../utils/uploadBuffer");

const { processReferralPayouts, JOINING_FEE, COMPANY_KEEP } = require("../utils/payouts");

// ------------------------------
// USER → SUBMIT PAYMENT PROOF
// ------------------------------
exports.submitProof = async (req, res) => {
    try {
        const userId = req.user._id;
        const { utr, senderUpi, paymentAccount } = req.body;
        console.log('PAYMENT ACCOUNT : ', paymentAccount)

        if (!utr) {
            return res.status(400).json({ error: "UTR required" });
        }

        let screenshotUrl = null;

        if (req.file) {
            screenshotUrl = await uploadBufferToCloudinary(
                req.file.buffer,
                req.file.originalname
            );
        }

        const proof = await PaymentProof.create({
            userId,
            utr,
            senderUpi,
            paymentAccount,
            screenshot: screenshotUrl,
        });
        console.log("Create Proof : ", proof)

        res.json({ success: true, proof });
    } catch (err) {
        console.error("Submit Payment Proof Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};


// ------------------------------
// ADMIN → LIST PENDING PROOFS ONLY
// ------------------------------
exports.listPendingProofs = async (req, res) => {
    try {
        const proofs = await PaymentProof.find({ status: "pending" })
            .sort({ createdAt: -1 })
            .populate("userId", "name email phone referralCode");

        res.json({ success: true, proofs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};


// ------------------------------
// ADMIN → ALL PROOFS
// ------------------------------
exports.AllPaymentProofs = async (req, res) => {
    try {
        const proofs = await PaymentProof.find()
            .populate("userId");

        res.json({ success: true, proofs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
};


// ------------------------------
// ADMIN → APPROVE OR REJECT PROOF
// ------------------------------
exports.reviewProof = async (req, res) => {
    try {
        const adminId = req.user._id;
        const { proofId } = req.params;
        const { action } = req.body;

        // find proof
        const proof = await PaymentProof.findById(proofId);
        if (!proof) return res.status(404).json({ error: "Payment proof not found" });

        // if (proof.status !== "pending")
        //     return res.status(400).json({ error: "This proof was already reviewed" });

        const user = await User.findById(proof.userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // ---------------------------------
        // APPROVE PAYMENT
        // ---------------------------------
        if (action === "approved") {

            // Mark proof approved
            proof.status = "approved";
            proof.reviewedBy = adminId;
            proof.reviewedAt = new Date();
            await proof.save();

            // Mark user as paid
            user.hasPaid = true;
            user.level = Math.max(1, user.level || 0);
            await user.save();

            console.log("Proof id :", proofId)
            // CREATE PURCHASE RECORD
            await Transaction.create({
                userId: user._id,
                amount: JOINING_FEE,
                paymentProof: proofId,
                type: "purchase",
                source: "manual-payment",
            });

            // ONLY NOW → RUN REFERRAL PAYOUTS
            if (user.parentId) {
                const parent = await User.findById(user.parentId);

                // Increase parent's referral count
                await User.updateOne(
                    { _id: user.parentId },
                    { $inc: { totalReferrals: 1 } }
                );

                // Give referral earnings
                await processReferralPayouts(null, user, parent);
            }

            return res.json({ success: true, message: "Payment approved", proof });
        }

        // ---------------------------------
        // REJECT PAYMENT
        // ---------------------------------
        // proof.status = "rejected";
        proof.status = action;
        user.hasPaid = false;
        await user.save();
        proof.reviewedBy = adminId;
        proof.reviewedAt = new Date();
        await proof.save();

        return res.json({ success: true, message: "Payment rejected", proof });

    } catch (err) {
        console.error("Review Proof Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
// ------------------------------
// USER → CREATE AVAILABLE PAYMENT METHODS
// ------------------------------
exports.createPaymentMethod = async (req, res) => {
    try {
        const { label, upiId } = req.body;

        if (!label || !upiId) {
            return res.status(400).json({ error: "Label & UPI ID required" });
        }

        let qrImageUrl = null;
        if (req.file) {
            qrImageUrl = await uploadBufferToCloudinary(
                req.file.buffer,
                req.file.originalname
            );
        }

        const newMethod = await PaymentMethod.create({
            label,
            upiId,
            qrImage: qrImageUrl,
        });

        res.json({ success: true, method: newMethod });
    } catch (err) {
        console.error("Create Payment Method Error:", err);
        res.status(500).json({ error: "Server error" });
    }
};
// ------------------------------
// USER → GET AVAILABLE PAYMENT METHODS
// ------------------------------
exports.getPaymentMethods = async (req, res) => {
    try {
        const methods = await PaymentMethod.find().lean();

        const methodsWithTotals = await Promise.all(
            methods.map(async (method) => {
                const totalReceived = await Transaction.aggregate([
                    // Join PaymentProof
                    {
                        $lookup: {
                            from: "paymentproofs",
                            localField: "paymentProof",
                            foreignField: "_id",
                            as: "proof"
                        }
                    },
                    { $unwind: "$proof" },

                    // Match paymentMethod
                    { $match: { "proof.paymentAccount": method._id } },

                    // Only count successful/approved payments
                    // { $match: { status: "completed", "proof.status": "approved" } },

                    // Sum the amount
                    {
                        $group: {
                            _id: null,
                            total: { $sum: "$amount" }
                        }
                    }
                ]);

                return {
                    ...method,
                    totalReceived: totalReceived[0]?.total || 0,
                    // totalReceived: 56415,
                    isActive: method.active,
                    createdAt: method.createdAt
                };
            })
        );

        res.json({
            success: true,
            methods: methodsWithTotals
        });

    } catch (err) {
        console.error("Error fetching payment methods:", err);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getPaymentQR = async (req, res) => {
    try {
        const activeMethod = await PaymentMethod.findOne({ active: true });

        if (!activeMethod) {
            return res.status(404).json({
                success: false,
                message: "No active payment method found"
            });
        }

        res.json({ success: true, method: activeMethod });

    } catch (err) {
        console.error("Error fetching payment method:", err);
        res.status(500).json({ error: "Server error" });
    }
};

// UPDATE Payment Method
exports.updatePaymentMethod = async (req, res) => {
    try {
        const { label, upiId } = req.body;
        const updateData = { label, upiId };

        // if (req.file) {
        //     updateData.qrImage = `/uploads/${req.file.filename}`;
        // }
        if (req.file) {
            updateData.qrImage = await uploadBufferToCloudinary(
                req.file.buffer,
                req.file.originalname
            );
        }

        const updated = await PaymentMethod.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// DELETE Payment Method
exports.deletePaymentMethod = async (req, res) => {
    try {
        await PaymentMethod.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

// TOGGLE ACTIVE (only one active allowed)
exports.togglePaymentMethod = async (req, res) => {
    try {
        const account = await PaymentMethod.findById(req.params.id);

        // deactivate all before activating new
        if (!account.active) {
            await PaymentMethod.updateMany({}, { active: false });
        }

        account.active = !account.active;
        await account.save();

        res.json({ success: true, message: "Status updated", account });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
};

