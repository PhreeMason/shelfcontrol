import FilterSection from '@/components/features/deadlines/FilterSection';
import FilteredDeadlines from '@/components/features/deadlines/FilteredDeadlines';
import { Header } from '@/components/navigation';
import { ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { useDeadlineTypes } from '@/hooks/useDeadlineTypes';
import { analytics } from '@/lib/analytics/client';
import { useDeadlines } from '@/providers/DeadlineProvider';
import { usePreferences } from '@/providers/PreferencesProvider';
import { FilterType } from '@/types/deadline.types';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import React from 'react';
import { Platform, RefreshControl, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    selectedFilter,
    setSelectedFilter,
    timeRangeFilter,
    setTimeRangeFilter,
    selectedFormats,
    setSelectedFormats,
    selectedPageRanges,
    setSelectedPageRanges,
    selectedTypes,
    setSelectedTypes,
    excludedStatuses,
    setExcludedStatuses,
    sortOrder,
    setSortOrder,
  } = usePreferences();
  const { refetch, isRefreshing, deadlines } = useDeadlines();
  const { data: availableTypes = [] } = useDeadlineTypes();
  const prevSelectedFilterRef = React.useRef<FilterType | null>(null);
  const prevSortOrderRef = React.useRef(sortOrder);

  React.useEffect(() => {
    const activeFilters: string[] = [];
    if (timeRangeFilter !== 'all') activeFilters.push('time_range');
    if (selectedFormats.length > 0) activeFilters.push('formats');
    if (selectedPageRanges.length > 0) activeFilters.push('page_ranges');
    if (selectedTypes.length > 0) activeFilters.push('types');
    if (excludedStatuses.length > 0) activeFilters.push('excluded_statuses');

    analytics.track('home_screen_viewed', {
      deadlines_count: deadlines.length,
      active_filters: activeFilters,
    });
  }, []);

  const gradientHeight = Math.max(insets.top, 10);

  const scrollY = useSharedValue(0);
  const filterHeight = useSharedValue(0);
  const filterTop = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Animated style for scrollable filter (inside ScrollView)
  const scrollableFilterStyle = useAnimatedStyle(() => {
    const shouldStick = scrollY.value >= filterTop.value;
    return {
      opacity: withSpring(shouldStick ? 0 : 1),
    };
  });

  // Animated style for sticky filter (outside ScrollView)
  const stickyFilterStyle = useAnimatedStyle(() => {
    const shouldStick = scrollY.value >= filterTop.value;
    return {
      position: 'absolute',
      top: gradientHeight,
      left: 0,
      right: 0,
      zIndex: 1000,
      opacity: withSpring(shouldStick ? 1 : 0),
      elevation: withSpring(shouldStick ? 4 : 0),
      pointerEvents: shouldStick ? 'auto' : 'none',
    };
  });

  const handleFilterLayout = (event: any) => {
    filterHeight.value = event.nativeEvent.layout.height;
    filterTop.value = event.nativeEvent.layout.y;
  };

  React.useEffect(() => {
    if (
      prevSelectedFilterRef.current !== null &&
      prevSelectedFilterRef.current !== selectedFilter
    ) {
      analytics.track('filter_cleared');
      setTimeRangeFilter('all');
      setSelectedFormats([]);
      setSelectedPageRanges([]);
      setSelectedTypes([]);
      setExcludedStatuses([]);
    }
    prevSelectedFilterRef.current = selectedFilter;
  }, [
    selectedFilter,
    setTimeRangeFilter,
    setSelectedFormats,
    setSelectedPageRanges,
    setSelectedTypes,
    setExcludedStatuses,
  ]);

  React.useEffect(() => {
    const activeFilters: string[] = [];
    if (timeRangeFilter !== 'all') activeFilters.push('time_range');
    if (selectedFormats.length > 0) activeFilters.push('formats');
    if (selectedPageRanges.length > 0) activeFilters.push('page_ranges');
    if (selectedTypes.length > 0) activeFilters.push('types');
    if (excludedStatuses.length > 0) activeFilters.push('excluded_statuses');

    if (activeFilters.length > 0) {
      analytics.track('filter_combination_applied', {
        filter_types: activeFilters,
      });
    }
  }, [
    timeRangeFilter,
    selectedFormats,
    selectedPageRanges,
    selectedTypes,
    excludedStatuses,
  ]);

  React.useEffect(() => {
    if (prevSortOrderRef.current !== sortOrder) {
      analytics.track('sort_changed', {
        previous_sort: prevSortOrderRef.current,
        new_sort: sortOrder,
      });
      prevSortOrderRef.current = sortOrder;
    }
  }, [sortOrder]);

  const handleFilterChange = (filter: FilterType) => {
    analytics.track('filter_changed', {
      filter_type: filter,
    });
    setSelectedFilter(filter);
  };

  return (
    <ThemedView style={[styles.container]}>
      <LinearGradient
        colors={['#E8C2B9', '#ccafc9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: gradientHeight }}
      />

      {/* Sticky filter that appears when scrolling */}
      <FilterSection
        selectedFilter={selectedFilter}
        onFilterChange={handleFilterChange}
        timeRangeFilter={timeRangeFilter}
        onTimeRangeChange={setTimeRangeFilter}
        selectedFormats={selectedFormats}
        onFormatsChange={setSelectedFormats}
        selectedPageRanges={selectedPageRanges}
        onPageRangesChange={setSelectedPageRanges}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        excludedStatuses={excludedStatuses}
        onExcludedStatusesChange={setExcludedStatuses}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        availableTypes={availableTypes}
        animatedStyle={stickyFilterStyle}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              analytics.track('deadlines_refreshed');
              refetch();
            }}
          />
        }
      >
        <Header />

        {/* Scrollable filter that hides when sticky */}
        <FilterSection
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          timeRangeFilter={timeRangeFilter}
          onTimeRangeChange={setTimeRangeFilter}
          selectedFormats={selectedFormats}
          onFormatsChange={setSelectedFormats}
          selectedPageRanges={selectedPageRanges}
          onPageRangesChange={setSelectedPageRanges}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          excludedStatuses={excludedStatuses}
          onExcludedStatusesChange={setExcludedStatuses}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          availableTypes={availableTypes}
          animatedStyle={scrollableFilterStyle}
          onLayout={handleFilterLayout}
        />

        <FilteredDeadlines
          selectedFilter={selectedFilter}
          timeRangeFilter={timeRangeFilter}
          selectedFormats={selectedFormats}
          selectedPageRanges={selectedPageRanges}
          selectedTypes={selectedTypes}
          excludedStatuses={excludedStatuses}
          sortOrder={sortOrder}
        />
      </Animated.ScrollView>

      {/* Floating action button */}
      {Platform.OS === 'android' ? (
        <Link href="/deadline/new" asChild>
          <ThemedIconButton
            icon="plus"
            style={styles.floatingActionButton}
            variant="primary"
            size="lg"
          />
        </Link>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 10,
    right: 30,
    width: 56,
    height: 56,
    padding: 0,
    borderRadius: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
});
