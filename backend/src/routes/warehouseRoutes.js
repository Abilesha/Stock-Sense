const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { requireAuth } = require('../middleware/auth');

router.get('/warehouses', requireAuth, warehouseController.getWarehouses);
router.post('/warehouses', requireAuth, warehouseController.createWarehouse);
router.put('/warehouses/:id', requireAuth, warehouseController.updateWarehouse);

router.get('/locations', requireAuth, warehouseController.getLocations);
router.post('/locations', requireAuth, warehouseController.createLocation);
router.put('/locations/:id', requireAuth, warehouseController.updateLocation);

module.exports = router;
