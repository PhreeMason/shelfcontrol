/**
 * Utility functions for statistics and hero section calculations
 */

import {
  DAY_ABBREVS,
  DAY_NAMES,
  STATS_CONSTANTS,
} from '@/constants/statsConstants';
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

// ============================================================================
// Helper Functions for Weekly Stats
// ============================================================================

/**
 * Filters deadlines by format type (reading vs audio)
 *
 * @param deadlines - Array of deadlines to filter
 * @param format - 'reading' for physical/eBook, 'audio' for audiobooks
 * @returns Filtered array of deadlines matching the format
 */
export const filterDeadlinesByFormat = (
  deadlines: ReadingDeadlineWithProgress[],
  format: 'reading' | 'audio'
): ReadingDeadlineWithProgress[] => {
  if (format === 'reading') {
    return deadlines.filter(
      d => d.format === 'physical' || d.format === 'eBook'
    );
  }
  return deadlines.filter(d => d.format === 'audio');
};

/**
 * Filters progress entries to those within a date range (inclusive)
 * Excludes entries with ignore_in_calcs=true
 *
 * @param progress - Array of progress entries to filter
 * @param range - Date range with start and end
 * @returns Filtered progress entries within the range
 */
const filterProgressInRange = (
  progress: ReadingDeadlineProgress[],
  range: { start: Dayjs; end: Dayjs }
): ReadingDeadlineProgress[] =>
  progress.filter(p => {
    if (p.ignore_in_calcs) return false;
    const entryDate = normalizeServerDate(p.created_at);
    return (
      entryDate.isSameOrAfter(range.start) &&
      entryDate.isSameOrBefore(range.end)
    );
  });

/**
 * Filters progress entries to those before a given date
 * Excludes entries with ignore_in_calcs=true
 *
 * @param progress - Array of progress entries to filter
 * @param beforeDate - Date to filter before
 * @returns Filtered progress entries before the date
 */
const filterProgressBeforeDate = (
  progress: ReadingDeadlineProgress[],
  beforeDate: Dayjs
): ReadingDeadlineProgress[] =>
  progress.filter(p => {
    if (p.ignore_in_calcs) return false;
    return normalizeServerDate(p.created_at).isBefore(beforeDate);
  });

/**
 * Gets max progress value from an array of progress entries
 * Returns 0 if array is empty
 */
const getMaxProgress = (progress: ReadingDeadlineProgress[]): number =>
  progress.length > 0
    ? Math.max(...progress.map(p => p.current_progress))
    : 0;

/**
 * Calculates progress made this week for a single deadline
 *
 * Progress is calculated as: max(progress this week) - max(progress before week)
 * This handles backwards tracking (corrections) correctly by using max values.
 *
 * @param deadline - The deadline to calculate progress for
 * @param weekRange - The week's start and end dates
 * @returns Units (pages or minutes) read/listened this week for this deadline
 */
export const calculateWeekProgressForDeadline = (
  deadline: ReadingDeadlineWithProgress,
  weekRange: { start: Dayjs; end: Dayjs }
): number => {
  const progressAtEndOfWeek = getMaxProgress(
    filterProgressInRange(deadline.progress, weekRange)
  );
  const progressAtStartOfWeek = getMaxProgress(
    filterProgressBeforeDate(deadline.progress, weekRange.start)
  );

  return Math.max(0, progressAtEndOfWeek - progressAtStartOfWeek);
};

/**
 * Calculates total progress this week from ALL deadlines (regardless of status)
 *
 * This counts all progress logged this week, whether the book is active,
 * overdue, paused, completed, DNF, etc. If you read 20 pages then paused
 * the book, those 20 pages still count.
 *
 * @param allDeadlines - All deadlines (any status)
 * @param format - 'reading' for physical/eBook, 'audio' for audiobooks
 * @param weekRange - Optional pre-computed week range (avoids redundant calls)
 * @returns Total units read/listened this week across all books
 */
export const calculateTotalProgressThisWeek = (
  allDeadlines: ReadingDeadlineWithProgress[],
  format: 'reading' | 'audio',
  weekRange?: { start: Dayjs; end: Dayjs }
): number => {
  const range = weekRange ?? getWeekDateRange();
  const filteredDeadlines = filterDeadlinesByFormat(allDeadlines, format);

  return filteredDeadlines.reduce((total, deadline) => {
    return total + calculateWeekProgressForDeadline(deadline, range);
  }, 0);
};

/**
 * Calculates days with activity this week from ALL deadlines
 *
 * @param allDeadlines - All deadlines (any status)
 * @param format - 'reading' for physical/eBook, 'audio' for audiobooks
 * @param weekRange - Optional pre-computed week range (avoids redundant calls)
 * @returns Number of unique days with reading/listening activity (0-7)
 */
export const calculateDaysWithActivityThisWeek = (
  allDeadlines: ReadingDeadlineWithProgress[],
  format: 'reading' | 'audio',
  weekRange?: { start: Dayjs; end: Dayjs }
): number => {
  const range = weekRange ?? getWeekDateRange();
  const filteredDeadlines = filterDeadlinesByFormat(allDeadlines, format);

  const allWeekProgress = filteredDeadlines.flatMap(deadline =>
    filterProgressInRange(deadline.progress, range)
  );

  return countDaysWithActivity(allWeekProgress);
};

/**
 * Interface for the goal calculation results
 */
export interface WeeklyGoalResult {
  unitsNeeded: number;
  requiredDailyPace: number;
}

/**
 * Calculates weekly goal based on active deadlines only
 *
 * Goals are based on books that were active at the beginning of the week,
 * giving users a stable target to work toward.
 *
 * @param activeDeadlines - Active deadlines (status='reading')
 * @param completedDeadlines - Completed deadlines (to include books completed this week)
 * @param format - 'reading' for physical/eBook, 'audio' for audiobooks
 * @param weekRange - Optional pre-computed week range (avoids redundant calls)
 * @returns Weekly goal (units needed) and required daily pace
 */
export const calculateWeeklyGoalForActiveDeadlines = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[],
  format: 'reading' | 'audio',
  weekRange?: { start: Dayjs; end: Dayjs }
): WeeklyGoalResult => {
  const range = weekRange ?? getWeekDateRange();

  // Filter active books by format and status
  const activeBooks = filterDeadlinesByFormat(activeDeadlines, format).filter(
    d => {
      const latestStatus =
        d.status && d.status.length > 0
          ? d.status[d.status.length - 1]?.status
          : null;
      return latestStatus === 'reading';
    }
  );

  // Get books completed this week (they contributed to goals earlier)
  const completedThisWeekBooks = filterDeadlinesByFormat(
    completedDeadlines,
    format
  ).filter(d => getCompletionDateThisWeek(d) !== null);

  const allRelevantBooks = [...activeBooks, ...completedThisWeekBooks];

  if (allRelevantBooks.length === 0) {
    return { unitsNeeded: 0, requiredDailyPace: 0 };
  }

  let totalUnitsNeeded = 0;
  let totalRequiredDailyPace = 0;

  for (const deadline of allRelevantBooks) {
    const readingStartDate = getReadingStartDate(deadline);
    if (!readingStartDate) continue;

    const startDate = normalizeServerDate(readingStartDate).startOf('day');
    const deadlineDate = normalizeServerDate(deadline.deadline_date).startOf(
      'day'
    );

    const totalTimelineDays = deadlineDate.diff(startDate, 'day');
    if (totalTimelineDays <= 0) continue;

    // Check if completed this week
    const completionDate = getCompletionDateThisWeek(deadline);

    // Find progress before this week started to calculate remaining
    const progressAtStartOfWeek = getMaxProgress(
      filterProgressBeforeDate(deadline.progress, range.start)
    );

    // Calculate forward-looking daily pace from start of week
    const remainingAtStartOfWeek =
      deadline.total_quantity - progressAtStartOfWeek;
    const daysLeftFromWeekStart = deadlineDate.diff(range.start, 'day');
    const requiredDailyPace =
      daysLeftFromWeekStart > 0
        ? remainingAtStartOfWeek / daysLeftFromWeekStart
        : remainingAtStartOfWeek;
    totalRequiredDailyPace += requiredDailyPace;

    // Calculate weekly goal (adjusted if completed mid-week)
    const weeklyGoal = calculateWeeklyGoalForDeadline(
      requiredDailyPace,
      range.start,
      completionDate
    );
    totalUnitsNeeded += weeklyGoal;
  }

  return {
    unitsNeeded: totalUnitsNeeded,
    requiredDailyPace: totalRequiredDailyPace,
  };
};

/**
 * Determines overall status based on progress percentage
 *
 * @param progressPercentage - Progress as percentage of goal (0-100+)
 * @returns Status: 'ahead', 'onTrack', or 'behind'
 */
export const calculateOverallStatus = (
  progressPercentage: number
): 'ahead' | 'onTrack' | 'behind' => {
  if (progressPercentage >= STATS_CONSTANTS.AHEAD_THRESHOLD) {
    return 'ahead';
  } else if (progressPercentage >= STATS_CONSTANTS.ON_TRACK_THRESHOLD) {
    return 'onTrack';
  }
  return 'behind';
};

/**
 * Calculates the weekly goal (units needed) for a specific deadline
 *
 * For books still in progress, the weekly goal is simply the daily pace × 7.
 * For books completed mid-week, the goal is prorated to only include days
 * from week start until completion.
 *
 * **Example**:
 * - Book requires 10 pages/day
 * - Completed on Tuesday (day 3 of week: Sunday, Monday, Tuesday)
 * - Weekly goal = 10 × 3 = 30 pages (not 70 pages)
 *
 * This prevents penalizing users for books completed earlier in the week.
 *
 * @param requiredDailyPace - Required daily pace for this book (pages or minutes per day)
 * @param weekStart - Start of the week (Sunday)
 * @param completionDate - Optional completion date if completed during this week
 * @returns Units needed for this week (prorated if completed mid-week)
 */
const calculateWeeklyGoalForDeadline = (
  requiredDailyPace: number,
  weekStart: Dayjs,
  completionDate?: string | null
): number => {
  if (completionDate) {
    // Book was completed during this week - calculate days from week start to completion
    const completion = normalizeServerDate(completionDate).startOf('day');
    const daysInWeekUntilCompletion = completion.diff(weekStart, 'day') + 1;
    return requiredDailyPace * Math.max(1, daysInWeekUntilCompletion);
  } else {
    // Book is still reading - full week goal
    return requiredDailyPace * 7;
  }
};

/**
 * Generic function to calculate weekly stats for any format
 *
 * **Calculation Method**:
 * - Progress: Counts ALL progress logged this week from ANY book (regardless of status)
 * - Goals: Based on active books only (books that were active at week start)
 * - Uses max() instead of latest progress entry to handle backwards tracking
 *
 * **Why Progress Counts All Books**:
 * If you read/listen then pause the book, that progress still counts toward
 * your weekly total. Same for overdue, DNF, or any other status.
 *
 * **Status Determination**:
 * - `ahead`: Progress >= 100% of weekly goal
 * - `onTrack`: Progress >= 95% of weekly goal
 * - `behind`: Progress < 95% of weekly goal
 */
const calculateWeeklyStatsForFormat = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[],
  allDeadlines: ReadingDeadlineWithProgress[],
  format: 'reading' | 'audio'
): WeeklyStats => {
  // Compute week range once and pass to all helpers
  const weekRange = getWeekDateRange();

  // Progress from ALL deadlines (regardless of status)
  const totalProgress = calculateTotalProgressThisWeek(
    allDeadlines,
    format,
    weekRange
  );

  // Goals from active deadlines only (gives users a stable target)
  const { unitsNeeded, requiredDailyPace } = calculateWeeklyGoalForActiveDeadlines(
    activeDeadlines,
    completedDeadlines,
    format,
    weekRange
  );

  // Activity days from all deadlines
  const daysWithActivity = calculateDaysWithActivityThisWeek(
    allDeadlines,
    format,
    weekRange
  );

  // Derived stats
  const daysElapsed = getDaysElapsedThisWeek();
  const unitsAheadBehind = totalProgress - unitsNeeded;
  const averagePerDay = daysElapsed > 0 ? totalProgress / daysElapsed : 0;
  const progressPercentage =
    unitsNeeded > 0 ? (totalProgress / unitsNeeded) * 100 : 0;

  // If there's no goal, you're on track (nothing required)
  const overallStatus =
    unitsNeeded === 0 ? 'onTrack' : calculateOverallStatus(progressPercentage);

  return {
    unitsReadThisWeek: Math.round(totalProgress),
    unitsNeededThisWeek: Math.round(unitsNeeded),
    unitsAheadBehind: Math.round(unitsAheadBehind),
    averagePerDay: Math.round(averagePerDay),
    requiredDailyPace: Math.round(requiredDailyPace),
    daysWithActivity,
    daysElapsedThisWeek: daysElapsed,
    progressPercentage: Math.round(progressPercentage),
    overallStatus,
  };
};

/**
 * Calculates weekly reading statistics for physical and eBook formats
 *
 * @param activeDeadlines - Active deadlines (for goal calculation)
 * @param completedDeadlines - Completed deadlines (for goal calculation)
 * @param allDeadlines - All deadlines (for progress calculation - any status counts)
 * @returns Weekly reading statistics with progress, pace, and status
 */
export const calculateWeeklyReadingStats = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[],
  allDeadlines: ReadingDeadlineWithProgress[]
): WeeklyStats =>
  calculateWeeklyStatsForFormat(
    activeDeadlines,
    completedDeadlines,
    allDeadlines,
    'reading'
  );

/**
 * Calculates weekly listening statistics for audio format
 *
 * @param activeDeadlines - Active deadlines (for goal calculation)
 * @param completedDeadlines - Completed deadlines (for goal calculation)
 * @param allDeadlines - All deadlines (for progress calculation - any status counts)
 * @returns Weekly listening statistics with progress, pace, and status
 */
export const calculateWeeklyListeningStats = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[],
  allDeadlines: ReadingDeadlineWithProgress[]
): WeeklyStats =>
  calculateWeeklyStatsForFormat(
    activeDeadlines,
    completedDeadlines,
    allDeadlines,
    'audio'
  );

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
  format: 'reading' | 'audio'
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
  for (const deadline of filteredDeadlines) {
    for (const entry of deadline.progress) {
      if (entry.ignore_in_calcs) {
        continue;
      }

      const entryDate = normalizeServerDate(entry.created_at);
      const isInRange =
        entryDate.isSameOrAfter(dateRange.start) &&
        entryDate.isSameOrBefore(dateRange.end);

      // Check if entry is within date range
      if (isInRange) {
        const dayOfWeek = entryDate.day(); // 0 = Sunday, 6 = Saturday
        dayMap.get(dayOfWeek)!.push(entry);
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
 * Generic function to calculate most productive days for any format
 *
 * Analyzes activity across the last 2 weeks (excluding current week)
 * to identify which days of the week tend to be most productive.
 *
 * **Methodology**:
 * 1. Filters deadlines by format
 * 2. Groups all progress entries by day of week (Sun-Sat)
 * 3. Calculates total units on each day across all books
 * 4. Ranks days by total units
 * 5. Returns top 3 days with activity
 *
 * @param activeDeadlines - Currently active deadlines
 * @param completedDeadlines - Completed deadlines
 * @param format - 'reading' for physical/eBook, 'audio' for audiobooks
 * @returns Statistics for the top 3 most productive days
 */
const calculateMostProductiveDays = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[],
  format: 'reading' | 'audio'
): ProductiveDaysStats => {
  const dateRange = getHistoricalProductivityDateRange();
  const allDeadlines = [...activeDeadlines, ...completedDeadlines];

  const dayMap = groupProgressByDayOfWeek(allDeadlines, dateRange, format);
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

  // Create DayProductivity objects
  const allDays: DayProductivity[] = DAY_NAMES.map((dayName, i) => ({
    dayName,
    dayAbbrev: DAY_ABBREVS[i],
    dayIndex: i,
    totalUnits: totalsByDay.get(i) || 0,
    percentOfMax: 0,
  }));

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
 * Calculates the most productive days for reading (physical and eBook)
 *
 * @param activeDeadlines - Currently active reading deadlines
 * @param completedDeadlines - Completed reading deadlines
 * @returns Statistics for the top 3 most productive reading days
 */
export const calculateMostProductiveReadingDays = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[]
): ProductiveDaysStats =>
  calculateMostProductiveDays(activeDeadlines, completedDeadlines, 'reading');

/**
 * Calculates the most productive days for listening (audiobooks)
 *
 * @param activeDeadlines - Currently active reading deadlines
 * @param completedDeadlines - Completed reading deadlines
 * @returns Statistics for the top 3 most productive listening days
 */
export const calculateMostProductiveListeningDays = (
  activeDeadlines: ReadingDeadlineWithProgress[],
  completedDeadlines: ReadingDeadlineWithProgress[]
): ProductiveDaysStats =>
  calculateMostProductiveDays(activeDeadlines, completedDeadlines, 'audio');

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

  // Create DayProductivity objects
  const allDays: DayProductivity[] = DAY_NAMES.map((dayName, i) => ({
    dayName,
    dayAbbrev: DAY_ABBREVS[i],
    dayIndex: i,
    totalUnits: totalsByDay.get(i) || 0,
    percentOfMax: 0,
  }));

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
