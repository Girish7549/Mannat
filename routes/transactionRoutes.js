const router = require("express").Router();
const auth = require("../middleware/auth");

const txnCtrl = require("../controllers/transactionController");

router.get("/", auth, txnCtrl.getAllTransactions);

module.exports = router;
