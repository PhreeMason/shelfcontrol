import { CalendarFilterType } from '@/constants/activityTypes';
import { BookFormat } from '@/types/deadline.types';
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
  // View preferences
  progressInputModes: ProgressInputModePreferences;
  getProgressInputMode: (format: BookFormat) => ProgressInputMode;
  setProgressInputMode: (format: BookFormat, mode: ProgressInputMode) => void;
  metricViewModes: MetricViewModePreferences;
  getMetricViewMode: (format: BookFormat) => MetricViewMode;
  setMetricViewMode: (format: BookFormat, mode: MetricViewMode) => void;
  deadlineViewMode: DeadlineViewMode;
  setDeadlineViewMode: (mode: DeadlineViewMode) => void;

  // Calendar preferences
  excludedCalendarActivities: CalendarFilterType[];
  setExcludedCalendarActivities: (activities: CalendarFilterType[]) => void;
  hideDatesOnCovers: boolean;
  setHideDatesOnCovers: (hide: boolean) => void;
  showActivityBars: boolean;
  setShowActivityBars: (show: boolean) => void;
  showCoverOnCalendar: boolean;
  setShowCoverOnCalendar: (show: boolean) => void;

  isLoading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType>({
  // View preference defaults
  progressInputModes: DEFAULT_PROGRESS_INPUT_MODES,
  getProgressInputMode: () => 'direct',
  setProgressInputMode: () => {},
  metricViewModes: DEFAULT_METRIC_VIEW_MODES,
  getMetricViewMode: () => 'current',
  setMetricViewMode: () => {},
  deadlineViewMode: 'list',
  setDeadlineViewMode: () => {},

  // Calendar preference defaults
  excludedCalendarActivities: [],
  setExcludedCalendarActivities: () => {},
  hideDatesOnCovers: false,
  setHideDatesOnCovers: () => {},
  showActivityBars: true,
  setShowActivityBars: () => {},
  showCoverOnCalendar: false,
  setShowCoverOnCalendar: () => {},

  isLoading: true,
});

const STORAGE_KEYS = {
  PROGRESS_INPUT_MODES: '@preferences/progressInputModes',
  METRIC_VIEW_MODES: '@preferences/metricViewModes',
  DEADLINE_VIEW_MODE: '@preferences/deadlineViewMode',
  EXCLUDED_CALENDAR_ACTIVITIES: '@preferences/excludedCalendarActivities',
  HIDE_DATES_ON_COVERS: '@preferences/hideDatesOnCovers',
  SHOW_ACTIVITY_BARS: '@preferences/showActivityBars',
  SHOW_COVER_ON_CALENDAR: '@preferences/showCoverOnCalendar',
};

export default function PreferencesProvider({ children }: PropsWithChildren) {
  // View preferences
  const [progressInputModes, setProgressInputModesState] =
    useState<ProgressInputModePreferences>(DEFAULT_PROGRESS_INPUT_MODES);
  const [metricViewModes, setMetricViewModesState] =
    useState<MetricViewModePreferences>(DEFAULT_METRIC_VIEW_MODES);
  const [deadlineViewMode, setDeadlineViewModeState] =
    useState<DeadlineViewMode>('list');

  // Calendar preferences
  const [excludedCalendarActivities, setExcludedCalendarActivitiesState] =
    useState<CalendarFilterType[]>([]);
  const [hideDatesOnCovers, setHideDatesOnCoversState] = useState(false);
  const [showActivityBars, setShowActivityBarsState] = useState(true);
  const [showCoverOnCalendar, setShowCoverOnCalendarState] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const [
          savedProgressInputModes,
          savedMetricViewModes,
          savedDeadlineViewMode,
          savedExcludedCalendarActivities,
          savedHideDatesOnCovers,
          savedShowActivityBars,
          savedShowCoverOnCalendar,
        ] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.PROGRESS_INPUT_MODES),
          AsyncStorage.getItem(STORAGE_KEYS.METRIC_VIEW_MODES),
          AsyncStorage.getItem(STORAGE_KEYS.DEADLINE_VIEW_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.EXCLUDED_CALENDAR_ACTIVITIES),
          AsyncStorage.getItem(STORAGE_KEYS.HIDE_DATES_ON_COVERS),
          AsyncStorage.getItem(STORAGE_KEYS.SHOW_ACTIVITY_BARS),
          AsyncStorage.getItem(STORAGE_KEYS.SHOW_COVER_ON_CALENDAR),
        ]);

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
            JSON.parse(savedExcludedCalendarActivities) as CalendarFilterType[]
          );
        }
        if (savedHideDatesOnCovers) {
          setHideDatesOnCoversState(
            JSON.parse(savedHideDatesOnCovers) as boolean
          );
        }
        if (savedShowActivityBars) {
          setShowActivityBarsState(
            JSON.parse(savedShowActivityBars) as boolean
          );
        }
        if (savedShowCoverOnCalendar) {
          setShowCoverOnCalendarState(
            JSON.parse(savedShowCoverOnCalendar) as boolean
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

  const setExcludedCalendarActivities = async (
    activities: CalendarFilterType[]
  ) => {
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

  const setHideDatesOnCovers = async (hide: boolean) => {
    try {
      setHideDatesOnCoversState(hide);
      await AsyncStorage.setItem(
        STORAGE_KEYS.HIDE_DATES_ON_COVERS,
        JSON.stringify(hide)
      );
    } catch (error) {
      console.error('Error saving hide dates on covers preference:', error);
    }
  };

  const setShowActivityBars = async (show: boolean) => {
    try {
      setShowActivityBarsState(show);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHOW_ACTIVITY_BARS,
        JSON.stringify(show)
      );
    } catch (error) {
      console.error('Error saving show activity dots preference:', error);
    }
  };

  const setShowCoverOnCalendar = async (show: boolean) => {
    try {
      setShowCoverOnCalendarState(show);
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHOW_COVER_ON_CALENDAR,
        JSON.stringify(show)
      );
    } catch (error) {
      console.error('Error saving show cover on calendar preference:', error);
    }
  };

  const value = {
    // View preferences
    progressInputModes,
    getProgressInputMode,
    setProgressInputMode,
    metricViewModes,
    getMetricViewMode,
    setMetricViewMode,
    deadlineViewMode,
    setDeadlineViewMode,

    // Calendar preferences
    excludedCalendarActivities,
    setExcludedCalendarActivities,
    hideDatesOnCovers,
    setHideDatesOnCovers,
    showActivityBars,
    setShowActivityBars,
    showCoverOnCalendar,
    setShowCoverOnCalendar,

    isLoading,
  };

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export const usePreferences = () => useContext(PreferencesContext);
