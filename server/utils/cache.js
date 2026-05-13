// Utilisation de l'utilitaire centralisé avec mode de secours
const redis = require('./redis');

const cacheMiddleware = (duration) => async (req, res, next) => {
    if (!redis || req.method !== 'GET') {
        return next();
    }

    const key = `cache:${req.originalUrl || req.url}:${req.user.tenantId}`;
    
    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Intercepter res.json pour stocker le résultat
        const originalJson = res.json;
        res.json = function(data) {
            if (res.statusCode === 200) {
                redis.setex(key, duration, JSON.stringify(data));
            }
            return originalJson.call(this, data);
        };
        next();
    } catch (error) {
        next();
    }
};

const invalidateCache = async (pattern) => {
    if (!redis) return;
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) {
        await redis.del(...keys);
    }
};

module.exports = { cacheMiddleware, invalidateCache, redis };
