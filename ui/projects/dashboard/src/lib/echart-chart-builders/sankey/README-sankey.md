# Sankey Chart Builder

The Sankey Chart Builder provides a fluent API for creating Sankey diagrams using Apache ECharts. Sankey diagrams are perfect for visualizing flow relationships, such as financial flows, energy flows, or any process where resources move between different stages.

## Features

- **Fluent API**: Chain methods for easy configuration
- **Customizable Nodes**: Set node width, gap, alignment, and colors
- **Flexible Layout**: Support for different layout directions
- **Interactive**: Built-in tooltips and emphasis effects
- **Export Support**: Excel/CSV export functionality
- **TypeScript Support**: Full type safety with interfaces

## Basic Usage

```typescript
import { SankeyChartBuilder, SankeyChartData } from '@dashboards/public-api';

// Create sample data
const data: SankeyChartData = {
  nodes: [
    { name: 'Income' },
    { name: 'Expenses' },
    { name: 'Savings' }
  ],
  links: [
    { source: 'Income', target: 'Expenses', value: 70 },
    { source: 'Income', target: 'Savings', value: 30 }
  ]
};

// Create widget
const widget = SankeyChartBuilder.create()
  .setData(data)
  .setHeader('Cash Flow')
  .setPosition({ x: 0, y: 0, cols: 6, rows: 4 })
  .build();
```

## Advanced Usage

```typescript
const widget = SankeyChartBuilder.create()
  .setData(complexData)
  .setTitle('Financial Flow Analysis', 'Money Movement')
  .setNodeWidth(20)
  .setNodeGap(8)
  .setLayout('left')
  .setCurveness(0.5)
  .setTooltip('item', '{b}: {c}')
  .setEmphasisFocus('adjacency')
  .setHeader('Custom Sankey Chart')
  .setPosition({ x: 0, y: 0, cols: 8, rows: 6 })
  .build();
```

## Data Structure

### SankeyChartData Interface

```typescript
interface SankeyChartData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

interface SankeyNode {
  name: string;
  value?: number;
  itemStyle?: {
    color?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

interface SankeyLink {
  source: string;
  target: string;
  value: number;
  itemStyle?: {
    color?: string;
    opacity?: number;
  };
}
```

## Configuration Methods

### Node Configuration

- `setNodeWidth(width: number)`: Set the width of nodes
- `setNodeGap(gap: number)`: Set the gap between nodes
- `setNodeAlign(align: 'justify' | 'left' | 'right')`: Set node alignment
- `setNodeColors(colors: string[])`: Set colors for nodes

### Layout Configuration

- `setLayout(layout: 'none' | 'left' | 'right')`: Set layout direction
- `setLayoutIterations(iterations: number)`: Set layout optimization iterations
- `setCurveness(curveness: number)`: Set line curveness (0-1)

### Visual Configuration

- `setLineColor(color: string)`: Set line color
- `setEmphasisFocus(focus: 'adjacency' | 'source' | 'target')`: Set emphasis focus
- `setColors(colors: string[])`: Set chart colors
- `setBorderRadius(radius: number)`: Set border radius
- `setBorder(color: string, width?: number)`: Set border style

## Static Methods

### Data Updates

```typescript
// Update existing widget data
SankeyChartBuilder.updateData(widget, newData);

// Check if widget is a sankey chart
const isSankey = SankeyChartBuilder.isSankeyChart(widget);
```

### Export Functions

```typescript
// Export data for Excel/CSV
const exportData = SankeyChartBuilder.exportData(widget);

// Get export headers
const headers = SankeyChartBuilder.getExportHeaders(widget);

// Get sheet name
const sheetName = SankeyChartBuilder.getExportSheetName(widget);
```

## Integration with Dashboard

The Sankey Chart Builder integrates seamlessly with the dashboard system:

```typescript
import { StandardDashboardBuilder } from '@dashboards/public-api';

const dashboardConfig = StandardDashboardBuilder.createStandard()
  .setDashboardId('my-dashboard')
  .setWidgets([
    createSankeyChartWidget(),
    createInvestmentFlowSankeyWidget(),
    createBudgetAllocationSankeyWidget()
  ])
  .build();
```

## Widget Creation Functions

The library provides several pre-configured widget creation functions:

- `createSankeyChartWidget()`: Basic financial flow visualization
- `createInvestmentFlowSankeyWidget()`: Investment portfolio flow
- `createBudgetAllocationSankeyWidget()`: Budget allocation flow

## Examples

### Financial Flow Example

```typescript
const financialFlowData: SankeyChartData = {
  nodes: [
    { name: 'Income' },
    { name: 'Salary' },
    { name: 'Investment Returns' },
    { name: 'Expenses' },
    { name: 'Housing' },
    { name: 'Transportation' },
    { name: 'Food' },
    { name: 'Entertainment' },
    { name: 'Savings' },
    { name: 'Emergency Fund' },
    { name: 'Investment Portfolio' },
    { name: 'Retirement Fund' }
  ],
  links: [
    { source: 'Income', target: 'Salary', value: 80 },
    { source: 'Income', target: 'Investment Returns', value: 20 },
    { source: 'Salary', target: 'Expenses', value: 60 },
    { source: 'Salary', target: 'Savings', value: 20 },
    { source: 'Investment Returns', target: 'Savings', value: 15 },
    { source: 'Investment Returns', target: 'Expenses', value: 5 },
    { source: 'Expenses', target: 'Housing', value: 30 },
    { source: 'Expenses', target: 'Transportation', value: 15 },
    { source: 'Expenses', target: 'Food', value: 12 },
    { source: 'Expenses', target: 'Entertainment', value: 8 },
    { source: 'Savings', target: 'Emergency Fund', value: 15 },
    { source: 'Savings', target: 'Investment Portfolio', value: 12 },
    { source: 'Savings', target: 'Retirement Fund', value: 8 }
  ]
};
```

### Investment Flow Example

```typescript
const investmentFlowData: SankeyChartData = {
  nodes: [
    { name: 'Total Portfolio' },
    { name: 'Equity' },
    { name: 'Fixed Income' },
    { name: 'Alternative' },
    { name: 'US Stocks' },
    { name: 'International Stocks' },
    { name: 'Government Bonds' },
    { name: 'Corporate Bonds' },
    { name: 'Real Estate' },
    { name: 'Commodities' },
    { name: 'Cash' }
  ],
  links: [
    { source: 'Total Portfolio', target: 'Equity', value: 60 },
    { source: 'Total Portfolio', target: 'Fixed Income', value: 25 },
    { source: 'Total Portfolio', target: 'Alternative', value: 10 },
    { source: 'Total Portfolio', target: 'Cash', value: 5 },
    { source: 'Equity', target: 'US Stocks', value: 40 },
    { source: 'Equity', target: 'International Stocks', value: 20 },
    { source: 'Fixed Income', target: 'Government Bonds', value: 15 },
    { source: 'Fixed Income', target: 'Corporate Bonds', value: 10 },
    { source: 'Alternative', target: 'Real Estate', value: 7 },
    { source: 'Alternative', target: 'Commodities', value: 3 }
  ]
};
```

## Best Practices

1. **Node Naming**: Use clear, descriptive names for nodes
2. **Value Scaling**: Ensure link values are proportional and meaningful
3. **Color Coding**: Use consistent colors to represent categories
4. **Layout**: Choose appropriate layout direction based on data flow
5. **Performance**: Limit the number of nodes and links for optimal performance
6. **Tooltips**: Provide meaningful tooltip information
7. **Accessibility**: Ensure sufficient color contrast and readable text

## Browser Compatibility

The Sankey Chart Builder requires:
- Modern browsers with ES6+ support
- Apache ECharts 5.x
- Angular 15+

## Dependencies

- Apache ECharts
- Angular Gridster2
- UUID (for widget IDs) 