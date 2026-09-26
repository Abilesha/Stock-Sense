const express = require('express');
const router = express.Router();
const operationController = require('../controllers/operationController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, operationController.getOperations);
router.get('/:id', requireAuth, operationController.getOperationById);
router.post('/', requireAuth, operationController.createOperation);
router.put('/:id', requireAuth, operationController.updateOperation);
router.post('/:id/validate', requireAuth, operationController.validateOperation);
router.post('/:id/cancel', requireAuth, operationController.cancelOperation);

module.exports = router;
