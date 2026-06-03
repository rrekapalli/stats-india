/**
 * Interface representing table widget configuration options
 */
export interface ITableOptions {
  /** Data accessor key for retrieving table data */
  accessor?: string;
  /** Array of column headers */
  columns: string[];
  /** Array of data rows */
  data: any[];
}
