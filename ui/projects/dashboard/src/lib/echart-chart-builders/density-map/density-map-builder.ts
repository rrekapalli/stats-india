import { IWidget, WidgetBuilder } from '../../../public-api';
import { EChartsOption } from 'echarts';
import { ApacheEchartBuilder, ChartDataTransformOptions, DataFilter, ColorPalette } from '../apache-echart-builder';
import * as echarts from 'echarts/core';
import { 
  ColorScheme, 
  getColorPalette, 
  MapType, 
  LabelPosition, 
  GEO_CENTERS,
  ChartType,
  TOOLTIP_TEMPLATES 
} from '../../dashboard-container/dashboard-constants';

export interface DensityMapData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface DensityMapSeriesOptions {
  name?: string;
  type?: string;
  map?: string;
  roam?: boolean;
  zoom?: number;
  center?: [number, number];
  data?: DensityMapData[];
  label?: {
    show?: boolean;
    position?: string;
    formatter?: string | Function;
    fontSize?: number;
    color?: string;
  };
  itemStyle?: {
    areaColor?: string;
    borderColor?: string;
    borderWidth?: number;
    shadowBlur?: number;
    shadowColor?: string;
  };
  emphasis?: {
    itemStyle?: {
      areaColor?: string;
      shadowBlur?: number;
      shadowColor?: string;
    };
  };
  select?: {
    itemStyle?: {
      areaColor?: string;
    };
  };
  visualMap?: {
    min?: number;
    max?: number;
    left?: string;
    top?: string;
    text?: [string, string];
    calculable?: boolean;
    inRange?: {
      color?: string[];
    };
  };
}

export interface DensityMapOptions {
  visualMap?: {
    type?: string;
    min?: number;
    max?: number;
    left?: string;
    top?: string;
    text?: [string, string];
    calculable?: boolean;
    inRange?: {
      color?: string[];
    };
    textStyle?: {
      color?: string;
    };
  };
  series?: DensityMapSeriesOptions[];
}

/**
 * Enhanced Density Map Chart Builder extending the generic ApacheEchartBuilder
 * 
 * Features:
 * - Generic data transformation from any[] to density map format
 * - Automatic map centering and zoom calculation based on widget dimensions
 * - Support for various map types (world, country-specific, custom)
 * - Conditional labeling for regions with data
 * - Customizable visual mapping and styling
 * - Advanced formatting (currency, percentage, number)
 * - Predefined color palettes
 * - Filter integration
 * - Sample data generation
 * - Configuration presets
 * - Enhanced update methods with retry mechanism
 */
export class DensityMapBuilder extends ApacheEchartBuilder<DensityMapOptions, DensityMapSeriesOptions> {
  private mapName: string = 'world';
  private roamEnabled: boolean = false;
  private zoomLevel: number = 1;
  private centerCoords: [number, number] = [0, 0];
  private visualMapRange: [number, number] = [0, 100];
  private visualMapColors: readonly string[] = getColorPalette(ColorScheme.DENSITY_BLUE);
  private filterColumn: string = '';

  private constructor() {
    super();
    this.seriesOptions = this.getDefaultSeriesOptions();
  }

  /**
   * Create a new DensityMapBuilder instance
   */
  static create(): DensityMapBuilder {
    return new DensityMapBuilder();
  }

  /**
   * Register a custom map with ECharts
   * @param mapName - Name of the map
   * @param geoJson - GeoJSON data for the map
   */
  static registerMap(mapName: string, geoJson: any): void {
    try {
      echarts.registerMap(mapName, geoJson);
    } catch (error) {
    }
  }

  /**
   * Get available built-in maps
   */
  static getAvailableMaps(): string[] {
    return Object.values(MapType);
  }

  /**
   * Implement abstract method to get default options
   */
  protected override getDefaultOptions(): any {
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}',
      },
      legend: {
        show: false,
      },
      visualMap: {
        type: 'continuous',
        min: 0,
        max: 100,
        left: 'left',
        top: 'bottom',
        text: ['High', 'Low'],
        calculable: true,
        inRange: {
          color: [...getColorPalette(ColorScheme.DENSITY_BLUE)],
        },
        textStyle: {
          color: '#333',
        },
      },
    };
  }

  /**
   * Implement abstract method to get chart type
   */
  protected override getChartType(): string {
    return ChartType.DENSITY_MAP;
  }

  /**
   * Get default series options for density map
   */
  private getDefaultSeriesOptions(): DensityMapSeriesOptions {
    return {
      name: 'Density Map',
      type: 'map',
      map: 'world',
      roam: false,
      zoom: 1,
      center: [0, 0],
      label: {
        show: false,
        position: 'inside',
        formatter: '{b}',
        fontSize: 12,
        color: '#333',
      },
      itemStyle: {
        areaColor: '#eee',
        borderColor: '#999',
        borderWidth: 0.5,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)',
      },
      emphasis: {
        itemStyle: {
          areaColor: '#b8e186',
          shadowBlur: 20,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
      select: {
        itemStyle: {
          areaColor: '#b8e186',
        },
      },
    };
  }

  /**
   * Set the data for the density map
   */
  override setData(data: DensityMapData[]): this {
    this.seriesOptions.data = data;
    super.setData(data);
    return this;
  }

  /**
   * Set the map type (e.g., 'HK', 'CN', 'US', etc.)
   */
  setMap(mapName: string): this {
    this.mapName = mapName;
    this.seriesOptions.map = mapName;
    return this;
  }

  /**
   * Set the map type using predefined MapType enum
   */
  setMapType(mapType: MapType): this {
    return this.setMap(mapType);
  }

  /**
   * Enable/disable map roaming (pan and zoom)
   */
  setRoam(roam: boolean): this {
    this.roamEnabled = roam;
    this.seriesOptions.roam = roam;
    return this;
  }

  /**
   * Set the zoom level of the map
   */
  setZoom(zoom: number): this {
    this.zoomLevel = zoom;
    this.seriesOptions.zoom = zoom;
    return this;
  }

  /**
   * Set the center coordinates of the map [longitude, latitude]
   */
  setCenter(center: [number, number]): this {
    this.centerCoords = center;
    this.seriesOptions.center = center;
    return this;
  }

  /**
   * Set the visual map configuration for density coloring
   */
  setVisualMap(min: number, max: number, colors?: string[]): this {
    this.visualMapRange = [min, max];
    if (colors) {
      this.visualMapColors = colors;
    }

    (this.chartOptions as any).visualMap = {
      type: 'continuous',
      min,
      max,
      left: 'left',
      top: 'bottom',
      text: ['High', 'Low'],
      calculable: true,
      inRange: {
        color: [...this.visualMapColors],
      },
      textStyle: {
        color: '#333',
      },
    };

    return this;
  }

  /**
   * Set color scheme using predefined color palettes
   */
  setColorScheme(scheme: ColorScheme, min: number = 0, max: number = 100): this {
    this.visualMapColors = getColorPalette(scheme);
    return this.setVisualMap(min, max);
  }

  /**
   * Set label visibility and formatting
   */
  override setLabelShow(show: boolean, position: string = 'inside', formatter?: string): this {
    this.seriesOptions.label = {
      show,
      position,
      formatter: formatter || '{b}',
      fontSize: 12,
      color: '#333',
    };
    return this;
  }

  /**
   * Set conditional labels that only show when data exists
   * @param show - Whether to show labels
   * @param position - Label position ('inside', 'outside', etc.)
   * @param formatter - Label formatter (default: '{b}\n{c}')
   * @param showOnlyWithData - Whether to show labels only for regions with data
   */
  setConditionalLabels(
    show: boolean = true, 
    position: string = 'inside', 
    formatter?: string,
    showOnlyWithData: boolean = true
  ): this {
    if (showOnlyWithData) {
      this.seriesOptions.label = {
        show: true,
        position,
        formatter: (params: any) => {
          // Only show label if the region has valid numeric data (including zero)
          const hasValidData = typeof params.value === 'number' && isFinite(params.value);
          if (hasValidData) {
            return formatter
              ? formatter.replace('{b}', params.name).replace('{c}', params.value.toString())
              : `${params.name}\n${params.value}`;
          }
          return '';
        },
        fontSize: 12,
        color: '#333',
      };
    } else {
      this.seriesOptions.label = {
        show,
        position,
        formatter: formatter || '{b}\n{c}',
        fontSize: 12,
        color: '#333',
      };
    }
    return this;
  }

  /**
   * Set area color for regions with no data
   */
  setAreaColor(color: string): this {
    this.seriesOptions.itemStyle = {
      ...this.seriesOptions.itemStyle,
      areaColor: color,
    };
    return this;
  }

  /**
   * Set border color and width for regions
   */
  setBorderColor(color: string, width: number = 0.5): this {
    this.seriesOptions.itemStyle = {
      ...this.seriesOptions.itemStyle,
      borderColor: color,
      borderWidth: width,
    };
    return this;
  }

  /**
   * Set emphasis color for hover effects
   */
  setEmphasisColor(color: string): this {
    this.seriesOptions.emphasis = {
      itemStyle: {
        areaColor: color,
        shadowBlur: 20,
        shadowColor: 'rgba(0, 0, 0, 0.5)',
      },
    };
    return this;
  }

  /**
   * Set shadow effects for regions
   */
  setShadow(blur: number = 10, color: string = 'rgba(0, 0, 0, 0.3)'): this {
    this.seriesOptions.itemStyle = {
      ...this.seriesOptions.itemStyle,
      shadowBlur: blur,
      shadowColor: color,
    };
    return this;
  }

  /**
   * Set custom visual map options
   */
  setVisualMapOptions(options: any): this {
    (this.chartOptions as any).visualMap = {
      ...(this.chartOptions as any).visualMap,
      ...options,
    };
    return this;
  }

  /**
   * Set custom geo options
   */
  setGeoOptions(options: any): this {
    (this.chartOptions as any).geo = {
      ...(this.chartOptions as any).geo,
      ...options,
    };
    return this;
  }

  /**
   * Set widget position and automatically calculate map center based on dimensions
   */
  override setPosition(position: { x: number; y: number; cols: number; rows: number }): this {
    // Call parent setPosition method
    super.setPosition(position);
    
    // Automatically calculate and set map center based on widget dimensions
    const center = this.calculateMapCenter(position.cols, position.rows);
    this.setCenter(center as [number, number]);
    
    // Also calculate and set zoom level based on widget dimensions
    // const zoom = this.calculateMapZoom(position.cols, position.rows);
    // this.setZoom(zoom);
    
    return this;
  }

  /**
   * Auto-adjust map center and zoom based on current widget dimensions
   * This method can be called after setting position to recalculate map settings
   */
  autoAdjustMapSettings(): this {
    // Get current position from widget builder
    const position = this.widgetBuilder.build().position;
    if (position) {
      const center = this.calculateMapCenter(position.cols, position.rows);
      const zoom = this.calculateMapZoom(position.cols, position.rows);
      
      this.setCenter(center as [number, number]);
      // this.setZoom(zoom);
    }
    return this;
  }

  /**
   * Build the final widget with all configurations
   */
  override build(): IWidget {
    // Auto-adjust map settings if position is set
    this.autoAdjustMapSettings();
    
    // Update series with current options
    this.seriesOptions = {
      ...this.seriesOptions,
      map: this.mapName,
      roam: this.roamEnabled,
      zoom: this.zoomLevel,
      center: this.centerCoords,
    };

    // Set the series in chart options
    (this.chartOptions as any).series = [this.seriesOptions];

    // Build the widget
    return this.widgetBuilder
      .setEChartsOptions(this.chartOptions)
      .build();
  }

  /**
   * Transform generic data to density map format
   */
  transformData(options: { 
    nameField?: string; 
    valueField?: string; 
    regionField?: string; 
  } & ChartDataTransformOptions = {}): this {
    if (!this.data || !Array.isArray(this.data)) {
      return this;
    }

    const {
      nameField = 'name',
      valueField = 'value',
      regionField = 'region',
      sortBy,
      sortOrder = 'desc',
      limit
    } = options;

    try {
      let transformedData: DensityMapData[] = [];

      // Apply filters first
      let filteredData = this.data;
      if ((options as any).filters && (options as any).filters.length > 0) {
        filteredData = ApacheEchartBuilder.applyFilters(this.data, (options as any).filters);
      }

      // Transform data to density map format
      filteredData.forEach(item => {
        const name = item[nameField] || item[regionField] || 'Unknown';
        const value = parseFloat(item[valueField]) || 0;
        
        transformedData.push({
          name,
          value,
          originalItem: item
        });
      });

      // Apply sorting
      if (sortBy === 'value') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.value - b.value : b.value - a.value);
      } else if (sortBy === 'name') {
        transformedData.sort((a, b) => sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      }

      // Apply limit
      if (limit && limit > 0) {
        transformedData = transformedData.slice(0, limit);
      }

      this.seriesOptions.data = transformedData;

      // Update visual map range based on data
      const values = transformedData.map(item => item.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      this.setVisualMap(minValue, maxValue);

    } catch (error) {
      console.error('Error transforming density map data:', error);
    }

    return this;
  }

  /**
   * Set predefined color palette
   */
  override setPredefinedPalette(palette: ColorPalette): this {
    const colors = this.getPaletteColors(palette);
    if (colors.length > 0) {
      this.setVisualMap(this.visualMapRange[0], this.visualMapRange[1], colors);
    }
    return this;
  }

  /**
   * Set currency formatter for values
   */
  override setCurrencyFormatter(currency: string = 'USD', locale: string = 'en-US'): this {
    const formatter = this.createCurrencyFormatter(currency, locale);
    this.setTooltip('item', (params: any) => {
      return `${params.name}: ${formatter(params.value)}`;
    });
    return this;
  }

  /**
   * Set percentage formatter for values
   */
  override setPercentageFormatter(decimals: number = 1): this {
    const formatter = this.createPercentageFormatter(decimals);
    this.setTooltip('item', (params: any) => {
      return `${params.name}: ${formatter(params.value)}`;
    });
    return this;
  }

  /**
   * Set number formatter for values with custom options
   */
  setCustomNumberFormatter(decimals: number = 0, locale: string = 'en-US'): this {
    const formatter = this.createNumberFormatter(decimals, locale);
    this.setTooltip('item', (params: any) => {
      return `${params.name}: ${formatter(params.value)}`;
    });
    return this;
  }

  /**
   * Set filter column for filtering integration
   */
  override setFilterColumn(column: string): this {
    this.filterColumn = column;
    return this;
  }

  /**
   * Create filter from chart data
   */
  createFilterFromChartData(): DataFilter[] {
    if (!this.filterColumn || !this.data) return [];

    const uniqueValues = [...new Set(this.data.map(item => item[this.filterColumn]))];
    return [{
      column: this.filterColumn,
      operator: 'in',
      value: uniqueValues
    }];
  }

  /**
   * Generate sample data for testing
   */
  generateSampleData(count: number = 10, mapType: string = 'world'): this {
    const sampleData = [];
    const regions = mapType === 'world' ? 
      ['China', 'United States', 'India', 'Brazil', 'Russia', 'Japan', 'Germany', 'United Kingdom', 'France', 'Italy'] :
      ['Region 1', 'Region 2', 'Region 3', 'Region 4', 'Region 5', 'Region 6', 'Region 7', 'Region 8', 'Region 9', 'Region 10'];
    
    for (let i = 0; i < Math.min(count, regions.length); i++) {
      sampleData.push({
        name: regions[i],
        value: Math.floor(Math.random() * 1000) + 100,
        density: Math.floor(Math.random() * 500) + 50,
        population: Math.floor(Math.random() * 1000000) + 100000,
        category: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
      });
    }

    return this.setData(sampleData);
  }

  /**
   * Configuration preset for population density analysis
   */
  setPopulationDensityConfiguration(): this {
    return this
      .setMap('world')
      .setPredefinedPalette('business')
      .setCustomNumberFormatter(0, 'en-US')
      .setVisualMapOptions({
        text: ['High Density', 'Low Density'],
        orient: 'vertical',
        left: 'left',
        top: 'center'
      });
  }

  /**
   * Configuration preset for economic indicators
   */
  setEconomicIndicatorsConfiguration(): this {
    return this
      .setMap('world')
      .setPredefinedPalette('finance')
      .setCurrencyFormatter('USD', 'en-US')
      .setVisualMapOptions({
        text: ['Highest', 'Lowest'],
        orient: 'horizontal',
        left: 'center',
        bottom: '10%'
      });
  }

  /**
   * Configuration preset for risk assessment
   */
  setRiskAssessmentConfiguration(): this {
    return this
      .setMap('world')
      .setPredefinedPalette('modern')
      .setPercentageFormatter(1)
      .setVisualMapOptions({
        text: ['High Risk', 'Low Risk'],
        orient: 'vertical',
        right: '10%',
        top: 'center'
      });
  }

  /**
   * Enhanced updateData with retry mechanism
   */
  static override updateData(widget: IWidget, data: DensityMapData[]): void {
    const maxRetries = 3;
    let retryCount = 0;

    const updateWithRetry = () => {
      try {
        if (widget.chartInstance) {
          // Transform data if needed
          let transformedData = data;
          if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
            transformedData = data.map(item => ({
              ...item,
              name: item.name || 'Unknown',
              value: typeof item.value === 'number' ? item.value : parseFloat(item.value) || 0
            }));
          }

          const currentOptions = widget.chartInstance.getOption();
          const newOptions = {
            ...currentOptions,
            series: [{
              ...(currentOptions as any)['series'][0],
              data: transformedData
            }]
          };

          widget.chartInstance.setOption(newOptions, true);
        } else if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      } catch (error) {
        console.error('Error updating density map data:', error);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(updateWithRetry, 100 * retryCount);
        }
      }
    };

    updateWithRetry();
  }

  /**
   * Update map settings for an existing widget
   */
  static updateMapSettings(widget: IWidget, settings?: { zoom?: number; center?: [number, number]; roam?: boolean }): void {
    if (!widget.chartInstance) return;
    
    try {
      const currentOptions = widget.chartInstance.getOption() as any;
      const newOptions = {
        ...currentOptions,
        series: currentOptions['series']?.map((series: any) => ({
          ...series,
          zoom: settings?.zoom ?? series.zoom,
          center: settings?.center ?? series.center,
          roam: settings?.roam ?? series.roam
        }))
      };
      
      widget.chartInstance.setOption(newOptions, true);
    } catch (error) {
      console.error('Error updating density map settings:', error);
    }
  }

  /**
   * Static method to check if a widget is a density map
   */
  static isDensityMap(widget: IWidget): boolean {
    return ApacheEchartBuilder.isChartType(widget, 'map');
  }

  /**
   * Static method to check if a widget is a density map (enhanced detection)
   * This method can identify density maps even without proper headers
   */
  static isDensityMapEnhanced(widget: IWidget): boolean {
    // Check by chart type first
    if (ApacheEchartBuilder.isChartType(widget, 'map')) {
      return true;
    }
    
    // Check if the widget has map-specific configuration
    const options = widget.config?.options as any;
    if (options?.series?.[0]) {
      const series = options.series[0];
      return series.type === 'map' || series.map !== undefined;
    }
    
    // Check if visualMap is present (common in density maps)
    if (options?.visualMap) {
      return true;
    }
    
    return false;
  }

  /**
   * Get appropriate data for density map widget
   * This method provides fallback data when header is not set
   */
  static getDefaultData(): DensityMapData[] {
    return [
      { name: 'United States', value: 100 },
      { name: 'China', value: 85 },
      { name: 'Japan', value: 70 },
      { name: 'Germany', value: 65 },
      { name: 'United Kingdom', value: 60 },
      { name: 'France', value: 55 },
      { name: 'Canada', value: 50 },
      { name: 'Australia', value: 45 },
      { name: 'Brazil', value: 40 },
      { name: 'India', value: 35 }
    ];
  }

  /**
   * Export density map data for Excel/CSV export
   * Extracts region names and their corresponding values
   * @param widget - Widget containing density map data
   * @returns Array of data rows for export
   */
  static override exportData(widget: IWidget): any[] {
    const series = (widget.config?.options as any)?.series?.[0];
    
    if (!series?.data) {
      return [];
    }

    return series.data.map((item: any) => [
      item.name || 'Unknown Region',
      item.value || 0
    ]);
  }

  /**
   * Get headers for density map export
   */
  static override getExportHeaders(widget: IWidget): string[] {
    return ['Region', 'Value'];
  }

  /**
   * Get sheet name for density map export
   */
  static override getExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Sheet';
    return title.replace(/[^\w\s]/gi, '').substring(0, 31).trim();
  }

  /**
   * Create a density map widget with default settings
   */
  static createDensityMapWidget(
    data?: DensityMapData[],
    mapName?: string
  ): WidgetBuilder {
    const builder = DensityMapBuilder.create();
    if (data) {
      builder.setData(data);
    }
    if (mapName) {
      builder.setMap(mapName);
    }
    return builder.getWidgetBuilder();
  }

  // Add these helper methods to your class
  public calculateMapCenter(cols: number, rows: number): number[] {
    // Use predefined world center coordinates
    const [baseLongitude, baseLatitude] = GEO_CENTERS.WORLD;
    
    // Adjust center based on aspect ratio
    const aspectRatio = cols / rows;
    
    // Adjust longitude more for wider containers
    const longitudeAdjustment = (aspectRatio > 1) ? (aspectRatio - 1) * 5 : 0;

    // Adjust latitude more for taller containers
    const latitudeAdjustment = (aspectRatio < 1) ? ((1 / aspectRatio) - 1) * 2 : 0;

    return [
      baseLongitude + longitudeAdjustment,
      baseLatitude + latitudeAdjustment
    ];
  }

  public calculateMapZoom(cols: number, rows: number): number {
    // Base zoom level
    const baseZoom = 4.0;
    
    // Calculate area of grid
    const area = cols * rows;
    
    // Adjust zoom based on area
    // Larger area = more zoom out (smaller zoom number)
    const zoomAdjustment = Math.log(area) / Math.log(2); // logarithmic scaling
    
    // Calculate aspect ratio adjustment
    const aspectRatio = cols / rows;
    const aspectAdjustment = Math.abs(1 - aspectRatio) * 0.5;

    return baseZoom - (zoomAdjustment * 0.1) - aspectAdjustment;
  }

}

/**
 * Convenience function to create a density map widget
 */
export function createDensityMapWidget(
  data?: DensityMapData[],
  mapName?: string
): WidgetBuilder {
  return DensityMapBuilder.createDensityMapWidget(data, mapName);
} 