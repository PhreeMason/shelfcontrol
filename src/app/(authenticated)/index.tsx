import FilterSection from '@/components/features/deadlines/FilterSection';
import FilteredDeadlines from '@/components/features/deadlines/FilteredDeadlines';
import { Header } from '@/components/navigation';
import { ThemedView } from '@/components/themed';
import { ThemedIconButton } from '@/components/themed/ThemedIconButton';
import { useDeadlineSources } from '@/hooks/useDeadlineSources';
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
    selectedSources,
    setSelectedSources,
  } = usePreferences();
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    pendingDeadlines,
    completedDeadlines,
    pausedDeadlines,
    refetch,
    isRefreshing,
  } = useDeadlines();
  const { data: availableSources = [] } = useDeadlineSources();
  const prevSelectedFilterRef = React.useRef<FilterType | null>(null);

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

  const availableFilters = React.useMemo(() => {
    const available: FilterType[] = [];

    if (activeDeadlines.length > 0) available.push('active');
    if (overdueDeadlines.length > 0) available.push('overdue');
    if (pendingDeadlines.length > 0) available.push('pending');
    if (completedDeadlines.length > 0) available.push('completed');
    if (pausedDeadlines.length > 0) available.push('paused');
    if (deadlines.length > 0) available.push('all');

    return available;
  }, [
    activeDeadlines.length,
    overdueDeadlines.length,
    pendingDeadlines.length,
    completedDeadlines.length,
    pausedDeadlines.length,
    deadlines.length,
  ]);

  React.useEffect(() => {
    if (
      availableFilters.length > 0 &&
      !availableFilters.includes(selectedFilter)
    ) {
      setSelectedFilter(availableFilters[0]);
    }
  }, [availableFilters, selectedFilter, setSelectedFilter]);

  React.useEffect(() => {
    if (prevSelectedFilterRef.current !== null && prevSelectedFilterRef.current !== selectedFilter) {
      setTimeRangeFilter('all');
      setSelectedFormats(['physical', 'eBook', 'audio']);
      setSelectedSources([]);
    }
    prevSelectedFilterRef.current = selectedFilter;
  }, [selectedFilter, setTimeRangeFilter, setSelectedFormats, setSelectedSources]);

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
        onFilterChange={setSelectedFilter}
        timeRangeFilter={timeRangeFilter}
        onTimeRangeChange={setTimeRangeFilter}
        selectedFormats={selectedFormats}
        onFormatsChange={setSelectedFormats}
        selectedSources={selectedSources}
        onSourcesChange={setSelectedSources}
        availableSources={availableSources}
        animatedStyle={stickyFilterStyle}
        availableFilters={availableFilters}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} />
        }
      >
        <Header />

        {/* Scrollable filter that hides when sticky */}
        <FilterSection
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
          timeRangeFilter={timeRangeFilter}
          onTimeRangeChange={setTimeRangeFilter}
          selectedFormats={selectedFormats}
          onFormatsChange={setSelectedFormats}
          selectedSources={selectedSources}
          onSourcesChange={setSelectedSources}
          availableSources={availableSources}
          animatedStyle={scrollableFilterStyle}
          onLayout={handleFilterLayout}
          availableFilters={availableFilters}
        />

        <FilteredDeadlines
          selectedFilter={selectedFilter}
          timeRangeFilter={timeRangeFilter}
          selectedFormats={selectedFormats}
          selectedSources={selectedSources}
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
