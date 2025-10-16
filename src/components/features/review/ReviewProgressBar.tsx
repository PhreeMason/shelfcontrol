import { ThemedText } from '@/components/themed';
import { BorderRadius, Colors, Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ReviewProgressBarProps {
  postedCount: number;
  totalCount: number;
}

const ReviewProgressBar: React.FC<ReviewProgressBarProps> = ({ postedCount, totalCount }) => {
  const percentage = totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      <ThemedText variant="secondary" style={styles.label}>
        Reviews Posted: {postedCount} of {totalCount}
      </ThemedText>

      <View style={styles.progressBarContainer}>
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
        <ThemedText style={styles.percentage}>{percentage}%</ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.light.surfaceVariant,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.full,
  },
  percentage: {
    fontSize: 9,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    minWidth: 32,
    textAlign: 'right',
  },
});

export default ReviewProgressBar;
