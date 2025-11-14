/**
 * Utility functions for statistics and hero section calculations
 */

import {
  ReadingDeadlineWithProgress,
  ReadingDeadlineProgress,
} from '@/types/deadline.types';
import { WeeklyStats } from '@/types/stats.types';
import { normalizeServerDate } from './dateNormalization';
import { dayjs } from '@/lib/dayjs';
import type { Dayjs } from 'dayjs';
import { STATS_CONSTANTS } from '@/constants/statsConstants';

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
    return `-${formatValue(absValue)}`;
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
    return 'behind';
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
 * Checks if a deadline was completed or moved to review this week
 * @param deadline - The deadline to check
 * @returns The completion/review date if this week, null otherwise
 */
export const getCompletionDateThisWeek = (
  deadline: ReadingDeadlineWithProgress
): string | null => {
  if (!deadline.status || deadline.status.length === 0) return null;

  const { start, end } = getWeekDateRange();

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

  // Check if completion was this week (inclusive of boundaries)
  if (
    completionDate.isSameOrAfter(start) &&
    completionDate.isSameOrBefore(end)
  ) {
    return completionStatus.created_at;
  }

  return null;
};

/**
 * Filters progress entries to those created this week, optionally up to a completion date
 *
 * This function applies inclusive date boundaries (isSameOrAfter/isSameOrBefore) to ensure
 * progress entries exactly at week boundaries are included.
 *
 * **Filtering Rules**:
 * - Excludes entries with `ignore_in_calcs = true`
 * - Includes entries from week start (Sunday 00:00) to week end (Saturday 23:59)
 * - If completion date provided, only includes entries before or at completion time
 *
 * **Timezone Handling**:
 * - Server timestamps are normalized to local timezone via `normalizeServerDate()`
 * - Week boundaries are computed in local timezone
 * - Comparison uses `.isSameOrAfter(start)` and `.isSameOrBefore(end)` which compare
 *   dates in the same timezone (both local)
 * - This ensures entries at exactly Sunday 00:00:00 or Saturday 23:59:59 are included
 * - No timezone conversion occurs during comparison (both sides are local)
 *
 * **Edge Cases Handled**:
 * - Progress entry exactly at Sunday 00:00:00 → Included (isSameOrAfter)
 * - Progress entry exactly at Saturday 23:59:59 → Included (isSameOrBefore)
 * - Progress entry on Sunday from previous week (23:59 Sat) → Excluded
 * - Mid-week completion: Only counts progress up to completion timestamp
 *
 * @param deadline - The deadline with progress entries to filter
 * @param completionDate - Optional completion date to filter progress before (for mid-week completions)
 * @returns Array of progress entries from this week, excluding ignored entries
 */
const getProgressEntriesThisWeek = (
  deadline: ReadingDeadlineWithProgress,
  completionDate?: string | null
): ReadingDeadlineProgress[] => {
  const { start, end } = getWeekDateRange();

  return deadline.progress.filter(entry => {
    if (entry.ignore_in_calcs) return false;

    const entryDate = normalizeServerDate(entry.created_at);

    // Must be within this week (inclusive of boundaries)
    if (!entryDate.isSameOrAfter(start) || !entryDate.isSameOrBefore(end)) {
      return false;
    }

    // If book was completed this week, only count progress before or at completion
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
 * Calculates the weekly goal (units needed) for a specific deadline
 *
 * For books still in progress, the weekly goal is simply the daily pace × 7.
 * For books completed mid-week, the goal is prorated to only include days
 * from the week start until completion.
 *
 * **Example**:
 * - Book requires 10 pages/day
 * - Completed on Tuesday (day 3 of week: Sunday, Monday, Tuesday)
 * - Weekly goal = 10 × 3 = 30 pages (not 70 pages)
 *
 * This prevents penalizing users for books completed earlier in the week.
 *
 * @param requiredDailyPace - Required daily pace for this book (pages or minutes per day)
 * @param completionDate - Optional completion date if completed this week
 * @returns Units needed this week (prorated if completed mid-week)
 */
const calculateWeeklyGoalForDeadline = (
  requiredDailyPace: number,
  completionDate?: string | null
): number => {
  const { start } = getWeekDateRange();

  if (completionDate) {
    // Book was completed this week - calculate days from week start to completion
    const completion = normalizeServerDate(completionDate).startOf('day');
    const daysInWeekUntilCompletion = completion.diff(start, 'day') + 1;
    return requiredDailyPace * Math.max(1, daysInWeekUntilCompletion);
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
    const weeklyGoal = calculateWeeklyGoalForDeadline(
      requiredDailyPace,
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
    const weeklyGoal = calculateWeeklyGoalForDeadline(
      requiredDailyPace,
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
