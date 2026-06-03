import { Component, ViewChild } from '@angular/core';
import { DashboardContainerComponent } from '../dashboard-container/dashboard-container.component';

/**
 * Example component demonstrating various PDF export capabilities
 * Shows different export configurations and use cases
 */
@Component({
  selector: 'app-pdf-export-examples',
  imports: [DashboardContainerComponent],
  template: `
    <vis-dashboard-container #dashboardContainer [widgets]="widgets"></vis-dashboard-container>
    <div class="export-buttons">
      <button (click)="exportBasic()">Basic Export</button>
      <button (click)="exportCustom()">Custom Export</button>
      <button (click)="exportPortrait()">Portrait Export</button>
      <button (click)="exportWidget()">Export Widget</button>
      <button (click)="exportMinimal()">Minimal Export</button>
      <button (click)="exportHighQuality()">High Quality</button>
      <button (click)="exportCustomMargin()">Custom Margin</button>
      <button (click)="exportWidgetCustom()">Export Widget Custom</button>
      <button (click)="exportDifferentSizes()">Different Sizes</button>
      <button (click)="exportTimestamped()">Timestamped</button>
    </div>
  `
})
export class PdfExportExamplesComponent {
  @ViewChild('dashboardContainer') dashboardContainer!: DashboardContainerComponent;

  widgets: any[] = [
    // Sample widgets for demonstration
  ];

  /**
   * Basic PDF export with default settings
   */
  async exportBasic(): Promise<void> {
    try {
      await this.dashboardContainer.exportToPdf();
    } catch (error) {
      console.error('Basic export failed:', error);
    }
  }

  /**
   * Custom PDF export with specific configuration
   */
  async exportCustom(): Promise<void> {
    try {
      await this.dashboardContainer.exportToPdf({
        orientation: 'landscape',
        format: 'a3',
        filename: 'custom-dashboard.pdf',
        title: 'Custom Dashboard Export',
        includeHeader: true,
        includeFooter: true
      });
    } catch (error) {
      console.error('Custom export failed:', error);
    }
  }

  /**
   * Portrait orientation export
   */
  async exportPortrait(): Promise<void> {
    try {
      await this.dashboardContainer.exportToPdf({
        orientation: 'portrait',
        format: 'a4',
        filename: 'portrait-dashboard.pdf',
        title: 'Portrait Dashboard'
      });
    } catch (error) {
      console.error('Portrait export failed:', error);
    }
  }

  /**
   * Export specific widget by ID
   */
  async exportWidget(): Promise<void> {
    const widgetId = 'chart-1';
    try {
      await this.dashboardContainer.exportWidgetToPdf(widgetId, {
        filename: 'widget-export.pdf',
        title: 'Widget Export'
      });
    } catch (error) {
      console.error('Widget export failed:', error);
    }
  }

  /**
   * Minimal export without headers or footers
   */
  async exportMinimal(): Promise<void> {
    try {
      await this.dashboardContainer.exportToPdf({
        includeHeader: false,
        includeFooter: false,
        filename: 'minimal-dashboard.pdf'
      });
    } catch (error) {
      console.error('Minimal export failed:', error);
    }
  }

  /**
   * High quality export with enhanced settings
   */
  async exportHighQuality(): Promise<void> {
    try {
      await this.dashboardContainer.exportToPdf({
        orientation: 'landscape',
        format: 'a3',
        scale: 3,
        quality: 1,
        filename: 'high-quality-dashboard.pdf',
        title: 'High Quality Dashboard'
      });
    } catch (error) {
      console.error('High quality export failed:', error);
    }
  }

  /**
   * Export with custom margin settings
   */
  async exportCustomMargin(): Promise<void> {
    try {
      await this.dashboardContainer.exportToPdf({
        margin: 25,
        filename: 'custom-margin-dashboard.pdf',
        title: 'Custom Margin Dashboard'
      });
    } catch (error) {
      console.error('Custom margin export failed:', error);
    }
  }

  /**
   * Export widget with custom settings
   */
  async exportWidgetCustom(): Promise<void> {
    const widgetId = 'chart-1';
    try {
      await this.dashboardContainer.exportWidgetToPdf(widgetId, {
        orientation: 'landscape',
        format: 'a4',
        scale: 2,
        filename: 'custom-widget-export.pdf',
        title: 'Custom Widget Export'
      });
    } catch (error) {
      console.error('Custom widget export failed:', error);
    }
  }

  /**
   * Export to different paper sizes
   */
  async exportDifferentSizes(): Promise<void> {
    const sizes: Array<'a4' | 'a3' | 'letter' | 'legal'> = ['a4', 'a3', 'letter', 'legal'];
    
    for (const size of sizes) {
      try {
        await this.dashboardContainer.exportToPdf({
          format: size,
          filename: `dashboard-${size}.pdf`,
          title: `Dashboard (${size.toUpperCase()})`
        });
      } catch (error) {
        console.error(`${size} export failed:`, error);
      }
    }
  }

  /**
   * Export with timestamped filename
   */
  async exportTimestamped(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    try {
      await this.dashboardContainer.exportToPdf({
        filename: `dashboard-${timestamp}.pdf`,
        title: 'Timestamped Dashboard Export'
      });
    } catch (error) {
      console.error('Timestamped export failed:', error);
    }
  }
} 