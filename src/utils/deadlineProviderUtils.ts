import { BOOK_FORMAT } from '@/constants/status';
import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { normalizeServerDate } from '@/utils/dateNormalization';
import {
  calculateCurrentProgress,
  calculateTotalQuantity,
  getPaceEstimate,
} from '@/utils/deadlineCalculations';
import {
  calculateDaysLeft,
  calculateProgress,
  calculateProgressPercentage,
  getUnitForFormat,
} from '@/utils/deadlineCore';
import {
  PaceBasedStatus,
  UserListeningPaceData,
  UserPaceData,
  calculateRequiredPace,
  formatPaceDisplay,
  getPaceBasedStatus,
  getPaceStatusMessage,
} from '@/utils/paceCalculations';

// Types for function returns
export interface DeadlineStatus {
  latestStatus: string;
  isCompleted: boolean;
  isToReview: boolean;
  isArchived: boolean;
  isPending: boolean;
  isApplied: boolean;
  isPaused: boolean;
  isActive: boolean;
  isWithdrew: boolean;
  isRejected: boolean;
}

export interface DeadlineMetrics {
  currentProgress: number;
  totalQuantity: number;
  daysLeft: number;
  progressPercentage: number;
}

export interface PaceStatusResult {
  userPace: number;
  requiredPace: number;
  status: PaceBasedStatus;
  statusMessage: string;
  paceDisplay: string;
  requiredPaceDisplay: string;
  daysLeft: number;
  progressPercentage: number;
}

export function getDeadlineStatus(
  deadline: ReadingDeadlineWithProgress
): DeadlineStatus {
  let latestStatus = 'reading';

  if (deadline.status && deadline.status.length > 0) {
    const sortedStatuses = [...deadline.status].sort((a, b) => {
      const dateA = normalizeServerDate(a.created_at || '1970-01-01').valueOf();
      const dateB = normalizeServerDate(b.created_at || '1970-01-01').valueOf();
      return dateB - dateA;
    });
    latestStatus = sortedStatuses[0].status ?? 'reading';
  }

  const isCompleted = latestStatus === 'complete';
  const isDnf = latestStatus === 'did_not_finish';
  const isToReview = latestStatus === 'to_review';
  const isPending = latestStatus === 'pending';
  const isApplied = latestStatus === 'applied';
  const isPaused = latestStatus === 'paused';
  const isActive = latestStatus === 'reading';
  const isWithdrew = latestStatus === 'withdrew';
  const isRejected = latestStatus === 'rejected';
  const isArchived = isCompleted || isDnf;

  return {
    latestStatus,
    isCompleted,
    isToReview,
    isArchived,
    isPending,
    isApplied,
    isPaused,
    isActive,
    isWithdrew,
    isRejected,
  };
}

export function getPausedDate(
  deadline: ReadingDeadlineWithProgress
): string | null {
  if (!deadline.status || deadline.status.length === 0) {
    return null;
  }

  const pausedStatus = deadline.status
    .filter(s => s.status === 'paused')
    .sort((a, b) => {
      const dateA = normalizeServerDate(a.created_at || '1970-01-01').valueOf();
      const dateB = normalizeServerDate(b.created_at || '1970-01-01').valueOf();
      return dateB - dateA;
    })[0];

  if (!pausedStatus || !pausedStatus.created_at) {
    return null;
  }

  return normalizeServerDate(pausedStatus.created_at).format('MMMM D');
}

// Calculate basic deadline metrics
export function calculateDeadlineMetrics(
  deadline: ReadingDeadlineWithProgress
): DeadlineMetrics {
  const currentProgress = calculateProgress(deadline);
  const totalQuantity = calculateTotalQuantity(
    deadline.format,
    deadline.total_quantity
  );
  const daysLeft = calculateDaysLeft(deadline.deadline_date);
  const progressPercentage = calculateProgressPercentage(deadline);

  return {
    currentProgress,
    totalQuantity,
    daysLeft,
    progressPercentage,
  };
}

// Map pace status to urgency level for backward compatibility
export function mapPaceToUrgency(
  paceStatus: PaceBasedStatus,
  daysLeft: number
): 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible' {
  const paceToUrgencyMap: Record<
    string,
    'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible'
  > = {
    overdue: 'overdue',
    impossible: 'impossible',
    good: 'good',
    approaching: 'approaching',
  };

  return (
    paceToUrgencyMap[paceStatus.level] || (daysLeft <= 7 ? 'urgent' : 'good')
  );
}

// Map pace color to urgency color
// Uses theme colors to match DeadlineCard countdown and border colors
export function mapPaceColorToUrgencyColor(color: string): string {
  const paceColorToUrgencyColorMap: Record<string, string> = {
    green: '#7a5a8c', // Colors.light.good (dark purple)
    orange: '#d4a46a', // Colors.light.approaching (orange/gold)
    red: '#c8696e', // Colors.light.overdue (red)
  };

  return paceColorToUrgencyColorMap[color] || '#7a5a8c'; // Default to good color
}

// Calculate units per day needed based on format
export function calculateUnitsPerDay(
  totalQuantity: number,
  currentProgress: number,
  daysLeft: number,
  format: 'physical' | 'eBook' | 'audio'
): number {
  const total = calculateTotalQuantity(format, totalQuantity);
  const current = calculateCurrentProgress(format, currentProgress);
  const remaining = total - current;

  if (daysLeft <= 0) return remaining;
  return Math.ceil(remaining / daysLeft);
}

// Calculate progress as of the start of today (local time)
export function calculateProgressAsOfStartOfDay(
  deadline: ReadingDeadlineWithProgress
): number {
  if (!deadline.progress || deadline.progress.length === 0) return 0;

  const startOfToday = dayjs().startOf('day').toDate();

  // Filter progress entries to only include those from before or at the start of today
  const progressBeforeToday = deadline.progress.filter(progress => {
    const progressDate = normalizeServerDate(
      progress.created_at || '1970-01-01'
    );
    return (
      progressDate.isBefore(startOfToday) || progressDate.isSame(startOfToday)
    );
  });

  if (progressBeforeToday.length === 0) return 0;

  // Find the most recent progress entry before or at the start of today
  const latestProgress = progressBeforeToday.reduce((latest, current) => {
    const currentDate = normalizeServerDate(current.created_at || '1970-01-01');
    const latestDate = normalizeServerDate(latest.created_at || '1970-01-01');
    return currentDate.isAfter(latestDate) ? current : latest;
  });

  return latestProgress.current_progress || 0;
}

// Calculate how much progress was made today (since start of day)
export function calculateProgressForToday(
  deadline: ReadingDeadlineWithProgress
): number {
  const currentProgress = calculateProgress(deadline);
  const progressAtStartOfDay = calculateProgressAsOfStartOfDay(deadline);
  // Return the difference (progress made today)
  return Math.max(0, currentProgress - progressAtStartOfDay);
}

export function formatLowFrequency(
  daysPerUnit: number,
  unitName: string
): string {
  if (daysPerUnit === 7) {
    return `1 ${unitName}/week`;
  }
  if (daysPerUnit === 14) {
    return `1 ${unitName}/2 weeks`;
  }
  if (daysPerUnit === 21) {
    return `1 ${unitName}/3 weeks`;
  }
  if (daysPerUnit === 28) {
    return `1 ${unitName}/month`;
  }
  if (daysPerUnit > 7 && daysPerUnit % 7 === 0) {
    const weeks = daysPerUnit / 7;
    return `1 ${unitName}/${weeks} weeks`;
  }
  return `1 ${unitName} every ${daysPerUnit} days`;
}

export function formatTimeDisplay(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins} minute${mins !== 1 ? 's' : ''}`;
}

// Format audio units per day
export function formatAudioUnitsPerDay(
  units: number,
  actualUnitsPerDay: number,
  daysLeft: number
): string {
  if (actualUnitsPerDay === 0) {
    return '0 minutes/day';
  }

  if (actualUnitsPerDay < 1 && daysLeft > 0) {
    const daysPerMinute = Math.round(1 / actualUnitsPerDay);
    return formatLowFrequency(daysPerMinute, 'minute');
  }

  const hours = Math.floor(units / 60);
  const minutes = Math.round(units % 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m/day` : `${hours}h/day`;
  }
  return `${Math.round(units)} minutes/day`;
}

// Format book units per day (physical/eBook)
export function formatBookUnitsPerDay(
  units: number,
  actualUnitsPerDay: number,
  daysLeft: number,
  format: 'physical' | 'eBook'
): string {
  if (actualUnitsPerDay === 0) {
    return '0 pages/day';
  }

  if (actualUnitsPerDay < 1 && daysLeft > 0) {
    const daysPerPage = Math.round(1 / actualUnitsPerDay);
    return formatLowFrequency(daysPerPage, 'page');
  }

  const unit = getUnitForFormat(format);
  return `${Math.round(units)} ${unit}/day`;
}

// Format the units per day display based on format (original version for general use)
export function formatUnitsPerDay(
  units: number,
  format: 'physical' | 'eBook' | 'audio'
): string {
  if (format === 'audio') {
    const hours = Math.floor(units / 60);
    const minutes = units % 60;
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m/day` : `${hours}h/day`;
    }
    return `${minutes} minutes/day`;
  }
  const unit = getUnitForFormat(format);
  return `${units} ${unit}/day`;
}

// Special formatting for DeadlineCard display - handles < 1 unit/day cases
export function formatUnitsPerDayForDisplay(
  units: number,
  format: 'physical' | 'eBook' | 'audio',
  remaining: number,
  daysLeft: number
): string {
  if (format === BOOK_FORMAT.AUDIO) {
    if (remaining > 0 && remaining <= 30) {
      return `Just ${formatTimeDisplay(remaining)} left`;
    }
  } else {
    if (remaining > 0 && remaining <= 5) {
      return `Just ${remaining} page${remaining !== 1 ? 's' : ''} left`;
    }
  }

  const actualUnitsPerDay = daysLeft > 0 ? remaining / daysLeft : units;

  if (format === BOOK_FORMAT.AUDIO) {
    return formatAudioUnitsPerDay(units, actualUnitsPerDay, daysLeft);
  }

  return formatBookUnitsPerDay(units, actualUnitsPerDay, daysLeft, format);
}

// Determine which user pace data to use based on format
export function determineUserPace(
  format: 'physical' | 'eBook' | 'audio',
  userPaceData: UserPaceData,
  userListeningPaceData: UserListeningPaceData
): number {
  const relevantUserPaceData =
    format === BOOK_FORMAT.AUDIO ? userListeningPaceData : userPaceData;
  return relevantUserPaceData.averagePace;
}

// Build pace status result object
export function buildPaceStatusResult(
  userPace: number,
  requiredPace: number,
  status: PaceBasedStatus,
  statusMessage: string,
  format: 'physical' | 'eBook' | 'audio',
  daysLeft: number,
  progressPercentage: number
): PaceStatusResult {
  return {
    userPace,
    requiredPace,
    status,
    statusMessage,
    paceDisplay: formatPaceDisplay(userPace, format),
    requiredPaceDisplay: formatPaceDisplay(requiredPace, format),
    daysLeft,
    progressPercentage,
  };
}

// Calculate active deadline metrics
export function calculateActiveDeadlineMetrics(
  deadline: ReadingDeadlineWithProgress,
  currentProgressAsOfStartOfDay: number
) {
  const daysLeft = calculateDaysLeft(deadline.deadline_date);
  const unitsPerDay = calculateUnitsPerDay(
    deadline.total_quantity,
    currentProgressAsOfStartOfDay,
    daysLeft,
    deadline.format
  );

  return {
    daysLeft,
    unitsPerDay,
  };
}

// Create pace data for archived deadlines
export function createArchivedPaceData(statusMessage: string) {
  return {
    userPace: 0,
    requiredPace: 0,
    status: {
      color: 'green' as const,
      level: 'good' as const,
      message: statusMessage,
    },
    statusMessage: statusMessage,
  };
}

// Calculate deadline pace status
export function calculateDeadlinePaceStatus(
  deadline: ReadingDeadlineWithProgress,
  userPaceData: UserPaceData,
  userListeningPaceData: UserListeningPaceData
): PaceStatusResult {
  const metrics = calculateDeadlineMetrics(deadline);

  // Calculate required pace for this specific deadline
  const requiredPace = calculateRequiredPace(
    metrics.totalQuantity,
    metrics.currentProgress,
    metrics.daysLeft,
    deadline.format
  );

  // Determine which user pace to use
  const userPace = determineUserPace(
    deadline.format,
    userPaceData,
    userListeningPaceData
  );

  // Get status based on user's pace vs required pace
  const status = getPaceBasedStatus(
    userPace,
    requiredPace,
    metrics.daysLeft,
    metrics.progressPercentage
  );

  // Generate detailed status message
  const relevantUserPaceData =
    deadline.format === BOOK_FORMAT.AUDIO
      ? userListeningPaceData
      : userPaceData;
  const statusMessage = getPaceStatusMessage(
    relevantUserPaceData,
    requiredPace,
    status,
    deadline.format
  );

  return buildPaceStatusResult(
    userPace,
    requiredPace,
    status,
    statusMessage,
    deadline.format,
    metrics.daysLeft,
    metrics.progressPercentage
  );
}

// Main calculation result interface
export interface DeadlineCalculationResult {
  currentProgress: number;
  totalQuantity: number;
  remaining: number;
  progressPercentage: number;
  daysLeft: number;
  unitsPerDay: number;
  urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible';
  urgencyColor: string;
  statusMessage: string;
  paceEstimate: string;
  unit: string;
  userPace: number;
  requiredPace: number;
  paceStatus: 'green' | 'orange' | 'red';
  paceMessage: string;
}

// Create result object for deadline calculations
export function createDeadlineCalculationResult(
  deadline: ReadingDeadlineWithProgress,
  metrics: DeadlineMetrics,
  remaining: number,
  daysLeft: number,
  unitsPerDay: number,
  urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible',
  urgencyColor: string,
  statusMessage: string,
  paceData: {
    userPace: number;
    requiredPace: number;
    status: PaceBasedStatus;
    statusMessage: string;
  }
): DeadlineCalculationResult {
  const unit = getUnitForFormat(deadline.format);
  const paceEstimate = getPaceEstimate(
    deadline.format,
    new Date(deadline.deadline_date),
    remaining
  );

  return {
    currentProgress: metrics.currentProgress,
    totalQuantity: metrics.totalQuantity,
    remaining,
    progressPercentage: metrics.progressPercentage,
    daysLeft,
    unitsPerDay,
    urgencyLevel,
    urgencyColor,
    statusMessage,
    paceEstimate,
    unit,
    userPace: paceData.userPace,
    requiredPace: paceData.requiredPace,
    paceStatus: paceData.status.color,
    paceMessage: paceData.statusMessage,
  };
}
