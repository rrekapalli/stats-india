import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IWidget } from '../../entities/IWidget';

export interface PricePerformancePeriod {
  label: string;
  title: string;
  pastPrice: number | null;
  change: number | null;
  changePercent: number | null;
}

export interface PricePerformanceData {
  tradingsymbol: string;
  currentPrice: number;
  currentDate: string | null;
  firstDate: string | null;
  periods: PricePerformancePeriod[];
}

@Component({
  selector: 'app-price-performance-strip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-performance-strip.component.html',
  styleUrls: ['./price-performance-strip.component.scss']
})
export class PricePerformanceStripComponent {
  @Input() widget?: IWidget;

  get performanceData(): PricePerformanceData | null {
    return this.widget?.data?.pricePerformanceData ?? null;
  }

  get isLoading(): boolean {
    return this.widget?.data?.isLoading ?? false;
  }

  getChangeClass(period: PricePerformancePeriod): string {
    if (period.changePercent == null) return 'neutral';
    if (period.changePercent > 0) return 'positive';
    if (period.changePercent < 0) return 'negative';
    return 'neutral';
  }

  formatPercent(value: number | null): string {
    if (value == null) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  }
}
