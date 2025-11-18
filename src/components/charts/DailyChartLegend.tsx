/**
 * Legend component for DailyReadingChart
 * Shows indicators for target pace, actual progress, and activity status
 */

import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DailyChartLegendProps {
  testID?: string;
}

export function DailyChartLegend({ testID }: DailyChartLegendProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container} testID={testID}>
      {/* Target pace indicator */}
      <View style={styles.legendItem}>
        <View
          style={[styles.solidLine, { backgroundColor: colors.textMuted }]}
        />
        <ThemedText style={styles.legendText} variant="muted">
          Target pace
        </ThemedText>
      </View>

      {/* Your progress indicator */}
      <View style={styles.legendItem}>
        <View style={[styles.solidLine, { backgroundColor: colors.primary }]} />
        <ThemedText style={styles.legendText} variant="muted">
          Your progress
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  solidLine: {
    width: 32,
    height: 2,
  },
  legendText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
