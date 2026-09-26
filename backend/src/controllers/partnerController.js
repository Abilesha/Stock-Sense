const partnerService = require('../services/partnerService');

exports.getPartners = async (req, res, next) => {
  try {
    const partners = await partnerService.getPartners(req.query.type);
    res.json({ success: true, data: partners });
  } catch (err) {
    next(err);
  }
};

exports.createPartner = async (req, res, next) => {
  try {
    const partner = await partnerService.createPartner(req.body);
    res.status(201).json({ success: true, message: 'Partner created.', data: partner });
  } catch (err) {
    next(err);
  }
};
