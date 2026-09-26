const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partnerController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, partnerController.getPartners);
router.post('/', requireAuth, partnerController.createPartner);

module.exports = router;
