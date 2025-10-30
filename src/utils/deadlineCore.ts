import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateLocalDaysLeft,
  normalizeServerDate,
} from './dateNormalization';
import { calculateTotalQuantity } from './deadlineCalculations';

export const calculateDaysLeft = (deadlineDate: string): number =>
  calculateLocalDaysLeft(deadlineDate);

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
