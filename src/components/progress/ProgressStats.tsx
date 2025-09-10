import { formatProgressDisplay } from '@/utils/deadlineUtils';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from '../themed';

interface ProgressStatsProps {
  currentProgress: number;
  totalQuantity: number;
  remaining: number;
  format: 'physical' | 'ebook' | 'audio';
  urgencyLevel: 'overdue' | 'urgent' | 'good' | 'approaching' | 'impossible';
}

const ProgressStats: React.FC<ProgressStatsProps> = ({
  currentProgress,
  totalQuantity,
  remaining,
  format,
  urgencyLevel
}) => {
  const urgencyTypeMap = {
    'overdue': 'error' as const,
    'urgent': 'warning' as const,
    'good': 'success' as const,
    'approaching': 'warning' as const,
    'impossible': 'error' as const,
  };

  return (
    <View style={styles.progressStats}>
      <View style={styles.statItem}>
        <ThemedText variant={urgencyTypeMap[urgencyLevel]} style={styles.statNumber}>
          {formatProgressDisplay(format, currentProgress)}
        </ThemedText>
        <ThemedText variant="muted" style={styles.statLabel}>
         OF{' '}
         <ThemedText variant="muted" style={{fontSize: 12}}>{formatProgressDisplay(format, totalQuantity)} </ThemedText>
         {format === 'audio' ? 'LISTENED' : 'READ'}
        </ThemedText>
      </View>
      <View style={styles.statItem}>
        <ThemedText variant={urgencyTypeMap[urgencyLevel]} style={styles.statNumber}>
          {formatProgressDisplay(format, remaining)}
        </ThemedText>
        <ThemedText variant="muted" style={styles.statLabel}>
          {format === 'audio' ? 'REMAINING' : 'LEFT'}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    letterSpacing: 1,
  },
});

export default ProgressStats;
