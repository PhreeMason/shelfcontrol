import { dayjs } from '@/lib/dayjs';
import {
  ReadingDeadlineProgress,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import {
  parseServerDateOnly,
  parseServerDateTime,
} from '@/utils/dateNormalization';
import {
  calculateCutoffTime,
  calculateRequiredPace,
  processBookProgress,
} from '@/utils/paceCalculations';

export interface ReadingDay {
  date: string;
  progressRead: number;
  format: 'physical' | 'eBook' | 'audio';
}

export interface ChartDataItem {
  value: number;
  label: string;
  frontColor: string;
  spacing: number;
  labelWidth: number;
  labelTextStyle: {
    color: string;
    fontSize: number;
    fontWeight: 'normal';
  };
  topLabelComponent: () => React.ReactElement;
}

export const getBookReadingDays = (
  deadline: ReadingDeadlineWithProgress
): ReadingDay[] => {
  const dailyProgress: { [date: string]: number } = {};
  if (!deadline.progress || !Array.isArray(deadline.progress)) return [];

  const cutoffTime = calculateCutoffTime([deadline]);
  if (cutoffTime === null) {
    return [];
  }

  processBookProgress(deadline, cutoffTime, dailyProgress, deadline.format);

  const result = Object.entries(dailyProgress)
    .map(([date, progressRead]) => ({
      date,
      progressRead: Number(progressRead.toFixed(2)),
      format: deadline.format as 'physical' | 'eBook' | 'audio',
    }))
    .sort((a, b) => parseServerDateOnly(a.date).valueOf() - parseServerDateOnly(b.date).valueOf());

  return result;
};

export const getAllUserReadingDays = (
  deadlines: ReadingDeadlineWithProgress[]
): ReadingDay[] => {
  const dailyProgress: { [date: string]: number } = {};

  const readingDeadlines = deadlines.filter(d => d.format !== 'audio');

  if (readingDeadlines.length === 0) return [];

  const cutoffTime = calculateCutoffTime(readingDeadlines);
  if (cutoffTime === null) {
    return [];
  }

  readingDeadlines.forEach(deadline => {
    processBookProgress(deadline, cutoffTime, dailyProgress, deadline.format);
  });

  const result = Object.entries(dailyProgress)
    .map(([date, progressRead]) => ({
      date,
      progressRead: Number(progressRead.toFixed(2)),
      format: 'physical' as const,
    }))
    .sort((a, b) => parseServerDateOnly(a.date).valueOf() - parseServerDateOnly(b.date).valueOf());

  return result;
};

export const getUnitLabel = (format: string): string => {
  switch (format) {
    case 'audio':
      return 'min';
    default:
      return 'pg';
  }
};

export const getChartTitle = (format: string): string => {
  switch (format) {
    case 'audio':
      return 'Daily Listening Progress';
    default:
      return 'Daily Reading Progress';
  }
};

export const transformReadingDaysToChartData = (
  readingDays: ReadingDay[],
  colors: { primary: string; text: string },
  topLabelComponentFactory: (value: number) => React.ReactElement
): ChartDataItem[] => {
  return readingDays.map(day => {
    const label = parseServerDateOnly(day.date).format('M/DD');
    return {
      value: Math.round(day.progressRead),
      label: label,
      frontColor: colors.primary,
      spacing: 2,
      labelWidth: 40,
      labelTextStyle: {
        color: colors.text,
        fontSize: 9,
        fontWeight: 'normal' as const,
      },
      topLabelComponent: () =>
        topLabelComponentFactory(Math.round(day.progressRead)),
    };
  });
};

export const calculateChartMaxValue = (
  chartData: ChartDataItem[],
  dailyMinimum: number
): number => {
  if (chartData.length === 0) return 10;

  const maxBarValue = Math.max(...chartData.map(d => d.value));
  const maxValue = Math.max(maxBarValue, dailyMinimum);
  return Math.ceil(maxValue * 1.2);
};

export const calculateDynamicBarWidth = (dataLength: number): number => {
  if (dataLength === 0) return 30;

  const calculatedWidth = Math.max(20, Math.min(30, 320 / dataLength));
  return Math.round(calculatedWidth);
};

export const getCurrentProgressFromDeadline = (
  deadline: ReadingDeadlineWithProgress
): number => {
  return deadline.progress?.length > 0
    ? deadline.progress[deadline.progress.length - 1].current_progress
    : 0;
};

export const calculateDaysLeft = (deadlineDate: string): number => {
  const deadline = new Date(deadlineDate);
  const today = new Date();
  return Math.max(
    1,
    Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  );
};

export const calculateDailyMinimum = (
  deadline: ReadingDeadlineWithProgress
): number => {
  const currentProgress = getCurrentProgressFromDeadline(deadline);
  const daysLeft = calculateDaysLeft(deadline.deadline_date);

  return calculateRequiredPace(
    deadline.total_quantity,
    currentProgress,
    daysLeft,
    deadline.format
  );
};

/**
 * Helper: Checks if progress array is already sorted by created_at (ascending)
 * @param progressArray - Array of progress records
 * @returns true if already sorted, false otherwise
 */
const isProgressArraySorted = (
  progressArray: ReadingDeadlineProgress[]
): boolean => {
  if (progressArray.length <= 1) return true;

  for (let i = 0; i < progressArray.length - 1; i++) {
    const currentTime = normalizeServerDate(progressArray[i].created_at).valueOf();
    const nextTime = normalizeServerDate(progressArray[i + 1].created_at).valueOf();
    if (currentTime > nextTime) {
      return false;
    }
  }
  return true;
};

/**
 * Gets the progress value for a deadline as of a specific historical date.
 * Uses date-only comparison (ignores time component) to determine progress state.
 *
 * @param progressArray - Array of progress records for a deadline
 * @param targetDate - The historical date to check (YYYY-MM-DD format)
 * @returns The current_progress value as of that date, or 0 if no progress
 *
 * @example
 * // Deadline has progress: [{ created_at: '2024-01-10', current_progress: 50 }, { created_at: '2024-01-15', current_progress: 100 }]
 * getProgressAsOfDate(progress, '2024-01-12') // Returns 50 (latest progress on or before Jan 12)
 * getProgressAsOfDate(progress, '2024-01-20') // Returns 100 (latest progress on or before Jan 20)
 * getProgressAsOfDate(progress, '2024-01-08') // Returns 0 (no progress yet)
 * getProgressAsOfDate(progress, '2024-01-25') // Returns 0 (future date, no progress "made" yet)
 */
export const getProgressAsOfDate = (
  progressArray: ReadingDeadlineProgress[] | undefined,
  targetDate: string
): number => {
  // Handle null/empty progress
  if (!progressArray || progressArray.length === 0) {
    return 0;
  }

  // Parse target date for comparison (date-only, local calendar)
  const targetDateDayjs = parseServerDateOnly(targetDate).startOf('day');
  const today = dayjs().startOf('day');

  // If target date is in the future, return 0 (no progress made yet on future date)
  if (targetDateDayjs.isAfter(today)) {
    return 0;
  }

  // Filter to progress on or before target date (date-only comparison)
  const relevantProgress = progressArray.filter(progress => {
    const progressDate = parseServerDateTime(progress.created_at).startOf(
      'day'
    );
    return (
      progressDate.isBefore(targetDateDayjs) ||
      progressDate.isSame(targetDateDayjs, 'day')
    );
  });

  if (relevantProgress.length === 0) {
    return 0;
  }

  // Sort by created_at (oldest to newest) only if not already sorted
  const sortedProgress = isProgressArraySorted(relevantProgress)
    ? relevantProgress
    : [...relevantProgress].sort((a, b) => {
        return (
          normalizeServerDate(a.created_at).valueOf() -
          normalizeServerDate(b.created_at).valueOf()
        );
      });

  // Remove baseline entries (ignore_in_calcs)
  const validProgress = sortedProgress.filter(p => !p.ignore_in_calcs);

  if (validProgress.length === 0) {
    return 0;
  }

  // Return the latest progress value as of target date
  return validProgress[validProgress.length - 1].current_progress;
};

/**
 * Filters deadlines that were active on a specific historical date.
 * A deadline is "active" if progress was recorded on that date.
 *
 * @param deadlines - Array of all user deadlines
 * @param targetDate - The historical date to check (YYYY-MM-DD)
 * @returns Filtered array of deadlines with progress on that date
 *
 * @example
 * // Returns only deadlines that had progress recorded on Jan 15
 * getDeadlinesActiveOnDate(allDeadlines, '2024-01-15')
 */
export const getDeadlinesActiveOnDate = (
  deadlines: ReadingDeadlineWithProgress[],
  targetDate: string
): ReadingDeadlineWithProgress[] => {
  const targetDateDayjs = parseServerDateOnly(targetDate).startOf('day');

  return deadlines.filter(deadline => {
    // Check if deadline has any progress on the target date
    if (!deadline.progress || deadline.progress.length === 0) {
      return false;
    }

    return deadline.progress.some(progress => {
      // Skip baseline progress
      if (progress.ignore_in_calcs) {
        return false;
      }

      const progressDate = parseServerDateTime(progress.created_at).startOf(
        'day'
      );
      return progressDate.isSame(targetDateDayjs, 'day');
    });
  });
};

/**
 * Calculates the required daily pace for a deadline as of a specific historical date.
 * Uses the progress state AT THE START of that day (i.e., progress as of previous day)
 * and calculates the pace needed from that morning onwards.
 *
 * This ensures that on completion day, the target shows what was needed that morning,
 * not 0 (which would be the case if we used progress at end of day).
 *
 * @param deadline - The deadline to calculate pace for
 * @param targetDate - The historical date (YYYY-MM-DD)
 * @returns Required pages or minutes per day as of the start of that date
 *
 * @example
 * // On Jan 10 morning, user had read 50 pages of 200-page book, deadline Jan 20
 * // Days left from Jan 10 = 10, remaining = 150 pages
 * // Required pace = Math.ceil(150/10) = 15 pages/day
 * calculateHistoricalRequiredPace(deadline, '2024-01-10') // Returns 15
 *
 * @example
 * // User completes book on Jan 15 (reads 150 pages that day)
 * // At START of Jan 15, user had 50 pages, needed 150 more in 5 days = 30 pages/day
 * // Target shows 30 pages/day for Jan 15 (not 0)
 * calculateHistoricalRequiredPace(deadline, '2024-01-15') // Returns 30
 */
export const calculateHistoricalRequiredPace = (
  deadline: ReadingDeadlineWithProgress,
  targetDate: string
): number => {
  // Get progress as of the PREVIOUS day (start of target date)
  const targetDateDayjs = parseServerDateOnly(targetDate).startOf('day');
  const previousDay = targetDateDayjs.subtract(1, 'day').format('YYYY-MM-DD');

  // Progress at the start of the target date = progress as of previous day
  const progressAsOfStartOfDay = getProgressAsOfDate(
    deadline.progress,
    previousDay
  );

  // Calculate days left from target date to deadline
  const deadlineDateDayjs = parseServerDateTime(deadline.deadline_date).startOf(
    'day'
  );
  const daysLeft = deadlineDateDayjs.diff(targetDateDayjs, 'day');

  // Use existing calculateRequiredPace function
  const pace = calculateRequiredPace(
    deadline.total_quantity,
    progressAsOfStartOfDay,
    daysLeft,
    deadline.format
  );

  return pace;
};

/**
 * Filters deadlines that were "in flight" (actively being worked on) as of a specific date.
 * These deadlines contribute to the target calculation for that day.
 *
 * A deadline is "in flight" if:
 * 0. Was created on or before that date (existed at that time)
 * 1. Status is 'reading' as of end of that day (latest status including all changes during the day)
 * 2. Not yet completed as of the START of that day (by progress)
 * 3. Deadline date >= that day (not overdue)
 *
 * @param deadlines - Array of all user deadlines
 * @param targetDate - The historical date to check (YYYY-MM-DD)
 * @returns Filtered array of deadlines that were in flight on that date
 *
 * @example
 * // On Jan 15, returns deadlines that:
 * // - Were created on or before Jan 15
 * // - Have status 'reading' as of end of Jan 15 (checks latest status change that day)
 * // - Not completed as of Jan 14 end of day
 * // - Have deadline_date >= Jan 15
 * getDeadlinesInFlightOnDate(allDeadlines, '2024-01-15')
 */
export const getDeadlinesInFlightOnDate = (
  deadlines: ReadingDeadlineWithProgress[],
  targetDate: string
): ReadingDeadlineWithProgress[] => {
  const targetDateDayjs = parseServerDateOnly(targetDate).startOf('day');

  const result = deadlines.filter(deadline => {
    // 0. Deadline must have been created on or before target date
    const createdAtDayjs = parseServerDateTime(deadline.created_at).startOf(
      'day'
    );
    if (createdAtDayjs.isAfter(targetDateDayjs)) {
      return false;
    }

    // 1. Check status as of end of that day - must be reading
    // Get the latest status on or before the end of the target date (including all changes during that day)
    const endOfTargetDay = targetDateDayjs.endOf('day');
    const statusAsOfDate = deadline.status
      ?.filter(s => {
        const statusTimestamp = parseServerDateTime(s.created_at);
        return (
          statusTimestamp.isBefore(endOfTargetDay) ||
          statusTimestamp.isSame(endOfTargetDay)
        );
      })
      .sort((a, b) => dayjs(b.created_at).diff(dayjs(a.created_at)))?.[0];

    const currentStatus = statusAsOfDate?.status || 'reading'; // Default to reading if no status

    // Only allow 'reading' status - exclude all others (pending, paused, complete, did_not_finish, to_review)
    if (currentStatus !== 'reading') {
      return false;
    }

    // 2. Not yet completed as of START of that day (by progress)
    const previousDay = targetDateDayjs.subtract(1, 'day').format('YYYY-MM-DD');
    const progressAsOfStartOfDay = getProgressAsOfDate(
      deadline.progress,
      previousDay
    );

    // If already completed before this day, exclude
    if (progressAsOfStartOfDay >= deadline.total_quantity) {
      return false;
    }

    // 3. Deadline date >= target date (not overdue)
    const deadlineDateDayjs = parseServerDateTime(
      deadline.deadline_date
    ).startOf('day');
    const isValid =
      deadlineDateDayjs.isAfter(targetDateDayjs) ||
      deadlineDateDayjs.isSame(targetDateDayjs, 'day');

    return isValid;
  });

  return result;
};

/**
 * Aggregates required daily targets for deadlines that are "in flight" on a specific date,
 * grouped by format (reading vs audio).
 *
 * Returns total pages/day needed across all reading deadlines and total minutes/day
 * needed across all audio deadlines.
 *
 * @param deadlines - Array of all user deadlines
 * @param targetDate - The historical date (YYYY-MM-DD)
 * @returns Object with targetPages (reading) and targetMinutes (audio)
 *
 * @example
 * // User has 3 books in flight on Jan 15:
 * // - Book A: needs 20 pages/day (physical)
 * // - Book B: needs 30 pages/day (eBook)
 * // - Audiobook C: needs 45 min/day (audio)
 * aggregateTargetsByFormat(allDeadlines, '2024-01-15')
 * // Returns: { targetPages: 50, targetMinutes: 45 }
 */
export const aggregateTargetsByFormat = (
  deadlines: ReadingDeadlineWithProgress[],
  targetDate: string
): { targetPages: number; targetMinutes: number } => {
  // Get deadlines that are "in flight" on this date
  const inFlightDeadlines = getDeadlinesInFlightOnDate(deadlines, targetDate);

  let targetPages = 0;
  let targetMinutes = 0;

  for (const deadline of inFlightDeadlines) {
    const requiredPace = calculateHistoricalRequiredPace(deadline, targetDate);

    if (deadline.format === 'audio') {
      targetMinutes += requiredPace;
    } else {
      // 'physical' or 'eBook' both count as pages
      targetPages += requiredPace;
    }
  }

  return {
    targetPages,
    targetMinutes,
  };
};

/**
 * Interface representing a single day's reading activity and targets
 */
export interface UserActivityDay {
  date: string; // YYYY-MM-DD format
  pagesRead: number; // Total pages read this day (physical + eBook)
  minutesListened: number; // Total minutes listened this day (audio)
  targetPages: number; // Required pages/day for all reading deadlines
  targetMinutes: number; // Required minutes/day for all audio deadlines
}

/**
 * Gets all user activity days with actual progress AND target metrics.
 * Returns only days where something happened (has progress OR has targets).
 *
 * Uses a 30-day lookback window from the most recent progress entry.
 *
 * @param deadlines - Array of all user deadlines
 * @returns Array of UserActivityDay sorted by date (oldest to newest)
 *
 * @example
 * const activityDays = getAllUserActivityDays(deadlines);
 * // Returns:
 * // [
 * //   { date: '2024-01-10', pagesRead: 50, minutesListened: 0, targetPages: 75, targetMinutes: 30 },
 * //   { date: '2024-01-12', pagesRead: 0, minutesListened: 45, targetPages: 75, targetMinutes: 30 },
 * //   ...
 * // ]
 */
export const getAllUserActivityDays = (
  deadlines: ReadingDeadlineWithProgress[]
): UserActivityDay[] => {
  if (!deadlines || deadlines.length === 0) {
    return [];
  }

  // Calculate 30-day cutoff time
  const cutoffTime = calculateCutoffTime(deadlines, 30);

  if (cutoffTime === null) {
    return [];
  }

  // Aggregate pages read (physical + eBook deadlines)
  const dailyPagesRead: { [date: string]: number } = {};
  const readingDeadlines = deadlines.filter(d => d.format !== 'audio');

  readingDeadlines.forEach(deadline => {
    processBookProgress(deadline, cutoffTime, dailyPagesRead, deadline.format);
  });

  // Aggregate minutes listened (audio deadlines)
  const dailyMinutesListened: { [date: string]: number } = {};
  const audioDeadlines = deadlines.filter(d => d.format === 'audio');

  audioDeadlines.forEach(deadline => {
    processBookProgress(
      deadline,
      cutoffTime,
      dailyMinutesListened,
      deadline.format
    );
  });

  // Get all unique dates from both maps
  const allDates = new Set<string>([
    ...Object.keys(dailyPagesRead),
    ...Object.keys(dailyMinutesListened),
  ]);

  // For each unique date, calculate targets and combine with actuals
  const activityDays: UserActivityDay[] = [];

  for (const date of allDates) {
    const pagesRead = dailyPagesRead[date] || 0;
    const minutesListened = dailyMinutesListened[date] || 0;

    // Calculate targets for this date
    const { targetPages, targetMinutes } = aggregateTargetsByFormat(
      deadlines,
      date
    );

    // Only include days with activity OR targets
    if (
      pagesRead > 0 ||
      minutesListened > 0 ||
      targetPages > 0 ||
      targetMinutes > 0
    ) {
      activityDays.push({
        date,
        pagesRead: Number(pagesRead.toFixed(2)),
        minutesListened: Number(minutesListened.toFixed(2)),
        targetPages,
        targetMinutes,
      });
    }
  }

  // Sort by date (oldest to newest)
  return activityDays.sort(
    (a, b) => parseServerDateOnly(a.date).valueOf() - parseServerDateOnly(b.date).valueOf()
  );
};
