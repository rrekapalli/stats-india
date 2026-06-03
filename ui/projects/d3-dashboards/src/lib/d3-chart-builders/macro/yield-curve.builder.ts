export interface YieldPoint {
  tenor: string;
  yield: number;
}

export function buildYieldCurve(points: YieldPoint[]): unknown {
  return {
    xAxis: { type: 'category', data: points.map((p) => p.tenor) },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: points.map((p) => p.yield), smooth: true }]
  };
}
