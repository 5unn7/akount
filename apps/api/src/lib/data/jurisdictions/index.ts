import type { JurisdictionConfig } from '@akount/types';
import usData from './us.json';
import caData from './ca.json';
import inData from './in.json';

const jurisdictions: Record<string, JurisdictionConfig> = {
  US: usData as JurisdictionConfig,
  CA: caData as JurisdictionConfig,
  IN: inData as JurisdictionConfig,
};

/**
 * Get jurisdiction configuration for a country code.
 * Returns null for unsupported countries.
 */
export function getJurisdictionConfig(
  countryCode: string
): JurisdictionConfig | null {
  return jurisdictions[countryCode.toUpperCase()] ?? null;
}

/**
 * Get all supported jurisdiction country codes.
 */
export function getSupportedJurisdictions(): string[] {
  return Object.keys(jurisdictions);
}
