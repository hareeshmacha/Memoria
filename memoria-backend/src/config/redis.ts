import Redis from 'ioredis';
import { env } from './index';

// We assume env.REDIS_URL is configured, but fallback to localhost
const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

const redisOptions = {
  maxRetriesPerRequest: null,
  family: 0,
  ...(redisUrl.startsWith('rediss://') ? { tls: { rejectUnauthorized: false } } : {})
};

export const redisConnection = new Redis(redisUrl, redisOptions);

export const redisPublisher = new Redis(redisUrl, redisOptions);
export const redisSubscriber = new Redis(redisUrl, redisOptions);

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection Error:', err);
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});
