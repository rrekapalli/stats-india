import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

/** Minimal request shape for POST /v1/instruments/filtered (matches backend InstrumentFilterRequest). */
export interface StockListInstrumentFilterRequest {
  exchange?: string[];
  index?: string;
  segment?: string[];
  instrumentType?: string[];
  offset?: number;
  limit?: number;
  sortModel?: { colId: string; sort: 'asc' | 'desc' }[];
  filterModel?: Record<string, unknown>;
  tradingsymbolsIn?: string[];
}

export interface StockListInstrumentRow {
  instrumentToken: string;
  tradingsymbol: string;
  name: string;
  lastPrice: number;
  priceChange?: number;
  percentChange?: number;
  previousClose?: number;
}

export interface StockListInstrumentFilterResponse {
  data: StockListInstrumentRow[];
  total: number;
}

export interface StockListInstrumentSummary {
  total: number;
  advances: number;
  declines: number;
  unchanged: number;
}

/** Live tick (subset of app StockDataDto) for merging into grid rows. */
export interface StockListTick {
  instrumentToken?: number;
  symbol?: string;
  tradingsymbol?: string;
  lastPrice?: number;
  priceChange?: number;
  percentChange?: number;
  previousClose?: number;
  openPrice?: number;
  dayHigh?: number;
  dayLow?: number;
  totalTradedVolume?: number;
}

export interface StockListAgGridEnvironment {
  getFilteredInstrumentsPost(
    request: StockListInstrumentFilterRequest
  ): Observable<StockListInstrumentFilterResponse>;
  getFilteredInstrumentsSummary(
    request: StockListInstrumentFilterRequest
  ): Observable<StockListInstrumentSummary>;
  stockTicks$: Observable<StockListTick>;
  onViewportTokens(tokens: number[]): void;
  /** Optional: distinct symbols from portfolio_trades for Holdings filter. */
  getPortfolioTradeSymbols?: () => Observable<string[]>;
}

export const STOCK_LIST_AG_GRID_ENV = new InjectionToken<StockListAgGridEnvironment>(
  'STOCK_LIST_AG_GRID_ENV'
);
