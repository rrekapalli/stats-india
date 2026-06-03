import { ITileOptions } from '../../entities/ITileOptions';

/**
 * Interface representing stock tile widget configuration options
 * Extends base tile options with high/low value properties for stock price display
 */
export interface IStockTileOptions extends ITileOptions {
  /** High value to display on the left side of the tile */
  highValue?: string;
  /** Low value to display on the right side of the tile */
  lowValue?: string;
  /** Currency symbol for formatting high/low values */
  currency?: string;
  /** Whether to show currency formatting for high/low values */
  showCurrency?: boolean;
  /** Custom formatting function for high/low values */
  formatHighLow?: (value: number) => string;
} 