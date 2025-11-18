/**
 * Date Format Constants
 *
 * Centralized date format strings used across the application.
 * Uses Day.js format syntax.
 *
 * @see https://day.js.org/docs/en/display/format
 */

/**
 * Chart-specific date formats
 */
export const CHART_DATE_FORMATS = {
  /**
   * Short format for chart x-axis labels
   * Example: "1/15" for January 15th
   */
  LABEL: 'M/DD',
} as const;

/**
 * Activity timestamp formats
 */
export const ACTIVITY_DATE_FORMATS = {
  /**
   * Time-only format for activities from today
   * Example: "2:30 PM"
   */
  TIME_ONLY: 'h:mm A',

  /**
   * Full format with date and time
   * Example: "Jan 15, 2:30 PM"
   */
  FULL: 'MMM D, h:mm A',
} as const;

/**
 * Standard date formats
 */
export const STANDARD_DATE_FORMATS = {
  /**
   * ISO date format (YYYY-MM-DD)
   * Used for API calls and date comparisons
   */
  ISO: 'YYYY-MM-DD',

  /**
   * Month and day
   * Example: "January 15"
   */
  MONTH_DAY: 'MMMM D',

  /**
   * Short month and day
   * Example: "Jan 15"
   */
  SHORT_MONTH_DAY: 'MMM D',

  /**
   * Full date
   * Example: "January 15, 2024"
   */
  FULL_DATE: 'MMMM D, YYYY',

  /**
   * Short date
   * Example: "Jan 15, 2024"
   */
  SHORT_DATE: 'MMM D, YYYY',
} as const;

/**
 * All date formats combined
 * Use this for type-safe access to any format
 */
export const DATE_FORMATS = {
  ...CHART_DATE_FORMATS,
  ...ACTIVITY_DATE_FORMATS,
  ...STANDARD_DATE_FORMATS,
} as const;
