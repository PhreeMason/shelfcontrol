/**
 * Constants for statistics and weekly stats card components
 */

export const STATS_CONSTANTS = {
  /**
   * Height of the progress bar in weekly stats cards
   */
  PROGRESS_BAR_HEIGHT: 12,

  /**
   * Number of days in a week
   */
  WEEK_DAYS: 7,

  /**
   * Percentage threshold for "ahead" status (>= 100%)
   */
  AHEAD_THRESHOLD: 100,

  /**
   * Percentage threshold for "on track" status (>= 95%)
   */
  ON_TRACK_THRESHOLD: 95,
} as const;

export type StatsConstants = typeof STATS_CONSTANTS;
