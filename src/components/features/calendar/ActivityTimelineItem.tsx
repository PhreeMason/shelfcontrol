import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { ActivityTimelineItemProps } from '@/types/calendar.types';
import { formatActivityTime } from '@/utils/calendarUtils';
import { formatBookFormat, formatStatus, OPACITY } from '@/utils/formatters';
import { formatAudiobookTime } from '@/utils/timeFormatUtils';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

/**
 * ActivityTimelineItem Component
 * Renders individual activity timeline items (non-deadline items) with time badge, icon, and details
 */
export const ActivityTimelineItem: React.FC<ActivityTimelineItemProps> =
  React.memo(function ActivityTimelineItem({ activity, onPress }) {
    const { colors } = useTheme();
    const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];

    // Get activity-specific details
    const details = getActivityDetails(activity);

    return (
      <Pressable
        testID="activity-timeline-item"
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        {/* Time Column */}
        {activity.activity_timestamp && (
          <View style={styles.timeColumn}>
            <ThemedText typography="bodySmall" color="textMuted">
              {details.time}
            </ThemedText>
          </View>
        )}

        <View style={styles.timelineColumn}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: config.color + OPACITY.SUBTLE,
                borderColor: colors.background,
              },
            ]}
          >
            <IconSymbol name={config.icon} size={16} color={config.color} />
          </View>
        </View>

        {/* Content Column */}
        <View style={[styles.content, { borderColor: colors.border }]}>
          <ThemedText
            typography="bodyLarge"
            style={styles.label}
            numberOfLines={1}
          >
            {details.label}
          </ThemedText>
          <ThemedText variant="muted" numberOfLines={2}>
            {details.text}
          </ThemedText>
        </View>
      </Pressable>
    );
  });

/**
 * Get activity-specific details for display
 */
function getActivityDetails(activity: ActivityTimelineItemProps['activity']): {
  time: string;
  label: string;
  text: string;
} {
  const {
    activity_type,
    book_title,
    metadata = {},
    activity_timestamp,
  } = activity;

  // Format time from timestamp (special case for review_due)
  let time = formatActivityTime(activity_timestamp);
  if (activity_type === 'review_due') {
    time = 'Due Today';
  }

  // Label is always the book title
  const label = book_title;

  let text = '';

  switch (activity_type) {
    case 'progress': {
      const { current_progress, previous_progress, format } = metadata || {};
      if (current_progress !== undefined && current_progress !== null) {
        // Default previous_progress to 0 if null or undefined
        const prevProgress = previous_progress ?? 0;
        const change = current_progress - prevProgress;
        const bookFormat = (format || 'physical') as
          | 'physical'
          | 'eBook'
          | 'audio';

        // Format the progress change based on book format (audiobooks show as "Xh Ym" or "Xh")
        if (bookFormat === 'audio') {
          const formattedChange = formatAudiobookTime(change);
          const formattedPrevious = formatAudiobookTime(prevProgress);
          const formattedCurrent = formatAudiobookTime(current_progress);
          text = `Read ${formattedChange} (${formattedPrevious} → ${formattedCurrent})`;
        } else {
          text = `Read ${change} pages (${prevProgress} → ${current_progress})`;
        }
      } else {
        text = 'Progress updated';
      }
      break;
    }

    case 'note': {
      const { note_text } = metadata;
      if (note_text) {
        const truncated =
          note_text.length > 50
            ? note_text.substring(0, 50) + '...'
            : note_text;
        text = `"${truncated}"`;
      } else {
        text = 'Note added';
      }
      break;
    }

    case 'status': {
      const { status, previous_status } = metadata;
      if (status && previous_status) {
        text = `${formatStatus(previous_status)} → ${formatStatus(status)}`;
      } else if (status) {
        text = `Status changed to ${formatStatus(status)}`;
      } else {
        text = 'Status changed';
      }
      break;
    }

    case 'review': {
      const { platform_name } = metadata;
      if (platform_name) {
        text = `Posted to ${platform_name}`;
      } else {
        text = 'Review posted';
      }
      break;
    }

    case 'review_due': {
      text = 'Review Due';
      break;
    }

    case 'deadline_created': {
      const { format } = metadata;
      if (format) {
        text = `Due date created (${formatBookFormat(format)})`;
      } else {
        text = 'Due date created';
      }
      break;
    }

    default:
      text = book_title;
  }

  return { time, label, text };
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    justifyContent: 'space-around',
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  timeColumn: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  timelineColumn: {
    alignItems: 'center',
    position: 'relative',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  content: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  label: {
    marginBottom: 4,
  },
});
