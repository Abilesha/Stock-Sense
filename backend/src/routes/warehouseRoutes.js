const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

router.get('/users', requireAuth, userController.getUsers);
router.post('/users', requireAuth, userController.createUser);
router.put('/users/:id/role', requireAuth, userController.updateUserRole);

router.get('/warehouses', requireAuth, warehouseController.getWarehouses);
router.post('/warehouses', requireAuth, warehouseController.createWarehouse);
router.put('/warehouses/:id', requireAuth, warehouseController.updateWarehouse);

router.get('/locations', requireAuth, warehouseController.getLocations);
router.post('/locations', requireAuth, warehouseController.createLocation);
router.put('/locations/:id', requireAuth, warehouseController.updateLocation);

module.exports = router;
