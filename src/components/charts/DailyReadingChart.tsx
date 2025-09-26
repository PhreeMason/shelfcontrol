import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { dayjs } from '@/lib/dayjs';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateCutoffTime,
  calculateRequiredPace,
  processBookProgress,
} from '@/utils/paceCalculations';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface DailyReadingChartProps {
  deadline: ReadingDeadlineWithProgress;
}

interface ReadingDay {
  date: string;
  progressRead: number;
  format: 'physical' | 'eBook' | 'audio';
}

const getBookReadingDays = (
  deadline: ReadingDeadlineWithProgress
): ReadingDay[] => {
  const dailyProgress: { [date: string]: number } = {};
  if (!deadline.progress || !Array.isArray(deadline.progress)) return [];

  const cutoffTime = calculateCutoffTime([deadline]);
  if (cutoffTime === null) {
    return [];
  }

  processBookProgress(deadline, cutoffTime, dailyProgress, deadline.format);

  const result = Object.entries(dailyProgress)
    .map(([date, progressRead]) => ({
      date,
      progressRead: Number(progressRead.toFixed(2)),
      format: deadline.format as 'physical' | 'eBook' | 'audio',
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return result;
};

const DailyReadingChart: React.FC<DailyReadingChartProps> = ({ deadline }) => {
  const { colors, typography } = useTheme();

  const getUnitLabel = (format: string) => {
    switch (format) {
      case 'audio':
        return 'min';
      default:
        return 'pg';
    }
  };

  const getChartTitle = (format: string) => {
    switch (format) {
      case 'audio':
        return 'Daily Listening Progress';
      default:
        return 'Daily Reading Progress';
    }
  };

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

  const currentProgress =
    deadline.progress?.length > 0
      ? deadline.progress[deadline.progress.length - 1].current_progress
      : 0;

  const deadlineDate = new Date(deadline.deadline_date);
  const today = new Date();
  const daysLeft = Math.max(
    1,
    Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const dailyMinimum = calculateRequiredPace(
    deadline.total_quantity,
    currentProgress,
    daysLeft,
    deadline.format
  );

  const displayDailyMinimum = dailyMinimum;

  const chartData = recentDays.map(day => {
    const label = dayjs(day.date).format('M/DD');
    return {
      value: Math.round(day.progressRead),
      label: label,
      frontColor: colors.primary,
      spacing: 2,
      labelWidth: 40,
      labelTextStyle: {
        color: colors.text,
        fontSize: 9,
        fontWeight: 'normal' as const,
      },
      topLabelComponent: () => (
        <ThemedText
          style={{
            color: colors.text,
            fontSize: 10,
            fontWeight: 'bold',
            textAlign: 'center',
            backgroundColor: 'transparent',
          }}
        >
          {Math.round(day.progressRead)}
        </ThemedText>
      ),
    };
  });

  const maxBarValue = Math.max(...chartData.map(d => d.value));
  const maxValue = Math.max(maxBarValue, displayDailyMinimum);
  const yAxisMax = Math.ceil(maxValue * 1.2);

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
            barWidth={(() => {
              const calculatedWidth = Math.max(
                20,
                Math.min(30, 320 / chartData.length)
              );
              return calculatedWidth;
            })()}
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
