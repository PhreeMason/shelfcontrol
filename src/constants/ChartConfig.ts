/**
 * Chart Configuration Constants
 *
 * Centralized configuration for all chart components to ensure consistency
 * and maintainability across the application.
 */

import { Colors } from './Colors';

/**
 * Chart display and layout configuration
 */
export const CHART_CONFIG = {
  /**
   * Show date labels at this interval (e.g., 2 = every 3rd label)
   * Prevents overcrowding on x-axis
   */
  LABEL_INTERVAL: 2,

  /**
   * Multiplier for y-axis maximum value calculation
   * Adds buffer space above highest data point (1.2 = 20% padding)
   */
  Y_AXIS_BUFFER_MULTIPLIER: 1.2,

  /**
   * Initial spacing before first data point (in pixels)
   */
  INITIAL_SPACING: 15,

  /**
   * Default chart width (in pixels)
   * Used when adjustToWidth is enabled
   */
  DEFAULT_WIDTH: 320,

  /**
   * Default chart height (in pixels)
   */
  DEFAULT_HEIGHT: 180,

  /**
   * Minimum value for y-axis max
   * Ensures chart doesn't become too compressed with small values
   */
  MIN_Y_AXIS_MAX: 10,

  /**
   * Number of days to show in daily reading chart
   */
  DEFAULT_DAYS_TO_SHOW: 7,

  /**
   * Rounding factor for y-axis maximum value
   * Y-axis max is rounded to nearest multiple of this value
   */
  Y_AXIS_ROUNDING_FACTOR: 10,
} as const;

/**
 * Chart color constants (references theme colors for consistency)
 */
export const CHART_COLORS = {
  /**
   * Primary chart line color
   * Used for actual progress line
   */
  PRIMARY: Colors.light.primary,

  /**
   * Success/ahead status color
   * Used when user is ahead of schedule
   */
  SUCCESS: Colors.light.successGreen,

  /**
   * Warning/behind status color
   * Used when user is behind schedule
   */
  WARNING: Colors.light.warningOrange,
} as const;

/**
 * Chart line and data point styling
 */
export const CHART_STYLING = {
  /**
   * Thickness of actual data line (in pixels)
   */
  ACTUAL_LINE_THICKNESS: 2,

  /**
   * Thickness of target data line (in pixels)
   */
  TARGET_LINE_THICKNESS: 2,

  /**
   * Radius of actual data points (in pixels)
   */
  ACTUAL_DATA_POINT_RADIUS: 4,

  /**
   * Radius of target data points (in pixels)
   */
  TARGET_DATA_POINT_RADIUS: 3,

  /**
   * Start opacity for actual data area fill
   */
  ACTUAL_START_OPACITY: 0.3,

  /**
   * End opacity for actual data area fill (creates gradient effect)
   */
  ACTUAL_END_OPACITY: 0.05,

  /**
   * Start opacity for target data area fill
   */
  TARGET_START_OPACITY: 0.2,

  /**
   * End opacity for target data area fill (creates gradient effect)
   */
  TARGET_END_OPACITY: 0.05,

  /**
   * Thickness of x and y axes (in pixels)
   */
  AXIS_THICKNESS: 1,

  /**
   * Number of horizontal grid sections
   */
  NUMBER_OF_SECTIONS: 4,

  /**
   * Width of y-axis label area (in pixels)
   */
  Y_AXIS_LABEL_WIDTH: 40,

  /**
   * Font size for x-axis labels
   */
  X_AXIS_LABEL_FONT_SIZE: 11,

  /**
   * Width for x-axis label text
   */
  X_AXIS_LABEL_WIDTH: 30,

  /**
   * Font size for y-axis labels
   */
  Y_AXIS_LABEL_FONT_SIZE: 10,
} as const;

/**
 * Chart animation configuration
 */
export const CHART_ANIMATION = {
  /**
   * Whether to animate chart rendering
   */
  ENABLED: true,

  /**
   * Animation duration in milliseconds
   */
  DURATION: 800,
} as const;

/**
 * Legend dot styling
 */
export const LEGEND_CONFIG = {
  /**
   * Size of legend color dot (in pixels)
   */
  DOT_SIZE: 10,

  /**
   * Border radius for legend dot (makes it circular)
   */
  DOT_BORDER_RADIUS: 5,

  /**
   * Opacity when legend item is disabled
   */
  DISABLED_OPACITY: 0.3,

  /**
   * Text opacity when legend item is disabled
   */
  DISABLED_TEXT_OPACITY: 0.4,

  /**
   * Font size for legend text
   */
  FONT_SIZE: 12,

  /**
   * Spacing between legend items (in pixels)
   */
  ITEM_GAP: 16,

  /**
   * Spacing between dot and text within an item (in pixels)
   */
  DOT_TEXT_GAP: 6,
} as const;
