import type { ChartRenderMode } from '../chart-spec';
import { resolveRenderMode } from '../chart-spec';
import type { D3ChartHandle, D3ChartSpec } from '../chart-spec';
import { createD3ChartHandle } from './d3-chart-renderer';
import type { InteractionHandler } from './interaction';

export class ChartRenderEngine {
  static create(
    container: HTMLElement,
    spec: D3ChartSpec,
    renderModeOverride?: ChartRenderMode,
    onClick?: InteractionHandler,
    onDblClick?: InteractionHandler
  ): D3ChartHandle {
    const mode = resolveRenderMode(spec.chartType, renderModeOverride);
    return createD3ChartHandle(container, spec, mode, onClick, onDblClick);
  }
}
