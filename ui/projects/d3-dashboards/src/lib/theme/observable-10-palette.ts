/**
 * D3 Observable 10 categorical scheme.
 * @see https://observablehq.com/@d3/color-schemes
 * @see https://d3js.org/d3-scale-chromatic/categorical
 */
export const OBSERVABLE_10 = [
  '#4269d0',
  '#efb118',
  '#ff725c',
  '#6cc5b0',
  '#3ca951',
  '#ff8ab7',
  '#a463f2',
  '#97bbf5',
  '#9c6b4e',
  '#9498a0'
] as const;

export type Observable10Color = (typeof OBSERVABLE_10)[number];

export function observable10Color(index: number): string {
  const n = OBSERVABLE_10.length;
  return OBSERVABLE_10[((index % n) + n) % n]!;
}

export function observable10ColorByName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return observable10Color(hash);
}

/** Signal widget + stocks treemap gain/loss fills (Entry / Exit preferred). */
export const OBSERVABLE_10_SIGNAL = {
  entry: OBSERVABLE_10[4],
  exit: OBSERVABLE_10[2],
  neutral: OBSERVABLE_10[9]
} as const;

/** Gain / loss / flat tiles (stocks treemap, semantic charts). */
export const OBSERVABLE_10_SEMANTIC = {
  positive: OBSERVABLE_10_SIGNAL.entry,
  negative: OBSERVABLE_10_SIGNAL.exit,
  neutral: OBSERVABLE_10_SIGNAL.neutral
} as const;

/** Market-cap tier bar + histogram segment mapping. */
export const OBSERVABLE_10_MARKET_CAP_SEGMENTS = {
  small: OBSERVABLE_10[0],
  mid: OBSERVABLE_10[6],
  large: OBSERVABLE_10[8]
} as const;
