
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const user = require('../controllers/userController');
const userNetwork = require('../controllers/referralController');

router.get('/me', auth, user.me);
router.get('/leaderboard', auth, user.leaderboard);
router.get("/network", auth, userNetwork.getReferralNetwork);
router.get("/tree/:userId", userNetwork.getUserTree);
router.put("/password-update/:id", auth, user.updateEmailPassword);



module.exports = router;
