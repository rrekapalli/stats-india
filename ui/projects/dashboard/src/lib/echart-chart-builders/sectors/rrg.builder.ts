export interface RrgPoint {
  sector: string;
  relativeStrength: number;
  momentum: number;
}

export function buildRrg(points: RrgPoint[]): unknown {
  return {
    xAxis: { type: 'value', name: 'Relative Strength' },
    yAxis: { type: 'value', name: 'Momentum' },
    series: [{ type: 'scatter', data: points.map((p) => [p.relativeStrength, p.momentum, p.sector]) }]
  };
}
