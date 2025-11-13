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
 * Used to show colored dots on calendar dates
 */
export interface MarkedDatesConfig {
  [date: string]: {
    dots: {
      key: string; // Unique key for the dot (e.g., 'activity', 'deadline_1')
      color: string; // Hex color code
    }[];
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
  deadline: ReadingDeadlineWithProgress;
  calculations: DeadlineCalculationResult;
  onPress?: () => void;
}
