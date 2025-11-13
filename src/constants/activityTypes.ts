import { IconSymbolName } from '@/components/ui/IconSymbol';

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
    color: '#10B981', // Green - positive progress
    label: 'Progress Update',
  },
  note: {
    icon: 'note.text',
    color: '#3B82F6', // Blue - informational
    label: 'Note Added',
  },
  status: {
    icon: 'checkmark.circle.fill',
    color: '#8B5CF6', // Purple - state change
    label: 'Status Change',
  },
  review: {
    icon: 'star.fill',
    color: '#F59E0B', // Amber - rating/review
    label: 'Review Posted',
  },
  deadline_created: {
    icon: 'plus.circle.fill',
    color: '#06B6D4', // Cyan - creation action
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
export const ACTIVITY_DOT_COLOR = '#9CA3AF'; // Grey - neutral indicator
