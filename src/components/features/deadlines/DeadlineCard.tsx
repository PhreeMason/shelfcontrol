import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Typography } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  formatRemainingDisplay,
  getBookCoverIcon,
  getGradientBackground,
} from '@/utils/deadlineDisplayUtils';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { DeadlineActionSheet } from './DeadlineActionSheet';
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
  const [showActionSheet, setShowActionSheet] = useState(false);
  const { good, approaching, urgent, overdue, impossible, complete, paused } =
    colors;
  const urgencyTextColorMap = {
    complete,
    paused,
    did_not_finish: paused,
    overdue,
    urgent,
    good,
    approaching,
    impossible,
    pending: paused,
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

  const latestStatus =
    deadline.status && deadline.status.length > 0
      ? deadline.status[deadline.status.length - 1].status
      : 'reading';
  const latestStatusDate =
    deadline.status && deadline.status.length > 0
      ? deadline.status[deadline.status.length - 1].created_at
      : null;

  const isArchived =
    latestStatus === 'complete' ||
    latestStatus === 'paused' ||
    latestStatus === 'did_not_finish';

  if (isArchived) {
    borderColor = urgencyTextColorMap[latestStatus];
    countdownColor = urgencyTextColorMap[latestStatus];
  }

  const isPending = latestStatus === 'pending';
  if (isPending) {
    borderColor = urgencyTextColorMap[latestStatus];
    countdownColor = urgencyTextColorMap[latestStatus];
  }

  const handlePress = () => {
    if (!disableNavigation) {
      router.push(`/deadline/${deadline.id}`);
    }
  };

  const handleMorePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setShowActionSheet(true);
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
            {latestStatus === 'complete' ? (
              <>
                <ThemedText
                  style={[
                    styles.archivedIcon,
                    { paddingTop: Platform.select({ ios: 6, android: 3 }) },
                  ]}
                >
                  🏆
                </ThemedText>
                <ThemedText
                  style={[
                    styles.countdownLabel,
                    { color: countdownColor },
                    { marginTop: Platform.select({ ios: -2, android: 1 }) },
                  ]}
                >
                  done
                </ThemedText>
              </>
            ) : latestStatus === 'did_not_finish' ? (
              <>
                <IconSymbol
                  name="bookmark.slash"
                  size={28}
                  color={countdownColor}
                  style={{ marginTop: 8 }}
                />
                <ThemedText
                  style={[
                    styles.countdownLabel,
                    { color: countdownColor },
                    { marginTop: 4 },
                  ]}
                >
                  dnf
                </ThemedText>
              </>
            ) : (
              <>
                <ThemedText
                  style={[
                    styles.archivedIcon,
                    { paddingTop: Platform.select({ ios: 6, android: 3 }) },
                  ]}
                >
                  ⏸️
                </ThemedText>
                <ThemedText
                  style={[
                    styles.countdownLabel,
                    { color: countdownColor },
                    { marginTop: Platform.select({ ios: -2, android: 1 }) },
                  ]}
                >
                  paused
                </ThemedText>
              </>
            )}
          </>
        ) : (
          <>
            <ThemedText
              style={[styles.countdownNumber, { color: countdownColor }]}
            >
              {daysLeft}
            </ThemedText>
            <ThemedText
              style={[styles.countdownLabel, { color: countdownColor }]}
            >
              days
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );

  return (
    <>
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
                {(isArchived || isPending) && latestStatusDate
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

          <Pressable
            onPress={handleMorePress}
            hitSlop={8}
            style={styles.moreButton}
          >
            <IconSymbol
              name="ellipsis.circle"
              size={24}
              color={colors.textMuted}
            />
          </Pressable>
        </View>
      </Pressable>

      <DeadlineActionSheet
        deadline={deadline}
        visible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
      />
    </>
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
    position: 'relative',
  },
  moreButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    padding: 4,
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
    paddingTop: Platform.select({ ios: 8, android: 3 }),
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: Platform.select({ ios: -5, android: -2 }),
  },
  archivedIcon: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: Platform.select({ ios: 2, android: 0 }),
  },
});

export default DeadlineCard;
