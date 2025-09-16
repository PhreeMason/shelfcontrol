import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ThemedScrollView, ThemedText, ThemedView } from '@/components/themed';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { StyleSheet } from 'react-native';

const OverdueReads = () => {
  const { overdueDeadlines, isLoading, error } = useDeadlines();

  if (isLoading) {
    return (
      <ThemedScrollView>
        <ThemedView style={styles.container}>
          <ThemedText>Loading overdue deadlines...</ThemedText>
        </ThemedView>
      </ThemedScrollView>
    );
  }

  if (error) {
    return (
      <ThemedScrollView>
        <ThemedView style={styles.container}>
          <ThemedText variant="error" style={styles.errorText}>
            Error loading deadlines: {error.message}
          </ThemedText>
        </ThemedView>
      </ThemedScrollView>
    );
  }

  return (
    <ThemedScrollView>
      <ThemedView style={styles.container}>
        <ThemedText variant="muted" style={styles.pageTitle}>
          OVERDUE DEADLINES
        </ThemedText>
        {overdueDeadlines.length > 0 ? (
          overdueDeadlines.map(deadline => (
            <DeadlineCard key={deadline.id} deadline={deadline} />
          ))
        ) : (
          <ThemedText style={styles.emptyText} variant="muted">
            No overdue deadlines
          </ThemedText>
        )}
      </ThemedView>
    </ThemedScrollView>
  );
};

export default OverdueReads;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  pageTitle: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
