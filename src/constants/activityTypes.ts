import { IconSymbolName } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';

/**
 * Activity type identifiers from get_daily_activities RPC function
 */
export type ActivityType =
  | 'deadline_due'
  | 'deadline_created'
  | 'progress'
  | 'status'
  | 'note'
  | 'review'
  | 'review_due'
  | 'custom_date';

/**
 * Calendar filter types - extends ActivityType with granular deadline_due filters
 * Used for filtering calendar activities by urgency level
 */
export type CalendarFilterType =
  | 'deadline_due_completed'
  | 'deadline_due_good'
  | 'deadline_due_approaching'
  | 'deadline_due_urgent'
  | Exclude<ActivityType, 'deadline_due'>;

/**
 * Configuration for each activity type including icon, color, and label
 */
export interface ActivityTypeConfig {
  icon: IconSymbolName;
  color: string;
  label: string;
}

/**
 * Activity type configuration map
 * Colors follow the app's design system and provide visual distinction between activity types
 */
export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  progress: {
    icon: 'chart.line.uptrend.xyaxis',
    color: '#0a7ea4', // Teal - positive progress
    label: 'Progress Update',
  },
  note: {
    icon: 'note.text',
    color: Colors.light.peach, // Peach - informational
    label: 'Note Added',
  },
  status: {
    icon: 'arrow.left.arrow.right',
    color: Colors.light.darkPink, // Pink - state change
    label: 'Status Change',
  },
  review: {
    icon: 'star',
    color: Colors.light.orange, // Orange - rating/review
    label: 'Review Posted',
  },
  deadline_created: {
    icon: 'plus',
    color: '#64748B', // Blue-gray - creation action
    label: 'Due date Created',
  },
  deadline_due: {
    icon: 'calendar.badge.clock',
    color: 'dynamic', // Uses urgency color from getDeadlineCalculations
    label: 'Due date Due',
  },
  review_due: {
    icon: 'square.and.pencil',
    color: Colors.light.orange, // Orange - matches review
    label: 'Review Due',
  },
  custom_date: {
    icon: 'calendar.badge.plus',
    color: Colors.light.accent, // Accent - important dates
    label: 'Custom Date',
  },
} as const;

/**
 * Activity type color for general use (non-deadline activities)
 * Used for calendar dots representing any activity on a date
 */
export const ACTIVITY_DOT_COLOR = Colors.light.textMuted; // Grey - neutral indicator
