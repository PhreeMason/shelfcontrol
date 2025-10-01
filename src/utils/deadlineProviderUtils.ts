import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateCurrentProgress,
  calculateTotalQuantity,
  getPaceEstimate,
  getReadingEstimate,
} from '@/utils/deadlineCalculations';
import {
  calculateDaysLeft,
  calculateProgress,
  calculateProgressPercentage,
  getUnitForFormat,
} from '@/utils/deadlineUtils';
import {
  PaceBasedStatus,
  UserListeningPaceData,
  UserPaceData,
  calculateRequiredPace,
  formatPaceDisplay,
  getPaceBasedStatus,
  getPaceStatusMessage,
} from '@/utils/paceCalculations';
import { BOOK_FORMAT } from '@/constants/status';

// Types for function returns
export interface DeadlineStatus {
  latestStatus: string;
  isCompleted: boolean;
  isSetAside: boolean;
  isArchived: boolean;
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

// Extract deadline status determination
export function getDeadlineStatus(
  deadline: ReadingDeadlineWithProgress
): DeadlineStatus {
  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? deadline.status[deadline.status.length - 1].status ?? 'reading'
      : 'reading';

  const isCompleted = latestStatus === 'complete';
  const isSetAside = latestStatus === 'paused';
  const isArchived = isCompleted || isSetAside;

  return {
    latestStatus,
    isCompleted,
    isSetAside,
    isArchived,
  };
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
export function mapPaceColorToUrgencyColor(color: string): string {
  const paceColorToUrgencyColorMap: Record<string, string> = {
    green: '#10b981',
    orange: '#f59e0b',
    red: '#ef4444',
  };

  return paceColorToUrgencyColorMap[color] || '#7bc598';
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
    const progressDate = new Date(
      progress.updated_at || progress.created_at || ''
    );
    return progressDate <= startOfToday;
  });

  if (progressBeforeToday.length === 0) return 0;

  // Find the most recent progress entry before or at the start of today
  const latestProgress = progressBeforeToday.reduce((latest, current) => {
    const currentDate = new Date(
      current.updated_at || current.created_at || ''
    );
    const latestDate = new Date(latest.updated_at || latest.created_at || '');
    return currentDate > latestDate ? current : latest;
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

// Format audio units per day
export function formatAudioUnitsPerDay(
  units: number,
  actualUnitsPerDay: number,
  daysLeft: number
): string {
  // For audio: if less than 1 minute per day, show in week format when appropriate
  if (actualUnitsPerDay < 1 && daysLeft > 0) {
    const daysPerMinute = Math.round(1 / actualUnitsPerDay);

    // Convert to weeks if it makes sense
    if (daysPerMinute === 7) {
      return '1 minute/week';
    } else if (daysPerMinute === 14) {
      return '1 minute/2 weeks';
    } else if (daysPerMinute === 21) {
      return '1 minute/3 weeks';
    } else if (daysPerMinute === 28) {
      return '1 minute/month';
    } else if (daysPerMinute > 7 && daysPerMinute % 7 === 0) {
      const weeks = daysPerMinute / 7;
      return `1 minute/${weeks} weeks`;
    }

    return `1 minute every ${daysPerMinute} days`;
  }

  // For >= 1 minute/day, use standard formatting
  const hours = Math.floor(units / 60);
  const minutes = Math.round(units % 60);
  if (hours > 0) {
    return minutes > 0
      ? `${hours}h ${minutes}m/day needed`
      : `${hours}h/day needed`;
  }
  return `${Math.round(units)} minutes/day needed`;
}

// Format book units per day (physical/eBook)
export function formatBookUnitsPerDay(
  units: number,
  actualUnitsPerDay: number,
  daysLeft: number,
  format: 'physical' | 'eBook'
): string {
  // For physical/eBook: if less than 1 page per day, show in week format when appropriate
  if (actualUnitsPerDay < 1 && daysLeft > 0) {
    const daysPerPage = Math.round(1 / actualUnitsPerDay);

    // Convert to weeks if it makes sense
    if (daysPerPage === 7) {
      return '1 page/week';
    } else if (daysPerPage === 14) {
      return '1 page/2 weeks';
    } else if (daysPerPage === 21) {
      return '1 page/3 weeks';
    } else if (daysPerPage === 28) {
      return '1 page/month';
    } else if (daysPerPage > 7 && daysPerPage % 7 === 0) {
      const weeks = daysPerPage / 7;
      return `1 page/${weeks} weeks`;
    }

    return `1 page every ${daysPerPage} days`;
  }

  // For >= 1 page/day, use standard formatting
  const unit = getUnitForFormat(format);
  return `${Math.round(units)} ${unit}/day needed`;
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
      return minutes > 0
        ? `${hours}h ${minutes}m/day needed`
        : `${hours}h/day needed`;
    }
    return `${minutes} minutes/day needed`;
  }
  const unit = getUnitForFormat(format);
  return `${units} ${unit}/day needed`;
}

// Special formatting for DeadlineCard display - handles < 1 unit/day cases
export function formatUnitsPerDayForDisplay(
  units: number,
  format: 'physical' | 'eBook' | 'audio',
  remaining: number,
  daysLeft: number
): string {
  // Calculate the actual decimal value for precise formatting
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
    deadline.format === BOOK_FORMAT.AUDIO ? userListeningPaceData : userPaceData;
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
  readingEstimate: string;
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
  const readingEstimate = getReadingEstimate(deadline.format, remaining);
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
    readingEstimate,
    paceEstimate,
    unit,
    userPace: paceData.userPace,
    requiredPace: paceData.requiredPace,
    paceStatus: paceData.status.color,
    paceMessage: paceData.statusMessage,
  };
}
