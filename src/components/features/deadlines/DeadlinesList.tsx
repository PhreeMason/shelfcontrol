import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ThemedText, ThemedView } from '@/components/themed';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { StyleSheet, View } from 'react-native';

interface DeadlinesListProps {
  deadlines: ReadingDeadlineWithProgress[];
  isLoading: boolean;
  error: Error | null;
  emptyMessage: string;
}

const DeadlinesList: React.FC<DeadlinesListProps> = ({
  deadlines,
  isLoading,
  error,
  emptyMessage,
}) => {
  if (isLoading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.loadingText}>Loading books...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>
          Error loading deadlines: {error.message}
        </ThemedText>
      </ThemedView>
    );
  }

  if (deadlines.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.emptyText}>{emptyMessage}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <View style={styles.container}>
      {deadlines.map(deadline => (
        <DeadlineCard key={deadline.id} deadline={deadline} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
    paddingHorizontal: 12,
    paddingTop: 5,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#ff4444',
  },
  loadingText: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default DeadlinesList;
