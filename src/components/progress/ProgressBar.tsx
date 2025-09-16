import LinearProgressBar from '@/components/shared/LinearProgressBar';
import { ThemedText } from '@/components/themed/ThemedText';
import { formatDeadlineDate } from '@/utils/dateUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  progressPercentage: number;
  deadlineDate: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercentage,
  deadlineDate,
}) => {
  return (
    <View>
      <LinearProgressBar
        progressPercentage={progressPercentage}
        height={12}
        borderRadius={4}
        showShimmer={true}
      />
      <View style={styles.progressText}>
        <ThemedText variant="muted">{progressPercentage}%</ThemedText>
        <ThemedText variant="muted">
          Deadline: {formatDeadlineDate(deadlineDate)}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressText: {
    gap: 4,
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: 8,
  },
  deadlineContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  deadlineText: {
    fontSize: 14,
  },
});

export default ProgressBar;
