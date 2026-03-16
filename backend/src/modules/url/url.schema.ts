// src/modules/url/url.schema.ts
import { z } from 'zod';

export const createUrlSchema = z.object({
  originalUrl: z
    .string()
    .url({ message: 'Invalid URL format. Must include http:// or https://' })
    .min(1, 'URL is required'),
  title: z.string().max(100, 'Title must be 100 characters or less').optional(),
  expiresAt: z
    .string()
    .datetime({ message: 'Invalid date format. Use ISO 8601.' })
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
});

export const urlParamSchema = z.object({
  id: z.string().cuid({ message: 'Invalid URL ID format' }),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1).max(20),
});

export type CreateUrlInput = z.infer<typeof createUrlSchema>;
