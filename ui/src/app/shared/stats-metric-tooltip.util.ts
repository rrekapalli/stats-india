export interface MetricTooltipOptions {
  title: string;
  value: number | string;
  total?: number;
  unit?: string;
  subtitle?: string;
  datasetTitle?: string;
  category?: string;
  rows?: { label: string; value: string }[];
}

export function formatMetricNumber(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function formatMetricPercent(value: number, total: number, digits = 1): string | null {
  if (!total || total <= 0 || !Number.isFinite(value)) {
    return null;
  }
  const pct = (value / total) * 100;
  if (pct < 0.05 && value > 0) {
    return '<0.1%';
  }
  return `${pct.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function buildMetricTooltipHtml(options: MetricTooltipOptions): string {
  const {
    title,
    value,
    total,
    unit = '',
    subtitle,
    datasetTitle,
    category,
    rows = []
  } = options;

  const numericValue = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(/,/g, ''));
  const valueLabel = typeof value === 'number'
    ? `${formatMetricNumber(value)}${unit ? ` ${unit}` : ''}`
    : String(value);

  const parts: string[] = [
    '<div class="stats-tooltip">',
    `<div class="stats-tooltip-title">${escapeHtml(title)}</div>`,
    `<div class="stats-tooltip-value">${escapeHtml(valueLabel)}</div>`
  ];

  if (Number.isFinite(numericValue) && total != null && total > 0) {
    const pct = formatMetricPercent(numericValue, total);
    if (pct) {
      parts.push(
        `<div class="stats-tooltip-percent">${escapeHtml(pct)} of ${escapeHtml(formatMetricNumber(total))}${unit ? ` ${unit}` : ''}</div>`
      );
    }
  }

  if (subtitle) {
    parts.push(`<div class="stats-tooltip-subtitle">${escapeHtml(subtitle)}</div>`);
  }

  if (rows.length) {
    parts.push('<dl class="stats-tooltip-rows">');
    for (const row of rows) {
      parts.push(
        `<div class="stats-tooltip-row"><dt>${escapeHtml(row.label)}</dt><dd>${escapeHtml(row.value)}</dd></div>`
      );
    }
    parts.push('</dl>');
  }

  const footerBits = [category, datasetTitle].filter(Boolean);
  if (footerBits.length) {
    parts.push(`<div class="stats-tooltip-footer">${escapeHtml(footerBits.join(' · '))}</div>`);
  }

  parts.push('</div>');
  return parts.join('');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function sumValues(values: number[]): number {
  return values.reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);
}
