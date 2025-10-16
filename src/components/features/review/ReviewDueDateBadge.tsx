import { ThemedText } from '@/components/themed';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ReviewDueDateBadgeProps {
  reviewDueDate: string | null;
}

const ReviewDueDateBadge: React.FC<ReviewDueDateBadgeProps> = ({ reviewDueDate }) => {
  if (!reviewDueDate) return null;

  const dueDate = new Date(reviewDueDate);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const isOverdue = daysUntilDue < 0;
  const isApproaching = daysUntilDue >= 0 && daysUntilDue < 3;

  const backgroundColor = isOverdue
    ? Colors.light.errorContainer
    : isApproaching
    ? Colors.light.warningContainer
    : Colors.light.successContainer;

  const textColor = isOverdue
    ? Colors.light.error
    : isApproaching
    ? Colors.light.warning
    : Colors.light.success;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <ThemedText style={[styles.badgeText, { color: textColor }]}>
        {isOverdue ? 'Overdue: ' : 'Review by: '}
        {formatDate(dueDate)}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: FontFamily.medium,
  },
});

export default ReviewDueDateBadge;
