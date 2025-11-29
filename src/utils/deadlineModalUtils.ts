import { BOOK_FORMAT } from '@/constants/status';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { UserListeningPaceData, UserPaceData } from './paceCalculations';
import {
  calculateProgress,
  calculateDaysLeft,
  getUnitForFormat,
} from './deadlineUtils';
import { calculateTotalQuantity } from './deadlineCalculations';
import { dayjs } from '@/lib/dayjs';
import { normalizeServerDate } from './dateNormalization';

export type QuickSelectType = 'week' | 'twoWeeks' | 'month' | 'endOfMonth';

export type FeasibilityLevel = 'comfortable' | 'tight' | 'notFeasible';

export interface ImpactData {
  daysRemaining: number;
  requiredPace: number;
  currentRequiredPace: number;
  paceChange: number;
  feasibility: FeasibilityLevel;
  unit: string;
}

export interface FeasibilityConfig {
  text: string;
  color: string;
  backgroundColor: string;
}

export interface ThemeColors {
  good: string;
  approaching: string;
  error: string;
}

export const getQuickSelectDate = (
  baseDate: Date,
  type: QuickSelectType
): Date => {
  const date = new Date(baseDate);
  switch (type) {
    case 'week':
      date.setDate(date.getDate() + 7);
      break;
    case 'twoWeeks':
      date.setDate(date.getDate() + 14);
      break;
    case 'month':
      date.setDate(date.getDate() + 30);
      break;
    case 'endOfMonth':
      date.setMonth(date.getMonth() + 1, 0);
      break;
  }
  return date;
};

export const calculateDeadlineImpact = (
  newDate: Date,
  deadline: ReadingDeadlineWithProgress,
  today: Date,
  userPaceData: UserPaceData,
  userListeningPaceData: UserListeningPaceData
): ImpactData => {
  const currentProgress = calculateProgress(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  const remaining = totalQuantity - currentProgress;

  const daysRemaining = Math.ceil(
    (newDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
  const currentDaysLeft = calculateDaysLeft(deadline.deadline_date);

  const requiredPace =
    daysRemaining > 0 ? Math.ceil(remaining / daysRemaining) : remaining;
  const currentRequiredPace =
    currentDaysLeft > 0 ? Math.ceil(remaining / currentDaysLeft) : remaining;
  const paceChange = requiredPace - currentRequiredPace;

  const unit = getUnitForFormat(deadline.format);

  const userPace =
    deadline.format === BOOK_FORMAT.AUDIO
      ? userListeningPaceData.averagePace
      : userPaceData.averagePace;

  let feasibility: FeasibilityLevel = 'comfortable';
  if (requiredPace > userPace * 2.0) {
    feasibility = 'notFeasible';
  } else if (requiredPace > userPace * 1.2) {
    feasibility = 'tight';
  }

  return {
    daysRemaining,
    requiredPace,
    currentRequiredPace,
    paceChange,
    feasibility,
    unit,
  };
};

export const getFeasibilityConfig = (
  level: FeasibilityLevel,
  colors: ThemeColors
): FeasibilityConfig => {
  switch (level) {
    case 'comfortable':
      return {
        text: '✓ Comfortable pace - plenty of time',
        color: colors.good,
        backgroundColor: colors.good + '20',
      };
    case 'tight':
      return {
        text: 'Tight - extra reading time needed',
        color: colors.approaching,
        backgroundColor: colors.approaching + '20',
      };
    case 'notFeasible':
      return {
        text: '✗ Not feasible at normal reading speed',
        color: colors.error,
        backgroundColor: colors.error + '20',
      };
  }
};

export const calculateDaysSpent = (
  deadline: ReadingDeadlineWithProgress
): number => {
  if (!deadline.progress || deadline.progress.length === 0) {
    return 0;
  }

  const validProgress = deadline.progress
    .filter(p => !p.ignore_in_calcs)
    .sort(
      (a, b) =>
        normalizeServerDate(a.created_at).valueOf() -
        normalizeServerDate(b.created_at).valueOf()
    );

  if (validProgress.length === 0) {
    return 0;
  }

  const firstDate = normalizeServerDate(validProgress[0].created_at);
  const lastDate = normalizeServerDate(
    validProgress[validProgress.length - 1].created_at
  );

  const daysBetween = Math.max(1, lastDate.diff(firstDate, 'day') + 1);

  return daysBetween;
};

export const calculateReadingDaysCount = (
  deadline: ReadingDeadlineWithProgress
): number => {
  if (!deadline.progress || deadline.progress.length === 0) {
    return 0;
  }

  const validProgress = deadline.progress.filter(p => !p.ignore_in_calcs);

  if (validProgress.length === 0) {
    return 0;
  }

  const uniqueDates = new Set(
    validProgress.map(p => {
      const date = normalizeServerDate(p.created_at);
      return date.format('YYYY-MM-DD');
    })
  );

  return uniqueDates.size;
};

export const calculateAveragePace = (
  deadline: ReadingDeadlineWithProgress
): number => {
  const daysSpent = calculateDaysSpent(deadline);
  if (daysSpent === 0) return 0;

  const currentProgress = calculateProgress(deadline);
  return Math.round(currentProgress / daysSpent);
};

export const calculateEarlyLateCompletion = (
  deadline: ReadingDeadlineWithProgress,
  completionDate?: string
): number => {
  const deadlineDate = normalizeServerDate(deadline.deadline_date);
  const actualDate = completionDate
    ? normalizeServerDate(completionDate)
    : dayjs();

  return deadlineDate.diff(actualDate, 'day');
};

export const formatTimeAgo = (dateString: string): string => {
  const date = normalizeServerDate(dateString);
  const now = dayjs();
  const diffDays = now.diff(date, 'day');
  const diffWeeks = now.diff(date, 'week');
  const diffMonths = now.diff(date, 'month');

  if (diffDays === 0) {
    return 'today';
  } else if (diffDays === 1) {
    return '1 day ago';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffWeeks === 1) {
    return '1 week ago';
  } else if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  } else if (diffMonths === 1) {
    return '1 month ago';
  } else {
    return `${diffMonths} months ago`;
  }
};

export const calculateTimeSinceAdded = (
  deadline: ReadingDeadlineWithProgress
): string => {
  return formatTimeAgo(deadline.created_at);
};
