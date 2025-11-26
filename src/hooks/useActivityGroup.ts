import { dayjs } from '@/lib/dayjs';
import { DailyActivity } from '@/types/calendar.types';
import { convertMinutesToHoursAndMinutes } from '@/utils/audiobookTimeUtils';
import { calculateLocalDaysLeft } from '@/utils/dateNormalization';

/**
 * Hook for activity group business logic
 * Handles timestamp formatting and activity detail generation
 */
export function useActivityGroup() {
  /**
   * Format timestamp into exact time
   */
  const formatTimestamp = (timestamp: string): string => {
    const activityTime = dayjs(timestamp);
    const now = dayjs();
    const isToday = activityTime.isSame(now, 'day');

    // If today, show time only. Otherwise show date and time
    if (isToday) {
      return activityTime.format('h:mm A');
    } else {
      return activityTime.format('MMM D, h:mm A');
    }
  };

  /**
   * Format minutes as "Xh:Ym" format
   */
  const formatTimeAsHrMin = (minutes: number): string => {
    const { hours, minutes: mins } = convertMinutesToHoursAndMinutes(
      Math.round(minutes)
    );
    return `${hours}h:${mins}m`;
  };

  /**
   * Get formatted details string for an activity
   */
  const getActivityDetails = (activity: DailyActivity): string => {
    const { activity_type, metadata } = activity;

    // Status label mapping - shared across activity types
    const statusLabels: Record<string, string> = {
      reading: 'Reading',
      pending: 'Pending',
      complete: 'Complete',
      to_review: 'To Review',
      did_not_finish: 'DNF',
      paused: 'Paused',
    };

    switch (activity_type) {
      case 'deadline_due':
        // Show the current status of the deadline
        const status = metadata.status || 'reading';
        const deadlineDate = metadata.deadline_date;

        // Check if deadline is overdue using proper date normalization
        const isOverdue =
          deadlineDate && calculateLocalDaysLeft(deadlineDate) < 0;

        // Active statuses that can be overdue
        const activeStatuses = ['reading', 'pending', 'paused'];

        // If overdue and still in an active status, show "Past due"
        if (isOverdue && activeStatuses.includes(status)) {
          return `Status: Past due`;
        }

        // Otherwise show the actual status
        const statusLabel = statusLabels[status] || status;
        return `Status: ${statusLabel}`;

      case 'deadline_created':
        return `Added to reading list`;

      case 'progress':
        const progress = metadata.current_progress || 0;
        const previousProgress = metadata.previous_progress;
        const format = metadata.format || 'physical';

        if (format === 'audio') {
          // Audiobook: Show time in hr:mins format
          const currentTime = formatTimeAsHrMin(progress);

          // Calculate delta if we have previous progress
          if (previousProgress !== undefined && previousProgress !== null) {
            const delta = progress - previousProgress;

            // Handle zero delta
            if (delta === 0) {
              return `At ${currentTime}`;
            }

            // Handle negative delta (user went backwards)
            const absDelta = Math.abs(delta);
            const sign = delta > 0 ? '+' : '-';
            const deltaText = `${sign}${formatTimeAsHrMin(absDelta)}`;
            return `Listened ${deltaText} to ${currentTime}`;
          } else {
            return `Reached ${currentTime}`;
          }
        } else {
          // Page-based: Show page numbers
          const currentPage = Math.round(progress);

          // Calculate delta if we have previous progress
          if (previousProgress !== undefined && previousProgress !== null) {
            const delta = Math.round(progress - previousProgress);

            // Handle zero delta
            if (delta === 0) {
              return `At page ${currentPage}`;
            }

            const deltaText = delta > 0 ? `+${delta}` : `${delta}`;
            return `Read ${deltaText} pages to ${currentPage}`;
          } else {
            return `Reached page ${currentPage}`;
          }
        }

      case 'status':
        const rawStatus = metadata.status || 'Unknown';
        const formattedStatus = statusLabels[rawStatus] || rawStatus;

        // Show transition if we have previous status
        const previousStatus = metadata.previous_status;
        if (previousStatus !== undefined && previousStatus !== null) {
          const formattedPreviousStatus =
            statusLabels[previousStatus] || previousStatus;
          return `${formattedPreviousStatus} → ${formattedStatus}`;
        }

        return `Status: ${formattedStatus}`;

      case 'note':
        return metadata.note_text || '';

      case 'review':
        return `Posted on ${metadata.platform_name || 'platform'}`;

      default:
        return '';
    }
  };

  return {
    formatTimestamp,
    getActivityDetails,
  };
}
