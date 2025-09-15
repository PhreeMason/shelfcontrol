import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { DeadlineCard } from '@/components/features/deadlines/DeadlineCard';
import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedScrollView, ThemedText, ThemedView } from '@/components/themed';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { ReadingDeadlineWithProgress } from '@/types/deadline.types';

type FilterType = 'active' | 'overdue' | 'completed' | 'set_aside' | 'all';

interface FilterOption {
  key: FilterType;
  label: string;
}

const filterOptions: FilterOption[] = [
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'set_aside', label: 'Set Aside' },
  { key: 'all', label: 'All' },
];

const FilteredDeadlines = () => {
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('active');
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    isLoading,
    error
  } = useDeadlines();

  const getFilteredDeadlines = (): ReadingDeadlineWithProgress[] => {
    switch (selectedFilter) {
      case 'active':
        return activeDeadlines;
      case 'overdue':
        return overdueDeadlines;
      case 'completed':
        return completedDeadlines.filter(deadline => {
          const latestStatus = deadline.status?.[deadline.status.length - 1]?.status;
          return latestStatus === 'complete';
        });
      case 'set_aside':
        return completedDeadlines.filter(deadline => {
          const latestStatus = deadline.status?.[deadline.status.length - 1]?.status;
          return latestStatus === 'set_aside';
        });
      case 'all':
        return deadlines;
      default:
        return activeDeadlines;
    }
  };

  const getEmptyMessage = (): string => {
    switch (selectedFilter) {
      case 'active':
        return 'No active deadlines';
      case 'overdue':
        return 'No overdue deadlines';
      case 'completed':
        return 'No completed deadlines';
      case 'set_aside':
        return 'No deadlines set aside';
      case 'all':
        return 'No deadlines found';
      default:
        return 'No deadlines found';
    }
  };

  if (isLoading) {
    return (
      <ThemedScrollView>
        <ThemedView style={styles.container}>
          <ThemedText>Loading deadlines...</ThemedText>
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

  const filteredDeadlines = getFilteredDeadlines();

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContentContainer}
      >
        {filterOptions.map((option) => (
          <ThemedButton
            key={option.key}
            title={option.label}
            variant={selectedFilter === option.key ? 'primary' : 'outline'}
            size="sm"
            style={styles.filterButton}
            onPress={() => setSelectedFilter(option.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.deadlinesContainer}>
        {filteredDeadlines.length > 0 ? (
          filteredDeadlines.map((deadline) => (
            <DeadlineCard
              key={deadline.id}
              deadline={deadline}
            />
          ))
        ) : (
          <ThemedText
            style={styles.emptyText}
            variant="muted"
          >
            {getEmptyMessage()}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
};

export default FilteredDeadlines;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContentContainer: {
    gap: 10,
    paddingVertical: 5,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deadlinesContainer: {
    gap: 20,
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