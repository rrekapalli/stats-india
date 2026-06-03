export interface SparklinePoint {
  value: number;
}

export function buildIntradaySparkline(points: SparklinePoint[]): unknown {
  return {
    xAxis: { type: 'category', data: points.map((_, i) => i) },
    yAxis: { type: 'value', scale: true },
    series: [{ type: 'line', data: points.map((p) => p.value), smooth: true, symbol: 'none' }]
  };
}
