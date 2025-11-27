import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing } from '@/constants/Colors';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  BookFormat,
  FilterType,
  PageRangeFilter,
  ReadingDeadlineWithProgress,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import React, { useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FilterSheet } from './FilterSheet';
import { SearchBar } from './SearchBar';
import { ViewToggleControl } from './ViewToggleControl';

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
  selectedPageRanges: PageRangeFilter[];
  onPageRangesChange: (ranges: PageRangeFilter[]) => void;
  selectedTypes: string[];
  onTypesChange: (types: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  excludedStatuses: FilterType[];
  onExcludedStatusesChange: (statuses: FilterType[]) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  availableTypes: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  animatedStyle?: any;
  onLayout?: (event: LayoutChangeEvent) => void;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

const filterOptions: FilterOption[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'overdue', label: 'Past Due' },
  { key: 'paused', label: 'Paused' },
  { key: 'toReview', label: 'To Review' },
  { key: 'completed', label: 'Completed' },
  { key: 'didNotFinish', label: 'DNF' },
  { key: 'all', label: 'All' },
];

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedFilter,
  onFilterChange,
  timeRangeFilter,
  onTimeRangeChange,
  selectedFormats,
  onFormatsChange,
  selectedPageRanges,
  onPageRangesChange,
  selectedTypes,
  onTypesChange,
  selectedTags,
  onTagsChange,
  excludedStatuses,
  onExcludedStatusesChange,
  sortOrder,
  onSortOrderChange,
  availableTypes,
  searchQuery,
  onSearchChange,
  animatedStyle,
  onLayout,
  pointerEvents,
}) => {
  const { colors } = useTheme();
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    pendingDeadlines,
    pausedDeadlines,
    completedDeadlines,
    toReviewDeadlines,
    didNotFinishDeadlines,
  } = useDeadlines();

  const getBaseDeadlines = (): ReadingDeadlineWithProgress[] => {
    const deadlineMap = new Map<string, ReadingDeadlineWithProgress[]>();
    deadlineMap.set('active', activeDeadlines);
    deadlineMap.set('overdue', overdueDeadlines);
    deadlineMap.set('pending', pendingDeadlines);
    deadlineMap.set('paused', pausedDeadlines);
    deadlineMap.set('completed', completedDeadlines);
    deadlineMap.set('toReview', toReviewDeadlines);
    deadlineMap.set('didNotFinish', didNotFinishDeadlines);
    deadlineMap.set('all', deadlines);

    if (deadlineMap.has(selectedFilter)) {
      return deadlineMap.get(selectedFilter)!;
    }
    return activeDeadlines;
  };

  const baseDeadlines = getBaseDeadlines();

  const statusCounts: Record<FilterType, number> = {
    active: activeDeadlines.length,
    overdue: overdueDeadlines.length,
    pending: pendingDeadlines.length,
    paused: pausedDeadlines.length,
    completed: completedDeadlines.length,
    toReview: toReviewDeadlines.length,
    didNotFinish: didNotFinishDeadlines.length,
    all: deadlines.length,
  };

  const visibleOptions = filterOptions.filter(option => {
    if (option.key === 'overdue' && overdueDeadlines.length === 0) {
      return false;
    }
    return true;
  });

  const hasActiveFilters =
    timeRangeFilter !== 'all' ||
    selectedFormats.length > 0 ||
    selectedPageRanges.length > 0 ||
    selectedTypes.length > 0 ||
    selectedTags.length > 0 ||
    excludedStatuses.length > 0 ||
    sortOrder !== 'default';

  return (
    <Animated.View
      style={[animatedStyle, { backgroundColor: colors.background }]}
      onLayout={onLayout}
      pointerEvents={pointerEvents}
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

          {visibleOptions.map(option => {
            const isSelected = selectedFilter === option.key;
            const shouldShowStar = isSelected && hasActiveFilters;

            return (
              <View key={option.key} style={styles.tabContainer}>
                {shouldShowStar && (
                  <View style={styles.starIndicator}>
                    <IconSymbol
                      name="star.fill"
                      size={12}
                      color={colors.urgent}
                    />
                  </View>
                )}
                <ThemedButton
                  title={
                    option.key === 'active' || option.key === 'pending'
                      ? option.label
                      : `${option.label} (${statusCounts[option.key]})`
                  }
                  style={styles.filterButton}
                  variant={isSelected ? 'primary' : 'outline'}
                  onPress={() => {
                    if (isSelected) {
                      setShowFilterSheet(true);
                    } else {
                      onFilterChange(option.key);
                    }
                  }}
                />
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.searchAndToggleContainer}>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
          <ViewToggleControl />
        </View>
      </View>

      <FilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        deadlines={baseDeadlines}
        selectedFilter={selectedFilter}
        timeRangeFilter={timeRangeFilter}
        onTimeRangeChange={onTimeRangeChange}
        selectedFormats={selectedFormats}
        onFormatsChange={onFormatsChange}
        selectedPageRanges={selectedPageRanges}
        onPageRangesChange={onPageRangesChange}
        selectedTypes={selectedTypes}
        onTypesChange={onTypesChange}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
        excludedStatuses={excludedStatuses}
        onExcludedStatusesChange={onExcludedStatusesChange}
        sortOrder={sortOrder}
        onSortOrderChange={onSortOrderChange}
        statusCounts={statusCounts}
        availableTypes={availableTypes}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  filterContainer: {
    paddingHorizontal: Spacing.md,
  },
  filterScrollView: {
    flexGrow: 0,
  },
  filterContentContainer: {
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 80,
  },
  iconFilterButton: {
    width: 40,
    height: 40,
  },
  tabContainer: {
    position: 'relative',
  },
  starIndicator: {
    position: 'absolute',
    top: 3,
    right: 3,
    zIndex: 1,
  },
  searchAndToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
});

export default FilterSection;
