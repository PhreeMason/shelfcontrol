import LinearProgressBar from '@/components/shared/LinearProgressBar';
import { ThemedText } from '@/components/themed/ThemedText';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useTheme';
import { dayjs } from '@/lib/dayjs';
import { formatDeadlineDate } from '@/utils/dateUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  progressPercentage: number;
  deadlineDate: string;
  urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible';
  startDate: string;
  beginMessage: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progressPercentage,
  deadlineDate,
  urgencyLevel,
  startDate,
  beginMessage,
}) => {
  const [isDateFromNow, setIsDateFromNow] = React.useState(true);

  const { colors } = useTheme();
  const textColor = colors[urgencyLevel] || colors.text;
  return (
    <View>
      <LinearProgressBar
        progressPercentage={progressPercentage}
        height={12}
        borderRadius={4}
        showShimmer={true}
      />
      <View style={styles.progressText}>
        <ThemedText
          variant="muted"
          onPress={() => setIsDateFromNow(!isDateFromNow)}
        >
          {beginMessage}{' '}
          {isDateFromNow
            ? dayjs(startDate).fromNow()
            : dayjs(startDate).format('MM D, YYYY')}
        </ThemedText>
        <ThemedText variant="muted" style={[{ color: textColor }]}>
          Due: {formatDeadlineDate(deadlineDate)}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressText: {
    gap: Spacing.xs,
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  deadlineContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  deadlineText: {
    fontSize: 14,
  },
});

export default ProgressBar;
