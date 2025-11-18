import StatsSummaryCard from '@/components/stats/StatsSummaryCard';
import { ThemedText, ThemedView } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
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

  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    progressTrack: {
      backgroundColor: colors.border,
    },
    progressFill: {
      backgroundColor: colors.primary,
    },
    timelineItem: {
      borderBottomColor: colors.border,
    },
  };

  return (
    <ThemedView style={[styles.container, dynamicStyles.container]}>
      <StatsSummaryCard
        label={statusLabel}
        dateText={formattedCompletionDate}
        subtitle={daysText}
      >
        <View style={styles.progressSection}>
          <View style={styles.progressLabelContainer}>
            <ThemedText typography="titleSmall" color="textSecondary">
              {getProgressLabel(deadline.format)}
            </ThemedText>
            <ThemedText typography="titleSmall" color="primary">
              {deadline.format === 'audio'
                ? `${formatProgressDisplay(deadline.format, currentProgress)} / ${formatProgressDisplay(deadline.format, deadline.total_quantity)}`
                : `${currentProgress}/${deadline.total_quantity}`}
            </ThemedText>
          </View>

          <View style={[styles.progressTrack, dynamicStyles.progressTrack]}>
            <View
              style={[
                styles.progressFill,
                dynamicStyles.progressFill,
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
          <ThemedText typography="headlineLarge" color="primary">
            {deadline.format === 'audio' && averagePace
              ? formatProgressDisplay(deadline.format, averagePace)
              : (averagePace ?? 'N/A')}
          </ThemedText>
          <ThemedText typography="bodySmall" style={styles.statLabel}>
            {averagePace
              ? deadline.format === 'audio'
                ? 'avg listening pace'
                : formatAveragePace(averagePace, deadline.format)
                    .split(' ')
                    .slice(1)
                    .join(' ')
              : 'avg pace'}
          </ThemedText>
        </View>
        <View style={[styles.statCard, { borderColor: colors.border }]}>
          <ThemedText typography="headlineLarge" color="primary">
            {sessionCount}
          </ThemedText>
          <ThemedText typography="bodySmall" style={styles.statLabel}>
            {deadline.format === 'audio'
              ? 'listening sessions'
              : 'reading sessions'}
          </ThemedText>
        </View>
      </ThemedView>

      <ThemedView style={styles.timeline}>
        <ThemedText typography="titleMedium">Reading Timeline</ThemedText>
        <View style={[styles.timelineItem, dynamicStyles.timelineItem]}>
          <ThemedText variant="muted">Started</ThemedText>
          <ThemedText typography="labelLarge">{formattedStartDate}</ThemedText>
        </View>
        <View style={[styles.timelineItem, dynamicStyles.timelineItem]}>
          <ThemedText variant="muted">Finished</ThemedText>
          <ThemedText typography="labelLarge">
            {formattedCompletionDate}
          </ThemedText>
        </View>
        <View style={[styles.timelineItem, dynamicStyles.timelineItem]}>
          <ThemedText variant="muted">
            {getTotalLabel(deadline.format)}
          </ThemedText>
          <ThemedText typography="labelLarge">
            {deadline.format === 'audio'
              ? formatProgressDisplay(deadline.format, deadline.total_quantity)
              : `${deadline.total_quantity} pages`}
          </ThemedText>
        </View>
        <View style={[styles.timelineItem, dynamicStyles.timelineItem]}>
          <ThemedText variant="muted">Format</ThemedText>
          <ThemedText typography="labelLarge">
            {formatBookFormat(deadline.format)}
          </ThemedText>
        </View>
      </ThemedView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
    marginVertical: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  progressTrack: {
    height: 10,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
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
  statLabel: {
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
  },
});

export default ReadingStats;
