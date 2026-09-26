const moveHistoryService = require('../services/moveHistoryService');

exports.getMoveHistory = async (req, res, next) => {
  try {
    const moves = await moveHistoryService.getMoveHistory(req.query);
    res.json({ success: true, data: moves });
  } catch (err) {
    next(err);
  }
};
