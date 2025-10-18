import ProgressBar from '@/components/progress/ProgressBar';
import StatsSummaryCard from '@/components/stats/StatsSummaryCard';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
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

  const currentProgress =
    deadline.progress && deadline.progress.length > 0
      ? deadline.progress[deadline.progress.length - 1].current_progress
      : deadline.total_quantity;

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
      <StatsSummaryCard
        label={statusLabel}
        dateText={formattedCompletionDate}
        subtitle={daysText}
      />

      <ThemedView style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <ThemedText style={styles.sectionLabel}>Pages Read</ThemedText>
          <ThemedText style={styles.progressFraction}>
            {currentProgress}/{deadline.total_quantity}
          </ThemedText>
        </View>
        <ProgressBar
          progressPercentage={100}
          deadlineDate={deadline.deadline_date}
          urgencyLevel="good"
          startDate={deadline.created_at}
        />
      </ThemedView>

      <ThemedView style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: colors.border }]}>
          <ThemedText style={[styles.statNumber, {color: colors.primary}]}>
            {averagePace ?? 'N/A'}
          </ThemedText>
          <ThemedText variant="default" style={styles.statLabel}>
            {averagePace ? formatAveragePace(averagePace, deadline.format).split(' ')[1] : 'avg pace'}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { borderColor: colors.border }]}>
          <ThemedText style={[styles.statNumber, {color: colors.primary}]}>{sessionCount}</ThemedText>
          <ThemedText variant="default" style={styles.statLabel}>
            reading sessions
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
            Total Pages
          </ThemedText>
          <ThemedText style={styles.timelineValue}>
            {deadline.total_quantity} pages
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
  progressSection: {
    gap: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressFraction: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  sectionLabel: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  statNumber: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
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
