import cron from 'node-cron';
import * as userRepo from './userQueryData.js';
import redisClient from './redisClient.js'; // Add this import

// Clean up expired tokens and old rate limit records every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Starting token and rate limit cleanup...');
    
    // Database cleanup
    await userRepo.cleanupExpiredTokens();
    await userRepo.cleanupOldRateLimits();
    
    // Redis cleanup (if Redis is available)
    try {
      console.log('🔄 Cleaning up stale Redis keys...');
      
      // Clean up expired rate limit keys
      const rateLimitKeys = await redisClient.keys('ratelimit:*');
      if (rateLimitKeys.length > 0) {
        const pipeline = redisClient.pipeline();
        for (const key of rateLimitKeys) {
          const ttl = await redisClient.ttl(key);
          if (ttl === -1) { // Keys without expiration
            pipeline.del(key);
          }
        }
        await pipeline.exec();
        console.log(`✅ Cleaned up ${rateLimitKeys.length} rate limit keys`);
      }
      
      // Clean up expired username cache keys
      const usernameKeys = await redisClient.keys('username:*');
      if (usernameKeys.length > 0) {
        const pipeline = redisClient.pipeline();
        for (const key of usernameKeys) {
          const ttl = await redisClient.ttl(key);
          if (ttl === -1) { // Keys without expiration
            pipeline.del(key);
          }
        }
        await pipeline.exec();
        console.log(`✅ Cleaned up ${usernameKeys.length} username cache keys`);
      }
      
      // Clean up old suggestion cache keys
      const suggestionKeys = await redisClient.keys('suggestions:*');
      if (suggestionKeys.length > 0) {
        const pipeline = redisClient.pipeline();
        for (const key of suggestionKeys) {
          const ttl = await redisClient.ttl(key);
          if (ttl < 300) { // Less than 5 minutes left
            pipeline.del(key);
          }
        }
        await pipeline.exec();
        console.log(`✅ Cleaned up ${suggestionKeys.length} suggestion cache keys`);
      }
      
      console.log('✅ Redis cleanup completed');
    } catch (redisErr) {
      console.error('❌ Redis cleanup failed:', redisErr.message);
    }
    
    console.log('✅ Cleanup completed successfully');
  } catch (err) {
    console.error('❌ Cleanup job failed:', err);
  }
});

export default {};