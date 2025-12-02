import OverdueCatchUpProgress from '@/components/progress/OverdueCatchUpProgress';
import TodaysProgress from '@/components/progress/TodaysProgress';
import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { useTodaysDeadlines } from '@/hooks/useTodaysDeadlines';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  calculateOverdueCatchUpTotals,
  calculateTodaysAudioTotals,
  calculateTodaysReadingTotals,
} from '@/utils/deadlineAggregationUtils';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

const TodaysGoals: React.FC = () => {
  const {
    calculateProgressForToday,
    userPaceData,
    userListeningPaceData,
  } = useDeadlines();
  const {
    audioDeadlines,
    readingDeadlines,
    allAudioDeadlines,
    allReadingDeadlines,
    overdueReadingDeadlines,
    overdueAudioDeadlines,
  } = useTodaysDeadlines();

  const audioTotals = useMemo(
    () =>
      calculateTodaysAudioTotals(
        audioDeadlines,
        allAudioDeadlines,
        calculateProgressForToday
      ),
    [audioDeadlines, allAudioDeadlines, calculateProgressForToday]
  );

  const readingTotals = useMemo(
    () =>
      calculateTodaysReadingTotals(
        readingDeadlines,
        allReadingDeadlines,
        calculateProgressForToday
      ),
    [readingDeadlines, allReadingDeadlines, calculateProgressForToday]
  );

  const hasGoals = readingDeadlines.length > 0 || audioDeadlines.length > 0;
  const averageReadingPace = Math.round(userPaceData?.averagePace || 0);
  const averageListeningPace = Math.round(userListeningPaceData?.averagePace || 0);

  // Calculate overdue catch-up totals for reading
  const overdueReadingCatchUp = useMemo(
    () =>
      calculateOverdueCatchUpTotals(
        overdueReadingDeadlines,
        averageReadingPace,
        readingTotals.total,
        readingTotals.current,
        calculateProgressForToday
      ),
    [
      overdueReadingDeadlines,
      averageReadingPace,
      readingTotals,
      calculateProgressForToday,
    ]
  );

  // Calculate overdue catch-up totals for listening
  const overdueAudioCatchUp = useMemo(
    () =>
      calculateOverdueCatchUpTotals(
        overdueAudioDeadlines,
        averageListeningPace,
        audioTotals.total,
        audioTotals.current,
        calculateProgressForToday
      ),
    [
      overdueAudioDeadlines,
      averageListeningPace,
      audioTotals,
      calculateProgressForToday,
    ]
  );

  // Show overdue reading catch-up when:
  // 1. User has active reading goals
  // 2. User has overdue reading books
  // 3. User has met their active reading goal for today
  // 4. User has extra capacity available
  const showOverdueReadingCatchUp =
    readingDeadlines.length > 0 &&
    overdueReadingDeadlines.length > 0 &&
    readingTotals.current >= readingTotals.total &&
    overdueReadingCatchUp.hasCapacity;

  // Show overdue audio catch-up when:
  // 1. User has active audio goals
  // 2. User has overdue audio books
  // 3. User has met their active audio goal for today
  // 4. User has extra capacity available
  const showOverdueAudioCatchUp =
    audioDeadlines.length > 0 &&
    overdueAudioDeadlines.length > 0 &&
    audioTotals.current >= audioTotals.total &&
    overdueAudioCatchUp.hasCapacity;


  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>TODAY'S READING GOALS</ThemedText>
      </View>

      <View style={styles.progressSection}>
        {hasGoals ? (
          <>
            {readingDeadlines.length > 0 && (
              <TodaysProgress
                total={readingTotals.total}
                current={readingTotals.current}
                type="reading"
              />
            )}

            {audioDeadlines.length > 0 && (
              <TodaysProgress
                total={audioTotals.total}
                current={audioTotals.current}
                type="listening"
              />
            )}

            {showOverdueReadingCatchUp && (
              <OverdueCatchUpProgress
                total={overdueReadingCatchUp.total}
                current={overdueReadingCatchUp.current}
                type="reading"
              />
            )}

            {showOverdueAudioCatchUp && (
              <OverdueCatchUpProgress
                total={overdueAudioCatchUp.total}
                current={overdueAudioCatchUp.current}
                type="listening"
              />
            )}
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <ThemedText style={styles.emptyStateText} variant="muted">
              No reading goals set for today
            </ThemedText>
            <ThemedText style={styles.emptyStateSubText} variant="muted">
              Add a book with a due date to start tracking your progress
            </ThemedText>
          </View>
        )}
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    backdropFilter: 'blur(20px)',
    position: 'relative',
    zIndex: 1,
    shadowColor: 'rgba(139, 90, 140, 0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 32,
    elevation: 8,
    marginHorizontal: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    color: '#8B5A8C',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  progressSection: {
    gap: Spacing.md,
  },
  emptyStateContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TodaysGoals;
