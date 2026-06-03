export interface OiPoint {
  symbol: string;
  oiChange: number;
  priceChange: number;
  volume: number;
}

export function buildOiDynamics(points: OiPoint[]): unknown {
  return {
    xAxis: { type: 'value', name: 'OI Change' },
    yAxis: { type: 'value', name: 'Price Change' },
    series: [{ type: 'scatter', data: points.map((p) => [p.oiChange, p.priceChange, p.volume]) }]
  };
}
