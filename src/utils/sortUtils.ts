import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  normalizeServerDate,
  normalizeServerDateStartOfDay,
} from './dateNormalization';
import { calculateTotalQuantity } from './deadlineCalculations';

type DateField = 'created_at' | 'updated_at';
type SortOrder = 'asc' | 'desc';

interface WithDateFields {
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export function sortByDateField<T extends WithDateFields>(
  array: T[],
  field: DateField,
  order: SortOrder = 'desc'
): T[] {
  return [...array].sort((a, b) => {
    const aDate = a[field];
    const bDate = b[field];

    if (!aDate && !bDate) return 0;
    if (!aDate) return 1;
    if (!bDate) return -1;

    const aTime = new Date(aDate).getTime();
    const bTime = new Date(bDate).getTime();

    return order === 'desc' ? bTime - aTime : aTime - bTime;
  });
}

export const sortDeadlines = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress
) => {
  const aDue = normalizeServerDateStartOfDay(a.deadline_date);
  const bDue = normalizeServerDateStartOfDay(b.deadline_date);
  if (aDue.valueOf() !== bDue.valueOf()) return aDue.valueOf() - bDue.valueOf();

  const safeTs = (val?: string) => {
    const d = normalizeServerDate(val || '');
    return d.isValid() ? d.valueOf() : 0;
  };

  const aUpd = safeTs(a.updated_at);
  const bUpd = safeTs(b.updated_at);
  if (aUpd !== bUpd) return bUpd - aUpd;

  const aCreated = safeTs(a.created_at);
  const bCreated = safeTs(b.created_at);
  return bCreated - aCreated;
};

export const sortByStatusDate = (
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

export const sortByPagesRemaining = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress,
  calculateProgress: (deadline: ReadingDeadlineWithProgress) => number
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

  if (aRemaining !== bRemaining) {
    return aRemaining - bRemaining;
  }

  return sortDeadlines(a, b);
};

