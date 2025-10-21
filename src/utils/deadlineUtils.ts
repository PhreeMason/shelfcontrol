import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateLocalDaysLeft,
  normalizeServerDate,
  normalizeServerDateStartOfDay,
} from './dateNormalization';
import { calculateTotalQuantity } from './deadlineCalculations';
import {
  sortByDateField,
  sortDeadlines,
  sortByStatusDate,
  sortByPagesRemaining,
} from './sortUtils';
import {
  calculateRequiredPace,
  getPaceBasedStatus,
  UserListeningPaceData,
  UserPaceData,
} from './paceCalculations';
import { BOOK_FORMAT } from '@/constants/status';

/**
 * Separation Strategy
 * -------------------
 * Uses normalized local start-of-day for comparisons.
 * Completed deadlines moved to completed bucket; to_review deadlines moved to toReview bucket; overdue determined by deadline_date < today.
 */
export const separateDeadlines = (deadlines: ReadingDeadlineWithProgress[]) => {
  const active: ReadingDeadlineWithProgress[] = [];
  const overdue: ReadingDeadlineWithProgress[] = [];
  const completed: ReadingDeadlineWithProgress[] = [];
  const toReview: ReadingDeadlineWithProgress[] = [];
  const didNotFinish: ReadingDeadlineWithProgress[] = [];
  const pending: ReadingDeadlineWithProgress[] = [];
  const paused: ReadingDeadlineWithProgress[] = [];

  const today = dayjs().startOf('day');

  deadlines.forEach(deadline => {
    const sortedStatus = sortByDateField(
      deadline.status || [],
      'created_at',
      'asc'
    );
    const latestStatus =
      sortedStatus.length > 0
        ? sortedStatus[sortedStatus.length - 1].status
        : 'reading';

    const deadlineDate = normalizeServerDateStartOfDay(deadline.deadline_date);
    if (latestStatus === 'complete') {
      completed.push(deadline);
    } else if (latestStatus === 'to_review') {
      toReview.push(deadline);
    } else if (latestStatus === 'did_not_finish') {
      didNotFinish.push(deadline);
    } else if (latestStatus === 'pending') {
      pending.push(deadline);
    } else if (latestStatus === 'paused') {
      paused.push(deadline);
    } else if (deadlineDate.isBefore(today)) {
      overdue.push(deadline);
    } else {
      active.push(deadline);
    }
  });

  active.sort(sortDeadlines);
  overdue.sort((a, b) => sortByPagesRemaining(a, b, calculateProgress));
  completed.sort(sortByStatusDate);
  toReview.sort(sortByStatusDate);
  didNotFinish.sort(sortByStatusDate);
  pending.sort(sortDeadlines);
  paused.sort(sortDeadlines);

  return {
    active,
    overdue,
    completed,
    toReview,
    didNotFinish,
    pending,
    paused,
  };
};

/**
 * Days Left Calculation
 * ---------------------
 * Delegates to calculateLocalDaysLeft which uses normalization rules.
 */
export const calculateDaysLeft = (deadlineDate: string): number =>
  calculateLocalDaysLeft(deadlineDate);

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
    const latestTs = normalizeServerDate(latest.created_at || '').valueOf();
    const currentTs = normalizeServerDate(current.created_at || '').valueOf();
    return currentTs > latestTs ? current : latest;
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
  if (!totalQuantity) return 0;
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
  const now = dayjs();
  const month = now.month();
  const year = now.year();
  return deadlines.filter(deadline => {
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1]
        : null;
    if (latestStatus?.status !== 'complete') return false;
    const completion = normalizeServerDate(latestStatus.created_at || '');
    return (
      completion.isValid() &&
      completion.month() === month &&
      completion.year() === year
    );
  }).length;
};

/**
 * Get deadlines completed this year
 */
export const getCompletedThisYear = (
  deadlines: ReadingDeadlineWithProgress[]
): ReadingDeadlineWithProgress[] => {
  const now = dayjs();
  const year = now.year();
  return deadlines.filter(deadline => {
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1]
        : null;
    if (latestStatus?.status !== 'complete') return false;
    const completion = normalizeServerDate(latestStatus.created_at || '');
    return completion.isValid() && completion.year() === year;
  });
};

/**
 * Get count of deadlines that are on track
 * A deadline is "on track" if user's pace meets or exceeds required pace
 */
export const getOnTrackDeadlines = (
  deadlines: ReadingDeadlineWithProgress[],
  userPaceData: UserPaceData,
  userListeningPaceData: UserListeningPaceData
): number => {
  const today = dayjs().startOf('day');

  const active = deadlines.filter(d => {
    const latestStatus =
      d.status && d.status.length > 0
        ? d.status[d.status.length - 1]?.status
        : 'reading';
    const deadlineDate = normalizeServerDateStartOfDay(d.deadline_date);
    return latestStatus === 'reading' && !deadlineDate.isBefore(today);
  });

  return active.filter(d => {
    const progressPercentage = calculateProgressPercentage(d);
    const currentProgress = calculateProgress(d);
    const totalQuantity = calculateTotalQuantity(d.format, d.total_quantity);
    const daysLeft = calculateDaysLeft(d.deadline_date);

    const requiredPace = calculateRequiredPace(
      totalQuantity,
      currentProgress,
      daysLeft,
      d.format
    );

    const relevantPaceData =
      d.format === BOOK_FORMAT.AUDIO ? userListeningPaceData : userPaceData;
    const userPace = relevantPaceData.averagePace;

    const status = getPaceBasedStatus(
      userPace,
      requiredPace,
      daysLeft,
      progressPercentage
    );

    return status.level === 'good';
  }).length;
};
