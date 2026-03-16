// src/modules/url/url.controller.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UrlService } from './url.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { createUrlSchema, urlParamSchema, slugParamSchema } from './url.schema.js';


export function registerUrlRoutes(
  app: FastifyInstance,
  urlService: UrlService,
  analyticsService: AnalyticsService,
) {
  // POST /api/urls — Create a shortened URL
  app.post(
    '/api/urls',
    {
      schema: {
        description: 'Create a new shortened URL',
        tags: ['URLs'],
        body: {
          type: 'object',
          required: ['originalUrl'],
          properties: {
            originalUrl: { type: 'string', format: 'uri' },
            title: { type: 'string', maxLength: 100 },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createUrlSchema.parse(request.body);
      const url = await urlService.createUrl(body);
      return reply.status(201).send(url);
    },
  );

  // GET /api/urls — List all URLs with click counts
  app.get(
    '/api/urls',
    {
      schema: {
        description: 'List all shortened URLs with total click counts',
        tags: ['URLs'],
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const urls = await urlService.listUrls();
      return reply.send(urls);
    },
  );

  // GET /api/urls/:id — Get a specific URL
  app.get(
    '/api/urls/:id',
    {
      schema: {
        description: 'Get details of a specific URL',
        tags: ['URLs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = urlParamSchema.parse(request.params);
      const url = await urlService.getUrl(id);
      return reply.send(url);
    },
  );

  // DELETE /api/urls/:id — Delete a URL and its clicks (cascade)
  app.delete(
    '/api/urls/:id',
    {
      schema: {
        description: 'Delete a URL and all its associated click data',
        tags: ['URLs'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = urlParamSchema.parse(request.params);
      await urlService.deleteUrl(id);
      return reply.status(204).send();
    },
  );

  // GET /api/urls/:id/analytics — Get analytics for a specific URL
  app.get(
    '/api/urls/:id/analytics',
    {
      schema: {
        description: 'Get analytics for a URL: clicks by day, device, country, referrer',
        tags: ['Analytics'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = urlParamSchema.parse(request.params);

      // Verify URL exists before fetching analytics
      await urlService.getUrl(id);

      const analytics = await analyticsService.getAnalytics(id);
      return reply.send(analytics);
    },
  );

  // GET /:slug — Redirect to original URL (the hot path)
  app.get(
    '/:slug',
    {
      schema: {
        description: 'Redirect to the original URL',
        tags: ['Redirect'],
        params: {
          type: 'object',
          properties: { slug: { type: 'string' } },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { slug } = slugParamSchema.parse(request.params);

      const context = {
        userAgent: request.headers['user-agent'],
        ip: request.headers['x-forwarded-for'] as string ?? request.ip,
        referrer: request.headers['referer'],
      };

      const originalUrl = await urlService.redirect(slug, context);

      // HTTP 302 (temporary redirect) — allows analytics tools to track the hop
      return reply.redirect(originalUrl, 302);
    },
  );
}
