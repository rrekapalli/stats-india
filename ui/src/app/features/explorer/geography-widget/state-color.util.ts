import { scaleOrdinal } from 'd3';
import { schemeSet3, schemeTableau10 } from 'd3-scale-chromatic';
import { INDIA_STATE_NAMES } from '../india-state-names';

/** Extended categorical palette — one stable color per state / UT name. */
const STATE_PALETTE = [...schemeTableau10, ...schemeSet3, '#6366f1', '#14b8a6', '#f97316', '#84cc16'];

const colorByState = scaleOrdinal<string>()
  .domain([...INDIA_STATE_NAMES])
  .range(STATE_PALETTE);

export function statePaletteColor(stateName: string): string {
  return colorByState(stateName) ?? '#64748b';
}
