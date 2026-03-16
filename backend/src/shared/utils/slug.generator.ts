// src/shared/utils/slug.generator.ts
import { customAlphabet } from 'nanoid';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/**
 * Generates a URL-safe slug using a custom alphabet (alphanumeric only).
 * Default length is 6 chars, giving 62^6 ≈ 56 billion combinations.
 * Collision probability is virtually zero for typical use cases.
 */
export function generateSlug(length = 6): string {
  const nanoid = customAlphabet(ALPHABET, length);
  return nanoid();
}
