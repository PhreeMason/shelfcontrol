import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ThemedText, ThemedView } from '@/components/themed';
import { Spacing } from '@/constants/Colors';
import { usePreferences } from '@/providers/PreferencesProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';
import { getUserFriendlyErrorMessage } from '@/utils/errorUtils';
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
            {getUserFriendlyErrorMessage(error)}
          </ThemedText>
          <ThemedText
            typography="bodySmall"
            style={styles.errorHint}
          >
            Pull down to refresh
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  centerContainer: {
    padding: Spacing.xxl,
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
  errorHint: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    opacity: 0.6,
  },
  loadingText: {
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default DeadlinesList;
