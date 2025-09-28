import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateChartMaxValue,
  calculateDailyMinimum,
  calculateDynamicBarWidth,
  getBookReadingDays,
  getChartTitle,
  getUnitLabel,
  transformReadingDaysToChartData,
} from '@/utils/chartDataUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface DailyReadingChartProps {
  deadline: ReadingDeadlineWithProgress;
}

const DailyReadingChart: React.FC<DailyReadingChartProps> = ({ deadline }) => {
  const { colors, typography } = useTheme();

  const unitLabel = getUnitLabel(deadline.format);
  const chartTitle = getChartTitle(deadline.format);

  const recentDays = getBookReadingDays(deadline);

  if (recentDays.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.title, { color: colors.text }]}>
          {chartTitle}
        </ThemedText>
        <ThemedView style={styles.emptyState}>
          <ThemedText
            style={[styles.emptyStateText, { color: colors.textMuted }]}
          >
            No activity recorded
          </ThemedText>
          <ThemedText
            style={[styles.emptyStateSubtext, { color: colors.textMuted }]}
          >
            Start reading to see your daily progress
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const dailyMinimum = calculateDailyMinimum(deadline);
  const displayDailyMinimum = dailyMinimum;

  const topLabelComponentFactory = (value: number) => (
    <ThemedText
      style={{
        color: colors.text,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
        backgroundColor: 'transparent',
      }}
    >
      {value}
    </ThemedText>
  );

  const chartData =
    transformReadingDaysToChartData(
      recentDays,
      colors,
      topLabelComponentFactory
    ) || [];

  const yAxisMax = calculateChartMaxValue(chartData, displayDailyMinimum);

  return (
    <ThemedView style={styles.container}>
      <ThemedText
        style={[
          typography.bodyLarge,
          { color: colors.text, fontWeight: 'bold', marginBottom: 16 },
        ]}
      >
        {chartTitle}
      </ThemedText>

      <View style={styles.chartContainer}>
        <View style={styles.combinedChartSection} testID="combined-chart">
          <BarChart
            data={chartData}
            width={350}
            height={200}
            initialSpacing={10}
            endSpacing={10}
            barWidth={calculateDynamicBarWidth(chartData.length)}
            roundedTop
            xAxisThickness={2}
            yAxisThickness={2}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{
              color: colors.textMuted,
              fontSize: 11,
            }}
            noOfSections={4}
            maxValue={yAxisMax > 0 ? yAxisMax : 10}
            yAxisLabelSuffix={` ${unitLabel}`}
            isAnimated
            animationDuration={1000}
          />
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
  },
  combinedChartSection: {
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DailyReadingChart;
