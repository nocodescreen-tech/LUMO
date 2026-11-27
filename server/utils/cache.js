// Utilisation de l'utilitaire centralisé avec mode de secours
const redis = require('./redis');

const cacheMiddleware = (duration) => async (req, res, next) => {
    if (!redis || req.method !== 'GET') {
        return next();
    }

    if(!req.user||String(req.originalUrl||req.url).length>512)return next();
    const key = `cache:${req.originalUrl || req.url}:${req.user.tenantId}:${req.user.id}:${req.user.role}:${JSON.stringify([...(req.user.permissions||[])].sort())}`;
    
    try {
        const cachedData = await redis.get(key);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Intercepter res.json pour stocker le résultat
        const originalJson = res.json;
        res.json = function(data) {
            if (res.statusCode === 200) {
                try{const json=JSON.stringify(data);if(Buffer.byteLength(json)<=256*1024)Promise.resolve(redis.setex(key,duration,json)).catch(()=>{});}catch{}
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
    const match='cache:*'+String(pattern)+'*';
    if(redis.connectionMode()==='redis'){
        let cursor='0';
        do{const result=await redis.scan(cursor,'MATCH',match,'COUNT',200);cursor=String(result[0]);const keys=result[1];for(let i=0;i<keys.length;i+=100)await redis.del(...keys.slice(i,i+100));}while(cursor!=='0');
    }else{
        const keys=await redis.keys(match);for(let i=0;i<keys.length;i+=100)await redis.del(...keys.slice(i,i+100));
    }
    } catch(error) { console.warn('Cache invalidation unavailable'); }
};

module.exports = { cacheMiddleware, invalidateCache, redis };
