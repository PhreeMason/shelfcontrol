import StatsSummaryCard from '@/components/stats/StatsSummaryCard';
import { ThemedText } from '@/components/themed';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
import { calculateLocalDaysLeft } from '@/utils/dateNormalization';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ReviewDueDateBadgeProps {
  reviewDueDate: string | null;
  postedCount: number;
  totalCount: number;
}

const ReviewDueDateBadge: React.FC<ReviewDueDateBadgeProps> = ({
  reviewDueDate,
  postedCount,
  totalCount,
}) => {
  if (!reviewDueDate) return null;

  const daysUntilDue = calculateLocalDaysLeft(reviewDueDate);

  const isOverdue = daysUntilDue < 0;
  const percentage = totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const label = isOverdue ? 'REVIEW OVERDUE' : 'REVIEW DEADLINE';
  const subtitle = isOverdue
    ? `${Math.abs(daysUntilDue)} ${Math.abs(daysUntilDue) === 1 ? 'day' : 'days'} overdue`
    : `${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'} left`;

  return (
    <StatsSummaryCard
      label={label}
      dateText={formatDate(reviewDueDate)}
      subtitle={subtitle}
    >
      <View style={styles.progressSection}>
        <View style={styles.progressLabelContainer}>
          <ThemedText style={styles.progressLabel}>Reviews Posted</ThemedText>
          <ThemedText style={styles.progressFraction}>
            {postedCount}/{totalCount}
          </ThemedText>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>
      </View>
    </StatsSummaryCard>
  );
};

const styles = StyleSheet.create({
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
});

export default ReviewDueDateBadge;
