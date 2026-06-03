import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IWidget} from '../entities/IWidget';
import {PanelModule} from 'primeng/panel';
import {DrawerModule} from 'primeng/drawer';
import {WidgetConfigComponent} from '../widget-config/widget-config.component';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {MenuModule} from 'primeng/menu';
import {MenuItem} from 'primeng/api';
import {ExcelExportService, ExcelExportOptions} from '../services/excel-export.service';
import {KtdGridModule} from '@katoid/angular-grid-layout';

@Component({
  selector: 'vis-widget-header',
  standalone: true,
  imports: [
    CommonModule,
    DrawerModule,
    PanelModule,
    WidgetConfigComponent,
    ButtonModule,
    MenuModule,
    KtdGridModule,
  ],
  templateUrl: './widget-header.component.html',
  styleUrls: ['./widget-header.component.css'],
})
export class WidgetHeaderComponent {
  @Input() widget!: IWidget;
  @Output() onUpdateWidget: EventEmitter<IWidget> = new EventEmitter();
  @Output() onDeleteWidget: EventEmitter<IWidget> = new EventEmitter();
  @Output() onToggleViewMode: EventEmitter<{widgetId: string, viewMode: 'chart' | 'table'}> = new EventEmitter();
  @Input() onEditMode: boolean = true;
  @Input() dashboardId: any;
  @Input() currentViewMode: 'chart' | 'table' = 'chart';
  @Input() treemapViewMode: 'currentPrices' | 'marketCap' | null = null;
  @Input() treemapLiveTicksAvailable: boolean = false;
  @Output() treemapViewModeChange: EventEmitter<'currentPrices' | 'marketCap'> = new EventEmitter();

  /** When false, hides the cog popup menu (chart/table toggle, export, etc.). */
  @Input() showSettingsMenu = true;

  sidebarVisible: boolean = false;

  constructor(
    private excelExportService: ExcelExportService
  ) {}

  get title() {
    return this.widget?.config?.header?.title;
  }

  get menuItems(): MenuItem[] {
    const items: MenuItem[] = [];

    // Add view toggle option based on current mode
    if (this.currentViewMode === 'chart') {
      items.push({
        label: 'Show Data',
        icon: 'pi pi-table',
        command: () => this.toggleToTableView()
      });
    } else {
      items.push({
        label: 'Show Chart',
        icon: 'pi pi-chart-bar',
        command: () => this.toggleToChartView()
      });
    }

    // Add export options
    items.push(
      // {
      //   label: 'Export to PDF',
      //   icon: 'pi pi-file-pdf',
      //   command: () => this.exportToPdf()
      // },
      {
        label: 'Export to Excel/CSV',
        icon: 'pi pi-file-excel',
        command: () => this.exportToExcel()
      }
    );

    return items;
  }

  onUpdateOptions(data: IWidget) {
    this.onUpdateWidget.emit(data);
    this.sidebarVisible = false;
  }

  onEditModeClicked() {
    this.onEditMode = !this.onEditMode;
  }

  onDeleteWidgetClicked(event: any) {
    this.onDeleteWidget.emit(this.widget);
  }

  toggleToTableView() {
    this.onToggleViewMode.emit({
      widgetId: this.widget.id,
      viewMode: 'table'
    });
  }

  toggleToChartView() {
    this.onToggleViewMode.emit({
      widgetId: this.widget.id,
      viewMode: 'chart'
    });
  }

  onTreemapViewModeChange(mode: 'currentPrices' | 'marketCap') {
    this.treemapViewModeChange.emit(mode);
  }

  // async exportToPdf() {
  //   try {
  //     const options: PdfExportOptions = {
  //       filename: `${this.widget.id}-export.pdf`,
  //       title: this.widget.config?.header?.title || 'Widget Export',
  //       orientation: 'portrait',
  //       format: 'a4',
  //       includeHeader: true,
  //       includeFooter: true
  //     };

  //     // Get the widget element from the DOM
  //     const widgetElement = document.querySelector(`[data-widget-id="${this.widget.id}"]`) as HTMLElement;
  //     if (widgetElement) {
  //       await this.pdfExportService.exportWidgetToPdf(
  //         { nativeElement: widgetElement },
  //         this.widget,
  //         options
  //       );
  //     } else {
  //       console.error('Widget element not found in DOM');
  //     }
  //   } catch (error) {
  //     console.error('Error exporting widget to PDF:', error);
  //   }
  // }

  async exportToExcel() {
    try {
      const options: ExcelExportOptions = {
        filename: `${this.widget.id}-export.xlsx`,
        includeHeaders: true,
        includeTimestamp: true,
        autoColumnWidth: true,
        includeWidgetTitles: true
      };

      await this.excelExportService.exportWidgetToExcel(this.widget, options);
    } catch (error) {
      console.error('Error exporting widget to Excel:', error);
    }
  }
}
