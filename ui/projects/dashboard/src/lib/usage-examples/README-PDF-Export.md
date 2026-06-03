# PDF Export Service

The PDF Export Service provides functionality to export dashboards and individual widgets to PDF format. This service uses `jsPDF` and `html2canvas` libraries to convert dashboard content into high-quality PDF documents.

## Features

- Export entire dashboards with all widgets
- Export individual widgets
- Support for portrait and landscape orientations
- Multiple paper sizes (A4, A3, Letter, Legal)
- Customizable margins, headers, and footers
- High-quality image rendering
- Automatic page breaks for large dashboards
- Widget title inclusion
- Timestamp generation

## Installation

The service requires the following dependencies:

```bash
npm install jspdf html2canvas --save
```

## Usage

### Basic Dashboard Export

```typescript
import { DashboardContainerComponent } from '@your-org/dashboards';

// Get reference to your dashboard component
const dashboard = this.dashboardComponent;

// Basic export with default settings
await dashboard.exportToPdf();
```

### Custom Export Options

```typescript
import { PdfExportOptions } from '@your-org/dashboards';

const options: PdfExportOptions = {
  orientation: 'landscape',
  format: 'a3',
  margin: 15,
  filename: 'my-dashboard-report.pdf',
  title: 'Financial Dashboard Report',
  includeHeader: true,
  includeFooter: true,
  scale: 2
};

await dashboard.exportToPdf(options);
```

### Export Individual Widget

```typescript
// Export a specific widget by ID
await dashboard.exportWidgetToPdf('widget-123', {
  orientation: 'portrait',
  format: 'a4',
  filename: 'widget-123.pdf',
  title: 'Widget Export'
});
```

## Configuration Options

### PdfExportOptions Interface

```typescript
interface PdfExportOptions {
  orientation?: 'portrait' | 'landscape';  // Default: 'portrait'
  format?: 'a4' | 'a3' | 'letter' | 'legal';  // Default: 'a4'
  margin?: number;  // Default: 10 (mm)
  filename?: string;  // Default: 'dashboard-export.pdf'
  title?: string;  // Default: 'Dashboard Export'
  includeHeader?: boolean;  // Default: true
  includeFooter?: boolean;  // Default: true
  quality?: number;  // Default: 1 (not used in current implementation)
  scale?: number;  // Default: 2 (html2canvas scale factor)
}
```

## Examples

### 1. Portrait Export

```typescript
await dashboard.exportToPdf({
  orientation: 'portrait',
  format: 'a4',
  filename: 'dashboard-portrait.pdf',
  title: 'Dashboard Report (Portrait)'
});
```

### 2. Landscape Export

```typescript
await dashboard.exportToPdf({
  orientation: 'landscape',
  format: 'a3',
  filename: 'dashboard-landscape.pdf',
  title: 'Dashboard Report (Landscape)'
});
```

### 3. High Quality Export

```typescript
await dashboard.exportToPdf({
  orientation: 'landscape',
  format: 'a3',
  scale: 3, // Higher scale for better quality
  filename: 'dashboard-high-quality.pdf',
  title: 'High Quality Dashboard Export'
});
```

### 4. Minimal Export (No Header/Footer)

```typescript
await dashboard.exportToPdf({
  orientation: 'landscape',
  format: 'a4',
  includeHeader: false,
  includeFooter: false,
  filename: 'dashboard-minimal.pdf'
});
```

### 5. Export with Timestamp

```typescript
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
await dashboard.exportToPdf({
  orientation: 'landscape',
  format: 'a4',
  filename: `dashboard-export-${timestamp}.pdf`,
  title: 'Dashboard Export',
  includeHeader: true,
  includeFooter: true
});
```

## Integration with Dashboard Configuration

The PDF export functionality is integrated into the dashboard configuration system. You can access the export method through the dashboard configuration:

```typescript
// Using the builder pattern
const dashboardConfig = this.dashboardBuilder
  .setWidgets(this.widgets)
  .setFilterValues(this.filterValues)
  .build();

// Export using the configuration
await dashboardConfig.exportToPdf({
  orientation: 'landscape',
  filename: 'dashboard-config-export.pdf'
});
```

## Widget Requirements

For widgets to be properly exported, they must:

1. Have a unique `id` property
2. Be rendered in the DOM with a `data-widget-id` attribute
3. Have proper dimensions defined (`w` and `h` properties)

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  await dashboard.exportToPdf(options);
  console.log('Export successful');
} catch (error) {
  console.error('Export failed:', error);
  // Handle error appropriately
}
```

## Performance Considerations

- Large dashboards with many widgets may take longer to export
- Higher scale values improve quality but increase processing time
- Consider using lower scale values for faster exports
- The service processes widgets sequentially to avoid memory issues

## Browser Compatibility

The PDF export functionality works in modern browsers that support:
- Canvas API
- ES6+ features
- File download API

## Troubleshooting

### Common Issues

1. **Widgets not found**: Ensure widgets have proper `id` attributes and are rendered in the DOM
2. **Poor image quality**: Increase the `scale` option for better quality
3. **Large file sizes**: Reduce the `scale` option or use smaller paper formats
4. **Export fails**: Check browser console for specific error messages

### Debug Mode

Enable debug logging by checking the browser console for detailed error messages during export.

## API Reference

### PdfExportService

#### Methods

- `exportDashboardToPdf(dashboardElement, widgets, options)`: Export entire dashboard
- `exportWidgetToPdf(widgetElement, widget, options)`: Export single widget

### DashboardContainerComponent

#### Methods

- `exportToPdf(options)`: Export dashboard to PDF
- `exportWidgetToPdf(widgetId, options)`: Export specific widget to PDF

## License

This service is part of the MoneyPlant Dashboard library and follows the same licensing terms. 