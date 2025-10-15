import { ThemedText } from '@/components/themed';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

interface DeadlineCountdownDisplayProps {
  latestStatus: string;
  daysLeft: number;
  countdownColor: string;
  borderColor: string;
}

export function DeadlineCountdownDisplay({
  latestStatus,
  daysLeft,
  countdownColor,
  borderColor,
}: DeadlineCountdownDisplayProps) {
  const isPaused = latestStatus === 'paused';

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
        ) : isPaused ? (
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
}

const styles = StyleSheet.create({
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    minWidth: 100,
    transform: [{ translateX: -10 }],
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
