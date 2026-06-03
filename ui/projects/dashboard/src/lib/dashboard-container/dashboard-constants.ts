/**
 * Dashboard Grid Constants
 * Desktop settings are used as the standard values
 * Other screen sizes are calculated based on responsive ratios
 */

// Screen size breakpoints (in pixels)
export const SCREEN_BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  LARGE_DESKTOP: 1440
} as const;

// Responsive ratios for different screen sizes
export const RESPONSIVE_RATIOS = {
  MOBILE: {
    COLS: 0.5,      // 50% of desktop columns
    ROWS: 0.8,      // 80% of desktop rows
    WIDTH: 0.6,     // 60% of desktop column width
    HEIGHT: 1.2     // 120% of desktop row height (taller for touch)
  },
  TABLET: {
    COLS: 0.75,     // 75% of desktop columns
    ROWS: 0.9,      // 90% of desktop rows
    WIDTH: 0.8,     // 80% of desktop column width
    HEIGHT: 1.0     // 100% of desktop row height
  },
  DESKTOP: {
    COLS: 1.0,      // 100% (standard)
    ROWS: 1.0,      // 100% (standard)
    WIDTH: 1.0,     // 100% (standard)
    HEIGHT: 1.0     // 100% (standard)
  },
  LARGE_DESKTOP: {
    COLS: 1.33,     // 133% of desktop columns
    ROWS: 1.1,      // 110% of desktop rows
    WIDTH: 1.2,     // 120% of desktop column width
    HEIGHT: 0.9     // 90% of desktop row height
  }
} as const;

// Desktop settings (standard values)
export const DESKTOP_GRID_SETTINGS = {
  MAX_COLS: 12,
  MIN_COLS: 1,
  MAX_ROWS: 100,
  MIN_ROWS: 1,
  FIXED_COL_WIDTH: 100,
  FIXED_ROW_HEIGHT: 48,
  MOBILE_BREAKPOINT: 640
} as const;

// Mobile settings (calculated from desktop using ratios)
export const MOBILE_GRID_SETTINGS = {
  MAX_COLS: Math.round(DESKTOP_GRID_SETTINGS.MAX_COLS * RESPONSIVE_RATIOS.MOBILE.COLS),
  MIN_COLS: Math.round(DESKTOP_GRID_SETTINGS.MIN_COLS * RESPONSIVE_RATIOS.MOBILE.COLS),
  MAX_ROWS: Math.round(DESKTOP_GRID_SETTINGS.MAX_ROWS * RESPONSIVE_RATIOS.MOBILE.ROWS),
  MIN_ROWS: Math.round(DESKTOP_GRID_SETTINGS.MIN_ROWS * RESPONSIVE_RATIOS.MOBILE.ROWS),
  FIXED_COL_WIDTH: Math.round(DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH * RESPONSIVE_RATIOS.MOBILE.WIDTH),
  FIXED_ROW_HEIGHT: Math.round(DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT * RESPONSIVE_RATIOS.MOBILE.HEIGHT),
  MOBILE_BREAKPOINT: SCREEN_BREAKPOINTS.MOBILE
} as const;

// Tablet settings (calculated from desktop using ratios)
export const TABLET_GRID_SETTINGS = {
  MAX_COLS: Math.round(DESKTOP_GRID_SETTINGS.MAX_COLS * RESPONSIVE_RATIOS.TABLET.COLS),
  MIN_COLS: Math.round(DESKTOP_GRID_SETTINGS.MIN_COLS * RESPONSIVE_RATIOS.TABLET.COLS),
  MAX_ROWS: Math.round(DESKTOP_GRID_SETTINGS.MAX_ROWS * RESPONSIVE_RATIOS.TABLET.ROWS),
  MIN_ROWS: Math.round(DESKTOP_GRID_SETTINGS.MIN_ROWS * RESPONSIVE_RATIOS.TABLET.ROWS),
  FIXED_COL_WIDTH: Math.round(DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH * RESPONSIVE_RATIOS.TABLET.WIDTH),
  FIXED_ROW_HEIGHT: Math.round(DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT * RESPONSIVE_RATIOS.TABLET.HEIGHT),
  MOBILE_BREAKPOINT: SCREEN_BREAKPOINTS.TABLET
} as const;

// Large desktop settings (calculated from desktop using ratios)
export const LARGE_DESKTOP_GRID_SETTINGS = {
  MAX_COLS: Math.round(DESKTOP_GRID_SETTINGS.MAX_COLS * RESPONSIVE_RATIOS.LARGE_DESKTOP.COLS),
  MIN_COLS: Math.round(DESKTOP_GRID_SETTINGS.MIN_COLS * RESPONSIVE_RATIOS.LARGE_DESKTOP.COLS),
  MAX_ROWS: Math.round(DESKTOP_GRID_SETTINGS.MAX_ROWS * RESPONSIVE_RATIOS.LARGE_DESKTOP.ROWS),
  MIN_ROWS: Math.round(DESKTOP_GRID_SETTINGS.MIN_ROWS * RESPONSIVE_RATIOS.LARGE_DESKTOP.ROWS),
  FIXED_COL_WIDTH: Math.round(DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH * RESPONSIVE_RATIOS.LARGE_DESKTOP.WIDTH),
  FIXED_ROW_HEIGHT: Math.round(DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT * RESPONSIVE_RATIOS.LARGE_DESKTOP.HEIGHT),
  MOBILE_BREAKPOINT: SCREEN_BREAKPOINTS.LARGE_DESKTOP
} as const;

// Layout presets
export const LAYOUT_PRESETS = {
  COMPACT: {
    FIXED_COL_WIDTH: 80,
    FIXED_ROW_HEIGHT: 40,
    OUTER_MARGIN: false
  },
  STANDARD: {
    FIXED_COL_WIDTH: DESKTOP_GRID_SETTINGS.FIXED_COL_WIDTH,
    FIXED_ROW_HEIGHT: DESKTOP_GRID_SETTINGS.FIXED_ROW_HEIGHT,
    OUTER_MARGIN: true
  },
  SPACIOUS: {
    FIXED_COL_WIDTH: 120,
    FIXED_ROW_HEIGHT: 80,
    OUTER_MARGIN: true
  }
} as const;

// Utility function to get grid settings for a specific screen size
export function getGridSettingsForScreenSize(screenSize: keyof typeof RESPONSIVE_RATIOS) {
  switch (screenSize) {
    case 'MOBILE':
      return MOBILE_GRID_SETTINGS;
    case 'TABLET':
      return TABLET_GRID_SETTINGS;
    case 'DESKTOP':
      return DESKTOP_GRID_SETTINGS;
    case 'LARGE_DESKTOP':
      return LARGE_DESKTOP_GRID_SETTINGS;
    default:
      return DESKTOP_GRID_SETTINGS;
  }
}

// Utility function to calculate responsive values
export function calculateResponsiveValue(
  desktopValue: number, 
  screenSize: keyof typeof RESPONSIVE_RATIOS,
  property: keyof typeof RESPONSIVE_RATIOS.DESKTOP
): number {
  const ratio = RESPONSIVE_RATIOS[screenSize][property];
  return Math.round(desktopValue * ratio);
}

// Dashboard layout and sizing constants
export const DASHBOARD_CONSTANTS = {
  // Grid system
  GRID: {
    DEFAULT_COLS: 12,
    DEFAULT_ROWS: 24,
    MIN_WIDGET_COLS: 1,
    MIN_WIDGET_ROWS: 1,
    MAX_WIDGET_COLS: 12,
    MAX_WIDGET_ROWS: 12,
    CELL_HEIGHT: 30,
    MARGIN: [10, 10] as [number, number],
  },

  // Widget sizing presets
  WIDGET_SIZES: {
    SMALL: { cols: 3, rows: 2 },
    MEDIUM: { cols: 6, rows: 4 },
    LARGE: { cols: 8, rows: 6 },
    EXTRA_LARGE: { cols: 12, rows: 8 },
    SQUARE_SMALL: { cols: 4, rows: 4 },
    SQUARE_LARGE: { cols: 6, rows: 6 },
    WIDE: { cols: 8, rows: 3 },
    TALL: { cols: 4, rows: 8 },
  },

  // Animation and timing
  ANIMATION: {
    DEFAULT_DURATION: 300,
    SLOW_DURATION: 500,
    FAST_DURATION: 150,
    EASING: 'ease-in-out',
  },

  // Z-index layers
  Z_INDEX: {
    WIDGET: 1,
    WIDGET_HEADER: 2,
    DROPDOWN: 1000,
    MODAL: 1050,
    TOOLTIP: 1100,
  },
} as const;

/**
 * Color scheme enums for consistent styling across all chart types
 */
export enum ColorScheme {
  // Density/Heat map color schemes (Light to Dark)
  DENSITY_BLUE = 'density_blue',
  DENSITY_GREEN = 'density_green', 
  DENSITY_RED = 'density_red',
  DENSITY_PURPLE = 'density_purple',
  DENSITY_ORANGE = 'density_orange',
  
  // Multi-color schemes for diverse data
  RAINBOW = 'rainbow',
  DIVERGING = 'diverging',
  CATEGORICAL = 'categorical',
  
  // Monochrome schemes
  GRAYSCALE = 'grayscale',
  
  // Financial/Business themes
  PROFIT_LOSS = 'profit_loss',
  PERFORMANCE = 'performance',
}

/**
 * Color palettes mapped to schemes
 * All density schemes go from Light (low values) to Dark (high values)
 */
export const COLOR_PALETTES = {
  [ColorScheme.DENSITY_BLUE]: [
    '#e0f3f8', // Lightest blue (lowest values)
    '#abd9e9', 
    '#74add1', 
    '#4575b4', 
    '#313695'  // Darkest blue (highest values)
  ],
  
  [ColorScheme.DENSITY_GREEN]: [
    '#edf8e9', // Lightest green
    '#bae4b3',
    '#74c476',
    '#31a354',
    '#006d2c'  // Darkest green
  ],
  
  [ColorScheme.DENSITY_RED]: [
    '#fee5d9', // Lightest red
    '#fcae91',
    '#fb6a4a',
    '#de2d26',
    '#a50f15'  // Darkest red
  ],
  
  [ColorScheme.DENSITY_PURPLE]: [
    '#f2f0f7', // Lightest purple
    '#cbc9e2',
    '#9e9ac8',
    '#756bb1',
    '#54278f'  // Darkest purple
  ],
  
  [ColorScheme.DENSITY_ORANGE]: [
    '#feedde', // Lightest orange
    '#fdbe85',
    '#fd8d3c',
    '#e6550d',
    '#a63603'  // Darkest orange
  ],
  
  [ColorScheme.RAINBOW]: [
    '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', 
    '#ff7f00', '#ffff33', '#a65628', '#f781bf'
  ],
  
  [ColorScheme.DIVERGING]: [
    '#d73027', '#f46d43', '#fdae61', '#fee090', '#ffffbf',
    '#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'
  ],
  
  [ColorScheme.CATEGORICAL]: [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ],
  
  [ColorScheme.GRAYSCALE]: [
    '#f7f7f7', // Lightest gray
    '#cccccc',
    '#969696',
    '#636363',
    '#252525'  // Darkest gray
  ],
  
  [ColorScheme.PROFIT_LOSS]: [
    '#d73027', // Loss (red)
    '#fc8d59',
    '#fee08b',
    '#d9ef8b',
    '#91d47c',
    '#4575b4'  // Profit (blue/green)
  ],
  
  [ColorScheme.PERFORMANCE]: [
    '#f7fcf5', // Poor performance (light)
    '#e5f5e0',
    '#c7e9c0',
    '#a1d99b',
    '#41ab5d'  // Excellent performance (dark green)
  ],
} as const;

/**
 * Chart type constants
 */
export enum ChartType {
  DENSITY_MAP = 'map',
  HEATMAP = 'heatmap',
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  SCATTER = 'scatter',
  AREA = 'area',
  GAUGE = 'gauge',
  SANKEY = 'sankey',
  TREEMAP = 'treemap',
  SUNBURST = 'sunburst',
  POLAR = 'polar',
}

/**
 * Map types for density maps
 */
export enum MapType {
  WORLD = 'world',
  USA = 'usa',
  CHINA = 'china',
  JAPAN = 'japan',
  UK = 'uk',
  FRANCE = 'france',
  GERMANY = 'germany',
  ITALY = 'italy',
  SPAIN = 'spain',
  RUSSIA = 'russia',
  CANADA = 'canada',
  AUSTRALIA = 'australia',
  BRAZIL = 'brazil',
  INDIA = 'india',
}

/**
 * Common label positions
 */
export enum LabelPosition {
  INSIDE = 'inside',
  OUTSIDE = 'outside',
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
  CENTER = 'center',
}

/**
 * Widget title constants for data population
 */
export enum WidgetTitle {
  INVESTMENT_DISTRIBUTION_REGION = 'Investment Distribution by Region',
  INVESTMENT_DISTRIBUTION_COUNTRY = 'Investment Distribution by Country',
  POPULATION_DENSITY = 'Population Density Map',
  SPENDING_HEATMAP = 'Spending Heatmap',
  PERFORMANCE_HEATMAP = 'Performance Heatmap',
}

/**
 * Visual map configurations for different use cases
 */
export const VISUAL_MAP_CONFIGS = {
  PERCENTAGE: {
    min: 0,
    max: 100,
    text: ['High %', 'Low %'] as [string, string],
    formatter: '{value}%',
  },
  
  CURRENCY: {
    min: 0,
    max: 1000000,
    text: ['High $', 'Low $'] as [string, string],
    formatter: '${value}',
  },
  
  DENSITY: {
    min: 0,
    max: 500,
    text: ['High Density', 'Low Density'] as [string, string],
    formatter: '{value}/km²',
  },
  
  COUNT: {
    min: 0,
    max: 1000,
    text: ['Many', 'Few'] as [string, string],
    formatter: '{value}',
  },
} as const;

/**
 * Default geographic center points for auto-centering
 */
export const GEO_CENTERS = {
  WORLD: [0, 30] as [number, number],
  NORTH_AMERICA: [-100, 45] as [number, number],
  EUROPE: [10, 50] as [number, number],
  ASIA: [100, 30] as [number, number],
  AFRICA: [20, 0] as [number, number],
  SOUTH_AMERICA: [-60, -15] as [number, number],
  OCEANIA: [140, -25] as [number, number],
} as const;

/**
 * Tooltip formatter templates
 */
export const TOOLTIP_TEMPLATES = {
  DENSITY_MAP: '{b}: {c}',
  DENSITY_MAP_DETAILED: '{b}<br/>Value: {c}<br/>Percentage: {d}%',
  CURRENCY: '{b}: ${c}',
  PERCENTAGE: '{b}: {c}%',
  COUNT: '{b}: {c} items',
} as const;

/**
 * Helper function to get color palette by scheme
 */
export function getColorPalette(scheme: ColorScheme): readonly string[] {
  return COLOR_PALETTES[scheme] || COLOR_PALETTES[ColorScheme.DENSITY_BLUE];
}

/**
 * Helper function to get reversed color palette (for inverted scales)
 */
export function getReversedColorPalette(scheme: ColorScheme): string[] {
  return [...getColorPalette(scheme)].reverse();
}

/**
 * Helper function to validate if a color scheme exists
 */
export function isValidColorScheme(scheme: string): scheme is ColorScheme {
  return Object.values(ColorScheme).includes(scheme as ColorScheme);
}

/**
 * Helper function to get available maps
 */
export function getAvailableMaps(): string[] {
  return Object.values(MapType);
}

/**
 * Helper function to get widget size preset
 */
export function getWidgetSize(sizeName: keyof typeof DASHBOARD_CONSTANTS.WIDGET_SIZES) {
  return DASHBOARD_CONSTANTS.WIDGET_SIZES[sizeName];
} 