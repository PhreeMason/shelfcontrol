import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed';

const legendItems = [
  { color: '#B8A9D9', label: 'Good pace' },
  { color: '#E8B4A0', label: 'Approaching' },
  { color: '#E8B4B8', label: 'Urgent/Overdue' },
];

interface CalendarLegendProps {
  style?: any;
}

export function CalendarLegend({ style }: CalendarLegendProps) {
  return (
    <View style={[styles.container, style]}>
      <ThemedText variant="label" style={styles.title}>
        Deadline Status
      </ThemedText>
      <View style={styles.legendItems}>
        {legendItems.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={[
                styles.colorDot, 
                { backgroundColor: item.color }
              ]} 
            />
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
    fontSize: 13,
  },
});