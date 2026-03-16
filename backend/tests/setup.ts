// tests/setup.ts
import { afterAll, beforeAll } from 'vitest';
import { prisma } from '../src/infra/database/prisma.client.js';
import { redis } from '../src/infra/cache/redis.client.js';

beforeAll(async () => {
  // Connect to test DB and Redis before running tests
  await redis.connect().catch(() => {
    // Redis may already be connected
  });
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
