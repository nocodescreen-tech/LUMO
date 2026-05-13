const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

let redis;
let isRedisAvailable = false;

// Fallback en mémoire
const memoryCache = new Map();
const memoryFallback = {
    get: async (key) => memoryCache.get(key),
    set: async (key, val, mode, expires) => {
        memoryCache.set(key, val);
        if (expires) setTimeout(() => memoryCache.delete(key), expires * 1000);
    },
    del: async (key) => memoryCache.delete(key),
    exists: async (key) => memoryCache.has(key) ? 1 : 0,
    sadd: async (key, val) => {
        if (!memoryCache.has(key)) memoryCache.set(key, new Set());
        memoryCache.get(key).add(val);
    },
    sismember: async (key, val) => {
        const set = memoryCache.get(key);
        return (set && set.has(val)) ? 1 : 0;
    },
    setex: async (key, seconds, val) => {
        memoryCache.set(key, val);
        setTimeout(() => memoryCache.delete(key), seconds * 1000);
    },
    keys: async (pattern) => {
        // Simple string match pattern translation (very basic, but enough for cache:*)
        const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        const matchedKeys = [];
        for (const key of memoryCache.keys()) {
            if (regexPattern.test(key)) {
                matchedKeys.push(key);
            }
        }
        return matchedKeys;
    }
};

// Tentative de connexion Redis si configuré (et non par défaut sur localhost si non souhaité)
// On vérifie si REDIS_HOST a été explicitement défini dans le .env
const hasExplicitRedis = process.env.REDIS_HOST !== undefined;

if (hasExplicitRedis || config.env === 'production') {
    const redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 3) {
                logger.warn('⚠️ Redis injoignable après 3 tentatives. Passage définitif en mode mémoire.');
                return null; // Stop retrying
            }
            return Math.min(times * 100, 2000);
        }
    });

    redisClient.on('connect', () => {
        isRedisAvailable = true;
        logger.info('✅ Connecté à Redis');
    });

    redisClient.on('error', (err) => {
        if (!isRedisAvailable) {
            // Silence initial connection errors to avoid log spam
            return;
        }
        logger.error('❌ Erreur Redis:', err.message);
    });

    // Proxy pour basculer dynamiquement
    redis = new Proxy({}, {
        get: (target, prop) => {
            if (isRedisAvailable) {
                return (...args) => redisClient[prop](...args);
            }
            return memoryFallback[prop];
        }
    });

    // Déclencher la connexion
    redisClient.connect().catch(() => {
        logger.warn('⚠️ Mode secours activé : Les sessions et le cache IA utiliseront la mémoire vive.');
    });

} else {
    logger.info('ℹ️ Redis non configuré explicitement. Utilisation du mode mémoire.');
    redis = memoryFallback;
}

module.exports = redis;
