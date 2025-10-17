import ProgressBar from '@/components/progress/ProgressBar';
import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import {
  calculateAveragePace,
  calculateDaysToComplete,
  formatAveragePace,
  formatBookFormat,
  getCompletionDate,
  getCompletionStatusLabel,
  getReadingSessionCount,
  getReadingStartDate,
} from '@/utils/readingStatsUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ReadingStatsProps {
  deadline: ReadingDeadlineWithProgress;
}

const ReadingStats: React.FC<ReadingStatsProps> = ({ deadline }) => {
  const { colors } = useTheme();
  const { latestStatus } = getDeadlineStatus(deadline);

  const completionDate = getCompletionDate(deadline);
  const startDate = getReadingStartDate(deadline);
  const daysToComplete = calculateDaysToComplete(deadline);
  const averagePace = calculateAveragePace(deadline);
  const sessionCount = getReadingSessionCount(deadline);
  const statusLabel = getCompletionStatusLabel(latestStatus);

  const formattedCompletionDate = completionDate
    ? formatDisplayDate(completionDate, 'MMM D, YYYY')
    : 'N/A';

  const formattedStartDate = startDate
    ? formatDisplayDate(startDate, 'MMM D, YYYY')
    : 'N/A';

  const daysText =
    daysToComplete === 1
      ? '1 day to complete'
      : daysToComplete
        ? `${daysToComplete} days to complete`
        : 'Duration unknown';

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.summaryCard, { borderColor: colors.border }]}>
        <ThemedText variant="muted" style={styles.statusLabel}>
          {statusLabel}
        </ThemedText>
        <ThemedText
          style={[styles.completionDate, { color: colors.primary }]}
        >
          {formattedCompletionDate}
        </ThemedText>
        <ThemedText variant="muted" style={styles.daysSubtitle}>
          {daysText}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.progressSection}>
        <ThemedText style={styles.sectionLabel}>Reading Progress</ThemedText>
        <ProgressBar
          progressPercentage={100}
          deadlineDate={deadline.deadline_date}
          urgencyLevel="good"
          startDate={deadline.created_at}
        />
      </ThemedView>

      <ThemedView style={styles.statsGrid}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>
            {averagePace ?? 'N/A'}
          </ThemedText>
          <ThemedText variant="muted" style={styles.statLabel}>
            {averagePace ? formatAveragePace(averagePace, deadline.format).split(' ')[1] : 'AVG PACE'}
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={styles.statNumber}>{sessionCount}</ThemedText>
          <ThemedText variant="muted" style={styles.statLabel}>
            READING SESSIONS
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.timeline}>
        <ThemedText style={styles.sectionLabel}>Reading Timeline</ThemedText>
        <View style={styles.timelineItem}>
          <ThemedText variant="muted" style={styles.timelineLabel}>
            Started
          </ThemedText>
          <ThemedText style={styles.timelineValue}>
            {formattedStartDate}
          </ThemedText>
        </View>
        <View style={styles.timelineItem}>
          <ThemedText variant="muted" style={styles.timelineLabel}>
            Finished
          </ThemedText>
          <ThemedText style={styles.timelineValue}>
            {formattedCompletionDate}
          </ThemedText>
        </View>
        <View style={styles.timelineItem}>
          <ThemedText variant="muted" style={styles.timelineLabel}>
            Format
          </ThemedText>
          <ThemedText style={styles.timelineValue}>
            {formatBookFormat(deadline.format)}
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 20,
  },
  summaryCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 12,
    lineHeight: 16,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  completionDate: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  daysSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  progressSection: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1,
    textAlign: 'center',
  },
  timeline: {
    gap: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  timelineLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  timelineValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default ReadingStats;
