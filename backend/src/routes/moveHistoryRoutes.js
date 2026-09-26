const express = require('express');
const router = express.Router();
const moveHistoryController = require('../controllers/moveHistoryController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, moveHistoryController.getMoveHistory);

module.exports = router;
