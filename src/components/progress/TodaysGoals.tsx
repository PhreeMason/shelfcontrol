import TodaysProgress from '@/components/progress/TodaysProgress';
import { ThemedText, ThemedView } from '@/components/themed';
import { useTodaysDeadlines } from '@/hooks/useTodaysDeadlines';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  calculateTodaysAudioTotals,
  calculateTodaysReadingTotals,
} from '@/utils/deadlineAggregationUtils';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

const TodaysGoals: React.FC = () => {
  const { calculateProgressForToday } = useDeadlines();
  const { audioDeadlines, readingDeadlines } = useTodaysDeadlines();

  // Using specialized "today's goals" functions that maintain stable daily totals
  // even when deadlines are completed and archived mid-day
  const audioTotals = useMemo(
    () => calculateTodaysAudioTotals(audioDeadlines, calculateProgressForToday),
    [audioDeadlines, calculateProgressForToday]
  );

  const readingTotals = useMemo(
    () =>
      calculateTodaysReadingTotals(readingDeadlines, calculateProgressForToday),
    [readingDeadlines, calculateProgressForToday]
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>TODAY'S READING GOALS</ThemedText>
      </View>

      <View style={styles.progressSection}>
        {readingDeadlines.length > 0 ? (
          <TodaysProgress
            total={readingTotals.total}
            current={readingTotals.current}
            type="reading"
          />
        ) : null}

        {audioDeadlines.length > 0 ? (
          <TodaysProgress
            total={audioTotals.total}
            current={audioTotals.current}
            type="listening"
          />
        ) : null}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1,
    shadowColor: 'rgba(139, 90, 140, 0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
    marginHorizontal: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  title: {
    color: '#8B5A8C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  progressSection: {
    gap: 16,
  },
});

export default TodaysGoals;
