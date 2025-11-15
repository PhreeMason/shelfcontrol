/**
 * Utility functions for statistics and hero section calculations
 */

import { STATS_CONSTANTS } from '@/constants/statsConstants';
import { dayjs } from '@/lib/dayjs';
import type {
  ProductivityDataResult,
  ProductivityProgressEntry,
} from '@/services/productivity.service';
import {
  ReadingDeadlineProgress,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import {
  DayProductivity,
  ProductiveDaysStats,
  WeeklyStats,
} from '@/types/stats.types';
import type { Dayjs } from 'dayjs';
import { normalizeServerDate } from './dateNormalization';

/**
 * Formats audio time for display
 * @param minutes - Total minutes
 * @returns Formatted string (e.g., "1h 15m" or "27m")
 */
export const formatAudioTime = (minutes: number): string => {
  const absMinutes = Math.abs(minutes);

  if (absMinutes >= 60) {
    const hours = Math.floor(absMinutes / 60);
    const mins = Math.round(absMinutes % 60);

    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
  }

  return `${Math.round(absMinutes)}m`;
};

/**
 * Color configuration for weekly stats card based on status
 */
export interface WeeklyStatusColors {
  background: string;
  border: string;
  text: string;
  progressBar: string;
}

/**
 * Theme colors interface (subset needed for stats)
 */
export interface ThemeColors {
  background: string;
  border: string;
  textMuted: string;
  successGreen: string;
  errorRed: string;
  warningOrange: string;
}

/**
 * Gets color configuration for weekly stats card based on status
 * @param status - Overall status ('ahead' | 'onTrack' | 'behind')
 * @param colors - Theme colors from useTheme()
 * @returns Color configuration object
 */
export const getWeeklyStatusColors = (
  status: 'ahead' | 'onTrack' | 'behind',
  colors: ThemeColors
): WeeklyStatusColors => {
  if (status === 'ahead') {
    return {
      background: colors.background,
      border: colors.border,
      text: colors.successGreen,
      progressBar: colors.successGreen,
    };
  } else if (status === 'behind') {
    return {
      background: colors.background,
      border: colors.border,
      text: colors.errorRed,
      progressBar: colors.errorRed,
    };
  } else {
    return {
      background: colors.background,
      border: colors.border,
      text: colors.warningOrange,
      progressBar: colors.warningOrange,
    };
  }
};

/**
 * Formats the ahead/behind text for display
 * @param unitsAheadBehind - Number of units ahead (positive) or behind (negative)
 * @param formatValue - Function to format the value (e.g., for pages or time)
 * @returns Formatted string (e.g., "+50 pages", "-1h 15m", "0 pages")
 */
export const formatAheadBehindText = (
  unitsAheadBehind: number,
  formatValue: (value: number) => string
): string => {
  const absValue = Math.abs(unitsAheadBehind);
  if (unitsAheadBehind > 0) {
    return `+${formatValue(absValue)}`;
  } else if (unitsAheadBehind < 0) {
    return `${formatValue(absValue)}`;
  } else {
    return formatValue(0);
  }
};

/**
 * Gets the label for ahead/behind status
 * @param unitsAheadBehind - Number of units ahead (positive) or behind (negative)
 * @returns Status label ('ahead' | 'behind' | 'on track')
 */
export const getAheadBehindLabel = (unitsAheadBehind: number): string => {
  if (unitsAheadBehind > 0) {
    return 'ahead';
  } else if (unitsAheadBehind < 0) {
    return 'to go';
  } else {
    return 'on track';
  }
};

/**
 * Gets the date when a deadline was first moved to 'reading' status
 * @param deadline - The deadline to check
 * @returns The created_at date of the first 'reading' status, or null if not found
 */
const getReadingStartDate = (
  deadline: ReadingDeadlineWithProgress
): string | null => {
  if (!deadline.status || deadline.status.length === 0) {
    return null;
  }

  // Find the first 'reading' status entry
  // Status array should be ordered by created_at, but we'll sort to be safe
  const sortedStatuses = [...deadline.status].sort((a, b) => {
    const aTime = normalizeServerDate(a.created_at).valueOf();
    const bTime = normalizeServerDate(b.created_at).valueOf();
    return aTime - bTime;
  });

  const firstReadingStatus = sortedStatuses.find(s => s.status === 'reading');
  return firstReadingStatus?.created_at || null;
};

/**
 * Gets the start (Sunday) and end (Saturday) of the current week in local timezone
 *
 * **Timezone Handling**:
 * - All calculations use the device's local timezone
 * - Week starts Sunday 00:00:00 local time
 * - Week ends Saturday 23:59:59.999 local time
 * - Uses dayjs `.startOf('week')` and `.endOf('week')` which respect local timezone
 *
 * **Why Local Timezone**:
 * - Matches user's calendar perception (a "day" is their local day)
 * - Consistent with how progress entries are displayed in the app
 * - Server stores UTC timestamps, but we normalize to local for all date comparisons
 *
 * @returns Object with start and end Dayjs instances (both in local timezone)
 */
export const getWeekDateRange = (): { start: Dayjs; end: Dayjs } => {
  const now = dayjs();
  return {
    start: now.startOf('week'), // Sunday 00:00:00.000 local
    end: now.endOf('week'), // Saturday 23:59:59.999 local
  };
};

/**
 * Gets the number of days elapsed in the current week (1-7)
 * Sunday = 1, Monday = 2, ..., Saturday = 7
 * @returns Number of days elapsed so far this week
 */
export const getDaysElapsedThisWeek = (): number => {
  const now = dayjs();
  const weekStart = now.startOf('week'); // Sunday 00:00

  // Add 1 because we want inclusive count (Sunday is day 1, not day 0)
  return now.diff(weekStart, 'day') + 1;
};

/**
 * Checks if a deadline was completed or moved to review within a specific date range
 * @param deadline - The deadline to check
 * @param dateRange - The date range to check (start and end Dayjs instances)
 * @returns The completion/review date if within range, null otherwise
 */
const getCompletionDateInRange = (
  deadline: ReadingDeadlineWithProgress,
  dateRange: { start: Dayjs; end: Dayjs }
): string | null => {
  if (!deadline.status || deadline.status.length === 0) return null;

  const { start, end } = dateRange;

  // Find first 'completed' or 'to_review' status
  const sortedStatuses = [...deadline.status].sort((a, b) => {
    return (
      normalizeServerDate(a.created_at).valueOf() -
      normalizeServerDate(b.created_at).valueOf()
    );
  });

  const completionStatus = sortedStatuses.find(
    s => s.status === 'complete' || s.status === 'to_review'
  );

  if (!completionStatus) return null;

  const completionDate = normalizeServerDate(completionStatus.created_at);

  // Check if completion was within the date range (inclusive of boundaries)
  if (
    completionDate.isSameOrAfter(start) &&
    completionDate.isSameOrBefore(end)
  ) {
    return completionStatus.created_at;
  }

  return null;
};

/**
 * Checks if a deadline was completed or moved to review this week
 *
 * This is a convenience wrapper around `getCompletionDateInRange` that uses the current week.
 *
 * @param deadline - The deadline to check
 * @returns The completion/review date if this week, null otherwise
 */
export const getCompletionDateThisWeek = (
  deadline: ReadingDeadlineWithProgress
): string | null => {
  return getCompletionDateInRange(deadline, getWeekDateRange());
};

/**
 * Filters progress entries to those created within a specified date range, optionally up to a completion date
 *
 * This function applies inclusive date boundaries (isSameOrAfter/isSameOrBefore) to ensure
 * progress entries exactly at week boundaries are included.
 *
 * **Filtering Rules**:
 * - Excludes entries with `ignore_in_calcs = true`
 * - Includes entries from start date to end date (inclusive)
 * - If completion date provided, only includes entries before or at completion time
 *
 * **Timezone Handling**:
 * - Server timestamps are normalized to local timezone via `normalizeServerDate()`
 * - Week boundaries are computed in local timezone
 * - Comparison uses `.isSameOrAfter(start)` and `.isSameOrBefore(end)` which compare
 *   dates in the same timezone (both local)
 * - This ensures entries at exactly the boundary timestamps are included
 * - No timezone conversion occurs during comparison (both sides are local)
 *
 * **Edge Cases Handled**:
 * - Progress entry exactly at start time → Included (isSameOrAfter)
 * - Progress entry exactly at end time → Included (isSameOrBefore)
 * - Mid-week completion: Only counts progress up to completion timestamp
 *
 * @param deadline - The deadline with progress entries to filter
 * @param dateRange - The date range to filter progress entries (start and end Dayjs instances)
 * @param completionDate - Optional completion date to filter progress before (for mid-week completions)
 * @returns Array of progress entries from the specified date range, excluding ignored entries
 */
const getProgressEntriesInDateRange = (
  deadline: ReadingDeadlineWithProgress,
  dateRange: { start: Dayjs; end: Dayjs },
  completionDate?: string | null
): ReadingDeadlineProgress[] => {
  const { start, end } = dateRange;

  return deadline.progress.filter(entry => {
    if (entry.ignore_in_calcs) return false;

    const entryDate = normalizeServerDate(entry.created_at);

    // Must be within the date range (inclusive of boundaries)
    if (!entryDate.isSameOrAfter(start) || !entryDate.isSameOrBefore(end)) {
      return false;
    }

    // If book was completed during this period, only count progress before or at completion
    if (completionDate) {
      const completion = normalizeServerDate(completionDate);
      if (entryDate.isAfter(completion)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Filters progress entries to those created this week, optionally up to a completion date
 *
 * This is a convenience wrapper around `getProgressEntriesInDateRange` that uses the current week.
 *
 * @param deadline - The deadline with progress entries to filter
 * @param completionDate - Optional completion date to filter progress before (for mid-week completions)
 * @returns Array of progress entries from this week, excluding ignored entries
 */
const getProgressEntriesThisWeek = (
  deadline: ReadingDeadlineWithProgress,
  completionDate?: string | null
): ReadingDeadlineProgress[] => {
  return getProgressEntriesInDateRange(
    deadline,
    getWeekDateRange(),
    completionDate
  );
};

/**
 * Counts unique days with reading activity from progress entries
 * @param progress - Array of progress entries
 * @returns Count of unique days (0-7)
 */
const countDaysWithActivity = (progress: ReadingDeadlineProgress[]): number => {
  const uniqueDays = new Set(
    progress.map(entry =>
      normalizeServerDate(entry.created_at).format('YYYY-MM-DD')
    )
  );
  return uniqueDays.size;
};

/**
 * Calculates the weekly goal (units needed) for a specific deadline within a date range
 *
 * For books still in progress, the weekly goal is simply the daily pace × 7.
 * For books completed mid-period, the goal is prorated to only include days
 * from the period start until completion.
 *
 * **Example**:
 * - Book requires 10 pages/day
 * - Completed on Tuesday (day 3 of week: Sunday, Monday, Tuesday)
 * - Weekly goal = 10 × 3 = 30 pages (not 70 pages)
 *
 * This prevents penalizing users for books completed earlier in the week.
 *
 * @param requiredDailyPace - Required daily pace for this book (pages or minutes per day)
 * @param dateRange - The date range to calculate the goal for
 * @param completionDate - Optional completion date if completed during this period
 * @returns Units needed for this period (prorated if completed mid-period)
 */
const calculateWeeklyGoalForDeadline = (
  requiredDailyPace: number,
  dateRange: { start: Dayjs; end: Dayjs },
  completionDate?: string | null
): number => {
  const { start } = dateRange;

  if (completionDate) {
    // Book was completed during this period - calculate days from period start to completion
    const completion = normalizeServerDate(completionDate).startOf('day');
    const daysInPeriodUntilCompletion = completion.diff(start, 'day') + 1;
    return requiredDailyPace * Math.max(1, daysInPeriodUntilCompletion);
  } else {
    // Book is still reading - full week goal
    return requiredDailyPace * 7;
  }
};

/**
 * Calculates weekly reading statistics for physical and eBook formats
 *
 * This function analyzes reading progress for the current week (Sunday to Saturday)
 * and aggregates statistics across all relevant books.
 *
 * **Calculation Method**:
 * - Uses max() instead of latest progress entry to handle backwards tracking
 * - Progress this week = max(progress entries this week) - max(progress before week)
 * - Required pace calculated from deadline timeline (total / days from start to deadline)
 * - Weekly goal = required daily pace × 7 (adjusted for mid-week completions)
 *
 * **Status Determination**:
 * - `ahead`: Progress >= 100% of weekly goal
 * - `onTrack`: Progress >= 95% of weekly goal
 * - `behind`: Progress < 95% of weekly goal
 *
 * **Included Books**:
 * - Active books with status='reading' and format='physical' or 'eBook'
 * - Books completed or moved to 'to_review' this week (physical/eBook only)
 *
 * **Edge Cases**:
 * - Mid-week completions: Weekly goal is prorated based on completion date
 * - Progress entries marked with `ignore_in_calcs` are excluded
 * - Books without reading start date are skipped
 * - Books with deadline before or at start date are skipped
 *
 * @param activeDeadlines - All active deadlines
 * @param completedDeadlines - All completed deadlines
 * @returns Weekly reading statistics with progress, pace, and status
 */
export const calculateWeeklyReadingStats = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[]
): WeeklyStats => {
  // Get active reading books
  const activeReadingBooks = activeDeadlines.filter(d => {
    const latestStatus =
      d.status && d.status.length > 0
        ? d.status[d.status.length - 1]?.status
        : null;
    return (
      latestStatus === 'reading' &&
      (d.format === 'physical' || d.format === 'eBook')
    );
  });

  // Get books completed THIS WEEK (physical/eBook only)
  const completedThisWeekBooks = completedDeadlines.filter(d => {
    if (d.format !== 'physical' && d.format !== 'eBook') return false;
    return getCompletionDateThisWeek(d) !== null;
  });

  // Combine both lists
  const allRelevantBooks = [...activeReadingBooks, ...completedThisWeekBooks];

  if (allRelevantBooks.length === 0) {
    return {
      unitsReadThisWeek: 0,
      unitsNeededThisWeek: 0,
      unitsAheadBehind: 0,
      averagePerDay: 0,
      requiredDailyPace: 0,
      daysWithActivity: 0,
      daysElapsedThisWeek: getDaysElapsedThisWeek(),
      progressPercentage: 0,
      overallStatus: 'onTrack',
    };
  }

  let totalPagesReadThisWeek = 0;
  let totalPagesNeededThisWeek = 0;
  let totalRequiredDailyPace = 0;
  const allWeekProgress: ReadingDeadlineProgress[] = [];

  for (const deadline of allRelevantBooks) {
    const readingStartDate = getReadingStartDate(deadline);
    if (!readingStartDate) continue;

    const startDate = normalizeServerDate(readingStartDate).startOf('day');
    const deadlineDate = normalizeServerDate(deadline.deadline_date).startOf(
      'day'
    );

    const totalTimelineDays = deadlineDate.diff(startDate, 'day');
    if (totalTimelineDays <= 0) continue;

    // REUSE hero card calculation for daily pace
    const requiredDailyPace = deadline.total_quantity / totalTimelineDays;
    totalRequiredDailyPace += requiredDailyPace;

    // Check if completed this week
    const completionDate = getCompletionDateThisWeek(deadline);

    // Get progress THIS WEEK (up to completion if applicable)
    const weekProgress = getProgressEntriesThisWeek(deadline, completionDate);

    // Calculate pages read this week:
    // Find the highest progress value from this week
    // Subtract the progress value at the start of the week
    const progressAtEndOfWeek =
      weekProgress.length > 0
        ? Math.max(...weekProgress.map(p => p.current_progress))
        : 0;

    // Find progress before this week started
    const { start: weekStart } = getWeekDateRange();
    const progressBeforeWeek = deadline.progress
      .filter(p => {
        const entryDate = normalizeServerDate(p.created_at);
        return entryDate.isBefore(weekStart) && !p.ignore_in_calcs;
      })
      .map(p => p.current_progress);
    const progressAtStartOfWeek =
      progressBeforeWeek.length > 0 ? Math.max(...progressBeforeWeek) : 0;

    const pagesThisWeek = Math.max(
      0,
      progressAtEndOfWeek - progressAtStartOfWeek
    );
    totalPagesReadThisWeek += pagesThisWeek;

    // Add to overall activity tracking
    allWeekProgress.push(...weekProgress);

    // Calculate weekly goal (adjusted if completed mid-week)
    const weekRange = getWeekDateRange();
    const weeklyGoal = calculateWeeklyGoalForDeadline(
      requiredDailyPace,
      weekRange,
      completionDate
    );
    totalPagesNeededThisWeek += weeklyGoal;
  }

  const pagesAheadBehind = totalPagesReadThisWeek - totalPagesNeededThisWeek;
  const daysWithActivity = countDaysWithActivity(allWeekProgress);
  const averagePagesPerDay =
    getDaysElapsedThisWeek() > 0
      ? totalPagesReadThisWeek / getDaysElapsedThisWeek()
      : 0;
  const progressPercentage =
    totalPagesNeededThisWeek > 0
      ? (totalPagesReadThisWeek / totalPagesNeededThisWeek) * 100
      : 0;

  // Determine status based on defined thresholds
  let overallStatus: 'ahead' | 'onTrack' | 'behind';
  if (progressPercentage >= STATS_CONSTANTS.AHEAD_THRESHOLD) {
    overallStatus = 'ahead';
  } else if (progressPercentage >= STATS_CONSTANTS.ON_TRACK_THRESHOLD) {
    overallStatus = 'onTrack';
  } else {
    overallStatus = 'behind';
  }

  return {
    unitsReadThisWeek: Math.round(totalPagesReadThisWeek),
    unitsNeededThisWeek: Math.round(totalPagesNeededThisWeek),
    unitsAheadBehind: Math.round(pagesAheadBehind),
    averagePerDay: Math.round(averagePagesPerDay),
    requiredDailyPace: Math.round(totalRequiredDailyPace),
    daysWithActivity,
    daysElapsedThisWeek: getDaysElapsedThisWeek(),
    progressPercentage: Math.round(progressPercentage),
    overallStatus,
  };
};

/**
 * Calculates weekly listening statistics for audio format
 *
 * This function mirrors `calculateWeeklyReadingStats` but specifically for audiobooks,
 * tracking minutes listened instead of pages read.
 *
 * **Calculation Method**:
 * - Uses max() instead of latest progress entry to handle backwards tracking
 * - Minutes this week = max(progress entries this week) - max(progress before week)
 * - Required pace calculated from deadline timeline (total minutes / days from start to deadline)
 * - Weekly goal = required daily pace × 7 (adjusted for mid-week completions)
 *
 * **Status Determination**:
 * - `ahead`: Progress >= 100% of weekly goal
 * - `onTrack`: Progress >= 95% of weekly goal
 * - `behind`: Progress < 95% of weekly goal
 *
 * **Included Books**:
 * - Active books with status='reading' and format='audio'
 * - Books completed or moved to 'to_review' this week (audio only)
 *
 * **Edge Cases**:
 * - Mid-week completions: Weekly goal is prorated based on completion date
 * - Progress entries marked with `ignore_in_calcs` are excluded
 * - Books without reading start date are skipped
 * - Books with deadline before or at start date are skipped
 *
 * @param activeDeadlines - All active deadlines
 * @param completedDeadlines - All completed deadlines
 * @returns Weekly listening statistics with progress, pace, and status
 */
export const calculateWeeklyListeningStats = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[]
): WeeklyStats => {
  // Get active audio books
  const activeAudioBooks = activeDeadlines.filter(d => {
    const latestStatus =
      d.status && d.status.length > 0
        ? d.status[d.status.length - 1]?.status
        : null;
    return latestStatus === 'reading' && d.format === 'audio';
  });

  // Get audio books completed THIS WEEK
  const completedThisWeekBooks = completedDeadlines.filter(d => {
    if (d.format !== 'audio') return false;
    return getCompletionDateThisWeek(d) !== null;
  });

  // Combine both lists
  const allRelevantBooks = [...activeAudioBooks, ...completedThisWeekBooks];

  if (allRelevantBooks.length === 0) {
    return {
      unitsReadThisWeek: 0,
      unitsNeededThisWeek: 0,
      unitsAheadBehind: 0,
      averagePerDay: 0,
      requiredDailyPace: 0,
      daysWithActivity: 0,
      daysElapsedThisWeek: getDaysElapsedThisWeek(),
      progressPercentage: 0,
      overallStatus: 'onTrack',
    };
  }

  let totalMinutesListenedThisWeek = 0;
  let totalMinutesNeededThisWeek = 0;
  let totalRequiredDailyPace = 0;
  const allWeekProgress: ReadingDeadlineProgress[] = [];

  for (const deadline of allRelevantBooks) {
    const readingStartDate = getReadingStartDate(deadline);
    if (!readingStartDate) continue;

    const startDate = normalizeServerDate(readingStartDate).startOf('day');
    const deadlineDate = normalizeServerDate(deadline.deadline_date).startOf(
      'day'
    );

    const totalTimelineDays = deadlineDate.diff(startDate, 'day');
    if (totalTimelineDays <= 0) continue;

    // REUSE hero card calculation for daily pace
    const requiredDailyPace = deadline.total_quantity / totalTimelineDays;
    totalRequiredDailyPace += requiredDailyPace;

    // Check if completed this week
    const completionDate = getCompletionDateThisWeek(deadline);

    // Get progress THIS WEEK (up to completion if applicable)
    const weekProgress = getProgressEntriesThisWeek(deadline, completionDate);

    // Calculate minutes listened this week:
    // Find the highest progress value from this week
    // Subtract the progress value at the start of the week
    const progressAtEndOfWeek =
      weekProgress.length > 0
        ? Math.max(...weekProgress.map(p => p.current_progress))
        : 0;

    // Find progress before this week started
    const { start: weekStart } = getWeekDateRange();
    const progressBeforeWeek = deadline.progress
      .filter(p => {
        const entryDate = normalizeServerDate(p.created_at);
        return entryDate.isBefore(weekStart) && !p.ignore_in_calcs;
      })
      .map(p => p.current_progress);
    const progressAtStartOfWeek =
      progressBeforeWeek.length > 0 ? Math.max(...progressBeforeWeek) : 0;

    const minutesThisWeek = Math.max(
      0,
      progressAtEndOfWeek - progressAtStartOfWeek
    );
    totalMinutesListenedThisWeek += minutesThisWeek;

    // Add to overall activity tracking
    allWeekProgress.push(...weekProgress);

    // Calculate weekly goal (adjusted if completed mid-week)
    const weekRange = getWeekDateRange();
    const weeklyGoal = calculateWeeklyGoalForDeadline(
      requiredDailyPace,
      weekRange,
      completionDate
    );
    totalMinutesNeededThisWeek += weeklyGoal;
  }

  const minutesAheadBehind =
    totalMinutesListenedThisWeek - totalMinutesNeededThisWeek;
  const daysWithActivity = countDaysWithActivity(allWeekProgress);
  const averageMinutesPerDay =
    getDaysElapsedThisWeek() > 0
      ? totalMinutesListenedThisWeek / getDaysElapsedThisWeek()
      : 0;
  const progressPercentage =
    totalMinutesNeededThisWeek > 0
      ? (totalMinutesListenedThisWeek / totalMinutesNeededThisWeek) * 100
      : 0;

  // Determine status based on defined thresholds
  let overallStatus: 'ahead' | 'onTrack' | 'behind';
  if (progressPercentage >= STATS_CONSTANTS.AHEAD_THRESHOLD) {
    overallStatus = 'ahead';
  } else if (progressPercentage >= STATS_CONSTANTS.ON_TRACK_THRESHOLD) {
    overallStatus = 'onTrack';
  } else {
    overallStatus = 'behind';
  }

  return {
    unitsReadThisWeek: Math.round(totalMinutesListenedThisWeek),
    unitsNeededThisWeek: Math.round(totalMinutesNeededThisWeek),
    unitsAheadBehind: Math.round(minutesAheadBehind),
    averagePerDay: Math.round(averageMinutesPerDay),
    requiredDailyPace: Math.round(totalRequiredDailyPace),
    daysWithActivity,
    daysElapsedThisWeek: getDaysElapsedThisWeek(),
    progressPercentage: Math.round(progressPercentage),
    overallStatus,
  };
};

/**
 * Gets the date range for historical productivity analysis
 *
 * Returns the last 2 weeks of data, excluding the current week.
 * This provides a stable baseline for analyzing day-of-week patterns
 * without being affected by incomplete current week data.
 *
 * **Example**:
 * - If today is Wednesday, Nov 13, 2024 (mid-week)
 * - Current week: Sunday Nov 10 - Saturday Nov 16
 * - Previous week: Sunday Nov 3 - Saturday Nov 9
 * - Week before that: Sunday Oct 27 - Saturday Nov 2
 * - Returns: Oct 27 00:00 - Nov 9 23:59:59.999 (2 complete weeks)
 *
 * @returns Object with start and end Dayjs instances, plus human-readable description
 */
export const getHistoricalProductivityDateRange = (): {
  start: Dayjs;
  end: Dayjs;
  description: string;
} => {
  const now = dayjs();
  const currentWeekStart = now.startOf('week'); // This week's Sunday

  // End of previous week (last Saturday)
  const end = currentWeekStart.subtract(1, 'day').endOf('day');

  // Start of two weeks ago (Sunday, 14 days before current week started)
  const start = currentWeekStart.subtract(14, 'day').startOf('day');

  return {
    start,
    end,
    description: 'last 2 weeks',
  };
};

/**
 * Helper function to group progress entries by day of week
 *
 * Takes all progress entries within a date range and groups them by
 * day of week (0 = Sunday, 6 = Saturday).
 *
 * @param deadlines - All deadlines to analyze
 * @param dateRange - Date range to filter progress entries
 * @param format - Book format to filter ('physical'/'eBook' for reading, 'audio' for listening)
 * @returns Map of day index (0-6) to progress entries for that day
 */
const groupProgressByDayOfWeek = (
  deadlines: ReadingDeadlineWithProgress[],
  dateRange: { start: Dayjs; end: Dayjs },
  format: 'reading' | 'listening'
): Map<number, ReadingDeadlineProgress[]> => {
  const dayMap = new Map<number, ReadingDeadlineProgress[]>();

  // Initialize map with empty arrays for all days
  for (let i = 0; i < 7; i++) {
    dayMap.set(i, []);
  }

  // Filter deadlines by format
  const filteredDeadlines = deadlines.filter(d => {
    if (format === 'reading') {
      return d.format === 'physical' || d.format === 'eBook';
    } else {
      return d.format === 'audio';
    }
  });

  // Group progress entries by day of week
  let totalEntriesInRange = 0;
  let totalEntriesOutOfRange = 0;

  for (const deadline of filteredDeadlines) {
    for (const entry of deadline.progress) {
      if (entry.ignore_in_calcs) {
        continue;
      }

      const entryDate = normalizeServerDate(entry.created_at);
      const isInRange = entryDate.isSameOrAfter(dateRange.start) && entryDate.isSameOrBefore(dateRange.end);

      // Check if entry is within date range
      if (isInRange) {
        const dayOfWeek = entryDate.day(); // 0 = Sunday, 6 = Saturday
        dayMap.get(dayOfWeek)!.push(entry);
        totalEntriesInRange++;
      } else {
        totalEntriesOutOfRange++;
      }
    }
  }

  return dayMap;
};

/**
 * Helper function to calculate total units for each day of week
 *
 * For each day, calculates the total progress made by analyzing
 * progress increases across all books.
 *
 * @param dayMap - Map of day index to progress entries
 * @param allDeadlines - All deadlines (needed to calculate progress increases)
 * @returns Map of day index to total units for that day
 */
const calculateTotalUnitsByDay = (
  dayMap: Map<number, ReadingDeadlineProgress[]>,
  allDeadlines: ReadingDeadlineWithProgress[]
): Map<number, number> => {
  const totalsByDay = new Map<number, number>();

  // Initialize all days to 0
  for (let i = 0; i < 7; i++) {
    totalsByDay.set(i, 0);
  }

  // For each day, calculate progress increases
  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const entriesForDay = dayMap.get(dayIndex) || [];

    // Group entries by deadline to calculate increases per book
    const entriesByDeadline = new Map<string, ReadingDeadlineProgress[]>();

    for (const entry of entriesForDay) {
      if (!entriesByDeadline.has(entry.deadline_id)) {
        entriesByDeadline.set(entry.deadline_id, []);
      }
      entriesByDeadline.get(entry.deadline_id)!.push(entry);
    }

    let dayTotal = 0;

    // For each deadline, calculate the progress increase on this day
    for (const [deadlineId, entries] of entriesByDeadline) {
      const deadline = allDeadlines.find(d => d.id === deadlineId);
      if (!deadline) continue;

      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => {
        return (
          normalizeServerDate(a.created_at).valueOf() -
          normalizeServerDate(b.created_at).valueOf()
        );
      });

      // Calculate increase for each entry
      for (let i = 0; i < sortedEntries.length; i++) {
        const currentProgress = sortedEntries[i].current_progress;

        // Find previous progress (either from earlier same day, or from before this day)
        let previousProgress = 0;

        if (i > 0) {
          // Use previous entry from same day
          previousProgress = sortedEntries[i - 1].current_progress;
        } else {
          // Find most recent entry before this one from all progress
          const entryDate = normalizeServerDate(sortedEntries[i].created_at);
          const priorEntries = deadline.progress.filter(p => {
            if (p.ignore_in_calcs) return false;
            const pDate = normalizeServerDate(p.created_at);
            return pDate.isBefore(entryDate);
          });

          if (priorEntries.length > 0) {
            previousProgress = Math.max(
              ...priorEntries.map(p => p.current_progress)
            );
          }
        }

        const increase = Math.max(0, currentProgress - previousProgress);
        dayTotal += increase;
      }
    }

    totalsByDay.set(dayIndex, dayTotal);
  }

  return totalsByDay;
};

/**
 * Calculates the most productive days for reading (physical and eBook)
 *
 * Analyzes reading activity across the last 2 weeks (excluding current week)
 * to identify which days of the week tend to be most productive.
 *
 * **Methodology**:
 * 1. Filters to physical and eBook deadlines only
 * 2. Groups all progress entries by day of week (Mon-Sun)
 * 3. Calculates total pages read on each day across all books
 * 4. Ranks days by total pages
 * 5. Returns top 3 days
 *
 * **Use Cases**:
 * - Help users identify their natural reading patterns
 * - Suggest optimal days for scheduling reading time
 * - Provide data-driven insights for habit formation
 *
 * @param activeDeadlines - Currently active reading deadlines
 * @param completedDeadlines - Completed reading deadlines
 * @returns Statistics for the top 3 most productive reading days
 */
export const calculateMostProductiveReadingDays = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[]
): ProductiveDaysStats => {
  const dateRange = getHistoricalProductivityDateRange();
  const allDeadlines = [...activeDeadlines, ...completedDeadlines];

  // Group progress by day of week
  const dayMap = groupProgressByDayOfWeek(allDeadlines, dateRange, 'reading');

  // Calculate total pages per day
  const totalsByDay = calculateTotalUnitsByDay(dayMap, allDeadlines);

  // Count total data points
  let totalDataPoints = 0;
  for (const entries of dayMap.values()) {
    totalDataPoints += entries.length;
  }

  // Check if we have enough data (at least 3 progress entries)
  if (totalDataPoints < 3) {
    return {
      topDays: [],
      hasData: false,
      totalDataPoints,
      dateRangeText: dateRange.description,
    };
  }

  // Day names
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create DayProductivity objects
  const allDays: DayProductivity[] = [];
  for (let i = 0; i < 7; i++) {
    allDays.push({
      dayName: dayNames[i],
      dayAbbrev: dayAbbrevs[i],
      dayIndex: i,
      totalUnits: totalsByDay.get(i) || 0,
      percentOfMax: 0, // Will calculate after sorting
    });
  }

  // Sort by total units (descending)
  allDays.sort((a, b) => b.totalUnits - a.totalUnits);

  // Calculate percentOfMax based on top day
  const maxUnits = allDays[0].totalUnits;
  if (maxUnits > 0) {
    for (const day of allDays) {
      day.percentOfMax = (day.totalUnits / maxUnits) * 100;
    }
  }

  // Get top 3 days with activity only
  const topDays = allDays.slice(0, 3).filter(day => day.totalUnits > 0);

  return {
    topDays,
    hasData: topDays.length > 0,
    totalDataPoints,
    dateRangeText: dateRange.description,
  };
};

/**
 * Calculates the most productive days for listening (audiobooks)
 *
 * Analyzes listening activity across the last 2 weeks (excluding current week)
 * to identify which days of the week tend to be most productive.
 *
 * **Methodology**:
 * 1. Filters to audio format deadlines only
 * 2. Groups all progress entries by day of week (Mon-Sun)
 * 3. Calculates total minutes listened on each day across all books
 * 4. Ranks days by total minutes
 * 5. Returns top 3 days
 *
 * **Use Cases**:
 * - Help users identify their natural listening patterns
 * - Suggest optimal days for scheduling audiobook time
 * - Provide data-driven insights for habit formation
 *
 * @param activeDeadlines - Currently active reading deadlines
 * @param completedDeadlines - Completed reading deadlines
 * @returns Statistics for the top 3 most productive listening days
 */
export const calculateMostProductiveListeningDays = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[]
): ProductiveDaysStats => {
  const dateRange = getHistoricalProductivityDateRange();
  const allDeadlines = [...activeDeadlines, ...completedDeadlines];

  // Group progress by day of week
  const dayMap = groupProgressByDayOfWeek(allDeadlines, dateRange, 'listening');

  // Calculate total minutes per day
  const totalsByDay = calculateTotalUnitsByDay(dayMap, allDeadlines);

  // Count total data points
  let totalDataPoints = 0;
  for (const entries of dayMap.values()) {
    totalDataPoints += entries.length;
  }

  // Check if we have enough data (at least 3 progress entries)
  if (totalDataPoints < 3) {
    return {
      topDays: [],
      hasData: false,
      totalDataPoints,
      dateRangeText: dateRange.description,
    };
  }

  // Day names
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create DayProductivity objects
  const allDays: DayProductivity[] = [];
  for (let i = 0; i < 7; i++) {
    allDays.push({
      dayName: dayNames[i],
      dayAbbrev: dayAbbrevs[i],
      dayIndex: i,
      totalUnits: totalsByDay.get(i) || 0,
      percentOfMax: 0, // Will calculate after sorting
    });
  }

  // Sort by total units (descending)
  allDays.sort((a, b) => b.totalUnits - a.totalUnits);

  // Calculate percentOfMax based on top day
  const maxUnits = allDays[0].totalUnits;
  if (maxUnits > 0) {
    for (const day of allDays) {
      day.percentOfMax = (day.totalUnits / maxUnits) * 100;
    }
  }

  // Get top 3 days with activity only
  const topDays = allDays.slice(0, 3).filter(day => day.totalUnits > 0);

  return {
    topDays,
    hasData: topDays.length > 0,
    totalDataPoints,
    dateRangeText: dateRange.description,
  };
};

// ============================================================================
// NEW: Optimized productivity calculations using service data
// ============================================================================

/**
 * Calculates most productive days from service data (optimized for minimal data transfer).
 *
 * This function works with data fetched directly from the productivity service,
 * which only includes progress entries in the date range plus baseline progress.
 * This reduces data transfer by 70-90% compared to fetching all deadlines.
 *
 * @param serviceData - Data from productivityService.getProductivityByDayOfWeek()
 * @returns Statistics for the top 3 most productive days
 */
export const calculateProductiveDaysFromService = (
  serviceData: ProductivityDataResult | undefined
): ProductiveDaysStats => {
  if (!serviceData || serviceData.progressEntries.length === 0) {
    return {
      topDays: [],
      hasData: false,
      totalDataPoints: 0,
      dateRangeText: 'last 2 weeks',
    };
  }

  const { progressEntries, baselineProgress } = serviceData;

  // Create baseline map for quick lookup
  const baselineMap = new Map<string, number>();
  for (const baseline of baselineProgress) {
    baselineMap.set(baseline.deadline_id, baseline.baseline_progress);
  }

  // Group entries by day of week
  const dayMap = new Map<number, ProductivityProgressEntry[]>();
  for (let i = 0; i < 7; i++) {
    dayMap.set(i, []);
  }

  for (const entry of progressEntries) {
    const entryDate = normalizeServerDate(entry.created_at);
    const dayOfWeek = entryDate.day(); // 0 = Sunday, 6 = Saturday
    dayMap.get(dayOfWeek)!.push(entry);
  }

  // Calculate total units for each day
  const totalsByDay = new Map<number, number>();
  for (let i = 0; i < 7; i++) {
    totalsByDay.set(i, 0);
  }

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const entriesForDay = dayMap.get(dayIndex) || [];

    // Group by deadline
    const entriesByDeadline = new Map<string, ProductivityProgressEntry[]>();
    for (const entry of entriesForDay) {
      if (!entriesByDeadline.has(entry.deadline_id)) {
        entriesByDeadline.set(entry.deadline_id, []);
      }
      entriesByDeadline.get(entry.deadline_id)!.push(entry);
    }

    let dayTotal = 0;

    // Calculate progress increase for each deadline on this day
    for (const [deadlineId, entries] of entriesByDeadline) {
      // Sort entries by date
      const sortedEntries = [...entries].sort((a, b) => {
        return (
          normalizeServerDate(a.created_at).valueOf() -
          normalizeServerDate(b.created_at).valueOf()
        );
      });

      // Calculate increase for each entry
      for (let i = 0; i < sortedEntries.length; i++) {
        const currentProgress = sortedEntries[i].current_progress;
        let previousProgress = 0;

        if (i > 0) {
          // Use previous entry from same day
          previousProgress = sortedEntries[i - 1].current_progress;
        } else {
          // Use baseline progress (max progress before date range)
          // OR find most recent entry from ALL progress for this deadline before this one
          const entryDate = normalizeServerDate(sortedEntries[i].created_at);
          const priorEntriesThisWeek = progressEntries.filter(p => {
            if (p.deadline_id !== deadlineId) return false;
            const pDate = normalizeServerDate(p.created_at);
            return pDate.isBefore(entryDate);
          });

          if (priorEntriesThisWeek.length > 0) {
            previousProgress = Math.max(
              ...priorEntriesThisWeek.map(p => p.current_progress)
            );
          } else {
            // Use baseline if no prior entries in date range
            previousProgress = baselineMap.get(deadlineId) || 0;
          }
        }

        const increase = Math.max(0, currentProgress - previousProgress);
        dayTotal += increase;
      }
    }

    totalsByDay.set(dayIndex, dayTotal);
  }

  // Count total data points
  const totalDataPoints = progressEntries.length;

  // Check if we have enough data (at least 3 progress entries)
  if (totalDataPoints < 3) {
    return {
      topDays: [],
      hasData: false,
      totalDataPoints,
      dateRangeText: 'last 2 weeks',
    };
  }

  // Day names
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayAbbrevs = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Create DayProductivity objects
  const allDays: DayProductivity[] = [];
  for (let i = 0; i < 7; i++) {
    allDays.push({
      dayName: dayNames[i],
      dayAbbrev: dayAbbrevs[i],
      dayIndex: i,
      totalUnits: totalsByDay.get(i) || 0,
      percentOfMax: 0,
    });
  }

  // Sort by total units (descending)
  allDays.sort((a, b) => b.totalUnits - a.totalUnits);

  // Calculate percentOfMax based on top day
  const maxUnits = allDays[0].totalUnits;
  if (maxUnits > 0) {
    for (const day of allDays) {
      day.percentOfMax = (day.totalUnits / maxUnits) * 100;
    }
  }

  // Get top 3 days with activity only
  const topDays = allDays.slice(0, 3).filter(day => day.totalUnits > 0);

  return {
    topDays,
    hasData: topDays.length > 0,
    totalDataPoints,
    dateRangeText: 'last 2 weeks',
  };
};
