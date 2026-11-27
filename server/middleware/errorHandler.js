const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 ? 'Erreur Serveur Interne' : (err.message || 'Requête invalide')
  });
};

module.exports = errorHandler;
