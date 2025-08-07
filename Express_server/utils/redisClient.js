import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis Cloud');
});

redisClient.on('disconnect', () => {
  console.log('❌ Disconnected from Redis Cloud');
});

// Connect immediately
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Error connecting to Redis Cloud:', err);
  }
})();

// Add pipeline method for batch operations
redisClient.pipeline = () => {
  const commands = [];
  return {
    del: (key) => {
      commands.push(['del', key]);
      return this;
    },
    exec: async () => {
      if (commands.length === 0) return [];
      const results = [];
      for (const [command, ...args] of commands) {
        try {
          const result = await redisClient[command](...args);
          results.push([null, result]);
        } catch (err) {
          results.push([err, null]);
        }
      }
      return results;
    }
  };
};

export default redisClient;
