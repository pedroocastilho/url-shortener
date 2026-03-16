// src/shared/utils/user-agent.parser.ts
import { UAParser } from 'ua-parser-js';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

/**
 * Parses the user-agent string and returns the device category.
 * Falls back to 'desktop' when device type cannot be determined.
 */
export function parseDeviceType(userAgent?: string): DeviceType {
  if (!userAgent) return 'desktop';

  const parser = new UAParser(userAgent);
  const deviceType = parser.getDevice().type;

  if (deviceType === 'mobile') return 'mobile';
  if (deviceType === 'tablet') return 'tablet';
  return 'desktop';
}
