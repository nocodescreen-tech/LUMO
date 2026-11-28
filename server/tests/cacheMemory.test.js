const redis=require('../utils/redis');
describe('process memory cache',()=>{
 test('multi-key deletion and TTL overwrite',async()=>{jest.useFakeTimers();try{await redis.setex('cache:test:a',1,'old');await redis.setex('cache:test:a',10,'new');jest.advanceTimersByTime(1100);expect(await redis.get('cache:test:a')).toBe('new');await redis.setex('cache:test:b',10,'b');expect(await redis.del('cache:test:a','cache:test:b')).toBe(2);expect(await redis.get('cache:test:b')).toBeUndefined()}finally{jest.useRealTimers()}});
 test('literal regex characters in fallback pattern',async()=>{await redis.setex('cache:stats?x=1',10,'a');await redis.setex('cache:statsxx=1',10,'b');expect(await redis.keys('cache:stats?*')).toEqual(['cache:stats?x=1']);await redis.del('cache:stats?x=1','cache:statsxx=1')});
});
