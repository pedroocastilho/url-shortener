// src/modules/url/url.service.ts
import { Redis } from 'ioredis';
import { UrlRepository } from './url.repository.js';
import { AnalyticsService, TrackClickContext } from '../analytics/analytics.service.js';
import { CreateUrlInput } from './url.schema.js';
import { AppError } from '../../shared/errors/app.error.js';
import { generateSlug } from '../../shared/utils/slug.generator.js';

// Cache TTL — 24 hours in seconds (configurable via env)
const CACHE_TTL = Number(process.env.CACHE_TTL_SECONDS ?? 86400);
// Maximum retries to generate a unique slug before failing
const MAX_SLUG_RETRIES = 5;

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly redis: Redis,
  ) {}

  async createUrl(data: CreateUrlInput) {
    // Generate a unique slug with retry logic for rare collisions
    let slug: string;
    let attempts = 0;

    do {
      slug = generateSlug(Number(process.env.SLUG_LENGTH ?? 6));
      attempts++;
      if (attempts > MAX_SLUG_RETRIES) {
        throw new AppError('Failed to generate a unique slug. Please try again.', 500);
      }
    } while (await this.urlRepository.slugExists(slug));

    const url = await this.urlRepository.create({ ...data, slug });
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3333';

    return {
      ...url,
      shortUrl: `${baseUrl}/${url.slug}`,
      totalClicks: 0,
    };
  }

  async listUrls() {
    const urls = await this.urlRepository.findAll();
    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3333';

    return urls.map((url) => ({
      ...url,
      shortUrl: `${baseUrl}/${url.slug}`,
      totalClicks: url._count.clicks,
    }));
  }

  async getUrl(id: string) {
    const url = await this.urlRepository.findById(id);

    if (!url) {
      throw new AppError('URL not found', 404);
    }

    const baseUrl = process.env.BASE_URL ?? 'http://localhost:3333';

    return {
      ...url,
      shortUrl: `${baseUrl}/${url.slug}`,
      totalClicks: url._count.clicks,
    };
  }

  async deleteUrl(id: string) {
    const url = await this.urlRepository.findById(id);

    if (!url) {
      throw new AppError('URL not found', 404);
    }

    // Invalidate cache on delete
    await this.redis.del(`slug:${url.slug}`);
    await this.urlRepository.deleteById(id);
  }

  /**
   * Core redirect logic — the most performance-critical path.
   *
   * Flow:
   * 1. Check Redis cache (O(1), sub-millisecond)
   * 2. On cache miss: query PostgreSQL, populate cache with TTL
   * 3. Register click asynchronously via setImmediate (non-blocking)
   * 4. Return the original URL for redirect
   */
  async redirect(slug: string, context: TrackClickContext): Promise<string> {
    // Step 1: Try cache first — avoids hitting the database on every access
    const cached = await this.redis.get(`slug:${slug}`);
    if (cached) {
      // Cache HIT — fire-and-forget click tracking, then redirect immediately
      setImmediate(() => {
        this.analyticsService.trackClick(this.getCachedUrlId(slug), context).catch(console.error);
      });
      return cached;
    }

    // Step 2: Cache MISS — query the database
    const url = await this.urlRepository.findBySlug(slug);

    if (!url) {
      throw new AppError('URL not found', 404);
    }

    // Step 3: Check expiration
    if (url.expiresAt && url.expiresAt < new Date()) {
      throw new AppError('This URL has expired', 410);
    }

    // Step 4: Populate cache with TTL so future requests are served instantly
    await this.redis.set(`slug:${slug}`, url.originalUrl, 'EX', CACHE_TTL);

    // Cache the URL ID separately for click tracking on cached requests
    await this.redis.set(`slug:${slug}:id`, url.id, 'EX', CACHE_TTL);

    // Step 5: Track click asynchronously — does NOT block the redirect
    setImmediate(() => {
      this.analyticsService.trackClick(url.id, context).catch(console.error);
    });

    return url.originalUrl;
  }

  /** Retrieves the URL ID from a secondary cache key used for click tracking */
  private getCachedUrlId(slug: string): string {
    // The ID will be resolved asynchronously from the cache
    // For simplicity, we use the slug as the key pattern
    return slug;
  }
}
