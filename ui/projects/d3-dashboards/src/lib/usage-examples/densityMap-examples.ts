import { DensityMapBuilder, DensityMapData, ColorScheme, MapType } from '../../public-api';
import { IWidget } from '../entities/IWidget';

/**
 * Example data for world population density
 */
export const worldDensityData: DensityMapData[] = [
  { name: 'China', value: 100 },
  { name: 'India', value: 95 },
  { name: 'United States', value: 85 },
  { name: 'Indonesia', value: 75 },
  { name: 'Brazil', value: 70 },
  { name: 'Pakistan', value: 65 },
  { name: 'Nigeria', value: 60 },
  { name: 'Bangladesh', value: 55 },
  { name: 'Russia', value: 50 },
  { name: 'Mexico', value: 45 }
];

/**
 * Example data for US population density
 */
export const usDensityData: DensityMapData[] = [
  { name: 'California', value: 95 },
  { name: 'Texas', value: 85 },
  { name: 'Florida', value: 75 },
  { name: 'New York', value: 90 },
  { name: 'Illinois', value: 70 },
];

/**
 * Example data for China population density
 */
export const chinaDensityData: DensityMapData[] = [
  { name: 'Guangdong', value: 100 },
  { name: 'Shandong', value: 85 },
  { name: 'Henan', value: 80 },
  { name: 'Sichuan', value: 75 },
  { name: 'Jiangsu', value: 90 },
];

/**
 * Basic world density map example
 */
export function createBasicWorldMap() {
  return DensityMapBuilder.create()
    .setData(worldDensityData)
    .setMap('world')
    .setHeader('World Population Density')
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
}

/**
 * Advanced world density map with custom styling
 */
export function createAdvancedWorldMap() {
  return DensityMapBuilder.create()
    .setData(worldDensityData)
    .setMapType(MapType.WORLD)
    .setTitle('World Population Density', '2023 Data')
    .setColorScheme(ColorScheme.DENSITY_BLUE, 0, 100)
    .setRoam(true)
    .setZoom(1.2)
    .setCenter([0, 0])
    .setConditionalLabels(true, 'inside', '{b}\n{c}', true)
    .setAreaColor('#f5f5f5')
    .setBorderColor('#999', 0.5)
    .setEmphasisColor('#b8e186')
    .setShadow(15, 'rgba(0, 0, 0, 0.4)')
    .setTooltip('item', '{b}: {c} people/km²')
    .setHeader('Population Density Map')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
    .build();
}

/**
 * World density map with conditional labels (only show for countries with data)
 */
export function createWorldMapWithConditionalLabels() {
  return DensityMapBuilder.create()
    .setData(worldDensityData)
    .setMap('world')
    .setTitle('World Population Density', 'Countries with Data Only')
    .setVisualMap(0, 100, ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'])
    .setRoam(true)
    .setZoom(1.2)
    .setCenter([0, 0])
    .setConditionalLabels(true, 'inside', '{b}\n{c}M', true)
    .setAreaColor('#f8f9fa')
    .setBorderColor('#dee2e6', 0.5)
    .setEmphasisColor('#28a745')
    .setShadow(10, 'rgba(0, 0, 0, 0.3)')
    .setTooltip('item', '{b}: {c} million people')
    .setHeader('Population Density (Data Only)')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
    .build();
}

/**
 * World density map with all labels (for comparison)
 */
export function createWorldMapWithAllLabels() {
  return DensityMapBuilder.create()
    .setData(worldDensityData)
    .setMap('world')
    .setTitle('World Population Density', 'All Countries')
    .setVisualMap(0, 100, ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'])
    .setRoam(true)
    .setZoom(1.2)
    .setCenter([0, 0])
    .setConditionalLabels(true, 'inside', '{b}\n{c}M', false)
    .setAreaColor('#f8f9fa')
    .setBorderColor('#dee2e6', 0.5)
    .setEmphasisColor('#28a745')
    .setShadow(10, 'rgba(0, 0, 0, 0.3)')
    .setTooltip('item', '{b}: {c} million people')
    .setHeader('Population Density (All Countries)')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
    .build();
}

/**
 * US density map example
 */
export function createUSMap() {
  return DensityMapBuilder.create()
    .setData(usDensityData)
    .setMapType(MapType.USA)
    .setTitle('US Population Density', 'State-wise distribution')
    .setColorScheme(ColorScheme.DENSITY_RED, 0, 100)
    .setRoam(true)
    .setZoom(1.0)
    .setCenter([-98.5795, 39.8283])
    .setLabelShow(true, 'inside', '{b}')
    .setTooltip('item', '{b}: {c}%')
    .setHeader('US Population Density')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
    .build();
}

/**
 * China density map example
 */
export function createChinaMap() {
  return DensityMapBuilder.create()
    .setData(chinaDensityData)
    .setMapType(MapType.CHINA)
    .setTitle('China Population Density', 'Province-wise distribution')
    .setColorScheme(ColorScheme.DENSITY_GREEN, 0, 100)
    .setRoam(true)
    .setZoom(1.1)
    .setCenter([104.1954, 35.8617])
    .setLabelShow(true, 'inside', '{b}')
    .setTooltip('item', '{b}: {c}%')
    .setHeader('China Population Density')
    .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
    .build();
}

/**
 * Interactive density map with custom visual map
 */
export function createInteractiveDensityMap() {
  return DensityMapBuilder.create()
    .setData(worldDensityData)
    .setMap('world')
    .setTitle('Interactive Population Density', 'Hover for details')
    .setVisualMap(0, 100, ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'])
    .setRoam(true)
    .setZoom(1.5)
    .setCenter([0, 0])
    .setLabelShow(true, 'inside', '{b}')
    .setAreaColor('#f8f9fa')
    .setBorderColor('#dee2e6', 1)
    .setEmphasisColor('#28a745')
    .setShadow(20, 'rgba(0, 0, 0, 0.5)')
    .setTooltip('item', (params: any) => {
      return `${params.name}<br/>Density: ${params.value} people/km²`;
    })
    .setVisualMapOptions({
      calculable: true,
      left: 'left',
      top: 'bottom',
      text: ['High Density', 'Low Density'],
      textStyle: {
        color: '#333',
        fontSize: 12,
      },
    })
    .setHeader('Interactive Density Map')
    .setPosition({ x: 0, y: 0, cols: 10, rows: 8 })
    .build();
}

/**
 * Minimal density map for small widgets
 */
export function createMinimalDensityMap() {
  return DensityMapBuilder.create()
    .setData(worldDensityData.slice(0, 3))
    .setMap('world')
    .setHeader('Minimal World Map')
    .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
    .build();
}

/**
 * Auto-centered density map examples demonstrating automatic center and zoom calculation
 * based on widget dimensions
 */
export function createAutoCenteredDensityMaps() {
  return {
    // Small widget - will auto-center and zoom appropriately
    smallMap: DensityMapBuilder.create()
      .setData(worldDensityData)
      .setMap('world')
      .setHeader('Small World Map')
      .setPosition({ x: 0, y: 0, cols: 4, rows: 3 })
      .build(),

    // Medium widget - balanced center and zoom
    mediumMap: DensityMapBuilder.create()
      .setData(worldDensityData)
      .setMap('world')
      .setHeader('Medium World Map')
      .setPosition({ x: 4, y: 0, cols: 6, rows: 4 })
      .build(),

    // Large widget - wider aspect ratio, adjusted center
    largeMap: DensityMapBuilder.create()
      .setData(worldDensityData)
      .setMap('world')
      .setHeader('Large World Map')
      .setPosition({ x: 0, y: 4, cols: 8, rows: 5 })
      .build(),

    // Tall widget - taller aspect ratio, different center adjustment
    tallMap: DensityMapBuilder.create()
      .setData(worldDensityData)
      .setMap('world')
      .setHeader('Tall World Map')
      .setPosition({ x: 8, y: 4, cols: 4, rows: 8 })
      .build(),

    // Extra large widget - maximum size with optimal centering
    extraLargeMap: DensityMapBuilder.create()
      .setData(worldDensityData)
      .setMap('world')
      .setHeader('Extra Large World Map')
      .setPosition({ x: 0, y: 9, cols: 12, rows: 8 })
      .build()
  };
}

/**
 * Example showing how to update existing density map widgets with auto-adjusted settings
 */
export function updateExistingMapWithAutoSettings(widget: any) {
  // Update the widget's center and zoom based on its current dimensions
  DensityMapBuilder.updateMapSettings(widget);
  return widget;
}

/**
 * Test function to demonstrate auto-centering calculations
 * This shows how the center and zoom values change based on widget dimensions
 */
export function demonstrateAutoCenteringCalculations() {
  const builder = DensityMapBuilder.create();
  
  const testCases = [
    { cols: 2, rows: 2, description: 'Small square widget' },
    { cols: 4, rows: 3, description: 'Small rectangular widget' },
    { cols: 6, rows: 4, description: 'Medium widget' },
    { cols: 8, rows: 5, description: 'Large wide widget' },
    { cols: 4, rows: 8, description: 'Tall narrow widget' },
    { cols: 12, rows: 8, description: 'Extra large widget' }
  ];

  return testCases.map(testCase => {
    const center = builder.calculateMapCenter(testCase.cols, testCase.rows);
    const zoom = builder.calculateMapZoom(testCase.cols, testCase.rows);
    
    return {
      description: testCase.description,
      dimensions: `${testCase.cols}x${testCase.rows}`,
      calculatedCenter: center,
      calculatedZoom: zoom,
      aspectRatio: (testCase.cols / testCase.rows).toFixed(2)
    };
  });
}

/**
 * Example of updating density map data
 */
export function updateDensityMapData(widget: any, newData: DensityMapData[]) {
  DensityMapBuilder.updateData(widget, newData);
}

/**
 * Example of checking if a widget is a density map
 */
export function isDensityMapWidget(widget: any): boolean {
  return DensityMapBuilder.isDensityMap(widget);
}

/**
 * Create density map widget without header (for testing fallback data system)
 * This demonstrates that the data population system works even without setHeader()
 */
export function createDensityMapWithoutHeader(): IWidget {
  return DensityMapBuilder.create()
    .setData([]) // Data will be populated by chart type detection
    .setMap('world')
    // .setHeader('Investment Distribution by Region') // ← Intentionally commented out
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .setTitle('Investment Distribution by Region', 'Global')
    .setVisualMap(0, 100, ['#e0f3f8', '#abd9e9', '#74add1', '#4575b4', '#313695'])
    .setRoam(true)
    .setConditionalLabels(true, 'inside', '{b}\n{c}%', true)
    .setAreaColor('#f5f5f5')
    .setBorderColor('#999', 0.5)
    .setEmphasisColor('#b8e186')
    .setShadow(15, 'rgba(0, 0, 0, 0.4)')
    .setTooltip('item', '{b}: {c}% of total investment')
    .build();
}

/**
 * Test enhanced density map detection
 */
export function testDensityMapDetection() {
  // Create widget with header
  const widgetWithHeader = DensityMapBuilder.create()
    .setData([])
    .setMap('world')
    .setHeader('Investment Distribution by Region') // ← Has header
    .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
    .build();
    
  // Create widget without header (using our new function)
  const widgetWithoutHeader = createDensityMapWithoutHeader();
  
  return {
    withHeader: {
      widget: widgetWithHeader,
      isDetectedAsMap: DensityMapBuilder.isDensityMap(widgetWithHeader),
      isDetectedAsMapEnhanced: DensityMapBuilder.isDensityMapEnhanced(widgetWithHeader),
      hasHeader: !!widgetWithHeader.config?.header?.title
    },
    withoutHeader: {
      widget: widgetWithoutHeader,
      isDetectedAsMap: DensityMapBuilder.isDensityMap(widgetWithoutHeader),
      isDetectedAsMapEnhanced: DensityMapBuilder.isDensityMapEnhanced(widgetWithoutHeader),
      hasHeader: !!widgetWithoutHeader.config?.header?.title
    }
  };
}

/**
 * Demonstrate different color schemes available for density maps
 */
export function createColorSchemeExamples() {
  const sampleData = worldDensityData.slice(0, 5);
  
  return {
    // Blue scheme (default) - good for general data
    blueScheme: DensityMapBuilder.create()
      .setData(sampleData)
      .setMapType(MapType.WORLD)
      .setColorScheme(ColorScheme.DENSITY_BLUE, 0, 100)
      .setHeader('Blue Color Scheme')
      .setPosition({ x: 0, y: 0, cols: 4, rows: 3 })
      .build(),

    // Green scheme - good for positive metrics (growth, health, etc.)
    greenScheme: DensityMapBuilder.create()
      .setData(sampleData)
      .setMapType(MapType.WORLD)
      .setColorScheme(ColorScheme.DENSITY_GREEN, 0, 100)
      .setHeader('Green Color Scheme')
      .setPosition({ x: 4, y: 0, cols: 4, rows: 3 })
      .build(),

    // Red scheme - good for negative metrics (risk, temperature, alerts)
    redScheme: DensityMapBuilder.create()
      .setData(sampleData)
      .setMapType(MapType.WORLD)
      .setColorScheme(ColorScheme.DENSITY_RED, 0, 100)
      .setHeader('Red Color Scheme')
      .setPosition({ x: 8, y: 0, cols: 4, rows: 3 })
      .build(),

    // Purple scheme - good for unique metrics
    purpleScheme: DensityMapBuilder.create()
      .setData(sampleData)
      .setMapType(MapType.WORLD)
      .setColorScheme(ColorScheme.DENSITY_PURPLE, 0, 100)
      .setHeader('Purple Color Scheme')
      .setPosition({ x: 0, y: 3, cols: 4, rows: 3 })
      .build(),

    // Orange scheme - good for warning levels
    orangeScheme: DensityMapBuilder.create()
      .setData(sampleData)
      .setMapType(MapType.WORLD)
      .setColorScheme(ColorScheme.DENSITY_ORANGE, 0, 100)
      .setHeader('Orange Color Scheme')
      .setPosition({ x: 4, y: 3, cols: 4, rows: 3 })
      .build(),

    // Grayscale scheme - good for print or accessibility
    grayscaleScheme: DensityMapBuilder.create()
      .setData(sampleData)
      .setMapType(MapType.WORLD)
      .setColorScheme(ColorScheme.GRAYSCALE, 0, 100)
      .setHeader('Grayscale Color Scheme')
      .setPosition({ x: 8, y: 3, cols: 4, rows: 3 })
      .build()
  };
} 