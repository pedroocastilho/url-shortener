// src/infra/cache/redis.client.ts
import Redis from 'ioredis';

/**
 * Redis client configured with lazyConnect so the connection
 * is only established when first used, not at module import time.
 * This makes testing easier and startup faster.
 */
export const redis = new Redis({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
  lazyConnect: true,
  // Retry strategy: exponential backoff up to 3 seconds
  retryStrategy(times) {
    const delay = Math.min(times * 50, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

redis.on('connect', () => {
  console.log('[Redis] Connected successfully');
});
