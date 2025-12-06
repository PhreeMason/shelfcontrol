import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ACTIVITY_TYPE_CONFIG } from '@/constants/activityTypes';
import { useTheme } from '@/hooks/useTheme';
import { DailyActivity } from '@/types/calendar.types';
import { OPACITY } from '@/utils/formatters';
import React from 'react';
import { Pressable, View } from 'react-native';
import { calendarCardStyles as styles } from './calendarCardStyles';

interface ReviewsPendingCardProps {
  activity: DailyActivity;
  onPress?: () => void;
}

/**
 * ReviewsPendingCard Component
 * Renders reviews pending items as daily reminder cards with teal color
 */
export const ReviewsPendingCard: React.FC<ReviewsPendingCardProps> = React.memo(
  function ReviewsPendingCard({ activity, onPress }) {
    const { colors } = useTheme();
    const config = ACTIVITY_TYPE_CONFIG.reviews_pending;
    const unpostedCount = activity.metadata?.unposted_count ?? 0;

    const subtitle =
      unpostedCount === 1
        ? '1 review pending'
        : `${unpostedCount} reviews pending`;

    return (
      <Pressable
        testID="reviews-pending-card"
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.timeColumn}>
          <ThemedText typography="labelMedium" color="textMuted">
            Reminder
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
            style={styles.bookTitle}
            numberOfLines={1}
          >
            {activity.book_title}
          </ThemedText>
          <ThemedText variant="muted">{subtitle}</ThemedText>
        </View>
      </Pressable>
    );
  }
);
