import { BOOK_FORMAT } from '@/constants/status';
import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

export interface ReadingDay {
  date: string;
  pagesRead: number;
  format: 'physical' | 'eBook' | 'audio';
}

export interface ListeningDay {
  date: string;
  minutesListened: number;
  format: 'audio';
}

export interface UserPaceData {
  averagePace: number;
  readingDaysCount: number;
  isReliable: boolean;
  calculationMethod: 'recent_data' | 'default_fallback';
}

export interface UserListeningPaceData {
  averagePace: number; // minutes per day
  listeningDaysCount: number;
  isReliable: boolean;
  calculationMethod: 'recent_data' | 'default_fallback';
}

export interface PaceBasedStatus {
  color: 'green' | 'orange' | 'red';
  level: 'good' | 'approaching' | 'urgent' | 'overdue' | 'impossible';
  message: string;
}

const DAYS_TO_CONSIDER_FOR_PACE = 21;

interface ActivityDay {
  date: string;
  amount: number; // pages for reading, minutes for listening
}

/**
 * Shared utility to calculate pace using the "total amount divided by days between first and last" algorithm
 */
const calculatePaceFromActivityDays = (activityDays: ActivityDay[]): number => {
  const activityDaysCount = activityDays.length;
  if (activityDaysCount === 0) {
    return 0;
  }

  const totalAmount = activityDays.reduce((sum, day) => sum + day.amount, 0);

  // Count the number of days between the first and the last day
  const firstDay = new Date(activityDays[0].date);
  const lastDay = new Date(activityDays[activityDaysCount - 1].date);
  const daysBetween = Math.max(
    1,
    Math.ceil((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1 // +1 to include both first and last day
  );
  return totalAmount / daysBetween;
};

/**
 * Calculates the cutoff date based on the most recent progress across all filtered deadlines
 */
export const calculateCutoffTime = (
  deadlines: ReadingDeadlineWithProgress[]
): number | null => {
  const allProgressUpdates = deadlines.flatMap(d => d.progress || []);
  if (allProgressUpdates.length === 0) {
    return null;
  }
  allProgressUpdates.filter(p => p.current_progress);

  const allProgressUpdatesSorted = allProgressUpdates.sort(
    (a, b) =>
      new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
  );

  const cutoffDate = new Date(allProgressUpdatesSorted[0].created_at);
  cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_CONSIDER_FOR_PACE);
  return cutoffDate.getTime();
};

/**
 * Processes progress entries for a single book and accumulates daily progress
 */
export const processBookProgress = (
  book: ReadingDeadlineWithProgress,
  cutoffTime: number,
  dailyProgress: { [date: string]: number },
  _format?: 'physical' | 'eBook' | 'audio'
): void => {
  if (!book.progress || !Array.isArray(book.progress)) return;

  const progress = book.progress
    .slice()
    .sort(
      (a, b) =>
        new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
    );

  if (progress.length === 0) return;

  // Check if first progress was created at same time as deadline (initial progress)
  let baselineProgress = 0;
  const originalFirstDate = new Date(progress[0].created_at);
  if (originalFirstDate.getTime() === new Date(book.created_at).getTime()) {
    baselineProgress = progress[0].current_progress;
    progress.shift();
  }

  if (progress.length === 0) return;

  // Handle the first remaining progress entry separately because it has no previous entry
  // to compare to (baseline was removed). The loop below calculates differences between
  // consecutive entries, so we need this to capture the first entry's progress vs baseline.
  const firstProgress = progress[0];
  const firstDate = new Date(firstProgress.created_at);

  if (firstDate.getTime() >= cutoffTime) {
    const dateStr = firstDate.toISOString().slice(0, 10);
    const amount = firstProgress.current_progress - baselineProgress;
    if (amount > 0) {
      dailyProgress[dateStr] = (dailyProgress[dateStr] || 0) + amount;
    }
  }

  // Calculate differences between consecutive progress entries
  for (let i = 1; i < progress.length; i++) {
    const prev = progress[i - 1];
    const curr = progress[i];

    const endDate = new Date(curr.created_at).getTime();

    // Skip if the end date is before the cutoff
    if (endDate < cutoffTime) continue;

    const progressDiff = curr.current_progress - prev.current_progress;

    // Only assign the progress to the end date (when progress was recorded)
    const endDateObj = new Date(endDate);
    if (endDateObj.getTime() >= cutoffTime) {
      const dateStr = endDateObj.toISOString().slice(0, 10);
      dailyProgress[dateStr] = (dailyProgress[dateStr] || 0) + progressDiff;
    }
  }
};

export const getRecentReadingDays = (
  deadlines: ReadingDeadlineWithProgress[]
): ReadingDay[] => {
  const dailyProgress: { [date: string]: number } = {};

  // Filter to only physical and eBook deadlines (no audio mixing)
  const readingDeadlines = deadlines.filter(
    d => d.format === 'physical' || d.format === 'eBook'
  );

  const cutoffTime = calculateCutoffTime(readingDeadlines);
  if (cutoffTime === null) {
    return [];
  }

  readingDeadlines.forEach(book => {
    processBookProgress(book, cutoffTime, dailyProgress, book.format);
  });

  // Convert dictionary to sorted array
  return Object.entries(dailyProgress)
    .map(([date, pagesRead]) => ({
      date,
      pagesRead: Number(pagesRead.toFixed(2)),
      format: 'physical' as const,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculates user's reading pace based on the two-tier system from README.
 * The daily average of all non zero days within the last 14 days is used starting with the most recent non zero day.
 */
export const calculateUserPace = (
  deadlines: ReadingDeadlineWithProgress[]
): UserPaceData => {
  // Only include physical and eBook reading, not audio
  const recentReadingDays = getRecentReadingDays(deadlines);
  const readingDaysCount = recentReadingDays.length;
  if (readingDaysCount === 0) {
    return {
      averagePace: 0,
      readingDaysCount,
      isReliable: false,
      calculationMethod: 'default_fallback',
    };
  }

  // Convert ReadingDay[] to ActivityDay[] format
  const activityDays: ActivityDay[] = recentReadingDays.map(day => ({
    date: day.date,
    amount: day.pagesRead,
  }));

  const averagePace = calculatePaceFromActivityDays(activityDays);

  return {
    averagePace,
    readingDaysCount,
    isReliable: true,
    calculationMethod: 'recent_data',
  };
};

/**
 * Calculates the required daily pace to finish a deadline on time.
 */
export const calculateRequiredPace = (
  totalQuantity: number,
  currentProgress: number,
  daysLeft: number,
  _format: 'physical' | 'eBook' | 'audio'
): number => {
  const remaining = totalQuantity - currentProgress;

  if (daysLeft <= 0) return remaining;

  // No conversion - return required pace in native units (pages for books, minutes for audio)
  return Math.ceil(remaining / daysLeft);
};

/**
 * Determines status color and level based on pace comparison and README criteria.
 * Green: Current pace ≥ required pace AND >0 days remaining
 * Orange: Current pace < required pace AND gap ≤100% current pace AND >0 days remaining
 * Red: Overdue OR impossible pace (>100% increase needed) OR 0% progress with <3 days remaining
 */
export const getPaceBasedStatus = (
  userPace: number,
  requiredPace: number,
  daysLeft: number,
  progressPercentage: number
): PaceBasedStatus => {
  // Red conditions from README
  if (daysLeft <= 0) {
    return {
      color: 'red',
      level: 'overdue',
      message: 'Return or renew',
    };
  }

  if (progressPercentage === 0 && daysLeft < 3) {
    return {
      color: 'red',
      level: 'impossible',
      message: 'Start reading now',
    };
  }

  if (userPace < requiredPace) {
    const paceGap = requiredPace - userPace;
    const increaseNeeded = (paceGap / userPace) * 100;

    if (increaseNeeded > 100) {
      return {
        color: 'red',
        level: 'impossible',
        message: 'Pace too slow',
      };
    }

    // Orange: gap ≤100% current pace
    return {
      color: 'orange',
      level: 'approaching',
      message: 'Pick up the pace',
    };
  }

  // Green: current pace ≥ required pace AND >0 days remaining
  return {
    color: 'green',
    level: 'good',
    message: "You're on track",
  };
};

/**
 * Gets a detailed status message based on pace calculations.
 */
export const getPaceStatusMessage = (
  userPaceData: UserPaceData | UserListeningPaceData,
  requiredPace: number,
  status: PaceBasedStatus,
  format: 'physical' | 'eBook' | 'audio' = 'physical'
): string => {
  const paceDisplay = formatPaceDisplay(
    userPaceData.averagePace,
    format
  ).replace('/day', '');
  const requiredPaceDisplay = formatPaceDisplay(requiredPace, format).replace(
    '/day',
    ''
  );

  switch (status.level) {
    case 'overdue':
      return 'Return or renew';
    case 'impossible':
      if (userPaceData.calculationMethod === 'default_fallback') {
        return `Required: ${requiredPaceDisplay}/day`;
      }
      return `Current: ${paceDisplay} vs Required: ${requiredPaceDisplay}`;
    case 'urgent':
      return 'Tough timeline';
    case 'good':
      if (userPaceData.calculationMethod === 'default_fallback') {
        return `On track (default pace)`;
      }
      return `On track at ${paceDisplay}/day`;
    case 'approaching':
      const difference = formatPaceDisplay(
        requiredPace - userPaceData.averagePace,
        format
      );
      return `Read ~${difference} more`;
    default:
      return 'Good';
  }
};

/**
 * Formats pace for display, handling different book formats.
 */
export const formatPaceDisplay = (
  pace: number,
  format: 'physical' | 'eBook' | 'audio'
): string => {
  if (format === BOOK_FORMAT.AUDIO) {
    // Audio pace is already in minutes, no conversion needed
    const minutes = Math.round(pace);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m/day`;
    }
    return `${minutes}m/day`;
  }

  return `${Math.round(pace)} pages/day`;
};

/**
 * Gets listening days from the last 14 days for audio deadlines only based on most recent progress.
 * Returns minutes listened per day.
 */
export const getRecentListeningDays = (
  deadlines: ReadingDeadlineWithProgress[]
): ListeningDay[] => {
  const dailyProgress: { [date: string]: number } = {};

  // Filter to only audio deadlines
  const audioDeadlines = deadlines.filter(d => d.format === BOOK_FORMAT.AUDIO);

  const cutoffTime = calculateCutoffTime(audioDeadlines);
  if (cutoffTime === null) {
    return [];
  }

  audioDeadlines.forEach(book => {
    processBookProgress(book, cutoffTime, dailyProgress, book.format);
  });

  // Convert dictionary to sorted array
  return Object.entries(dailyProgress)
    .map(([date, minutesListened]) => ({
      date,
      minutesListened: Number(minutesListened.toFixed(2)),
      format: 'audio' as const,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculates user's listening pace based on recent audio book activity.
 * Uses the same algorithm as reading pace: total minutes divided by days between first and last listening day.
 */
export const calculateUserListeningPace = (
  deadlines: ReadingDeadlineWithProgress[]
): UserListeningPaceData => {
  const recentDays = getRecentListeningDays(deadlines);
  const listeningDaysCount = recentDays.length;

  if (listeningDaysCount === 0) {
    return {
      averagePace: 0,
      listeningDaysCount,
      isReliable: false,
      calculationMethod: 'default_fallback',
    };
  }

  // Convert ListeningDay[] to ActivityDay[] format
  const activityDays: ActivityDay[] = recentDays.map(day => ({
    date: day.date,
    amount: day.minutesListened,
  }));

  const averagePace = calculatePaceFromActivityDays(activityDays);

  return {
    averagePace,
    listeningDaysCount,
    isReliable: true,
    calculationMethod: 'recent_data',
  };
};

/**
 * Formats listening pace for display.
 */
export const formatListeningPaceDisplay = (pace: number): string => {
  const minutes = Math.round(pace);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m/day`;
  }
  return `${minutes}m/day`;
};

type PacePerDay = { value: number; label: string };

export const minimumUnitsPerDayFromDeadline = (
  deadline: ReadingDeadlineWithProgress
): PacePerDay[] => {
  if (!deadline.progress || deadline.progress.length === 0) {
    return [];
  }

  const pacePerDay: PacePerDay[] = [];
  const deadlineDate = new Date(deadline.deadline_date).getTime();
  const total = deadline.total_quantity;

  // Sort progress entries by date
  const sortedProgress = [...deadline.progress].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Filter progress entries to only include those before today
  const today = new Date().getTime();
  const progressBeforeToday = sortedProgress.filter(
    p => new Date(p.created_at).getTime() <= today
  );

  // Group by date and keep only the latest progress for each day
  const progressByDate = new Map<string, (typeof progressBeforeToday)[0]>();

  for (const progress of progressBeforeToday) {
    const dateKey = dayjs(progress.created_at).format('YYYY-MM-DD');
    const existing = progressByDate.get(dateKey);

    // Keep the progress entry with the latest timestamp for each date
    if (
      !existing ||
      new Date(progress.created_at).getTime() >
        new Date(existing.created_at).getTime()
    ) {
      progressByDate.set(dateKey, progress);
    }
  }

  // Convert back to array and sort by date
  const uniqueProgress = Array.from(progressByDate.values()).sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (const progress of uniqueProgress) {
    const progressDate = new Date(progress.created_at).getTime();
    const daysLeft = Math.ceil(
      (deadlineDate - progressDate) / (1000 * 60 * 60 * 24)
    );
    let value = 0;

    if (daysLeft > 0) {
      const remainingUnits = Math.max(0, total - progress.current_progress);
      value = Math.ceil(remainingUnits / daysLeft);
    }

    const label = dayjs(progress.created_at).format('M/D');
    pacePerDay.push({ value, label });
  }

  return pacePerDay;
};
