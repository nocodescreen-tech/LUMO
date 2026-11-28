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
app.disable('x-powered-by');
// ERP responses must not be stored by browser or intermediary HTTP caches.
app.use('/api',(_req,res,next)=>{res.set('Cache-Control','private, no-store');next()});

// Sentry Initialization (Must be first)
if (process.env.SENTRY_DSN) {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
  app.use(Sentry.Handlers.requestHandler());
}

// Railway runs behind a proxy — trust the first hop
app.set('trust proxy', 1);

const server = http.createServer(app);

// Socket.io with Redis Adapter (for PM2 Cluster stability)
const {allowedOrigin}=require('./middleware/sessionOrigin');
const {socketIdentity}=require('./middleware/socketAuth');
const io = new Server(server, {
    cors:{origin:(origin,callback)=>callback(null,!origin||allowedOrigin(origin))},
    allowRequest:(req,callback)=>callback(null,!req.headers.origin||allowedOrigin(req.headers.origin)),
    transports:['websocket','polling']
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
 const identity=await socketIdentity(socket.handshake.auth?.token,socket.handshake.headers.origin);
 if(!identity)return next(new Error('Unauthorized'));
 Object.assign(socket.data,identity);
 next();
});
io.on('connection',socket=>{
 socket.join('user_'+socket.data.userId);
 let checking=false;
 const timer=setInterval(async()=>{
  if(checking)return;checking=true;
  try{
   const identity=await socketIdentity(socket.handshake.auth?.token,socket.handshake.headers.origin);
   if(!identity||identity.userId!==socket.data.userId||identity.tenantId!==socket.data.tenantId)socket.disconnect(true);
  }finally{checking=false}
 },60000);
 timer.unref?.();socket.once('disconnect',()=>clearInterval(timer));
});

// Developer documentation is not public by default in production.
if(config.env!=='production'||process.env.LUMO_PUBLIC_API_DOCS==='true')setupSwagger(app);

// Middlewares de base
app.use(require('./utils/operationalMetrics').observe);
app.use(['/api/backup/preview','/api/v1/backup/preview'],express.json({limit:'8mb'}));
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
    logger.info(`${req.method} ${res.statusCode} - ${duration}ms request=${req.operationRequestId}`);
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
v1Routes.use('/finance', require('./routes/financeRoutes'));
v1Routes.use('/workspace', require('./routes/workspaceRoutes'));
v1Routes.use('/inventory', require('./routes/inventoryRoutes'));
v1Routes.use('/repairs', require('./routes/repairRoutes'));
v1Routes.use('/documents', require('./routes/documentRoutes'));
v1Routes.use('/platform/billing', require('./routes/platformBillingRoutes'));
v1Routes.use('/support', require('./routes/supportRoutes'));
v1Routes.use('/expenses', require('./routes/depenseRoutes'));
v1Routes.use('/depenses', require('./routes/depenseRoutes'));
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
            timestamp: new Date() 
        });
    }
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error('Route introuvable');
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
    require('./cron/notificationCron').initNotificationCron();
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