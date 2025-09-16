import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ThemedScrollView, ThemedText, ThemedView } from '@/components/themed';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { StyleSheet } from 'react-native';

const ActiveReads = () => {
  const { activeDeadlines, isLoading, error } = useDeadlines();
  if (isLoading) {
    return (
      <ThemedScrollView>
        <ThemedView style={styles.container}>
          <ThemedText>Loading active deadlines...</ThemedText>
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
    <ThemedView style={styles.container}>
      {activeDeadlines.length > 0 ? (
        activeDeadlines.map(deadline => (
          <DeadlineCard key={deadline.id} deadline={deadline} />
        ))
      ) : (
        <ThemedText style={styles.emptyText} variant="muted">
          No active deadlines
        </ThemedText>
      )}
    </ThemedView>
  );
};

export default ActiveReads;

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
