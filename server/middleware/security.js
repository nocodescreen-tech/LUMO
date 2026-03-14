const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const config = require('../config');

const securityMiddleware = (app) => {
  // Helmet pour la sécurité des headers HTTP
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS Configuration
  app.use(cors({
    origin: '*', // En développement, on laisse ouvert
    credentials: true
  }));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  });
  
  app.use('/api/', limiter);
};

module.exports = securityMiddleware;
