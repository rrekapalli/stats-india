import { scaleBand, scaleLinear, scaleOrdinal, scaleTime } from 'd3-scale';
import { extent, max } from 'd3-array';

export { scaleBand, scaleLinear, scaleOrdinal, scaleTime, extent, max };

export function defaultColorScale(colors: string[], domain: string[]): (d: string) => string {
  return scaleOrdinal<string>().domain(domain).range(colors).unknown('#888');
}
