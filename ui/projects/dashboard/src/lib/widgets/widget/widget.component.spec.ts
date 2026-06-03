import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetComponent } from './widget.component';
import { IWidget } from '../../entities/IWidget';
import { EchartComponent } from '../echarts/echart.component';
import { FilterComponent } from '../filter/filter.component';
import { TableComponent } from '../table/table.component';
import { TileComponent } from '../tile/tile.component';
import { MarkdownCellComponent } from '../markdown-cell/markdown-cell.component';
import { CodeCellComponent } from '../code-cell/code-cell.component';
import { StockListTableComponent } from '../../echart-chart-builders/stock-list/stock-list-table.component';

describe('WidgetComponent', () => {
  let component: WidgetComponent;
  let fixture: ComponentFixture<WidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('currentWidget getter', () => {
    it('should return EchartComponent for echart widget type', () => {
      component.widget = { config: { component: 'echart' } } as IWidget;
      expect(component.currentWidget.component).toBe(EchartComponent);
    });

    it('should return FilterComponent for filter widget type', () => {
      component.widget = { config: { component: 'filter' } } as IWidget;
      expect(component.currentWidget.component).toBe(FilterComponent);
    });

    it('should return TableComponent for table widget type', () => {
      component.widget = { config: { component: 'table' } } as IWidget;
      expect(component.currentWidget.component).toBe(TableComponent);
    });

    it('should return TileComponent for tile widget type', () => {
      component.widget = { config: { component: 'tile' } } as IWidget;
      expect(component.currentWidget.component).toBe(TileComponent);
    });

    it('should return MarkdownCellComponent for markdownCell widget type', () => {
      component.widget = { config: { component: 'markdownCell' } } as IWidget;
      expect(component.currentWidget.component).toBe(MarkdownCellComponent);
    });

    it('should return CodeCellComponent for codeCell widget type', () => {
      component.widget = { config: { component: 'codeCell' } } as IWidget;
      expect(component.currentWidget.component).toBe(CodeCellComponent);
    });

    it('should return StockListTableComponent for stock-list-table widget type', () => {
      component.widget = { config: { component: 'stock-list-table' } } as IWidget;
      expect(component.currentWidget.component).toBe(StockListTableComponent);
    });

    it('should return EchartComponent for unknown widget type', () => {
      component.widget = { config: { component: 'unknown' } } as IWidget;
      expect(component.currentWidget.component).toBe(EchartComponent);
    });

    it('should return EchartComponent when widget is undefined', () => {
      component.widget = undefined as unknown as IWidget;
      expect(component.currentWidget.component).toBe(EchartComponent);
    });

    it('should include correct inputs in currentWidget', () => {
      component.widget = { config: { component: 'echart' } } as IWidget;
      const result = component.currentWidget;
      
      expect(result.inputs.widget).toBe(component.widget);
      expect(result.inputs.onDataLoad).toBeDefined();
      expect(result.inputs.onUpdateFilter).toBeDefined();
    });
  });

  describe('EventEmitters', () => {
    it('should emit onDataLoad event', () => {
      const spy = spyOn(component.onDataLoad, 'emit');
      const testWidget = { config: { component: 'echart' } } as IWidget;
      
      component.onDataLoad.emit(testWidget);
      
      expect(spy).toHaveBeenCalledWith(testWidget);
    });

    it('should emit onUpdateFilter event', () => {
      const spy = spyOn(component.onUpdateFilter, 'emit');
      const filterData = { key: 'value' };
      
      component.onUpdateFilter.emit(filterData);
      
      expect(spy).toHaveBeenCalledWith(filterData);
    });
  });
});