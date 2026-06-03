/**
 * Interface representing the state configuration for a widget
 */
export interface IState {
  /** Data accessor key for retrieving values */
  accessor: string;
  /** Column identifier for data mapping */
  column: string;
  /** Flag indicating if this is an OData query */
  isOdataQuery: boolean;
}
