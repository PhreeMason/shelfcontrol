/**
 * Tooltip component for DailyReadingChart data points
 * Displays when user interacts with the chart via pointerConfig
 */

import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { BookFormat } from '@/types/deadline.types';
import { formatAudiobookTime } from '@/utils/timeFormatUtils';
import React from 'react';
import { StyleSheet } from 'react-native';

interface PointerDataItem {
  value: number;
  label: string;
  dataPointText?: string;
  dataPointColor?: string;
  dataPointRadius?: number;
}

export interface DailyChartTooltipProps {
  /** Array of data points at pointer position [requiredLine, actualLine] */
  items: PointerDataItem[];
  /** Book format to determine units (pages/minutes) */
  format: BookFormat;
}

/**
 * Formats a value based on book format
 * @param value - The numeric value to format
 * @param format - The book format
 * @returns Formatted string with appropriate units
 */
const formatValue = (value: number, format: BookFormat): string => {
  if (format === 'audio') {
    // Convert decimal minutes to MM:SS format
    return formatAudiobookTime(value);
  }
  // For physical and eBook, show pages
  return `${Math.round(value)} pages`;
};

/**
 * DailyChartTooltip - Displays data point information on chart interaction
 *
 * Shows:
 * - Date/time label
 * - Required pace value
 * - Actual progress value (if exists)
 *
 * Used via pointerConfig.pointerLabelComponent in LineChart
 */
export const DailyChartTooltip: React.FC<DailyChartTooltipProps> = ({
  items,
  format,
}) => {
  const { colors } = useTheme();

  // items[0] = required line (data)
  // items[1] = actual progress line (data2)
  const requiredItem = items[0];
  const actualItem = items[1];

  // Don't render if no data
  if (!requiredItem) {
    return null;
  }

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
          shadowColor: colors.text,
        },
      ]}
      testID="chart-tooltip"
    >
      {/* Date Label */}
      <ThemedText style={styles.dateText} variant="defaultSemiBold">
        {requiredItem.label}
      </ThemedText>

      {/* Required Pace */}
      <ThemedText style={styles.valueText} testID="tooltip-required">
        Required: {formatValue(requiredItem.value, format)}
      </ThemedText>

      {/* Actual Progress (may not exist for future dates) */}
      {actualItem && actualItem.value > 0 && (
        <ThemedText
          style={[styles.valueText, { color: colors.primary }]}
          testID="tooltip-actual"
        >
          Actual: {formatValue(actualItem.value, format)}
        </ThemedText>
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
    marginTop: -30,
    marginLeft: -50,
    zIndex: 10,
  },
  dateText: {
    fontSize: 13,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 12,
    marginTop: 2,
  },
});
