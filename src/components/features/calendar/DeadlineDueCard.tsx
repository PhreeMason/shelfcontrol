import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { DeadlineDueCardProps } from '@/types/calendar.types';
import { formatStatus, OPACITY } from '@/utils/formatters';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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

    return (
      <Pressable
        testID="deadline-due-card"
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.timeColumn}>
          <ThemedText typography="labelSmall" color="textMuted">
            All Day
          </ThemedText>
        </View>

        <View style={styles.timelineColumn}>
          <View
            style={[
              styles.iconCircle,
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
        <View
          style={[
            styles.content,
            { borderColor: colors.border },
          ]}
        >
          <ThemedText typography="bodyLarge" style={styles.bookTitle} numberOfLines={1}>
            {deadline.book_title}
          </ThemedText>
          <View style={styles.metadataRow}>
            <ThemedText variant="muted">
              {statusText}
            </ThemedText>
            <ThemedText variant="muted" style={styles.separator}>
              •
            </ThemedText>
            <ThemedText variant="muted">
              {progressPercentage}% complete
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 15,
  },
  pressed: {
    opacity: 0.7,
  },
  timeColumn: {
    width: 60,
    paddingRight: Spacing.sm,
    alignItems: 'flex-end',
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
    zIndex: 1, // Ensure icon appears above the line
    borderWidth: 3, // Thicker border for urgency color
  },
  content: {
    flex: 1,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  bookTitle: {
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: Spacing.xs,
  },
});
