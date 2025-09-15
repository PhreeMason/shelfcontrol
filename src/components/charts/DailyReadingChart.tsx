import { ThemedText, ThemedView } from "@/components/themed";
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from "@/types/deadline.types";
import { calculateCutoffTime, calculateRequiredPace, minimumUnitsPerDayFromDeadline, processBookProgress } from "@/utils/paceCalculations";
import dayjs from "dayjs";
import React from "react";
import { StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

interface DailyReadingChartProps {
  deadline: ReadingDeadlineWithProgress;
}

interface ReadingDay {
  date: string;
  progressRead: number;
  format: "physical" | "eBook" | "audio";
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
      format: deadline.format as "physical" | "eBook" | "audio",
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return result;
};

const DailyReadingChart: React.FC<DailyReadingChartProps> = ({ deadline }) => {
  const { colors } = useTheme();

  // Get format-specific labels (moved up before early return)
  const getUnitLabel = (format: string) => {
    switch (format) {
      case "audio":
        return "min";
      case "eBook":
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
        return "Daily Reading Progress";
      case "eBook":
        return "Daily Reading Progress";
      case "physical":
        return "Daily Reading Progress";
      default:
        return "Daily Reading Progress";
    }
  };

  const getSubtitle = (format: string) => {
    switch (format) {
      case "audio":
        return "Daily progress (bars) & required pace (line)";
      case "eBook":
        return "Daily progress (bars) & required pace (line)";
      case "physical":
        return "Daily progress (bars) & required pace (line)";
      default:
        return "Daily progress (bars) & required pace (line)";
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
      frontColor: colors.primary,
      spacing: 2,
      labelWidth: 40,
      labelTextStyle: {
        color: colors.text,
        fontSize: 9,
        fontWeight: "normal" as const,
      },
      topLabelComponent: () => (
        <ThemedText style={{
          color: colors.text,
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

  // Get the required daily pace data and align it with bar chart data
  const lineChartRealData = minimumUnitsPerDayFromDeadline(deadline);
  
  // Create line data that matches the bar chart dates
  const lineData = recentDays.map((day) => {
    // Find matching date in lineChartRealData or use the closest available value
    const matchingLineData = lineChartRealData.find(lineDay => 
      dayjs(lineDay.label).format("M/DD") === dayjs(day.date).format("M/DD")
    );
    
    return {
      value: matchingLineData ? matchingLineData.value : displayDailyMinimum,
      label: dayjs(day.date).format("M/DD"),
      dataPointText: matchingLineData ? `${Math.round(matchingLineData.value)}` : `${Math.round(displayDailyMinimum)}`,
    };
  });

  const maxBarValue = Math.max(...chartData.map((d) => d.value));
  const maxLineValue = Math.max(...lineData.map((d) => d.value));
  const maxValue = Math.max(maxBarValue, maxLineValue, displayDailyMinimum);
  const yAxisMax = Math.ceil(maxValue * 1.2); // Add 20% padding

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={[styles.title, { color: colors.text }]}>
        {chartTitle}
      </ThemedText>

      <View style={styles.chartContainer}>
        {/* Combined Bar Chart with Line Overlay */}
        <View style={styles.combinedChartSection} testID="combined-chart">
          <BarChart
            // Bar chart data
            data={chartData}
            
            // Enable line overlay
            showLine={true}
            lineData={lineData}
            
            // Chart dimensions
            width={350}
            height={200}
            initialSpacing={10}
            endSpacing={10}
            
            // Bar styling (maintain your existing styling)
            barWidth={(() => {
              const calculatedWidth = Math.max(20, Math.min(35, 320 / chartData.length));
              return calculatedWidth;
            })()}
            roundedTop
            
            // Line configuration (using your theme colors)
            lineConfig={{
              thickness: 3,
              color: colors.accent,
              curved: true,
              dataPointsShape: 'circular',
              dataPointsWidth: 6,
              dataPointsHeight: 6,
              dataPointsColor: colors.accent,
              hideDataPoints: false,
            }}
            
            // Axis styling (maintain your existing styling)
            hideRules
            xAxisThickness={2}
            yAxisThickness={2}
            xAxisColor={colors.border}
            yAxisColor={colors.border}
            yAxisTextStyle={{
              color: colors.textMuted,
              fontSize: 11,
            }}
            xAxisLabelTextStyle={{
              color: colors.textMuted,
              fontSize: 10,
              textAlign: "left",
            }}
            
            // Y-axis configuration
            noOfSections={4}
            maxValue={yAxisMax > 0 ? yAxisMax : 10}
            yAxisLabelSuffix={` ${unitLabel}`}        
            
            // Animation
            isAnimated
            animationDuration={1000}
          />
        </View>
        
        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBar, { backgroundColor: colors.primary }]} />
            <ThemedText style={[styles.legendText, { color: colors.textMuted }]}>
              Daily Progress
            </ThemedText>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendLine, { backgroundColor: colors.accent }]} />
            <ThemedText style={[styles.legendText, { color: colors.textMuted }]}>
              Required Pace
            </ThemedText>
          </View>
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
  combinedChartSection: {
    alignItems: "center",
    marginBottom: 16,
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
    borderRadius: 1,
  },
  legendText: {
    fontSize: 12,
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
