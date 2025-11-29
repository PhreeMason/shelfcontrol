import { Spacing } from '@/constants/Colors';
import { formatProgressDisplay } from '@/utils/deadlineUtils';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed';

interface ProgressStatsProps {
  currentProgress: number;
  totalQuantity: number;
  remaining: number;
  format: 'physical' | 'eBook' | 'audio';
  urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible';
  progressPercentage: number;
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  remaining,
  format,
  urgencyLevel,
  progressPercentage,
}) => {
  const urgencyTypeMap = {
    overdue: 'error' as const,
    urgent: 'warning' as const,
    good: 'success' as const,
    approaching: 'warning' as const,
    impossible: 'error' as const,
  };

  return (
    <View style={styles.progressStats}>
      <View style={[styles.statItem]}>
        <ThemedText
          variant={urgencyTypeMap[urgencyLevel]}
          style={styles.statNumber}
        >
          {formatProgressDisplay(format, remaining)}
        </ThemedText>
        <ThemedText variant="muted" style={styles.statLabel}>
          {format === 'audio' ? 'TIME LEFT' : 'PAGES LEFT'}
        </ThemedText>
      </View>
      <View style={[styles.statItem]}>
        <ThemedText
          variant={urgencyTypeMap[urgencyLevel]}
          style={styles.statNumber}
        >
          {progressPercentage}%
        </ThemedText>
        <ThemedText variant="muted" style={styles.statLabel}>
          COMPLETE
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 33,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    letterSpacing: 1,
    fontSize: 12,
  },
});

export default ProgressStats;
