const Feedback = require('../models/Feedback');
const logger = require('../utils/logger');

const createFeedback = async (req, res, next) => {
  try {
    const { note, commentaire, module } = req.body;
    
    const feedback = await Feedback.create({
      userId: req.user.id,
      note,
      commentaire,
      module: module || 'IA',
      statut: 'nouveau'
    });

    res.status(201).json({ success: true, feedback });
  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement du feedback:', error);
    next(error);
  }
};

const getFeedbacks = async (req, res, next) => {
  try {
    // Seul le superadmin peut voir tous les feedbacks
    const where = req.user.role === 'superadmin' ? {} : { userId: req.user.id };
    const feedbacks = await Feedback.findAll({ where, order: [['createdAt', 'DESC']] });
    res.json(feedbacks);
  } catch (error) {
    next(error);
  }
};

module.exports = { createFeedback, getFeedbacks };
