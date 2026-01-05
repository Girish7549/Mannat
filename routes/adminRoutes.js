
const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const auth = require('../middleware/auth');

// NOTE: In production add admin auth/role check
router.get('/users', auth, admin.listUsers);
router.delete("/user/:userId", auth, admin.deleteUser);
router.get("/kyc/list", auth, admin.listKycUsers);
router.post("/kyc/approve", auth, admin.approveKyc);
router.post("/kyc/reject", auth, admin.rejectKyc);

router.get('/company', auth, admin.companyStats);

router.get("/dashboard", auth, admin.getAdminDashboardStats);


module.exports = router;
