const router = require("express").Router();
const auth = require("../middleware/auth");

const txnCtrl = require("../controllers/transactionController");

router.get("/", auth, txnCtrl.getAllTransactions);
router.delete("/:id", auth, txnCtrl.deleteTransaction);


module.exports = router;
