import { ThemedText } from '@/components/themed';
import { Typography } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
// import { useFetchBookById } from '@/hooks/useBooks';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getBookCoverIcon, getGradientBackground, formatRemainingDisplay } from '@/utils/deadlineDisplayUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
interface DeadlineCardProps {
  deadline: ReadingDeadlineWithProgress;
  disableNavigation?: boolean;
}

export function DeadlineCard({
  deadline,
  disableNavigation = false,
}: DeadlineCardProps) {
  const { getDeadlineCalculations, formatUnitsPerDayForDisplay } =
    useDeadlines();
  const router = useRouter();
  const { colors } = useTheme();
  const {
    good,
    approaching,
    urgent,
    overdue,
    impossible,
    complete,
    set_aside,
  } = colors;
  const urgencyTextColorMap = {
    complete,
    set_aside,
    overdue,
    urgent,
    good,
    approaching,
    impossible,
    requested: set_aside, // Treat requested as set aside for colors
  };
  // Fetch book data if deadline has a book_id
  const { data: bookData } = useFetchBookById(deadline.book_id);

  const { daysLeft, unitsPerDay, urgencyLevel, remaining } =
    getDeadlineCalculations(deadline);


  const shadowStyle = Platform.select({
    ios: {
      shadowColor: 'rgba(184, 169, 217, 0.1)',
      shadowOffset: { width: 2, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: {
      elevation: 1,
    },
  });

  let countdownColor = urgencyTextColorMap[urgencyLevel];
  let borderColor = urgencyTextColorMap[urgencyLevel];

  // Check if deadline is archived (completed or set aside)
  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? deadline.status[deadline.status.length - 1].status
      : 'reading';
  const latestStatusDate =
    deadline.status && deadline.status.length > 0
      ? deadline.status[deadline.status.length - 1].created_at
      : null;

  const isArchived =
    latestStatus === 'complete' || latestStatus === 'set_aside';

  if (isArchived) {
    borderColor = urgencyTextColorMap[latestStatus];
    countdownColor = urgencyTextColorMap[latestStatus];
  }

  const isRequested = latestStatus === 'requested';
  if (isRequested) {
    borderColor = urgencyTextColorMap[latestStatus];
    countdownColor = urgencyTextColorMap[latestStatus];
  }

  const handlePress = () => {
    if (!disableNavigation) {
      // Check if we're already in a deadline view
      router.push(`/deadline/${deadline.id}`);
    }
  };



  // Book Cover Component
  const BookCover = () => {
    if (bookData?.cover_image_url) {
      return (
        <Image
          source={{ uri: bookData.cover_image_url }}
          style={styles.bookCover}
          resizeMode="cover"
        />
      );
    }

    return (
      <LinearGradient
        colors={getGradientBackground(deadline, daysLeft)}
        style={[styles.bookCover, styles.bookCoverPlaceholder]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ThemedText style={styles.bookCoverIcon}>
          {getBookCoverIcon(deadline, daysLeft)}
        </ThemedText>
      </LinearGradient>
    );
  };

  // Countdown/Status Display Component
  const CountdownDisplay = () => (
    <View style={styles.countdownContainer}>
      <View style={[styles.countdownSquare, { borderColor }]}>
        {isArchived ? (
          <>
            <ThemedText
              style={[
                Platform.OS === 'android'
                  ? styles.archivedIconAndroid
                  : styles.archivedIcon,
                { color: countdownColor },
              ]}
            >
              {latestStatus === 'complete' ? '🏆' : '⏸️'}
            </ThemedText>
            <ThemedText
              style={[
                Platform.OS === 'android'
                  ? styles.countdownLabelAndroid
                  : styles.countdownLabel,
                { color: countdownColor },
              ]}
            >
              {latestStatus === 'complete' ? 'Done' : 'Paused'}
            </ThemedText>
          </>
        ) : (
          <>
            <ThemedText
              style={[
                Platform.OS === 'android'
                  ? styles.countdownNumberAndroid
                  : styles.countdownNumber,
                { color: countdownColor },
              ]}
            >
              {daysLeft}
            </ThemedText>
            <ThemedText
              style={[
                Platform.OS === 'android'
                  ? styles.countdownLabelAndroid
                  : styles.countdownLabel,
                { color: countdownColor },
              ]}
            >
              days
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.8 : 1, backgroundColor: 'transparent' },
      ]}
    >
      <View
        style={[
          styles.cardContainer,
          isArchived && shadowStyle,
          { borderColor },
        ]}
      >
        <View style={styles.bookContent}>
          <BookCover />
          <View style={styles.bookInfo}>
            <ThemedText style={styles.bookTitle} numberOfLines={2}>
              {deadline.book_title}
            </ThemedText>
            <ThemedText style={styles.bookDeadline}>
              {(isArchived || isRequested) && latestStatusDate
                ? dayjs(latestStatusDate).format('MMM D, YYYY')
                : urgencyLevel === 'overdue'
                  ? formatRemainingDisplay(remaining, deadline.format)
                  : formatUnitsPerDayForDisplay(
                      unitsPerDay,
                      deadline.format,
                      remaining,
                      daysLeft
                    )}
            </ThemedText>
          </View>
        </View>
        <CountdownDisplay />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderColor: 'rgba(232, 194, 185, 0.15)',
  },
  bookContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flex: 3,
    minWidth: 0,
  },
  bookCover: {
    width: 63,
    height: 100,
    borderRadius: 5,
    flexShrink: 0,
  },
  bookInfo: {
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  bookTitle: {
    color: '#2B3D4F',
    marginBottom: 2,
    marginLeft: 1,
    ...Typography.titleMedium,
    fontSize: 18,
  },
  bookDeadline: {
    color: '#6B7280',
    fontSize: 13,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(232, 194, 185, 0.1)',
    minWidth: 100,
  },
  bookCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookCoverIcon: {
    fontSize: 20,
  },
  countdownSquare: {
    width: 72,
    height: 72,
    borderWidth: 3,
    borderRadius: 20,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  countdownNumber: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
    includeFontPadding: false,
    paddingTop: 8,
  },
  countdownNumberAndroid: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
    includeFontPadding: false,
    paddingTop: 3,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: -5,
  },
  countdownLabelAndroid: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: -2,
  },
  archivedIcon: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 2,
  },
  archivedIconAndroid: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: 0,
  },
});

export default DeadlineCard;
