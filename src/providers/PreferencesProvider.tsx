import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BookFormat,
  FilterType,
  PageRangeFilter,
  TimeRangeFilter,
} from '@/types/deadline.types';
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
  isLoading: true,
});

const STORAGE_KEYS = {
  SELECTED_FILTER: '@preferences/selectedFilter',
  TIME_RANGE_FILTER: '@preferences/timeRangeFilter',
  SELECTED_FORMATS: '@preferences/selectedFormats',
  SELECTED_PAGE_RANGES: '@preferences/selectedPageRanges',
  SELECTED_SOURCES: '@preferences/selectedSources',
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
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FILTER),
          AsyncStorage.getItem(STORAGE_KEYS.TIME_RANGE_FILTER),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FORMATS),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_PAGE_RANGES),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_SOURCES),
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
    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
