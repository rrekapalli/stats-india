import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {IWidget} from '../entities/IWidget';
import {CommonModule} from '@angular/common';
import {MenuItem} from 'primeng/api';
import {ButtonModule} from 'primeng/button';
import {ScrollPanelModule} from 'primeng/scrollpanel';
import {PanelModule} from 'primeng/panel';
import {TabsModule} from 'primeng/tabs';
import {InputTextModule} from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'vis-widget-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    ScrollPanelModule,
    PanelModule,
    TabsModule,
    InputTextModule,
    ToastModule,
  ],
  templateUrl: './widget-config.component.html',
  styleUrls: ['./widget-config.component.scss'],
})
export class WidgetConfigComponent {

  sidebarVisible: boolean = true;
  private _widget!: IWidget | undefined;
  @Output() onUpdate: EventEmitter<IWidget> = new EventEmitter();
  @Input() selectedDashboardId:any;
  @Input() set widget(value: IWidget | undefined) {
    this._widget = value;

    // Patch form value after a delay to ensure form is initialized
    setTimeout(() => {
      this.formWidgetOptions.patchValue({
        position: value?.position,
        config: value?.config,
      });
    }, 1000);
  }

  formModel: any = {};

  items: MenuItem[] = [
    {label: 'Positions', value: 0},
    {label: 'Options', value: 1},
    {label: 'Data Options', value: 2},
  ];

  get title() {
    return this.widget?.config?.header?.title;
  }

  activeItem: MenuItem = this.items[0];
  formWidgetOptions = new FormGroup({});
  form = new FormGroup({});
  formSeriesOptions = new FormGroup({});

  ngOnInit() {
    this.formModel = {};
  }

  onActiveTabItemChange(event: MenuItem) {
    this.activeItem = event;
  }

  onWidgetSave() {
    const newOptions = {...this._widget, ...this.formModel};
    newOptions.config.options.series = this.formModel.series;
    this.onUpdate.emit(newOptions);

    if(this._widget && this._widget.series){
      this._widget.series?.push({});
    }

    // TODO: Implement API call to save widget configuration
    // const payload = {
    //   name: (this._widget?.config?.header?.title ?? this._widget?.id) ?? 'New Widget',
    //   category: this._widget?.config.component ?? 'BarChartVisual',
    //   description: this._widget?.config.component ?? 'BarChartVisual',
    //   placementOptions: JSON.stringify(this._widget?.position),
    //   chartOptions: JSON.stringify(this._widget?.config),
    //   otherOptions: JSON.stringify(this._widget?.series),
    // };
  }

}
