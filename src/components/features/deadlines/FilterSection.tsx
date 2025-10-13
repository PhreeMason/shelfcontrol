import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  BookFormat,
  FilterType,
  ReadingDeadlineWithProgress,
  TimeRangeFilter,
} from '@/types/deadline.types';
import React, { useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FilterSheet } from './FilterSheet';

interface FilterOption {
  key: FilterType;
  label: string;
}

interface FilterSectionProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  timeRangeFilter: TimeRangeFilter;
  onTimeRangeChange: (filter: TimeRangeFilter) => void;
  selectedFormats: BookFormat[];
  onFormatsChange: (formats: BookFormat[]) => void;
  selectedSources: string[];
  onSourcesChange: (sources: string[]) => void;
  availableSources: string[];
  animatedStyle?: any;
  onLayout?: (event: LayoutChangeEvent) => void;
  availableFilters?: FilterType[];
}

const filterOptions: FilterOption[] = [
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'paused', label: 'Paused' },
  { key: 'didNotFinish', label: 'Did Not Finish' },
  { key: 'all', label: 'All' },
];

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedFilter,
  onFilterChange,
  timeRangeFilter,
  onTimeRangeChange,
  selectedFormats,
  onFormatsChange,
  selectedSources,
  onSourcesChange,
  availableSources,
  animatedStyle,
  onLayout,
  availableFilters,
}) => {
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    pendingDeadlines,
    completedDeadlines,
    pausedDeadlines,
    didNotFinishDeadlines,
  } = useDeadlines();

  const getBaseDeadlines = (): ReadingDeadlineWithProgress[] => {
    const deadlineMap = new Map<string, ReadingDeadlineWithProgress[]>();
    deadlineMap.set('active', activeDeadlines);
    deadlineMap.set('overdue', overdueDeadlines);
    deadlineMap.set('pending', pendingDeadlines);
    deadlineMap.set('completed', completedDeadlines);
    deadlineMap.set('paused', pausedDeadlines);
    deadlineMap.set('didNotFinish', didNotFinishDeadlines);
    deadlineMap.set('all', deadlines);

    if (deadlineMap.has(selectedFilter)) {
      return deadlineMap.get(selectedFilter)!;
    }
    return activeDeadlines;
  };

  const baseDeadlines = getBaseDeadlines();

  const visibleOptions = availableFilters
    ? filterOptions.filter(option => availableFilters.includes(option.key))
    : filterOptions;

  const hasActiveFilters =
    timeRangeFilter !== 'all' ||
    selectedFormats.length < 3 ||
    selectedSources.length > 0;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      onLayout={onLayout}
    >
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContentContainer}
          style={styles.filterScrollView}
        >
          <ThemedIconButton
            icon="line.3.horizontal.decrease"
            style={styles.iconFilterButton}
            variant={hasActiveFilters ? 'primary' : 'outline'}
            onPress={() => setShowFilterSheet(true)}
            size="sm"
          />

          {visibleOptions.map(option => (
            <ThemedButton
              key={option.key}
              title={option.label}
              style={styles.filterButton}
              variant={selectedFilter === option.key ? 'primary' : 'outline'}
              onPress={() => onFilterChange(option.key)}
            />
          ))}
        </ScrollView>
      </View>

      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        deadlines={baseDeadlines}
        timeRangeFilter={timeRangeFilter}
        onTimeRangeChange={onTimeRangeChange}
        selectedFormats={selectedFormats}
        onFormatsChange={onFormatsChange}
        selectedSources={selectedSources}
        onSourcesChange={onSourcesChange}
        availableSources={availableSources}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
  },
  filterContainer: {
    maxHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterContentContainer: {
    gap: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
  iconFilterButton: {
    width: 40,
    height: 40,
  },
});

export default FilterSection;
