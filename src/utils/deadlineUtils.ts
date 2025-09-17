import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateDaysLeft as calculateDaysLeftUtil,
  isDateBefore,
} from './dateUtils';
import { calculateTotalQuantity } from './deadlineCalculations';

/**
 * Sorts deadlines by priority: first by due date (earliest first), then by updated_at (most recent first),
 * and finally by created_at (most recent first).
 * @param a - First deadline to compare
 * @param b - Second deadline to compare
 * @returns A negative value if a should come before b, positive if a should come after b, or 0 if equal
 */
export const sortDeadlines = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress
) => {
  // First sort by due date (deadline_date)
  const aDueDate = new Date(a.deadline_date);
  const bDueDate = new Date(b.deadline_date);
  if (aDueDate.getTime() !== bDueDate.getTime()) {
    return aDueDate.getTime() - bDueDate.getTime();
  }

  // TODO: If due dates are equal sort by priority level if available
  // ....

  // TODO: If priority is equal sort by urgency level if available
  // ....

  // If due dates are equal, sort by updated_at
  const aUpdatedAt = a.updated_at ? new Date(a.updated_at) : new Date(0);
  const bUpdatedAt = b.updated_at ? new Date(b.updated_at) : new Date(0);
  if (aUpdatedAt.getTime() !== bUpdatedAt.getTime()) {
    return bUpdatedAt.getTime() - aUpdatedAt.getTime(); // Most recent first
  }

  // If updated_at dates are equal, sort by created_at
  const aCreatedAt = a.created_at ? new Date(a.created_at) : new Date(0);
  const bCreatedAt = b.created_at ? new Date(b.created_at) : new Date(0);
  return bCreatedAt.getTime() - aCreatedAt.getTime(); // Most recent first
};

/**
 * Separates deadlines into active, overdue, and completed categories.
 * Active and overdue are sorted by due date, while completed are sorted by last update.
 * @param deadlines - Array of deadlines to separate
 * @returns Object containing active, overdue, and completed deadline arrays
 */
export const separateDeadlines = (deadlines: ReadingDeadlineWithProgress[]) => {
  const active: ReadingDeadlineWithProgress[] = [];
  const overdue: ReadingDeadlineWithProgress[] = [];
  const completed: ReadingDeadlineWithProgress[] = [];

  deadlines.forEach(deadline => {
    // Get the latest status from the status array
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1].status
        : 'reading';

    if (latestStatus === 'complete' || latestStatus === 'set_aside') {
      completed.push(deadline);
    } else if (isDateBefore(deadline.deadline_date)) {
      overdue.push(deadline);
    } else {
      active.push(deadline);
    }
  });

  // Sort active and overdue by priority
  active.sort(sortDeadlines);
  overdue.sort(sortDeadlines);

  // Sort completed by most recently updated
  completed.sort((a, b) => {
    const aDate = a.updated_at ? new Date(a.updated_at) : new Date(0);
    const bDate = b.updated_at ? new Date(b.updated_at) : new Date(0);
    return bDate.getTime() - aDate.getTime();
  });

  return { active, overdue, completed };
};

/**
 * Calculates the number of days remaining until a deadline.
 * Returns a positive number for future dates and negative for past dates.
 * @param deadlineDate - The deadline date as a string
 * @returns Number of days left (positive) or overdue (negative)
 */
export const calculateDaysLeft = (deadlineDate: string): number => {
  return calculateDaysLeftUtil(deadlineDate);
};

/**
 * Calculates the current progress for a deadline by finding the most recent progress entry.
 * @param deadline - The deadline with its progress entries
 * @returns The current progress value, or 0 if no progress entries exist
 */
export const calculateProgress = (
  deadline: ReadingDeadlineWithProgress
): number => {
  if (!deadline.progress || deadline.progress.length === 0) return 0;

  const latestProgress = deadline.progress.reduce((latest, current) => {
    return new Date(current.updated_at || current.created_at || '') >
      new Date(latest.updated_at || latest.created_at || '')
      ? current
      : latest;
  });

  return latestProgress.current_progress || 0;
};

/**
 * Calculates the progress percentage for a deadline based on current progress and total quantity.
 * @param deadline - The deadline to calculate percentage for
 * @returns Progress percentage rounded to the nearest whole number
 */
export const calculateProgressPercentage = (
  deadline: ReadingDeadlineWithProgress
): number => {
  const currentProgress = calculateProgress(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  return Math.round((currentProgress / totalQuantity) * 100);
};

/**
 * Returns the appropriate unit for display based on the reading format.
 * @param format - The reading format (physical, eBook, or audio)
 * @returns The unit string ('minutes' for audio, 'pages' for physical/eBook)
 */
export const getUnitForFormat = (
  format: 'physical' | 'eBook' | 'audio'
): string => {
  switch (format) {
    case 'audio':
      return 'minutes';
    case 'physical':
    case 'eBook':
    default:
      return 'pages';
  }
};

/**
 * Formats progress display based on the reading format.
 * For audio books, converts minutes to hours and minutes format.
 * For physical/eBook, returns the progress as-is.
 * @param format - The reading format (physical, eBook, or audio)
 * @param progress - The progress value to format
 * @returns Formatted progress string
 */
export const formatProgressDisplay = (
  format: 'physical' | 'eBook' | 'audio',
  progress: number
): string => {
  if (format === 'audio') {
    const hours = Math.floor(progress / 60);
    const minutes = progress % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
  return `${progress}`;
};

/** * Extracts and validates an initial step number from search parameters.
 * Ensures the step is within specified bounds.
 * @param params - The search parameters object
 * @param paramName - The name of the parameter to extract (default: 'page')
 * @param defaultStep - The default step to return if parsing fails (default: 1)
 * @param minStep - The minimum allowed step (default: 1)
 * @param maxStep - The maximum allowed step (optional)
 * @returns The validated initial step number
 */

export function getInitialStepFromSearchParams(
  params: Record<string, any>,
  {
    paramName = 'page',
    defaultStep = 1,
    minStep = 1,
    maxStep,
  }: {
    paramName?: string;
    defaultStep?: number;
    minStep?: number;
    maxStep?: number;
  } = {}
): number {
  if (!params) return defaultStep;

  const raw = (params as any)[paramName];
  if (raw == null) return defaultStep;

  const valStr = Array.isArray(raw) ? raw[0] : raw;
  const parsed = parseInt(valStr, 10);

  if (Number.isNaN(parsed)) return defaultStep;

  let step = Math.max(minStep, parsed);
  if (maxStep) step = Math.min(maxStep, step);

  return step;
}

/**
 * Get count of deadlines completed this month
 */
export const getCompletedThisMonth = (
  deadlines: ReadingDeadlineWithProgress[]
): number => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return deadlines.filter(deadline => {
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1]
        : null;

    if (latestStatus?.status !== 'complete') return false;

    const completionDate = new Date(latestStatus.created_at);
    return (
      completionDate.getMonth() === currentMonth &&
      completionDate.getFullYear() === currentYear
    );
  }).length;
};

/**
 * Get count of deadlines that are on track
 * A deadline is "on track" if its progress percentage is >= expected percentage based on time elapsed
 */
export const getOnTrackDeadlines = (
  deadlines: ReadingDeadlineWithProgress[]
): number => {
  const activeDeadlines = deadlines.filter(deadline => {
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1]?.status
        : 'reading';

    return (
      latestStatus === 'reading' &&
      calculateDaysLeft(deadline.deadline_date) >= 0
    );
  });

  return activeDeadlines.filter(deadline => {
    const progressPercentage = calculateProgressPercentage(deadline);
    const daysLeft = calculateDaysLeft(deadline.deadline_date);

    const createdDate = new Date(deadline.created_at);
    const deadlineDate = new Date(deadline.deadline_date);
    const totalDays = Math.max(
      1,
      Math.ceil(
        (deadlineDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      )
    );

    const daysPassed = totalDays - daysLeft;
    const timePassedPercentage = (daysPassed / totalDays) * 100;

    return progressPercentage >= timePassedPercentage;
  }).length;
};
