const express = require('express');
const Sentry = require("@sentry/node");
const compression = require('compression');
const helmet = require('helmet');
const { connectDB, sequelize } = require('./config/database');
const config = require('./config');
const securityMiddleware = require('./middleware/security');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const setupSwagger = require('./swagger/swagger');
const http = require('http');
const { Server } = require('socket.io');
const { initBackupCron } = require('./cron/backupCron');
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

// Initialisation de l'application
const app = express();

// Sentry Initialization (Must be first)
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

// Railway runs behind a proxy — trust the first hop
app.set('trust proxy', 1);

const server = http.createServer(app);

// Socket.io with Redis Adapter (for PM2 Cluster stability)
const io = new Server(server, { 
    cors: { origin: [process.env.CLIENT_URL,process.env.RAILWAY_PUBLIC_DOMAIN && `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`, "http://localhost:5173","http://localhost","https://localhost","capacitor://localhost","tauri://localhost","http://tauri.localhost","https://tauri.localhost"].filter(Boolean) },
    transports: ['websocket', 'polling']
});

// Setup Redis Adapter (supports REDIS_URL for Railway or individual env vars)
const redisOptions = config.redis.url ? config.redis.url : {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    lazyConnect: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
        if (times > 3) {
            return null; // Arrêter d'essayer après 3 tentatives
        }
        return Math.min(times * 100, 3000);
    }
};

const pubClient = new Redis(redisOptions);
const subClient = pubClient.duplicate();

let redisAdapterFailed = false;

// Error handling for Redis clients (Silenced during startup to avoid log spam)
pubClient.on('error', () => {});
subClient.on('error', () => {});

// Use adapter with safety
pubClient.connect().then(() => {
    logger.info('✅ Socket.io Redis Adapter active');
    io.adapter(createAdapter(pubClient, subClient));
}).catch((err) => {
    redisAdapterFailed = true;
    logger.warn('⚠️ Socket.io Redis Adapter failed. Falling back to memory (Cluster sync disabled).');
});

global.io = io;

io.use(async(socket,next)=>{
 try{
  const token=socket.handshake.auth?.token;
  const jwt=require('jsonwebtoken'),redis=require('./utils/redis'),User=require('./models/User');
  if(typeof token!=='string'||await redis.exists('blacklist:'+token))return next(new Error('Unauthorized'));
  const decoded=jwt.verify(token,config.jwt.secret,{algorithms:['HS256']});
  if(decoded.type!=='access'||!decoded.sessionId)return next(new Error('Unauthorized'));
  const user=await User.findByPk(decoded.id);
  if(!user||user.isSuspended||!(user.activeSessions||[]).some(s=>s.sessionId===decoded.sessionId))return next(new Error('Unauthorized'));
  socket.data.userId=user.id;socket.data.tenantId=user.parentId||user.id;
  next();
 }catch(_){next(new Error('Unauthorized'))}
});
io.on("connection",socket=>{socket.join(`user_${socket.data.tenantId}`);});

setupSwagger(app);

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use('/public', express.static('public'));

// Sécurité Professionnelle
securityMiddleware(app);

// Logging des requêtes (Optimisation Performance & Debug)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Connexion à la base de données
connectDB();

// IMPORTANT: sync({ alter: true }) was causing passwords to be re-hashed on every restart
// because Sequelize would trigger column-level hooks. Use alter: false in all environments.
// Run migrations manually when schema changes are needed.
if (config.env === 'development') {
  sequelize.sync({ alter: false })
    .then(() => logger.info('✅ Tables vérifiées avec succès (alter: false - pas de modification auto)'))
    .catch(err => logger.error('❌ Erreur de vérification des tables:', err));
}

// Routes
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
  res.send('🚀 API LUMO Pro (PostgreSQL) opérationnelle !');
});

// Versioning API
const v1Routes = express.Router();

// Redirection pour compatibilité (supporte /api/auth et /api/v1/auth)
app.use('/api', v1Routes);
app.use('/api/v1', v1Routes);

v1Routes.use('/auth', require('./routes/authRoutes'));
v1Routes.use('/products', require('./routes/productRoutes'));
v1Routes.use('/sales', require('./routes/SaleRoutes'));
v1Routes.use('/clients', require('./routes/clientRoutes'));
v1Routes.use('/suppliers', require('./routes/fournisseurRoutes'));
v1Routes.use('/fournisseurs', require('./routes/fournisseurRoutes'));
v1Routes.use('/purchases', require('./routes/purchaseRoutes'));
v1Routes.use('/achats', require('./routes/purchaseRoutes'));
v1Routes.use('/stats', require('./routes/statsRoutes'));
v1Routes.use('/activities', require('./routes/activiteRoutes'));
v1Routes.use('/activites', require('./routes/activiteRoutes'));
v1Routes.use('/ai', require('./routes/aiRoutes'));
v1Routes.use('/superadmin', require('./routes/superadminRoutes'));
v1Routes.use('/notifications', require('./routes/notificationRoutes'));
v1Routes.use('/cash-sessions', require('./routes/cashRoutes'));
v1Routes.use('/cash', require('./routes/cashRoutes'));
v1Routes.use('/backup', require('./routes/backupRoutes'));
v1Routes.use('/ux', require('./routes/uxRoutes'));
v1Routes.use('/subusers', require('./routes/subUserRoutes'));
v1Routes.use('/staff-payments', require('./routes/staffPaymentRoutes'));
v1Routes.use('/newsletter', require('./routes/newsletterRoutes'));
v1Routes.use('/search', require('./routes/searchRoutes'));
v1Routes.use('/contact', require('./routes/contactRoutes'));

app.get('/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.status(200).json({ 
            status: 'UP', 
            database: 'CONNECTED',
            timestamp: new Date(),
            env: config.env
        });
    } catch (err) {
        res.status(503).json({ 
            status: 'DOWN', 
            database: 'DISCONNECTED',
            error: err.message 
        });
    }
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error(`Non trouvé - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// The error handler must be before any other error middleware and after all controllers
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Gestion centralisée des erreurs
app.use(errorHandler);

const PORT = config.port;

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`
      🚀 Serveur lancé en mode ${config.env}
      📡 Port: ${PORT}
      🏠 URL: http://localhost:${PORT}
      ⚡ WebSockets activés
    `);
    
    // Initialisation des tâches planifiées (Cron)
    initBackupCron();
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

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);

  const status = err.status || 500;
  const message = err.message || 'Une erreur interne est survenue.';
  
  // Sanitize errors for production
  const errorResponse = {
    success: false,
    message: config.env === 'production' ? (status === 500 ? 'Erreur serveur interne' : message) : message,
  };
  if (config.env !== 'production') {
    errorResponse.stack = err.stack;
  }

  // Handle Sequelize specific errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ success: false, message: 'Cette ressource existe déjà.' });
  }

  res.status(status).json(errorResponse);
});

module.exports = app;