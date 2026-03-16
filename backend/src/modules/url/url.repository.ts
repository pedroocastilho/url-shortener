// src/modules/url/url.repository.ts
import { PrismaClient, Url } from '@prisma/client';
import { CreateUrlInput } from './url.schema.js';

export interface UrlWithClickCount extends Url {
  _count: { clicks: number };
}

export class UrlRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateUrlInput & { slug: string }): Promise<Url> {
    return this.db.url.create({
      data: {
        slug: data.slug,
        originalUrl: data.originalUrl,
        title: data.title,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findAll(): Promise<UrlWithClickCount[]> {
    return this.db.url.findMany({
      include: {
        _count: { select: { clicks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<UrlWithClickCount | null> {
    return this.db.url.findUnique({
      where: { id },
      include: {
        _count: { select: { clicks: true } },
      },
    });
  }

  async findBySlug(slug: string): Promise<Url | null> {
    return this.db.url.findUnique({
      where: { slug },
    });
  }

  async deleteById(id: string): Promise<Url> {
    return this.db.url.delete({ where: { id } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.db.url.count({ where: { slug } });
    return count > 0;
  }
}
