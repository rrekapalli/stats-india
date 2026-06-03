import type { D3ChartSpec } from '../chart-spec';
import { getMoneytreeChartUiColors } from './theme';

const TOOLTIP_ROOT_ID = 'mt-d3-chart-tooltip-root';
let stylesInjected = false;

export interface ChartTooltipRow {
  label: string;
  value: string;
  /** Emphasize value (e.g. primary metric) */
  highlight?: boolean;
}

export interface ChartTooltipSection {
  title?: string;
  rows: ChartTooltipRow[];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildChartTooltipHtml(
  title: string,
  rows: ChartTooltipRow[],
  sections?: ChartTooltipSection[],
  subtitle?: string
): string {
  const sectionBlocks =
    sections
      ?.map((sec) => {
        const secTitle = sec.title
          ? `<div class="mt-d3-chart-tooltip__section-title">${escapeHtml(sec.title)}</div>`
          : '';
        const secRows = sec.rows
          .map(
            (r) =>
              `<div class="mt-d3-chart-tooltip__row${r.highlight ? ' mt-d3-chart-tooltip__row--highlight' : ''}">` +
              `<span class="mt-d3-chart-tooltip__label">${escapeHtml(r.label)}</span>` +
              `<span class="mt-d3-chart-tooltip__value">${escapeHtml(r.value)}</span>` +
              `</div>`
          )
          .join('');
        return `<div class="mt-d3-chart-tooltip__section">${secTitle}<div class="mt-d3-chart-tooltip__body">${secRows}</div></div>`;
      })
      .join('') ?? '';

  const flatRows = rows
    .map(
      (r) =>
        `<div class="mt-d3-chart-tooltip__row${r.highlight ? ' mt-d3-chart-tooltip__row--highlight' : ''}">` +
        `<span class="mt-d3-chart-tooltip__label">${escapeHtml(r.label)}</span>` +
        `<span class="mt-d3-chart-tooltip__value">${escapeHtml(r.value)}</span>` +
        `</div>`
    )
    .join('');

  const subtitleHtml =
    subtitle && subtitle.trim()
      ? `<span class="mt-d3-chart-tooltip__subtitle">${escapeHtml(subtitle.trim())}</span>`
      : '';
  const titleHtml =
    title || subtitleHtml
      ? `<div class="mt-d3-chart-tooltip__header">` +
        (title ? `<span class="mt-d3-chart-tooltip__title">${escapeHtml(title)}</span>` : '') +
        subtitleHtml +
        `</div>`
      : '';

  const body =
    sectionBlocks ||
    (flatRows ? `<div class="mt-d3-chart-tooltip__body">${flatRows}</div>` : '');

  return `<div class="mt-d3-chart-tooltip__card">${titleHtml}${body}</div>`;
}

/** CSS variables on the tooltip root — refreshed on each show for theme / dark-mode switches. */
function applyTooltipThemeVars(el: HTMLElement): void {
  const ui = getMoneytreeChartUiColors();
  const dark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('app-dark');
  el.style.setProperty('--mt-d3-tt-surface', ui.chartSurface);
  el.style.setProperty('--mt-d3-tt-surface-muted', ui.chartSurfaceMuted);
  el.style.setProperty('--mt-d3-tt-text', ui.textPrimary);
  el.style.setProperty('--mt-d3-tt-text-muted', ui.textMuted);
  el.style.setProperty('--mt-d3-tt-accent', ui.primary);
  el.style.setProperty('--mt-d3-tt-accent-dark', ui.primaryDark);
  el.style.setProperty('--mt-d3-tt-border', ui.border);
  el.style.setProperty('--mt-d3-tt-border-strong', ui.borderStrong);
  el.style.setProperty(
    '--mt-d3-tt-shadow',
    dark ? '0 6px 20px rgba(0, 0, 0, 0.45)' : '0 4px 14px rgba(15, 23, 42, 0.12)'
  );
}

function injectTooltipStyles(): void {
  if (stylesInjected || typeof document === 'undefined') {
    return;
  }
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'mt-d3-chart-tooltip-styles';
  style.textContent = `
    #${TOOLTIP_ROOT_ID} {
      position: fixed;
      z-index: 10050;
      display: none;
      pointer-events: none;
      max-width: 280px;
      min-width: 168px;
      font-family: var(--font-family, system-ui, -apple-system, 'Segoe UI', sans-serif);
      font-size: 11px;
      font-weight: 300;
      line-height: 1.35;
      letter-spacing: 0.01em;
      color: var(--mt-d3-tt-text, var(--mt-chart-text, #333));
      -webkit-font-smoothing: antialiased;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__card {
      border-radius: 0;
      border: 1px solid var(--mt-d3-tt-border-strong, var(--mt-chart-border-strong, #bdbdbd));
      background: var(--mt-d3-tt-surface, var(--mt-chart-surface, #fff));
      box-shadow: var(--mt-d3-tt-shadow, 0 4px 14px rgba(15, 23, 42, 0.12));
      overflow: hidden;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__header {
      padding: 0.35rem 0.6rem 0.3rem;
      background: color-mix(
        in srgb,
        var(--mt-d3-tt-accent, var(--mt-chart-accent, #2196f3)) 8%,
        var(--mt-d3-tt-surface, var(--mt-chart-surface, #fff))
      );
      border-bottom: 1px solid var(--mt-d3-tt-border, var(--mt-chart-border, #e0e0e0));
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__title {
      display: block;
      font-weight: 500;
      font-size: 11px;
      letter-spacing: 0.03em;
      color: var(--mt-d3-tt-text, var(--mt-chart-text, #333));
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__subtitle {
      display: block;
      margin-top: 0.1rem;
      font-weight: 300;
      font-size: 10px;
      line-height: 1.3;
      color: var(--mt-d3-tt-text-muted, var(--mt-chart-text-muted, #616161));
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__section {
      padding: 0.35rem 0.6rem 0.28rem;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__section + .mt-d3-chart-tooltip__section {
      border-top: 1px solid var(--mt-d3-tt-border, var(--mt-chart-border, #e0e0e0));
      padding-top: 0.3rem;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__section-title {
      display: block;
      font-size: 9px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--mt-d3-tt-text-muted, var(--mt-chart-text-muted, #616161));
      margin-bottom: 0.2rem;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__body {
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
      padding: 0.35rem 0.6rem 0.42rem;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__section .mt-d3-chart-tooltip__body {
      padding: 0;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__row {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: baseline;
      gap: 0.5rem 0.75rem;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__row--highlight .mt-d3-chart-tooltip__value {
      font-weight: 500;
      color: var(--mt-d3-tt-accent-dark, var(--mt-chart-accent-dark, #1976d2));
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__label {
      color: var(--mt-d3-tt-text-muted, var(--mt-chart-text-muted, #616161));
      font-size: 10px;
      font-weight: 300;
    }
    #${TOOLTIP_ROOT_ID} .mt-d3-chart-tooltip__value {
      font-weight: 400;
      font-size: 11px;
      text-align: right;
      color: var(--mt-d3-tt-text, var(--mt-chart-text, #333));
      font-variant-numeric: tabular-nums;
    }
  `;
  document.head.appendChild(style);
}

function tooltipRoot(): HTMLElement | null {
  if (typeof document === 'undefined') {
    return null;
  }
  injectTooltipStyles();
  let el = document.getElementById(TOOLTIP_ROOT_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TOOLTIP_ROOT_ID;
    document.body.appendChild(el);
  }
  return el;
}

export function resolveTooltipHtml(spec: D3ChartSpec, datum: unknown): string | null {
  if (spec.tooltipHtmlFormatter) {
    const html = spec.tooltipHtmlFormatter(datum);
    return html?.trim() ? html : null;
  }
  if (spec.tooltipFormatter) {
    const plain = spec.tooltipFormatter(datum);
    if (!plain?.trim()) {
      return null;
    }
    return plainLinesToTooltipHtml(plain);
  }
  if (datum && typeof datum === 'object' && !Array.isArray(datum) && 'name' in datum) {
    const d = datum as { name?: string; value?: unknown };
    if (d.name != null) {
      return buildChartTooltipHtml(String(d.name), [{ label: 'Value', value: String(d.value ?? '') }]);
    }
  }
  return null;
}

function plainLinesToTooltipHtml(text: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (!lines.length) {
    return '';
  }
  if (lines.length === 1) {
    return buildChartTooltipHtml(lines[0], []);
  }
  const [title, ...rest] = lines;
  const rows: ChartTooltipRow[] = rest.map((line) => {
    const colon = line.indexOf(':');
    if (colon > 0) {
      return { label: line.slice(0, colon).trim(), value: line.slice(colon + 1).trim() };
    }
    return { label: '', value: line };
  });
  return buildChartTooltipHtml(title, rows);
}

export function showChartTooltip(html: string, event: MouseEvent): void {
  injectTooltipStyles();
  const el = tooltipRoot();
  if (!el) {
    return;
  }
  applyTooltipThemeVars(el);
  el.innerHTML = html;
  el.style.display = 'block';
  positionChartTooltip(event);
}

export function moveChartTooltip(event: MouseEvent): void {
  const el = tooltipRoot();
  if (!el || el.style.display === 'none') {
    return;
  }
  positionChartTooltip(event);
}

export function hideChartTooltip(): void {
  const el = tooltipRoot();
  if (el) {
    el.style.display = 'none';
    el.innerHTML = '';
  }
}

function chartHostBoundary(event: MouseEvent): HTMLElement | null {
  const t = event.target;
  if (!(t instanceof Element)) {
    return null;
  }
  return t.closest('.d3-chart-host') as HTMLElement | null;
}

function positionChartTooltip(event: MouseEvent): void {
  const el = tooltipRoot();
  if (!el) {
    return;
  }
  const pad = 12;
  const rect = el.getBoundingClientRect();
  let left = event.clientX + pad;
  let top = event.clientY + pad;
  const boundary = chartHostBoundary(event);
  const maxRight = boundary ? boundary.getBoundingClientRect().right - 8 : window.innerWidth - 8;
  const maxBottom = boundary ? boundary.getBoundingClientRect().bottom - 8 : window.innerHeight - 8;
  const minLeft = boundary ? boundary.getBoundingClientRect().left + 8 : 8;
  const minTop = boundary ? boundary.getBoundingClientRect().top + 8 : 8;
  if (left + rect.width > maxRight) {
    left = event.clientX - rect.width - pad;
  }
  if (top + rect.height > maxBottom) {
    top = event.clientY - rect.height - pad;
  }
  el.style.left = `${Math.max(minLeft, left)}px`;
  el.style.top = `${Math.max(minTop, top)}px`;
}
