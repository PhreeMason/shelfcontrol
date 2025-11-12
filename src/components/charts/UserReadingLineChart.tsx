import { LineChartSection } from '@/components/charts/LineChartSection';
import { ThemedText, ThemedView } from '@/components/themed';
import { CHART_CONFIG } from '@/constants/ChartConfig';
import { CHART_DATE_FORMATS } from '@/constants/DateFormats';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getAllUserActivityDays } from '@/utils/chartDataUtils';
import { parseServerDateOnly } from '@/utils/dateNormalization';
import React, { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';

/**
 * Props for the UserReadingLineChart component
 *
 * @property {ReadingDeadlineWithProgress[]} deadlines - Array of reading deadlines with progress data
 *
 * @example
 * <UserReadingLineChart
 *   deadlines={[
 *     {
 *       id: '1',
 *       book: { title: 'Example Book', totalPages: 300 },
 *       targetDate: '2025-01-15',
 *       progress: { currentPage: 150 },
 *       // ...other deadline properties
 *     }
 *   ]}
 * />
 */
export interface UserReadingLineChartProps {
  deadlines: ReadingDeadlineWithProgress[];
}

/**
 * User reading activity and targets visualization component
 *
 * Displays dual-line charts showing actual vs target reading and listening progress over time.
 * Automatically aggregates daily activity from all active deadlines and renders interactive
 * charts with toggleable data lines.
 *
 * Features:
 * - Reading progress chart (pages read vs target pages)
 * - Listening progress chart (minutes listened vs target minutes)
 * - Conditional rendering - only shows listening chart if user has listening activity
 * - Interactive legend for toggling data lines
 * - Empty state when no activity is recorded
 * - Memoized data processing for performance
 * - Responsive chart sizing
 *
 * Data Processing:
 * - Aggregates activity across all deadlines using `getAllUserActivityDays`
 * - Shows every nth date label for better readability (configurable via CHART_CONFIG.LABEL_INTERVAL)
 * - Calculates dynamic Y-axis max with buffer for visual clarity
 * - Rounds all values for cleaner display
 *
 * @param {UserReadingLineChartProps} props - Component props
 * @returns {JSX.Element} Rendered reading activity charts
 *
 * @example
 * // Basic usage in stats screen
 * import UserReadingLineChart from '@/components/charts/UserReadingLineChart';
 *
 * function StatsScreen() {
 *   const { data: deadlines } = useDeadlines();
 *
 *   return (
 *     <ScrollView>
 *       <UserReadingLineChart deadlines={deadlines} />
 *     </ScrollView>
 *   );
 * }
 *
 * @example
 * // With filtered deadlines (e.g., only active deadlines)
 * const activeDeadlines = deadlines.filter(d => d.status === 'active');
 * <UserReadingLineChart deadlines={activeDeadlines} />
 *
 * @example
 * // Empty state is handled automatically
 * <UserReadingLineChart deadlines={[]} />
 * // Displays: "No activity recorded" with subtitle
 */
const UserReadingLineChart: React.FC<UserReadingLineChartProps> = ({
  deadlines,
}) => {
  const { colors } = useTheme();

  // Toggle states for showing/hiding lines
  const [showActualPages, setShowActualPages] = useState(true);
  const [showTargetPages, setShowTargetPages] = useState(true);
  const [showActualMinutes, setShowActualMinutes] = useState(true);
  const [showTargetMinutes, setShowTargetMinutes] = useState(true);

  // Get all activity days with targets (memoized for performance)
  const activityDays = useMemo(
    () => getAllUserActivityDays(deadlines),
    [deadlines]
  );

  if (activityDays.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={[styles.mainTitle, { color: colors.text }]}>
          Reading Activity & Targets
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

  // Transform data for all 4 charts
  // Show every nth date label for better readability
  const pagesReadData = activityDays.map((day, index) => ({
    value: Math.round(day.pagesRead),
    label: index % CHART_CONFIG.LABEL_INTERVAL === 0 ? parseServerDateOnly(day.date).format(CHART_DATE_FORMATS.LABEL) : '',
    dataPointText: String(Math.round(day.pagesRead)),
  }));

  const minutesListenedData = activityDays.map((day, index) => ({
    value: Math.round(day.minutesListened),
    label: index % CHART_CONFIG.LABEL_INTERVAL === 0 ? parseServerDateOnly(day.date).format(CHART_DATE_FORMATS.LABEL) : '',
    dataPointText: String(Math.round(day.minutesListened)),
  }));

  const targetPagesData = activityDays.map((day, index) => ({
    value: Math.round(day.targetPages),
    label: index % CHART_CONFIG.LABEL_INTERVAL === 0 ? parseServerDateOnly(day.date).format(CHART_DATE_FORMATS.LABEL) : '',
    dataPointText: String(Math.round(day.targetPages)),
  }));

  const targetMinutesData = activityDays.map((day, index) => ({
    value: Math.round(day.targetMinutes),
    label: index % CHART_CONFIG.LABEL_INTERVAL === 0 ? parseServerDateOnly(day.date).format(CHART_DATE_FORMATS.LABEL) : '',
    dataPointText: String(Math.round(day.targetMinutes)),
  }));

  // Calculate combined max values for combination charts
  const maxPagesRead = Math.max(...pagesReadData.map(d => d.value), CHART_CONFIG.MIN_Y_AXIS_MAX);
  const maxTargetPages = Math.max(...targetPagesData.map(d => d.value), CHART_CONFIG.MIN_Y_AXIS_MAX);
  const maxReadingActivity = Math.max(maxPagesRead, maxTargetPages);
  const yAxisMaxReading = Math.ceil(maxReadingActivity * CHART_CONFIG.Y_AXIS_BUFFER_MULTIPLIER);

  // Calculate max values for listening (without MIN_Y_AXIS_MAX for detection)
  const maxMinutesListenedRaw = Math.max(...minutesListenedData.map(d => d.value), 0);
  const maxTargetMinutesRaw = Math.max(...targetMinutesData.map(d => d.value), 0);

  // Check if user has any listening activity (before applying MIN_Y_AXIS_MAX)
  const hasListeningActivity = maxMinutesListenedRaw > 0 || maxTargetMinutesRaw > 0;

  // Apply MIN_Y_AXIS_MAX for chart rendering
  const maxMinutesListened = Math.max(maxMinutesListenedRaw, CHART_CONFIG.MIN_Y_AXIS_MAX);
  const maxTargetMinutes = Math.max(maxTargetMinutesRaw, CHART_CONFIG.MIN_Y_AXIS_MAX);
  const maxListeningActivity = Math.max(maxMinutesListened, maxTargetMinutes);
  const yAxisMaxListening = Math.ceil(maxListeningActivity * CHART_CONFIG.Y_AXIS_BUFFER_MULTIPLIER);

  return (
    <ThemedView style={styles.container} testID="user-reading-line-chart">
      {/* Combination Chart 1: Reading Progress (Pages Read + Target) */}
      <LineChartSection
        title="Reading Progress & Target"
        actualData={pagesReadData}
        targetData={targetPagesData}
        actualLabel="Actual Pages"
        targetLabel="Target Pages"
        actualColor={colors.primary}
        targetColor={colors.accent}
        showActual={showActualPages}
        showTarget={showTargetPages}
        onToggleActual={() => setShowActualPages(!showActualPages)}
        onToggleTarget={() => setShowTargetPages(!showTargetPages)}
        yAxisMax={yAxisMaxReading}
        colors={{
          text: colors.text,
          textMuted: colors.textMuted,
          border: colors.border,
        }}
      />

      {/* Combination Chart 2: Listening Progress (Minutes Listened + Target) */}
      {hasListeningActivity && (
        <LineChartSection
          title="Listening Progress & Target"
          actualData={minutesListenedData}
          targetData={targetMinutesData}
          actualLabel="Actual Minutes"
          targetLabel="Target Minutes"
          actualColor={colors.secondary}
          targetColor={colors.orange}
          showActual={showActualMinutes}
          showTarget={showTargetMinutes}
          onToggleActual={() => setShowActualMinutes(!showActualMinutes)}
          onToggleTarget={() => setShowTargetMinutes(!showTargetMinutes)}
          yAxisMax={yAxisMaxListening}
          colors={{
            text: colors.text,
            textMuted: colors.textMuted,
            border: colors.border,
          }}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    borderRadius: 12,
    width: '100%',
    transform: [{ translateX: -10 }],
  },
  mainTitle: {
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 10,
    fontSize: 18,
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

export default UserReadingLineChart;
