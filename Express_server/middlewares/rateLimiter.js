import redisClient from '../utils/redisClient.js';
import * as userRepo from '../utils/userQueryData.js';

const fixedWindowRateLimiter = ({
  keyGenerator = (req) => req.ip,
  windowSizeInSeconds = 60,
  maxRequests = 5,
  message = 'Too many requests. Please try again later.',
  endpoint = 'general'
}) => {
  return async (req, res, next) => {
    // Ensure identifier is converted to a simple string
    const rawIdentifier = keyGenerator(req);
    // Convert to string if it's an object
    const identifier = typeof rawIdentifier === 'object' 
      ? (rawIdentifier.email || JSON.stringify(rawIdentifier)) 
      : String(rawIdentifier);
      
    const redisKey = `ratelimit:${identifier}:${endpoint}`;
    
    try {
      // Try Redis first (faster)
      const current = await redisClient.incr(redisKey);
      
      if (current === 1) {
        await redisClient.expire(redisKey, windowSizeInSeconds);
      }
      
      if (current > maxRequests) {
        // Just return 429 without logging violations
        return res.status(429).json({ message });
      }
      
      // Also track in database for persistence
      if (current === 1) {
        await userRepo.initializeRateLimit(identifier, endpoint);
      } else {
        await userRepo.updateRateLimit(identifier, endpoint);
      }
      
      next();
    } catch (err) {
      console.error('Rate Limiter Error:', err);
      // Fallback to database-only rate limiting
      try {
        const allowed = await userRepo.checkDatabaseRateLimit(
          identifier, 
          endpoint, 
          maxRequests, 
          windowSizeInSeconds
        );
        
        if (!allowed) {
          // Just return 429 without logging violations
          return res.status(429).json({ message });
        }
        
        await userRepo.initializeRateLimit(identifier, endpoint);
        next();
      } catch (dbErr) {
        console.error('Database rate limiter also failed:', dbErr);
        // If both Redis and DB fail, allow the request but log the error
        next();
      }
    }
  };
};

export default fixedWindowRateLimiter;