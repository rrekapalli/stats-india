import type { ChartInteractionEvent, ChartTypeId } from '../chart-spec';

export type InteractionHandler = (event: ChartInteractionEvent) => void;

export function emitInteraction(
  handlers: { click?: InteractionHandler; dblclick?: InteractionHandler },
  chartType: ChartTypeId,
  datum: unknown,
  source: 'click' | 'dblclick',
  seriesName?: string,
  dataIndex?: number
): void {
  const event: ChartInteractionEvent = { chartType, datum, source, seriesName, dataIndex };
  if (source === 'dblclick') {
    handlers.dblclick?.(event);
  } else {
    handlers.click?.(event);
  }
}
