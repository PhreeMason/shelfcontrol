/**
 * Types for statistics and hero section calculations
 */

export interface HeroStats {
  /** Total units (pages or minutes) ahead (positive) or behind (negative) schedule */
  unitsAheadBehind: number;
  /** Sum of minimum daily pace required across all books */
  minimumDailyPace: number;
  /** Count of books that are on track or ahead */
  onTrackCount: number;
  /** Count of books that need attention (behind schedule) */
  needAttentionCount: number;
  /** Overall status based on aggregate progress */
  overallStatus: 'ahead' | 'onTrack' | 'behind';
}

export interface WeeklyStats {
  /** Total units (pages or minutes) read this week */
  unitsReadThisWeek: number;
  /** Total units needed this week (based on daily pace × days in week OR days until completion) */
  unitsNeededThisWeek: number;
  /** Units ahead (positive) or behind (negative) for the week */
  unitsAheadBehind: number;
  /** Average units per day this week (actual) */
  averagePerDay: number;
  /** Required units per day to stay on track (from hero card calculation) */
  requiredDailyPace: number;
  /** Number of days with reading activity this week (out of 7) */
  daysWithActivity: number;
  /** Number of days elapsed in the current week (1-7) */
  daysElapsedThisWeek: number;
  /** Progress percentage (unitsReadThisWeek / unitsNeededThisWeek * 100) */
  progressPercentage: number;
  /** Overall status based on progress percentage */
  overallStatus: 'ahead' | 'onTrack' | 'behind';
}
