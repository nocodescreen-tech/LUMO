const Redis = require('ioredis');
const config = require('../config');
const logger = require('./logger');

let redis;
let isRedisAvailable = false;

// Fallback en mémoire
const memoryCache = new Map();
const expiries=new Map(),cacheKeys=new Map();
const drop=key=>{const timer=expiries.get(key);if(timer)clearTimeout(timer);expiries.delete(key);cacheKeys.delete(key);return memoryCache.delete(key)};
function put(key,val,seconds){drop(key);if(String(key).startsWith('cache:')){while(cacheKeys.size>=500)drop(cacheKeys.keys().next().value);cacheKeys.set(key,true)}memoryCache.set(key,val);if(seconds){const timer=setTimeout(()=>drop(key),seconds*1000);timer.unref?.();expiries.set(key,timer)}}
const memoryFallback = {
    get: async (key) => memoryCache.get(key),
    set: async (key, val, mode, expires) => {
        put(key,val,expires);
    },
    del: async (...keys) => keys.reduce((n,key)=>n+Number(drop(key)),0),
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
        put(key,val,seconds);
    },
    keys: async (pattern) => {
        // Simple string match pattern translation (very basic, but enough for cache:*)
        const regexPattern = new RegExp('^' + pattern.split('*').map(p=>p.replace(/[.*+?^$\${}()|[\]\\]/g,'\\$&')).join('.*') + '$');
        const matchedKeys = [];
        for (const key of memoryCache.keys()) {
            if (regexPattern.test(key)) {
                matchedKeys.push(key);
            }
        }
        return matchedKeys;
    }
};

// Tentative de connexion Redis si configuré (ou via REDIS_URL sur Railway)
const hasExplicitRedis = process.env.REDIS_HOST !== undefined || process.env.REDIS_URL !== undefined;

if (hasExplicitRedis || config.env === 'production') {
    const redisOptions = config.redis.url ? config.redis.url : {
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 3) {
                logger.warn('⚠️ Redis injoignable après 3 tentatives. Passage définitif en mode mémoire.');
                return null;
            }
            return Math.min(times * 100, 2000);
        }
    };

    const redisClient = new Redis(redisOptions);

    redisClient.on('connect', () => {
        isRedisAvailable = true;
        logger.info('✅ Connecté à Redis');
    });

    redisClient.on('close',()=>{isRedisAvailable=false;});
    redisClient.on('end',()=>{isRedisAvailable=false;});
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

module.exports = new Proxy(redis,{get(target,prop){if(prop==='connectionMode')return ()=>isRedisAvailable?'redis':'process-memory';return target[prop];}});
