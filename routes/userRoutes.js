
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const user = require('../controllers/userController');
const userNetwork = require('../controllers/referralController');

router.get('/me', auth, user.me);
router.get('/leaderboard', auth, user.leaderboard);
router.get("/network", auth, userNetwork.getReferralNetwork);


module.exports = router;
