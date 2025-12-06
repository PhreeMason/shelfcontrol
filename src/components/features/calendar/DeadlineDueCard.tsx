import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { DeadlineDueCardProps } from '@/types/calendar.types';
import { formatStatus, OPACITY } from '@/utils/formatters';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { calendarCardStyles } from './calendarCardStyles';

/**
 * DeadlineDueCard Component
 * Renders deadline due items as all-day cards with urgency color bar
 */
export const DeadlineDueCard: React.FC<DeadlineDueCardProps> = React.memo(
  function DeadlineDueCard({ agendaItem, onPress }) {
    const { colors } = useTheme();
    const { deadline, calculations } = agendaItem;

    if (!deadline || !calculations) {
      return null;
    }

    const config = ACTIVITY_TYPE_CONFIG.deadline_due;

    // Get progress percentage from calculations
    const progressPercentage = calculations.progressPercentage;

    // Format status for display
    // Status is an array of status records, get the most recent one
    const latestStatus =
      deadline.status && deadline.status.length > 0
        ? deadline.status[deadline.status.length - 1].status
        : null;
    const statusText = latestStatus ? formatStatus(latestStatus) : 'Unknown';

    // Determine progress text based on format
    const progressText =
      deadline.format === 'audio'
        ? `${progressPercentage}% listened`
        : `${progressPercentage}% read`;

    return (
      <Pressable
        testID="deadline-due-card"
        style={({ pressed }) => [
          calendarCardStyles.container,
          pressed && calendarCardStyles.pressed,
        ]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={calendarCardStyles.timeColumn}>
          <ThemedText typography="labelMedium" color="textMuted">
            Due Today
          </ThemedText>
        </View>

        <View style={calendarCardStyles.timelineColumn}>
          <View
            style={[
              calendarCardStyles.iconCircle,
              {
                backgroundColor: calculations.urgencyColor + OPACITY.SUBTLE,
                borderColor: calculations.urgencyColor,
              },
            ]}
          >
            <IconSymbol
              name={config.icon}
              size={16}
              color={calculations.urgencyColor}
            />
          </View>
        </View>

        {/* Content Column */}
        <View style={[calendarCardStyles.content, { borderColor: colors.border }]}>
          <ThemedText
            typography="bodyLarge"
            style={calendarCardStyles.bookTitle}
            numberOfLines={1}
          >
            {deadline.book_title}
          </ThemedText>
          <View style={styles.metadataRow}>
            <ThemedText variant="muted">{statusText}</ThemedText>
            <ThemedText variant="muted" style={styles.separator}>
              •
            </ThemedText>
            <ThemedText variant="muted">{progressText}</ThemedText>
          </View>
        </View>
      </Pressable>
    );
  }
);

// Component-specific styles (shared styles imported from calendarCardStyles)
const styles = StyleSheet.create({
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: Spacing.xs,
  },
});
