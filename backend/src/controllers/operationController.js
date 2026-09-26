const operationService = require('../services/operationService');

exports.getOperations = async (req, res, next) => {
  try {
    const operations = await operationService.getOperations(req.query);
    res.json({ success: true, data: operations });
  } catch (err) {
    next(err);
  }
};

exports.getOperationById = async (req, res, next) => {
  try {
    const operation = await operationService.getOperationById(req.params.id);
    res.json({ success: true, data: operation });
  } catch (err) {
    next(err);
  }
};

exports.createOperation = async (req, res, next) => {
  try {
    const operation = await operationService.createOperation({
      ...req.body,
      userId: req.user ? req.user.id : null,
    });
    res.status(201).json({
      success: true,
      message: `${operation.type.toUpperCase()} created successfully.`,
      data: operation,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateOperation = async (req, res, next) => {
  try {
    const operation = await operationService.updateOperation(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Operation updated successfully.',
      data: operation,
    });
  } catch (err) {
    next(err);
  }
};

exports.validateOperation = async (req, res, next) => {
  try {
    const result = await operationService.validateOperation(req.params.id);
    res.json({
      success: true,
      message: result.message || `Operation ${result.reference} validated successfully. Stock levels updated.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

exports.cancelOperation = async (req, res, next) => {
  try {
    const result = await operationService.cancelOperation(req.params.id);
    res.json({
      success: true,
      message: `Operation ${result.reference} canceled.`,
    });
  } catch (err) {
    next(err);
  }
};
