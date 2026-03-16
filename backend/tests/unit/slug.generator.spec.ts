// tests/unit/slug.generator.spec.ts
import { describe, it, expect } from 'vitest';
import { generateSlug } from '../../src/shared/utils/slug.generator.js';

describe('generateSlug', () => {
  it('generates a slug with the default length of 6', () => {
    const slug = generateSlug();
    expect(slug).toHaveLength(6);
  });

  it('generates a slug with a custom length', () => {
    const slug = generateSlug(10);
    expect(slug).toHaveLength(10);
  });

  it('generates only alphanumeric characters', () => {
    for (let i = 0; i < 100; i++) {
      const slug = generateSlug();
      expect(slug).toMatch(/^[A-Za-z0-9]+$/);
    }
  });

  it('generates unique slugs (statistical test over 1000 iterations)', () => {
    const slugs = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      slugs.add(generateSlug());
    }
    // All 1000 slugs should be unique
    expect(slugs.size).toBe(1000);
  });

  it('generates different slugs on consecutive calls', () => {
    const slug1 = generateSlug();
    const slug2 = generateSlug();
    // Extremely unlikely to collide
    expect(slug1).not.toBe(slug2);
  });
});
