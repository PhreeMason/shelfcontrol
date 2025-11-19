import { ThemedText } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { Shadows } from '@/constants/Theme';
import { useDeadlineCardViewModel } from '@/hooks/useDeadlineCardViewModel';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  getBookCoverIcon,
  getGradientBackground,
} from '@/utils/deadlineDisplayUtils';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { DeadlineCountdownBadge } from './DeadlineCountdownBadge';

interface DeadlineCardCompactProps {
  deadline: ReadingDeadlineWithProgress;
}

export function DeadlineCardCompact({ deadline }: DeadlineCardCompactProps) {
  const viewModel = useDeadlineCardViewModel({ deadline });

  const {
    display: { coverImageUrl, primaryText, secondaryText },
    progress: { progressPercentage },
    styling: { countdownColor },
    componentProps: { countdown },
    handlers: { onCardPress },
  } = viewModel;

  // Split secondary text for multi-line display (memoized to avoid re-splitting)
  const dateDisplay = useMemo(() => {
    if (secondaryText.startsWith('Due:')) {
      return { type: 'single', text: secondaryText };
    }

    const colonIndex = secondaryText.indexOf(':');
    if (colonIndex === -1) {
      return { type: 'single', text: secondaryText };
    }

    return {
      type: 'split',
      label: secondaryText.substring(0, colonIndex + 1),
      value: secondaryText.substring(colonIndex + 1).trim(),
    };
  }, [secondaryText]);

  return (
    <Pressable onPress={onCardPress} style={styles.container}>
      {/* Book Cover */}
      <View style={styles.coverContainer}>
        {coverImageUrl !== null && coverImageUrl !== undefined ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.bookCover}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={getGradientBackground(deadline, countdown.daysLeft)}
            style={[styles.bookCover, styles.bookCoverPlaceholder]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <ThemedText typography="headlineLarge">
              {getBookCoverIcon(deadline, countdown.daysLeft)}
            </ThemedText>
          </LinearGradient>
        )}
      </View>
      {/* Countdown Badge */}
      <DeadlineCountdownBadge
        latestStatus={countdown.latestStatus}
        daysLeft={countdown.daysLeft}
        countdownColor={countdownColor}
        {...(countdown.reviewDaysLeft !== undefined && {
          reviewDaysLeft: countdown.reviewDaysLeft,
        })}
      />

      {/* Progress Bar Below Cover - Only show for active deadlines */}
      {countdown.latestStatus !== 'complete' &&
        countdown.latestStatus !== 'did_not_finish' && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                  backgroundColor: countdownColor,
                },
              ]}
            />
          </View>
        )}

      {/* Book Info Below Cover */}
      <View style={styles.infoContainer}>
        {/* Due Date - Split long messages into two lines */}
        {dateDisplay.type === 'single' ? (
          <ThemedText typography="bodySmall" color="textSecondary">
            {dateDisplay.text}
          </ThemedText>
        ) : (
          <>
            <ThemedText typography="bodySmall" color="textSecondary">
              {dateDisplay.label}
            </ThemedText>
            <ThemedText
              typography="bodySmall"
              color="textSecondary"
              style={styles.dueDateValue}
            >
              {dateDisplay.value}
            </ThemedText>
          </>
        )}

        {/* Pace Required - Only show for active deadlines */}
        {countdown.latestStatus !== 'complete' &&
          countdown.latestStatus !== 'did_not_finish' && (
            <ThemedText typography="labelMedium" color="text">
              {primaryText}
            </ThemedText>
          )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30%',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
    position: 'relative',
  },
  coverContainer: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'visible',
    position: 'relative',
  },
  bookCover: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    ...Shadows.medium,
  },
  progressBarContainer: {
    marginTop: Spacing.sm,
    paddingHorizontal: 2,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  bookCoverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    marginTop: 2,
    paddingLeft: 2,
  },
  dueDateValue: {
    marginTop: Spacing.negative.xs,
  },
});
