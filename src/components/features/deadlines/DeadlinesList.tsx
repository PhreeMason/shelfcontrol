import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ThemedText, ThemedView } from '@/components/themed';
import { usePreferences } from '@/providers/PreferencesProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DeadlineCardCompact } from './DeadlineCardCompact';

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
  const { deadlineViewMode } = usePreferences();

  const renderContent = () => {
    if (isLoading) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText typography="bodyMedium" style={styles.loadingText}>
            Loading books...
          </ThemedText>
        </ThemedView>
      );
    }

    if (error) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText
            typography="bodyMedium"
            color="error"
            style={styles.errorText}
          >
            Error loading deadlines: {error.message}
          </ThemedText>
        </ThemedView>
      );
    }

    if (deadlines.length === 0) {
      return (
        <ThemedView style={styles.centerContainer}>
          <ThemedText typography="bodyMedium" style={styles.emptyText}>
            {emptyMessage}
          </ThemedText>
        </ThemedView>
      );
    }

    return deadlineViewMode === 'compact' ? (
      <View style={styles.gridContainer}>
        {deadlines.map(deadline => (
          <DeadlineCardCompact key={deadline.id} deadline={deadline} />
        ))}
      </View>
    ) : (
      <View style={styles.container}>
        {deadlines.map(deadline => (
          <DeadlineCard key={deadline.id} deadline={deadline} />
        ))}
      </View>
    );
  };

  return <>{renderContent()}</>;
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    paddingHorizontal: 12,
    paddingTop: 5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingTop: 15,
    gap: 15,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.7,
  },
  errorText: {
    textAlign: 'center',
  },
  loadingText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default DeadlinesList;
