import LinearProgressBar from '@/components/shared/LinearProgressBar';
import { ThemedText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { ProductiveDaysStats } from '@/types/stats.types';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Props for MostProductiveDaysCard component
 */
interface MostProductiveDaysCardProps {
  /** Productivity statistics for days of the week */
  stats: ProductiveDaysStats;
  /** Title for the card header */
  title: string;
  /** Function to format unit values (pages or time) */
  formatValue: (value: number) => string;
}

/**
 * MostProductiveDaysCard - Displays the top 3 most productive days of the week
 *
 * This component analyzes historical reading/listening patterns to show
 * which days of the week are typically most productive, helping users
 * optimize their reading schedule.
 *
 * Features:
 * - Shows top 3 days ranked by total activity
 * - Horizontal progress bars proportional to max day
 * - Dynamic insight text suggesting best days to read
 * - Data attribution footer explaining timeframe
 * - Returns null if insufficient data
 *
 * @component
 * @example
 * ```tsx
 * <MostProductiveDaysCard
 *   stats={productiveDaysStats}
 *   title="Most Productive Days"
 *   formatValue={(value) => `${value} pages`}
 * />
 * ```
 */
export function MostProductiveDaysCard({
  stats,
  title,
  formatValue,
}: MostProductiveDaysCardProps) {
  const { colors } = useTheme();

  const accessibilityLabel = useMemo(() => {
    if (!stats.hasData || stats.topDays.length === 0) {
      return `${title}. No data available.`;
    }

    const daysText = stats.topDays
      .map(
        (day, index) =>
          `${index + 1}. ${day.dayName}: ${formatValue(day.totalUnits)}`
      )
      .join(', ');

    return `${title}. ${daysText}. Based on ${stats.dateRangeText} of data.`;
  }, [title, stats, formatValue]);

  // Don't render if no data
  if (!stats.hasData || stats.topDays.length === 0) {
    return null;
  }

  // Create dynamic styles with theme colors
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
      borderColor: colors.border,
    },
    insightSection: {
      borderTopColor: colors.border,
    },
    attributionSection: {
      borderTopColor: colors.border,
    },
  };

  return (
    <View
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[styles.container, dynamicStyles.container]}
    >
      <View style={styles.content}>
        <ThemedText style={styles.label}>{title}</ThemedText>

        {/* Top Days Section */}
        <View style={styles.daysContainer}>
          {stats.topDays.map((day) => (
            <View key={day.dayIndex} style={styles.dayRow}>
              <View style={styles.dayHeader}>
                <ThemedText style={styles.dayLabel}>{day.dayAbbrev}</ThemedText>
                <ThemedText style={styles.dayValue}>
                  {formatValue(day.totalUnits)}
                </ThemedText>
              </View>
              <LinearProgressBar
                progressPercentage={day.percentOfMax}
                gradientColors={[colors.primary, colors.primary]}
                height={8}
              />
            </View>
          ))}
        </View>

        {/* Data Attribution Footer */}
        <View
          style={[
            styles.attributionSection,
            dynamicStyles.attributionSection,
          ]}
        >
          <ThemedText
            style={[styles.attributionText, { color: colors.textMuted }]}
          >
            Stats are based on {stats.dateRangeText} of data not including this
            week.
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 20,
    marginBottom: 16,
  },
  content: {
    gap: 16,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  daysContainer: {
    gap: 12,
  },
  dayRow: {
    gap: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  dayValue: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  insightSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
  attributionText: {
    fontSize: 14,
    lineHeight: 18,
  },
  attributionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
  },
});
