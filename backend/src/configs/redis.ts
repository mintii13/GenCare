import { createClient } from 'redis';

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379')
  },
  url: process.env.REDIS_URL ?? 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
export default redisClient;