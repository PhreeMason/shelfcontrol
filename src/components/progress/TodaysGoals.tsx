import TodaysProgress from '@/components/progress/TodaysProgress'
import { ThemedText, ThemedView } from '@/components/themed'
import { useDeadlines } from '@/providers/DeadlineProvider'
import { ReadingDeadlineWithProgress } from '@/types/deadline.types'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const TodaysGoals: React.FC = () => {
  const { deadlines, getDeadlineCalculations, calculateProgressForToday } = useDeadlines();
  const audioDeadlines: ReadingDeadlineWithProgress[] = [];
  const readingDeadlines: ReadingDeadlineWithProgress[] = [];

  deadlines.forEach((deadline) => {
    if (deadline.format === 'audio') {
      audioDeadlines.push(deadline);
    } else {
      readingDeadlines.push(deadline);
    }
  });

  const totalAudioTimeForToday = audioDeadlines.reduce((total, deadline) => {
    const { unitsPerDay } = getDeadlineCalculations(deadline);
    return total + unitsPerDay;
  }, 0);

  const totalReadingTimeForToday = readingDeadlines.reduce((total, deadline) => {
    const { unitsPerDay } = getDeadlineCalculations(deadline);
    return total + unitsPerDay;
  }, 0);

  const currentReadingTimeForToday = readingDeadlines.reduce((total, deadline) => {
    const progress = calculateProgressForToday(deadline);
    return total + progress;
  }, 0);

  const currentAudioTimeForToday = audioDeadlines.reduce((total, deadline) => {
    const progress = calculateProgressForToday(deadline);
    return total + progress;
  }, 0);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>TODAY'S READING GOALS</ThemedText>
      </View>

      <View style={styles.progressSection}>
        {readingDeadlines.length > 0 ? <TodaysProgress
          total={totalReadingTimeForToday}
          current={currentReadingTimeForToday}
          // total={100}
          // current={325}
          type="reading"
        /> : null}

        {audioDeadlines.length > 0 ? <TodaysProgress
          total={totalAudioTimeForToday}
          current={currentAudioTimeForToday}
          type="listening"
        /> : null}
      </View>
    </ThemedView>
  )
}

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

export default TodaysGoals