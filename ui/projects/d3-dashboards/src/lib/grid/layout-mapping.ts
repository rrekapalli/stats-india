import type { KtdGridLayout, KtdGridLayoutItem } from '@katoid/angular-grid-layout';
import type { IWidget } from '../entities/IWidget';
import type { WidgetGridPosition } from './dashboard-grid.types';

export function widgetToLayoutItem(widget: IWidget): KtdGridLayoutItem {
  const p = widget.position;
  const item: KtdGridLayoutItem = {
    id: widget.id,
    x: p.x,
    y: p.y,
    w: p.cols,
    h: p.rows,
  };
  if (p.minItemCols != null) {
    item.minW = p.minItemCols;
  }
  if (p.maxItemCols != null) {
    item.maxW = p.maxItemCols;
  }
  if (p.minItemRows != null) {
    item.minH = p.minItemRows;
  }
  if (p.maxItemRows != null) {
    item.maxH = p.maxItemRows;
  }
  return item;
}

export function widgetsToKtdLayout(widgets: IWidget[]): KtdGridLayout {
  return widgets.map(widgetToLayoutItem);
}

export function layoutItemToPosition(item: KtdGridLayoutItem, previous: WidgetGridPosition): WidgetGridPosition {
  return {
    ...previous,
    x: item.x,
    y: item.y,
    cols: item.w,
    rows: item.h,
  };
}

export function mergeLayoutIntoWidgets(layout: KtdGridLayout, widgets: IWidget[]): IWidget[] {
  const byId = new Map(layout.map((l) => [l.id, l]));
  return widgets.map((w) => {
    const li = byId.get(w.id);
    if (!li) {
      return w;
    }
    const position = layoutItemToPosition(li, w.position);
    return {
      ...w,
      x: position.x,
      y: position.y,
      cols: position.cols,
      rows: position.rows,
      position,
    };
  });
}

/** Keeps parent-held widget references; updates `position` and top-level x/y/cols/rows. */
export function applyKtdLayoutToWidgetsInPlace(layout: KtdGridLayout, widgets: IWidget[]): void {
  const byId = new Map(layout.map((l) => [l.id, l]));
  for (const w of widgets) {
    const li = byId.get(w.id);
    if (!li) {
      continue;
    }
    const next = layoutItemToPosition(li, w.position);
    Object.assign(w.position, next);
    w.x = next.x;
    w.y = next.y;
    w.cols = next.cols;
    w.rows = next.rows;
  }
}
