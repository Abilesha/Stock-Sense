const dashboardService = require('../services/dashboardService');

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.query);
    res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
};
