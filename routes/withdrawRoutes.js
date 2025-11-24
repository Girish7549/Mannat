
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const w = require('../controllers/withdrawController');

// router.post('/request', auth, w.requestWithdraw);

// public
router.post("/req", auth, w.requestWithdraw);
router.get("/wallet", auth, w.getIncomeSummary);
router.get("/history", auth, w.getMyWithdrawRequests);

// admin
router.put("/withdraw/update/:requestId", auth, w.updateWithdrawStatus);
router.get("/admin/withdrawals", auth, w.getAllWithdrawRequests);
router.put("/admin/withdrawals/update/:requestId", auth, w.updateWithdrawStatus);





module.exports = router;
