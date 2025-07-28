import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    connectTimeout: 5000,
  },
  url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  pingInterval: 1000 * 60 * 5, // 5 minutes
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    try {
      await redisClient.connect();
      console.log('Connected to Redis successfully!');
    } catch (err) {
      console.error('Could not connect to Redis', err);
      // Exit process on connection failure
      process.exit(1); 
    }
  }
};

export default redisClient;