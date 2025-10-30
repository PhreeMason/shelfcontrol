import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { calculateTotalQuantity } from './deadlineCalculations';
import {
  calculateProgressAsOfStartOfDay,
  calculateUnitsPerDay,
} from './deadlineProviderUtils';
import { calculateDaysLeft } from './deadlineCore';
import { sortDeadlines } from './sortUtils';

export const sortByPace = (
  a: ReadingDeadlineWithProgress,
  b: ReadingDeadlineWithProgress,
  order: 'asc' | 'desc' = 'asc'
) => {
  const aTotal = calculateTotalQuantity(a.format, a.total_quantity);
  const aProgress = calculateProgressAsOfStartOfDay(a);
  const aDaysLeft = calculateDaysLeft(a.deadline_date);
  const aPace = calculateUnitsPerDay(aTotal, aProgress, aDaysLeft, a.format);

  const bTotal = calculateTotalQuantity(b.format, b.total_quantity);
  const bProgress = calculateProgressAsOfStartOfDay(b);
  const bDaysLeft = calculateDaysLeft(b.deadline_date);
  const bPace = calculateUnitsPerDay(bTotal, bProgress, bDaysLeft, b.format);

  if (aPace !== bPace) {
    return order === 'desc' ? bPace - aPace : aPace - bPace;
  }

  return sortDeadlines(a, b);
};
