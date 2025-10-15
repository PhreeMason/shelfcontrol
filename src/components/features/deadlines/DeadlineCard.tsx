import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Typography } from '@/constants/Colors';
import { useFetchBookById } from '@/hooks/useBooks';
import { useDeadlineCardState } from '@/hooks/useDeadlineCardState';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { posthog } from '@/lib/posthog';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  formatCapacityMessage,
  formatRemainingDisplay,
} from '@/utils/deadlineDisplayUtils';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  GestureResponderEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { DeadlineActionSheet } from './DeadlineActionSheet';
import { DeadlineBookCover } from './DeadlineBookCover';
import { DeadlineCountdownDisplay } from './DeadlineCountdownDisplay';
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

  const { data: bookData } = useFetchBookById(deadline.book_id);

  const { daysLeft, unitsPerDay, urgencyLevel, remaining } =
    getDeadlineCalculations(deadline);

  const {
    latestStatus,
    latestStatusRecord,
    isArchived,
    isNotReading,
    borderColor,
    countdownColor,
  } = useDeadlineCardState(deadline, urgencyLevel);

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

  const handlePress = () => {
    if (!disableNavigation) {
      posthog.capture('deadline card clicked', {
        deadline_status: latestStatus,
        deadline_format: deadline.format,
      });
      router.push(`/deadline/${deadline.id}`);
    }
  };

  const handleMorePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setShowActionSheet(true);
  };

  const baseCapacityMessage = formatUnitsPerDayForDisplay(
    unitsPerDay,
    deadline.format,
    remaining,
    daysLeft
  );

  const capacityMessage = formatCapacityMessage(
    baseCapacityMessage,
    isNotReading
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
            <DeadlineBookCover
              coverImageUrl={bookData?.cover_image_url}
              deadline={deadline}
              daysLeft={daysLeft}
            />
            <View style={styles.bookInfo}>
              <ThemedText style={styles.bookTitle} numberOfLines={2}>
                {deadline.book_title}
              </ThemedText>
              {!isArchived && (
                <ThemedText style={styles.capacityText}>
                  {urgencyLevel === 'overdue'
                    ? formatRemainingDisplay(remaining, deadline.format)
                    : capacityMessage}
                </ThemedText>
              )}
              {isArchived ? (
                <ThemedText style={styles.capacityText}>
                  {latestStatus === 'complete'
                    ? `Completed ${latestStatusRecord ? dayjs(latestStatusRecord.created_at).format('MMM D, YYYY') : 'N/A'}`
                    : `Archived ${latestStatusRecord ? dayjs(latestStatusRecord.created_at).format('MMM D, YYYY') : 'N/A'}`}
                </ThemedText>
              ) : null}
              <ThemedText style={styles.dueDate}>
                {`Due: ${dayjs(deadline.deadline_date).format('MMM D, YYYY')}`}
              </ThemedText>
            </View>
          </View>
          <DeadlineCountdownDisplay
            latestStatus={latestStatus}
            daysLeft={daysLeft}
            countdownColor={countdownColor}
            borderColor={borderColor}
          />

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
    top: 1,
    right: 1,
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
  bookInfo: {
    flex: 1,
    marginBottom: 4,
  },
  bookTitle: {
    color: '#2B3D4F',
    paddingVertical: 10,
    marginLeft: 1,
    ...Typography.titleMedium,
    fontSize: 18,
  },
  capacityText: {
    color: '#2B3D4F',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 1,
  },
  dueDate: {
    color: '#6B7280',
    fontSize: 12,
  },
});

export default DeadlineCard;
