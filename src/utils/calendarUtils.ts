import { dayjs } from '@/lib/dayjs';
import { ACTIVITY_DOT_COLOR } from '@/constants/activityTypes';
import {
  AgendaActivityItem,
  DailyActivity,
  EnrichedActivity,
  MarkedDatesConfig,
} from '@/types/calendar.types';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { DeadlineCalculationResult } from '@/utils/deadlineProviderUtils';
import { parseServerDateTime } from '@/utils/dateNormalization';
import { posthog } from '@/lib/posthog';

/**
 * Calculate the start and end dates for a given month
 * @param date - Any date within the target month
 * @returns Object with startDate and endDate in YYYY-MM-DD format
 *
 * @example
 * getMonthDateRange(new Date('2025-01-15'))
 * // Returns: { startDate: '2025-01-01', endDate: '2025-01-31' }
 */
export function getMonthDateRange(date: Date): {
  startDate: string;
  endDate: string;
} {
  const dayjsDate = dayjs(date);
  const startDate = dayjsDate.startOf('month').format('YYYY-MM-DD');
  const endDate = dayjsDate.endOf('month').format('YYYY-MM-DD');

  return { startDate, endDate };
}

/**
 * Enrich a deadline_due activity with calculations from getDeadlineCalculations
 * @param activity - The activity to enrich
 * @param deadlines - Array of all deadlines
 * @param getDeadlineCalculations - Function to calculate deadline metrics
 * @returns Enriched activity with calculations
 */
export function enrichDeadlineActivity(
  activity: DailyActivity,
  deadlines: ReadingDeadlineWithProgress[],
  getDeadlineCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult
): EnrichedActivity {
  // Only enrich deadline_due activities
  if (activity.activity_type !== 'deadline_due') {
    return activity;
  }

  // Find the matching deadline
  const deadline = deadlines.find(d => d.id === activity.deadline_id);
  if (!deadline) {
    return activity;
  }

  // Get calculations for the deadline
  const calculations = getDeadlineCalculations(deadline);

  return {
    ...activity,
    deadlineCalculations: calculations,
  };
}

/**
 * Sort activities by deadline_due first (alphabetically), then by timestamp
 * @param activities - Array of activities to sort
 * @returns Sorted array of activities
 *
 * Sort rules:
 * 1. All deadline_due activities first (these are "all-day" items)
 * 2. Within deadline_due: sort alphabetically by book title
 * 3. Remaining activities: sort by activity_timestamp ascending
 */
export function sortActivitiesByTime(
  activities: EnrichedActivity[]
): EnrichedActivity[] {
  const deadlineDue = activities.filter(
    a => a.activity_type === 'deadline_due'
  );
  const otherActivities = activities.filter(
    a => a.activity_type !== 'deadline_due'
  );

  // Sort deadline_due alphabetically by book title
  deadlineDue.sort((a, b) => a.book_title.localeCompare(b.book_title));

  // Sort other activities by timestamp
  otherActivities.sort((a, b) => {
    const timeA = parseServerDateTime(a.activity_timestamp).valueOf();
    const timeB = parseServerDateTime(b.activity_timestamp).valueOf();
    return timeA - timeB;
  });

  return [...deadlineDue, ...otherActivities];
}

/**
 * Transform activities array to Agenda items format
 * @param activities - Array of activities from get_daily_activities
 * @param deadlines - Array of all deadlines
 * @param getDeadlineCalculations - Function to calculate deadline metrics
 * @returns Object keyed by date with arrays of agenda items
 *
 * @example
 * transformActivitiesToAgendaItems(activities, deadlines, getDeadlineCalculations)
 * // Returns: {
 * //   '2025-01-15': [
 * //     { name: 'The Great Gatsby', activityType: 'deadline_due', ... },
 * //     { name: 'Progress Update', activityType: 'progress', ... }
 * //   ],
 * //   '2025-01-16': [...]
 * // }
 */
export function transformActivitiesToAgendaItems(
  activities: DailyActivity[],
  deadlines: ReadingDeadlineWithProgress[],
  getDeadlineCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult
): Record<string, AgendaActivityItem[]> {
  // Group activities by date
  const groupedByDate: Record<string, DailyActivity[]> = {};

  activities.forEach(activity => {
    // Extract date in user's local timezone to avoid day-offset issues
    const date = parseServerDateTime(activity.activity_timestamp).format(
      'YYYY-MM-DD'
    );
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(activity);
  });

  // Transform each date's activities
  const result: Record<string, AgendaActivityItem[]> = {};

  Object.entries(groupedByDate).forEach(([date, dateActivities]) => {
    // Enrich deadline activities
    const enriched = dateActivities.map(activity =>
      enrichDeadlineActivity(activity, deadlines, getDeadlineCalculations)
    );

    // Sort activities
    const sorted = sortActivitiesByTime(enriched);

    // Transform to agenda items
    result[date] = sorted.map(activity => {
      const agendaItem: AgendaActivityItem = {
        name: activity.book_title,
        activityType: activity.activity_type,
        activity,
      };

      // Add deadline data for deadline_due items
      if (activity.activity_type === 'deadline_due') {
        const deadline = deadlines.find(d => d.id === activity.deadline_id);
        if (deadline && activity.deadlineCalculations) {
          agendaItem.deadline = deadline;
          agendaItem.calculations = activity.deadlineCalculations;
        }
      } else {
        // Add formatted timestamp for non-deadline items
        agendaItem.timestamp = formatActivityTime(activity.activity_timestamp);
      }

      return agendaItem;
    });
  });

  return result;
}

/**
 * Calculate marked dates for calendar with multi-dot support
 * @param activities - Array of activities from get_daily_activities
 * @param deadlines - Array of all deadlines
 * @param getDeadlineCalculations - Function to calculate deadline metrics
 * @returns MarkedDatesConfig object for react-native-calendars
 *
 * Dot Logic:
 * - If date has ANY non-deadline_due activity → add grey dot
 * - For EACH deadline_due on a date → add dot with urgency color
 *
 * @example
 * calculateMarkedDates(activities, deadlines, getDeadlineCalculations)
 * // Returns: {
 * //   '2025-01-15': {
 * //     dots: [
 * //       { key: 'activity', color: '#9CA3AF' },
 * //       { key: 'deadline_1', color: '#EF4444' }
 * //     ]
 * //   }
 * // }
 */
export function calculateMarkedDates(
  activities: DailyActivity[],
  deadlines: ReadingDeadlineWithProgress[],
  getDeadlineCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult
): MarkedDatesConfig {
  const markedDates: MarkedDatesConfig = {};

  // Group activities by date
  const groupedByDate: Record<string, DailyActivity[]> = {};
  activities.forEach(activity => {
    // Extract date in user's local timezone to avoid day-offset issues
    const date = parseServerDateTime(activity.activity_timestamp).format(
      'YYYY-MM-DD'
    );
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(activity);
  });

  // Process each date
  Object.entries(groupedByDate).forEach(([date, dateActivities]) => {
    const dots: { key: string; color: string }[] = [];

    // Check if date has non-deadline activities
    const hasOtherActivities = dateActivities.some(
      a => a.activity_type !== 'deadline_due'
    );
    if (hasOtherActivities) {
      dots.push({
        key: 'activity',
        color: ACTIVITY_DOT_COLOR,
      });
    }

    // Add dots for each deadline_due
    const deadlineDueActivities = dateActivities.filter(
      a => a.activity_type === 'deadline_due'
    );
    deadlineDueActivities.forEach((activity, index) => {
      const deadline = deadlines.find(d => d.id === activity.deadline_id);
      if (deadline) {
        const calculations = getDeadlineCalculations(deadline);
        dots.push({
          key: `deadline_${index}`,
          color: calculations.urgencyColor,
        });
      }
    });

    if (dots.length > 0) {
      markedDates[date] = { dots };
    }
  });

  return markedDates;
}

/**
 * Format activity timestamp to display time
 * @param timestamp - ISO 8601 timestamp from activity
 * @returns Formatted time string (e.g., '2:30 PM')
 *
 * Uses dateNormalization to properly convert UTC timestamps to local time
 */
export function formatActivityTime(timestamp: string): string {
  try {
    const localTime = parseServerDateTime(timestamp);
    if (!localTime.isValid()) {
      console.warn('Invalid timestamp for activity time:', timestamp);
      return 'N/A';
    }
    return localTime.format('h:mm A');
  } catch (error) {
    console.error('Failed to format activity time:', timestamp, error);
    posthog.captureException(error instanceof Error ? error : new Error(String(error)));
    return 'N/A';
  }
}
