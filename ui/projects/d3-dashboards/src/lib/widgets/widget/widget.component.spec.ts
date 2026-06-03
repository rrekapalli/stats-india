import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetComponent } from './widget.component';
import { IWidget } from '../../entities/IWidget';
import { D3ChartComponent } from '../d3-chart/d3-chart.component';
import { FilterComponent } from '../filter/filter.component';
import { TableComponent } from '../table/table.component';
import { TileComponent } from '../tile/tile.component';
import { StockListTableComponent } from '../../d3-chart-builders/stock-list/stock-list-table.component';

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
    it('should return D3ChartComponent for d3chart widget type', () => {
      component.widget = { config: { component: 'd3chart' } } as IWidget;
      expect(component.currentWidget.component).toBe(D3ChartComponent);
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

    it('should return StockListTableComponent for stock-list-table widget type', () => {
      component.widget = { config: { component: 'stock-list-table' } } as IWidget;
      expect(component.currentWidget.component).toBe(StockListTableComponent);
    });

    it('should return D3ChartComponent for unknown widget type', () => {
      component.widget = { config: { component: 'unknown' } } as IWidget;
      expect(component.currentWidget.component).toBe(D3ChartComponent);
    });

    it('should return D3ChartComponent when widget is undefined', () => {
      component.widget = undefined as unknown as IWidget;
      expect(component.currentWidget.component).toBe(D3ChartComponent);
    });

    it('should include correct inputs in currentWidget', () => {
      component.widget = { config: { component: 'd3chart' } } as IWidget;
      const result = component.currentWidget;

      expect(result.inputs['widget']).toBe(component.widget);
      expect(result.inputs['onDataLoad']).toBeDefined();
      expect(result.inputs['onUpdateFilter']).toBeDefined();
    });
  });
});
