export interface MoneytreeChartUiColors {
  chartSurface: string;
  chartSurfaceMuted: string;
  textPrimary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  /** Text on filled primary chips (time-range selected) */
  onPrimary: string;
  border: string;
  borderStrong: string;
}

const LIGHT: MoneytreeChartUiColors = {
  chartSurface: '#ffffff',
  chartSurfaceMuted: '#f5f5f5',
  textPrimary: '#333333',
  textMuted: '#616161',
  primary: '#2196f3',
  primaryDark: '#1976d2',
  onPrimary: '#ffffff',
  border: '#e0e0e0',
  borderStrong: '#bdbdbd',
};

const DARK: MoneytreeChartUiColors = {
  chartSurface: '#1e1e1e',
  chartSurfaceMuted: '#2d2d2d',
  textPrimary: '#e8e8e8',
  textMuted: '#b0b0b0',
  primary: '#42a5f5',
  primaryDark: '#1e88e5',
  onPrimary: '#0c0c0e',
  border: '#424242',
  borderStrong: '#616161',
};

function readVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback;
  }
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Relative luminance 0–1; supports #rgb and rgb()/rgba() from getComputedStyle */
function surfaceLuminance(css: string): number | null {
  const s = css.trim();
  const rgb = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (rgb) {
    const r = +rgb[1] / 255;
    const g = +rgb[2] / 255;
    const b = +rgb[3] / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  const hx = s.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
  if (hx) {
    const r = parseInt(hx[1], 16) / 255;
    const g = parseInt(hx[2], 16) / 255;
    const b = parseInt(hx[3], 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  return null;
}

/** Dark mode but computed chart surface is still very light (init order / stale tokens) */
function coerceDarkSurfaces(
  resolvedSurface: string,
  resolvedMuted: string,
  d: MoneytreeChartUiColors
): Pick<MoneytreeChartUiColors, 'chartSurface' | 'chartSurfaceMuted'> {
  const ls = surfaceLuminance(resolvedSurface);
  const lm = surfaceLuminance(resolvedMuted);
  if (ls !== null && ls > 0.72) {
    return { chartSurface: d.chartSurface, chartSurfaceMuted: d.chartSurfaceMuted };
  }
  if (lm !== null && lm > 0.72) {
    return { chartSurface: resolvedSurface, chartSurfaceMuted: d.chartSurfaceMuted };
  }
  return { chartSurface: resolvedSurface, chartSurfaceMuted: resolvedMuted };
}

/** Colors for ECharts graphic elements; prefers --mt-chart-* from moneytree-design-tokens.scss */
export function getMoneytreeChartUiColors(): MoneytreeChartUiColors {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('app-dark');
  const fb = dark ? DARK : LIGHT;
  const chartSurface = readVar('--mt-chart-surface', fb.chartSurface);
  const chartSurfaceMuted = readVar('--mt-chart-surface-muted', fb.chartSurfaceMuted);
  const surfaces = dark ? coerceDarkSurfaces(chartSurface, chartSurfaceMuted, DARK) : { chartSurface, chartSurfaceMuted };
  return {
    chartSurface: surfaces.chartSurface,
    chartSurfaceMuted: surfaces.chartSurfaceMuted,
    textPrimary: readVar('--mt-chart-text', fb.textPrimary),
    textMuted: readVar('--mt-chart-text-muted', fb.textMuted),
    primary: readVar('--mt-chart-accent', fb.primary),
    primaryDark: readVar('--mt-chart-accent-dark', fb.primaryDark),
    onPrimary: readVar('--p-primary-contrast-color', fb.onPrimary),
    border: readVar('--mt-chart-border', fb.border),
    borderStrong: readVar('--mt-chart-border-strong', fb.borderStrong),
  };
}

/** Slider dataZoom — explicit colors so theme merge is not lost when options replace dataZoom[]. */
/** Treemap tiles: theme tokens + readable saturation (Overview / dashboards). */
export function getTreemapSemanticTileColors(): {
  positive: string;
  negative: string;
  neutral: string;
} {
  const dark = typeof document !== 'undefined' && document.documentElement.classList.contains('app-dark');
  const g = readVar('--p-green-500', dark ? '#34d399' : '#22c55e');
  const r = readVar('--p-red-500', dark ? '#f87171' : '#ef4444');
  const n = readVar('--p-slate-500', dark ? '#94a3b8' : '#64748b');
  const toRgba = (hex: string, alpha: number): string => {
    const h = hex.replace('#', '').trim();
    if (h.length === 6) {
      const rv = parseInt(h.slice(0, 2), 16);
      const gv = parseInt(h.slice(2, 4), 16);
      const bv = parseInt(h.slice(4, 6), 16);
      if ([rv, gv, bv].every((x) => !Number.isNaN(x))) {
        return `rgba(${rv},${gv},${bv},${alpha})`;
      }
    }
    return dark ? `rgba(52,211,153,${alpha})` : `rgba(34,197,94,${alpha})`;
  };
  const alpha = dark ? 0.58 : 0.52;
  const alphaN = dark ? 0.42 : 0.38;
  return {
    positive: toRgba(g, alpha),
    negative: toRgba(r, alpha),
    neutral: toRgba(n, alphaN),
  };
}

export function getMoneytreeDataZoomSliderStyle(): Record<string, unknown> {
  const ui = getMoneytreeChartUiColors();
  return {
    backgroundColor: ui.chartSurfaceMuted,
    borderColor: ui.border,
    fillerColor: 'rgba(99, 102, 241, 0.28)',
    dataBackground: {
      lineStyle: { color: ui.border, width: 0.5 },
      areaStyle: { color: ui.chartSurfaceMuted },
    },
    selectedDataBackground: {
      lineStyle: { color: ui.primary },
      areaStyle: { color: ui.chartSurface },
    },
    handleStyle: {
      color: ui.primary,
      borderColor: ui.borderStrong,
    },
    textStyle: { color: ui.textMuted },
  };
}
