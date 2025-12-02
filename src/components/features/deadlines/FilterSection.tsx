import { ThemedButton } from '@/components/themed/ThemedButton';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Spacing } from '@/constants/Colors';
import { getSystemShelf, sortShelfIds } from '@/constants/shelves';
import { useTheme } from '@/hooks/useThemeColor';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { useShelf } from '@/providers/ShelfProvider';
import {
  BookFormat,
  PageRangeFilter,
  ReadingDeadlineWithProgress,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import { SystemShelfId } from '@/types/shelves.types';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { FilterSheet } from './FilterSheet';
import { SearchBar } from './SearchBar';
import { ViewToggleControl } from './ViewToggleControl';

interface FilterSectionProps {
  selectedShelf: SystemShelfId;
  onShelfChange: (shelf: SystemShelfId) => void;
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
  excludedStatuses: SystemShelfId[];
  onExcludedStatusesChange: (statuses: SystemShelfId[]) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  availableTypes: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  animatedStyle?: any;
  onLayout?: (event: LayoutChangeEvent) => void;
  pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
}

const FilterSection: React.FC<FilterSectionProps> = ({
  selectedShelf,
  onShelfChange,
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
    appliedDeadlines,
    rejectedDeadlines,
    withdrewDeadlines,
  } = useDeadlines();
  const { pinnedShelves, shelfCounts } = useShelf();

  const getBaseDeadlines = (): ReadingDeadlineWithProgress[] => {
    const deadlineMap = new Map<string, ReadingDeadlineWithProgress[]>();
    deadlineMap.set('applied', appliedDeadlines);
    deadlineMap.set('active', activeDeadlines);
    deadlineMap.set('overdue', overdueDeadlines);
    deadlineMap.set('pending', pendingDeadlines);
    deadlineMap.set('paused', pausedDeadlines);
    deadlineMap.set('completed', completedDeadlines);
    deadlineMap.set('toReview', toReviewDeadlines);
    deadlineMap.set('didNotFinish', didNotFinishDeadlines);
    deadlineMap.set('rejected', rejectedDeadlines);
    deadlineMap.set('withdrew', withdrewDeadlines);
    deadlineMap.set('all', deadlines);

    if (deadlineMap.has(selectedShelf)) {
      return deadlineMap.get(selectedShelf)!;
    }
    return activeDeadlines;
  };

  const baseDeadlines = getBaseDeadlines();

  // Get visible pinned shelves in fixed order, respecting conditional visibility
  const visiblePinnedShelves = useMemo(
    () =>
      sortShelfIds(pinnedShelves).filter((shelfId) => {
        const shelf = getSystemShelf(shelfId);
        if (!shelf) return false;
        // Hide conditional shelves (rejected, withdrew) when count = 0
        if (shelf.isConditional && shelfCounts[shelfId] === 0) return false;
        return true;
      }),
    [pinnedShelves, shelfCounts]
  );

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

          {visiblePinnedShelves.map(shelfId => {
            const shelf = getSystemShelf(shelfId);
            if (!shelf) return null;

            const isSelected = selectedShelf === shelfId;
            const shouldShowStar = isSelected && hasActiveFilters;

            return (
              <View key={shelfId} style={styles.tabContainer}>
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
                    shelfId === 'applied' ||
                    shelfId === 'active' ||
                    shelfId === 'pending'
                      ? shelf.name
                      : `${shelf.name} (${shelfCounts[shelfId]})`
                  }
                  style={styles.filterButton}
                  variant={isSelected ? 'primary' : 'outline'}
                  onPress={() => {
                    if (isSelected) {
                      setShowFilterSheet(true);
                    } else {
                      onShelfChange(shelfId);
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
        selectedShelf={selectedShelf}
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
        statusCounts={shelfCounts}
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
