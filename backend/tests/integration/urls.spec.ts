// tests/integration/urls.spec.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';
import { buildApp } from '../../src/infra/http/server.js';
import { prisma } from '../../src/infra/database/prisma.client.js';
import { redis } from '../../src/infra/cache/redis.client.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  // Clean up test data between tests
  await prisma.click.deleteMany();
  await prisma.url.deleteMany();
  await redis.flushdb();
});

describe('POST /api/urls', () => {
  it('creates a shortened URL and returns 201', async () => {
    const response = await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'https://example.com', title: 'Test URL' })
      .expect(201);

    expect(response.body).toMatchObject({
      originalUrl: 'https://example.com',
      title: 'Test URL',
      totalClicks: 0,
    });
    expect(response.body.slug).toHaveLength(6);
    expect(response.body.shortUrl).toContain(response.body.slug);
  });

  it('returns 400 for an invalid URL', async () => {
    await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'not-a-valid-url' })
      .expect(400);
  });

  it('returns 400 when originalUrl is missing', async () => {
    await supertest(app.server).post('/api/urls').send({}).expect(400);
  });
});

describe('GET /api/urls', () => {
  it('returns an empty array initially', async () => {
    const response = await supertest(app.server).get('/api/urls').expect(200);
    expect(response.body).toEqual([]);
  });

  it('returns all created URLs with click counts', async () => {
    await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'https://example.com' });

    await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'https://another.com' });

    const response = await supertest(app.server).get('/api/urls').expect(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toHaveProperty('totalClicks', 0);
  });
});

describe('GET /:slug (redirect)', () => {
  it('redirects to the original URL with HTTP 302', async () => {
    const createRes = await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'https://example.com' });

    const { slug } = createRes.body;

    const redirectRes = await supertest(app.server).get(`/${slug}`).expect(302);

    expect(redirectRes.headers.location).toBe('https://example.com');
  });

  it('returns 404 for an unknown slug', async () => {
    await supertest(app.server).get('/unknown123').expect(404);
  });

  it('returns 410 for an expired URL', async () => {
    const createRes = await supertest(app.server).post('/api/urls').send({
      originalUrl: 'https://example.com',
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Already expired
    });

    const { slug } = createRes.body;

    await supertest(app.server).get(`/${slug}`).expect(410);
  });
});

describe('GET /api/urls/:id/analytics', () => {
  it('returns analytics with zero clicks for a new URL', async () => {
    const createRes = await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'https://example.com' });

    const { id } = createRes.body;

    const response = await supertest(app.server)
      .get(`/api/urls/${id}/analytics`)
      .expect(200);

    expect(response.body).toMatchObject({
      totalClicks: 0,
      clicksByDay: [],
      clicksByDevice: [],
      clicksByCountry: [],
      clicksByReferrer: [],
    });
  });
});

describe('DELETE /api/urls/:id', () => {
  it('deletes a URL and returns 204', async () => {
    const createRes = await supertest(app.server)
      .post('/api/urls')
      .send({ originalUrl: 'https://example.com' });

    const { id } = createRes.body;

    await supertest(app.server).delete(`/api/urls/${id}`).expect(204);

    // Verify it's gone
    await supertest(app.server).get(`/api/urls/${id}`).expect(404);
  });

  it('returns 404 when deleting a non-existent URL', async () => {
  await supertest(app.server)
    .delete('/api/urls/cldoesnotexist0000000000x')
    .expect(404);
  });
});
