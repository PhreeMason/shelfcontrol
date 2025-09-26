import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateLocalDaysLeft,
  normalizeServerDate,
  normalizeServerDateStartOfDay,
} from './dateNormalization';
import { calculateTotalQuantity } from './deadlineCalculations';

/**
 * Deadline Sorting Strategy (UTC -> Local Normalization)
 * -----------------------------------------------------
 * All server timestamp fields (created_at / updated_at) are ISO UTC strings.
 * We normalize them to LOCAL time via normalizeServerDate() before comparisons.
 * Date-only fields (deadline_date) remain local calendar dates with no timezone shift.
 * Priority order:
 * 1. Earliest deadline_date first
 * 2. Most recent updated_at
 * 3. Most recent created_at
 */
export const sortDeadlines = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress
) => {
  const aDue = normalizeServerDateStartOfDay(a.deadline_date);
  const bDue = normalizeServerDateStartOfDay(b.deadline_date);
  if (aDue.valueOf() !== bDue.valueOf()) return aDue.valueOf() - bDue.valueOf();

  const safeTs = (val?: string) => {
    const d = normalizeServerDate(val || '');
    return d.isValid() ? d.valueOf() : 0; // treat missing/invalid as epoch (oldest)
  };

  const aUpd = safeTs(a.updated_at);
  const bUpd = safeTs(b.updated_at);
  if (aUpd !== bUpd) return bUpd - aUpd;

  const aCreated = safeTs(a.created_at);
  const bCreated = safeTs(b.created_at);
  return bCreated - aCreated;
};

/**
 * Sorts deadlines by their latest status creation date (most recent first)
 */
const sortByStatusDate = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress
) => {
  const aStatus =
    a.status && a.status.length > 0 ? a.status[a.status.length - 1] : null;
  const bStatus =
    b.status && b.status.length > 0 ? b.status[b.status.length - 1] : null;
  const aDate = aStatus
    ? normalizeServerDate(aStatus.created_at || '')
    : dayjs(0);
  const bDate = bStatus
    ? normalizeServerDate(bStatus.created_at || '')
    : dayjs(0);
  return bDate.valueOf() - aDate.valueOf();
};

/**
 * Sorts overdue deadlines by the amount of pages/minutes remaining (ascending order - least remaining first)
 */
const sortByPagesRemaining = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress
) => {
  const aProgress = calculateProgress(a);
  const aTotal = calculateTotalQuantity(
    a.format,
    a.total_quantity,
    (a as any).total_minutes
  );
  const aRemaining = aTotal - aProgress;

  const bProgress = calculateProgress(b);
  const bTotal = calculateTotalQuantity(
    b.format,
    b.total_quantity,
    (b as any).total_minutes
  );
  const bRemaining = bTotal - bProgress;

  if (aRemaining !== bRemaining) return aRemaining - bRemaining;

  return sortDeadlines(a, b);
};

/**
 * Separation Strategy
 * -------------------
 * Uses normalized local start-of-day for comparisons.
 * Completed deadlines moved to completed bucket; set_aside deadlines moved to setAside bucket; overdue determined by deadline_date < today.
 */
export const separateDeadlines = (deadlines: ReadingDeadlineWithProgress[]) => {
  const active: ReadingDeadlineWithProgress[] = [];
  const overdue: ReadingDeadlineWithProgress[] = [];
  const completed: ReadingDeadlineWithProgress[] = [];
  const setAside: ReadingDeadlineWithProgress[] = [];
  const pending: ReadingDeadlineWithProgress[] = [];

  const today = dayjs().startOf('day');

  deadlines.forEach(deadline => {
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1].status
        : 'reading';

    const deadlineDate = normalizeServerDateStartOfDay(deadline.deadline_date);

    if (latestStatus === 'complete') {
      completed.push(deadline);
    } else if (latestStatus === 'set_aside') {
      setAside.push(deadline);
    } else if (latestStatus === 'requested') {
      pending.push(deadline);
    } else if (deadlineDate.isBefore(today)) {
      overdue.push(deadline);
    } else {
      active.push(deadline);
    }
  });

  active.sort(sortDeadlines);
  overdue.sort(sortByPagesRemaining);
  completed.sort(sortByStatusDate);
  setAside.sort(sortByStatusDate);
  pending.sort(sortDeadlines);

  return { active, overdue, completed, setAside, pending };
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
    const latestTs = normalizeServerDate(
      latest.updated_at || latest.created_at || ''
    ).valueOf();
    const currentTs = normalizeServerDate(
      current.updated_at || current.created_at || ''
    ).valueOf();
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
 * Get count of deadlines that are on track
 * A deadline is "on track" if its progress percentage is >= expected percentage based on time elapsed
 */
export const getOnTrackDeadlines = (
  deadlines: ReadingDeadlineWithProgress[]
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
    const deadlineDate = normalizeServerDateStartOfDay(d.deadline_date);
    const createdDate = normalizeServerDateStartOfDay(d.created_at);
    if (
      !createdDate.isValid() ||
      !deadlineDate.isValid() ||
      !deadlineDate.isAfter(createdDate)
    ) {
      return false;
    }
    const totalDays = Math.max(1, deadlineDate.diff(createdDate, 'day'));
    const daysPassed = totalDays - calculateDaysLeft(d.deadline_date);
    const timePassedPercentage = (daysPassed / totalDays) * 100;
    return progressPercentage >= timePassedPercentage;
  }).length;
};
