import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IFilterValues } from '../entities/IFilterValues';

export interface FilterEvent {
  widgetId: string;
  widgetTitle?: string;
  filterValue: IFilterValues;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filterValuesSubject = new BehaviorSubject<IFilterValues[]>([]);
  private filterEventsSubject = new BehaviorSubject<FilterEvent[]>([]);
  private isUpdating = false;
  private updateTimeout?: any;

  public filterValues$: Observable<IFilterValues[]> = this.filterValuesSubject.asObservable();
  public filterEvents$: Observable<FilterEvent[]> = this.filterEventsSubject.asObservable();

  constructor() {}

  /**
   * Get current filter values
   */
  getFilterValues(): IFilterValues[] {
    return this.filterValuesSubject.value;
  }

  /**
   * Get current filter events
   */
  getFilterEvents(): FilterEvent[] {
    return this.filterEventsSubject.value;
  }

  /**
   * Add a new filter value from a chart click
   */
  addFilterValue(widgetId: string, widgetTitle: string, clickedData: any): void {
    if (this.isUpdating) {
      return; // Prevent infinite loop
    }

    const filterValue = this.createFilterValueFromClickData(clickedData);
    
    if (filterValue) {
      // Add widget information
      filterValue['widgetId'] = widgetId;
      filterValue['widgetTitle'] = widgetTitle;
      
      // Check for duplicates before adding
      const currentFilters = this.filterValuesSubject.value;
      const isDuplicate = currentFilters.some(existingFilter => 
        this.isSameFilter(existingFilter, filterValue)
      );
      
      if (isDuplicate) {
        return;
      }
      
      // Add to filter values
      const updatedFilters = [...currentFilters, filterValue];
      
      this.debouncedUpdate(updatedFilters);

      // Add to filter events
      const filterEvent: FilterEvent = {
        widgetId,
        widgetTitle,
        filterValue,
        timestamp: new Date()
      };
      
      const currentEvents = this.filterEventsSubject.value;
      const updatedEvents = [...currentEvents, filterEvent];
      this.filterEventsSubject.next(updatedEvents);
    }
  }

  /**
   * Remove a specific filter value
   */
  removeFilterValue(filterToRemove: IFilterValues): void {
    if (this.isUpdating) {
      return; // Prevent infinite loop
    }

    const currentFilters = this.filterValuesSubject.value;
    const updatedFilters = currentFilters.filter(filter => 
      !this.isSameFilter(filter, filterToRemove)
    );
    
    this.debouncedUpdate(updatedFilters);
  }

  /**
   * Clear all filter values
   */
  clearAllFilters(): void {
    if (this.isUpdating) {
      return; // Prevent infinite loop
    }

    // Clear immediately without debouncing to prevent race conditions
    this.isUpdating = true;
    try {
      this.filterValuesSubject.next([]);
      this.filterEventsSubject.next([]);
    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Update filter values (used when filters are set programmatically)
   */
  setFilterValues(filters: IFilterValues[]): void {
    if (this.isUpdating) {
      return; // Prevent infinite loop
    }

    this.debouncedUpdate(filters);
  }

  /**
   * Debounced update to prevent rapid successive updates
   */
  private debouncedUpdate(filters: IFilterValues[]): void {
    // Clear any pending timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Set a new timeout
    this.updateTimeout = setTimeout(() => {
      this.isUpdating = true;
      try {
        this.filterValuesSubject.next(filters);
      } finally {
        this.isUpdating = false;
      }
    }, 50); // 50ms debounce
  }

  /**
   * Get filters for a specific widget
   */
  getFiltersForWidget(widgetId: string): IFilterValues[] {
    return this.filterValuesSubject.value.filter(filter => 
      filter['widgetId'] === widgetId
    );
  }

  /**
   * Get filters by accessor type (also checks filterColumn)
   */
  getFiltersByAccessor(accessor: string): IFilterValues[] {
    return this.filterValuesSubject.value.filter(filter => 
      filter.accessor === accessor || filter.filterColumn === accessor
    );
  }

  /**
   * Check if a widget has any active filters
   */
  hasActiveFilters(widgetId: string): boolean {
    return this.getFiltersForWidget(widgetId).length > 0;
  }

  /**
   * Create filter value from chart click data
   */
  private createFilterValueFromClickData(clickedData: any): IFilterValues | null {
    if (!clickedData || typeof clickedData !== 'object') {
      return null;
    }

    let filterValue: IFilterValues = {
      accessor: 'unknown'
    };

    // For pie charts, use the name as the filter key
    if (clickedData.name) {
      filterValue = {
        accessor: 'category',
        category: clickedData.name,
        value: clickedData.value || clickedData.name
      };
    }
    // For bar charts or other series-based charts
    else if (clickedData.seriesName) {
      filterValue = {
        accessor: 'series',
        series: clickedData.seriesName,
        value: clickedData.value || clickedData.seriesName
      };
    }
    // For scatter plots
    else if (clickedData.value && Array.isArray(clickedData.value)) {
      filterValue = {
        accessor: 'coordinates',
        x: clickedData.value[0]?.toString(),
        y: clickedData.value[1]?.toString(),
        value: `(${clickedData.value[0]}, ${clickedData.value[1]})`
      };
    }
    // For other data types, try to find meaningful properties
    else {
      const keys = Object.keys(clickedData);
      if (keys.length > 0) {
        const key = keys[0];
        filterValue = {
          accessor: key,
          [key]: clickedData[key],
          value: clickedData[key]?.toString()
        };
      }
    }

    return filterValue.accessor !== 'unknown' ? filterValue : null;
  }

  /**
   * Check if two filters are the same
   */
  private isSameFilter(filter1: IFilterValues, filter2: IFilterValues): boolean {
    // Use JSON.stringify for reliable comparison of small objects
    return JSON.stringify(filter1) === JSON.stringify(filter2);
  }

  /**
   * Apply filters to data
   */
  applyFiltersToData<T extends Record<string, any>>(data: T[], filters: IFilterValues[]): T[] {
    // Type guard: Check if data is actually an array
    if (!Array.isArray(data)) {
      return data as any; // Return the non-array data unchanged
    }

    if (!filters || filters.length === 0) {
      return data;
    }

    // Check if any of the filters are relevant to this data
    const relevantFilters = filters.filter(filter => {
      // For category filters, check if any data item has a matching name
      if (filter.accessor === 'category') {
        return data.some(item => 
          item['name'] === filter['category'] || 
          item['category'] === filter['category']
        );
      }
      // For other filter types, check if the filterColumn matches any data properties
      const filterKey = filter.filterColumn || filter.accessor;
      return data.some(item => item.hasOwnProperty(filterKey));
    });

    // If no relevant filters, return original data
    if (relevantFilters.length === 0) {
      return data;
    }

    const filteredData = data.filter(item => {
      return relevantFilters.every(filter => {
        return this.matchesFilter(item, filter);
      });
    });

    return filteredData;
  }

  /**
   * Check if an item matches a filter
   */
  private matchesFilter(item: any, filter: IFilterValues): boolean {
    // Use filterColumn if available, otherwise fall back to accessor
    const filterKey = filter.filterColumn || filter.accessor;
    
    let result = false;
    
    switch (filter.accessor) {
      case 'category':
        result = item.name === filter['category'] || item.category === filter['category'];
        break;
      case 'series':
        result = item.seriesName === filter['series'] || item.series === filter['series'];
        break;
      case 'coordinates':
        result = item.value && 
               Array.isArray(item.value) && 
               item.value[0]?.toString() === filter['x'] && 
               item.value[1]?.toString() === filter['y'];
        break;
      default:
        // For custom accessors, check if the property exists and matches
        // Use filterColumn if available, otherwise use accessor
        const propertyToCheck = filter.filterColumn || filter.accessor;
        result = item[propertyToCheck] === filter[filter.accessor] || 
               item[propertyToCheck]?.toString() === filter['value'];
        break;
    }
    
    return result;
  }

  /**
   * Apply filters to data using highlighting mode
   * Instead of removing data, this marks data as highlighted or filtered
   */
  applyHighlightingFiltersToData<T extends Record<string, any>>(
    data: T[], 
    filters: IFilterValues[],
    options?: {
      filteredOpacity?: number;
      highlightedOpacity?: number;
      highlightColor?: string;
      filteredColor?: string;
    }
  ): (T & { _filterState?: 'highlighted' | 'filtered' | 'normal' })[] {
    if (!filters || filters.length === 0) {
      // No filters, return all data as normal
      return data.map(item => ({ ...item, _filterState: 'normal' as const }));
    }

    const defaultOptions = {
      filteredOpacity: 0.3,
      highlightedOpacity: 1.0,
      highlightColor: undefined,
      filteredColor: '#cccccc'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return data.map(item => {
      // Check if this item matches any filter
      const matchesAnyFilter = filters.some(filter => this.matchesFilter(item, filter));
      
      if (matchesAnyFilter) {
        return { 
          ...item, 
          _filterState: 'highlighted' as const,
          _visualOptions: {
            opacity: mergedOptions.highlightedOpacity,
            color: mergedOptions.highlightColor
          }
        };
      } else {
        return { 
          ...item, 
          _filterState: 'filtered' as const,
          _visualOptions: {
            opacity: mergedOptions.filteredOpacity,
            color: mergedOptions.filteredColor
          }
        };
      }
    });
  }

  /**
   * Convert highlighting data to ECharts format
   */
  applyHighlightingToEChartsData(
    data: any[], 
    filters: IFilterValues[],
    chartType: 'pie' | 'bar' | 'line' | 'scatter' | 'other' = 'other',
    options?: {
      filteredOpacity?: number;
      highlightedOpacity?: number;
      highlightColor?: string;
      filteredColor?: string;
    }
  ): any {
    if (!filters || filters.length === 0) {
      return data;
    }

    const defaultOptions = {
      filteredOpacity: 0.3,
      highlightedOpacity: 1.0,
      highlightColor: undefined,
      filteredColor: '#cccccc'
    };

    const mergedOptions = { ...defaultOptions, ...options };

    // For pie charts
    if (chartType === 'pie') {
      return data.map((item, index) => {
        const matchesAnyFilter = filters.some(filter => {
          // Check if this pie slice matches the filter
          return this.matchesPieSliceFilter(item, filter);
        });

        if (matchesAnyFilter) {
          return {
            ...item,
            itemStyle: {
              ...item.itemStyle,
              opacity: mergedOptions.highlightedOpacity,
              borderWidth: 3,
              borderColor: mergedOptions.highlightColor || '#ff6b6b'
            }
          };
        } else {
          return {
            ...item,
            itemStyle: {
              ...item.itemStyle,
              opacity: mergedOptions.filteredOpacity,
              color: mergedOptions.filteredColor
            }
          };
        }
      });
    }

    // For bar charts
    if (chartType === 'bar') {
      return data.map(item => {
        const matchesAnyFilter = filters.some(filter => {
          return this.matchesBarDataFilter(item, filter);
        });

        if (matchesAnyFilter) {
          return {
            ...item,
            itemStyle: {
              ...item.itemStyle,
              opacity: mergedOptions.highlightedOpacity,
              borderWidth: 2,
              borderColor: mergedOptions.highlightColor || '#ff6b6b'
            }
          };
        } else {
          return {
            ...item,
            itemStyle: {
              ...item.itemStyle,
              opacity: mergedOptions.filteredOpacity,
              color: mergedOptions.filteredColor
            }
          };
        }
      });
    }

    // For other chart types, return original data with opacity adjustments
    return data;
  }

  /**
   * Check if a pie slice matches a filter
   */
  private matchesPieSliceFilter(item: any, filter: IFilterValues): boolean {
    if (!item || !filter) {
      return false;
    }

    // Check by name (most common for pie charts)
    if (item.name && filter['value']) {
      const itemName = item.name.toString().toLowerCase();
      const filterValue = filter['value'].toString().toLowerCase();
      if (itemName === filterValue) return true;
    }

    // Check by category if available
    if (item.name && filter['category']) {
      const itemName = item.name.toString().toLowerCase();
      const filterCategory = filter['category'].toString().toLowerCase();
      if (itemName === filterCategory) return true;
    }

    return false;
  }

  /**
   * Check if bar chart data matches a filter
   */
  private matchesBarDataFilter(item: any, filter: IFilterValues): boolean {
    if (!item || !filter) return false;

    // For bar charts, check if the item name matches filter category or value
    if (item.name && filter['category']) {
      return item.name.toString().toLowerCase() === filter['category'].toString().toLowerCase();
    }

    if (item.name && filter['value']) {
      return item.name.toString().toLowerCase() === filter['value'].toString().toLowerCase();
    }

    return false;
  }
} 