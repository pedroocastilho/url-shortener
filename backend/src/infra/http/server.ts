// src/infra/http/server.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { prisma } from '../database/prisma.client.js';
import { redis } from '../cache/redis.client.js';
import { UrlRepository } from '../../modules/url/url.repository.js';
import { AnalyticsRepository } from '../../modules/analytics/analytics.repository.js';
import { UrlService } from '../../modules/url/url.service.js';
import { AnalyticsService } from '../../modules/analytics/analytics.service.js';
import { registerUrlRoutes } from '../../modules/url/url.controller.js';
import { AppError } from '../../shared/errors/app.error.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  // ─── Plugins ───────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.FRONTEND_URL ?? '*',
    methods: ['GET', 'POST', 'DELETE'],
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'URL Shortener API',
        description: 'API for shortening URLs and tracking click analytics',
        version: '1.0.0',
      },
      tags: [
        { name: 'URLs', description: 'URL management endpoints' },
        { name: 'Analytics', description: 'Click analytics endpoints' },
        { name: 'Redirect', description: 'URL redirect endpoint' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list' },
  });

  // ─── Dependency Injection ──────────────────────────────────────────────────
  const urlRepository = new UrlRepository(prisma);
  const analyticsRepository = new AnalyticsRepository(prisma);
  const analyticsService = new AnalyticsService(analyticsRepository);
  const urlService = new UrlService(urlRepository, analyticsService, redis);

  // ─── Routes ───────────────────────────────────────────────────────────────
  registerUrlRoutes(app, urlService, analyticsService);

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // ─── Error Handler ────────────────────────────────────────────────────────
  app.setErrorHandler((error, _request, reply) => {
    // Handle Zod validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: 'Validation Error',
        message: error.message,
        details: error.validation,
      });
    }

    // Handle known application errors
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.name,
        message: error.message,
      });
    }

    // Handle unexpected errors
    app.log.error(error);
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred',
    });
  });

  return app;
}

// ─── Start Server ──────────────────────────────────────────────────────────
async function start() {
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3333);

  try {
    await redis.connect().catch(() => {
      // Ignora se já estiver conectado (ex: durante testes)
    });
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📖 API docs: http://localhost:${port}/docs`);
   } catch (err) {
    app.log.error(err);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
}

start();
