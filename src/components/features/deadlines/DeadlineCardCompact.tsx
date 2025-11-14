import { ThemedText } from '@/components/themed';
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
            <ThemedText style={styles.bookCoverIcon}>
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
          <ThemedText style={styles.dueDateText}>{dateDisplay.text}</ThemedText>
        ) : (
          <>
            <ThemedText style={styles.dueDateText}>
              {dateDisplay.label}
            </ThemedText>
            <ThemedText style={styles.dueDateText}>
              {dateDisplay.value}
            </ThemedText>
          </>
        )}

        {/* Pace Required - Only show for active deadlines */}
        {countdown.latestStatus !== 'complete' &&
          countdown.latestStatus !== 'did_not_finish' && (
            <ThemedText style={styles.primaryText}>{primaryText}</ThemedText>
          )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '30%',
    marginBottom: 16,
    paddingHorizontal: 4,
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
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressBarContainer: {
    marginTop: 6,
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
  bookCoverIcon: {
    fontSize: 32,
  },
  infoContainer: {
    marginTop: 6,
    paddingLeft: 2,
  },
  dueDateText: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  primaryText: {
    fontSize: 12,
    color: '#2B3D4F',
    fontWeight: '600',
  },
});
