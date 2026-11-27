// Utilisation de l'utilitaire centralisé avec mode de secours
const redis = require('./redis');

const cacheMiddleware = (duration) => async (req, res, next) => {
    if (!redis || req.method !== 'GET') {
        return next();
    }

    const key = `cache:${req.originalUrl || req.url}:${req.user.tenantId}:${req.user.id}:${req.user.role}:${JSON.stringify(req.user.permissions||[])}`;
    
    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Intercepter res.json pour stocker le résultat
        const originalJson = res.json;
        res.json = function(data) {
            if (res.statusCode === 200) {
                Promise.resolve(redis.setex(key,duration,JSON.stringify(data))).catch(()=>{});
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

    try {
    const keysA = await redis.keys(`cache:${pattern}*`);
    const keysB = await redis.keys(`cache:*${pattern}*`);
    const keys = Array.from(new Set([...(keysA || []), ...(keysB || [])]));

    if (keys.length > 0) {
        await redis.del(...keys);
    }
    } catch(error) { console.warn('Cache invalidation unavailable'); }
};

module.exports = { cacheMiddleware, invalidateCache, redis };
