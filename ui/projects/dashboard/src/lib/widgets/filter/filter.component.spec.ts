import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterComponent } from './filter.component';
import { IWidget } from '../../entities/IWidget';
import { IFilterOptions } from '../../entities/IFilterOptions';
import { IFilterValues } from '../../entities/IFilterValues';

describe('FilterComponent', () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;

  // Mock widget data
  const mockWidget: any = {
    id: '1',
    type: 'filter',
    config: {
      options: {
        values: [
          { field: 'test', value: 'value1' },
          { field: 'test2', value: 'value2' }
        ]
      } as any
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    component.widget = { ...mockWidget }; // Create a fresh copy for each test
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('filterValues getter/setter', () => {
    it('should get filter values when values exist', () => {
      const result = component.filterValues;
      expect(result).toEqual([
        { field: 'test', value: 'value1' },
        { field: 'test2', value: 'value2' }
      ] as any);
    });

    it('should return empty array when no values exist', () => {
      component.widget.config.options = { values: [] } as IFilterOptions;
      const result = component.filterValues;
      expect(result).toEqual([]);
    });

    it('should handle undefined widget config gracefully', () => {
      component.widget.config = undefined as any;
      const result = component.filterValues;
      expect(result).toEqual([]);
    });

    it('should handle undefined widget config options gracefully', () => {
      component.widget.config = {} as any;
      const result = component.filterValues;
      expect(result).toEqual([]);
    });

    it('should handle undefined values array gracefully', () => {
      component.widget.config.options = {} as IFilterOptions;
      const result = component.filterValues;
      expect(result).toEqual([]);
    });

    it('should handle null values gracefully', () => {
      component.widget.config.options = { values: null as any } as IFilterOptions;
      const result = component.filterValues;
      expect(result).toEqual([]);
    });

    it('should set filter values when values are provided', () => {
      const newValues: IFilterValues[] = [
        { field: 'newField', value: 'newValue' } as any
      ];
      component.filterValues = newValues;
      expect((component.widget.config.options as IFilterOptions).values).toEqual(newValues);
    });

    it('should not set filter values when empty array is provided', () => {
      const originalValues = (component.widget.config.options as IFilterOptions).values;
      component.filterValues = [];
      expect((component.widget.config.options as IFilterOptions).values).toEqual(originalValues);
    });

    it('should create config structure when setting values on undefined config', () => {
      component.widget.config = undefined as any;
      const newValues: IFilterValues[] = [
        { field: 'newField', value: 'newValue' } as any
      ];
      component.filterValues = newValues;
      expect(component.widget.config).toBeDefined();
      expect(component.widget.config.options).toBeDefined();
      expect((component.widget.config.options as IFilterOptions).values).toEqual(newValues);
    });

    it('should create options structure when setting values on undefined options', () => {
      component.widget.config = {} as any;
      const newValues: IFilterValues[] = [
        { field: 'newField', value: 'newValue' } as any
      ];
      component.filterValues = newValues;
      expect(component.widget.config.options).toBeDefined();
      expect((component.widget.config.options as IFilterOptions).values).toEqual(newValues);
    });
  });

  describe('clearAllFilters', () => {
    it('should clear all filters when item is provided', () => {
      component.clearAllFilters({});
      expect(component.filterValues).toEqual([]);
      expect((component.widget.config.options as IFilterOptions).values).toEqual([]);
    });

    it('should not clear filters when no item is provided', () => {
      const originalValues = component.filterValues;
      component.clearAllFilters(null);
      expect(component.filterValues).toEqual(originalValues);
    });

    it('should handle undefined widget config gracefully', () => {
      component.widget.config = undefined as any;
      expect(() => component.clearAllFilters({})).not.toThrow();
    });
  });

  describe('clearFilter', () => {
    it('should clear specific filter when item is provided', () => {
      const originalLength = component.filterValues.length;
      const itemToRemove = component.filterValues[0];
      component.clearFilter(itemToRemove);
      expect(component.filterValues.length).toBe(originalLength - 1);
    });

    it('should handle undefined widget config gracefully', () => {
      component.widget.config = undefined as any;
      expect(() => component.clearFilter({})).not.toThrow();
    });
  });
});
