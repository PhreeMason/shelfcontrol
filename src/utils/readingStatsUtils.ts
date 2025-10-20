import {
  ReadingDeadlineStatus,
  ReadingDeadlineWithProgress,
} from '@/types/deadline.types';
import { normalizeServerDate } from './dateNormalization';

export function getReadingStartDate(
  deadline: ReadingDeadlineWithProgress
): string | null {
  if (!deadline.status || deadline.status.length === 0) {
    return null;
  }

  const readingStatus = deadline.status.find(
    (s: ReadingDeadlineStatus) => s.status === 'reading'
  );

  return readingStatus?.created_at ?? null;
}

export function getCompletionDate(
  deadline: ReadingDeadlineWithProgress
): string | null {
  if (!deadline.status || deadline.status.length === 0) {
    return null;
  }

  const completionStatuses = ['complete', 'to_review', 'did_not_finish'];
  const completionStatus = deadline.status
    .slice()
    .reverse()
    .find((s: ReadingDeadlineStatus) =>
      completionStatuses.includes(s.status ?? '')
    );

  return completionStatus?.created_at ?? null;
}

export function calculateDaysToComplete(
  deadline: ReadingDeadlineWithProgress
): number | null {
  const startDate = getReadingStartDate(deadline);
  const completionDate = getCompletionDate(deadline);

  if (!startDate || !completionDate) {
    return null;
  }

  const start = normalizeServerDate(startDate).startOf('day');
  const completion = normalizeServerDate(completionDate).startOf('day');

  return Math.max(1, completion.diff(start, 'day'));
}

export function calculateAveragePace(
  deadline: ReadingDeadlineWithProgress
): number | null {
  const daysToComplete = calculateDaysToComplete(deadline);

  if (daysToComplete === null || daysToComplete === 0) {
    return null;
  }

  return Math.round(deadline.total_quantity / daysToComplete);
}

export function getReadingSessionCount(
  deadline: ReadingDeadlineWithProgress
): number {
  if (!deadline.progress || deadline.progress.length === 0) {
    return 0;
  }

  return deadline.progress.filter(p => !p.ignore_in_calcs).length;
}

export function formatBookFormat(
  format: 'physical' | 'eBook' | 'audio'
): string {
  const formatMap: Record<string, string> = {
    physical: 'Physical Book',
    eBook: 'eBook',
    audio: 'Audiobook',
  };

  return formatMap[format] || format;
}

export function formatAveragePace(
  pace: number | null,
  format: 'physical' | 'eBook' | 'audio'
): string {
  if (pace === null) {
    return 'N/A';
  }

  if (format === 'audio') {
    const hours = Math.floor(pace / 60);
    const minutes = pace % 60;

    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m/day` : `${hours}h/day`;
    }
    return `${pace} min/day`;
  }

  return `${pace} pages/day`;
}

export function getCompletionStatusLabel(
  status: string | null | undefined
): string {
  const statusMap: Record<string, string> = {
    complete: 'Finished Reading',
    to_review: 'Finished Reading',
    did_not_finish: 'Did Not Finish',
  };

  return statusMap[status ?? ''] || 'Finished Reading';
}
