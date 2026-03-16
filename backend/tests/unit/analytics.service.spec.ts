// tests/unit/analytics.service.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../../src/modules/analytics/analytics.service.js';
import { AnalyticsRepository } from '../../src/modules/analytics/analytics.repository.js';

const mockRepo = {
  createClick: vi.fn(),
  getClicksByDay: vi.fn(),
  getClicksByDevice: vi.fn(),
  getClicksByCountry: vi.fn(),
  getClicksByReferrer: vi.fn(),
  getTotalClicks: vi.fn(),
} as unknown as AnalyticsRepository;

function makeService() {
  return new AnalyticsService(mockRepo);
}

describe('AnalyticsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('trackClick', () => {
    it('tracks a desktop click from a known IP', async () => {
      vi.mocked(mockRepo.createClick).mockResolvedValue(undefined);

      const service = makeService();
      await service.trackClick('url1', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        ip: '8.8.8.8',
        referrer: 'https://google.com/search',
      });

      expect(mockRepo.createClick).toHaveBeenCalledWith(
        expect.objectContaining({
          urlId: 'url1',
          device: 'desktop',
          referrer: 'google.com', // Normalized to hostname
        }),
      );
    });

    it('tracks a mobile click', async () => {
      vi.mocked(mockRepo.createClick).mockResolvedValue(undefined);

      const service = makeService();
      await service.trackClick('url1', {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
      });

      expect(mockRepo.createClick).toHaveBeenCalledWith(
        expect.objectContaining({ device: 'mobile' }),
      );
    });

    it('defaults to desktop when user-agent is absent', async () => {
      vi.mocked(mockRepo.createClick).mockResolvedValue(undefined);

      const service = makeService();
      await service.trackClick('url1', {});

      expect(mockRepo.createClick).toHaveBeenCalledWith(
        expect.objectContaining({ device: 'desktop' }),
      );
    });

    it('handles an invalid referrer URL gracefully', async () => {
      vi.mocked(mockRepo.createClick).mockResolvedValue(undefined);

      const service = makeService();
      await service.trackClick('url1', { referrer: 'not-a-url' });

      expect(mockRepo.createClick).toHaveBeenCalledWith(
        expect.objectContaining({ referrer: 'not-a-url' }),
      );
    });
  });

  describe('getAnalytics', () => {
    it('returns aggregated analytics data', async () => {
      vi.mocked(mockRepo.getTotalClicks).mockResolvedValue(42);
      vi.mocked(mockRepo.getClicksByDay).mockResolvedValue([
        { date: '2024-01-01', count: 10 },
        { date: '2024-01-02', count: 32 },
      ]);
      vi.mocked(mockRepo.getClicksByDevice).mockResolvedValue([
        { device: 'desktop', count: 30 },
        { device: 'mobile', count: 12 },
      ]);
      vi.mocked(mockRepo.getClicksByCountry).mockResolvedValue([{ country: 'BR', count: 42 }]);
      vi.mocked(mockRepo.getClicksByReferrer).mockResolvedValue([
        { referrer: 'google.com', count: 20 },
        { referrer: 'Direct', count: 22 },
      ]);

      const service = makeService();
      const result = await service.getAnalytics('url1');

      expect(result.totalClicks).toBe(42);
      expect(result.clicksByDay).toHaveLength(2);
      expect(result.clicksByDevice).toHaveLength(2);
      expect(result.clicksByCountry).toHaveLength(1);
      expect(result.clicksByReferrer).toHaveLength(2);
    });
  });
});
