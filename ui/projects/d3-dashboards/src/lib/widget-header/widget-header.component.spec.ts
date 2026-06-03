import {ComponentFixture, TestBed} from "@angular/core/testing";
import {HttpClientTestingModule} from "@angular/common/http/testing";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {WidgetHeaderComponent} from "./widget-header.component";
import {IWidget} from "../entities/IWidget";

describe('Dashboard: WidgetConfigComponent', () => {
  let fixture: ComponentFixture<WidgetHeaderComponent>;
  let widgetHeaderComponent: WidgetHeaderComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        BrowserAnimationsModule,
      ],
      providers: [
        {provide: 'environment', useValue: {}},
      ]
    });
    fixture = TestBed.createComponent(WidgetHeaderComponent);
    widgetHeaderComponent = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('Should create an instance of component', () => {
    expect(widgetHeaderComponent).toBeTruthy();
  });

  it('should emit onUpdateWidget when onUpdateOptions is called', () => {
    const spy = spyOn(widgetHeaderComponent.onUpdateWidget, 'emit');
    const mockWidget = { id: 'test' } as IWidget;
    
    widgetHeaderComponent.onUpdateOptions(mockWidget);
    
    expect(spy).toHaveBeenCalledWith(mockWidget);
    expect(widgetHeaderComponent.sidebarVisible).toBe(false);
  });

  it('Should update edit mode from true to false', () => {
    widgetHeaderComponent.onEditMode = true;
    widgetHeaderComponent.onEditModeClicked();
    expect(widgetHeaderComponent.onEditMode).toBe(false);
  });

  it('Should update edit mode from false to true', () => {
    widgetHeaderComponent.onEditMode = false;
    widgetHeaderComponent.onEditModeClicked();
    expect(widgetHeaderComponent.onEditMode).toBe(true);
  });

  it('should emit onDeleteWidget when onDeleteWidgetClicked is called', () => {
    const spy = spyOn(widgetHeaderComponent.onDeleteWidget, 'emit');
    const mockEvent = { preventDefault: () => {} };
    
    widgetHeaderComponent.onDeleteWidgetClicked(mockEvent);
    
    expect(spy).toHaveBeenCalledWith(widgetHeaderComponent.widget);
  });
});
