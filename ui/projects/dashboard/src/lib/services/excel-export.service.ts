import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { IWidget } from '../entities/IWidget';
import { WidgetDataExtractor, WidgetBuilder } from '../widgets/widget/widget-builder';
import { 
  PieChartBuilder, 
  BarChartBuilder, 
  LineChartBuilder, 
  ScatterChartBuilder, 
  GaugeChartBuilder, 
  HeatmapChartBuilder, 
  DensityMapBuilder,
  AreaChartBuilder,
  PolarChartBuilder,
  StackedAreaChartBuilder,
  TreemapChartBuilder,
  SunburstChartBuilder,
  SankeyChartBuilder
} from '../echart-chart-builders';

/**
 * Configuration options for Excel export functionality
 */
export interface ExcelExportOptions {
  /** Output filename for the Excel file */
  filename?: string;
  /** Whether to include column headers in the export */
  includeHeaders?: boolean;
  /** Whether to include a timestamp sheet */
  includeTimestamp?: boolean;
  /** Prefix for sheet names */
  sheetNamePrefix?: string;
  /** Whether to automatically resize columns */
  autoColumnWidth?: boolean;
  /** Whether to include widget titles in sheets */
  includeWidgetTitles?: boolean;
}

/**
 * Service for exporting dashboard widgets to Excel format
 * Supports various widget types and provides intelligent data extraction
 */
@Injectable({
  providedIn: 'root'
})
export class ExcelExportService {

  /**
   * Export dashboard data to Excel with multiple sheets
   * @param widgets - Array of widgets to export
   * @param options - Excel export configuration options
   */
  async exportDashboardToExcel(
    widgets: IWidget[],
    options: ExcelExportOptions = {}
  ): Promise<void> {
    const {
      filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeHeaders = true,
      includeTimestamp = true,
      sheetNamePrefix = 'Widget',
      autoColumnWidth = true,
      includeWidgetTitles = true
    } = options;

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Add timestamp sheet if requested
      if (includeTimestamp) {
        this.addTimestampSheet(workbook);
      }

      // Export each widget to its own sheet
      for (const widget of widgets) {
        try {
          await this.exportWidgetToSheet(workbook, widget, {
            includeHeaders,
            sheetNamePrefix,
            autoColumnWidth,
            includeWidgetTitles
          });
        } catch (error) {
          // Error exporting widget to Excel
          // Continue with next widget
        }
      }

      // Save the workbook
      XLSX.writeFile(workbook, filename);

    } catch (error) {
      console.error('Error exporting dashboard to Excel:', error);
      throw new Error('Failed to export dashboard to Excel');
    }
  }

  /**
   * Export a single widget to an Excel sheet
   * @param workbook - The Excel workbook instance
   * @param widget - Widget to export
   * @param options - Export configuration options
   */
  private async exportWidgetToSheet(
    workbook: XLSX.WorkBook,
    widget: IWidget,
    options: {
      includeHeaders: boolean;
      sheetNamePrefix: string;
      autoColumnWidth: boolean;
      includeWidgetTitles: boolean;
    }
  ): Promise<void> {
    const { includeHeaders, sheetNamePrefix, autoColumnWidth, includeWidgetTitles } = options;

    // Extract data from widget based on its type
    const dataExtractor = this.getDataExtractor(widget);
    if (!dataExtractor) {
      console.warn(`No data extractor found for widget type: ${widget.config?.component}`);
      return;
    }

    try {
      const data = dataExtractor.extractData(widget);
      const headers = dataExtractor.getHeaders(widget);
      const sheetName = dataExtractor.getSheetName(widget);

      if (!data || data.length === 0) {
        console.warn(`No data found for widget: ${widget.id}`);
        // Create a sheet with a message indicating no data
        const noDataMessage = [
          [widget.config?.header?.title || 'Widget Data'],
          [],
          ['No data available for export'],
          ['Widget ID:', widget.id],
          ['Component:', widget.config?.component || 'Unknown'],
          ['Export Time:', new Date().toLocaleString()]
        ];
        
        const worksheet = XLSX.utils.aoa_to_sheet(noDataMessage);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        return;
      }

      // Prepare worksheet data
      let worksheetData: any[] = [];

      // Add widget title if requested
      if (includeWidgetTitles && widget.config?.header?.title) {
        worksheetData.push([widget.config.header.title]);
        worksheetData.push([]); // Empty row
      }

      // Add headers if requested
      if (includeHeaders && headers.length > 0) {
        worksheetData.push(headers);
      }

      // Add data rows
      worksheetData = worksheetData.concat(data);

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      // Auto-resize columns if requested
      if (autoColumnWidth) {
        this.autoResizeColumns(worksheet, worksheetData);
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    } catch (error) {
      console.error(`Error processing widget ${widget.id}:`, error);
      // Create a sheet with error information
      const errorMessage = [
        [widget.config?.header?.title || 'Widget Data'],
        [],
        ['Error occurred during export'],
        ['Widget ID:', widget.id],
        ['Component:', widget.config?.component || 'Unknown'],
        ['Error:', error instanceof Error ? error.message : String(error)],
        ['Export Time:', new Date().toLocaleString()]
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(errorMessage);
      const sheetName = this.getErrorSheetName(widget);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }
  }

  /**
   * Add timestamp sheet to workbook with export information
   * @param workbook - The Excel workbook instance
   */
  private addTimestampSheet(workbook: XLSX.WorkBook): void {
    const timestamp = new Date().toLocaleString();
    const timestampData = [
      ['Dashboard Export Information'],
      [],
      ['Export Date:', timestamp],
      ['Generated by:', 'MoneyPlant Dashboard'],
      ['Total Sheets:', 'Multiple'],
      ['Export Type:', 'Dashboard Data Export']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(timestampData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export Info');
  }

  /**
   * Auto-resize columns based on content
   * @param worksheet - The Excel worksheet instance
   * @param data - The data array used to calculate column widths
   */
  private autoResizeColumns(worksheet: XLSX.WorkSheet, data: any[]): void {
    if (!data || data.length === 0) return;

    const maxCols = Math.max(...data.map(row => row.length));
    
    for (let col = 0; col < maxCols; col++) {
      let maxWidth = 10; // Minimum width
      
      for (const row of data) {
        if (row[col] !== undefined) {
          const cellValue = String(row[col]);
          maxWidth = Math.max(maxWidth, cellValue.length);
        }
      }
      
      // Set column width (Excel uses a different scale)
      const columnLetter = XLSX.utils.encode_col(col);
      worksheet['!cols'] = worksheet['!cols'] || [];
      worksheet['!cols'][col] = { width: Math.min(maxWidth + 2, 50) }; // Cap at 50
    }
  }

  /**
   * Get appropriate data extractor for widget type
   * @param widget - Widget to get extractor for
   * @returns WidgetDataExtractor instance or null if not found
   */
  private getDataExtractor(widget: IWidget): WidgetDataExtractor | null {
    const component = widget.config?.component;
    const chartType = (widget.config?.options as any)?.series?.[0]?.type;

    // Handle different widget types
    if (component === 'echart' && chartType) {
      return this.getChartDataExtractor(chartType);
    } else if (component === 'table') {
      return {
        extractData: (w: IWidget) => (w.config?.options as any)?.data || [],
        getHeaders: (w: IWidget) => (w.config?.options as any)?.columns || [],
        getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'Table')
      };
    } else if (component === 'tile') {
      return {
        extractData: (w: IWidget) => {
          const options = w.config?.options as any;
          return [[
            options?.value || '',
            options?.change || '',
            options?.changeType || '',
            options?.description || ''
          ]];
        },
        getHeaders: () => ['Value', 'Change', 'Type', 'Description'],
        getSheetName: (w: IWidget) => this.getWidgetSheetName(w, 'Tile')
      };
    } else {
      return this.getGenericDataExtractor();
    }
  }

  /**
   * Get chart-specific data extractor based on chart type
   * @param chartType - Type of chart (pie, bar, line, etc.)
   * @returns WidgetDataExtractor for the specific chart type
   */
  private getChartDataExtractor(chartType: string): WidgetDataExtractor {
    switch (chartType.toLowerCase()) {
      case 'pie':
        return {
          extractData: (widget: IWidget) => PieChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => PieChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => PieChartBuilder.getExportSheetName(widget)
        };
      case 'bar':
        return {
          extractData: (widget: IWidget) => BarChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => BarChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => BarChartBuilder.getExportSheetName(widget)
        };
      case 'line':
        return {
          extractData: (widget: IWidget) => LineChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => LineChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => LineChartBuilder.getExportSheetName(widget)
        };
      case 'scatter':
        return {
          extractData: (widget: IWidget) => ScatterChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => ScatterChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => ScatterChartBuilder.getExportSheetName(widget)
        };
      case 'gauge':
        return {
          extractData: (widget: IWidget) => GaugeChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => GaugeChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => GaugeChartBuilder.getExportSheetName(widget)
        };
      case 'heatmap':
        return {
          extractData: (widget: IWidget) => HeatmapChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => HeatmapChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => HeatmapChartBuilder.getExportSheetName(widget)
        };
      case 'map':
        return {
          extractData: (widget: IWidget) => DensityMapBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => DensityMapBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => DensityMapBuilder.getExportSheetName(widget)
        };
      case 'treemap':
        return {
          extractData: (widget: IWidget) => TreemapChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => TreemapChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => TreemapChartBuilder.getExportSheetName(widget)
        };
      case 'sunburst':
        return {
          extractData: (widget: IWidget) => SunburstChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => SunburstChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => SunburstChartBuilder.getExportSheetName(widget)
        };
      case 'sankey':
        return {
          extractData: (widget: IWidget) => SankeyChartBuilder.exportData(widget),
          getHeaders: (widget: IWidget) => SankeyChartBuilder.getExportHeaders(widget),
          getSheetName: (widget: IWidget) => SankeyChartBuilder.getExportSheetName(widget)
        };
      default:
        // For special chart types that are line charts with specific properties
        return this.getSpecialChartDataExtractor(chartType);
    }
  }

  /**
   * Get data extractor for special chart types that are line charts with specific properties
   * @param chartType - The chart type string
   * @returns WidgetDataExtractor for the special chart type
   */
  private getSpecialChartDataExtractor(chartType: string): WidgetDataExtractor {
    // This method will be called for line charts that need special handling
    // based on their properties like areaStyle, coordinateSystem, stack, etc.
    return {
      extractData: (widget: IWidget) => {
        const options = widget.config?.options as any;
        const series = options?.series?.[0];
        
        // Check for area chart (line with areaStyle)
        if (series?.type === 'line' && series?.areaStyle) {
          if (series?.stack) {
            // Stacked area chart
            return StackedAreaChartBuilder.exportData(widget);
          } else {
            // Regular area chart
            return AreaChartBuilder.exportData(widget);
          }
        }
        
        // Check for polar chart (line with polar coordinate system)
        if (series?.type === 'line' && series?.coordinateSystem === 'polar') {
          return PolarChartBuilder.exportData(widget);
        }
        
        // Default to line chart
        return LineChartBuilder.exportData(widget);
      },
      getHeaders: (widget: IWidget) => {
        const options = widget.config?.options as any;
        const series = options?.series?.[0];
        
        // Check for area chart (line with areaStyle)
        if (series?.type === 'line' && series?.areaStyle) {
          if (series?.stack) {
            // Stacked area chart
            return StackedAreaChartBuilder.getExportHeaders(widget);
          } else {
            // Regular area chart
            return AreaChartBuilder.getExportHeaders(widget);
          }
        }
        
        // Check for polar chart (line with polar coordinate system)
        if (series?.type === 'line' && series?.coordinateSystem === 'polar') {
          return PolarChartBuilder.getExportHeaders(widget);
        }
        
        // Default to line chart
        return LineChartBuilder.getExportHeaders(widget);
      },
      getSheetName: (widget: IWidget) => {
        const options = widget.config?.options as any;
        const series = options?.series?.[0];
        
        // Check for area chart (line with areaStyle)
        if (series?.type === 'line' && series?.areaStyle) {
          if (series?.stack) {
            // Stacked area chart
            return StackedAreaChartBuilder.getExportSheetName(widget);
          } else {
            // Regular area chart
            return AreaChartBuilder.getExportSheetName(widget);
          }
        }
        
        // Check for polar chart (line with polar coordinate system)
        if (series?.type === 'line' && series?.coordinateSystem === 'polar') {
          return PolarChartBuilder.getExportSheetName(widget);
        }
        
        // Default to line chart
        return LineChartBuilder.getExportSheetName(widget);
      }
    };
  }

  /**
   * Get generic data extractor for unknown widget types
   * @returns Generic WidgetDataExtractor
   */
  private getGenericDataExtractor(): WidgetDataExtractor {
    return {
      extractData: (widget: IWidget) => this.extractGenericData(widget),
      getHeaders: () => ['Property', 'Value'],
      getSheetName: (widget: IWidget) => this.getWidgetSheetName(widget, 'Generic')
    };
  }

  /**
   * Extract generic data from widget configuration
   * @param widget - Widget to extract data from
   * @returns Array of data rows
   */
  private extractGenericData(widget: IWidget): any[] {
    const data: any[] = [];
    
    // Extract basic widget information
    data.push(['Widget ID', widget.id]);
    data.push(['Component Type', widget.config?.component || 'Unknown']);
    data.push(['Title', widget.config?.header?.title || 'Untitled']);
    
    // Extract options data if available
    if (widget.config?.options) {
      const options = widget.config.options as any;
      Object.keys(options).forEach(key => {
        if (typeof options[key] !== 'object' || options[key] === null) {
          data.push([key, options[key]]);
        }
      });
    }
    
    // Extract series data if available
    if (widget.series && widget.series.length > 0) {
      data.push(['Series Data', JSON.stringify(widget.series)]);
    }
    
    return data;
  }

  /**
   * Generate sheet name for widget
   * @param widget - Widget to generate name for
   * @param type - Type identifier
   * @returns Sheet name string
   */
  private getWidgetSheetName(widget: IWidget, type: string): string {
    const title = widget.config?.header?.title || widget.id;
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 20);
    return `${type}_${cleanTitle}`;
  }

  /**
   * Generate error sheet name for widget
   * @param widget - Widget that encountered an error
   * @returns Error sheet name string
   */
  private getErrorSheetName(widget: IWidget): string {
    return `Error_${widget.id}`;
  }

  /**
   * Export a single widget to Excel
   * @param widget - Widget to export
   * @param options - Excel export options
   */
  async exportWidgetToExcel(
    widget: IWidget,
    options: ExcelExportOptions = {}
  ): Promise<void> {
    const {
      filename = `${widget.id}-export-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeHeaders = true,
      includeTimestamp = true,
      autoColumnWidth = true,
      includeWidgetTitles = true
    } = options;

    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new();

      // Add timestamp sheet if requested
      if (includeTimestamp) {
        this.addTimestampSheet(workbook);
      }

      // Export widget to sheet
      await this.exportWidgetToSheet(workbook, widget, {
        includeHeaders,
        sheetNamePrefix: 'Widget',
        autoColumnWidth,
        includeWidgetTitles
      });

      // Save the workbook
      XLSX.writeFile(workbook, filename);

    } catch (error) {
      console.error('Error exporting widget to Excel:', error);
      throw new Error('Failed to export widget to Excel');
    }
  }
} 