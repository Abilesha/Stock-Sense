const warehouseService = require('../services/warehouseService');

exports.getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await warehouseService.getWarehouses();
    res.json({ success: true, data: warehouses });
  } catch (err) {
    next(err);
  }
};

exports.createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.createWarehouse(req.body);
    res.status(201).json({ success: true, message: 'Warehouse created.', data: warehouse });
  } catch (err) {
    next(err);
  }
};

exports.updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
    res.json({ success: true, message: 'Warehouse updated.', data: warehouse });
  } catch (err) {
    next(err);
  }
};

exports.getLocations = async (req, res, next) => {
  try {
    const locations = await warehouseService.getLocations(req.query.warehouseId);
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
};

exports.createLocation = async (req, res, next) => {
  try {
    const location = await warehouseService.createLocation(req.body);
    res.status(201).json({ success: true, message: 'Location created.', data: location });
  } catch (err) {
    next(err);
  }
};

exports.updateLocation = async (req, res, next) => {
  try {
    const location = await warehouseService.updateLocation(req.params.id, req.body);
    res.json({ success: true, message: 'Location updated.', data: location });
  } catch (err) {
    next(err);
  }
};
