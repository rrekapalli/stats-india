import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, ChangeDetectionStrategy, OnDestroy, Directive } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IWidget } from '../entities/IWidget';
import { DashboardContainerComponent } from './dashboard-container.component';
import { DashboardHeaderComponent } from '../dashboard-header';
import { DashboardConfig } from './dashboard-container-builder';
import { ExcelExportService, ExcelExportOptions } from '../services/excel-export.service';
import { IFilterValues } from '../entities/IFilterValues';
import { ITileOptions } from '../entities/ITileOptions';
import { FilterService } from '../services/filter.service';
import type { DashboardGridConfig } from '../grid/dashboard-grid.types';

import { Subscription } from 'rxjs';

@Directive()
export abstract class BaseDashboardComponent<T = any> implements OnInit, OnDestroy {
  // Dashboard config (Fluent API)
  dashboardConfig!: DashboardConfig;
  
  // Excel export loading state
  isExportingExcel = false;

  // Flag to prevent recursive filter updates
  protected isUpdatingFilters = false;

  // Debounce mechanism for widget updates
  protected widgetUpdateTimeout?: any;
  protected filterSubscription?: Subscription;

  // Filter highlighting mode control
  public isHighlightingEnabled: boolean = true;
  public highlightingOpacity: number = 0.25;

  // Reference to dashboard container for PDF export
  @ViewChild('dashboardContainer', { static: false }) dashboardContainer!: ElementRef<HTMLElement>;

  // Reference to dashboard container component
  @ViewChild(DashboardContainerComponent, { static: false }) dashboardContainerComponent!: DashboardContainerComponent;

    // Abstract properties that must be implemented by child classes
  protected abstract dashboardData: T[];
  protected abstract readonly initialDashboardData: T[];

  constructor(
    protected cdr: ChangeDetectorRef,
    protected excelExportService: ExcelExportService,
    protected filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.initializeDashboardConfig();
    
    // CRITICAL: Apply common Gridster settings after dashboard config is initialized
    // This ensures CompactUpAndLeft and other settings are applied at the base class level
    this.applyCommonKtdSettings();
    
    // Subscribe to filter service changes
    this.filterSubscription = this.filterService.filterValues$.subscribe(filters => {
      this.updateWidgetsWithFilters(filters);
    });

    // Call child-specific initialization
    this.onChildInit();
  }

  protected applyCommonKtdSettings(): void {
    if (!this.dashboardConfig?.config) {
      return;
    }

    const isEditMode = this.dashboardConfig.isEditMode ?? false;
    const cfg = this.dashboardConfig.config as DashboardGridConfig;
    cfg.draggable = isEditMode;
    cfg.resizable = isEditMode;
    cfg.compactType = 'vertical';
    cfg.gap = 2;
    cfg.preventCollision = true;
    cfg.compactOnPropsChange = false;
    cfg.disableWarnings = true;
  }

  // Abstract method for child-specific initialization
  protected abstract onChildInit(): void;

  // Abstract method for dashboard configuration - must be implemented by child classes
  protected abstract initializeDashboardConfig(): void;

  /**
   * Handle filter values change from dashboard container
   */
  onFilterValuesChanged(filters: IFilterValues[]): void {
    if (this.isUpdatingFilters) {
      return;
    }

    this.isUpdatingFilters = true;
    
    // Set filter values in the service
    this.filterService.setFilterValues(filters);
    
    this.isUpdatingFilters = false;
  }

  /**
   * Update all widgets with current filters
   */
  protected updateWidgetsWithFilters(filters?: IFilterValues[]): void {
    if (this.isUpdatingFilters) {
      return;
    }

    const currentFilters = filters || this.filterService.getFilterValues();
    
    // Apply filters to the shared dashboard data
    this.applyFiltersToDashboardData(currentFilters);
    
    // Find all echart widgets
    const echartWidgets = this.dashboardConfig.widgets.filter(widget => 
      widget.config?.component === 'd3chart'
    );

    echartWidgets.forEach(widget => {
      this.updateWidgetWithFilters(widget, currentFilters);
    });

    // Update metric tiles with filtered data
    this.updateMetricTilesWithFilters(currentFilters);

    // Trigger change detection with a delay to ensure all updates are complete
    setTimeout(() => {
      this.cdr.detectChanges();
      
      // Force another change detection after a short delay to catch any delayed updates
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 100);
    }, 50);
  }

  /**
   * Update metric tiles with filtered data
   */
  protected updateMetricTilesWithFilters(filters: IFilterValues[]): void {
    // Find all tile widgets
    const tileWidgets = this.dashboardConfig.widgets.filter(widget => 
      widget.config?.component === 'tile'
    );

    // Create new metric tiles with filtered data - delegate to child class
    const updatedMetricTiles = this.createMetricTiles(this.dashboardData);

    // Update each tile widget with new data
    tileWidgets.forEach((widget, index) => {
      if (index < updatedMetricTiles.length) {
        const updatedTile = updatedMetricTiles[index];
        
        // Check if this tile should update on data change
        const tileOptions = widget.config?.options as ITileOptions;
        const shouldUpdate = tileOptions?.updateOnDataChange !== false;
        
        if (shouldUpdate) {
          // Update the widget's options with new tile data
          if (widget.config?.options) {
            Object.assign(widget.config.options, updatedTile.config?.options);
          }
        }
      }
    });
  }

  // Abstract method for creating metric tiles - must be implemented by child classes
  protected abstract createMetricTiles(data: T[]): IWidget[];

  /**
   * Apply filters to the shared dashboard data
   */
  protected applyFiltersToDashboardData(filters: IFilterValues[]): void {
    if (filters.length === 0) {
      // Reset to initial data if no filters
      this.dashboardData = [...this.initialDashboardData];
      return;
    }

    // Check if highlighting mode is enabled
    const highlightingEnabled = this.dashboardConfig?.filterVisualization?.enableHighlighting;
    
    if (highlightingEnabled) {
      // In highlighting mode, keep the full dataset available
      // Individual widgets will handle their own filtering/highlighting
      this.dashboardData = [...this.initialDashboardData];
    } else {
      // In traditional mode, filter the main dataset
      this.dashboardData = this.applyFiltersToFlatData(this.initialDashboardData, filters);
    }
  }

  /**
   * Apply filters to flat data structure
   */
  protected applyFiltersToFlatData(data: T[], filters: IFilterValues[]): T[] {
    if (!filters || filters.length === 0) {
      return data;
    }

    return data.filter(row => {
      return filters.every(filter => {
        return this.matchesFlatDataFilter(row, filter);
      });
    });
  }

  /**
   * Check if a flat data row matches a filter (generic implementation)
   * This is a generic implementation that can be overridden by child classes
   */
  protected matchesFlatDataFilter(row: T, filter: IFilterValues): boolean {
    // Generic implementation using dynamic property access
    const rowData = row as any;
    const filterValue = filter['value'] || filter[filter.accessor];
    
    // Try to match the filter accessor property
    if (filter.accessor && rowData.hasOwnProperty(filter.accessor)) {
      return rowData[filter.accessor] === filterValue;
    }
    
    // Try to match by common property names
    const commonProperties = ['category', 'month', 'type', 'name'];
    for (const prop of commonProperties) {
      if (rowData.hasOwnProperty(prop) && rowData[prop] === filterValue) {
        return true;
      }
    }
    
    // Fallback: try to match any property value
    return Object.values(rowData).includes(filterValue);
  }

  /**
   * Get filtered data for a specific widget from the original dataset with filters applied
   * Used for non-source widgets in highlighting mode
   */
  protected getFilteredDataForWidgetFromOriginalData(widgetTitle: string, filters: IFilterValues[]): any {
    // Apply filters to original data first
    const filteredData = this.applyFiltersToFlatData(this.initialDashboardData, filters);
    
    // Then process the filtered data for the specific widget - delegate to child class
    return this.getFilteredDataForWidget(widgetTitle, filteredData);
  }

  /**
   * Get filtered data for a specific widget based on its requirements
   * Abstract method that must be implemented by child classes
   */
  protected abstract getFilteredDataForWidget(widgetTitle: string, data?: T[]): any;

  /**
   * Generic helper method to group data by a field and sum another field
   */
  protected groupByAndSum(data: T[], groupBy: string, sumField: string): Array<{ name: string; value: number }> {
    const grouped = data.reduce((acc, row) => {
      const rowData = row as any;
      const key = rowData[groupBy];
      if (!acc[key]) {
        acc[key] = 0;
      }
      const value = Number(rowData[sumField]) || 0;
      acc[key] += value;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }

  /**
   * Generic helper method to group data by a field and count occurrences
   */
  protected groupByAndCount(data: T[], groupBy: string): Array<{ name: string; value: number }> {
    const grouped = data.reduce((acc, row) => {
      const rowData = row as any;
      const key = rowData[groupBy];
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }

  /**
   * Generic helper method to group data by a field and calculate average
   */
  protected groupByAndAverage(data: T[], groupBy: string, averageField: string): Array<{ name: string; value: number }> {
    const grouped = data.reduce((acc, row) => {
      const rowData = row as any;
      const key = rowData[groupBy];
      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0 };
      }
      const value = Number(rowData[averageField]) || 0;
      acc[key].sum += value;
      acc[key].count++;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    return Object.entries(grouped).map(([name, { sum, count }]) => ({
      name,
      value: count > 0 ? sum / count : 0
    }));
  }

  /**
   * Generic helper method to filter data by field values
   */
  protected filterByFieldValues(data: T[], field: string, values: any[]): T[] {
    return data.filter(row => {
      const rowData = row as any;
      return values.includes(rowData[field]);
    });
  }

  /**
   * Generic helper method to get unique values for a field
   */
  protected getUniqueFieldValues(data: T[], field: string): any[] {
    const values = data.map(row => (row as any)[field]);
    return [...new Set(values)];
  }

  /**
   * Generic helper method to sort data by a field
   */
  protected sortByField(data: T[], field: string, ascending: boolean = true): T[] {
    return [...data].sort((a, b) => {
      const aValue = (a as any)[field];
      const bValue = (b as any)[field];
      
      if (aValue < bValue) return ascending ? -1 : 1;
      if (aValue > bValue) return ascending ? 1 : -1;
      return 0;
    });
  }

  /**
   * Generic helper method to aggregate data by multiple fields
   */
  protected aggregateByFields(
    data: T[], 
    groupByFields: string[], 
    aggregations: { field: string; operation: 'sum' | 'count' | 'avg' | 'min' | 'max' }[]
  ): any[] {
    const grouped = data.reduce((acc, row) => {
      const rowData = row as any;
      const key = groupByFields.map(field => rowData[field]).join('|');
      
      if (!acc[key]) {
        acc[key] = {
          groupKey: key,
          groupValues: groupByFields.reduce((obj, field) => {
            obj[field] = rowData[field];
            return obj;
          }, {} as any),
          aggregations: aggregations.reduce((obj, agg) => {
            obj[agg.field] = {
              operation: agg.operation,
              values: []
            };
            return obj;
          }, {} as any)
        };
      }
      
      // Collect values for aggregation
      aggregations.forEach(agg => {
        const value = Number(rowData[agg.field]) || 0;
        acc[key].aggregations[agg.field].values.push(value);
      });
      
      return acc;
    }, {} as any);

    // Calculate final aggregations
    return Object.values(grouped).map((group: any) => {
      const result = { ...group.groupValues };
      
      Object.entries(group.aggregations).forEach(([field, aggData]: [string, any]) => {
        const values = aggData.values;
        switch (aggData.operation) {
          case 'sum':
            result[`${field}_sum`] = values.reduce((sum: number, val: number) => sum + val, 0);
            break;
          case 'count':
            result[`${field}_count`] = values.length;
            break;
          case 'avg':
            result[`${field}_avg`] = values.length > 0 ? values.reduce((sum: number, val: number) => sum + val, 0) / values.length : 0;
            break;
          case 'min':
            result[`${field}_min`] = Math.min(...values);
            break;
          case 'max':
            result[`${field}_max`] = Math.max(...values);
            break;
        }
      });
      
      return result;
    });
  }

  /**
   * Update a specific widget with filtered data
   */
  protected updateWidgetWithFilters(widget: IWidget, filters: IFilterValues[]): void {
    if (!widget.config || !widget.config.component) {
      return;
    }

    const widgetTitle = widget.config?.header?.title;
    
    // Check if this widget is the source of any filter (where the click originated)
    const isSourceWidget = filters.some(filter => {
      const widgetIdMatch = filter['widgetId'] === widget.id;
      const widgetTitleMatch = filter['widgetTitle'] === widgetTitle;
      return widgetIdMatch || widgetTitleMatch;
    });
    
    // Check if highlighting mode is enabled
    const highlightingEnabled = this.dashboardConfig?.filterVisualization?.enableHighlighting;
    
    // Try to get base data by widget title first
    let baseData = null;
    if (widgetTitle) {
      if (highlightingEnabled && !isSourceWidget && filters.length > 0) {
        // For non-source widgets in highlighting mode, get data from original dataset and apply filtering
        baseData = this.getFilteredDataForWidgetFromOriginalData(widgetTitle, filters);
      } else {
        // For source widgets or traditional mode, use the normal data retrieval
        baseData = this.getFilteredDataForWidget(widgetTitle);
      }
    }
    
    // If no data found by title, try to detect chart type and provide appropriate data
    if (!baseData) {
      baseData = this.getSummarizedDataByWidget(widgetTitle || '');
    }
    
    if (!baseData) {
      return;
    }

    let processedData = baseData;
    
    if (highlightingEnabled && filters.length > 0 && isSourceWidget) {
      // Apply highlighting ONLY to the source widget (where the filter was clicked)
      const chartSpec = widget.config?.options as { chartType?: string } | undefined;
      let chartType: 'pie' | 'bar' | 'line' | 'scatter' | 'other' = 'other';
      const ct = chartSpec?.chartType;
      if (ct === 'pie') {
        chartType = 'pie';
      } else if (ct && ct.includes('bar')) {
        chartType = 'bar';
      } else if (ct === 'line' || ct === 'area' || (ct && ct.includes('area'))) {
        chartType = 'line';
      } else if (ct === 'scatter') {
        chartType = 'scatter';
      }
      
      // Get highlighting options from dashboard config
      const visualOptions = {
        filteredOpacity: this.dashboardConfig.filterVisualization?.defaultFilteredOpacity || 0.25,
        highlightedOpacity: this.dashboardConfig.filterVisualization?.defaultHighlightedOpacity || 1.0,
        highlightColor: this.dashboardConfig.filterVisualization?.defaultHighlightColor || '#ff6b6b',
        filteredColor: this.dashboardConfig.filterVisualization?.defaultFilteredColor || '#e0e0e0'
      };

      // Apply highlighting to the data
      processedData = this.filterService.applyHighlightingToD3Spec(
        baseData, 
        filters, 
        chartType,
        visualOptions
      );
    } else if (filters.length > 0) {
      // Use traditional filtering for other widgets (non-source widgets)
      // Only apply filtering if baseData is an array
      if (Array.isArray(baseData)) {
        processedData = this.filterService.applyFiltersToData(baseData, filters);
        
        // If all data is filtered out and we have filters, show empty state
        if (processedData.length === 0) {
          processedData = [{
            name: 'No data matches filter',
            value: 0,
            itemStyle: {
              color: '#cccccc'
            }
          }];
        }
      } else {
        // For non-array data (like Sankey diagrams), return as-is
        // These widgets handle their own filtering internally
        processedData = baseData;
      }
    }

    // Update widget data based on component type
    if (widget.config.component === 'd3chart') {
      this.updateEchartWidget(widget, processedData);
    }
  }

  /**
   * Update echart widget with filtered data
   */
  protected updateEchartWidget(widget: IWidget, filteredData: any): void {
    const spec = widget.config?.options as import('../chart-spec').D3ChartSpec | undefined;
    if (!spec?.chartType) {
      return;
    }

    const widgetTitle = widget.config?.header?.title;

    if (
      (spec.chartType === 'treemap' || spec.chartType === 'sunburst' || spec.chartType === 'zoomable-sunburst' || spec.chartType === 'zoomable-icicle') &&
      filteredData?.length
    ) {
      if (!this.isHierarchicalData(filteredData)) {
        console.warn(
          `Skipping ${spec.chartType} update for widget "${widgetTitle}" - data is not hierarchical`
        );
        return;
      }
      widget.config.options = { ...spec, hierarchy: filteredData[0] ?? filteredData };
    } else if (Array.isArray(filteredData)) {
      const series = spec.series?.length
        ? spec.series.map((s, i) => (i === 0 ? { ...s, data: filteredData } : { ...s }))
        : [{ name: 'Series', data: filteredData }];
      const categories =
        spec.categories && filteredData.every((item: { name?: string }) => item?.name != null)
          ? filteredData.map((item: { name: string }) => item.name)
          : spec.categories;
      widget.config.options = { ...spec, series, categories };
    }

    const updated = widget.config.options as import('../chart-spec').D3ChartSpec;
    if (widget.chartInstance) {
      try {
        widget.chartInstance.update(updated);
      } catch (error) {
        console.error('Error updating D3 chart:', error);
      }
    }

    this.scheduleWidgetUpdate(widget);
  }

  /**
   * Check if data has hierarchical structure suitable for treemap
   */
  protected isHierarchicalData(data: any): boolean {
    if (!Array.isArray(data) || data.length === 0) {
      return false;
    }
    
    // Check if at least one item has children property with nested structure
    return data.some(item => 
      item && 
      typeof item === 'object' && 
      item.children && 
      Array.isArray(item.children) && 
      item.children.length > 0
    );
  }

  /**
   * Schedule widget update with retry mechanism
   */
  protected scheduleWidgetUpdate(widget: IWidget): void {
    // Clear any existing timeout
    if (this.widgetUpdateTimeout) {
      clearTimeout(this.widgetUpdateTimeout);
    }

    // Schedule update with retry logic
    this.widgetUpdateTimeout = setTimeout(() => {
      this.retryWidgetUpdate(widget, 0);
    }, 50);
  }

  /**
   * Retry widget update with exponential backoff
   */
  protected retryWidgetUpdate(widget: IWidget, attempt: number): void {
    const maxAttempts = 5;
    const baseDelay = 100;
    const widgetTitle = widget.config?.header?.title || widget.id;

    if (attempt >= maxAttempts) {
      return;
    }

    // Try to update the widget
    try {
      // Force change detection
      this.cdr.detectChanges();
      
      // Schedule another change detection after a short delay
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 50);
      
    } catch (error) {
      
      // Retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      setTimeout(() => {
        this.retryWidgetUpdate(widget, attempt + 1);
      }, delay);
    }
  }

  /**
   * Get data for widget based on chart type detection
   */
  protected abstract getSummarizedDataByWidget(widgetTitle: string | undefined): any;

  /**
   * Export dashboard data to Excel
   */
  public async exportDashboardToExcel(): Promise<void> {
    this.isExportingExcel = true;
    this.cdr.detectChanges(); // Immediately update UI

    try {
      // Add a small delay to allow UI to update with loading state
      await new Promise(resolve => setTimeout(resolve, 50));
      
      
      // Use setTimeout to make the Excel generation truly async
      await new Promise<void>((resolve, reject) => {
        setTimeout(async () => {
          try {
            await this.excelExportService.exportDashboardToExcel(
              this.dashboardConfig.widgets,
              {
                filename: `financial-dashboard-data-${new Date().toISOString().split('T')[0]}.xlsx`,
                includeHeaders: true,
                includeTimestamp: true,
                sheetNamePrefix: 'Widget',
                autoColumnWidth: true,
                includeWidgetTitles: true
              }
            );
            resolve();
          } catch (error) {
            console.error('Excel export failed:', error);
            reject(error);
          }
        }, 100);
      });
      
    } catch (error) {
      console.error('Excel export error:', error);
      // Could show user-friendly error message here
    } finally {
      this.isExportingExcel = false;
      this.cdr.detectChanges(); // Update UI to remove loading state
    }
  }

  /**
   * Update all charts with new data
   */
  public async updateAllCharts(): Promise<void> {
    try {
      // Simulate API call to get updated data
      const updatedData = await this.getUpdatedChartData();
      
      // Update each chart widget
      this.dashboardConfig.widgets.forEach((widget, index) => {
        if (widget.config?.component === 'd3chart' && updatedData[index]) {
          if (widget.config?.options) {
            const chartOptions = widget.config.options as any;
            if (chartOptions.series) {
              chartOptions.series.forEach((series: any, seriesIndex: number) => {
                if (updatedData[index][seriesIndex]) {
                  series.data = updatedData[index][seriesIndex];
                }
              });
            }
          }
        }
      });
    } catch (error) {
      // Handle chart update error silently
    }
  }

  /**
   * Simulate getting updated chart data from API - can be overridden by child classes
   */
  protected async getUpdatedChartData(): Promise<any[]> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock updated data
    return [
      { name: 'Updated Data 1', value: Math.random() * 100 },
      { name: 'Updated Data 2', value: Math.random() * 100 },
      { name: 'Updated Data 3', value: Math.random() * 100 }
    ];
  }

  /**
   * Clear all filters
   */
  public clearAllFilters(): void {
    this.isUpdatingFilters = true;
    try {
      this.filterService.clearAllFilters();
    } finally {
      this.isUpdatingFilters = false;
    }
  }

  /**
   * Get current filter values
   */
  public getCurrentFilters(): IFilterValues[] {
    return this.filterService.getFilterValues();
  }

  /**
   * Toggle filter highlighting mode
   */
  public toggleHighlightingMode(): void {
    this.isHighlightingEnabled = !this.isHighlightingEnabled;
    this.updateDashboardHighlightingConfig();
    
    // Re-apply current filters with new highlighting mode
    const currentFilters = this.getCurrentFilters();
    this.updateWidgetsWithFilters(currentFilters);
    
    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Update highlighting opacity and refresh widgets
   */
  public updateHighlightingOpacity(opacity: number): void {
    this.highlightingOpacity = Math.max(0.1, Math.min(1.0, opacity));
    this.updateDashboardHighlightingConfig();
    
    // Re-apply current filters with new opacity
    const currentFilters = this.getCurrentFilters();
    this.updateWidgetsWithFilters(currentFilters);
    
    // Force change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Update dashboard configuration with current highlighting settings
   */
  protected updateDashboardHighlightingConfig(): void {
    if (this.dashboardConfig?.filterVisualization) {
      this.dashboardConfig.filterVisualization.enableHighlighting = this.isHighlightingEnabled;
      this.dashboardConfig.filterVisualization.defaultFilteredOpacity = this.highlightingOpacity;
      
    }
  }

  /**
   * Get highlighting status message for UI
   */
  public getHighlightingStatusMessage(): string {
    if (this.isHighlightingEnabled) {
      return `Highlighting Mode: ON - Source widgets highlighted (${Math.round(this.highlightingOpacity * 100)}% opacity), others filtered`;
    } else {
      return 'Highlighting Mode: OFF - All widgets use traditional filtering';
    }
  }

  /**
   * Demo method to show different highlighting configurations
   */
  public setHighlightingPreset(preset: 'subtle' | 'medium' | 'strong'): void {
    let opacity: number;
    
    switch (preset) {
      case 'subtle':
        opacity = 0.4;
        break;
      case 'medium':
        opacity = 0.25;
        break;
      case 'strong':
        opacity = 0.1;
        break;
    }
    
    this.updateHighlightingOpacity(opacity);
  }

  /**
   * Populate all widgets with initial data from the shared dataset
   */
  protected populateWidgetsWithInitialData(): void {
    if (!this.dashboardConfig?.widgets) {
      return;
    }

    // Find all echart widgets and populate them with initial data
    const echartWidgets = this.dashboardConfig.widgets.filter(widget => 
      widget.config?.component === 'd3chart'
    );

    echartWidgets.forEach(widget => {
      const widgetTitle: string = widget.config?.header?.title || '';
      
      // Try to get data by widget title first
      let initialData = null;
      if (widgetTitle) {
        initialData = this.getFilteredDataForWidget(widgetTitle);
      }
      
      // If no data found by title, try to detect chart type and provide appropriate data
      if (!initialData) {
        initialData = this.getSummarizedDataByWidget(widgetTitle);
      }
      
      if (initialData) {
        this.updateEchartWidget(widget, initialData);
      }
    });

    // Populate metric tiles with initial data
    this.updateMetricTilesWithFilters([]);

    // Trigger change detection to ensure widgets are updated
    setTimeout(() => {
      this.cdr.detectChanges();
    }, 100);
  }

  ngOnDestroy(): void {
    // Cleanup code when component is destroyed
    if (this.widgetUpdateTimeout) {
      clearTimeout(this.widgetUpdateTimeout);
    }
    
    // Unsubscribe from filter service
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe();
    }

    // Call child-specific cleanup
    this.onChildDestroy();
  }

  // Abstract method for child-specific cleanup
  protected abstract onChildDestroy(): void;
} 