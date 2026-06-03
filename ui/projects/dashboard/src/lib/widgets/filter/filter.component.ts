import {Component, EventEmitter, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IWidget} from '../../entities/IWidget';
import {IFilterValues} from '../../entities/IFilterValues';
import {IFilterOptions} from '../../entities/IFilterOptions';

@Component({
  selector: 'vis-filters',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class FilterComponent {
  @Input() widget!: IWidget;
  @Input() onUpdateFilter!: EventEmitter<any>;
  @Input() onDataLoad!: EventEmitter<any>;

  // ******************  Firing in an infite loop!!
  get filterValues(): IFilterValues[] {
    const filters: IFilterOptions = this.widget?.config?.options as IFilterOptions;

    if (filters && filters.values && Array.isArray(filters.values) && filters.values.length > 0) {
      return (filters.values as IFilterValues[]);
    } else {
      return [];
    }
  }

  set filterValues(values: IFilterValues[]) {
    if (values && values.length > 0) {
      if (!this.widget.config) {
        this.widget.config = {
          options: { values: [] } as IFilterOptions
        };
      } else if (!this.widget.config.options) {
        this.widget.config.options = { values: [] } as IFilterOptions;
      }
      (this.widget.config.options as IFilterOptions).values = values;
    }
  }

  clearAllFilters(item: any) {
    if (item) {
      // Clear local widget state
      this.filterValues = [];
      if (this.widget?.config?.options) {
        (this.widget.config.options as IFilterOptions).values = [];
      }
      
      // Emit empty array to notify dashboard container to clear all filters
      this.onUpdateFilter.emit([]);
    }
  }

  clearFilter(item: any) {
    if (JSON.stringify(item).length > 0) {
      const filterValues = this.filterValues.splice(this.filterValues.indexOf(item), 1);
      if (this.widget?.config?.options) {
        (this.widget.config.options as IFilterOptions).values = this.filterValues;
      }
      
      this.onUpdateFilter.emit(this.filterValues);
    }
  }
}
