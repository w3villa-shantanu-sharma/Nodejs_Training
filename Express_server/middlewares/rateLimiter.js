const redisClient = require('../utils/redisClient');

const fixedWindowRateLimiter = ({
  keyGenerator = (req) => req.ip,
  windowSizeInSeconds = 60,
  maxRequests = 5,
  message = 'Too many requests. Please try again later.',
}) => {
  return async (req, res, next) => {
    const key = `ratelimit:${keyGenerator(req)}`;
    try {
      const current = await redisClient.incr(key);

      if (current === 1) {
        // First request, set expiration
        await redisClient.expire(key, windowSizeInSeconds);
      }

      if (current > maxRequests) {
        return res.status(429).json({ message });
      }

      next();
    } catch (err) {
      console.error('Fixed Window Rate Limiter Error:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

module.exports = fixedWindowRateLimiter;
