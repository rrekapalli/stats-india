import indiaMap from '@svg-maps/india';

/** Canonical state / UT names from SVG Maps India (all regions on the map). */
export const INDIA_STATE_NAMES: readonly string[] = (
  indiaMap as { locations: { name: string }[] }
).locations
  .map(location => location.name)
  .sort((a, b) => a.localeCompare(b));

export function normalizeStateName(name: string): string {
  return name.trim().toLowerCase();
}
