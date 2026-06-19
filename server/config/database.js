const { Sequelize } = require('sequelize');
const config = require('./index');

const isRailway = config.databaseUrl && (config.databaseUrl.startsWith('postgres://') || config.databaseUrl.startsWith('postgresql://'));
const isTest = process.env.NODE_ENV === 'test' || !!process.env.JEST_WORKER_ID;
const forceSsl = process.env.DB_SSL === 'true';
const useSsl = !isTest && (isRailway || forceSsl);

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  dialectOptions: useSsl ? {
    ssl: { require: true, rejectUnauthorized: false }
  } : {},
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à PostgreSQL établie avec succès');
  } catch (error) {
    console.error('❌ Impossible de se connecter à la base de données:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
