import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BookFormat,
  FilterType,
  PageRangeFilter,
  SortOrder,
  TimeRangeFilter,
} from '@/types/deadline.types';
import {
  DEFAULT_PROGRESS_INPUT_MODES,
  ProgressInputMode,
  ProgressInputModePreferences,
} from '@/types/progressInput.types';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface PreferencesContextType {
  selectedFilter: FilterType;
  setSelectedFilter: (filter: FilterType) => void;
  timeRangeFilter: TimeRangeFilter;
  setTimeRangeFilter: (filter: TimeRangeFilter) => void;
  selectedFormats: BookFormat[];
  setSelectedFormats: (formats: BookFormat[]) => void;
  selectedPageRanges: PageRangeFilter[];
  setSelectedPageRanges: (ranges: PageRangeFilter[]) => void;
  selectedSources: string[];
  setSelectedSources: (sources: string[]) => void;
  excludedStatuses: FilterType[];
  setExcludedStatuses: (statuses: FilterType[]) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  progressInputModes: ProgressInputModePreferences;
  getProgressInputMode: (format: BookFormat) => ProgressInputMode;
  setProgressInputMode: (format: BookFormat, mode: ProgressInputMode) => void;
  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  selectedFilter: 'active',
  setSelectedFilter: () => {},
  timeRangeFilter: 'all',
  setTimeRangeFilter: () => {},
  selectedFormats: [],
  setSelectedFormats: () => {},
  selectedPageRanges: [],
  setSelectedPageRanges: () => {},
  selectedSources: [],
  setSelectedSources: () => {},
  excludedStatuses: [],
  setExcludedStatuses: () => {},
  sortOrder: 'default',
  setSortOrder: () => {},
  progressInputModes: DEFAULT_PROGRESS_INPUT_MODES,
  getProgressInputMode: () => 'direct',
  setProgressInputMode: () => {},
  isLoading: true,
});

const STORAGE_KEYS = {
  SELECTED_FILTER: '@preferences/selectedFilter',
  TIME_RANGE_FILTER: '@preferences/timeRangeFilter',
  SELECTED_FORMATS: '@preferences/selectedFormats',
  SELECTED_PAGE_RANGES: '@preferences/selectedPageRanges',
  SELECTED_SOURCES: '@preferences/selectedSources',
  EXCLUDED_STATUSES: '@preferences/excludedStatuses',
  SORT_ORDER: '@preferences/sortOrder',
  PROGRESS_INPUT_MODES: '@preferences/progressInputModes',
};

export default function PreferencesProvider({ children }: PropsWithChildren) {
  const [selectedFilter, setSelectedFilterState] =
    useState<FilterType>('active');
  const [timeRangeFilter, setTimeRangeFilterState] =
    useState<TimeRangeFilter>('all');
  const [selectedFormats, setSelectedFormatsState] = useState<BookFormat[]>([]);
  const [selectedPageRanges, setSelectedPageRangesState] = useState<
    PageRangeFilter[]
  >([]);
  const [selectedSources, setSelectedSourcesState] = useState<string[]>([]);
  const [excludedStatuses, setExcludedStatusesState] = useState<FilterType[]>([]);
  const [sortOrder, setSortOrderState] = useState<SortOrder>('default');
  const [progressInputModes, setProgressInputModesState] =
    useState<ProgressInputModePreferences>(DEFAULT_PROGRESS_INPUT_MODES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedFilter,
          savedTimeRange,
          savedFormats,
          savedPageRanges,
          savedSources,
          savedExcludedStatuses,
          savedSortOrder,
          savedProgressInputModes,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FILTER),
          AsyncStorage.getItem(STORAGE_KEYS.TIME_RANGE_FILTER),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FORMATS),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_PAGE_RANGES),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SOURCES),
          AsyncStorage.getItem(STORAGE_KEYS.EXCLUDED_STATUSES),
          AsyncStorage.getItem(STORAGE_KEYS.SORT_ORDER),
          AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_INPUT_MODES),
        ]);

        if (savedFilter) {
          setSelectedFilterState(savedFilter as FilterType);
        }
        if (savedTimeRange) {
          setTimeRangeFilterState(savedTimeRange as TimeRangeFilter);
        }
        if (savedFormats) {
          setSelectedFormatsState(JSON.parse(savedFormats) as BookFormat[]);
        }
        if (savedPageRanges) {
          setSelectedPageRangesState(
            JSON.parse(savedPageRanges) as PageRangeFilter[]
          );
        }
        if (savedSources) {
          setSelectedSourcesState(JSON.parse(savedSources) as string[]);
        }
        if (savedExcludedStatuses) {
          setExcludedStatusesState(JSON.parse(savedExcludedStatuses) as FilterType[]);
        }
        if (savedSortOrder) {
          setSortOrderState(savedSortOrder as SortOrder);
        }
        if (savedProgressInputModes) {
          setProgressInputModesState(
            JSON.parse(savedProgressInputModes) as ProgressInputModePreferences
          );
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const setSelectedFilter = async (filter: FilterType) => {
    try {
      setSelectedFilterState(filter);
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_FILTER, filter);
    } catch (error) {
      console.error('Error saving filter preference:', error);
    }
  };

  const setTimeRangeFilter = async (filter: TimeRangeFilter) => {
    try {
      setTimeRangeFilterState(filter);
      await AsyncStorage.setItem(STORAGE_KEYS.TIME_RANGE_FILTER, filter);
    } catch (error) {
      console.error('Error saving time range filter preference:', error);
    }
  };

  const setSelectedFormats = async (formats: BookFormat[]) => {
    try {
      setSelectedFormatsState(formats);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_FORMATS,
        JSON.stringify(formats)
      );
    } catch (error) {
      console.error('Error saving format filter preference:', error);
    }
  };

  const setSelectedPageRanges = async (ranges: PageRangeFilter[]) => {
    try {
      setSelectedPageRangesState(ranges);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_PAGE_RANGES,
        JSON.stringify(ranges)
      );
    } catch (error) {
      console.error('Error saving page range filter preference:', error);
    }
  };

  const setSelectedSources = async (sources: string[]) => {
    try {
      setSelectedSourcesState(sources);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_SOURCES,
        JSON.stringify(sources)
      );
    } catch (error) {
      console.error('Error saving source filter preference:', error);
    }
  };

  const setExcludedStatuses = async (statuses: FilterType[]) => {
    try {
      setExcludedStatusesState(statuses);
      await AsyncStorage.setItem(
        STORAGE_KEYS.EXCLUDED_STATUSES,
        JSON.stringify(statuses)
      );
    } catch (error) {
      console.error('Error saving excluded statuses preference:', error);
    }
  };

  const setSortOrder = async (order: SortOrder) => {
    try {
      setSortOrderState(order);
      await AsyncStorage.setItem(STORAGE_KEYS.SORT_ORDER, order);
    } catch (error) {
      console.error('Error saving sort order preference:', error);
    }
  };

  const getProgressInputMode = (format: BookFormat): ProgressInputMode => {
    return progressInputModes[format] || 'direct';
  };

  const setProgressInputMode = async (
    format: BookFormat,
    mode: ProgressInputMode
  ) => {
    try {
      const updatedModes = { ...progressInputModes, [format]: mode };
      setProgressInputModesState(updatedModes);
      await AsyncStorage.setItem(
        STORAGE_KEYS.PROGRESS_INPUT_MODES,
        JSON.stringify(updatedModes)
      );
    } catch (error) {
      console.error('Error saving progress input mode preference:', error);
    }
  };

  const value = {
    selectedFilter,
    setSelectedFilter,
    timeRangeFilter,
    setTimeRangeFilter,
    selectedFormats,
    setSelectedFormats,
    selectedPageRanges,
    setSelectedPageRanges,
    selectedSources,
    setSelectedSources,
    excludedStatuses,
    setExcludedStatuses,
    sortOrder,
    setSortOrder,
    progressInputModes,
    getProgressInputMode,
    setProgressInputMode,
    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
