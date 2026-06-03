/**
 * Interface representing tile widget configuration options
 */
export interface ITileOptions {
  /** Data accessor key for retrieving the main value */
  accessor?: string;
  /** Primary value to display */
  value: string;
  /** Change value to display (e.g., "+5.2%") */
  change: string;
  /** Type of change for styling purposes */
  changeType: 'positive' | 'negative' | 'neutral';
  /** Icon identifier to display */
  icon: string;
  /** Color theme for the tile text */
  color: string;
  /** Background color for the tile */
  backgroundColor?: string;
  /** Description text for the tile */
  description: string;
  /** Subtitle text for the tile */
  subtitle?: string;
  /** Background opacity for the tile (0-1) */
  backgroundOpacity?: number;
  /** Whether the tile should update when data/filters change */
  updateOnDataChange?: boolean;
}
