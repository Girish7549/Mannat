
const express = require('express');
const { downloadApk } = require('../controllers/downloadController');

const router = express.Router();

router.get("/apk", downloadApk);

module.exports = router;