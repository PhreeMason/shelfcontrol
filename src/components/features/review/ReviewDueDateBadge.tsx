import LinearProgressBar from '@/components/shared/LinearProgressBar';
import StatsSummaryCard from '@/components/stats/StatsSummaryCard';
import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
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
  const { colors } = useTheme();

  if (!reviewDueDate) return null;

  const daysUntilDue = calculateLocalDaysLeft(reviewDueDate);

  const isOverdue = daysUntilDue < 0;
  const percentage =
    totalCount > 0 ? Math.floor((postedCount / totalCount) * 100) : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const label = isOverdue ? 'REVIEW PASTDUE' : 'REVIEW DUE DATE';
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
          <ThemedText
            typography="bodyMedium"
            color="textSecondary"
            style={styles.progressLabel}
          >
            Reviews Posted
          </ThemedText>
          <ThemedText
            typography="bodyMedium"
            color="primary"
            style={styles.progressFraction}
          >
            {postedCount}/{totalCount}
          </ThemedText>
        </View>

        <LinearProgressBar
          progressPercentage={percentage}
          height={10}
          backgroundColor={colors.border}
          borderRadius={BorderRadius.full}
          showShimmer={false}
          gradientColors={[colors.primary, colors.primary]}
        />
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
    fontWeight: '600',
  },
  progressFraction: {
    fontWeight: '600',
  },
});

export default ReviewDueDateBadge;
