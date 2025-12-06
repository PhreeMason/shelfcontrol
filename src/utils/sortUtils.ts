import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  normalizeServerDate,
  normalizeServerDateStartOfDay,
} from './dateNormalization';

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

export const sortByLastProgressUpdate = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress
) => {
  const getLatestProgressTimestamp = (
    deadline: ReadingDeadlineWithProgress
  ): number => {
    if (!deadline.progress || deadline.progress.length === 0) return 0;

    return deadline.progress.reduce((latest, current) => {
      const currentTs = normalizeServerDate(current.created_at || '').valueOf();
      return currentTs > latest ? currentTs : latest;
    }, 0);
  };

  const aTimestamp = getLatestProgressTimestamp(a);
  const bTimestamp = getLatestProgressTimestamp(b);

  // Most recent first (descending)
  if (aTimestamp !== bTimestamp) {
    return bTimestamp - aTimestamp;
  }

  // Tiebreaker: use standard deadline sort
  return sortDeadlines(a, b);
};
