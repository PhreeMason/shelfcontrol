import { ThemedText } from '@/components/themed';
import { BorderRadius, Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
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
  const { colors } = useTheme();
  const percentage =
    totalCount > 0 ? Math.round((postedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        <ThemedText typography="bodyMedium" color="textSecondary">
          Reviews Posted
        </ThemedText>
        <ThemedText
          typography="bodyMedium"
          color="primary"
          style={styles.fraction}
        >
          {postedCount}/{totalCount}
        </ThemedText>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: colors.primary,
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
  fraction: {
    fontWeight: '600',
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});

export default ReviewProgressBar;
