/**
 * Interface representing filter values with dynamic properties
 */
export interface IFilterValues {
  /** Data accessor key for the filter value */
  accessor: string;
  
  /** Filter column/property to use when applying filters (falls back to accessor if not specified) */
  filterColumn?: string;
  
  /** Additional dynamic properties for filter values */
  [key: string]: string | undefined;
}
