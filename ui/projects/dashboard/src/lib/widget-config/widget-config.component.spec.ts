import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WidgetConfigComponent } from './widget-config.component';
import { IWidget } from '../entities/IWidget';
import { MessageService } from 'primeng/api';

describe('WidgetConfigComponent', () => {
  let component: WidgetConfigComponent;
  let fixture: ComponentFixture<WidgetConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetConfigComponent],
      providers: [MessageService]
    }).compileComponents();

    fixture = TestBed.createComponent(WidgetConfigComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.sidebarVisible).toBe(true);
    expect(component.items.length).toBe(3);
    expect(component.activeItem).toBe(component.items[0]);
  });

  it('should handle widget input', () => {
    const mockWidget: IWidget = {
      id: 'test-widget',
      x: 0,
      y: 0,
      cols: 2,
      rows: 2,
      position: { x: 0, y: 0, cols: 2, rows: 2 },
      config: {
        component: 'echart',
        header: { title: 'Test Widget' },
        options: {}
      }
    };

    component.widget = mockWidget;
    expect(component.title).toBe('Test Widget');
  });

  it('should handle onActiveTabItemChange', () => {
    const newItem = { label: 'New Tab', value: 1 };
    component.onActiveTabItemChange(newItem);
    expect(component.activeItem).toBe(newItem);
  });

  it('should emit onUpdate when onWidgetSave is called', () => {
    const mockWidget: IWidget = {
      id: 'test-widget',
      x: 0,
      y: 0,
      cols: 2,
      rows: 2,
      position: { x: 0, y: 0, cols: 2, rows: 2 },
      config: {
        component: 'echart',
        header: { title: 'Test Widget' },
        options: {}
      }
    };

    component.widget = mockWidget;
    const spy = spyOn(component.onUpdate, 'emit');
    
    component.onWidgetSave();
    
    expect(spy).toHaveBeenCalled();
  });
});
