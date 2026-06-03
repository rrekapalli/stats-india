import { TileBuilder, TileData } from '../widgets/tile/tile-builder';
import { IWidget } from '../entities/IWidget';

/**
 * Examples demonstrating how to use the generalized TileBuilder
 */

/**
 * Basic tile widget example with new generalized methods
 */
export function createBasicTileExample(): IWidget {
  return TileBuilder.create()
    .setData({ value: '$1,234', change: '+5.2%', type: 'revenue' })
    .setValue('$1,234')
    .setChange('+5.2%')
    .setDescription('Monthly Revenue')
    .setColor('#10b981')
    .setBackgroundColor('#f0fdf4')
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Advanced tile with custom styling and layout
 */
export function createAdvancedTileExample(): IWidget {
  return TileBuilder.create()
    .setData({ 
      value: '$2,500', 
      change: '-2.1%', 
      type: 'expense',
      category: 'operational'
    })
    .setValue('$2,500')
    .setChange('-2.1%')
    .setDescription('Monthly Expenses')
    .setColor('#ef4444')
    .setBackgroundColor('#fef2f2')
    .setBackgroundOpacity(0.8)
    .setStyle({ 
      borderRadius: 12, 
      padding: '20px',
      borderColor: '#fecaca',
      borderWidth: 2
    })
    .setLayout({ 
      flexDirection: 'column', 
      gap: '10px',
      justifyContent: 'center'
    })
    .setPosition({ x: 2, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Warning tile example (negative change) with enhanced styling
 */
export function createWarningTileExample(): IWidget {
  return TileBuilder.create()
    .setData({ value: '$2,500', change: '-2.1%', severity: 'high' })
    .setValue('$2,500')
    .setChange('-2.1%')
    .setDescription('Critical Alert')
    .setColor('#ef4444')
    .setBackgroundColor('#fef2f2')
    .setBackgroundOpacity(0.9)
    .setIcon('fas fa-exclamation-triangle')
    .setIconSize('2.5rem')
    .setIconColor('#dc2626')
    .setBorder('#fecaca', 2, 8)
    .setPadding('1.5rem')
    .setPosition({ x: 4, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Neutral tile example with custom layout
 */
export function createNeutralTileExample(): IWidget {
  return TileBuilder.create()
    .setData({ value: '$3,750', status: 'stable' })
    .setValue('$3,750')
    .setDescription('Net Profit')
    .setColor('#6b7280')
    .setBackgroundColor('#f9fafb')
    .setIcon('fas fa-chart-pie')
    .setFlexDirection('column')
    .setTextAlign('center')
    .setGap('0.5rem')
    .setPosition({ x: 6, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Create tile from generic data object with new properties
 */
export function createTileFromDataExample(): IWidget {
  const tileData: TileData = {
    value: '$4,200',
    change: '+12.5%',
    changeType: 'positive',
    description: 'Quarterly Growth',
    icon: 'fas fa-rocket',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    data: { period: 'Q4', year: 2024 }
  };

  return TileBuilder.createFromData(tileData)
    .setPosition({ x: 0, y: 2, cols: 2, rows: 2 })
    .build();
}

/**
 * Using factory methods for common tile types with enhanced styling
 */
export function createFactoryMethodExamples(): IWidget[] {
  // Financial tile with automatic formatting and styling
  const financialTile = TileBuilder.createFinancialTile(
    1250000, // amount
    8.5,     // change percent
    'Annual Revenue',
    '$',     // currency
    'fas fa-dollar-sign'
  )
    .setBackgroundColor('#f0fdf4')
    .setBorder('#bbf7d0', 1, 12)
    .setPosition({ x: 2, y: 2, cols: 2, rows: 2 })
    .build();

  // Percentage tile with custom styling
  const percentageTile = TileBuilder.createPercentageTile(
    75.5,    // percentage
    'Customer Satisfaction',
    'fas fa-smile',
    '#3b82f6'
  )
    .setBackgroundColor('#eff6ff')
    .setIconSize('2.5rem')
    .setTextAlign('center')
    .setPosition({ x: 4, y: 2, cols: 2, rows: 2 })
    .build();

  // Metric tile (positive) with enhanced layout
  const metricTile = TileBuilder.createMetricTile(
    '1,234',
    '+15.8%',
    'Active Users',
    'fas fa-users',
    '#10b981'
  )
    .setBackgroundColor('#f0fdf4')
    .setLayout({ flexDirection: 'column', gap: '8px' })
    .setPosition({ x: 6, y: 2, cols: 2, rows: 2 })
    .build();

  // Warning tile (negative) with alert styling
  const warningTile = TileBuilder.createWarningTile(
    '89',
    '-5.2%',
    'System Uptime',
    'fas fa-server',
    '#ef4444'
  )
    .setBackgroundColor('#fef2f2')
    .setBorder('#fecaca', 2, 8)
    .setIconColor('#dc2626')
    .setPosition({ x: 0, y: 4, cols: 2, rows: 2 })
    .build();

  return [financialTile, percentageTile, metricTile, warningTile];
}

/**
 * New factory method examples
 */
export function createNewFactoryMethodExamples(): IWidget[] {
  // Info tile
  const infoTile = TileBuilder.createInfoTile(
    'System Status',
    'Online',
    'All services operational',
    'fas fa-check-circle',
    '#10b981'
  )
    .setBackgroundColor('#f0fdf4')
    .setBorder('#bbf7d0', 1, 8)
    .setPosition({ x: 2, y: 4, cols: 2, rows: 2 })
    .build();

  // Status tile
  const statusTile = TileBuilder.createStatusTile(
    'Database',
    'Connected',
    true,
    'fas fa-database',
    '#3b82f6'
  )
    .setBackgroundColor('#eff6ff')
    .setPosition({ x: 4, y: 4, cols: 2, rows: 2 })
    .build();

  // Inactive status tile
  const inactiveTile = TileBuilder.createStatusTile(
    'Backup Server',
    'Offline',
    false,
    'fas fa-server',
    '#ef4444'
  )
    .setBackgroundColor('#fef2f2')
    .setPosition({ x: 6, y: 4, cols: 2, rows: 2 })
    .build();

  return [infoTile, statusTile, inactiveTile];
}

/**
 * Dashboard with multiple tiles example using new features
 */
export function createDashboardWithTilesExample(): IWidget[] {
  const tiles: IWidget[] = [];

  // Revenue metrics with enhanced styling
  tiles.push(
    TileBuilder.createFinancialTile(1250000, 8.5, 'Annual Revenue', '$', 'fas fa-dollar-sign')
      .setBackgroundColor('#f0fdf4')
      .setBorder('#bbf7d0', 1, 12)
      .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Profit metrics with custom layout
  tiles.push(
    TileBuilder.createFinancialTile(450000, 12.3, 'Net Profit', '$', 'fas fa-chart-pie')
      .setBackgroundColor('#f0fdf4')
      .setLayout({ flexDirection: 'column', gap: '8px' })
      .setPosition({ x: 2, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Growth metrics with centered layout
  tiles.push(
    TileBuilder.createPercentageTile(15.8, 'Growth Rate', 'fas fa-rocket', '#3b82f6')
      .setBackgroundColor('#eff6ff')
      .setTextAlign('center')
      .setPosition({ x: 4, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Customer metrics with enhanced styling
  tiles.push(
    TileBuilder.createMetricTile('1,234', '+5.2%', 'Active Customers', 'fas fa-users', '#10b981')
      .setBackgroundColor('#f0fdf4')
      .setIconSize('2.5rem')
      .setPosition({ x: 6, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Expenses (warning) with alert styling
  tiles.push(
    TileBuilder.createWarningTile('$850K', '+2.1%', 'Operating Expenses', 'fas fa-chart-line', '#ef4444')
      .setBackgroundColor('#fef2f2')
      .setBorder('#fecaca', 2, 8)
      .setPosition({ x: 0, y: 2, cols: 2, rows: 2 })
      .build()
  );

  // Market share with neutral styling
  tiles.push(
    TileBuilder.createNeutralTile('23.5%', 'Market Share', 'fas fa-chart-bar', '#6b7280')
      .setBackgroundColor('#f9fafb')
      .setTextAlign('center')
      .setPosition({ x: 2, y: 2, cols: 2, rows: 2 })
      .build()
  );

  return tiles;
}

/**
 * Dynamic tile update example with new properties
 */
export function demonstrateTileUpdates(): void {
  // Create a tile with enhanced data
  const tile = TileBuilder.create()
    .setData({ 
      value: '$1,000', 
      change: '+5%', 
      type: 'revenue',
      period: 'Q1'
    })
    .setValue('$1,000')
    .setChange('+5%')
    .setDescription('Revenue Metrics')
    .setColor('#10b981')
    .setBackgroundColor('#f0fdf4')
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .build();

  // Update the tile data with new properties
  TileBuilder.updateData(tile, {
    value: '$1,250',
    change: '+25%',
    description: 'Updated Revenue',
    backgroundColor: '#eff6ff',
    color: '#3b82f6'
  });

  // Export tile data
  const exportData = TileBuilder.exportData(tile);
  const headers = TileBuilder.getExportHeaders(tile);
  const sheetName = TileBuilder.getExportSheetName(tile);
}

/**
 * Tile with events and custom properties example
 */
export function createTileWithEventsExample(): IWidget {
  return TileBuilder.create()
    .setData({ 
      value: '$1,500', 
      change: '+10%', 
      type: 'interactive',
      timestamp: new Date().toISOString()
    })
    .setValue('$1,500')
    .setChange('+10%')
    .setDescription('Interactive Example')
    .setColor('#8b5cf6')
    .setBackgroundColor('#faf5ff')
    .setIcon('fas fa-mouse-pointer')
    .setBorder('#c4b5fd', 1, 12)
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .setEvents((widget: IWidget, data?: any) => {
      // Handle data loading events
    })
    .setProperty('clickable', true)
    .setProperty('refreshInterval', 30000)
    .build();
}

/**
 * Tile with custom styling and layout example
 */
export function createCustomStyledTileExample(): IWidget {
  return TileBuilder.create()
    .setData({ 
      value: 'Custom', 
      type: 'styled',
      theme: 'dark'
    })
    .setValue('Custom')
    .setDescription('Custom Styled Tile')
    .setColor('#ffffff')
    .setBackgroundColor('#1f2937')
    .setBackgroundOpacity(0.95)
    .setIcon('fas fa-palette')
    .setStyle({
      borderRadius: 16,
      padding: '24px',
      borderColor: '#374151',
      borderWidth: 2,
      fontSize: '1.1rem',
      fontWeight: '600',
      textAlign: 'center',
      iconSize: '3rem',
      iconColor: '#fbbf24'
    })
    .setLayout({
      flexDirection: 'column',
      gap: '16px',
      justifyContent: 'center',
      alignItems: 'center'
    })
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Example demonstrating different background opacity levels
 */
export function createOpacityExamples(): IWidget[] {
  const tiles: IWidget[] = [];

  // Full opacity tile
  tiles.push(
    TileBuilder.createMetricTile('100%', '+5.2%', 'Full Opacity', 'fas fa-eye', '#3b82f6')
      .setBackgroundColor('#eff6ff')
      .setBackgroundOpacity(1.0)
      .setUpdateOnDataChange(true)
      .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // 80% opacity tile
  tiles.push(
    TileBuilder.createMetricTile('80%', '+3.1%', '80% Opacity', 'fas fa-eye', '#10b981')
      .setBackgroundColor('#f0fdf4')
      .setBackgroundOpacity(0.8)
      .setUpdateOnDataChange(false)
      .setPosition({ x: 2, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // 60% opacity tile
  tiles.push(
    TileBuilder.createMetricTile('60%', '+1.8%', '60% Opacity', 'fas fa-eye', '#f59e0b')
      .setBackgroundColor('#fffbeb')
      .setBackgroundOpacity(0.6)
      .setUpdateOnDataChange(true)
      .setPosition({ x: 4, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // 40% opacity tile
  tiles.push(
    TileBuilder.createMetricTile('40%', '+0.5%', '40% Opacity', 'fas fa-eye', '#ef4444')
      .setBackgroundColor('#fef2f2')
      .setBackgroundOpacity(0.4)
      .setUpdateOnDataChange(false)
      .setPosition({ x: 6, y: 0, cols: 2, rows: 2 })
      .build()
  );

  return tiles;
}

/**
 * Example demonstrating static vs dynamic tiles
 */
export function createStaticVsDynamicExamples(): IWidget[] {
  const tiles: IWidget[] = [];

  // Static tile - won't update with filters
  tiles.push(
    TileBuilder.createInfoTile(
      'Static Metric',
      '1,234',
      'Fixed Value',
      'fas fa-lock',
      '#6b7280'
    )
      .setBackgroundColor('#f3f4f6')
      .setUpdateOnDataChange(false)
      .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Dynamic tile - will update with filters
  tiles.push(
    TileBuilder.createInfoTile(
      'Dynamic Metric',
      '567',
      'Filtered Value',
      'fas fa-sync',
      '#3b82f6'
    )
      .setBackgroundColor('#dbeafe')
      .setUpdateOnDataChange(true)
      .setPosition({ x: 2, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Static financial tile
  tiles.push(
    TileBuilder.createFinancialTile(
      1000000,
      5.2,
      'Fixed Revenue',
      '$',
      'fas fa-dollar-sign'
    )
      .setBackgroundColor('#f0fdf4')
      .setUpdateOnDataChange(false)
      .setPosition({ x: 4, y: 0, cols: 2, rows: 2 })
      .build()
  );

  // Dynamic financial tile
  tiles.push(
    TileBuilder.createFinancialTile(
      500000,
      12.5,
      'Filtered Revenue',
      '$',
      'fas fa-chart-line'
    )
      .setBackgroundColor('#fef3c7')
      .setUpdateOnDataChange(true)
      .setPosition({ x: 6, y: 0, cols: 2, rows: 2 })
      .build()
  );

  return tiles;
}

/**
 * All tile examples combined with new features
 */
export function getAllTileExamples(): IWidget[] {
  const examples: IWidget[] = [];

  // Basic examples with new features
  examples.push(createBasicTileExample());
  examples.push(createAdvancedTileExample());
  examples.push(createWarningTileExample());
  examples.push(createNeutralTileExample());
  examples.push(createTileFromDataExample());

  // Factory method examples
  examples.push(...createFactoryMethodExamples());
  examples.push(...createNewFactoryMethodExamples());

  // Custom styled example
  examples.push(createCustomStyledTileExample());

  // Interactive example
  examples.push(createTileWithEventsExample());

  // Opacity examples
  examples.push(...createOpacityExamples());

  // Static vs dynamic examples
  examples.push(...createStaticVsDynamicExamples());

  return examples;
} 