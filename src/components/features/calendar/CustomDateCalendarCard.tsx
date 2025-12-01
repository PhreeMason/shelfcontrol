import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { AgendaActivityItem } from '@/types/calendar.types';
import { OPACITY } from '@/utils/formatters';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface CustomDateCalendarCardProps {
  agendaItem: AgendaActivityItem;
  onPress?: () => void;
}

/**
 * CustomDateCalendarCard Component
 * Renders custom date items (e.g. "Cover Reveal") as all-day cards
 */
export const CustomDateCalendarCard: React.FC<CustomDateCalendarCardProps> =
  React.memo(function CustomDateCalendarCard({ agendaItem, onPress }) {
    const { colors } = useTheme();
    const { activity } = agendaItem;

    const config = ACTIVITY_TYPE_CONFIG.custom_date;

    // The name of the custom date (e.g. "Cover Reveal") is in the metadata or activity name
    // For custom_date activities, the 'name' property of agendaItem should be the custom date name
    // But let's check metadata just in case, or fall back to activity.book_title if needed
    // Actually, looking at the plan, the 'name' in AgendaActivityItem is usually book_title.
    // We want to show: "Custom Date Name" and "Book Title"

    // In transformActivitiesToAgendaItems, we'll need to ensure we have access to the custom date name.
    // The activity.metadata should contain the name.
    const customDateName =
      activity.metadata?.custom_date_name || 'Important Date';

    return (
      <Pressable
        testID="custom-date-card"
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.timeColumn}>
          <ThemedText typography="labelMedium" color="textMuted">
            All Day
          </ThemedText>
        </View>

        <View style={styles.timelineColumn}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: config.color + OPACITY.SUBTLE,
                borderColor: config.color,
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
            style={styles.title}
            numberOfLines={1}
          >
            {activity.book_title}
          </ThemedText>
          <View style={styles.metadataRow}>
            <ThemedText variant="muted" numberOfLines={1}>
              {customDateName}
            </ThemedText>
          </View>
        </View>
      </Pressable>
    );
  });

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
  timeColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    width: 60, // Fixed width to align with other cards if needed, or let it be flexible
    // Note: DeadlineDueCard uses flex layout for timeColumn but it seems to rely on content.
    // To align with "Due Today" which is roughly similar width, we can leave it auto or fix it.
    // Let's check DeadlineDueCard styles again. It doesn't have fixed width.
    // We'll keep it auto for now.
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
    zIndex: 1,
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
  title: {
    marginBottom: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
