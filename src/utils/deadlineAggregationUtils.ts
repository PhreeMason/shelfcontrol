import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateProgressAsOfStartOfDay,
  calculateUnitsPerDay,
} from '@/utils/deadlineProviderUtils';
import { calculateDaysLeft } from '@/utils/deadlineUtils';

export interface DeadlineCalculationResult {
  unitsPerDay: number;
}

export interface DeadlineTotals {
  total: number;
  current: number;
}

export const calculateTotalUnitsForDeadlines = (
  deadlines: ReadingDeadlineWithProgress[],
  getCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult | null
): number => {
  return deadlines.reduce((total, deadline) => {
    const calculations = getCalculations(deadline);
    return total + (calculations?.unitsPerDay ?? 0);
  }, 0);
};

export const calculateCurrentProgressForDeadlines = (
  deadlines: ReadingDeadlineWithProgress[],
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): number => {
  return deadlines.reduce((total, deadline) => {
    const progress = getProgress(deadline);
    return total + (progress ?? 0);
  }, 0);
};

export const calculateDeadlineTotals = (
  deadlines: ReadingDeadlineWithProgress[],
  getCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult | null,
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): DeadlineTotals => ({
  total: calculateTotalUnitsForDeadlines(deadlines, getCalculations),
  current: calculateCurrentProgressForDeadlines(deadlines, getProgress),
});

export const calculateAudioTotals = (
  audioDeadlines: ReadingDeadlineWithProgress[],
  getCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult | null,
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): DeadlineTotals => {
  return calculateDeadlineTotals(audioDeadlines, getCalculations, getProgress);
};

export const calculateReadingTotals = (
  readingDeadlines: ReadingDeadlineWithProgress[],
  getCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult | null,
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): DeadlineTotals => {
  return calculateDeadlineTotals(
    readingDeadlines,
    getCalculations,
    getProgress
  );
};

/**
 * DUAL CALCULATION APPROACH FOR TODAY'S GOALS
 *
 * Problem: When deadlines are completed and archived, the standard getDeadlineCalculations
 * function returns 0 for unitsPerDay, causing daily goal totals to drop mid-day.
 *
 * Solution: Separate functions that calculate today's goals ignoring archive status,
 * ensuring daily goals remain stable throughout the day while progress tracking
 * still works correctly for completed items.
 */

/**
 * Calculates units per day for today's goals, ignoring archive status.
 * This ensures daily goal totals remain stable even when deadlines are completed.
 */
export const calculateTodaysGoalUnitsForDeadlines = (
  deadlines: ReadingDeadlineWithProgress[]
): number => {
  return deadlines.reduce((total, deadline) => {
    const currentProgressAsOfStartOfDay =
      calculateProgressAsOfStartOfDay(deadline);
    const daysLeft = calculateDaysLeft(deadline.deadline_date);

    const unitsPerDay = calculateUnitsPerDay(
      deadline.total_quantity,
      currentProgressAsOfStartOfDay,
      daysLeft,
      deadline.format
    );

    return total + unitsPerDay;
  }, 0);
};

/**
 * Calculates today's goal totals with stable daily goals that ignore completion status.
 * Uses the current progress calculation for accurate "current" values.
 *
 * @param deadlinesForGoals - Active deadlines only (used for calculating daily goal)
 * @param deadlinesForProgress - All deadlines (used for calculating today's progress)
 * @param getProgress - Function to get progress for a deadline
 */
export const calculateTodaysGoalTotals = (
  deadlinesForGoals: ReadingDeadlineWithProgress[],
  deadlinesForProgress: ReadingDeadlineWithProgress[],
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): DeadlineTotals => ({
  total: calculateTodaysGoalUnitsForDeadlines(deadlinesForGoals),
  current: calculateCurrentProgressForDeadlines(deadlinesForProgress, getProgress),
});

/**
 * Today's goal calculation for audio deadlines.
 * Maintains stable daily goals regardless of completion status.
 *
 * @param audioDeadlinesForGoals - Active audio deadlines (used for daily goal)
 * @param audioDeadlinesForProgress - All audio deadlines (used for progress tracking)
 * @param getProgress - Function to get progress for a deadline
 */
export const calculateTodaysAudioTotals = (
  audioDeadlinesForGoals: ReadingDeadlineWithProgress[],
  audioDeadlinesForProgress: ReadingDeadlineWithProgress[],
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): DeadlineTotals => {
  return calculateTodaysGoalTotals(audioDeadlinesForGoals, audioDeadlinesForProgress, getProgress);
};

/**
 * Today's goal calculation for reading deadlines.
 * Maintains stable daily goals regardless of completion status.
 *
 * @param readingDeadlinesForGoals - Active reading deadlines (used for daily goal)
 * @param readingDeadlinesForProgress - All reading deadlines (used for progress tracking)
 * @param getProgress - Function to get progress for a deadline
 */
export const calculateTodaysReadingTotals = (
  readingDeadlinesForGoals: ReadingDeadlineWithProgress[],
  readingDeadlinesForProgress: ReadingDeadlineWithProgress[],
  getProgress: (deadline: ReadingDeadlineWithProgress) => number | null
): DeadlineTotals => {
  return calculateTodaysGoalTotals(readingDeadlinesForGoals, readingDeadlinesForProgress, getProgress);
};

export interface DailyGoalImpact {
  currentGoal: number;
  projectedGoal: number;
  addition: number;
}

export const formatDailyGoalDisplay = (
  unitsPerDay: number,
  format: 'physical' | 'eBook' | 'audio'
): string => {
  if (format === 'audio') {
    const hours = Math.floor(unitsPerDay / 60);
    const minutes = Math.round(unitsPerDay % 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  }

  return `${Math.round(unitsPerDay)} pages`;
};
