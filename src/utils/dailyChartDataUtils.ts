/**
 * Utility functions for daily reading/listening chart calculations
 * Reuses calculation logic from statsUtils.ts hero card calculations
 */

import { Colors } from '@/constants/Colors';
import { dayjs } from '@/lib/dayjs';
import {
  DailyChartData,
  DailyProgressPoint,
  LineDataPoint,
  ProgressStatus,
} from '@/types/dailyChart.types';
import {
  ReadingDeadlineProgress,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import type { Dayjs } from 'dayjs';
import { normalizeServerDate } from './dateNormalization';
import { formatAudiobookTime } from './timeFormatUtils';

/**
 * Gets the date when a deadline was first moved to 'reading' status
 * REUSED FROM: statsUtils.ts (lines 39-56)
 * @param deadline - The deadline to check
 * @returns The created_at date of the first 'reading' status, or null if not found
 */
export const getReadingStartDate = (
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
 * Calculates the required daily pace using hero card formula
 * REUSED FROM: statsUtils.ts line 114 (requiredPace = total_quantity / totalTimelineDays)
 * @param deadline - The deadline to calculate pace for
 * @returns Required units per day, or null if cannot be calculated
 */
export const calculateRequiredDailyPace = (
  deadline: ReadingDeadlineWithProgress
): number | null => {
  const readingStartDate = getReadingStartDate(deadline);
  if (!readingStartDate) {
    return null;
  }

  const startDate = normalizeServerDate(readingStartDate).startOf('day');
  const deadlineDate = normalizeServerDate(deadline.deadline_date).startOf(
    'day'
  );

  // Calculate total timeline (days from start to deadline)
  const totalTimelineDays = deadlineDate.diff(startDate, 'day');

  if (totalTimelineDays <= 0) {
    return null;
  }

  // HERO CARD FORMULA: requiredPace = total_quantity / totalTimelineDays
  const requiredPace = deadline.total_quantity / totalTimelineDays;
  return requiredPace;
};

/**
 * Gets the actual cumulative progress as of a specific date
 * @param deadline - The deadline with progress entries
 * @param date - The date to check progress for
 * @returns Highest cumulative progress on or before this date
 */
export const getProgressAsOfDate = (
  deadline: ReadingDeadlineWithProgress,
  date: Dayjs
): number => {
  if (!deadline.progress || deadline.progress.length === 0) {
    return 0;
  }

  // Filter progress entries on or before this date (excluding ignored entries)
  const progressUpToDate = deadline.progress.filter(entry => {
    if (entry.ignore_in_calcs) return false;
    const entryDate = normalizeServerDate(entry.created_at).startOf('day');
    return entryDate.isBefore(date) || entryDate.isSame(date);
  });

  if (progressUpToDate.length === 0) {
    return 0;
  }

  // Return the highest progress value up to this date
  return Math.max(...progressUpToDate.map(p => p.current_progress));
};

/**
 * Checks if a specific date has any reading/listening activity
 * @param date - The date to check
 * @param progress - Array of progress entries
 * @returns True if there's any progress entry on this date
 */
export const hasDailyActivity = (
  date: Dayjs,
  progress: ReadingDeadlineProgress[]
): boolean => {
  const dateStr = date.format('YYYY-MM-DD');
  return progress.some(entry => {
    if (entry.ignore_in_calcs) return false;
    const entryDate = normalizeServerDate(entry.created_at).format(
      'YYYY-MM-DD'
    );
    return entryDate === dateStr;
  });
};

/**
 * Calculates daily cumulative progress for both actual and required using hero card logic
 * CALCULATION REUSED FROM: statsUtils.ts lines 118-121
 * - daysElapsed = date.diff(startDate, 'day') + 1
 * - expectedProgress = daysElapsed * requiredPace
 *
 * @param deadline - The deadline to calculate for
 * @param days - Number of days to include (default 7)
 * @param endDate - Optional end date to stop chart (e.g., completion date)
 * @returns Array of daily progress points
 */
export const calculateDailyCumulativeProgress = (
  deadline: ReadingDeadlineWithProgress,
  days: number = 7,
  endDate?: Dayjs
): DailyProgressPoint[] => {
  const readingStartDate = getReadingStartDate(deadline);
  const requiredPace = calculateRequiredDailyPace(deadline);

  if (!readingStartDate || requiredPace === null) {
    // Cannot calculate - return empty array
    return [];
  }

  const startDate = normalizeServerDate(readingStartDate).startOf('day');
  const today = dayjs().startOf('day');

  // Use the earlier of today or endDate as the last day to show
  const lastDay = endDate && endDate.isBefore(today) ? endDate : today;

  const points: DailyProgressPoint[] = [];

  // Generate data for last N days (including today or endDate)
  for (let i = days - 1; i >= 0; i--) {
    const currentDate = lastDay.subtract(i, 'day');

    // Don't include days before reading started
    if (currentDate.isBefore(startDate)) {
      continue;
    }

    // Don't include days after the end date
    if (endDate && currentDate.isAfter(endDate)) {
      continue;
    }

    // HERO CARD FORMULA (statsUtils line 118): Calculate days elapsed
    const daysElapsed = currentDate.diff(startDate, 'day') + 1;

    // HERO CARD FORMULA (statsUtils line 121): expectedProgress = daysElapsed * requiredPace
    const expectedProgress = daysElapsed * requiredPace;

    // Get actual cumulative progress as of this date
    const actualProgress = getProgressAsOfDate(deadline, currentDate);

    // Calculate daily actual (progress made on this specific day)
    const previousDate = currentDate.subtract(1, 'day');
    const previousProgress = currentDate.isAfter(startDate)
      ? getProgressAsOfDate(deadline, previousDate)
      : 0;
    const dailyActual = Math.max(0, actualProgress - previousProgress);

    // Check if had activity this day
    const hasActivity = hasDailyActivity(currentDate, deadline.progress);

    points.push({
      date: currentDate.format('M/DD'),
      fullDate: currentDate,
      required: expectedProgress,
      actual: actualProgress,
      dailyActual,
      hasActivity,
    });
  }

  return points;
};

/**
 * Calculates progress status (ahead/behind)
 * CALCULATION REUSED FROM: statsUtils.ts line 127
 * - aheadBehind = actualProgress - expectedProgress
 *
 * @param currentActual - Current actual cumulative progress
 * @param currentRequired - Current required cumulative progress
 * @param format - Book format for unit labeling
 * @param isCompleted - Whether the book is completed
 * @returns Progress status with formatted display text
 */
export const calculateProgressStatus = (
  currentActual: number,
  currentRequired: number,
  format: 'physical' | 'eBook' | 'audio',
  isCompleted?: boolean
): ProgressStatus => {
  // HERO CARD FORMULA (statsUtils line 127): aheadBehind = actualProgress - expectedProgress
  const difference = currentActual - currentRequired;
  const isAhead = difference > 0;

  // Handle completed books
  if (isCompleted) {
    return {
      difference,
      isAhead: true,
      displayText: 'Completed!',
      color: Colors.light.success,
    };
  }

  // Determine unit label and format value
  const absValue = Math.abs(Math.round(difference));
  let formattedValue: string;

  if (format === 'audio') {
    formattedValue = formatAudiobookTime(absValue);
  } else {
    formattedValue = `${absValue} ${absValue === 1 ? 'page' : 'pages'}`;
  }

  // Format display text
  let displayText: string;
  if (difference > 0) {
    displayText = `+${formattedValue} ahead`;
  } else if (difference < 0) {
    displayText = `${formattedValue} behind`;
  } else {
    displayText = 'On track';
  }

  // Determine color
  const color = isAhead ? Colors.light.successGreen : Colors.light.warningOrange;

  return {
    difference,
    isAhead,
    displayText,
    color,
  };
};

/**
 * Transforms daily progress points to LineChart data format
 * @param actualData - Actual progress points
 * @param requiredData - Required progress points
 * @param format - Book format for styling
 * @param isCompleted - Whether the book is completed
 * @returns Data ready for react-native-gifted-charts
 */
export const transformToDailyChartData = (
  actualData: DailyProgressPoint[],
  requiredData: DailyProgressPoint[],
  format: 'physical' | 'eBook' | 'audio',
  isCompleted?: boolean
): DailyChartData => {
  if (actualData.length === 0 || requiredData.length === 0) {
    return {
      actualLineData: [],
      requiredLineData: [],
      maxValue: 0,
      status: {
        difference: 0,
        isAhead: false,
        displayText: 'No data',
        color: '#9CA3AF',
      },
    };
  }

  // Transform actual data - use small radius for line connectivity, larger for activity days
  const actualLineData: LineDataPoint[] = actualData.map(point => ({
    value: point.actual,
    label: point.date,
    dataPointColor: Colors.light.primary,
    // Keep small radius (2) for all points to ensure solid line, larger (6) for activity days
    dataPointRadius: point.hasActivity ? 6 : 2,
  }));

  // Transform required data (simpler, no activity indicators)
  const requiredLineData: LineDataPoint[] = requiredData.map(point => ({
    value: point.required,
    label: point.date,
  }));

  // Calculate max value for y-axis
  const maxActual = Math.max(...actualData.map(p => p.actual));
  const maxRequired = Math.max(...requiredData.map(p => p.required));
  const maxValue = Math.max(maxActual, maxRequired);

  // Calculate current status
  const latestActual = actualData[actualData.length - 1];
  const latestRequired = requiredData[requiredData.length - 1];
  const status = calculateProgressStatus(
    latestActual.actual,
    latestRequired.required,
    format,
    isCompleted
  );

  return {
    actualLineData,
    requiredLineData,
    maxValue,
    status,
  };
};
