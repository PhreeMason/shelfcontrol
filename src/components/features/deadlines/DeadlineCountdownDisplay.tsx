import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Spacing } from '@/constants/Colors';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface DeadlineCountdownDisplayProps {
  latestStatus: string;
  daysLeft: number;
  countdownColor: string;
  borderColor: string;
  reviewDaysLeft?: number;
}

export function DeadlineCountdownDisplay({
  latestStatus,
  daysLeft,
  countdownColor,
  borderColor,
  reviewDaysLeft,
}: DeadlineCountdownDisplayProps) {
  return (
    <View style={styles.countdownContainer}>
      <View style={[styles.countdownSquare, { borderColor }]}>
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
              Done
            </ThemedText>
          </>
        ) : latestStatus === 'did_not_finish' ? (
          <>
            <ThemedText
              style={[
                styles.archivedIcon,
                { paddingTop: Platform.select({ ios: 6, android: 3 }) },
              ]}
            >
              🪦
            </ThemedText>
            <ThemedText
              style={[
                styles.countdownLabel,
                { color: countdownColor },
                { marginTop: Platform.select({ ios: -2, android: 1 }) },
              ]}
            >
              DNF
            </ThemedText>
          </>
        ) : latestStatus === 'to_review' ? (
          <>
            {reviewDaysLeft !== undefined ? (
              <>
                <ThemedText
                  style={[styles.countdownNumber, { color: countdownColor }]}
                >
                  {reviewDaysLeft}
                </ThemedText>
                <ThemedText
                  style={[styles.countdownLabel, { color: countdownColor }]}
                >
                  days
                </ThemedText>
              </>
            ) : (
              <>
                <IconSymbol
                  name="pencil.and.scribble"
                  size={28}
                  color={countdownColor}
                  style={{
                    marginBottom: Platform.select({ ios: 2, android: 0 }),
                  }}
                />
                <ThemedText
                  style={[
                    styles.countdownLabel,
                    { color: countdownColor },
                    { marginTop: Platform.select({ ios: -2, android: 1 }) },
                  ]}
                >
                  Review
                </ThemedText>
              </>
            )}
          </>
        ) : (
          <>
            <ThemedText
              style={[styles.countdownNumber, { color: countdownColor }]}
            >
              {Math.abs(daysLeft)}
            </ThemedText>
            <ThemedText
              style={[styles.countdownLabel, { color: countdownColor }]}
            >
              {daysLeft < 0 ? 'days over' : 'days'}
            </ThemedText>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    minWidth: 100,
  },
  countdownSquare: {
    width: 72,
    height: 72,
    borderWidth: 3,
    borderRadius: BorderRadius.xxl,
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
    paddingTop: Platform.select({ ios: Spacing.sm, android: 3 }),
  },
  countdownLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    opacity: 0.8,
    marginTop: Platform.select({ ios: -5, android: -2 }),
  },
  archivedIcon: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 28,
    marginBottom: Platform.select({ ios: 2, android: 0 }),
  },
});
