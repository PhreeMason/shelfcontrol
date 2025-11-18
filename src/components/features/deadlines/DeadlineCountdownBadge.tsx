import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface DeadlineCountdownBadgeProps {
  latestStatus: string;
  daysLeft: number;
  countdownColor: string;
  reviewDaysLeft?: number;
}

export function DeadlineCountdownBadge({
  latestStatus,
  daysLeft,
  countdownColor,
  reviewDaysLeft,
}: DeadlineCountdownBadgeProps) {
  const { colors } = useTheme();

  // Responsive font sizing based on number of digits
  const getDaysFontSize = (days: number) => {
    const digits = days.toString().length;
    if (digits >= 3) return 15; // 100+ days
    return 20; // 1-99 days
  };

  const daysFontSize = getDaysFontSize(daysLeft);
  const reviewDaysFontSize =
    reviewDaysLeft !== undefined ? getDaysFontSize(reviewDaysLeft) : 20;

  // Use transparent white for completed and DNF deadlines, otherwise use countdown color
  const backgroundColor =
    latestStatus === 'complete' || latestStatus === 'did_not_finish'
      ? 'rgba(255, 255, 255, 0.85)'
      : countdownColor;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.contentContainer}>
        {latestStatus === 'complete' ? (
          <>
            <ThemedText
              style={[
                styles.emoji,
                { paddingTop: Platform.select({ ios: 3, android: 2 }) },
              ]}
            >
              🏆
            </ThemedText>
          </>
        ) : latestStatus === 'did_not_finish' ? (
          <>
            <ThemedText
              style={[
                styles.emoji,
                { paddingTop: Platform.select({ ios: 3, android: 2 }) },
              ]}
            >
              🪦
            </ThemedText>
          </>
        ) : latestStatus === 'to_review' ? (
          <>
            {reviewDaysLeft !== undefined ? (
              <ThemedText
                style={[
                  styles.daysNumber,
                  { color: colors.textInverse, fontSize: reviewDaysFontSize },
                ]}
              >
                {reviewDaysLeft}
              </ThemedText>
            ) : (
              <ThemedText
                style={[
                  styles.emoji,
                  { paddingTop: Platform.select({ ios: 3, android: 2 }) },
                ]}
              >
                📝
              </ThemedText>
            )}
          </>
        ) : (
          <>
            <ThemedText
              style={[
                styles.daysNumber,
                { color: colors.textInverse, fontSize: daysFontSize },
              ]}
            >
              {daysLeft}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -15,
    right: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 20,
  },
  contentContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysNumber: {
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
    textAlign: 'center',
  },
  emoji: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
});
