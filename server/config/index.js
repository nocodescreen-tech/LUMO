require('dotenv').config();

const parseDatabaseUrl = (url) => {
    if (!url) return null;
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parsed.port,
            user: decodeURIComponent(parsed.username),
            pass: decodeURIComponent(parsed.password),
            name: parsed.pathname.replace('/', '')
        };
    } catch { return null; }
};

const dbUrl = process.env.DATABASE_URL;
const dbParsed = dbUrl ? parseDatabaseUrl(dbUrl) : null;

module.exports = {
  env: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || null,
  port: process.env.PORT || 5000,
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE || '30d'
  },
  db: {
    host: dbParsed?.host || process.env.DB_HOST,
    port: dbParsed?.port || process.env.DB_PORT,
    name: (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID) ? (process.env.DB_NAME_TEST || process.env.DB_NAME || 'hubcommerce_db') : (dbParsed?.name || process.env.DB_NAME),
    user: dbParsed?.user || process.env.DB_USER,
    pass: dbParsed?.pass || process.env.DB_PASSWORD
  },
  ai: {
    deepseekKey: process.env.DEEPSEEK_API_KEY,
    model: process.env.AI_MODEL || 'deepseek-chat'
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
  redis: {
    url: process.env.REDIS_URL || null,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null
  }
};
