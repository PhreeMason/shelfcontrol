import { ThemedText, ThemedView } from "@/components/themed";
import { useThemeColor } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from "@/types/deadline.types";
import { calculateCutoffTime, calculateRequiredPace, minimumUnitsPerDayFromDeadline, processBookProgress } from "@/utils/paceCalculations";
import dayjs from "dayjs";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";

interface DailyReadingChartProps {
  deadline: ReadingDeadlineWithProgress;
}

interface ReadingDay {
  date: string;
  progressRead: number;
  format: "physical" | "ebook" | "audio";
}

const getBookReadingDays = (
  deadline: ReadingDeadlineWithProgress
): ReadingDay[] => {
  const dailyProgress: { [date: string]: number } = {};

  // Sort progress updates by date
  if (!deadline.progress || !Array.isArray(deadline.progress)) return [];

  const cutoffTime = calculateCutoffTime([deadline]);
  if (cutoffTime === null) {
    return [];
  }

  processBookProgress(deadline, cutoffTime, dailyProgress, deadline.format);

  // Convert dictionary to sorted array
  const result = Object.entries(dailyProgress)
    .map(([date, progressRead]) => ({
      date,
      progressRead: Number(progressRead.toFixed(2)),
      format: deadline.format as "physical" | "ebook" | "audio",
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return result;
};

const DailyReadingChart: React.FC<DailyReadingChartProps> = ({ deadline }) => {
  const border = useThemeColor({}, 'border');
  const primary = useThemeColor({}, 'primary');
  const text = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const accent = useThemeColor({}, 'accent');

  // Get format-specific labels (moved up before early return)
  const getUnitLabel = (format: string) => {
    switch (format) {
      case "audio":
        return "min";
      case "ebook":
        return "%";
      case "physical":
        return "pg";
      default:
        return "pg";
    }
  };

  const getChartTitle = (format: string) => {
    switch (format) {
      case "audio":
        return "Daily Required Pace";
      case "ebook":
        return "Required Daily Pace";
      case "physical":
        return "Required Daily Pace";
      default:
        return "Required Daily Pace";
    }
  };

  const getSubtitle = (format: string) => {
    switch (format) {
      case "audio":
        return "Minutes listened per day";
      case "ebook":
        return "Percentage read per day";
      case "physical":
        return "Pages read per day";
      default:
        return "Progress per day";
    }
  };

  const unitLabel = getUnitLabel(deadline.format);
  const chartTitle = getChartTitle(deadline.format);
  const subtitle = getSubtitle(deadline.format);

  const recentDays = getBookReadingDays(deadline);

  // If no reading data, show empty state
  if (recentDays.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.title, { color: text }]}>
          Required Daily Pace
        </ThemedText>
        <ThemedView style={styles.emptyState}>
          <ThemedText
            style={[styles.emptyStateText, { color: textMuted }]}
          >
            No reading activity recorded
          </ThemedText>
          <ThemedText
            style={[styles.emptyStateSubtext, { color: textMuted }]}
          >
            Start reading to see your daily progress
          </ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // Calculate daily minimum goal
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

  // Display daily minimum directly (no conversion needed)
  const displayDailyMinimum = dailyMinimum;

  // Prepare data for the bar chart
  const chartData = recentDays.map((day) => {
    const label = dayjs(day.date).format("M/DD");
    return {
      value: Math.round(day.progressRead),
      label: label,
      frontColor: primary,
      spacing: 2, // Changed: consistent spacing for all bars
      labelWidth: 40,
      labelTextStyle: {
        color: text,
        fontSize: 9,
        fontWeight: "normal" as const,
      },
      topLabelComponent: () => (
        <ThemedText style={{
          color: text,
          fontSize: 10,
          fontWeight: "bold",
          textAlign: 'center',
          backgroundColor: 'transparent',
        }}>
          {Math.round(day.progressRead)}
        </ThemedText>
      ),
    };
  });

  // Prepare data for the line chart (required daily pace)
  const lineChartRealData = minimumUnitsPerDayFromDeadline(deadline);

  const maxValue = Math.max(
    ...chartData.map((d) => d.value),
    displayDailyMinimum
  );
  const yAxisMax = Math.ceil(maxValue * 1.2); // Add 20% padding

  const lineMaxValue = Math.max(...lineChartRealData.map((d) => d.value));
  const lineYAxisMax = Math.ceil(lineMaxValue * 1.1); // Add 10% padding

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.title, { color: text }]}>
        {chartTitle}
      </ThemedText>

      <View style={styles.chartContainer}>
        {/* Line Chart - Required Daily Pace */}
        <View style={styles.lineChartSection} testID="line-chart">
          <ThemedText style={[styles.chartSubtitle, { color: textMuted }]}>
            Required Daily Pace
          </ThemedText>
          <LineChart
            data={lineChartRealData}
            width={300}
            height={120}
            spacing={chartData.length > 1 ? 280 / (chartData.length - 1) : 280}
            hideRules
            hideDataPoints={false}
            dataPointsColor={accent}
            dataPointsRadius={3}
            color={accent}
            thickness={2}
            curved
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor={border}
            yAxisColor={border}
            yAxisTextStyle={{
              color: textMuted,
              fontSize: 10,
            }}
            xAxisLabelTextStyle={{
              color: textMuted,
              fontSize: 9,
              textAlign: "center",
            }}
            noOfSections={3}
            maxValue={lineYAxisMax > 0 ? lineYAxisMax : 10}
            yAxisLabelSuffix={` ${unitLabel}`}
            isAnimated
            animationDuration={1000}
          />
        </View>

        {/* Bar Chart - Daily Progress */}
        <View style={styles.barChartSection} testID="bar-chart">
          <ThemedText style={[styles.chartSubtitle, { color: textMuted }]}>
            Daily Progress
          </ThemedText>
          <BarChart
            data={chartData}
            width={350}
            height={180}
            initialSpacing={10}
            endSpacing={10}
            barWidth={(() => {
              const calculatedWidth = Math.max(20, Math.min(35, 320 / chartData.length));
              return calculatedWidth;
            })()}
            roundedTop
            hideRules
            xAxisThickness={2}
            yAxisThickness={2}
            xAxisColor={border}
            yAxisColor={border}
            yAxisTextStyle={{
              color: textMuted,
              fontSize: 11,
            }}
            xAxisLabelTextStyle={{
              color: textMuted,
              fontSize: 10,
              textAlign: "left",
            }}
            noOfSections={4}
            maxValue={yAxisMax > 0 ? yAxisMax : 10}
            yAxisLabelSuffix={` ${unitLabel}`}
            showReferenceLine1
            referenceLine1Position={displayDailyMinimum}
            referenceLine1Config={{
              color: accent,
              dashWidth: 3,
              dashGap: 2,
              thickness: 2,
              labelTextStyle: {
                color: accent,
                fontSize: 10,
                fontWeight: "bold",
              },
            }}
            isAnimated
            animationDuration={800}
          />
        </View>
      </View>

      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: accent }]}
          />
          <ThemedText style={[styles.legendText, { color: textMuted }]}>
            Cumulative Progress
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendBar, { backgroundColor: primary }]}
          />
          <ThemedText style={[styles.legendText, { color: textMuted }]}>
            Daily Progress
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendLine, { backgroundColor: accent }]}
          />
          <ThemedText style={[styles.legendText, { color: textMuted }]}>
            Daily Goal ({displayDailyMinimum} {unitLabel})
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.subtitle, { color: textMuted }]}>
        {subtitle}
      </ThemedText>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderRadius: 12,
    width: "100%",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  lineChartSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  barChartSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  chartSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendBar: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
  },
  legendLine: {
    width: 12,
    height: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
  subtitle: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default DailyReadingChart;
