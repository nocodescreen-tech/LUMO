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

// Gestion centralisée des erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = config.port;
const server = app.listen(PORT, () => {
  logger.info(`
    🚀 Serveur lancé en mode ${config.env}
    📡 Port: ${PORT}
    🏠 URL: http://localhost:${PORT}
  `);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});