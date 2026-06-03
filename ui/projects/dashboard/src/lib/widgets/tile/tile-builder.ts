import { IWidget, WidgetBuilder } from '../../../public-api';
import { ITileOptions } from '../../entities/ITileOptions';
import { v4 as uuidv4 } from 'uuid';

export interface TileData {
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  title?: string;
  subtitle?: string;
  data?: any;
  [key: string]: any;
}

export interface TileStyleOptions {
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: string;
  margin?: string;
  fontSize?: string;
  fontWeight?: string;
  textAlign?: 'left' | 'center' | 'right';
  iconSize?: string;
  iconColor?: string;
  backgroundOpacity?: number;
}

export interface TileLayoutOptions {
  width?: string;
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  display?: 'flex' | 'block' | 'inline-block';
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
}

/**
 * Generalized Tile Builder for creating tile widgets with fluent API
 * 
 * Usage examples:
 * 
 * // Basic usage with default options
 * const widget = TileBuilder.create()
 *   .setData({ value: '$1,234', change: '+5.2%' })
 *   .setValue('$1,234')
 *   .setChange('+5.2%')
 *   .setDescription('Monthly Revenue')
 *   .setColor('#10b981')
 *   .setBackgroundColor('#f0fdf4')
 *   .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
 *   .build();
 * 
 * // Advanced usage with custom styling
 * const widget = TileBuilder.create()
 *   .setData({ value: '$2,500', change: '-2.1%', type: 'expense' })
 *   .setValue('$2,500')
 *   .setChange('-2.1%')
 *   .setDescription('Monthly Expenses')
 *   .setColor('#ef4444')
 *   .setBackgroundColor('#fef2f2')
 *   .setStyle({ borderRadius: '12px', padding: '20px' })
 *   .setLayout({ flexDirection: 'column', gap: '10px' })
 *   .setPosition({ x: 2, y: 0, cols: 2, rows: 2 })
 *   .build();
 * 
 * // Create tile from generic data object
 * const tileData = {
 *   value: '$3,750',
 *   change: '+12.5%',
 *   description: 'Net Profit',
 *   icon: 'fas fa-chart-pie',
 *   color: '#3b82f6',
 *   backgroundColor: '#eff6ff'
 * };
 * const widget = TileBuilder.createFromData(tileData)
 *   .setPosition({ x: 4, y: 0, cols: 2, rows: 2 })
 *   .build();
 * 
 * // Update tile data dynamically
 * TileBuilder.updateData(widget, {
 *   value: '$4,200',
 *   change: '+15.8%',
 *   description: 'Updated Profit'
 * });
 */
export class TileBuilder {
  private widgetBuilder: WidgetBuilder;
  private tileOptions: ITileOptions;
  private styleOptions: TileStyleOptions;
  private layoutOptions: TileLayoutOptions;
  private customData: any;

  private constructor() {
    this.widgetBuilder = new WidgetBuilder()
      .setId(uuidv4())
      .setComponent('tile');
    
    this.tileOptions = this.getDefaultTileOptions();
    this.styleOptions = this.getDefaultStyleOptions();
    this.layoutOptions = this.getDefaultLayoutOptions();
    this.customData = {};
  }

  /**
   * Create a new TileBuilder instance
   */
  static create(): TileBuilder {
    return new TileBuilder();
  }

  /**
   * Create a tile builder from existing data
   */
  static createFromData(data: TileData): TileBuilder {
    const builder = new TileBuilder();
    return builder
      .setData(data)
      .setValue(data.value)
      .setChange(data.change || '')
      .setChangeType(data.changeType || 'neutral')
      .setDescription(data.description || '')
      .setIcon(data['icon'] || 'fas fa-chart-bar')
      .setColor(data['color'] || '#6b7280')
      .setBackgroundColor(data['backgroundColor'] || '')
      .setHeader(data['title'] || '')
      .setSubHeader(data['subtitle'] || '');
  }

  /**
   * Get default tile options
   */
  private getDefaultTileOptions(): ITileOptions {
    return {
      value: '',
      change: '',
      changeType: 'neutral',
      icon: 'fas fa-chart-bar',
      color: '#6b7280',
      description: '',
      updateOnDataChange: true,
    };
  }

  /**
   * Get default style options
   */
  private getDefaultStyleOptions(): TileStyleOptions {
    return {
      color: '#6b7280',
      backgroundColor: '',
      borderColor: '',
      borderWidth: 0,
      borderRadius: 8,
      padding: '1.5rem',
      margin: '0',
      fontSize: '1rem',
      fontWeight: 'normal',
      textAlign: 'left',
      iconSize: '2rem',
      iconColor: 'inherit',
      backgroundOpacity: 1
    };
  }

  /**
   * Get default layout options
   */
  private getDefaultLayoutOptions(): TileLayoutOptions {
    return {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      gap: '1rem'
    };
  }

  // ===== DATA METHODS =====

  /**
   * Set generic data for the tile
   */
  setData(data: any): this {
    this.customData = { ...this.customData, ...data };
    this.widgetBuilder.setData(this.customData);
    return this;
  }

  /**
   * Set the main value to display
   */
  setValue(value: string | number): this {
    const stringValue = String(value);
    this.tileOptions.value = stringValue;
    this.customData.value = stringValue;
    return this;
  }

  /**
   * Set the change value (e.g., "+5.2%", "-2.1%")
   */
  setChange(change: string): this {
    this.tileOptions.change = change;
    this.customData.change = change;
    return this;
  }

  /**
   * Set the change type for styling
   */
  setChangeType(changeType: 'positive' | 'negative' | 'neutral'): this {
    this.tileOptions.changeType = changeType;
    this.customData.changeType = changeType;
    return this;
  }

  /**
   * Set the description text
   */
  setDescription(description: string): this {
    this.tileOptions.description = description;
    this.customData.description = description;
    return this;
  }

  // ===== HEADER METHODS =====

  /**
   * Set the tile header/title
   */
  setHeader(title: string, options?: string[]): this {
    this.widgetBuilder.setHeader(title, options);
    this.customData.title = title;
    return this;
  }

  /**
   * Set the tile subtitle
   */
  setSubHeader(subtitle: string): this {
    this.customData.subtitle = subtitle;
    return this;
  }

  /**
   * Set both header and subheader
   */
  setHeaders(title: string, subtitle?: string, options?: string[]): this {
    this.setHeader(title, options);
    if (subtitle) {
      this.setSubHeader(subtitle);
    }
    return this;
  }

  // ===== STYLING METHODS =====

  /**
   * Set the tile color theme
   */
  setColor(color: string): this {
    this.tileOptions.color = color;
    this.styleOptions.color = color;
    return this;
  }

  /**
   * Set the tile background color
   */
  setBackgroundColor(backgroundColor: string): this {
    this.styleOptions.backgroundColor = backgroundColor;
    this.customData.backgroundColor = backgroundColor;
    return this;
  }

  /**
   * Set the tile background opacity
   */
  setBackgroundOpacity(opacity: number): this {
    this.styleOptions.backgroundOpacity = opacity;
    this.customData.backgroundOpacity = opacity;
    return this;
  }

  /**
   * Set whether the tile should update when data/filters change
   */
  setUpdateOnDataChange(updateOnDataChange: boolean): this {
    this.tileOptions.updateOnDataChange = updateOnDataChange;
    this.customData.updateOnDataChange = updateOnDataChange;
    return this;
  }

  /**
   * Set the icon class (FontAwesome, Material Icons, etc.)
   */
  setIcon(icon: string): this {
    this.tileOptions.icon = icon;
    this.customData.icon = icon;
    return this;
  }

  /**
   * Set icon size
   */
  setIconSize(size: string): this {
    this.styleOptions.iconSize = size;
    return this;
  }

  /**
   * Set icon color
   */
  setIconColor(color: string): this {
    this.styleOptions.iconColor = color;
    return this;
  }

  /**
   * Set border properties
   */
  setBorder(color: string, width: number = 1, radius: number = 8): this {
    this.styleOptions.borderColor = color;
    this.styleOptions.borderWidth = width;
    this.styleOptions.borderRadius = radius;
    return this;
  }

  /**
   * Set padding
   */
  setPadding(padding: string): this {
    this.styleOptions.padding = padding;
    return this;
  }

  /**
   * Set margin
   */
  setMargin(margin: string): this {
    this.styleOptions.margin = margin;
    return this;
  }

  /**
   * Set font properties
   */
  setFont(size: string, weight: string = 'normal'): this {
    this.styleOptions.fontSize = size;
    this.styleOptions.fontWeight = weight;
    return this;
  }

  /**
   * Set text alignment
   */
  setTextAlign(align: 'left' | 'center' | 'right'): this {
    this.styleOptions.textAlign = align;
    return this;
  }

  /**
   * Set custom style options
   */
  setStyle(style: Partial<TileStyleOptions>): this {
    this.styleOptions = { ...this.styleOptions, ...style };
    return this;
  }

  // ===== LAYOUT METHODS =====

  /**
   * Set the tile position and size
   */
  setPosition(position: { x: number; y: number; cols: number; rows: number }): this {
    this.widgetBuilder.setPosition(position);
    return this;
  }

  /**
   * Set width and height
   */
  setSize(width: string, height: string): this {
    this.layoutOptions.width = width;
    this.layoutOptions.height = height;
    return this;
  }

  /**
   * Set minimum dimensions
   */
  setMinSize(width: string, height: string): this {
    this.layoutOptions.minWidth = width;
    this.layoutOptions.minHeight = height;
    return this;
  }

  /**
   * Set maximum dimensions
   */
  setMaxSize(width: string, height: string): this {
    this.layoutOptions.maxWidth = width;
    this.layoutOptions.maxHeight = height;
    return this;
  }

  /**
   * Set flex direction
   */
  setFlexDirection(direction: 'row' | 'column'): this {
    this.layoutOptions.flexDirection = direction;
    return this;
  }

  /**
   * Set justify content
   */
  setJustifyContent(justify: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'): this {
    this.layoutOptions.justifyContent = justify;
    return this;
  }

  /**
   * Set align items
   */
  setAlignItems(align: 'flex-start' | 'center' | 'flex-end' | 'stretch'): this {
    this.layoutOptions.alignItems = align;
    return this;
  }

  /**
   * Set gap between elements
   */
  setGap(gap: string): this {
    this.layoutOptions.gap = gap;
    return this;
  }

  /**
   * Set custom layout options
   */
  setLayout(layout: Partial<TileLayoutOptions>): this {
    this.layoutOptions = { ...this.layoutOptions, ...layout };
    return this;
  }

  // ===== CONFIGURATION METHODS =====

  /**
   * Set the data accessor key for dynamic data binding
   */
  setAccessor(accessor: string): this {
    this.tileOptions.accessor = accessor;
    return this;
  }

  /**
   * Set custom tile options
   */
  setTileOptions(options: Partial<ITileOptions>): this {
    this.tileOptions = { ...this.tileOptions, ...options };
    return this;
  }

  /**
   * Set events for the tile
   */
  setEvents(onDataLoad?: (widget: IWidget, data?: any) => void): this {
    if (onDataLoad) {
      this.widgetBuilder.setEvents(onDataLoad as any);
    }
    return this;
  }

  /**
   * Set initial state for the tile
   */
  setInitialState(state: any): this {
    this.widgetBuilder.setInitialState(state);
    return this;
  }

  /**
   * Set current state for the tile
   */
  setState(state: any): this {
    this.widgetBuilder.setState(state);
    return this;
  }

  /**
   * Set custom properties
   */
  setProperty(key: string, value: any): this {
    this.customData[key] = value;
    return this;
  }

  /**
   * Set multiple properties at once
   */
  setProperties(properties: Record<string, any>): this {
    this.customData = { ...this.customData, ...properties };
    return this;
  }

  // ===== BUILD METHODS =====

  /**
   * Build the tile widget
   */
  build(): IWidget {
    // Merge all options into tile options
    const finalOptions: ITileOptions & any = {
      ...this.tileOptions,
      ...this.customData,
      style: this.styleOptions,
      layout: this.layoutOptions
    };

    this.widgetBuilder.setTileOptions(finalOptions);
    return this.widgetBuilder.build();
  }

  /**
   * Get the current tile options
   */
  getTileOptions(): ITileOptions {
    return { ...this.tileOptions };
  }

  /**
   * Get the current style options
   */
  getStyleOptions(): TileStyleOptions {
    return { ...this.styleOptions };
  }

  /**
   * Get the current layout options
   */
  getLayoutOptions(): TileLayoutOptions {
    return { ...this.layoutOptions };
  }

  /**
   * Get the current custom data
   */
  getCustomData(): any {
    return { ...this.customData };
  }

  /**
   * Get the widget builder instance
   */
  getWidgetBuilder(): WidgetBuilder {
    return this.widgetBuilder;
  }

  // ===== STATIC METHODS =====

  /**
   * Update tile data on an existing widget
   */
  static updateData(widget: IWidget, data: Partial<TileData>): void {
    if (TileBuilder.isTileWidget(widget)) {
      const options = widget.config?.options as ITileOptions & any;
      if (options) {
        Object.assign(options, data);
        // Update widget data as well
        widget.data = { ...widget.data, ...data };
      }
    }
  }

  /**
   * Check if widget is a tile widget
   */
  static isTileWidget(widget: IWidget): boolean {
    return widget.config?.component === 'tile';
  }

  /**
   * Create tile widget with default configuration
   */
  static createTileWidget(data?: TileData): WidgetBuilder {
    const builder = new WidgetBuilder()
      .setId(uuidv4())
      .setComponent('tile');

    if (data) {
      const tileOptions: ITileOptions & any = {
        change: data.change || '',
        changeType: data.changeType || 'neutral',
        icon: data['icon'] || 'fas fa-chart-bar',
        color: data['color'] || '#6b7280',
        description: data.description || '',
        title: data['title'] || '',
        subtitle: data['subtitle'] || '',
        backgroundColor: data['backgroundColor'] || '',
        ...data
      };
      builder.setTileOptions(tileOptions);
    } else {
      builder.setTileOptions({
        value: '',
        change: '',
        changeType: 'neutral',
        icon: 'fas fa-chart-bar',
        color: '#6b7280',
        description: '',
      });
    }

    return builder;
  }

  /**
   * Export data from tile widget
   */
  static exportData(widget: IWidget): any[] {
    if (!TileBuilder.isTileWidget(widget)) {
      return [];
    }

    const options = widget.config?.options as ITileOptions & any;
    if (!options) return [];

    return [[
      options.title || widget.config?.header?.title || 'Metric',
      options.value || '',
      options.change || '',
      options.changeType || 'neutral',
      options.description || '',
      options.subtitle || ''
    ]];
  }

  /**
   * Get export headers for tile widget
   */
  static getExportHeaders(widget: IWidget): string[] {
    return ['Title', 'Value', 'Change', 'Change Type', 'Description', 'Subtitle'];
  }

  /**
   * Get export sheet name for tile widget
   */
  static getExportSheetName(widget: IWidget): string {
    const title = widget.config?.header?.title || 'Tile';
    return `Tile_${title.replace(/[^a-zA-Z0-9]/g, '_')}`;
  }

  // ===== FACTORY METHODS =====

  /**
   * Create a metric tile (positive change)
   */
  static createMetricTile(
    value: string | number,
    change: string,
    description: string,
    icon: string = 'fas fa-chart-line',
    color: string = '#10b981'
  ): TileBuilder {
    return TileBuilder.create()
      .setValue(value)
      .setChange(change)
      .setChangeType('positive')
      .setDescription(description)
      .setIcon(icon)
      .setColor(color);
  }

  /**
   * Create a warning tile (negative change)
   */
  static createWarningTile(
    value: string | number,
    change: string,
    description: string,
    icon: string = 'fas fa-exclamation-triangle',
    color: string = '#ef4444'
  ): TileBuilder {
    return TileBuilder.create()
      .setValue(value)
      .setChange(change)
      .setChangeType('negative')
      .setDescription(description)
      .setIcon(icon)
      .setColor(color);
  }

  /**
   * Create a neutral tile (no change)
   */
  static createNeutralTile(
    value: string | number,
    description: string,
    icon: string = 'fas fa-chart-bar',
    color: string = '#6b7280'
  ): TileBuilder {
    return TileBuilder.create()
      .setValue(value)
      .setChange('0%')
      .setChangeType('neutral')
      .setDescription(description)
      .setIcon(icon)
      .setColor(color);
  }

  /**
   * Create a financial tile with currency formatting
   */
  static createFinancialTile(
    amount: number,
    changePercent: number,
    description: string,
    currency: string = '$',
    icon: string = 'fas fa-dollar-sign'
  ): TileBuilder {
    const formattedValue = `${currency}${amount.toLocaleString()}`;
    const changeType = changePercent > 0 ? 'positive' : changePercent < 0 ? 'negative' : 'neutral';
    const changeText = `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%`;
    const color = changePercent > 0 ? '#10b981' : changePercent < 0 ? '#ef4444' : '#6b7280';

    return TileBuilder.create()
      .setValue(formattedValue)
      .setChange(changeText)
      .setChangeType(changeType)
      .setDescription(description)
      .setIcon(icon)
      .setColor(color);
  }

  /**
   * Create a percentage tile
   */
  static createPercentageTile(
    percentage: number,
    description: string,
    icon: string = 'fas fa-percentage',
    color: string = '#3b82f6'
  ): TileBuilder {
    const changeType = percentage > 0 ? 'positive' : percentage < 0 ? 'negative' : 'neutral';
    const changeText = `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    const tileColor = percentage > 0 ? '#10b981' : percentage < 0 ? '#ef4444' : color;

    return TileBuilder.create()
      .setValue(`${percentage.toFixed(1)}%`)
      .setChange(changeText)
      .setChangeType(changeType)
      .setDescription(description)
      .setIcon(icon)
      .setColor(tileColor);
  }

  /**
   * Create a generic info tile
   */
  static createInfoTile(
    title: string,
    value: string | number,
    description: string,
    icon: string = 'fas fa-info-circle',
    color: string = '#3b82f6'
  ): TileBuilder {
    return TileBuilder.create()
      .setValue(value)
      .setDescription(description)
      .setIcon(icon)
      .setColor(color);
  }

  /**
   * Create a status tile
   */
  static createStatusTile(
    status: string,
    value: string | number,
    isActive: boolean = true,
    icon: string = 'fas fa-circle',
    color: string = '#10b981'
  ): TileBuilder {
    const statusColor = isActive ? color : '#6b7280';
    const statusIcon = isActive ? icon : 'fas fa-circle';
    
    return TileBuilder.create()
      .setValue(value)
      .setDescription(status)
      .setIcon(statusIcon)
      .setColor(statusColor)
      .setChangeType(isActive ? 'positive' : 'neutral');
  }
}

/**
 * Factory function to create tile widget
 */
export function createTileWidget(data?: TileData): WidgetBuilder {
  return TileBuilder.createTileWidget(data);
} 