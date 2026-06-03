export interface AdPoint {
  ts: string;
  ratio: number;
}

export function buildAdRatioTimeseries(points: AdPoint[]): unknown {
  return {
    xAxis: { type: 'category', data: points.map((p) => p.ts) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: points.map((p) => p.ratio), smooth: true }]
  };
}
