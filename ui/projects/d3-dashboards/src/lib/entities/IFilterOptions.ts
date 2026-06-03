import {IFilterValues} from './IFilterValues';

/**
 * Interface representing filter configuration options
 */
export interface IFilterOptions {
  /** Array of available filter values */
  values: IFilterValues[];
  
  /** Configuration for filter visualization behavior */
  visualMode?: {
    /** Whether to use highlighting mode instead of hiding filtered data */
    enableHighlighting?: boolean;
    /** Opacity for filtered-out (greyed) data (0-1) */
    filteredOpacity?: number;
    /** Opacity for highlighted (selected) data (0-1) */
    highlightedOpacity?: number;
    /** Color overlay for highlighted data */
    highlightColor?: string;
    /** Color overlay for filtered data */
    filteredColor?: string;
  };
}
