// src/modules/analytics/analytics.repository.ts
import { PrismaClient } from '@prisma/client';

export interface ClickCreateData {
  urlId: string;
  device: string;
  country?: string;
  referrer?: string;
}

export interface DailyClickData {
  date: string;
  count: number;
}

export interface DeviceData {
  device: string;
  count: number;
}

export interface CountryData {
  country: string;
  count: number;
}

export interface ReferrerData {
  referrer: string;
  count: number;
}

export class AnalyticsRepository {
  constructor(private readonly db: PrismaClient) {}

  async createClick(data: ClickCreateData): Promise<void> {
    await this.db.click.create({ data });
  }

  async getClicksByDay(urlId: string, days = 30): Promise<DailyClickData[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Use raw query for efficient date grouping
    const result = await this.db.$queryRaw<Array<{ date: Date; count: bigint }>>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as count
      FROM "Click"
      WHERE "urlId" = ${urlId}
        AND "createdAt" >= ${since}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    return result.map((row) => ({
      date: row.date.toISOString().split('T')[0],
      count: Number(row.count),
    }));
  }

  async getClicksByDevice(urlId: string): Promise<DeviceData[]> {
    const result = await this.db.click.groupBy({
      by: ['device'],
      where: { urlId },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
    });

    return result.map((row) => ({
      device: row.device,
      count: row._count.device,
    }));
  }

  async getClicksByCountry(urlId: string, limit = 10): Promise<CountryData[]> {
    const result = await this.db.click.groupBy({
      by: ['country'],
      where: { urlId, country: { not: null } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: limit,
    });

    return result.map((row) => ({
      country: row.country ?? 'Unknown',
      count: row._count.country,
    }));
  }

  async getClicksByReferrer(urlId: string, limit = 10): Promise<ReferrerData[]> {
    const result = await this.db.click.groupBy({
      by: ['referrer'],
      where: { urlId },
      _count: { referrer: true },
      orderBy: { _count: { referrer: 'desc' } },
      take: limit,
    });

    return result.map((row) => ({
      referrer: row.referrer ?? 'Direct',
      count: row._count.referrer,
    }));
  }

  async getTotalClicks(urlId: string): Promise<number> {
    return this.db.click.count({ where: { urlId } });
  }
}
