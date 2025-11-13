import { ThemedText, ThemedView } from '@/components/themed';
import { useTheme } from '@/hooks/useThemeColor';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * Props for MonthlyProgressSection component
 */
export interface MonthlyProgressSectionProps {
  /** Number of books currently on track to meet their deadline */
  onTrackCount: number;
  /** Number of books completed this month */
  completedCount: number;
}

/**
 * Displays monthly reading progress statistics
 * Shows the number of books on track and completed this month
 */
const MonthlyProgressSectionComponent = ({
  onTrackCount,
  completedCount,
}: MonthlyProgressSectionProps) => {
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.section}>
      <ThemedText variant="title" style={styles.sectionTitle}>
        This Month's Reading Progress
      </ThemedText>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: colors.good }]}>
            {onTrackCount}
          </ThemedText>
          <ThemedText variant="muted" style={styles.statLabel}>
            ON TRACK
          </ThemedText>
        </View>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statNumber, { color: colors.complete }]}>
            {completedCount}
          </ThemedText>
          <ThemedText variant="muted" style={styles.statLabel}>
            COMPLETED
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
};

/**
 * Memoized version of MonthlyProgressSection
 * Prevents unnecessary re-renders when props haven't changed
 */
export const MonthlyProgressSection = React.memo(
  MonthlyProgressSectionComponent
);
MonthlyProgressSection.displayName = 'MonthlyProgressSection';

const styles = StyleSheet.create({
  section: {
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 33,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textAlign: 'center',
  },
});
