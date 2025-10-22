import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CalendarLegendProps {
  style?: any;
}

export function CalendarLegend({ style }: CalendarLegendProps) {
  const { colors } = useTheme();
  const legendItems = [
    { color: colors.good, label: 'On track' },
    { color: colors.approaching, label: 'Approaching' },
    { color: colors.urgent, label: 'Urgent' },
    { color: colors.pending, label: 'Pending' },
  ];
  return (
    <View style={[styles.container, style]}>
      <ThemedText variant="label" style={styles.title}>
        Status
      </ThemedText>
      <View style={styles.legendItems}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <ThemedText variant="secondary" style={styles.legendLabel}>
              {item.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  title: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 14,
  },
});
