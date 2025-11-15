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
  | 'review';

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
    icon: 'arrow.up.right',
    color: '#0a7ea4', // Teal - positive progress
    label: 'Progress Update',
  },
  note: {
    icon: 'note.text',
    color: Colors.light.peach, // Peach - informational
    label: 'Note Added',
  },
  status: {
    icon: 'arrow.triangle.2.circlepath',
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
    label: 'Deadline Created',
  },
  deadline_due: {
    icon: 'calendar.badge.clock',
    color: 'dynamic', // Uses urgency color from getDeadlineCalculations
    label: 'Deadline Due',
  },
} as const;

/**
 * Activity type color for general use (non-deadline activities)
 * Used for calendar dots representing any activity on a date
 */
export const ACTIVITY_DOT_COLOR = Colors.light.textMuted; // Grey - neutral indicator
