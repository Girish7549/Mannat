
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload').upload;
const auth = require('../middleware/auth');
const kyc = require('../controllers/kycController');

router.put('/submit', auth, kyc.submit);
// router.post('/submit', auth, upload.array('files', 6), kyc.submit);
router.post('/verify', auth, kyc.verify);

module.exports = router;
