/**
 * Chart Configuration Constants
 *
 * Centralized configuration for all chart components to ensure consistency
 * and maintainability across the application.
 */

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
   * Initial spacing before first data point (in pixels) - multi-day view
   */
  INITIAL_SPACING: 15,

  /**
   * Initial spacing before first data point (in pixels) - intraday view
   * Increased to ensure first time label (e.g., "12:00 AM") is fully visible
   */
  INITIAL_SPACING_INTRADAY: 40,

  /**
   * Default chart width for multi-day view (in pixels)
   * Used when adjustToWidth is enabled
   */
  DEFAULT_WIDTH: 320,

  /**
   * Default chart width for intraday view (in pixels)
   * Wider to accommodate time-based labels
   */
  DEFAULT_WIDTH_INTRADAY: 380,

  /**
   * Default chart height (in pixels)
   */
  DEFAULT_HEIGHT: 200,

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
  X_AXIS_LABEL_FONT_SIZE: 12,

  /**
   * Width for x-axis label text (multi-day format like "1/5")
   */
  X_AXIS_LABEL_WIDTH: 30,

  /**
   * Width for x-axis label text (intraday time format like "3:30 PM")
   * Time labels need more space than date labels
   */
  X_AXIS_LABEL_WIDTH_INTRADAY: 65,

  /**
   * Font size for y-axis labels
   */
  Y_AXIS_LABEL_FONT_SIZE: 11,
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
