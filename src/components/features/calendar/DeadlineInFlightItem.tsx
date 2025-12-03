import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useTheme';
import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getProgressAsOfDate } from '@/utils/chartDataUtils';
import { getCoverImageUrl } from '@/utils/coverImageUtils';
import {
  parseServerDateOnly,
  parseServerDateTime,
} from '@/utils/dateNormalization';
import { getGradientBackground } from '@/utils/deadlineDisplayUtils';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

interface DeadlineInFlightItemProps {
  deadline: ReadingDeadlineWithProgress;
  selectedDate: string;
}

/**
 * Presentational component for a single in-flight deadline
 * Displays book cover, title, remaining work, and days left until deadline
 */
export const DeadlineInFlightItem: React.FC<DeadlineInFlightItemProps> = ({
  deadline,
  selectedDate,
}) => {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: bookData } = useFetchBookById(deadline.book_id);

  // Calculate remaining work at start of selected day
  const previousDay = dayjs(selectedDate)
    .subtract(1, 'day')
    .format('YYYY-MM-DD');
  const progressAsOfStartOfDay = getProgressAsOfDate(
    deadline.progress,
    previousDay
  );
  const remaining = Math.max(
    0,
    deadline.total_quantity - progressAsOfStartOfDay
  );

  // Calculate days left
  const selectedDateDayjs = parseServerDateOnly(selectedDate);
  const deadlineDateDayjs = parseServerDateTime(deadline.deadline_date);
  const daysLeft = deadlineDateDayjs.diff(selectedDateDayjs, 'day');

  // Format display text with proper time formatting for audio books
  const formattedRemaining = formatProgressDisplay(deadline.format, remaining);
  const remainingText =
    deadline.format === 'audio'
      ? `${formattedRemaining} left`
      : `${formattedRemaining} pgs left`;

  let daysText: string;
  if (daysLeft === 0) {
    daysText = 'Due today';
  } else if (daysLeft < 0) {
    daysText = 'Past due';
  } else {
    daysText = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
  }

  const handlePress = () => {
    router.push(`/deadline/${deadline.id}`);
  };

  const coverImageUrl = getCoverImageUrl(
    deadline.cover_image_url || bookData?.cover_image_url
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.surface },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      {/* Book Cover */}
      {coverImageUrl ? (
        <Image
          source={{ uri: coverImageUrl }}
          style={styles.cover}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient
          colors={getGradientBackground(deadline, 0)}
          style={styles.cover}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}

      {/* Content */}
      <View style={styles.content}>
        <ThemedText
          typography="titleMedium"
          style={styles.title}
          numberOfLines={1}
        >
          {bookData?.title || 'Unknown Book'}
        </ThemedText>
        <ThemedText variant="muted">
          {remainingText} • {daysText}
        </ThemedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  cover: {
    width: 40,
    height: 60,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    marginBottom: Spacing.xs,
  },
});
