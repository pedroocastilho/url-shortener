// src/modules/analytics/analytics.service.ts
import geoip from 'geoip-lite';
import { AnalyticsRepository } from './analytics.repository.js';
import { parseDeviceType } from '../../shared/utils/user-agent.parser.js';

export interface TrackClickContext {
  userAgent?: string;
  ip?: string;
  referrer?: string;
}

export interface AnalyticsResult {
  totalClicks: number;
  clicksByDay: Array<{ date: string; count: number }>;
  clicksByDevice: Array<{ device: string; count: number }>;
  clicksByCountry: Array<{ country: string; count: number }>;
  clicksByReferrer: Array<{ referrer: string; count: number }>;
}

export class AnalyticsService {
  constructor(private readonly analyticsRepository: AnalyticsRepository) {}

  /**
   * Tracks a click asynchronously — called via setImmediate so it
   * never blocks the redirect response.
   */
  async trackClick(urlId: string, context: TrackClickContext): Promise<void> {
    const device = parseDeviceType(context.userAgent);

    // Resolve country from IP using geoip-lite (local database, no external calls)
    let country: string | undefined;
    if (context.ip) {
      const cleanIp = context.ip.split(',')[0].trim(); // Handle X-Forwarded-For
      const geo = geoip.lookup(cleanIp);
      country = geo?.country ?? undefined;
    }

    // Normalize referrer — strip query params to avoid noise
    let referrer: string | undefined;
    if (context.referrer) {
      try {
        const url = new URL(context.referrer);
        referrer = url.hostname;
      } catch {
        referrer = context.referrer;
      }
    }

    await this.analyticsRepository.createClick({
      urlId,
      device,
      country,
      referrer,
    });
  }

  async getAnalytics(urlId: string): Promise<AnalyticsResult> {
    const [totalClicks, clicksByDay, clicksByDevice, clicksByCountry, clicksByReferrer] =
      await Promise.all([
        this.analyticsRepository.getTotalClicks(urlId),
        this.analyticsRepository.getClicksByDay(urlId),
        this.analyticsRepository.getClicksByDevice(urlId),
        this.analyticsRepository.getClicksByCountry(urlId),
        this.analyticsRepository.getClicksByReferrer(urlId),
      ]);

    return {
      totalClicks,
      clicksByDay,
      clicksByDevice,
      clicksByCountry,
      clicksByReferrer,
    };
  }
}
