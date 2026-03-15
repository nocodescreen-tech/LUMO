const express = require('express');
const compression = require('compression');
const { connectDB, sequelize } = require('./config/database');
const config = require('./config');
const securityMiddleware = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const setupSwagger = require('./swagger/swagger');

// Initialisation de l'application
const app = express();
setupSwagger(app);

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use('/public', express.static('public'));

// Sécurité Professionnelle
securityMiddleware(app);

// Connexion à la base de données
connectDB();

// Synchronisation des modèles
if (config.env === 'development') {
  sequelize.sync({ alter: true })
    .then(() => logger.info('✅ Tables synchronisées avec succès'))
    .catch(err => logger.error('❌ Erreur de synchronisation des tables:', err));
}

// Routes
app.get('/', (req, res) => {
  res.send('🚀 API HubCommerce Pro (PostgreSQL) opérationnelle !');
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/sales', require('./routes/SaleRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));
app.use('/api/clients', require('./routes/clientRoutes'));
app.use('/api/fournisseurs', require('./routes/fournisseurRoutes'));
app.use('/api/depenses', require('./routes/depenseRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/superadmin', require('./routes/superadminRoutes'));

// Gestion centralisée des erreurs
app.use(errorHandler);

const PORT = config.port;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`
      🚀 Serveur lancé en mode ${config.env}
      📡 Port: ${PORT}
      🏠 URL: http://localhost:${PORT}
    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Le port ${PORT} est déjà utilisé. Fermez l'autre processus ou changez PORT dans votre fichier .env.`);
      process.exit(1);
    } else {
      throw err;
    }
  });

  // Gestion des erreurs non capturées
  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;