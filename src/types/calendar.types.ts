import { ActivityType } from '@/constants/activityTypes';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { DeadlineCalculationResult } from '@/utils/deadlineProviderUtils';

/**
 * Activity from get_daily_activities RPC function
 * Represents a single activity event on a specific date
 */
export interface DailyActivity {
  activity_date: string; // YYYY-MM-DD format
  activity_type: ActivityType;
  deadline_id: string;
  book_title: string;
  activity_timestamp: string; // ISO 8601 timestamp (UTC)
  metadata: Record<string, any>; // JSON metadata specific to activity type
}

/**
 * Type guard to check if an object is a valid DailyActivity
 */
function isValidActivityType(type: string): type is ActivityType {
  const validTypes: ActivityType[] = [
    'deadline_due',
    'deadline_created',
    'progress',
    'status',
    'note',
    'review',
    'review_due',
    'custom_date',
  ];
  return validTypes.includes(type as ActivityType);
}

/**
 * Validates and transforms raw activity data from the database into DailyActivity type
 * @param data - Raw data from database
 * @returns Validated DailyActivity array
 * @throws Error if data structure is invalid
 */
export function validateDailyActivities(data: unknown[]): DailyActivity[] {
  if (!Array.isArray(data)) {
    console.error('Invalid activities data: expected array, got:', typeof data);
    return [];
  }

  return data
    .map((item, index) => {
      // Validate that item is an object
      if (!item || typeof item !== 'object') {
        console.warn(
          `Skipping invalid activity at index ${index}: not an object`
        );
        return null;
      }

      const activity = item as Record<string, any>;

      // Validate required fields
      if (
        typeof activity.activity_date !== 'string' ||
        typeof activity.activity_type !== 'string' ||
        typeof activity.deadline_id !== 'string' ||
        typeof activity.book_title !== 'string' ||
        typeof activity.activity_timestamp !== 'string'
      ) {
        console.warn(
          `Skipping invalid activity at index ${index}: missing or invalid required fields`,
          activity
        );
        return null;
      }

      // Validate activity_type is a valid ActivityType
      if (!isValidActivityType(activity.activity_type)) {
        console.warn(
          `Skipping activity at index ${index}: invalid activity_type '${activity.activity_type}'`
        );
        return null;
      }

      // Ensure metadata is an object
      const metadata =
        activity.metadata && typeof activity.metadata === 'object'
          ? activity.metadata
          : {};

      return {
        activity_date: activity.activity_date,
        activity_type: activity.activity_type as ActivityType,
        deadline_id: activity.deadline_id,
        book_title: activity.book_title,
        activity_timestamp: activity.activity_timestamp,
        metadata,
      } as DailyActivity;
    })
    .filter((activity): activity is DailyActivity => activity !== null);
}

/**
 * Enriched activity with deadline calculations
 * Adds urgency calculations for deadline_due activities
 */
export interface EnrichedActivity extends DailyActivity {
  deadlineCalculations?: DeadlineCalculationResult; // Only for deadline_due type
}

/**
 * Agenda item format for react-native-calendars Agenda component
 * Used to render activities in the timeline list
 */
export interface AgendaActivityItem {
  name: string; // Display name for the activity
  activityType: ActivityType;
  activity: EnrichedActivity;
  deadline?: ReadingDeadlineWithProgress; // Full deadline data for deadline_due items
  calculations?: DeadlineCalculationResult; // Deadline calculations for deadline_due items
  timestamp?: string; // Formatted time string (e.g., "2:30 PM")
}

/**
 * Marked dates configuration for react-native-calendars
 * Supports both multi-dot (legacy) and custom styles (new)
 */
export interface MarkedDatesConfig {
  [date: string]: {
    dots?: {
      key: string; // Unique key for the dot (e.g., 'activity', 'deadline_1')
      color: string; // Hex color code
    }[];
    selected?: boolean; // Whether this date is selected
    selectedColor?: string; // Color for selected date
    // Custom styles for deadline highlighting (markingType="custom")
    customStyles?: {
      container?: {
        backgroundColor?: string;
        borderRadius?: number;
        borderWidth?: number;
        borderColor?: string;
      };
      text?: {
        color?: string;
        fontWeight?:
          | 'normal'
          | 'bold'
          | '100'
          | '200'
          | '300'
          | '400'
          | '500'
          | '600'
          | '700'
          | '800'
          | '900';
      };
    };
  };
}

/**
 * Props for ActivityTimelineItem component
 * Renders individual activity items in the timeline (non-deadline items)
 */
export interface ActivityTimelineItemProps {
  activity: EnrichedActivity;
  onPress?: () => void;
}

/**
 * Props for DeadlineDueCard component
 * Renders deadline due cards at the top of each day
 */
export interface DeadlineDueCardProps {
  agendaItem: AgendaActivityItem;
  onPress?: () => void;
}
