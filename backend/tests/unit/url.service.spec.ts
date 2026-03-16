// tests/unit/url.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UrlService } from '../../src/modules/url/url.service.js';
import { UrlRepository } from '../../src/modules/url/url.repository.js';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service.js';
import { AppError } from '../../src/shared/errors/app.error.js';

// ─── Mocks ────────────────────────────────────────────────────────────────
const mockUrlRepository = {
  create: vi.fn(),
  findAll: vi.fn(),
  findById: vi.fn(),
  findBySlug: vi.fn(),
  deleteById: vi.fn(),
  slugExists: vi.fn(),
} as unknown as UrlRepository;

const mockAnalyticsService = {
  trackClick: vi.fn().mockResolvedValue(undefined),
  getAnalytics: vi.fn(),
} as unknown as AnalyticsService;

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
} as any;

// ─── Factory ─────────────────────────────────────────────────────────────
function makeService() {
  return new UrlService(mockUrlRepository, mockAnalyticsService, mockRedis);
}

describe('UrlService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.BASE_URL = 'http://localhost:3333';
    process.env.SLUG_LENGTH = '6';
  });

  // ── createUrl ────────────────────────────────────────────────────────────
  describe('createUrl', () => {
    it('creates a URL and returns shortUrl', async () => {
      vi.mocked(mockUrlRepository.slugExists).mockResolvedValue(false);
      vi.mocked(mockUrlRepository.create).mockResolvedValue({
        id: 'cuid123',
        slug: 'abc123',
        originalUrl: 'https://example.com',
        title: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const service = makeService();
      const result = await service.createUrl({ originalUrl: 'https://example.com' });

      expect(result.shortUrl).toMatch(/^http:\/\/localhost:3333\//);
      expect(result.totalClicks).toBe(0);
      expect(mockUrlRepository.create).toHaveBeenCalledOnce();
    });

    it('retries slug generation on collision', async () => {
      vi.mocked(mockUrlRepository.slugExists)
        .mockResolvedValueOnce(true) // First slug collides
        .mockResolvedValueOnce(false); // Second is unique

      vi.mocked(mockUrlRepository.create).mockResolvedValue({
        id: 'cuid123',
        slug: 'newslug',
        originalUrl: 'https://example.com',
        title: null,
        expiresAt: null,
        createdAt: new Date(),
      });

      const service = makeService();
      await service.createUrl({ originalUrl: 'https://example.com' });

      // slugExists should have been called twice (once for collision, once for success)
      expect(mockUrlRepository.slugExists).toHaveBeenCalledTimes(2);
    });

    it('throws after too many slug collisions', async () => {
      vi.mocked(mockUrlRepository.slugExists).mockResolvedValue(true); // Always collides

      const service = makeService();
      await expect(service.createUrl({ originalUrl: 'https://example.com' })).rejects.toThrow(
        AppError,
      );
    });
  });

  // ── getUrl ───────────────────────────────────────────────────────────────
  describe('getUrl', () => {
    it('throws 404 when URL not found', async () => {
      vi.mocked(mockUrlRepository.findById).mockResolvedValue(null);

      const service = makeService();
      await expect(service.getUrl('nonexistent')).rejects.toThrow(
        new AppError('URL not found', 404),
      );
    });
  });

  // ── redirect ─────────────────────────────────────────────────────────────
  describe('redirect', () => {
    it('returns cached URL on cache HIT without querying the database', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue('https://cached-example.com');

      const service = makeService();
      const result = await service.redirect('abc123', {});

      expect(result).toBe('https://cached-example.com');
      expect(mockUrlRepository.findBySlug).not.toHaveBeenCalled();
    });

    it('queries the database on cache MISS and populates cache', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null); // Cache MISS
      vi.mocked(mockUrlRepository.findBySlug).mockResolvedValue({
        id: 'cuid123',
        slug: 'abc123',
        originalUrl: 'https://example.com',
        title: null,
        expiresAt: null,
        createdAt: new Date(),
      });
      vi.mocked(mockRedis.set).mockResolvedValue('OK');

      const service = makeService();
      const result = await service.redirect('abc123', {});

      expect(result).toBe('https://example.com');
      expect(mockUrlRepository.findBySlug).toHaveBeenCalledWith('abc123');
      expect(mockRedis.set).toHaveBeenCalledWith(
        'slug:abc123',
        'https://example.com',
        'EX',
        expect.any(Number),
      );
    });

    it('throws 404 for unknown slug', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(mockUrlRepository.findBySlug).mockResolvedValue(null);

      const service = makeService();
      await expect(service.redirect('unknown', {})).rejects.toThrow(
        new AppError('URL not found', 404),
      );
    });

    it('throws 410 for expired URL', async () => {
      vi.mocked(mockRedis.get).mockResolvedValue(null);
      vi.mocked(mockUrlRepository.findBySlug).mockResolvedValue({
        id: 'cuid123',
        slug: 'expired',
        originalUrl: 'https://example.com',
        title: null,
        expiresAt: new Date('2000-01-01'), // Expired
        createdAt: new Date(),
      });

      const service = makeService();
      await expect(service.redirect('expired', {})).rejects.toThrow(
        new AppError('This URL has expired', 410),
      );
    });
  });
});
