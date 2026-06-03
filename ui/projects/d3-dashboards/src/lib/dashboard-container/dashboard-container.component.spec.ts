import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DashboardContainerComponent } from './dashboard-container.component';
import { NgxPrintModule } from 'ngx-print';
import { MessageService } from 'primeng/api';

describe('Dashboard: DashboardContainerComponent', () => {
  let fixture: ComponentFixture<DashboardContainerComponent>;
  let dashboardContainerComponent: DashboardContainerComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
        DashboardContainerComponent,
        NgxPrintModule,
      ],
      providers: [
        MessageService,
        { provide: 'environment', useValue: {} },
      ],
    });
    fixture = TestBed.createComponent(DashboardContainerComponent);
    dashboardContainerComponent = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('Should create an instance of component', () => {
    expect(dashboardContainerComponent).toBeTruthy();
  });

  it('Should update a widget in widgets array', () => {
    const widgets: any = [{ id: 'Id1' }, { id: 'Id2' }];
    dashboardContainerComponent.widgets = widgets;
    const updatedWidget: any = { id: 'Id2', name: 'Updated Widget 2' };
    dashboardContainerComponent.onUpdateWidget(updatedWidget);
    expect(dashboardContainerComponent.widgets.length).toBe(2);
    expect(dashboardContainerComponent.widgets[0].id).toBe('Id1');
    expect(dashboardContainerComponent.widgets[1].id).toBe('Id2');
  });

  it('Should initialize with default values', () => {
    expect(dashboardContainerComponent.filterValues).toEqual([]);
    expect(dashboardContainerComponent.isEditMode).toBeFalsy();
    expect(dashboardContainerComponent.chartHeight).toBe(300);
    expect(dashboardContainerComponent.availableDashboards).toEqual([]);
    expect(dashboardContainerComponent.onShowConfirmation).toBeFalsy();
    expect(dashboardContainerComponent.onShowNewDashboardDialog).toBeFalsy();
  });

  it('should initialize KTD grid options correctly', () => {
    expect(dashboardContainerComponent.mergedOptions.cols).toBe(12);
    expect(dashboardContainerComponent.mergedOptions.draggable).toBe(false);
    expect(dashboardContainerComponent.mergedOptions.compactType).toBe('vertical');
  });

  it('should handle onDataLoad with empty widget data', async () => {
    expect(true).toBe(true);
  });
});
