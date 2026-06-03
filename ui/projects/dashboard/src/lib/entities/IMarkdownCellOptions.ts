/**
 * Interface representing markdown cell configuration options
 */
export interface IMarkdownCellOptions {
  /** Data accessor key for retrieving content */
  accessor?: string;
  /** Markdown content to render */
  content: string;
}
