const router = require("express").Router();
const auth = require("../middleware/auth");
// const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/paymentUpload");

const paymentCtrl = require("../controllers/paymentController");

router.post("/submit-proof", auth, upload.single("screenshot"), paymentCtrl.submitProof);

// Payment methods
router.get("/methods", auth, paymentCtrl.getPaymentMethods);
router.get("/paymentQR", auth, paymentCtrl.getPaymentQR);
router.post("/admin/create-method", auth, upload.single("qrImage"), paymentCtrl.createPaymentMethod);
router.put("/admin/update/:id", upload.single("qrImage"), paymentCtrl.updatePaymentMethod);
router.delete("/admin/delete/:id", paymentCtrl.deletePaymentMethod);
router.put("/admin/toggle/:id", paymentCtrl.togglePaymentMethod);


// admin routes
router.get("/admin/pending", auth, paymentCtrl.listPendingProofs);
router.get("/admin/all-payment-proof", auth, paymentCtrl.AllPaymentProofs);
router.put("/admin/review/:proofId", auth, paymentCtrl.reviewProof);

module.exports = router;
