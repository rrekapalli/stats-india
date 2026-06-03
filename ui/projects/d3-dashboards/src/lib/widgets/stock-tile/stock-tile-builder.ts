import { IWidget, WidgetBuilder } from '../../../public-api';
import { IStockTileOptions } from './stock-tile-options';
import { TileBuilder, TileData } from '../tile/tile-builder';
import { v4 as uuidv4 } from 'uuid';

export interface StockTileData extends TileData {
  highValue?: string;
  lowValue?: string;
  currency?: string;
  showCurrency?: boolean;
}

/**
 * Stock Tile Builder for creating stock-specific tile widgets with high/low values
 * 
 * Usage examples:
 * 
 * // Basic stock tile with high/low values
 * const widget = StockTileBuilder.create()
 *   .setValue('₹15,234')
 *   .setChange('+2.5%')
 *   .setDescription('NIFTY METAL')
 *   .setHighValue('₹15,500')
 *   .setLowValue('₹14,800')
 *   .setCurrency('₹')
 *   .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
 *   .setDataEvent((widget: IWidget, data?: any) => {
 *     console.log('Stock tile data loaded:', data);
 *     // Handle data loading events
 *   })
 *   .build();
 * 
 * // Create stock tile from data object
 * const stockData = {
 *   value: '₹15,234',
 *   change: '+2.5%',
 *   description: 'NIFTY METAL',
 *   highValue: '₹15,500',
 *   lowValue: '₹14,800',
 *   currency: '₹'
 * };
 * const widget = StockTileBuilder.createFromData(stockData)
 *   .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
 *   .setDataEvent((widget: IWidget, data?: any) => {
 *     console.log('Stock tile data loaded:', data);
 *     // Handle data loading events
 *   })
 *   .build();
 * 
 * // Create stock tile with automatic formatting
 * const widget = StockTileBuilder.createStockTile(
 *   15234, // current price
 *   2.5,   // percent change
 *   'NIFTY METAL', // description
 *   15500, // high value
 *   14800  // low value
 * )
 *   .setCurrency('₹')
 *   .setPosition({ x: 0, y: 0, cols: 2, rows: 2 })
 *   .setDataEvent((widget: IWidget, data?: any) => {
 *     console.log('Stock tile data loaded:', data);
 *     // Handle data loading events
 *   })
 *   .build();
 */
export class StockTileBuilder {
  private tileBuilder: TileBuilder;
  private stockTileOptions: IStockTileOptions;

  private constructor() {
    this.tileBuilder = TileBuilder.create();
    this.stockTileOptions = this.getDefaultStockTileOptions();
  }

  static create(): StockTileBuilder {
    return new StockTileBuilder();
  }

  static createFromData(data: StockTileData): StockTileBuilder {
    const builder = new StockTileBuilder();
    
    if (data.value) builder.setValue(data.value);
    if (data.change) builder.setChange(data.change);
    if (data.changeType) builder.setChangeType(data.changeType);
    if (data.description) builder.setDescription(data.description);
    if (data.icon) builder.setIcon(data.icon);
    if (data.color) builder.setColor(data.color);
    if (data.backgroundColor) builder.setBackgroundColor(data.backgroundColor);
    if (data.subtitle) builder.setSubtitle(data.subtitle);
    if (data.highValue) builder.setHighValue(data.highValue);
    if (data.lowValue) builder.setLowValue(data.lowValue);
    if (data.currency) builder.setCurrency(data.currency);
    if (data.showCurrency !== undefined) builder.setShowCurrency(data.showCurrency);
    
    return builder;
  }

  private getDefaultStockTileOptions(): IStockTileOptions {
    return {
      value: '0',
      change: '0%',
      changeType: 'neutral',
      description: 'Stock Price',
      icon: 'fas fa-chart-line',
      color: '#10b981',
      backgroundColor: '#f0fdf4',
      highValue: '0',
      lowValue: '0',
      currency: '₹',
      showCurrency: true,
      updateOnDataChange: true
    };
  }

  setValue(value: string | number): this {
    this.stockTileOptions.value = value.toString();
    this.tileBuilder.setValue(value);
    return this;
  }

  setChange(change: string): this {
    this.stockTileOptions.change = change;
    this.tileBuilder.setChange(change);
    return this;
  }

  setChangeType(changeType: 'positive' | 'negative' | 'neutral'): this {
    this.stockTileOptions.changeType = changeType;
    this.tileBuilder.setChangeType(changeType);
    return this;
  }

  setDescription(description: string): this {
    this.stockTileOptions.description = description;
    this.tileBuilder.setDescription(description);
    return this;
  }

  setSubtitle(subtitle: string): this {
    this.stockTileOptions.subtitle = subtitle;
    this.tileBuilder.setSubHeader(subtitle);
    return this;
  }

  setIcon(icon: string): this {
    this.stockTileOptions.icon = icon;
    this.tileBuilder.setIcon(icon);
    return this;
  }

  setColor(color: string): this {
    this.stockTileOptions.color = color;
    this.tileBuilder.setColor(color);
    return this;
  }

  setBackgroundColor(backgroundColor: string): this {
    this.stockTileOptions.backgroundColor = backgroundColor;
    this.tileBuilder.setBackgroundColor(backgroundColor);
    return this;
  }

  setHighValue(highValue: string | number): this {
    this.stockTileOptions.highValue = highValue.toString();
    return this;
  }

  setLowValue(lowValue: string | number): this {
    this.stockTileOptions.lowValue = lowValue.toString();
    return this;
  }

  setCurrency(currency: string): this {
    this.stockTileOptions.currency = currency;
    return this;
  }

  setShowCurrency(showCurrency: boolean): this {
    this.stockTileOptions.showCurrency = showCurrency;
    return this;
  }

  setFormatHighLow(formatFunction: (value: number) => string): this {
    this.stockTileOptions.formatHighLow = formatFunction;
    return this;
  }

  setUpdateOnDataChange(updateOnDataChange: boolean): this {
    this.stockTileOptions.updateOnDataChange = updateOnDataChange;
    this.tileBuilder.setUpdateOnDataChange(updateOnDataChange);
    return this;
  }

  /**
   * Set data event handler for the stock tile
   * This allows setting up data loading and update events at creation time
   * @param onDataEvent - Callback function for data events
   * @returns this for method chaining
   */
  setDataEvent(onDataEvent: (widget: IWidget, data?: any) => void): this {
    this.tileBuilder.setEvents(onDataEvent as any);
    return this;
  }

  setPosition(position: { x: number; y: number; cols: number; rows: number }): this {
    this.tileBuilder.setPosition(position);
    return this;
  }

  setBorder(color: string, width: number = 1, radius: number = 8): this {
    this.tileBuilder.setBorder(color, width, radius);
    return this;
  }

  setData(data: any): this {
    this.tileBuilder.setData(data);
    return this;
  }

  build(): IWidget {
    // Set the component to stock-tile
    const widget = this.tileBuilder.build();
    widget.config.component = 'stock-tile';
    widget.config.options = this.stockTileOptions;
    return widget;
  }

  /**
   * Create a stock tile with automatic formatting
   */
  static createStockTile(
    currentPrice: number,
    percentChange: number,
    description: string,
    highValue: number,
    lowValue: number,
    currency: string = '₹'
  ): StockTileBuilder {
    const changeType = percentChange >= 0 ? 'positive' : 'negative';
    const changeIcon = percentChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    const changeColor = percentChange >= 0 ? '#16a34a' : '#dc2626';
    const changeBgColor = percentChange >= 0 ? '#bbf7d0' : '#fecaca';
    const changeBorderColor = percentChange >= 0 ? '#4ade80' : '#f87171';

    // Calculate the absolute change value
    const absoluteChange = (currentPrice * percentChange) / 100;
    
    // Format the change string to match the layout: "+$2.35 (+1.56%)"
    const changeString = `${percentChange >= 0 ? '+' : ''}${currency}${Math.abs(absoluteChange).toFixed(2)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%)`;

    return StockTileBuilder.create()
      .setValue(`${currency}${currentPrice.toLocaleString()}`)
      .setChange(changeString)
      .setChangeType(changeType)
      .setDescription(description)
      .setIcon(changeIcon)
      .setColor(changeColor)
      .setBackgroundColor(changeBgColor)
      .setBorder(changeBorderColor, 1, 8)
      .setHighValue(`${currency}${highValue.toLocaleString()}`)
      .setLowValue(`${currency}${lowValue.toLocaleString()}`)
      .setCurrency(currency)
      .setShowCurrency(true)
      .setUpdateOnDataChange(true);
  }

  /**
   * Update stock tile data
   */
  static updateData(widget: IWidget, data: Partial<StockTileData>): void {
    if (widget.config?.component !== 'stock-tile') {
      return;
    }

    const options = widget.config.options as IStockTileOptions;
    
    if (data.value !== undefined) options.value = data.value;
    if (data.change !== undefined) options.change = data.change;
    if (data.changeType !== undefined) options.changeType = data.changeType;
    if (data.description !== undefined) options.description = data.description;
    if (data.icon !== undefined) options.icon = data.icon;
    if (data.color !== undefined) options.color = data.color;
    if (data.backgroundColor !== undefined) options.backgroundColor = data.backgroundColor;
    if (data.subtitle !== undefined) options.subtitle = data.subtitle;
    if (data.highValue !== undefined) options.highValue = data.highValue;
    if (data.lowValue !== undefined) options.lowValue = data.lowValue;
    if (data.currency !== undefined) options.currency = data.currency;
    if (data.showCurrency !== undefined) options.showCurrency = data.showCurrency;
  }

  /**
   * Check if widget is a stock tile
   */
  static isStockTileWidget(widget: IWidget): boolean {
    return widget.config?.component === 'stock-tile';
  }

  /**
   * Set data event handler on an existing stock tile widget
   * @param widget - The widget to update
   * @param onDataEvent - Callback function for data events
   */
  static setDataEvent(widget: IWidget, onDataEvent: (widget: IWidget, data?: any) => void): void {
    if (widget.config?.component !== 'stock-tile') {
      return;
    }

    if (!widget.config.events) {
      widget.config.events = {};
    }
    
    widget.config.events.onChartOptions = onDataEvent as any;
  }
} 