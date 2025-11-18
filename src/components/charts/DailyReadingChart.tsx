/**
 * Daily Reading Chart Component
 * Shows cumulative daily progress vs. required pace for a reading deadline
 */

import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LineChart, CurveType } from 'react-native-gifted-charts';
import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import {
  calculateDailyCumulativeProgress,
  transformToDailyChartData,
} from '@/utils/dailyChartDataUtils';
import { DailyChartLegend } from './DailyChartLegend';
import {
  CHART_ANIMATION,
  CHART_CONFIG,
  CHART_STYLING,
} from '@/constants/ChartConfig';
import { normalizeServerDate } from '@/utils/dateNormalization';
import { BorderRadius } from '@/constants/Colors';

interface DailyReadingChartProps {
  deadline: ReadingDeadlineWithProgress;
}

const DailyReadingChart: React.FC<DailyReadingChartProps> = ({ deadline }) => {
  const { colors } = useTheme();

  // Check if deadline is completed
  const isCompleted = useMemo(() => {
    if (!deadline.status || deadline.status.length === 0) {
      return false;
    }

    // Terminal statuses that indicate completion
    const terminalStatuses = [
      'complete',
      'did_not_finish',
      'rejected',
      'withdrew',
      'to_review',
    ];

    // Sort statuses by date to get latest
    const sortedStatuses = [...deadline.status].sort((a, b) => {
      const aTime = normalizeServerDate(a.created_at).valueOf();
      const bTime = normalizeServerDate(b.created_at).valueOf();
      return bTime - aTime; // Descending order (latest first)
    });

    const latestStatus = sortedStatuses[0];

    return (
      latestStatus != null &&
      latestStatus.status != null &&
      terminalStatuses.includes(latestStatus.status)
    );
  }, [deadline.status]);

  // For completed books, use last progress date instead of today
  const chartEndDate = useMemo(() => {
    if (!isCompleted || !deadline.progress || deadline.progress.length === 0) {
      return undefined;
    }

    // Get the latest progress entry date
    const sortedProgress = [...deadline.progress]
      .filter(p => !p.ignore_in_calcs)
      .sort((a, b) => {
        const aTime = normalizeServerDate(a.created_at).valueOf();
        const bTime = normalizeServerDate(b.created_at).valueOf();
        return bTime - aTime; // Descending order (latest first)
      });

    if (sortedProgress.length > 0) {
      return normalizeServerDate(sortedProgress[0].created_at).startOf('day');
    }

    return undefined;
  }, [isCompleted, deadline.progress]);

  // Calculate daily cumulative progress
  const dailyData = useMemo(() => {
    return calculateDailyCumulativeProgress(
      deadline,
      CHART_CONFIG.DEFAULT_DAYS_TO_SHOW,
      chartEndDate
    );
  }, [deadline, chartEndDate]);

  // Transform data for chart
  const chartData = useMemo(() => {
    if (dailyData.length === 0) {
      return null;
    }

    return transformToDailyChartData(
      dailyData,
      dailyData,
      deadline.format,
      isCompleted
    );
  }, [dailyData, deadline.format, isCompleted]);

  // Handle empty state
  if (!chartData || dailyData.length === 0) {
    return (
      <ThemedView style={styles.emptyContainer} testID="daily-chart-empty">
        <ThemedText
          style={styles.emptyText}
          variant="muted"
          testID="empty-message"
        >
          Not enough progress data to display chart. Start reading to see your
          daily progress!
        </ThemedText>
      </ThemedView>
    );
  }

  const { actualLineData, requiredLineData, maxValue } = chartData;

  // Calculate nice max value for y-axis (round up to nearest nice number)
  const yAxisMax =
    Math.ceil(
      (maxValue * CHART_CONFIG.Y_AXIS_BUFFER_MULTIPLIER) /
        CHART_CONFIG.Y_AXIS_ROUNDING_FACTOR
    ) * CHART_CONFIG.Y_AXIS_ROUNDING_FACTOR;

  return (
    <ThemedView style={styles.container} testID="daily-reading-chart">
      {/* Title */}
      <ThemedText variant="title" testID="chart-title">
        {deadline.format === 'audio' ? 'Listening' : 'Reading'} Progress
      </ThemedText>

      {/* Chart */}
      <View style={styles.chartContainer} testID="chart-container">
        <LineChart
          // Required data
          data={requiredLineData}
          // Actual data (second line)
          data2={actualLineData}
          // Required line styling (solid gray)
          color={colors.textMuted}
          thickness={2}
          startOpacity={0}
          endOpacity={0}
          hideDataPoints={true}
          // Actual line styling (solid primary color with area fill and visible data points on activity days)
          color2={colors.primary}
          thickness2={3}
          hideDataPoints2={false}
          startFillColor2={colors.primary}
          endFillColor2={colors.primary}
          startOpacity2={0.2}
          endOpacity2={0.05}
          // Chart dimensions
          width={CHART_CONFIG.DEFAULT_WIDTH}
          height={CHART_CONFIG.DEFAULT_HEIGHT}
          adjustToWidth
          // Curve style
          curved
          curveType={CurveType.QUADRATIC}
          // Area fill
          areaChart
          areaChart2
          // Spacing
          initialSpacing={CHART_CONFIG.INITIAL_SPACING}
          // Axes
          xAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          yAxisThickness={CHART_STYLING.AXIS_THICKNESS}
          xAxisColor={colors.border}
          yAxisColor={colors.border}
          // Labels
          xAxisLabelTextStyle={{
            color: colors.textMuted,
            fontSize: CHART_STYLING.X_AXIS_LABEL_FONT_SIZE,
            width: CHART_STYLING.X_AXIS_LABEL_WIDTH,
            textAlign: 'center',
          }}
          yAxisTextStyle={{
            color: colors.textMuted,
            fontSize: CHART_STYLING.Y_AXIS_LABEL_FONT_SIZE,
          }}
          // Y-axis configuration
          noOfSections={CHART_STYLING.NUMBER_OF_SECTIONS}
          maxValue={yAxisMax}
          mostNegativeValue={0}
          yAxisLabelWidth={CHART_STYLING.Y_AXIS_LABEL_WIDTH}
          // Animation
          isAnimated={CHART_ANIMATION.ENABLED}
          animationDuration={CHART_ANIMATION.DURATION}
        />
      </View>

      {/* Legend */}
      <DailyChartLegend testID="chart-legend" />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: BorderRadius.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
});

export default DailyReadingChart;
