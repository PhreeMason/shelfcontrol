import { ActivityType } from '@/constants/activityTypes';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

export type DeadlineViewMode = 'list' | 'compact';
export type MetricViewMode = 'remaining' | 'current';
export type MetricViewModePreferences = Record<BookFormat, MetricViewMode>;

export const DEFAULT_METRIC_VIEW_MODES: MetricViewModePreferences = {
  physical: 'current',
  eBook: 'current',
  audio: 'current',
};

interface PreferencesContextType {
  selectedFilter: FilterType;
  setSelectedFilter: (filter: FilterType) => void;
  timeRangeFilter: TimeRangeFilter;
  setTimeRangeFilter: (filter: TimeRangeFilter) => void;
  selectedFormats: BookFormat[];
  setSelectedFormats: (formats: BookFormat[]) => void;
  selectedPageRanges: PageRangeFilter[];
  setSelectedPageRanges: (ranges: PageRangeFilter[]) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  excludedStatuses: FilterType[];
  setExcludedStatuses: (statuses: FilterType[]) => void;
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
  progressInputModes: ProgressInputModePreferences;
  getProgressInputMode: (format: BookFormat) => ProgressInputMode;
  setProgressInputMode: (format: BookFormat, mode: ProgressInputMode) => void;
  metricViewModes: MetricViewModePreferences;
  getMetricViewMode: (format: BookFormat) => MetricViewMode;
  setMetricViewMode: (format: BookFormat, mode: MetricViewMode) => void;
  deadlineViewMode: DeadlineViewMode;
  setDeadlineViewMode: (mode: DeadlineViewMode) => void;
  excludedCalendarActivities: ActivityType[];
  setExcludedCalendarActivities: (activities: ActivityType[]) => void;
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
  selectedTypes: [],
  setSelectedTypes: () => {},
  selectedTags: [],
  setSelectedTags: () => {},
  excludedStatuses: [],
  setExcludedStatuses: () => {},
  sortOrder: 'default',
  setSortOrder: () => {},
  progressInputModes: DEFAULT_PROGRESS_INPUT_MODES,
  getProgressInputMode: () => 'direct',
  setProgressInputMode: () => {},
  metricViewModes: DEFAULT_METRIC_VIEW_MODES,
  getMetricViewMode: () => 'current',
  setMetricViewMode: () => {},
  deadlineViewMode: 'list',
  setDeadlineViewMode: () => {},
  excludedCalendarActivities: [],
  setExcludedCalendarActivities: () => {},
  isLoading: true,
});

const STORAGE_KEYS = {
  SELECTED_FILTER: '@preferences/selectedFilter',
  TIME_RANGE_FILTER: '@preferences/timeRangeFilter',
  SELECTED_FORMATS: '@preferences/selectedFormats',
  SELECTED_PAGE_RANGES: '@preferences/selectedPageRanges',
  SELECTED_TYPES: '@preferences/selectedTypes',
  SELECTED_TAGS: '@preferences/selectedTags',
  EXCLUDED_STATUSES: '@preferences/excludedStatuses',
  SORT_ORDER: '@preferences/sortOrder',
  PROGRESS_INPUT_MODES: '@preferences/progressInputModes',
  METRIC_VIEW_MODES: '@preferences/metricViewModes',
  DEADLINE_VIEW_MODE: '@preferences/deadlineViewMode',
  EXCLUDED_CALENDAR_ACTIVITIES: '@preferences/excludedCalendarActivities',
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
  const [selectedTypes, setSelectedTypesState] = useState<string[]>([]);
  const [selectedTags, setSelectedTagsState] = useState<string[]>([]);
  const [excludedStatuses, setExcludedStatusesState] = useState<FilterType[]>(
    []
  );
  const [sortOrder, setSortOrderState] = useState<SortOrder>('default');
  const [progressInputModes, setProgressInputModesState] =
    useState<ProgressInputModePreferences>(DEFAULT_PROGRESS_INPUT_MODES);
  const [metricViewModes, setMetricViewModesState] =
    useState<MetricViewModePreferences>(DEFAULT_METRIC_VIEW_MODES);
  const [deadlineViewMode, setDeadlineViewModeState] =
    useState<DeadlineViewMode>('list');
  const [excludedCalendarActivities, setExcludedCalendarActivitiesState] =
    useState<ActivityType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedFilter,
          savedTimeRange,
          savedFormats,
          savedPageRanges,
          savedTypes,
          savedTags,
          savedExcludedStatuses,
          savedSortOrder,
          savedProgressInputModes,
          savedMetricViewModes,
          savedDeadlineViewMode,
          savedExcludedCalendarActivities,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FILTER),
          AsyncStorage.getItem(STORAGE_KEYS.TIME_RANGE_FILTER),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_FORMATS),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_PAGE_RANGES),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_TYPES),
          AsyncStorage.getItem(STORAGE_KEYS.SELECTED_TAGS),
          AsyncStorage.getItem(STORAGE_KEYS.EXCLUDED_STATUSES),
          AsyncStorage.getItem(STORAGE_KEYS.SORT_ORDER),
          AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_INPUT_MODES),
          AsyncStorage.getItem(STORAGE_KEYS.METRIC_VIEW_MODES),
          AsyncStorage.getItem(STORAGE_KEYS.DEADLINE_VIEW_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.EXCLUDED_CALENDAR_ACTIVITIES),
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
        if (savedTypes) {
          setSelectedTypesState(JSON.parse(savedTypes) as string[]);
        }
        if (savedTags) {
          setSelectedTagsState(JSON.parse(savedTags) as string[]);
        }
        if (savedExcludedStatuses) {
          setExcludedStatusesState(
            JSON.parse(savedExcludedStatuses) as FilterType[]
          );
        }
        if (savedSortOrder) {
          setSortOrderState(savedSortOrder as SortOrder);
        }
        if (savedProgressInputModes) {
          setProgressInputModesState(
            JSON.parse(savedProgressInputModes) as ProgressInputModePreferences
          );
        }
        if (savedMetricViewModes) {
          setMetricViewModesState(
            JSON.parse(savedMetricViewModes) as MetricViewModePreferences
          );
        }
        if (savedDeadlineViewMode) {
          setDeadlineViewModeState(savedDeadlineViewMode as DeadlineViewMode);
        }
        if (savedExcludedCalendarActivities) {
          setExcludedCalendarActivitiesState(
            JSON.parse(savedExcludedCalendarActivities) as ActivityType[]
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
      console.error('Error saving due date filter preference:', error);
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

  const setSelectedTypes = async (types: string[]) => {
    try {
      setSelectedTypesState(types);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_TYPES,
        JSON.stringify(types)
      );
    } catch (error) {
      console.error('Error saving type filter preference:', error);
    }
  };

  const setSelectedTags = async (tags: string[]) => {
    try {
      setSelectedTagsState(tags);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SELECTED_TAGS,
        JSON.stringify(tags)
      );
    } catch (error) {
      console.error('Error saving tag filter preference:', error);
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

  const getMetricViewMode = (format: BookFormat): MetricViewMode => {
    return metricViewModes[format] || 'current';
  };

  const setMetricViewMode = async (
    format: BookFormat,
    mode: MetricViewMode
  ) => {
    try {
      const updatedModes = { ...metricViewModes, [format]: mode };
      setMetricViewModesState(updatedModes);
      await AsyncStorage.setItem(
        STORAGE_KEYS.METRIC_VIEW_MODES,
        JSON.stringify(updatedModes)
      );
    } catch (error) {
      console.error('Error saving metric view mode preference:', error);
    }
  };

  const setDeadlineViewMode = async (mode: DeadlineViewMode) => {
    try {
      setDeadlineViewModeState(mode);
      await AsyncStorage.setItem(STORAGE_KEYS.DEADLINE_VIEW_MODE, mode);
    } catch (error) {
      console.error('Error saving deadline view mode preference:', error);
    }
  };

  const setExcludedCalendarActivities = async (activities: ActivityType[]) => {
    try {
      setExcludedCalendarActivitiesState(activities);
      await AsyncStorage.setItem(
        STORAGE_KEYS.EXCLUDED_CALENDAR_ACTIVITIES,
        JSON.stringify(activities)
      );
    } catch (error) {
      console.error('Error saving calendar filter preference:', error);
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
    selectedTypes,
    setSelectedTypes,
    selectedTags,
    setSelectedTags,
    excludedStatuses,
    setExcludedStatuses,
    sortOrder,
    setSortOrder,
    progressInputModes,
    getProgressInputMode,
    setProgressInputMode,
    metricViewModes,
    getMetricViewMode,
    setMetricViewMode,
    deadlineViewMode,
    setDeadlineViewMode,
    excludedCalendarActivities,
    setExcludedCalendarActivities,
    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
