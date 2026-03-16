// src/types/index.ts

export interface ShortUrl {
  id: string;
  slug: string;
  originalUrl: string;
  shortUrl: string;
  title: string | null;
  expiresAt: string | null;
  createdAt: string;
  totalClicks: number;
}

export interface CreateUrlPayload {
  originalUrl: string;
  title?: string;
  expiresAt?: string;
}

export interface DailyClick {
  date: string;
  count: number;
}

export interface DeviceClick {
  device: string;
  count: number;
}

export interface CountryClick {
  country: string;
  count: number;
}

export interface ReferrerClick {
  referrer: string;
  count: number;
}

export interface Analytics {
  totalClicks: number;
  clicksByDay: DailyClick[];
  clicksByDevice: DeviceClick[];
  clicksByCountry: CountryClick[];
  clicksByReferrer: ReferrerClick[];
}
