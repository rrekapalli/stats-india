import type {
  KtdGridBackgroundCfg,
  KtdGridCompactType,
  KtdGridLayout,
  KtdGridLayoutItem,
} from '@katoid/angular-grid-layout';

/** Persisted / builder widget position (Gridster-compatible field names). */
export interface WidgetGridPosition {
  x: number;
  y: number;
  cols: number;
  rows: number;
  minItemCols?: number;
  maxItemCols?: number;
  minItemRows?: number;
  maxItemRows?: number;
}

/**
 * Dashboard shell configuration mapped to KTD grid (`ktd-grid`) inputs.
 * Replaces `angular-gridster2` `GridsterConfig` for the dashboard (KTD) library.
 */
export interface DashboardGridConfig {
  cols: number;
  rowHeight: number;
  gap: number;
  compactType: KtdGridCompactType;
  preventCollision: boolean;
  compactOnPropsChange: boolean;
  draggable: boolean;
  resizable: boolean;
  backgroundConfig?: KtdGridBackgroundCfg;
  scrollableParent?: HTMLElement | Document | string | null;
  scrollSpeed?: number;
  height?: number | null;
  maxRows?: number;
  minRows?: number;
  mobileBreakpoint?: number;
  itemResizeCallback?: (item: WidgetGridPosition, itemComponent?: unknown) => void;
  itemChangeCallback?: (item: WidgetGridPosition, itemComponent?: unknown) => void;
  disableWarnings?: boolean;
}

export type { KtdGridLayout, KtdGridLayoutItem, KtdGridBackgroundCfg, KtdGridCompactType };

/** Replaces `DisplayGrid` from angular-gridster2 for builder APIs. */
export const DashboardDisplayGrid = {
  None: 'none' as const,
  Always: 'always' as const,
} as const;
