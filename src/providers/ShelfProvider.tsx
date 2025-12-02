import { DEFAULT_PINNED_SHELVES, sortShelfIds } from '@/constants/shelves';
import { analytics } from '@/lib/analytics/client';
import { useDeadlines } from '@/providers/DeadlineProvider';
import {
  BookFormat,
  PageRangeFilter,
  ReadingDeadlineWithProgress,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import { ShelfCounts, SHELF_STORAGE_KEYS, SystemShelfId } from '@/types/shelves.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/**
 * Filter state for advanced filtering within a shelf
 */
interface FilterState {
  timeRangeFilter: TimeRangeFilter;
  selectedFormats: BookFormat[];
  selectedPageRanges: PageRangeFilter[];
  selectedTypes: string[];
  selectedTags: string[];
  excludedStatuses: SystemShelfId[];
  sortOrder: SortOrder;
}

const DEFAULT_FILTER_STATE: FilterState = {
  timeRangeFilter: 'all',
  selectedFormats: [],
  selectedPageRanges: [],
  selectedTypes: [],
  selectedTags: [],
  excludedStatuses: [],
  sortOrder: 'default',
};

/**
 * Storage keys for filter persistence
 */
const FILTER_STORAGE_KEYS = {
  TIME_RANGE_FILTER: '@shelves/timeRangeFilter',
  SELECTED_FORMATS: '@shelves/selectedFormats',
  SELECTED_PAGE_RANGES: '@shelves/selectedPageRanges',
  SELECTED_TYPES: '@shelves/selectedTypes',
  SELECTED_TAGS: '@shelves/selectedTags',
  EXCLUDED_STATUSES: '@shelves/excludedStatuses',
  SORT_ORDER: '@shelves/sortOrder',
} as const;

interface ShelfContextType {
  // Shelf state
  selectedShelf: SystemShelfId;
  pinnedShelves: SystemShelfId[];

  // Filter state
  timeRangeFilter: TimeRangeFilter;
  selectedFormats: BookFormat[];
  selectedPageRanges: PageRangeFilter[];
  selectedTypes: string[];
  selectedTags: string[];
  excludedStatuses: SystemShelfId[];
  sortOrder: SortOrder;

  // Computed values
  shelfCounts: ShelfCounts;
  currentDeadlines: ReadingDeadlineWithProgress[];
  hasActiveFilters: boolean;

  // Shelf methods
  selectShelf: (shelfId: SystemShelfId) => Promise<void>;
  toggleShelfPin: (shelfId: SystemShelfId) => Promise<void>;

  // Filter methods
  setTimeRangeFilter: (filter: TimeRangeFilter) => void;
  setSelectedFormats: (formats: BookFormat[]) => void;
  setSelectedPageRanges: (ranges: PageRangeFilter[]) => void;
  setSelectedTypes: (types: string[]) => void;
  setSelectedTags: (tags: string[]) => void;
  setExcludedStatuses: (statuses: SystemShelfId[]) => void;
  setSortOrder: (order: SortOrder) => void;
  clearAllFilters: () => void;

  // Loading state
  isLoading: boolean;
}

const ShelfContext = createContext<ShelfContextType>({
  // Shelf defaults
  selectedShelf: 'active',
  pinnedShelves: DEFAULT_PINNED_SHELVES,

  // Filter defaults
  ...DEFAULT_FILTER_STATE,

  // Computed defaults
  shelfCounts: {
    all: 0,
    applied: 0,
    pending: 0,
    active: 0,
    overdue: 0,
    paused: 0,
    toReview: 0,
    completed: 0,
    didNotFinish: 0,
    rejected: 0,
    withdrew: 0,
  },
  currentDeadlines: [],
  hasActiveFilters: false,

  // Method defaults
  selectShelf: async () => {},
  toggleShelfPin: async () => {},
  setTimeRangeFilter: () => {},
  setSelectedFormats: () => {},
  setSelectedPageRanges: () => {},
  setSelectedTypes: () => {},
  setSelectedTags: () => {},
  setExcludedStatuses: () => {},
  setSortOrder: () => {},
  clearAllFilters: () => {},

  isLoading: true,
});

export default function ShelfProvider({ children }: PropsWithChildren) {
  // Shelf state
  const [selectedShelf, setSelectedShelfState] = useState<SystemShelfId>('active');
  const [pinnedShelves, setPinnedShelvesState] = useState<SystemShelfId[]>(DEFAULT_PINNED_SHELVES);

  // Filter state
  const [timeRangeFilter, setTimeRangeFilterState] = useState<TimeRangeFilter>('all');
  const [selectedFormats, setSelectedFormatsState] = useState<BookFormat[]>([]);
  const [selectedPageRanges, setSelectedPageRangesState] = useState<PageRangeFilter[]>([]);
  const [selectedTypes, setSelectedTypesState] = useState<string[]>([]);
  const [selectedTags, setSelectedTagsState] = useState<string[]>([]);
  const [excludedStatuses, setExcludedStatusesState] = useState<SystemShelfId[]>([]);
  const [sortOrder, setSortOrderState] = useState<SortOrder>('default');

  const [isLoading, setIsLoading] = useState(true);

  // Get deadline data from DeadlineProvider
  const {
    deadlines,
    activeDeadlines,
    overdueDeadlines,
    completedDeadlines,
    toReviewDeadlines,
    didNotFinishDeadlines,
    pendingDeadlines,
    pausedDeadlines,
    appliedDeadlines,
    rejectedDeadlines,
    withdrewDeadlines,
  } = useDeadlines();

  // Load persisted state on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const [
          savedShelf,
          savedPinnedShelves,
          savedTimeRange,
          savedFormats,
          savedPageRanges,
          savedTypes,
          savedTags,
          savedExcludedStatuses,
          savedSortOrder,
        ] = await Promise.all([
          AsyncStorage.getItem(SHELF_STORAGE_KEYS.SELECTED_SHELF),
          AsyncStorage.getItem(SHELF_STORAGE_KEYS.PINNED_SHELVES),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.TIME_RANGE_FILTER),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.SELECTED_FORMATS),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.SELECTED_PAGE_RANGES),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.SELECTED_TYPES),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.SELECTED_TAGS),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.EXCLUDED_STATUSES),
          AsyncStorage.getItem(FILTER_STORAGE_KEYS.SORT_ORDER),
        ]);

        if (savedShelf) {
          setSelectedShelfState(savedShelf as SystemShelfId);
        }
        if (savedPinnedShelves) {
          setPinnedShelvesState(JSON.parse(savedPinnedShelves) as SystemShelfId[]);
        }
        if (savedTimeRange) {
          setTimeRangeFilterState(savedTimeRange as TimeRangeFilter);
        }
        if (savedFormats) {
          setSelectedFormatsState(JSON.parse(savedFormats) as BookFormat[]);
        }
        if (savedPageRanges) {
          setSelectedPageRangesState(JSON.parse(savedPageRanges) as PageRangeFilter[]);
        }
        if (savedTypes) {
          setSelectedTypesState(JSON.parse(savedTypes) as string[]);
        }
        if (savedTags) {
          setSelectedTagsState(JSON.parse(savedTags) as string[]);
        }
        if (savedExcludedStatuses) {
          setExcludedStatusesState(JSON.parse(savedExcludedStatuses) as SystemShelfId[]);
        }
        if (savedSortOrder) {
          setSortOrderState(savedSortOrder as SortOrder);
        }
      } catch (error) {
        console.error('Error loading shelf state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // Compute shelf counts
  const shelfCounts = useMemo<ShelfCounts>(() => ({
    all: deadlines.length,
    applied: appliedDeadlines.length,
    pending: pendingDeadlines.length,
    active: activeDeadlines.length,
    overdue: overdueDeadlines.length,
    paused: pausedDeadlines.length,
    toReview: toReviewDeadlines.length,
    completed: completedDeadlines.length,
    didNotFinish: didNotFinishDeadlines.length,
    rejected: rejectedDeadlines.length,
    withdrew: withdrewDeadlines.length,
  }), [
    deadlines.length,
    appliedDeadlines.length,
    pendingDeadlines.length,
    activeDeadlines.length,
    overdueDeadlines.length,
    pausedDeadlines.length,
    toReviewDeadlines.length,
    completedDeadlines.length,
    didNotFinishDeadlines.length,
    rejectedDeadlines.length,
    withdrewDeadlines.length,
  ]);

  // Map shelf ID to deadline list
  const shelfDeadlineMap = useMemo<Record<SystemShelfId, ReadingDeadlineWithProgress[]>>(() => ({
    all: deadlines,
    applied: appliedDeadlines,
    pending: pendingDeadlines,
    active: activeDeadlines,
    overdue: overdueDeadlines,
    paused: pausedDeadlines,
    toReview: toReviewDeadlines,
    completed: completedDeadlines,
    didNotFinish: didNotFinishDeadlines,
    rejected: rejectedDeadlines,
    withdrew: withdrewDeadlines,
  }), [
    deadlines,
    appliedDeadlines,
    pendingDeadlines,
    activeDeadlines,
    overdueDeadlines,
    pausedDeadlines,
    toReviewDeadlines,
    completedDeadlines,
    didNotFinishDeadlines,
    rejectedDeadlines,
    withdrewDeadlines,
  ]);

  // Get deadlines for current shelf
  const currentDeadlines = useMemo(() => {
    return shelfDeadlineMap[selectedShelf] || deadlines;
  }, [shelfDeadlineMap, selectedShelf, deadlines]);

  // Check if any advanced filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      timeRangeFilter !== 'all' ||
      selectedFormats.length > 0 ||
      selectedPageRanges.length > 0 ||
      selectedTypes.length > 0 ||
      selectedTags.length > 0 ||
      excludedStatuses.length > 0 ||
      sortOrder !== 'default'
    );
  }, [
    timeRangeFilter,
    selectedFormats,
    selectedPageRanges,
    selectedTypes,
    selectedTags,
    excludedStatuses,
    sortOrder,
  ]);

  // Clear all advanced filters
  const clearAllFilters = useCallback(() => {
    setTimeRangeFilterState('all');
    setSelectedFormatsState([]);
    setSelectedPageRangesState([]);
    setSelectedTypesState([]);
    setSelectedTagsState([]);
    setExcludedStatusesState([]);
    setSortOrderState('default');
  }, []);

  // Select a shelf (clears filters)
  const selectShelf = useCallback(async (shelfId: SystemShelfId) => {
    const previousShelf = selectedShelf;

    // Clear filters first
    clearAllFilters();

    // Update state
    setSelectedShelfState(shelfId);

    // Track analytics
    analytics.track('shelf_selected', {
      shelf_id: shelfId,
      previous_shelf_id: previousShelf,
    });

    // Persist to storage
    try {
      await AsyncStorage.setItem(SHELF_STORAGE_KEYS.SELECTED_SHELF, shelfId);
    } catch (error) {
      console.error('Error saving shelf selection:', error);
    }
  }, [clearAllFilters, selectedShelf]);

  // Toggle pin state for a shelf
  const toggleShelfPin = useCallback(async (shelfId: SystemShelfId) => {
    const wasPinned = pinnedShelves.includes(shelfId);
    // Calculate new pinned state
    const newPinned = wasPinned
      ? pinnedShelves.filter((id) => id !== shelfId)
      : sortShelfIds([...pinnedShelves, shelfId]);

    // Update state first (optimistic)
    setPinnedShelvesState(newPinned);

    // Track analytics
    analytics.track('shelf_pin_toggled', {
      shelf_id: shelfId,
      is_pinned: !wasPinned,
    });

    // Persist to storage
    try {
      await AsyncStorage.setItem(
        SHELF_STORAGE_KEYS.PINNED_SHELVES,
        JSON.stringify(newPinned)
      );
    } catch (error) {
      // Rollback on error
      console.error('Error saving pinned shelves:', error);
      setPinnedShelvesState(pinnedShelves);
    }
  }, [pinnedShelves]);

  // Filter setters with persistence
  const setTimeRangeFilter = useCallback(async (filter: TimeRangeFilter) => {
    setTimeRangeFilterState(filter);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.TIME_RANGE_FILTER, filter);
    } catch (error) {
      console.error('Error saving time range filter:', error);
    }
  }, []);

  const setSelectedFormats = useCallback(async (formats: BookFormat[]) => {
    setSelectedFormatsState(formats);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.SELECTED_FORMATS, JSON.stringify(formats));
    } catch (error) {
      console.error('Error saving format filter:', error);
    }
  }, []);

  const setSelectedPageRanges = useCallback(async (ranges: PageRangeFilter[]) => {
    setSelectedPageRangesState(ranges);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.SELECTED_PAGE_RANGES, JSON.stringify(ranges));
    } catch (error) {
      console.error('Error saving page range filter:', error);
    }
  }, []);

  const setSelectedTypes = useCallback(async (types: string[]) => {
    setSelectedTypesState(types);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.SELECTED_TYPES, JSON.stringify(types));
    } catch (error) {
      console.error('Error saving type filter:', error);
    }
  }, []);

  const setSelectedTags = useCallback(async (tags: string[]) => {
    setSelectedTagsState(tags);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.SELECTED_TAGS, JSON.stringify(tags));
    } catch (error) {
      console.error('Error saving tag filter:', error);
    }
  }, []);

  const setExcludedStatuses = useCallback(async (statuses: SystemShelfId[]) => {
    setExcludedStatusesState(statuses);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.EXCLUDED_STATUSES, JSON.stringify(statuses));
    } catch (error) {
      console.error('Error saving excluded statuses:', error);
    }
  }, []);

  const setSortOrder = useCallback(async (order: SortOrder) => {
    setSortOrderState(order);
    try {
      await AsyncStorage.setItem(FILTER_STORAGE_KEYS.SORT_ORDER, order);
    } catch (error) {
      console.error('Error saving sort order:', error);
    }
  }, []);

  const value: ShelfContextType = {
    // Shelf state
    selectedShelf,
    pinnedShelves,

    // Filter state
    timeRangeFilter,
    selectedFormats,
    selectedPageRanges,
    selectedTypes,
    selectedTags,
    excludedStatuses,
    sortOrder,

    // Computed values
    shelfCounts,
    currentDeadlines,
    hasActiveFilters,

    // Shelf methods
    selectShelf,
    toggleShelfPin,

    // Filter methods
    setTimeRangeFilter,
    setSelectedFormats,
    setSelectedPageRanges,
    setSelectedTypes,
    setSelectedTags,
    setExcludedStatuses,
    setSortOrder,
    clearAllFilters,

    isLoading,
  };

  return (
    <ShelfContext.Provider value={value}>
      {children}
    </ShelfContext.Provider>
  );
}

export const useShelf = () => useContext(ShelfContext);
