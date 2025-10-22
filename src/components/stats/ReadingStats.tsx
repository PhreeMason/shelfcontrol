import StatsSummaryCard from '@/components/stats/StatsSummaryCard';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getDeadlineStatus } from '@/utils/deadlineProviderUtils';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import {
  calculateAveragePace,
  calculateDaysToComplete,
  formatAveragePace,
  formatBookFormat,
  getCompletionDate,
  getCompletionStatusLabel,
  getProgressLabel,
  getReadingSessionCount,
  getReadingStartDate,
  getTotalLabel,
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

  const currentProgress =
    deadline.progress && deadline.progress.length > 0
      ? deadline.progress[deadline.progress.length - 1].current_progress
      : deadline.total_quantity;

  const averagePace = calculateAveragePace(deadline, currentProgress);
  const sessionCount = getReadingSessionCount(deadline);
  const statusLabel = getCompletionStatusLabel(latestStatus, deadline.format);

  const progressPercentage =
    deadline.total_quantity > 0
      ? Math.round((currentProgress / deadline.total_quantity) * 100)
      : 0;

  const formattedCompletionDate = completionDate
    ? formatDisplayDate(completionDate, 'MMM D, YYYY')
    : 'N/A';

  const formattedStartDate = startDate
    ? formatDisplayDate(startDate, 'MMM D, YYYY')
    : 'N/A';

  const daysText =
    daysToComplete === 1
      ? '1 day total'
      : daysToComplete
        ? `${daysToComplete} days total`
        : 'Duration unknown';

  return (
    <ThemedView style={styles.container}>
      <StatsSummaryCard
        label={statusLabel}
        dateText={formattedCompletionDate}
        subtitle={daysText}
      >
        <View style={styles.progressSection}>
          <View style={styles.progressLabelContainer}>
            <ThemedText style={styles.progressLabel}>
              {getProgressLabel(deadline.format)}
            </ThemedText>
            <ThemedText style={styles.progressFraction}>
              {deadline.format === 'audio'
                ? `${formatProgressDisplay(deadline.format, currentProgress)} / ${formatProgressDisplay(deadline.format, deadline.total_quantity)}`
                : `${currentProgress}/${deadline.total_quantity}`}
            </ThemedText>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>
        </View>
      </StatsSummaryCard>

      <ThemedView style={styles.statsGrid}>
        <View style={[styles.statCard, { borderColor: colors.border }]}>
          <ThemedText style={[styles.statNumber, { color: colors.primary }]}>
            {deadline.format === 'audio' && averagePace
              ? formatProgressDisplay(deadline.format, averagePace)
              : averagePace ?? 'N/A'}
          </ThemedText>
          <ThemedText variant="default" style={styles.statLabel}>
            {averagePace
              ? deadline.format === 'audio'
                ? 'avg listening pace'
                : formatAveragePace(averagePace, deadline.format).split(' ').slice(1).join(' ')
              : 'avg pace'}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { borderColor: colors.border }]}>
          <ThemedText style={[styles.statNumber, { color: colors.primary }]}>
            {sessionCount}
          </ThemedText>
          <ThemedText variant="default" style={styles.statLabel}>
            {deadline.format === 'audio' ? 'listening sessions' : 'reading sessions'}
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
            {getTotalLabel(deadline.format)}
          </ThemedText>
          <ThemedText style={styles.timelineValue}>
            {deadline.format === 'audio'
              ? formatProgressDisplay(deadline.format, deadline.total_quantity)
              : `${deadline.total_quantity} pages`}
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
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  progressSection: {
    width: '100%',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontFamily.regular,
    color: Colors.light.textSecondary,
  },
  progressFraction: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
    color: Colors.light.primary,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.light.border,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
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
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  statNumber: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: 'bold',
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
