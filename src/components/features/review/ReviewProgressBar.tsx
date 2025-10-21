import { ThemedText } from '@/components/themed';
import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ReviewProgressBarProps {
  postedCount: number;
  totalCount: number;
}

const ReviewProgressBar: React.FC<ReviewProgressBarProps> = ({
  postedCount,
  totalCount,
}) => {
  const percentage =
    totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText variant="secondary" style={styles.label}>
          Reviews Posted
        </ThemedText>
        <ThemedText style={styles.fraction}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.light.textSecondary,
  },
  fraction: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: FontFamily.semiBold,
    color: Colors.light.primary,
  },
  progressTrack: {
    height: 8,
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

export default ReviewProgressBar;
