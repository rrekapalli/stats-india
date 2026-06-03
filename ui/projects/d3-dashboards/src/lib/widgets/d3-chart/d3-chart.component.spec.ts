import { ComponentFixture, TestBed } from '@angular/core/testing';
import { D3ChartComponent } from './d3-chart.component';
import type { D3ChartSpec } from '../../chart-spec';
import type { IWidget } from '../../entities/IWidget';

describe('D3ChartComponent', () => {
  let fixture: ComponentFixture<D3ChartComponent>;
  let component: D3ChartComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [D3ChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(D3ChartComponent);
    component = fixture.componentInstance;
    component.widget = {
      id: 'w1',
      config: {
        component: 'd3chart',
        options: {
          chartType: 'bar',
          categories: ['A', 'B'],
          series: [{ name: 'S', data: [{ name: 'A', value: 1 }, { name: 'B', value: 2 }] }],
        } as D3ChartSpec,
      },
    } as IWidget;
    component.onDataLoad = { emit: jasmine.createSpy('emit') } as never;
    component.onUpdateFilter = { emit: jasmine.createSpy('emit') } as never;
  });

  it('should create and initialize chart handle', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 60));
    expect(component.widget.chartInstance).toBeTruthy();
    expect(component.widget.chartInstance?.destroy).toBeDefined();
    component.ngOnDestroy();
  });

  it('should update chart when widget spec changes', async () => {
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 60));
    const updateSpy = spyOn(component.widget.chartInstance!, 'update');
    component.widget = {
      ...component.widget,
      config: {
        ...component.widget.config,
        options: {
          ...(component.widget.config.options as D3ChartSpec),
          categories: ['X'],
          series: [{ name: 'S', data: [{ name: 'X', value: 9 }] }],
        },
      },
    };
    component.ngOnChanges({
      widget: {
        currentValue: component.widget,
        previousValue: component.widget,
        firstChange: false,
        isFirstChange: () => false,
      },
    });
    expect(updateSpy).toHaveBeenCalled();
    component.ngOnDestroy();
  });
});
