const express = require('express');
const router = express.Router();
const lotteryController = require('../controllers/lotteryController');

// Tất cả các link thống kê nâng cao sẽ đi qua route này
router.get('/', lotteryController.getAdvancedSequences);

module.exports = router;