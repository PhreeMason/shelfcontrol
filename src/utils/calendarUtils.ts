import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { dayjs } from '@/lib/dayjs';
import { posthog } from '@/lib/posthog';
import {
  ActivityBarInfo,
  AgendaActivityItem,
  DailyActivity,
  EnrichedActivity,
  MarkedDatesConfig,
} from '@/types/calendar.types';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getCoverImageUrl } from '@/utils/coverImageUtils';
import { parseServerDateTime } from '@/utils/dateNormalization';
import { DeadlineCalculationResult } from '@/utils/deadlineProviderUtils';
import { OPACITY } from '@/utils/formatters';

// Priority order: most urgent wins when multiple deadlines on same date
const URGENCY_PRIORITY = [
  'overdue',
  'urgent',
  'impossible',
  'approaching',
  'good',
] as const;

// Maximum number of activity bars to display per calendar cell
const MAX_ACTIVITY_BARS = 6;

// Gray color for non-deadline activity bars
const OTHER_ACTIVITY_BAR_COLOR = '#9CA3AF';

/**
 * Get activity priority for sorting (lower number = higher priority)
 * Used to determine which activities appear first in the timeline list
 */
export function getActivityPriority(activity: DailyActivity): number {
  const { activity_type, metadata } = activity;

  // 1. Progress at 100% is highest priority (book completion)
  if (activity_type === 'progress') {
    const currentProgress = metadata?.current_progress;
    const totalQuantity = metadata?.total_quantity;
    if (
      currentProgress !== undefined &&
      totalQuantity !== undefined &&
      currentProgress >= totalQuantity
    ) {
      return 1;
    }
    // 3. Other progress updates
    return 3;
  }

  // 2. Review due dates
  if (activity_type === 'review_due') return 2;

  // 4. New book added
  if (activity_type === 'deadline_created') return 4;

  // 5. Review posted
  if (activity_type === 'review') return 5;

  // 6. Status change
  if (activity_type === 'status') return 6;

  // 7. Everything else (notes, custom_date, etc.)
  return 7;
}

/**
 * Get the urgency priority index (lower = more urgent)
 */
function getUrgencyPriorityIndex(urgencyLevel: string): number {
  const index = URGENCY_PRIORITY.indexOf(
    urgencyLevel as (typeof URGENCY_PRIORITY)[number]
  );
  return index === -1 ? URGENCY_PRIORITY.length : index;
}

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
  // All-day items: deadline_due, custom_date, reviews_pending
  const allDayTypes = ['deadline_due', 'custom_date', 'reviews_pending'];
  const deadlineDue = activities.filter(a =>
    allDayTypes.includes(a.activity_type)
  );
  const otherActivities = activities.filter(
    a => !allDayTypes.includes(a.activity_type)
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

      // Add deadline data for all activity types (for cover image, calculations, etc.)
      const deadline = deadlines.find(d => d.id === activity.deadline_id);
      if (deadline) {
        agendaItem.deadline = deadline;
        // Add calculations only for deadline_due items
        if (
          activity.activity_type === 'deadline_due' &&
          activity.deadlineCalculations
        ) {
          agendaItem.calculations = activity.deadlineCalculations;
        }
      }

      // Add formatted timestamp for timed activities (not all-day events)
      const allDayTypes = ['deadline_due', 'custom_date', 'reviews_pending'];
      if (!allDayTypes.includes(activity.activity_type)) {
        agendaItem.timestamp = formatActivityTime(activity.activity_timestamp);
      }

      return agendaItem;
    });
  });

  return result;
}

// ============================================================================
// calculateMarkedDates - Helper Types and Functions
// ============================================================================

/**
 * Urgency data for a deadline on a specific date
 */
interface UrgencyData {
  urgencyLevel: string;
  urgencyColor: string;
  deadlineId: string;
  coverImageUrl: string | null;
}

/**
 * Groups activities by date in YYYY-MM-DD format
 * Uses parseServerDateTime to convert UTC to local timezone
 */
function groupActivitiesByDate(
  activities: DailyActivity[]
): Record<string, DailyActivity[]> {
  const grouped: Record<string, DailyActivity[]> = {};

  activities.forEach(activity => {
    const date = parseServerDateTime(activity.activity_timestamp).format(
      'YYYY-MM-DD'
    );
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(activity);
  });

  return grouped;
}

/**
 * Collects and sorts urgency data for deadline_due activities
 * Returns sorted array with most urgent deadline first
 */
function getDeadlineUrgencyData(
  deadlineDueActivities: DailyActivity[],
  deadlines: ReadingDeadlineWithProgress[],
  getDeadlineCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult
): UrgencyData[] {
  const urgencyData: UrgencyData[] = [];

  deadlineDueActivities.forEach(activity => {
    const deadline = deadlines.find(d => d.id === activity.deadline_id);
    if (deadline) {
      const calculations = getDeadlineCalculations(deadline);
      const coverUrl =
        deadline.cover_image_url || deadline.books?.cover_image_url;
      urgencyData.push({
        urgencyLevel: calculations.urgencyLevel,
        urgencyColor: calculations.urgencyColor,
        deadlineId: deadline.id,
        coverImageUrl: getCoverImageUrl(coverUrl),
      });
    }
  });

  // Sort by urgency priority (most urgent first)
  urgencyData.sort(
    (a, b) =>
      getUrgencyPriorityIndex(a.urgencyLevel) -
      getUrgencyPriorityIndex(b.urgencyLevel)
  );

  return urgencyData;
}

/**
 * Builds activity bars array for horizontal bar display
 * Prioritizes deadline activities, adds one gray bar for other activities if room
 */
function buildActivityBars(
  urgencyData: UrgencyData[],
  otherActivitiesCount: number
): ActivityBarInfo[] {
  const bars: ActivityBarInfo[] = [];

  // Add deadline bars (up to MAX_ACTIVITY_BARS), sorted by urgency (most urgent first)
  for (const data of urgencyData.slice(0, MAX_ACTIVITY_BARS)) {
    bars.push({
      color: data.urgencyColor,
      isDeadline: true,
    });
  }

  // If room remains and other activities exist, add ONE gray bar
  if (bars.length < MAX_ACTIVITY_BARS && otherActivitiesCount > 0) {
    bars.push({
      color: OTHER_ACTIVITY_BAR_COLOR,
      isDeadline: false,
    });
  }

  return bars;
}

/**
 * Builds marking for a date with deadline_due activities
 * Uses the most urgent deadline's color for background styling
 */
function buildDeadlineMarking(
  primaryUrgency: UrgencyData,
  activityBars: ActivityBarInfo[]
): MarkedDatesConfig[string] {
  return {
    customStyles: {
      container: {
        backgroundColor: primaryUrgency.urgencyColor + OPACITY.CALENDAR,
        borderRadius: 4,
      },
      text: {
        color: primaryUrgency.urgencyColor,
        fontWeight: '600' as const,
      },
      coverImageUrl: primaryUrgency.coverImageUrl,
      activityBars,
    },
  };
}

/**
 * Builds marking for all-day activity types (custom_date, reviews_pending)
 * Uses the activity type's color for styling
 */
function buildAllDayMarking(
  activities: DailyActivity[],
  activityType: 'custom_date' | 'reviews_pending',
  deadlines: ReadingDeadlineWithProgress[],
  otherActivitiesCount: number
): MarkedDatesConfig[string] {
  const color = ACTIVITY_TYPE_CONFIG[activityType].color;

  // Get cover image from the first activity's deadline
  let primaryCoverUrl: string | null = null;
  const firstActivity = activities[0];

  if (firstActivity) {
    const deadline = deadlines.find(d => d.id === firstActivity.deadline_id);
    if (deadline) {
      const coverUrl =
        deadline.cover_image_url || deadline.books?.cover_image_url;
      primaryCoverUrl = getCoverImageUrl(coverUrl);
    }
  }

  // Build activity bars
  const activityBars: ActivityBarInfo[] = [];
  const totalBars = Math.min(activities.length, MAX_ACTIVITY_BARS);

  for (let i = 0; i < totalBars; i++) {
    activityBars.push({
      color,
      isDeadline: false,
    });
  }

  // Add one gray bar for other activities if room
  if (activityBars.length < MAX_ACTIVITY_BARS && otherActivitiesCount > 0) {
    activityBars.push({
      color: OTHER_ACTIVITY_BAR_COLOR,
      isDeadline: false,
    });
  }

  return {
    customStyles: {
      container: {
        backgroundColor: color + OPACITY.CALENDAR,
        borderRadius: 4,
      },
      text: {
        color,
        fontWeight: '600' as const,
      },
      coverImageUrl: primaryCoverUrl,
      activityBars,
    },
  };
}

/**
 * Builds marking for a date with only activity events (no deadlines or custom dates)
 * Uses a subtle grey background
 */
function buildActivityOnlyMarking(
  nonDeadlineActivities: DailyActivity[],
  deadlines: ReadingDeadlineWithProgress[]
): MarkedDatesConfig[string] {
  // Get cover from first activity's deadline
  let activityCoverUrl: string | null = null;
  const firstActivity = nonDeadlineActivities[0];

  if (firstActivity) {
    const deadline = deadlines.find(d => d.id === firstActivity.deadline_id);
    if (deadline) {
      const coverUrl =
        deadline.cover_image_url || deadline.books?.cover_image_url;
      activityCoverUrl = getCoverImageUrl(coverUrl);
    }
  }

  // Build activity bars - all gray for non-deadline activities
  const activityBars: ActivityBarInfo[] = [];
  const totalBars = Math.min(nonDeadlineActivities.length, MAX_ACTIVITY_BARS);

  for (let i = 0; i < totalBars; i++) {
    activityBars.push({
      color: OTHER_ACTIVITY_BAR_COLOR,
      isDeadline: false,
    });
  }

  return {
    customStyles: {
      container: {
        backgroundColor:
          ACTIVITY_TYPE_CONFIG.custom_date.color + OPACITY.SUBTLE,
        borderRadius: 4,
      },
      coverImageUrl: activityCoverUrl,
      activityBars,
    },
  };
}

/**
 * Builds marking for a single date based on its activities
 * Returns null if no marking should be applied
 */
function buildMarkingForDate(
  dateActivities: DailyActivity[],
  deadlines: ReadingDeadlineWithProgress[],
  getDeadlineCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult
): MarkedDatesConfig[string] | null {
  const deadlineDueActivities = dateActivities.filter(
    a => a.activity_type === 'deadline_due'
  );
  const customDateActivities = dateActivities.filter(
    a => a.activity_type === 'custom_date'
  );
  const reviewsPendingActivities = dateActivities.filter(
    a => a.activity_type === 'reviews_pending'
  );
  const nonDeadlineActivities = dateActivities.filter(
    a =>
      a.activity_type !== 'deadline_due' &&
      a.activity_type !== 'custom_date' &&
      a.activity_type !== 'reviews_pending'
  );

  // Priority 1: Dates with deadline_due activities
  if (deadlineDueActivities.length > 0) {
    const urgencyData = getDeadlineUrgencyData(
      deadlineDueActivities,
      deadlines,
      getDeadlineCalculations
    );

    if (urgencyData.length > 0) {
      const activityBars = buildActivityBars(
        urgencyData,
        nonDeadlineActivities.length
      );
      return buildDeadlineMarking(urgencyData[0], activityBars);
    }
  }

  // Priority 2: Dates with custom_date activities
  if (customDateActivities.length > 0) {
    return buildAllDayMarking(
      customDateActivities,
      'custom_date',
      deadlines,
      nonDeadlineActivities.length + reviewsPendingActivities.length
    );
  }

  // Priority 3: Dates with reviews_pending activities (daily reminders)
  if (reviewsPendingActivities.length > 0) {
    return buildAllDayMarking(
      reviewsPendingActivities,
      'reviews_pending',
      deadlines,
      nonDeadlineActivities.length
    );
  }

  // Priority 4: Dates with other activities only
  if (nonDeadlineActivities.length > 0) {
    return buildActivityOnlyMarking(nonDeadlineActivities, deadlines);
  }

  return null;
}

// ============================================================================
// calculateMarkedDates - Main Export
// ============================================================================

/**
 * Calculate marked dates for calendar with custom cell styling
 * @param activities - Array of activities from get_daily_activities
 * @param deadlines - Array of all deadlines
 * @param getDeadlineCalculations - Function to calculate deadline metrics
 * @returns MarkedDatesConfig object for react-native-calendars (custom marking type)
 *
 * Logic:
 * - Deadline dates get tinted background (urgencyColor + OPACITY.CALENDAR)
 * - When multiple deadlines on same date: highest urgency determines background
 * - Custom date activities get their own color styling
 * - Activity-only dates get subtle grey background
 */
export function calculateMarkedDates(
  activities: DailyActivity[],
  deadlines: ReadingDeadlineWithProgress[],
  getDeadlineCalculations: (
    deadline: ReadingDeadlineWithProgress
  ) => DeadlineCalculationResult
): MarkedDatesConfig {
  const markedDates: MarkedDatesConfig = {};
  const groupedByDate = groupActivitiesByDate(activities);

  Object.entries(groupedByDate).forEach(([date, dateActivities]) => {
    const marking = buildMarkingForDate(
      dateActivities,
      deadlines,
      getDeadlineCalculations
    );
    if (marking) {
      markedDates[date] = marking;
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
    posthog.captureException(
      error instanceof Error ? error : new Error(String(error))
    );
    return 'N/A';
  }
}
